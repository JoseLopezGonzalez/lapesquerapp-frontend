/**
 * Formateadores para costes
 */

import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers';

/**
 * Formatea un coste por kg
 * @param {number|null|undefined} costPerKg - Coste por kg
 * @param {number} decimals - Número de decimales (default: 2)
 * @returns {string} - Coste formateado
 */
export function formatCostPerKg(costPerKg, decimals = 2) {
    if (costPerKg === null || costPerKg === undefined) return '-';
    return `${formatDecimal(costPerKg, decimals)} €/kg`;
}

/**
 * Formatea un coste total
 * @param {number|null|undefined} totalCost - Coste total
 * @param {number} decimals - Número de decimales (default: 2)
 * @returns {string} - Coste formateado
 */
export function formatTotalCost(totalCost, decimals = 2) {
    if (totalCost === null || totalCost === undefined) return '-';
    return `${formatDecimal(totalCost, decimals)} €`;
}

/**
 * Formatea un porcentaje de contribución
 * @param {number|null|undefined} percentage - Porcentaje
 * @param {number} decimals - Número de decimales (default: 2)
 * @returns {string} - Porcentaje formateado
 */
export function formatContributionPercentage(percentage, decimals = 2) {
    if (percentage === null || percentage === undefined) return '-';
    return `${formatDecimal(percentage, decimals)}%`;
}

/**
 * Obtiene el color según el tipo de coste
 * @param {string} costType - Tipo de coste
 * @returns {string} - Clase de color
 */
export function getCostTypeColor(costType) {
    const colors = {
        production: 'bg-blue-100 text-blue-800',
        labor: 'bg-green-100 text-green-800',
        operational: 'bg-yellow-100 text-yellow-800',
        packaging: 'bg-purple-100 text-purple-800',
    };
    return colors[costType] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el nombre legible del tipo de coste
 * @param {string} costType - Tipo de coste
 * @returns {string} - Nombre legible
 */
export function getCostTypeLabel(costType) {
    const labels = {
        production: 'Producción',
        labor: 'Personal',
        operational: 'Operativos',
        packaging: 'Envases',
    };
    return labels[costType] || costType;
}

