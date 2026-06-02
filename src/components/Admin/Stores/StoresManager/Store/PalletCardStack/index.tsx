'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PalletCardStackProps {
  children: React.ReactNode[];
  label?: string;
  className?: string;
}

interface CardPresentation {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  opacity: number;
  zIndex: number;
  pointerEvents: 'auto' | 'none';
}

const MOBILE_PRESET: Record<string, Omit<CardPresentation, 'pointerEvents'>> = {
  '-2': { x: -52, y: 24, scale: 0.88, rotate: -3, opacity: 0.35, zIndex: 10 },
  '-1': { x: -26, y: 12, scale: 0.94, rotate: -1.5, opacity: 0.72, zIndex: 20 },
  '0': { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, zIndex: 30 },
  '1': { x: 26, y: 12, scale: 0.94, rotate: 1.5, opacity: 0.72, zIndex: 20 },
  '2': { x: 52, y: 24, scale: 0.88, rotate: 3, opacity: 0.35, zIndex: 10 },
};

function getPresentation(offset: number): CardPresentation | null {
  const key = String(offset);
  const preset = MOBILE_PRESET[key];
  if (!preset) return null;
  return {
    ...preset,
    pointerEvents: offset === 0 ? 'auto' : 'none',
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
      {/* Header */}
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

      {/* Stage */}
      <div className="relative isolate overflow-hidden px-8 pt-2 pb-4 [perspective:1200px]">
        <div className="relative mx-auto w-full max-w-[480px]">
          {/* Ghost: invisible active card in normal flow → container auto-height */}
          <div className="pointer-events-none invisible" aria-hidden="true">
            {children[activeIndex]}
          </div>

          {children.map((child, i) => {
            const offset = i - activeIndex;
            const p = getPresentation(offset);
            if (!p) return null;
            const isActive = offset === 0;

            return (
              <div
                key={i}
                className={cn(
                  'absolute top-0 left-1/2 w-[min(100%,420px)]',
                  '[transition-property:transform,opacity,box-shadow]',
                  '[transition-duration:480ms]',
                  '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
                  'will-change-transform',
                  !isActive && 'cursor-pointer'
                )}
                style={{
                  zIndex: p.zIndex,
                  opacity: p.opacity,
                  transform: `translateX(calc(-50% + ${p.x}px)) translateY(${p.y}px) scale(${p.scale}) rotate(${p.rotate}deg)`,
                  transformOrigin: 'bottom center',
                  pointerEvents: p.pointerEvents,
                }}
                onClick={() => !isActive && goTo(i)}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
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
