'use client';

import { 
  FolderOpen, 
  Monitor, 
  Eye, 
  DollarSign,
  TrendingUp
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  color: 'cyan' | 'violet' | 'amber' | 'emerald';
  prefix?: string;
  suffix?: string;
}

const iconColors = {
  cyan: 'text-cyan',
  violet: 'text-violet-400',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400'
};

const bgColors = {
  cyan: 'bg-cyan-500/10 border-cyan-500/20',
  violet: 'bg-violet-500/10 border-violet-500/20',
  amber: 'bg-amber-500/10 border-amber-500/20',
  emerald: 'bg-emerald-500/10 border-emerald-500/20'
};

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color, 
  prefix = '', 
  suffix = '' 
}: StatsCardProps) {
  const trendColor = trend && trend > 0 ? 'text-emerald-400' : trend && trend < 0 ? 'text-red-400' : 'text-gray-500';
  const trendIcon = trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '→';

  return (
    <div className={`rounded-xl border p-6 transition-all hover:border-opacity-50 ${bgColors[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconColors[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            <span>{trendIcon}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl md:text-4xl font-display font-bold text-white tracking-wide">
          {prefix}{value}{suffix}
        </p>
        <p className="text-sm text-gray-400 font-body">{title}</p>
      </div>
    </div>
  );
}

export function StatsCards({ 
  stats, 
  trends 
}: { 
  stats: {
    totalProjects: number;
    activeTours: number;
    totalViews: number;
    revenue: number;
  };
  trends?: {
    totalProjects?: number;
    activeTours?: number;
    totalViews?: number;
    revenue?: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatsCard
        title="Total Projects"
        value={stats.totalProjects.toLocaleString()}
        icon={<FolderOpen className="w-6 h-6" />}
        trend={trends?.totalProjects}
        color="cyan"
      />
      <StatsCard
        title="Active Tours"
        value={stats.activeTours.toLocaleString()}
        icon={<Monitor className="w-6 h-6" />}
        trend={trends?.activeTours}
        color="violet"
      />
      <StatsCard
        title="Total Views"
        value={stats.totalViews.toLocaleString()}
        icon={<Eye className="w-6 h-6" />}
        trend={trends?.totalViews}
        color="amber"
      />
      <StatsCard
        title="Revenue"
        value={stats.revenue.toLocaleString()}
        icon={<DollarSign className="w-6 h-6" />}
        trend={trends?.revenue}
        color="emerald"
        prefix="$"
      />
    </div>
  );
}