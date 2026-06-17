'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Check, ScanLine, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playScanFail, playScanSuccess } from '@/lib/scannerSound';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

interface DetectedCode {
  rawValue?: string;
  cornerPoints?: ReadonlyArray<Point>;
}

export type QrValidateResult = { ok: true } | { ok: false; message: string };

export interface QrScannerWidgetProps {
  onScan: (rawValue: string) => void;
  onClose: () => void;
  onError?: (message: string) => void;
  statusText?: string;
  successText?: string;
  formats?: string[];
  validate?: (rawValue: string) => QrValidateResult;
}

type ScanPhase =
  | { type: 'searching' }
  | { type: 'detected'; rawValue: string; cornerPoints: ReadonlyArray<Point> }
  | { type: 'result'; rawValue: string; status: 'success' | 'fail'; message: string };

// ─── Camera constraints ────────────────────────────────────────────────────────

const CAMERA_CONSTRAINTS = {
  facingMode: 'environment',
  width: { ideal: 1280, min: 480, max: 1920 },
  height: { ideal: 960, min: 480, max: 1440 },
  frameRate: { ideal: 30, min: 15 },
};

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

  const pts = mapped.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <filter id="qr-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <polygon
        points={pts}
        fill="rgba(34,197,94,0.10)"
        stroke="rgb(34,197,94)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter="url(#qr-glow)"
      />
      {mapped.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="5"
          fill="rgb(34,197,94)"
          style={{ filter: 'drop-shadow(0 0 4px rgb(34,197,94))' }}
        />
      ))}
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
      {/* Radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: ok
            ? 'radial-gradient(circle at 50% 45%, rgba(34,197,94,0.28) 0%, rgba(34,197,94,0.10) 42%, transparent 68%)'
            : 'radial-gradient(circle at 50% 45%, rgba(239,68,68,0.28) 0%, rgba(239,68,68,0.10) 42%, transparent 68%)',
        }}
      />

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* QR + badge */}
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

        {/* Message */}
        <p
          className={cn(
            'text-center text-lg font-semibold drop-shadow-sm',
            ok ? 'text-green-400' : 'text-red-400',
          )}
          style={{ animation: 'qr-result-in 0.3s ease-out 0.15s both' }}
        >
          {message}
        </p>

        {/* Actions */}
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
              Cerrar ahora
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

function BottomBar({
  phase,
  statusText,
  onClose,
}: {
  phase: ScanPhase;
  statusText?: string;
  onClose: () => void;
}) {
  if (phase.type === 'result') return null;

  return (
    <div
      className="bg-background/95 fixed right-0 bottom-0 left-0 z-[110] flex flex-col gap-3 p-4 pt-3 backdrop-blur-sm"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      {phase.type === 'searching' && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <ScanLine className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm">
              {statusText ?? 'Apunta el código al encuadre'}
            </span>
          </div>
          <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" />
            Cerrar
          </Button>
        </div>
      )}

      {phase.type === 'detected' && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-primary">
            <Check className="h-4 w-4 shrink-0 animate-pulse" />
            <span className="truncate text-sm font-medium">Código detectado</span>
          </div>
          <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" />
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function QrScannerWidget({
  onScan,
  onClose,
  onError,
  statusText,
  successText = 'Código leído correctamente',
  formats = ['qr_code'],
  validate,
}: QrScannerWidgetProps) {
  const [phase, setPhase] = useState<ScanPhase>({ type: 'searching' });
  const containerRef = useRef<HTMLDivElement>(null);

  // phaseRef is kept manually in sync with every setPhase call to avoid
  // the async gap between setState and the sync-useEffect pattern. This
  // lets handleDetect/handleClose read the current phase synchronously
  // without stale-closure issues.
  const phaseRef = useRef<ScanPhase>(phase);

  // confirmTimerRef: set when entering detected phase; fires auto-confirm after
  // a brief visual pause showing the detection outline.
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Stable refs for parent callbacks so the auto-close timer never captures
  // a stale function and the effect never re-runs due to reference changes.
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Guard: true once onScan has been fired for the current successful scan,
  // so manual close and auto-close can never both fire it.
  const onScanFiredRef = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(confirmTimerRef.current ?? undefined);
      clearTimeout(autoCloseRef.current ?? undefined);
    },
    [],
  );

  // Auto-close 1800 ms after a successful result.
  // Only [phase] in deps — onScan/onClose are read through refs to prevent
  // the timer from being cancelled and rescheduled on every parent re-render.
  useEffect(() => {
    if (phase.type !== 'result' || phase.status !== 'success') return;
    onScanFiredRef.current = false; // reset for this result
    const { rawValue } = phase;
    autoCloseRef.current = setTimeout(() => {
      if (!onScanFiredRef.current) {
        onScanFiredRef.current = true;
        onScanRef.current(rawValue);
      }
      onCloseRef.current();
    }, 1800);
    return () => clearTimeout(autoCloseRef.current ?? undefined);
  }, [phase]);

  const handleDetect = useCallback(
    (codes: DetectedCode[]) => {
      // Only enter detected from searching — prevent re-triggering while
      // counting down to auto-confirm or while showing the result overlay.
      if (phaseRef.current.type !== 'searching') return;

      const code = codes[0];
      if (!code?.rawValue) return;

      const { rawValue, cornerPoints } = code;
      const detectedPhase: ScanPhase = {
        type: 'detected',
        rawValue,
        cornerPoints: cornerPoints ?? [],
      };
      phaseRef.current = detectedPhase;
      setPhase(detectedPhase);

      // Auto-confirm after a brief visual pause: show the detection outline,
      // then validate and transition to the result overlay automatically.
      // This avoids the UX trap of a confirm button appearing mid-gesture and
      // being accidentally tapped.
      confirmTimerRef.current = setTimeout(() => {
        if (phaseRef.current.type !== 'detected') return;
        const { rawValue: rv } = phaseRef.current;
        const result: QrValidateResult = validate ? validate(rv) : { ok: true };
        const resultPhase: ScanPhase = result.ok
          ? { type: 'result', rawValue: rv, status: 'success', message: successText }
          : { type: 'result', rawValue: rv, status: 'fail', message: result.message };
        phaseRef.current = resultPhase;
        if (result.ok) playScanSuccess();
        else playScanFail();
        setPhase(resultPhase);
      }, 800);
    },
    [validate, successText],
  );

  const handleRetry = useCallback(() => {
    clearTimeout(confirmTimerRef.current ?? undefined);
    const searching: ScanPhase = { type: 'searching' };
    phaseRef.current = searching;
    onScanFiredRef.current = false;
    setPhase(searching);
  }, []);

  const handleClose = useCallback(() => {
    clearTimeout(autoCloseRef.current ?? undefined);
    clearTimeout(confirmTimerRef.current ?? undefined);
    // Fire onScan if closing during a successful result, but only once.
    const current = phaseRef.current;
    if (current.type === 'result' && current.status === 'success' && !onScanFiredRef.current) {
      onScanFiredRef.current = true;
      onScanRef.current(current.rawValue);
    }
    onCloseRef.current();
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      const e = error as { message?: string };
      const message = e?.message ?? (typeof error === 'string' ? error : 'Error al acceder a la cámara.');
      onError?.(message);
    },
    [onError],
  );

  return (
    <div className="bg-background fixed inset-0 z-[100] flex flex-col">
      {/* Video + overlays */}
      <div ref={containerRef} className="relative min-h-0 w-full flex-1 pb-24">
        <Scanner
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onScan={handleDetect as any}
          onError={handleError}
          formats={formats as Parameters<typeof Scanner>[0]['formats']}
          constraints={CAMERA_CONSTRAINTS}
          scanDelay={150}
          styles={{
            container: {
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
            },
            video: { width: '100%', height: '100%', objectFit: 'cover' },
          }}
        />

        <CornerGuides active={phase.type === 'detected'} />

        {phase.type === 'searching' && <ScanBeam />}

        {phase.type === 'detected' && (
          <DetectionOverlay cornerPoints={phase.cornerPoints} containerRef={containerRef} />
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

      <BottomBar
        phase={phase}
        statusText={statusText}
        onClose={handleClose}
      />
    </div>
  );
}
