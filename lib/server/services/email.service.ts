import { Resend } from 'resend';
import { createLogger } from '../logger';

const log = createLogger({ module: 'email-service' });
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'VizTR <noreply@viztr.io>',
      to,
      subject,
      html,
    });

    if (error) {
      log.error({ err: error, to }, 'Failed to send reminder email');
      throw error;
    }

    log.info({ to, messageId: data?.id }, 'Reminder email sent');
  } catch (error) {
    log.error({ err: error, to }, 'Error sending reminder email');
    throw error;
  }
}
