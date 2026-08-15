import { Metadata } from 'next';
import { requirePermission } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import ProjectList from '@/components/projects/ProjectList';

export const metadata: Metadata = {
  title: 'Projects | VizTR',
  description: 'Manage your architectural visualization projects',
};

export default async function ProjectsPage() {
  // M3: require projects.read permission (CLIENT gets it by default)
  try {
    await requirePermission('projects.read');
  } catch {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Projects</h1>
            <p className="text-gray-400 mt-1 text-sm">Manage your architectural visualization projects</p>
          </div>
        </div>
        <ProjectList />
      </div>
    </div>
  );
}
