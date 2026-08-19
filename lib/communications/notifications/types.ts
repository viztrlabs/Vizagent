// M16: Multi-Channel Notifications Types
export type NotificationChannel = 'email' | 'in_app' | 'telegram' | 'discord' | 'whatsapp' | 'push';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory =
  | 'project_uploaded'
  | 'qa_finished'
  | 'project_published'
  | 'invoice_issued'
  | 'subscription_changed'
  | 'payment_failed'
  | 'welcome'
  | 'system_alert'
  | 'support_reply';

export interface NotificationPayload {
  userId: string;
  tenantId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  data?: Record<string, unknown>;
  actionUrl?: string;
  actionText?: string;
}

export interface ChannelConfig {
  enabled: boolean;
  config: Record<string, string>;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  inApp: boolean;
  telegram: boolean;
  discord: boolean;
  whatsapp: boolean;
  push: boolean;
  categories: Record<NotificationCategory, { enabled: boolean; channels: NotificationChannel[] }>;
}