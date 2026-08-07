import { Resend } from 'resend';

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
      console.error('Failed to send reminder email:', error);
      throw error;
    }

    console.log(`Reminder email sent: ${data?.id}`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
}
