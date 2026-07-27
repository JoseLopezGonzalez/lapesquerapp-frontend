'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, X, Loader2, FileText, ImageIcon, Sparkles, Plus, AlertCircle } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  inferCollection,
  validateAttachmentFile,
  type OrderAttachment,
  type OrderAttachmentCollection,
} from '@/services/domain/orders/orderAttachmentService';

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp';

interface UploadPayload {
  file: File;
  collection: OrderAttachmentCollection;
  notes?: string;
}

interface PendingAttachmentFile {
  id: string;
  file: File;
  collection: OrderAttachmentCollection;
  error: string | null;
}

interface OrderAttachmentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadMutation: UseMutationResult<OrderAttachment, unknown, UploadPayload, unknown>;
  initialFiles?: File[] | null;
}

function buildPendingFile(file: File): PendingAttachmentFile {
  const collection = inferCollection(file);
  return {
    id: crypto.randomUUID(),
    file,
    collection,
    error: validateAttachmentFile(file, collection),
  };
}

function PendingFileRow({
  item,
  onRemove,
  onToggleCollection,
}: {
  item: PendingAttachmentFile;
  onRemove: () => void;
  onToggleCollection: (next: OrderAttachmentCollection) => void;
}) {
  const Icon = item.collection === 'order_image' ? ImageIcon : FileText;
  const hasError = !!item.error;

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-lg border p-2.5',
        hasError ? 'border-destructive/50 bg-destructive/5' : 'border-border'
      )}
    >
      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={item.file.name}>
          {item.file.name}
        </p>
        {hasError ? (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {item.error}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            {(item.file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant={item.collection === 'order_document' ? 'secondary' : 'ghost'}
          size="icon-xs"
          onClick={() => onToggleCollection('order_document')}
          title="Marcar como documento"
          aria-label="Marcar como documento"
        >
          <FileText className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={item.collection === 'order_image' ? 'secondary' : 'ghost'}
          size="icon-xs"
          onClick={() => onToggleCollection('order_image')}
          title="Marcar como imagen"
          aria-label="Marcar como imagen"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onRemove}
          title="Quitar"
          aria-label="Quitar archivo"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function OrderAttachmentUploadDialog({
  open,
  onOpenChange,
  uploadMutation,
  initialFiles,
}: OrderAttachmentUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingAttachmentFile[]>([]);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyFiles = useCallback((files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files.map(buildPendingFile)]);
  }, []);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      applyFiles(initialFiles);
    }
  }, [initialFiles, applyFiles]);

  const reset = () => {
    setPendingFiles([]);
    setNotes('');
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleCollection = (id: string, next: OrderAttachmentCollection) => {
    setPendingFiles((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, collection: next, error: validateAttachmentFile(p.file, next) } : p
      )
    );
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) applyFiles(files);
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length) applyFiles(files);
    },
    [applyFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = async () => {
    const toUpload = pendingFiles.filter((p) => !p.error);
    if (!toUpload.length || isSubmitting) return;

    setIsSubmitting(true);
    const failedIds = new Set<string>();
    for (const item of toUpload) {
      try {
        await uploadMutation.mutateAsync({
          file: item.file,
          collection: item.collection,
          notes: notes || undefined,
        });
      } catch {
        failedIds.add(item.id);
      }
    }
    setIsSubmitting(false);

    setPendingFiles((prev) => prev.filter((p) => p.error || failedIds.has(p.id)));
    if (failedIds.size === 0) {
      setNotes('');
      onOpenChange(false);
    }
  };

  const hasPending = pendingFiles.length > 0;
  const validCount = pendingFiles.filter((p) => !p.error).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="lg" className="overflow-x-hidden" aria-describedby={undefined}>
        <DialogTitle>Adjuntar archivo al pedido</DialogTitle>

        <div className="space-y-4">
          {/* Zona drag-and-drop / lista de pendientes */}
          <div
            className={cn(
              'rounded-lg transition-colors',
              isDragging && 'ring-primary bg-primary/5 ring-2 ring-offset-2'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!hasPending ? (
              <div
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="text-muted-foreground h-8 w-8" />
                <div>
                  <p className="text-sm font-medium">
                    Arrastra uno o varios archivos o haz clic para seleccionar
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    PDF, Word, Excel · hasta 20 MB &nbsp;|&nbsp; Imágenes JPG/PNG/WEBP · hasta 10 MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {pendingFiles.map((item) => (
                    <PendingFileRow
                      key={item.id}
                      item={item}
                      onRemove={() => removeFile(item.id)}
                      onToggleCollection={(next) => toggleCollection(item.id, next)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Añadir más archivos
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Notas opcionales */}
          <div className="space-y-2">
            <Label htmlFor="attachment-notes" className="text-sm font-medium">
              Notas <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="attachment-notes"
              placeholder="Ej: Factura definitiva firmada"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              className="resize-none"
            />
            {pendingFiles.length > 1 && (
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                Se aplicará a todos los archivos de este envío.
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={validCount === 0 || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {validCount > 1 ? `Subir ${validCount} archivos` : 'Subir archivo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
