import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";

export async function getReceptionChartData({ token, speciesId, from, to, unit, groupBy }) {
    const query = new URLSearchParams({
        dateFrom: from,
        dateTo: to,
        valueType: unit,
        groupBy: groupBy,
    });

    if (speciesId && speciesId !== "all") {
        query.append("speciesId", speciesId);
    }

    return fetchWithTenant(`${API_URL_V2}raw-material-receptions/reception-chart-data?${query.toString()}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": navigator.userAgent,
        },
    }).then((response) => {
        if (!response.ok) {
            return response.json().then((errorData) => {
                throw new Error(errorData.message || "Error al obtener datos del gráfico de recepciones");
            });
        }
        return response.json();
    }).then((data) => {
        // Si el backend devuelve { data: [...] }, extraer el array
        return data.data || data;
    });
}

