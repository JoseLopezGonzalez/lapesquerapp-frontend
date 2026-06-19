/**
 * Service de dominio para liquidaciones de proveedores. Bloque 6.
 */
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';
import type {
  SupplierWithActivity,
  SupplierLiquidationDetails,
  CreateLiquidationParams,
  ExistingLiquidation,
  LiquidationPdfParams,
  LiquidationPreviewPdfParams,
  SupplierLiquidationListItem,
  SupplierLiquidationListFilters,
  SupplierLiquidationShowResponse,
} from '@/types/supplierLiquidation';
import type { CatalogListResponse } from '@/types/catalog';

const BASE_URL = `${API_URL_V2}supplier-liquidations`;

/**
 * Obtiene la lista de proveedores con actividad en un rango de fechas.
 */
export async function getSuppliersWithActivity(
  startDate: string | undefined,
  endDate: string | undefined,
  onlyUnliquidated?: boolean
): Promise<SupplierWithActivity[]> {
  const token = await getAuthToken();
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('dates[start]', startDate);
  if (endDate) queryParams.set('dates[end]', endDate);
  if (onlyUnliquidated) queryParams.set('only_unliquidated', '1');

  const response = await fetchWithTenant(`${BASE_URL}/suppliers?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    let errorData: { message?: string } = {
      message: `Error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = (await response.json()) ?? errorData;
    } catch {
      // use default
    }
    throw new Error(
      getErrorMessage(errorData) ||
        `Error ${response.status}: Error al obtener la lista de proveedores.`
    );
  }

  const data = await response.json();
  return (data.data ?? data) as SupplierWithActivity[];
}

/**
 * Obtiene el detalle completo de la liquidación de un proveedor.
 */
export async function getSupplierLiquidationDetails(
  supplierId: number | string,
  startDate?: string,
  endDate?: string
): Promise<SupplierLiquidationDetails> {
  const token = await getAuthToken();
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('dates[start]', startDate);
  if (endDate) queryParams.set('dates[end]', endDate);

  const response = await fetchWithTenant(
    `${BASE_URL}/${supplierId}/details?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    let errorData: { message?: string } = {
      message: `Error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = (await response.json()) ?? errorData;
    } catch {
      // use default
    }
    throw new Error(
      getErrorMessage(errorData) ||
        `Error ${response.status}: Error al obtener el detalle de la liquidación.`
    );
  }

  const data = await response.json();
  return (data.data ?? data) as SupplierLiquidationDetails;
}

/** Helper interno: descarga un blob PDF desde una URL */
async function downloadPdfBlob(url: string, fileName: string): Promise<boolean> {
  const token = await getAuthToken();

  const response = await fetchWithTenant(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    let errorData: unknown = null;
    try {
      errorData = await response.clone().json();
    } catch {
      // use default
    }
    const err = new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    (err as Error & { status?: number; data?: unknown }).status = response.status;
    (err as Error & { status?: number; data?: unknown }).data = errorData;
    throw err;
  }

  const disposition = response.headers.get('Content-Disposition');
  if (disposition) {
    const match = disposition.match(/filename="?(.+)"?/i);
    if (match?.[1]) fileName = match[1];
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
  return true;
}

/**
 * Crea una liquidación: persiste el registro y vincula las recepciones/salidas seleccionadas.
 */
export async function createLiquidation(
  params: CreateLiquidationParams
): Promise<ExistingLiquidation> {
  const token = await getAuthToken();

  const response = await fetchWithTenant(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorData: { message?: string; errors?: Record<string, string[]> } = {
      message: `Error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = (await response.json()) ?? errorData;
    } catch {
      // use default
    }
    const err = new Error(getErrorMessage(errorData) || 'Error al crear la liquidación');
    (err as Error & { status?: number; data?: unknown }).status = response.status;
    (err as Error & { status?: number; data?: unknown }).data = errorData;
    throw err;
  }

  const data = await response.json();
  return (data.data ?? data) as ExistingLiquidation;
}

/**
 * Elimina una liquidación y libera las recepciones/salidas vinculadas.
 */
export async function deleteLiquidation(liquidationId: number | string): Promise<void> {
  const token = await getAuthToken();

  const response = await fetchWithTenant(`${BASE_URL}/${liquidationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    let errorData: { message?: string } = {
      message: `Error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = (await response.json()) ?? errorData;
    } catch {
      // use default
    }
    const err = new Error(getErrorMessage(errorData) || 'Error al eliminar la liquidación');
    (err as Error & { status?: number; data?: unknown }).status = response.status;
    (err as Error & { status?: number; data?: unknown }).data = errorData;
    throw err;
  }
}

/**
 * Descarga la vista previa en PDF antes de crear la liquidación.
 * Endpoint: GET /{supplierId}/preview-pdf
 */
export async function downloadLiquidationPreviewPdf(
  params: LiquidationPreviewPdfParams
): Promise<boolean> {
  const {
    supplierId,
    startDate,
    endDate,
    supplierName = 'Proveedor',
    selectedReceptions = [],
    selectedDispatches = [],
    paymentMethod = null,
    hasManagementFee = false,
    showTransferPayment = true,
  } = params;

  const queryParams = new URLSearchParams({
    'dates[start]': startDate,
    'dates[end]': endDate,
    has_management_fee: hasManagementFee ? '1' : '0',
    show_transfer_payment: showTransferPayment ? '1' : '0',
  });
  selectedReceptions.forEach((id) => queryParams.append('receptions[]', String(id)));
  selectedDispatches.forEach((id) => queryParams.append('dispatches[]', String(id)));
  if (paymentMethod) queryParams.append('payment_method', paymentMethod);

  const fileName = `Preview_Liquidacion_${supplierName}_${startDate}_${endDate}.pdf`;
  return downloadPdfBlob(
    `${BASE_URL}/${supplierId}/preview-pdf?${queryParams.toString()}`,
    fileName
  );
}

/**
 * Descarga el PDF de una liquidación ya creada.
 * Endpoint: GET /{liquidationId}/pdf
 */
export async function downloadLiquidationPdf(params: LiquidationPdfParams): Promise<boolean> {
  const {
    liquidationId,
    supplierName = 'Liquidacion',
    paymentMethod = null,
    hasManagementFee = false,
    showTransferPayment = true,
  } = params;

  const queryParams = new URLSearchParams({
    has_management_fee: hasManagementFee ? '1' : '0',
    show_transfer_payment: showTransferPayment ? '1' : '0',
  });
  if (paymentMethod) queryParams.append('payment_method', paymentMethod);

  const fileName = `Liquidacion_${supplierName}_${liquidationId}.pdf`;
  return downloadPdfBlob(
    `${BASE_URL}/${liquidationId}/pdf?${queryParams.toString()}`,
    fileName
  );
}

/**
 * Obtiene el listado paginado de liquidaciones cerradas.
 */
export async function getSupplierLiquidationsList(
  filters: SupplierLiquidationListFilters = {}
): Promise<CatalogListResponse<SupplierLiquidationListItem>> {
  const token = await getAuthToken();
  const { suppliers, dates, closed_at, page = 1, perPage = 15 } = filters;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('per_page', String(perPage));

  if (suppliers?.length) {
    suppliers.forEach((id) => queryParams.append('suppliers[]', String(id)));
  }
  if (dates?.start) queryParams.set('dates[start]', dates.start);
  if (dates?.end) queryParams.set('dates[end]', dates.end);
  if (closed_at?.start) queryParams.set('closed_at[start]', closed_at.start);
  if (closed_at?.end) queryParams.set('closed_at[end]', closed_at.end);

  const response = await fetchWithTenant(`${BASE_URL}?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    let errorData: { message?: string } = {
      message: `Error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = (await response.json()) ?? errorData;
    } catch {
      // use default
    }
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el listado de liquidaciones.'
    );
  }

  return response.json();
}

/**
 * Obtiene el detalle completo de una liquidación cerrada (vista histórico).
 */
export async function getSupplierLiquidationShow(
  liquidationId: number | string
): Promise<SupplierLiquidationShowResponse> {
  const token = await getAuthToken();

  const response = await fetchWithTenant(`${BASE_URL}/${liquidationId}/show`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  });

  if (!response.ok) {
    let errorData: { message?: string } = {
      message: `Error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = (await response.json()) ?? errorData;
    } catch {
      // use default
    }
    throw new Error(
      getErrorMessage(errorData) || 'Error al obtener el detalle de la liquidación.'
    );
  }

  const data = await response.json();
  return (data.data ?? data) as SupplierLiquidationShowResponse;
}
