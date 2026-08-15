import { Metadata } from 'next';
import { requirePermission } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import TeamManagement from '@/components/projects/TeamManagement';

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Team | VizTR',
  description: 'Manage project team members',
};

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;

  // M3: team management requires projects.read (write is checked in the client/form)
  try {
    await requirePermission('projects.read');
  } catch {
    redirect('/dashboard');
  }

  return <TeamManagement projectId={id} />;
}
