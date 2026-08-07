'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadDropzone } from '@/components/upload/UploadDropzone';

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
}

interface QAReport {
  id: string;
  qaStatus: string;
  checks: { name: string; status: 'pass' | 'fail' | 'warning'; message: string }[];
  issues: string[];
  checkedAt: Date | null;
}

interface Deployment {
  id: string;
  environment: string;
  status: string;
  publicUrl: string | null;
  createdAt: Date;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  uploaded: 'bg-yellow-900/30 text-yellow-400',
  qa_pending: 'bg-orange-900/30 text-orange-400',
  qa_passed: 'bg-green-900/30 text-green-400',
  published: 'bg-cyan-900/30 text-cyan-400',
};

export function ProjectDetailClient({
  project,
  qaReport,
  assetCount,
  deployments,
}: {
  project: ProjectData;
  qaReport: QAReport | null;
  assetCount: number;
  deployments: Deployment[];
}) {
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; message: string } | null>(null);

  const canPublish = project.status === 'qa_passed';

  async function handlePublish() {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, environment: 'production' }),
      });
      const data = await res.json();
      if (res.ok) {
        setPublishResult({ ok: true, message: `Published! Public URL: ${data.publicUrl}` });
      } else {
        setPublishResult({ ok: false, message: data.error || 'Publish failed' });
      }
    } catch {
      setPublishResult({ ok: false, message: 'Network error' });
    } finally {
      setPublishing(false);
    }
  }

  async function handleRunQA() {
    try {
      await fetch('/api/qa/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      });
      window.location.reload();
    } catch {
      // silent
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-white">{project.name}</h1>
            {project.description && (
              <p className="text-gray-400 mt-1">{project.description}</p>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full ${statusColors[project.status] || 'bg-gray-800 text-gray-400'}`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>

        {/* QA Summary */}
        <section className="bg-surface rounded-xl border border-gray-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Quality Assurance</h2>
            <Button variant="secondary" size="sm" onClick={handleRunQA}>
              {qaReport ? 'Re-run QA' : 'Run QA'}
            </Button>
          </div>
          {qaReport ? (
            <div className="space-y-2">
              {qaReport.checks.map((check) => (
                <div key={check.name} className="flex items-start gap-2 text-sm">
                  <span className={check.status === 'pass' ? 'text-green-400' : 'text-red-400'}>
                    {check.status === 'pass' ? '✓' : '✗'}
                  </span>
                  <div>
                    <span className="text-white">{check.name}</span>
                    <span className="text-gray-400 ml-2">— {check.message}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No QA run yet. Run QA to validate before publishing.</p>
          )}
        </section>

        {/* Publish */}
        <section className="bg-surface rounded-xl border border-gray-800 p-5 mb-6">
          <h2 className="text-lg font-medium text-white mb-3">Publish</h2>
          <p className="text-sm text-gray-400 mb-4">
            {canPublish
              ? 'QA passed. This project is ready to publish.'
              : 'Publishing requires a passing QA run.'}
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={handlePublish} disabled={!canPublish || publishing}>
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
            {publishResult && (
              <span className={`text-sm ${publishResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                {publishResult.message}
              </span>
            )}
          </div>
        </section>

        {/* Assets */}
        <section className="bg-surface rounded-xl border border-gray-800 p-5 mb-6">
          <h2 className="text-lg font-medium text-white mb-3">Assets ({assetCount})</h2>
          <UploadDropzone projectId={project.id} onUploadComplete={() => window.location.reload()} />
        </section>

        {/* Deployment History */}
        {deployments.length > 0 && (
          <section className="bg-surface rounded-xl border border-gray-800 p-5">
            <h2 className="text-lg font-medium text-white mb-3">Deployment History</h2>
            <ul className="space-y-2">
              {deployments.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-white">{d.environment}</span>
                  <span className="text-gray-400">{new Date(d.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
