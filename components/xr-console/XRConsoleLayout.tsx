'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Box,
  Globe,
  Headphones,
  Monitor,
  Settings,
  Users,
  BarChart3,
  DollarSign,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/xr-console', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/xr-console/projects', label: 'Projects', icon: Box },
  { href: '/xr-console/assets', label: 'Assets', icon: Box },
  { href: '/xr-console/xr-modes', label: 'XR Modes', icon: Globe },
  { href: '/xr-console/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/xr-console/team', label: 'Team', icon: Users },
  { href: '/xr-console/billing', label: 'Billing', icon: DollarSign },
  { href: '/xr-console/settings', label: 'Settings', icon: Settings },
];

export function XRConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-surface border-r border-gray-800 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            {!sidebarOpen ? (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-800"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ) : (
              <>
                <Link href="/xr-console" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan flex items-center justify-center">
                    <span className="text-lg font-bold text-bg">V</span>
                  </div>
                  <span className="font-display text-xl text-white">XR Console</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-800"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-touch',
                    isActive
                      ? 'bg-cyan/10 text-cyan'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-cyan' : 'text-gray-400')} />
                  <span className={cn('font-medium', !sidebarOpen && 'hidden')}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 text-center">
              VizTR XR Console v1.0
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 rounded-full bg-cyan text-bg shadow-lg"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Main content */}
      <main className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-16')}>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}