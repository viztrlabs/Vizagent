'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['stats'] }

const COLS: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };

export function StatsBlock({ props }: Props) {
  return (
    <div className={`grid grid-cols-1 ${COLS[props.columns] ?? 'md:grid-cols-3'} gap-6`}>
      {props.items.map((item, i) => (
        <div key={i} className="text-center">
          <p className="font-display text-4xl font-bold text-white">
            {item.prefix}{item.value}{item.suffix}
          </p>
          <p className="mt-1 text-sm text-gray-400">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
