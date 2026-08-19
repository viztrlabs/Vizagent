// M16: Notification Channel Providers
import { NotificationChannel, NotificationPayload, ChannelConfig } from './types';
import { EmailTemplateId } from '../email/types';

export interface NotificationProvider {
  channel: NotificationChannel;
  send(payload: NotificationPayload, config: ChannelConfig): Promise<{ success: boolean; messageId?: string; error?: string }>;
  validateConfig(config: ChannelConfig): boolean;
}

class TelegramProvider implements NotificationProvider {
  channel = 'telegram' as NotificationChannel;

  validateConfig(config: ChannelConfig): boolean {
    return !!config.config.botToken && !!config.config.chatId;
  }

  async send(payload: NotificationPayload, config: ChannelConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { botToken, chatId } = config.config;
    if (!botToken || !chatId) return { success: false, error: 'Telegram not configured' };

    try {
      const message = `*${payload.title}*\n\n${payload.body}${payload.actionUrl ? `\n\n[${payload.actionText || 'View'}](${payload.actionUrl})` : ''}`;
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.description };
      }

      const data = await response.json();
      return { success: true, messageId: data.result.message_id.toString() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

class DiscordProvider implements NotificationProvider {
  channel = 'discord' as NotificationChannel;

  validateConfig(config: ChannelConfig): boolean {
    return !!config.config.webhookUrl;
  }

  async send(payload: NotificationPayload, config: ChannelConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { webhookUrl } = config.config;
    if (!webhookUrl) return { success: false, error: 'Discord not configured' };

    try {
      const embed = {
        title: payload.title,
        description: payload.body,
        color: payload.priority === 'urgent' ? 15158332 : payload.priority === 'high' ? 16753920 : 3447003,
        fields: payload.data ? Object.entries(payload.data).map(([k, v]) => ({ name: k, value: String(v), inline: true })) : [],
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (!response.ok) {
        return { success: false, error: `Discord error: ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

class WhatsAppProvider implements NotificationProvider {
  channel = 'whatsapp' as NotificationChannel;

  validateConfig(config: ChannelConfig): boolean {
    return !!config.config.accessToken && !!config.config.phoneNumberId;
  }

  async send(payload: NotificationPayload, config: ChannelConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { accessToken, phoneNumberId, to } = config.config;
    if (!accessToken || !phoneNumberId || !to) return { success: false, error: 'WhatsApp not configured' };

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: `${payload.title}\n\n${payload.body}${payload.actionUrl ? `\n\n${payload.actionText || 'View'}: ${payload.actionUrl}` : ''}` },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error?.message || 'WhatsApp error' };
      }

      const data = await response.json();
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

class InAppProvider implements NotificationProvider {
  channel = 'in_app' as NotificationChannel;

  validateConfig(): boolean {
    return true; // Always available
  }

  async send(payload: NotificationPayload, config: ChannelConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // In-app notifications are handled by the messaging service
    const { createNotification } = await import('../notifications/service');
    await createNotification(payload);
    return { success: true };
  }
}

const PROVIDERS: Record<NotificationChannel, NotificationProvider> = {
  email: {
    channel: 'email',
    validateConfig: (config) => !!config.config.apiKey,
    async send(payload, config) {
      const { sendTemplatedEmail } = await import('../email/service');
      // Map category to template
      const templateMap: Record<string, string> = {
        project_uploaded: 'project_uploaded',
        qa_finished: 'qa_finished',
        project_published: 'project_published',
        invoice_issued: 'invoice_issued',
        subscription_changed: 'subscription_changed',
        payment_failed: 'payment_failed',
        welcome: 'welcome',
        password_reset: 'password_reset',
      };
      const template = templateMap[payload.category];
      if (!template) return { success: false, error: 'No email template for category' };
      // Convert data to Record<string, string>
      const stringData: Record<string, string> = {};
      for (const [k, v] of Object.entries(payload.data || {})) {
        stringData[k] = String(v);
      }
      return sendTemplatedEmail(template as EmailTemplateId, config.config.to || '', stringData);
    },
  },
  telegram: new TelegramProvider(),
  discord: new DiscordProvider(),
  whatsapp: new WhatsAppProvider(),
  in_app: new InAppProvider(),
  push: {
    channel: 'push',
    validateConfig: () => false,
    async send() { return { success: false, error: 'Push not implemented' }; },
  },
};

export function getProvider(channel: NotificationChannel): NotificationProvider {
  return PROVIDERS[channel];
}

export function getAvailableChannels(): NotificationChannel[] {
  return Object.keys(PROVIDERS) as NotificationChannel[];
}