// src/components/xr/panels/ExportPanel.tsx
"use client";

import { useState } from "react";

interface ExportPanelProps {
  posterUrl: string | null;
  onCapturePoster: () => void;
  onSaveAndPublish: () => Promise<{ viewerUrl: string; embedCode: string; qrCodeUrl: string } | null>;
  isSaving: boolean;
}

export function ExportPanel({
  posterUrl,
  onCapturePoster,
  onSaveAndPublish,
  isSaving,
}: ExportPanelProps) {
  const [published, setPublished] = useState<{
    viewerUrl: string;
    embedCode: string;
    qrCodeUrl: string;
  } | null>(null);

  const handlePublish = async () => {
    const result = await onSaveAndPublish();
    if (result) setPublished(result);
  };

  return (
    <div className="panel">
      <label className="panel-label">Poster</label>
      {posterUrl && <img src={posterUrl} alt="Poster preview" className="poster-preview" loading="lazy" />}
      <button className="secondary-btn" onClick={onCapturePoster}>
        Generate poster from current view
      </button>

      <button className="publish-btn" onClick={handlePublish} disabled={isSaving}>
        {isSaving ? "Publishing…" : "Save and publish"}
      </button>

      {published && (
        <div className="results">
          <Field label="Universal Viewer link" value={published.viewerUrl} />
          <Field label="Embed code" value={published.embedCode} isCode />
          <div className="qr-row">
            <span>QR code</span>
            <img src={published.qrCodeUrl} alt="QR code" width={72} height={72} loading="lazy" />
          </div>
        </div>
      )}

      <style jsx>{`
        .panel { display: flex; flex-direction: column; gap: 12px; }
        .panel-label {
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
          color: #a78bda; font-weight: 600;
        }
        .poster-preview {
          width: 100%; border-radius: 8px; border: 1px solid #3a2a5c;
        }
        .secondary-btn {
          padding: 8px; border-radius: 6px; border: 1px solid #3a2a5c;
          background: transparent; color: #ccc; font-size: 12px; cursor: pointer;
        }
        .publish-btn {
          padding: 12px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #6b21a8, #0d9488);
          color: #fff; font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .publish-btn:disabled { opacity: 0.6; cursor: default; }
        .results {
          display: flex; flex-direction: column; gap: 10px;
          padding-top: 8px; border-top: 1px solid #3a2a5c;
        }
        .qr-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #ccc; }
      `}</style>
    </div>
  );
}

function Field({ label, value, isCode }: { label: string; value: string; isCode?: boolean }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {isCode ? (
        <code className="field-code">{value}</code>
      ) : (
        <a href={value} target="_blank" rel="noreferrer" className="field-link">
          {value}
        </a>
      )}
      <style jsx>{`
        .field { display: flex; flex-direction: column; gap: 3px; }
        .field-label { font-size: 11px; color: #8b8398; }
        .field-code {
          font-size: 11px; background: #1a1330; padding: 6px; border-radius: 6px;
          word-break: break-all; color: #0d9488;
        }
        .field-link { font-size: 12px; color: #0d9488; word-break: break-all; }
      `}</style>
    </div>
  );
}
