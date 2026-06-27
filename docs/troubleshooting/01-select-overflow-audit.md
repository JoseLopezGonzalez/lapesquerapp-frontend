# Auditoría: Bug de overflow en SelectTrigger con texto largo

**Fecha:** 2026-06-26  
**Estado:** SIN RESOLVER — pendiente de aplicar la solución confirmada  
**Componente afectado:** `src/components/ui/select.jsx`  
**Commit que introdujo la regresión:** `d2f37924`

---

## 1. Descripción del problema

En formularios con layout `grid-cols-2`, el `SelectTrigger` que contiene un valor de texto largo (ej. "Transferencia bancaria, liquidación mensual vencido a mediados del mes siguiente" en el campo *Forma de pago* de `OrderEditSheet`) **sobrepasa el ancho de su columna** y se superpone visualmente sobre la columna adyacente.

El mismo bug se reproduce en:
- `OrderEditSheet` — campo *Forma de pago* e *Incoterm*
- `CreateOrderForm` — mismos campos
- `MassiveExportDialog` — selector de tipo de documento

---

## 2. Estado previo al bug (commit `bd74d172`)

El `SelectTrigger` en `OrderEditSheet` usaba un wrapper `<div>` entre el trigger y el `<SelectValue>`:

```jsx
<SelectTrigger className="w-full overflow-hidden" loading={loading}>
  <div className="min-w-0 flex-1 truncate text-start">
    <SelectValue
      placeholder={field.props?.placeholder}
      loading={loading}
      value={value}
      options={field.options}
    />
  </div>
</SelectTrigger>
```

**Por qué funcionaba:**

1. El `<div>` es un elemento block dentro de un contenedor flex (el trigger).
2. Como flex item, el div se blockifica → forma un bloque de formato propio.
3. `truncate` = `overflow: hidden + text-overflow: ellipsis + white-space: nowrap` aplicado a un bloque funciona sobre los inline boxes que genera el texto en su interior.
4. `flex-1` hace que el div ocupe todo el espacio disponible del trigger.
5. `min-w-0` evita que el flex item crezca por encima del contenedor.
6. El texto de Radix (`SelectValue`) se portala como **nodo de texto** dentro del `<span>` del primitivo, que a su vez queda como contenido inline del `<div>` — y el truncado funciona sobre ese inline content.

---

## 3. El commit que rompió todo

**`d2f37924` — "streamline SelectTrigger styling"**

El cambio eliminó el wrapper `<div>`:

```diff
-  <SelectTrigger className="w-full overflow-hidden" loading={loading}>
-    <div className="min-w-0 flex-1 truncate text-start">
-      <SelectValue ... />
-    </div>
+  <SelectTrigger className="w-full" loading={loading}>
+    <SelectValue ... />
```

Sin el wrapper, el `<span>` de Radix (el elemento real del DOM del `SelectValue`) queda directamente como hijo del trigger. El intento de la sesión fue mover el truncado al componente `SelectValue` o al trigger mediante selectores CSS — ambos fallaron por razones que se explican abajo.

---

## 4. Raíces técnicas del problema

### 4.1 Radix `SelectPrimitive.Value` descarta el prop `className`

Confirmado leyendo `node_modules/@radix-ui/react-select/dist/index.js`:

```js
const { __scopeSelect, className, style, children, placeholder = "", ...valueProps } = props;
return jsx(Primitive.span, { ...valueProps, style: { pointerEvents: "none" }, children: ... });
```

`className` se **extrae** del destructuring pero **no se pasa** a `...valueProps`. El span del DOM nunca recibe ninguna clase de Tailwind que pongamos en `SelectValue`.

### 4.2 El texto se porta como nodo de texto, no como span

Radix `SelectItemText` usa `ReactDOM.createPortal(itemTextProps.children, context.valueNode)` para inyectar el texto de la opción seleccionada **directamente** en el nodo del span (como texto plano), sin envoltura adicional. Por tanto:

- `[&>span]:truncate` → no matchea: no hay ningún `<span>` hijo.
- `[&>span]:overflow-hidden` → igual, nulo.

### 4.3 `*:data-[slot=select-value]:` no produce CSS efectivo en este setup

El usuario confirmó inspeccionando el HTML renderizado que el `<span data-slot="select-value">` **no tenía ningún estilo computado** de los selectores `*:data-[slot=select-value]:flex`, `*:data-[slot=select-value]:min-w-0`, etc. definidos en el className del trigger.

La variante compound `*:data-[slot=...]` de Tailwind 4 debería generar `> *[data-slot="select-value"] { ... }`, pero en la práctica no está llegando al span — posiblemente por:

- Conflicto con el estilo inline `pointer-events: none` que Radix pone en ese span.
- Un bug o límite de la generación de variantes en Tailwind 4.2.1.
- El span no siendo un child directo del trigger button (posible wrapping interno de Radix).

### 4.4 `white-space: nowrap` en el trigger interfiere

El trigger tiene `whitespace-nowrap` en su className base. Esto previene el salto de línea del texto del SelectValue, pero **no trunca** — sin `overflow: hidden + text-overflow: ellipsis` en el contenedor apropiado, el texto simplemente desborda.

### 4.5 CSS Grid `min-width: auto`

Los items de un grid con `1fr` tienen `min-width: auto` por defecto, lo que les permite crecer hasta su `min-content` size. Sin `min-w-0` en los items del grid, incluso si el SelectTrigger tuviera `w-full`, el item grid podría expandirse empujando las columnas adyacentes.

---

## 5. Todos los intentos fallidos

### Intento 1 — `w-fit` → `w-full` + selectores CSS en el trigger

```jsx
// SelectTrigger con clases extra:
*:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate
```

**Resultado:** Fallido. El HTML renderizado confirmó que el `<span data-slot="select-value">` no tenía ningún estilo computado de estos selectores. Los estilos no llegaron al span.

---

### Intento 2 — `className` directo en `SelectValue`

```jsx
<SelectValue className="truncate flex-1 min-w-0" ... />
```

**Resultado:** Fallido. Radix descarta `className` silenciosamente (ver §4.1). El prop se acepta sin error pero nunca se aplica.

---

### Intento 3 — `[&>span]:truncate` en `SelectValue` (patrón shadcn canónico)

```jsx
<SelectPrimitive.Value className={cn("min-w-0 [&>span]:truncate", className)} ... />
```

**Resultado:** Fallido. Por dos razones simultáneas: (a) Radix descarta `className`, (b) incluso si llegara, `[&>span]` no matchea porque el texto se porta como nodo de texto, no como elemento `<span>` hijo.

---

### Intento 4 — `min-w-0` en los divs wrapper de los campos del grid

En `OrderEditSheet/index.js` y `CreateOrderForm/index.tsx`:

```jsx
<div className={`grid w-full min-w-0 gap-2 ${field.colSpan || ''}`}>
```

**Resultado:** Parcialmente correcto como medida de contención del grid, pero no suficiente para truncar el texto dentro del Select. El overflow visual continuó.

---

### Intento 5 — Wrapper `<span>` dentro de `SelectTrigger`

```jsx
<SelectTrigger className="w-full" loading={loading}>
  <span className="flex-1 min-w-0 truncate text-start">
    <SelectValue ... />
  </span>
</SelectTrigger>
```

**Resultado:** Fallido. El usuario confirmó que el overflow continuaba. Posibles causas: el `<span>` como flex item se comporta de manera más compleja que un `<div>` para text-overflow; el `whitespace-nowrap` heredado del trigger impide el cálculo correcto; o el caché de HMR del servidor de dev no refrescó la versión compilada.

---

### Intento 6 — Versión canónica shadcn completa

Reescritura completa del `SelectTrigger` con las clases oficiales shadcn:

```jsx
*:data-[slot=select-value]:flex *:data-[slot=select-value]:min-w-0 
*:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2
```

**Resultado:** Fallido. Mismo problema que el intento 1 — los selectores `*:data-[slot=...]` no producen CSS efectivo en este entorno Tailwind 4.2.1.

---

## 6. Estado actual de los archivos

### `src/components/ui/select.jsx`

Versión shadcn canónica con:
- `SelectValue`: `className={cn("min-w-0 [&>span]:truncate", className)}` — ignorado por Radix
- `SelectTrigger`: contiene `*:data-[slot=select-value]:flex *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2` — no genera CSS efectivo

### `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js`

```jsx
// Línea ~334 (mobile path):
className={`grid w-full min-w-0 gap-2 ${isMobile ? '' : field.colSpan}`}
// Línea ~368 (desktop path):
className={`grid w-full min-w-0 gap-2 ${field.colSpan || ''}`}
```

`min-w-0` aplicado a los field wrappers — parcialmente correcto.

### `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx`

Mismo `min-w-0` aplicado en field wrappers.

---

## 7. Solución correcta (pendiente de aplicar)

La solución que **funcionaba** antes del commit `d2f37924` era el wrapper `<div>` en los puntos de uso. La diferencia crítica `<div>` vs `<span>` es:

- `<div>` como flex item → elemento de bloque → `text-overflow: ellipsis` funciona sobre inline content dentro de él.
- `<span>` como flex item → también se blockifica en flex, pero en la práctica Radix puede no estar renderizando el contenido como inline en ese contexto específico.

**La solución es restaurar el wrapper `<div>` en los usages de Select que muestran opciones de texto largo**, sin modificar el componente `select.jsx` central:

```jsx
// En OrderEditSheet y CreateOrderForm, case 'Select':
<SelectTrigger className="w-full" loading={loading}>
  <div className="flex-1 min-w-0 truncate text-start">
    <SelectValue
      placeholder={field.props?.placeholder}
      loading={loading}
      value={value}
      options={field.options}
    />
  </div>
</SelectTrigger>
```

**No tocar `select.jsx`** — los cambios allí no tienen efecto por las limitaciones de Radix documentadas en §4.

---

## 8. Verificación pendiente

Antes de dar por cerrado el bug:

1. **Confirmar en DevTools** que el `<div>` wrapper tiene `display: block` (o `display: block` como flex item blockificado), `overflow: hidden`, y `text-overflow: ellipsis` computados.
2. **Confirmar** que el `<span data-slot="select-value">` dentro del div tiene `white-space: nowrap` implícito del trigger padre y el texto muestra `…` en lugar de desbordarse.
3. **Comprobar** que el `SelectContent` sigue mostrando todas las opciones sin truncado (el truncado es solo en el trigger, no en el dropdown).
4. **Verificar** `MassiveExportDialog` si usa el mismo patrón de renderField — si es así, aplicar el mismo wrapper.

---

## 9. Lección aprendida

La abstracción `SelectValue` de Radix UI tiene un comportamiento no obvio y no documentado: **ignora `className`**. Cualquier intento de estilizar el span del valor seleccionado a través de props o selectores CSS desde el padre es inefectivo en la versión actual de Radix UI.

La única solución robusta es **envolver `<SelectValue>` en un elemento HTML estándar** (preferiblemente `<div>`) dentro del `<SelectTrigger>` cuando se necesita control de overflow. Este wrapper debe aplicar `flex-1 min-w-0 truncate` para que el truncado funcione correctamente.

Este patrón es específico de cada punto de uso, no del componente `select.jsx` central.
