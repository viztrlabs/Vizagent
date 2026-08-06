'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const errorMessages: Record<string, string> = {
  default: 'An error occurred during authentication.',
  Configuration: 'There is a problem with the server configuration. Please contact support.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The sign-in token has expired or has already been used.',
  OAuthSignin: 'Error in constructing an authorization URL.',
  OAuthCallback: 'Error in handling the response from the OAuth provider.',
  OAuthCreateAccount: 'Could not create a user in the database.',
  EmailCreateAccount: 'Could not create a user with this email.',
  Callback: 'Error in the OAuth callback handler.',
  OAuthAccountNotLinked: 'This account is already linked. Try signing in directly.',
  EmailSignin: 'The e-mail could not be sent.',
  CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
  SessionRequired: 'Please sign in to access this page.',
};

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'default';
  const errorMessage = errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-md p-6 sm:p-8 bg-surface rounded-xl border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl text-red-400 mb-2">Authentication Error</h1>
          <p className="text-gray-400">{errorMessage}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signin"
            className="w-full py-3 bg-cyan text-bg rounded-lg font-medium hover:bg-cyan/90 transition-colors text-center min-h-touch"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="w-full py-3 bg-surface border border-gray-700 text-white rounded-lg font-medium hover:bg-surface/80 transition-colors text-center min-h-touch"
          >
            Back to Home
          </Link>
        </div>

        {error !== 'default' && (
          <p className="mt-4 text-center text-xs text-gray-500">
            Error code: {error}
          </p>
        )}
      </div>
    </div>
  );
}
