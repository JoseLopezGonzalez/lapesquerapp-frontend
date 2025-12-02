import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V1 } from "@/configs/config";


export const getSpecies = async () => {
    return await fetchWithTenant(`${API_URL_V1}species`)
        .then(response => response.json())
        .then(data => data.data)
        .catch(error => {
            // console.log(error);
            throw error;
        })
        .finally(() => {
        });
}
