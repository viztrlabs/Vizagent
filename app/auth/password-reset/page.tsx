import type { Metadata } from 'next';
import { PasswordResetForm } from './PasswordResetForm';

export const metadata: Metadata = {
  title: 'Reset Password | VizTR',
};

export default function PasswordResetPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-8">
      <PasswordResetForm />
    </main>
  );
}