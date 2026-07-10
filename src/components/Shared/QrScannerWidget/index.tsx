'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Box,
  Check,
  ChevronLeft,
  Flashlight,
  FlashlightOff,
  Image as ImageIcon,
  Keyboard,
  ScanLine,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOBILE_HEIGHTS, MOBILE_TYPOGRAPHY } from '@/lib/design-tokens-mobile';
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
  /** Header title, centered — e.g. "Escanear cajas", "Localizar palet". */
  title?: string;
  /** Idle caption shown under the camera card while searching — e.g. "Apunta al QR del palet". */
  statusText?: string;
  successText?: string;
  formats?: string[];
  validate?: (rawValue: string) => QrValidateResult;
  boxCount?: number;
  sessionCount?: number;
  /** Help text shown inside the manual-entry drawer, adapted per consumer context. */
  manualEntryHelp?: string;
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

// ─── Main component ────────────────────────────────────────────────────────────

export function QrScannerWidget({
  backend = 'barcode-detector',
  onScan,
  onClose,
  onError,
  title = 'Escanear código',
  statusText = 'Coloca el código dentro del marco.',
  successText = 'Código leído correctamente',
  formats = ['qr_code', 'code_128'],
  validate,
  boxCount,
  sessionCount,
  manualEntryHelp = 'Introduce el código manualmente si no se puede escanear.',
}: QrScannerWidgetProps) {
  const [phase, setPhase] = useState<ScanPhase>({ type: 'searching' });
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { videoRef, canvasRef, isReady, torchSupported, torchOn, toggleTorch, decodeImage } = useBarcodeScanner({
    backend,
    formats,
    scanDelay: 100,
    onDetect: handleDetect,
    onError: handleError,
  });

  // Single entry point for turning a raw code string into a result phase —
  // shared by the live trigger, tap-to-select (multiple codes), the manual
  // entry drawer and the gallery upload flow, so validation/feedback never diverges.
  const processCode = useCallback(
    (rawValue: string) => {
      const value = rawValue.trim();
      if (!value) return;

      clearTimeout(lostDetectionRef.current ?? undefined);
      lostDetectionRef.current = null;

      const result: QrValidateResult = validate ? validate(value) : { ok: true };
      const newPhase: ScanPhase = result.ok
        ? { type: 'result', rawValue: value, status: 'success', message: successText }
        : { type: 'result', rawValue: value, status: 'fail', message: result.message };

      playTone(result.ok ? 'success' : 'fail');
      phaseRef.current = newPhase;
      setPhase(newPhase);
    },
    [validate, successText],
  );

  const handleConfirm = useCallback(() => {
    const current = phaseRef.current;
    if (current.type !== 'detected') return;
    processCode(current.rawValue);
  }, [processCode]);

  const handleConfirmCode = useCallback(
    (code: ScannedCode) => processCode(code.rawValue),
    [processCode],
  );

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

  const handleManualSubmit = useCallback(() => {
    const value = manualValue.trim();
    if (!value) return;
    setManualOpen(false);
    setManualValue('');
    processCode(value);
  }, [manualValue, processCode]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      const codes = await decodeImage(file);
      if (codes.length > 0) {
        processCode(codes[0].rawValue);
      } else {
        const newPhase: ScanPhase = {
          type: 'result',
          rawValue: '',
          status: 'fail',
          message: 'No se detectó ningún código en la imagen.',
        };
        playTone('fail');
        phaseRef.current = newPhase;
        setPhase(newPhase);
      }
    },
    [decodeImage, processCode],
  );

  const isResult = phase.type === 'result';
  const isSuccess = isResult && phase.type === 'result' && phase.status === 'success';
  const isError = isResult && phase.type === 'result' && phase.status === 'fail';
  const showActions = isError;
  const triggerActive = phase.type === 'detected';

  return (
    <div className="bg-background fixed inset-0 z-[100] flex flex-col">
      {/* Header */}
      <div className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center gap-2 px-3 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] pb-1">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Volver"
          className="text-foreground flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-foreground truncate text-center text-base font-medium">{title}</h2>
        <div />
      </div>

      {/* Scrollable content: camera card + caption + pill */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-2">
        <div className="relative w-full max-w-[330px] shrink-0">
          {/* Decorative "lens" brackets — purely visual, mirrors the design mockup */}
          <div className="border-foreground/70 pointer-events-none absolute inset-y-0 left-0 w-9 rounded-l-full border-2 border-r-0" />
          <div className="border-foreground/70 pointer-events-none absolute inset-y-0 right-0 w-9 rounded-r-full border-2 border-l-0" />

          <div
            ref={containerRef}
            className={cn(
              'relative mx-2 h-[380px] overflow-hidden rounded-[32px] bg-neutral-950 shadow-xl ring-4 transition-shadow duration-300',
              isSuccess && 'ring-green-500',
              isError && 'ring-red-500',
              !isResult && 'ring-transparent',
            )}
          >
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
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

            {isResult && (
              <div
                className={cn(
                  'absolute right-3 bottom-3 z-[3] flex h-11 w-11 items-center justify-center rounded-full shadow-lg',
                  isSuccess ? 'bg-green-500' : 'bg-red-500',
                )}
              >
                {isSuccess ? (
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                ) : (
                  <X className="h-5 w-5 text-white" strokeWidth={3} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        <div className="mt-5 min-h-[52px] w-full max-w-[280px] shrink-0 px-3 text-center">
          {isResult ? (
            <p className={cn('text-base font-medium', isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {phase.type === 'result' ? phase.message : ''}
            </p>
          ) : phase.type === 'multiple' ? (
            <p className="text-muted-foreground text-sm font-medium">Toca el código que quieres leer</p>
          ) : (
            <p className="text-muted-foreground text-sm font-medium">{statusText}</p>
          )}
        </div>

        {showActions && (
          <div className="mt-1 flex shrink-0 justify-center gap-2.5">
            <Button type="button" variant="secondary" size="sm" onClick={handleClose} className="rounded-full">
              Cerrar
            </Button>
            <Button type="button" size="sm" onClick={handleRetry} className="rounded-full">
              Volver a intentar
            </Button>
          </div>
        )}

        <div className="flex-1" />

        {/* Box counter pill */}
        {!isResult && boxCount !== undefined && (
          <div className="mb-4 flex shrink-0 justify-center">
            <div className="bg-muted flex items-center gap-3 rounded-full py-2 pr-5 pl-2">
              <span className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full">
                <Box className="h-4 w-4" />
              </span>
              <span className="text-foreground text-base font-medium">
                {boxCount}
                {sessionCount !== undefined && sessionCount > 0 && (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-green-600 dark:text-green-400">+{sessionCount}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="flex shrink-0 items-center justify-between px-6 pt-2"
        style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Subir foto desde la galería"
            className="bg-muted text-foreground flex h-[46px] w-[46px] items-center justify-center rounded-full transition-colors active:bg-muted/70"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {torchSupported && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-label={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              aria-pressed={torchOn}
              className={cn(
                'flex h-[46px] w-[46px] items-center justify-center rounded-full transition-colors',
                torchOn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground active:bg-muted/70',
              )}
            >
              {torchOn ? <Flashlight className="h-[18px] w-[18px]" /> : <FlashlightOff className="h-[18px] w-[18px]" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setManualOpen(true)}
            aria-label="Introducir código manual"
            className="bg-muted text-foreground flex h-[46px] w-[46px] items-center justify-center rounded-full transition-colors active:bg-muted/70"
          >
            <Keyboard className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!triggerActive}
          aria-label="Confirmar lectura"
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 disabled:pointer-events-none',
            triggerActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground/50',
          )}
        >
          <ScanLine className="h-6 w-6" strokeWidth={2.3} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Manual entry drawer */}
      <Drawer open={manualOpen} onOpenChange={setManualOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Introducir código manual</DrawerTitle>
            <DrawerDescription>{manualEntryHelp}</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-4 pb-2">
            <Input
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="Ej. BRS93658509581"
              autoFocus
              className={cn(MOBILE_HEIGHTS.INPUT, MOBILE_TYPOGRAPHY.INPUT)}
            />
          </div>
          <DrawerFooter>
            <Button type="button" onClick={handleManualSubmit} disabled={!manualValue.trim()}>
              Añadir
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
