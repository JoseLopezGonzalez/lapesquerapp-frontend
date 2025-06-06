// /src/services/orderService.js

import { API_URL_V1, API_URL_V2 } from "@/configs/config";



export function getPallet(palletId, token) {
    return fetch(`${API_URL_V2}pallets/${palletId}`, {
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
                    throw new Error(errorData.message || 'Error al obtener el palet');
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
            console.log('getPallet finalizado');
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

    return fetch(`${API_URL_V2}pallets/${palletId}`, {
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
                    throw new Error(errorData.message || 'Error al actualizar el pedido');
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
            console.log('updateOrder finalizado');
        });
}


/* Create OrderPlannedProductDetail */
export async function createPallet(palletData, token) {

    return fetch(`${API_URL_V2}pallets`, {
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
                throw new Error(errorData.message || 'Error al crear la linea del pedido');
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
            console.log('updateOrder finalizado');
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
    return fetch(`${API_URL_V2}pallets/assign-to-position`, {
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
                    throw new Error(errorData.message || 'Error al ubicar los palets');
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
            console.log('assignPalletsToPosition finalizado');
        });
}



