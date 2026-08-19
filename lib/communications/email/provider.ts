// M16: Email Provider - Resend/NodeMailer abstraction
import { EmailProvider, EmailParams, SendEmailResult } from './types';

class ResendProvider implements EmailProvider {
  private apiKey: string;
  private baseUrl = 'https://api.resend.com/emails';

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
  }

  async send(params: EmailParams): Promise<SendEmailResult> {
    if (!this.apiKey) {
      // Mock mode for development
      console.log('[EMAIL MOCK] Would send:', { to: params.to, subject: params.subject });
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: params.from || 'VizTR <noreply@viztr.io>',
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
          reply_to: params.replyTo,
          attachments: params.attachments,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to send email' };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

class ConsoleProvider implements EmailProvider {
  async send(params: EmailParams): Promise<SendEmailResult> {
    console.log('=== EMAIL ===');
    console.log('To:', params.to);
    console.log('Subject:', params.subject);
    console.log('Text:', params.text);
    console.log('=============');
    return { success: true, messageId: `console_${Date.now()}` };
  }
}

let _provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!_provider) {
    if (process.env.RESEND_API_KEY) {
      _provider = new ResendProvider();
    } else {
      _provider = new ConsoleProvider();
    }
  }
  return _provider;
}

export async function sendEmail(params: EmailParams): Promise<SendEmailResult> {
  return getEmailProvider().send(params);
}