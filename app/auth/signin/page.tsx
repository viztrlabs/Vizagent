import type { Metadata } from 'next';
import { SignInForm } from './SignInForm';

export const metadata: Metadata = {
  title: 'Sign in | VizTR',
};

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-8">
      <SignInForm />
    </main>
  );
}
