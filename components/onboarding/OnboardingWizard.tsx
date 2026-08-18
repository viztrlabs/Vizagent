'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Check, ArrowRight, Sparkles, Box, Globe, Users } from 'lucide-react';
import { useAnalytics } from '@/lib/analytics/client';

const STORAGE_KEY = 'viztr-onboarding-completed';

interface Step {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  cta: string;
}

const steps: Step[] = [
  {
    key: 'welcome',
    title: 'Welcome to VizTR',
    description: 'Create immersive 3D and XR experiences for real estate. Let\'s get you started in 4 quick steps.',
    icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
    href: '/projects/new',
    cta: 'Create Your First Project',
  },
  {
    key: 'project_setup',
    title: 'Set Up a Project',
    description: 'Upload property photos, floor plans, or 3D scans. VizTR converts them into interactive walkthroughs.',
    icon: <Box className="w-6 h-6 text-indigo-600" />,
    href: '/projects/new',
    cta: 'Start a Project',
  },
  {
    key: 'first_asset',
    title: 'Upload Assets',
    description: 'Add 3D models, textures, and environments to your project library.',
    icon: <Box className="w-6 h-6 text-indigo-600" />,
    href: '/projects',
    cta: 'View Projects',
  },
  {
    key: 'publish',
    title: 'Publish an Experience',
    description: 'Deploy your project as a web tour, WebXR app, or VR experience.',
    icon: <Globe className="w-6 h-6 text-indigo-600" />,
    href: '/projects',
    cta: 'Go to Projects',
  },
  {
    key: 'team_invite',
    title: 'Invite Your Team',
    description: 'Collaborate with colleagues. Assign roles and manage access together.',
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    href: '/settings',
    cta: 'Manage Team',
  },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const { track } = useAnalytics();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setDismissed(true);
      return;
    }
    const completedSteps = localStorage.getItem(`${STORAGE_KEY}-steps`);
    if (completedSteps) {
      try {
        const parsed = JSON.parse(completedSteps) as string[];
        setCompleted(parsed);
        const nextIdx = steps.findIndex((s) => !parsed.includes(s.key));
        setCurrentStep(nextIdx >= 0 ? nextIdx : 0);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (currentStep === 0 && completed.length === 0 && !dismissed) {
      track('onboarding_step_completed', { step: 1, step_name: 'welcome' });
    }
  }, [currentStep, completed.length, dismissed, track]);

  if (dismissed) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const markComplete = (stepKey: string) => {
    const updated = [...new Set([...completed, stepKey])];
    setCompleted(updated);
    localStorage.setItem(`${STORAGE_KEY}-steps`, JSON.stringify(updated));

    track('onboarding_step_completed', {
      step: currentStep + 1,
      step_name: stepKey as 'welcome' | 'project_setup' | 'first_asset' | 'publish' | 'team_invite',
    });

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      track('onboarding_completed', { duration_ms: 0, steps_completed: updated.length });
      localStorage.setItem(STORAGE_KEY, 'true');
      setDismissed(true);
    }
  };

  const skip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  const progress = Math.round((completed.length / steps.length) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Getting Started</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {completed.length}/{steps.length}
          </span>
        </div>
        <button
          onClick={skip}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Skip all
        </button>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0 mt-1">{step.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{step.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <Link
          href={step.href}
          onClick={() => markComplete(step.key)}
          className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {step.cta}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={() => markComplete(step.key)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Mark done
        </button>
      </div>

      <div className="flex gap-1.5 mt-5">
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setCurrentStep(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentStep
                ? 'bg-indigo-600'
                : completed.includes(s.key)
                ? 'bg-green-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}