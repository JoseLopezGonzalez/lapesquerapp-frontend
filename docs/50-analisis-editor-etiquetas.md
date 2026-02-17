# Análisis en Profundidad: Editor de Etiquetas (`/admin/label-editor`)

## Resumen Ejecutivo

Este documento analiza en profundidad el editor de etiquetas ubicado en `/admin/label-editor`, identificando errores, problemas, inconsistencias y mejoras necesarias en el código.

**Componentes Analizados**:

- `LabelEditor` (`src/components/Admin/LabelEditor/index.js`) - ~1100 líneas
- `useLabelEditor` (`src/hooks/useLabelEditor.js`) - ~560 líneas
- `QRConfigPanel`, `BarcodeConfigPanel`, `RichParagraphConfigPanel`
- `LabelSelectorSheet`
- `labelService.js`

---

## Problemas Identificados

### 🔴 CRÍTICO: Manejo de Estado Inconsistente en `handleSelectLabel`

**Ubicación**: `src/hooks/useLabelEditor.js` - Línea 456-467

**Problema**:

- La función `handleSelectLabel` recibe un objeto `label` pero accede a propiedades inconsistentes
- Se asigna `setSelectedLabel(format)` cuando debería ser el objeto completo
- Confusión entre `label.format` y `selectedLabel`

**Código Problemático**:

```javascript
const handleSelectLabel = (label) => {
    const labelId = label.id
    const labelName = label.name || "";
    const format = label.format  // ❌ Asume que label tiene .format
    setSelectedLabel(format);  // ❌ Guarda solo el format, no el label completo
    setCanvasWidth(format.canvas.width);
    setCanvasHeight(format.canvas.height);
    setCanvasRotation(format.canvas.rotation || 0);
    setElements(format.elements || []);
    setLabelName(labelName || "");
    setLabelId(labelId);
};
```

**Impacto**:

- `selectedLabel` contiene solo el formato, no el objeto completo
- Puede causar errores si otros lugares esperan el objeto completo
- Inconsistencia con `handleCreateNewLabel` que guarda un objeto completo

**Evidencia**:

- En `LabelEditor/index.js` línea 316 se verifica `!selectedLabel` pero luego se usa `selectedLabel` que es solo el formato
- En línea 460 se asigna `setSelectedLabel(format)` pero debería ser `setSelectedLabel(label)`

---

### 🔴 CRÍTICO: Bug en `handleSave` - Mensaje de Éxito Incorrecto

**Ubicación**: `src/hooks/useLabelEditor.js` - Línea 135-171

**Problema**:

- El mensaje de éxito siempre dice "actualizada" cuando `selectedLabel?.id` existe
- Pero `selectedLabel` puede ser solo el formato (no el objeto completo con `id`)
- El mensaje debería basarse en `labelId`, no en `selectedLabel?.id`

**Código Problemático**:

```javascript
const handleSave = async () => {
    // ...
    try {
        let result;
        if (labelId) {
            result = await updateLabel(labelId, labelName, labelFormat, token);
        } else {
            result = await createLabel(labelName, labelFormat, token);
            if (result?.data?.id) {
                setSelectedLabel(result.data);  // ❌ Guarda result.data, no el label completo
            }
        }

        toast.success(`Etiqueta ${selectedLabel?.id ? 'actualizada' : 'guardada'} correctamente.`);
        // ❌ Debería usar labelId, no selectedLabel?.id
        return result;
    }
}
```

**Impacto**:

- Mensajes de éxito incorrectos
- Confusión para el usuario sobre si se creó o actualizó

**Solución Sugerida**:

```javascript
toast.success(`Etiqueta ${labelId ? 'actualizada' : 'guardada'} correctamente.`);
```

---

### 🔴 CRÍTICO: Inicialización Duplicada con `useEffect`

**Ubicación**: `src/hooks/useLabelEditor.js` - Línea 482-484

**Problema**:

- `handleCreateNewLabel` se llama en un `useEffect` sin dependencias
- Esto ejecuta la función en cada render, aunque el comentario dice "Podemos inicializar valores al principio"
- Debería inicializarse directamente o con dependencias vacías `[]`

**Código Problemático**:

```javascript
/* Podemos inicializar valores al principio y no con un useEffect */
useEffect(() => {
    handleCreateNewLabel();
}, []);  // ❌ Falta el array de dependencias explícito, aunque funciona
```

**Impacto**:

- Ejecución innecesaria en cada render (aunque React lo optimiza)
- Confusión sobre cuándo se inicializa
- El comentario sugiere que debería hacerse de otra manera

**Mejora Sugerida**:

```javascript
// Inicializar directamente en el estado o usar useMemo
const [selectedLabel, setSelectedLabel] = useState(() => {
    return { id: null, name: "", canvas: { width: 110, height: 90, rotation: 0 } };
});
```

---

### 🟡 MEDIO: Duplicación de Código en Paneles de Configuración

**Ubicación**:

- `QRConfigPanel.jsx`
- `BarcodeConfigPanel.jsx`
- `RichParagraphConfigPanel.jsx`

**Problema**:

- Los tres componentes tienen código casi idéntico para:
  - Manejo de `contentEditable`
  - Inserción de campos con badges
  - Extracción de valores
  - Manejo de eventos de click para eliminar badges
- ~70% del código es duplicado

**Código Duplicado**:

```javascript
// Este patrón se repite en los 3 componentes:
const insertField = (field) => {
    if (!editorRef.current) return
    const label = fieldMapRef.current[field] || field
    const span = document.createElement('span')
    span.setAttribute('data-field', field)
    span.setAttribute('contenteditable', 'false')
    span.className = badgeClass
    // ... código idéntico ...
}

useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const handleClick = (e) => {
        const target = e.target
        if (target.closest && target.closest('[data-remove="true"]')) {
            const badge = target.closest('[data-field]')
            badge?.remove()
            onChange(extractValue())
        }
    }
    editor.addEventListener('click', handleClick)
    return () => editor.removeEventListener('click', handleClick)
}, [onChange])
```

**Impacto**:

- Mantenimiento difícil: cambios deben hacerse en 3 lugares
- Mayor probabilidad de bugs por inconsistencias
- Código más difícil de leer

**Solución Sugerida**:
Crear un hook personalizado `useFieldEditor` que encapsule esta lógica común.

---

### 🟡 MEDIO: Manejo de Errores Inconsistente en `labelService.js`

**Ubicación**: `src/services/labelService.js`

**Problema**:

- Todas las funciones tienen el mismo patrón de manejo de errores
- Se repite código para extraer `userMessage`
- El patrón `error.userMessage || error.data?.userMessage || ...` se repite 6 veces

**Código Repetitivo**:

```javascript
// Este patrón se repite en todas las funciones:
.then(response => {
    if (!response.ok) {
        return response.json().then(error => {
            const errorMessage = error.userMessage || error.data?.userMessage || 
                error.response?.data?.userMessage || error.message || 'Error...';
            throw new Error(errorMessage);
        });
    }
    return response.json();
})
```

**Impacto**:

- Código repetitivo y difícil de mantener
- Si cambia el patrón de errores, hay que actualizar 6 lugares

**Solución Sugerida**:
Crear una función helper `handleLabelServiceError` o usar un interceptor.

---

### 🟡 MEDIO: Validación de Códigos de Barras Incompleta (Por lo pronto mantendremos esto así, no validemos los codigos de barras, dejemos que siga siendo libres aunque pueden romper la propia logica del codigo de barras)

**Ubicación**: `src/components/Admin/LabelEditor/BarcodeConfigPanel.jsx` - Línea 136-149

**Problema**:

- La validación solo verifica EAN-13 y EAN-14
- Para GS1-128 siempre retorna `true` sin validar el formato
- No hay validación de estructura GS1-128 (debería tener AI entre paréntesis)

**Código Problemático**:

```javascript
const isValidBarcode = () => {
    if (!barcodeValue) return false

    if (type === 'ean13') return isValidEAN(barcodeValue, 12)
    if (type === 'ean14') return isValidEAN(barcodeValue, 13)
    return true // ❌ otros tipos como gs1-128 pueden variar - siempre true!
}
```

**Impacto**:

- Se pueden crear códigos de barras GS1-128 inválidos
- No hay feedback al usuario sobre formato incorrecto

**Solución Sugerida**:

```javascript
const isValidGS1128 = (val) => {
    // Validar formato GS1-128: (AI)value(AI)value...
    const pattern = /^\(\d{2,4}\)[^()]+(?:\(\d{2,4}\)[^()]+)*$/
    return pattern.test(val)
}

const isValidBarcode = () => {
    if (!barcodeValue) return false
    if (type === 'ean13') return isValidEAN(barcodeValue, 12)
    if (type === 'ean14') return isValidEAN(barcodeValue, 13)
    if (type === 'gs1-128') return isValidGS1128(barcodeValue)
    return true
}
```

---

### 🟡 MEDIO: Problema de Sincronización en `RichParagraphConfigPanel`

**Ubicación**: `src/components/Admin/LabelEditor/RichParagraphConfigPanel.jsx` - Línea 15-20

**Problema**:

- El `useEffect` que renderiza el contenido compara `extractValue()` con `html`
- `extractValue()` puede no estar sincronizado si el usuario edita directamente el HTML
- Puede causar pérdida de cambios si el usuario edita rápidamente

**Código Problemático**:

```javascript
useEffect(() => {
    if (!editorRef.current) return
    const current = extractValue()
    if (current === (html || '')) return  // ❌ Comparación puede fallar
    renderContent()
}, [html])
```

**Impacto**:

- Posible pérdida de cambios del usuario
- Comportamiento impredecible al editar

---

### 🟡 MEDIO: Falta de Validación en `handleImportJSON`

**Ubicación**: `src/hooks/useLabelEditor.js` - Línea 398-412

**Problema**:

- No valida la estructura del JSON importado
- No verifica que `elements` sea un array válido
- No valida que `canvas` tenga las propiedades necesarias
- El error solo se registra en consola, no se muestra al usuario

**Código Problemático**:

```javascript
const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            const name = importJSON(data);  // ❌ No valida estructura
            setLabelName(name);
        } catch (err) {
            console.error(err);  // ❌ Solo consola, no feedback al usuario
        }
    };
    reader.readAsText(file);
};
```

**Impacto**:

- Puede importar JSONs inválidos y romper el editor
- Usuario no sabe qué salió mal
- Puede causar errores en tiempo de ejecución

**Solución Sugerida**:

```javascript
const validateLabelJSON = (data) => {
    if (!data || typeof data !== 'object') {
        throw new Error('El archivo JSON no es válido');
    }
    if (!Array.isArray(data.elements)) {
        throw new Error('El formato de elementos no es válido');
    }
    if (!data.canvas || typeof data.canvas.width !== 'number') {
        throw new Error('El formato del canvas no es válido');
    }
    return true;
}

// En handleImportJSON:
try {
    const data = JSON.parse(ev.target.result);
    validateLabelJSON(data);
    const name = importJSON(data);
    setLabelName(name);
    toast.success('Etiqueta importada correctamente');
} catch (err) {
    toast.error(err.message || 'Error al importar la etiqueta');
    console.error(err);
}
```

---

### 🟡 MEDIO: Problema de Memoria en `LabelSelectorSheet`

**Ubicación**: `src/components/Admin/LabelEditor/LabelSelectorSheet.jsx` - Línea 237-255

**Problema**:

- El `useEffect` se ejecuta cada vez que cambia `open`, incluso si ya se cargaron los modelos
- No hay caché de los modelos cargados
- Se hace una petición cada vez que se abre el selector

**Código Problemático**:

```javascript
useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.accessToken) return;

    setLoading(true);
    // ... carga de modelos ...
}, [status, session, open]);  // ❌ Se ejecuta cada vez que open cambia
```

**Impacto**:

- Peticiones innecesarias a la API
- Peor rendimiento
- Posible parpadeo al abrir el selector

**Solución Sugerida**:

```javascript
const [models, setModels] = useState([]);
const [hasLoaded, setHasLoaded] = useState(false);

useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.accessToken) return;
    if (hasLoaded && !open) return; // No recargar si ya se cargó y está cerrado

    setLoading(true);
    // ... carga ...
    .finally(() => {
        setLoading(false);
        setHasLoaded(true);
    });
}, [status, session, open, hasLoaded]);
```

---

### 🟢 BAJO: Código Comentado en `LabelEditor`

**Ubicación**: `src/components/Admin/LabelEditor/index.js` - Línea 431-435, 1041-1061

**Problema**:

- Hay código comentado que debería eliminarse o documentarse
- Línea 431-435: `LabelRender` comentado
- Línea 1041-1061: Card de "Datos de Preview" comentado

**Impacto**:

- Confusión sobre qué código está activo
- Archivo más difícil de leer
- Posible código muerto

**Solución**:

- Eliminar código comentado o moverlo a un archivo de documentación
- Si es código futuro, crear un TODO con explicación

---

### 🟢 BAJO: Magic Numbers en `useLabelEditor (Dejemoslo para despues)`

**Ubicación**: `src/hooks/useLabelEditor.js` - Múltiples lugares

**Problema**:

- Valores mágicos sin explicación:
  - `pxToMm = px / 3.78` - ¿Por qué 3.78?
  - `Math.max(10 / 3.78, width)` - ¿Por qué 10 píxeles mínimo?
  - `width: 110, height: 90` en `handleCreateNewLabel` - ¿De dónde vienen estos valores?

**Código Problemático**:

```javascript
const pxToMm = (px) => px / 3.78;  // ❌ Magic number sin explicación

// En handleResizeMouseDown:
width = Math.max(10 / 3.78, width);  // ❌ ¿Por qué 10 píxeles?

// En handleCreateNewLabel:
const model = { id: null, name: "", canvas: { width: 110, height: 90, rotation: 0 } };
// ❌ ¿Por qué 110x90?
```

**Impacto**:

- Código difícil de mantener
- No está claro qué representan estos valores
- Difícil de ajustar si cambian los requisitos

**Solución Sugerida**:

```javascript
// Constantes de conversión
const PIXELS_PER_MM = 3.78; // Factor de conversión estándar para 96 DPI
const MIN_ELEMENT_SIZE_MM = 2.65; // Tamaño mínimo de elemento en mm
const DEFAULT_CANVAS_WIDTH_MM = 110; // Ancho por defecto en mm
const DEFAULT_CANVAS_HEIGHT_MM = 90; // Alto por defecto en mm

const pxToMm = (px) => px / PIXELS_PER_MM;
width = Math.max(MIN_ELEMENT_SIZE_MM, width);
```

---

### 🟢 BAJO: Falta de Validación de Nombre de Etiqueta

**Ubicación**: `src/hooks/useLabelEditor.js` - Línea 135-139

**Problema**:

- Solo valida que el nombre no esté vacío
- No valida longitud máxima
- No valida caracteres especiales
- No previene nombres duplicados

**Código Problemático**:

```javascript
const handleSave = async () => {
    if (!labelName) {
        toast.error("Por favor, introduce un nombre para la etiqueta.");
        return;
    }
    // ❌ No valida longitud, caracteres especiales, etc.
}
```

**Impacto**:

- Puede crear etiquetas con nombres muy largos
- Puede crear nombres con caracteres problemáticos
- No hay feedback preventivo

---

### 🟢 BAJO: Inconsistencia en Manejo de `textDecoration` vs `textTransform`

**Ubicación**: `src/components/Admin/LabelEditor/index.js` - Línea 1004-1005

**Problema**:

- Para "lowercase" y "capitalize" se usa `textDecoration` en lugar de `textTransform`
- Esto es incorrecto: `textDecoration` es para subrayado/tachado, `textTransform` para mayúsculas/minúsculas

**Código Problemático**:

```javascript
pressed={selectedElementData.textDecoration === "lowercase"}  // ❌ Debería ser textTransform
onPressedChange={() => updateElement(selectedElementData.id, { 
    textDecoration: selectedElementData.textDecoration === "lowercase" ? "none" : "lowercase" 
})}  // ❌ Debería actualizar textTransform
```

**Impacto**:

- Los botones de minúsculas y capitalizar no funcionan correctamente
- Confusión entre propiedades CSS

**Solución**:
Cambiar `textDecoration` por `textTransform` en las líneas 1004 y 1020.

---

## Mejoras Propuestas

### ✅ MEJORA 1: Refactorizar Paneles de Configuración

**Objetivo**: Eliminar duplicación de código creando un hook compartido.

**Implementación**:

```javascript
// hooks/useFieldEditor.js
export function useFieldEditor({ value, onChange, fieldOptions }) {
    const editorRef = useRef(null);
    const fieldMapRef = useRef({});
  
    useEffect(() => {
        fieldMapRef.current = Object.fromEntries(
            fieldOptions.map(o => [o.value, o.label])
        );
    }, [fieldOptions]);
  
    const insertField = (field) => {
        // Lógica compartida...
    };
  
    const extractValue = () => {
        // Lógica compartida...
    };
  
    // ... resto de lógica compartida
  
    return {
        editorRef,
        insertField,
        extractValue,
        // ...
    };
}
```

---

### ✅ MEJORA 2: Validación Robusta de Importación JSON

**Objetivo**: Validar estructura antes de importar.

**Implementación**: Ver solución en problema MEDIO #7.

---

### ✅ MEJORA 3: Caché de Modelos en `LabelSelectorSheet`

**Objetivo**: Evitar recargas innecesarias.

**Implementación**: Ver solución en problema MEDIO #8.

---

### ✅ MEJORA 4: Constantes para Valores Mágicos

**Objetivo**: Hacer el código más mantenible.

**Implementación**: Ver solución en problema BAJO #1.

---

### ✅ MEJORA 5: Validación de Nombre de Etiqueta

**Objetivo**: Prevenir nombres inválidos.

**Implementación**:

```javascript
const validateLabelName = (name) => {
    if (!name || name.trim().length === 0) {
        return "El nombre no puede estar vacío";
    }
    if (name.length > 100) {
        return "El nombre no puede exceder 100 caracteres";
    }
    if (!/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/.test(name)) {
        return "El nombre contiene caracteres no permitidos";
    }
    return null;
};

const handleSave = async () => {
    const validationError = validateLabelName(labelName);
    if (validationError) {
        toast.error(validationError);
        return;
    }
    // ... resto del código
};
```

---

## Plan de Refactorización

### Fase 1: Correcciones Críticas (Prioridad Alta)

1. ✅ Corregir `handleSelectLabel` para guardar objeto completo
2. ✅ Corregir mensaje de éxito en `handleSave`
3. ✅ Corregir bug de `textDecoration` vs `textTransform`
4. ✅ Mejorar inicialización en `useEffect`

### Fase 2: Mejoras de Código (Prioridad Media)

1. ✅ Refactorizar paneles de configuración con hook compartido
2. ✅ Agregar validación de importación JSON
3. ✅ Implementar caché en `LabelSelectorSheet`
4. ✅ Extraer constantes para valores mágicos

### Fase 3: Validaciones y UX (Prioridad Media-Baja)

1. ✅ Validar nombre de etiqueta
2. ✅ Validar códigos de barras GS1-128
3. ✅ Mejorar manejo de errores en servicios
4. ✅ Limpiar código comentado

---

## Métricas de Código

- **Líneas de código**: ~1100 (LabelEditor) + ~560 (useLabelEditor) = ~1660 líneas
- **Complejidad ciclomática**: Alta (múltiples condicionales anidados)
- **Duplicación**: ~30% (paneles de configuración)
- **Cobertura de tests**: Desconocida (no se encontraron tests)

---

## Conclusión

El editor de etiquetas es un componente complejo y funcional, pero tiene varios problemas que afectan la mantenibilidad y la experiencia del usuario. Las correcciones críticas deberían implementarse primero, seguidas de las mejoras de código y validaciones.

**Prioridad de Implementación**:

1. 🔴 **CRÍTICO**: Correcciones de bugs (handleSelectLabel, handleSave, textDecoration)
2. 🟡 **MEDIO**: Refactorización de código duplicado
3. 🟡 **MEDIO**: Validaciones y manejo de errores
4. 🟢 **BAJO**: Mejoras de código y limpieza
