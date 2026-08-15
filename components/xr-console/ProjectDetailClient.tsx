'use client';

import Link from 'next/link';
import { ArrowLeft, Box, FileText, Globe, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const overview = {
  id: '1',
  name: 'Modern Villa Tour',
  mode: 'Virtual Tour',
  status: 'Published',
  updated: '2h ago',
};

const stats = [
  { label: 'Assets', value: '14', icon: FileText, color: 'cyan' },
  { label: 'Deployments', value: '3', icon: Globe, color: 'blue' },
  { label: 'QA Status', value: 'Passed', icon: ShieldCheck, color: 'green' },
  { label: 'XR Views', value: '1,204', icon: Box, color: 'purple' },
];

const tabs = [
  { id: 'assets', label: 'Assets' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'qa', label: 'QA Reports' },
  { id: 'settings', label: 'Settings' },
];

export function ProjectDetailClient() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/xr-console/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">{overview.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300">{overview.mode}</span>
              <span className="px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400">{overview.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}/20 text-${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Project activity and management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 border-b border-gray-800 pb-4">
            {tabs.map((tab) => (
              <span key={tab.id} className="px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white cursor-pointer">
                {tab.label}
              </span>
            ))}
          </div>
          <p className="text-gray-400 mt-6">
            Select a tab to manage assets, deployments, and QA reports for this project.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
