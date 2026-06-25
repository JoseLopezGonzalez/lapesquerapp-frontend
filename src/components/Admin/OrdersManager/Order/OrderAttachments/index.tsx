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
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  formatBytes,
  type OrderAttachment,
} from '@/services/domain/orders/orderAttachmentService';
import { formatDateHour } from '@/helpers/formats/dates/formatDates';
import { cn } from '@/lib/utils';
import { OrderAttachmentUploadDialog } from './OrderAttachmentUploadDialog';
import { OrderAttachmentEditNotesDialog } from './OrderAttachmentEditNotesDialog';

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return FileText;
  if (
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

function getCollectionLabel(collection: string) {
  if (collection === 'order_document') return 'Documento';
  if (collection === 'order_image') return 'Imagen';
  return collection;
}

function AttachmentThumbnail({
  orderId,
  attachment,
}: {
  orderId: number | string;
  attachment: OrderAttachment;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getThumbnailCached(orderId, attachment.id)
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
  }, [orderId, attachment.id]);

  if (loading) return <Skeleton className="h-10 w-10 rounded" />;
  if (!src) {
    const Icon = getFileIcon(attachment.mimeType);
    return (
      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded">
        <Icon className="text-muted-foreground h-5 w-5" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={attachment.originalName}
      className="h-10 w-10 rounded object-cover"
    />
  );
}

function AttachmentIcon({ attachment }: { attachment: OrderAttachment }) {
  const Icon = getFileIcon(attachment.mimeType);
  return (
    <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded">
      <Icon className="text-muted-foreground h-5 w-5" />
    </div>
  );
}

function AttachmentRow({
  orderId,
  attachment,
  canDelete,
  isDownloading,
  onDownload,
  onEdit,
  onDelete,
}: {
  orderId: number | string;
  attachment: OrderAttachment;
  canDelete: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
      {attachment.collection === 'order_image' ? (
        <AttachmentThumbnail orderId={orderId} attachment={attachment} />
      ) : (
        <AttachmentIcon attachment={attachment} />
      )}

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium leading-tight"
          title={attachment.originalName}
        >
          {attachment.originalName}
        </p>
        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {getCollectionLabel(attachment.collection)}
          </Badge>
          <span>{formatBytes(attachment.size)}</span>
          <span>{formatDateHour(attachment.createdAt)}</span>
          {attachment.uploadedBy?.name && (
            <span className="text-muted-foreground/70">{attachment.uploadedBy.name}</span>
          )}
        </div>
        {attachment.notes && (
          <p className="text-muted-foreground mt-1 text-xs italic">"{attachment.notes}"</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDownload}
          disabled={isDownloading}
          title="Descargar"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          title="Editar notas"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive h-8 w-8"
            onClick={onDelete}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function AttachmentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

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

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrderAttachment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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

  const content = (
    <div className="space-y-4">
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

      {isLoading ? (
        <AttachmentListSkeleton />
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : attachments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <Paperclip className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-sm">Sin adjuntos todavía</p>
          <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
            Añadir el primero
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <AttachmentRow
              key={att.id}
              orderId={orderId!}
              attachment={att}
              canDelete={canDelete}
              isDownloading={downloadingId === att.id}
              onDownload={() => handleDownload(att)}
              onEdit={() => setEditTarget(att)}
              onDelete={() => setDeleteTargetId(att.id)}
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
    </div>
  );
};

export default OrderAttachments;
