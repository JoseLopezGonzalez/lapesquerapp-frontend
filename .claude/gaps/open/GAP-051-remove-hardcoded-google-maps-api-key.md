# GAP-051 — Eliminar API key de Google Maps hardcodeada como fallback

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Dos archivos del módulo Orders Manager hardcodean una clave real de Google Maps como valor de fallback cuando `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` no está definida:

- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx` (línea 81): `'AIzaSyBh1lKDP8noxYHU6dXDs3Yjqyg_PpC5Ks4'`
- `src/components/Admin/OrdersManager/Order/OrderMap/index.js` (línea 14): misma clave

Aunque `NEXT_PUBLIC_*` variables son públicas por diseño (se incluyen en el bundle de cliente), tener la clave literal en el repositorio la expone permanentemente en git history e impide rotarla sin un nuevo deploy. Si la clave se rota, el código rompe hasta que se actualice y despliega.

## Solución acordada

Eliminar el string hardcodeado de ambos archivos. Si `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` no está definida, el componente de mapa no debe renderizar el iframe — mostrar en su lugar el placeholder existente de "no hay dirección de envío" o un mensaje genérico de "mapa no disponible".

No añadir una clave alternativa ni un fallback diferente — la solución es no renderizar sin clave válida.

Aprovechar el toque de `OrderMap/index.js` para migrarlo a `OrderMap/index.tsx`.

## Referencias e inspiración

- CLAUDE.md §3 — regla de migración JS→TS al tocar un archivo legacy
- Patrón existente de "no hay dirección de envío" en `OrderDetails/index.tsx` — ya existe un estado vacío para dirección ausente

## Criterios de aceptación

- [ ] `OrderDetails/index.tsx`: la variable que construye `mapUrl` no contiene ningún string hardcodeado de API key
- [ ] `OrderMap/index.js` (→ `index.tsx`): sin API key hardcodeada
- [ ] Cuando `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` no está definida, el mapa no renderiza y muestra un placeholder
- [ ] Cuando la env var sí está definida, el mapa funciona exactamente igual que antes
- [ ] `OrderMap/index.js` migrado a `OrderMap/index.tsx` sin errores de TypeScript

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderMap/index.js` → `index.tsx`

## Restricciones

- No cambiar la lógica de construcción de la URL del mapa más allá de eliminar el fallback hardcodeado
- No tocar otros archivos del módulo
- No añadir una nueva clave o fallback de cualquier tipo

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
