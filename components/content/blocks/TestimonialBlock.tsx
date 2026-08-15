'use client';

import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';

interface TestimonialBlockProps {
  props: BlockProps['testimonial'];
}

export function TestimonialBlock({ props }: TestimonialBlockProps) {
  const { items, autoplay, interval } = props;

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 ease-out">
          {props.items.map((item, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 px-4"
            >
              <div className="bg-surface border border-gray-800 rounded-xl p-8 max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  {item.avatar && (
                    <img
                      src={item.avatar}
                      alt={item.author}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-white">{item.author}</p>
                    <p className="text-sm text-gray-400">
                      {item.role && item.company
                        ? `${item.role} at ${item.company}`
                        : item.role || item.company || ''
                      }
                    </p>
                  </div>
                </div>
                <blockquote className="text-lg text-gray-300 italic">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}