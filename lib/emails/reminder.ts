// Canonical email templates live in `./reminder.tsx` (React Email).
// This `.ts` file previously held a divergent hand-rolled HTML template with
// a different signature (`{startAt?, portalUrl?}`) that mismatched every
// caller. It is now a pure re-export so both consumers share one source of
// truth:
//   - app/api/cron/session-reminders/route.ts  → reminderEmailHTML({id, serviceId, firstName, lastName, startAt})
//   - app/api/bookings/route.ts                → confirmationEmailHTML({id, serviceId, firstName, lastName, date, time})
export { reminderEmailHTML, confirmationEmailHTML } from './reminder.tsx';
