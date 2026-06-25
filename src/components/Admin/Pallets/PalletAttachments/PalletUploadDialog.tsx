'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { usePalletAttachments } from '@/hooks/pallets/usePalletAttachments';
import { UploadZone } from '@/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab';
import { useState } from 'react';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFiles = async (files: Array<{ file: File; notes: string }>) => {
    if (!files.length) return;
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    let anySuccess = false;
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadMutation.mutateAsync(files[i]);
        anySuccess = true;
      } catch {
        // error handled by mutation's onError
      }
      setUploadProgress({ current: i + 1, total: files.length });
    }
    setIsUploading(false);
    setUploadProgress(null);
    if (anySuccess) onUploadSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <DialogTitle>Añadir imagen · Palet #{palletId}</DialogTitle>
        <UploadZone
          onFiles={handleFiles}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      </DialogContent>
    </Dialog>
  );
}
