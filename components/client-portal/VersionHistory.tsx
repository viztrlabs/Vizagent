'use client';

import React, { useState } from 'react';

interface Version {
  id: string;
  projectId: string;
  version: string;
  changes: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
}

interface VersionHistoryProps {
  versions: Version[];
  onCreate: (version: string, changes: Record<string, unknown>) => Promise<void>;
  onView: (id: string) => void;
  isStaff?: boolean;
}

export default function VersionHistory({ versions, onCreate, onView, isStaff }: VersionHistoryProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newChanges, setNewChanges] = useState('{}');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim()) return;
    try {
      setSubmitting(true);
      const changes = JSON.parse(newChanges);
      await onCreate(newVersion, changes);
      setShowCreateModal(false);
      setNewVersion('');
      setNewChanges('{}');
    } catch (err) {
      console.error('Failed to create version:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Version History ({versions.length})</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
        >
          Create Version
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No versions</h3>
          <p className="mt-2 text-gray-500">No versions created for this project yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <div key={version.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => onView(version.id)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                      v{version.version}
                    </span>
                    <span className="text-xs text-gray-500">
                      Created: {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-1 font-medium">Created by: {version.createdBy}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <pre className="bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                      {JSON.stringify(version.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create Version</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
                  Version (e.g., 1.0.0)
                </label>
                <input
                  id="version"
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="changes" className="block text-sm font-medium text-gray-700 mb-1">
                  Changes (JSON)
                </label>
                <textarea
                  id="changes"
                  value={newChanges}
                  onChange={(e) => setNewChanges(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  defaultValue="{}"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newVersion.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newVersion.trim()) return;
  try {
    setSubmitting(true);
    const changes = JSON.parse(newChanges);
    await onCreate(newVersion, changes);
    setShowCreateModal(false);
    setNewVersion('');
    setNewChanges('{}');
  } catch (err) {
    console.error('Failed to create version:', err);
  } finally {
    setSubmitting(false);
  }
};

export default VersionHistory;