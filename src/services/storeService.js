import { fetchWithTenant } from "@lib/fetchWithTenant";
// /src/services/orderService.js

import { API_URL_V1, API_URL_V2 } from "@/configs/config";
import { getErrorMessage } from "@/lib/api/apiHelpers";
import { getUserAgent } from '@/lib/utils/getUserAgent';




/* getStores*/
export async function getStore(id, token) {
    return fetchWithTenant(`${API_URL_V2}stores/${id}`, {
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
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener stores');
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

/* getStores*/
export async function getStores(token, page = 1) {
    const url = `${API_URL_V2}stores?page=${page}&perPage=6`;
    return fetchWithTenant(url, {
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
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener stores');
                });
            }
            return response.json();
        })
        .then((data) => {
            // Devolver la respuesta completa con paginación
            return {
                data: data.data || [],
                links: data.links || null,
                meta: data.meta || null
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

export function getStoreOptions(token) {
    return fetchWithTenant(`${API_URL_V2}stores/options`, {
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
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener los almacenes');
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

/**
 * Obtener la cantidad total de kg en stock (sin filtros).
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<number>} - Total de kg en stock
 */
export async function getTotalStockStats(token) {
    return fetchWithTenant(`${API_URL_V2}statistics/stock/total`, {
        method: 'GET',
        headers: {
            // 'Content-Type' no es necesario en GET con body vacío
            Authorization: `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock total');
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
        });
}


/**
 * Obtener el stock total actual agrupado por especies.
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Array>} - Array de objetos con { id, name, total_kg }
 */
export async function getStockBySpeciesStats(token) {
    return fetchWithTenant(`${API_URL_V2}statistics/stock/total-by-species`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock por especies');
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
        });
}


/**
 * Obtener el stock total actual agrupado por productos.
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Array>} - Array de objetos con { id, name, total_kg, percentage }
 */
export async function getStockByProducts(token) {
    return fetchWithTenant(`${API_URL_V2}stores/total-stock-by-products`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener el stock por productos');
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
        });
}

/**
 * Obtener palets registrados (almacén fantasma).
 * Retorna todos los palets en estado registered (state_id = 1) con formato similar a StoreDetailsResource.
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Objeto con formato de almacén fantasma
 */
export async function getRegisteredPallets(token) {
    return fetchWithTenant(`${API_URL_V2}pallets/registered`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener los palets registrados');
                });
            }
            return response.json();
        })
        .then(data => {
            // La respuesta puede venir como {data: {...}} o directamente como el objeto
            // Si tiene la propiedad data, usarla; sino, usar el objeto completo
            const result = data?.data || data;
            console.log('getRegisteredPallets - Raw response:', data);
            console.log('getRegisteredPallets - Extracted result:', result);
            console.log('getRegisteredPallets - result.content:', result?.content);
            console.log('getRegisteredPallets - result.content?.pallets:', result?.content?.pallets);
            console.log('getRegisteredPallets - result.content?.pallets?.length:', result?.content?.pallets?.length);
            return result;
        })
        .catch(error => {
            console.error('getRegisteredPallets - Error:', error);
            throw error;
        })
        .finally(() => {
        });
}




