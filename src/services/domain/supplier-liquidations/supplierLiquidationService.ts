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
  CloseLiquidationParams,
  ExistingLiquidation,
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
  startDate: string,
  endDate: string
): Promise<SupplierWithActivity[]> {
  const token = await getAuthToken();
  const queryParams = new URLSearchParams({
    'dates[start]': startDate,
    'dates[end]': endDate,
  });

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
  startDate: string,
  endDate: string
): Promise<SupplierLiquidationDetails> {
  const token = await getAuthToken();
  const queryParams = new URLSearchParams({
    'dates[start]': startDate,
    'dates[end]': endDate,
  });

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

export interface DownloadPdfParams {
  supplierId: number | string;
  startDate: string;
  endDate: string;
  supplierName?: string;
  selectedReceptions?: number[];
  selectedDispatches?: number[];
  paymentMethod?: string | null;
  hasManagementFee?: boolean;
  showTransferPayment?: boolean;
}

/**
 * Descarga el PDF de la liquidación de un proveedor.
 */
export async function downloadSupplierLiquidationPdf(params: DownloadPdfParams): Promise<boolean> {
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

  const token = await getAuthToken();
  const queryParams = new URLSearchParams({
    'dates[start]': startDate,
    'dates[end]': endDate,
    has_management_fee: hasManagementFee ? '1' : '0',
    show_transfer_payment: showTransferPayment ? '1' : '0',
  });

  if (selectedReceptions.length > 0) {
    selectedReceptions.forEach((id) => queryParams.append('receptions[]', String(id)));
  }
  if (selectedDispatches.length > 0) {
    selectedDispatches.forEach((id) => queryParams.append('dispatches[]', String(id)));
  }
  if (paymentMethod) {
    queryParams.append('payment_method', paymentMethod);
  }

  const response = await fetchWithTenant(
    `${BASE_URL}/${supplierId}/pdf?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    let errorData: unknown = null;
    let errorText: string | null = null;
    try {
      const clone = response.clone();
      errorData = await clone.json();
    } catch {
      try {
        const clone = response.clone();
        errorText = await clone.text();
      } catch {
        errorText = 'No se pudo leer el contenido del error';
      }
    }
    const err = new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    (err as Error & { status?: number; data?: unknown; text?: string | null }).status =
      response.status;
    (err as Error & { status?: number; data?: unknown; text?: string | null }).data = errorData;
    (err as Error & { status?: number; data?: unknown; text?: string | null }).text = errorText;
    console.error('Error durante la descarga del PDF:', {
      status: response.status,
      data: errorData,
      text: errorText,
    });
    throw err;
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  let fileName = `Liquidacion_${supplierName}_${startDate}_${endDate}.pdf`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?(.+)"?/i);
    if (match?.[1]) fileName = match[1];
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);

  return true;
}

/**
 * Cierra una liquidación: persiste el registro y vincula las recepciones/salidas.
 */
export async function closeLiquidation(
  params: CloseLiquidationParams
): Promise<ExistingLiquidation> {
  const token = await getAuthToken();

  const response = await fetchWithTenant(`${BASE_URL}/close`, {
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
    const err = new Error(getErrorMessage(errorData) || 'Error al cerrar la liquidación');
    (err as Error & { status?: number; data?: unknown }).status = response.status;
    (err as Error & { status?: number; data?: unknown }).data = errorData;
    throw err;
  }

  const data = await response.json();
  return (data.data ?? data) as ExistingLiquidation;
}

/**
 * Reabre una liquidación: elimina el registro y libera todas las recepciones/salidas.
 */
export async function reopenLiquidation(liquidationId: number | string): Promise<void> {
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
    const err = new Error(getErrorMessage(errorData) || 'Error al reabrir la liquidación');
    (err as Error & { status?: number; data?: unknown }).status = response.status;
    (err as Error & { status?: number; data?: unknown }).data = errorData;
    throw err;
  }
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
