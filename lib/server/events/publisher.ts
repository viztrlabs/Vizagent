import { DomainEvent } from './types';
import { createLogger } from '../logger';
import { getCalendarSyncQueue } from '../queues/calendar-sync.queue';
import { getSessionReminderQueue } from '../queues/session-reminder.queue';

const log = createLogger({ module: 'event-publisher' });

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
      log.warn({ eventType: event.type }, 'Unhandled event type');
  }
}
