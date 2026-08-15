'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

const assets = [
  { id: '1', name: 'Villa Exterior.glb', type: '3D Model', size: '24.5 MB', status: 'Ready', updated: '2h ago' },
  { id: '2', name: 'Living Room HDRI.hdr', type: 'Environment', size: '18.2 MB', status: 'Processing', updated: '4h ago' },
  { id: '3', name: 'Kitchen Texture.png', type: 'Texture', size: '8.4 MB', status: 'Ready', updated: '1d ago' },
  { id: '4', name: 'Reception Panorama.jpg', type: 'Panorama', size: '12.7 MB', status: 'Failed', updated: '2d ago' },
];

export function AssetListClient() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">File</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Size</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Uploaded</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-gray-900/50">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-cyan" />
                  </div>
                  <span className="font-medium text-white">{asset.name}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-gray-300">{asset.type}</td>
              <td className="py-4 px-4 text-sm text-gray-400">{asset.size}</td>
              <td className="py-4 px-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    asset.status === 'Ready'
                      ? 'bg-green-900/30 text-green-400'
                      : asset.status === 'Processing'
                        ? 'bg-blue-900/30 text-blue-400'
                        : asset.status === 'Failed'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {asset.status}
                </span>
              </td>
              <td className="py-4 px-4 text-sm text-gray-400">{asset.updated}</td>
              <td className="py-4 px-4 text-right">
                <Link href="/xr-console/assets/upload" className="text-cyan hover:text-cyan/80 text-sm font-medium">
                  Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
