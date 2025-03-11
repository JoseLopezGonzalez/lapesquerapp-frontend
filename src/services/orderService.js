// /src/services/orderService.js

import { API_URL_V1, API_URL_V2 } from "@/configs/config";


/**
 * Función para obtener los detalles de un pedido.
 * @param {string|number} orderId - ID del pedido a obtener.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Los datos del pedido.
 */
export function getOrder(orderId, token) {
    return fetch(`${API_URL_V2}orders/${orderId}`, {
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
                    throw new Error(errorData.message || 'Error al obtener el pedido');
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
            console.log('getOrder finalizado');
        });
}

/**
 * Función para actualizar los datos de un pedido.
 * @param {string|number} orderId - ID del pedido a actualizar.
 * @param {Object} orderData - Datos actualizados del pedido.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Los datos actualizados del pedido.
 */
export function updateOrder(orderId, orderData, token) {

    return fetch(`${API_URL_V2}orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
        body: JSON.stringify(orderData),
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
            return data.data;
        })
        .catch((error) => {
            // Manejo adicional de errores, si lo requieres
            throw error;
        })
        .finally(() => {
            console.log('updateOrder finalizado');
        });
}


/* getActiveOrders */
export function getActiveOrders(token) {
    return fetch(`${API_URL_V1}orders?active=true`, {
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
                    throw new Error(errorData.message || 'Error al obtener los pedidos activos');
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
            console.log('getActiveOrders finalizado');
        });
}

/* Update OrderPlannedProductDetail */
export async function updateOrderPlannedProductDetail(detailId, detailData, token) {

    return fetch(`${API_URL_V2}order-planned-product-details/${detailId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
        body: JSON.stringify(detailData),
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(errorData.message || 'Error al actualizar la linea del pedido');
            });
        }
        return response.json();
    })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            // Manejo adicional de errores, si lo requieres
            throw error;
        })
        .finally(() => {
            console.log('updateOrder finalizado');
        });
}

/* Delete OrderPlannedProductDetail */
export async function deleteOrderPlannedProductDetail(detailId, token) {

    return fetch(`${API_URL_V2}order-planned-product-details/${detailId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(errorData.message || 'Error al eliminar la linea del pedido');
            });
        }
        return response.json();
    })
        .then((data) => {
            return data.data;
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
export async function createOrderPlannedProductDetail(detailData, token) {

    return fetch(`${API_URL_V2}order-planned-product-details`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
        body: JSON.stringify(detailData),
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(errorData.message || 'Error al crear la linea del pedido');
            });
        }
        return response.json();
    })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            // Manejo adicional de errores, si lo requieres
            throw error;
        })
        .finally(() => {
            console.log('updateOrder finalizado');
        });
}