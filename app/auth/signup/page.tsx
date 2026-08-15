import type { Metadata } from 'next';
import { SignUpForm } from './SignUpForm';

export const metadata: Metadata = {
  title: 'Sign up | VizTR',
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-8">
      <SignUpForm />
    </main>
  );
}
