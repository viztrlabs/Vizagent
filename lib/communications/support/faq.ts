// M16: Support FAQ Generation
import { prisma } from '@/lib/db/server';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  viewCount: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  tenantId: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'ai';
  content: string;
  createdAt: string;
}

const FAQ_CATEGORIES = [
  'getting_started',
  'billing',
  'projects',
  'assets',
  'publishing',
  'integrations',
  'account',
  'troubleshooting',
];

const SEED_FAQS: Omit<FAQItem, 'id' | 'viewCount' | 'helpfulCount' | 'createdAt' | 'updatedAt'>[] = [
  {
    question: 'How do I create my first project?',
    answer: 'Click "New Project" on the dashboard, give it a name, and start uploading your 3D assets. Supported formats: GLB, GLTF, OBJ, FBX.',
    category: 'getting_started',
    tags: ['project', 'create', 'first'],
  },
  {
    question: 'What file formats are supported?',
    answer: 'We support GLB/GLTF (recommended), OBJ, FBX, and USDZ. Maximum file size: 500MB per asset.',
    category: 'assets',
    tags: ['formats', 'upload', 'files'],
  },
  {
    question: 'How do I publish my project?',
    answer: 'Once your project passes QA, click "Publish" in the project settings. You\'ll get a shareable URL instantly.',
    category: 'publishing',
    tags: ['publish', 'share', 'url'],
  },
  {
    question: 'How does billing work?',
    answer: 'Plans are billed monthly or annually (20% discount). You can upgrade/downgrade anytime with prorated charges.',
    category: 'billing',
    tags: ['pricing', 'subscription', 'payment'],
  },
  {
    question: 'Can I use my own domain?',
    answer: 'Yes, Enterprise plans support custom domains. Configure DNS in project settings.',
    category: 'integrations',
    tags: ['domain', 'custom', 'white-label'],
  },
];

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type PrismaFAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function toFAQItem(f: PrismaFAQItem): FAQItem {
  return {
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    tags: f.tags,
    viewCount: f.viewCount,
    helpfulCount: f.helpfulCount,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export async function initializeFAQs(tenantId: string): Promise<void> {
  for (const faq of SEED_FAQS) {
    await prisma.fAQItem.upsert({
      where: { tenantId_question: { tenantId, question: faq.question } },
      create: { ...faq, tenantId, viewCount: 0, helpfulCount: 0, createdAt: new Date(), updatedAt: new Date() },
      update: {},
    });
  }
}

export async function searchFAQs(query: string, tenantId: string, limit = 10): Promise<FAQItem[]> {
  const results = await prisma.fAQItem.findMany({
    where: {
      tenantId,
      OR: [
        { question: { contains: query, mode: 'insensitive' } },
        { answer: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    },
    orderBy: { helpfulCount: 'desc' },
    take: limit,
  });
  return results.map(toFAQItem);
}

export async function generateFAQFromTickets(
  tenantId: string,
  minFrequency = 3
): Promise<{ question: string; answer: string; category: string }[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: { tenantId, status: 'resolved' },
    include: { messages: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Group similar questions
  const questionCounts = new Map<string, { count: number; answers: string[]; category: string }>();
  for (const ticket of tickets) {
    const key = ticket.subject.toLowerCase().trim();
    const existing = questionCounts.get(key) || { count: 0, answers: [], category: ticket.category };
    existing.count++;
    const userMsgs = ticket.messages.filter(m => m.senderType === 'user');
    if (userMsgs.length > 0) existing.answers.push(userMsgs[0].content);
    questionCounts.set(key, existing);
  }

  const suggestions = Array.from(questionCounts.entries())
    .filter(([, v]) => v.count >= minFrequency)
    .map(([question, v]) => ({
      question: question.charAt(0).toUpperCase() + question.slice(1).replace(/\?$/, ''),
      answer: v.answers[0] || 'Contact support for details.',
      category: v.category,
    }))
    .slice(0, 20);

  return suggestions;
}

export async function createSupportTicket(
  userId: string,
  tenantId: string,
  subject: string,
  message: string,
  category = 'general',
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
): Promise<SupportTicket> {
  const now = new Date();
  const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  
  const ticket = await prisma.supportTicket.create({
    data: {
      id: ticketId,
      userId,
      tenantId,
      subject,
      status: 'open',
      priority,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: {
        create: {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          senderId: userId,
          senderType: 'user',
          content: message,
          createdAt: new Date(),
        },
      },
    },
    include: { messages: true },
  });

  return {
    id: ticket.id,
    userId: ticket.userId,
    tenantId: ticket.tenantId,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    messages: ticket.messages.map(m => ({
      id: m.id,
      ticketId: m.ticketId,
      senderId: m.senderId,
      senderType: m.senderType as 'user' | 'agent' | 'ai',
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString(),
  };
}