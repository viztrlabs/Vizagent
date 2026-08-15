'use client';

import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';

interface HeroBlockProps {
  props: BlockProps['hero'];
}

export function HeroBlock({ props }: HeroBlockProps) {
  const { headline, subheadline, ctaText, ctaUrl, backgroundImage, backgroundVideo, alignment } = props;

  const backgroundStyle: React.CSSProperties = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <section
      className={cn(
        'relative min-h-[60vh] flex items-center justify-center overflow-hidden',
        alignment === 'left' && 'justify-start',
        alignment === 'right' && 'justify-end',
        alignment === 'center' && 'justify-center'
      )}
      style={backgroundStyle}
    >
      {backgroundVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover -z-10"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className={cn(
          'max-w-3xl',
          alignment === 'left' && 'text-left',
          alignment === 'center' && 'text-center',
          alignment === 'right' && 'text-right'
        )}>
          {props.headline && (
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              {props.headline}
            </h1>
          )}
          {props.subheadline && (
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl">
              {props.subheadline}
            </p>
          )}
          {props.ctaText && props.ctaUrl && (
            <a
              href={props.ctaUrl}
              className="inline-flex items-center gap-2 px-8 py-4 bg-cyan text-bg rounded-lg font-semibold text-lg hover:bg-cyan/90 transition-colors min-h-touch"
            >
              {props.ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}