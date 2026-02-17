# Implementación: Editor de Párrafo Rich Text con Diálogo

## Resumen

Este documento describe la implementación completa del componente `RichParagraphConfigPanel`, que proporciona dos editores `contentEditable` sincronizados para editar texto enriquecido con campos dinámicos (badges), estilos de formato (negrita, cursiva, subrayado, color) y un diálogo para edición en pantalla grande.

## Arquitectura General

### Componentes Principales

1. **Editor Pequeño** (`editorRef`): Editor principal siempre visible
2. **Editor Grande** (`largeEditorRef`): Editor dentro de un `Dialog` que se abre al hacer clic en maximizar

### Fuente de Verdad Única

Ambos editores comparten la misma fuente de verdad: la prop `html` que contiene tokens (`{{field}}`).

```
Fuente de Verdad: html prop (tokens {{field}})
    ↓
Editor Pequeño ←→ Editor Grande
    ↓              ↓
onChange()      onChange()
```

### Flujo de Datos

```
Usuario edita en cualquier editor
    ↓
handleInput() / handleLargeEditorInput()
    ↓
extractValue() / extractValueFromEditor() → convierte badges a tokens
    ↓
onChange(tokens) → actualiza prop html
    ↓
useEffect detecta cambio en html
    ↓
renderContent() / renderContentInLargeEditor() → procesa tokens a badges
    ↓
Ambos editores muestran contenido sincronizado
```

## Estado y Referencias

### Referencias Principales

```javascript
const editorRef = useRef(null)                    // Editor pequeño (DOM)
const largeEditorRef = useRef(null)               // Editor grande (DOM)
const fieldMapRef = useRef({})                    // Mapa de campos dinámicos
const selectedBadgeRef = useRef(null)             // Badge seleccionado para formato
const [isDialogOpen, setIsDialogOpen] = useState(false)  // Estado del diálogo
```

### Flags de Control de Edición

```javascript
const isUserEditingRef = useRef(false)            // Editor pequeño está editando
const isLargeEditorEditingRef = useRef(false)     // Editor grande está editando
const isExternalUpdateRef = useRef(false)         // Cambio viene del editor grande
```

### Referencias de Sincronización

```javascript
const lastHtmlRef = useRef('')                    // Último HTML conocido del editor pequeño
const lastLargeEditorHtmlRef = useRef('')         // Último HTML conocido del editor grande
const isInitialMountRef = useRef(true)            // Primer renderizado del editor pequeño
const isLargeEditorInitialMountRef = useRef(true) // Primer renderizado del editor grande
```

## Funciones Principales

### 1. `createBadge(field, label)`

Crea un elemento badge para representar un campo dinámico.

```javascript
const createBadge = (field, label) => {
  const span = document.createElement('span')
  span.setAttribute('data-field', field)
  span.setAttribute('contenteditable', 'false')
  span.className = badgeClass
  
  const lspan = document.createElement('span')
  lspan.textContent = label
  
  const removeSpan = document.createElement('span')
  removeSpan.setAttribute('data-remove', 'true')
  removeSpan.className = 'ml-1 cursor-pointer'
  removeSpan.textContent = '×'
  
  span.appendChild(lspan)
  span.appendChild(removeSpan)
  
  // Zero-width space para posicionar cursor después del badge
  const cursorPlaceholder = document.createTextNode('\u200B')
  return { badge: span, placeholder: cursorPlaceholder }
}
```

**Características**:
- Badge no editable (`contenteditable="false"`)
- Botón de eliminación (×)
- Placeholder invisible para posicionar cursor

### 2. `renderContent()`

Renderiza el contenido del editor pequeño procesando tokens a badges.

```javascript
const renderContent = () => {
  if (!editorRef.current) return
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '', 'text/html')

  const replaceTokens = (node, styleWrappers = []) => {
    // Procesa nodos de texto buscando tokens {{field}}
    // Convierte tokens a badges preservando estilos
    // Aplica wrappers de estilo (B, I, U, SPAN con style)
  }

  replaceTokens(doc.body)
  editorRef.current.innerHTML = doc.body.innerHTML
  
  // Asegurar placeholders después de cada badge
  // ...
}
```

**Proceso**:
1. Parsea `html` (tokens) con `DOMParser`
2. Recorre el DOM buscando tokens `{{field}}`
3. Convierte tokens a badges preservando estilos
4. Inserta placeholders después de cada badge
5. Actualiza `innerHTML` del editor

### 3. `renderContentInLargeEditor()`

Renderiza el contenido del editor grande usando la misma lógica que `renderContent()`.

**Implementación**: Idéntica a `renderContent()` pero opera sobre `largeEditorRef.current`.

### 4. `extractValue()`

Convierte badges del editor pequeño a tokens preservando estilos.

```javascript
const extractValue = () => {
  if (!editorRef.current) return ''
  const clone = editorRef.current.cloneNode(true)
  
  // Procesar badges preservando sus estilos
  clone.querySelectorAll('[data-field]').forEach(el => {
    const field = el.getAttribute('data-field')
    // Detectar wrappers de estilo (B, I, U, SPAN)
    // Crear token con estilos: <b>{{field}}</b>
    // Reemplazar badge y wrappers con token estilizado
  })
  
  // Eliminar placeholders (\u200B)
  // ...
  
  return clone.innerHTML  // Retorna tokens con estilos
}
```

**Proceso**:
1. Clona el DOM del editor
2. Encuentra todos los badges
3. Detecta wrappers de estilo alrededor de cada badge
4. Convierte badge + wrappers a token estilizado
5. Elimina placeholders
6. Retorna HTML con tokens

### 5. `extractValueFromEditor(editor)`

Convierte badges del editor grande a tokens. Misma lógica que `extractValue()` pero opera sobre el editor pasado como parámetro.

### 6. `processTextFields()`

Procesa texto en el editor pequeño convirtiendo tokens escritos a badges.

```javascript
const processTextFields = () => {
  if (!editorRef.current) return
  const walker = document.createTreeWalker(
    editorRef.current,
    NodeFilter.SHOW_TEXT,
    null
  )
  
  // Encuentra nodos de texto que no estén dentro de badges
  // Busca tokens {{field}} en el texto
  // Convierte tokens a badges
}
```

**Proceso**:
1. Recorre nodos de texto del editor
2. Ignora texto dentro de badges existentes
3. Busca tokens `{{field}}` en el texto
4. Convierte tokens encontrados a badges
5. Inserta placeholders después de cada badge

### 7. `processTextFieldsInLargeEditor()`

Procesa texto en el editor grande. Misma lógica que `processTextFields()` pero opera sobre `largeEditorRef.current`.

## Sincronización Entre Editores

### useEffect del Editor Pequeño

```javascript
useEffect(() => {
  if (!editorRef.current) return
  
  const currentHtml = html || ''
  
  // Montaje inicial
  if (isInitialMountRef.current) {
    isInitialMountRef.current = false
    lastHtmlRef.current = currentHtml
    editorRef.current.innerHTML = ''  // Reset completo
    renderContent()
    return
  }
  
  // No actualizar si el editor pequeño está editando
  if (isUserEditingRef.current) return
  
  // No actualizar si el contenido no cambió
  if (lastHtmlRef.current === currentHtml) return
  
  // Cambio detectado: decidir si renderizar
  // Si el cambio viene del editor grande, reset completo del DOM
  if (isExternalUpdateRef.current) {
    editorRef.current.innerHTML = ''  // RESET TOTAL
    isExternalUpdateRef.current = false
  }
  
  // Actualizar lastHtmlRef SOLO después de decidir renderizar
  lastHtmlRef.current = currentHtml
  renderContent()
}, [html])
```

**Lógica**:
- Se ejecuta cuando `html` prop cambia
- En montaje inicial: reset completo y renderizado
- Si el editor pequeño está editando: no actualiza (evita loops)
- Si el contenido no cambió: no actualiza (optimización)
- Si el cambio es externo: reset completo del DOM antes de renderizar
- Actualiza `lastHtmlRef` después de detectar cambio

### useEffect del Editor Grande

```javascript
useEffect(() => {
  if (!isDialogOpen) return
  
  const currentHtml = html || ''
  
  // Esperar a que Radix monte el portal
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!largeEditorRef.current) {
        // Reintentar si el ref aún no está disponible
        setTimeout(() => { /* ... */ }, 100)
        return
      }
      
      // Montaje inicial
      if (isLargeEditorInitialMountRef.current) {
        isLargeEditorInitialMountRef.current = false
        lastLargeEditorHtmlRef.current = currentHtml
        renderContentInLargeEditor()
        return
      }
      
      // No actualizar si el editor grande está editando
      if (isLargeEditorEditingRef.current) return
      
      // No actualizar si el contenido no cambió
      if (lastLargeEditorHtmlRef.current === currentHtml) return
      
      lastLargeEditorHtmlRef.current = currentHtml
      renderContentInLargeEditor()
    })
  })
}, [isDialogOpen, html, fieldOptions])
```

**Lógica**:
- Se ejecuta cuando el diálogo se abre o `html` cambia
- Usa `requestAnimationFrame` doble para esperar montaje de Radix
- Reintenta si el ref no está disponible
- Misma lógica de optimización que el editor pequeño

## Manejo de Input

### `handleInput()` - Editor Pequeño

```javascript
const handleInput = () => {
  isUserEditingRef.current = true
  processTextFields()  // Convierte tokens escritos a badges
  const value = extractValue()  // Convierte badges a tokens
  lastHtmlRef.current = value
  onChange(value)  // Actualiza prop html
  setTimeout(() => {
    isUserEditingRef.current = false
  }, 100)
}
```

**Proceso**:
1. Marca que el editor pequeño está editando
2. Procesa tokens escritos → badges
3. Convierte badges → tokens
4. Actualiza `lastHtmlRef`
5. Llama a `onChange()` para actualizar prop `html`
6. Resetea flag después de 100ms

### `handleLargeEditorInput()` - Editor Grande

```javascript
const handleLargeEditorInput = () => {
  if (!largeEditorRef.current) return
  isLargeEditorEditingRef.current = true
  processTextFieldsInLargeEditor()  // Convierte tokens escritos a badges
  const value = extractValueFromEditor(largeEditorRef.current)  // Convierte badges a tokens
  lastLargeEditorHtmlRef.current = value
  // NO actualizar lastHtmlRef aquí - el editor pequeño debe detectar el cambio
  // Si lo actualizamos aquí, el useEffect del editor pequeño detectará que ya están
  // sincronizados y no renderizará, quedándose con la versión anterior visualmente
  isExternalUpdateRef.current = true  // Marcar como cambio externo
  onChange(value)  // Actualiza prop html
  setTimeout(() => {
    isLargeEditorEditingRef.current = false
  }, 100)
}
```

**Proceso**:
1. Marca que el editor grande está editando
2. Procesa tokens escritos → badges
3. Convierte badges → tokens
4. Actualiza solo `lastLargeEditorHtmlRef` (NO `lastHtmlRef`)
5. Marca como cambio externo (`isExternalUpdateRef = true`)
6. Llama a `onChange()` para actualizar prop `html`
7. Resetea flag después de 100ms

**Importante**: NO se actualiza `lastHtmlRef` aquí porque causaría que el `useEffect` del editor pequeño detecte que ambos valores ya son iguales y no renderice. El `lastHtmlRef` se actualiza SOLO en el `useEffect` del editor pequeño después de decidir renderizar.

## Solución al Problema de Sincronización

### Problema Identificado

El problema NO era de sincronización de refs, sino de **reconciliación DOM**:

- `contentEditable` mantiene estado DOM propio que React no controla completamente
- Cuando el cambio viene del editor grande, el DOM del editor pequeño puede quedar en una versión anterior "válida"
- `renderContent()` no forzaba reconstrucción completa cuando el cambio era externo

### Solución Implementada

**Flag `isExternalUpdateRef`**:
- Se marca cuando el editor grande llama a `onChange()`
- Indica que el cambio viene de un editor externo

**Reset completo del DOM**:
```javascript
if (isExternalUpdateRef.current) {
  editorRef.current.innerHTML = ''  // RESET TOTAL
  isExternalUpdateRef.current = false
}
renderContent()  // Reconstrucción desde cero
```

**Por qué funciona**:
- El reset completo del `innerHTML` fuerza una reconstrucción desde cero
- Esto asegura que el DOM refleje exactamente el nuevo contenido
- Evita estados "fantasma" del DOM anterior

## Características Adicionales

### Formato de Texto

Ambos editores soportan:
- **Negrita** (`document.execCommand('bold')`)
- **Cursiva** (`document.execCommand('italic')`)
- **Subrayado** (`document.execCommand('underline')`)
- **Color** (`document.execCommand('foreColor', false, color)`)

### Formato de Badges

Los badges pueden tener estilos aplicados:
- Se envuelven en elementos `<b>`, `<i>`, `<u>`, `<span style="...">`
- Los estilos se preservan al convertir badges ↔ tokens

### Manejo de Cursor

- Placeholders (`\u200B`) después de cada badge permiten posicionar el cursor
- Manejo especial de Enter para insertar `<br>` correctamente
- Prevención de edición dentro de badges

### Eliminación de Badges

- Click en el botón × elimina el badge
- Backspace/Delete cuando un badge está seleccionado lo elimina

## Flujo Completo de Sincronización

```
Usuario edita en Editor Grande
    ↓
onInput → handleLargeEditorInput()
    ↓
processTextFieldsInLargeEditor() → convierte tokens escritos a badges
    ↓
extractValueFromEditor() → convierte badges a tokens
    ↓
lastLargeEditorHtmlRef.current = value
isExternalUpdateRef.current = true
// NO actualizar lastHtmlRef aquí
    ↓
onChange(value) → actualiza prop html
    ↓
React actualiza prop html
    ↓
useEffect Editor Pequeño ejecuta
    ↓
Compara: lastHtmlRef.current (antiguo) !== currentHtml (nuevo) → TRUE
    ↓
Detecta: isExternalUpdateRef.current === true
    ↓
editorRef.current.innerHTML = ''  // RESET TOTAL
    ↓
lastHtmlRef.current = currentHtml  // Actualizar después de decidir renderizar
    ↓
renderContent() → procesa tokens a badges
    ↓
Editor Pequeño muestra contenido actualizado ✅
```

## Consideraciones Técnicas

### Por qué Reset Completo del DOM

`contentEditable` mantiene estado DOM propio que puede quedar desincronizado. El reset completo asegura:
- Reconciliación correcta del DOM
- Eliminación de estados "fantasma"
- Consistencia entre ambos editores

### Por qué `requestAnimationFrame` Doble

El `Dialog` de Radix/ShadCN usa portales y animaciones. El doble `requestAnimationFrame` asegura:
- El portal está completamente montado
- Las animaciones han terminado
- El elemento está visible y accesible

### Por qué Flags de Edición

Los flags `isUserEditingRef` e `isLargeEditorEditingRef` previenen:
- Loops infinitos de renderizado
- Pérdida de selección del usuario
- Conflictos entre edición manual y sincronización

### Por qué `lastHtmlRef` NO se Actualiza en el Editor Grande

**Regla crítica**: `lastHtmlRef` solo debe actualizarse en el `useEffect` del editor pequeño después de decidir renderizar.

**Razón**:
- Si se actualiza en `handleLargeEditorInput()` antes de `onChange()`, cuando el `useEffect` se ejecute, ambos valores (`lastHtmlRef.current` y `currentHtml`) ya serán iguales
- Esto causa que la comparación `lastHtmlRef.current === currentHtml` sea verdadera
- El `useEffect` retorna sin renderizar, quedándose con la versión anterior visualmente

**Solución**:
- El editor grande NO toca `lastHtmlRef`
- El `useEffect` del editor pequeño detecta el cambio (valores diferentes)
- Decide renderizar y actualiza `lastHtmlRef` después

## Conclusión

Esta implementación proporciona dos editores `contentEditable` completamente sincronizados que:
- Comparten una única fuente de verdad (`html` prop)
- Se actualizan en tiempo real sin necesidad de guardar
- Manejan correctamente campos dinámicos, estilos y formato
- Resuelven problemas de reconciliación DOM con reset completo cuando es necesario
- Mantienen optimizaciones para evitar renderizados innecesarios

## Archivos Involucrados

Para compartir esta implementación con otro agente de IA o para debugging, estos son todos los archivos relacionados:

### Archivo Principal (Implementación Completa)

1. **`src/components/Admin/LabelEditor/RichParagraphConfigPanel.jsx`**
   - Componente principal con toda la lógica de los dos editores
   - Contiene: estado, refs, funciones de renderizado, sincronización, manejo de input
   - ~1149 líneas de código

### Archivo Padre (Uso del Componente)

2. **`src/components/Admin/LabelEditor/index.js`**
   - Componente padre que usa `RichParagraphConfigPanel`
   - Líneas relevantes: ~803-809
   - Pasa props: `html`, `onChange`, `fieldOptions`
   - Ejemplo de uso:
   ```javascript
   <RichParagraphConfigPanel
       key={selectedElementData.id}
       html={selectedElementData.html || ''}
       onChange={(val) => updateElement(selectedElementData.id, { html: val })}
       fieldOptions={allFieldOptions}
   />
   ```

### Componentes UI Dependientes (ShadCN)

3. **`src/components/ui/dialog.jsx`**
   - Componente Dialog usado para el editor grande
   - Importado: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`

4. **`src/components/ui/button.jsx`**
   - Componente Button usado para botones de formato
   - Importado: `Button`

5. **`src/components/ui/input.jsx`**
   - Componente Input usado para el selector de color
   - Importado: `Input`

6. **`src/components/ui/badge.jsx`**
   - Componente Badge usado para mostrar campos dinámicos
   - Importado: `Badge`, `badgeVariants`

### Iconos

7. **`lucide-react`** (paquete npm)
   - Icono `Maximize2` usado para el botón de maximizar

### Estructura de Archivos

```
/home/jose/brisapp-nextjs/
├── src/
│   └── components/
│       ├── Admin/
│       │   └── LabelEditor/
│       │       ├── RichParagraphConfigPanel.jsx  ← ARCHIVO PRINCIPAL
│       │       └── index.js                       ← ARCHIVO PADRE
│       └── ui/
│           ├── dialog.jsx                         ← Componente Dialog
│           ├── button.jsx                         ← Componente Button
│           ├── input.jsx                          ← Componente Input
│           └── badge.jsx                          ← Componente Badge
└── docs/
    └── implementacion-editor-parrafo-rich-text.md ← Esta documentación
```

### Para Compartir con Otro Agente de IA

**Archivos esenciales a copiar**:
1. `src/components/Admin/LabelEditor/RichParagraphConfigPanel.jsx` (completo)
2. `src/components/Admin/LabelEditor/index.js` (solo las líneas ~803-809 donde se usa el componente)
3. `src/components/ui/dialog.jsx` (completo, si el agente necesita ver la implementación del Dialog)
4. `src/components/ui/badge.jsx` (completo, si el agente necesita ver badgeVariants)

**Contexto adicional útil**:
- El componente recibe `html` como prop (string con tokens `{{field}}`)
- El componente llama a `onChange(value)` cuando el contenido cambia (también tokens)
- `fieldOptions` es un array de objetos con `{ value: string, label: string }`
- El componente maneja campos dinámicos que se representan como badges no editables
- Los badges pueden tener estilos aplicados (negrita, cursiva, subrayado, color)

