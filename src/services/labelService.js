import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getUserAgent } from '@/lib/utils/getUserAgent';
import { handleLabelServiceResponse } from './labelServiceHelpers';

export function getLabel(labelId, token) {
    return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then(response => handleLabelServiceResponse(response, 'Error al obtener la etiqueta'))
        .then(data => data.data)
        .catch(error => {
            throw error;
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
        .then(response => handleLabelServiceResponse(response, 'Error al crear la etiqueta'))
        .then(data => data)
        .catch(error => {
            throw error;
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
        .then(response => handleLabelServiceResponse(response, 'Error al actualizar la etiqueta'))
        .then(data => data)
        .catch(error => {
            throw error;
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
        .then(response => handleLabelServiceResponse(response, 'Error al obtener las etiquetas'))
        .then(data => data.data) // <- solo los datos, no el wrapper
        .catch(error => {
            throw error;
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
        .then(response => handleLabelServiceResponse(response, 'Error al eliminar la etiqueta'))
        .catch(error => {
            throw error;
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
        .then(response => handleLabelServiceResponse(response, 'Error al obtener las opciones de etiquetas'))
        .then(data => data) // <- solo los datos, no el wrapper
        .catch(error => {
            throw error;
        });
}

/* Duplicate label */
export function duplicateLabel(labelId, token, customName = null) {
    return fetchWithTenant(`${API_URL_V2}labels/${labelId}/duplicate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
        body: JSON.stringify(
            customName ? { name: customName } : {}
        ),
    })
        .then(response => handleLabelServiceResponse(response, 'Error al duplicar la etiqueta'))
        .then(data => data)
        .catch(error => {
            throw error;
        });
}


