import { z } from 'zod';

const envSchema = z.object({
  // Required for runtime
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  // Optional - will warn if missing
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
});

type Env = z.infer<typeof envSchema>;

let _validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (_validatedEnv) return _validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const missing = Object.entries(formatted)
      .filter(([, v]) => v && typeof v === 'object' && '_errors' in v && Array.isArray(v._errors) && v._errors.length > 0)
      .map(([k, v]) => {
        const errors = v && typeof v === 'object' && '_errors' in v ? (v as { _errors: string[] })._errors : [];
        return `  ${k}: ${errors.join(', ')}`;
      })
      .join('\n');

    console.warn(
      `[env] Environment validation warnings:\n${missing}\n\nApp will continue but some features may be unavailable.`
    );
  }

  _validatedEnv = (result.success ? result.data : process.env) as Env;
  return _validatedEnv;
}
