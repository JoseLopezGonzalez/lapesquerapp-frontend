import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";

/**
 * Obtener lista paginada de eventos de fichaje
 * @param {string} token - Token JWT de autenticación
 * @param {object} params - Parámetros de consulta (page, perPage, filters, etc.)
 * @returns {Promise<Object>} - Objeto con data, meta y links
 */
export async function getPunches(token, params = {}) {
    const queryParams = new URLSearchParams();
    
    // Parámetros de paginación
    if (params.page) queryParams.append('page', params.page);
    if (params.perPage) queryParams.append('perPage', params.perPage);
    
    // Filtros
    if (params.id) queryParams.append('id', params.id);
    if (params.ids && Array.isArray(params.ids)) {
        params.ids.forEach(id => queryParams.append('ids[]', id));
    }
    if (params.employee_id) queryParams.append('employee_id', params.employee_id);
    if (params.employee_ids && Array.isArray(params.employee_ids)) {
        params.employee_ids.forEach(id => queryParams.append('employee_ids[]', id));
    }
    if (params.event_type) queryParams.append('event_type', params.event_type);
    if (params.device_id) queryParams.append('device_id', params.device_id);
    if (params.date) queryParams.append('date', params.date);
    if (params.date_start) queryParams.append('date_start', params.date_start);
    if (params.date_end) queryParams.append('date_end', params.date_end);
    if (params.timestamp_start) queryParams.append('timestamp_start', params.timestamp_start);
    if (params.timestamp_end) queryParams.append('timestamp_end', params.timestamp_end);
    
    const queryString = queryParams.toString();
    const url = `${API_URL_V2}punches${queryString ? `?${queryString}` : ''}`;
    
    return fetchWithTenant(url, {
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
                    throw new Error(errorData.message || 'Error al obtener eventos de fichaje');
                });
            }
            return response.json();
        })
        .then((data) => {
            return {
                data: data.data || [],
                links: data.links || null,
                meta: data.meta || null
            };
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtener un evento de fichaje por ID
 * @param {number} id - ID del evento
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Datos del evento
 */
export async function getPunch(id, token) {
    return fetchWithTenant(`${API_URL_V2}punches/${id}`, {
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
                    throw new Error(errorData.message || 'Error al obtener el evento de fichaje');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Registrar un nuevo evento de fichaje
 * @param {object} punchData - Datos del fichaje { uid?, employee_id?, device_id }
 *   Nota: El timestamp se genera automáticamente en el servidor, no es necesario enviarlo
 * @param {string} token - Token JWT de autenticación (opcional, este endpoint es público dentro del tenant)
 * @returns {Promise<Object>} - Datos del evento registrado con timestamp generado por el servidor
 */
export async function createPunch(punchData, token = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': navigator.userAgent,
    };
    
    // Solo agregar Authorization si hay token
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    
    return fetchWithTenant(`${API_URL_V2}punches`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(punchData),
    })
        .then(async (response) => {
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    // Si no se puede parsear el JSON, crear un error genérico
                    errorData = {
                        message: `Error ${response.status}: ${response.statusText}`,
                        userMessage: response.statusText || 'Error al registrar el fichaje'
                    };
                }
                
                // Crear error con más información
                const error = new Error(errorData.message || errorData.userMessage || 'Error al registrar el fichaje');
                error.userMessage = errorData.userMessage || error.message;
                error.error = errorData.error;
                error.status = response.status;
                throw error;
            }
            return response.json();
        })
        .then((data) => {
            // La respuesta puede venir como { data: {...} } o directamente como el objeto
            // Si tiene data, devolverlo; si no, devolver el objeto completo
            return data.data || data;
        })
        .catch((error) => {
            // Si ya es un Error con información adicional, re-lanzarlo
            if (error.message || error.userMessage) {
                throw error;
            }
            // Si no, crear un nuevo error
            throw new Error(error.message || 'Error al registrar el fichaje');
        });
}

/**
 * Actualizar un evento de fichaje
 * @param {number} id - ID del evento
 * @param {object} punchData - Datos del fichaje a actualizar { employee_id?, event_type?, device_id?, timestamp? }
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Datos del evento actualizado
 */
export async function updatePunch(id, punchData, token) {
    return fetchWithTenant(`${API_URL_V2}punches/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(punchData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al actualizar el evento de fichaje');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Eliminar un evento de fichaje
 * @param {number} id - ID del evento
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Respuesta de eliminación
 */
export async function deletePunch(id, token) {
    return fetchWithTenant(`${API_URL_V2}punches/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al eliminar el evento de fichaje');
                });
            }
            return response.json();
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtener datos del dashboard de fichajes
 * @param {string} token - Token JWT de autenticación
 * @param {string} date - Fecha específica (opcional, formato: YYYY-MM-DD). Por defecto: hoy
 * @returns {Promise<Object>} - Datos del dashboard con workingEmployees, statistics y recentPunches
 */
export async function getPunchesDashboard(token, date = null) {
    const queryParams = new URLSearchParams();
    if (date) {
        queryParams.append('date', date);
    }
    
    const queryString = queryParams.toString();
    const url = `${API_URL_V2}punches/dashboard${queryString ? `?${queryString}` : ''}`;
    
    return fetchWithTenant(url, {
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
                    throw new Error(errorData.message || 'Error al obtener datos del dashboard');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data;
        })
        .catch((error) => {
            throw error;
        });
}

