# Documentación de Implementación - Trazabilidad de Costes en Producciones

**Versión**: 1.0  
**Fecha**: 2025-01-XX  
**Estado**: Pendiente de implementación  
**Prioridad**: Alta

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Cambios](#análisis-de-cambios)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Implementación de Servicios](#implementación-de-servicios)
5. [Normalizadores](#normalizadores)
6. [Componentes Nuevos](#componentes-nuevos)
7. [Actualización de Componentes Existentes](#actualización-de-componentes-existentes)
8. [Tipos e Interfaces](#tipos-e-interfaces)
9. [Plan de Implementación](#plan-de-implementación)
10. [Ejemplos de Código](#ejemplos-de-código)
11. [Testing](#testing)
12. [Consideraciones de UI/UX](#consideraciones-de-uiux)

---

## 🎯 Resumen Ejecutivo

### Objetivo

Implementar la funcionalidad completa de trazabilidad de costes en producciones, permitiendo:

- Visualización de costes por kg y coste total en outputs
- Gestión de catálogo de costes
- Agregar costes a nivel de proceso o producción (lote)
- Visualización de desglose completo de costes
- Trazabilidad de sources (materias primas y outputs padre)

### Alcance

- **Nuevos endpoints a integrar**: 3 módulos principales
  - Catálogo de costes (`/v2/cost-catalog`)
  - Costes de producción (`/v2/production-costs`)
  - Desglose de costes (`/v2/production-outputs/{id}/cost-breakdown`)

- **Endpoints a actualizar**: 2
  - `GET /v2/production-outputs/{id}` (nuevos campos)
  - `POST /v2/production-outputs` (nuevo campo `sources`)
  - `PUT /v2/production-outputs/{id}` (actualizar `sources`)

- **Componentes nuevos**: 5-6 componentes
- **Componentes a actualizar**: 2-3 componentes existentes

---

## 📊 Análisis de Cambios

### Cambios en Backend

#### 1. Nuevos Campos en ProductionOutput

```typescript
// Campos añadidos
costPerKg?: number
totalCost?: number
sources?: ProductionOutputSource[]
```

#### 2. Nuevas Entidades

- **CostCatalog**: Catálogo de costes comunes
- **ProductionCost**: Costes asociados a procesos o producciones
- **ProductionOutputSource**: Trazabilidad de materias primas

#### 3. Nuevos Endpoints

- **Cost Catalog**: CRUD completo
- **Production Costs**: CRUD completo con filtros
- **Cost Breakdown**: Endpoint de desglose detallado

### Impacto en Frontend

1. **Servicios**: Añadir 15+ nuevas funciones
2. **Normalizadores**: Añadir 4+ nuevos normalizadores
3. **Componentes**: Crear 5-6 componentes nuevos, actualizar 2-3 existentes
4. **Tipos**: Definir interfaces TypeScript/JSDoc

---

## 📁 Estructura de Archivos

### Archivos a Crear

```
src/
├── services/
│   └── costService.js                    # ✨ NUEVO - Servicios de costes
├── helpers/
│   └── production/
│       └── costNormalizers.js            # ✨ NUEVO - Normalizadores de costes
│       └── costFormatters.js             # ✨ NUEVO - Formateadores de costes
├── components/
│   └── Admin/
│       └── Productions/
│           ├── CostCatalogManager.jsx    # ✨ NUEVO - Gestión de catálogo
│           ├── ProductionCostsManager.jsx # ✨ NUEVO - Gestión de costes
│           ├── CostBreakdownView.jsx     # ✨ NUEVO - Vista de desglose
│           ├── CostSourceSelector.jsx    # ✨ NUEVO - Selector de sources
│           └── CostDisplay.jsx           # ✨ NUEVO - Componente de visualización
└── types/
    └── production/
        └── costs.d.ts                    # ✨ NUEVO - Tipos TypeScript (opcional)
```

### Archivos a Modificar

```
src/
├── services/
│   └── productionService.js              # 🔄 ACTUALIZAR - Añadir funciones de costes
├── helpers/
│   └── production/
│       └── normalizers.js                 # 🔄 ACTUALIZAR - Añadir normalizadores
├── components/
│   └── Admin/
│       └── Productions/
│           ├── ProductionOutputsManager.jsx # 🔄 ACTUALIZAR - Mostrar costes y sources
│           └── ProductionRecordView.jsx    # 🔄 ACTUALIZAR - Integrar gestión de costes
```

---

## 🔌 Implementación de Servicios

### 1. Crear `src/services/costService.js`

Este archivo contendrá todas las funciones para interactuar con los endpoints de costes.

```javascript
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api/apiHelpers";
import { API_URL_V2 } from "@/configs/config";
import {
    normalizeCostCatalog,
    normalizeProductionCost,
    normalizeCostBreakdown,
    normalizeProductionOutputSource,
} from "@/helpers/production/costNormalizers";

// ==================== COST CATALOG ====================

/**
 * Obtiene el catálogo de costes
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta (cost_type, active_only, perPage)
 * @returns {Promise<Object>} - Lista de costes del catálogo
 */
export function getCostCatalog(token, params = {}) {
    return apiGet(`${API_URL_V2}cost-catalog`, token, params, {
        transform: (data) => {
            const catalog = data.data || data || [];
            return {
                ...data,
                data: Array.isArray(catalog) 
                    ? catalog.map(normalizeCostCatalog) 
                    : []
            };
        }
    });
}

/**
 * Obtiene un coste del catálogo por ID
 * @param {string|number} catalogId - ID del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste del catálogo
 */
export function getCostCatalogItem(catalogId, token) {
    return apiGet(`${API_URL_V2}cost-catalog/${catalogId}`, token, {}, {
        transform: (data) => {
            const catalog = data.data || data;
            return normalizeCostCatalog(catalog);
        }
    });
}

/**
 * Crea un nuevo coste en el catálogo
 * @param {Object} catalogData - Datos del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste creado
 */
export function createCostCatalogItem(catalogData, token) {
    return apiPost(`${API_URL_V2}cost-catalog`, token, catalogData, {
        transform: (data) => {
            const catalog = data.data || data;
            return {
                ...data,
                data: normalizeCostCatalog(catalog)
            };
        }
    });
}

/**
 * Actualiza un coste del catálogo
 * @param {string|number} catalogId - ID del coste
 * @param {Object} catalogData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste actualizado
 */
export function updateCostCatalogItem(catalogId, catalogData, token) {
    return apiPut(`${API_URL_V2}cost-catalog/${catalogId}`, token, catalogData, {
        transform: (data) => {
            const catalog = data.data || data;
            return {
                ...data,
                data: normalizeCostCatalog(catalog)
            };
        }
    });
}

/**
 * Elimina un coste del catálogo
 * @param {string|number} catalogId - ID del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteCostCatalogItem(catalogId, token) {
    return apiDelete(`${API_URL_V2}cost-catalog/${catalogId}`, token);
}

// ==================== PRODUCTION COSTS ====================

/**
 * Obtiene los costes de producción
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros de consulta (production_record_id, production_id, cost_type, perPage)
 * @returns {Promise<Object>} - Lista de costes
 */
export function getProductionCosts(token, params = {}) {
    return apiGet(`${API_URL_V2}production-costs`, token, params, {
        transform: (data) => {
            const costs = data.data || data || [];
            return {
                ...data,
                data: Array.isArray(costs) 
                    ? costs.map(normalizeProductionCost) 
                    : []
            };
        }
    });
}

/**
 * Obtiene un coste de producción por ID
 * @param {string|number} costId - ID del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste de producción
 */
export function getProductionCost(costId, token) {
    return apiGet(`${API_URL_V2}production-costs/${costId}`, token, {}, {
        transform: (data) => {
            const cost = data.data || data;
            return normalizeProductionCost(cost);
        }
    });
}

/**
 * Crea un nuevo coste de producción
 * @param {Object} costData - Datos del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste creado
 */
export function createProductionCost(costData, token) {
    return apiPost(`${API_URL_V2}production-costs`, token, costData, {
        transform: (data) => {
            const cost = data.data || data;
            return {
                ...data,
                data: normalizeProductionCost(cost)
            };
        }
    });
}

/**
 * Actualiza un coste de producción
 * @param {string|number} costId - ID del coste
 * @param {Object} costData - Datos actualizados
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Coste actualizado
 */
export function updateProductionCost(costId, costData, token) {
    return apiPut(`${API_URL_V2}production-costs/${costId}`, token, costData, {
        transform: (data) => {
            const cost = data.data || data;
            return {
                ...data,
                data: normalizeProductionCost(cost)
            };
        }
    });
}

/**
 * Elimina un coste de producción
 * @param {string|number} costId - ID del coste
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export function deleteProductionCost(costId, token) {
    return apiDelete(`${API_URL_V2}production-costs/${costId}`, token);
}

// ==================== COST BREAKDOWN ====================

/**
 * Obtiene el desglose completo de costes de un output
 * @param {string|number} outputId - ID del output
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Desglose de costes
 */
export function getCostBreakdown(outputId, token) {
    return apiGet(`${API_URL_V2}production-outputs/${outputId}/cost-breakdown`, token, {}, {
        transform: (data) => {
            const breakdown = data.data || data;
            return {
                ...data,
                data: {
                    output: breakdown.output ? normalizeProductionOutput(breakdown.output) : null,
                    costBreakdown: normalizeCostBreakdown(breakdown.cost_breakdown || breakdown.costBreakdown)
                }
            };
        }
    });
}
```

### 2. Actualizar `src/services/productionService.js`

Añadir funciones para manejar `sources` y actualizar funciones existentes:

```javascript
// Añadir al final del archivo, antes de los exports finales

// ==================== PRODUCTION OUTPUT SOURCES ====================

/**
 * Obtiene un production output con desglose de costes
 * @param {string|number} outputId - ID del output
 * @param {string} token - Token de autenticación
 * @param {object} params - Parámetros adicionales (include_cost_breakdown)
 * @returns {Promise<Object>} - Output con costes
 */
export function getProductionOutputWithCosts(outputId, token, params = {}) {
    return apiGet(`${API_URL_V2}production-outputs/${outputId}`, token, params, {
        transform: (data) => {
            const output = data.data || data;
            return {
                ...data,
                data: normalizeProductionOutput(output)
            };
        }
    });
}

// Actualizar createProductionOutput para soportar sources
// La función ya existe, solo necesitamos asegurarnos de que acepta el campo 'sources'
// El normalizador se encargará de normalizar los sources si vienen en la respuesta
```

---

## 🔄 Normalizadores

### Crear `src/helpers/production/costNormalizers.js`

```javascript
/**
 * Normalizadores de datos para Costes
 * Convierte datos de snake_case a camelCase para consistencia en toda la aplicación
 */

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

// Importar normalizadores necesarios
import { normalizeProductionInput, normalizeProductionOutputConsumption } from './normalizers';
```

### Actualizar `src/helpers/production/normalizers.js`

Actualizar `normalizeProductionOutput` para incluir los nuevos campos:

```javascript
/**
 * Normaliza un Production Output
 * @param {object} output - Output en formato snake_case o camelCase
 * @returns {object} - Output normalizado
 */
export const normalizeProductionOutput = (output) => {
    if (!output) return null;
    
    return {
        id: output.id,
        productionRecordId: output.production_record_id || output.productionRecordId,
        productId: output.product_id || output.productId,
        product: output.product ? normalizeProduct(output.product) : (output.product || null),
        lotId: output.lot_id || output.lotId || null,
        weightKg: output.weight_kg || output.weightKg || 0,
        boxes: output.boxes || output.quantity_boxes || 0,
        notes: output.notes || null,
        
        // ✨ NUEVOS CAMPOS
        costPerKg: output.cost_per_kg !== undefined ? output.cost_per_kg : (output.costPerKg !== undefined ? output.costPerKg : null),
        totalCost: output.total_cost !== undefined ? output.total_cost : (output.totalCost !== undefined ? output.totalCost : null),
        sources: Array.isArray(output.sources) 
            ? output.sources.map(source => normalizeProductionOutputSource(source))
            : (output.sources || []),
    };
};
```

**Nota**: Necesitarás importar `normalizeProductionOutputSource` desde `costNormalizers.js` o moverlo a `normalizers.js` para evitar dependencias circulares.

### Crear `src/helpers/production/costFormatters.js`

```javascript
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
```

---

## 🧩 Componentes Nuevos

### 1. `CostDisplay.jsx` - Componente de Visualización de Costes

Componente reutilizable para mostrar costes en diferentes contextos.

```jsx
'use client'

import React from 'react'
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

/**
 * Componente para mostrar costes de un output
 * @param {Object} output - Production output con costes
 * @param {boolean} showDetails - Mostrar detalles adicionales
 * @param {string} size - Tamaño del display ('sm' | 'md' | 'lg')
 */
export default function CostDisplay({ output, showDetails = false, size = 'md' }) {
    if (!output) return null;

    const hasCost = output.costPerKg !== null && output.costPerKg !== undefined;
    
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    if (!hasCost) {
        return (
            <Badge variant="outline" className="text-gray-500">
                Sin coste calculado
            </Badge>
        );
    }

    return (
        <div className={`flex flex-col gap-1 ${sizeClasses[size]}`}>
            <div className="flex items-center gap-2">
                <span className="font-semibold">{formatCostPerKg(output.costPerKg)}</span>
                {showDetails && output.totalCost && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Coste total: {formatTotalCost(output.totalCost)}</p>
                                {output.weightKg && (
                                    <p>Peso: {output.weightKg} kg</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            {showDetails && output.totalCost && (
                <span className="text-sm text-gray-600">
                    Total: {formatTotalCost(output.totalCost)}
                </span>
            )}
        </div>
    );
}
```

### 2. `CostSourceSelector.jsx` - Selector de Sources

Componente para seleccionar y gestionar sources al crear/editar outputs.

```jsx
'use client'

import React, { useState, useEffect } from 'react'
import { getProductionInputs, getProductionOutputConsumptions } from '@/services/productionService'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatWeight, formatDecimal } from '@/helpers/production/formatters'

/**
 * Componente para seleccionar sources de un output
 * @param {number} productionRecordId - ID del proceso
 * @param {number} totalWeightKg - Peso total del output
 * @param {Array} selectedSources - Sources ya seleccionados
 * @param {Function} onChange - Callback cuando cambian los sources
 */
export default function CostSourceSelector({ 
    productionRecordId, 
    totalWeightKg,
    selectedSources = [],
    onChange 
}) {
    const { data: session } = useSession();
    const [inputs, setInputs] = useState([]);
    const [consumptions, setConsumptions] = useState([]);
    const [sources, setSources] = useState(selectedSources);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (session?.user?.accessToken && productionRecordId) {
            loadSources();
        }
    }, [session?.user?.accessToken, productionRecordId]);

    const loadSources = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = session.user.accessToken;

            const [inputsData, consumptionsData] = await Promise.all([
                getProductionInputs(token, { production_record_id: productionRecordId }),
                getProductionOutputConsumptions(token, { production_record_id: productionRecordId }),
            ]);

            setInputs(inputsData.data || []);
            setConsumptions(consumptionsData.data || []);
        } catch (err) {
            console.error('Error loading sources:', err);
            setError(err.message || 'Error al cargar las fuentes');
        } finally {
            setLoading(false);
        }
    };

    const addSource = (type, sourceId) => {
        const newSource = {
            source_type: type,
            [type === 'stock_box' ? 'production_input_id' : 'production_output_consumption_id']: sourceId,
            contributed_weight_kg: null,
            contribution_percentage: null,
        };
        setSources([...sources, newSource]);
    };

    const removeSource = (index) => {
        setSources(sources.filter((_, i) => i !== index));
    };

    const updateSource = (index, field, value) => {
        const updated = [...sources];
        updated[index] = { ...updated[index], [field]: value };
        
        // Si se actualiza weight_kg, calcular percentage
        if (field === 'contributed_weight_kg' && totalWeightKg > 0) {
            const weight = parseFloat(value) || 0;
            updated[index].contribution_percentage = (weight / totalWeightKg) * 100;
        }
        // Si se actualiza percentage, calcular weight_kg
        else if (field === 'contribution_percentage' && totalWeightKg > 0) {
            const percentage = parseFloat(value) || 0;
            updated[index].contributed_weight_kg = (percentage / 100) * totalWeightKg;
        }
        
        setSources(updated);
        if (onChange) {
            onChange(updated);
        }
    };

    const totalPercentage = sources.reduce((sum, s) => {
        return sum + (parseFloat(s.contribution_percentage) || 0);
    }, 0);

    const isValid = Math.abs(totalPercentage - 100) < 0.01;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fuentes de Materia Prima</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!isValid && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            El porcentaje total debe ser 100%. Actual: {formatDecimal(totalPercentage, 2)}%
                        </AlertDescription>
                    </Alert>
                )}

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Origen</TableHead>
                            <TableHead>Peso (kg)</TableHead>
                            <TableHead>Porcentaje (%)</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sources.map((source, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Badge>
                                        {source.source_type === 'stock_box' ? 'Stock' : 'Output Padre'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {source.source_type === 'stock_box' 
                                        ? `Input #${source.production_input_id}`
                                        : `Consumo #${source.production_output_consumption_id}`
                                    }
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={source.contributed_weight_kg || ''}
                                        onChange={(e) => updateSource(index, 'contributed_weight_kg', e.target.value)}
                                        className="w-24"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={source.contribution_percentage || ''}
                                        onChange={(e) => updateSource(index, 'contribution_percentage', e.target.value)}
                                        className="w-24"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSource(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="flex gap-2">
                    <Select onValueChange={(value) => {
                        const [type, id] = value.split('-');
                        addSource(type, parseInt(id));
                    }}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Añadir fuente" />
                        </SelectTrigger>
                        <SelectContent>
                            <optgroup label="Materias Primas">
                                {inputs.map(input => (
                                    <SelectItem key={`stock_box-${input.id}`} value={`stock_box-${input.id}`}>
                                        Input #{input.id} - {formatWeight(input.box?.netWeight)}
                                    </SelectItem>
                                ))}
                            </optgroup>
                            <optgroup label="Outputs Padre">
                                {consumptions.map(consumption => (
                                    <SelectItem 
                                        key={`parent_output-${consumption.id}`} 
                                        value={`parent_output-${consumption.id}`}
                                    >
                                        Consumo #{consumption.id} - {formatWeight(consumption.consumedWeightKg)}
                                    </SelectItem>
                                ))}
                            </optgroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="text-sm text-gray-600">
                    Total: {formatDecimal(totalPercentage, 2)}% / 100%
                </div>
            </CardContent>
        </Card>
    );
}
```

### 3. `CostBreakdownView.jsx` - Vista de Desglose de Costes

Componente para mostrar el desglose completo de costes.

```jsx
'use client'

import React, { useState, useEffect } from 'react'
import { getCostBreakdown } from '@/services/costService'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { formatCostPerKg, formatTotalCost, getCostTypeColor, getCostTypeLabel } from '@/helpers/production/costFormatters'
import Loader from '@/components/Utilities/Loader'

/**
 * Componente para mostrar el desglose completo de costes de un output
 * @param {number} outputId - ID del output
 */
export default function CostBreakdownView({ outputId }) {
    const { data: session } = useSession();
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        materials: true,
        processCosts: true,
        productionCosts: true,
    });

    useEffect(() => {
        if (session?.user?.accessToken && outputId) {
            loadBreakdown();
        }
    }, [session?.user?.accessToken, outputId]);

    const loadBreakdown = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = session.user.accessToken;
            const response = await getCostBreakdown(outputId, token);
            setBreakdown(response.data.costBreakdown);
        } catch (err) {
            console.error('Error loading cost breakdown:', err);
            setError(err.message || 'Error al cargar el desglose de costes');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (loading) return <Loader />;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!breakdown) return null;

    const renderCostTypeBreakdown = (typeBreakdown, title) => {
        if (!typeBreakdown || typeBreakdown.totalCost === 0) return null;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{title}</span>
                    <div className="flex gap-4">
                        <span>{formatTotalCost(typeBreakdown.totalCost)}</span>
                        <span className="text-gray-500">{formatCostPerKg(typeBreakdown.costPerKg)}</span>
                    </div>
                </div>
                {typeBreakdown.breakdown && typeBreakdown.breakdown.length > 0 && (
                    <Table>
                        <TableBody>
                            {typeBreakdown.breakdown.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="pl-8">{item.name}</TableCell>
                                    <TableCell>{formatTotalCost(item.totalCost)}</TableCell>
                                    <TableCell>{formatCostPerKg(item.costPerKg)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Resumen Total */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de Costes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Coste Total</span>
                        <div className="flex gap-4">
                            <span>{formatTotalCost(breakdown.total.totalCost)}</span>
                            <span className="text-gray-600">{formatCostPerKg(breakdown.total.costPerKg)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Materias Primas */}
            <Card>
                <CardHeader>
                    <CardTitle>Materias Primas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-4">
                            <span>{formatTotalCost(breakdown.materials.totalCost)}</span>
                            <span className="text-gray-500">{formatCostPerKg(breakdown.materials.costPerKg)}</span>
                        </div>
                    </div>
                    {breakdown.materials.sources && breakdown.materials.sources.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Peso (kg)</TableHead>
                                    <TableHead>Porcentaje</TableHead>
                                    <TableHead>Coste por kg</TableHead>
                                    <TableHead>Coste Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {breakdown.materials.sources.map((source, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Badge>{source.sourceType}</Badge>
                                        </TableCell>
                                        <TableCell>{source.contributedWeightKg}</TableCell>
                                        <TableCell>{source.contributionPercentage}%</TableCell>
                                        <TableCell>{formatCostPerKg(source.sourceCostPerKg)}</TableCell>
                                        <TableCell>{formatTotalCost(source.sourceTotalCost)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Costes del Proceso */}
            <Card>
                <Collapsible 
                    open={expandedSections.processCosts}
                    onOpenChange={() => toggleSection('processCosts')}
                >
                    <CardHeader>
                        <CollapsibleTrigger className="flex items-center justify-between w-full">
                            <CardTitle>Costes del Proceso</CardTitle>
                            {expandedSections.processCosts ? (
                                <ChevronDown className="h-5 w-5" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {renderCostTypeBreakdown(breakdown.processCosts.production, 'Producción')}
                            {renderCostTypeBreakdown(breakdown.processCosts.labor, 'Personal')}
                            {renderCostTypeBreakdown(breakdown.processCosts.operational, 'Operativos')}
                            {renderCostTypeBreakdown(breakdown.processCosts.packaging, 'Envases')}
                            {breakdown.processCosts.total && (
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded font-semibold">
                                    <span>Total Proceso</span>
                                    <div className="flex gap-4">
                                        <span>{formatTotalCost(breakdown.processCosts.total.totalCost)}</span>
                                        <span>{formatCostPerKg(breakdown.processCosts.total.costPerKg)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Costes del Lote */}
            <Card>
                <Collapsible 
                    open={expandedSections.productionCosts}
                    onOpenChange={() => toggleSection('productionCosts')}
                >
                    <CardHeader>
                        <CollapsibleTrigger className="flex items-center justify-between w-full">
                            <CardTitle>Costes del Lote</CardTitle>
                            {expandedSections.productionCosts ? (
                                <ChevronDown className="h-5 w-5" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {renderCostTypeBreakdown(breakdown.productionCosts.production, 'Producción')}
                            {renderCostTypeBreakdown(breakdown.productionCosts.labor, 'Personal')}
                            {renderCostTypeBreakdown(breakdown.productionCosts.operational, 'Operativos')}
                            {renderCostTypeBreakdown(breakdown.productionCosts.packaging, 'Envases')}
                            {breakdown.productionCosts.total && (
                                <div className="flex items-center justify-between p-2 bg-green-50 rounded font-semibold">
                                    <span>Total Lote</span>
                                    <div className="flex gap-4">
                                        <span>{formatTotalCost(breakdown.productionCosts.total.totalCost)}</span>
                                        <span>{formatCostPerKg(breakdown.productionCosts.total.costPerKg)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        </div>
    );
}
```

### 4. `ProductionCostsManager.jsx` - Gestor de Costes de Producción

Componente para gestionar costes a nivel de proceso o producción.

```jsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
    getProductionCosts, 
    createProductionCost, 
    updateProductionCost, 
    deleteProductionCost 
} from '@/services/costService'
import { getCostCatalog } from '@/services/costService'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { formatCostPerKg, formatTotalCost, getCostTypeColor, getCostTypeLabel } from '@/helpers/production/costFormatters'
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers'
import { Badge } from '@/components/ui/badge'

/**
 * Componente para gestionar costes de producción
 * @param {number} productionRecordId - ID del proceso (opcional)
 * @param {number} productionId - ID de la producción/lote (opcional)
 */
export default function ProductionCostsManager({ 
    productionRecordId = null, 
    productionId = null 
}) {
    const { data: session } = useSession();
    const [costs, setCosts] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCost, setEditingCost] = useState(null);
    const [formData, setFormData] = useState({
        cost_catalog_id: '',
        name: '',
        cost_type: '',
        description: '',
        total_cost: '',
        cost_per_kg: '',
        cost_date: new Date().toISOString().split('T')[0],
    });
    const [useCatalog, setUseCatalog] = useState(true);
    const [costUnit, setCostUnit] = useState('total');

    useEffect(() => {
        if (session?.user?.accessToken) {
            loadCosts();
            loadCatalog();
        }
    }, [session?.user?.accessToken, productionRecordId, productionId]);

    const loadCosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = session.user.accessToken;
            const params = {};
            if (productionRecordId) params.production_record_id = productionRecordId;
            if (productionId) params.production_id = productionId;

            const response = await getProductionCosts(token, params);
            setCosts(response.data || []);
        } catch (err) {
            console.error('Error loading costs:', err);
            setError(err.message || 'Error al cargar los costes');
        } finally {
            setLoading(false);
        }
    };

    const loadCatalog = async () => {
        try {
            const token = session.user.accessToken;
            const response = await getCostCatalog(token, { active_only: true });
            setCatalog(response.data || []);
        } catch (err) {
            console.error('Error loading catalog:', err);
        }
    };

    const handleOpenDialog = (cost = null) => {
        if (cost) {
            setEditingCost(cost);
            setFormData({
                cost_catalog_id: cost.costCatalogId || '',
                name: cost.name || '',
                cost_type: cost.costType || '',
                description: cost.description || '',
                total_cost: cost.totalCost || '',
                cost_per_kg: cost.costPerKg || '',
                cost_date: cost.costDate || new Date().toISOString().split('T')[0],
            });
            setUseCatalog(!!cost.costCatalogId);
            setCostUnit(cost.costPerKg ? 'per_kg' : 'total');
        } else {
            setEditingCost(null);
            setFormData({
                cost_catalog_id: '',
                name: '',
                cost_type: '',
                description: '',
                total_cost: '',
                cost_per_kg: '',
                cost_date: new Date().toISOString().split('T')[0],
            });
            setUseCatalog(true);
            setCostUnit('total');
        }
        setDialogOpen(true);
    };

    const handleCatalogSelect = (catalogId) => {
        const catalogItem = catalog.find(c => c.id === parseInt(catalogId));
        if (catalogItem) {
            setFormData(prev => ({
                ...prev,
                cost_catalog_id: catalogId,
                name: catalogItem.name,
                cost_type: catalogItem.costType,
            }));
            setCostUnit(catalogItem.defaultUnit);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = session.user.accessToken;

            const submitData = {
                production_record_id: productionRecordId || null,
                production_id: productionId || null,
                cost_catalog_id: useCatalog && formData.cost_catalog_id ? parseInt(formData.cost_catalog_id) : null,
                name: useCatalog && formData.cost_catalog_id ? null : formData.name,
                cost_type: useCatalog && formData.cost_catalog_id ? null : formData.cost_type,
                description: formData.description || null,
                total_cost: costUnit === 'total' ? parseFloat(formData.total_cost) : null,
                cost_per_kg: costUnit === 'per_kg' ? parseFloat(formData.cost_per_kg) : null,
                cost_date: formData.cost_date,
            };

            if (editingCost) {
                await updateProductionCost(editingCost.id, submitData, token);
            } else {
                await createProductionCost(submitData, token);
            }

            setDialogOpen(false);
            loadCosts();
        } catch (err) {
            console.error('Error saving cost:', err);
            setError(err.message || 'Error al guardar el coste');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (costId) => {
        if (!confirm('¿Estás seguro de eliminar este coste?')) return;

        try {
            setLoading(true);
            const token = session.user.accessToken;
            await deleteProductionCost(costId, token);
            loadCosts();
        } catch (err) {
            console.error('Error deleting cost:', err);
            setError(err.message || 'Error al eliminar el coste');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Costes de {productionRecordId ? 'Proceso' : 'Producción'}</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Coste
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCost ? 'Editar Coste' : 'Nuevo Coste'}
                            </DialogTitle>
                            <DialogDescription>
                                {productionRecordId 
                                    ? 'Añade un coste asociado a este proceso'
                                    : 'Añade un coste asociado a esta producción (lote)'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useCatalog"
                                    checked={useCatalog}
                                    onChange={(e) => setUseCatalog(e.target.checked)}
                                />
                                <Label htmlFor="useCatalog">Usar catálogo de costes</Label>
                            </div>

                            {useCatalog ? (
                                <div className="space-y-2">
                                    <Label>Coste del Catálogo</Label>
                                    <Select onValueChange={handleCatalogSelect}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un coste del catálogo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {catalog.map(item => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.name} ({getCostTypeLabel(item.costType)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>Nombre *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo de Coste *</Label>
                                        <Select
                                            value={formData.cost_type}
                                            onValueChange={(value) => setFormData({ ...formData, cost_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="production">Producción</SelectItem>
                                                <SelectItem value="labor">Personal</SelectItem>
                                                <SelectItem value="operational">Operativos</SelectItem>
                                                <SelectItem value="packaging">Envases</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Unidad de Coste</Label>
                                <Select value={costUnit} onValueChange={setCostUnit}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="total">Coste Total</SelectItem>
                                        <SelectItem value="per_kg">Coste por kg</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {costUnit === 'total' ? (
                                <div className="space-y-2">
                                    <Label>Coste Total (€) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.total_cost}
                                        onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Coste por kg (€/kg) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.cost_per_kg}
                                        onChange={(e) => setFormData({ ...formData, cost_per_kg: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Fecha del Coste</Label>
                                <Input
                                    type="date"
                                    value={formData.cost_date}
                                    onChange={(e) => setFormData({ ...formData, cost_date: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading && costs.length === 0 ? (
                    <div className="text-center py-8">Cargando...</div>
                ) : costs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No hay costes registrados
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Coste</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {costs.map(cost => (
                                <TableRow key={cost.id}>
                                    <TableCell>{cost.name}</TableCell>
                                    <TableCell>
                                        <Badge className={getCostTypeColor(cost.costType)}>
                                            {getCostTypeLabel(cost.costType)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {cost.totalCost 
                                            ? formatTotalCost(cost.totalCost)
                                            : formatCostPerKg(cost.costPerKg)
                                        }
                                    </TableCell>
                                    <TableCell>{cost.costDate}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDialog(cost)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(cost.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
```

### 5. `CostCatalogManager.jsx` - Gestor de Catálogo de Costes

Componente para gestionar el catálogo de costes (CRUD completo).

```jsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
    getCostCatalog, 
    createCostCatalogItem, 
    updateCostCatalogItem, 
    deleteCostCatalogItem 
} from '@/services/costService'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { getCostTypeColor, getCostTypeLabel } from '@/helpers/production/costFormatters'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

/**
 * Componente para gestionar el catálogo de costes
 */
export default function CostCatalogManager() {
    const { data: session } = useSession();
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        cost_type: '',
        description: '',
        default_unit: 'total',
        is_active: true,
    });
    const [filter, setFilter] = useState({
        cost_type: '',
        active_only: true,
    });

    useEffect(() => {
        if (session?.user?.accessToken) {
            loadCatalog();
        }
    }, [session?.user?.accessToken, filter]);

    const loadCatalog = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = session.user.accessToken;
            const params = {};
            if (filter.cost_type) params.cost_type = filter.cost_type;
            if (filter.active_only) params.active_only = true;

            const response = await getCostCatalog(token, params);
            setCatalog(response.data || []);
        } catch (err) {
            console.error('Error loading catalog:', err);
            setError(err.message || 'Error al cargar el catálogo');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name || '',
                cost_type: item.costType || '',
                description: item.description || '',
                default_unit: item.defaultUnit || 'total',
                is_active: item.isActive !== undefined ? item.isActive : true,
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                cost_type: '',
                description: '',
                default_unit: 'total',
                is_active: true,
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = session.user.accessToken;

            const submitData = {
                name: formData.name,
                cost_type: formData.cost_type,
                description: formData.description || null,
                default_unit: formData.default_unit,
                is_active: formData.is_active,
            };

            if (editingItem) {
                await updateCostCatalogItem(editingItem.id, submitData, token);
            } else {
                await createCostCatalogItem(submitData, token);
            }

            setDialogOpen(false);
            loadCatalog();
        } catch (err) {
            console.error('Error saving catalog item:', err);
            setError(err.message || 'Error al guardar el elemento');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (itemId) => {
        if (!confirm('¿Estás seguro de eliminar este elemento del catálogo?')) return;

        try {
            setLoading(true);
            const token = session.user.accessToken;
            await deleteCostCatalogItem(itemId, token);
            loadCatalog();
        } catch (err) {
            console.error('Error deleting catalog item:', err);
            setError(err.message || 'Error al eliminar el elemento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Catálogo de Costes</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Coste
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Editar Coste' : 'Nuevo Coste en Catálogo'}
                            </DialogTitle>
                            <DialogDescription>
                                Los costes del catálogo pueden reutilizarse en múltiples procesos
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Coste *</Label>
                                <Select
                                    value={formData.cost_type}
                                    onValueChange={(value) => setFormData({ ...formData, cost_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="production">Producción</SelectItem>
                                        <SelectItem value="labor">Personal</SelectItem>
                                        <SelectItem value="operational">Operativos</SelectItem>
                                        <SelectItem value="packaging">Envases</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Unidad por Defecto *</Label>
                                <Select
                                    value={formData.default_unit}
                                    onValueChange={(value) => setFormData({ ...formData, default_unit: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="total">Coste Total</SelectItem>
                                        <SelectItem value="per_kg">Coste por kg</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => 
                                        setFormData({ ...formData, is_active: checked })
                                    }
                                />
                                <Label htmlFor="is_active">Activo</Label>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {/* Filtros */}
                <div className="flex gap-4 mb-4">
                    <Select
                        value={filter.cost_type}
                        onValueChange={(value) => setFilter({ ...filter, cost_type: value })}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrar por tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todos los tipos</SelectItem>
                            <SelectItem value="production">Producción</SelectItem>
                            <SelectItem value="labor">Personal</SelectItem>
                            <SelectItem value="operational">Operativos</SelectItem>
                            <SelectItem value="packaging">Envases</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="active_only"
                            checked={filter.active_only}
                            onCheckedChange={(checked) => 
                                setFilter({ ...filter, active_only: checked })
                            }
                        />
                        <Label htmlFor="active_only">Solo activos</Label>
                    </div>
                </div>

                {loading && catalog.length === 0 ? (
                    <div className="text-center py-8">Cargando...</div>
                ) : catalog.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No hay costes en el catálogo
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {catalog.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                        <Badge className={getCostTypeColor(item.costType)}>
                                            {getCostTypeLabel(item.costType)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {item.defaultUnit === 'total' ? 'Total' : 'Por kg'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                                            {item.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDialog(item)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
```

---

## 🔄 Actualización de Componentes Existentes

### 1. Actualizar `ProductionOutputsManager.jsx`

Añadir visualización de costes y selector de sources.

#### Cambios principales:

1. **Importar nuevos servicios y componentes**:
```jsx
import CostDisplay from './CostDisplay'
import CostSourceSelector from './CostSourceSelector'
import CostBreakdownView from './CostBreakdownView'
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters'
```

2. **Añadir columna de costes en la tabla**:
```jsx
<TableHead>Coste</TableHead>
// ...
<TableCell>
    <CostDisplay output={output} showDetails={false} size="sm" />
</TableCell>
```

3. **Añadir selector de sources en el formulario de creación/edición**:
```jsx
{/* En el formulario de creación/edición */}
<CostSourceSelector
    productionRecordId={productionRecordId}
    totalWeightKg={parseFloat(formData.weight_kg) || 0}
    selectedSources={formData.sources || []}
    onChange={(sources) => setFormData({ ...formData, sources })}
/>
```

4. **Incluir sources al crear/actualizar output**:
```jsx
const handleCreateOutput = async () => {
    // ...
    const outputData = {
        production_record_id: productionRecordId,
        product_id: formData.product_id,
        lot_id: formData.lot_id,
        boxes: formData.boxes,
        weight_kg: formData.weight_kg,
        sources: formData.sources || [], // ✨ NUEVO
    };
    // ...
};
```

5. **Añadir botón para ver desglose de costes**:
```jsx
<Button
    variant="ghost"
    size="sm"
    onClick={() => setBreakdownOutputId(output.id)}
>
    Ver Desglose
</Button>
```

### 2. Actualizar `ProductionRecordView.jsx` (o componente principal)

Integrar el gestor de costes del proceso.

```jsx
import ProductionCostsManager from './ProductionCostsManager'

// En el componente, añadir una sección de costes:
<ProductionCostsManager productionRecordId={recordId} />
```

---

## 📝 Tipos e Interfaces

### Crear `src/types/production/costs.d.ts` (Opcional, si usas TypeScript)

```typescript
export interface CostCatalog {
    id: number;
    name: string;
    costType: 'production' | 'labor' | 'operational' | 'packaging';
    description?: string | null;
    defaultUnit: 'total' | 'per_kg';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductionCost {
    id: number;
    productionRecordId?: number | null;
    productionId?: number | null;
    costCatalogId?: number | null;
    costCatalog?: CostCatalog | null;
    costType: 'production' | 'labor' | 'operational' | 'packaging';
    name: string;
    description?: string | null;
    totalCost?: number | null;
    costPerKg?: number | null;
    distributionUnit?: string | null;
    costDate?: string | null;
    effectiveTotalCost?: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProductionOutputSource {
    id: number;
    productionOutputId: number;
    sourceType: 'stock_box' | 'parent_output';
    productionInputId?: number | null;
    productionInput?: ProductionInput | null;
    productionOutputConsumptionId?: number | null;
    productionOutputConsumption?: ProductionOutputConsumption | null;
    contributedWeightKg?: number | null;
    contributedBoxes: number;
    contributionPercentage?: number | null;
    sourceCostPerKg?: number | null;
    sourceTotalCost?: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface CostBreakdown {
    materials: {
        totalCost: number;
        costPerKg: number;
        sources: Array<{
            sourceType: string;
            contributedWeightKg: number;
            contributionPercentage: number;
            sourceCostPerKg: number;
            sourceTotalCost: number;
        }>;
    };
    processCosts: {
        production: CostTypeBreakdown;
        labor: CostTypeBreakdown;
        operational: CostTypeBreakdown;
        packaging: CostTypeBreakdown;
        total: {
            totalCost: number;
            costPerKg: number;
        };
    };
    productionCosts: {
        production: CostTypeBreakdown;
        labor: CostTypeBreakdown;
        operational: CostTypeBreakdown;
        packaging: CostTypeBreakdown;
        total: {
            totalCost: number;
            costPerKg: number;
        };
    };
    total: {
        totalCost: number;
        costPerKg: number;
    };
}

export interface CostTypeBreakdown {
    totalCost: number;
    costPerKg: number;
    breakdown: Array<{
        name: string;
        totalCost: number;
        costPerKg: number;
    }>;
}
```

---

## 📋 Plan de Implementación

### Fase 1: Servicios y Normalizadores (2-3 días)

1. ✅ Crear `costService.js` con todas las funciones
2. ✅ Crear `costNormalizers.js` con todos los normalizadores
3. ✅ Crear `costFormatters.js` con formateadores
4. ✅ Actualizar `normalizers.js` para incluir nuevos campos en `ProductionOutput`
5. ✅ Actualizar `productionService.js` si es necesario

**Criterios de aceptación**:
- Todos los servicios funcionan correctamente
- Los normalizadores convierten correctamente snake_case a camelCase
- Los formateadores muestran valores correctamente

### Fase 2: Componentes Base (3-4 días)

1. ✅ Crear `CostDisplay.jsx`
2. ✅ Crear `CostSourceSelector.jsx`
3. ✅ Crear `CostBreakdownView.jsx`
4. ✅ Crear `ProductionCostsManager.jsx`
5. ✅ Crear `CostCatalogManager.jsx`

**Criterios de aceptación**:
- Todos los componentes se renderizan correctamente
- Los formularios validan correctamente
- Las interacciones básicas funcionan

### Fase 3: Integración (2-3 días)

1. ✅ Actualizar `ProductionOutputsManager.jsx` para mostrar costes
2. ✅ Integrar `CostSourceSelector` en formularios de outputs
3. ✅ Añadir botón para ver desglose de costes
4. ✅ Integrar `ProductionCostsManager` en vistas de procesos/producciones
5. ✅ Crear página/ruta para gestión de catálogo de costes

**Criterios de aceptación**:
- Los costes se muestran en listas de outputs
- Se pueden crear outputs con sources
- Se pueden gestionar costes desde las vistas de procesos

### Fase 4: Testing y Refinamiento (2-3 días)

1. ✅ Probar todos los flujos de usuario
2. ✅ Validar cálculos de costes
3. ✅ Verificar manejo de errores
4. ✅ Optimizar rendimiento si es necesario
5. ✅ Ajustar UI/UX según feedback

**Criterios de aceptación**:
- Todos los flujos funcionan correctamente
- Los cálculos son precisos
- La UI es intuitiva y responsive

---

## 💻 Ejemplos de Código

### Ejemplo 1: Uso de CostDisplay

```jsx
import CostDisplay from '@/components/Admin/Productions/CostDisplay'

// En una lista de outputs
{outputs.map(output => (
    <tr key={output.id}>
        <td>{output.product.name}</td>
        <td>{output.weightKg} kg</td>
        <td>
            <CostDisplay output={output} showDetails={false} size="sm" />
        </td>
    </tr>
))}
```

### Ejemplo 2: Crear Output con Sources

```jsx
const handleCreateOutput = async () => {
    const outputData = {
        production_record_id: productionRecordId,
        product_id: formData.product_id,
        lot_id: formData.lot_id,
        boxes: formData.boxes,
        weight_kg: formData.weight_kg,
        sources: formData.sources.map(source => ({
            source_type: source.source_type,
            [source.source_type === 'stock_box' 
                ? 'production_input_id' 
                : 'production_output_consumption_id']: 
                source.source_type === 'stock_box' 
                    ? source.production_input_id 
                    : source.production_output_consumption_id,
            contributed_weight_kg: source.contributed_weight_kg,
            // contribution_percentage se calcula automáticamente en el backend
        }))
    };

    await createProductionOutput(outputData, token);
};
```

### Ejemplo 3: Obtener y Mostrar Desglose

```jsx
import { getCostBreakdown } from '@/services/costService'
import CostBreakdownView from '@/components/Admin/Productions/CostBreakdownView'

// En un componente
const [showBreakdown, setShowBreakdown] = useState(false);
const [breakdownOutputId, setBreakdownOutputId] = useState(null);

// ...
{showBreakdown && breakdownOutputId && (
    <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <CostBreakdownView outputId={breakdownOutputId} />
        </DialogContent>
    </Dialog>
)}
```

---

## 🧪 Testing

### Tests Unitarios Recomendados

1. **Normalizadores**:
   - Verificar conversión snake_case a camelCase
   - Manejar valores null/undefined
   - Normalizar arrays correctamente

2. **Formateadores**:
   - Formatear costes correctamente
   - Manejar valores null/undefined
   - Aplicar decimales correctamente

3. **Servicios**:
   - Llamadas a API correctas
   - Manejo de errores
   - Transformación de datos

### Tests de Integración

1. **Flujo completo de creación de output con sources**
2. **Flujo completo de agregar coste a proceso**
3. **Visualización de desglose de costes**

### Tests Manuales

1. ✅ Crear output sin sources (debe calcular automáticamente)
2. ✅ Crear output con sources manuales
3. ✅ Agregar coste desde catálogo
4. ✅ Agregar coste ad-hoc
5. ✅ Ver desglose de costes
6. ✅ Editar coste existente
7. ✅ Eliminar coste
8. ✅ Gestionar catálogo de costes

---

## 🎨 Consideraciones de UI/UX

### 1. Visualización de Costes

- **Listas**: Mostrar coste por kg de forma destacada
- **Detalles**: Mostrar coste total y por kg
- **Indicadores**: Badge de color si el coste está calculado o pendiente
- **Tooltips**: Información adicional al hover

### 2. Formularios

- **Validación en tiempo real**: Porcentajes deben sumar 100%
- **Autocompletado**: Sugerencias basadas en catálogo
- **Feedback visual**: Indicadores de éxito/error
- **Cálculos automáticos**: Convertir entre kg y porcentaje

### 3. Desglose de Costes

- **Vista expandible**: Secciones colapsables
- **Código de colores**: Diferentes colores por tipo de coste
- **Gráficos**: Considerar gráficos de barras/pastel (futuro)
- **Exportación**: Botón para exportar a PDF/Excel (futuro)

### 4. Responsive Design

- **Tablas**: Scroll horizontal en móviles
- **Formularios**: Layout adaptativo
- **Diálogos**: Tamaño máximo en móviles

---

## ⚠️ Notas Importantes

1. **Dependencias circulares**: Evitar importar normalizadores entre sí. Considerar mover `normalizeProductionOutputSource` a `normalizers.js`.

2. **Validaciones**: El backend valida estrictamente, pero el frontend debe validar también para mejor UX.

3. **Cálculos**: Los costes se calculan dinámicamente en el backend. No almacenar valores calculados en el frontend.

4. **Performance**: Considerar paginación para listas grandes de costes.

5. **Manejo de errores**: Mostrar mensajes claros al usuario cuando falle una operación.

6. **Accesibilidad**: Asegurar que todos los componentes sean accesibles (ARIA labels, keyboard navigation).

---

## 📚 Referencias

- Documentación Backend: Ver documento proporcionado por el usuario
- Componentes UI: `/src/components/ui/`
- Helpers: `/src/helpers/production/`
- Servicios: `/src/services/`

---

## ✅ Checklist de Implementación

### Servicios
- [ ] Crear `costService.js`
- [ ] Actualizar `productionService.js` si es necesario

### Normalizadores
- [ ] Crear `costNormalizers.js`
- [ ] Crear `costFormatters.js`
- [ ] Actualizar `normalizers.js`

### Componentes
- [ ] Crear `CostDisplay.jsx`
- [ ] Crear `CostSourceSelector.jsx`
- [ ] Crear `CostBreakdownView.jsx`
- [ ] Crear `ProductionCostsManager.jsx`
- [ ] Crear `CostCatalogManager.jsx`

### Integración
- [ ] Actualizar `ProductionOutputsManager.jsx`
- [ ] Integrar en vistas de procesos/producciones
- [ ] Crear ruta para catálogo de costes

### Testing
- [ ] Tests unitarios de normalizadores
- [ ] Tests unitarios de formateadores
- [ ] Tests de integración
- [ ] Tests manuales completos

### Documentación
- [ ] Actualizar documentación de componentes
- [ ] Documentar nuevos endpoints en servicios
- [ ] Guía de uso para usuarios

---

**Última actualización**: 2025-01-XX  
**Mantenido por**: Equipo Frontend

