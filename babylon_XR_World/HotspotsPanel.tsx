// src/components/xr/panels/HotspotsPanel.tsx
"use client";

import type { Hotspot } from "@/lib/xr/types";

interface HotspotsPanelProps {
  hotspots: Hotspot[];
  isPlacing: boolean;
  onTogglePlacing: () => void;
  onUpdate: (id: string, patch: Partial<Hotspot>) => void;
  onDelete: (id: string) => void;
}

export function HotspotsPanel({
  hotspots,
  isPlacing,
  onTogglePlacing,
  onUpdate,
  onDelete,
}: HotspotsPanelProps) {
  return (
    <div className="panel">
      <button className={isPlacing ? "place-btn active" : "place-btn"} onClick={onTogglePlacing}>
        {isPlacing ? "Click the model to place…" : "+ Add hotspot"}
      </button>

      {hotspots.length === 0 && <p className="empty">No hotspots yet.</p>}

      {hotspots.map((h) => (
        <div key={h.id} className="hotspot-card">
          <input
            className="hs-input"
            placeholder="Label"
            value={h.label}
            onChange={(e) => onUpdate(h.id, { label: e.target.value })}
          />
          <textarea
            className="hs-textarea"
            placeholder="Description (optional)"
            value={h.description ?? ""}
            onChange={(e) => onUpdate(h.id, { description: e.target.value })}
          />
          <input
            className="hs-input"
            placeholder="Link URL (optional)"
            value={h.url ?? ""}
            onChange={(e) => onUpdate(h.id, { url: e.target.value })}
          />
          <button className="hs-delete" onClick={() => onDelete(h.id)}>
            Remove
          </button>
        </div>
      ))}

      <style jsx>{`
        .panel { display: flex; flex-direction: column; gap: 12px; }
        .place-btn {
          padding: 10px; border-radius: 8px; border: 1px solid #0d9488;
          background: transparent; color: #0d9488; font-size: 13px; cursor: pointer;
        }
        .place-btn.active { background: #0d9488; color: #fff; }
        .empty { font-size: 12px; color: #8b8398; }
        .hotspot-card {
          display: flex; flex-direction: column; gap: 6px;
          padding: 10px; border: 1px solid #3a2a5c; border-radius: 8px;
          background: #150f24;
        }
        .hs-input, .hs-textarea {
          background: #1a1330; border: 1px solid #3a2a5c; border-radius: 6px;
          padding: 6px 8px; font-size: 12px; color: #eee; resize: vertical;
        }
        .hs-delete {
          align-self: flex-end; font-size: 11px; color: #f87171;
          background: none; border: none; cursor: pointer;
        }
      `}</style>
    </div>
  );
}
