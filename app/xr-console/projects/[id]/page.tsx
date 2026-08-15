import { XRConsoleLayout } from '@/components/xr-console/XRConsoleLayout';
import { ProjectDetailClient } from '@/components/xr-console/ProjectDetailClient';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <XRConsoleLayout>
      <ProjectDetailClient />
    </XRConsoleLayout>
  );
}