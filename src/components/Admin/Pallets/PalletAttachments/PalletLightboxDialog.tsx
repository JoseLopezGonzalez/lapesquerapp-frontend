'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { usePalletAttachments } from '@/hooks/pallets/usePalletAttachments';
import { Lightbox } from '@/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab';

interface PalletLightboxDialogProps {
  palletId: number | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

export function PalletLightboxDialog({
  palletId,
  open,
  onOpenChange,
  initialIndex = 0,
}: PalletLightboxDialogProps) {
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles: string[] = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const canDelete = roles.some((r) => r === 'administrador' || r === 'tecnico');

  const { attachments, isLoading, updateMutation, deleteMutation } = usePalletAttachments(
    palletId,
    { enabled: open }
  );

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [notesOverrides, setNotesOverrides] = useState<Map<number, string | null>>(new Map());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Sync index when dialog opens or initialIndex changes
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  // Clamp index and auto-close when all images deleted. Safe to include currentIndex and
  // onOpenChange: setCurrentIndex/onOpenChange are only invoked when the condition actually
  // requires a change, so this never loops.
  useEffect(() => {
    if (!open) return;
    if (attachments.length === 0 && !isLoading) {
      onOpenChange(false);
    } else if (currentIndex >= attachments.length && attachments.length > 0) {
      setCurrentIndex(attachments.length - 1);
    }
  }, [attachments.length, isLoading, open, currentIndex, onOpenChange]);

  const handleUpdateNotes = (id: number, notes: string | null) => {
    updateMutation.mutate({ attachmentId: id, notes });
    setNotesOverrides((prev) => new Map(prev).set(id, notes));
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId === null) return;
    deleteMutation.mutate(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  if (!open) return null;

  // Loading shell — dialog opens immediately, spinner stays contained inside
  if (isLoading || attachments.length === 0) {
    if (!isLoading) return null;
    return (
      <Dialog open onOpenChange={() => onOpenChange(false)}>
        <DialogContent
          className="flex max-h-[95vh] flex-col gap-0 overflow-hidden p-0"
          size="5xl"
          aria-describedby={undefined}
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Cargando imágenes…</DialogTitle>
          <div className="flex min-h-[400px] items-center justify-center bg-zinc-950">
            <Loader2 className="h-10 w-10 animate-spin text-white/40" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Lightbox
        attachments={attachments}
        currentIndex={Math.min(currentIndex, attachments.length - 1)}
        palletId={palletId}
        canDelete={canDelete}
        onDelete={setConfirmDeleteId}
        onUpdateNotes={handleUpdateNotes}
        onClose={() => onOpenChange(false)}
        onIndexChange={setCurrentIndex}
        isUpdating={updateMutation.isPending}
        notesOverrides={notesOverrides}
      />

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => { if (!o) setConfirmDeleteId(null); }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
