import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V1 } from "@/configs/config";

export const getTotalInventoryBySpecies = async () => {

    // Construir la URL con los parámetros de filtro
    const url = `${API_URL_V1}total-inventory-by-species`;

    // Realizar la solicitud a la API
    return await fetchWithTenant(url)
        .then(response => response.json())
        .then(data => data.data)
        .catch(error => {
            // console.log(error);
            throw error;
        })
        .finally(() => {
        });
}
