'use client';

import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { ScanLine, X } from 'lucide-react';

const CAMERA_CONSTRAINTS = {
  facingMode: 'environment',
  width: { ideal: 1280, min: 480, max: 1920 },
  height: { ideal: 960, min: 480, max: 1440 },
  frameRate: { ideal: 30, min: 15 },
};

interface MobilePalletQrScannerProps {
  onScan: (rawValue: string) => void;
  onClose: () => void;
  onError: (message: string) => void;
}

export function MobilePalletQrScanner({ onScan, onClose, onError }: MobilePalletQrScannerProps) {
  const handleScan = (detectedCodes: Array<{ rawValue?: string }>) => {
    const rawValue = detectedCodes?.[0]?.rawValue;
    if (rawValue) onScan(rawValue);
  };

  const handleError = (error: unknown) => {
    const candidate = error as { message?: string; name?: string };
    const message =
      candidate?.message ||
      (typeof error === 'string' ? error : null) ||
      (candidate?.name && candidate?.message ? `${candidate.name}: ${candidate.message}` : null) ||
      'Error al acceder a la cámara.';
    onError(message);
  };

  return (
    <div className="bg-background fixed inset-0 z-[100] flex flex-col">
      <div className="min-h-0 w-full flex-1 pb-24">
        <Scanner
          onScan={handleScan}
          onError={handleError}
          formats={['qr_code']}
          constraints={CAMERA_CONSTRAINTS}
          scanDelay={1800}
          sound
          styles={{
            container: {
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            },
            video: { width: '100%', height: '100%', objectFit: 'cover', overflow: 'hidden' },
          }}
        />
      </div>
      <div
        className="bg-background/95 fixed right-0 bottom-0 left-0 z-[110] flex w-full flex-col gap-3 p-4 pt-3 backdrop-blur-sm"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex min-h-10 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ScanLine className="text-muted-foreground h-5 w-5 shrink-0" />
            <span className="text-muted-foreground truncate text-sm font-medium">
              Escanea el QR del palet
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="min-h-10 shrink-0"
            onClick={onClose}
            aria-label="Cerrar escáner"
          >
            <X className="mr-2 h-5 w-5" />
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
