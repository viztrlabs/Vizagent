'use client';

import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';

interface FeatureGridBlockProps {
  props: BlockProps['feature-grid'];
}

export function FeatureGridBlock({ props }: FeatureGridBlockProps) {
  const { items, columns } = props;

  return (
    <div
      className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${props.columns}`}
    >
      {props.items.map((item, index) => (
        <div
          key={index}
          className="bg-surface border border-gray-800 rounded-xl p-6 hover:border-cyan/50 transition-colors"
        >
          {item.icon && (
            <div className="w-12 h-12 rounded-lg bg-cyan/20 flex items-center justify-center mb-4 text-cyan">
              <span className="text-2xl">{item.icon}</span>
            </div>
          )}
          <h3 className="font-semibold text-white mb-2">{item.title}</h3>
          <p className="text-gray-400">{item.description}</p>
          {item.link && (
            <a
              href={item.link}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan hover:text-cyan/80 transition-colors"
            >
              Learn more →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}