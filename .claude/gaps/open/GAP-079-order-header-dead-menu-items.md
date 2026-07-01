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
