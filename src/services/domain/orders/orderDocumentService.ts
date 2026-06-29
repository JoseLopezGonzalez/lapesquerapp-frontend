import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { performActionGeneric, downloadFileGeneric } from '@/services/generic/entityService';

function getOrderExportUrl(
  orderId: number | string,
  documentName: string,
  type: string
): string {
  if (documentName === 'restricted-order-signs' && type === 'pdf') {
    return `${API_URL_V2}orders/${orderId}/pdf/restricted-order-signs`;
  }
  return `${API_URL_V2}orders/${orderId}/${type}/${documentName}`;
}

async function handleSendResponse(response: Response): Promise<unknown> {
  return response.json();
}

async function catchSendError(err: unknown): Promise<never> {
  if (err instanceof Response) {
    const errorData = await err.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData as object) || 'Error');
  }
  throw err;
}

export const orderDocumentService = {
  async downloadDocument(
    orderId: number | string,
    documentName: string,
    type: string,
    fileName: string
  ): Promise<boolean> {
    const url = getOrderExportUrl(orderId, documentName, type);
    // downloadFileGeneric maps 'excel' → 'xls'; pass 'excel' for xls files
    const mappedType = type === 'xls' ? 'excel' : type;
    return downloadFileGeneric(url, fileName, mappedType);
  },

  async sendCustomDocuments(orderId: number | string, json: unknown): Promise<unknown> {
    const response = await performActionGeneric(
      `${API_URL_V2}orders/${orderId}/send-custom-documents`,
      'POST',
      json
    ).catch(catchSendError);
    return handleSendResponse(response);
  },

  async sendMaquiladorDocuments(orderId: number | string): Promise<unknown> {
    const response = await performActionGeneric(
      `${API_URL_V2}orders/${orderId}/send-maquilador-documents`,
      'POST',
      {}
    ).catch(catchSendError);
    return handleSendResponse(response);
  },

  async sendStandardDocuments(orderId: number | string): Promise<unknown> {
    const response = await performActionGeneric(
      `${API_URL_V2}orders/${orderId}/send-standard-documents`,
      'POST',
      {}
    ).catch(catchSendError);
    const data = (await handleSendResponse(response)) as { data: unknown };
    return data.data;
  },
};
