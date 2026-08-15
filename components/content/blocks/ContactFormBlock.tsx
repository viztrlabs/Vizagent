'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContactFormBlockProps {
  props: BlockProps['contact-form'];
}

export function ContactFormBlock({ props }: ContactFormBlockProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const response = await fetch(props.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStatus('success');
        setFormData({});
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {props.fields.map((field) => (
        <div key={field.name} className="space-y-1">
          <Label htmlFor={field.name} className="text-sm font-medium text-white">
            {field.label} {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          {field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              className="w-full"
            />
          ) : field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              required={field.required}
              className="w-full px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
            >
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              className="w-full"
            />
          )}
          {field.required && (
            <p className="text-xs text-gray-500">Required</p>
          )}
        </div>
      ))}
      <div className="flex items-center gap-4 pt-4">
        <Button type="submit" disabled={status === 'submitting'} className="w-full sm:w-auto">
          {status === 'submitting' ? 'Sending...' : props.submitText}
        </Button>
        {status === 'success' && (
          <span className="text-green-400 text-sm">{props.successMessage}</span>
        )}
        {status === 'error' && (
          <span className="text-red-400 text-sm">Failed to send. Please try again.</span>
        )}
      </div>
    </form>
  );
}