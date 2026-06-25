'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { OrderAttachment } from '@/services/domain/orders/orderAttachmentService';

interface UpdatePayload {
  attachmentId: number;
  notes: string | null;
}

interface OrderAttachmentEditNotesDialogProps {
  attachment: OrderAttachment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateMutation: UseMutationResult<unknown, unknown, UpdatePayload, unknown>;
}

export function OrderAttachmentEditNotesDialog({
  attachment,
  open,
  onOpenChange,
  updateMutation,
}: OrderAttachmentEditNotesDialogProps) {
  const [notes, setNotes] = useState(attachment.notes ?? '');

  useEffect(() => {
    if (open) setNotes(attachment.notes ?? '');
  }, [open, attachment.notes]);

  const handleSave = () => {
    updateMutation.mutate(
      { attachmentId: attachment.id, notes: notes.trim() || null },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" aria-describedby={undefined}>
        <DialogTitle>Editar notas</DialogTitle>

        <div className="space-y-4">
          <p className="text-muted-foreground truncate text-sm" title={attachment.originalName}>
            {attachment.originalName}
          </p>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notas</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Descripción del archivo..."
              className="resize-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
