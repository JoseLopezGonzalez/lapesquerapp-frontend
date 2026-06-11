import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest, uploadMultipart, ApiError, getErrorMessage } from '@/lib/api/apiHelpers';
import { deleteEntityGeneric } from '@/services/generic/entityService';
import { compressImage } from '@/lib/utils/compressImage';

export interface PalletAttachment {
  id: number;
  collection: 'pallet_image';
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  uploadedBy: { id: number; name: string };
  createdAt: string;
}

export interface PalletAttachmentListResponse {
  data: PalletAttachment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const endpoint = (palletId: number | string) => `${API_URL_V2}pallets/${palletId}/attachments`;

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Nombre corto y predecible; evita nombres largos del sistema al capturar con cámara. */
export function buildPalletImageUploadFilename(
  file: File,
  palletId: number | string
): string {
  const fromMime = MIME_TO_EXTENSION[file.type];
  const fromName = file.name.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg');
  const extension =
    fromMime ?? (fromName && ['jpg', 'png', 'webp'].includes(fromName) ? fromName : 'jpg');
  const timestamp = Date.now();
  return `palet-${palletId}-${timestamp}.${extension}`;
}

/** File con nombre corto; más fiable que solo el 3.er argumento de FormData.append en móvil. */
export function preparePalletImageUploadFile(
  file: File,
  palletId: number | string
): File {
  const name = buildPalletImageUploadFilename(file, palletId);
  const type = file.type || 'image/jpeg';
  return new File([file], name, { type, lastModified: file.lastModified });
}

export const palletAttachmentService = {
  async list(
    palletId: number | string,
    params: { perPage?: number; collection?: string } = {}
  ): Promise<PalletAttachmentListResponse> {
    const token = await getAuthToken();
    const query = new URLSearchParams();
    if (params.perPage) query.set('per_page', String(params.perPage));
    if (params.collection) query.set('collection', params.collection);
    const qs = query.toString();
    return apiRequest(`${endpoint(palletId)}${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async upload(
    palletId: number | string,
    file: File,
    notes?: string
  ): Promise<PalletAttachment> {
    const token = await getAuthToken();
    const formData = new FormData();
    const compressed = await compressImage(file);
    const fileToUpload = preparePalletImageUploadFile(compressed, palletId);
    formData.append('file', fileToUpload);
    formData.append('collection', 'pallet_image');
    if (notes?.trim()) formData.append('notes', notes.trim());
    return uploadMultipart(`${endpoint(palletId)}`, token, formData) as Promise<PalletAttachment>;
  },

  async update(
    palletId: number | string,
    attachmentId: number,
    data: { notes?: string | null; metadata?: Record<string, unknown> | null }
  ): Promise<{ data: PalletAttachment }> {
    const token = await getAuthToken();
    return apiRequest(`${endpoint(palletId)}/${attachmentId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async delete(palletId: number | string, attachmentId: number): Promise<void> {
    const token = await getAuthToken();
    await deleteEntityGeneric(`${endpoint(palletId)}/${attachmentId}`, undefined, token);
  },

  /** Descarga el archivo y devuelve un Blob URL listo para usar en <img src>. */
  async getBlobUrl(palletId: number | string, attachmentId: number): Promise<string> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(`${endpoint(palletId)}/${attachmentId}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return URL.createObjectURL(blob);
  },

  /** Descarga la versión thumbnail (≤300px, generada y cacheada en servidor). */
  async getThumbnailBlobUrl(palletId: number | string, attachmentId: number): Promise<string> {
    const token = await getAuthToken();
    const blob: Blob = await apiRequest(`${endpoint(palletId)}/${attachmentId}/thumbnail`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return URL.createObjectURL(blob);
  },
};

/**
 * Caché de sesión: key → Promise<blobUrl>
 * Almacena la Promise (no el resultado) para que peticiones concurrentes
 * del mismo attachment compartan una única llamada HTTP.
 * Los fallos se eliminan del caché para permitir reintento.
 */
const blobUrlCache = new Map<string, Promise<string>>();

export function getBlobUrlCached(
  palletId: number | string,
  attachmentId: number
): Promise<string> {
  const key = `${palletId}:${attachmentId}`;
  if (!blobUrlCache.has(key)) {
    const promise = palletAttachmentService.getBlobUrl(palletId, attachmentId).catch((err) => {
      blobUrlCache.delete(key);
      throw err;
    });
    blobUrlCache.set(key, promise);
  }
  return blobUrlCache.get(key)!;
}

/** Elimina una entrada de caché (llamar tras borrar un attachment). */
export function invalidateBlobUrlCache(
  palletId: number | string,
  attachmentId: number
): void {
  blobUrlCache.delete(`${palletId}:${attachmentId}`);
}

/**
 * Caché de thumbnails con fallback automático a la descarga completa.
 * Si /thumbnail falla (404, 500, etc.), intenta /download para que la
 * imagen siempre se muestre aunque el endpoint de thumbnail no esté listo.
 * Si ambos fallan, elimina la entrada del caché para permitir reintento.
 */
const thumbnailBlobUrlCache = new Map<string, Promise<string>>();

export function getThumbnailBlobUrlCached(
  palletId: number | string,
  attachmentId: number
): Promise<string> {
  const key = `${palletId}:${attachmentId}`;
  if (!thumbnailBlobUrlCache.has(key)) {
    const promise = palletAttachmentService
      .getThumbnailBlobUrl(palletId, attachmentId)
      .catch(() =>
        // Thumbnail no disponible → caer al download completo como respaldo
        palletAttachmentService.getBlobUrl(palletId, attachmentId).catch((err) => {
          thumbnailBlobUrlCache.delete(key);
          throw err;
        })
      );
    thumbnailBlobUrlCache.set(key, promise);
  }
  return thumbnailBlobUrlCache.get(key)!;
}

export function invalidateThumbnailBlobUrlCache(
  palletId: number | string,
  attachmentId: number
): void {
  thumbnailBlobUrlCache.delete(`${palletId}:${attachmentId}`);
}
