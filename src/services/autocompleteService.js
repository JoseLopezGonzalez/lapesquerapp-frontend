// services/autocompleteService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getSession } from "next-auth/react";
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
    const session = await getSession(); // Obtener la sesión dentro del servicio

    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No hay sesión autenticada. No se puede obtener el token de acceso.");
    }

    try {
        const response = await fetchWithTenant(`${API_URL_V2}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.user.accessToken}`,
                'User-Agent': getUserAgent(),
            },
        });

        if (!response.ok) {
            // Si la respuesta no es OK, intentamos parsear el error del servidor.
            const errorData = await response.json();
            throw new Error(getErrorMessage(errorData) || `Error ${response.status}: Error al obtener opciones de autocompletado.`);
        }

        const data = await response.json();
        
        // Eliminar duplicados basándose en el ID
        const uniqueData = data.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );
        
        // Mapea los datos para que tengan el formato { value: id, label: name }
        return uniqueData.map((item) => ({ value: item.id, label: item.name }));
    } catch (error) {
        console.error("Error en fetchAutocompleteFilterOptions:", error);
        throw error; // Re-lanza el error para que el componente cliente pueda manejarlo.
    }
};

// services/autocompleteInputService.js

/**
 * Obtiene opciones para un componente de entrada de autocompletado desde un endpoint específico.
 * @param {string} endpoint - La parte del endpoint de la API (ej: '/products/options').
 * @returns {Promise<Array<{id: any, name: string}>>} Una promesa que resuelve con un array de opciones.
 * @throws {Error} Si la sesión no está autenticada o si la API devuelve un error.
 */
export const fetchAutocompleteInputOptions = async (endpoint) => {
    const session = await getSession(); // Obtener la sesión dentro del servicio

    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No hay sesión autenticada. No se puede obtener el token de acceso.");
    }

    try {
        const response = await fetchWithTenant(`${API_URL_V2}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.user.accessToken}`,
                'User-Agent': getUserAgent(),
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(getErrorMessage(errorData) || `Error ${response.status}: Error al obtener opciones de autocompletado.`);
        }

        const data = await response.json();
        
        // Eliminar duplicados basándose en el ID
        const uniqueData = data.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );
        
        // Mapea los datos al formato { id: item.id, name: item.name } que AutocompleteSelector espera
        return uniqueData.map((item) => ({ id: item.id, name: item.name }));
    } catch (error) {
        console.error("Error en fetchAutocompleteInputOptions:", error);
        throw error;
    }
};