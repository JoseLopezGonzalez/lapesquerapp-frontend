'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, Loader2, FileText, ImageIcon, Sparkles } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  inferCollection,
  type OrderAttachment,
  type OrderAttachmentCollection,
} from '@/services/domain/orders/orderAttachmentService';

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp';

interface UploadPayload {
  file: File;
  collection: OrderAttachmentCollection;
  notes?: string;
}

interface OrderAttachmentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadMutation: UseMutationResult<OrderAttachment, unknown, UploadPayload, unknown>;
}

export function OrderAttachmentUploadDialog({
  open,
  onOpenChange,
  uploadMutation,
}: OrderAttachmentUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [collection, setCollection] = useState<OrderAttachmentCollection>('order_document');
  const [autoDetected, setAutoDetected] = useState(false);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setSelectedFile(null);
    setCollection('order_document');
    setAutoDetected(false);
    setNotes('');
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const applyFile = (file: File) => {
    const detected = inferCollection(file);
    setSelectedFile(file);
    setCollection(detected);
    setAutoDetected(true);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const detected = inferCollection(file);
    setSelectedFile(file);
    setCollection(detected);
    setAutoDetected(true);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = async () => {
    if (!selectedFile) return;
    try {
      await uploadMutation.mutateAsync(
        { file: selectedFile, collection, notes: notes || undefined },
        {
          onSuccess: () => {
            reset();
            onOpenChange(false);
          },
        }
      );
    } catch {
      // error handled by mutation's onError in useOrderAttachments
    }
  };

  const FilePreviewIcon = selectedFile?.type.startsWith('image/') ? ImageIcon : FileText;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="lg" className="overflow-x-hidden" aria-describedby={undefined}>
        <DialogTitle>Adjuntar archivo al pedido</DialogTitle>

        <div className="space-y-4">
          {/* Zona drag-and-drop */}
          {!selectedFile ? (
            <div
              className={cn(
                'flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="text-muted-foreground h-8 w-8" />
              <div>
                <p className="text-sm font-medium">Arrastra un archivo o haz clic para seleccionar</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  PDF, Word, Excel · hasta 20 MB &nbsp;|&nbsp; Imágenes JPG/PNG/WEBP · hasta 10 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-3 rounded-lg border p-3">
              <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded">
                <FilePreviewIcon className="text-muted-foreground h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => { setSelectedFile(null); setAutoDetected(false); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Tipo de adjunto */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Tipo de adjunto</Label>
              {autoDetected && (
                <span className="text-primary flex items-center gap-1 text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  Auto-detectado
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de adjunto">
              {(
                [
                  { value: 'order_document', label: 'Documento', sub: 'PDF, Word, Excel', Icon: FileText },
                  { value: 'order_image', label: 'Imagen / Foto', sub: 'JPG, PNG, WEBP', Icon: ImageIcon },
                ] as const
              ).map(({ value, label, sub, Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  role="radio"
                  aria-checked={collection === value}
                  onClick={() => { setCollection(value); setAutoDetected(false); }}
                  className={cn(
                    'h-auto justify-start whitespace-normal p-2.5 text-left',
                    collection === value
                      ? 'border-primary bg-primary/10 hover:bg-primary/10'
                      : 'hover:border-primary/40 hover:bg-muted/40'
                  )}
                >
                  <div className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight" title={label}>
                      {label}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{sub}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

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
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Subir archivo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
