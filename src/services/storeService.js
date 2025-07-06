// /src/services/orderService.js

import { API_URL_V1, API_URL_V2 } from "@/configs/config";




/* getStores*/
export async function getStore(id, token) {
    return fetch(`${API_URL_V2}stores/${id}`, {
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
                    throw new Error(errorData.message || 'Error al obtener stores');
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
            console.log('getStores finalizado');
        });
}

/* getStores*/
export async function getStores(token) {
    return fetch(`${API_URL_V2}stores`, {
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
                    throw new Error(errorData.message || 'Error al obtener stores');
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
            console.log('getStores finalizado');
        });
}

export function getStoreOptions(token) {
    return fetch(`${API_URL_V2}stores/options`, {
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
                    throw new Error(errorData.message || 'Error al obtener los almacenes');
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
            console.log('getStoreOptions finalizado');
        });
}

/**
 * Obtener la cantidad total de kg en stock (sin filtros).
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<number>} - Total de kg en stock
 */
export async function getTotalStockStats(token) {
    return fetch(`${API_URL_V2}statistics/stock/total`, {
        method: 'GET',
        headers: {
            // 'Content-Type' no es necesario en GET con body vacío
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error al obtener el stock total');
                });
            }
            return response.json();
        })
        .then(data => {
            // Asumimos que la respuesta es { totalStock: number }
            return data;
        })
        .catch(error => {
            // Logging o manejo global aquí
            throw error;
        })
        .finally(() => {
            console.log('getTotalStock finalizado');
        });
}


/**
 * Obtener el stock total actual agrupado por especies.
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Array>} - Array de objetos con { id, name, total_kg }
 */
export async function getStockBySpeciesStats(token) {
    return fetch(`${API_URL_V2}statistics/stock/total-by-species`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error al obtener el stock por especies');
                });
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            throw error;
        })
        .finally(() => {
            console.log('getStockBySpecies finalizado');
        });
}


/**
 * Obtener el stock total actual agrupado por productos.
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Array>} - Array de objetos con { id, name, total_kg, percentage }
 */
export async function getStockByProducts(token) {
    return fetch(`${API_URL_V2}stores/total-stock-by-products`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error al obtener el stock por productos');
                });
            }
            return response.json();
        })
        .then(data => {
            return data; // Esperamos que ya venga con 'data' estructurado
        })
        .catch(error => {
            throw error;
        })
        .finally(() => {
            console.log('getStockByProducts finalizado');
        });
}




