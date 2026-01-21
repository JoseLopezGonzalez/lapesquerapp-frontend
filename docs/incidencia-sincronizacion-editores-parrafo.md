# Incidencia: El Input Pequeño No Muestra Cambios del Input del Diálogo

## Problema

Cuando se modifica el contenido en el editor grande (dentro del diálogo), los cambios no se reflejan correctamente en el editor pequeño (fuera del diálogo). El editor pequeño no muestra los datos modificados o los muestra incompletos.

**Síntoma**: El editor grande se actualiza correctamente, pero el editor pequeño permanece con el contenido anterior después de editar en el diálogo.

## Implementación Actual

### Arquitectura de Sincronización

Ambos editores comparten la misma fuente de verdad: la prop `html` que contiene tokens (`{{field}}`).

```
Fuente de Verdad: html prop (tokens)
    ↓
Editor Pequeño ←→ Editor Grande
    ↓              ↓
onChange()      onChange()
```

### Flujo de Datos Esperado

```
Usuario edita en Editor Grande
    ↓
handleLargeEditorInput() ejecuta
    ↓
extractValueFromEditor() → convierte badges a tokens
    ↓
onChange(tokens) → actualiza prop html
    ↓
useEffect del Editor Pequeño detecta cambio en html
    ↓
renderContent() → procesa tokens a badges
    ↓
Editor Pequeño muestra contenido actualizado
```

## Código Relevante

### 1. Editor Pequeño - useEffect (Línea ~31)

```javascript
useEffect(() => {
  if (!editorRef.current) return
  
  const currentHtml = html || ''
  
  // En el montaje inicial, siempre renderizar el contenido
  if (isInitialMountRef.current) {
    isInitialMountRef.current = false
    lastHtmlRef.current = currentHtml
    renderContent()
    return
  }
  
  // Solo actualizar si el HTML cambió externamente y no estamos editando
  if (isUserEditingRef.current) return  // ⚠️ Verificación 1
  if (lastHtmlRef.current === currentHtml) return  // ⚠️ Verificación 2
  
  lastHtmlRef.current = currentHtml
  renderContent()
}, [html])
```

**Dependencias**: `[html]` - Se ejecuta cuando la prop `html` cambia.

### 2. Editor Pequeño - handleInput (Línea ~270)

```javascript
const handleInput = () => {
  isUserEditingRef.current = true
  processTextFields()
  const value = extractValue()
  lastHtmlRef.current = value  // ⚠️ Actualiza lastHtmlRef con tokens
  onChange(value)
  // Resetear el flag después de un breve delay para permitir actualizaciones externas
  setTimeout(() => {
    isUserEditingRef.current = false
  }, 100)
}
```

**Comportamiento**: 
- Establece `isUserEditingRef.current = true` (bloquea sincronización externa)
- Convierte badges a tokens con `extractValue()`
- Actualiza `lastHtmlRef.current` con los tokens
- Llama a `onChange(value)` con tokens
- Resetea el flag después de 100ms

### 3. Editor Grande - handleLargeEditorInput (Línea ~748)

```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  // Convertir a tokens y actualizar inmediatamente (igual que el editor pequeño)
  const value = extractValueFromEditor(largeEditorRef.current)
  lastLargeEditorHtmlRef.current = value  // ⚠️ Actualiza lastLargeEditorHtmlRef con tokens
  onChange(value)
  // Resetear el flag después de un breve delay para permitir actualizaciones externas
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}
```

**Comportamiento**:
- Establece `isLargeEditorEditingRef.current = true` (bloquea sincronización externa del editor grande)
- Convierte badges a tokens con `extractValueFromEditor()`
- Actualiza `lastLargeEditorHtmlRef.current` con los tokens
- Llama a `onChange(value)` con tokens
- Resetea el flag después de 100ms

### 4. Editor Grande - useEffect (Línea ~693)

```javascript
useEffect(() => {
  if (!isDialogOpen) return
  
  const currentHtml = html || ''
  
  // Esperar a que Radix termine de montar el portal y la animación
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Verificar que el ref esté disponible
      if (!largeEditorRef.current) {
        // Si aún no está disponible, reintentar después de un pequeño delay
        setTimeout(() => {
          if (largeEditorRef.current) {
            if (isLargeEditorInitialMountRef.current) {
              isLargeEditorInitialMountRef.current = false
              lastLargeEditorHtmlRef.current = currentHtml
              renderContentInLargeEditor()
            } else if (!isLargeEditorEditingRef.current && lastLargeEditorHtmlRef.current !== currentHtml) {
              lastLargeEditorHtmlRef.current = currentHtml
              renderContentInLargeEditor()
            }
          }
        }, 100)
        return
      }
      
      // En el montaje inicial del editor grande, siempre renderizar el contenido
      if (isLargeEditorInitialMountRef.current) {
        isLargeEditorInitialMountRef.current = false
        lastLargeEditorHtmlRef.current = currentHtml
        renderContentInLargeEditor()
        return
      }
      
      // Solo actualizar si el HTML cambió externamente y no estamos editando
      if (isLargeEditorEditingRef.current) return  // ⚠️ Verificación 1
      if (lastLargeEditorHtmlRef.current === currentHtml) return  // ⚠️ Verificación 2
      
      lastLargeEditorHtmlRef.current = currentHtml
      renderContentInLargeEditor()
    })
  })
}, [isDialogOpen, html, fieldOptions])
```

**Dependencias**: `[isDialogOpen, html, fieldOptions]` - Se ejecuta cuando el diálogo se abre o cuando `html` cambia.

## Problemas Identificados

### Problema 1: Timing del Flag `isUserEditingRef`

**Ubicación**: `useEffect` del editor pequeño, línea ~45

**Problema**:
Cuando el editor grande llama a `onChange()`:
1. `handleLargeEditorInput()` establece `isLargeEditorEditingRef.current = true`
2. Llama a `onChange(value)` inmediatamente
3. El `useEffect` del editor pequeño se ejecuta **inmediatamente** porque `html` cambió
4. Verifica `if (isUserEditingRef.current) return` - esto está bien, el editor pequeño no está editando
5. Pero el flag `isLargeEditorEditingRef` no afecta al editor pequeño

**Análisis**: Este no debería ser el problema porque `isUserEditingRef` es específico del editor pequeño y no se establece cuando el editor grande edita.

### Problema 2: Comparación de `lastHtmlRef.current`

**Ubicación**: `useEffect` del editor pequeño, línea ~46

**Problema Potencial**:
```javascript
if (lastHtmlRef.current === currentHtml) return
```

Cuando el editor grande llama a `onChange()`:
1. `handleLargeEditorInput()` establece `lastLargeEditorHtmlRef.current = value` (tokens)
2. Llama a `onChange(value)` que actualiza la prop `html` con tokens
3. El `useEffect` del editor pequeño se ejecuta
4. Compara `lastHtmlRef.current` (último valor conocido del editor pequeño) con `currentHtml` (nueva prop `html`)

**Escenario Problemático**:
- Si el editor pequeño nunca ha editado, `lastHtmlRef.current` podría estar vacío o tener un valor antiguo
- Si el editor pequeño editó anteriormente, `lastHtmlRef.current` tiene el último valor que el editor pequeño produjo
- Cuando el editor grande llama a `onChange()`, `currentHtml` tiene los tokens del editor grande
- Si `extractValue()` y `extractValueFromEditor()` producen tokens ligeramente diferentes (por ejemplo, orden de atributos, espacios, etc.), la comparación podría fallar

**Ejemplo**:
```javascript
// Editor pequeño produce:
lastHtmlRef.current = '<b>{{nombre}}</b>Texto'

// Editor grande produce:
currentHtml = '<b>{{nombre}}</b>Texto'  // Mismo contenido pero podría haber diferencias sutiles

// Si son iguales → no renderiza
// Si son diferentes → renderiza
```

### Problema 3: `extractValue()` vs `extractValueFromEditor()`

**Problema Potencial**: 
Ambas funciones deberían producir el mismo resultado cuando procesan el mismo contenido, pero podrían haber diferencias sutiles:

1. **Orden de atributos HTML**: `extractValue()` podría producir `<b style="color:red">{{field}}</b>` mientras `extractValueFromEditor()` produce `<b style="color: red">{{field}}</b>` (espacios diferentes)

2. **Normalización de HTML**: `DOMParser` podría normalizar el HTML de manera diferente

3. **Placeholders**: Ambas eliminan placeholders (`\u200B`), pero podrían hacerlo en momentos diferentes

**Evidencia**:
- `extractValue()` (línea ~148): Procesa badges del `editorRef.current`
- `extractValueFromEditor()` (línea ~868): Procesa badges del `largeEditorRef.current`
- Ambas usan la misma lógica, pero procesan diferentes elementos DOM

### Problema 4: Race Condition en el `setTimeout`

**Problema**:
```javascript
// En handleLargeEditorInput():
setTimeout(() => {
  isLargeEditorEditingRef.current = false
}, 100)

// El useEffect del editor pequeño se ejecuta INMEDIATAMENTE cuando html cambia
// Pero el flag se resetea después de 100ms
```

**Escenario**:
1. Editor grande llama a `onChange(value)` → `html` prop cambia inmediatamente
2. `useEffect` del editor pequeño se ejecuta inmediatamente
3. Verifica `if (isUserEditingRef.current) return` → false (editor pequeño no está editando)
4. Verifica `if (lastHtmlRef.current === currentHtml) return` → podría ser true o false
5. Si es false, renderiza
6. Después de 100ms, `isLargeEditorEditingRef.current = false` (pero esto no afecta al editor pequeño)

**Análisis**: Este no debería ser el problema porque `isLargeEditorEditingRef` solo afecta al `useEffect` del editor grande, no al del editor pequeño.

### Problema 5: `lastHtmlRef.current` No Se Actualiza Cuando el Editor Grande Edita

**Problema Crítico**:
Cuando el editor grande llama a `onChange()`:
- `lastLargeEditorHtmlRef.current` se actualiza (línea ~751)
- Pero `lastHtmlRef.current` **NO se actualiza**
- El `useEffect` del editor pequeño compara `lastHtmlRef.current` (valor antiguo) con `currentHtml` (nuevo valor)
- Si son diferentes, debería renderizar
- Pero si `lastHtmlRef.current` tiene un valor que hace que la comparación falle por alguna razón, no renderiza

**Ejemplo**:
```javascript
// Estado inicial:
lastHtmlRef.current = 'Texto {{nombre}}'
html prop = 'Texto {{nombre}}'

// Usuario edita en editor grande:
// handleLargeEditorInput() llama a onChange('Texto {{nombre}} más texto')
// html prop = 'Texto {{nombre}} más texto'

// useEffect del editor pequeño ejecuta:
currentHtml = 'Texto {{nombre}} más texto'
lastHtmlRef.current = 'Texto {{nombre}}'  // Valor antiguo
// Son diferentes → debería renderizar ✅

// Pero si hay algún problema con la comparación o el timing...
```

## Flujo de Ejecución Actual (Problema)

```
Usuario edita en Editor Grande
    ↓
onInput → handleLargeEditorInput()
    ↓
isLargeEditorEditingRef.current = true
processTextFieldsInLargeEditor()
extractValueFromEditor() → tokens
lastLargeEditorHtmlRef.current = tokens
onChange(tokens) → actualiza prop html
    ↓
React actualiza prop html
    ↓
useEffect del Editor Pequeño ejecuta (dependencia: [html])
    ↓
Verifica: isUserEditingRef.current === false ✅
Verifica: lastHtmlRef.current === currentHtml ❓
    ↓
Si son iguales → return (no renderiza) ❌
Si son diferentes → renderiza ✅
```

## Posibles Causas del Problema

### Causa 1: `lastHtmlRef.current` Tiene el Mismo Valor que la Nueva Prop `html`

**Escenario**:
- El editor pequeño editó anteriormente y produjo tokens `A`
- El editor grande edita y produce tokens `A` (mismo contenido)
- `lastHtmlRef.current = A` (del editor pequeño)
- `currentHtml = A` (del editor grande)
- Comparación: `A === A` → true → no renderiza

**Solución**: Esto es correcto si el contenido realmente no cambió. Pero si el contenido cambió visualmente pero los tokens son iguales, hay un problema en `extractValue()` o `extractValueFromEditor()`.

### Causa 2: Diferencias Sutiles en los Tokens Producidos

**Escenario**:
- `extractValue()` produce: `'<b>{{nombre}}</b>'`
- `extractValueFromEditor()` produce: `'<b>{{nombre}}</b>'` (parece igual pero podría tener diferencias)
- La comparación de strings podría fallar por espacios, orden de atributos, etc.

**Solución**: Normalizar los tokens antes de comparar, o usar una función de comparación más robusta.

### Causa 3: El `useEffect` No Se Ejecuta

**Escenario**:
- El `useEffect` tiene dependencia `[html]`
- Si `html` no cambia realmente (mismo valor de referencia), el efecto no se ejecuta
- Pero `onChange()` debería crear un nuevo valor...

**Solución**: Verificar que `onChange()` realmente actualiza la prop `html` en el componente padre.

### Causa 4: Timing - El `useEffect` Se Ejecuta Antes de que `html` Se Actualice

**Escenario**:
- `onChange()` se llama
- El `useEffect` se ejecuta inmediatamente
- Pero la prop `html` aún no se ha actualizado (race condition)

**Solución**: Esto es poco probable en React, pero podría ocurrir si hay múltiples actualizaciones de estado.

## Soluciones Propuestas

### Solución 1: Forzar Renderizado Cuando el Editor Grande Edita

**Cambio**:
```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  lastLargeEditorHtmlRef.current = value
  onChange(value)
  
  // Forzar actualización del editor pequeño
  // Establecer lastHtmlRef.current a un valor diferente para forzar renderizado
  if (editorRef.current) {
    lastHtmlRef.current = ''  // Forzar que sea diferente
  }
  
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}
```

**Problema**: Esto podría causar renderizados innecesarios.

### Solución 2: No Comparar `lastHtmlRef` en el `useEffect` del Editor Pequeño

**Cambio**:
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
  
  // Siempre renderizar si html cambió (sin comparar lastHtmlRef)
  lastHtmlRef.current = currentHtml
  renderContent()
}, [html])
```

**Problema**: Esto podría causar renderizados innecesarios cuando el editor pequeño edita.

### Solución 3: Usar una Comparación Más Robusta

**Cambio**:
```javascript
// Función para normalizar HTML antes de comparar
const normalizeHtml = (html) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '', 'text/html')
  return doc.body.innerHTML
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
  
  // Comparar HTML normalizado
  if (normalizeHtml(lastHtmlRef.current) === normalizeHtml(currentHtml)) return
  
  lastHtmlRef.current = currentHtml
  renderContent()
}, [html])
```

**Ventaja**: Maneja diferencias sutiles en el HTML.

### Solución 4: Actualizar `lastHtmlRef` Cuando el Editor Grande Edita

**Cambio**:
```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  lastLargeEditorHtmlRef.current = value
  
  // Actualizar también lastHtmlRef para que el editor pequeño detecte el cambio
  lastHtmlRef.current = value
  
  onChange(value)
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}
```

**Ventaja**: Asegura que `lastHtmlRef` siempre tenga el último valor conocido.

## Debugging Recomendado

### 1. Agregar Logs en Puntos Clave

```javascript
const handleLargeEditorInput = () => {
  console.log('🔵 handleLargeEditorInput - inicio')
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()
  const value = extractValueFromEditor(largeEditorRef.current)
  console.log('🔵 handleLargeEditorInput - value:', value)
  lastLargeEditorHtmlRef.current = value
  onChange(value)
  console.log('🔵 handleLargeEditorInput - onChange llamado')
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}

useEffect(() => {
  console.log('🟢 useEffect editor pequeño - html:', html)
  console.log('🟢 useEffect editor pequeño - lastHtmlRef:', lastHtmlRef.current)
  console.log('🟢 useEffect editor pequeño - isUserEditingRef:', isUserEditingRef.current)
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
    console.log('🟢 useEffect editor pequeño - no renderiza (son iguales)')
    return
  }
  
  console.log('🟢 useEffect editor pequeño - RENDERIZANDO')
  lastHtmlRef.current = currentHtml
  renderContent()
}, [html])
```

### 2. Verificar que `onChange` Realmente Actualiza la Prop

```javascript
// En el componente padre, agregar log:
<RichParagraphConfigPanel 
  html={html} 
  onChange={(value) => {
    console.log('🟡 Padre - onChange llamado con:', value)
    console.log('🟡 Padre - html actual:', html)
    console.log('🟡 Padre - son diferentes:', html !== value)
    setHtml(value)
  }} 
/>
```

### 3. Comparar Tokens Producidos

```javascript
// Agregar función de comparación:
const compareTokens = (a, b) => {
  const normalize = (str) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(str || '', 'text/html')
    return doc.body.innerHTML.trim().replace(/\s+/g, ' ')
  }
  return normalize(a) === normalize(b)
}

// Usar en useEffect:
if (compareTokens(lastHtmlRef.current, currentHtml)) {
  console.log('Tokens son iguales después de normalizar')
  return
}
```

## Conclusión

El problema más probable es que `lastHtmlRef.current` tiene el mismo valor que la nueva prop `html` cuando el editor grande edita, causando que el `useEffect` del editor pequeño retorne temprano sin renderizar.

**Solución recomendada**: Implementar Solución 4 (actualizar `lastHtmlRef` cuando el editor grande edita) combinada con logs de debugging para verificar el comportamiento real.

