# Incidencia: El Input Pequeño No Se Actualiza con Cambios del Input Grande

## Estado Actual del Problema

**Síntoma**: 
- ✅ El contenido del editor pequeño **NO se pierde** (mantiene lo que tenía)
- ❌ El editor pequeño **NO se actualiza** cuando se edita en el editor grande
- El editor grande funciona correctamente y muestra los cambios
- Los cambios en el editor grande no se reflejan en el editor pequeño

**Última actualización**: Después de implementar la actualización de `lastHtmlRef.current` en `handleLargeEditorInput()`, el problema cambió: ahora el contenido no se pierde pero tampoco se actualiza.

## Análisis del Problema Actual

### Flujo de Ejecución Actual

```
Usuario edita en Editor Grande
    ↓
handleLargeEditorInput() ejecuta:
  - value = extractValueFromEditor() → tokens
  - lastLargeEditorHtmlRef.current = value
  - lastHtmlRef.current = value  ⚠️ Se actualiza ANTES de onChange
  - onChange(value) → actualiza prop html
    ↓
React actualiza prop html
    ↓
useEffect del Editor Pequeño ejecuta (dependencia: [html])
    ↓
Verifica: isUserEditingRef.current === false ✅
Verifica: lastHtmlRef.current === currentHtml ❌ PROBLEMA AQUÍ
    ↓
lastHtmlRef.current = value (ya tiene el nuevo valor)
currentHtml = html prop (también tiene el nuevo valor)
    ↓
Comparación: value === value → TRUE
    ↓
return (no renderiza) ❌
```

### Código Relevante

#### 1. handleLargeEditorInput() - Línea ~757

```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  lastLargeEditorHtmlRef.current = value
  lastHtmlRef.current = value  // ⚠️ PROBLEMA: Se actualiza ANTES de onChange
  onChange(value)
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}
```

**Problema identificado**: 
- `lastHtmlRef.current = value` se ejecuta **inmediatamente** antes de `onChange(value)`
- Cuando `onChange(value)` actualiza la prop `html`, React programa una actualización
- El `useEffect` del editor pequeño se ejecuta cuando `html` cambia
- Pero en ese momento, `lastHtmlRef.current` **ya tiene el nuevo valor** (se actualizó antes)
- Y `currentHtml` también tiene el nuevo valor (viene de la prop `html` actualizada)
- La comparación `lastHtmlRef.current === currentHtml` es **verdadera** → no renderiza

#### 2. useEffect del Editor Pequeño - Línea ~31

```javascript
useEffect(() => {
  if (!editorRef.current) return
  
  const currentHtml = html || ''
  
  if (isInitialMountRef.current) {
    isInitialMountRef.current = false
    lastHtmlRef.current = currentHtml
    renderContent()
    return
  }
  
  if (isUserEditingRef.current) return
  if (lastHtmlRef.current === currentHtml) return  // ⚠️ PROBLEMA: Comparación falla
  
  lastHtmlRef.current = currentHtml
  renderContent()
}, [html])
```

**Problema identificado**:
- La comparación `lastHtmlRef.current === currentHtml` está diseñada para evitar renderizados innecesarios
- Pero cuando el editor grande edita, `lastHtmlRef.current` ya se actualizó antes de que el `useEffect` se ejecute
- Entonces ambos tienen el mismo valor → no renderiza

## El Problema Real (En Una Frase)

**`lastHtmlRef.current` se actualiza ANTES de que React procese el cambio de la prop `html`, causando que el `useEffect` detecte que "ya están sincronizados" cuando en realidad el editor pequeño aún tiene el contenido antiguo.**

## Análisis Detallado

### Timing del Problema

```
Tiempo T0: Usuario edita en editor grande
Tiempo T1: handleLargeEditorInput() ejecuta
  - lastHtmlRef.current = value (nuevo valor) ✅
  - onChange(value) → programa actualización de React
Tiempo T2: React procesa onChange y actualiza prop html
Tiempo T3: useEffect del editor pequeño ejecuta
  - currentHtml = html prop (nuevo valor) ✅
  - Compara: lastHtmlRef.current (nuevo) === currentHtml (nuevo) → TRUE
  - return (no renderiza) ❌
Tiempo T4: El editor pequeño aún muestra contenido antiguo ❌
```

### Comparación con Editor Pequeño

**Cuando el editor pequeño edita**:
```javascript
handleInput():
  - lastHtmlRef.current = value  // Actualiza ref
  - onChange(value) → actualiza prop html
  - useEffect NO se ejecuta porque isUserEditingRef.current = true
  - Después de 100ms: isUserEditingRef.current = false
  - Si html cambió externamente después, useEffect se ejecutaría
  - Pero normalmente el contenido ya está renderizado porque handleInput() lo procesó
```

**Cuando el editor grande edita**:
```javascript
handleLargeEditorInput():
  - lastHtmlRef.current = value  // Actualiza ref ANTES de onChange
  - onChange(value) → actualiza prop html
  - useEffect SÍ se ejecuta (isUserEditingRef.current = false)
  - Compara: lastHtmlRef.current (nuevo) === currentHtml (nuevo) → TRUE
  - No renderiza ❌
```

## Soluciones Propuestas

### Solución 1: NO Actualizar `lastHtmlRef` en `handleLargeEditorInput`

**Cambio**:
```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  lastLargeEditorHtmlRef.current = value
  // NO actualizar lastHtmlRef aquí
  // lastHtmlRef.current = value  // ❌ ELIMINAR
  onChange(value)
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}
```

**Razón**: 
- Dejar que el `useEffect` del editor pequeño detecte el cambio
- Cuando el `useEffect` se ejecute, `lastHtmlRef.current` tendrá el valor antiguo
- Y `currentHtml` tendrá el valor nuevo
- La comparación será falsa → renderizará

**Problema potencial**: 
- Si el editor pequeño nunca ha editado, `lastHtmlRef.current` podría estar vacío o tener un valor muy antiguo
- Pero esto debería funcionar porque el `useEffect` siempre renderizará si son diferentes

### Solución 2: Actualizar `lastHtmlRef` DESPUÉS de `onChange`

**Cambio**:
```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  lastLargeEditorHtmlRef.current = value
  onChange(value)
  // Actualizar lastHtmlRef DESPUÉS de onChange, en el siguiente tick
  setTimeout(() => {
    lastHtmlRef.current = value
  }, 0)
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}
```

**Razón**: 
- `onChange(value)` actualiza la prop `html`
- El `useEffect` se ejecuta cuando `html` cambia
- En ese momento, `lastHtmlRef.current` aún tiene el valor antiguo
- La comparación será falsa → renderizará
- Después, `lastHtmlRef.current` se actualiza para mantener la coherencia

**Problema potencial**: 
- Race condition: si el `useEffect` se ejecuta después del `setTimeout`, `lastHtmlRef` ya estará actualizado

### Solución 3: Actualizar `lastHtmlRef` en el `useEffect` Después de Renderizar

**Cambio**:
```javascript
// NO cambiar handleLargeEditorInput, solo actualizar lastHtmlRef en useEffect
useEffect(() => {
  if (!editorRef.current) return
  
  const currentHtml = html || ''
  
  if (isInitialMountRef.current) {
    isInitialMountRef.current = false
    lastHtmlRef.current = currentHtml
    renderContent()
    return
  }
  
  if (isUserEditingRef.current) return
  
  // Comparar ANTES de actualizar lastHtmlRef
  const needsRender = lastHtmlRef.current !== currentHtml
  
  if (needsRender) {
    lastHtmlRef.current = currentHtml  // Actualizar DESPUÉS de comparar
    renderContent()
  }
}, [html])
```

**Razón**: 
- La comparación se hace antes de actualizar `lastHtmlRef`
- Si son diferentes, renderiza y actualiza `lastHtmlRef`
- Si son iguales, no hace nada

**Problema**: 
- Esto es lo que ya tenemos, pero el problema es que `lastHtmlRef` se actualiza antes en `handleLargeEditorInput`

### Solución 4: Usar un Flag para Distinguir el Origen del Cambio

**Cambio**:
```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  lastLargeEditorHtmlRef.current = value
  // NO actualizar lastHtmlRef aquí
  onChange(value)
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}

useEffect(() => {
  if (!editorRef.current) return
  
  const currentHtml = html || ''
  
  if (isInitialMountRef.current) {
    isInitialMountRef.current = false
    lastHtmlRef.current = currentHtml
    renderContent()
    return
  }
  
  if (isUserEditingRef.current) return
  
  // Si el editor grande está editando, siempre renderizar (no comparar)
  if (isLargeEditorEditingRef.current) {
    lastHtmlRef.current = currentHtml
    renderContent()
    return
  }
  
  if (lastHtmlRef.current === currentHtml) return
  
  lastHtmlRef.current = currentHtml
  renderContent()
}, [html])
```

**Razón**: 
- Cuando el editor grande está editando (`isLargeEditorEditingRef.current = true`), siempre renderizar
- No comparar `lastHtmlRef` porque sabemos que viene de un cambio externo

**Problema**: 
- El flag `isLargeEditorEditingRef` se resetea después de 100ms
- Si el `useEffect` se ejecuta después de esos 100ms, el flag ya será false

## Solución Recomendada

**Solución 1** es la más simple y correcta:
- NO actualizar `lastHtmlRef.current` en `handleLargeEditorInput()`
- Dejar que el `useEffect` del editor pequeño maneje la actualización
- El `useEffect` comparará el valor antiguo con el nuevo y renderizará si son diferentes

**Implementación**:
```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  lastLargeEditorHtmlRef.current = value
  // NO actualizar lastHtmlRef aquí - dejar que el useEffect lo maneje
  onChange(value)
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}
```

## Debugging Recomendado

### 1. Agregar Logs para Ver el Timing

```javascript
const handleLargeEditorInput = () => {
  console.log('🔵 handleLargeEditorInput - inicio')
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  console.log('🔵 handleLargeEditorInput - value:', value)
  console.log('🔵 handleLargeEditorInput - lastHtmlRef ANTES:', lastHtmlRef.current)
  lastLargeEditorHtmlRef.current = value
  // lastHtmlRef.current = value  // Comentar esta línea
  console.log('🔵 handleLargeEditorInput - llamando onChange')
  onChange(value)
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}

useEffect(() => {
  console.log('🟢 useEffect editor pequeño - html:', html)
  console.log('🟢 useEffect editor pequeño - lastHtmlRef:', lastHtmlRef.current)
  console.log('🟢 useEffect editor pequeño - son iguales:', lastHtmlRef.current === html)
  
  if (!editorRef.current) return
  
  const currentHtml = html || ''
  
  if (isInitialMountRef.current) {
    console.log('🟢 useEffect editor pequeño - montaje inicial')
    isInitialMountRef.current = false
    lastHtmlRef.current = currentHtml
    renderContent()
    return
  }
  
  if (isUserEditingRef.current) {
    console.log('🟢 useEffect editor pequeño - bloqueado por isUserEditingRef')
    return
  }
  
  if (lastHtmlRef.current === currentHtml) {
    console.log('🟢 useEffect editor pequeño - NO renderiza (son iguales)')
    return
  }
  
  console.log('🟢 useEffect editor pequeño - RENDERIZANDO')
  lastHtmlRef.current = currentHtml
  renderContent()
}, [html])
```

### 2. Verificar el Flujo

1. Editar en el editor grande
2. Ver los logs en la consola
3. Verificar:
   - ¿`lastHtmlRef` se actualiza antes o después de `onChange`?
   - ¿El `useEffect` se ejecuta?
   - ¿La comparación es verdadera o falsa?
   - ¿Se llama a `renderContent()`?

## Conclusión

El problema es un **timing issue**: `lastHtmlRef.current` se actualiza **antes** de que React procese el cambio de la prop `html`, causando que el `useEffect` detecte que ambos valores ya son iguales cuando en realidad el editor pequeño aún tiene el contenido antiguo.

**Solución**: NO actualizar `lastHtmlRef.current` en `handleLargeEditorInput()`. Dejar que el `useEffect` del editor pequeño detecte el cambio y actualice `lastHtmlRef` después de renderizar.

