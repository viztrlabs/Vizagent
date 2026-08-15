import Link from 'next/link';
import { XRConsoleLayout } from '@/components/xr-console/XRConsoleLayout';
import { ProjectListClient } from '@/components/xr-console/ProjectListClient';

export default function ProjectsPage() {
  return (
    <XRConsoleLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Projects</h1>
            <p className="text-gray-400 mt-1">Manage your architectural visualization projects</p>
          </div>
          <Link href="/xr-console/projects/new" className="px-4 py-2 bg-cyan text-bg rounded-lg font-medium hover:bg-cyan/90 transition-colors min-h-touch">
            New Project
          </Link>
        </div>
        <ProjectListClient />
      </div>
    </XRConsoleLayout>
  );
}