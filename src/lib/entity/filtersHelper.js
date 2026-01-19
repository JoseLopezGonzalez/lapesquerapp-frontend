/**
 * Helper para procesar y agregar filtros genéricos a URLSearchParams
 * 
 * Esta función procesa todos los tipos de filtros y los agrega al query string
 * de forma consistente, permitiendo que los servicios de entidades usen filtros
 * genéricos sin necesidad de hardcodear cada tipo de filtro.
 */

/**
 * Agrega todos los filtros del objeto filters al URLSearchParams
 * 
 * @param {URLSearchParams} queryParams - Objeto URLSearchParams al que agregar los filtros
 * @param {Object} filters - Objeto con todos los filtros
 * 
 * @example
 * const params = new URLSearchParams();
 * addFiltersToParams(params, {
 *   search: 'test',
 *   ids: [1, 2, 3],
 *   dates: { start: '2024-01-01', end: '2024-12-31' },
 *   suppliers: [1, 2],
 *   notes: 'some note',
 *   _requiredRelations: ['supplier', 'species']
 * });
 */
export function addFiltersToParams(queryParams, filters = {}) {
    if (!filters || typeof filters !== 'object') {
        return;
    }

    // Procesar cada filtro en el objeto
    Object.keys(filters).forEach((key) => {
        // Saltar propiedades especiales que se procesan por separado
        if (key === '_requiredRelations') {
            return;
        }

        const value = filters[key];

        // Si el valor es null, undefined o string vacío, saltarlo
        if (value === null || value === undefined || value === '') {
            return;
        }

        // Manejar arrays (para autocomplete, textAccumulator, etc.)
        if (Array.isArray(value)) {
            if (value.length > 0) {
                value.forEach((item) => {
                    // Si el item es un objeto con id, usar el id
                    if (item && typeof item === 'object' && 'id' in item) {
                        queryParams.append(`${key}[]`, item.id);
                    } else {
                        queryParams.append(`${key}[]`, item);
                    }
                });
            }
        }
        // Manejar objetos de fecha (dateRange)
        else if (typeof value === 'object' && value !== null) {
            // Si tiene propiedades start/end, es un dateRange
            if ('start' in value || 'end' in value) {
                if (value.start) {
                    queryParams.append(`${key}[start]`, value.start);
                }
                if (value.end) {
                    queryParams.append(`${key}[end]`, value.end);
                }
            }
            // Si tiene propiedades from/to, convertir a start/end (compatibilidad)
            else if ('from' in value || 'to' in value) {
                if (value.from) {
                    queryParams.append(`${key}[start]`, value.from);
                }
                if (value.to) {
                    queryParams.append(`${key}[end]`, value.to);
                }
            }
            // Para otros objetos, convertirlos a string o ignorarlos
            else {
                // Por ahora ignoramos objetos complejos que no sean dateRange
            }
        }
        // Manejar valores primitivos (string, number, boolean)
        else {
            // Para strings, verificar que no estén vacíos
            if (typeof value === 'string' && value.trim().length > 0) {
                queryParams.append(key, value);
            }
            // Para números y booleanos, agregarlos directamente
            else if (typeof value === 'number' || typeof value === 'boolean') {
                queryParams.append(key, value.toString());
            }
        }
    });
}

