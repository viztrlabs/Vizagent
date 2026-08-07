import { DomainEvent } from './types';
import { getCalendarSyncQueue } from '../queues/calendar-sync.queue';
import { getSessionReminderQueue } from '../queues/session-reminder.queue';

export async function publish(event: DomainEvent): Promise<void> {
  switch (event.type) {
    case 'BookingCreated':
      const calendarQueue = getCalendarSyncQueue();
      await calendarQueue.add('calendar-sync', event, {
        jobId: event.id,
      });
      break;

    case 'SessionStarting':
      const reminderQueue = getSessionReminderQueue();
      await reminderQueue.add('session-reminder', event, {
        jobId: event.id,
        delay: 60 * 60 * 1000,
      });
      break;

    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }
}
