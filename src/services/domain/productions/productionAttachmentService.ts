import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest } from '@/lib/api/apiHelpers';

export type ProductionAttachmentCollection =
  | 'production_photo'
  | 'production_quality_control'
  | 'production_document'
  | 'production_damage_or_discrepancy';

export interface ProductionAttachment {
  id: number;
  collection: ProductionAttachmentCollection;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  uploadedBy: { id: number; name: string };
  createdAt: string;
}

export interface ProductionAttachmentListResponse {
  data: ProductionAttachment[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

const endpoint = (productionId: number | string) =>
  `${API_URL_V2}productions/${productionId}/attachments`;

/**
 * Adjuntos de producción — solo lectura para el portal (docs/maquila/frontend/03-producciones.md §5).
 * Sin métodos de escritura: el portal no expone ninguna ruta de subida/edición/borrado.
 */
export const productionAttachmentService = {
  async list(
    productionId: number | string,
    params: { perPage?: number } = {}
  ): Promise<ProductionAttachmentListResponse> {
    const token = await getAuthToken();
    const query = new URLSearchParams();
    if (params.perPage) query.set('per_page', String(params.perPage));
    const qs = query.toString();
    return apiRequest(`${endpoint(productionId)}${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getBlobUrl(productionId: number | string, attachmentId: number): Promise<string> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(`${endpoint(productionId)}/${attachmentId}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return URL.createObjectURL(blob);
  },

  async getThumbnailBlobUrl(productionId: number | string, attachmentId: number): Promise<string> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(`${endpoint(productionId)}/${attachmentId}/thumbnail`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return URL.createObjectURL(blob);
  },
};

const thumbnailBlobUrlCache = new Map<string, Promise<string>>();

/** Cachea el thumbnail; si el mimeType no genera thumbnail (documentos), cae al download completo. */
export function getProductionThumbnailBlobUrlCached(
  productionId: number | string,
  attachmentId: number
): Promise<string> {
  const key = `${productionId}:${attachmentId}`;
  if (!thumbnailBlobUrlCache.has(key)) {
    const promise = productionAttachmentService
      .getThumbnailBlobUrl(productionId, attachmentId)
      .catch(() =>
        productionAttachmentService.getBlobUrl(productionId, attachmentId).catch((err) => {
          thumbnailBlobUrlCache.delete(key);
          throw err;
        })
      );
    thumbnailBlobUrlCache.set(key, promise);
  }
  return thumbnailBlobUrlCache.get(key)!;
}

const blobUrlCache = new Map<string, Promise<string>>();

export function getProductionBlobUrlCached(
  productionId: number | string,
  attachmentId: number
): Promise<string> {
  const key = `${productionId}:${attachmentId}`;
  if (!blobUrlCache.has(key)) {
    const promise = productionAttachmentService
      .getBlobUrl(productionId, attachmentId)
      .catch((err) => {
        blobUrlCache.delete(key);
        throw err;
      });
    blobUrlCache.set(key, promise);
  }
  return blobUrlCache.get(key)!;
}
