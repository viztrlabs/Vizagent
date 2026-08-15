'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts';

const COLORS = {
  cyan: '#00e5ff',
  violet: '#7c3aed',
  amber: '#f59e0b',
  emerald: '#10b981',
  surface: '#0d1117',
  border: '#30363d',
  text: '#e6edf3',
  textMuted: '#8b949e'
};

const CHART_COLORS = ['#00e5ff', '#7c3aed', '#f59e0b', '#10b981', '#ec4899', '#f97316', '#06b6d4'];

interface ViewsOverTimeData {
  date: string;
  views: number;
}

interface ProjectsByServiceData {
  service_type: string;
  count: number;
}

interface ProjectStatusData {
  status: string;
  count: number;
}

interface LineChartProps {
  data: ViewsOverTimeData[];
}

const viewsFormatter = (value: unknown) => 
  [typeof value === 'number' ? value.toLocaleString() : '0', 'Views'];

export function ViewsLineChart({ data }: LineChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center bg-surface/50 rounded-xl border border-border">
        <p className="text-textMuted">No view data available</p>
      </div>
    );
  }

  const maxViews = Math.max(...data.map(d => d.views));
  const tickCount = data.length > 15 ? 6 : data.length;

  return (
    <div className="h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="4 4" 
            stroke={COLORS.border} 
            vertical={false}
            horizontal={true}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'DM Sans' }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
            interval={Math.max(1, Math.floor(data.length / tickCount))}
          />
          <YAxis
            tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
            domain={[0, maxViews > 0 ? maxViews * 1.3 : 10]}
            tickCount={5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
              fontFamily: 'DM Sans',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            labelStyle={{ color: COLORS.textMuted, fontSize: 12 }}
            formatter={viewsFormatter}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke={COLORS.cyan}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: COLORS.cyan, strokeWidth: 2 }}
            strokeDasharray={maxViews === 0 ? '5 5' : undefined}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartProps {
  data: ProjectsByServiceData[];
}

const barFormatter = (value: unknown) => 
  [typeof value === 'number' ? value.toLocaleString() : '0', 'Projects'];

export function ServiceBarChart({ data }: BarChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center bg-surface/50 rounded-xl border border-border">
        <p className="text-textMuted">No project data available</p>
      </div>
    );
  }

  return (
    <div className="h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="4 4" 
            stroke={COLORS.border} 
            vertical={false}
            horizontal={true}
          />
          <XAxis
            dataKey="service_type"
            tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'DM Sans' }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
              fontFamily: 'DM Sans',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            labelStyle={{ color: COLORS.textMuted, fontSize: 12 }}
            formatter={barFormatter}
          />
          <Legend 
            layout="horizontal" 
            align="center" 
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: '8px' }}
          />
          <Bar
            dataKey="count"
            name="Projects"
            fill={COLORS.violet}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const pieFormatter = (value: unknown) => 
  [typeof value === 'number' ? value.toLocaleString() : '0', 'Projects'];

interface DoughnutChartProps {
  data: ProjectStatusData[];
}

export function StatusDoughnutChart({ data }: DoughnutChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center bg-surface/50 rounded-xl border border-border">
        <p className="text-textMuted">No status data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const renderLabel = (props: PieLabelRenderProps) => {
    const { percent, cx, cy } = props;
    const name = props.payload?.name || '';
    if (percent && percent > 0.1) {
      return (
        <text 
          x={cx} 
          y={cy} 
          fill={COLORS.text} 
          fontSize={12} 
          fontFamily="DM Sans"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {name} {(percent * 100).toFixed(0)}%
        </text>
      );
    }
    return null;
  };

  return (
    <div className="h-64 md:h-72 flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="count"
            nameKey="status"
            label={renderLabel}
            labelLine={false}
            stroke={COLORS.surface}
            strokeWidth={2}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
              fontFamily: 'DM Sans',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            labelStyle={{ color: COLORS.textMuted, fontSize: 12 }}
            formatter={pieFormatter}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((item, index) => (
          <div key={item.status} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="text-sm text-textMuted font-body">
              {item.status} ({(item.count / total * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <div className={`bg-surface/50 rounded-2xl border border-border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 font-body">{title}</h3>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}