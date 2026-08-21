'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['faq'] }

export function FaqBlock({ props }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {props.items.map((item, i) => (
        <div key={i} className="border border-gray-800 rounded-lg overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-900/50"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="font-medium text-white">{item.question}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
          </button>
          {(!props.collapsible || openIndex === i) && (
            <div className="px-4 pb-4 text-sm text-gray-400">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}
