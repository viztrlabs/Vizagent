// src/components/xr/panels/MaterialsPanel.tsx
"use client";

import type { MaterialOverride } from "@/lib/xr/types";

interface MaterialsPanelProps {
  meshIds: string[];
  selectedMeshId: string | null;
  onSelectMesh: (id: string) => void;
  overrides: Record<string, MaterialOverride>;
  onChange: (meshId: string, patch: Partial<MaterialOverride>) => void;
}

export function MaterialsPanel({
  meshIds,
  selectedMeshId,
  onSelectMesh,
  overrides,
  onChange,
}: MaterialsPanelProps) {
  const current = selectedMeshId ? overrides[selectedMeshId] : undefined;

  return (
    <div className="panel">
      <label className="panel-label">Mesh</label>
      <select
        className="panel-select"
        value={selectedMeshId ?? ""}
        onChange={(e) => onSelectMesh(e.target.value)}
      >
        <option value="" disabled>
          Select a part…
        </option>
        {meshIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>

      {selectedMeshId && (
        <>
          <Row label="Base color">
            <input
              type="color"
              value={current?.baseColor ?? "#cccccc"}
              onChange={(e) => onChange(selectedMeshId, { baseColor: e.target.value })}
            />
          </Row>

          <Slider
            label="Metallic"
            value={current?.metallic ?? 0}
            onChange={(v) => onChange(selectedMeshId, { metallic: v })}
          />
          <Slider
            label="Roughness"
            value={current?.roughness ?? 0.5}
            onChange={(v) => onChange(selectedMeshId, { roughness: v })}
          />
          <Slider
            label="Opacity"
            value={current?.opacity ?? 1}
            onChange={(v) => onChange(selectedMeshId, { opacity: v })}
          />

          <Row label="Emissive">
            <input
              type="color"
              value={current?.emissive ?? "#000000"}
              onChange={(e) => onChange(selectedMeshId, { emissive: e.target.value })}
            />
          </Row>
          <Slider
            label="Emissive intensity"
            value={current?.emissiveIntensity ?? 0}
            onChange={(v) => onChange(selectedMeshId, { emissiveIntensity: v })}
          />
        </>
      )}

      <style jsx>{`
        .panel { display: flex; flex-direction: column; gap: 14px; }
        .panel-label {
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
          color: #a78bda; font-weight: 600;
        }
        .panel-select {
          background: #1a1330; color: #eee; border: 1px solid #3a2a5c;
          border-radius: 6px; padding: 8px 10px; font-size: 13px;
        }
      `}</style>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row">
      <span>{label}</span>
      {children}
      <style jsx>{`
        .row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; color: #ddd;
        }
      `}</style>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-row">
      <div className="slider-head">
        <span>{label}</span>
        <span className="slider-value">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <style jsx>{`
        .slider-row { display: flex; flex-direction: column; gap: 4px; }
        .slider-head {
          display: flex; justify-content: space-between; font-size: 12px; color: #ccc;
        }
        .slider-value { color: #0d9488; font-family: monospace; }
        input[type="range"] {
          accent-color: #6b21a8;
        }
      `}</style>
    </div>
  );
}
