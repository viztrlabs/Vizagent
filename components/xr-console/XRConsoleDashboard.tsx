'use client';

import { cn } from '@/lib/utils';
import {
  Box,
  Globe,
  Monitor,
  Users,
  ExternalLink,
  Plus,
  Upload,
  MapPin,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={cn('text-sm mt-1', changeType === 'up' ? 'text-green-400' : 'text-red-400')}>
              {changeType === 'up' ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', `bg-${color}/20 text-${color}`)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

export function XRConsoleDashboard() {
  const router = useRouter();

  const stats = [
    { title: 'Total Projects', value: '24', change: '+12%', changeType: 'up' as const, icon: Box, color: 'cyan' },
    { title: 'Active XR Sessions', value: '7', change: '+2', changeType: 'up' as const, icon: Globe, color: 'blue' },
    { title: 'Active Streams', value: '3', change: '-1', changeType: 'down' as const, icon: Monitor, color: 'purple' },
    { title: 'Team Members', value: '12', change: '+3', changeType: 'up' as const, icon: Users, color: 'green' },
  ];

  const recentProjects = [
    { id: '1', name: 'Modern Villa Tour', mode: 'Virtual Tour', status: 'Published', updated: '2h ago', url: '/xr-console/projects/1' },
    { id: '2', name: 'Office Complex WebXR', mode: 'WebXR', status: 'In Review', updated: '5h ago', url: '/xr-console/projects/2' },
    { id: '3', name: 'Retail AR Experience', mode: 'WebAR', status: 'Draft', updated: '1d ago', url: '/xr-console/projects/3' },
    { id: '4', name: 'Conference VR', mode: 'VR', status: 'Processing', updated: '2d ago', url: '/xr-console/projects/4' },
  ];

  const quickActions = [
    { label: 'New Project', href: '/xr-console/projects/new', icon: 'Plus' },
    { label: 'Upload Asset', href: '/xr-console/assets/upload', icon: 'Upload' },
    { label: 'Create Tour', href: '/xr-console/tours/new', icon: 'MapPin' },
    { label: 'Start Stream', href: '/xr-console/streaming/new', icon: 'Play' },
  ];

  const quickActionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Plus,
    Upload,
    MapPin,
    Play,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-white">XR Console</h1>
          <p className="text-gray-400 mt-1">Manage your XR experiences across all platforms</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/xr-console/projects/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          <Button variant="secondary">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Live
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const ActionIcon = quickActionIcons[action.icon];
            return (
              <Link key={action.label} href={action.href}>
                <Button variant="secondary" className="w-full justify-start gap-2">
                  {ActionIcon && <ActionIcon className="w-5 h-5" />}
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
          <Link href="/xr-console/projects" className="text-sm text-cyan hover:text-cyan/80">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Project</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Mode</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Updated</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-900/50">
                  <td className="py-4 px-4">
                    <Link href={project.url} className="font-medium text-white hover:text-cyan transition-colors">
                      {project.name}
                    </Link>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300">{project.mode}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'Published' ? 'bg-green-900/30 text-green-400' :
                      project.status === 'In Review' ? 'bg-yellow-900/30 text-yellow-400' :
                      project.status === 'Processing' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-400">{project.updated}</td>
                  <td className="py-4 px-4 text-right">
                    <Link href={project.url} className="text-cyan hover:text-cyan/80 text-sm font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}