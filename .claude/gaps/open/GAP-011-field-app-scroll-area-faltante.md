# GAP-011 — Field App: ScrollArea faltante en listas

## Metadata

- **Tipo:** Bug
- **Módulo:** Field (repartidores)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — findings A2-B2, A4-M1

---

## Contexto y problema

`ResponsiveLayout` configura en mobile: `<main overflow-hidden h-[calc(100vh-5rem-env(safe-area-inset-bottom))]>`. Esto significa que **cada vista hijo es responsable de gestionar su propio scroll** mediante `ScrollArea`. Sin `ScrollArea`, el contenido queda cortado detrás del BottomNav y el usuario no puede hacer scroll para ver los elementos inferiores.

Dos vistas del Field App no tienen `ScrollArea`:

1. **`FieldRoutesListPage.jsx`** (🔴 BLOCKING) — la lista de rutas se corta detrás del BottomNav. El usuario no puede ver las rutas del final de la lista.
2. **`FieldOrdersPage.jsx`** (🟢 IMPROVEMENT) — la lista de pedidos puede quedar cortada en dispositivos pequeños o con muchos pedidos.

Referencia de implementación correcta: `FieldDashboard.jsx` ya usa `ScrollArea` correctamente con `pb-[calc(5rem+env(safe-area-inset-bottom))]` dentro.

---

## Solución acordada

Envolver el contenido scrollable de cada vista en `ScrollArea` con `className="h-full w-full"`, añadiendo `pb-[calc(5rem+env(safe-area-inset-bottom))]` al contenedor interior para clearance del BottomNav.

### FieldRoutesListPage.jsx
Envolver la lista de tarjetas de ruta en `<ScrollArea className="h-full w-full">`. El contenedor de la lista debe tener `pb-[calc(5rem+env(safe-area-inset-bottom))]`.

### FieldOrdersPage.jsx
Mismo patrón: `<ScrollArea className="h-full w-full">` envolviendo la lista de `FieldOrderCard` con padding bottom para el BottomNav.

---

## UI Brief

- **Vista de referencia:** `src/components/Field/FieldDashboard.jsx` — uso correcto de `ScrollArea` con `pb-[calc(5rem+env(safe-area-inset-bottom))]`
- **Tipo de layout:** Scroll inline — `ScrollArea` envuelve el contenido de lista, no el componente entero
- **Componentes clave:** `ScrollArea` de `@/components/ui/scroll-area`
- **Estados requeridos:** Sin cambio en estados — solo afecta al scroll del estado "data loaded"
- **Mobile:** aplica ahora — es un bug en mobile-only

---

## Referencias

- `FieldDashboard.jsx` — patrón de referencia de `ScrollArea` + clearance de BottomNav
- `design-context.md` — sección "Mobile Layout Shell": `ResponsiveLayout` delega scroll a los hijos
- `src/components/Admin/Layout/ResponsiveLayout/index.jsx` — confirma `overflow-hidden` en `<main>`

---

## Criterios de aceptación

- [ ] `FieldRoutesListPage.jsx` envuelve su lista en `ScrollArea` — el usuario puede hacer scroll hasta el último elemento de la lista
- [ ] `FieldOrdersPage.jsx` envuelve su lista en `ScrollArea` — el usuario puede hacer scroll hasta el último pedido
- [ ] En ambas vistas, el último elemento de la lista no queda oculto detrás del BottomNav (verificar con `pb-[calc(5rem+env(safe-area-inset-bottom))]` en el contenedor interior)
- [ ] `FieldDashboard.jsx` no se toca — ya es correcto
- [ ] El resto de la estructura (header, filtros, tabs si los hay) permanece fuera de `ScrollArea` — solo la lista scrollea

---

## Archivos a crear o modificar

- `src/components/Field/FieldRoutesListPage.jsx` — añadir `ScrollArea` alrededor de la lista
- `src/components/Field/FieldOrdersPage.jsx` — añadir `ScrollArea` alrededor de la lista

---

## Restricciones

- NO cambiar la lógica de datos ni los hooks
- NO tocar el layout de `ResponsiveLayout`
- Solo envolver el contenido de lista — el header y controles de filtro deben quedar fijos fuera del scroll

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
