// M16: Email Service - high-level email sending with templates
import { sendEmail } from './provider';
import { getTemplate, renderTemplate, EmailTemplateId } from './templates';

export async function sendTemplatedEmail(
  templateId: EmailTemplateId,
  to: string,
  data: Record<string, string>,
  userName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = getTemplate(templateId);
  const { html, text, subject } = renderTemplate(template, { ...data, userName: userName || 'User' });

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

// Convenience functions for each transactional email
export async function sendProjectUploadedEmail(
  to: string,
  userName: string,
  projectName: string,
  projectId: string,
  projectUrl: string
) {
  return sendTemplatedEmail('project_uploaded', to, {
    userName,
    projectName,
    projectId,
    projectUrl,
    uploadDate: new Date().toLocaleDateString(),
  }, userName);
}

export async function sendQAFinishedEmail(
  to: string,
  userName: string,
  projectName: string,
  projectUrl: string,
  qaStatus: 'passed' | 'failed' | 'warning',
  qaSummary: string
) {
  return sendTemplatedEmail('qa_finished', to, {
    userName,
    projectName,
    projectUrl,
    qaStatus,
    qaSummary,
  }, userName);
}

export async function sendProjectPublishedEmail(
  to: string,
  userName: string,
  projectName: string,
  publicUrl: string
) {
  return sendTemplatedEmail('project_published', to, {
    userName,
    projectName,
    publicUrl,
  }, userName);
}

export async function sendInvoiceIssuedEmail(
  to: string,
  userName: string,
  invoiceNumber: string,
  tier: string,
  amount: string,
  periodStart: string,
  periodEnd: string,
  invoiceUrl: string
) {
  return sendTemplatedEmail('invoice_issued', to, {
    userName,
    invoiceNumber,
    tier,
    amount,
    periodStart,
    periodEnd,
    invoiceUrl,
  }, userName);
}

export async function sendSubscriptionChangedEmail(
  to: string,
  userName: string,
  oldTier: string,
  newTier: string,
  interval: string,
  price: string,
  billingUrl: string
) {
  return sendTemplatedEmail('subscription_changed', to, {
    userName,
    oldTier,
    newTier,
    interval,
    price,
    billingUrl,
  }, userName);
}

export async function sendPaymentFailedEmail(
  to: string,
  userName: string,
  tier: string,
  billingUrl: string
) {
  return sendTemplatedEmail('payment_failed', to, {
    userName,
    tier,
    billingUrl,
  }, userName);
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  dashboardUrl: string
) {
  return sendTemplatedEmail('welcome', to, {
    userName,
    dashboardUrl,
  }, userName);
}

export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetUrl: string
) {
  return sendTemplatedEmail('password_reset', to, {
    userName,
    resetUrl,
  }, userName);
}