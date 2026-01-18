import { fetchWithTenant } from "@lib/fetchWithTenant";
// /src/services/orderService.js

import { API_URL_V2 } from "@/configs/config";
import { getErrorMessage } from "@/lib/api/apiHelpers";
import { getUserAgent } from '@/lib/utils/getUserAgent';





/* getActiveOrders */
export function getTaxOptions(token) {
    return fetchWithTenant(`${API_URL_V2}taxes/options`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviar el token
            'User-Agent': getUserAgent(), // Incluye el User-Agent del cliente
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener los impuestos');
                });
            }
            return response.json();
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
