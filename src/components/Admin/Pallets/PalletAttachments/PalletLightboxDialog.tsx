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

  // Clamp index and auto-close when all images deleted
  useEffect(() => {
    if (!open) return;
    if (attachments.length === 0 && !isLoading) {
      onOpenChange(false);
    } else if (currentIndex >= attachments.length && attachments.length > 0) {
      setCurrentIndex(attachments.length - 1);
    }
  }, [attachments.length, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Loading shell — same dark bg as the lightbox for a seamless transition
  if (isLoading || attachments.length === 0) {
    return isLoading ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <Loader2 className="h-10 w-10 animate-spin text-white/40" />
      </div>
    ) : null;
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
