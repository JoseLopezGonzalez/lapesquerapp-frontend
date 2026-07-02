# GAP-111 — Skeleton de lista de pedidos no distingue mobile/desktop ni representa header/tabs

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía `/audit-skeletons orders manager`, hallazgo skeleton-fidelity-auditor)

---

## Contexto y problema

`OrdersManagerLayout.jsx` muestra un único skeleton genérico (2 barras de cabecera + 8 filas
`h-14`) mientras carga el listado inicial de pedidos, usado **sin ninguna rama `isMobile`**
para mobile y desktop.

El contenido real que sustituye (`OrdersList/index.js` + `OrderCard/index.tsx`) es
estructuralmente distinto entre viewports:

- **Mobile:** header con back-button + título centrado + botón crear, barra de búsqueda,
  tabs con scroll horizontal, y `OrderCard` de ≈104px (1 línea de nombre + 1 línea de
  metadata + badge de estado inline).
- **Desktop:** header con título + subtítulo + 3 botones de icono (vista producción, crear,
  exportar), barra de búsqueda, tabs, y `OrderCard` de ≈176px (4 bloques apilados: estado+fecha,
  id+tags, nombre con `line-clamp-2`, metadata de fecha/cajas). Además, en desktop el layout
  real es un split maestro-detalle (columna de 360px + panel de detalle), no una columna única
  a ancho completo.

El skeleton actual no representa la barra de búsqueda, los tabs, ni el split maestro-detalle
de desktop, y usa filas de 56px sin jerarquía interna para ambos viewports pese a que las
tarjetas reales tienen alturas y estructuras muy distintas.

Detectado en `/audit-skeletons orders manager` (HEURISTIC sub-mode — sin captura visual,
comparación de código fuente).

## Solución acordada

Dividir el skeleton de `OrdersManagerLayout.jsx` en dos ramas (`isMobile ? ... : ...`),
siguiendo el patrón ya usado por el resto del componente para las ramas mobile/desktop reales:

- **Mobile:** fila de header (back-button circular + título + botón crear) + barra de
  búsqueda + fila de tabs con scroll + lista de bloques a ≈104px que reflejen la jerarquía de
  `OrderCard` mobile (línea de nombre más alta que la línea de metadata, más un bloque de
  badge pequeño).
- **Desktop:** header con título+subtítulo a la izquierda y 3 placeholders de icon-button a
  la derecha + barra de búsqueda + tabs + columna de 360px con bloques a ≈176px (4 sub-bloques
  por card) — sin necesidad de skeletar el panel de detalle (queda vacío o con su propio
  skeleton ya cubierto por GAP-112).

No es necesario replicar pixel a pixel; el objetivo es que la silueta general (número de
bloques, alturas relativas, presencia de header/búsqueda/tabs) sea reconocible como el
contenido que sustituye.

## Referencias e inspiración

- `src/components/Admin/OrdersManager/OrdersList/index.js` — estructura real mobile/desktop
- `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx` — estructura de card por viewport
- `.claude/design-context.md` § Loading States, § Mobile Patterns

## Skeleton Reference

- **Real component:** `src/components/Admin/OrdersManager/OrdersList/index.js` (header + búsqueda + tabs + lista), `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx` (card)
- **Skeleton component:** `src/components/Admin/OrdersManager/shared/OrdersManagerLayout.jsx:16-27`
- **Viewports afectados:** mobile y desktop (ambos, sin rama actual)
- **Medidas capturadas (heurístico, no confirmado visualmente):**
  - `OrderCard` mobile ≈104px (Card `py-4` + `CardContent px-4` + 3 líneas de contenido con `space-y-1`)
  - `OrderCard` desktop ≈176px (Card `py-4` + `CardContent px-4` + 4 bloques con `space-y-2`)
  - Skeleton actual: filas fijas `h-14` (56px), 8 repeticiones, idénticas en ambos viewports
  - Desktop real: columna de lista de `360px` (`xl:w-[360px]`) + panel de detalle a la derecha — el skeleton actual ocupa ancho completo sin reservar el split

## Criterios de aceptación

- [ ] El skeleton de `OrdersManagerLayout.jsx` tiene una rama `isMobile` distinta a la de desktop
- [ ] La rama mobile incluye placeholders de: header (back+título+crear), búsqueda, tabs, y tarjetas ≈104px con al menos 2 alturas de bloque distintas (nombre vs metadata/badge)
- [ ] La rama desktop incluye placeholders de: header (título+subtítulo+3 botones), búsqueda, tabs, y tarjetas ≈176px con al menos 3 alturas de bloque distintas
- [ ] En desktop, el skeleton reserva visualmente la columna de lista (≈360px) en vez de ocupar el ancho completo
- [ ] Usa exclusivamente `<Skeleton>` de shadcn (`@/components/ui/skeleton`), ninguna clase de color hardcodeada
- [ ] No hay regresión en el resto de `OrdersManagerLayout.jsx` (rama `viewMode === 'production'`, split maestro-detalle real)

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/shared/OrdersManagerLayout.jsx`

## Restricciones

- No tocar `OrdersList/index.js` ni `OrderCard/index.tsx` (son la referencia, no el objetivo del fix)
- No modificar la lógica de `loading` ni de dónde se recibe (`useOrdersList` u equivalente)
- Mantener `useIsMobileSafe` con guard `mounted` si se introduce el hook aquí (actualmente el componente recibe `isMobile` como prop desde el padre — verificar antes de importar el hook directamente)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/shared/OrdersManagerLayout.tsx` (nota: el archivo referenciado en el GAP como `.jsx` fue migrado a `.tsx` en una migración posterior a la fecha del GAP). El bloque `if (loading)` ahora ramifica por `isMobile` (prop ya recibida por el componente) y delega en 4 sub-componentes locales nuevos:
  - `MobileOrdersListSkeleton` — header (back circular + título + crear circular) + búsqueda + fila de tabs con scroll + 6× `MobileOrderCardSkeleton`.
  - `MobileOrderCardSkeleton` — silueta de `OrderCard` mobile: línea nombre (`h-4`), línea metadata (`h-3`), badge (`h-4 rounded-full`) + chevron.
  - `DesktopOrdersListSkeleton` — header (título+subtítulo + 3 placeholders de icon-button) + búsqueda + tabs + 4× `DesktopOrderCardSkeleton`, envuelto en columna `xl:w-[360px]` (el resto del ancho queda vacío, sin skeletar el panel de detalle, cubierto por GAP-112).
  - `DesktopOrderCardSkeleton` — 4 sub-bloques con distinta altura: estado+fecha, id+tags, nombre (2 líneas simulando `line-clamp-2`), fecha/cajas.

### Decisiones tomadas durante la implementación

- Se reutilizó la prop `isMobile` ya recibida por `OrdersManagerLayout` (no se importó `useIsMobileSafe` directamente en este componente, tal como pedía la restricción del GAP).
- El panel de detalle en desktop se deja vacío (`<div className="grow p-2 lg:pl-0" />`, sin contenido) durante loading, replicando el layout de split maestro-detalle real sin necesidad de skeletar esa zona.
- No se tocó la rama `viewMode === 'production'` ni el resto del componente fuera del bloque `if (loading)`.

### Desviaciones del plan (si las hay)

Ninguna funcional; solo el path del archivo (`.jsx` → `.tsx`), sin cambio de alcance.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Verificación de criterios de aceptación

- [x] Rama `isMobile` distinta a la de desktop en el bloque `if (loading)` — confirmada línea 31 (`isMobile ? <MobileOrdersListSkeleton /> : ...`).
- [x] Rama mobile: header (back circular `h-12 w-12 rounded-full` + título + crear circular `h-12 w-12 rounded-full`) + búsqueda (`h-9 w-full rounded-md`) + tabs con scroll (4× `h-8` pills) + 6× `MobileOrderCardSkeleton` con 3 alturas de bloque distintas (`h-4` nombre, `h-3` metadata, `h-4 rounded-full` badge, más `h-5 w-5` chevron). Coincide con la estructura real de `OrdersList/index.tsx` (back+título+crear, `InputGroup`, `TabsList` con scroll) y `OrderCard` mobile (nombre→metadata→badge→chevron).
- [x] Rama desktop: header (título `h-6 w-32` + subtítulo `h-3 w-24` + 3× `h-9 w-9 rounded-md` icon-button) + búsqueda + tabs + 4× `DesktopOrderCardSkeleton` con 4 sub-bloques de altura distinta (`h-5` badge estado, `h-3` fecha, `h-4`×2 id/tags y nombre, `h-3`/`h-3.5` footer). Coincide con el header real (título+subtítulo+3 Tooltip/Button icon) y el card real (StatusBadge+fecha, id+tags, nombre `line-clamp-2`, fecha/cajas).
- [x] Columna de lista reservada a `xl:w-[360px]` en desktop durante loading — idéntica a la columna real (`OrdersManagerLayout.tsx:66` en el árbol no-loading usa el mismo `xl:w-[360px]`). El panel de detalle queda vacío (`<div className="grow p-2 lg:pl-0" />`), consistente con la nota del GAP de dejarlo para GAP-112.
- [x] Solo `<Skeleton>` de shadcn — 31 usos, 0 clases de color hardcodeadas (verificado con grep de `#hex`, `rgb(`, `oklch(`, y clases `bg-*-500` etc.: sin resultados).
- [x] Sin regresión en `viewMode === 'production'` ni en el resto del componente: diff contra la última versión `.jsx` (commit `f67edb7a`) confirma que todo el árbol fuera del bloque `if (loading)` es idéntico carácter a carácter (split maestro-detalle, `ProductionView`, `hasDetail`), solo cambia el bloque de loading y se añade tipado TypeScript.

### Verificación técnica adicional

- `npm run type-check` — limpio (exit 0, sin errores).
- `npm run lint` — 0 errores globales (271 warnings preexistentes en archivos no relacionados: `useStore.ts`, `useStorePositions.ts`, etc.); cero warnings o errores en `OrdersManagerLayout.tsx`.
- Migración `.jsx` → `.tsx`: confirmada real y sin archivo `.jsx` residual (`git status` solo muestra el `.tsx`; no existe el `.jsx` en el árbol de trabajo). El GAP documenta correctamente esta desviación de path.
- La prop `isMobile` se reutiliza tal como recibía el componente — no se importó `useIsMobileSafe` directamente, respetando la restricción explícita del GAP.
- Segundo consumidor del componente (`src/components/Comercial/CRM/ComercialOrdersManager.tsx`) usa el mismo contrato de props sin cambios necesarios — no hay riesgo de romper el flujo comercial.

### Observaciones para Jose

Implementación sólida y fiel a lo que describe el GAP. Los 4 sub-componentes de skeleton
(`MobileOrdersListSkeleton`, `MobileOrderCardSkeleton`, `DesktopOrdersListSkeleton`,
`DesktopOrderCardSkeleton`) están bien nombrados, colocados junto al componente que sustituyen,
y usan exclusivamente `<Skeleton>` con dimensiones que reflejan la jerarquía real (line-height
del nombre vs metadata vs badge en mobile; 4 alturas distintas en desktop). El diff contra el
`.jsx` original confirma que el resto del componente (rama `production`, split 360px real,
`hasDetail`) no se tocó en absoluto.

Único punto menor (no bloqueante): en el header skeleton desktop siempre se muestran 3
placeholders de icon-button, pero el componente real oculta el primero (`LayoutGrid` / vista
producción) cuando `readOnly` es `true` (`OrdersList/index.tsx:205`). El GAP no exige replicar
esto pixel a pixel ("no es necesario replicar pixel a pixel"), así que no resta puntuación de
forma bloqueante, pero si se usa este layout con `readOnly=true` en algún flujo, el skeleton
mostrará un botón de más durante la carga. Candidato a un ajuste cosmético futuro si se detecta
en un audit visual con captura real.

### Revisión Visual

- Color: solo `<Skeleton>` y clases de layout Tailwind — sin hex/rgb/oklch hardcodeado. ✅
- Loading state: Skeleton implementado en ambas ramas, sin spinners ni texto "Cargando...". ✅
- Layout: mobile columna única, desktop split 360px + panel vacío — coincide con el UI Brief del GAP. ✅
- Paridad con referencia: siluetas de header/búsqueda/tabs/tarjetas reconocibles frente a `OrdersList/index.tsx` y `OrderCard/index.tsx`. ✅
- Sin inline styles, sin `style={{ }}`. ✅

**Veredicto visual:** ✅ APROBADO

### Revisión UX — Light

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-111 — Skeleton lista de pedidos mobile/desktop
Mode: Light (fix de loading state, restaura fidelidad visual sin cambiar flujo)

[x] El cambio es autoexplicativo — el usuario solo ve una carga más fiel, sin nueva interacción
[x] No introduce ninguna decisión nueva del usuario
[x] Consistente con la UI circundante — mismas proporciones/columna que el estado ya cargado
[x] No aplica hover/focus/active — es un estado no interactivo
[x] No hay texto nuevo que revisar (solo bloques de skeleton)

VERDICT: ✅ APROBADO
```

Se aplicó modo Light por tratarse de un fix de un único elemento (loading state), sin flujo
multi-paso ni cambios de navegación o permisos — no requiere `ux-reviewer` como subagente.

### System Learner check

No se invoca a `system-learner`. Los hallazgos de esta auditoría (migración `.jsx`→`.tsx` ya
documentada en el propio GAP, fidelidad de skeleton) están cubiertos por los checklists
existentes y por el patrón ya establecido de auditorías de skeleton (`skeleton-fidelity-auditor`,
`skeleton-implementor`). No hay patrón nuevo ni error recurrente que amerite una entrada nueva
en `project-learnings.md`.

### Estado final de la implementación

`OrdersManagerLayout.tsx` ahora ramifica el estado de carga por `isMobile` (prop recibida del
padre, sin importar `useIsMobileSafe` directamente) y delega en 4 sub-componentes locales que
replican fielmente la silueta de `OrdersList` + `OrderCard` en ambos viewports: header
(back/título/crear en mobile; título/subtítulo/3 botones en desktop), barra de búsqueda, fila
de tabs, y tarjetas con múltiples alturas de bloque que reflejan la jerarquía visual real
(104px mobile / 176px desktop). En desktop se reserva la columna de `360px` durante la carga,
dejando el panel de detalle vacío (cubierto por GAP-112). El resto del componente (rama
`viewMode === 'production'`, split maestro-detalle real, `hasDetail`) permanece sin cambios,
confirmado por diff contra la última versión `.jsx`. `npm run type-check` y `npm run lint`
están limpios para este archivo.
