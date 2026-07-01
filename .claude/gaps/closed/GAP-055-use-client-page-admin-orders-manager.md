# GAP-055 — Eliminar 'use client' de page.js admin orders-manager

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`src/app/admin/orders-manager/page.js` tiene `'use client'` en la primera línea. Esto convierte
toda la ruta del gestor de pedidos en un Client Component, desactivando las optimizaciones RSC
de Next.js App Router para esta ruta. Es el anti-patrón PL-014 documentado en project-learnings.

El patrón correcto del proyecto (visible en `src/app/comercial/orders-manager/page.tsx`) es:
- `page.tsx` = Server Component sin directiva → importa el PageClient
- `XxxPageClient.tsx` = Client Component con `'use client'` → toda la lógica interactiva

Detectado en la auditoría de calidad del módulo orders manager (FND-001, audit 2026-07-01).

## Solución acordada

1. Crear `src/components/Admin/OrdersManager/OrdersManagerPageClient.tsx` — Client Component
   con `'use client'`, que contendrá el `OrdersManagerOptionsProvider` + `<OrdersManager />`
   que actualmente están inline en `page.js`

2. Renombrar `src/app/admin/orders-manager/page.js` → `page.tsx` (cumple regla JS→TS)

3. El nuevo `page.tsx` queda como Server Component puro: sin directiva, solo importa
   `OrdersManagerPageClient` y lo renderiza

## Referencias e inspiración

- PL-014 (project-learnings.md): anti-patrón exacto con la referencia de corrección
- `src/app/comercial/orders-manager/page.tsx` — referencia correcta en el mismo módulo
- GAP-046 y GAP-050 — precedentes de la misma corrección en otras rutas

## Criterios de aceptación

- [ ] `src/app/admin/orders-manager/page.tsx` existe (renombrado desde `.js`) y NO tiene `'use client'`
- [ ] `src/app/admin/orders-manager/page.js` ya no existe
- [ ] `src/components/Admin/OrdersManager/OrdersManagerPageClient.tsx` existe con `'use client'`
- [ ] `OrdersManagerPageClient` contiene el `OrdersManagerOptionsProvider` y `<OrdersManager />`
- [ ] El comportamiento de la ruta `/admin/orders-manager` no cambia para el usuario
- [ ] `src/app/admin/orders-manager/loading.js` → renombrar a `loading.tsx` si se toca (regla JS→TS)
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Crear:**
- `src/components/Admin/OrdersManager/OrdersManagerPageClient.tsx`

**Renombrar/modificar:**
- `src/app/admin/orders-manager/page.js` → `page.tsx` (quitar `'use client'`, importar PageClient)

**No tocar:**
- `src/components/Admin/OrdersManager/index.js` — el componente existente no cambia
- `src/context/gestor-options/OrdersManagerOptionsContext.jsx` — el provider no cambia

## Restricciones

- No modificar la lógica de `OrdersManager` ni de `OrdersManagerOptionsContext`
- No refactorizar `index.js` del componente en este GAP
- `loading.js` solo se renombra si el implementador toca ese archivo; no es obligatorio

---

## Implementación

### Archivos creados

- `src/components/Admin/OrdersManager/OrdersManagerPageClient.tsx` — Client Component con `'use client'` que envuelve `OrdersManagerOptionsProvider` y `OrdersManager`

### Archivos modificados

- `src/app/admin/orders-manager/page.tsx` — simplificado a Server Component puro que solo importa y renderiza `OrdersManagerPageClient` (antes del GAP-050 se había hecho una implementación inline; este GAP añade el `PageClient` correcto)

### Decisiones tomadas durante la implementación

GAP-050 ya había creado `page.tsx` como server component pero con los providers inline (funciona pero no sigue el patrón canónico). GAP-055 completa el patrón extrayendo el contenido a `OrdersManagerPageClient.tsx`.

### Desviaciones del plan (si las hay)

`loading.js` no se tocó (no es obligatorio según las restricciones del GAP).

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
