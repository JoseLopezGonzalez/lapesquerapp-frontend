/**
 * Helper para extraer relaciones necesarias de la configuración de entidades
 * 
 * Analiza los headers de la tabla para detectar qué relaciones (instancias)
 * son necesarias basándose en los paths anidados (ej: "supplier.name", "species.name")
 */

/**
 * Extrae el nombre de la relación desde un path anidado
 * 
 * @param {string} path - Path anidado (ej: "supplier.name", "species.id")
 * @returns {string|null} - Nombre de la relación o null si no hay relación
 * 
 * @example
 * extractRelationFromPath("supplier.name") // "supplier"
 * extractRelationFromPath("species.id") // "species"
 * extractRelationFromPath("id") // null
 */
export function extractRelationFromPath(path) {
    if (!path || typeof path !== 'string') {
        return null;
    }
    
    // Si el path contiene un punto, la primera parte es la relación
    const parts = path.split('.');
    if (parts.length > 1) {
        return parts[0];
    }
    
    return null;
}

/**
 * Extrae todas las relaciones necesarias de los headers de una configuración de entidad
 * 
 * @param {Array} headers - Array de headers de la tabla (ej: config.table.headers)
 * @returns {Array<string>} - Array de nombres de relaciones únicas
 * 
 * @example
 * const headers = [
 *   { name: "id", path: "id" },
 *   { name: "supplier", path: "supplier.name" },
 *   { name: "species", path: "species.name" }
 * ];
 * extractRequiredRelations(headers) // ["supplier", "species"]
 */
export function extractRequiredRelations(headers) {
    if (!Array.isArray(headers)) {
        return [];
    }
    
    const relations = new Set();
    
    headers.forEach(header => {
        const path = header.path || header.name;
        const relation = extractRelationFromPath(path);
        if (relation) {
            relations.add(relation);
        }
    });
    
    return Array.from(relations);
}

/**
 * Agrega parámetros with[] a un URLSearchParams existente
 * 
 * @param {URLSearchParams} queryParams - Objeto URLSearchParams existente
 * @param {Array<string>} relations - Array de nombres de relaciones a cargar
 * 
 * @example
 * const params = new URLSearchParams();
 * addWithParams(params, ["supplier", "species"]);
 * // params ahora contiene: with[]=supplier&with[]=species
 */
export function addWithParams(queryParams, relations) {
    if (!Array.isArray(relations) || relations.length === 0) {
        return;
    }
    
    // Formato estándar Laravel: with[]=supplier&with[]=species
    relations.forEach(relation => {
        if (relation && typeof relation === 'string') {
            queryParams.append('with[]', relation);
        }
    });
}

