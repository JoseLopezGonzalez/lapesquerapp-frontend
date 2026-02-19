'use client';

import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/** Constraints recomendados por la doc para móvil: cámara trasera y resoluciones permisivas */
const CAMERA_CONSTRAINTS = {
  facingMode: 'environment',
  width: { ideal: 1280, min: 480, max: 1920 },
  height: { ideal: 960, min: 480, max: 1440 },
  frameRate: { ideal: 30, min: 15 },
};

export default function Step2CameraScanner({ onScan, onClose, onError, boxesCount = 0 }) {
  const handleScan = (detectedCodes) => {
    const rawValue = detectedCodes?.[0]?.rawValue;
    if (rawValue) onScan?.(rawValue);
  };

  const handleError = (error) => {
    const message =
      error?.message ??
      (typeof error === 'string' ? error : null) ??
      (error?.name && error?.message ? `${error.name}: ${error.message}` : null) ??
      'Error al acceder a la cámara.';
    onError?.(message);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex-1 min-h-0 w-full pb-24">
        <Scanner
          onScan={handleScan}
          onError={handleError}
          formats={['qr_code']}
          constraints={CAMERA_CONSTRAINTS}
          scanDelay={3000}
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
        className="fixed bottom-0 left-0 right-0 z-[110] w-full bg-background/95 backdrop-blur-sm p-4 pt-3 flex flex-col gap-2"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between gap-3 min-h-8">
          <span className="text-sm font-medium text-muted-foreground">
            {boxesCount === 0
              ? 'Ninguna caja añadida'
              : boxesCount === 1
                ? '1 caja añadida'
                : `${boxesCount} cajas añadidas`}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="min-h-10 shrink-0"
            onClick={onClose}
            aria-label="Cerrar escáner"
          >
            <X className="h-5 w-5 mr-2" />
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
