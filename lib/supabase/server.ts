import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/server';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Supabase server client using @supabase/server
export function createSupabaseServerClient() {
  return createClient({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SECRET_KEY!,
    auth: {
      jwks: process.env.SUPABASE_JWKS_URL,
    },
  });
}