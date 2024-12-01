import { API_URL_V1 } from "@/configs/config";


export const getSpecies = async () => {
    return await fetch(`${API_URL_V1}species`)
        .then(response => response.json())
        .then(data => data.data)
        .catch(error => console.log(error))
        .finally(() => console.log('Finalizado'));
}
