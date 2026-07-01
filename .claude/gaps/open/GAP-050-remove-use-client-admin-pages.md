# GAP-050 — Eliminar 'use client' de page files admin orders + migrar a .tsx

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Dos archivos de page del módulo admin de pedidos tienen `'use client'` en la primera línea:

- `src/app/admin/orders-manager/page.js`
- `src/app/admin/orders/create/page.js`

GAP-046 ya corrigió el mismo anti-patrón en el módulo `comercial/` (PL-014), pero no auditó los equivalentes en `admin/`. Añadir `'use client'` a un `page.js` de Next.js App Router convierte toda la ruta en Client Component, impidiendo optimizaciones RSC y violando el patrón canónico del proyecto (Server Component page → importa `XxxPageClient`).

Los componentes internos que renderizan (`OrdersManager`, `CreateOrderForm`) ya son `'use client'` — no hay cambio funcional, solo de patrón arquitectónico.

Detectado en auditoría desktop `/audit-desktop orders manager` 2026-07-01.

## Solución acordada

1. Eliminar `'use client'` de ambos archivos page.
2. Renombrar de `.js` a `.tsx` (regla CLAUDE.md §3: al tocar un .js legacy, migrarlo en el mismo commit).
3. Añadir tipado TypeScript mínimo a los props de page si procede (`{ params, searchParams }`).

No hay cambio en la lógica de renderizado — los page files solo importan y renderizan el componente correspondiente.

## Referencias e inspiración

- PL-014 — anti-patrón documentado
- GAP-046 — misma corrección en módulo comercial
- `src/app/admin/orders/[id]/page.js` — mismo módulo, puede tener el mismo problema (verificar durante implementación)

## Criterios de aceptación

- [ ] `src/app/admin/orders-manager/page.js` renombrado a `page.tsx` sin directiva `'use client'`
- [ ] `src/app/admin/orders/create/page.js` renombrado a `page.tsx` sin directiva `'use client'`
- [ ] Ambos archivos compilan sin errores de TypeScript
- [ ] El implementador verifica `src/app/admin/orders/[id]/page.js` y corrige si tiene el mismo problema
- [ ] No hay regresión en el routing ni en la carga de las vistas correspondientes

## Archivos a crear o modificar

- `src/app/admin/orders-manager/page.js` → `page.tsx`
- `src/app/admin/orders/create/page.js` → `page.tsx`
- `src/app/admin/orders/[id]/page.js` → `page.tsx` (verificar y corregir si aplica)

## Restricciones

- No modificar los componentes que renderizan los pages (`OrdersManager`, `CreateOrderForm`)
- No añadir lógica de fetching de datos en los page files
- No tocar `src/app/comercial/` — ya corregido en GAP-046

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
