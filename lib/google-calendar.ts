import { google } from 'googleapis';

export async function addSessionToCalendar(
  accessToken: string,
  session: {
    id: string;
    service: string;
    date: string;        // ISO string
    durationMinutes: number;
    clientName: string;
    projectType: string;
  }
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });

  const start = new Date(session.date);
  const end = new Date(start.getTime() + session.durationMinutes * 60000);

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `VizTR — ${session.service}`,
      description: [
        `Project: ${session.projectType}`,
        `Client: ${session.clientName}`,
        `Session ID: ${session.id}`,
        ``,
        `Join your stream: https://viztr.io/xr`,
      ].join('\n'),
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 60 },
        ],
      },
      colorId: '9',  // blueberry — matches VizTR brand
    },
  });

  return event.data.id;
}

export async function deleteSessionFromCalendar(
  accessToken: string,
  gcalEventId: string
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: gcalEventId,
  });
}
