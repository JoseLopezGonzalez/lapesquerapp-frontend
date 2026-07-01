# GAP-092 — OrderExport: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
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

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

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
