'use client';

import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['pricing'] }

export function PricingBlock({ props }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {props.plans.map((plan, i) => (
        <div
          key={i}
          className={cn(
            'rounded-xl border p-6 flex flex-col',
            plan.highlighted ? 'border-cyan bg-cyan/5' : 'border-gray-800 bg-surface'
          )}
        >
          {plan.badge && (
            <span className="self-start px-2 py-1 text-xs font-medium bg-cyan/20 text-cyan rounded mb-3">{plan.badge}</span>
          )}
          <h3 className="font-display text-lg text-white">{plan.name}</h3>
          <p className="mt-2 text-3xl font-bold text-white">
            {props.currency} {plan.price}
            <span className="text-sm font-normal text-gray-400">/{plan.period}</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-400 flex-1">
            {plan.features.map((f, j) => (
              <li key={j}>• {f}</li>
            ))}
          </ul>
          <a href={plan.ctaUrl} className="mt-6 inline-flex justify-center px-4 py-2 rounded-lg bg-cyan text-bg font-semibold text-sm hover:bg-cyan/90">
            {plan.ctaText}
          </a>
        </div>
      ))}
    </div>
  );
}
