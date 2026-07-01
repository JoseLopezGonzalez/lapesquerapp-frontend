# GAP-093 — OrderMap: quick fixes de diseño

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderMap/index.tsx` (44 líneas),
detectados en modo heurístico:

1. **[Bloqueante] Empty state de texto plano** — cuando no hay dirección de envío, se muestra
   un `<div>` con texto ("Sin dirección de envío", líneas 30-32) en vez del patrón
   `EmptyState` documentado (icono + título + descripción).
2. **Sin estado de carga** — el iframe de mapa no tiene ningún skeleton/placeholder mientras
   carga (sin `onLoad`, sin wrapper `Skeleton`).
3. **Inconsistencia arquitectónica** — el archivo usa un iframe embed de Google Maps (líneas
   9, 21-28) en vez de Mapbox GL, que es la librería de mapas documentada como estándar del
   proyecto (`Mapbox GL 3.20.0` en el stack de CLAUDE.md). Esto excede el alcance puramente
   visual — se documenta aquí pero **la decisión de migrar a Mapbox GL o mantener el iframe de
   Google Maps requiere confirmación explícita de Jose**, dado el esfuerzo de una migración de
   proveedor de mapas frente a un simple ajuste de chrome visual.

## Solución acordada

- Sustituir el `<div>` de texto plano por `EmptyState` (icono de mapa/ubicación + título +
  descripción).
- Añadir un `Skeleton` (`h-full w-full`) mientras el iframe no ha terminado de cargar, usando
  el evento `onLoad` del iframe para ocultarlo.
- El punto 3 (Google Maps vs Mapbox) **no se implementa en este GAP** — queda documentado como
  nota para una decisión de Jose en otra sesión; no forma parte de los criterios de aceptación.

## Referencias e inspiración

- `.claude/design-context.md` § Empty States y § Loading States.

## Criterios de aceptación

- [ ] La ausencia de dirección de envío muestra `EmptyState` (icono + título + descripción),
      no un `<div>` de texto plano.
- [ ] El iframe de mapa muestra un `Skeleton` mientras carga, oculto tras `onLoad`.
- [ ] No se toca el proveedor de mapas (Google Maps iframe) en este GAP.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderMap/index.tsx`

## Restricciones

- No migrar a Mapbox GL en este GAP — requiere decisión explícita separada de Jose.

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
