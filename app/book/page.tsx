'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const services = [
  { id: 'tour', name: 'Virtual Tour', duration: 60, price: 299 },
  { id: 'xr', name: 'XR Configurator', duration: 90, price: 499 },
  { id: 'render', name: '3D Rendering', duration: 120, price: 799 },
];

export default function BookPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    date: '',
    time: '',
    projectType: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedServiceData = services.find(s => s.id === selectedService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !formData.date || !formData.time) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'demo-project',
          service: selectedService,
          date: formData.date,
          time: formData.time,
          duration: selectedServiceData?.duration || 60,
          client_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          project_type: formData.projectType,
        }),
      });

      if (response.ok) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-cyan/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white mb-4">Booking Confirmed!</h1>
          <p className="text-gray-400 mb-8">
            You'll receive a confirmation email shortly with session details and a Google Calendar invite.
          </p>
          <button
            onClick={() => router.push('/portal')}
            className="px-6 py-3 bg-cyan text-bg rounded-lg font-medium hover:bg-cyan/90 transition-colors min-h-touch"
          >
            View in Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="font-display text-3xl sm:text-5xl text-center mb-2">Book a Session</h1>
        <p className="text-gray-400 text-center mb-8 sm:mb-12 text-sm sm:text-base">
          Schedule your architectural visualization session
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-4">Select Service</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedService(service.id)}
                  className={`p-4 rounded-xl border text-left transition-all min-h-touch ${
                    selectedService === service.id
                      ? 'border-cyan bg-cyan/10'
                      : 'border-gray-800 bg-surface hover:border-gray-700'
                  }`}
                >
                  <p className="font-medium text-white">{service.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{service.duration} min</p>
                  <p className="text-lg font-bold text-cyan mt-2">${service.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan min-h-touch"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan min-h-touch"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan min-h-touch"
              required
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan min-h-touch"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan min-h-touch"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Project Type</label>
            <select
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan min-h-touch"
              required
            >
              <option value="">Select project type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="interior">Interior Design</option>
              <option value="landscape">Landscape</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan h-24 resize-none"
              placeholder="Any specific requirements or questions..."
            />
          </div>

          <button
            type="submit"
            disabled={!selectedService || submitting}
            className="w-full py-4 bg-cyan text-bg rounded-xl font-medium text-lg hover:bg-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
          >
            {submitting ? 'Booking...' : 'Book Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
