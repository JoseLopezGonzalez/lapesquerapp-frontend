'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBarcodeScanner, type ScannerBackend, type ScannedCode } from '@/hooks/useBarcodeScanner';

export type { ScannerBackend };

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

export type QrValidateResult = { ok: true } | { ok: false; message: string };

export interface QrScannerWidgetProps {
  backend?: ScannerBackend;
  onScan: (rawValue: string) => void;
  onClose: () => void;
  onError?: (message: string) => void;
  statusText?: string;
  successText?: string;
  formats?: string[];
  validate?: (rawValue: string) => QrValidateResult;
  boxCount?: number;
  sessionCount?: number;
}

type ScanPhase =
  | { type: 'searching' }
  | { type: 'detected'; rawValue: string; cornerPoints: ReadonlyArray<Point> }
  | { type: 'multiple'; codes: ScannedCode[] }
  | { type: 'result'; rawValue: string; status: 'success' | 'fail'; message: string };

// ─── Coordinate mapping ────────────────────────────────────────────────────────

function mapToDisplay(
  cornerPoints: ReadonlyArray<Point>,
  container: HTMLElement | null,
): Point[] {
  const video = container?.querySelector('video');
  if (!(video instanceof HTMLVideoElement) || !video.videoWidth) {
    return cornerPoints.map((p) => ({ ...p }));
  }
  const vW = video.videoWidth;
  const vH = video.videoHeight;
  const dW = video.clientWidth;
  const dH = video.clientHeight;
  const scale = Math.max(dW / vW, dH / vH);
  const oX = (dW - vW * scale) / 2;
  const oY = (dH - vH * scale) / 2;
  return cornerPoints.map(({ x, y }) => ({ x: x * scale + oX, y: y * scale + oY }));
}

// Builds a rounded polygon SVG path. Uses quadratic bezier curves at each corner.
function roundedPolygonPath(points: Point[], radius = 12): string {
  if (points.length < 3) return '';
  const n = points.length;
  const segs: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const l1 = Math.hypot(v1.x, v1.y);
    const l2 = Math.hypot(v2.x, v2.y);
    const r = Math.min(radius, l1 / 2, l2 / 2);

    const p1 = { x: curr.x + (v1.x / l1) * r, y: curr.y + (v1.y / l1) * r };
    const p2 = { x: curr.x + (v2.x / l2) * r, y: curr.y + (v2.y / l2) * r };

    if (i === 0) segs.push(`M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`);
    else segs.push(`L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`);

    segs.push(`Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`);
  }
  segs.push('Z');
  return segs.join(' ');
}

function getBoundingBox(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

// ─── Audio feedback ───────────────────────────────────────────────────────────

function playTone(type: 'success' | 'fail') {
  try {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.connect(ctx.destination);

    const schedule = (freq: number, waveform: OscillatorType, startAt: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = waveform;
      osc.frequency.value = freq;
      osc.connect(env);
      env.connect(master);
      env.gain.setValueAtTime(0, ctx.currentTime + startAt);
      env.gain.linearRampToValueAtTime(volume, ctx.currentTime + startAt + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + startAt + duration + 0.05);
    };

    if (type === 'success') {
      // Ascending double-beep: 880 Hz → 1320 Hz (industrial scanner "confirmed" feel)
      schedule(880, 'sine', 0, 0.18, 0.9);
      schedule(1320, 'sine', 0.2, 0.22, 0.85);
    } else {
      // Descending buzzer: 440 Hz → 280 Hz square wave (prominent error alarm)
      schedule(440, 'square', 0, 0.22, 0.7);
      schedule(280, 'square', 0.25, 0.25, 0.7);
    }

    setTimeout(() => ctx.close(), 700);
  } catch {
    // AudioContext not available (SSR or sandboxed environment)
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CornerGuides({ active }: { active: boolean }) {
  const border = active ? 'border-primary' : 'border-white/60';
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-[11%] transition-all duration-300',
        active ? 'opacity-100' : 'opacity-50',
      )}
    >
      <div className={cn('absolute top-0 left-0 h-7 w-7 rounded-tl border-t-[3px] border-l-[3px]', border)} />
      <div className={cn('absolute top-0 right-0 h-7 w-7 rounded-tr border-t-[3px] border-r-[3px]', border)} />
      <div className={cn('absolute bottom-0 left-0 h-7 w-7 rounded-bl border-b-[3px] border-l-[3px]', border)} />
      <div className={cn('absolute bottom-0 right-0 h-7 w-7 rounded-br border-b-[3px] border-r-[3px]', border)} />
    </div>
  );
}

function ScanBeam() {
  return (
    <div
      className="pointer-events-none absolute left-[11%] right-[11%] h-px"
      style={{
        background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
        animation: 'qr-scan-line 1.8s ease-in-out infinite',
      }}
    />
  );
}

function DetectionOverlay({
  cornerPoints,
  containerRef,
}: {
  cornerPoints: ReadonlyArray<Point>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const mapped = mapToDisplay(cornerPoints, containerRef.current);
  if (mapped.length < 3) return null;

  const path = roundedPolygonPath(mapped, 14);
  const bb = getBoundingBox(mapped);

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <filter id="qr-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <clipPath id="qr-det-clip">
          <path d={path} />
        </clipPath>
        {/* Gradient for the sweep line: fade in/out at edges */}
        <linearGradient id="qr-sweep-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,197,94,0)" />
          <stop offset="40%" stopColor="rgba(34,197,94,0.8)" />
          <stop offset="60%" stopColor="rgba(34,197,94,0.8)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0)" />
        </linearGradient>
      </defs>

      {/* Subtle fill tint */}
      <path d={path} fill="rgba(34,197,94,0.07)" />

      {/* Solid base stroke */}
      <path
        d={path}
        fill="none"
        stroke="rgba(34,197,94,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Marching dash overlay — gives the "active scanner" feel */}
      <path
        d={path}
        fill="none"
        stroke="rgb(34,197,94)"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="10 5"
        filter="url(#qr-glow)"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="15"
          to="0"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </path>

      {/* Sweep line clipped to the detection polygon */}
      <line
        x1={bb.minX + 8}
        y1={bb.minY}
        x2={bb.maxX - 8}
        y2={bb.minY}
        stroke="rgba(34,197,94,0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
        clipPath="url(#qr-det-clip)"
      >
        <animate
          attributeName="y1"
          values={`${bb.minY.toFixed(1)};${bb.maxY.toFixed(1)};${bb.minY.toFixed(1)}`}
          dur="2s"
          repeatCount="indefinite"
          calcMode="ease-in-out"
        />
        <animate
          attributeName="y2"
          values={`${bb.minY.toFixed(1)};${bb.maxY.toFixed(1)};${bb.minY.toFixed(1)}`}
          dur="2s"
          repeatCount="indefinite"
          calcMode="ease-in-out"
        />
      </line>
    </svg>
  );
}

function MultipleDetectionOverlay({
  codes,
  containerRef,
  onSelect,
}: {
  codes: ScannedCode[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (code: ScannedCode) => void;
}) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <filter id="qr-multi-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {codes.map((code, i) => {
        const mapped = mapToDisplay(code.cornerPoints, containerRef.current);
        if (mapped.length < 3) return null;
        const path = roundedPolygonPath(mapped, 14);
        return (
          <g key={i} className="pointer-events-auto cursor-pointer" onClick={() => onSelect(code)}>
            <path d={path} fill="rgba(251,191,36,0.10)" />
            <path
              d={path}
              fill="none"
              stroke="rgba(251,191,36,0.45)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={path}
              fill="none"
              stroke="rgb(251,191,36)"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="10 5"
              filter="url(#qr-multi-glow)"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="15"
                to="0"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        );
      })}
    </svg>
  );
}

function ResultOverlay({
  rawValue,
  status,
  message,
  onRetry,
  onClose,
}: {
  rawValue: string;
  status: 'success' | 'fail';
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  const ok = status === 'success';

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center px-8"
      style={{ animation: 'qr-result-in 0.25s ease-out' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: ok
            ? 'radial-gradient(circle at 50% 45%, rgba(34,197,94,0.28) 0%, rgba(34,197,94,0.10) 42%, transparent 68%)'
            : 'radial-gradient(circle at 50% 45%, rgba(239,68,68,0.28) 0%, rgba(239,68,68,0.10) 42%, transparent 68%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="relative"
          style={{ animation: 'qr-result-scale 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <div
            className={cn(
              'overflow-hidden rounded-2xl bg-white p-3 shadow-2xl',
              ok ? 'ring-4 ring-green-400/70' : 'ring-4 ring-red-400/70',
            )}
          >
            <QRCode value={rawValue || ' '} size={148} />
          </div>

          <div
            className={cn(
              'absolute -right-3 -bottom-3 flex h-11 w-11 items-center justify-center rounded-full shadow-xl',
              ok ? 'bg-green-500' : 'bg-red-500',
            )}
            style={{ animation: 'qr-badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}
          >
            {ok ? (
              <Check className="h-6 w-6 text-white" strokeWidth={3} />
            ) : (
              <X className="h-6 w-6 text-white" strokeWidth={3} />
            )}
          </div>
        </div>

        <p
          className={cn(
            'text-center text-lg font-semibold drop-shadow-sm',
            ok ? 'text-green-400' : 'text-red-400',
          )}
          style={{ animation: 'qr-result-in 0.3s ease-out 0.15s both' }}
        >
          {message}
        </p>

        <div
          className="flex gap-3"
          style={{ animation: 'qr-result-in 0.3s ease-out 0.25s both' }}
        >
          {ok ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              Cerrar escáner
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={onClose}
                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Cerrar
              </Button>
              <Button size="lg" onClick={onRetry}>
                Volver a intentar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function QrScannerWidget({
  backend = 'barcode-detector',
  onScan,
  onClose,
  onError,
  successText = 'Código leído correctamente',
  formats = ['qr_code', 'code_128'],
  validate,
  boxCount,
  sessionCount,
}: QrScannerWidgetProps) {
  const [phase, setPhase] = useState<ScanPhase>({ type: 'searching' });
  const containerRef = useRef<HTMLDivElement>(null);

  const phaseRef = useRef<ScanPhase>(phase);
  const autoResetRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lostDetectionRef = useRef<ReturnType<typeof setTimeout>>(null);

  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const onScanFiredRef = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(autoResetRef.current ?? undefined);
      clearTimeout(lostDetectionRef.current ?? undefined);
    },
    [],
  );

  useEffect(() => {
    if (phase.type !== 'result' || phase.status !== 'success') return;

    if (!onScanFiredRef.current) {
      onScanFiredRef.current = true;
      onScanRef.current(phase.rawValue);
    }

    autoResetRef.current = setTimeout(() => {
      const searching: ScanPhase = { type: 'searching' };
      phaseRef.current = searching;
      onScanFiredRef.current = false;
      setPhase(searching);
    }, 1500);

    return () => clearTimeout(autoResetRef.current ?? undefined);
  }, [phase]);

  const handleDetect = useCallback((codes: ScannedCode[]) => {
    if (phaseRef.current.type === 'result') return;

    if (codes.length === 0) {
      if (
        (phaseRef.current.type === 'detected' || phaseRef.current.type === 'multiple') &&
        !lostDetectionRef.current
      ) {
        lostDetectionRef.current = setTimeout(() => {
          lostDetectionRef.current = null;
          if (phaseRef.current.type === 'detected' || phaseRef.current.type === 'multiple') {
            const searching: ScanPhase = { type: 'searching' };
            phaseRef.current = searching;
            setPhase(searching);
          }
        }, 400);
      }
      return;
    }

    clearTimeout(lostDetectionRef.current ?? undefined);
    lostDetectionRef.current = null;

    if (codes.length === 1) {
      const newPhase: ScanPhase = {
        type: 'detected',
        rawValue: codes[0].rawValue,
        cornerPoints: codes[0].cornerPoints,
      };
      phaseRef.current = newPhase;
      setPhase(newPhase);
    } else {
      const newPhase: ScanPhase = { type: 'multiple', codes };
      phaseRef.current = newPhase;
      setPhase(newPhase);
    }
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      onError?.(error.message ?? 'Error al acceder a la cámara.');
    },
    [onError],
  );

  const { videoRef, canvasRef, isReady } = useBarcodeScanner({
    backend,
    formats,
    scanDelay: 100,
    onDetect: handleDetect,
    onError: handleError,
  });

  const handleConfirm = useCallback(() => {
    const current = phaseRef.current;
    if (current.type !== 'detected') return;

    clearTimeout(lostDetectionRef.current ?? undefined);
    lostDetectionRef.current = null;

    const { rawValue } = current;
    const result: QrValidateResult = validate ? validate(rawValue) : { ok: true };
    const newPhase: ScanPhase = result.ok
      ? { type: 'result', rawValue, status: 'success', message: successText }
      : { type: 'result', rawValue, status: 'fail', message: result.message };

    playTone(result.ok ? 'success' : 'fail');
    phaseRef.current = newPhase;
    setPhase(newPhase);
  }, [validate, successText]);

  const handleConfirmCode = useCallback((code: ScannedCode) => {
    clearTimeout(lostDetectionRef.current ?? undefined);
    lostDetectionRef.current = null;

    const { rawValue } = code;
    const result: QrValidateResult = validate ? validate(rawValue) : { ok: true };
    const newPhase: ScanPhase = result.ok
      ? { type: 'result', rawValue, status: 'success', message: successText }
      : { type: 'result', rawValue, status: 'fail', message: result.message };

    playTone(result.ok ? 'success' : 'fail');
    phaseRef.current = newPhase;
    setPhase(newPhase);
  }, [validate, successText]);

  const handleRetry = useCallback(() => {
    clearTimeout(autoResetRef.current ?? undefined);
    clearTimeout(lostDetectionRef.current ?? undefined);
    lostDetectionRef.current = null;
    const searching: ScanPhase = { type: 'searching' };
    phaseRef.current = searching;
    onScanFiredRef.current = false;
    setPhase(searching);
  }, []);

  const handleClose = useCallback(() => {
    clearTimeout(autoResetRef.current ?? undefined);
    clearTimeout(lostDetectionRef.current ?? undefined);
    onCloseRef.current();
  }, []);

  return (
    <div className="bg-background fixed inset-0 z-[100]">
      {/* Full-screen camera view */}
      <div ref={containerRef} className="relative h-full w-full">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden />

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-sm text-white/70">Iniciando cámara…</span>
          </div>
        )}

        <CornerGuides active={phase.type === 'detected'} />

        {phase.type === 'searching' && <ScanBeam />}

        {phase.type === 'detected' && (
          <DetectionOverlay cornerPoints={phase.cornerPoints} containerRef={containerRef} />
        )}

        {phase.type === 'multiple' && (
          <MultipleDetectionOverlay
            codes={phase.codes}
            containerRef={containerRef}
            onSelect={handleConfirmCode}
          />
        )}

        {phase.type === 'result' && (
          <ResultOverlay
            rawValue={phase.rawValue}
            status={phase.status}
            message={phase.message}
            onRetry={handleRetry}
            onClose={handleClose}
          />
        )}
      </div>

      {/* Floating close button — top-right, always visible except during result overlay */}
      {phase.type !== 'result' && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Cerrar escáner"
          className="fixed right-4 z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
          style={{ top: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Box counter pill — top-left, symmetric to close button */}
      {phase.type !== 'result' && boxCount !== undefined && (
        <div
          className="fixed left-4 z-[110] flex h-11 items-center gap-1.5 rounded-full bg-black/40 px-4 text-sm text-white backdrop-blur-md"
          style={{ top: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
        >
          <span className="text-white/70">{boxCount}</span>
          {sessionCount !== undefined && sessionCount > 0 && (
            <>
              <span className="text-white/30">·</span>
              <span className="font-semibold text-green-400">+{sessionCount}</span>
            </>
          )}
        </div>
      )}

      {/* Hint pill — centered bottom, appears when multiple codes detected */}
      {phase.type === 'multiple' && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[110] flex justify-center"
          style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex h-12 items-center gap-2 rounded-full bg-black/50 px-6 text-sm text-white/80 backdrop-blur-md">
            Toca el código que quieres leer
          </div>
        </div>
      )}

      {/* Floating confirm button — centered bottom, appears when QR is detected */}
      {phase.type === 'detected' && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[110] flex justify-center"
          style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={handleConfirm}
            className="flex h-14 items-center gap-2.5 rounded-full px-10 text-base font-semibold text-white shadow-2xl transition-transform active:scale-95"
            style={{
              backgroundImage:
                'linear-gradient(90deg, var(--primary) 0%, var(--primary) 30%, rgba(255,255,255,0.22) 50%, var(--primary) 70%, var(--primary) 100%)',
              backgroundSize: '200% auto',
              animation: 'qr-shimmer 1.6s linear infinite',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            <Check className="h-5 w-5" strokeWidth={2.5} />
            Leer código
          </button>
        </div>
      )}
    </div>
  );
}
