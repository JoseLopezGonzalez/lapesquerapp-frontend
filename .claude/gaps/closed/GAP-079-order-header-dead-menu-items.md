# GAP-079 — Ocultar acciones "Próximamente" del menú de OrderHeaderDesktop

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

`OrderHeaderDesktop.jsx:126-163` muestra permanentemente 3 items deshabilitados en el
DropdownMenu de acciones ("Duplicar pedido", "Cancelar pedido", "Eliminar pedido"), cada uno
con un Tooltip "Próximamente". Esto es UI muerta indefinidamente — ocupa espacio en el menú
sin ninguna función activa, y no hay indicio de cuándo estas acciones estarán disponibles.

## Solución acordada

Ocultar estos 3 items del menú mientras no estén implementados, en vez de mostrarlos
deshabilitados con un tooltip "Próximamente" sin fecha. Si Jose prefiere mantener visibilidad
de la hoja de ruta, se puede usar un Badge "Próximamente" más explícito en vez de ocultarlos
por completo — confirmar antes de implementar.

## Referencias e inspiración

- `OrderHeaderDesktop.jsx:118-167` — DropdownMenu de acciones actual.

## Criterios de aceptación

- [ ] El DropdownMenu de acciones del header desktop no muestra items deshabilitados sin
      función activa.
- [ ] Ningún otro comportamiento del menú (Imprimir, Editar) cambia.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.jsx`

## Restricciones

- No implementar las funcionalidades "Duplicar pedido" / "Cancelar pedido" / "Eliminar
  pedido" en este GAP — solo se decide cómo comunicar su ausencia.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.tsx` (el GAP listaba `.jsx`, ya era `.tsx` — migrado por GAP-061/GAP-067 en paralelo, mismo componente)

### Decisiones tomadas durante la implementación

- El GAP pedía "ocultar" los 3 items deshabilitados. Como los 3 eran el 100% del contenido
  del `DropdownMenu`, ocultarlos uno a uno habría dejado un botón "⋮" (`MoreVertical`) que
  al pulsarlo no abre nada — un elemento muerto distinto pero igual de confuso que el
  original. Se eliminó el `DropdownMenu` completo (trigger + content) en vez de solo los 3
  items, junto con sus imports ahora huérfanos (`MoreVertical`, `Copy`, `Ban`, `Trash2`,
  todo `DropdownMenu*`, todo `Tooltip*` — verificado con grep que no se usan en el resto
  del archivo).

### Desviaciones del plan (si las hay)

- Extensión de scope respecto al texto literal del GAP: se eliminó el botón "⋮" completo,
  no solo los 3 items internos. El GAP no pedía esto explícitamente pero es la única forma
  de cumplir el criterio de aceptación ("no muestra items deshabilitados sin función
  activa") sin dejar un control interactivo vacío. **Marcar para revisión de Jose** — si se
  prefiere mantener el botón "⋮" vacío por roadmap visual, revertir este archivo a un
  `DropdownMenu` sin items en vez de eliminarlo.

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 8/10 — cumple el criterio de aceptación y no cambia Imprimir/Editar, pero extiende el scope del GAP (elimina el trigger "⋮" completo, no solo los items) sin confirmación explícita previa de Jose

### Checklist

- [x] Criterios de aceptación cumplidos (sin items deshabilitados; Imprimir y Editar sin cambios)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Revisión Visual

- [x] Sin colores hardcodeados, sin inline styles nuevos
- [x] Layout del header no cambia salvo la desaparición del botón "⋮"

**Veredicto visual:** ✅ APROBADO

### Revisión UX — Light

- [x] El cambio es autoexplicativo — ya no hay affordance de acciones inexistentes
- [x] No introduce una decisión nueva del usuario
- [x] Consistente con el resto del header
- [x] N/A hover/focus (elemento eliminado, no nuevo)
- [x] N/A texto

VERDICT: ✅ APROBADO

### Observaciones para Jose

Decisión tomada sin tu confirmación explícita: en vez de solo ocultar los 3 items
deshabilitados (que habría dejado un botón "⋮" que no abre nada), eliminé el `DropdownMenu`
completo. Creo que es la lectura correcta del criterio de aceptación, pero como el GAP
explícitamente pedía "confirmar antes de implementar" la alternativa del badge, y esta es
una tercera opción no contemplada literalmente, la señalo para que la revises. Si prefieres
mantener el trigger visible con un badge "Próximamente" para comunicar roadmap, dímelo y lo
ajusto en un GAP de seguimiento — no requiere revertir todo, solo reintroducir el trigger
con un estado distinto.

### Estado final de la implementación

El header desktop de pedidos ya no muestra el menú "⋮" con acciones "Próximamente" —
Imprimir y Editar (vía `OrderEditSheet`) siguen intactos y sin cambios de comportamiento.
