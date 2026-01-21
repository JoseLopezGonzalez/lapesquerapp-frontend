# Implementación de Botones Toggle en Label Editor

## Problema

Los botones de formato (bold, italic, underline, alineación, etc.) en el panel derecho del Label Editor no se muestran visualmente activados cuando el componente seleccionado tiene esas propiedades aplicadas.

## Problema Real Identificado

**El problema NO es Radix, NO es Tailwind, NO es pressed.**

👉 **El problema es que el estado de los elementos no es canónico ni normalizado.**

Se estaba intentando que la UI deduzca estado visual a partir de valores ambiguos:
- Un mismo concepto tiene múltiples representaciones (`"bold"`, `700`, `"700"`, `undefined`, `"normal"`)
- El toggle estaba actuando como intérprete del estado (fallback, compatibilidad legacy, parsing semántico)
- El estado no es explícito (`fontStyle: undefined` - ¿es normal? ¿no definido? ¿heredado? ¿legacy? ¿error?)

## Solución Implementada

**Regla de oro: La UI no interpreta estado. La UI solo refleja estado.**

Se implementó normalización del estado en un SOLO sitio antes de llegar a la UI:
- Cuando se crea el elemento (`addElement`)
- Cuando se carga de BD (`handleSelectLabel`)
- Cuando se importa JSON (`handleImportJSON`)
- Cuando se actualiza (`updateElement`)
- Cuando se selecciona (`selectedElementData`)

**El elemento SIEMPRE tiene valores explícitos y únicos:**
- `fontWeight: "normal" | "bold"` (nunca números, nunca undefined)
- `fontStyle: "normal" | "italic"` (nunca undefined)
- `textDecoration: "none" | "underline" | "line-through"` (nunca undefined)
- `horizontalAlign: "left" | "center" | "right" | "justify"` (nunca undefined)
- `verticalAlign: "start" | "end" | "center"` (nunca undefined)

**Los Toggle ahora solo comparan igualdad simple:**
- `pressed={selectedElementData.fontWeight === "bold"}` (sin ORs, sin includes, sin fallback)
- Si no puede hacer comparación simple, el problema no es el toggle

## Objetivo

Cuando un componente tiene propiedades como `fontWeight: "bold"`, `fontStyle: "italic"`, `textDecoration: "underline"`, `horizontalAlign: "center"`, etc., el botón correspondiente debería mostrarse visualmente activado (con fondo primary y texto primary-foreground).

## Componente Toggle (Radix UI)

### Ubicación
`src/components/ui/toggle.jsx`

### Definición del Componente

```jsx
const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2 text-xs",
        lg: "h-10 px-4",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Comportamiento Esperado

- Cuando `pressed={true}`, Radix UI aplica automáticamente el atributo `data-state="on"` al elemento DOM
- Las clases CSS `data-[state=on]:bg-primary data-[state=on]:text-primary-foreground` deberían aplicarse automáticamente
- El botón debería verse con fondo primary y texto primary-foreground

## Implementación Actual

### Ubicación
`src/components/Admin/LabelEditor/index.js`

### Estructura de Datos del Elemento

Los elementos se almacenan en el estado `elements` y tienen la siguiente estructura:

```javascript
{
  id: "element-1234567890",
  type: "text" | "field" | "manualField" | "richParagraph" | "qr" | "barcode" | "image",
  x: 50, // posición en mm
  y: 50, // posición en mm
  width: 20, // ancho en mm
  height: 10, // alto en mm
  fontSize: 2.5,
  fontWeight: "normal" | "bold" | 700 | "700",
  fontStyle: "normal" | "italic" | "oblique",
  textDecoration: "none" | "underline" | "line-through" | "underline line-through",
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize",
  horizontalAlign: "left" | "center" | "right" | "justify" | undefined,
  verticalAlign: "start" | "end" | "center" | undefined,
  textAlign: "left" | "center" | "right" | "justify", // legacy, se usa como fallback
  color: "#000000",
  // ... otras propiedades según el tipo
}
```

### Valores por Defecto (useLabelEditor.js)

Cuando se crea un nuevo elemento:

```javascript
const addElement = (type) => {
  const newElement = {
    // ...
    fontWeight: "normal",
    textAlign: "left",
    // fontStyle, textDecoration, textTransform, horizontalAlign, verticalAlign NO se establecen por defecto
    // (son undefined)
  };
  // ...
};
```

### Implementación de los Botones

#### 1. Bold (Negrita)

```jsx
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.fontWeight === "bold" || selectedElementData.fontWeight === 700 || selectedElementData.fontWeight === "700"}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { fontWeight: pressed ? "bold" : "normal" });
  }}
>
  <BoldIcon className="w-4 h-4" />
</Toggle>
```

**Lógica de comparación:**
- Se marca como activo si `fontWeight === "bold"` O `fontWeight === 700` O `fontWeight === "700"`
- Maneja tanto valores string como numéricos

#### 2. Italic (Cursiva)

```jsx
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.fontStyle === "italic" || selectedElementData.fontStyle === "oblique"}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { fontStyle: pressed ? "italic" : "normal" });
  }}
>
  <Italic className="w-4 h-4" />
</Toggle>
```

**Lógica de comparación:**
- Se marca como activo si `fontStyle === "italic"` O `fontStyle === "oblique"`

#### 3. Underline (Subrayado)

```jsx
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.textDecoration === "underline" || (selectedElementData.textDecoration && selectedElementData.textDecoration.includes("underline"))}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { textDecoration: pressed ? "underline" : "none" });
  }}
>
  <Underline className="w-4 h-4" />
</Toggle>
```

**Lógica de comparación:**
- Se marca como activo si `textDecoration === "underline"` O si `textDecoration` incluye la cadena "underline" (para manejar valores compuestos como "underline line-through")

#### 4. Strikethrough (Tachado)

```jsx
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.textDecoration === "line-through" || (selectedElementData.textDecoration && selectedElementData.textDecoration.includes("line-through"))}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { textDecoration: pressed ? "line-through" : "none" });
  }}
>
  <Strikethrough className="w-4 h-4" />
</Toggle>
```

**Lógica de comparación:**
- Similar a underline, maneja valores compuestos

#### 5. Alineación Horizontal

```jsx
{/* Left */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.horizontalAlign === "left" || (!selectedElementData.horizontalAlign && selectedElementData.textAlign === "left")}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { horizontalAlign: pressed ? "left" : undefined });
  }}
>
  <AlignLeft className="w-4 h-4" />
</Toggle>

{/* Center */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.horizontalAlign === "center" || (!selectedElementData.horizontalAlign && selectedElementData.textAlign === "center")}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { horizontalAlign: pressed ? "center" : undefined });
  }}
>
  <AlignCenter className="w-4 h-4" />
</Toggle>

{/* Right */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.horizontalAlign === "right" || (!selectedElementData.horizontalAlign && selectedElementData.textAlign === "right")}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { horizontalAlign: pressed ? "right" : undefined });
  }}
>
  <AlignRight className="w-4 h-4" />
</Toggle>

{/* Justify */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.horizontalAlign === "justify" || (!selectedElementData.horizontalAlign && selectedElementData.textAlign === "justify")}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { horizontalAlign: pressed ? "justify" : undefined });
  }}
>
  <AlignJustify className="w-4 h-4" />
</Toggle>
```

**Lógica de comparación:**
- Si `horizontalAlign` existe, se compara directamente
- Si `horizontalAlign` es `undefined`, se usa `textAlign` como fallback (para compatibilidad con elementos antiguos)

#### 6. Alineación Vertical

```jsx
{/* Start */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.verticalAlign === "start"}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { verticalAlign: pressed ? "start" : undefined });
  }}
>
  <AlignVerticalJustifyStart className="w-4 h-4" />
</Toggle>

{/* End */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.verticalAlign === "end"}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { verticalAlign: pressed ? "end" : undefined });
  }}
>
  <AlignVerticalJustifyEnd className="w-4 h-4" />
</Toggle>

{/* Center */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.verticalAlign === "center"}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { verticalAlign: pressed ? "center" : undefined });
  }}
>
  <AlignVerticalJustifyCenter className="w-4 h-4" />
</Toggle>
```

#### 7. Text Transform

```jsx
{/* Uppercase */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8 p-0"
  pressed={selectedElementData.textTransform === "uppercase"}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { textTransform: pressed ? "uppercase" : "none" });
  }}
>
  <CaseUpper className="w-5 h-5" />
</Toggle>

{/* Lowercase */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.textTransform === "lowercase"}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { textTransform: pressed ? "lowercase" : "none" });
  }}
>
  <CaseLower className="w-5 h-5" />
</Toggle>

{/* Capitalize */}
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={selectedElementData.textTransform === "capitalize"}
  onPressedChange={(pressed) => {
    updateElement(selectedElementData.id, { textTransform: pressed ? "capitalize" : "none" });
  }}
>
  <CaseSensitive className="w-5 h-5" />
</Toggle>
```

## Flujo de Datos

1. **Selección de Elemento:**
   - Usuario hace clic en un elemento en el canvas o en la lista
   - `handleSelectElementCard(elementId)` se ejecuta
   - `selectedElement` se actualiza con el `elementId`
   - `selectedElementData` se calcula como: `elements.find((el) => el.id === selectedElement)`

2. **Renderizado de Botones:**
   - Los botones Toggle se renderizan con `pressed={comparación}`
   - La comparación evalúa las propiedades del elemento seleccionado
   - Si la comparación es `true`, Radix UI debería aplicar `data-state="on"`

3. **Cambio de Estado:**
   - Usuario hace clic en un botón Toggle
   - `onPressedChange` se ejecuta con el nuevo estado (`true` o `false`)
   - `updateElement` actualiza el elemento en el estado
   - El componente se re-renderiza con los nuevos valores

## Posibles Problemas

### 1. Valores no Coinciden Exactamente

**Problema:** Los valores almacenados en la base de datos o en el estado pueden no coincidir exactamente con los valores que estamos comparando.

**Ejemplo:**
- Base de datos guarda `fontWeight: 700` (número)
- Comparación busca `"bold"` o `700` o `"700"`
- Pero si viene como string `"700"` desde la BD, debería funcionar

**Solución:** Verificar los valores reales con `console.log`:

```javascript
console.log('Element data:', {
  fontWeight: selectedElementData.fontWeight,
  fontStyle: selectedElementData.fontStyle,
  textDecoration: selectedElementData.textDecoration,
  horizontalAlign: selectedElementData.horizontalAlign,
  verticalAlign: selectedElementData.verticalAlign,
  textTransform: selectedElementData.textTransform,
});
```

### 2. El Componente Toggle No Recibe Correctamente la Prop `pressed`

**Problema:** La prop `pressed` puede no estar llegando correctamente al componente Toggle de Radix UI.

**Verificación en DevTools:**
1. Abrir DevTools del navegador
2. Seleccionar un elemento con `fontWeight: "bold"`
3. Inspeccionar el botón Bold
4. Verificar si tiene el atributo `data-state="on"`
5. Verificar si tiene las clases `bg-primary` y `text-primary-foreground`

**Si NO tiene `data-state="on"`:**
- El problema está en cómo se pasa la prop `pressed`
- Verificar que `selectedElementData` no sea `null` o `undefined`
- Verificar que la comparación esté retornando un booleano

**Si SÍ tiene `data-state="on"` pero NO tiene las clases:**
- Problema de especificidad CSS
- Las clases de `variant="outline"` pueden estar sobrescribiendo
- Verificar en DevTools qué clases están aplicadas

### 3. Problema de Especificidad CSS

**Problema:** Las clases de `variant="outline"` pueden tener mayor especificidad que `data-[state=on]:bg-primary`.

**Clases aplicadas con `variant="outline"`:**
```
border border-input bg-transparent hover:bg-accent hover:text-accent-foreground
```

**Clases que deberían aplicarse cuando `pressed={true}`:**
```
data-[state=on]:bg-primary data-[state=on]:text-primary-foreground
```

**Solución:** Verificar en DevTools si las clases `data-[state=on]` están siendo aplicadas pero sobrescritas por otras reglas CSS.

### 4. El Estado No Se Actualiza Correctamente

**Problema:** `updateElement` puede no estar actualizando correctamente el estado, o puede haber un problema de sincronización.

**Verificación:**
```javascript
// Agregar log en updateElement
const updateElement = (id, updates) => {
  console.log('Updating element:', id, updates);
  setElements((prev) => {
    const updated = prev.map((el) => {
      if (el.id === id) {
        const newEl = { ...el, ...updates };
        console.log('Updated element:', newEl);
        return newEl;
      }
      return el;
    });
    return updated;
  });
};
```

### 5. Problema con Valores `undefined`

**Problema:** Si una propiedad es `undefined`, las comparaciones pueden fallar de manera inesperada.

**Ejemplo:**
```javascript
// Si fontWeight es undefined
selectedElementData.fontWeight === "bold" // false
selectedElementData.fontWeight === 700 // false
selectedElementData.fontWeight === "700" // false
// Resultado: pressed={false} aunque debería ser true
```

**Solución:** Asegurarse de que los valores por defecto se establezcan correctamente cuando se crea o carga un elemento.

## Pasos para Depurar

### Paso 1: Verificar Valores Reales

Agregar logs temporales en el renderizado:

```jsx
{(() => {
  const isBold = selectedElementData.fontWeight === "bold" || selectedElementData.fontWeight === 700 || selectedElementData.fontWeight === "700";
  console.log('Bold check:', {
    fontWeight: selectedElementData.fontWeight,
    type: typeof selectedElementData.fontWeight,
    isBold,
    pressed: isBold
  });
  return (
    <Toggle
      variant="outline"
      size="sm"
      className="w-8"
      pressed={isBold}
      onPressedChange={(pressed) => {
        console.log('Bold toggle changed:', pressed);
        updateElement(selectedElementData.id, { fontWeight: pressed ? "bold" : "normal" });
      }}
    >
      <BoldIcon className="w-4 h-4" />
    </Toggle>
  );
})()}
```

### Paso 2: Verificar en DevTools

1. Abrir DevTools (F12)
2. Ir a la pestaña "Elements" o "Inspector"
3. Seleccionar un elemento con formato aplicado
4. Buscar el botón correspondiente en el DOM
5. Verificar:
   - ¿Tiene el atributo `data-state="on"`?
   - ¿Tiene las clases `bg-primary` y `text-primary-foreground`?
   - ¿Qué otras clases tiene aplicadas?

### Paso 3: Verificar Especificidad CSS

En DevTools, inspeccionar el botón y ver:
- ¿Qué reglas CSS están aplicadas?
- ¿Hay alguna regla que esté sobrescribiendo `data-[state=on]:bg-primary`?
- ¿Cuál es la especificidad de cada regla?

### Paso 4: Verificar el Estado de React

En DevTools, ir a la pestaña "React" (si está disponible):
1. Buscar el componente `LabelEditor`
2. Inspeccionar las props `selectedElementData`
3. Verificar los valores reales de las propiedades

## Soluciones Propuestas

### Solución 1: Normalizar Valores al Cargar

Si los valores vienen de la base de datos en formatos inconsistentes, normalizarlos al cargar:

```javascript
const normalizeElement = (element) => {
  return {
    ...element,
    fontWeight: element.fontWeight === 700 || element.fontWeight === "700" ? "bold" : (element.fontWeight || "normal"),
    fontStyle: element.fontStyle || "normal",
    textDecoration: element.textDecoration || "none",
    textTransform: element.textTransform || "none",
    horizontalAlign: element.horizontalAlign || element.textAlign || "left",
    verticalAlign: element.verticalAlign || "start",
  };
};
```

### Solución 2: Usar Comparaciones Más Robustas

Crear funciones helper para las comparaciones:

```javascript
const isBold = (fontWeight) => {
  if (!fontWeight) return false;
  return fontWeight === "bold" || fontWeight === 700 || fontWeight === "700";
};

const isItalic = (fontStyle) => {
  if (!fontStyle) return false;
  return fontStyle === "italic" || fontStyle === "oblique";
};

const hasUnderline = (textDecoration) => {
  if (!textDecoration) return false;
  return textDecoration === "underline" || textDecoration.includes("underline");
};
```

### Solución 3: Forzar Estilos con !important (No Recomendado)

Si hay problemas de especificidad CSS, se podría usar `!important`, pero no es la mejor solución:

```jsx
<Toggle
  variant="outline"
  size="sm"
  className="w-8 !bg-primary !text-primary-foreground"
  pressed={isBold}
  // ...
>
```

**Nota:** Esto no es recomendable porque rompe la consistencia del diseño.

### Solución 4: Usar Estilos Inline Condicionales

Como último recurso, usar estilos inline:

```jsx
<Toggle
  variant="outline"
  size="sm"
  className="w-8"
  pressed={isBold}
  style={isBold ? { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : {}}
  // ...
>
```

## Archivos Involucrados

1. **`src/components/ui/toggle.jsx`**
   - Componente base de Toggle
   - Define los estilos para `data-[state=on]`

2. **`src/components/Admin/LabelEditor/index.js`**
   - Implementación de los botones Toggle
   - Líneas aproximadas: 1122-1300

3. **`src/hooks/useLabelEditor.js`**
   - Hook que maneja el estado de los elementos
   - Función `updateElement` para actualizar propiedades
   - Función `addElement` que establece valores por defecto

## Solución Implementada: Normalización del Estado

### Función de Normalización

**Ubicación:** `src/hooks/useLabelEditor.js` (líneas 46-111)

La función `normalizeElement` asegura que todas las propiedades de formato tengan valores explícitos y canónicos:

```javascript
const normalizeElement = (element) => {
    if (!element) return element;
    
    // Normalizar fontWeight: "bold" | "normal" (nunca números ni undefined)
    let fontWeight = element.fontWeight;
    if (fontWeight === 700 || fontWeight === "700") {
        fontWeight = "bold";
    } else if (!fontWeight || fontWeight === "normal") {
        fontWeight = "normal";
    }
    
    // Normalizar fontStyle: "italic" | "normal" (nunca undefined)
    let fontStyle = element.fontStyle || "normal";
    if (fontStyle === "oblique") {
        fontStyle = "italic";
    }
    
    // Normalizar textDecoration: "none" | "underline" | "line-through" (nunca undefined)
    let textDecoration = element.textDecoration || "none";
    
    // Normalizar textTransform: "none" | "uppercase" | "lowercase" | "capitalize" (nunca undefined)
    let textTransform = element.textTransform || "none";
    
    // Normalizar horizontalAlign: convertir textAlign legacy a horizontalAlign si es necesario
    let horizontalAlign = element.horizontalAlign;
    if (!horizontalAlign && element.textAlign) {
        horizontalAlign = element.textAlign; // Migración legacy
    }
    if (!horizontalAlign || !["left", "center", "right", "justify"].includes(horizontalAlign)) {
        horizontalAlign = "left";
    }
    
    // Normalizar verticalAlign: "start" | "end" | "center" (nunca undefined)
    let verticalAlign = element.verticalAlign || "start";
    if (!["start", "end", "center"].includes(verticalAlign)) {
        verticalAlign = "start";
    }
    
    return {
        ...element,
        fontWeight,
        fontStyle,
        textDecoration,
        textTransform,
        horizontalAlign,
        verticalAlign,
        textAlign: horizontalAlign, // Sincronizar con horizontalAlign para compatibilidad
    };
};
```

### Puntos de Normalización

La función se ejecuta en:

1. **`addElement`**: Normaliza antes de agregar al estado
2. **`updateElement`**: Normaliza el elemento actualizado antes de guardarlo
3. **`handleSelectLabel`**: Normaliza todos los elementos al cargar desde BD usando `normalizeElements`
4. **`handleImportJSON`**: Normaliza todos los elementos al importar JSON usando `normalizeElements`
5. **`selectedElementData`**: Normaliza el elemento seleccionado antes de pasarlo a la UI

### Comparaciones Simplificadas

**Antes (Lógica Defensiva):**
```jsx
pressed={selectedElementData.fontWeight === "bold" || selectedElementData.fontWeight === 700 || selectedElementData.fontWeight === "700"}
```

**Después (Igualdad Simple):**
```jsx
pressed={selectedElementData.fontWeight === "bold"}
```

**Todos los botones ahora usan comparaciones simples:**
- Bold: `fontWeight === "bold"`
- Italic: `fontStyle === "italic"`
- Underline: `textDecoration === "underline"`
- Strikethrough: `textDecoration === "line-through"`
- Horizontal Align: `horizontalAlign === "left"` (sin fallback a textAlign)
- Vertical Align: `verticalAlign === "start"` (sin undefined)

## Conclusión

✅ **Solución Implementada:**

El estado ahora está normalizado en un solo lugar antes de llegar a la UI:
- Todos los valores son explícitos y canónicos
- Nunca hay `undefined`, números, o strings mixtos
- La UI solo refleja el estado, no lo interpreta
- Los Toggle hacen comparaciones simples de igualdad

**Resultado esperado:**
- Los botones Toggle deberían funcionar correctamente
- Cuando un elemento tiene `fontWeight: "bold"`, el botón Bold se muestra activado
- Cuando un elemento tiene `horizontalAlign: "center"`, el botón Center se muestra activado
- No hay lógica defensiva ni interpretación en la UI

**Si aún no funciona:**
1. Verificar que `normalizeElement` se está ejecutando en todos los puntos de entrada
2. Verificar en DevTools que los valores normalizados lleguen correctamente a la UI
3. Verificar que `data-state="on"` se aplica cuando `pressed={true}`
4. Agregar logs temporales para ver los valores antes y después de la normalización

