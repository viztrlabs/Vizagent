// M16: Email Types
export type EmailTemplateId =
  | 'project_uploaded'
  | 'qa_finished'
  | 'project_published'
  | 'invoice_issued'
  | 'subscription_changed'
  | 'payment_failed'
  | 'welcome'
  | 'password_reset';

export interface EmailTemplate {
  id: EmailTemplateId;
  subject: string;
  html: string;
  text: string;
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(params: EmailParams): Promise<SendEmailResult>;
}