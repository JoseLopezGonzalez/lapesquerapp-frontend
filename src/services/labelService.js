import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getUserAgent } from '@/lib/utils/getUserAgent';

export function getLabel(labelId, token) {
    return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al obtener la etiqueta';
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then(data => data.data)
        .catch(error => {
            throw error;
        })
        .finally(() => {
        });
}


export function createLabel(labelName, labelFormat, token) {
    return fetchWithTenant(`${API_URL_V2}labels`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
        body: JSON.stringify({
            name: labelName,
            format: labelFormat,
        }),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al crear la etiqueta';
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then(data => data)
        .catch(error => {
            throw error;
        })
        .finally(() => {
        });
}

export function updateLabel(labelId, labelName, labelFormat, token) {
    return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
        body: JSON.stringify({
            name: labelName,
            format: labelFormat,
        }),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al actualizar la etiqueta';
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then(data => data)
        .catch(error => {
            throw error;
        })
        .finally(() => {
        });
}


export function getLabels(token) {
    return fetchWithTenant(`${API_URL_V2}labels`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al obtener las etiquetas';
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then(data => data.data) // <- solo los datos, no el wrapper
        .catch(error => {
            throw error;
        })
        .finally(() => {
        });
}

/* Delete label */
export function deleteLabel(labelId, token) {
    return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al eliminar la etiqueta';
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })

        .catch(error => {
            throw error;
        })
        .finally(() => {
        });
}

/* Labels Options */
export function getLabelsOptions(token) {
    return fetchWithTenant(`${API_URL_V2}labels/options`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al obtener las opciones de etiquetas';
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then(data => data) // <- solo los datos, no el wrapper
        .catch(error => {
            throw error;
        })
        .finally(() => {
        });
}


