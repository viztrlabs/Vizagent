'use client';

import React, { useState } from 'react';

interface Deliverable {
  id: string;
  name: string;
  type: string;
  url: string;
  password?: string;
  expiresAt?: string;
  createdAt: string;
}

interface DeliverableDownloaderProps {
  deliverables: Deliverable[];
  onDownload: (id: string, password?: string) => Promise<void>;
  isStaff?: boolean;
}

export default function DeliverableDownloader({ deliverables, onDownload, isStaff }: DeliverableDownloaderProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [passwords, setPasswords] = useState<Record<string, string>>({});

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      await onDownload(id, passwords[id]);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Deliverables ({deliverables.length})</h2>
      
      {deliverables.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V16.5m-13.5-9L12 3m0 0l4.5 4.5M21 12c0 1.268-.63 2.42-1.6 3.27.4.55.8 1.1 1.2 1.2h.05c.4 0 .8-.45.8-1 0-.55-.4-1-.8-1H10.5a1 1 0 01-.707-1.707l4.5-4.5c.4-.4.4-1 0-1.5-.4-.4-1-.4-1.5 0L9.3 8.7c-.4.4-.4 1 0 1.5.1.1.2.2.3.3l3.7 3.7c.4.4 1 .4 1.5 0l4.9-4.9c.4-.4.4-1 0-1.5-.4-.4-1-.4-1.5 0L9.3 8.7c-.4.4-.4 1 0 1.5.1.1.2.2.3.3l3.7 3.7c.4.4 1 .4 1.5 0l4.9-4.9c.4-.4.4-1 0-1.5-.4-.4-1-.4-1.5 0L9.3 8.7c-.4.4-.4 1 0 1.5.1.1.2.2.3.3l3.7 3.7c.4.4 1 .4 1.5 0l4.9-4.9c.4-.4.4-1 0-1.5-.4-.4-1-.4-1.5 0l-3.7 3.7c-.3.3-.5.6-.6.7" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No deliverables</h3>
          <p className="mt-2 text-gray-500">No deliverables available for this project.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliverables.map((deliverable) => (
            <div key={deliverable.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{deliverable.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {deliverable.type}
                    </span>
                    {deliverable.expiresAt && new Date(deliverable.expiresAt) < new Date() && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span>Created: {new Date(deliverable.createdAt).toLocaleDateString()}</span>
                    {deliverable.expiresAt && (
                      <span>Expires: {new Date(deliverable.expiresAt).toLocaleDateString()}</span>
                    )}
                    {deliverable.password && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                        Password Protected
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Password (if required)"
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-48"
                    onChange={(e) => setPasswords({ ...passwords, [deliverable.id]: e.target.value })}
                    placeholder={deliverable.password ? 'Enter password' : ''}
                  />
                  <button
                    onClick={() => handleDownload(deliverable.id)}
                    disabled={downloadingId === deliverable.id}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {downloadingId === deliverable.id ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const handleDownload = async (id: string) => {
  setDownloadingId(id);
  try {
    await onDownload(id, passwords[id]);
  } finally {
    setDownloadingId(null);
  }
};

export default DeliverableDownloader;