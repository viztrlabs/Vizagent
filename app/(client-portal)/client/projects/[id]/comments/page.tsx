import { getCurrentAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/server';

export default async function CommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getCurrentAuth();
  
  if (!auth.dbUser) {
    redirect('/login');
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, tenantId: auth.tenantId },
    select: { id: true, clientId: true },
  });

  if (!project) {
    redirect('/client');
  }

  if (auth.role === 'CLIENT' && project.clientId !== auth.dbUser.id) {
    redirect('/client');
  }

  redirect(`/client?project=${id}&tab=comments`);
}