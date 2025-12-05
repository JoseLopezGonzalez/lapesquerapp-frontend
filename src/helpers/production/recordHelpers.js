/**
 * Utilidades para trabajar con production records
 * Maneja compatibilidad entre camelCase y snake_case
 */

/**
 * Obtiene un valor de un objeto buscando en ambos formatos (camelCase y snake_case)
 * @param {object} obj - Objeto del que obtener el valor
 * @param {string} camelKey - Clave en formato camelCase
 * @returns {*} - Valor encontrado o undefined
 */
export const getRecordField = (obj, camelKey) => {
    if (!obj) return undefined
    
    // Intentar camelCase primero
    if (obj[camelKey] !== undefined && obj[camelKey] !== null) {
        return obj[camelKey]
    }
    
    // Convertir camelCase a snake_case
    const snakeKey = camelKey.replace(/([A-Z])/g, '_$1').toLowerCase()
    if (obj[snakeKey] !== undefined && obj[snakeKey] !== null) {
        return obj[snakeKey]
    }
    
    return undefined
}

/**
 * Obtiene el processId de un record (maneja ambos formatos)
 * @param {object} record - Record de producción
 * @returns {number|null} - ID del proceso o null
 */
export const getProcessId = (record) => {
    if (!record) return null
    
    // Intentar directamente desde processId
    const processId = getRecordField(record, 'processId')
    if (processId) return processId
    
    // Intentar desde process.id
    const process = getRecordField(record, 'process')
    if (process?.id) return process.id
    
    return null
}

/**
 * Obtiene el parentRecordId de un record (maneja ambos formatos)
 * @param {object} record - Record de producción
 * @returns {number|null} - ID del record padre o null
 */
export const getParentRecordId = (record) => {
    return getRecordField(record, 'parentRecordId') || null
}

/**
 * Obtiene las notas de un record (maneja ambos formatos)
 * @param {object} record - Record de producción
 * @returns {string} - Notas o cadena vacía
 */
export const getRecordNotes = (record) => {
    return getRecordField(record, 'notes') || ''
}

/**
 * Obtiene el nombre del proceso de un record (maneja ambos formatos)
 * @param {object} record - Record de producción
 * @returns {string} - Nombre del proceso o cadena vacía
 */
export const getProcessName = (record) => {
    if (!record) return ''
    
    // Intentar desde process.name
    const process = getRecordField(record, 'process')
    if (process?.name) return process.name
    
    // Intentar desde processName directamente
    const processName = getRecordField(record, 'processName')
    if (processName) return processName
    
    return ''
}

