# Análisis de Disponibilidad de Cajas en Palets

## 📚 Documentación Relacionada

- **[14-PRODUCCION-EN-CONSTRUCCION.md](./14-PRODUCCION-EN-CONSTRUCCION.md)** - Estado del módulo de producción
- **[05-HOOKS-PERSONALIZADOS.md](./05-HOOKS-PERSONALIZADOS.md)** - Hook `usePallet`
- **[04-COMPONENTES-ADMIN.md](./04-COMPONENTES-ADMIN.md)** - Componentes de producción y almacenes

---

## 📋 Resumen Ejecutivo

Con la implementación de la nueva lógica de disponibilidad de cajas por consumos de materia prima en producciones, se ha identificado que múltiples componentes de la aplicación están mostrando datos erróneos al contar **todas las cajas** en lugar de solo las **cajas disponibles** (`box.isAvailable !== false`).

Este documento recopila todos los lugares donde se requiere modificación y evalúa el riesgo asociado a cada cambio.

---

## Contexto Técnico

### Lógica de Disponibilidad
- Una caja está **disponible** cuando `box.isAvailable !== false`
- Una caja está **en producción** cuando `box.isAvailable === false` (consumida por una producción)
- La función helper `isBoxAvailable(box)` verifica: `return box.isAvailable !== false;`

### Datos del Backend
El endpoint `getPallet` (y otros endpoints que devuelven palets) ahora incluyen campos calculados en el backend:

**Estructura completa del palet desde el backend:**
```json
{
    "id": 45,
    "boxes": [
        {
            "id": 123,
            "isAvailable": true,  // ✅ Disponible
            "production": null,
            "netWeight": 25.50,
            "product": {...},
            "lot": "..."
        },
        {
            "id": 124,
            "isAvailable": false, // ❌ No disponible (en producción)
            "production": {
                "id": 5,
                "lot": "PROD-2024-001"
            },
            "netWeight": 25.50,
            "product": {...},
            "lot": "..."
        }
    ],
    "availableBoxesCount": 1,      // ✅ Número de cajas disponibles
    "usedBoxesCount": 1,          // ✅ Número de cajas en producción
    "totalAvailableWeight": 25.50, // ✅ Peso total de cajas disponibles
    "totalUsedWeight": 25.50       // ✅ Peso total de cajas en producción
}
```

**Importante:** Estos campos están disponibles cuando el palet viene del backend, pero NO en:
- Palets temporales (`temporalPallet`) durante edición
- Palets nuevos que aún no se han guardado (`id === null`)
- Cálculos locales durante edición antes de guardar
- Palets que se crean/modifican localmente antes de sincronizar con el backend

**Estrategia:** El frontend debe priorizar estos valores cuando estén disponibles, pero también debe poder calcularlos desde las cajas cuando no lo estén.

### Impacto
Cuando una caja es consumida por una producción, su `isAvailable` se establece en `false`, pero muchos componentes siguen contándola en los totales, lo que genera:
- Estadísticas incorrectas de almacenes
- Reportes con datos erróneos
- Etiquetas de palets con información incorrecta
- Cálculos de peso y cantidad inexactos

---

## Lugares que Requieren Modificación

### 1. **Hook `usePallet.js` - Función `recalculatePalletStats`**

**Ubicación:** `src/hooks/usePallet.js:17-29`

**Problema:**
```javascript
const recalculatePalletStats = (pallet) => {
    const numberOfBoxes = pallet.boxes.length; // ❌ Cuenta TODAS las cajas
    const netWeight = pallet.boxes.reduce(
        (total, box) => total + parseFloat(box.netWeight || 0),
        0
    ); // ❌ Suma peso de TODAS las cajas
    // ...
}
```

**Solución:**
```javascript
const recalculatePalletStats = (pallet) => {
    // Si el palet viene del backend con campos calculados, usarlos
    // Si no, calcular desde las cajas (palets temporales o nuevos)
    const isBoxAvailable = (box) => box.isAvailable !== false;
    
    let numberOfBoxes, netWeight;
    
    if (pallet.availableBoxesCount !== undefined) {
        // ✅ Usar valores del backend si están disponibles
        numberOfBoxes = pallet.availableBoxesCount;
        netWeight = pallet.totalAvailableWeight || 0;
    } else {
        // ✅ Calcular desde cajas (para palets temporales/nuevos)
        const availableBoxes = pallet.boxes.filter(isBoxAvailable);
        numberOfBoxes = availableBoxes.length;
        netWeight = availableBoxes.reduce(
            (total, box) => total + parseFloat(box.netWeight || 0),
            0
        );
    }
    
    return {
        ...pallet,
        numberOfBoxes,
        netWeight: parseFloat(netWeight.toFixed(3))
    };
};
```

**Riesgo:** 🔴 **ALTO**
- Esta función se usa en múltiples lugares (edición de palets, creación, actualización)
- Afecta directamente a `pallet.numberOfBoxes` y `pallet.netWeight` que se muestran en toda la aplicación
- Debe manejar tanto palets del backend (con campos calculados) como palets temporales (sin ellos)

**Dependencias:**
- Todos los componentes que muestran `pallet.numberOfBoxes` o `pallet.netWeight`
- Cualquier cálculo que use estas propiedades

---

### 2. **Hook `useStore.js` - Cálculo de `speciesSummary`**

**Ubicación:** `src/hooks/useStore.js:145-209`

**Problema:**
```javascript
store?.content?.pallets?.forEach((pallet) => {
    pallet.boxes?.forEach((box) => { // ❌ Itera TODAS las cajas
        // ... cuenta todas las cajas en el resumen
        productData.boxes += 1; // ❌ Cuenta todas
    });
});
```

**Solución:**
```javascript
store?.content?.pallets?.forEach((pallet) => {
    pallet.boxes
        ?.filter(box => box.isAvailable !== false) // ✅ Filtrar solo disponibles
        ?.forEach((box) => {
            // ... resto del código igual
        });
});
```

**Riesgo:** 🟡 **MEDIO**
- Afecta el resumen de especies en la vista de almacenes
- Puede mostrar cantidades incorrectas en los filtros y estadísticas
- No afecta directamente a la funcionalidad crítica

---

### 3. **Hook `useStore.js` - Función `updateStoreWhenOnChangePallet`**

**Ubicación:** `src/hooks/useStore.js:392-395` y `438-439`

**Problema:**
```javascript
const totalNetWeight = updatedPallets.reduce((total, pallet) => {
    const palletNetWeight = pallet.boxes?.reduce(
        (sum, box) => sum + (box.netWeight || 0), 
        0
    ) || 0; // ❌ Suma peso de TODAS las cajas
    return total + palletNetWeight;
}, 0);
```

**Solución:**
```javascript
const totalNetWeight = updatedPallets.reduce((total, pallet) => {
    const palletNetWeight = pallet.boxes
        ?.filter(box => box.isAvailable !== false) // ✅ Filtrar disponibles
        ?.reduce((sum, box) => sum + (box.netWeight || 0), 0) || 0;
    return total + palletNetWeight;
}, 0);
```

**Riesgo:** 🟡 **MEDIO**
- Afecta el peso total del almacén mostrado en la UI
- Puede causar discrepancias en reportes de almacén
- No afecta directamente a operaciones críticas

---

### 4. **Componente `PalletsListDialog` - Cálculo de totales**

**Ubicación:** `src/components/Admin/Stores/StoresManager/Store/PalletsListDialog/index.js:74-92`

**Problema:**
```javascript
const filtered = speciesPallets
    .map((pallet) => {
        const totalWeight = pallet.boxes.reduce(
            (sum, b) => sum + (parseFloat(b.netWeight) || 0), 
            0
        ); // ❌ Suma TODAS las cajas
        const totalBoxes = pallet.boxes.length; // ❌ Cuenta TODAS las cajas
        // ...
    });

// También en línea 90-92:
const totalWeight = pallets.reduce((total, pallet) => {
    return total + pallet.boxes.reduce(
        (sum, box) => sum + (parseFloat(box.netWeight) || 0), 
        0
    ); // ❌ Suma TODAS las cajas
}, 0);
```

**Solución:**
```javascript
// Usar valores del backend si están disponibles, sino calcular
const filtered = speciesPallets
    .map((pallet) => {
        const totalBoxes = pallet.availableBoxesCount ?? 
            (pallet.boxes?.filter(b => b.isAvailable !== false).length || 0);
        const totalWeight = pallet.totalAvailableWeight ?? 
            (pallet.boxes?.filter(b => b.isAvailable !== false)
                .reduce((sum, b) => sum + (parseFloat(b.netWeight) || 0), 0) || 0);
        return {
            id: pallet.id,
            totalWeight,
            totalBoxes,
        };
    });

const totalWeight = pallets.reduce((total, pallet) => {
    const palletWeight = pallet.totalAvailableWeight ?? 
        (pallet.boxes?.filter(box => box.isAvailable !== false)
            .reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0) || 0);
    return total + palletWeight;
}, 0);
```

**Riesgo:** 🟡 **MEDIO**
- Afecta la visualización en el diálogo de listado de palets
- Afecta la exportación a Excel (línea 107-108)
- Puede generar reportes incorrectos

---

### 5. **Componente `PalletCard` - Visualización de estadísticas**

**Ubicación:** `src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.js:42-54` y `192-196`

**Problema:**
```javascript
const productsSummary = pallet.boxes.reduce((acc, box) => {
    // ❌ Itera TODAS las cajas
    acc[product.id].boxCount += 1; // ❌ Cuenta todas
    // ...
}, {});

// En el footer:
<span>{pallet.boxes.length} {pallet.boxes.length === 1 ? "caja" : "cajas"}</span>
// ❌ Muestra total de TODAS las cajas
```

**Solución:**
```javascript
// Usar valores del backend si están disponibles, sino calcular
const isBoxAvailable = (box) => box.isAvailable !== false;
const availableBoxes = pallet.boxes?.filter(isBoxAvailable) || [];
const availableBoxCount = pallet.availableBoxesCount ?? availableBoxes.length;
const availableNetWeight = pallet.totalAvailableWeight ?? 
    availableBoxes.reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0);

const productsSummary = availableBoxes.reduce((acc, box) => {
    // ✅ Solo cajas disponibles
    // ...
}, {});

// En el footer:
<span>{availableBoxCount} {availableBoxCount === 1 ? "caja" : "cajas"}</span>
<span>{formatDecimalWeight(availableNetWeight)}</span>
```

**Riesgo:** 🟢 **BAJO**
- Solo afecta la visualización en las tarjetas de palets
- No afecta cálculos críticos
- Fácil de corregir

---

### 6. **Componente `AddElementToPositionDialog` - Lista de palets**

**Ubicación:** `src/components/Admin/Stores/StoresManager/Store/AddElementToPositionDialog/index.js:255-267` y `322-327`

**Problema:**
```javascript
const productsSummary = pallet.boxes.reduce((acc, box) => {
    // ❌ Itera TODAS las cajas
    acc[product.id].boxCount += 1; // ❌ Cuenta todas
}, {});

// Línea 323-327:
<span>Total: {pallet.netWeight.toFixed(1)} kg</span>
<span>{pallet.numberOfBoxes} {pallet.numberOfBoxes === 1 ? "caja" : "cajas"}</span>
// ❌ Usa valores que incluyen todas las cajas
```

**Solución:**
```javascript
// Usar valores del backend si están disponibles, sino calcular
const isBoxAvailable = (box) => box.isAvailable !== false;
const availableBoxes = pallet.boxes?.filter(isBoxAvailable) || [];
const availableBoxCount = pallet.availableBoxesCount ?? availableBoxes.length;
const availableNetWeight = pallet.totalAvailableWeight ?? 
    availableBoxes.reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0);

const productsSummary = availableBoxes.reduce((acc, box) => {
    // ✅ Solo cajas disponibles
}, {});

// Mostrar:
<span>Total: {availableNetWeight.toFixed(1)} kg</span>
<span>{availableBoxCount} {availableBoxCount === 1 ? "caja" : "cajas"}</span>
```

**Riesgo:** 🟢 **BAJO**
- Solo afecta la visualización en el diálogo de selección
- No afecta la funcionalidad de ubicación de palets

---

### 7. **Componente `PalletLabel` - Etiqueta de palet**

**Ubicación:** `src/components/Admin/Pallets/PalletLabel/index.js:50`

**Problema:**
```javascript
<p className="text-lg font-medium">{pallet.numberOfBoxes} cajas</p>
// ❌ Muestra total de TODAS las cajas (incluye en producción)
```

**Solución:**
```javascript
// Usar valores del backend si están disponibles, sino calcular
const availableBoxCount = pallet.availableBoxesCount ?? 
    (pallet.boxes?.filter(box => box.isAvailable !== false).length || 0);
const availableNetWeight = pallet.totalAvailableWeight ?? 
    (pallet.boxes?.filter(box => box.isAvailable !== false)
        .reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0) || 0);

// Mostrar:
<p className="text-lg font-medium">{availableBoxCount} cajas</p>
<p className="text-lg font-medium">{formatDecimalWeight(availableNetWeight)}</p>
```

**Riesgo:** 🟡 **MEDIO**
- Las etiquetas impresas mostrarán información incorrecta
- Puede causar confusión en almacén/logística
- Las etiquetas ya impresas no se pueden corregir

---

### 8. **Hook `useOrder.js` - `productionProductDetails`**

**Ubicación:** `src/hooks/useOrder.js:31-35` y `47-50`

**Problema:**
El hook recibe `productionProductDetails` del backend que puede estar contando todas las cajas. Necesita verificación en el backend, pero también se debe validar en el frontend.

**Solución:**
Verificar que el backend solo cuente cajas disponibles. Si no es posible, filtrar en el frontend:
```javascript
// En mergeOrderDetails, si productionProductDetails viene del backend:
// Verificar que el backend ya filtre por cajas disponibles
// Si no, sería necesario filtrar aquí (aunque idealmente debería venir ya filtrado)
```

**Riesgo:** 🔴 **ALTO**
- Afecta los cálculos de cumplimiento de pedidos
- Puede mostrar que un pedido está completo cuando en realidad faltan cajas disponibles
- Impacta directamente en la toma de decisiones comerciales

**Nota:** Requiere verificación del backend para confirmar si ya filtra por cajas disponibles.

---

### 9. **Componente `ProductionInputsManager` - Algunos cálculos**

**Ubicación:** `src/components/Admin/Productions/ProductionInputsManager.jsx`

**Estado:** ✅ **PARCIALMENTE CORRECTO**
- Ya usa `isBoxAvailable()` en muchos lugares (líneas 66, 230, 461, etc.)
- Sin embargo, algunos cálculos de resumen pueden necesitar revisión

**Revisar:**
- Línea 358: `boxesCount: pallet.boxes.length` - Verificar si debe filtrar
- Línea 410: `totalBoxes = inputs.filter(input => input.box?.id).length` - Esto está bien porque `inputs` ya contiene solo cajas seleccionadas (disponibles)

**Riesgo:** 🟢 **BAJO**
- La mayoría de los cálculos ya están correctos
- Solo requiere revisión puntual

---

### 10. **Componente `PalletView` - Resumen de cajas**

**Ubicación:** `src/components/Admin/Pallets/PalletDialog/PalletView/index.js`

**Estado:** ✅ **CORRECTO**
- Ya implementa `groupBoxesByProduction()` que separa disponibles de en producción
- El resumen se calcula correctamente según el tab activo (líneas 541-553)
- Muestra correctamente las cajas disponibles vs en producción

**Riesgo:** ✅ **NINGUNO**
- Ya está implementado correctamente

---

## Resumen de Riesgos por Prioridad

### 🔴 **ALTA PRIORIDAD** (Crítico - Requiere acción inmediata)

1. **`usePallet.js` - `recalculatePalletStats`**
   - Impacto: Afecta todos los cálculos de palets en toda la aplicación
   - Acción: Modificar inmediatamente

2. **`useOrder.js` - `productionProductDetails`**
   - Impacto: Afecta cumplimiento de pedidos y decisiones comerciales
   - Acción: Verificar backend y corregir si es necesario

### 🟡 **MEDIA PRIORIDAD** (Importante - Corregir pronto)

3. **`useStore.js` - `speciesSummary`**
   - Impacto: Estadísticas de almacén incorrectas
   - Acción: Corregir en próxima iteración

4. **`useStore.js` - `updateStoreWhenOnChangePallet`**
   - Impacto: Peso total de almacén incorrecto
   - Acción: Corregir en próxima iteración

5. **`PalletsListDialog` - Totales**
   - Impacto: Reportes y exportaciones incorrectas
   - Acción: Corregir en próxima iteración

6. **`PalletLabel` - Etiquetas impresas**
   - Impacto: Información incorrecta en etiquetas físicas
   - Acción: Corregir antes de nuevas impresiones

### 🟢 **BAJA PRIORIDAD** (Mejora - Puede esperar)

7. **`PalletCard` - Visualización**
   - Impacto: Solo visual, no afecta funcionalidad
   - Acción: Corregir cuando sea conveniente

8. **`AddElementToPositionDialog` - Visualización**
   - Impacto: Solo visual, no afecta funcionalidad
   - Acción: Corregir cuando sea conveniente

---

## Estrategia de Implementación

### Cuándo Usar Valores del Backend vs Calcular

**Usar valores del backend (`availableBoxesCount`, `totalAvailableWeight`) cuando:**
- ✅ El palet viene de una respuesta del backend (GET)
- ✅ El palet está guardado y tiene estos campos
- ✅ Se necesita rendimiento óptimo (evita iterar sobre todas las cajas)

**Calcular desde las cajas cuando:**
- ✅ El palet es temporal (`temporalPallet`) y aún no se ha guardado
- ✅ El palet es nuevo (`id === null`)
- ✅ Los campos del backend no están disponibles (`undefined`)
- ✅ Se está editando el palet y los valores pueden cambiar antes de guardar

### Patrón Recomendado

```javascript
// Patrón estándar para obtener estadísticas de cajas disponibles
const getPalletStats = (pallet) => {
    // Priorizar valores del backend si están disponibles
    const availableBoxesCount = pallet.availableBoxesCount ?? 
        pallet.boxes?.filter(box => box.isAvailable !== false).length ?? 0;
    
    const totalAvailableWeight = pallet.totalAvailableWeight ?? 
        pallet.boxes?.filter(box => box.isAvailable !== false)
            .reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0) ?? 0;
    
    return { availableBoxesCount, totalAvailableWeight };
};
```

## Recomendaciones de Implementación

### Fase 1: Crítico (Inmediato)
1. ✅ Crear helper functions en `src/helpers/pallet/boxAvailability.js`
2. Modificar `recalculatePalletStats` en `usePallet.js` para usar valores del backend cuando estén disponibles
3. Verificar y corregir `productionProductDetails` en backend/frontend

### Fase 2: Importante (Próxima semana)
4. Corregir cálculos en `useStore.js` usando helper functions
5. Corregir `PalletsListDialog` usando valores del backend
6. Corregir `PalletLabel` usando valores del backend

### Fase 3: Mejoras (Cuando sea conveniente)
7. Corregir visualizaciones en `PalletCard` y `AddElementToPositionDialog` usando helper functions

---

## Consideraciones Adicionales

### Backend
✅ **El backend ya proporciona campos calculados:**
- `availableBoxesCount`: Número de cajas disponibles
- `usedBoxesCount`: Número de cajas en producción
- `totalAvailableWeight`: Peso total de cajas disponibles
- `totalUsedWeight`: Peso total de cajas en producción

**Verificar que estos campos estén disponibles en:**
- Endpoint `getPallet`
- Endpoints que devuelven listas de palets (almacenes, pedidos)
- Endpoints que devuelven `productionProductDetails`
- Reportes y exportaciones

**Nota:** El frontend debe usar estos valores cuando estén disponibles, pero también debe poder calcularlos para palets temporales o nuevos que aún no se han guardado.

### Base de Datos
- Confirmar que `numberOfBoxes` y `netWeight` en la tabla de palets se calculan correctamente
- Considerar si estos campos deben almacenarse o calcularse dinámicamente

### Testing
- Crear tests que verifiquen que solo se cuentan cajas disponibles
- Probar escenarios con cajas en producción
- Verificar que los reportes muestran datos correctos

### Migración
- Si hay datos históricos incorrectos, considerar si se necesita migración
- Las etiquetas ya impresas no se pueden corregir, pero las nuevas serán correctas

---

## Función Helper Recomendada

Para mantener consistencia, se recomienda crear una función helper centralizada que priorice los valores del backend cuando estén disponibles:

```javascript
// src/helpers/pallet/boxAvailability.js
export const isBoxAvailable = (box) => {
    return box.isAvailable !== false;
};

export const getAvailableBoxes = (boxes) => {
    return (boxes || []).filter(isBoxAvailable);
};

/**
 * Obtiene el conteo de cajas disponibles.
 * Prioriza el valor del backend si está disponible, sino calcula desde las cajas.
 */
export const getAvailableBoxesCount = (pallet) => {
    if (pallet?.availableBoxesCount !== undefined) {
        return pallet.availableBoxesCount;
    }
    return getAvailableBoxes(pallet?.boxes || []).length;
};

/**
 * Obtiene el peso total de cajas disponibles.
 * Prioriza el valor del backend si está disponible, sino calcula desde las cajas.
 */
export const getAvailableNetWeight = (pallet) => {
    if (pallet?.totalAvailableWeight !== undefined) {
        return parseFloat(pallet.totalAvailableWeight);
    }
    return getAvailableBoxes(pallet?.boxes || []).reduce(
        (total, box) => total + parseFloat(box.netWeight || 0),
        0
    );
};

/**
 * Obtiene el conteo de cajas usadas (en producción).
 * Prioriza el valor del backend si está disponible, sino calcula desde las cajas.
 */
export const getUsedBoxesCount = (pallet) => {
    if (pallet?.usedBoxesCount !== undefined) {
        return pallet.usedBoxesCount;
    }
    return (pallet?.boxes || []).filter(box => box.isAvailable === false).length;
};

/**
 * Obtiene el peso total de cajas usadas (en producción).
 * Prioriza el valor del backend si está disponible, sino calcula desde las cajas.
 */
export const getUsedNetWeight = (pallet) => {
    if (pallet?.totalUsedWeight !== undefined) {
        return parseFloat(pallet.totalUsedWeight);
    }
    return (pallet?.boxes || [])
        .filter(box => box.isAvailable === false)
        .reduce((total, box) => total + parseFloat(box.netWeight || 0), 0);
};
```

Y usarla en todos los lugares donde se necesite obtener estadísticas de cajas disponibles/usadas.

---

## Conclusión

Se han identificado **10 áreas principales** que requieren modificación, con diferentes niveles de riesgo. Se recomienda abordar primero las de **alta prioridad** que afectan cálculos críticos, y luego continuar con las de menor impacto.

La implementación debe ser cuidadosa para evitar romper funcionalidades existentes, especialmente en componentes que ya manejan correctamente la disponibilidad (como `PalletView` y `ProductionInputsManager`).

