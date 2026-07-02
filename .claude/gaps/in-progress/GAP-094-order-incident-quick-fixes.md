# GAP-094 — OrderIncident: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** in-progress
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderIncident/index.js` (328 líneas),
detectados en modo heurístico:

1. **Color de badge de estado** — cubierto por GAP-088, no duplicar aquí.
2. **Bloque de badge duplicado casi verbatim** entre la región móvil (líneas 116-132) y la
   cabecera desktop `sm:hidden` (líneas 288-305) — consolidar en el mismo cambio que GAP-088,
   ya que ambos archivos se tocan por el mismo motivo.
3. **`<Label>` usado como caption estático** (no asociado a un input) para "Fecha de
   creación", "Descripción", etc. (líneas 138,142,152,156,163) — semánticamente `Label` implica
   asociación con un campo de formulario; sustituir por `text-xs text-muted-foreground` en un
   `<span>`/`<p>`, que es el patrón documentado para labels de metadato.
4. **Bloque de código muerto/confuso** — un bloque condicional de badge aparece como hijo
   `sm:hidden` dentro de un componente cuyo padre ya renderiza solo en desktop (`isMobile ===
   false`) — líneas 287-307 — probablemente resto de un refactor anterior; verificar si el
   bloque es alcanzable alguna vez y eliminarlo si no lo es.

## Solución acordada

- Consolidar la lógica de color/label de badge junto con el fix de GAP-088 (mismo archivo,
  mismo commit si es posible).
- Sustituir los `<Label>` usados como caption estático por `<span>`/`<p>` con
  `text-xs text-muted-foreground`.
- Investigar y, si se confirma inalcanzable, eliminar el bloque `sm:hidden` muerto de líneas
  287-307.

## Referencias e inspiración

- GAP-088 — normalización de badges (dependencia).
- `.claude/design-context.md` § Typography — patrón de label de metadato.

## Criterios de aceptación

- [ ] La lógica de color/label de badge no está duplicada dentro del archivo (ver GAP-088).
- [ ] Ningún `<Label>` se usa como caption estático sin input asociado.
- [ ] El bloque de código muerto identificado se elimina o se justifica por qué es alcanzable.
- [ ] Ningún flujo de creación/edición de incidencia cambia de comportamiento.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderIncident/index.js`

## Restricciones

- Coordinar con GAP-088 si se implementan en el mismo PR (mismo archivo).
- No cambiar la lógica de negocio de incidencias.

---

## Implementación

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx`
- `.claude/gaps/in-progress/GAP-094-order-incident-quick-fixes.md`

### Decisiones tomadas durante la implementación

- La consolidación de badge indicada por el criterio 1 ya venía aplicada por `GAP-088` mediante
  `IncidentStatusBadge`; no se duplicó ese trabajo.
- Se sustituyeron los `Label` usados como captions de metadato por `<p className="text-muted-foreground text-xs">`.
- Se mantuvieron los `Label htmlFor` asociados a inputs/selects de formulario.
- Se eliminó el bloque `sm:hidden` de la cabecera desktop. Es inalcanzable en el flujo esperado:
  `useIsMobileSafe` envía `<768px` a la rama móvil, mientras `sm:hidden` solo sería visible por
  debajo de `640px`.

### Desviaciones del plan (si las hay)

- El GAP menciona `index.js`, pero el archivo actual del módulo es
  `src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx`.
- El trabajo de badge dependiente se tomó como ya cubierto por `GAP-088`, que está en
  `in-progress` y ya modificó este mismo archivo.

- Checks ejecutados:
  - `rg -n "<Label>|sm:hidden|<Label\\s+htmlFor" src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx`
  - `npx eslint src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx`
  - `npm run type-check`

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
