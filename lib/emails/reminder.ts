export function reminderEmailHTML(session: {
  startAt?: Date | string | null;
  portalUrl?: string;
}): string {
  const startLabel = session.startAt
    ? new Date(session.startAt).toLocaleString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      }) + ' IST'
    : 'TBD';

  const portalUrl = session.portalUrl || `${process.env.NEXTAUTH_URL || ''}/portal`;

  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px">
        <h2 style="font-size: 18px; font-weight: 500; margin-bottom: 8px">
          Your XR Configurator session starts soon
        </h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 24px">
          ${startLabel}
        </p>
        <a href="${portalUrl}"
           style="display: block; background: #00e5ff; color: #080a0f; text-align: center;
                  padding: 12px; border-radius: 8px; text-decoration: none; font-size: 14px;
                  font-weight: 500; margin-bottom: 16px">
          View session details
        </a>
        <p style="font-size: 12px; color: #aaa; text-align: center">
          Your architect will start the stream a few minutes before the session time.
        </p>
      </body>
    </html>
  `;
}
