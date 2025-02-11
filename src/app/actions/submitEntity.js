// src/app/actions/submitEntity.js

'use server';

import { API_URL_V2 } from '@/configs/config';

export async function submitEntity(data, endpoint) {
    try {
        const response = await fetch(`${API_URL_V2}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || 'Error al crear la entidad');
        }

        return { success: true, data: responseData };
    } catch (error) {
        console.error('Error en Server Action:', error);
        return { success: false, error: error.message };
    }
}
