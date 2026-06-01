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

/**
 * Etiqueta legible para el tipo de fuente de materia en desglose de costes (API: snake_case).
 * @param {string|null|undefined} sourceType - p. ej. stock_product, parent_output
 * @returns {string}
 */
export function getMaterialSourceTypeLabel(sourceType) {
  if (sourceType == null || sourceType === '') return '—';
  const labels = {
    stock_product: 'Stock',
    parent_output: 'Proceso padre',
  };
  return labels[sourceType] || String(sourceType);
}

/**
 * Nombre legible de una fila de fuente de materia (desglose de costes / API normalizada).
 * Prioriza etiquetas explícitas, producto, input (caja) o consumo de salida padre.
 * @param {object|null|undefined} source
 * @returns {string}
 */
export function getMaterialSourceDisplayLabel(source) {
  if (!source) return '—';

  const pickString = (...candidates) => {
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return null;
  };

  const explicit = pickString(source.sourceName, source.name, source.label);
  if (explicit) return explicit;

  if (source.product?.name) return source.product.name;

  const input = source.productionInput || source.production_input;
  if (input?.box?.product?.name) return input.box.product.name;

  const poc = source.productionOutputConsumption || source.production_output_consumption || null;
  if (poc) {
    const fromPoc = pickString(poc.productName, poc.product_name);
    if (fromPoc) return fromPoc;
    if (poc.product?.name) return poc.product.name;
    if (poc.consumedProductionOutput?.product?.name)
      return poc.consumedProductionOutput.product.name;
    if (poc.consumed_production_output?.product?.name)
      return poc.consumed_production_output.product.name;
    if (poc.productionOutput?.product?.name) return poc.productionOutput.product.name;
    if (poc.production_output?.product?.name) return poc.production_output.product.name;
  }

  const st = source.sourceType || source.source_type;
  return getMaterialSourceTypeLabel(st);
}
