import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        xrAssets: {
          where: {
            type: "equirect",
            service: "tour",
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Tour not found" } },
        { status: 404 }
      );
    }

    const assets = project.xrAssets.map((asset) => {
      let config: any = null;
      try {
        config = asset.configurations?.[0]?.data
          ? JSON.parse(asset.configurations[0].data)
          : null;
      } catch {
        config = null;
      }

      return {
        id: asset.id,
        equirectUrl: asset.equirectUrl || "",
        hotspots: config?.hotspots || [],
      };
    });

    const settings = project.settings
      ? typeof project.settings === "string"
        ? JSON.parse(project.settings)
        : project.settings
      : {};

    const tourData = {
      projectId: project.id,
      projectName: project.name,
      assets,
      currentAssetIndex: 0,
      settings: {
        autoRotate: settings.autoRotate ?? false,
        autoRotateSpeed: settings.autoRotateSpeed ?? 0.5,
        defaultYaw: settings.defaultYaw ?? -Math.PI / 2,
        defaultPitch: settings.defaultPitch ?? 0,
      },
    };

    return NextResponse.json({ success: true, data: tourData });
  } catch (error) {
    console.error("Failed to fetch tour data:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL", message: "Failed to fetch tour data" } },
      { status: 500 }
    );
  }
}