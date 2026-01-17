import { fetchWithTenant } from "@lib/fetchWithTenant";
// /src/services/orderService.js

import { API_URL_V1, API_URL_V2 } from "@/configs/config";
import { getErrorMessage } from "@/lib/api/apiHelpers";



export function getPallet(palletId, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/${palletId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener el palet');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            // Aquí puedes agregar lógica adicional de logging o manejo global del error
            throw error;
        })
        .finally(() => {
            // Código a ejecutar independientemente del resultado (por ejemplo, limpiar loaders)
        });
}

/**
 * Función para actualizar los datos de un pedido.
 * @param {string|number} orderId - ID del pedido a actualizar.
 * @param {Object} orderData - Datos actualizados del pedido.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Los datos actualizados del pedido.
 */
export function updatePallet(palletId, palletData, token) {

    return fetchWithTenant(`${API_URL_V2}pallets/${palletId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
        body: JSON.stringify(palletData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al actualizar el pedido');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            // Manejo adicional de errores, si lo requieres
            throw error;
        })
        .finally(() => {
        });
}


/* Create OrderPlannedProductDetail */
export async function createPallet(palletData, token) {

    return fetchWithTenant(`${API_URL_V2}pallets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
        body: JSON.stringify(palletData),
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(getErrorMessage(errorData) || 'Error al crear la linea del pedido');
            });
        }
        return response.json();
    })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            // Manejo adicional de errores, si lo requieres
            throw error;
        })
        .finally(() => {
        });
}


/**
 * Asigna uno o varios palets a una posición.
 * @param {string} positionId - ID de la posición (por ejemplo, "A1-03").
 * @param {number[]} palletIds - Array de IDs de palets a ubicar.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Mensaje de éxito o error del backend.
 */
export async function assignPalletsToPosition(positionId, palletIds, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/assign-to-position`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            position_id: positionId,
            pallet_ids: palletIds,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al ubicar los palets');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}



/**
 * Mueve un palet a otro almacén.
 * @param {number|string} palletId - ID del palet a mover.
 * @param {number|string} storeId - ID del almacén de destino.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del backend.
 */
export function movePalletToStore(palletId, storeId, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/move-to-store`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            pallet_id: palletId,
            store_id: storeId,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al mover el palet');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}


/**
 * Mueve múltiples palets a otro almacén.
 * @param {Array<number|string>} palletIds - Array de IDs de palets a mover.
 * @param {number|string} storeId - ID del almacén de destino.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del backend con moved_count, total_count y errors.
 */
export function moveMultiplePalletsToStore(palletIds, storeId, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/move-multiple-to-store`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            pallet_ids: palletIds,
            store_id: storeId,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al mover los palets');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Elimina la posición actual de un palet (lo deja sin ubicar).
 * @param {number|string} palletId - ID del palet.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del backend.
 */
export function removePalletPosition(palletId, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/${palletId}/unassign-position`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al quitar la posición del palet');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Elimina un palet completamente.
 * @param {number|string} palletId - ID del palet a eliminar.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del backend.
 */
export function deletePallet(palletId, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/${palletId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    // Para errores 403, el backend retorna { "error": "..." }
                    // Para otros errores, puede retornar { "message": "...", "error": "..." }
                    const errorMessage = getErrorMessage(errorData) || 'Error al eliminar el palet';
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Desvincula un palet de su pedido (establece orderId a null).
 * @param {number|string} palletId - ID del palet a desvincular.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del backend.
 */
export function unlinkPalletFromOrder(palletId, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/${palletId}/unlink-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al desvincular el palet');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Desvincula múltiples palets de sus pedidos.
 * @param {Array<number|string>} palletIds - Array de IDs de palets a desvincular.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del backend con el estado de cada operación.
 */
export function unlinkPalletsFromOrders(palletIds, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/unlink-orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            pallet_ids: palletIds,
        }),
    })
        .then((response) => {
            // El endpoint puede retornar 207 (Multi-Status) si hay errores parciales
            if (!response.ok && response.status !== 207) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al desvincular los palets');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Buscar palets por lote.
 * Retorna todos los palets que tienen cajas con el lote especificado.
 * @param {string} lot - Lote a buscar
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Objeto con los palets encontrados y sus cajas
 */
export function searchPalletsByLot(lot, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/search-by-lot?lot=${encodeURIComponent(lot)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al buscar palets por lote');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data || data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Obtiene palets disponibles para vincular a un pedido.
 * Solo incluye palets en estado registered (1) o stored (2) sin pedido o del mismo pedido.
 * @param {Object} params - Parámetros de búsqueda
 * @param {number|string} params.orderId - ID del pedido (opcional). Si se proporciona, incluye palets sin pedido o del mismo pedido
 * @param {string} params.id - Filtro por ID con coincidencias parciales (opcional)
 * @param {number} params.perPage - Resultados por página (1-100, default: 20) (opcional)
 * @param {number} params.page - Número de página (opcional)
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Respuesta con data (array de palets), meta (paginación) y links
 */
export function getAvailablePalletsForOrder({ orderId = null, id = null, perPage = 50, page = 1 }, token) {
    const params = new URLSearchParams();
    
    if (orderId) {
        params.append('orderId', orderId);
    }
    if (id) {
        params.append('id', id);
    }
    if (perPage) {
        params.append('perPage', perPage);
    }
    if (page) {
        params.append('page', page);
    }

    return fetchWithTenant(`${API_URL_V2}pallets/available-for-order?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener palets disponibles');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Vincula un palet a un pedido.
 * @param {number|string} palletId - ID del palet a vincular.
 * @param {number|string} orderId - ID del pedido.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del backend.
 */
export function linkPalletToOrder(palletId, orderId, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/${palletId}/link-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            orderId: orderId,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al vincular el palet al pedido');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Vincula múltiples palets a pedidos.
 * @param {Array<{id: number, orderId: number}>} pallets - Array de objetos con id del palet y orderId.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del backend con el estado de cada operación.
 */
export function linkPalletsToOrders(pallets, token) {
    return fetchWithTenant(`${API_URL_V2}pallets/link-orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            pallets: pallets.map(p => ({ id: p.id, orderId: p.orderId })),
        }),
    })
        .then((response) => {
            // El endpoint puede retornar 207 (Multi-Status) si hay errores parciales
            if (!response.ok && response.status !== 207) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al vincular los palets');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}
