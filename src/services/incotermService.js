// /src/services/orderService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getErrorMessage } from "@/lib/api/apiHelpers";

/**
 * Fetches the incoterms options from the API.
 *
 * @param {string} token - The authentication token to be included in the request headers.
 * @returns {Promise<Object>} A promise that resolves to the incoterms options data.
 * @throws {Error} Throws an error if the request fails or the response contains an error message.
 */

export async function getIncotermsOptions(token) {
    try {
        const response = await fetchWithTenant(`${API_URL_V2}incoterms/options`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // Enviar el token
                'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Error al obtener incoterms: ${getErrorMessage(errorData) || 'Código de estado ' + response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error en getIncotermsOptions:', error);
        throw error;
    }
}


