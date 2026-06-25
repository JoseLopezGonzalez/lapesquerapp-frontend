import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest, uploadMultipart, ApiError, getErrorMessage } from '@/lib/api/apiHelpers';
import { deleteEntityGeneric } from '@/services/generic/entityService';

export type OrderAttachmentCollection = 'order_document' | 'order_image';

export interface OrderAttachment {
  id: number;
  collection: OrderAttachmentCollection;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  uploadedBy: { id: number; name: string };
  createdAt: string;
}

export interface OrderAttachmentListResponse {
  data: OrderAttachment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export { ApiError, getErrorMessage };

const endpoint = (orderId: number | string) => `${API_URL_V2}orders/${orderId}/attachments`;

/** Infiere la colección a partir del MIME type del archivo. */
export function inferCollection(file: File): OrderAttachmentCollection {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return imageTypes.includes(file.type) ? 'order_image' : 'order_document';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const orderAttachmentService = {
  async list(
    orderId: number | string,
    params: { perPage?: number; collection?: OrderAttachmentCollection } = {}
  ): Promise<OrderAttachmentListResponse> {
    const token = await getAuthToken();
    const query = new URLSearchParams();
    query.set('per_page', String(params.perPage ?? 50));
    if (params.collection) query.set('collection', params.collection);
    return apiRequest(`${endpoint(orderId)}?${query.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async upload(
    orderId: number | string,
    file: File,
    collection: OrderAttachmentCollection,
    notes?: string
  ): Promise<OrderAttachment> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);
    if (notes?.trim()) formData.append('notes', notes.trim());
    return uploadMultipart(endpoint(orderId), token, formData) as Promise<OrderAttachment>;
  },

  async update(
    orderId: number | string,
    attachmentId: number,
    data: { notes?: string | null; metadata?: Record<string, unknown> | null }
  ): Promise<{ data: OrderAttachment }> {
    const token = await getAuthToken();
    return apiRequest(`${endpoint(orderId)}/${attachmentId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async delete(orderId: number | string, attachmentId: number): Promise<void> {
    const token = await getAuthToken();
    await deleteEntityGeneric(`${endpoint(orderId)}/${attachmentId}`, undefined, token);
  },

  /** Descarga el archivo y dispara la descarga del navegador. */
  async download(orderId: number | string, attachment: OrderAttachment): Promise<void> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(
      `${endpoint(orderId)}/${attachment.id}/download`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.originalName;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** Devuelve un blob URL de la imagen completa (para lightbox). */
  async getBlobUrl(orderId: number | string, attachmentId: number): Promise<string> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(
      `${endpoint(orderId)}/${attachmentId}/download`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );
    return URL.createObjectURL(blob);
  },

  /** Devuelve un blob URL del thumbnail (solo para order_image). */
  async getThumbnailBlobUrl(orderId: number | string, attachmentId: number): Promise<string> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(
      `${endpoint(orderId)}/${attachmentId}/thumbnail`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );
    return URL.createObjectURL(blob);
  },
};

/** Caché de imágenes completas: key → Promise<blobUrl> */
const blobUrlCache = new Map<string, Promise<string>>();

export function getBlobUrlCached(
  orderId: number | string,
  attachmentId: number
): Promise<string> {
  const key = `${orderId}:${attachmentId}`;
  if (!blobUrlCache.has(key)) {
    const promise = orderAttachmentService.getBlobUrl(orderId, attachmentId).catch((err) => {
      blobUrlCache.delete(key);
      throw err;
    });
    blobUrlCache.set(key, promise);
  }
  return blobUrlCache.get(key)!;
}

export function invalidateBlobUrlCache(
  orderId: number | string,
  attachmentId: number
): void {
  blobUrlCache.delete(`${orderId}:${attachmentId}`);
}

/**
 * Caché de thumbnails: intenta /thumbnail, cae a /download si falla.
 * Mismo patrón que palletAttachmentService.getThumbnailBlobUrlCached.
 */
const thumbnailCache = new Map<string, Promise<string>>();

export function getThumbnailCached(
  orderId: number | string,
  attachmentId: number
): Promise<string> {
  const key = `${orderId}:${attachmentId}`;
  if (!thumbnailCache.has(key)) {
    const promise = orderAttachmentService
      .getThumbnailBlobUrl(orderId, attachmentId)
      .catch(() =>
        orderAttachmentService.getBlobUrl(orderId, attachmentId).catch((err) => {
          thumbnailCache.delete(key);
          throw err;
        })
      );
    thumbnailCache.set(key, promise);
  }
  return thumbnailCache.get(key)!;
}

export function invalidateThumbnailCache(
  orderId: number | string,
  attachmentId: number
): void {
  thumbnailCache.delete(`${orderId}:${attachmentId}`);
}
