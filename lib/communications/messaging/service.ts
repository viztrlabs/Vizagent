// M16: In-App Messaging Service
import { prisma } from '@/lib/db/server';
import {
  Message,
  Conversation,
  CreateConversationParams,
  SendMessageParams,
} from './types';

type PrismaConversation = {
  id: string;
  type: string;
  title: string | null;
  projectId: string | null;
  participantIds: string[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  messageType: string;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toConversation(c: PrismaConversation & { unreadCount?: number }): Conversation {
  return {
    id: c.id,
    type: c.type as Conversation['type'],
    title: c.title ?? undefined,
    projectId: c.projectId ?? undefined,
    participantIds: c.participantIds,
    lastMessageAt: c.lastMessageAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    unreadCount: c.unreadCount,
  };
}

function toMessage(m: PrismaMessage): Message {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderType: m.senderType as Message['senderType'],
    content: m.content,
    messageType: m.messageType as Message['messageType'],
    metadata: m.metadata as Record<string, unknown> | undefined,
    readAt: m.readAt?.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

export async function createConversation(
  params: CreateConversationParams
): Promise<Conversation> {
  const now = new Date().toISOString();
  const conversation = {
    id: generateId(),
    type: params.type,
    title: params.title,
    projectId: params.projectId,
    participantIds: params.participantIds,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const created = await prisma.conversation.create({ data: conversation });

  if (params.initialMessage) {
    await sendMessage({
      conversationId: created.id,
      senderId: params.participantIds[0],
      senderType: 'user',
      content: params.initialMessage,
    });
  }

  return toConversation(created);
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  return conv ? toConversation(conv) : null;
}

export async function getConversationsForUser(
  userId: string,
  options?: { limit?: number; offset?: number; type?: Conversation['type'] }
): Promise<Conversation[]> {
  const where: Record<string, unknown> = {
    participantIds: { has: userId },
  };
  if (options?.type) where.type = options.type;

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  // Add unread counts
  const withUnread = await Promise.all(
    conversations.map(async (c) => {
      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          readAt: null,
        },
      });
      return { ...toConversation(c), unreadCount: unread };
    })
  );

  return withUnread;
}

export async function sendMessage(params: SendMessageParams): Promise<Message> {
  const now = new Date();
  const message = {
    id: generateId(),
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderType: params.senderType,
    content: params.content,
    messageType: params.messageType || 'text',
    metadata: params.metadata as Record<string, unknown> | null,
    createdAt: now,
    updatedAt: now,
  } as const;

  const created = await prisma.message.create({ data: message as any }); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Update conversation lastMessageAt
  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: now, updatedAt: now },
  });

  return toMessage(created);
}

export async function getMessages(
  conversationId: string,
  options?: { limit?: number; offset?: number; before?: string }
): Promise<Message[]> {
  const where: Record<string, unknown> = { conversationId };
  if (options?.before) where.createdAt = { lt: new Date(options.before) };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  return messages.map(toMessage);
}

export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const conversations = await prisma.conversation.findMany({
    where: { participantIds: { has: userId } },
    select: { id: true },
  });

  const total = await prisma.message.count({
    where: {
      conversationId: { in: conversations.map(c => c.id) },
      senderId: { not: userId },
      readAt: null,
    },
  });

  return total;
}

export async function addParticipant(conversationId: string, userId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { participantIds: { push: userId }, updatedAt: new Date() },
  });
}

export async function removeParticipant(conversationId: string, userId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { participantIds: { set: [] }, updatedAt: new Date() },
  });
}