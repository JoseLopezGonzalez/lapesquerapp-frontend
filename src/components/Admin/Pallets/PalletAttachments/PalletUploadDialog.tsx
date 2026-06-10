'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { usePalletAttachments } from '@/hooks/pallets/usePalletAttachments';
import { UploadZone } from '@/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab';

interface PalletUploadDialogProps {
  palletId: number | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Llamado tras subir con éxito — úsalo para abrir la galería */
  onUploadSuccess?: () => void;
}

export function PalletUploadDialog({
  palletId,
  open,
  onOpenChange,
  onUploadSuccess,
}: PalletUploadDialogProps) {
  const { uploadMutation } = usePalletAttachments(palletId, { enabled: open });

  const handleFile = (file: File, notes: string) => {
    uploadMutation.mutate(
      { file, notes },
      { onSuccess: () => onUploadSuccess?.() }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <DialogTitle>Añadir imagen · Palet #{palletId}</DialogTitle>
        <UploadZone onFile={handleFile} isUploading={uploadMutation.isPending} />
      </DialogContent>
    </Dialog>
  );
}
