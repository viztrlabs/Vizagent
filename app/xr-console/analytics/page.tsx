import { XRConsoleLayout } from '@/components/xr-console/XRConsoleLayout';

export default function AnalyticsPage() {
  return (
    <XRConsoleLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Analytics</h1>
            <p className="text-gray-400 mt-1">Track performance across all your XR experiences</p>
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button className="px-4 py-2 bg-cyan text-bg rounded-lg font-medium hover:bg-cyan/90 transition-colors min-h-touch">
              Export Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <p className="text-sm text-gray-400">Total Views</p>
            <p className="text-3xl font-bold text-white mt-1">47.2K</p>
            <p className="text-sm text-green-400 mt-2">+12% vs last period</p>
          </div>
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <p className="text-sm text-gray-400">Unique Visitors</p>
            <p className="text-3xl font-bold text-white mt-1">12.8K</p>
            <p className="text-sm text-green-400 mt-2">+8% vs last period</p>
          </div>
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <p className="text-sm text-gray-400">Avg Session Time</p>
            <p className="text-3xl font-bold text-white mt-1">4m 32s</p>
            <p className="text-sm text-green-400 mt-2">+15% vs last period</p>
          </div>
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <p className="text-sm text-gray-400">Conversion Rate</p>
            <p className="text-3xl font-bold text-white mt-1">3.2%</p>
            <p className="text-sm text-red-400 mt-2">-0.5% vs last period</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Views by XR Mode</h3>
            <div className="space-y-4">
              {[
                { mode: 'Virtual Tour', views: '28.4K', percentage: 60, color: 'cyan' },
                { mode: 'WebXR', views: '11.2K', percentage: 24, color: 'blue' },
                { mode: 'WebAR', views: '5.1K', percentage: 11, color: 'purple' },
                { mode: 'VR', views: '2.1K', percentage: 4, color: 'purple' },
                { mode: 'Pixel Streaming', views: '0.5K', percentage: 1, color: 'orange' },
              ].map((item) => (
                <div key={item.mode} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-400">{item.mode}</span>
                  <div className="flex items-center gap-3 w-48">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${item.color === 'cyan' ? 'bg-cyan-500' : item.color === 'blue' ? 'bg-blue-500' : item.color === 'purple' ? 'bg-purple-500' : item.color === 'orange' ? 'bg-orange-500' : 'bg-gray-500'}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-16 text-right">{item.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Top Projects</h3>
            <div className="space-y-3">
              {[
                { name: 'Modern Villa Tour', views: '12.4K', mode: 'Tour', change: '+12%' },
                { name: 'Office Complex WebXR', views: '8.2K', mode: 'WebXR', change: '+8%' },
                { name: 'Retail AR Experience', views: '5.1K', mode: 'WebAR', change: '+22%' },
                { name: 'Conference VR', views: '3.2K', mode: 'VR', change: '-3%' },
                { name: 'Product Streaming', views: '1.8K', mode: 'Stream', change: '+45%' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <span className="text-xs text-gray-400">{item.mode}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{item.views}</p>
                    <span className="text-xs text-green-400">{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Engagement Over Time</h3>
          <div className="h-64 bg-gray-900/50 rounded-lg flex items-end justify-around p-4">
            {[
              { day: 'Mon', views: 45 },
              { day: 'Tue', views: 52 },
              { day: 'Wed', views: 38 },
              { day: 'Thu', views: 65 },
              { day: 'Fri', views: 71 },
              { day: 'Sat', views: 58 },
              { day: 'Sun', views: 42 },
            ].map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end px-2">
                <div
                  className="w-full bg-cyan-500 rounded-t transition-all duration-300 hover:bg-cyan-400"
                  style={{ height: `${item.views}%` }}
                  title={`${item.day}: ${item.views}K views`}
                />
                <span className="text-xs text-gray-500 mt-2">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </XRConsoleLayout>
  );
}