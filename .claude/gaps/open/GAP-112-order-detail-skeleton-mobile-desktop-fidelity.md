# GAP-112 — Skeleton de detalle de pedido no distingue mobile (lista de secciones) de desktop (tabs)

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía `/audit-skeletons orders manager`, hallazgo skeleton-fidelity-auditor)

---

## Contexto y problema

`Order/index.tsx:148-165` muestra un único skeleton (título+badge, grid de 4 cajas, barra
ancha, 5 filas) mientras carga el detalle de un pedido — **sin rama `isMobile`** — pese a que
el contenido real que sustituye es estructuralmente distinto entre viewports:

- **Mobile:** `OrderHeaderMobile` + `OrderSummaryMobile` + `OrderSectionList` — esta última es
  una `Card` **estrecha y centrada** (`max-w-[280px]`) con filas divididas de `min-h-[44px]`,
  no una lista a ancho completo.
- **Desktop:** un `Card` > `CardHeader` (con `OrderHeaderDesktop`, dos columnas: info a la
  izquierda / botones+imagen de transporte a la derecha) > `CardContent` con
  `OrderTabsDesktop` (barra de tabs horizontal + panel de contenido).

El skeleton actual no envuelve nada en `Card`/`CardHeader` (por lo que no coincide con el
marco real que aparece justo al terminar de cargar), y sus 5 filas a ancho completo no se
parecen ni a la card estrecha de `OrderSectionList` (mobile) ni a la barra de tabs de
`OrderTabsDesktop` (desktop).

Además existe un segundo componente, `OrderSkeleton/index.js`, que **no se importa en
ningún sitio del código** (código muerto) y que usa `CustomSkeleton`
(`src/components/ui/CustomSkeleton.jsx`) — un shimmer custom con colores hardcodeados
(`bg-neutral-800`, `bg-neutral-950`, `neutral-700/40`) en vez del `<Skeleton>` nativo de
shadcn. `CustomSkeleton` no se usa en ningún otro sitio del proyecto.

Detectado en `/audit-skeletons orders manager` (HEURISTIC sub-mode — sin captura visual,
comparación de código fuente).

## Solución acordada

1. Dividir el skeleton de `Order/index.tsx:148-165` en rama `isMobile`:
   - **Mobile:** placeholder de header (similar a `OrderHeaderMobile`) + placeholder de
     resumen (similar a `OrderSummaryMobile`) + una `Card` estrecha centrada (`max-w-[280px]`)
     con 3-4 filas divididas `min-h-[44px]`, replicando `OrderSectionList`.
   - **Desktop:** envolver en `Card`+`CardHeader` (placeholder de dos columnas: info izquierda,
     botones+imagen derecha) + `CardContent` con una fila de tabs (varias barras cortas en
     horizontal) + un bloque de contenido debajo.
2. Eliminar el código muerto: `src/components/Admin/OrdersManager/Order/OrderSkeleton/index.js`
   y `src/components/ui/CustomSkeleton.jsx` (confirmado sin otros usos en el proyecto).

## Referencias e inspiración

- `src/components/Admin/OrdersManager/Order/components/OrderSectionList.jsx` — estructura real mobile
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.jsx` — estructura real desktop
- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.jsx` — tabs desktop
- `.claude/design-context.md` § Loading States, § Modals & Dialogs (Card patterns)

## Skeleton Reference

- **Real component (mobile):** `OrderHeaderMobile.jsx`, `OrderSummaryMobile.jsx`, `OrderSectionList.jsx` (card `max-w-[280px]`, filas `min-h-[44px]` con `divide-y`)
- **Real component (desktop):** `index.tsx:243-264` (`Card` > `CardHeader` con `OrderHeaderDesktop` > `CardContent` con `OrderTabsDesktop`)
- **Skeleton component:** `src/components/Admin/OrdersManager/Order/index.tsx:148-165`
- **Código muerto a eliminar:** `src/components/Admin/OrdersManager/Order/OrderSkeleton/index.js`, `src/components/ui/CustomSkeleton.jsx` (verificado: cero imports de ambos fuera de sí mismos)
- **Viewports afectados:** mobile y desktop (ambos, sin rama actual)

## Criterios de aceptación

- [ ] El skeleton de `Order/index.tsx` tiene una rama `isMobile` distinta a la de desktop
- [ ] La rama mobile representa una card estrecha centrada con filas divididas (no una lista a ancho completo)
- [ ] La rama desktop está envuelta en `Card`/`CardHeader` y representa una fila de tabs horizontal
- [ ] `OrderSkeleton/index.js` y `CustomSkeleton.jsx` quedan eliminados del repositorio
- [ ] Ningún import roto tras la eliminación (`npm run type-check` limpio)
- [ ] Usa exclusivamente `<Skeleton>` de shadcn, ninguna clase de color hardcodeada

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/index.tsx` (modificar skeleton)
- `src/components/Admin/OrdersManager/Order/OrderSkeleton/index.js` (eliminar)
- `src/components/ui/CustomSkeleton.jsx` (eliminar)

## Restricciones

- No tocar `OrderHeaderMobile.jsx`, `OrderSummaryMobile.jsx`, `OrderSectionList.jsx`,
  `OrderHeaderDesktop.jsx`, `OrderTabsDesktop.jsx` (son la referencia, no el objetivo del fix)
- No modificar la lógica de `loading` en `useOrderContext`/`OrderProvider`
- Antes de eliminar `OrderSkeleton/index.js` y `CustomSkeleton.jsx`, volver a confirmar con
  grep que siguen sin usarse (por si otro GAP en curso los introdujo mientras tanto)

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
