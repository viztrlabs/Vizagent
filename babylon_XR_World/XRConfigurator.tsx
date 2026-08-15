// src/components/xr/XRConfigurator.tsx
"use client";

import { useEffect, useRef, useState, useCallback, lazy, Suspense } from "react";
import { Vector3, Quaternion } from "@babylonjs/core";
import { useBabylonScene } from "./useBabylonScene";
import { MaterialsPanel } from "./panels/MaterialsPanel";
import { LightingPanel } from "./panels/LightingPanel";
import { HotspotsPanel } from "./panels/HotspotsPanel";
import { ExportPanel } from "./panels/ExportPanel";
import { ARPanel } from "@/components/configurator/ARPanel";
import {
  type XRConfiguration,
  type MaterialOverride,
  emptyConfiguration,
} from "@/lib/xr/types";
import { endXRSession } from "@/lib/xr/webxr";

const BabylonCanvas = lazy(() => import("./BabylonCanvas").then(m => ({ default: m.BabylonCanvas })));

type Tab = "materials" | "lighting" | "hotspots" | "export" | "arvr";

interface XRConfiguratorProps {
  xrAssetId: string;
  glbUrl: string;
  initialConfig?: XRConfiguration;
}

export default function XRConfigurator({
  xrAssetId,
  glbUrl,
  initialConfig,
}: XRConfiguratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<Tab>("materials");
  const [config, setConfig] = useState<XRConfiguration>(
    initialConfig ?? emptyConfiguration(xrAssetId, glbUrl)
  );
  const [meshIds, setMeshIds] = useState<string[]>([]);
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null);
  const [isPlacingHotspot, setIsPlacingHotspot] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(config.posterUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [prevTab, setPrevTab] = useState<Tab>("materials");

  const handleMeshPicked = useCallback(
    (meshId: string, point: Vector3) => {
      if (!isPlacingHotspot) return;
      const newHotspot = {
        id: crypto.randomUUID(),
        label: "New hotspot",
        position: [point.x, point.y, point.z] as [number, number, number],
      };
      setConfig((c) => ({ ...c, hotspots: [...c.hotspots, newHotspot] }));
      setIsPlacingHotspot(false);
    },
    [isPlacingHotspot]
  );

  const scene = useBabylonScene(canvasRef, { onMeshPicked: handleMeshPicked });

  // Load model once the engine is ready
  useEffect(() => {
    if (!scene.isReady) return;
    scene.loadModel(config.glbUrl).then(() => {
      // populate mesh list for the materials dropdown
      const meshes = scene.sceneRef.current?.meshes ?? [];
      setMeshIds(meshes.filter((m) => m.getTotalVertices() > 0).map((m) => m.id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.isReady, config.glbUrl]);

  // Re-apply environment whenever it changes
  useEffect(() => {
    if (scene.isReady) scene.applyEnvironment(config.environment);
  }, [scene, config.environment]);

  // Re-apply material overrides
  useEffect(() => {
    if (!scene.isReady) return;
    config.materials.forEach((m) => scene.applyMaterialOverride(m));
  }, [scene, config.materials]);

  // Sync hotspot markers
  useEffect(() => {
    scene.syncHotspotMarkers(config.hotspots, config.visibility.hotspotsVisibleByDefault);
  }, [scene, config.hotspots, config.visibility.hotspotsVisibleByDefault]);

  // End XR session when switching away from AR/VR tab
  useEffect(() => {
    if (prevTab === "arvr" && tab !== "arvr") {
      endXRSession();
    }
    setPrevTab(tab);
  }, [tab, prevTab]);

  const materialOverridesByMesh: Record<string, MaterialOverride> = {};
  config.materials.forEach((m) => (materialOverridesByMesh[m.meshId] = m));

  const updateMaterial = (meshId: string, patch: Partial<MaterialOverride>) => {
    setConfig((c) => {
      const existingIdx = c.materials.findIndex((m) => m.meshId === meshId);
      const next = [...c.materials];
      if (existingIdx >= 0) {
        next[existingIdx] = { ...next[existingIdx], ...patch };
      } else {
        next.push({ meshId, ...patch });
      }
      return { ...c, materials: next };
    });
  };

  const handleCapturePoster = async () => {
    const dataUrl = await scene.capturePoster();
    setPosterUrl(dataUrl);
    setConfig((c) => ({ ...c, posterUrl: dataUrl }));
  };

  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/xr-assets/${xrAssetId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Publish failed");
      const data = await res.json();
      return {
        viewerUrl: data.viewerUrl,
        embedCode: `<iframe src="${data.viewerUrl}" width="100%" height="600" style="border:0" allow="xr-spatial-tracking"></iframe>`,
        qrCodeUrl: data.qrCodeUrl,
      };
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="viztr-configurator">
      <div className="viewport">
        <Suspense fallback={<div className="viztr-canvas-shell"><div className="viztr-spinner" aria-label="Loading canvas" /></div>}>
          <BabylonCanvas
            ref={canvasRef}
            isLoading={scene.isModelLoading}
            error={scene.loadError}
            posterUrl={posterUrl ?? undefined}
          />
        </Suspense>
      </div>

      <aside className="side-panel">
        <div className="tabs">
          {(["materials", "lighting", "hotspots", "export", "arvr"] as Tab[]).map((t) => (
            <button
              key={t}
              className={t === tab ? "tab active" : "tab"}
              onClick={() => setTab(t)}
            >
              {t === "arvr" ? "AR/VR" : t}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {tab === "materials" && (
            <MaterialsPanel
              meshIds={meshIds}
              selectedMeshId={selectedMeshId}
              onSelectMesh={setSelectedMeshId}
              overrides={materialOverridesByMesh}
              onChange={updateMaterial}
            />
          )}
          {tab === "lighting" && (
            <LightingPanel
              env={config.environment}
              onChange={(patch) =>
                setConfig((c) => ({ ...c, environment: { ...c.environment, ...patch } }))
              }
            />
          )}
          {tab === "hotspots" && (
            <HotspotsPanel
              hotspots={config.hotspots}
              isPlacing={isPlacingHotspot}
              onTogglePlacing={() => setIsPlacingHotspot((p) => !p)}
              onUpdate={(id, patch) =>
                setConfig((c) => ({
                  ...c,
                  hotspots: c.hotspots.map((h) => (h.id === id ? { ...h, ...patch } : h)),
                }))
              }
              onDelete={(id) =>
                setConfig((c) => ({ ...c, hotspots: c.hotspots.filter((h) => h.id !== id) }))
              }
            />
          )}
          {tab === "export" && (
            <ExportPanel
              posterUrl={posterUrl}
              onCapturePoster={handleCapturePoster}
              onSaveAndPublish={handleSaveAndPublish}
              isSaving={isSaving}
            />
          )}
          {tab === "arvr" && <ARPanel scene={scene} />}
        </div>
      </aside>

      <style jsx>{`
        .viztr-configurator {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
          height: 100%;
          min-height: 560px;
          font-family: system-ui, sans-serif;
        }
        .viewport { min-height: 400px; }
        .side-panel {
          background: #0f0a1c;
          border: 1px solid #2a1f47;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }
        .tabs { display: flex; gap: 4px; border-bottom: 1px solid #2a1f47; padding-bottom: 10px; }
        .tab {
          flex: 1; padding: 6px 0; font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.04em; background: none; border: none; color: #8b8398;
          cursor: pointer; border-radius: 6px;
        }
        .tab.active { background: #1a1330; color: #fff; }
        .tab-content { flex: 1; }

        @media (max-width: 860px) {
          .viztr-configurator { grid-template-columns: 1fr; }
          .viewport { height: 50vh; }
        }
      `}</style>
    </div>
  );
}
