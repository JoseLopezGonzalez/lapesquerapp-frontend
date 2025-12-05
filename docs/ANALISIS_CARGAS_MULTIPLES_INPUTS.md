# Análisis: Cargas Múltiples en ProductionInputsManager

## 🔍 Problema Identificado

El componente `ProductionInputsManager` está realizando **cargas múltiples** de inputs, causando:
- ⚠️ **Múltiples peticiones HTTP** innecesarias a la API
- ⚠️ **Re-renders innecesarios** del componente
- ⚠️ **Lentitud y lag** en la interfaz
- ⚠️ **Consumo innecesario de recursos**

---

## 🐛 Análisis del Problema

### Problema 1: Dependencias Circulares en `useEffect`

**Ubicación:** `ProductionInputsManager.jsx` líneas 88-106

**Código problemático:**
```javascript
// Primer useEffect: Inicializar con datos del contexto o props
useEffect(() => {
    const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    if (currentInputs && Array.isArray(currentInputs)) {
        setInputs(currentInputs)
        setLoading(false)
    }
}, [contextInputs, initialInputsProp])  // ⚠️ Depende de contextInputs

// Segundo useEffect: Cargar desde API si no hay datos
useEffect(() => {
    if (session?.user?.accessToken && productionRecordId) {
        const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
        if (!currentInputs || currentInputs.length === 0) {
            loadInputs()  // ⚠️ Puede disparar carga
        }
    }
}, [session?.user?.accessToken, productionRecordId, contextInputs])  // ⚠️ También depende de contextInputs
```

**Flujo problemático:**

```
1. Contexto se actualiza (por ejemplo, después de agregar inputs)
   ↓
2. recordData.record cambia en el contexto
   ↓
3. recordInputs (useMemo) se recalcula → Nueva referencia de array
   ↓
4. contextInputs cambia (nueva referencia)
   ↓
5. Primer useEffect se dispara (porque contextInputs cambió)
   ↓
6. Segundo useEffect también se dispara (porque contextInputs cambió)
   ↓
7. Segundo useEffect evalúa: "¿Hay datos?"
   - Si contextInputs tiene datos → No carga (bien)
   - Pero si hay algún delay o el array está vacío temporalmente → Carga innecesaria
   ↓
8. Si el contexto se actualiza de nuevo (por ejemplo, después de actualización optimista)
   ↓
9. Todo se repite → Cargas múltiples
```

### Problema 2: Referencias de Array Nuevas en Cada Render

**Ubicación:** `ProductionRecordContext.js` línea 45

**Código problemático:**
```javascript
const recordInputs = useMemo(() => {
    if (!recordData.record) return []
    return getRecordField(recordData.record, 'inputs') || []
}, [recordData.record])
```

**Problema:**
- `recordInputs` se recalcula cada vez que `recordData.record` cambia
- Incluso si los inputs son los mismos, puede devolver una **nueva referencia de array**
- Esto hace que `contextInputs` cambie de referencia, disparando los `useEffect`

### Problema 3: Falta de Comparación Profunda

**Ubicación:** `ProductionInputsManager.jsx` líneas 89-106

**Problema:**
- Los `useEffect` no comparan si los datos realmente cambiaron
- Solo verifican si la referencia del array cambió
- Pueden dispararse incluso si los inputs son idénticos

### Problema 4: Condición de Carrera

**Flujo problemático:**

```
1. Usuario agrega inputs
   ↓
2. handleAddInputs() se ejecuta:
   a. Crea inputs (POST)
   b. Recarga inputs (GET /production-inputs)
   c. setInputs(updatedInputs) → Actualiza estado local
   d. updateInputs(updatedInputs, false) → Actualiza contexto
   ↓
3. Contexto se actualiza:
   - recordData.record cambia
   - recordInputs se recalcula
   - contextInputs cambia (nueva referencia)
   ↓
4. useEffect se disparan:
   - Primer useEffect: setInputs(contextInputs) → Puede sobrescribir datos locales
   - Segundo useEffect: Evalúa si hay datos
   ↓
5. Si hay algún delay o los datos no están sincronizados:
   - Puede disparar loadInputs() innecesariamente
   - O puede sobrescribir datos actualizados con datos antiguos
```

### Problema 5: Estado Duplicado

**Problema:**
- El componente mantiene estado local (`inputs`)
- También consume del contexto (`contextInputs`)
- Hay dos fuentes de verdad que pueden estar desincronizadas

**Consecuencias:**
- Cuando el contexto se actualiza, puede sobrescribir el estado local
- Cuando el estado local se actualiza, necesita actualizar el contexto
- Esto puede causar loops de actualización

---

## 📊 Escenarios donde Ocurre el Problema

### Escenario 1: Carga Inicial

```
1. Componente se monta
   ↓
2. contextInputs = [] (contexto aún no tiene datos)
   ↓
3. Segundo useEffect se dispara → loadInputs() ✅ (correcto)
   ↓
4. Contexto carga el record completo
   ↓
5. recordInputs se recalcula → Nueva referencia de array
   ↓
6. contextInputs cambia → Primer y segundo useEffect se disparan
   ↓
7. Primer useEffect: setInputs(contextInputs) → Sobrescribe datos cargados
   ↓
8. Segundo useEffect: Evalúa si hay datos → Ya hay datos, no carga ✅
```

**Resultado:** Puede haber una sobrescritura innecesaria, pero no carga múltiple en este caso.

### Escenario 2: Después de Agregar Inputs

```
1. Usuario agrega inputs
   ↓
2. handleAddInputs():
   a. POST /production-inputs/multiple
   b. GET /production-inputs → updatedInputs
   c. setInputs(updatedInputs) → Estado local actualizado
   d. updateInputs(updatedInputs, false) → Contexto actualizado
   ↓
3. Contexto actualizado:
   - recordData.setRecord() actualiza el record
   - recordData.record cambia
   - recordInputs se recalcula → Nueva referencia
   ↓
4. contextInputs cambia (nueva referencia, pero mismo contenido)
   ↓
5. Primer useEffect se dispara:
   - setInputs(contextInputs) → Sobrescribe con mismos datos ✅ (no problemático)
   ↓
6. Segundo useEffect se dispara:
   - Evalúa: contextInputs.length > 0 → Sí
   - No carga ✅ (correcto)
```

**Resultado:** No debería haber carga múltiple, pero hay re-renders innecesarios.

### Escenario 3: Después de Actualización del Contexto (Problema Real)

```
1. Algún otro componente actualiza el contexto
   (por ejemplo, después de recargar el record completo)
   ↓
2. recordData.record cambia
   ↓
3. recordInputs se recalcula → Nueva referencia de array
   ↓
4. contextInputs cambia
   ↓
5. Primer useEffect se dispara → setInputs(contextInputs)
   ↓
6. Segundo useEffect se dispara:
   - Verifica: contextInputs.length > 0
   - Si contextInputs está temporalmente vacío o hay delay:
     → loadInputs() se dispara ⚠️ CARGA INNECESARIA
   ↓
7. loadInputs() hace GET /production-inputs
   ↓
8. setInputs(response.data) → Actualiza estado local
   ↓
9. Pero el contexto ya tenía esos datos → Estado duplicado
```

**Resultado:** ⚠️ **Carga múltiple innecesaria**

### Escenario 4: Condición de Carrera (Problema Real)

```
1. Usuario agrega inputs
   ↓
2. handleAddInputs() inicia:
   - POST /production-inputs/multiple
   ↓
3. Mientras tanto, el contexto se actualiza (por alguna razón)
   - contextInputs cambia
   ↓
4. useEffect se disparan:
   - Pueden disparar loadInputs() antes de que handleAddInputs() termine
   ↓
5. handleAddInputs() continúa:
   - GET /production-inputs
   - setInputs(updatedInputs)
   ↓
6. loadInputs() (del useEffect) termina después:
   - setInputs(response.data) → Puede sobrescribir datos más recientes
```

**Resultado:** ⚠️ **Carga múltiple y posible pérdida de datos**

---

## 🔧 Soluciones Propuestas

### Solución 1: Unificar los `useEffect` en Uno Solo

**Problema actual:** Dos `useEffect` con lógica similar y dependencias que pueden causar cargas múltiples.

**Solución:**
```javascript
useEffect(() => {
    // Determinar la fuente de datos prioritaria
    const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    
    if (currentInputs && Array.isArray(currentInputs) && currentInputs.length > 0) {
        // Tenemos datos del contexto o props
        setInputs(currentInputs)
        setLoading(false)
    } else if (session?.user?.accessToken && productionRecordId) {
        // No tenemos datos, cargar desde API
        loadInputs()
    }
}, [
    // Solo depender de valores primitivos o IDs, no de arrays completos
    session?.user?.accessToken,
    productionRecordId,
    // Comparar longitud en lugar de la referencia del array
    contextInputs.length,
    initialInputsProp.length
])
```

**Problema:** Aún puede haber problemas si `contextInputs.length` cambia.

### Solución 2: Usar `useRef` para Prevenir Cargas Múltiples

**Solución:**
```javascript
const isLoadingRef = useRef(false)

useEffect(() => {
    if (isLoadingRef.current) return // Ya está cargando, no hacer nada
    
    const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    
    if (currentInputs && Array.isArray(currentInputs) && currentInputs.length > 0) {
        setInputs(currentInputs)
        setLoading(false)
        return
    }
    
    if (session?.user?.accessToken && productionRecordId) {
        isLoadingRef.current = true
        loadInputs().finally(() => {
            isLoadingRef.current = false
        })
    }
}, [session?.user?.accessToken, productionRecordId, contextInputs.length, initialInputsProp.length])
```

### Solución 3: Eliminar Dependencia de `contextInputs` en el Segundo `useEffect`

**Solución:**
```javascript
// Primer useEffect: Solo sincronizar cuando cambian los datos
useEffect(() => {
    const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    if (currentInputs && Array.isArray(currentInputs) && currentInputs.length > 0) {
        setInputs(currentInputs)
        setLoading(false)
    }
}, [contextInputs, initialInputsProp])

// Segundo useEffect: Solo cargar inicialmente, no cuando cambia el contexto
useEffect(() => {
    if (session?.user?.accessToken && productionRecordId) {
        // Solo cargar si realmente no hay datos
        if (inputs.length === 0 && contextInputs.length === 0 && initialInputsProp.length === 0) {
            loadInputs()
        }
    }
}, [session?.user?.accessToken, productionRecordId]) // ⚠️ Sin contextInputs en dependencias
```

**Problema:** Puede no detectar cambios si los datos iniciales son vacíos.

### Solución 4: Usar Comparación Profunda con `useMemo`

**Solución:**
```javascript
// Crear una clave única basada en el contenido de los inputs
const inputsKey = useMemo(() => {
    const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    if (!currentInputs || currentInputs.length === 0) return null
    // Crear una clave única basada en los IDs de los inputs
    return currentInputs.map(input => input.id).join(',')
}, [contextInputs, initialInputsProp])

const previousInputsKeyRef = useRef(null)

useEffect(() => {
    const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    
    if (currentInputs && Array.isArray(currentInputs) && currentInputs.length > 0) {
        // Solo actualizar si realmente cambió el contenido
        if (inputsKey !== previousInputsKeyRef.current) {
            setInputs(currentInputs)
            setLoading(false)
            previousInputsKeyRef.current = inputsKey
        }
        return
    }
    
    // Solo cargar si realmente no hay datos y no estamos cargando
    if (session?.user?.accessToken && productionRecordId && !loading) {
        if (inputs.length === 0 && contextInputs.length === 0 && initialInputsProp.length === 0) {
            loadInputs()
        }
    }
}, [session?.user?.accessToken, productionRecordId, inputsKey, loading])
```

### Solución 5: Separar Lógica de Carga Inicial de Sincronización (Recomendada)

**Solución:**
```javascript
const hasInitializedRef = useRef(false)

// Efecto 1: Carga inicial (solo una vez)
useEffect(() => {
    if (hasInitializedRef.current) return
    if (!session?.user?.accessToken || !productionRecordId) return
    
    const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    
    if (currentInputs && Array.isArray(currentInputs) && currentInputs.length > 0) {
        setInputs(currentInputs)
        setLoading(false)
        hasInitializedRef.current = true
        return
    }
    
    // No hay datos iniciales, cargar desde API
    loadInputs().finally(() => {
        hasInitializedRef.current = true
    })
}, [session?.user?.accessToken, productionRecordId]) // Solo una vez

// Efecto 2: Sincronizar con contexto (solo cuando realmente cambian los datos)
const previousInputsIdsRef = useRef(null)

useEffect(() => {
    if (!hasInitializedRef.current) return // No sincronizar hasta que haya inicializado
    
    const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    
    if (!currentInputs || currentInputs.length === 0) return
    
    // Comparar IDs para ver si realmente cambiaron los datos
    const currentIds = currentInputs.map(input => input.id).sort().join(',')
    
    if (currentIds !== previousInputsIdsRef.current) {
        setInputs(currentInputs)
        previousInputsIdsRef.current = currentIds
    }
}, [contextInputs, initialInputsProp])
```

---

## ✅ Solución Recomendada: Combinación de Soluciones

Combinar:
1. **Solución 5**: Separar carga inicial de sincronización
2. **Comparación profunda**: Usar IDs en lugar de referencias de array
3. **Flag de inicialización**: Prevenir cargas múltiples durante la inicialización

---

## 📝 Próximos Pasos

1. Implementar la solución recomendada
2. Agregar logs para identificar cuándo ocurren las cargas múltiples
3. Monitorear en producción para confirmar que se resolvió
4. Aplicar la misma solución a `ProductionOutputsManager` y `ProductionOutputConsumptionsManager`

---

## ✅ Implementación de la Solución

### Cambios Realizados

1. ✅ **ProductionInputsManager.jsx** - Implementada solución recomendada
   - Separación de carga inicial y sincronización
   - Comparación profunda usando IDs
   - Flags para prevenir cargas múltiples

2. ✅ **ProductionOutputsManager.jsx** - Implementada solución recomendada
   - Misma lógica aplicada para outputs

3. ✅ **ProductionOutputConsumptionsManager.jsx** - Implementada solución recomendada
   - Lógica adaptada para manejar `hasParent`
   - Comparación profunda y prevención de cargas múltiples

### Características de la Implementación

- **useRef para flags**: `hasInitializedRef` previene múltiples inicializaciones
- **Comparación profunda**: Uso de `useMemo` para crear claves basadas en IDs
- **Sincronización selectiva**: Solo actualiza cuando realmente cambian los datos
- **Prevención de cargas múltiples**: Flags y comparaciones evitan llamadas redundantes

---

**Última actualización:** 2025-01-27  
**Estado:** ✅ **SOLUCIÓN IMPLEMENTADA** - Cargas múltiples prevenidas

