// /src/services/orderService.js

import { API_URL_V1, API_URL_V2 } from "@/configs/config";


/**
 * Función para obtener los detalles de un pedido.
 * @param {string|number} orderId - ID del pedido a obtener.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Los datos del pedido.
 */
export function getCustomersOptions(token) {
    return fetch(`${API_URL_V2}customers/options`, {
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
                    throw new Error(errorData.message || 'Error al obtener customers');
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
            console.log('getCustomers finalizado');
        });
}

/* getCustomer*/
export async function getCustomer(id, token) {
    return fetch(`${API_URL_V2}customers/${id}`, {
        method: 'GET',
        headers: {
            /* 'Content-Type': 'application/json', */
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener customer');
                });
            }
            return response.json();
        })
        .then((data) => {
            console.log('getCustomer data:', data);
            return data.data;
        })
        .catch((error) => {
            // Aquí puedes agregar lógica adicional de logging o manejo global del error
            throw error;
        })
        .finally(() => {
            // Código a ejecutar independientemente del resultado (por ejemplo, limpiar loaders)
            console.log('getCustomer finalizado');
        });
}



