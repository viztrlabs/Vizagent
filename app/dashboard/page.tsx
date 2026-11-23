'use client';

import { useState } from 'react';
import Link from 'next/link';

const mockProjects = [
  {
    id: '1',
    name: 'Modern Villa',
    status: 'published',
    updatedAt: '2026-08-05',
    thumbnail: '/api/placeholder/400/300',
  },
  {
    id: '2',
    name: 'Office Complex',
    status: 'qa_passed',
    updatedAt: '2026-08-04',
    thumbnail: '/api/placeholder/400/300',
  },
  {
    id: '3',
    name: 'Retail Space',
    status: 'draft',
    updatedAt: '2026-08-03',
    thumbnail: '/api/placeholder/400/300',
  },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  uploaded: 'bg-yellow-900/30 text-yellow-400',
  qa_pending: 'bg-orange-900/30 text-orange-400',
  qa_passed: 'bg-green-900/30 text-green-400',
  published: 'bg-cyan-900/30 text-cyan-400',
};

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = mockProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Projects</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage your architectural visualizations</p>
          </div>
          <Link
            href="/projects/new"
            className="px-6 py-3 bg-cyan text-bg rounded-lg font-medium hover:bg-cyan/90 transition-colors text-center min-h-touch"
          >
            + New Project
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan min-h-touch"
          />
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/configurator/${project.id}`}
              className="group bg-surface rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                  <span className="text-4xl">🏗️</span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status]}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-white group-hover:text-cyan transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Updated {project.updatedAt}
                </p>
              </div>
            </Link>
          ))}

          {/* Add New Project Card */}
          <Link
            href="/projects/new"
            className="bg-surface/50 rounded-xl border-2 border-dashed border-gray-800 overflow-hidden hover:border-gray-700 transition-all flex flex-col items-center justify-center min-h-[200px] sm:min-h-[280px]"
          >
            <span className="text-4xl text-gray-600 mb-2">+</span>
            <span className="text-gray-500">Create New Project</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
