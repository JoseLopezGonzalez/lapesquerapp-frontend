# GAP-047 — Deshabilitar acciones stub en OrderHeaderDesktop

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`OrderHeaderDesktop.jsx` contiene tres `DropdownMenuItem` en el menú de acciones del pedido — "Duplicar pedido", "Cancelar pedido" y "Eliminar pedido" — que no tienen `onClick` handler. El usuario los pulsa y no ocurre nada. No hay feedback visual ni toast.

El caso de "Eliminar pedido" es especialmente grave: está marcado con `variant="destructive"` (texto rojo, apariencia de acción peligrosa) pero no hace absolutamente nada. Esto erosiona la confianza del usuario y puede confundirle creyendo que su acción falló silenciosamente.

Detectado en auditoría desktop `/audit-desktop orders manager` 2026-07-01.

## Solución acordada

Deshabilitar los tres items con el atributo `disabled` de `DropdownMenuItem` hasta que las funcionalidades estén implementadas. Añadir un `<TooltipProvider>` + `<Tooltip>` alrededor de cada item deshabilitado con el texto "Próximamente" para que el usuario entienda que la función existe pero no está lista.

No implementar la lógica real de duplicar, cancelar ni eliminar en este GAP — eso requiere contratos de API definidos por separado.

## Referencias e inspiración

- `design-context.md §4` — Destructive actions always require AlertDialog (para cuando se implemente la lógica real)
- `design-context.md §4 Action Buttons` — Hierarchy y placement

## Criterios de aceptación

- [ ] Los tres `DropdownMenuItem` tienen `disabled` prop
- [ ] Al hacer hover sobre un item deshabilitado, se muestra un Tooltip con "Próximamente"
- [ ] No hay regresión visual en los items habilitados del mismo DropdownMenu
- [ ] No se implementa lógica de negocio (duplicar / cancelar / eliminar) en este GAP

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.jsx`

## Restricciones

- No añadir lógica de duplicar, cancelar ni eliminar pedido
- No tocar `OrderHeaderMobile.jsx` ni ningún otro archivo del módulo
- No modificar el DropdownMenu ni los items ya funcionales (editar, exportar, etc.)

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
