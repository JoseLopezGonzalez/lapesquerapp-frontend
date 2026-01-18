// services/speciesService.js
// This file would contain the actual fetchWithTenant call for species options.
import { API_URL_V2 } from "@/configs/config"; // Assuming API_URL_V2 is also used here
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getErrorMessage, handleServiceResponse } from "@/lib/api/apiHelpers";
import { getUserAgent } from '@/lib/utils/getUserAgent';


/* getActiveOrders */
export function getSpeciesOptions(token) {
    return fetchWithTenant(`${API_URL_V2}species/options`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // Incluye el User-Agent del cliente
        },
    })
        .then(async (response) => {
            return await handleServiceResponse(response, [], 'Error al obtener las especies');
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





