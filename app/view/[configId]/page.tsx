import ViewClient from '@/components/viewer/ViewClient';

interface ViewPageProps {
  params: Promise<{ configId: string }>;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { configId } = await params;

  return (
    <div className="h-screen bg-bg">
      <ViewClient configId={configId} />
    </div>
  );
}
