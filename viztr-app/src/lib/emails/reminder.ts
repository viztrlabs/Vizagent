export function reminderEmailHTML(session: { id: string; service?: string; clientName?: string; hostId?: string; startAt: string | Date; [key: string]: unknown }) {
  return `
    <!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <div style="margin-bottom:24px">
        <img src="https://viztr.io/logo.png" height="28" alt="VizTR">
      </div>
      <h2 style="font-size:18px;font-weight:500;margin-bottom:8px">Your session starts in 1 hour</h2>
      <p style="color:#666;font-size:14px;margin-bottom:24px">
        ${session.service || 'XR Configurator'} · ${session.clientName || session.hostId}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:8px 0;color:#999;font-size:13px;border-bottom:1px solid #eee">Date</td>
            <td style="padding:8px 0;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid #eee">${new Date(session.startAt).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;border-bottom:1px solid #eee">Time</td>
            <td style="padding:8px 0;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid #eee">${new Date(session.startAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'})} IST</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px">Session ID</td>
            <td style="padding:8px 0;font-size:12px;font-family:monospace;text-align:right">${session.id}</td></tr>
      </table>
      <a href="https://viztr.io/portal" 
         style="display:block;background:#00e5ff;color:#080a0f;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;margin-bottom:16px">
        View session details
      </a>
      <p style="font-size:12px;color:#aaa;text-align:center">
        Your architect will start the stream a few minutes before the session time.
      </p>
    </body></html>
  `;
}