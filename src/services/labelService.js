import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";

export function getLabel(labelId, token) {
    return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'Error al obtener la etiqueta');
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
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            name: labelName,
            format: labelFormat,
        }),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'Error al crear la etiqueta');
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
            'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
            name: labelName,
            format: labelFormat,
        }),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'Error al actualizar la etiqueta');
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
            'User-Agent': navigator.userAgent,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'Error al obtener las etiquetas');
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
            'User-Agent': navigator.userAgent,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'Error al eliminar la etiqueta');
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
            'User-Agent': navigator.userAgent,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'Error al obtener las opciones de etiquetas');
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


