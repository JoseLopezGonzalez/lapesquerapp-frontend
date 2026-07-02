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
