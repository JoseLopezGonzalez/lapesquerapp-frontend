// services/EditEntityService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getSession } from "next-auth/react";
import { getUserAgent } from '@/lib/utils/getUserAgent';

const getAuthHeaders = async () => {
    const session = await getSession();
    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No authenticated session found.");
    }
    return {
        Authorization: `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": getUserAgent(), // ✅ Compatible con cliente y servidor
    };
};

/**
 * Fetches a single entity's data.
 * @param {string} url - The full API URL for the entity.
 * @returns {Promise<object>} The entity data.
 */
export const fetchEntityData = async (url) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: {
                ...headers,
                'Content-Type': 'application/json', // Ensure Content-Type is set for GET if necessary
            },
        });

        if (!response.ok) {
            // Throw the response to allow component to read status/body
            throw response;
        }
        const result = await response.json();
        // Manejar ambos casos: datos envueltos en 'data' o datos directos
        return result.data || result;
    } catch (error) {
        console.error("Error fetching entity data:", error);
        throw error;
    }
};

/**
 * Fetches options for autocomplete fields.
 * @param {string} autocompleteEndpoint - The API endpoint for autocomplete options.
 * @returns {Promise<Array<{value: any, label: string}>>} Formatted options for Combobox.
 */
export const fetchAutocompleteOptions = async (autocompleteEndpoint) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetchWithTenant(autocompleteEndpoint, {
            method: 'GET',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw response;
        }
        const data = await response.json();
        
        // Eliminar duplicados basándose en el ID
        const uniqueData = data.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );
        
        return uniqueData.map((item) => ({
            value: item.id,
            label: item.name,
        }));
    } catch (error) {
        console.error(`Error fetching autocomplete options from ${autocompleteEndpoint}:`, error);
        throw error;
    }
};

/**
 * Submits entity form data (create or update).
 * @param {string} url - The full API URL for submission.
 * @param {string} method - HTTP method (e.g., 'PUT', 'POST').
 * @param {object} data - The form data to submit.
 * @returns {Promise<Response>} The raw fetch response.
 */
export const submitEntityForm = async (url, method, data) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetchWithTenant(url, {
            method,
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw response;
        }
        return response;
    } catch (error) {
        console.error("Error submitting entity form:", error);
        throw error;
    }
};