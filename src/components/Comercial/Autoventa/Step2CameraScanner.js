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

export default function Step2CameraScanner({ onScan, onClose, onError }) {
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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-end p-4">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="rounded-full"
          aria-label="Cerrar escáner"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 min-h-0 w-full">
        <Scanner
          onScan={handleScan}
          onError={handleError}
          formats={['qr_code']}
          constraints={CAMERA_CONSTRAINTS}
          scanDelay={1200}
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
    </div>
  );
}
