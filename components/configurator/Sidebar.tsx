'use client';

import { useState, useEffect } from 'react';
import { MaterialsPanel } from './MaterialsPanel';
import { LightingPanel } from './LightingPanel';
import { HotspotsPanel } from './HotspotsPanel';
import { ExportPanel } from './ExportPanel';
import { ARPanel } from './ARPanel';

interface SidebarProps {
  projectId: string;
}

const tabs = [
  { id: 'materials', label: 'Materials', icon: '🎨' },
  { id: 'lighting', label: 'Lighting', icon: '💡' },
  { id: 'hotspots', label: 'Hotspots', icon: '📍' },
  { id: 'export', label: 'Export', icon: '📤' },
  { id: 'ar', label: 'AR', icon: '📱' },
];

export function Sidebar({ projectId }: SidebarProps) {
  const [activeTab, setActiveTab] = useState('materials');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop sidebar
  if (!isMobile) {
    return (
      <div
        className={`h-full bg-surface border-l border-gray-800 transition-all duration-300 ${
          isCollapsed ? 'w-12' : 'w-80'
        }`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 right-4 p-2 bg-surface rounded-md hover:bg-surface/80 transition-colors z-10 min-h-touch min-w-touch"
        >
          {isCollapsed ? '→' : '←'}
        </button>

        {!isCollapsed && (
          <>
            <div className="flex border-b border-gray-800 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap min-h-touch ${
                    activeTab === tab.id
                      ? 'text-cyan border-b-2 border-cyan'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

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

  // Mobile: Bottom sheet with tab bar
  return (
    <>
      {/* Mobile Tab Bar - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-800 z-40 safe-bottom">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileOpen(true);
              }}
              className={`flex-1 flex flex-col items-center py-2 px-1 text-xs transition-colors min-h-touch ${
                activeTab === tab.id && isMobileOpen
                  ? 'text-cyan'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-lg mb-0.5">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 drawer-overlay"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-surface bottom-sheet safe-bottom max-h-[70vh]">
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-800">
              <h3 className="font-heading text-cyan">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-gray-400 hover:text-white min-h-touch min-w-touch"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)]">
              {activeTab === 'materials' && <MaterialsPanel />}
              {activeTab === 'lighting' && <LightingPanel />}
              {activeTab === 'hotspots' && <HotspotsPanel />}
              {activeTab === 'export' && <ExportPanel />}
              {activeTab === 'ar' && <ARPanel />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
