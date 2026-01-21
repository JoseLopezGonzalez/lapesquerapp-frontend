# Incidencia: Editor Grande del Diálogo no Muestra el Contenido

## Estado Actual del Problema

**Síntoma**: El editor grande del diálogo (`Dialog`) no muestra **ningún contenido** cuando se abre, incluso cuando el editor pequeño tiene texto, badges y contenido visible.

**Última actualización**: Después de implementar la solución de clonado directo HTML → HTML, el problema persiste. El input del editor grande aparece completamente vacío.

## Análisis del Código Actual (Post-Refactor)

### Implementación Actual

#### 1. `handleOpenDialog()` - Línea ~607

```javascript
const handleOpenDialog = () => {
  if (!editorRef.current) return
  
  // Una única fuente de verdad: el HTML final del editor pequeño
  const html = editorRef.current.innerHTML
  
  // Resetear flags del editor grande
  lastLargeEditorHtmlRef.current = html  // ⚠️ PROBLEMA 1
  isLargeEditorInitialMountRef.current = true
  isLargeEditorEditingRef.current = false
  
  // Establecer el contenido y abrir el diálogo
  setDialogHtml(html)
  setIsDialogOpen(true)
}
```

**Observación**: Establece `lastLargeEditorHtmlRef.current = html` **antes** de establecer `dialogHtml`. Esto puede causar que el `useEffect` detecte que el contenido ya es igual y no renderice.

#### 2. `useEffect` del Editor Grande - Línea ~629

```javascript
useEffect(() => {
  if (!isDialogOpen) return
  if (!largeEditorRef.current) return
  if (!dialogHtml) return
  
  // Esperar a que Radix termine de montar el portal y la animación
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!largeEditorRef.current) return
      
      // Solo actualizar si el contenido cambió externamente y no estamos editando
      if (isLargeEditorEditingRef.current) return
      if (lastLargeEditorHtmlRef.current === dialogHtml) return  // ⚠️ PROBLEMA 2
      
      // Clonar directamente el HTML sin transformaciones
      lastLargeEditorHtmlRef.current = dialogHtml
      largeEditorRef.current.innerHTML = dialogHtml
      
      // Resetear el flag de montaje inicial después del primer renderizado
      if (isLargeEditorInitialMountRef.current) {
        isLargeEditorInitialMountRef.current = false
      }
    })
  })
}, [isDialogOpen, dialogHtml])
```

**Problema Identificado**: 
- La condición `if (lastLargeEditorHtmlRef.current === dialogHtml) return` puede estar bloqueando el renderizado inicial porque `handleOpenDialog` ya estableció `lastLargeEditorHtmlRef.current = html` antes de establecer `dialogHtml`.

#### 3. Callback Ref `setLargeEditorRef` - Línea ~624

```javascript
const setLargeEditorRef = (element) => {
  largeEditorRef.current = element
}
```

**Problema Potencial**: 
- El callback ref se ejecuta cuando React asigna el ref, pero el elemento puede no estar visible aún debido a las animaciones del Dialog de Radix/ShadCN.
- No hay garantía de que el elemento esté completamente montado y visible cuando se ejecuta el `useEffect`.

#### 4. Estructura del Dialog - Línea ~995

```javascript
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col'>
    {/* ... */}
    <div
      ref={setLargeEditorRef}
      className='min-h-[400px] border border-input bg-background rounded-md p-4 focus:outline-none'
      style={{ fontSize: '16px', lineHeight: '2.2' }}
      contentEditable
      onInput={() => { /* ... */ }}
    />
  </DialogContent>
</Dialog>
```

## Problemas Identificados

### Problema 1: Race Condition en el Estado Inicial

**Ubicación**: `handleOpenDialog()` línea ~614

```javascript
lastLargeEditorHtmlRef.current = html  // Se establece ANTES
setDialogHtml(html)                     // Luego se establece el estado
```

**Consecuencia**: 
Cuando el `useEffect` se ejecuta:
1. `dialogHtml` = `html` (del estado)
2. `lastLargeEditorHtmlRef.current` = `html` (ya establecido)
3. La condición `if (lastLargeEditorHtmlRef.current === dialogHtml) return` es **verdadera**
4. El efecto retorna **sin renderizar**

**Solución Propuesta**: 
No establecer `lastLargeEditorHtmlRef.current` en `handleOpenDialog`. Dejarlo vacío o establecerlo solo después de renderizar.

### Problema 2: Timing del Callback Ref

**Problema**: 
El callback ref `setLargeEditorRef` se ejecuta cuando React asigna el ref, pero:
- El Dialog puede tener animaciones de entrada
- El portal puede no estar completamente montado
- El elemento puede existir pero no ser visible aún

**Evidencia**:
```javascript
useEffect(() => {
  if (!largeEditorRef.current) return  // Puede ser null aún
  // ...
}, [isDialogOpen, dialogHtml])
```

**Solución Propuesta**: 
Usar un `useEffect` separado que espere a que el ref esté disponible y el Dialog esté completamente abierto.

### Problema 3: Condición de Montaje Inicial

**Problema**: 
El flag `isLargeEditorInitialMountRef.current` se resetea **después** de renderizar, pero la condición que verifica si el contenido cambió puede ejecutarse antes.

**Flujo Actual**:
```
handleOpenDialog:
  lastLargeEditorHtmlRef.current = html
  isLargeEditorInitialMountRef.current = true
  setDialogHtml(html)

useEffect ejecuta:
  if (lastLargeEditorHtmlRef.current === dialogHtml) return  // TRUE → retorna sin renderizar
```

**Solución Propuesta**: 
En el montaje inicial, forzar el renderizado sin verificar si el contenido cambió.

### Problema 4: requestAnimationFrame Puede No Ser Suficiente

**Problema**: 
Dos `requestAnimationFrame` pueden no ser suficientes para esperar a que:
- El portal de Radix esté montado
- Las animaciones del Dialog terminen
- El elemento sea visible

**Solución Propuesta**: 
Usar un delay más largo o verificar explícitamente que el elemento esté visible.

## Flujo de Ejecución Actual (Problema)

```
Usuario hace clic en "Maximizar"
    ↓
handleOpenDialog() ejecuta:
  - html = editorRef.current.innerHTML
  - lastLargeEditorHtmlRef.current = html  ⚠️ Se establece ANTES
  - setDialogHtml(html)
  - setIsDialogOpen(true)
    ↓
React actualiza estado:
  - isDialogOpen = true
  - dialogHtml = html
    ↓
Dialog comienza a montarse (Radix portal)
    ↓
setLargeEditorRef() ejecuta (callback ref)
  - largeEditorRef.current = element
    ↓
useEffect ejecuta (dependencias: [isDialogOpen, dialogHtml])
  - Verifica: isDialogOpen === true ✅
  - Verifica: largeEditorRef.current existe ✅
  - Verifica: dialogHtml existe ✅
  - requestAnimationFrame doble...
    ↓
Dentro de requestAnimationFrame:
  - Verifica: isLargeEditorEditingRef.current === false ✅
  - Verifica: lastLargeEditorHtmlRef.current === dialogHtml ❌ TRUE
  - RETORNA SIN RENDERIZAR ⚠️
```

## Soluciones Propuestas

### Solución 1: No Establecer `lastLargeEditorHtmlRef` en `handleOpenDialog`

**Cambio**:
```javascript
const handleOpenDialog = () => {
  if (!editorRef.current) return
  
  const html = editorRef.current.innerHTML
  
  // NO establecer lastLargeEditorHtmlRef aquí
  // lastLargeEditorHtmlRef.current = html  // ❌ ELIMINAR
  
  isLargeEditorInitialMountRef.current = true
  isLargeEditorEditingRef.current = false
  
  setDialogHtml(html)
  setIsDialogOpen(true)
}
```

**Razón**: Permite que el `useEffect` detecte el cambio y renderice en el montaje inicial.

### Solución 2: Forzar Renderizado en Montaje Inicial

**Cambio**:
```javascript
useEffect(() => {
  if (!isDialogOpen) return
  if (!largeEditorRef.current) return
  if (!dialogHtml) return
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!largeEditorRef.current) return
      
      // En montaje inicial, SIEMPRE renderizar sin verificar igualdad
      if (isLargeEditorInitialMountRef.current) {
        isLargeEditorInitialMountRef.current = false
        lastLargeEditorHtmlRef.current = dialogHtml
        largeEditorRef.current.innerHTML = dialogHtml
        return
      }
      
      // Solo después del montaje inicial, verificar cambios
      if (isLargeEditorEditingRef.current) return
      if (lastLargeEditorHtmlRef.current === dialogHtml) return
      
      lastLargeEditorHtmlRef.current = dialogHtml
      largeEditorRef.current.innerHTML = dialogHtml
    })
  })
}, [isDialogOpen, dialogHtml])
```

**Razón**: Garantiza que el primer renderizado siempre ocurra, independientemente de si el contenido parece igual.

### Solución 3: Usar Delay Más Largo o Verificación Explícita

**Cambio**:
```javascript
useEffect(() => {
  if (!isDialogOpen) return
  
  // Esperar a que el ref esté disponible
  const checkAndRender = () => {
    if (!largeEditorRef.current) {
      // Si el ref aún no existe, reintentar
      setTimeout(checkAndRender, 50)
      return
    }
    
    if (!dialogHtml) return
    
    // Verificar que el elemento sea visible
    const rect = largeEditorRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      // Elemento aún no visible, reintentar
      setTimeout(checkAndRender, 50)
      return
    }
    
    // Renderizar
    if (isLargeEditorInitialMountRef.current) {
      isLargeEditorInitialMountRef.current = false
      lastLargeEditorHtmlRef.current = dialogHtml
      largeEditorRef.current.innerHTML = dialogHtml
      return
    }
    
    if (isLargeEditorEditingRef.current) return
    if (lastLargeEditorHtmlRef.current === dialogHtml) return
    
    lastLargeEditorHtmlRef.current = dialogHtml
    largeEditorRef.current.innerHTML = dialogHtml
  }
  
  // Iniciar verificación después de un pequeño delay
  setTimeout(checkAndRender, 100)
}, [isDialogOpen, dialogHtml])
```

**Razón**: Asegura que el elemento esté completamente montado y visible antes de renderizar.

### Solución 4: Usar `onOpenChange` con Callback Separado

**Cambio**:
```javascript
const handleDialogOpenChange = (open) => {
  setIsDialogOpen(open)
  
  if (open) {
    // Cuando se abre, asegurar que el contenido se renderice
    setTimeout(() => {
      if (largeEditorRef.current && dialogHtml) {
        // Forzar renderizado inicial
        isLargeEditorInitialMountRef.current = false
        lastLargeEditorHtmlRef.current = dialogHtml
        largeEditorRef.current.innerHTML = dialogHtml
      }
    }, 300) // Delay más largo para animaciones
  }
}

<Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
```

**Razón**: Usa el callback de apertura del Dialog para garantizar que el renderizado ocurra después de que el Dialog esté completamente abierto.

## Debugging Recomendado

### 1. Agregar Logs en Puntos Clave

```javascript
const handleOpenDialog = () => {
  if (!editorRef.current) return
  
  const html = editorRef.current.innerHTML
  console.log('🔵 handleOpenDialog - html:', html)
  console.log('🔵 handleOpenDialog - html length:', html.length)
  console.log('🔵 handleOpenDialog - tiene badges:', html.includes('data-field'))
  
  // ...
}

useEffect(() => {
  console.log('🟢 useEffect - isDialogOpen:', isDialogOpen)
  console.log('🟢 useEffect - dialogHtml:', dialogHtml)
  console.log('🟢 useEffect - dialogHtml length:', dialogHtml?.length)
  console.log('🟢 useEffect - largeEditorRef.current:', !!largeEditorRef.current)
  console.log('🟢 useEffect - isLargeEditorInitialMountRef:', isLargeEditorInitialMountRef.current)
  console.log('🟢 useEffect - lastLargeEditorHtmlRef:', lastLargeEditorHtmlRef.current)
  
  // ...
}, [isDialogOpen, dialogHtml])
```

### 2. Verificar en DevTools

1. Abrir DevTools → Console
2. Hacer clic en "Maximizar"
3. Verificar los logs
4. Inspeccionar `largeEditorRef.current.innerHTML` en la consola
5. Verificar si el elemento tiene contenido pero no es visible (CSS)

### 3. Verificar Timing

```javascript
const handleOpenDialog = () => {
  console.time('dialog-open')
  // ...
}

useEffect(() => {
  console.timeEnd('dialog-open')
  // ...
}, [isDialogOpen, dialogHtml])
```

## Conclusión

El problema principal parece ser una **condición de carrera en el estado inicial** donde:

1. `lastLargeEditorHtmlRef.current` se establece antes de que el `useEffect` pueda detectar el cambio
2. El `useEffect` retorna temprano porque detecta que el contenido "ya es igual"
3. El renderizado nunca ocurre

**Solución más probable**: Combinar Solución 1 + Solución 2:
- No establecer `lastLargeEditorHtmlRef` en `handleOpenDialog`
- Forzar renderizado en montaje inicial sin verificar igualdad
