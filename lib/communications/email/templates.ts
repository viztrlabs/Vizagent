// M16: Email Templates
import { EmailTemplate, EmailTemplateId } from './types';
export type { EmailTemplateId } from './types';

const PLACEHOLDER_PREFIX = '[[';
const PLACEHOLDER_SUFFIX = ']]';

const baseHtml = (content: string, preheader: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${preheader}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">VizTR</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Visualization Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You received this because you have a VizTR account.<br>
                <a href="[[unsubscribeUrl]]" style="color: #9ca3af;">Unsubscribe</a> | 
                <a href="[[preferencesUrl]]" style="color: #9ca3af;">Preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const baseText = (content: string) => `
VizTR - Visualization Platform

${content}

---
You received this because you have a VizTR account.
Unsubscribe: [[unsubscribeUrl]]
Preferences: [[preferencesUrl]]
`;

export const EMAIL_TEMPLATES: Record<EmailTemplateId, EmailTemplate> = {
  project_uploaded: {
    id: 'project_uploaded',
    subject: 'Your project "[[projectName]]" has been uploaded',
    html: baseHtml(`
      <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Project Uploaded Successfully</h2>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Hi [[userName]],</p>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Your project <strong>[[projectName]]</strong> has been uploaded and is ready for processing.</p>
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #0369a1; font-weight: 600;">Project Details</p>
        <p style="margin: 0; color: #0369a1;">ID: [[projectId]]<br>Status: Processing<br>Uploaded: [[uploadDate]]</p>
      </div>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">You'll receive another notification when processing is complete.</p>
      <a href="[[projectUrl]]" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Project</a>
    `, 'Your project has been uploaded'),
    text: baseText(`
Project Uploaded Successfully

Hi [[userName]],

Your project [[projectName]] has been uploaded and is ready for processing.

Project Details:
ID: [[projectId]]
Status: Processing
Uploaded: [[uploadDate]]

You'll receive another notification when processing is complete.

View Project: [[projectUrl]]
    `),
  },
  qa_finished: {
    id: 'qa_finished',
    subject: 'QA completed for "[[projectName]]" - [[qaStatus]]',
    html: baseHtml(`
      <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Quality Assurance Complete</h2>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Hi [[userName]],</p>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">QA has finished for your project <strong>[[projectName]]</strong>.</p>
      <div style="background: [[qaStatus === 'passed' ? '#f0fdf4' : '#fef2f2']]; border: 1px solid [[qaStatus === 'passed' ? '#bbf7d0' : '#fecaca']]; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: [[qaStatus === 'passed' ? '#166534' : '#991b1b']]; font-weight: 600;">QA Status: [[qaStatus | upper]]</p>
        <p style="margin: 0; color: [[qaStatus === 'passed' ? '#166534' : '#991b1b']];">[[qaSummary]]</p>
      </div>
      <a href="[[projectUrl]]" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View QA Report</a>
    `, 'QA completed for your project'),
    text: baseText(`
QA Complete

Hi [[userName]],

QA has finished for your project [[projectName]].

QA Status: [[qaStatus]]
[[qaSummary]]

View QA Report: [[projectUrl]]
    `),
  },
  project_published: {
    id: 'project_published',
    subject: '🎉 "[[projectName]]" is now live!',
    html: baseHtml(`
      <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Project Published!</h2>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Hi [[userName]],</p>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Great news! Your project <strong>[[projectName]]</strong> has been published and is now live.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #166534; font-weight: 600;">Live URL</p>
        <p style="margin: 0; color: #166534; word-break: break-all;">[[publicUrl]]</p>
      </div>
      <a href="[[publicUrl]]" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Live Project</a>
      <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">Share this link with your clients and collaborators.</p>
    `, 'Your project is now live'),
    text: baseText(`
Project Published!

Hi [[userName]],

Great news! Your project [[projectName]] has been published and is now live.

Live URL: [[publicUrl]]

View Live Project: [[publicUrl]]

Share this link with your clients and collaborators.
    `),
  },
  invoice_issued: {
    id: 'invoice_issued',
    subject: 'Invoice #[[invoiceNumber]] for $[[amount]] - [[tier]] Plan',
    html: baseHtml(`
      <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">New Invoice</h2>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Hi [[userName]],</p>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">A new invoice has been issued for your subscription.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280;">Invoice #</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">[[invoiceNumber]]</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Plan</td><td style="padding: 8px 0; text-align: right;">[[tier]]</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Period</td><td style="padding: 8px 0; text-align: right;">[[periodStart]] - [[periodEnd]]</td></tr>
          <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; color: #111827; font-weight: 600;">Total</td><td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">$[[amount]]</td></tr>
        </table>
      </div>
      <a href="[[invoiceUrl]]" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Invoice</a>
    `, 'New invoice issued'),
    text: baseText(`
New Invoice

Hi [[userName]],

A new invoice has been issued for your subscription.

Invoice #: [[invoiceNumber]]
Plan: [[tier]]
Period: [[periodStart]] - [[periodEnd]]
Total: $[[amount]]

View Invoice: [[invoiceUrl]]
    `),
  },
  subscription_changed: {
    id: 'subscription_changed',
    subject: 'Your subscription has been updated to [[newTier]]',
    html: baseHtml(`
      <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Subscription Updated</h2>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Hi [[userName]],</p>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Your subscription has been changed.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #6b7280;">Previous Plan</p>
        <p style="margin: 0; color: #111827; font-weight: 600;">[[oldTier]]</p>
        <p style="margin: 16px 0 8px; color: #6b7280;">New Plan</p>
        <p style="margin: 0; color: #3b82f6; font-weight: 600;">[[newTier]]</p>
        <p style="margin: 16px 0 0; color: #6b7280;">Billing: [[interval]] ($[[price]]/[[interval]])</p>
      </div>
      <a href="[[billingUrl]]" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Manage Subscription</a>
    `, 'Subscription updated'),
    text: baseText(`
Subscription Updated

Hi [[userName]],

Your subscription has been changed.

Previous Plan: [[oldTier]]
New Plan: [[newTier]]
Billing: [[interval]] ($[[price]]/[[interval]])

Manage Subscription: [[billingUrl]]
    `),
  },
  payment_failed: {
    id: 'payment_failed',
    subject: '⚠️ Payment failed for your [[tier]] subscription',
    html: baseHtml(`
      <h2 style="margin: 0 0 16px; color: #991b1b; font-size: 20px;">Payment Failed</h2>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Hi [[userName]],</p>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">We were unable to process payment for your <strong>[[tier]]</strong> subscription.</p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #991b1b; font-weight: 600;">Action Required</p>
        <p style="margin: 0; color: #991b1b;">Please update your payment method to avoid service interruption. We'll retry in 1 day, then 3 days, then 7 days.</p>
      </div>
      <a href="[[billingUrl]]" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Update Payment Method</a>
    `, 'Payment failed'),
    text: baseText(`
Payment Failed

Hi [[userName]],

We were unable to process payment for your [[tier]] subscription.

Action Required: Please update your payment method to avoid service interruption. We'll retry in 1 day, then 3 days, then 7 days.

Update Payment Method: [[billingUrl]]
    `),
  },
  welcome: {
    id: 'welcome',
    subject: 'Welcome to VizTR! 🎉',
    html: baseHtml(`
      <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Welcome to VizTR!</h2>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Hi [[userName]],</p>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Thanks for joining VizTR! We're excited to help you create amazing 3D visualizations.</p>
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #0369a1; font-weight: 600;">Getting Started</p>
        <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
          <li>Create your first project</li>
          <li>Upload 3D assets</li>
          <li>Publish and share</li>
        </ul>
      </div>
      <a href="[[dashboardUrl]]" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
    `, 'Welcome to VizTR'),
    text: baseText(`
Welcome to VizTR!

Hi [[userName]],

Thanks for joining VizTR! We're excited to help you create amazing 3D visualizations.

Getting Started:
- Create your first project
- Upload 3D assets
- Publish and share

Go to Dashboard: [[dashboardUrl]]
    `),
  },
  password_reset: {
    id: 'password_reset',
    subject: 'Reset your VizTR password',
    html: baseHtml(`
      <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Password Reset</h2>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Hi [[userName]],</p>
      <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">You requested a password reset. Click the button below to set a new password.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="[[resetUrl]]" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
      </div>
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    `, 'Reset your password'),
    text: baseText(`
Password Reset

Hi [[userName]],

You requested a password reset. Click the link below to set a new password.

Reset Password: [[resetUrl]]

This link expires in 1 hour. If you didn't request this, please ignore this email.
    `),
  },
};

export function getTemplate(id: EmailTemplateId): EmailTemplate {
  return EMAIL_TEMPLATES[id];
}

export function renderTemplate(template: EmailTemplate, data: Record<string, string>): { html: string; text: string; subject: string } {
  let html = template.html;
  let text = template.text;
  let subject = template.subject;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `[[${key}]]`;
    html = html.replace(new RegExp(placeholder, 'g'), value);
    text = text.replace(new RegExp(placeholder, 'g'), value);
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
  }

  // Handle conditional upper filter
  html = html.replace(/\[\[qaStatus \| upper\]\]/g, data.qaStatus?.toUpperCase() || '');

  return { html, text, subject };
}