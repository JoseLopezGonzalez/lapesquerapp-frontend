'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { MaquilaReadOnlyImageViewer } from './MaquilaReadOnlyImageViewer';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface GenericAttachment {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
}

interface AttachmentThumbProps<A extends GenericAttachment> {
  attachment: A;
  getThumbnailUrl: (attachmentId: number) => Promise<string>;
  onClick: () => void;
}

function AttachmentThumb<A extends GenericAttachment>({
  attachment,
  getThumbnailUrl,
  onClick,
}: AttachmentThumbProps<A>) {
  const isImage = attachment.mimeType.startsWith('image/');
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    getThumbnailUrl(attachment.id)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.id, isImage]);

  if (isImage) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="aspect-square overflow-hidden rounded-md"
        title={attachment.originalName}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border bg-muted/30 hover:bg-muted/60 flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border p-2 text-center transition-colors"
      title={attachment.originalName}
    >
      <FileText className="text-muted-foreground h-6 w-6 flex-shrink-0" />
      <span className="line-clamp-2 text-[10px] leading-tight break-all">
        {attachment.originalName}
      </span>
      <span className="text-muted-foreground text-[10px]">{formatBytes(attachment.size)}</span>
    </button>
  );
}

interface MaquilaAttachmentsGridProps<A extends GenericAttachment> {
  attachments: A[];
  isLoading: boolean;
  getThumbnailUrl: (attachmentId: number) => Promise<string>;
  getBlobUrl: (attachmentId: number) => Promise<string>;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Grid de adjuntos de solo lectura, genérico por entidad — imágenes abren un visor propio
 * (zoom + navegación), documentos se descargan directamente. Usado por producciones y
 * recepciones del portal de maquila (el almacén interactivo tiene su propia variante más
 * simple porque sus adjuntos son siempre imágenes).
 */
export function MaquilaAttachmentsGrid<A extends GenericAttachment>({
  attachments,
  isLoading,
  getThumbnailUrl,
  getBlobUrl,
  emptyTitle = 'Sin adjuntos',
  emptyDescription = 'No hay archivos adjuntos.',
}: MaquilaAttachmentsGridProps<A>) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const imageAttachments = attachments.filter((a) => a.mimeType.startsWith('image/'));

  const handleClick = async (attachment: A) => {
    if (attachment.mimeType.startsWith('image/')) {
      const idx = imageAttachments.findIndex((a) => a.id === attachment.id);
      setViewerIndex(idx >= 0 ? idx : 0);
      setViewerOpen(true);
      return;
    }
    const url = await getBlobUrl(attachment.id);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = attachment.originalName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    );
  }

  if (attachments.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={<FileText />} />;
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {attachments.map((attachment) => (
          <AttachmentThumb
            key={attachment.id}
            attachment={attachment}
            getThumbnailUrl={getThumbnailUrl}
            onClick={() => handleClick(attachment)}
          />
        ))}
      </div>
      {imageAttachments.length > 0 && (
        <MaquilaReadOnlyImageViewer
          attachments={imageAttachments}
          getBlobUrl={getBlobUrl}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          initialIndex={viewerIndex}
        />
      )}
    </>
  );
}
