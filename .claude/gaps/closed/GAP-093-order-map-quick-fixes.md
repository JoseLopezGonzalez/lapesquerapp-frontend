# GAP-093 — OrderMap: quick fixes de diseño

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** closed
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

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderMap/index.tsx`
- `.claude/gaps/in-progress/GAP-093-order-map-quick-fixes.md`

### Decisiones tomadas durante la implementación

- Se sustituyó el texto plano de ausencia de dirección por `EmptyState` con icono `MapPin`, título
  y descripción.
- Se añadió `Skeleton` superpuesto mientras el iframe de Google Maps carga.
- Se guardó la URL cargada (`loadedMapSrc`) en vez de usar un `useEffect`, de modo que si cambia la
  dirección o el origen el skeleton vuelve a mostrarse hasta el nuevo `onLoad`.
- Se mantuvo el proveedor actual de mapas mediante iframe de Google Maps, respetando la restricción
  del GAP.
- Si hay dirección pero falta `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, se muestra `EmptyState` específico
  de mapa no disponible.

### Desviaciones del plan (si las hay)

- Ninguna.

- Checks ejecutados:
  - `npx eslint src/components/Admin/OrdersManager/Order/OrderMap/index.tsx`
  - `npm run type-check`

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
