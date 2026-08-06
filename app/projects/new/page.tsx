'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serviceType: 'tour',
    deadline: '',
    budget: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          service_type: formData.serviceType,
          deadline: formData.deadline || undefined,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
        }),
      });

      if (response.ok) {
        const { project } = await response.json();
        router.push(`/configurator/${project.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="font-display text-5xl text-center mb-2">New Project</h1>
        <p className="text-gray-400 text-center mb-12">
          Create a new architectural visualization project
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan"
              placeholder="e.g., Modern Villa Interior"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan h-24 resize-none"
              placeholder="Brief description of the project..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Service Type</label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan"
            >
              <option value="tour">Virtual Tour</option>
              <option value="xr">XR Configurator</option>
              <option value="render">3D Rendering</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Budget ($)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-2 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 bg-surface border border-gray-800 text-white rounded-lg font-medium hover:bg-surface/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-cyan text-bg rounded-lg font-medium hover:bg-cyan/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
