'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Loader2, ImageOff, ImageIcon, Pencil, Check, X, Camera, Images } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

async function deviceHasCamera(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  const isMobileUa = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!navigator.mediaDevices?.enumerateDevices) return isMobileUa;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (devices.some((device) => device.kind === 'videoinput')) return true;
  } catch {
    // Sin permiso o API no disponible
  }

  return isMobileUa;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useImageBlobUrl(palletId: number | string, attachmentId: number) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const urlRef = useRef<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    let cancelled = false;
    palletAttachmentService
      .getBlobUrl(palletId, attachmentId)
      .then((url) => {
        if (cancelled) { URL.revokeObjectURL(url); return; }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
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

  useEffect(() => {
    return load();
  }, [load]);

  return { src, loading };
}

interface MobileImageItemProps {
  attachment: PalletAttachment;
  palletId: number | string;
  canDelete: boolean;
  onDelete: (id: number) => void;
  onClick: () => void;
}

function MobileImageItem({ attachment, palletId, canDelete, onDelete, onClick }: MobileImageItemProps) {
  const { src, loading } = useImageBlobUrl(palletId, attachment.id);

  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3 shadow-sm active:opacity-70" onClick={onClick}>
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {loading ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : src ? (
          <img src={src} alt={attachment.originalName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{attachment.originalName}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(attachment.size)} · {formatDateHour(attachment.createdAt)}
        </p>
        {attachment.notes && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground italic">
            {attachment.notes}
          </p>
        )}
      </div>

      {canDelete && (
        <button
          className="flex-shrink-0 p-1 text-muted-foreground active:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(attachment.id); }}
          aria-label="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
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

function MobileLightbox({ attachment, palletId, canDelete, onDelete, onUpdateNotes, onClose, isUpdating }: LightboxProps) {
  const { src, loading } = useImageBlobUrl(palletId, attachment.id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(attachment.notes ?? '');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[92dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
        aria-describedby={undefined}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{attachment.originalName}</DialogTitle>

        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="truncate text-sm font-semibold">{attachment.originalName}</p>
          <div className="ml-2 flex items-center gap-1">
            {canDelete && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                onClick={() => { onDelete(attachment.id); onClose(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-black/5 py-4">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : src ? (
            <img src={src} alt={attachment.originalName} className="max-h-[50dvh] max-w-full object-contain" />
          ) : (
            <ImageOff className="h-10 w-10 text-muted-foreground/30" />
          )}
        </div>

        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota</p>
            {!editingNotes && (
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs"
                onClick={() => setEditingNotes(true)}>
                <Pencil className="h-3 w-3" /> Editar
              </Button>
            )}
          </div>
          {editingNotes ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotesValue(e.target.value)}
                placeholder="Añade una nota…"
                className="min-h-[60px] resize-none text-sm"
                maxLength={500}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditingNotes(false); setNotesValue(attachment.notes ?? ''); }}>
                  Cancelar
                </Button>
                <Button size="sm" disabled={isUpdating} className="gap-1"
                  onClick={() => { onUpdateNotes(attachment.id, notesValue.trim() || null); setEditingNotes(false); }}>
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

interface ImagenesTabProps {
  palletId: number | string;
  onBack?: () => void;
}

export default function ImagenesTab({ palletId, onBack }: ImagenesTabProps) {
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles: string[] = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const canDelete = roles.some((r) => r === 'administrador' || r === 'tecnico');

  const { attachments, isLoading, error, uploadMutation, updateMutation, deleteMutation } =
    usePalletAttachments(palletId);

  const [lightboxAtt, setLightboxAtt] = useState<PalletAttachment | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  useEffect(() => {
    let cancelled = false;
    deviceHasCamera().then((available) => {
      if (!cancelled) setHasCamera(available);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearFileInputs = () => {
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!notifyIfInvalidPalletImageFile(file)) return;
    setPendingFile(file);
  };

  const handleSubmit = () => {
    if (!pendingFile) return;
    uploadMutation.mutate(
      { file: pendingFile, notes },
      {
        onSuccess: () => {
          setPendingFile(null);
          setNotes('');
          clearFileInputs();
        },
      }
    );
  };

  return (
    <div className="flex h-full flex-col">
      {onBack && <MobilePalletScreenHeader title="Imágenes" onBack={onBack} />}
    <div className="min-h-0 flex-1 overflow-auto px-3 py-3 space-y-4 pb-6">
      {/* Upload section */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subir imagen
        </p>

        {pendingFile ? (
          <div className="space-y-2">
            {previewUrl && (
              <div className="overflow-hidden rounded-xl border bg-muted/30">
                <img
                  src={previewUrl}
                  alt={`Vista previa de ${pendingFile.name}`}
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border bg-primary/5 p-3">
              <ImageIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{pendingFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(pendingFile.size)}</p>
              </div>
              <button
                className="text-xs text-muted-foreground underline"
                onClick={() => {
                  setPendingFile(null);
                  clearFileInputs();
                }}
              >
                Cambiar
              </button>
            </div>
            <Textarea
              placeholder="Nota opcional"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              maxLength={500}
            />
            <Button className="w-full gap-2" onClick={handleSubmit} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Upload className="h-4 w-4" />}
              Subir imagen
            </Button>
          </div>
        ) : hasCamera ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 transition-colors',
                  'border-border active:border-primary active:bg-primary/5'
                )}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Toca para añadir una imagen</p>
                <p className="text-xs text-muted-foreground">Foto o galería · JPG, PNG o WebP · máx. 10 MB</p>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem
                className="gap-2 py-2.5"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Hacer foto
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 py-2.5"
                onClick={() => galleryInputRef.current?.click()}
              >
                <Images className="h-4 w-4" />
                Elegir de la galería
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            className={cn(
              'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 transition-colors',
              'border-border active:border-primary active:bg-primary/5'
            )}
            onClick={() => galleryInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Toca para seleccionar una imagen</p>
            <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 10 MB</p>
          </button>
        )}

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-xl border p-3">
              <Skeleton className="h-16 w-16 flex-shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : attachments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No hay imágenes todavía.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {attachments.length} {attachments.length === 1 ? 'imagen' : 'imágenes'}
          </p>
          {attachments.map((att) => (
            <MobileImageItem
              key={att.id}
              attachment={att}
              palletId={palletId}
              canDelete={canDelete}
              onDelete={(id) => setConfirmDeleteId(id)}
              onClick={() => setLightboxAtt(att)}
            />
          ))}
        </div>
      )}

      {lightboxAtt && (
        <MobileLightbox
          attachment={lightboxAtt}
          palletId={palletId}
          canDelete={canDelete}
          onDelete={(id) => { setConfirmDeleteId(id); setLightboxAtt(null); }}
          onUpdateNotes={(id, n) => {
            updateMutation.mutate({ attachmentId: id, notes: n });
            setLightboxAtt((prev) => prev && prev.id === id ? { ...prev, notes: n } : prev);
          }}
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
    </div>
  );
}
