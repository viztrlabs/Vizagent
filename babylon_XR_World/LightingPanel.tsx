// src/components/xr/panels/LightingPanel.tsx
"use client";

import type { EnvironmentSettings } from "@/lib/xr/types";

const HDRI_PRESETS = [
  { label: "Studio – soft", url: "/hdri/studio-soft.env" },
  { label: "Studio – contrast", url: "/hdri/studio-contrast.env" },
  { label: "Outdoor – overcast", url: "/hdri/outdoor-overcast.env" },
  { label: "Outdoor – golden hour", url: "/hdri/outdoor-golden.env" },
];

interface LightingPanelProps {
  env: EnvironmentSettings;
  onChange: (patch: Partial<EnvironmentSettings>) => void;
}

export function LightingPanel({ env, onChange }: LightingPanelProps) {
  return (
    <div className="panel">
      <label className="panel-label">Environment (HDRI)</label>
      <select
        className="panel-select"
        value={env.hdriUrl}
        onChange={(e) => onChange({ hdriUrl: e.target.value })}
      >
        {HDRI_PRESETS.map((p) => (
          <option key={p.url} value={p.url}>
            {p.label}
          </option>
        ))}
      </select>

      <FieldSlider
        label="Exposure"
        value={env.exposure}
        min={0.1}
        max={3}
        onChange={(v) => onChange({ exposure: v })}
      />

      <label className="panel-label">Background</label>
      <div className="segmented">
        {(["environment", "color", "transparent"] as const).map((mode) => (
          <button
            key={mode}
            className={mode === env.background ? "seg active" : "seg"}
            onClick={() => onChange({ background: mode })}
          >
            {mode}
          </button>
        ))}
      </div>

      {env.background === "color" && (
        <div className="row">
          <span>Color</span>
          <input
            type="color"
            value={env.backgroundColor ?? "#1a1330"}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
          />
        </div>
      )}

      <FieldSlider
        label="Shadow intensity"
        value={env.shadowIntensity}
        min={0}
        max={1}
        onChange={(v) => onChange({ shadowIntensity: v })}
      />
      <FieldSlider
        label="Shadow softness"
        value={env.shadowBlur}
        min={0}
        max={1}
        onChange={(v) => onChange({ shadowBlur: v })}
      />

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
        .segmented { display: flex; gap: 6px; }
        .seg {
          flex: 1; padding: 6px 0; font-size: 12px; border-radius: 6px;
          border: 1px solid #3a2a5c; background: transparent; color: #ccc;
          cursor: pointer; text-transform: capitalize;
        }
        .seg.active { background: #6b21a8; border-color: #6b21a8; color: #fff; }
        .row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; color: #ddd;
        }
      `}</style>
    </div>
  );
}

function FieldSlider({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="slider-row">
      <div className="slider-head">
        <span>{label}</span>
        <span className="slider-value">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={0.01} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <style jsx>{`
        .slider-row { display: flex; flex-direction: column; gap: 4px; }
        .slider-head { display: flex; justify-content: space-between; font-size: 12px; color: #ccc; }
        .slider-value { color: #0d9488; font-family: monospace; }
        input[type="range"] { accent-color: #6b21a8; }
      `}</style>
    </div>
  );
}
