'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProjectViewer from '@/components/client-portal/ProjectViewer';
import AnnotationThread from '@/components/client-portal/AnnotationThread';
import CommentThread from '@/components/client-portal/CommentThread';
import ApprovalWorkflow from '@/components/client-portal/ApprovalWorkflow';
import DeliverableDownloader from '@/components/client-portal/DeliverableDownloader';
import VersionHistory from '@/components/client-portal/VersionHistory';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  settings: {
    cameraHeight: number;
    autoRotate: boolean;
    hotspotStyle: string;
  };
}

export default function ClientDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'annotations' | 'comments' | 'approvals' | 'deliverables' | 'versions'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/client/portals?projectId=all');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('overview');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h2>
        <p className="text-gray-500">You don't have access to any projects yet.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'annotations', label: 'Annotations' },
    { id: 'comments', label: 'Comments' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'deliverables', label: 'Deliverables' },
    { id: 'versions', label: 'Versions' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h1>
          <p className="text-gray-500 mt-1">{selectedProject.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            selectedProject.status === 'published' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {selectedProject.status}
          </span>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 -mb-px" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ProjectViewer
                projectId={selectedProject.id}
                projectName={selectedProject.name}
                settings={selectedProject.settings}
              />
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Info</h3>
                <dl className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500">Status</dt>
                      <dd className="font-medium">{selectedProject.status}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Project ID</dt>
                      <dd className="font-medium font-mono text-sm">{selectedProject.id}</dd>
                    </div>
                  </div>
                </dl>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                <dl className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500">Camera Height</dt>
                      <dd className="font-medium">{selectedProject.settings?.cameraHeight || 1.7}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Auto Rotate</dt>
                      <dd className="font-medium">{selectedProject.settings?.autoRotate ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Hotspot Style</dt>
                      <dd className="font-medium capitalize">{selectedProject.settings?.hotspotStyle || 'pin'}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'annotations' && (
          <AnnotationThread
            annotations={[]}
            onAnnotationClick={() => {}}
            onResolve={() => {}}
            onDelete={() => {}}
          />
        )}

        {activeTab === 'comments' && (
          <CommentThread
            comments={[]}
            onAddComment={async () => {}}
            onDelete={async () => {}}
            currentUserId="current"
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalWorkflow
            approvals={[]}
            onRequest={async () => {}}
            onDecide={async () => {}}
            currentUserId="current"
            role="CLIENT"
          />
        )}

        {activeTab === 'deliverables' && (
          <DeliverableDownloader
            deliverables={[]}
            onDownload={async () => {}}
          />
        )}

        {activeTab === 'versions' && (
          <VersionHistory
            versions={[]}
            onCreate={async () => {}}
            onView={() => {}}
          />
        )}
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  return <ClientDashboard />;
}