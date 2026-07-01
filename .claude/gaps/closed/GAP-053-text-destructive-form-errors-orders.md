# GAP-053 — Usar token semántico text-destructive en errores de formulario del pedido

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`CreateOrderForm/index.tsx` usa `text-red-500` en los mensajes de error de campo en lugar del token semántico `text-destructive`. El problema afecta a:

- Errores de campos del formulario principal (línea ~565)
- Errores del field array de `plannedProducts` (líneas ~655, 660, 665, 670, 675)

`text-red-500` es un color Tailwind hardcodeado. `text-destructive` es el token semántico del design system del proyecto que se adapta automáticamente al tema (light/dark) y a posibles futuros cambios de la paleta de colores de error.

La regla del proyecto (`design-context.md §4 Error States` y `components.md`) establece `text-red-400 text-xs pt-1` como patrón de error de campo. Sin embargo, dado que el proyecto usa `--destructive` como CSS var semántica, `text-destructive` es la expresión más correcta de esta intención.

Detectado en auditoría desktop `/audit-desktop orders manager` 2026-07-01.

## Solución acordada

Reemplazar todas las ocurrencias de `text-red-500` en mensajes de error de campo en `CreateOrderForm/index.tsx` por `text-destructive`. Mantener el resto de las clases (`text-xs`, `pt-1`, etc.) sin cambios.

## Referencias e inspiración

- `design-context.md §4 Error States` — `text-red-400 text-xs pt-1` (patrón documentado)
- `design-context.md §1 Semantic — --destructive` — token semántico de error
- `components.md §Manejo de errores en componentes` — patrón de error de campo

## Criterios de aceptación

- [ ] Todas las ocurrencias de `className="... text-red-500"` en mensajes de error de `CreateOrderForm/index.tsx` reemplazadas por `text-destructive`
- [ ] No hay regresión visual en los estados de error del formulario
- [ ] No hay errores de TypeScript introducidos

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx`

## Restricciones

- Solo cambiar las clases de color en los mensajes de error — no tocar lógica de validación ni estructura del formulario
- No modificar `CreateOrderFormMobile.jsx` en este GAP (auditar por separado si tiene el mismo problema)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx` — 6 ocurrencias de `text-red-500` → `text-destructive` (líneas 565, 655, 660, 665, 670, 675)

### Decisiones tomadas durante la implementación

Replace-all limpio, todas las ocurrencias eran exclusivamente en `<p>` de error de campo. No hay otras instancias de `text-red-500` en el archivo.

### Desviaciones del plan (si las hay)

Ninguna.

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
