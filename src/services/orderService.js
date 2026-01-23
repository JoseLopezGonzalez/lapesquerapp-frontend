// /src/services/orderService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V1, API_URL_V2 } from "@/configs/config";
import { getSession } from "next-auth/react";
import { getErrorMessage, handleServiceResponse } from "@/lib/api/apiHelpers";
import { getUserAgent } from '@/lib/utils/getUserAgent';

/**
 * Fetches the details of an order by its ID.
 *
 * @param {string} orderId - The ID of the order to retrieve.
 * @param {string} token - The authentication token for the request.
 * @returns {Promise<Object>} A promise that resolves to the order data.
 * @throws {Error} Throws an error if the request fails or the response is not OK.
 */
export function getOrder(orderId, token) {
    console.log('[getOrder] 🚀 Inicio - orderId:', orderId, 'timestamp:', new Date().toISOString());
    const startTime = performance.now();
    
    return fetchWithTenant(`${API_URL_V2}orders/${orderId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
        },
    })
        .then(async (response) => {
            const responseTime = performance.now();
            console.log('[getOrder] ⏱️ Respuesta recibida (tiempo:', (responseTime - startTime).toFixed(2), 'ms)');
            
            const data = await handleServiceResponse(response, null, 'Error al obtener el pedido');
            const parseTime = performance.now();
            console.log('[getOrder] ⏱️ Datos parseados (tiempo total:', (parseTime - startTime).toFixed(2), 'ms)');
            
            if (!data) return null;
            return data.data || data;
        })
        .catch((error) => {
            const errorTime = performance.now();
            console.error('[getOrder] ❌ Error (tiempo:', (errorTime - startTime).toFixed(2), 'ms):', error);
            // Aquí puedes agregar lógica adicional de logging o manejo global del error
            throw error;
        })
        .finally(() => {
            const totalTime = performance.now();
            console.log('[getOrder] ✅ Finalizado (tiempo total:', (totalTime - startTime).toFixed(2), 'ms)');
            // Código a ejecutar independientemente del resultado (por ejemplo, limpiar loaders)
        });
}


/**
 * Updates an order with the given data.
 *
 * @param {string} orderId - The ID of the order to update.
 * @param {Object} orderData - The data to update the order with.
 * @param {string} token - The authorization token for the request.
 * @returns {Promise<Object>} A promise that resolves to the updated order data.
 * @throws {Error} Throws an error if the update fails or the server responds with an error.
 */
export function updateOrder(orderId, orderData, token) {

    return fetchWithTenant(`${API_URL_V2}orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
        },
        body: JSON.stringify(orderData),
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
            return data.data;
        })
        .catch((error) => {
            // Manejo adicional de errores, si lo requieres
            throw error;
        })
        .finally(() => {
        });
}


/**
 * Fetches the active orders from the API.
 *
 * @param {string} token - The authentication token to be included in the request headers.
 * @returns {Promise<Array>} A promise that resolves to an array of active orders.
 * @throws {Error} Throws an error if the request fails or the response contains an error message.
 */
export function getActiveOrders(token) {
    if (!token) {
        console.error('[getActiveOrders] ❌ No se proporcionó token');
        return Promise.reject(new Error('No se proporcionó token de autenticación'));
    }

    console.log('[getActiveOrders] 🚀 Inicio - timestamp:', new Date().toISOString());
    const startTime = performance.now();
    
    const url = `${API_URL_V2}orders/active`;
    console.log('[getActiveOrders] 📡 Realizando petición a:', url);

    return fetchWithTenant(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
        },
    })
        .then((response) => {
            const responseTime = performance.now();
            console.log('[getActiveOrders] ⏱️ Respuesta recibida (tiempo:', (responseTime - startTime).toFixed(2), 'ms) - status:', response.status, response.statusText);
            if (!response.ok) {
                return response.json().then((errorData) => {
                    console.error('[getActiveOrders] ❌ Error en respuesta:', errorData);
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener los pedidos activos');
                });
            }
            return response.json();
        })
        .then((data) => {
            const parseTime = performance.now();
            console.log('[getActiveOrders] ⏱️ Datos parseados (tiempo:', (parseTime - startTime).toFixed(2), 'ms)');
            
            // Manejar diferentes estructuras de respuesta
            // Si la respuesta es directamente un array, devolverlo
            if (Array.isArray(data)) {
                console.log('[getActiveOrders] ✅ Respuesta es array directo, longitud:', data.length);
                console.log('[getActiveOrders] ✅ Completado (tiempo total:', (performance.now() - startTime).toFixed(2), 'ms)');
                return data;
            }
            // Si la respuesta tiene la estructura { data: [...] }, devolver data.data
            if (data && data.data !== undefined) {
                // Si data.data es un array, devolverlo
                if (Array.isArray(data.data)) {
                    console.log('[getActiveOrders] ✅ Respuesta tiene data.data (array), longitud:', data.data.length);
                    console.log('[getActiveOrders] ✅ Completado (tiempo total:', (performance.now() - startTime).toFixed(2), 'ms)');
                    return data.data;
                }
                // Si data.data es null o undefined, devolver array vacío
                console.warn('[getActiveOrders] ⚠️ data.data no es un array:', data.data);
                return [];
            }
            // Si la respuesta tiene otra estructura, intentar devolver data directamente
            // o un array vacío si no hay datos
            console.warn('[getActiveOrders] ⚠️ Estructura de respuesta inesperada:', data);
            return [];
        })
        .catch((error) => {
            const errorTime = performance.now();
            console.error('[getActiveOrders] ❌ Error capturado (tiempo:', (errorTime - startTime).toFixed(2), 'ms):', error);
            // Aquí puedes agregar lógica adicional de logging o manejo global del error
            throw error;
        })
        .finally(() => {
            const totalTime = performance.now();
            console.log('[getActiveOrders] 🏁 Finalizando petición (tiempo total:', (totalTime - startTime).toFixed(2), 'ms)');
            // Código a ejecutar independientemente del resultado (por ejemplo, limpiar loaders)
        });
}

/**
 * Updates the planned product detail of an order.
 *
 * @param {string} detailId - The ID of the detail to be updated.
 * @param {Object} detailData - The data to update the detail with.
 * @param {string} token - The authentication token for the request.
 * @returns {Promise<Object>} A promise that resolves to the updated detail data.
 * @throws {Error} Throws an error if the update fails or the response is not successful.
 */
export async function updateOrderPlannedProductDetail(detailId, detailData, token) {

    return fetchWithTenant(`${API_URL_V2}order-planned-product-details/${detailId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
        },
        body: JSON.stringify(detailData),
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(getErrorMessage(errorData) || 'Error al actualizar la linea del pedido');
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
        });
}

export async function deleteOrderPlannedProductDetail(detailId, token) {

    return fetchWithTenant(`${API_URL_V2}order-planned-product-details/${detailId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
        },
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(getErrorMessage(errorData) || 'Error al eliminar la linea del pedido');
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
        });
}

export async function createOrderPlannedProductDetail(detailData, token) {

    return fetchWithTenant(`${API_URL_V2}order-planned-product-details`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
        },
        body: JSON.stringify(detailData),
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(getErrorMessage(errorData) || 'Error al crear la linea del pedido');
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
        });
}

export async function setOrderStatus(orderId, status, token) {

    return fetchWithTenant(`${API_URL_V2}orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
        body: JSON.stringify({ status }),
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
            return data.data;
        })
        .catch((error) => {
            // Manejo adicional de errores, si lo requieres
            throw error;
        })
        .finally(() => {
        });
}

export async function createOrderIncident(orderId, description, token) {

    return fetchWithTenant(`${API_URL_V2}orders/${orderId}/incident`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
        },
        body: JSON.stringify({
            description,
        }),
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al crear la incidencia');
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

export async function updateOrderIncident(orderId, resolutionType, resolutionNotes, token) {
    return fetchWithTenant(`${API_URL_V2}orders/${orderId}/incident`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
        body: JSON.stringify({
            resolution_type: resolutionType,
            resolution_notes: resolutionNotes,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al resolver la incidencia');
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

export async function destroyOrderIncident(orderId, token) {
    return fetchWithTenant(`${API_URL_V2}orders/${orderId}/incident`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al eliminar la incidencia');
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

export function getActiveOrdersOptions(token) {
    return fetchWithTenant(`${API_URL_V2}active-orders/options`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener los pedidos activos');
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

export async function getOrderRankingStats({ groupBy, valueType, dateFrom, dateTo, speciesId }, token) {
    const query = new URLSearchParams({
        groupBy,
        valueType,
        dateFrom,
        dateTo,
    });

    if (speciesId && speciesId !== 'all') {
        query.append('speciesId', speciesId);
    }

    return fetchWithTenant(`${API_URL_V2}statistics/orders/ranking?${query.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener el ranking de pedidos');
                });
            }
            return response.json();
        })
        .catch((error) => {
            console.error("getOrderRanking error:", error);
            throw error;
        })
        .finally(() => {
        });
}


export async function getSalesBySalesperson({ dateFrom, dateTo }, token) {
    const query = new URLSearchParams({ dateFrom, dateTo });

    return fetchWithTenant(`${API_URL_V2}orders/sales-by-salesperson?${query.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener las ventas por comercial');
                });
            }
            return response.json();
        })
        .catch((error) => {
            console.error("getSalesBySalesperson error:", error);
            throw error;
        })
        .finally(() => {
        });
}



export async function getOrdersTotalNetWeightStats({ dateFrom, dateTo }, token) {
    const query = new URLSearchParams({ dateFrom, dateTo })

    return fetchWithTenant(`${API_URL_V2}statistics/orders/total-net-weight?${query.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener la cantidad total vendida')
                })
            }
            return response.json()
        })
        .then((data) => {
            return data// Ajusta esta línea si tu backend responde con otra estructura
        })
        .catch((error) => {
            console.error("getTotalQuantity error:", error)
            throw error
        })
        .finally(() => {
        })
}


export async function getOrdersTotalAmountStats({ dateFrom, dateTo }, token) {
    const query = new URLSearchParams({ dateFrom, dateTo })

    return fetchWithTenant(`${API_URL_V2}statistics/orders/total-amount?${query.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener el importe total vendido')
                })
            }
            return response.json()
        })
        .then((data) => {
            return data // Ajusta según la estructura de tu backend, puede ser { value, comparisonValue, percentageChange }
        })
        .catch((error) => {
            console.error("getTotalAmount error:", error)
            throw error
        })
        .finally(() => {
        })
}


export async function getSalesChartData({ token, speciesId, categoryId, familyId, from, to, unit, groupBy }) {
    const query = new URLSearchParams({
        dateFrom: from,
        dateTo: to,
        valueType: unit,
        groupBy: groupBy,
    });

    if (speciesId && speciesId !== "all") {
        query.append("speciesId", speciesId);
    }

    if (categoryId && categoryId !== "all") {
        query.append("categoryId", categoryId);
    }

    if (familyId && familyId !== "all") {
        query.append("familyId", familyId);
    }

    return fetchWithTenant(`${API_URL_V2}orders/sales-chart-data?${query.toString()}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": getUserAgent(),
        },
    }).then(async (response) => {
        const data = await handleServiceResponse(response, [], "Error al obtener datos del gráfico de ventas");
        if (!data) return [];
        return data;
    }).then((data) => {
        // Si el backend devuelve { data: [...] }, extraer el array
        return data.data || data;
    });
}


export async function getTransportChartData({ token, from, to }) {
    const query = new URLSearchParams({
        dateFrom: from,
        dateTo: to,
    })

    return fetchWithTenant(`${API_URL_V2}orders/transport-chart-data?${query.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener los datos de transporte');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data; // Formato esperado: [{ transport: "Seur", netWeight: 18250.25 }, ...]
        })
        .catch((error) => {
            console.error("getTransportChartData error:", error);
            throw error;
        })
        .finally(() => {
        });
}


/**
 * Creates a new order by sending a POST request to the API.
 *
 * @async
 * @function createOrder
 * @param {Object} orderPayload - The payload containing order details to be sent to the API.
 * @throws {Error} Throws an error if there is no authenticated session or if the API request fails.
 * @returns {Promise<Object>} The created order data returned by the API.
 */
export const createOrder = async (orderPayload) => {
    const session = await getSession(); // Obtener la sesión dentro del servicio

    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No hay sesión autenticada. No se puede crear el pedido.");
    }

    try {
        const response = await fetchWithTenant(`${API_URL_V2}orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // Es buena práctica incluir Accept
                Authorization: `Bearer ${session.user.accessToken}`,
                'User-Agent': getUserAgent(), // User-Agent compatible con cliente y servidor
            },
            body: JSON.stringify(orderPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Lanza un error con el mensaje del backend si está disponible
            throw new Error(getErrorMessage(errorData) || `Error ${response.status}: Error al crear el pedido.`);
        }

        const data = await response.json();
        return data.data; // Asumiendo que la API devuelve los datos creados bajo 'data'
    } catch (error) {
        console.error("Error en createOrder:", error);
        throw error; // Re-lanza el error para que el componente pueda manejarlo con toast
    }
};

