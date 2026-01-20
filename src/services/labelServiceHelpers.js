/**
 * Helper para extraer mensajes de error de respuestas de la API de etiquetas
 * Prioriza userMessage sobre message para mostrar errores en formato natural
 * 
 * @param {Object} error - Objeto de error de la respuesta
 * @param {string} defaultMessage - Mensaje por defecto si no se encuentra userMessage
 * @returns {string} Mensaje de error formateado
 */
export function extractLabelErrorMessage(error, defaultMessage = 'Error desconocido') {
    return error?.userMessage || 
           error?.data?.userMessage || 
           error?.response?.data?.userMessage || 
           error?.message || 
           defaultMessage;
}

/**
 * Helper para manejar respuestas de la API de etiquetas
 * Extrae el mensaje de error si la respuesta no es exitosa
 * 
 * @param {Response} response - Respuesta de fetch
 * @param {string} defaultErrorMessage - Mensaje de error por defecto
 * @returns {Promise} Promesa que resuelve con los datos o rechaza con error
 */
export async function handleLabelServiceResponse(response, defaultErrorMessage = 'Error en la petición') {
    if (!response.ok) {
        const error = await response.json();
        const errorMessage = extractLabelErrorMessage(error, defaultErrorMessage);
        throw new Error(errorMessage);
    }
    return response.json();
}

