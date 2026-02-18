'use client';

import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function Step2CameraScanner({ onScan, onClose, onError }) {
  const handleScan = (detectedCodes) => {
    const rawValue = detectedCodes?.[0]?.rawValue;
    if (rawValue) onScan?.(rawValue);
  };

  const handleError = (error) => {
    const message = error?.message ?? (typeof error === 'string' ? error : 'Error al acceder a la cámara.');
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
          styles={{
            container: { width: '100%', height: '100%' },
            video: { width: '100%', height: '100%', objectFit: 'cover' },
          }}
        />
      </div>
    </div>
  );
}
