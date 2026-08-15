'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, MoreVertical, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  serviceType: string;
  createdAt: string;
  tenantId: string;
  clientId: string;
}

const SERVICE_LABELS: Record<string, string> = {
  tour: 'Virtual Tour',
  webxr: 'WebXR',
  webar: 'WebAR',
  vr: 'VR',
  streaming: 'Pixel Streaming',
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
};

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to load projects');
        const data = await res.json();
        if (!cancelled) setProjects(data.projects ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-1">No projects yet</h3>
        <p className="text-gray-400 text-sm mb-4">Create your first project to get started.</p>
        <Link href="/projects/new" className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan/50 bg-cyan text-bg hover:bg-cyan/90 px-4 py-2 text-sm min-h-touch">
          New Project
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card key={project.id} className="p-0 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{project.name}</h3>
                <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">
                  {project.description ?? 'No description'}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-gray-800 text-gray-400">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}`}>Open</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}/team`}>
                      <Users className="w-4 h-4 mr-2" /> Team
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_COLORS[project.status] ?? 'secondary'}>
                {project.status}
              </Badge>
              <span className="text-xs text-gray-500">
                {SERVICE_LABELS[project.serviceType] ?? project.serviceType}
              </span>
            </div>
          </div>
          <div className="px-5 py-3 bg-gray-900/50 border-t border-gray-800">
            <Link
              href={`/projects/${project.id}`}
              className="text-sm text-cyan hover:text-cyan/80 flex items-center gap-1"
            >
              <FolderOpen className="w-3.5 h-3.5" /> View project
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
