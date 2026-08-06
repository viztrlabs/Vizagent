'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { triggerOnce = true, ...observerOptions } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  // Memoize observer options to prevent recreation on every render
  const memoizedOptions = useMemo(
    () => ({
      root: observerOptions.root,
      rootMargin: observerOptions.rootMargin,
      threshold: observerOptions.threshold,
    }),
    [observerOptions.root, observerOptions.rootMargin, observerOptions.threshold]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      const intersecting = entry.isIntersecting;
      setIsIntersecting(intersecting);

      if (intersecting && triggerOnce && !hasTriggered) {
        setHasTriggered(true);
      }
    }, memoizedOptions);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [triggerOnce, hasTriggered, memoizedOptions]);

  return { ref: elementRef, isIntersecting, hasTriggered };
}

export function useLazyComponent(threshold = 0.1, rootMargin = '100px') {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return { ref, shouldLoad: isIntersecting };
}