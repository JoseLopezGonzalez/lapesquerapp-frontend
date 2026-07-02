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

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/index.tsx` — el bloque `if (loading)` ahora delega en `isMobile` (ya disponible vía `useIsMobileSafe()` al inicio del componente) a dos sub-componentes locales nuevos:
  - `OrderMobileSkeleton` — header (back circular + título + menú circular, silueta de `OrderHeaderMobile`) + resumen centrado (nombre cliente, transporte, badge de estado, 2 filas de 2 métricas, silueta de `OrderSummaryMobile`) + `Card` estrecha `max-w-[280px]` con 3 filas `min-h-[44px]` divididas, silueta de `OrderSectionList`.
  - `OrderDesktopSkeleton` — envuelto en `Card`/`CardHeader` con dos columnas (info izquierda silueta de `OrderHeaderDesktop`: badge estado, id, nombre cliente, 2 bloques fecha/temperatura; botones+imagen de transporte a la derecha) + `CardContent` con fila de 6 tabs cortas + bloque de contenido `h-64`.

### Archivos eliminados

- `src/components/Admin/OrdersManager/Order/OrderSkeleton/index.tsx` (nota: el GAP referenciaba `index.js`, pero el archivo ya estaba migrado a `.tsx`) — confirmado por grep cero imports antes de eliminar.
- `src/components/ui/CustomSkeleton.jsx` — confirmado por grep cero imports antes de eliminar.

### Decisiones tomadas durante la implementación

- Se reutilizó `isMobile`/`mounted` de `useIsMobileSafe()` ya presente en `OrderContent`, sin introducir un hook nuevo.
- `npm run type-check` tras la eliminación de ambos archivos: limpio (0 errores), confirmando que no había ningún import roto.

### Desviaciones del plan (si las hay)

Ninguna funcional; el archivo de código muerto ya estaba en `.tsx` en vez de `.js` al momento de eliminarlo (migración posterior a la fecha del GAP).

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — implementación fiel al plan, sin desviaciones bloqueantes, type-check y lint limpios.

### Checklist

Criterios de aceptación del GAP:

- [x] El skeleton de `Order/index.tsx` tiene una rama `isMobile` distinta a la de desktop — CUMPLIDO. `index.tsx:138-140` (`return isMobile ? <OrderMobileSkeleton /> : <OrderDesktopSkeleton />;`) usa `isMobile` de `useIsMobileSafe()`, ya presente en el componente.
- [x] La rama mobile representa una card estrecha centrada con filas divididas (no una lista a ancho completo) — CUMPLIDO. `OrderMobileSkeleton` (líneas 244-294) reproduce header circular back/menú + título, resumen centrado (nombre, transporte, badge, 2 filas de métricas) y una `Card max-w-[280px]` con 3 filas `min-h-[44px]` con `divide-y`, fiel a `OrderSectionList.tsx` (mismo `max-w-[280px]`, mismo `min-h-[44px]`, mismo patrón `divide-border/60 divide-y`).
- [x] La rama desktop está envuelta en `Card`/`CardHeader` y representa una fila de tabs horizontal — CUMPLIDO. `OrderDesktopSkeleton` (líneas 297-335) envuelve todo en `Card`, con `CardHeader` de dos columnas (info izquierda: badge+id+cliente+fecha+temperatura; botones+imagen derecha, oculto en `<lg` igual que el real) y `CardContent` con fila de 6 `Skeleton` cortas simulando `TabsList` + bloque `h-64` simulando el panel de contenido. Coincide con la estructura real de `OrderHeaderDesktop.tsx` + `OrderTabsDesktop.tsx`.
- [x] `OrderSkeleton/index.js` y `CustomSkeleton.jsx` quedan eliminados del repositorio — CUMPLIDO. Confirmado con `find`/`ls`: ninguno de los dos archivos existe; `git status` los marca `D` (deleted). La carpeta `OrderSkeleton/` no queda huérfana (no existe). Nota correcta del implementador: ambos ya estaban en `.tsx` (no `.js`/`.jsx` como decía el GAP original) por una migración posterior a la redacción del GAP.
- [x] Ningún import roto tras la eliminación (`npm run type-check` limpio) — CUMPLIDO. Ejecutado de forma independiente: `npm run type-check` → 0 errores. `grep -rn "OrderSkeleton\|CustomSkeleton" src/` → 0 resultados en todo el proyecto.
- [x] Usa exclusivamente `<Skeleton>` de shadcn, ninguna clase de color hardcodeada — CUMPLIDO. `grep -nE "bg-neutral|bg-\[#|text-\[#|rgb\(|oklch\("` sobre `index.tsx` → 0 resultados. 30 usos de `<Skeleton>` en las dos funciones nuevas, cero clases de color arbitrarias.

Checklist técnico del proyecto:

- [x] Sin fetch() directo en código nuevo
- [x] Sin hardcode de tenant o header X-Tenant
- [x] Sin archivos .js nuevos creados (se eliminaron .tsx/.jsx, no se crearon .js)
- [x] Sin `any` en TypeScript sin comentario
- [x] `useOrder`, `usePallet`, `useLabelEditor.ts` no modificados
- [x] `entitiesConfig.js` no modificado
- [x] Reglas de `.claude/rules/components.md` respetadas — sub-componentes locales pequeños al final del archivo, patrón consistente con el resto del proyecto
- [x] Nomenclatura correcta (`OrderMobileSkeleton`, `OrderDesktopSkeleton` en PascalCase)
- [x] Loading states con `<Skeleton>` de shadcn — sin spinners ni "Cargando..." hardcodeado

### Revisión Visual

- [x] Color: solo `<Skeleton>` de shadcn (que ya usa `bg-accent`/tokens internos) — cero hex/rgb/oklch hardcodeados
- [x] Layout: mobile replica header circular + resumen centrado + card estrecha `max-w-[280px]`; desktop replica `Card`/`CardHeader` de dos columnas + `CardContent` con tabs — ambos coinciden con `.claude/design-context.md` § Loading States (Skeleton nativo, sin "Cargando...", sin spinner como reemplazo de carga inicial)
- [x] Paridad con referencia: comparado línea a línea contra `OrderHeaderMobile.tsx`, `OrderSummaryMobile.tsx`, `OrderSectionList.tsx` (mobile) y `OrderHeaderDesktop.tsx`, `OrderTabsDesktop.tsx` (desktop) — dimensiones (`max-w-[280px]`, `min-h-[44px]`, `h-12 w-12` circulares) coinciden exactamente
- [x] Mobile: usa `useIsMobileSafe()` ya existente en el componente, no introduce hook nuevo
- [x] Sin inline styles, sin colores hardcodeados

**Veredicto visual:** ✅ APROBADO

### Revisión UX — Light

Cambio solo visual (loading state), sin flujo nuevo, sin formulario, sin cambio de navegación ni de permisos por rol → corresponde Light Review (no requiere `ux-reviewer`).

```
[x] El cambio es autoexplicativo para el usuario — no requiere instrucción
[x] No introduce una decisión nueva del usuario sin affordance adecuado
[x] Consistente con la UI circundante — sin ruptura visual brusca (el skeleton ahora anticipa correctamente la forma real, evitando el "salto" de layout al terminar de cargar)
[x] N/A interactivo (skeleton no es interactivo)
[x] N/A texto (skeleton no tiene texto)
```

**VERDICT:** ✅ APROBADO

### System Learner check

No se identifican hallazgos nuevos que requieran entrada en `project-learnings.md`. La nota del implementador sobre `.js`→`.tsx` ya migrado antes de la eliminación es un caso puntual ya cubierto por la práctica estándar de "confirmar con grep antes de eliminar", que el propio GAP ya exigía como restricción y se siguió correctamente. No se invoca a `system-learner`.

### Observaciones para Jose

Implementación limpia y fiel a la referencia real. Verificación independiente (no solo lectura de lo que dice el GAP):

- `find`/`ls` confirman que `OrderSkeleton/index.tsx` (y la carpeta) y `CustomSkeleton.jsx` ya no existen.
- `grep -rn "OrderSkeleton\|CustomSkeleton"` en todo `src/` → 0 resultados, cero referencias colgantes.
- `npm run type-check` → limpio (0 errores).
- `npm run lint` → 271 warnings preexistentes en todo el proyecto (0 errores), ninguno introducido por este cambio. Los dos warnings que aparecen en `Order/index.tsx` (líneas 89 y 128) son de lógica preexistente no tocada por este GAP (`setActiveSection` en efecto de bloqueo de tabs, y memoización de `transportImage`) — fuera del rango del skeleton (138-335).
- Las dimensiones del skeleton mobile (`max-w-[280px]`, `min-h-[44px]`, `divide-y`) y desktop (estructura `Card`/`CardHeader`/`CardContent`, columnas ocultas en `<lg`) coinciden exactamente con los componentes reales comparados línea a línea.

Sin observaciones bloqueantes ni menores. Buen trabajo de verificación por parte del implementador antes de eliminar los archivos muertos.

### Estado final de la implementación

`Order/index.tsx` ahora resuelve `if (loading)` con `isMobile ? <OrderMobileSkeleton /> : <OrderDesktopSkeleton />`, dos sub-componentes locales que replican fielmente la silueta real de cada viewport. Código muerto (`OrderSkeleton/index.tsx`, `CustomSkeleton.jsx`) eliminado sin dejar referencias colgantes. GAP cumple todos los criterios de aceptación.
