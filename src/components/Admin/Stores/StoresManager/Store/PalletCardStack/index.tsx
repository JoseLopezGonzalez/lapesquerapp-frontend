'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PalletCardStackProps {
  children: React.ReactNode[];
  label?: string;
  className?: string;
}

const DECK_CONFIG = [
  { tx: 0, scale: 1.0, opacity: 1.0, z: 10 },
  { tx: 28, scale: 0.9, opacity: 0.55, z: 8 },
  { tx: 44, scale: 0.8, opacity: 0.28, z: 6 },
] as const;

function getCardStyle(offset: number): React.CSSProperties | null {
  const abs = Math.abs(offset);
  if (abs >= DECK_CONFIG.length) return null;
  const { tx, scale, opacity, z } = DECK_CONFIG[abs];
  const dir = offset >= 0 ? 1 : -1;
  return {
    transform: `translateX(${dir * tx}%) scale(${scale})`,
    opacity,
    zIndex: z,
  };
}

export function PalletCardStack({ children, label, className }: PalletCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const count = children.length;

  const goTo = useCallback(
    (i: number) => setActiveIndex(Math.max(0, Math.min(i, count - 1))),
    [count]
  );

  if (count === 0) return null;

  return (
    <div
      className={cn('flex flex-col gap-4 select-none', className)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        touchDelta.current = 0;
      }}
      onTouchMove={(e) => {
        touchDelta.current = e.touches[0].clientX - touchStartX.current;
      }}
      onTouchEnd={() => {
        if (touchDelta.current < -40) goTo(activeIndex + 1);
        else if (touchDelta.current > 40) goTo(activeIndex - 1);
      }}
    >
      {(label || count > 1) && (
        <div className="flex items-center justify-between px-4">
          {label && (
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {label}
            </span>
          )}
          {count > 1 && (
            <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums">
              {activeIndex + 1} / {count}
            </span>
          )}
        </div>
      )}

      <div className="relative mx-6">
        {/* Ghost element: invisible active card in normal flow → correct container height */}
        <div className="pointer-events-none invisible" aria-hidden="true">
          {children[activeIndex]}
        </div>

        {children.map((child, i) => {
          const offset = i - activeIndex;
          const style = getCardStyle(offset);
          if (!style) return null;
          const isActive = offset === 0;
          return (
            <div
              key={i}
              className={cn(
                'absolute inset-x-0 top-0 transition-all duration-300 ease-out',
                !isActive && 'cursor-pointer'
              )}
              style={style}
              onClick={() => !isActive && goTo(i)}
            >
              {child}
            </div>
          );
        })}
      </div>

      {count > 1 && count <= 12 && (
        <div className="flex justify-center gap-1.5 pb-1">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              aria-label={`Ir al palet ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === activeIndex ? 'bg-foreground w-5' : 'bg-foreground/25 w-1.5'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
