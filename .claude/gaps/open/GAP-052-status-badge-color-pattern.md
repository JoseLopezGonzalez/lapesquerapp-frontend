# GAP-052 — Alinear StatusBadge al patrón de color /15 documentado

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`StatusBadge.jsx` — el componente compartido de badge de estado del módulo Orders Manager — usa clases de color `bg-green-50 dark:bg-green-950`, `bg-orange-50 dark:bg-orange-950`, `bg-red-50 dark:bg-red-950` (escala `-50`/`-950`).

El patrón canónico documentado en `design-context.md §3 Status Tokens` es `bg-green-500/15`, `bg-orange-500/15`, `bg-red-500/15` — con opacidad `/15` que adapta automáticamente en dark mode sin necesitar una clase `dark:` separada.

Esta discrepancia crea inconsistencia visual entre:
- El desktop `OrderCard` (usa `StatusBadge` → patrón `-50`)
- El mobile `OrderCard` (usa inline badges → patrón `/15` correcto)

Los dos renders del mismo pedido muestran colores de badge ligeramente distintos.

Detectado en auditoría desktop `/audit-desktop orders manager` 2026-07-01.

## Solución acordada

Actualizar el mapa `colorClasses` en `StatusBadge.jsx` para usar el patrón `/15`:
- `bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200` → `bg-green-500/15 text-green-700 dark:text-green-300`
- `bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-200` → `bg-orange-500/15 text-orange-700 dark:text-orange-300`
- `bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200` → `bg-red-500/15 text-red-700 dark:text-red-300`
- Aplicar el mismo criterio a cualquier otro estado definido en el mapa

Renombrar `StatusBadge.jsx` → `StatusBadge.tsx` en el mismo commit.

## Referencias e inspiración

- `design-context.md §3 Status Tokens` — patrón canónico documentado
- `OrderCard/index.tsx` líneas 116–134 — implementación correcta de referencia (inline badges mobile)

## Criterios de aceptación

- [ ] `StatusBadge.tsx` usa el patrón `bg-*-500/15` para todos los estados de color
- [ ] No hay clases `dark:bg-*-950` residuales
- [ ] El badge de estado en el desktop `OrderCard` es visualmente coherente con el inline badge del mobile `OrderCard`
- [ ] No hay errores de TypeScript en `StatusBadge.tsx`
- [ ] No hay regresión en ningún uso de `StatusBadge` en el módulo

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/StatusBadge.jsx` → `StatusBadge.tsx`

## Restricciones

- No cambiar la API del componente (props, tipos exportados)
- No modificar los archivos que importan `StatusBadge` — el rename de extensión no cambia el import path en JSX
- No añadir nuevos estados de color en este GAP

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
