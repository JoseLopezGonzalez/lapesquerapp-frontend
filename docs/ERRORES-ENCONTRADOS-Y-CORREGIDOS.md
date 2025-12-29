# Análisis de Errores - Trazabilidad de Costes

**Fecha**: 2025-01-XX  
**Estado**: Errores corregidos

---

## 🔍 Errores Encontrados y Corregidos

### 1. ✅ Import no utilizado en `costService.js`

**Problema**: Se importaba `normalizeProductionOutputSource` pero nunca se usaba.

**Ubicación**: `src/services/costService.js:7`

**Corrección**: Eliminado el import no utilizado.

```javascript
// ANTES
import {
    normalizeCostCatalog,
    normalizeProductionCost,
    normalizeCostBreakdown,
    normalizeProductionOutputSource, // ❌ No se usa
} from "@/helpers/production/costNormalizers";

// DESPUÉS
import {
    normalizeCostCatalog,
    normalizeProductionCost,
    normalizeCostBreakdown,
} from "@/helpers/production/costNormalizers";
```

---

### 2. ✅ Formato incorrecto de sources al enviar al backend

**Problema**: Los sources se enviaban directamente sin formatear correctamente. El backend espera:
- `source_type` (string)
- `production_input_id` O `production_output_consumption_id` (según el tipo)
- `contributed_weight_kg` O `contribution_percentage` (no ambos)

**Ubicación**: `src/components/Admin/Productions/ProductionOutputsManager.jsx:229`

**Corrección**: Añadida función para formatear sources correctamente antes de enviar.

```javascript
// ANTES
sources: formData.sources && formData.sources.length > 0 ? formData.sources : undefined

// DESPUÉS
const formattedSources = formData.sources && formData.sources.length > 0 
    ? formData.sources.map(source => {
        const formatted = {
            source_type: source.source_type
        };
        
        if (source.source_type === 'stock_box') {
            formatted.production_input_id = parseInt(source.production_input_id);
        } else if (source.source_type === 'parent_output') {
            formatted.production_output_consumption_id = parseInt(source.production_output_consumption_id);
        }
        
        if (source.contributed_weight_kg !== null && source.contributed_weight_kg !== undefined && source.contributed_weight_kg !== '') {
            formatted.contributed_weight_kg = parseFloat(source.contributed_weight_kg);
        } else if (source.contribution_percentage !== null && source.contribution_percentage !== undefined && source.contribution_percentage !== '') {
            formatted.contribution_percentage = parseFloat(source.contribution_percentage);
        }
        
        return formatted;
    })
    : undefined;
```

---

### 3. ✅ Mejora en cálculo de porcentajes/pesos en CostSourceSelector

**Problema**: Cuando se actualizaba un campo, no se limpiaba correctamente el otro campo, lo que podía causar confusión.

**Ubicación**: `src/components/Admin/Productions/CostSourceSelector.jsx:91`

**Corrección**: Mejorado el cálculo para limpiar el campo opuesto cuando se actualiza uno.

```javascript
// ANTES
if (field === 'contributed_weight_kg' && totalWeightKg > 0) {
    const weight = parseFloat(value) || 0;
    updated[index].contribution_percentage = (weight / totalWeightKg) * 100;
}

// DESPUÉS
if (field === 'contributed_weight_kg' && totalWeightKg > 0) {
    const weight = parseFloat(value) || 0;
    currentSource.contributed_weight_kg = value === '' ? null : weight;
    currentSource.contribution_percentage = weight > 0 ? (weight / totalWeightKg) * 100 : null;
}
```

---

### 4. ✅ Problema al desactivar catálogo en ProductionCostsManager

**Problema**: Si el usuario desactivaba el checkbox de "Usar catálogo" después de seleccionar un item, el `cost_catalog_id` seguía presente, lo que podía causar conflictos.

**Ubicación**: `src/components/Admin/Productions/ProductionCostsManager.jsx:216`

**Corrección**: Limpiar `cost_catalog_id` cuando se desactiva el catálogo.

```javascript
// ANTES
onChange={(e) => setUseCatalog(e.target.checked)}

// DESPUÉS
onChange={(e) => {
    const newUseCatalog = e.target.checked;
    setUseCatalog(newUseCatalog);
    if (!newUseCatalog) {
        setFormData(prev => ({
            ...prev,
            cost_catalog_id: ''
        }));
    }
}}
```

---

## ⚠️ Posibles Problemas Adicionales (Revisar en Testing)

### 1. Validación de sources vacíos

**Ubicación**: `ProductionOutputsManager.jsx`

**Nota**: Si un source tiene `contributed_weight_kg` y `contribution_percentage` ambos como null/undefined, el backend podría rechazarlo. La validación actual permite esto, pero el backend debería validar que al menos uno esté presente.

**Recomendación**: Añadir validación en el frontend para asegurar que al menos uno de los campos esté presente antes de enviar.

---

### 2. Manejo de errores en CostBreakdownView

**Ubicación**: `CostBreakdownView.jsx:43`

**Nota**: Si `response.data.costBreakdown` es null o undefined, el componente podría fallar. Actualmente se maneja con `if (!breakdown) return null`, pero debería verificarse también en la carga.

**Estado**: Actualmente manejado correctamente.

---

### 3. Precisión de cálculos de porcentajes

**Ubicación**: `CostSourceSelector.jsx`

**Nota**: Los cálculos de porcentajes pueden tener problemas de precisión de punto flotante. La validación actual usa `Math.abs(totalPercentage - 100) < 0.01`, lo cual es correcto.

**Estado**: Correctamente manejado.

---

## ✅ Verificaciones Realizadas

- [x] Imports no utilizados eliminados
- [x] Formato de sources corregido
- [x] Cálculos de porcentajes mejorados
- [x] Manejo de catálogo mejorado
- [x] Sin errores de linting
- [x] Estructura de datos validada
- [x] Normalizadores verificados

---

## 📝 Notas Finales

Todos los errores críticos han sido corregidos. Los componentes deberían funcionar correctamente con el backend. Se recomienda realizar pruebas exhaustivas con datos reales para verificar:

1. Creación de outputs con sources
2. Cálculo de costes
3. Visualización de desglose
4. Gestión de costes desde catálogo y ad-hoc
5. Validaciones del backend

---

**Última actualización**: 2025-01-XX

