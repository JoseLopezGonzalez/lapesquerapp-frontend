'use client';

import { useState, useEffect } from 'react';
import {
  File,
  FileText,
  ImageIcon,
  Sheet,
  Download,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Paperclip,
  ImageOff,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useOrderContext } from '@/context/OrderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrderAttachments } from '@/hooks/orders/useOrderAttachments';
import {
  getThumbnailCached,
  getBlobUrlCached,
  formatBytes,
  type OrderAttachment,
} from '@/services/domain/orders/orderAttachmentService';
import { formatDateHour } from '@/helpers/formats/dates/formatDates';
import { cn } from '@/lib/utils';
import { OrderAttachmentUploadDialog } from './OrderAttachmentUploadDialog';
import { OrderAttachmentEditNotesDialog } from './OrderAttachmentEditNotesDialog';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getFileIcon(mimeType: string) {
  if (
    mimeType === 'application/pdf' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return FileText;
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return Sheet;
  if (mimeType.startsWith('image/')) return ImageIcon;
  return File;
}

function getDocumentColors(mimeType: string): { bg: string; icon: string } {
  if (mimeType === 'application/pdf')
    return { bg: 'bg-red-50 dark:bg-red-950/30', icon: 'text-red-500' };
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return { bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'text-blue-500' };
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return { bg: 'bg-green-50 dark:bg-green-950/30', icon: 'text-green-500' };
  return { bg: 'bg-muted', icon: 'text-muted-foreground' };
}

// ─── Hooks de blob URL ───────────────────────────────────────────────────────

function useAttachmentThumbnail(
  orderId: number | string,
  attachmentId: number,
  enabled = true
) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    getThumbnailCached(orderId, attachmentId)
      .then((url) => { if (!cancelled) { setSrc(url); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId, attachmentId, enabled]);

  return { src, loading };
}

function useAttachmentFullImage(
  orderId: number | string,
  attachmentId: number,
  enabled = false
) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    getBlobUrlCached(orderId, attachmentId)
      .then((url) => { if (!cancelled) { setSrc(url); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId, attachmentId, enabled]);

  return { src, loading };
}

// ─── Card faces ──────────────────────────────────────────────────────────────

function ImageCardFace({
  orderId,
  attachment,
}: {
  orderId: number | string;
  attachment: OrderAttachment;
}) {
  const { src, loading } = useAttachmentThumbnail(orderId, attachment.id);
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-muted">
      {loading ? (
        <Skeleton className="h-full w-full rounded-none" />
      ) : src ? (
        <img src={src} alt={attachment.originalName} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

function DocumentCardFace({ attachment }: { attachment: OrderAttachment }) {
  const Icon = getFileIcon(attachment.mimeType);
  const { bg, icon } = getDocumentColors(attachment.mimeType);
  const ext = attachment.extension.toUpperCase();
  return (
    <div className={cn('flex aspect-square w-full flex-col items-center justify-center gap-2', bg)}>
      <Icon className={cn('h-10 w-10', icon)} strokeWidth={1.5} />
      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', icon)}>
        {ext}
      </span>
    </div>
  );
}

// ─── Card unificado ───────────────────────────────────────────────────────────

interface AttachmentCardProps {
  orderId: number | string;
  attachment: OrderAttachment;
  canDelete: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImageClick: () => void;
}

function AttachmentCard({
  orderId,
  attachment,
  canDelete,
  isDownloading,
  onDownload,
  onEdit,
  onDelete,
  onImageClick,
}: AttachmentCardProps) {
  const isImage = attachment.collection === 'order_image';

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
      {/* Cara visual — clickeable para imágenes, descarga directa para docs */}
      <div
        className={cn('relative', isImage && 'cursor-pointer')}
        onClick={isImage ? onImageClick : undefined}
      >
        {isImage ? (
          <ImageCardFace orderId={orderId} attachment={attachment} />
        ) : (
          <DocumentCardFace attachment={attachment} />
        )}

        {/* Overlay de acciones en hover */}
        <div className="absolute inset-0 flex items-end justify-end gap-1 bg-black/0 p-1.5 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
          <button
            className="rounded-md bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            title="Descargar"
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            className="rounded-md bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Editar notas"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {canDelete && (
            <button
              className="rounded-md bg-red-600/80 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-700"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="px-2.5 py-2">
        <p className="truncate text-xs font-medium text-foreground" title={attachment.originalName}>
          {attachment.originalName}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatBytes(attachment.size)} · {formatDateHour(attachment.createdAt)}
        </p>
        {attachment.notes && (
          <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground italic">
            {attachment.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function AttachmentGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Lightbox simple para imágenes ───────────────────────────────────────────

interface ImageLightboxProps {
  images: OrderAttachment[];
  initialIndex: number;
  orderId: number | string;
  onClose: () => void;
}

function ImageLightbox({ images, initialIndex, orderId, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const attachment = images[index];
  const { src, loading } = useAttachmentFullImage(orderId, attachment.id, true);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(images.length - 1, i + 1));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="4xl"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{attachment.originalName}</DialogTitle>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <p className="truncate text-sm font-medium">{attachment.originalName}</p>
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {images.length > 1 && (
              <span>{index + 1} / {images.length}</span>
            )}
            <button
              className="ml-1 rounded p-1 hover:bg-muted"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Imagen */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/80">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          ) : src ? (
            <img
              src={src}
              alt={attachment.originalName}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/50">
              <ImageOff className="h-10 w-10" />
              <p className="text-sm">No se pudo cargar la imagen</p>
            </div>
          )}

          {/* Navegación */}
          {index > 0 && (
            <button
              className="absolute left-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70"
              onClick={() => setIndex((i) => i - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              className="absolute right-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70"
              onClick={() => setIndex((i) => i + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          {formatBytes(attachment.size)} · {attachment.uploadedBy?.name} · {formatDateHour(attachment.createdAt)}
          {attachment.notes && <span className="ml-2 italic">"{attachment.notes}"</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const OrderAttachments = () => {
  const { order } = useOrderContext();
  const isMobile = useIsMobile();
  const { data: session } = useSession();

  const rawRole = session?.user?.role;
  const roles: string[] = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const canDelete = roles.some((r) => r === 'administrador' || r === 'tecnico');

  const orderId = order?.id;

  const {
    attachments,
    total,
    isLoading,
    error,
    uploadMutation,
    updateMutation,
    deleteMutation,
    downloadAttachment,
  } = useOrderAttachments(orderId);

  const imageAttachments = attachments.filter((a) => a.collection === 'order_image');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrderAttachment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [lightboxImageId, setLightboxImageId] = useState<number | null>(null);

  const handleDownload = async (attachment: OrderAttachment) => {
    setDownloadingId(attachment.id);
    await downloadAttachment(attachment);
    setDownloadingId(null);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId === null) return;
    deleteMutation.mutate(deleteTargetId, {
      onSettled: () => setDeleteTargetId(null),
    });
  };

  const lightboxIndex = lightboxImageId !== null
    ? imageAttachments.findIndex((a) => a.id === lightboxImageId)
    : -1;

  const content = (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            `${total} ${total === 1 ? 'adjunto' : 'adjuntos'}`
          )}
        </p>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Adjuntar archivo
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <AttachmentGridSkeleton />
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : attachments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <Paperclip className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-sm">Sin adjuntos todavía</p>
          <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
            Añadir el primero
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {attachments.map((att) => (
            <AttachmentCard
              key={att.id}
              orderId={orderId!}
              attachment={att}
              canDelete={canDelete}
              isDownloading={downloadingId === att.id}
              onDownload={() => handleDownload(att)}
              onEdit={() => setEditTarget(att)}
              onDelete={() => setDeleteTargetId(att.id)}
              onImageClick={() => setLightboxImageId(att.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        isMobile ? 'flex min-h-0 flex-1 flex-col' : 'flex min-h-0 flex-1 flex-col pb-2'
      )}
    >
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="py-6">{content}</div>
          </ScrollArea>
        </div>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Paperclip className="h-4 w-4" />
              Adjuntos
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">{content}</CardContent>
        </Card>
      )}

      <OrderAttachmentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        uploadMutation={uploadMutation}
      />

      {editTarget && (
        <OrderAttachmentEditNotesDialog
          attachment={editTarget}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          updateMutation={updateMutation}
        />
      )}

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar adjunto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lightboxIndex >= 0 && imageAttachments.length > 0 && (
        <ImageLightbox
          images={imageAttachments}
          initialIndex={lightboxIndex}
          orderId={orderId!}
          onClose={() => setLightboxImageId(null)}
        />
      )}
    </div>
  );
};

export default OrderAttachments;
