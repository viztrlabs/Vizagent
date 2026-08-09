'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Upload, Video, Users, Settings, LayoutDashboard, VideoIcon, Upload as UploadIcon, Users as UsersIcon, Settings as SettingsIcon, LayoutDashboard as LayoutDashboardIcon } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Upload', icon: UploadIcon },
  { href: '/stream', label: 'Stream', icon: VideoIcon },
  { href: '/tour', label: 'Tours', icon: VideoIcon },
  { href: '/portal', label: 'Portal', icon: UsersIcon },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/admin/env-settings', label: 'Env Settings', icon: SettingsIcon },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-cyan-400">VizTR</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}