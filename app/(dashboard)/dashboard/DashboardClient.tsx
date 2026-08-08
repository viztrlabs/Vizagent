'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { StatsCards } from '@/components/dashboard/StatsCards';
import type { StatsData, ViewsOverTimeData, ProjectsByServiceData, ProjectStatusData, DateRange } from '@/lib/analytics';

const ViewsLineChart = lazy(() => import('@/components/dashboard/Charts').then(m => ({ default: m.ViewsLineChart })));
const ServiceBarChart = lazy(() => import('@/components/dashboard/Charts').then(m => ({ default: m.ServiceBarChart })));
const StatusDoughnutChart = lazy(() => import('@/components/dashboard/Charts').then(m => ({ default: m.StatusDoughnutChart })));
const ChartCard = lazy(() => import('@/components/dashboard/Charts').then(m => ({ default: m.ChartCard })));

interface DashboardData {
  stats: StatsData;
  viewsOverTime: ViewsOverTimeData[];
  projectsByService: ProjectsByServiceData[];
  projectStatus: ProjectStatusData[];
}

export function DashboardClient() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard?range=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h1 className="font-display text-4xl md:text-6xl text-cyan tracking-wide mb-4">Error</h1>
            <p className="text-gray-400 font-body">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-6 py-2 bg-cyan/20 border border-cyan/30 rounded-lg text-cyan font-body hover:bg-cyan/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-cyan tracking-wide">Dashboard</h1>
            <p className="mt-1 text-gray-400 font-body">Analytics overview for your projects</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-white font-body hover:border-cyan/50 transition-colors"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <Calendar className="w-4 h-4 text-cyan" />
                <span className="hidden sm:inline">{dateRangeOptions.find(o => o.value === dateRange)?.label}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-10 py-1">
                  {dateRangeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateRange(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left font-body text-sm transition-colors ${
                        dateRange === option.value
                          ? 'bg-cyan/10 text-cyan'
                          : 'text-gray-300 hover:bg-surface/50 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan/20 border border-cyan/30 rounded-lg text-cyan font-body hover:bg-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        {data && (
          <StatsCards 
            stats={data.stats}
            trends={undefined} // Could be added later with comparison data
          />
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Views Over Time - Line Chart */}
          <Suspense fallback={<div className="h-64 md:h-72 flex items-center justify-center bg-surface/50 rounded-xl border border-border"><p className="text-gray-500 font-body">Loading chart...</p></div>}>
            <ChartCard title="Views Over Time">
              {data ? (
                <ViewsLineChart data={data.viewsOverTime} />
              ) : (
                <div className="h-64 md:h-72 flex items-center justify-center bg-surface/50 rounded-xl border border-border">
                  <p className="text-gray-500 font-body">Loading...</p>
                </div>
              )}
            </ChartCard>
          </Suspense>

          {/* Projects by Service - Bar Chart */}
          <Suspense fallback={<div className="h-64 md:h-72 flex items-center justify-center bg-surface/50 rounded-xl border border-border"><p className="text-gray-500 font-body">Loading chart...</p></div>}>
            <ChartCard title="Projects by Service Type">
              {data ? (
                <ServiceBarChart data={data.projectsByService} />
              ) : (
                <div className="h-64 md:h-72 flex items-center justify-center bg-surface/50 rounded-xl border border-border">
                  <p className="text-gray-500 font-body">Loading...</p>
                </div>
              )}
            </ChartCard>
          </Suspense>
        </div>

        {/* Project Status Distribution - Doughnut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Suspense fallback={<div className="h-64 md:h-72 flex items-center justify-center bg-surface/50 rounded-xl border border-border"><p className="text-gray-500 font-body">Loading chart...</p></div>}>
            <ChartCard title="Project Status Distribution" className="lg:col-span-2">
              {data ? (
                <StatusDoughnutChart data={data.projectStatus} />
              ) : (
                <div className="h-64 md:h-72 flex items-center justify-center bg-surface/50 rounded-xl border border-border">
                  <p className="text-gray-500 font-body">Loading...</p>
                </div>
              )}
            </ChartCard>
          </Suspense>

          {/* Quick Stats Summary */}
          <Suspense fallback={<div className="h-64 flex items-center justify-center bg-surface/50 rounded-xl border border-border"><p className="text-gray-500 font-body">Loading...</p></div>}>
            <ChartCard title="Summary">
            {data ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan/20 rounded-lg">
                      <svg className="w-5 h-5 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 font-body">Total Projects</span>
                  </div>
                  <span className="font-display text-2xl text-white">{data.stats.totalProjects.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet/20 rounded-lg">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 font-body">Active Tours</span>
                  </div>
                  <span className="font-display text-2xl text-white">{data.stats.activeTours.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber/20 rounded-lg">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 font-body">Total Views</span>
                  </div>
                  <span className="font-display text-2xl text-white">{data.stats.totalViews.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald/20 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 font-body">Revenue</span>
                  </div>
                  <span className="font-display text-2xl text-white">${data.stats.revenue.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-surface/50 rounded-xl border border-border">
                <p className="text-gray-500 font-body">Loading...</p>
              </div>
            )}
          </ChartCard>
          </Suspense>
        </div>
      </div>
    </div>
  );
}