# Incidencia: Contenido no se muestra en el Editor Grande del Diálogo

## 📋 Resumen del Problema

El editor grande dentro del diálogo no muestra el contenido completo del editor pequeño. Solo se muestra uno de los campos dinámicos (badges), pero no se muestra el resto de los badges ni el texto.

## 🎯 Comportamiento Esperado

Cuando el usuario hace clic en el botón de maximizar (icono `Maximize2`):

1. Se abre un diálogo con un editor más grande
2. El editor grande muestra **exactamente el mismo contenido** que el editor pequeño:
   - Todo el texto
   - Todos los badges (campos dinámicos)
   - Todos los estilos aplicados (bold, italic, underline, color)
   - La misma estructura y formato

## 🐛 Comportamiento Actual

- Solo se muestra **uno de los badges**
- **No se muestra el texto** alrededor de los badges
- **No se muestran los demás badges**
- El editor grande aparece prácticamente vacío excepto por un badge

## 🔍 Contexto Técnico

### Componente Afectado

- **Archivo**: `src/components/Admin/LabelEditor/RichParagraphConfigPanel.jsx`
- **Componente**: `RichParagraphConfigPanel`

### Flujo Actual

1. **Editor Pequeño** (`editorRef`):
   - Funciona correctamente
   - Muestra texto y badges correctamente
   - Usa `renderContent()` para renderizar contenido desde `html` prop
   - Usa `extractValue()` para convertir badges a tokens `{{field}}` con estilos

2. **Apertura del Diálogo**:

   ```javascript
   const handleOpenDialog = () => {
     const currentContent = editorRef.current ? extractValue() : html || '';
     setDialogHtml(currentContent);
     setTimeout(() => {
       setIsDialogOpen(true);
     }, 0);
   };
   ```

3. **Editor Grande** (`largeEditorRef`):
   - Debería mostrar el mismo contenido
   - Usa `renderContentInEditor()` que es **idéntica** a `renderContent()`

## 📝 Código Relevante

### Función `extractValue()` (Editor Pequeño)

```javascript
const extractValue = () => {
  if (!editorRef.current) return '';
  const clone = editorRef.current.cloneNode(true);

  // Procesar badges preservando sus estilos
  clone.querySelectorAll('[data-field]').forEach((el) => {
    const field = el.getAttribute('data-field');
    // ... procesa estilos y convierte a tokens {{field}}
  });

  // Eliminar placeholders
  // ...

  return clone.innerHTML; // Retorna HTML con tokens {{field}} y estilos
};
```

### Función `renderContent()` (Editor Pequeño - FUNCIONA)

```javascript
const renderContent = () => {
  if (!editorRef.current) return;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');

  const replaceTokens = (node, styleWrappers = []) => {
    // Procesa tokens {{field}} y los convierte a badges
    // Maneja estilos (bold, italic, underline, color)
  };

  replaceTokens(doc.body);
  editorRef.current.innerHTML = doc.body.innerHTML;

  // Asegurar placeholders después de badges
  // ...
};
```

### Función `renderContentInEditor()` (Editor Grande - NO FUNCIONA)

```javascript
const renderContentInEditor = (editor, contentHtml) => {
  if (!editor) return;

  // Usar exactamente la misma lógica que renderContent()
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentHtml || '', 'text/html');

  const replaceTokens = (node, styleWrappers = []) => {
    // Mismo código que renderContent()
  };

  replaceTokens(doc.body);
  editor.innerHTML = doc.body.innerHTML;

  // Asegurar placeholders después de badges
  // ...
};
```

**Nota**: Esta función es **idéntica** a `renderContent()` pero no funciona igual.

### Puntos de Renderizado Implementados

1. **useEffect**:

```javascript
useEffect(() => {
  if (isDialogOpen && largeEditorRef.current) {
    const contentToRender = dialogHtml || html || '';
    setTimeout(() => {
      if (largeEditorRef.current && contentToRender) {
        renderContentInEditor(largeEditorRef.current, contentToRender);
      }
    }, 150);
  }
}, [isDialogOpen, dialogHtml, html]);
```

2. **Callback del Dialog**:

```javascript
<Dialog open={isDialogOpen} onOpenChange={(open) => {
  setIsDialogOpen(open)
  if (open) {
    setTimeout(() => {
      if (largeEditorRef.current) {
        const currentContent = editorRef.current ? extractValue() : (html || '')
        renderContentInEditor(largeEditorRef.current, currentContent)
      }
    }, 200)
  }
}}>
```

3. **Callback Ref**:

```javascript
const setLargeEditorRef = (element) => {
  largeEditorRef.current = element;
};
```

## 🔬 Posibles Causas del Problema

### 1. **Timing Issues**

- El editor grande puede no estar completamente montado cuando se intenta renderizar
- El contenido puede no estar disponible cuando se ejecuta el renderizado
- Los múltiples `setTimeout` pueden estar causando condiciones de carrera

### 2. **Formato del HTML**

- `extractValue()` puede estar devolviendo un formato de HTML diferente al esperado
- El HTML puede tener estructura diferente cuando viene de `extractValue()` vs `html` prop
- Puede haber problemas con cómo se parsea el HTML en `DOMParser`

### 3. **Problemas con el DOM**

- El editor grande puede estar en un contexto DOM diferente (dentro del Dialog/Portal)
- Los eventos o referencias pueden no estar funcionando correctamente
- El `contentEditable` puede tener comportamientos diferentes en el diálogo

### 4. **Estado de React**

- `dialogHtml` puede no estar sincronizado correctamente
- Los re-renders pueden estar interfiriendo con el renderizado
- El estado puede estar desactualizado cuando se ejecuta el renderizado

### 5. **Problemas con la Función `replaceTokens`**

- Puede haber un problema con cómo se procesan los nodos en el contexto del editor grande
- Los `styleWrappers` pueden no estar funcionando correctamente
- Puede haber problemas con la recursión en el procesamiento

## 🧪 Pasos para Debuggear

### 1. Verificar el Contenido que se Pasa

Agregar logs temporales:

```javascript
const handleOpenDialog = () => {
  const currentContent = editorRef.current ? extractValue() : html || '';
  console.log('🔵 Contenido extraído:', currentContent);
  console.log('🔵 Longitud:', currentContent.length);
  console.log('🔵 Tiene tokens:', currentContent.includes('{{'));
  setDialogHtml(currentContent);
  setIsDialogOpen(true);
};
```

```javascript
const renderContentInEditor = (editor, contentHtml) => {
  console.log('🟢 renderContentInEditor llamado');
  console.log('🟢 Editor:', editor);
  console.log('🟢 ContentHTML:', contentHtml);
  console.log('🟢 ContentHTML length:', contentHtml?.length);

  if (!editor) {
    console.log('❌ Editor no disponible');
    return;
  }

  // ... resto del código
};
```

### 2. Verificar el HTML Parseado

```javascript
const renderContentInEditor = (editor, contentHtml) => {
  // ...
  const doc = parser.parseFromString(contentHtml || '', 'text/html');
  console.log('🟡 HTML parseado:', doc.body.innerHTML);
  console.log('🟡 Nodos hijos:', doc.body.childNodes.length);

  // Verificar cada nodo
  Array.from(doc.body.childNodes).forEach((node, index) => {
    console.log(
      `🟡 Nodo ${index}:`,
      node.nodeType,
      node.nodeName,
      node.textContent?.substring(0, 50)
    );
  });

  // ...
};
```

### 3. Verificar el Procesamiento de Tokens

```javascript
const replaceTokens = (node, styleWrappers = []) => {
  const children = Array.from(node.childNodes);
  console.log('🟠 replaceTokens - Nodo:', node.nodeName, 'Hijos:', children.length);

  children.forEach((child, index) => {
    if (child.nodeType === Node.TEXT_NODE) {
      console.log(`🟠 Texto ${index}:`, child.textContent?.substring(0, 50));
      const parts = child.textContent.split(/({{[^}]+}})/g);
      console.log(`🟠 Partes encontradas:`, parts.length, parts);
      // ...
    }
  });
};
```

### 4. Verificar el Resultado Final

```javascript
replaceTokens(doc.body);
const finalHTML = doc.body.innerHTML;
console.log('🟣 HTML final después de replaceTokens:', finalHTML);
console.log('🟣 Longitud:', finalHTML.length);

editor.innerHTML = finalHTML;
console.log('🟣 Editor.innerHTML después de asignar:', editor.innerHTML);
```

### 5. Comparar con el Editor Pequeño

Agregar logs en `renderContent()` para comparar:

```javascript
const renderContent = () => {
  console.log('🔴 renderContent - HTML:', html);
  // ... mismo código de logging que en renderContentInEditor
};
```

## 💡 Soluciones a Probar

### Solución 1: Usar el HTML Directamente del Editor Pequeño

En lugar de usar `extractValue()`, copiar directamente el `innerHTML`:

```javascript
const handleOpenDialog = () => {
  // Copiar directamente el HTML renderizado del editor pequeño
  const currentContent = editorRef.current ? editorRef.current.innerHTML : html || '';
  setDialogHtml(currentContent);
  setIsDialogOpen(true);
};
```

**Problema**: Esto copiaría los badges renderizados, no los tokens. Necesitaríamos procesarlos de nuevo.

### Solución 2: Reutilizar `renderContent()` Directamente

Modificar `renderContent()` para aceptar un editor como parámetro:

```javascript
const renderContent = (targetEditor = null, contentHtml = null) => {
  const editor = targetEditor || editorRef.current;
  const htmlContent = contentHtml || html;

  if (!editor) return;
  // ... resto del código igual
};

// En el diálogo:
useEffect(() => {
  if (isDialogOpen && largeEditorRef.current) {
    renderContent(largeEditorRef.current, dialogHtml || html);
  }
}, [isDialogOpen, dialogHtml]);
```

### Solución 3: Renderizar Después del Montaje Completo

Usar un estado para controlar cuándo renderizar:

```javascript
const [isLargeEditorReady, setIsLargeEditorReady] = useState(false);

const setLargeEditorRef = (element) => {
  largeEditorRef.current = element;
  if (element) {
    setIsLargeEditorReady(true);
  } else {
    setIsLargeEditorRef(false);
  }
};

useEffect(() => {
  if (isDialogOpen && isLargeEditorReady && largeEditorRef.current) {
    const contentToRender = dialogHtml || html || '';
    renderContentInEditor(largeEditorRef.current, contentToRender);
  }
}, [isDialogOpen, isLargeEditorReady, dialogHtml]);
```

### Solución 4: Forzar Re-renderizado

Agregar un key al editor grande para forzar re-montaje:

```javascript
<div
  key={isDialogOpen ? 'open' : 'closed'} // Forzar re-montaje
  ref={setLargeEditorRef}
  className="min-h-[400px] ..."
  contentEditable
  // ...
/>
```

## 📊 Información de Debugging Necesaria

Para identificar el problema, necesitamos saber:

1. **¿Qué contiene `currentContent` cuando se llama `handleOpenDialog()`?**
   - ¿Tiene todos los tokens `{{field}}`?
   - ¿Tiene el texto?
   - ¿Qué estructura HTML tiene?

2. **¿Qué contiene `contentHtml` cuando se llama `renderContentInEditor()`?**
   - ¿Es el mismo que `currentContent`?
   - ¿Está vacío o tiene contenido?

3. **¿Qué contiene `doc.body.innerHTML` después de parsear?**
   - ¿Se parseó correctamente?
   - ¿Tiene todos los nodos esperados?

4. **¿Qué contiene `doc.body.innerHTML` después de `replaceTokens()`?**
   - ¿Se procesaron todos los tokens?
   - ¿Se crearon todos los badges?

5. **¿Qué contiene `editor.innerHTML` después de asignar?**
   - ¿Se asignó correctamente?
   - ¿Por qué solo se muestra un badge?

## 🎯 Próximos Pasos Recomendados

1. **Agregar los logs de debugging** mencionados arriba
2. **Ejecutar y capturar la consola** cuando se abre el diálogo
3. **Comparar los valores** entre el editor pequeño (que funciona) y el grande (que no funciona)
4. **Identificar en qué punto** se pierde el contenido
5. **Aplicar la solución** basada en los hallazgos

## 📌 Notas Adicionales

- El editor pequeño funciona perfectamente usando `renderContent()`
- La función `renderContentInEditor()` es idéntica a `renderContent()`
- El problema parece estar en el **timing** o en cómo se **pasa el contenido**
- Múltiples puntos de renderizado fueron implementados pero ninguno funciona completamente
- El contenido se muestra parcialmente (solo un badge), lo que sugiere que el renderizado **sí se ejecuta** pero **no procesa todo el contenido**

---

**Fecha de creación**: $(date)
**Estado**: 🔴 Abierto - Investigando
**Prioridad**: Alta
**Componente**: `RichParagraphConfigPanel`
