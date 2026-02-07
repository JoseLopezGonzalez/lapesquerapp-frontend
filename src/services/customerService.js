import { fetchWithTenant } from "@lib/fetchWithTenant";
// /src/services/orderService.js

import { API_URL_V1, API_URL_V2 } from "@/configs/config";
import { getErrorMessage } from "@/lib/api/apiHelpers";
import { getUserAgent } from '@/lib/utils/getUserAgent';


/**
 * Función para obtener los detalles de un pedido.
 * @param {string|number} orderId - ID del pedido a obtener.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Los datos del pedido.
 */
export function getCustomersOptions(token) {
    return fetchWithTenant(`${API_URL_V2}customers/options`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // Incluye el User-Agent del cliente
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener customers');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            // Aquí puedes agregar lógica adicional de logging o manejo global del error
            throw error;
        })
        .finally(() => {
            // Código a ejecutar independientemente del resultado (por ejemplo, limpiar loaders)
        });
}

/* getCustomer*/
export async function getCustomer(id, token) {
    return fetchWithTenant(`${API_URL_V2}customers/${id}`, {
        method: 'GET',
        headers: {
            /* 'Content-Type': 'application/json', */
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // Incluye el User-Agent del cliente
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener customer');
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
 * Obtiene el historial de pedidos de un cliente
 * @param {string|number} customerId - ID del cliente
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} - Array con el historial de productos del cliente
 */
/**
 * Obtiene el historial de pedidos de un cliente
 * @param {string|number} customerId - ID del cliente
 * @param {string} token - Token de autenticación
 * @param {Object} options - Opciones de filtrado
 * @param {string} options.dateFrom - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} options.dateTo - Fecha de fin en formato YYYY-MM-DD
 * @param {number} options.year - Año específico
 * @returns {Promise<Object>} - Objeto con available_years y data
 */
export async function getCustomerOrderHistory(customerId, token, options = {}) {
    const { dateFrom, dateTo, year } = options
    
    // Construir query params
    const queryParams = new URLSearchParams()
    if (dateFrom && dateTo) {
        queryParams.append('date_from', dateFrom)
        queryParams.append('date_to', dateTo)
    } else if (year) {
        queryParams.append('year', year.toString())
    }
    
    const url = `${API_URL_V2}customers/${customerId}/order-history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    return fetchWithTenant(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // Incluye el User-Agent del cliente
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener historial del cliente');
                });
            }
            return response.json();
        })
        .then((data) => {
            return {
                available_years: data.available_years || [],
                data: data.data || []
            };
        })
        .catch((error) => {
            // Aquí puedes agregar lógica adicional de logging o manejo global del error
            throw error;
        })
        .finally(() => {
            // Código a ejecutar independientemente del resultado (por ejemplo, limpiar loaders)
        });
}



