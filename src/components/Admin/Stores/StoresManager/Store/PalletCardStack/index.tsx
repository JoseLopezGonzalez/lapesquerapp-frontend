'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

const DECK_PRESET: Record<string, Omit<CardPresentation, 'pointerEvents'>> = {
  '-2': { x: -52, y: 24, scale: 0.88, rotate: -3, opacity: 0.35, zIndex: 10 },
  '-1': { x: -26, y: 12, scale: 0.94, rotate: -1.5, opacity: 0.72, zIndex: 20 },
  '0': { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, zIndex: 30 },
  '1': { x: 26, y: 12, scale: 0.94, rotate: 1.5, opacity: 0.72, zIndex: 20 },
  '2': { x: 52, y: 24, scale: 0.88, rotate: 3, opacity: 0.35, zIndex: 10 },
};

function getPresentation(offset: number): CardPresentation | null {
  const preset = DECK_PRESET[String(offset)];
  if (!preset) return null;
  return { ...preset, pointerEvents: offset === 0 ? 'auto' : 'none' };
}

export function PalletCardStack({ children, label, className }: PalletCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  // undefined = not yet measured (use auto height via ghost in flow)
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const ghostRef = useRef<HTMLDivElement>(null);
  const count = children.length;

  const goTo = useCallback(
    (i: number) => setActiveIndex(Math.max(0, Math.min(i, count - 1))),
    [count]
  );

  // ResizeObserver tracks the active card's rendered height via the ghost element.
  // When activeIndex changes React re-renders the ghost with new content → observer
  // fires with the new height → state update → CSS height transition animates.
  useEffect(() => {
    const el = ghostRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h) setContainerHeight(Math.ceil(h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (count === 0) return null;

  // After first measurement the ghost moves to absolute so it doesn't interfere
  // with the explicitly-sized container. Before measurement it stays in flow so
  // the container has a natural height (no flash of collapsed content).
  const ghostIsAbsolute = containerHeight !== undefined;

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

      {/*
       * Stage: no overflow-hidden so cards aren't clipped while height animates.
       * pb-8 provides room for the translateY(24px) of offset ±2 cards.
       * px-8 gives lateral breathing space for the side-card peek effect.
       */}
      <div className="relative isolate px-8 pt-2 pb-8">
        <div
          className="relative mx-auto w-full max-w-[480px]"
          style={{
            height: containerHeight ?? 'auto',
            // Only apply transition after the first measurement so the initial
            // render snaps to the correct height without an unwanted animation.
            transition: ghostIsAbsolute ? 'height 480ms cubic-bezier(0.22,1,0.36,1)' : undefined,
          }}
        >
          {/* Ghost: measures the active card height for the ResizeObserver.
              In normal flow before first measurement → provides auto height.
              Absolute thereafter → height is driven by explicit inline style. */}
          <div
            ref={ghostRef}
            className={cn(
              'pointer-events-none invisible w-full',
              ghostIsAbsolute && 'absolute inset-x-0 top-0'
            )}
            aria-hidden="true"
          >
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
