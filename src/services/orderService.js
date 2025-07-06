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

export async function setOrderStatus(orderId, status, token) {

    return fetch(`${API_URL_V2}orders/${orderId}/status?status=${status}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },

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

export async function createOrderIncident(orderId, description, token) {

    return fetch(`${API_URL_V2}orders/${orderId}/incident`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',  // <- Este es el header que necesitas
            'Authorization': `Bearer ${token}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
        },
        body: JSON.stringify({
            description,
        }),
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(errorData.message || 'Error al crear la incidencia');
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

export async function updateOrderIncident(orderId, resolutionType, resolutionNotes, token) {
    return fetch(`${API_URL_V2}orders/${orderId}/incident`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            resolution_type: resolutionType,
            resolution_notes: resolutionNotes,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al resolver la incidencia');
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
            console.log('resolveOrderIncident finalizado');
        });
}

/* destroy order incident */
export async function destroyOrderIncident(orderId, token) {
    return fetch(`${API_URL_V2}orders/${orderId}/incident`, {
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
                    throw new Error(errorData.message || 'Error al eliminar la incidencia');
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
            console.log('destroyOrderIncident finalizado');
        });
}

export function getActiveOrdersOptions(token) {
    return fetch(`${API_URL_V2}active-orders/options`, {
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
            return data;
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


/**
 * Obtener el ranking de pedidos agrupado por cliente o país.
 * @param {Object} params - Parámetros de filtro y ordenación.
 * @param {string} params.groupBy - 'client' o 'country'
 * @param {string} params.valueType - 'totalAmount' o 'totalQuantity'
 * @param {string} params.dateFrom - Fecha desde (YYYY-MM-DD)
 * @param {string} params.dateTo - Fecha hasta (YYYY-MM-DD)
 * @param {string|number} [params.speciesId] - ID de la especie (opcional)
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Array>} - Lista de objetos con { name, value }
 */
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

    return fetch(`${API_URL_V2}statistics/orders/ranking?${query.toString()}`, {
        method: 'GET',
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
                    throw new Error(errorData.message || 'Error al obtener el ranking de pedidos');
                });
            }
            return response.json();
        })
        .catch((error) => {
            console.error("getOrderRanking error:", error);
            throw error;
        })
        .finally(() => {
            console.log('getOrderRanking finalizado');
        });
}

// services/orderService.js

/**
 * Obtener las ventas totales agrupadas por comercial (por cantidad).
 * @param {Object} params - Parámetros de filtro.
 * @param {string} params.dateFrom - Fecha desde (YYYY-MM-DD)
 * @param {string} params.dateTo - Fecha hasta (YYYY-MM-DD)
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Array>} - Lista de objetos con { name, quantity }
 */
export async function getSalesBySalesperson({ dateFrom, dateTo }, token) {
    const query = new URLSearchParams({ dateFrom, dateTo });

    return fetch(`${API_URL_V2}orders/sales-by-salesperson?${query.toString()}`, {
        method: 'GET',
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
                    throw new Error(errorData.message || 'Error al obtener las ventas por comercial');
                });
            }
            return response.json();
        })
        .catch((error) => {
            console.error("getSalesBySalesperson error:", error);
            throw error;
        })
        .finally(() => {
            console.log('getSalesBySalesperson finalizado');
        });
}


/**
 * Obtener la cantidad total de kg vendidos en el período especificado.
 * @param {Object} params - Parámetros de filtro.
 * @param {string} params.dateFrom - Fecha desde (YYYY-MM-DD)
 * @param {string} params.dateTo - Fecha hasta (YYYY-MM-DD)
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<number>} - Total de kg vendidos.
 */
export async function getOrdersTotalNetWeightStats({ dateFrom, dateTo }, token) {
    const query = new URLSearchParams({ dateFrom, dateTo })

    return fetch(`${API_URL_V2}statistics/orders/total-net-weight?${query.toString()}`, {
        method: 'GET',
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
                    throw new Error(errorData.message || 'Error al obtener la cantidad total vendida')
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
            console.log('getTotalQuantity finalizado')
        })
}

/**
 * Obtener el importe total vendido en el período especificado.
 * @param {Object} params - Parámetros de filtro.
 * @param {string} params.dateFrom - Fecha desde (YYYY-MM-DD)
 * @param {string} params.dateTo - Fecha hasta (YYYY-MM-DD)
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Objeto con el valor total y la comparación
 */
export async function getOrdersTotalAmountStats({ dateFrom, dateTo }, token) {
    const query = new URLSearchParams({ dateFrom, dateTo })

    return fetch(`${API_URL_V2}statistics/orders/total-amount?${query.toString()}`, {
        method: 'GET',
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
                    throw new Error(errorData.message || 'Error al obtener el importe total vendido')
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
            console.log('getTotalAmount finalizado')
        })
}

/**
 * Obtener datos de ventas formateados para gráfico (por especie, rango de fechas y unidad).
 * @param {Object} params
 * @param {string} params.token
 * @param {string|null} params.speciesId
 * @param {string} params.from - Fecha inicio formato YYYY-MM-DD
 * @param {string} params.to - Fecha fin formato YYYY-MM-DD
 * @param {string} params.unit - 'quantity' o 'amount'
 * @param {string} params.groupBy - 'day' | 'week' | 'month'
 * @returns {Promise<Array<{ date: string, value: number }>>}
 */
export async function getSalesChartData({ token, speciesId, from, to, unit, groupBy }) {
    const query = new URLSearchParams({
        dateFrom: from,
        dateTo: to,
        valueType: unit,
        groupBy: groupBy,
    });

    if (speciesId && speciesId !== "all") {
        query.append("speciesId", speciesId);
    }

    return fetch(`${API_URL_V2}orders/sales-chart-data?${query.toString()}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": navigator.userAgent,
        },
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(errorData.message || "Error al obtener datos del gráfico de ventas");
            });
        }
        return response.json();
    });
}

/**
 * Obtener kilos transportados por empresa de transporte en un rango de fechas.
 * @param {Object} params
 * @param {string} params.token - Token JWT de autenticación
 * @param {string} params.from - Fecha desde (YYYY-MM-DD)
 * @param {string} params.to - Fecha hasta (YYYY-MM-DD)
 * @returns {Promise<Array<{ transport: string, netWeight: number }>>}
 */
export async function getTransportChartData({ token, from, to }) {
    const query = new URLSearchParams({
        dateFrom: from,
        dateTo: to,
    })

    return fetch(`${API_URL_V2}orders/transport-chart-data?${query.toString()}`, {
        method: 'GET',
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
                    throw new Error(errorData.message || 'Error al obtener los datos de transporte');
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
            console.log('getTransportChartData finalizado');
        });
}






