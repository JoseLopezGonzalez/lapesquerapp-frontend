'use client';

import { useProductionAttachments } from '@/hooks/production/useProductionAttachments';
import {
  getProductionBlobUrlCached,
  getProductionThumbnailBlobUrlCached,
} from '@/services/domain/productions/productionAttachmentService';
import { MaquilaAttachmentsGrid } from '../Shared/MaquilaAttachmentsGrid';

interface MaquilaProductionAttachmentsGridProps {
  productionId: number | string;
}

/** Adjuntos de una producción — ver MaquilaAttachmentsGrid (componente genérico compartido). */
export function MaquilaProductionAttachmentsGrid({
  productionId,
}: MaquilaProductionAttachmentsGridProps) {
  const { attachments, isLoading } = useProductionAttachments(productionId);

  return (
    <MaquilaAttachmentsGrid
      attachments={attachments}
      isLoading={isLoading}
      getThumbnailUrl={(attachmentId) =>
        getProductionThumbnailBlobUrlCached(productionId, attachmentId)
      }
      getBlobUrl={(attachmentId) => getProductionBlobUrlCached(productionId, attachmentId)}
      emptyTitle="Sin adjuntos"
      emptyDescription="Este lote no tiene fotos ni documentos adjuntos."
    />
  );
}
