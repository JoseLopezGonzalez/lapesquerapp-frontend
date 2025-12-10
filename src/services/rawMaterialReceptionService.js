// /src/services/rawMaterialReceptionService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getSession } from "next-auth/react";

/**
 * Creates a new raw material reception by sending a POST request to the API.
 *
 * @async
 * @function createRawMaterialReception
 * @param {Object} receptionPayload - The payload containing reception details to be sent to the API.
 * @throws {Error} Throws an error if there is no authenticated session or if the API request fails.
 * @returns {Promise<Object>} The created reception data returned by the API.
 */
export const createRawMaterialReception = async (receptionPayload) => {
    const session = await getSession();

    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No hay sesión autenticada. No se puede crear la recepción.");
    }

    try {
        const response = await fetchWithTenant(`${API_URL_V2}raw-material-receptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                Authorization: `Bearer ${session.user.accessToken}`,
                'User-Agent': navigator.userAgent,
            },
            body: JSON.stringify(receptionPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: Error al crear la recepción.`);
        }

        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error("Error en createRawMaterialReception:", error);
        throw error;
    }
};

/**
 * Updates an existing raw material reception by sending a PUT request to the API.
 *
 * @async
 * @function updateRawMaterialReception
 * @param {number} receptionId - The ID of the reception to update.
 * @param {Object} receptionPayload - The payload containing reception details to be sent to the API.
 * @throws {Error} Throws an error if there is no authenticated session or if the API request fails.
 * @returns {Promise<Object>} The updated reception data returned by the API.
 */
export const updateRawMaterialReception = async (receptionId, receptionPayload) => {
    const session = await getSession();

    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No hay sesión autenticada. No se puede actualizar la recepción.");
    }

    try {
        const response = await fetchWithTenant(`${API_URL_V2}raw-material-receptions/${receptionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                Authorization: `Bearer ${session.user.accessToken}`,
                'User-Agent': navigator.userAgent,
            },
            body: JSON.stringify(receptionPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: Error al actualizar la recepción.`);
        }

        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error("Error en updateRawMaterialReception:", error);
        throw error;
    }
};

/**
 * Fetches the details of a raw material reception by its ID.
 *
 * @param {string} receptionId - The ID of the reception to retrieve.
 * @param {string} token - The authentication token for the request.
 * @returns {Promise<Object>} A promise that resolves to the reception data.
 * @throws {Error} Throws an error if the request fails or the response is not OK.
 */
export function getRawMaterialReception(receptionId, token) {
    return fetchWithTenant(`${API_URL_V2}raw-material-receptions/${receptionId}`, {
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
                    throw new Error(errorData.message || 'Error al obtener la recepción');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.data || data;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Gets supplier options for autocomplete/select components.
 *
 * @param {string} token - The authentication token for the request.
 * @returns {Promise<Array>} A promise that resolves to an array of supplier options.
 * @throws {Error} Throws an error if the request fails.
 */
export function getSupplierOptions(token) {
    return fetchWithTenant(`${API_URL_V2}suppliers/options`, {
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
                    throw new Error(errorData.message || 'Error al obtener los proveedores');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data.map((item) => ({ value: item.id.toString(), label: item.name }));
        })
        .catch((error) => {
            throw error;
        });
}

