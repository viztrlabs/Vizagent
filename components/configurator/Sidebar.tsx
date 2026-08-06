'use client';

import { useState } from 'react';
import { MaterialsPanel } from './MaterialsPanel';
import { LightingPanel } from './LightingPanel';
import { HotspotsPanel } from './HotspotsPanel';
import { ExportPanel } from './ExportPanel';
import { ARPanel } from './ARPanel';

interface SidebarProps {
  projectId: string;
}

const tabs = [
  { id: 'materials', label: 'Materials' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'hotspots', label: 'Hotspots' },
  { id: 'export', label: 'Export' },
  { id: 'ar', label: 'AR' },
];

export function Sidebar({ projectId }: SidebarProps) {
  const [activeTab, setActiveTab] = useState('materials');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`h-full bg-surface border-l border-gray-800 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 right-4 p-2 bg-surface rounded-md hover:bg-surface/80 transition-colors z-10"
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {!isCollapsed && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan border-b-2 border-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="p-4 overflow-y-auto h-[calc(100%-48px)]">
            {activeTab === 'materials' && <MaterialsPanel />}
            {activeTab === 'lighting' && <LightingPanel />}
            {activeTab === 'hotspots' && <HotspotsPanel />}
            {activeTab === 'export' && <ExportPanel />}
            {activeTab === 'ar' && <ARPanel />}
          </div>
        </>
      )}
    </div>
  );
}