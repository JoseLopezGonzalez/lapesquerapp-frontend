/**
 * Utilidades de formateo para módulo de producción
 */

/**
 * Formatea un peso en kg con 2 decimales
 * @param {number|string|null|undefined} weight - Peso a formatear
 * @returns {string} - Peso formateado (ej: "12.50 kg")
 */
export const formatWeight = (weight) => {
    if (weight === null || weight === undefined || weight === '') return '0 kg'
    const num = parseFloat(weight)
    if (isNaN(num)) return '0 kg'
    return `${num.toFixed(2)} kg`
}

/**
 * Formatea un número con decimales opcionales
 * @param {number|string|null|undefined} value - Valor a formatear
 * @param {number} decimals - Número de decimales (default: 2)
 * @returns {string} - Número formateado
 */
export const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || value === '') return '0'
    const num = parseFloat(value)
    if (isNaN(num)) return '0'
    return num.toFixed(decimals)
}

/**
 * Formatea una fecha en formato español
 * @param {string|Date|null|undefined} dateString - Fecha a formatear
 * @param {object} options - Opciones de formateo
 * @returns {string} - Fecha formateada o 'N/A'
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A'
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    }
    
    try {
        return new Date(dateString).toLocaleDateString('es-ES', defaultOptions)
    } catch (error) {
        return 'N/A'
    }
}

/**
 * Formatea una fecha larga (con mes completo)
 * @param {string|Date|null|undefined} dateString - Fecha a formatear
 * @returns {string} - Fecha formateada o 'N/A'
 */
export const formatDateLong = (dateString) => {
    return formatDate(dateString, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Obtiene el nombre del producto de un objeto (maneja camelCase y snake_case)
 * @param {object} item - Objeto que puede tener product.name, productName, etc.
 * @returns {string} - Nombre del producto o 'Sin nombre'
 */
export const getProductName = (item) => {
    if (!item) return 'Sin nombre'
    return item.product?.name || item.productName || 'Sin nombre'
}

/**
 * Obtiene el peso de un objeto (maneja camelCase y snake_case)
 * @param {object} item - Objeto que puede tener weightKg, weight_kg, etc.
 * @returns {number} - Peso numérico o 0
 */
export const getWeight = (item) => {
    if (!item) return 0
    const weight = item.weightKg || item.weight_kg || item.netWeight || item.net_weight || 0
    return parseFloat(weight) || 0
}

/**
 * Obtiene el ID de un output (maneja camelCase y snake_case)
 * @param {object} consumption - Objeto de consumo
 * @returns {string|null} - ID del output o null
 */
export const getOutputId = (consumption) => {
    if (!consumption) return null
    return consumption.productionOutputId?.toString() || 
           consumption.production_output_id?.toString() || 
           null
}

/**
 * Obtiene el peso consumido (maneja camelCase y snake_case)
 * @param {object} consumption - Objeto de consumo
 * @returns {number} - Peso consumido o 0
 */
export const getConsumedWeight = (consumption) => {
    if (!consumption) return 0
    const weight = consumption.consumedWeightKg || consumption.consumed_weight_kg || 0
    return parseFloat(weight) || 0
}

/**
 * Obtiene las cajas consumidas (maneja camelCase y snake_case)
 * @param {object} consumption - Objeto de consumo
 * @returns {number} - Cajas consumidas o 0
 */
export const getConsumedBoxes = (consumption) => {
    if (!consumption) return 0
    return parseInt(consumption.consumedBoxes || consumption.consumed_boxes || 0) || 0
}

/**
 * Calcula el peso promedio por caja
 * @param {number} totalWeight - Peso total
 * @param {number} boxes - Número de cajas
 * @returns {number} - Peso promedio o 0
 */
export const calculateAverageWeight = (totalWeight, boxes) => {
    if (!boxes || boxes === 0) return 0
    const weight = parseFloat(totalWeight) || 0
    return weight / boxes
}

/**
 * Formatea el peso promedio por caja
 * @param {number} totalWeight - Peso total
 * @param {number} boxes - Número de cajas
 * @returns {string} - Peso promedio formateado
 */
export const formatAverageWeight = (totalWeight, boxes) => {
    const avg = calculateAverageWeight(totalWeight, boxes)
    return formatWeight(avg)
}

