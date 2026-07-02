# GAP-089 — Consolidar acciones de fila de OrderPalletTableRow en DropdownMenu

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Stock
- **Prioridad:** Media
- **Estado:** in-progress
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

`OrderPalletTableRow.tsx:67-177` muestra 5 botones de icono sueltos (Printer, Edit, Copy,
Unlink, Trash2), cada uno con su propio Tooltip, en vez del patrón documentado en
`.claude/design-context.md` § Action Buttons: "Dropdown para 3+ acciones" usando
`DropdownMenu` + trigger `EllipsisVertical`. Esto ocupa más espacio horizontal del necesario en
la fila de tabla y diverge del patrón ya establecido en el resto del proyecto (ver
`EntityBody` como referencia).

## Solución acordada

Consolidar los 5 botones en un único trigger `EllipsisVertical` con `DropdownMenu`, siguiendo
el patrón documentado (`DropdownMenuItem` por acción, separador antes de la acción destructiva,
`variant="destructive"` en el item de eliminar). La confirmación de eliminación (si ya existe
vía `AlertDialog`/`ConfirmActionDialog` en el flujo actual, según lo observado en
`index.js:220-231`) debe mantenerse intacta — solo cambia el punto de entrada del menú.

## Referencias e inspiración

- `.claude/design-context.md` § Action Buttons — patrón `DropdownMenu` con `EllipsisVertical`.
- Cualquier tabla de `EntityBody` en el proyecto que ya siga este patrón, como referencia de
  implementación.

## Criterios de aceptación

- [ ] Cada fila de `OrderPalletTableRow` muestra un único trigger de acciones
      (`EllipsisVertical`) en vez de 5 botones sueltos.
- [ ] Las 5 acciones (Printer, Edit, Copy, Unlink, Trash2) siguen disponibles dentro del
      `DropdownMenu`, con la acción destructiva (`Trash2`) separada visualmente del resto.
- [ ] La confirmación antes de eliminar (si existe) se mantiene sin cambios de comportamiento.
- [ ] No se pierde ninguna funcionalidad existente de las 5 acciones.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.tsx`

## Restricciones

- No modificar la lógica de negocio de ninguna de las 5 acciones — solo su presentación.
- Verificar primero si existe confirmación de borrado aguas arriba (`index.js:220-231`) antes
  de asumir que hace falta añadir un `AlertDialog` nuevo.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.tsx`

### Decisiones tomadas durante la implementación

- Se sustituyeron los botones sueltos de acción por un único `DropdownMenu` con trigger
  `EllipsisVertical`.
- Las acciones mantienen los mismos callbacks: etiqueta de expedición, editar/ver, clonar,
  desvincular y eliminar.
- La acción destructiva `Eliminar palet` usa `DropdownMenuItem variant="destructive"` y queda
  separada visualmente con `DropdownMenuSeparator`.
- Se conservaron los mismos guards: impresión solo si `canPrintExpeditionLabels` y callback,
  acciones de edición ocultas en `readOnly`, clonar/eliminar deshabilitados para palets de
  recepción y desvincular deshabilitado durante `isUnlinking`.
- No se añadió ningún `AlertDialog` nuevo; la confirmación aguas arriba se mantiene intacta.

### Desviaciones del plan (si las hay)

- El GAP mencionaba `OrderPalletTableRow.jsx`, pero el archivo ya está migrado a
  `OrderPalletTableRow.tsx`; se implementó sobre el archivo actual.

### Checks ejecutados

- `npm run type-check` — OK.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.tsx` — OK.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.tsx .claude/gaps/in-progress/GAP-089-order-pallets-row-actions-dropdown.md` — OK.
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
