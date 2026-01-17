import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getErrorMessage } from "@/lib/api/apiHelpers";

/**
 * Obtener lista paginada de empleados
 * @param {string} token - Token JWT de autenticación
 * @param {object} params - Parámetros de consulta (page, perPage, filters, etc.)
 * @returns {Promise<Object>} - Objeto con data, meta y links
 */
export async function getEmployees(token, params = {}) {
    const queryParams = new URLSearchParams();
    
    // Parámetros de paginación
    if (params.page) queryParams.append('page', params.page);
    if (params.perPage) queryParams.append('perPage', params.perPage);
    
    // Filtros
    if (params.id) queryParams.append('id', params.id);
    if (params.ids && Array.isArray(params.ids)) {
        params.ids.forEach(id => queryParams.append('ids[]', id));
    }
    if (params.name) queryParams.append('name', params.name);
    if (params.nfc_uid) queryParams.append('nfc_uid', params.nfc_uid);
    if (params.with_last_punch) queryParams.append('with_last_punch', params.with_last_punch);
    
    const queryString = queryParams.toString();
    const url = `${API_URL_V2}employees${queryString ? `?${queryString}` : ''}`;
    
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
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener empleados');
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
 * Obtener un empleado por ID
 * @param {number} id - ID del empleado
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Datos del empleado
 */
export async function getEmployee(id, token) {
    return fetchWithTenant(`${API_URL_V2}employees/${id}`, {
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
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener el empleado');
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
 * Crear un nuevo empleado
 * @param {object} employeeData - Datos del empleado { name, nfc_uid }
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Datos del empleado creado
 */
export async function createEmployee(employeeData, token) {
    return fetchWithTenant(`${API_URL_V2}employees`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(employeeData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al crear el empleado');
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
 * Actualizar un empleado
 * @param {number} id - ID del empleado
 * @param {object} employeeData - Datos del empleado a actualizar { name?, nfc_uid? }
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Datos del empleado actualizado
 */
export async function updateEmployee(id, employeeData, token) {
    return fetchWithTenant(`${API_URL_V2}employees/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(employeeData),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al actualizar el empleado');
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
 * Eliminar un empleado
 * @param {number} id - ID del empleado
 * @param {string} token - Token JWT de autenticación
 * @returns {Promise<Object>} - Respuesta de eliminación
 */
export async function deleteEmployee(id, token) {
    return fetchWithTenant(`${API_URL_V2}employees/${id}`, {
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
                    throw new Error(getErrorMessage(errorData) || 'Error al eliminar el empleado');
                });
            }
            return response.json();
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtener opciones de empleados (para autocompletados)
 * @param {string} token - Token JWT de autenticación
 * @param {object} params - Parámetros opcionales (name)
 * @returns {Promise<Array>} - Array de opciones { id, name, nfcUid }
 */
export function getEmployeeOptions(token, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.append('name', params.name);
    
    const queryString = queryParams.toString();
    const url = `${API_URL_V2}employees/options${queryString ? `?${queryString}` : ''}`;
    
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
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener las opciones de empleados');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

