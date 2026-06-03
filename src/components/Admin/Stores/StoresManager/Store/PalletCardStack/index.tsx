'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PalletCardStackProps {
  children: React.ReactNode[];
  label?: string;
  className?: string;
}

export function PalletCardStack({ children, label, className }: PalletCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = children.length;

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || count === 0) return;
    const items = el.querySelectorAll<HTMLElement>('[data-stack-item]');
    const elCenter = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    items.forEach((item, i) => {
      const dist = Math.abs(item.offsetLeft + item.clientWidth / 2 - elCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }, [count]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateActiveIndex, { passive: true });
    updateActiveIndex();
    return () => el.removeEventListener('scroll', updateActiveIndex);
  }, [updateActiveIndex]);

  if (count === 0) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header row: label + counter */}
      {count > 1 && (
        <div className="flex items-center justify-between px-4">
          {label && (
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {label}
            </span>
          )}
          <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums">
            {activeIndex + 1} / {count}
          </span>
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory [gap:0.75rem] overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <div
            key={i}
            data-stack-item
            className={cn(
              'flex-shrink-0 snap-center transition-all duration-200',
              count === 1 ? 'w-full' : 'w-[calc(100%-1.25rem)]'
            )}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {count > 1 && count <= 10 && (
        <div className="flex justify-center gap-1.5 pb-1">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === activeIndex ? 'bg-foreground w-5' : 'bg-foreground/20 w-1.5'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
