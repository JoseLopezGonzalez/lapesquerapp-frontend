# Análisis: Problema de "Cambios No Guardados" después de Guardar

## Problema Reportado

Cuando se guarda una recepción y el backend acepta la petición (mostrando mensaje de éxito), a veces sigue apareciendo el indicador de "cambios sin guardar".

## Análisis del Código

### Ubicación del Problema

**Archivo**: `src/components/Admin/RawMaterialReceptions/EditReceptionForm/index.js`

**Líneas clave**:
- Líneas 506-538: Cálculo de `hasUnsavedChanges`
- Líneas 666-703: Función `handleUpdate` que guarda y actualiza el estado

---

## Casos Identificados donde Puede Ocurrir el Problema

### 🔴 **CRÍTICO 1: Modo 'lines' - No se resetea el formulario**

**Ubicación**: Líneas 666-703 en `handleUpdate`

**Problema**: 
En modo 'lines', el código usa `isDirty` de react-hook-form para detectar cambios (línea 526). Sin embargo, después de guardar exitosamente, **NO se llama a `reset()`** para limpiar el estado `isDirty`.

**Código actual**:
```javascript
// Línea 666: Se guarda exitosamente
const updatedReception = await updateRawMaterialReception(receptionId, payload);

// Líneas 686-693: Solo se actualiza initialFormState, pero NO se resetea el formulario
const currentFormData = {
    supplier: data.supplier,
    date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date,
    notes: data.notes || '',
    declaredTotalAmount: data.declaredTotalAmount || '',
    declaredTotalNetWeight: data.declaredTotalNetWeight || '',
};
setInitialFormState(JSON.stringify(currentFormData));

// ❌ FALTA: reset(formData) para limpiar isDirty
```

**Por qué ocurre**:
- `isDirty` de react-hook-form se mantiene en `true` hasta que se llama a `reset()` con los nuevos valores
- Si el backend modifica algún valor (redondeo, normalización), el formulario mantiene los valores originales y `isDirty` sigue siendo `true`

**Solución**:
```javascript
// Después de guardar exitosamente en modo 'lines'
if (creationMode !== 'pallets') {
    // Resetear el formulario con los datos actualizados del backend
    const formDataFromBackend = {
        supplier: updatedReception.supplier?.id?.toString() || data.supplier,
        date: updatedReception.date ? new Date(updatedReception.date) : data.date,
        notes: updatedReception.notes || data.notes || '',
        details: mapDetails(updatedReception.details), // Mapear detalles del backend
        declaredTotalAmount: updatedReception.declaredTotalAmount !== null && updatedReception.declaredTotalAmount !== undefined 
            ? parseFloat(updatedReception.declaredTotalAmount).toString() 
            : '',
        declaredTotalNetWeight: updatedReception.declaredTotalNetWeight !== null && updatedReception.declaredTotalNetWeight !== undefined 
            ? parseFloat(updatedReception.declaredTotalNetWeight).toString() 
            : '',
    };
    reset(formDataFromBackend);
    setInitialFormState(JSON.stringify(normalizeFormData(formDataFromBackend)));
}
```

---

### 🔴 **CRÍTICO 2: Modo 'pallets' - Comparación JSON puede fallar**

**Ubicación**: Líneas 528-536 en `hasUnsavedChanges`, líneas 669-683 en `handleUpdate`

**Problema**:
La comparación de cambios se hace mediante `JSON.stringify()` de los pallets. Esta comparación puede fallar si:

1. **Orden diferente**: El backend puede devolver los pallets en un orden diferente
2. **Campos adicionales**: El backend puede agregar campos que no estaban en el estado inicial
3. **Diferencias de formato**: 
   - Números como string vs number (`"123"` vs `123`)
   - `undefined` vs `null` vs `''`
   - Campos que se agregan/eliminan
4. **Estructura diferente**: `mapBackendPalletsToTemporal` puede crear una estructura ligeramente diferente

**Código actual**:
```javascript
// Línea 529: Comparación JSON
const currentPalletsState = JSON.stringify(temporalPallets);

// Línea 682: Actualización después de guardar
setInitialPalletsState(JSON.stringify(updatedTemporalPallets));
```

**Ejemplo de problema**:
```javascript
// Estado inicial (después de cargar)
initialPalletsState = JSON.stringify([
  { pallet: { id: 1, boxes: [...] }, prices: {...}, observations: '' }
]);

// Después de guardar, backend devuelve:
updatedTemporalPallets = [
  { pallet: { id: 1, boxes: [...] }, prices: {...}, observations: undefined }
];

// JSON.stringify puede producir strings diferentes:
// '{"pallet":{...},"prices":{...},"observations":""}'  vs
// '{"pallet":{...},"prices":{...}}'  (sin observations)
```

**Solución**:
1. **Normalizar antes de comparar**: Crear una función que normalice los pallets antes de hacer JSON.stringify
2. **Usar comparación profunda normalizada** en lugar de JSON.stringify directo
3. **Asegurar que `mapBackendPalletsToTemporal` preserve exactamente el mismo formato**

---

### 🟠 **IMPORTANTE 3: Backend modifica valores**

**Problema**:
El backend puede modificar valores durante el guardado:
- Redondeo de números (pesos, precios)
- Normalización de fechas
- Conversión de tipos
- Validación y ajuste de valores

**Ejemplo**:
```javascript
// Usuario ingresa:
declaredTotalAmount: "123.456789"

// Backend redondea a 2 decimales y devuelve:
declaredTotalAmount: 123.46

// El formulario mantiene "123.456789" y isDirty sigue siendo true
```

**Solución**:
Siempre usar los valores devueltos por el backend para actualizar el estado inicial, no los valores del formulario.

---

### 🟠 **IMPORTANTE 4: Race condition en actualización de estado**

**Problema**:
Si el usuario hace cambios rápidamente después de guardar, puede haber una condición de carrera:

1. Usuario guarda → `handleUpdate` se ejecuta
2. Backend responde exitosamente
3. Se actualiza `initialPalletsState` / `initialFormState`
4. **PERO** el usuario ya hizo un cambio antes de que se completara la actualización
5. El nuevo cambio se compara con el estado inicial antiguo

**Solución**:
- Deshabilitar el formulario durante el guardado (`isSubmitting`)
- Usar una bandera para prevenir actualizaciones durante el guardado

---

### 🟡 **NICE-TO-HAVE 5: Diferencias en campos opcionales**

**Problema**:
Campos opcionales pueden tener diferentes representaciones:
- `undefined` vs `null` vs `''`
- Objetos vacíos `{}` vs `undefined`

**Ejemplo**:
```javascript
// Estado inicial
observations: undefined

// Después de editar y guardar
observations: ''

// JSON.stringify puede producir strings diferentes
```

**Solución**:
Normalizar todos los campos opcionales antes de comparar.

---

## Soluciones Propuestas

### Solución 1: Resetear formulario en modo 'lines'

**Archivo**: `EditReceptionForm/index.js`

**Cambios necesarios**:
1. Después de guardar exitosamente en modo 'lines', cargar los datos del backend
2. Mapear los detalles del backend al formato del formulario
3. Llamar a `reset()` con los datos actualizados
4. Actualizar `initialFormState` con los datos normalizados

### Solución 2: Normalizar comparación en modo 'pallets'

**Archivo**: `EditReceptionForm/index.js`

**Cambios necesarios**:
1. Crear función `normalizePalletsForComparison` que:
   - Ordena pallets por ID
   - Normaliza campos opcionales (undefined → null → '')
   - Normaliza números (string → number)
   - Elimina campos no relevantes para la comparación
2. Usar esta función antes de `JSON.stringify` en `hasUnsavedChanges`
3. Usar esta función al actualizar `initialPalletsState`

### Solución 3: Siempre usar datos del backend

**Archivo**: `EditReceptionForm/index.js`

**Cambios necesarios**:
1. Después de guardar, recargar la recepción completa del backend (o usar la respuesta)
2. Mapear todos los datos del backend al formato del frontend
3. Actualizar tanto el formulario como los estados iniciales con estos datos

### Solución 4: Mejorar manejo de errores y estados

**Archivo**: `EditReceptionForm/index.js`

**Cambios necesarios**:
1. Agregar logging para debug cuando `hasUnsavedChanges` no se actualiza
2. Agregar validación para asegurar que el estado se actualiza correctamente
3. Mostrar mensaje de advertencia si el estado no se actualiza después de X segundos

---

## Priorización

1. **🔴 CRÍTICO**: Solución 1 (Resetear formulario en modo 'lines') - Afecta a todas las recepciones en modo líneas
2. **🔴 CRÍTICO**: Solución 2 (Normalizar comparación en modo 'pallets') - Afecta a todas las recepciones en modo pallets
3. **🟠 IMPORTANTE**: Solución 3 (Usar datos del backend) - Mejora la consistencia general
4. **🟡 NICE-TO-HAVE**: Solución 4 (Mejorar manejo de errores) - Mejora la experiencia de debugging

---

## Código de Ejemplo para Solución Completa

```javascript
// Función helper para normalizar pallets antes de comparar
const normalizePalletsForComparison = (pallets) => {
    if (!Array.isArray(pallets)) return [];
    
    return pallets
        .map(item => ({
            pallet: {
                id: item.pallet?.id || null,
                boxes: (item.pallet?.boxes || []).map(box => ({
                    id: box.id || null,
                    product: box.product?.id || null,
                    lot: box.lot || '',
                    grossWeight: box.grossWeight ? parseFloat(box.grossWeight).toString() : '',
                    netWeight: box.netWeight ? parseFloat(box.netWeight).toString() : '',
                    gs1128: box.gs1128 || undefined,
                })).sort((a, b) => (a.id || 0) - (b.id || 0)), // Ordenar cajas por ID
                numberOfBoxes: item.pallet?.numberOfBoxes || 0,
                netWeight: item.pallet?.netWeight || 0,
                observations: item.pallet?.observations || '',
            },
            prices: Object.fromEntries(
                Object.entries(item.prices || {}).sort(([a], [b]) => a.localeCompare(b))
            ),
            observations: item.observations || '',
        }))
        .sort((a, b) => (a.pallet.id || 0) - (b.pallet.id || 0)); // Ordenar pallets por ID
};

// En handleUpdate, después de guardar exitosamente:
if (creationMode === 'pallets') {
    // ... código existente para actualizar temporalPallets ...
    
    // Normalizar antes de guardar estado inicial
    const normalizedPallets = normalizePalletsForComparison(updatedTemporalPallets);
    setInitialPalletsState(JSON.stringify(normalizedPallets));
} else {
    // Modo 'lines': resetear formulario con datos del backend
    const formDataFromBackend = {
        supplier: updatedReception.supplier?.id?.toString() || data.supplier,
        date: updatedReception.date ? new Date(updatedReception.date) : data.date,
        notes: updatedReception.notes || data.notes || '',
        details: mapDetails(updatedReception.details),
        declaredTotalAmount: updatedReception.declaredTotalAmount !== null && updatedReception.declaredTotalAmount !== undefined 
            ? parseFloat(updatedReception.declaredTotalAmount).toString() 
            : '',
        declaredTotalNetWeight: updatedReception.declaredTotalNetWeight !== null && updatedReception.declaredTotalNetWeight !== undefined 
            ? parseFloat(updatedReception.declaredTotalNetWeight).toString() 
            : '',
    };
    reset(formDataFromBackend);
    const normalizedFormData = normalizeFormData(formDataFromBackend);
    setInitialFormState(JSON.stringify(normalizedFormData));
}

// En hasUnsavedChanges, normalizar antes de comparar:
if (creationMode === 'pallets') {
    const normalizedCurrent = normalizePalletsForComparison(temporalPallets);
    const normalizedInitial = initialPalletsState ? JSON.parse(initialPalletsState) : null;
    const normalizedInitialPallets = normalizedInitial ? normalizePalletsForComparison(normalizedInitial) : null;
    
    const palletsChanged = normalizedInitialPallets && 
        JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedInitialPallets);
    // ... resto del código ...
}
```

---

## Testing

Para verificar que las soluciones funcionan:

1. **Test 1**: Guardar recepción en modo 'lines' → Verificar que "cambios sin guardar" desaparece
2. **Test 2**: Guardar recepción en modo 'pallets' → Verificar que "cambios sin guardar" desaparece
3. **Test 3**: Guardar con valores que el backend modifica (redondeo) → Verificar que se actualiza correctamente
4. **Test 4**: Guardar y hacer cambios rápidamente → Verificar que no hay race conditions
5. **Test 5**: Guardar con campos opcionales (undefined, null, '') → Verificar que se manejan correctamente

