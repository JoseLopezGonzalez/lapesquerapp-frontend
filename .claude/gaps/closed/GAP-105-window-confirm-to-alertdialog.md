# GAP-105 — Reemplazar window.confirm por AlertDialog en confirmaciones destructivas

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global (EntityClient) / Maquiladores-Producción / Repartidores
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía /audit-design consistency — familia `confirmaciones`)

---

## Contexto y problema

`/audit-design consistency` encontró que 23 archivos del proyecto confirman acciones
destructivas correctamente con `AlertDialog` (patrón documentado en
`design-context.md` § Modals: "Destructive confirmation: always AlertDialog, not
Dialog", y UX Principle #1: "Destructive actions always require confirmation" vía
AlertDialog, nunca `onClick` directo). 5 archivos usan en su lugar el `window.confirm()`
nativo del navegador:

- `src/components/Admin/Entity/EntityClient/index.js` — 4 call sites (líneas 235, 534,
  587, 780): borrado individual, borrado múltiple, acción global custom, acción de fila
  custom con texto de confirmación dinámico (plantillas tipo `{{name}}`)
- `src/components/Admin/Productions/ProductionCostsManager.jsx:211`
- `src/components/Admin/Productions/CostCatalogManager.jsx:161`
- `src/components/Admin/Productions/ProductionRecordImagesManager.jsx:114`
- `src/components/Admin/FieldOperators/FieldOperatorForm.jsx:134`

El caso más grave es `EntityClient/index.js`: es el componente de referencia
documentado en `design-context.md` § Reference Views para todas las vistas de listado
genéricas (`/admin/[entity]`). Cualquier entidad que use el path genérico hereda hoy un
popup nativo del navegador (sin estilos, sin dark mode, bloqueante del hilo JS) en vez
del `AlertDialog` de la app.

## Solución acordada

Reemplazar `window.confirm()` / `confirm()` por `AlertDialog` en los 5 archivos.

**En `EntityClient/index.js`:** dado que 3 de los 4 call sites usan texto de
confirmación dinámico en runtime (no fijo en el JSX), se introduce un patrón de
"confirm state" local: un único `AlertDialog` renderizado una vez en el árbol,
controlado por un estado local `{ open, title, description, onConfirm }`. Cada uno de
los 4 handlers (`handleDelete`, `handleSelectedRowsDelete`, `handleGlobalAction`,
la acción de fila con `confirmationText`) setea ese estado en vez de llamar a
`window.confirm`; el botón de confirmar del `AlertDialog` ejecuta `onConfirm` y cierra
el diálogo.

**En los otros 4 archivos** (un único call site cada uno): mismo patrón de "confirm
state" local, aplicado individualmente en cada componente — no se crea un hook
compartido entre archivos (fuera de alcance de este GAP).

## Referencias e inspiración

- Patrón `AlertDialog` documentado en `design-context.md` § Modals → Destructive
  confirmation pattern
- Ejemplo real: `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.jsx`
- Ejemplo real: `src/components/Admin/Pallets/PalletDialog/index.tsx`

## Criterios de aceptación

- [ ] No queda ningún `window.confirm` ni `confirm(` en los 5 archivos listados
- [ ] Cada acción confirmable abre un `AlertDialog` con título+descripción equivalentes
      al mensaje original de `confirm()` (o una redacción más específica siguiendo el
      patrón de `design-context.md` § Message Quality: consecuencia concreta, no
      "¿Estás seguro?" genérico, cuando el implementador lo considere una mejora menor
      sin cambiar el criterio de negocio)
- [ ] En `EntityClient/index.js`, los 4 call sites comparten una única instancia de
      `AlertDialog` controlada por un estado local de confirmación
- [ ] Cancelar el diálogo aborta la acción exactamente igual que rechazar el
      `confirm()` nativo (mismo comportamiento, solo cambia la presentación)
- [ ] El diálogo respeta dark mode (a diferencia del `confirm()` nativo)
- [ ] `npm run type-check` limpio

## Archivos a crear o modificar

- `src/components/Admin/Entity/EntityClient/index.js`
- `src/components/Admin/Productions/ProductionCostsManager.jsx`
- `src/components/Admin/Productions/CostCatalogManager.jsx`
- `src/components/Admin/Productions/ProductionRecordImagesManager.jsx`
- `src/components/Admin/FieldOperators/FieldOperatorForm.jsx`

## Restricciones

- No tocar la lógica de negocio de las acciones (llamadas a `entityService`,
  invalidación de queries, etc.) — solo el mecanismo de confirmación
- No crear un hook compartido nuevo entre archivos — fuera de alcance de este GAP
- No tocar `src/configs/entitiesConfig.js`
- No modificar el comportamiento de acciones no destructivas

---

## Implementación

Implementado por Codex el 2026-07-02.

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/Entity/EntityClient/index.js`
- `src/components/Admin/Productions/ProductionCostsManager.jsx`
- `src/components/Admin/Productions/CostCatalogManager.jsx`
- `src/components/Admin/Productions/ProductionRecordImagesManager.jsx`
- `src/components/Admin/FieldOperators/FieldOperatorForm.jsx`
- `.claude/gaps/in-progress/GAP-105-window-confirm-to-alertdialog.md`

### Decisiones tomadas durante la implementación

- `EntityClient` usa una única instancia de `AlertDialog` controlada por estado local para las cuatro confirmaciones dinámicas.
- La confirmación de `EntityClient` se expone a los handlers como una promesa local para mantener intacta la secuencia original de cada acción tras confirmar.
- Los otros cuatro componentes usan estado local específico para el elemento pendiente de borrado y renderizan su propio `AlertDialog`.
- Las descripciones mantienen el mensaje original y añaden la consecuencia "Esta acción no se puede deshacer".

### Desviaciones del plan (si las hay)

- No hubo desviaciones de alcance.
- Se mantuvieron warnings existentes de ESLint no relacionados con el cambio.

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
