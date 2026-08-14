import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest } from '@/lib/api/apiHelpers';

export type ReceptionAttachmentCollection =
  | 'supplier_document'
  | 'weighing_ticket'
  | 'invoice_or_delivery_note'
  | 'reception_photo'
  | 'pallet_photo'
  | 'quality_control'
  | 'damage_or_discrepancy';

export interface ReceptionAttachment {
  id: number;
  collection: ReceptionAttachmentCollection;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  uploadedBy: { id: number; name: string };
  createdAt: string;
}

export interface ReceptionAttachmentListResponse {
  data: ReceptionAttachment[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

const endpoint = (receptionId: number | string) =>
  `${API_URL_V2}raw-material-receptions/${receptionId}/attachments`;

/**
 * Adjuntos de recepción — solo lectura para el portal (docs/maquila/frontend/05-recepciones.md §3).
 * La colección 'supplier_document' es legible por el cliente de maquila pese al nombre
 * (hereda del caso general de recepciones del tenant, no implica datos de proveedor real).
 */
export const receptionAttachmentService = {
  async list(
    receptionId: number | string,
    params: { perPage?: number } = {}
  ): Promise<ReceptionAttachmentListResponse> {
    const token = await getAuthToken();
    const query = new URLSearchParams();
    if (params.perPage) query.set('per_page', String(params.perPage));
    const qs = query.toString();
    return apiRequest(`${endpoint(receptionId)}${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getBlobUrl(receptionId: number | string, attachmentId: number): Promise<string> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(`${endpoint(receptionId)}/${attachmentId}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return URL.createObjectURL(blob);
  },

  async getThumbnailBlobUrl(receptionId: number | string, attachmentId: number): Promise<string> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(`${endpoint(receptionId)}/${attachmentId}/thumbnail`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return URL.createObjectURL(blob);
  },
};

const thumbnailBlobUrlCache = new Map<string, Promise<string>>();

export function getReceptionThumbnailBlobUrlCached(
  receptionId: number | string,
  attachmentId: number
): Promise<string> {
  const key = `${receptionId}:${attachmentId}`;
  if (!thumbnailBlobUrlCache.has(key)) {
    const promise = receptionAttachmentService
      .getThumbnailBlobUrl(receptionId, attachmentId)
      .catch(() =>
        receptionAttachmentService.getBlobUrl(receptionId, attachmentId).catch((err) => {
          thumbnailBlobUrlCache.delete(key);
          throw err;
        })
      );
    thumbnailBlobUrlCache.set(key, promise);
  }
  return thumbnailBlobUrlCache.get(key)!;
}

const blobUrlCache = new Map<string, Promise<string>>();

export function getReceptionBlobUrlCached(
  receptionId: number | string,
  attachmentId: number
): Promise<string> {
  const key = `${receptionId}:${attachmentId}`;
  if (!blobUrlCache.has(key)) {
    const promise = receptionAttachmentService
      .getBlobUrl(receptionId, attachmentId)
      .catch((err) => {
        blobUrlCache.delete(key);
        throw err;
      });
    blobUrlCache.set(key, promise);
  }
  return blobUrlCache.get(key)!;
}
