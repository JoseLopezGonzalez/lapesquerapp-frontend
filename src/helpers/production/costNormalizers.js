/**
 * Normalizadores de datos para Costes
 * Convierte datos de snake_case a camelCase para consistencia en toda la aplicación
 */

import { normalizeProductionInput, normalizeProductionOutputConsumption } from './normalizers';

/**
 * Normaliza un CostCatalog de snake_case a camelCase
 * @param {object} catalog - Catalog en formato snake_case o camelCase
 * @returns {object} - Catalog normalizado en camelCase
 */
export const normalizeCostCatalog = (catalog) => {
    if (!catalog) return null;
    
    return {
        id: catalog.id,
        name: catalog.name,
        costType: catalog.cost_type || catalog.costType,
        description: catalog.description || null,
        defaultUnit: catalog.default_unit || catalog.defaultUnit,
        isActive: catalog.is_active !== undefined ? catalog.is_active : (catalog.isActive !== undefined ? catalog.isActive : true),
        createdAt: catalog.created_at || catalog.createdAt,
        updatedAt: catalog.updated_at || catalog.updatedAt,
    };
};

/**
 * Normaliza un ProductionCost de snake_case a camelCase
 * @param {object} cost - Cost en formato snake_case o camelCase
 * @returns {object} - Cost normalizado en camelCase
 */
export const normalizeProductionCost = (cost) => {
    if (!cost) return null;
    
    return {
        id: cost.id,
        productionRecordId: cost.production_record_id || cost.productionRecordId || null,
        productionId: cost.production_id || cost.productionId || null,
        costCatalogId: cost.cost_catalog_id || cost.costCatalogId || null,
        costCatalog: cost.cost_catalog ? normalizeCostCatalog(cost.cost_catalog) : (cost.costCatalog ? normalizeCostCatalog(cost.costCatalog) : null),
        costType: cost.cost_type || cost.costType,
        name: cost.name,
        description: cost.description || null,
        totalCost: cost.total_cost !== undefined ? cost.total_cost : (cost.totalCost !== undefined ? cost.totalCost : null),
        costPerKg: cost.cost_per_kg !== undefined ? cost.cost_per_kg : (cost.costPerKg !== undefined ? cost.costPerKg : null),
        distributionUnit: cost.distribution_unit || cost.distributionUnit || null,
        costDate: cost.cost_date || cost.costDate || null,
        effectiveTotalCost: cost.effective_total_cost !== undefined ? cost.effective_total_cost : (cost.effectiveTotalCost !== undefined ? cost.effectiveTotalCost : null),
        createdAt: cost.created_at || cost.createdAt,
        updatedAt: cost.updated_at || cost.updatedAt,
    };
};

/**
 * Normaliza un ProductionOutputSource de snake_case a camelCase
 * @param {object} source - Source en formato snake_case o camelCase
 * @returns {object} - Source normalizado en camelCase
 */
export const normalizeProductionOutputSource = (source) => {
    if (!source) return null;
    
    return {
        id: source.id,
        productionOutputId: source.production_output_id || source.productionOutputId,
        sourceType: source.source_type || source.sourceType,
        productionInputId: source.production_input_id || source.productionInputId || null,
        productionInput: source.production_input ? normalizeProductionInput(source.production_input) : (source.productionInput ? normalizeProductionInput(source.productionInput) : null),
        productionOutputConsumptionId: source.production_output_consumption_id || source.productionOutputConsumptionId || null,
        productionOutputConsumption: source.production_output_consumption 
            ? normalizeProductionOutputConsumption(source.production_output_consumption)
            : (source.productionOutputConsumption 
                ? normalizeProductionOutputConsumption(source.productionOutputConsumption)
                : null),
        contributedWeightKg: source.contributed_weight_kg !== undefined ? source.contributed_weight_kg : (source.contributedWeightKg !== undefined ? source.contributedWeightKg : null),
        contributedBoxes: source.contributed_boxes || source.contributedBoxes || 0,
        contributionPercentage: source.contribution_percentage !== undefined ? source.contribution_percentage : (source.contributionPercentage !== undefined ? source.contributionPercentage : null),
        sourceCostPerKg: source.source_cost_per_kg !== undefined ? source.source_cost_per_kg : (source.sourceCostPerKg !== undefined ? source.sourceCostPerKg : null),
        sourceTotalCost: source.source_total_cost !== undefined ? source.source_total_cost : (source.sourceTotalCost !== undefined ? source.sourceTotalCost : null),
        createdAt: source.created_at || source.createdAt,
        updatedAt: source.updated_at || source.updatedAt,
    };
};

/**
 * Normaliza un CostBreakdown de snake_case a camelCase
 * @param {object} breakdown - Breakdown en formato snake_case o camelCase
 * @returns {object} - Breakdown normalizado en camelCase
 */
export const normalizeCostBreakdown = (breakdown) => {
    if (!breakdown) return null;
    
    const normalizeCostTypeBreakdown = (typeBreakdown) => {
        if (!typeBreakdown) return null;
        return {
            totalCost: typeBreakdown.total_cost !== undefined ? typeBreakdown.total_cost : typeBreakdown.totalCost,
            costPerKg: typeBreakdown.cost_per_kg !== undefined ? typeBreakdown.cost_per_kg : typeBreakdown.costPerKg,
            breakdown: Array.isArray(typeBreakdown.breakdown) 
                ? typeBreakdown.breakdown.map(item => ({
                    name: item.name,
                    totalCost: item.total_cost !== undefined ? item.total_cost : item.totalCost,
                    costPerKg: item.cost_per_kg !== undefined ? item.cost_per_kg : item.costPerKg,
                }))
                : []
        };
    };
    
    return {
        materials: {
            totalCost: breakdown.materials?.total_cost !== undefined ? breakdown.materials.total_cost : breakdown.materials?.totalCost,
            costPerKg: breakdown.materials?.cost_per_kg !== undefined ? breakdown.materials.cost_per_kg : breakdown.materials?.costPerKg,
            sources: Array.isArray(breakdown.materials?.sources) 
                ? breakdown.materials.sources.map(source => ({
                    sourceType: source.source_type || source.sourceType,
                    contributedWeightKg: source.contributed_weight_kg !== undefined ? source.contributed_weight_kg : source.contributedWeightKg,
                    contributionPercentage: source.contribution_percentage !== undefined ? source.contribution_percentage : source.contributionPercentage,
                    sourceCostPerKg: source.source_cost_per_kg !== undefined ? source.source_cost_per_kg : source.sourceCostPerKg,
                    sourceTotalCost: source.source_total_cost !== undefined ? source.source_total_cost : source.sourceTotalCost,
                }))
                : []
        },
        processCosts: {
            production: normalizeCostTypeBreakdown(breakdown.process_costs?.production || breakdown.processCosts?.production),
            labor: normalizeCostTypeBreakdown(breakdown.process_costs?.labor || breakdown.processCosts?.labor),
            operational: normalizeCostTypeBreakdown(breakdown.process_costs?.operational || breakdown.processCosts?.operational),
            packaging: normalizeCostTypeBreakdown(breakdown.process_costs?.packaging || breakdown.processCosts?.packaging),
            total: {
                totalCost: breakdown.process_costs?.total?.total_cost !== undefined 
                    ? breakdown.process_costs.total.total_cost 
                    : breakdown.processCosts?.total?.totalCost,
                costPerKg: breakdown.process_costs?.total?.cost_per_kg !== undefined 
                    ? breakdown.process_costs.total.cost_per_kg 
                    : breakdown.processCosts?.total?.costPerKg,
            }
        },
        productionCosts: {
            production: normalizeCostTypeBreakdown(breakdown.production_costs?.production || breakdown.productionCosts?.production),
            labor: normalizeCostTypeBreakdown(breakdown.production_costs?.labor || breakdown.productionCosts?.labor),
            operational: normalizeCostTypeBreakdown(breakdown.production_costs?.operational || breakdown.productionCosts?.operational),
            packaging: normalizeCostTypeBreakdown(breakdown.production_costs?.packaging || breakdown.productionCosts?.packaging),
            total: {
                totalCost: breakdown.production_costs?.total?.total_cost !== undefined 
                    ? breakdown.production_costs.total.total_cost 
                    : breakdown.productionCosts?.total?.totalCost,
                costPerKg: breakdown.production_costs?.total?.cost_per_kg !== undefined 
                    ? breakdown.production_costs.total.cost_per_kg 
                    : breakdown.productionCosts?.total?.costPerKg,
            }
        },
        total: {
            totalCost: breakdown.total?.total_cost !== undefined ? breakdown.total.total_cost : breakdown.total?.totalCost,
            costPerKg: breakdown.total?.cost_per_kg !== undefined ? breakdown.total.cost_per_kg : breakdown.total?.costPerKg,
        }
    };
};

