import { render } from '@react-email/render';
import { ReminderEmail } from '../../emails/reminder';
import { ConfirmationEmail } from '../../emails/confirmation';

export async function reminderEmailHTML(session: {
  id: string;
  serviceId: string;
  firstName: string;
  lastName: string;
  startAt: Date;
}) {
  return render(
    <ReminderEmail
      id={session.id}
      serviceId={session.serviceId}
      firstName={session.firstName}
      lastName={session.lastName}
      startAt={session.startAt}
    />
  );
}

export async function confirmationEmailHTML(session: {
  id: string;
  serviceId: string;
  firstName: string;
  lastName: string;
  date: string;
  time: string;
}) {
  return render(
    <ConfirmationEmail
      id={session.id}
      serviceId={session.serviceId}
      firstName={session.firstName}
      lastName={session.lastName}
      date={session.date}
      time={session.time}
    />
  );
}
