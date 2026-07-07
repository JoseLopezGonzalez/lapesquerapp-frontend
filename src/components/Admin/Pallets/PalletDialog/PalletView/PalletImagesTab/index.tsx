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
  getBlobUrlCached,
  getThumbnailBlobUrlCached,
  invalidateBlobUrlCache,
  type PalletAttachment,
} from '@/services/domain/pallets/palletAttachmentService';
import { formatDateHour } from '@/helpers/formats/dates/formatDates';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useImageBlobUrl(palletId: number | string, attachmentId: number, thumbnail = false) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetch = thumbnail
      ? getThumbnailBlobUrlCached(palletId, attachmentId)
      : getBlobUrlCached(palletId, attachmentId);
    fetch
      .then((url) => {
        if (!cancelled) {
          setSrc(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [palletId, attachmentId, thumbnail]);

  return { src, loading };
}

interface ContactThumbProps {
  palletId: number | string;
  attachment: PalletAttachment;
  isActive: boolean;
  onClick: () => void;
}

function ContactThumb({ palletId, attachment, isActive, onClick }: ContactThumbProps) {
  const { src, loading } = useImageBlobUrl(palletId, attachment.id, true);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150',
        isActive
          ? 'border-primary scale-[1.08] shadow-md'
          : 'border-transparent opacity-50 hover:scale-105 hover:opacity-80'
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
  const { src, loading } = useImageBlobUrl(palletId, attachment.id, true);

  return (
    <div
      className="group bg-card relative cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
      onClick={onClick}
    >
      <div className="bg-muted relative aspect-square w-full">
        {loading ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : src ? (
          <img src={src} alt={attachment.originalName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="text-muted-foreground/40 h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {canDelete && (
          <button
            className="absolute top-1.5 right-1.5 hidden rounded-md bg-black/60 p-1 text-white backdrop-blur-sm transition-colors group-hover:flex hover:bg-black/80"
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
        <p className="text-foreground truncate text-xs font-medium">{attachment.originalName}</p>
        <p className="text-muted-foreground text-[10px]">
          {formatBytes(attachment.size)} · {formatDateHour(attachment.createdAt)}
        </p>
        {attachment.notes && (
          <p className="text-muted-foreground mt-1 line-clamp-1 text-[11px] italic">
            {attachment.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export interface LightboxProps {
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

export function Lightbox({
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
    ? (notesOverrides.get(attachment.id) ?? null)
    : attachment.notes;

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(resolvedNotes ?? '');

  // Reset notes editor when navigating to a different image. Intentionally keyed only on
  // attachment.id: resolvedNotes is recalculated on every render (it also depends on
  // notesOverrides), and re-running this effect whenever notesOverrides changes would wipe
  // out the value the user just saved for the *current* image. Using a ref to read the
  // latest resolvedNotes keeps the dependency array honest without changing that behavior.
  // The ref is updated in its own effect (never mutated during render, per react-hooks/refs).
  const resolvedNotesRef = useRef(resolvedNotes);
  useEffect(() => {
    resolvedNotesRef.current = resolvedNotes;
  });

  useEffect(() => {
    setNotesValue(resolvedNotesRef.current ?? '');
    setEditingNotes(false);
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
            <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white/90 tabular-nums backdrop-blur-sm">
              {currentIndex + 1} / {attachments.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-white"
              onClick={handleDownload}
              disabled={!src}
              title="Descargar"
              aria-label="Descargar"
            >
              <Download className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md bg-black/60 text-red-400 backdrop-blur-sm hover:bg-black/80 hover:text-red-300"
                onClick={() => onDelete(attachment.id)}
                title="Eliminar"
                aria-label="Eliminar imagen"
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
              aria-label="Cerrar"
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
          <div className="flex min-h-[280px] w-full items-center justify-center px-16 py-8">
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
            <div ref={thumbsRef} className="scrollbar-hide flex gap-2 overflow-x-auto">
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
        <div className="bg-background border-t px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{attachment.originalName}</p>
              <p className="text-muted-foreground text-xs">
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
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm italic">
              {resolvedNotes}
            </p>
          ) : (
            <p className="text-muted-foreground/50 mt-1 text-xs italic">
              Sin nota · pulsa &quot;Nota&quot; para añadir
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type PendingFile = { file: File; previewUrl: string };

export interface UploadZoneProps {
  onFiles: (files: Array<{ file: File; notes: string }>) => void;
  isUploading: boolean;
  uploadProgress?: { current: number; total: number } | null;
}

export function UploadZone({ onFiles, isUploading, uploadProgress }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [notes, setNotes] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke all preview URLs on unmount
  const pendingFilesRef = useRef<PendingFile[]>([]);
  useEffect(() => {
    pendingFilesRef.current = pendingFiles;
  }, [pendingFiles]);
  useEffect(() => {
    return () => {
      pendingFilesRef.current.forEach((pf) => URL.revokeObjectURL(pf.previewUrl));
    };
  }, []);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const valid = Array.from(fileList).filter((f) => notifyIfInvalidPalletImageFile(f));
    if (!valid.length) return;
    setPendingFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f) })),
    ]);
  }, []);

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearQueue = () => {
    setPendingFiles((prev) => {
      prev.forEach((pf) => URL.revokeObjectURL(pf.previewUrl));
      return [];
    });
    setNotes('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!pendingFiles.length) return;
    onFiles(pendingFiles.map(({ file }) => ({ file, notes })));
    clearQueue();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const hasPending = pendingFiles.length > 0;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'rounded-xl border-2 border-dashed transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          hasPending && !isUploading && 'border-primary/30 bg-muted/20',
          !hasPending && !isUploading && 'cursor-pointer'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !hasPending && !isUploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            {uploadProgress && uploadProgress.total > 1 && (
              <p className="text-muted-foreground text-xs">
                Subiendo {uploadProgress.current + 1} de {uploadProgress.total}…
              </p>
            )}
          </div>
        ) : hasPending ? (
          <div className="space-y-1.5 p-3">
            {pendingFiles.map(({ file, previewUrl }, i) => (
              <div
                key={i}
                className="bg-background/80 flex items-center gap-2 rounded-lg p-1.5 shadow-sm"
              >
                <img
                  src={previewUrl}
                  alt=""
                  className="h-9 w-9 flex-shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{file.name}</p>
                  <p className="text-muted-foreground text-[10px]">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground flex-shrink-0 rounded p-0.5 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  aria-label="Quitar imagen"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-muted-foreground hover:border-primary/50 hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-xs transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
              Añadir más
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6">
            <Upload className="text-muted-foreground h-6 w-6" />
            <p className="text-muted-foreground text-center text-sm">
              Arrastra imágenes o <span className="text-foreground font-medium">haz click</span>
            </p>
            <p className="text-muted-foreground text-xs">
              JPG, PNG o WebP · máx. 10 MB · varias a la vez
            </p>
          </div>
        )}
      </div>

      {hasPending && !isUploading && (
        <>
          <Textarea
            placeholder="Nota para todas las imágenes (opcional · máx. 500 car.)"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
            maxLength={500}
          />
          <Button className="w-full gap-2" onClick={handleSubmit}>
            <Upload className="h-4 w-4" />
            {pendingFiles.length === 1 ? 'Subir 1 imagen' : `Subir ${pendingFiles.length} imágenes`}
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const initialIndexApplied = useRef(false);

  // Auto-open lightbox at initialLightboxIndex once attachments are available.
  // Guarded by initialIndexApplied ref so it only ever fires once, regardless of how many
  // times attachments/initialLightboxIndex change afterwards.
  useEffect(() => {
    if (
      initialLightboxIndex !== undefined &&
      !initialIndexApplied.current &&
      attachments.length > 0
    ) {
      initialIndexApplied.current = true;
      setLightboxIndex(Math.min(initialLightboxIndex, attachments.length - 1));
    }
  }, [attachments.length, initialLightboxIndex]);

  // Clamp lightboxIndex when attachments update (e.g. after deletion). Including
  // lightboxIndex is safe: setLightboxIndex is only called when the value actually needs to
  // change, so this never loops.
  useEffect(() => {
    if (lightboxIndex === null) return;
    if (attachments.length === 0) {
      setLightboxIndex(null);
    } else if (lightboxIndex >= attachments.length) {
      setLightboxIndex(attachments.length - 1);
    }
  }, [attachments.length, lightboxIndex]);

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

  const handleFiles = async (files: Array<{ file: File; notes: string }>) => {
    if (!files.length) return;
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadMutation.mutateAsync(files[i]);
      } catch {
        // error already handled by mutation's onError
      }
      setUploadProgress({ current: i + 1, total: files.length });
    }
    setIsUploading(false);
    setUploadProgress(null);
  };

  const handleDownloadAll = async () => {
    if (!attachments.length) return;
    setIsDownloadingAll(true);
    try {
      const results = await Promise.allSettled(
        attachments.map((att) =>
          getBlobUrlCached(palletId, att.id).then((url) => ({ url, name: att.originalName }))
        )
      );
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const a = document.createElement('a');
          a.href = result.value.url;
          a.download = result.value.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } finally {
      setIsDownloadingAll(false);
    }
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
    return <p className="text-destructive p-6 text-sm">{error}</p>;
  }

  return (
    <div className="flex h-full min-h-0 gap-6 overflow-hidden">
      {/* Left panel — upload */}
      <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto py-4 pr-2 pl-1">
        <div>
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Subir imágenes
          </p>
          <UploadZone
            onFiles={handleFiles}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2">
            <div className="bg-muted/30 text-muted-foreground rounded-lg border px-3 py-2.5 text-xs">
              <span className="text-foreground font-medium">{attachments.length}</span>{' '}
              {attachments.length === 1 ? 'imagen' : 'imágenes'}
              {' · '}
              {formatBytes(attachments.reduce((s, a) => s + a.size, 0))} total
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
            >
              {isDownloadingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Descargar todas
            </Button>
          </div>
        )}
      </div>

      {/* Right panel — gallery */}
      <div className="min-w-0 flex-1 overflow-y-auto py-4 pr-1 pb-6">
        {attachments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
              <ImageIcon className="text-muted-foreground/60 h-8 w-8" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Sin imágenes</p>
              <p className="text-muted-foreground text-xs">
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
