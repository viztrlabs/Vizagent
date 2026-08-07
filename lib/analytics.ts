import { supabaseAdmin } from '@/lib/supabase/admin';

export type DateRange = '7d' | '30d' | '90d' | 'all';

export interface StatsData {
  totalProjects: number;
  activeTours: number;
  totalViews: number;
  revenue: number;
}

export interface ViewsOverTimeData {
  date: string;
  views: number;
}

export interface ProjectsByServiceData {
  service_type: string;
  count: number;
}

export interface ProjectStatusData {
  status: string;
  count: number;
}

function getDateFilter(range: DateRange): string {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case 'all':
    default:
      return '1970-01-01T00:00:00.000Z';
  }
}

export async function getStats(range: DateRange): Promise<StatsData> {
  const dateFilter = getDateFilter(range);
  
  const [
    { count: totalProjects },
    { count: activeTours },
    { data: sessions },
    { data: projects }
  ] = await Promise.all([
    supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateFilter),
    supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['published', 'qa_passed'])
      .gte('created_at', dateFilter),
    supabaseAdmin
      .from('configurator_sessions')
      .select('id')
      .gte('created_at', dateFilter),
    supabaseAdmin
      .from('projects')
      .select('budget')
      .gte('created_at', dateFilter)
  ]);

  const totalViews = sessions?.length || 0;
  const revenue = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;

  return {
    totalProjects: totalProjects || 0,
    activeTours: activeTours || 0,
    totalViews,
    revenue
  };
}

export async function getViewsOverTime(range: DateRange): Promise<ViewsOverTimeData[]> {
  const dateFilter = getDateFilter(range);
  
  const { data: sessions } = await supabaseAdmin
    .from('configurator_sessions')
    .select('created_at')
    .gte('created_at', dateFilter)
    .order('created_at', { ascending: true });

  if (!sessions?.length) return [];

  const now = new Date();
  const startDate = new Date(dateFilter);
  const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const maxDays = Math.min(daysDiff, 30);

  const dailyViews: Record<string, number> = {};
  
  for (let i = maxDays - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    dailyViews[key] = 0;
  }

  sessions.forEach(session => {
    const date = new Date(session.created_at).toISOString().split('T')[0];
    if (dailyViews.hasOwnProperty(date)) {
      dailyViews[date]++;
    }
  });

  return Object.entries(dailyViews).map(([date, views]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views
  }));
}

export async function getProjectsByService(range: DateRange): Promise<ProjectsByServiceData[]> {
  const dateFilter = getDateFilter(range);
  
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('service_type')
    .gte('created_at', dateFilter);

  if (!projects?.length) return [];

  const serviceCounts: Record<string, number> = {};
  projects.forEach(p => {
    serviceCounts[p.service_type] = (serviceCounts[p.service_type] || 0) + 1;
  });

  return Object.entries(serviceCounts).map(([service_type, count]) => ({
    service_type: service_type.charAt(0).toUpperCase() + service_type.slice(1),
    count
  }));
}

export async function getProjectStatusDistribution(range: DateRange): Promise<ProjectStatusData[]> {
  const dateFilter = getDateFilter(range);
  
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('status')
    .gte('created_at', dateFilter);

  if (!projects?.length) return [];

  const statusCounts: Record<string, number> = {};
  projects.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    count
  }));
}

export async function getDashboardData(range: DateRange) {
  const [stats, viewsOverTime, projectsByService, projectStatus] = await Promise.all([
    getStats(range),
    getViewsOverTime(range),
    getProjectsByService(range),
    getProjectStatusDistribution(range)
  ]);

  return {
    stats,
    viewsOverTime,
    projectsByService,
    projectStatus
  };
}