import { fetchWithTenant } from '@lib/fetchWithTenant';
import { getSession } from 'next-auth/react';

const getAuthHeaders = async () => {
    const session = await getSession();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.user?.accessToken}`,
        'User-Agent': navigator.userAgent,
    };
};

export const fetchEntities = async (url) => {
    const headers = await getAuthHeaders();
    const response = await fetchWithTenant(url, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        // You might want to throw the full response to access status for more granular error handling
        throw response;
    }
    return await response.json();
};

export const deleteEntity = async (url, body = null) => {
    const headers = await getAuthHeaders();
    const options = {
        method: 'DELETE',
        headers: headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetchWithTenant(url, options);
    if (!response.ok) {
        throw response;
    }
    return response;
};

export const performAction = async (url, method, body) => {
    const headers = await getAuthHeaders();
    const response = await fetchWithTenant(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw response;
    }
    return response;
};


export const downloadFile = async (url, fileName, type) => {
    const headers = await getAuthHeaders();
    const currentDate = new Date().toLocaleDateString().split('/').join('-');

    try {
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw response;
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${fileName} (${currentDate}).${type === 'excel' ? 'xls' : type === 'xlsx' ? 'xlsx' : 'pdf'}`; // Dynamic file extension
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        return true; // Indicate success
    } catch (error) {
        console.error("Error during file download:", error);
        throw error; // Re-throw to be caught by the component
    }
};