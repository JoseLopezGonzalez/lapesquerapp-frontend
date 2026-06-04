import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { apiRequest, uploadMultipart, ApiError, getErrorMessage } from '@/lib/api/apiHelpers';
import { deleteEntityGeneric } from '@/services/generic/entityService';

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
    formData.append('file', file);
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
    await deleteEntityGeneric(`${endpoint(palletId)}/${attachmentId}`, null, token);
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
};
