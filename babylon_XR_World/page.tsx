// src/app/configurator/[projectId]/page.tsx
// Server component. Fetches the project + config from Prisma, then hands
// off to a client-only dynamic import for the actual Babylon canvas.
// This keeps Babylon.js (and its ~1-2MB of JS) out of every page that
// isn't the configurator itself.

import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma"; // your existing Prisma client singleton

const XRConfigurator = dynamic(() => import("@/components/xr/XRConfigurator"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 40, color: "#ccc", textAlign: "center" }}>
      Loading configurator…
    </div>
  ),
});

interface PageProps {
  params: { projectId: string };
}

export default async function ConfiguratorPage({ params }: PageProps) {
  const asset = await prisma.xrAsset.findUnique({
    where: { id: params.projectId },
    include: { configurations: { where: { name: "default" } } },
  });

  if (!asset) {
    return <div style={{ padding: 40 }}>Project not found.</div>;
  }

  const initialConfig = asset.configurations[0]
    ? JSON.parse(asset.configurations[0].data as string)
    : undefined;

  return (
    <main style={{ height: "100vh", padding: 20, background: "#050208" }}>
      <XRConfigurator
        xrAssetId={asset.id}
        glbUrl={asset.glbUrl}
        initialConfig={initialConfig}
      />
    </main>
  );
}
