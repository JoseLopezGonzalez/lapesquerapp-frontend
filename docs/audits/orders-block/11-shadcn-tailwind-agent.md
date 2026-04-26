# Auditoría: shadcn/Tailwind UI Agent
# Bloque: Pedidos — OrdersManager, Comercial, Field/Autoventa

**Fecha:** 2026-04-26
**Rol auditor:** shadcn/Tailwind UI Agent (`docs/agents/shadcn-tailwind-agent.md`)
**Scope:** Uso correcto de componentes shadcn/ui, tokens Tailwind v4 (oklch), `cn()`/`cva()`, accesibilidad Radix, clases arbitrarias, inline styles, selección correcta de componente

> Este rol es complementario al Design System Agent (05). Ese rol revisa consistencia visual y densidad.
> Este rol revisa **la capa técnica de la UI**: si los componentes shadcn se usan con su API correcta, si los tokens del sistema de diseño se aplican bien y si Tailwind v4 se usa según sus convenciones.

---

## 1. Componentes auditados

| Componente / Archivo | Área |
|---|---|
| `src/components/Admin/OrdersManager/index.js` | Gestor principal |
| `src/components/Admin/OrdersManager/OrderCard/index.js` | Tarjeta de pedido |
| `src/components/Admin/OrdersManager/OrderHeaderMobile.jsx` | Cabecera móvil |
| `src/components/Admin/OrdersManager/OrderSectionList.jsx` | Lista de secciones |
| `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletsToolbar.jsx` | Barra móvil de palets |
| `src/components/Admin/OrdersManager/Order/OrderDetails/index.js` | Detalle del pedido |
| `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js` | Detalle de productos |
| `src/components/Admin/OrdersManager/Order/OrderIncident/index.js` | Incidencias |
| `src/components/Admin/OrdersManager/Order/OrderProduction/index.js` | Producción |
| `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js` | Líneas previstas |
| `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js` | Sheet de edición |
| `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx` | Formulario creación móvil |
| `src/components/Admin/OrdersManager/StatusBadge.jsx` | Badge de estado |
| `src/components/Comercial/CRM/` | Componentes CRM comercial |

---

## 2. Problemas encontrados

### 2.1 [CRÍTICO] Barras de acción móviles con `fixed` manual — deben ser `Sheet` o patrón propio documentado

**Patrón detectado en 5 archivos:**

```jsx
// OrderPalletsToolbar.jsx:23
className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex items-center gap-2 z-50"
style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}

// Mismo patrón en:
// OrderProductDetails/index.js:100
// OrderIncident/index.js:199
// OrderProduction/index.js:131
// OrderPlannedProductDetails/index.js:460
```

**Problemas:**

1. **Inline style para safe-area-inset** — `env(safe-area-inset-bottom)` como `style={{}}` bypassa completamente el design system. En Tailwind v4 existe `pb-safe` o se puede definir como token CSS en `globals.css`. El inline style fuerza recalcular el valor en cada render en lugar de depender del cascade CSS.

2. **`fixed` posicionado manualmente** — el agente shadcn define que los paneles laterales o flotantes deben usar `Sheet`. Estas barras inferiores no son `Sheet` (son toolbars fijas), pero el problema es que el patrón se repite 5 veces con ligeras variaciones. Debería existir un componente `MobileActionBar` compartido con el padding safe-area ya encapsulado.

3. **`z-50` hardcodeado** — duplicado en múltiples archivos. Si un componente con z-index mayor aparece, las toolbars quedan debajo sin forma de ajustarlo sistemáticamente.

**Propuesta de corrección:**
```css
/* globals.css — añadir token */
@theme inline {
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```
```jsx
// Componente compartido: src/components/UI/MobileActionBar.jsx
export function MobileActionBar({ children, className }) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-background border-t",
      "px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
      className
    )}>
      {children}
    </div>
  );
}
```
**Prioridad: Alta** — duplicación x5, inline styles en 5 archivos simultáneos.

---

### 2.2 [ALTO] Colores de estado en `OrderCard` con clases de Tailwind directas — deben usar tokens del sistema

```jsx
// OrderCard/index.js:72-96
'bg-orange-500/15 text-orange-700 dark:text-orange-300',   // estado pendiente
'bg-green-500/15 text-green-700 dark:text-green-300',      // estado activo
'bg-red-500/15 text-red-700 dark:text-red-300',            // estado cancelado
'bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border border-neutral-400/50'  // otros
```

El proyecto tiene tokens semánticos específicos para estos casos:

| Clase usada | Token correcto | Motivo |
|---|---|---|
| `bg-orange-500/15 text-orange-700` | `bg-warning/15 text-warning` | Token `--warning` es oklch(0.83 0.17 92) — amarillo/naranja |
| `bg-green-500/15 text-green-700` | `bg-success/15 text-success` | Token `--success` es oklch(0.74 0.17 155) — verde |
| `bg-red-500/15 text-red-700` | `bg-destructive/15 text-destructive` | Token `--destructive` es oklch(0.58 0.22 27) — rojo |

Usar los tokens garantiza que si el design system cambia los colores semánticos, las cards se actualizan automáticamente. Los colores directos de Tailwind (`orange-700`, `green-700`) no responden al theme.

Además, en `OrderHeaderMobile.jsx:60`:
```jsx
'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-400 dark:border-slate-500'
```
`slate-*` no son tokens del sistema — deberían ser `bg-muted`, `text-muted-foreground`, `border-border`.

**Prioridad: Alta** — afecta a la pieza visual más repetida del gestor (cada tarjeta de pedido).

---

### 2.3 [ALTO] Template literals de `className` sin `cn()` — riesgo de clases conflictivas

```jsx
// OrderSectionList.jsx:22
className={`px-4 pt-8 flex justify-center ${hasSafeAreaPadding ? 'pb-8' : 'pb-2'}`}
```

Sin `cn()` / `tailwind-merge`, si se pasan clases adicionales desde el exterior que también definen `pb-*`, ambas clases coexisten y el resultado depende del orden en el CSS generado — no del código. En Tailwind v4 esto es especialmente relevante porque el orden del CSS se calcula en tiempo de build.

**En 3+ archivos de `src/components/Comercial/CRM/`** se detecta el mismo patrón con template literals.

**Corrección:**
```jsx
// ✓
className={cn("px-4 pt-8 flex justify-center", hasSafeAreaPadding ? "pb-8" : "pb-2")}
```

**Prioridad: Alta** — silencioso, difícil de detectar visualmente.

---

### 2.4 [MEDIO] `overflow-y-auto` sin `ScrollArea` — 16 archivos

```jsx
// Patrón detectado en:
// OrdersListFiltersSheet.jsx, OrderPallets/index.js, OrderEditSheet/index.js,
// OrderProductDetails/index.js, CreateOrderFormMobile.jsx,
// OrderPalletsContent.jsx, OrderExport/index.js, OrderProduction/index.js...
```

`ScrollArea` de Radix proporciona:
- Scrollbar visual consistente con el design system
- Soporte de scroll virtualizado
- Accesibilidad (rol ARIA de región scrollable)
- Comportamiento cross-browser uniforme

El `overflow-y-auto` nativo muestra scrollbars del sistema operativo, que varía por plataforma.

**Excepción justificada:** en algunos contenedores de pantalla completa o en `Dialog` ya gestionado por Radix, `overflow-y-auto` puede ser aceptable. Revisar caso por caso.

**Propuesta:** reemplazar en los contenedores de lista (palets, documentos, filtros, producción) que sí tienen altura fija y scroll interno. Dejar overflow nativo en contenedores que ocupan toda la pantalla disponible.

**Prioridad: Media** — impacto en UX de scroll en desktop/tablet.

---

### 2.5 [MEDIO] Inline styles con `fontFamily` y `fontWeight` — bypassa el design system

```jsx
// OrderDetails/index.js:403, 417
style={{ fontFamily: 'OCR A Std, monospace', fontWeight: 600 }}
```

Una tipografía especial (`OCR A Std`) para mostrar códigos (probablemente códigos de barras o números de trazabilidad) está incrustada como inline style. Si el agente de design system define una fuente monospaced diferente en el futuro, este código no se actualizará.

**Corrección:**
```css
/* globals.css */
@theme inline {
  --font-mono-barcode: 'OCR A Std', monospace;
}
```
```jsx
<span className="font-barcode font-semibold">...</span>
```

O como alternativa más simple, añadir una clase utility en `globals.css`:
```css
.font-barcode { font-family: 'OCR A Std', monospace; font-weight: 600; }
```

**Prioridad: Media** — el componente de detalle es crítico y la tipografía afecta a la legibilidad de datos de trazabilidad.

---

### 2.6 [MEDIO] Inline style para `border: 0` en iframe — evitable

```jsx
// OrderDetails/index.js:194
<iframe style={{ border: 0 }} ...>
```

En Tailwind v4: `<iframe className="border-0" ...>`. El inline style es innecesario.

**Prioridad: Baja** — cosmético, pero es una excepción al principio de no usar `style={{}}`.

---

### 2.7 [MEDIO] `pointerEvents` como inline style

```jsx
// CreateOrderFormMobile.jsx:544
style={{ pointerEvents: isComboboxOpen ? 'auto' : 'none' }}
```

Tailwind tiene `pointer-events-auto` y `pointer-events-none`. La clase condicional debería resolverse con `cn()`:

```jsx
className={cn(isComboboxOpen ? "pointer-events-auto" : "pointer-events-none")}
```

**Prioridad: Baja** — funcional, pero inconsistente con el uso de Tailwind.

---

### 2.8 [BAJO] `title=""` nativo en lugar de `Tooltip` — 10+ archivos

```jsx
// OrdersManager/index.js
title="Seleccione un pedido"

// OrderCostAnalysis/index.jsx — múltiples instancias
// OrderLabels/index.js
```

El atributo `title` del HTML:
- No funciona en pantallas táctiles
- No tiene estilo consistente con el design system
- No es accesible (no anunciado por lectores de pantalla correctamente)

`Tooltip` de shadcn/Radix:
- Funciona en todos los dispositivos
- Respeta el design system
- Tiene roles ARIA correctos

**Corrección:**
```jsx
// ✓
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><Button>...</Button></TooltipTrigger>
    <TooltipContent>Seleccione un pedido</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Prioridad: Baja** — UX, especialmente para usuarios móviles donde `title` no funciona.

---

## 3. Puntos fuertes

| Aspecto | Evaluación |
|---|---|
| `StatusBadge.jsx` — encapsulación de estado | Excelente: mapea estados a clases de color en un solo lugar. La referencia correcta para el resto del bloque. |
| `Badge` de shadcn — uso general | Correcto en OrderCard, OrderCostAnalysis, OrderIncident, OrderDocuments y otros (17 archivos). |
| `AlertDialog` en líneas previstas | Correcto: se usa para la acción destructiva de borrar una línea ya persistida. |
| `ConfirmActionDialog` — patrón de confirmación | Bien implementado con Dialog y variante destructive en el botón. |
| `Sheet` para edición | `OrderEditSheet` usa Sheet correctamente para el panel lateral de edición. |
| `ScrollArea` en OrderDetails | Hay uso correcto de ScrollArea donde corresponde. |
| `cn()` — uso general | Presente y correcto en la mayoría de componentes. Los fallos son puntuales. |
| Lucide icons | Uso consistente de la biblioteca oficial en toda la UI. |

---

## 4. Propuesta de corrección priorizada

| Prioridad | Problema | Archivos afectados | Acción |
|---|---|---|---|
| **Alta** | Barras móviles fixed con inline style repetido x5 | `OrderPalletsToolbar`, `OrderProductDetails`, `OrderIncident`, `OrderProduction`, `OrderPlannedProductDetails` | Extraer `MobileActionBar` compartido con token CSS para safe-area |
| **Alta** | Colores de estado en `OrderCard` sin tokens semánticos | `OrderCard/index.js`, `OrderHeaderMobile.jsx` | Reemplazar `orange-*`, `green-*`, `red-*`, `slate-*` por `warning`, `success`, `destructive`, `muted` |
| **Alta** | Template literals sin `cn()` | `OrderSectionList.jsx` + Comercial/CRM | Migrar a `cn()` |
| **Media** | `overflow-y-auto` sin `ScrollArea` en contenedores con altura fija | 16 archivos | Reemplazar en listas de palets, documentos, filtros, producción |
| **Media** | `fontFamily` / `fontWeight` como inline style | `OrderDetails/index.js` | Token CSS `--font-barcode` en globals.css |
| **Baja** | `border: 0` en iframe como inline style | `OrderDetails/index.js` | `className="border-0"` |
| **Baja** | `pointerEvents` como inline style | `CreateOrderFormMobile.jsx` | `cn("pointer-events-none", ...)` |
| **Baja** | `title=""` nativo sin Tooltip | 10+ archivos | Migrar a Tooltip shadcn |

---

## 5. ¿Requiere decisión arquitectónica?

| Decisión | ¿Requiere ADR? |
|---|---|
| Token CSS para `env(safe-area-inset-bottom)` | No — cambio local a `globals.css` |
| Componente `MobileActionBar` compartido | No — extracción de componente existente |
| Migración `orange-*/green-*/red-*` → tokens semánticos | No — refactor de clases |
| Reemplazar `overflow-y-auto` por `ScrollArea` | No — cambio de componente equivalente |

Ningún cambio requiere ADR. Todos son correcciones dentro de las convenciones ya establecidas del proyecto.

---

## 6. Comprobaciones visuales manuales recomendadas

- [ ] Abrir el gestor en iOS Safari — verificar que las barras móviles no quedan cortadas por el safe area nativo
- [ ] Abrir una tarjeta `OrderCard` con estado "activo", "pendiente" y "cancelado" — verificar que los colores son los tokens semánticos del design system
- [ ] Abrir el `OrderEditSheet` — verificar que el scroll interno usa `ScrollArea` o `overflow-y-auto` con resultado visual correcto
- [ ] Hover sobre botones con `title=""` en móvil — confirmar que el tooltip no aparece (evidencia del problema)
- [ ] Inspeccionar en DevTools los elementos con `style={{}}` — confirmar que no hay conflictos con clases Tailwind

---

## Nota global: **5.1 / 10**

El bloque usa shadcn correctamente en las áreas principales (Badge, Sheet, Dialog, AlertDialog, Button, Tabs). Los problemas son sistemáticos en la capa móvil (safe-area repetido x5, colores sin tokens) y en el uso de template literals sin `cn()`. No hay fallos de accesibilidad graves, pero el `title` nativo sin Tooltip afecta a la experiencia táctil.
