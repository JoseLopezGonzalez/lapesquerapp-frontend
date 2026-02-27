/**
 * Pallet Service - API client for pallet-related endpoints
 * @module services/palletService
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

/** Auth token for API requests */
type AuthToken = string;

/** Pallet payload for create/update */
export interface PalletPayload {
  [key: string]: unknown;
}

/** Params for getAvailablePalletsForOrder */
export interface AvailablePalletsParams {
  orderId: number | string;
  ids?: number[] | null;
  storeId?: number | string | null;
  perPage?: number;
  page?: number;
}

/** Response from getAvailablePalletsForOrder */
export interface AvailablePalletsResponse {
  data: unknown[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/** Link pallet payload */
export interface LinkPalletPayload {
  id: number | string;
  orderId: number | string;
}

// --- Pallet Timeline (GET /api/v2/pallets/{id}/timeline) ---

/** Single timeline entry; details shape depends on type */
export interface PalletTimelineEntry {
  timestamp: string;
  userId: number | null;
  userName: string;
  type: string;
  action: string;
  details: Record<string, unknown>;
}

/** Response from GET /api/v2/pallets/{id}/timeline */
export interface PalletTimelineResponse {
  timeline: PalletTimelineEntry[];
}

export function getPallet(
  palletId: number | string,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/${palletId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al obtener el palet'
          );
        });
      }
      return response.json();
    })
    .then((data: { data?: unknown }) => data.data)
    .catch((error) => {
      throw error;
    });
}

export async function getPalletTimeline(
  palletId: number | string,
  token: AuthToken
): Promise<PalletTimelineResponse> {
  const response = await fetchWithTenant(
    `${API_URL_V2}pallets/${palletId}/timeline`,
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
    const errorData = await response
      .json()
      .catch(() => ({})) as { message?: string };
    const message =
      response.status === 401
        ? 'No autenticado'
        : response.status === 403
          ? 'Sin permiso para ver el palet'
          : response.status === 404
            ? 'Palet no encontrado'
            : getErrorMessage(errorData) || 'Error al obtener el historial del palet';
    throw new Error(message);
  }

  const data = (await response.json()) as PalletTimelineResponse;
  return {
    timeline: Array.isArray(data?.timeline) ? data.timeline : [],
  };
}

/** Response from DELETE /api/v2/pallets/{id}/timeline */
export interface DeletePalletTimelineResponse {
  message: string;
}

export async function deletePalletTimeline(
  palletId: number | string,
  token: AuthToken
): Promise<DeletePalletTimelineResponse> {
  const response = await fetchWithTenant(
    `${API_URL_V2}pallets/${palletId}/timeline`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({})) as { message?: string };
    const message =
      response.status === 401
        ? 'No autenticado'
        : response.status === 403
          ? 'Sin permiso para borrar el historial'
          : response.status === 404
            ? 'Palet no encontrado'
            : getErrorMessage(errorData) || 'Error al borrar el historial del palet';
    throw new Error(message);
  }

  const data = (await response.json()) as DeletePalletTimelineResponse;
  return data;
}

export function updatePallet(
  palletId: number | string,
  palletData: PalletPayload,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/${palletId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(palletData),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al actualizar el pedido'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export async function createPallet(
  palletData: PalletPayload,
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(`${API_URL_V2}pallets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(palletData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al crear la linea del pedido'
    );
  }

  const data = await response.json();
  return data.data ?? data;
}

export async function assignPalletsToPosition(
  positionId: string,
  palletIds: number[],
  token: AuthToken
): Promise<unknown> {
  const response = await fetchWithTenant(
    `${API_URL_V2}pallets/assign-to-position`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
      body: JSON.stringify({
        position_id: positionId,
        pallet_ids: palletIds,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      getErrorMessage(errorData) || 'Error al ubicar los palets'
    );
  }

  return response.json();
}

export function movePalletToStore(
  palletId: number | string,
  storeId: number | string,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/move-to-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({
      pallet_id: palletId,
      store_id: storeId,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al mover el palet'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export function moveMultiplePalletsToStore(
  palletIds: (number | string)[],
  storeId: number | string,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/move-multiple-to-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({
      pallet_ids: palletIds,
      store_id: storeId,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al mover los palets'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export function removePalletPosition(
  palletId: number | string,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/${palletId}/unassign-position`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al quitar la posición del palet'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export function deletePallet(
  palletId: number | string,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/${palletId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al eliminar el palet'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export function unlinkPalletFromOrder(
  palletId: number | string,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/${palletId}/unlink-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al desvincular el palet'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export function unlinkPalletsFromOrders(
  palletIds: (number | string)[],
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/unlink-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({
      pallet_ids: palletIds,
    }),
  })
    .then((response) => {
      if (!response.ok && response.status !== 207) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al desvincular los palets'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export function searchPalletsByLot(
  lot: string,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(
    `${API_URL_V2}pallets/search-by-lot?lot=${encodeURIComponent(lot)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    }
  )
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al buscar palets por lote'
          );
        });
      }
      return response.json();
    })
    .then((data: { data?: unknown } | unknown[]) => {
      if (data && typeof data === 'object' && 'data' in data) {
        return (data as { data?: unknown }).data ?? data;
      }
      return data;
    })
    .catch((error) => {
      throw error;
    });
}

export function getAvailablePalletsForOrder(
  params: AvailablePalletsParams,
  token: AuthToken
): Promise<AvailablePalletsResponse> {
  const { orderId, ids, storeId, perPage = 50, page = 1 } = params;

  if (!orderId) {
    throw new Error('orderId es requerido');
  }

  const urlParams = new URLSearchParams();

  if (ids && Array.isArray(ids) && ids.length > 0) {
    ids.forEach((id) => {
      urlParams.append('ids[]', String(id));
    });
  } else if (storeId) {
    urlParams.append('storeId', String(storeId));
  }

  if (perPage) urlParams.append('perPage', String(perPage));
  if (page) urlParams.append('page', String(page));

  const queryString = urlParams.toString();
  const url = `${API_URL_V2}orders/${orderId}/available-pallets${queryString ? `?${queryString}` : ''}`;

  return fetchWithTenant(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al obtener palets disponibles'
          );
        });
      }
      return response.json();
    })
    .then((data: { data?: unknown[]; current_page?: number; last_page?: number; per_page?: number; total?: number }) => {
      if (data.data && Array.isArray(data.data)) {
        return {
          data: data.data,
          meta: {
            current_page: data.current_page ?? 1,
            last_page: data.last_page ?? 1,
            per_page: data.per_page ?? perPage,
            total: data.total ?? data.data.length,
          },
        };
      }
      return {
        data: Array.isArray(data) ? data : [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: Array.isArray(data) ? data.length : 0,
        },
      };
    })
    .catch((error) => {
      throw error;
    });
}

export function linkPalletToOrder(
  palletId: number | string,
  orderId: number | string,
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/${palletId}/link-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({ orderId }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al vincular el palet al pedido'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}

export function linkPalletsToOrders(
  pallets: LinkPalletPayload[],
  token: AuthToken
): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}pallets/link-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({
      pallets: pallets.map((p) => ({ id: p.id, orderId: p.orderId })),
    }),
  })
    .then((response) => {
      if (!response.ok && response.status !== 207) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al vincular los palets'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}
