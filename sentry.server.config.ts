// This file configures the initialization of Sentry for server features.
// The config you apply here will be used whenever the server starts.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use sourcesMapOptions for a more granular control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Disable in development
  enabled: process.env.NODE_ENV === 'production',

  // Use environment variable
  environment: process.env.NODE_ENV ?? 'development',

  // Avoid logging PII
  sendDefaultPii: false,
});
