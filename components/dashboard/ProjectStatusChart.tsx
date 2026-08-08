'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface StatusDatum {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  uploaded: '#fbbf24',
  qa_pending: '#fb923c',
  qa_passed: '#4ade80',
  published: '#22d3ee',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  uploaded: 'Uploaded',
  qa_pending: 'QA Pending',
  qa_passed: 'QA Passed',
  published: 'Published',
};

export function ProjectStatusChart({ data }: { data: StatusDatum[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
    fill: STATUS_COLORS[d.status] ?? '#6b7280',
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        No project data yet. Create a project to see analytics.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1d24', border: '1px solid #2a2d36', borderRadius: 8 }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#d1d5db' }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
