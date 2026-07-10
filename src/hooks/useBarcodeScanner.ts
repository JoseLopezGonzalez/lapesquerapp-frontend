'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Selects the WASM decode engine:
 *   'barcode-detector' → ZXing WASM via the W3C BarcodeDetector ponyfill
 *   'zbar'             → ZBar WASM via @undecaf/zbar-wasm
 *
 * Both engines work on all browsers (iOS Safari included).
 * They differ in accuracy and format coverage — see docs/ai-context/12-qr-scanner-architecture.md.
 */
export type ScannerBackend = 'barcode-detector' | 'zbar';

export interface ScannedCode {
  rawValue: string;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}

interface UseBarcodeScanner {
  backend: ScannerBackend;
  /** W3C BarcodeFormat strings: 'qr_code', 'code_128', etc. */
  formats?: string[];
  /** Minimum ms between detection calls (default 100). */
  scanDelay?: number;
  /** Called every scanDelay ms. Empty array = nothing detected in that frame. */
  onDetect: (codes: ScannedCode[]) => void;
  onError: (error: Error) => void;
}

// ─── ZBar format names ─────────────────────────────────────────────────────────

// W3C BarcodeFormat name → ZBar typeName string
const ZBAR_TYPE_MAP: Record<string, string> = {
  qr_code: 'QR-Code',
  code_128: 'CODE-128',
  code_39: 'CODE-39',
  ean_13: 'EAN-13',
  ean_8: 'EAN-8',
  upca: 'UPC-A',
  upce: 'UPC-E',
};

// ─── Torch (flashlight) types ──────────────────────────────────────────────────

// `torch` is a real, widely-supported MediaTrackCapability on Android Chrome/Edge,
// but the DOM lib's MediaTrackCapabilities/MediaTrackConstraintSet types don't include it yet.
interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}
interface TorchConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useBarcodeScanner({
  backend,
  formats = ['qr_code', 'code_128'],
  scanDelay = 100,
  onDetect,
  onError,
}: UseBarcodeScanner) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Canvas is used only by the ZBar backend (needs ImageData, not a video element).
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef<number>(0);
  // Guard against concurrent async detections (ZXing is async, ZBar is async too).
  const isDetectingRef = useRef(false);

  // Stable callback refs — the RAF loop captures these by ref, not by closure,
  // so stale closure bugs can't occur even if the callbacks change between renders.
  const onDetectRef = useRef(onDetect);
  const onErrorRef = useRef(onError);
  useEffect(() => { onDetectRef.current = onDetect; }, [onDetect]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  type DetectFn = (video: HTMLVideoElement, canvas: HTMLCanvasElement | null) => Promise<ScannedCode[]>;
  const detectFnRef = useRef<DetectFn | null>(null);

  // Same decode backend, but fed a static bitmap instead of the live video —
  // used by decodeImage() for the "upload from gallery" flow.
  type DetectFromBitmapFn = (bitmap: ImageBitmap) => Promise<ScannedCode[]>;
  const detectFromBitmapRef = useRef<DetectFromBitmapFn | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // ── 1. Initialize detector (loads WASM lazily on first mount) ─────────────
  useEffect(() => {
    let cancelled = false;
    detectFnRef.current = null;
    detectFromBitmapRef.current = null;
    setDetectorReady(false);

    async function init() {
      try {
        if (backend === 'zbar') {
          // ZBar WASM: historically the most accurate barcode library for Code 128.
          // scanImageData() works on ImageData extracted from a canvas frame.
          const { scanImageData } = await import('@undecaf/zbar-wasm');
          if (cancelled) return;

          const allowedTypeNames = new Set(
            formats.map((f) => ZBAR_TYPE_MAP[f]).filter(Boolean),
          );

          const mapSymbols = (symbols: Awaited<ReturnType<typeof scanImageData>>): ScannedCode[] =>
            symbols
              .filter((s) => allowedTypeNames.size === 0 || allowedTypeNames.has(s.typeName))
              .map((s) => ({
                rawValue: s.decode(),
                // s.points is the polygon returned by ZBar (one point per corner)
                cornerPoints: s.points.map((p) => ({ x: p.x, y: p.y })),
              }));

          detectFnRef.current = async (_video, canvas) => {
            if (!canvas) return [];
            const ctx = canvas.getContext('2d');
            if (!ctx) return [];
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const symbols = await scanImageData(imageData);
            return mapSymbols(symbols);
          };

          detectFromBitmapRef.current = async (bitmap) => {
            const offscreen = document.createElement('canvas');
            offscreen.width = bitmap.width;
            offscreen.height = bitmap.height;
            const ctx = offscreen.getContext('2d');
            if (!ctx) return [];
            ctx.drawImage(bitmap, 0, 0);
            const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
            const symbols = await scanImageData(imageData);
            return mapSymbols(symbols);
          };
        } else {
          // BarcodeDetector ponyfill: ZXing C++ compiled to WASM, W3C API surface.
          // detect() accepts HTMLVideoElement directly — no canvas extraction needed.
          const { BarcodeDetector } = await import('barcode-detector/ponyfill');
          if (cancelled) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new BarcodeDetector({ formats: formats as any });

          detectFnRef.current = async (video) => {
            const barcodes = await detector.detect(video);
            return barcodes.map((b) => ({
              rawValue: b.rawValue,
              // cornerPoints is a 4-tuple of Point2D objects matching our overlay contract
              cornerPoints: b.cornerPoints.map((p) => ({ x: p.x, y: p.y })),
            }));
          };

          detectFromBitmapRef.current = async (bitmap) => {
            const barcodes = await detector.detect(bitmap);
            return barcodes.map((b) => ({
              rawValue: b.rawValue,
              cornerPoints: b.cornerPoints.map((p) => ({ x: p.x, y: p.y })),
            }));
          };
        }

        if (!cancelled) setDetectorReady(true);
      } catch (e) {
        if (!cancelled) onErrorRef.current(e as Error);
      }
    }

    init();
    return () => { cancelled = true; };
    // formats excluded: stable prop; detector only needs to reload when the engine changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  // ── 2. Start camera stream (once on mount, stops on unmount) ──────────────
  useEffect(() => {
    let cancelled = false;
    setCameraReady(false);
    setTorchSupported(false);
    setTorchOn(false);

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, min: 480, max: 1920 },
            height: { ideal: 960, min: 480, max: 1440 },
            frameRate: { ideal: 30, min: 15 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const track = stream.getVideoTracks()[0] ?? null;
        trackRef.current = track;

        // Torch support varies by browser/device (typically Android Chrome/Edge only —
        // iOS Safari does not expose it). Never assume it's there, always probe.
        try {
          const caps = track?.getCapabilities?.() as TorchCapabilities | undefined;
          if (!cancelled) setTorchSupported(Boolean(caps?.torch));
        } catch {
          if (!cancelled) setTorchSupported(false);
        }

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          if (!cancelled) setCameraReady(true);
        }
      } catch (e) {
        if (!cancelled) onErrorRef.current(e as Error);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      trackRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Torch control ───────────────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    const track = trackRef.current;
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as TorchConstraintSet] });
      setTorchOn(next);
    } catch {
      // Torch toggle failed at runtime (device claimed support but rejected the constraint) —
      // non-critical optional feature, fail silently and keep previous state.
    }
  }, [torchOn, torchSupported]);

  // ── Decode a static image (gallery upload) using the same active backend ──
  const decodeImage = useCallback(async (file: File): Promise<ScannedCode[]> => {
    if (!detectFromBitmapRef.current) return [];
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      return [];
    }
    try {
      return await detectFromBitmapRef.current(bitmap);
    } finally {
      bitmap.close();
    }
  }, []);

  // ── 3. Detection loop (RAF, throttled to scanDelay ms) ────────────────────
  useEffect(() => {
    if (!cameraReady || !detectorReady) return;

    let active = true;

    function loop(timestamp: number) {
      if (!active) return;
      rafRef.current = requestAnimationFrame(loop);

      if (timestamp - lastScanRef.current < scanDelay) return;
      lastScanRef.current = timestamp;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (!detectFnRef.current || isDetectingRef.current) return;

      // ZBar requires a fresh canvas snapshot of the current video frame.
      if (backend === 'zbar' && canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
      }

      isDetectingRef.current = true;
      detectFnRef.current(video, canvas)
        .then((codes) => { if (active) onDetectRef.current(codes); })
        .catch(() => { /* per-frame errors are intentionally silenced */ })
        .finally(() => { isDetectingRef.current = false; });
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraReady, detectorReady, backend, scanDelay]);

  return {
    videoRef,
    canvasRef,
    isReady: cameraReady && detectorReady,
    torchSupported,
    torchOn,
    toggleTorch,
    decodeImage,
  };
}
