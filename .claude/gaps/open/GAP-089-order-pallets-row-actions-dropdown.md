# GAP-089 — Consolidar acciones de fila de OrderPalletTableRow en DropdownMenu

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Stock
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

`OrderPalletTableRow.jsx:67-177` muestra 5 botones de icono sueltos (Printer, Edit, Copy,
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

- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.jsx`

## Restricciones

- No modificar la lógica de negocio de ninguna de las 5 acciones — solo su presentación.
- Verificar primero si existe confirmación de borrado aguas arriba (`index.js:220-231`) antes
  de asumir que hace falta añadir un `AlertDialog` nuevo.

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
