import { prisma } from '@/lib/db/server';

export interface BusinessMetrics {
  leads: {
    total: number;
    byStatus: Record<string, number>;
    conversionRate: number;
    avgTimeToConvert: number;
  };
  deals: {
    total: number;
    totalValue: number;
    byStage: Record<string, { count: number; value: number }>;
    avgDealSize: number;
    winRate: number;
    avgTimeToClose: number;
  };
  pipeline: {
    velocity: number; // value per day
    coverage: number; // pipeline vs quota
    weightedValue: number;
  };
  activity: {
    tasksCompleted: number;
    tasksOverdue: number;
    contactsEngaged: number;
  };
  trends: {
    leadsOverTime: { date: string; count: number }[];
    dealsOverTime: { date: string; count: number; value: number }[];
    revenueOverTime: { date: string; value: number }[];
  };
}

// Type-safe Prisma model access
function hasModel(client: any, model: string): boolean {
  return model in client && typeof client[model].findMany === 'function';
}

export async function getBusinessMetrics(tenantId: string, options?: { 
  from?: Date; 
  to?: Date;
  projectId?: string;
}): Promise<BusinessMetrics> {
  const where: Record<string, unknown> = { tenantId };
  if (options?.projectId) where.projectId = options.projectId;
  if (options?.from || options?.to) {
    where.createdAt = {};
    if (options.from) (where.createdAt as Record<string, unknown>).gte = options.from;
    if (options.to) (where.createdAt as Record<string, unknown>).lte = options.to;
  }

  // Check if CRM models exist
  const hasLead = hasModel(prisma, 'lead');
  const hasDeal = hasModel(prisma, 'deal');
  const hasTask = hasModel(prisma, 'task');
  const hasContact = hasModel(prisma, 'contact');

  // Fetch data only if models exist
  let leads: any[] = [];
  let deals: any[] = [];
  let tasks: any[] = [];
  let contacts: any[] = [];

  if (hasLead) {
    try {
      leads = await (prisma as any).lead.findMany({ 
        where, 
        include: { deals: true, contacts: true } 
      });
    } catch { leads = []; }
  }

  if (hasDeal) {
    try {
      deals = await (prisma as any).deal.findMany({ 
        where: { tenantId }, 
        include: { lead: true, tasks: true } 
      });
    } catch { deals = []; }
  }

  if (hasTask) {
    try {
      tasks = await (prisma as any).task.findMany({ where: { tenantId } });
    } catch { tasks = []; }
  }

  if (hasContact) {
    try {
      contacts = await (prisma as any).contact.findMany({ where: { tenantId } });
    } catch { contacts = []; }
  }

  // --- LEADS METRICS ---
  const totalLeads = leads.length;
  const leadsByStatus: Record<string, number> = {};
  leads.forEach(lead => {
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
  });

  const convertedLeads = leads.filter((l: any) => l.status === 'CONVERTED').length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  const convertedWithDates = leads.filter((l: any) => l.status === 'CONVERTED' && l.createdAt);
  const avgTimeToConvert = convertedWithDates.length > 0
    ? convertedWithDates.reduce((sum: number, l: any) => sum + (new Date().getTime() - new Date(l.createdAt).getTime()), 0) / convertedWithDates.length / (1000 * 60 * 60 * 24)
    : 0;

  // --- DEALS METRICS ---
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
  const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

  const dealsByStage: Record<string, { count: number; value: number }> = {};
  deals.forEach((deal: any) => {
    if (!dealsByStage[deal.stage]) dealsByStage[deal.stage] = { count: 0, value: 0 };
    dealsByStage[deal.stage].count++;
    dealsByStage[deal.stage].value += deal.value || 0;
  });

  const wonDeals = deals.filter((d: any) => d.stage === 'CLOSED_WON').length;
  const lostDeals = deals.filter((d: any) => d.stage === 'CLOSED_LOST').length;
  const closedDeals = wonDeals + lostDeals;
  const winRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0;

  const closedWithDates = deals.filter((d: any) => 
    (d.stage === 'CLOSED_WON' || d.stage === 'CLOSED_LOST') && d.createdAt
  );
  const avgTimeToClose = closedWithDates.length > 0
    ? closedWithDates.reduce((sum: number, d: any) => sum + (new Date().getTime() - new Date(d.createdAt).getTime()), 0) / closedWithDates.length / (1000 * 60 * 60 * 24)
    : 0;

  // --- PIPELINE METRICS ---
  const openDeals = deals.filter((d: any) => 
    d.stage === 'PROSPECT' || d.stage === 'QUOTE' || d.stage === 'NEGOTIATION'
  );
  const pipelineValue = openDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
  
  const stageProbability: Record<string, number> = {
    PROSPECT: 0.1,
    QUOTE: 0.3,
    NEGOTIATION: 0.6,
    CLOSED_WON: 1.0,
    CLOSED_LOST: 0.0,
  };
  const weightedValue = openDeals.reduce((sum: number, d: any) => {
    return sum + (d.value || 0) * (stageProbability[d.stage] || 0);
  }, 0);

  const pipelineVelocity = pipelineValue / Math.max(avgTimeToClose || 30, 1);

  // --- ACTIVITY METRICS ---
  const tasksCompleted = tasks.filter((t: any) => t.status === 'DONE').length;
  const tasksOverdue = tasks.filter((t: any) => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
  ).length;
  
  const contactsEngaged = contacts.filter((c: any) => 
    c.updatedAt && new Date(c.updatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  // --- TRENDS (last 30 days) ---
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const leadsOverTime = await getTimeSeriesData(leads, thirtyDaysAgo, 'day');
  const dealsOverTime = await getTimeSeriesData(deals, thirtyDaysAgo, 'day', true);
  const revenueOverTime = await getRevenueTimeSeries(deals, thirtyDaysAgo, 'day');

  return {
    leads: {
      total: totalLeads,
      byStatus: leadsByStatus,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgTimeToConvert: Math.round(avgTimeToConvert * 100) / 100,
    },
    deals: {
      total: totalDeals,
      totalValue,
      byStage: dealsByStage,
      avgDealSize: Math.round(avgDealSize * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      avgTimeToClose: Math.round(avgTimeToClose * 100) / 100,
    },
    pipeline: {
      velocity: Math.round(pipelineVelocity * 100) / 100,
      coverage: 0,
      weightedValue: Math.round(weightedValue * 100) / 100,
    },
    activity: {
      tasksCompleted,
      tasksOverdue,
      contactsEngaged,
    },
    trends: {
      leadsOverTime,
      dealsOverTime,
      revenueOverTime,
    },
  };
}

async function getTimeSeriesData(
  items: any[], 
  from: Date, 
  interval: 'day' | 'week' | 'month',
  includeValue = false
) {
  const buckets: Record<string, { count: number; value: number }> = {};
  
  items.forEach(item => {
    const date = new Date(item.createdAt);
    if (date < from) return;
    
    let key: string;
    if (interval === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (interval === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!buckets[key]) buckets[key] = { count: 0, value: 0 };
    buckets[key].count++;
    if (includeValue && 'value' in item) {
      buckets[key].value += (item as any).value || 0;
    }
  });

  return Object.entries(buckets)
    .map(([date, data]) => ({ date, count: data.count, value: data.value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getRevenueTimeSeries(
  deals: any[],
  from: Date,
  interval: 'day' | 'week' | 'month'
) {
  const wonDeals = deals.filter((d: any) => d.stage === 'CLOSED_WON' && d.createdAt && new Date(d.createdAt) >= from);
  return getTimeSeriesData(wonDeals, from, interval, true);
}

export async function getLeadFunnel(tenantId: string, options?: { from?: Date; to?: Date }) {
  const where: Record<string, unknown> = { tenantId };
  if (options?.from || options?.to) {
    where.createdAt = {};
    if (options.from) (where.createdAt as Record<string, unknown>).gte = options.from;
    if (options.to) (where.createdAt as Record<string, unknown>).lte = options.to;
  }

  let leads: any[] = [];
  const hasLead = hasModel(prisma, 'lead');
  if (hasLead) {
    try {
      leads = await (prisma as any).lead.findMany({ where, include: { deals: true } });
    } catch { leads = []; }
  }
  
  const funnel = {
    new: leads.filter((l: any) => l.status === 'NEW').length,
    contacted: leads.filter((l: any) => l.status === 'CONTACTED').length,
    qualified: leads.filter((l: any) => l.status === 'QUALIFIED').length,
    converted: leads.filter((l: any) => l.status === 'CONVERTED').length,
    unqualified: leads.filter((l: any) => l.status === 'UNQUALIFIED').length,
    totalDeals: leads.reduce((sum: number, l: any) => sum + (l.deals?.length || 0), 0),
    wonDeals: leads.reduce((sum: number, l: any) => sum + (l.deals?.filter((d: any) => d.stage === 'CLOSED_WON').length || 0), 0),
    lostDeals: leads.reduce((sum: number, l: any) => sum + (l.deals?.filter((d: any) => d.stage === 'CLOSED_LOST').length || 0), 0),
  };

  return funnel;
}

export async function getTopPerformers(tenantId: string, limit = 10) {
  const hasDeal = hasModel(prisma, 'deal');
  
  if (!hasDeal) {
    // Return empty array if no deal model
    return [];
  }

  try {
    const users = await prisma.user.findMany({ 
      where: { tenantId, role: { in: ['USER', 'ADMIN'] } },
      include: { 
        deals: { where: { stage: 'CLOSED_WON' } },
      }
    });

    return users
      .map((u: any) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        dealsWon: u.deals?.length || 0,
        totalValue: u.deals?.reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0,
      }))
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getRevenueForecast(tenantId: string, months = 3) {
  const hasDeal = hasModel(prisma, 'deal');
  
  if (!hasDeal) {
    return [];
  }

  try {
    const deals = await (prisma as any).deal.findMany({ 
      where: { tenantId },
      include: { lead: true }
    });

    const openDeals = deals.filter((d: any) => 
      d.stage === 'PROSPECT' || d.stage === 'QUOTE' || d.stage === 'NEGOTIATION'
    );

    const stageProbability: Record<string, number> = {
      PROSPECT: 0.1,
      QUOTE: 0.3,
      NEGOTIATION: 0.6,
    };

    const forecast: { month: string; expected: number; bestCase: number; worstCase: number }[] = [];
    
    for (let i = 0; i < months; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() + i);
      monthStart.setDate(1);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthDeals = openDeals.filter((d: any) => {
        if (!d.closeDate) return false;
        const close = new Date(d.closeDate);
        return close >= monthStart && close < monthEnd;
      });

      const expected = monthDeals.reduce((sum: number, d: any) => sum + (d.value || 0) * (stageProbability[d.stage] || 0), 0);
      const bestCase = monthDeals.reduce((sum: number, d: any) => sum + (d.value || 0) * 0.8, 0);
      const worstCase = monthDeals.reduce((sum: number, d: any) => sum + (d.value || 0) * 0.1, 0);

      forecast.push({
        month: monthStart.toISOString().split('T')[0],
        expected: Math.round(expected),
        bestCase: Math.round(bestCase),
        worstCase: Math.round(worstCase),
      });
    }

    return forecast;
  } catch {
    return [];
  }
}