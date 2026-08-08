// src/app/api/xr-assets/[id]/config/route.ts
// POST: save/publish a configuration for an XR asset, return distribution links.
// GET:  fetch the current default configuration (used for hydration).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import type { XRConfiguration } from "@/lib/xr/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const config: XRConfiguration = await req.json();

  const asset = await prisma.xrAsset.findUnique({ where: { id: params.id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const saved = await prisma.configuration.upsert({
    where: { xrAssetId_name: { xrAssetId: params.id, name: config.name } },
    update: { data: JSON.stringify(config) },
    create: {
      id: config.id,
      xrAssetId: params.id,
      name: config.name,
      data: JSON.stringify(config),
    },
  });

  const viewerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/view/${saved.id}`;
  const qrCodeUrl = await QRCode.toDataURL(viewerUrl, { margin: 1, width: 300 });

  // Kick off USDZ generation for iOS AR Quick Look as a background job.
  // (See note below — this should be a queued job, not inline, in production.)
  // await enqueueUsdzConversion(saved.id, config.glbUrl);

  return NextResponse.json({
    configId: saved.id,
    viewerUrl,
    qrCodeUrl,
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const config = await prisma.configuration.findFirst({
    where: { xrAssetId: params.id, name: "default" },
  });

  if (!config) {
    return NextResponse.json({ error: "No configuration found" }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(config.data));
}
