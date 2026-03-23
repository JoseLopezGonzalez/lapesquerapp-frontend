// services/autocompleteService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import { API_URL_V2 } from "@/configs/config"; // Asegúrate de que esta ruta sea correcta
import { getErrorMessage } from "@/lib/api/apiHelpers";
import { getUserAgent } from '@/lib/utils/getUserAgent';

/**
 * Obtiene opciones para un componente de autocompletado desde un endpoint específico.
 * @param {string} endpoint - La parte del endpoint de la API (ej: '/clients/options').
 * @returns {Promise<Array<{value: any, label: string}>>} Una promesa que resuelve con un array de opciones formateadas.
 * @throws {Error} Si la sesión no está autenticada o si la API devuelve un error.
 */
export const fetchAutocompleteFilterOptions = async (endpoint) => {
    const token = await getAuthToken();

    try {
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'User-Agent': getUserAgent(),
            },
        };

        let response = await fetchWithTenant(`${API_URL_V2}${endpoint}`, requestOptions);

        if (!response.ok && response.status === 404 && endpoint === 'external-users/options') {
            response = await fetchWithTenant(`${API_URL_V2}external-users?page=1&perPage=100`, requestOptions);
        }

        if (!response.ok) {
            // Si la respuesta no es OK, intentamos parsear el error del servidor.
            const errorData = await response.json();
            throw new Error(getErrorMessage(errorData) || `Error ${response.status}: Error al obtener opciones de autocompletado.`);
        }

        const data = await response.json();
        const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        
        // Eliminar duplicados basándose en el ID
        const uniqueData = rows.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );
        
        // Mapea los datos para que tengan el formato { value: id, label: name }
        return uniqueData.map((item) => ({ value: item.id, label: item.name }));
    } catch (error) {
        console.error("Error en fetchAutocompleteFilterOptions:", error);
        throw error; // Re-lanza el error para que el componente cliente pueda manejarlo.
    }
};
