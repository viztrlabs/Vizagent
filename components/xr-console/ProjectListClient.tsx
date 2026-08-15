'use client';

import Link from 'next/link';

const projects = [
  { id: '1', name: 'Modern Villa Tour', mode: 'Virtual Tour', status: 'Published', updated: '2h ago' },
  { id: '2', name: 'Office Complex WebXR', mode: 'WebXR', status: 'In Review', updated: '5h ago' },
  { id: '3', name: 'Retail AR Experience', mode: 'WebAR', status: 'Draft', updated: '1d ago' },
  { id: '4', name: 'Conference VR', mode: 'VR', status: 'Processing', updated: '2d ago' },
];

export function ProjectListClient() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Project</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Mode</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Updated</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-900/50">
              <td className="py-4 px-4">
                <Link
                  href={`/xr-console/projects/${project.id}`}
                  className="font-medium text-white hover:text-cyan transition-colors"
                >
                  {project.name}
                </Link>
              </td>
              <td className="py-4 px-4">
                <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300">{project.mode}</span>
              </td>
              <td className="py-4 px-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'Published'
                      ? 'bg-green-900/30 text-green-400'
                      : project.status === 'In Review'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : project.status === 'Processing'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {project.status}
                </span>
              </td>
              <td className="py-4 px-4 text-sm text-gray-400">{project.updated}</td>
              <td className="py-4 px-4 text-right">
                <Link
                  href={`/xr-console/projects/${project.id}`}
                  className="text-cyan hover:text-cyan/80 text-sm font-medium"
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
