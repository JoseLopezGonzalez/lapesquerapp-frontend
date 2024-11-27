import { API_URL_V1 } from "@/configs/config";

export const getRawMaterialReceptionAnnualStats = async (year , species) => {

    // Construir la URL con los parámetros de filtro
    const url = `${API_URL_V1}raw-material-receptions-annual-stats?year=${year}&species=${species}`;

    // Realizar la solicitud a la API
    return await fetch(url)
        .then(response => response.json())
        .then(data => data.data)
        .catch(error => console.log(error))
        .finally(() => console.log('Finalizado'));
}
