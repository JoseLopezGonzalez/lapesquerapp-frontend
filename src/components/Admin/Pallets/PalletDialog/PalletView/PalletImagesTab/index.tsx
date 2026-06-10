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
  ChevronLeft,
  ChevronRight,
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
import {
  palletAttachmentService,
  type PalletAttachment,
} from '@/services/domain/pallets/palletAttachmentService';
import { formatDateHour } from '@/helpers/formats/dates/formatDates';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
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

interface ContactThumbProps {
  palletId: number | string;
  attachment: PalletAttachment;
  isActive: boolean;
  onClick: () => void;
}

function ContactThumb({ palletId, attachment, isActive, onClick }: ContactThumbProps) {
  const { src, loading } = useImageBlobUrl(palletId, attachment.id);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150',
        isActive
          ? 'border-primary shadow-md scale-[1.08]'
          : 'border-transparent opacity-50 hover:opacity-80 hover:scale-105'
      )}
      aria-label={attachment.originalName}
    >
      {loading ? (
        <Skeleton className="h-full w-full rounded-none" />
      ) : src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
          <ImageOff className="h-4 w-4 text-white/30" />
        </div>
      )}
    </button>
  );
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
      className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {canDelete && (
          <button
            className="absolute top-1.5 right-1.5 hidden rounded-md bg-black/60 p-1 text-white backdrop-blur-sm transition-colors hover:bg-black/80 group-hover:flex"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(attachment.id);
            }}
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
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground italic">
            {attachment.notes}
          </p>
        )}
      </div>
    </div>
  );
}

interface LightboxProps {
  attachments: PalletAttachment[];
  currentIndex: number;
  palletId: number | string;
  canDelete: boolean;
  onDelete: (id: number) => void;
  onUpdateNotes: (id: number, notes: string | null) => void;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  isUpdating: boolean;
  notesOverrides: Map<number, string | null>;
}

function Lightbox({
  attachments,
  currentIndex,
  palletId,
  canDelete,
  onDelete,
  onUpdateNotes,
  onClose,
  onIndexChange,
  isUpdating,
  notesOverrides,
}: LightboxProps) {
  const attachment = attachments[currentIndex];
  const { src, loading } = useImageBlobUrl(palletId, attachment.id);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const resolvedNotes = notesOverrides.has(attachment.id)
    ? notesOverrides.get(attachment.id) ?? null
    : attachment.notes;

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(resolvedNotes ?? '');

  useEffect(() => {
    const n = notesOverrides.has(attachment.id)
      ? notesOverrides.get(attachment.id) ?? ''
      : attachment.notes ?? '';
    setNotesValue(n);
    setEditingNotes(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.id]);

  useEffect(() => {
    if (!thumbsRef.current) return;
    const active = thumbsRef.current.children[currentIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (editingNotes) return;
      if (e.key === 'ArrowLeft') onIndexChange(Math.max(0, currentIndex - 1));
      else if (e.key === 'ArrowRight')
        onIndexChange(Math.min(attachments.length - 1, currentIndex + 1));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, attachments.length, onIndexChange, onClose, editingNotes]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < attachments.length - 1;

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
        className="flex max-h-[95vh] flex-col gap-0 overflow-hidden p-0"
        size="5xl"
        aria-describedby={undefined}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{attachment.originalName}</DialogTitle>

        {/* Dark image area */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-zinc-950">
          {/* Floating actions — top right */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-white/90 backdrop-blur-sm">
              {currentIndex + 1} / {attachments.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-white"
              onClick={handleDownload}
              disabled={!src}
              title="Descargar"
            >
              <Download className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md bg-black/60 backdrop-blur-sm hover:bg-black/80 text-red-400 hover:text-red-300"
                onClick={() => onDelete(attachment.id)}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-white"
              onClick={onClose}
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Prev arrow */}
          {hasPrev && (
            <button
              type="button"
              className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70"
              onClick={() => onIndexChange(currentIndex - 1)}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div className="flex min-h-[280px] w-full items-center justify-center py-8 px-16">
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin text-white/30" />
            ) : src ? (
              <img
                src={src}
                alt={attachment.originalName}
                className="max-h-[68vh] max-w-full object-contain"
              />
            ) : (
              <ImageOff className="h-16 w-16 text-white/20" />
            )}
          </div>

          {/* Next arrow */}
          {hasNext && (
            <button
              type="button"
              className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70"
              onClick={() => onIndexChange(currentIndex + 1)}
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        {attachments.length > 1 && (
          <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2.5">
            <div
              ref={thumbsRef}
              className="flex gap-2 overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {attachments.map((att, i) => (
                <ContactThumb
                  key={att.id}
                  palletId={palletId}
                  attachment={att}
                  isActive={i === currentIndex}
                  onClick={() => onIndexChange(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info + Notes */}
        <div className="border-t bg-background px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{attachment.originalName}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(attachment.size)} · {attachment.uploadedBy.name} ·{' '}
                {formatDateHour(attachment.createdAt)}
              </p>
            </div>
            {!editingNotes && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 flex-shrink-0 gap-1 px-2 text-xs"
                onClick={() => setEditingNotes(true)}
              >
                <Pencil className="h-3 w-3" />
                Nota
              </Button>
            )}
          </div>

          {editingNotes ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotesValue(e.target.value)
                }
                placeholder="Añade una nota a esta imagen…"
                className="min-h-[60px] resize-none text-sm"
                maxLength={500}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingNotes(false);
                    setNotesValue(resolvedNotes ?? '');
                  }}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveNotes} disabled={isUpdating} className="gap-1">
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Guardar
                </Button>
              </div>
            </div>
          ) : resolvedNotes ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground italic">
              {resolvedNotes}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-muted-foreground/50">
              Sin nota · pulsa &quot;Nota&quot; para añadir
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          pendingFile && 'border-primary/40 bg-primary/5'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
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
              onClick={(e) => {
                e.stopPropagation();
                setPendingFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Cambiar
            </button>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              Arrastra una imagen o{' '}
              <span className="font-medium text-foreground">haz click</span>
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
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Subir imagen
          </Button>
        </>
      )}
    </div>
  );
}

interface PalletImagesTabProps {
  palletId: number | string;
  initialLightboxIndex?: number;
}

export default function PalletImagesTab({ palletId, initialLightboxIndex }: PalletImagesTabProps) {
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles: string[] = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const canDelete = roles.some((r) => r === 'administrador' || r === 'tecnico');

  const { attachments, isLoading, error, uploadMutation, updateMutation, deleteMutation } =
    usePalletAttachments(palletId);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [notesOverrides, setNotesOverrides] = useState<Map<number, string | null>>(new Map());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const initialIndexApplied = useRef(false);

  // Auto-open lightbox at initialLightboxIndex once attachments are available
  useEffect(() => {
    if (
      initialLightboxIndex !== undefined &&
      !initialIndexApplied.current &&
      attachments.length > 0
    ) {
      initialIndexApplied.current = true;
      setLightboxIndex(Math.min(initialLightboxIndex, attachments.length - 1));
    }
  }, [attachments.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clamp lightboxIndex when attachments update (e.g. after deletion)
  useEffect(() => {
    if (lightboxIndex === null) return;
    if (attachments.length === 0) {
      setLightboxIndex(null);
    } else if (lightboxIndex >= attachments.length) {
      setLightboxIndex(attachments.length - 1);
    }
  }, [attachments.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (id: number) => setConfirmDeleteId(id);

  const handleConfirmDelete = () => {
    if (confirmDeleteId === null) return;
    deleteMutation.mutate(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const handleUpdateNotes = (id: number, notes: string | null) => {
    updateMutation.mutate({ attachmentId: id, notes });
    setNotesOverrides((prev) => new Map(prev).set(id, notes));
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
    return <p className="p-6 text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="flex h-full min-h-0 gap-6 overflow-hidden">
      {/* Left panel — upload */}
      <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto py-4 pl-1 pr-2">
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

      {/* Right panel — gallery */}
      <div className="min-w-0 flex-1 overflow-y-auto py-4 pb-6 pr-1">
        {attachments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Sin imágenes</p>
              <p className="text-xs text-muted-foreground">
                Sube la primera imagen desde el panel izquierdo
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
            {attachments.map((att, i) => (
              <ImageCard
                key={att.id}
                attachment={att}
                palletId={palletId}
                canDelete={canDelete}
                onDelete={handleDelete}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox slider */}
      {lightboxIndex !== null && attachments.length > 0 && (
        <Lightbox
          attachments={attachments}
          currentIndex={lightboxIndex}
          palletId={palletId}
          canDelete={canDelete}
          onDelete={handleDelete}
          onUpdateNotes={handleUpdateNotes}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          isUpdating={updateMutation.isPending}
          notesOverrides={notesOverrides}
        />
      )}

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
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
    </div>
  );
}
