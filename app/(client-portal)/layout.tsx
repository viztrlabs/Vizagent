import ClientPortalLayout from '@/components/client-portal/ClientPortalLayout';
import { getCurrentAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function ClientPortalLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getCurrentAuth();
  
  if (!auth.dbUser) {
    redirect('/login');
  }

  if (auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN' || auth.role === 'USER') {
    redirect('/dashboard');
  }

  return <ClientPortalLayout>{children}</ClientPortalLayout>;
}