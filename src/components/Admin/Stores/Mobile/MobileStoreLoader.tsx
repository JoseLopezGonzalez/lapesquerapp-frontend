'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Layers, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASES = [
  { icon: Package, text: 'Cargando palets' },
  { icon: MapPin, text: 'Mapeando posiciones' },
  { icon: BarChart3, text: 'Calculando estadísticas' },
  { icon: Layers, text: 'Preparando vista' },
] as const;

const COLS = 7;
const ROWS = 4;
const TOTAL = COLS * ROWS;

interface MobileStoreLoaderProps {
  storeName?: string;
}

export function MobileStoreLoader({ storeName }: MobileStoreLoaderProps) {
  const [phase, setPhase] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      const t = setTimeout(() => {
        setPhase((p) => (p + 1) % PHASES.length);
        setFadeIn(true);
      }, 300);
      return () => clearTimeout(t);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const PhaseIcon = PHASES[phase].icon;

  return (
    <>
      <style>{`
        @keyframes cellWave {
          0%, 100% { opacity: 0.12; transform: scale(0.82); }
          50% { opacity: 0.85; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.95); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes phaseIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotExpand {
          from { transform: scaleX(0.4); }
          to { transform: scaleX(1); }
        }
      `}</style>

      <div className="flex h-full flex-col items-center justify-center gap-10 bg-gradient-to-b from-background via-background to-primary/5 px-6 py-10">
        {/* Warehouse grid illustration */}
        <div className="relative flex items-center justify-center">
          {/* Ambient glow */}
          <div
            className="absolute h-44 w-64 rounded-3xl bg-primary/25 blur-3xl"
            style={{ animation: 'glowPulse 3s ease-in-out infinite' }}
          />

          {/* Grid container */}
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/20 p-3 shadow-lg backdrop-blur-sm">
            {/* Column labels */}
            <div
              className="mb-1.5 grid gap-1.5 px-0.5"
              style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
            >
              {Array.from({ length: COLS }).map((_, i) => (
                <div key={i} className="flex h-3 items-center justify-center">
                  <span className="text-muted-foreground/40 text-[7px] font-medium">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>

            {/* Animated cells */}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
              {Array.from({ length: TOTAL }).map((_, i) => {
                const col = i % COLS;
                const row = Math.floor(i / COLS);
                const delay = col * 110 + row * 180;
                return (
                  <div
                    key={i}
                    className="bg-primary h-8 w-8 rounded-lg"
                    style={{
                      animation: `cellWave 2.8s ease-in-out infinite`,
                      animationDelay: `${delay}ms`,
                    }}
                  />
                );
              })}
            </div>

            {/* Scanline overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-background/10 via-transparent to-background/20" />
          </div>
        </div>

        {/* Text content */}
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <h2 className="text-foreground text-xl font-bold tracking-tight">
            {storeName ?? 'Cargando almacén'}
          </h2>

          {/* Phase chip */}
          <div
            className="border-primary/25 bg-primary/10 flex items-center gap-2 rounded-full border px-4 py-2"
            style={
              fadeIn
                ? { animation: 'phaseIn 0.35s ease-out both' }
                : { opacity: 0, transition: 'opacity 0.25s ease-in' }
            }
          >
            <PhaseIcon className="text-primary h-3.5 w-3.5" />
            <span className="text-primary text-xs font-medium">{PHASES[phase].text}</span>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {PHASES.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'bg-primary h-1.5 rounded-full transition-all duration-500 ease-out',
                  i === phase ? 'w-6 opacity-100' : 'w-1.5 opacity-25'
                )}
                style={i === phase ? { animation: 'dotExpand 0.35s ease-out both' } : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
