'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Check, ScanLine, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playScanFail, playScanSuccess } from '@/lib/scannerSound';
import { useBarcodeScanner, type ScannerBackend, type ScannedCode } from '@/hooks/useBarcodeScanner';

// Re-export so callers only need to import from this file.
export type { ScannerBackend };

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

export type QrValidateResult = { ok: true } | { ok: false; message: string };

export interface QrScannerWidgetProps {
  /**
   * WASM decode engine to use:
   *   'barcode-detector' (default) → ZXing WASM via W3C BarcodeDetector ponyfill
   *   'zbar'                       → ZBar WASM via @undecaf/zbar-wasm
   * Both work on iOS Safari and Android Chrome.
   */
  backend?: ScannerBackend;
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

// ─── Coordinate mapping ────────────────────────────────────────────────────────
//
// The corner points returned by both backends are in video-pixel space
// (0,0 at top-left of the raw video frame, dimensions = video.videoWidth × videoHeight).
// The <video> element is rendered with objectFit: cover, so we must map those
// coordinates to CSS-pixel display space, accounting for the cover scale and offset.

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

function BottomBar({
  phase,
  statusText,
  onConfirm,
  onClose,
}: {
  phase: ScanPhase;
  statusText?: string;
  onConfirm: () => void;
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
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="lg"
            className="flex-1 text-base font-semibold"
            style={{
              backgroundImage:
                'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 30%, rgba(255,255,255,0.22) 50%, hsl(var(--primary)) 70%, hsl(var(--primary)) 100%)',
              backgroundSize: '200% auto',
              animation: 'qr-shimmer 1.6s linear infinite',
            }}
            onClick={onConfirm}
          >
            <Check className="mr-2 h-5 w-5" />
            Leer código
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="shrink-0 px-3"
            onClick={onClose}
            aria-label="Cerrar escáner"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function QrScannerWidget({
  backend = 'barcode-detector',
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

  const phaseRef = useRef<ScanPhase>(phase);

  // autoResetRef: after a successful result, auto-resets to 'searching' so the
  // scanner stays open and the user can scan more codes without reopening.
  const autoResetRef = useRef<ReturnType<typeof setTimeout>>(null);

  // lostDetectionRef: when the detection loop returns empty (QR left the frame),
  // we wait 400 ms before resetting to 'searching'. The debounce prevents flicker
  // caused by momentary tracking gaps as the user moves the camera.
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

  // After a successful result: fire onScan immediately, show the overlay for
  // 1500 ms, then auto-reset to 'searching' so more codes can be scanned.
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
    // Do not process detections while a result is being displayed.
    if (phaseRef.current.type === 'result') return;

    if (codes.length === 0) {
      // Nothing detected this frame. If we were in 'detected' state, start the
      // debounce: if still empty after 400 ms, reset to 'searching' so the button
      // disappears and the user knows the code is no longer in frame.
      if (phaseRef.current.type === 'detected' && !lostDetectionRef.current) {
        lostDetectionRef.current = setTimeout(() => {
          lostDetectionRef.current = null;
          if (phaseRef.current.type === 'detected') {
            const searching: ScanPhase = { type: 'searching' };
            phaseRef.current = searching;
            setPhase(searching);
          }
        }, 400);
      }
      return;
    }

    // Code found — cancel any pending "lost" timer and update the overlay.
    // Because the detection loop fires every ~100 ms, cornerPoints update on
    // every frame: the SVG highlight tracks the code live as the camera moves.
    clearTimeout(lostDetectionRef.current ?? undefined);
    lostDetectionRef.current = null;

    const code = codes[0];
    const newPhase: ScanPhase = {
      type: 'detected',
      rawValue: code.rawValue,
      cornerPoints: code.cornerPoints,
    };
    phaseRef.current = newPhase;
    setPhase(newPhase);
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

    // Cancel the "lost" timer — user confirmed before the 400 ms debounce fired.
    clearTimeout(lostDetectionRef.current ?? undefined);
    lostDetectionRef.current = null;

    const { rawValue } = current;
    const result: QrValidateResult = validate ? validate(rawValue) : { ok: true };
    const newPhase: ScanPhase = result.ok
      ? { type: 'result', rawValue, status: 'success', message: successText }
      : { type: 'result', rawValue, status: 'fail', message: result.message };

    phaseRef.current = newPhase;

    if (result.ok) playScanSuccess();
    else playScanFail();

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
    <div className="bg-background fixed inset-0 z-[100] flex flex-col">
      <div ref={containerRef} className="relative min-h-0 w-full flex-1 pb-24">
        {/*
          We own the <video> element entirely. No third-party library renders
          into this subtree, so there is no interference between the library's
          internal state and our own phase state machine.
        */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        {/*
          Hidden canvas used exclusively by the ZBar backend to extract a
          per-frame ImageData snapshot. The BarcodeDetector backend reads the
          video element directly and does not touch this canvas.
        */}
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
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  );
}
