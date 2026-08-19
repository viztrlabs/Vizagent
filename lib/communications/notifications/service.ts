// M16: Notification Service - orchestrates multi-channel delivery
import { prisma } from '@/lib/db/server';
import { NotificationPayload, NotificationPreferences, NotificationChannel, NotificationCategory, NotificationPriority } from './types';
import { getProvider, getAvailableChannels } from './providers';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface PrismaNotificationPrefs {
  userId: string;
  email: boolean;
  inApp: boolean;
  telegram: boolean;
  discord: boolean;
  whatsapp: boolean;
  push: boolean;
  categories: Record<NotificationCategory, { enabled: boolean; channels: NotificationChannel[] }>;
  updatedAt: Date;
}

function toNotificationPrefs(p: Record<string, unknown>): NotificationPreferences {
  return {
    userId: p.userId as string,
    email: p.email as boolean,
    inApp: p.inApp as boolean,
    telegram: p.telegram as boolean,
    discord: p.discord as boolean,
    whatsapp: p.whatsapp as boolean,
    push: p.push as boolean,
    categories: p.categories as Record<NotificationCategory, { enabled: boolean; channels: NotificationChannel[] }>,
  };
}

export async function createNotification(payload: NotificationPayload): Promise<{ id: string }> {
  const id = generateId();
  await prisma.notification.create({
    data: {
      id,
      userId: payload.userId,
      tenantId: payload.tenantId,
      category: payload.category,
      title: payload.title,
      body: payload.body,
      priority: payload.priority || 'normal',
      channels: payload.channels || ['in_app', 'email'],
      data: payload.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      actionUrl: payload.actionUrl,
      actionText: payload.actionText,
      status: 'pending',
      createdAt: new Date(),
    },
  });

  // Deliver async
  deliverNotification(id).catch(console.error);

  return { id };
}

async function deliverNotification(notificationId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) return;

  const userPrefs = await getUserPreferences(notification.userId);
  const enabledChannels = getEnabledChannels(notification, userPrefs);

  const results = await Promise.all(
    enabledChannels.map(async (channel) => {
      const provider = getProvider(channel);
      const channelConfig = await getChannelConfig(notification.tenantId, channel);

      if (!provider.validateConfig(channelConfig)) {
        return { channel, success: false, error: 'Channel not configured' };
      }

      const payload: NotificationPayload = {
        userId: notification.userId,
        tenantId: notification.tenantId,
        category: notification.category as NotificationCategory,
        title: notification.title,
        body: notification.body,
        priority: notification.priority as NotificationPriority | undefined,
        data: notification.data as Record<string, unknown> | undefined,
        actionUrl: notification.actionUrl ?? undefined,
        actionText: notification.actionText ?? undefined,
      };

      const result = await provider.send(payload, channelConfig);
      await prisma.notificationDelivery.create({
        data: {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          notificationId,
          channel,
          status: result.success ? 'sent' : 'failed',
          messageId: result.messageId,
          error: result.error,
          sentAt: new Date(),
        },
      });

      return { channel, ...result };
    })
  );

  const allFailed = results.every(r => !r.success);
  await prisma.notification.update({
    where: { id: notificationId },
    data: { status: allFailed ? 'failed' : 'sent' },
  });
}

function getEnabledChannels(notification: { category: string; channels?: string[] }, prefs: NotificationPreferences): NotificationChannel[] {
  const categoryPrefs = prefs.categories[notification.category as keyof typeof prefs.categories];
  if (categoryPrefs?.enabled === false) return [];
  if (categoryPrefs?.channels) return categoryPrefs.channels as NotificationChannel[];
  return (notification.channels as NotificationChannel[]) || ['in_app', 'email'];
}

export async function getUserPreferences(userId: string): Promise<NotificationPreferences> {
  const prefs = await prisma.notificationPreferences.findUnique({ where: { userId } });
  if (prefs) return toNotificationPrefs(prefs);

// Default preferences
  const categories: Record<NotificationCategory, { enabled: boolean; channels: NotificationChannel[] }> = {
    project_uploaded: { enabled: true, channels: ['in_app', 'email'] },
    qa_finished: { enabled: true, channels: ['in_app', 'email'] },
    project_published: { enabled: true, channels: ['in_app', 'email'] },
    invoice_issued: { enabled: true, channels: ['in_app', 'email'] },
    subscription_changed: { enabled: true, channels: ['in_app', 'email'] },
    payment_failed: { enabled: true, channels: ['in_app', 'email', 'push'] },
    welcome: { enabled: true, channels: ['in_app', 'email'] },
    system_alert: { enabled: true, channels: ['in_app', 'email', 'push'] },
    support_reply: { enabled: true, channels: ['in_app', 'email'] },
  };

  return {
    userId,
    email: true,
    inApp: true,
    telegram: false,
    discord: false,
    whatsapp: false,
    push: false,
    categories,
  };
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const prefs = await prisma.notificationPreferences.upsert({
    where: { userId },
    create: { userId, ...updates },
    update: updates,
  });
  return toNotificationPrefs(prefs as Record<string, unknown>);
}

export async function getChannelConfig(tenantId: string, channel: string): Promise<{ enabled: boolean; config: Record<string, string> }> {
  const config = await prisma.notificationChannelConfig.findFirst({
    where: { tenantId, channel },
  });
  return config ? { enabled: config.enabled, config: config.config as Record<string, string> } : { enabled: false, config: {} };
}

export async function setChannelConfig(
  tenantId: string,
  channel: string,
  config: Record<string, string>,
  enabled = true
): Promise<void> {
  await prisma.notificationChannelConfig.upsert({
    where: { tenantId },
    create: { tenantId, channel, config, enabled },
    update: { channel, config, enabled },
  });
}

export async function getNotificationHistory(
  userId: string,
  options?: { limit?: number; offset?: number; category?: string }
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = { userId };
  if (options?.category) where.category = options.category;

  return prisma.notification.findMany({
    where,
    include: { deliveries: true },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null, status: 'sent' },
  });
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}