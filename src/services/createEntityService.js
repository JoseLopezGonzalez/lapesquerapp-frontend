// services/CreateEntityService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getSession } from "next-auth/react";

const getAuthHeaders = async () => {
    const session = await getSession();
    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No authenticated session found.");
    }
    return {
        Authorization: `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": navigator.userAgent, // Include User-Agent if required by your backend
    };
};

/**
 * Fetches options for autocomplete fields.
 * @param {string} autocompleteEndpoint - The full API URL for autocomplete options.
 * @returns {Promise<Array<{value: any, label: string}>>} Formatted options for Combobox.
 */
export const fetchAutocompleteOptions = async (autocompleteEndpoint) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetchWithTenant(autocompleteEndpoint, {
            method: 'GET',
            headers: {
                ...headers,
                // Content-Type is typically not needed for GET, but Accept is useful
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw response; // Throw the full response for detailed error handling in component
        }
        const data = await response.json();
        return data.map((item) => ({
            value: item.id,
            label: item.name,
        }));
    } catch (error) {
        console.error(`Error fetching autocomplete options from ${autocompleteEndpoint}:`, error);
        throw error;
    }
};

/**
 * Submits new entity data.
 * @param {string} url - The full API URL for entity creation.
 * @param {object} data - The form data to submit.
 * @returns {Promise<Response>} The raw fetch response.
 */
export const createEntity = async (url, data) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetchWithTenant(url, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw response; // Throw the full response for detailed error handling in component
        }
        return response;
    } catch (error) {
        console.error("Error creating entity:", error);
        throw error;
    }
};