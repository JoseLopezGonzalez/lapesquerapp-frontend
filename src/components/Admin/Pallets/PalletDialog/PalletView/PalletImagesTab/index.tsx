'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ImageIcon,
  Upload,
  Trash2,
  X,
  Loader2,
  Download,
  Pencil,
  Check,
  ImageOff,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import {
  usePalletAttachments,
  notifyIfInvalidPalletImageFile,
} from '@/hooks/pallets/usePalletAttachments';
import { palletAttachmentService, type PalletAttachment } from '@/services/domain/pallets/palletAttachmentService';
import { formatDateHour } from '@/helpers/formats/dates/formatDates';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Carga y cachea un blob URL, revocándolo al desmontar
function useImageBlobUrl(palletId: number | string, attachmentId: number) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    palletAttachmentService
      .getBlobUrl(palletId, attachmentId)
      .then((url) => {
        if (cancelled) { URL.revokeObjectURL(url); return; }
        urlRef.current = url;
        setSrc(url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [palletId, attachmentId]);

  return { src, loading };
}

interface ImageCardProps {
  attachment: PalletAttachment;
  palletId: number | string;
  canDelete: boolean;
  onDelete: (id: number) => void;
  onClick: () => void;
}

function ImageCard({ attachment, palletId, canDelete, onDelete, onClick }: ImageCardProps) {
  const { src, loading } = useImageBlobUrl(palletId, attachment.id);

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full bg-muted">
        {loading ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : src ? (
          <img src={src} alt={attachment.originalName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {canDelete && (
          <button
            className="absolute top-1.5 right-1.5 hidden rounded-md bg-black/60 p-1 text-white backdrop-blur-sm transition-colors hover:bg-black/80 group-hover:flex"
            onClick={(e) => { e.stopPropagation(); onDelete(attachment.id); }}
            aria-label="Eliminar imagen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="px-3 py-2">
        <p className="truncate text-xs font-medium text-foreground">{attachment.originalName}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatBytes(attachment.size)} · {formatDateHour(attachment.createdAt)}
        </p>
        {attachment.notes && (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground italic">
            {attachment.notes}
          </p>
        )}
      </div>
    </div>
  );
}

interface LightboxProps {
  attachment: PalletAttachment;
  palletId: number | string;
  canDelete: boolean;
  onDelete: (id: number) => void;
  onUpdateNotes: (id: number, notes: string | null) => void;
  onClose: () => void;
  isUpdating: boolean;
}

function Lightbox({ attachment, palletId, canDelete, onDelete, onUpdateNotes, onClose, isUpdating }: LightboxProps) {
  const { src, loading } = useImageBlobUrl(palletId, attachment.id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(attachment.notes ?? '');

  const handleSaveNotes = () => {
    onUpdateNotes(attachment.id, notesValue.trim() || null);
    setEditingNotes(false);
  };

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = attachment.originalName;
    a.click();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{attachment.originalName}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{attachment.originalName}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(attachment.size)} · Subido por {attachment.uploadedBy.name} · {formatDateHour(attachment.createdAt)}
            </p>
          </div>
          <div className="ml-3 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload} disabled={!src}>
              <Download className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => { onDelete(attachment.id); onClose(); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/5">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : src ? (
            <img
              src={src}
              alt={attachment.originalName}
              className="max-h-[60vh] max-w-full object-contain"
            />
          ) : (
            <ImageOff className="h-12 w-12 text-muted-foreground/30" />
          )}
        </div>

        {/* Notes */}
        <div className="border-t px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nota
            </p>
            {!editingNotes && (
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setEditingNotes(true)}>
                <Pencil className="h-3 w-3" />
                Editar
              </Button>
            )}
          </div>
          {editingNotes ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotesValue(e.target.value)}
                placeholder="Añade una nota a esta imagen…"
                className="min-h-[60px] resize-none text-sm"
                maxLength={500}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditingNotes(false); setNotesValue(attachment.notes ?? ''); }}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveNotes} disabled={isUpdating} className="gap-1">
                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {attachment.notes || <span className="italic opacity-60">Sin nota</span>}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UploadZoneProps {
  onFile: (file: File, notes: string) => void;
  isUploading: boolean;
}

function UploadZone({ onFile, isUploading }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [notes, setNotes] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!notifyIfInvalidPalletImageFile(file)) return;
    setPendingFile(file);
  };

  const handleSubmit = () => {
    if (!pendingFile) return;
    onFile(pendingFile, notes);
    setPendingFile(null);
    setNotes('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
          pendingFile && 'border-primary/40 bg-primary/5'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !pendingFile && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : pendingFile ? (
          <>
            {previewUrl && (
              <div className="w-full overflow-hidden rounded-lg border bg-muted/30">
                <img
                  src={previewUrl}
                  alt={`Vista previa de ${pendingFile.name}`}
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
            <p className="max-w-full truncate text-center text-sm font-medium text-foreground">
              {pendingFile.name}
            </p>
            <p className="text-xs text-muted-foreground">{formatBytes(pendingFile.size)}</p>
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={(e) => { e.stopPropagation(); setPendingFile(null); if (inputRef.current) inputRef.current.value = ''; }}
            >
              Cambiar
            </button>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              Arrastra una imagen o <span className="font-medium text-foreground">haz click</span>
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 10 MB</p>
          </>
        )}
      </div>

      {pendingFile && (
        <>
          <Textarea
            placeholder="Nota opcional (máx. 500 caracteres)"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
            maxLength={500}
          />
          <Button className="w-full gap-2" onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir imagen
          </Button>
        </>
      )}
    </div>
  );
}

interface PalletImagesTabProps {
  palletId: number | string;
}

export default function PalletImagesTab({ palletId }: PalletImagesTabProps) {
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles: string[] = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const canDelete = roles.some((r) => r === 'administrador' || r === 'tecnico');

  const { attachments, isLoading, error, uploadMutation, updateMutation, deleteMutation } =
    usePalletAttachments(palletId);

  const [lightboxAtt, setLightboxAtt] = useState<PalletAttachment | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDelete = (id: number) => setConfirmDeleteId(id);

  const handleUpdateNotes = (id: number, notes: string | null) => {
    updateMutation.mutate({ attachmentId: id, notes });
    // Actualiza el lightbox localmente para respuesta inmediata
    setLightboxAtt((prev) => prev && prev.id === id ? { ...prev, notes } : prev);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 p-4 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="p-6 text-sm text-destructive">{error}</p>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-6 overflow-hidden">
      {/* Panel izquierdo — upload */}
      <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto py-4 pr-2 pl-1">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subir imagen
          </p>
          <UploadZone
            onFile={(file, notes) => uploadMutation.mutate({ file, notes })}
            isUploading={uploadMutation.isPending}
          />
        </div>

        {attachments.length > 0 && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{attachments.length}</span>{' '}
            {attachments.length === 1 ? 'imagen' : 'imágenes'}
            {' · '}
            {formatBytes(attachments.reduce((s, a) => s + a.size, 0))} total
          </div>
        )}
      </div>

      {/* Panel derecho — galería */}
      <div className="min-w-0 flex-1 overflow-y-auto py-4 pb-6 pr-1">
        {attachments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Sin imágenes</p>
              <p className="text-xs text-muted-foreground">Sube la primera imagen desde el panel izquierdo</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
            {attachments.map((att) => (
              <ImageCard
                key={att.id}
                attachment={att}
                palletId={palletId}
                canDelete={canDelete}
                onDelete={handleDelete}
                onClick={() => setLightboxAtt(att)}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxAtt && (
        <Lightbox
          attachment={lightboxAtt}
          palletId={palletId}
          canDelete={canDelete}
          onDelete={(id) => { handleDelete(id); setLightboxAtt(null); }}
          onUpdateNotes={handleUpdateNotes}
          onClose={() => setLightboxAtt(null)}
          isUpdating={updateMutation.isPending}
        />
      )}

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId !== null) deleteMutation.mutate(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
