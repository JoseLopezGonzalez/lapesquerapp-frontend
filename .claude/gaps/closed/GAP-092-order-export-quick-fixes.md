# GAP-092 — OrderExport: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderExport/index.js` (165 líneas),
detectados en modo heurístico:

1. **Sin estado de carga** — no existe ninguna rama `isLoading`/skeleton para
   `exportDocuments`; si esos datos llegan a cargarse de forma asíncrona, el primer render
   podría mostrar un Select/Card vacío sin skeleton.
2. **Sin empty state** para "no hay documentos para exportar" — se asume que la lista de
   documentos siempre tiene contenido.
3. **Posible inconsistencia de proporción de iconos** — iconos de `react-icons`
   (`BsFileEarmarkPdf`/`RiFileExcel2Line`, sin clase de tamaño explícita, líneas 63-64) junto a
   iconos `lucide-react` (`Layers`/`Download`, línea 71, 133) que sí declaran tamaño — verificar
   que ambos rendericen al mismo tamaño visual.

## Solución acordada

- Verificar si `useOrderContext` expone algún estado de carga para `exportDocuments`; si lo
  expone, añadir un `Skeleton` acorde. Si los datos vienen siempre precargados junto con
  `order` (igual que en GAP-082/083), documentar que no aplica y cerrar este punto sin cambio
  de código.
- Añadir un `EmptyState` ligero para el caso "no hay documentos disponibles para exportar".
- Añadir clase de tamaño explícita (`className="size-4"` o equivalente) a los iconos de
  `react-icons` para igualar el tamaño visual con los iconos `lucide-react` del mismo archivo.

## Referencias e inspiración

- `.claude/design-context.md` § Loading States y § Empty States.

## Criterios de aceptación

- [ ] Se confirma (código o comentario) si `exportDocuments` necesita o no un estado de carga
      propio; si lo necesita, se añade `Skeleton`.
- [ ] Existe un `EmptyState` para el caso de lista de documentos vacía.
- [ ] Los iconos de `react-icons` y `lucide-react` en el mismo contexto tienen tamaño visual
      equivalente.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderExport/index.js`

## Restricciones

- No cambiar la lógica de generación/descarga de documentos.

---

## Implementación

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderExport/index.tsx`
- `.claude/gaps/in-progress/GAP-092-order-export-quick-fixes.md`

### Decisiones tomadas durante la implementación

- Se confirmó que `exportDocuments` no tiene carga propia: viene de `useOrderDocuments` como
  configuración síncrona filtrada por rol. Se dejó comentario en código y no se añadió `Skeleton`.
- Se añadió `EmptyState` cuando no hay documentos disponibles para exportar.
- Se añadió `EmptyState` específico para la sección de descargas rápidas si `fastExportDocuments`
  está vacío y se deshabilitó `Descargar todos` en ese caso.
- Se añadieron `className="size-4"` a los iconos de `react-icons` y a los lucide del mismo grupo
  visual para mantener proporción consistente.
- Se sustituyó el `useEffect` que sincronizaba `selectedType` por estado derivado y un handler de
  cambio de documento, eliminando el warning `react-hooks/set-state-in-effect` sin alterar la lógica
  de descarga.

### Desviaciones del plan (si las hay)

- El GAP menciona `index.js`, pero el archivo actual del módulo es
  `src/components/Admin/OrdersManager/Order/OrderExport/index.tsx`.
- No se ejecutó `Skeleton` porque no existe loading específico para `exportDocuments`; el loading
  general del pedido se gestiona en `Order/index.tsx` antes de renderizar las secciones.

- Checks ejecutados:
  - `npx eslint src/components/Admin/OrdersManager/Order/OrderExport/index.tsx`
  - `npm run type-check`

---

## Auditoría

> Auditoría ligera ejecutada por Codex el 2026-07-02.

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos según revisión documental y comprobaciones puntuales
- [x] Sin fetch() directo nuevo detectado en el alcance del GAP
- [x] Sin hardcode de tenant detectado
- [x] Sin archivos .js nuevos creados por el GAP
- [x] Sin any sin justificación detectado en la revisión ligera
- [x] Hooks gigantes no tocados fuera del alcance aprobado
- [x] entitiesConfig.js no tocado fuera del alcance aprobado
- [x] Patrones del workflow de GAP respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

- `npm run type-check` pasa limpio en el estado actual del repositorio.
- Auditoría intencionadamente ligera: se revisaron criterios, implementación documentada y búsquedas puntuales de regresión; no se ejecutó smoke test visual/manual completo con backend real.
- Las observaciones o warnings preexistentes documentados en la implementación quedan fuera de alcance y no bloquean el cierre.

### Estado final de la implementación

GAP aprobado con observaciones y listo para cierre.
