'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  ExternalLink,
} from 'lucide-react';
import { useMe } from '@/hooks/useMe';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
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
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { useOrderAttachments } from '@/hooks/orders/useOrderAttachments';
import {
  getThumbnailCached,
  getBlobUrlCached,
  getDocumentThumbnailCached,
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

function useAttachmentBlob(
  orderId: number | string,
  attachmentId: number,
  enabled = false
) {
  const [src, setSrc] = useState<string | null>(null);
  // Empezar en loading=true cuando enabled=true para evitar el flash de "error"
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setSrc(null);
    setLoading(true);
    getBlobUrlCached(orderId, attachmentId)
      .then((url) => { if (!cancelled) { setSrc(url); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId, attachmentId, enabled]);

  return { src, loading };
}

function useDocumentThumbnail(orderId: number | string, attachmentId: number) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDocumentThumbnailCached(orderId, attachmentId)
      .then((url) => { if (!cancelled) { setSrc(url); setLoading(false); } })
      .catch(() => { if (!cancelled) { setSrc(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [orderId, attachmentId]);

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
        <Image
          src={src}
          alt={attachment.originalName}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageOff className="h-5 w-5 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

function DocumentCardFace({
  orderId,
  attachment,
}: {
  orderId: number | string;
  attachment: OrderAttachment;
}) {
  const Icon = getFileIcon(attachment.mimeType);
  const { bg, icon } = getDocumentColors(attachment.mimeType);
  const ext = attachment.extension.toUpperCase();
  const { src, loading } = useDocumentThumbnail(orderId, attachment.id);
  const [imgError, setImgError] = useState(false);

  if (loading) {
    return (
      <div className={cn('flex aspect-square w-full items-center justify-center', bg)}>
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    );
  }

  if (src && !imgError) {
    return (
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={src}
          alt={attachment.originalName}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className={cn('flex aspect-square w-full flex-col items-center justify-center gap-1', bg)}>
      <Icon className={cn('h-7 w-7', icon)} strokeWidth={1.5} />
      <span className={cn('rounded px-1 py-0.5 text-xs font-bold uppercase tracking-wider', icon)}>
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
  onPreviewClick: () => void;
}

function AttachmentCard({
  orderId,
  attachment,
  canDelete,
  isDownloading,
  onDownload,
  onEdit,
  onDelete,
  onPreviewClick,
}: AttachmentCardProps) {
  const isImage = attachment.collection === 'order_image';

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative cursor-pointer" onClick={onPreviewClick}>
        {isImage ? (
          <ImageCardFace orderId={orderId} attachment={attachment} />
        ) : (
          <DocumentCardFace orderId={orderId} attachment={attachment} />
        )}

        {/* Overlay de acciones en hover */}
        <div className="absolute inset-0 flex items-end justify-end gap-0.5 bg-black/0 p-1 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-white"
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            title="Descargar"
          >
            {isDownloading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-white"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Editar notas"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="bg-red-600/80 text-white backdrop-blur-sm hover:bg-red-700 hover:text-white"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="px-2 py-1.5">
        <p className="truncate text-xs font-medium text-foreground" title={attachment.originalName}>
          {attachment.originalName}
        </p>
        {attachment.notes && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground italic">
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
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-2.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ─── Visor unificado (imágenes + PDFs + otros) ───────────────────────────────

interface AttachmentViewerProps {
  attachments: OrderAttachment[];
  initialIndex: number;
  orderId: number | string;
  onClose: () => void;
  onDownload: (attachment: OrderAttachment) => void;
  canDelete: boolean;
  onDelete: (attachment: OrderAttachment) => void;
}

function AttachmentViewer({
  attachments,
  initialIndex,
  orderId,
  onClose,
  onDownload,
  canDelete,
  onDelete,
}: AttachmentViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const attachment = attachments[index];

  const isImage = attachment.collection === 'order_image';
  // Comprueba MIME y también extensión por si el backend almacena application/octet-stream
  const isPdf =
    attachment.mimeType === 'application/pdf' ||
    attachment.extension.toLowerCase() === 'pdf';
  const needsBlob = isImage || isPdf;

  const { src, loading } = useAttachmentBlob(orderId, attachment.id, needsBlob);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(attachments.length - 1, i + 1));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [attachments.length, onClose]);

  const openInNewTab = () => {
    if (src) window.open(src, '_blank');
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="4xl"
        showCloseButton={false}
        className="flex h-[90vh] flex-col gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{attachment.originalName}</DialogTitle>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <p className="truncate text-sm font-medium" title={attachment.originalName}>
            {attachment.originalName}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {attachments.length > 1 && (
              <span className="text-xs text-muted-foreground">{index + 1} / {attachments.length}</span>
            )}
            {isPdf && src && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={openInNewTab}
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDownload(attachment)}
              title="Descargar"
            >
              <Download className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(attachment)}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <div className="mx-0.5 h-4 w-px bg-border" />
            <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative min-h-0 flex-1">
          {/* Imagen */}
          {isImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              ) : src ? (
                <Image
                  src={src}
                  alt={attachment.originalName}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/50">
                  <ImageOff className="h-10 w-10" />
                  <p className="text-sm">No se pudo cargar la imagen</p>
                </div>
              )}
            </div>
          )}

          {/* PDF — visor nativo del navegador via <object> */}
          {isPdf && (
            <div className="absolute inset-0 bg-muted">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && src && (
                <object
                  data={src}
                  type="application/pdf"
                  className="absolute inset-0 h-full w-full"
                >
                  {/* Fallback si el navegador no puede mostrar el PDF inline */}
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                    <FileText className="h-10 w-10" />
                    <p className="text-sm">Este navegador no puede mostrar PDFs inline.</p>
                    <Button variant="outline" size="sm" onClick={openInNewTab}>
                      Abrir en nueva pestaña
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDownload(attachment)}>
                      <Download className="mr-1.5 h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </object>
              )}
              {!loading && !src && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <FileText className="h-10 w-10" />
                  <p className="text-sm">No se pudo cargar el documento</p>
                  <Button variant="outline" size="sm" onClick={() => onDownload(attachment)}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Word / Excel / otros — sin vista previa */}
          {!isImage && !isPdf && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white/70">
              {(() => { const Icon = getFileIcon(attachment.mimeType); return <Icon className="h-14 w-14" strokeWidth={1} />; })()}
              <p className="text-sm">Vista previa no disponible para este formato</p>
              <Button variant="secondary" size="sm" onClick={() => onDownload(attachment)}>
                <Download className="mr-1.5 h-4 w-4" />
                Descargar para abrir
              </Button>
            </div>
          )}

          {/* Navegación */}
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 hover:text-white"
              onClick={() => setIndex((i) => i - 1)}
              title="Adjunto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {index < attachments.length - 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 hover:text-white"
              onClick={() => setIndex((i) => i + 1)}
              title="Adjunto siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          {formatBytes(attachment.size)} · {attachment.uploadedBy?.name} · {formatDateHour(attachment.createdAt)}
          {attachment.notes && <span className="ml-2 italic">&ldquo;{attachment.notes}&rdquo;</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const OrderAttachments = () => {
  const { order } = useOrderContext();
  const { isMobile, mounted } = useIsMobileSafe();
  const { data: me } = useMe();
  const canDelete = me?.role === 'administrador' || me?.role === 'tecnico';

  const orderId = order?.id;

  const {
    attachments,
    total,
    isLoading,
    error,
    uploadMutation,
    updateMutation,
    deleteMutation,
    deleteAllMutation,
    downloadAttachment,
  } = useOrderAttachments(orderId);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrderAttachment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<number | null>(null);

  const handleDownload = async (attachment: OrderAttachment) => {
    setDownloadingId(attachment.id);
    await downloadAttachment(attachment);
    setDownloadingId(null);
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      for (const att of attachments) {
        await downloadAttachment(att);
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId === null) return;
    deleteMutation.mutate(deleteTargetId, {
      onSettled: () => setDeleteTargetId(null),
    });
  };

  const handleConfirmDeleteAll = () => {
    deleteAllMutation.mutate(attachments, {
      onSettled: () => setDeleteAllOpen(false),
    });
  };

  const previewIndex =
    previewAttachmentId !== null
      ? attachments.findIndex((a) => a.id === previewAttachmentId)
      : -1;

  const actions = (
    <div className="flex items-center gap-1.5">
      {attachments.length > 0 && !isLoading && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownloadAll}
            disabled={isDownloadingAll}
            title="Descargar todos"
          >
            {isDownloadingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeleteAllOpen(true)}
              title="Eliminar todos"
              disabled={deleteAllMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <div className="mx-0.5 h-4 w-px bg-border" />
        </>
      )}
      <Button size="sm" onClick={() => setUploadOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Adjuntar archivo
      </Button>
    </div>
  );

  const gridContent = isLoading ? (
    <AttachmentGridSkeleton />
  ) : error ? (
    <p className="text-destructive text-sm">{error}</p>
  ) : attachments.length === 0 ? (
    <EmptyState
      title="No existen adjuntos"
      description="Este pedido no tiene archivos adjuntos todavía."
      icon={<Paperclip />}
      button={{ name: 'Adjuntar archivo', onClick: () => setUploadOpen(true) }}
    />
  ) : (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
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
          onPreviewClick={() => setPreviewAttachmentId(att.id)}
        />
      ))}
    </div>
  );

  if (!mounted) return null;

  return (
    <div
      className={cn(
        isMobile ? 'flex min-h-0 flex-1 flex-col' : 'flex h-full min-h-0 flex-col pb-2'
      )}
    >
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 py-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${total} ${total === 1 ? 'adjunto' : 'adjuntos'}`
                  )}
                </p>
                {actions}
              </div>
              {gridContent}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col bg-transparent">
          <CardHeader className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-medium">Adjuntos</CardTitle>
                <CardDescription>
                  Archivos y documentos adjuntos a este pedido.
                </CardDescription>
              </div>
              {actions}
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">{gridContent}</CardContent>
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

      {/* Confirmación eliminar uno */}
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
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación eliminar todos */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar todos los adjuntos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán {total} {total === 1 ? 'adjunto' : 'adjuntos'} de forma permanente.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll}
              disabled={deleteAllMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Visor unificado */}
      {previewIndex >= 0 && (
        <AttachmentViewer
          attachments={attachments}
          initialIndex={previewIndex}
          orderId={orderId!}
          onClose={() => setPreviewAttachmentId(null)}
          onDownload={handleDownload}
          canDelete={canDelete}
          onDelete={(att) => setDeleteTargetId(att.id)}
        />
      )}
    </div>
  );
};

export default OrderAttachments;
