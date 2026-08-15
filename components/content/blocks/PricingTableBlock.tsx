'use client';

import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';

interface PricingTableBlockProps {
  props: BlockProps['pricing-table'];
}

export function PricingTableBlock({ props }: PricingTableBlockProps) {
  const { plans, currency } = props;

  return (
    <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${props.plans.length}`}>
      {props.plans.map((plan, index) => (
        <div
          key={index}
          className={cn(
            'flex flex-col bg-surface border border-gray-800 rounded-xl p-6',
            plan.highlighted && 'border-cyan/50 shadow-[0_0_30px_rgba(0,229,255,0.1)]'
          )}
        >
          {plan.badge && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-cyan/20 text-cyan rounded-full mb-3">
              {plan.badge}
            </span>
          )}
          <h3 className="font-semibold text-white text-xl mb-1">{plan.name}</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold text-white">${plan.price}</span>
            <span className="text-gray-400">/{plan.period}</span>
          </div>
          <ul className="space-y-2 mb-6">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-300">
                <span className="w-5 h-5 text-cyan">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <a
            href={plan.ctaUrl}
            className="block w-full text-center px-4 py-3 bg-cyan text-bg rounded-lg font-medium hover:bg-cyan/90 transition-colors"
          >
            {plan.ctaText}
          </a>
        </div>
      ))}
    </div>
  );
}