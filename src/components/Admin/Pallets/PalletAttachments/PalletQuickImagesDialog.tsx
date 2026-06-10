'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import PalletImagesTab from '@/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab';

interface PalletQuickImagesDialogProps {
  palletId: number | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLightboxIndex?: number;
}

export function PalletQuickImagesDialog({
  palletId,
  open,
  onOpenChange,
  initialLightboxIndex,
}: PalletQuickImagesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="5xl"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <div className="flex-shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-base font-semibold">
            Imágenes · Palet #{palletId}
          </DialogTitle>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <PalletImagesTab palletId={palletId} initialLightboxIndex={initialLightboxIndex} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
