---
id: GAP-V2-190
title: Migrar FieldDashboard.jsx a TypeScript (.tsx)
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-190 — `FieldDashboard.jsx` sigue en JavaScript, candidato de migración

## Problema

`src/components/Field/FieldDashboard.jsx` (215 líneas) es el único componente raíz de
dashboard-home para el rol `repartidor_autoventa` y sigue en `.jsx`, violando la Regla de
oro 3 de `CLAUDE.md` ("nunca crear archivos `.js` nuevos... migrar al tocar cualquier
archivo legacy") y la deuda técnica documentada. Todo lo que consume ya está tipado:
`useFieldOrders` (`src/hooks/useFieldOrders.ts`), `useFieldRoutes`
(`src/hooks/useFieldRoutes.ts`) y los tipos de dominio en `src/types/field.ts`
(`FieldOrder`, `DeliveryRoute`, `RouteStop`).

**Evaluación de complejidad:** LOW — sin generics, sin estado local complejo (solo
`useState(() => getGreeting())`), consumidor puro de hooks ya tipados. No requiere crear
tipos nuevos aparte de tipar el retorno de `getGreeting()`/`getTodayDateString()` como
`string`.

## Objetivo

`FieldDashboard.tsx` sin `any` implícito, tipando explícitamente:
- El retorno de `todayRoute` (`DeliveryRoute | null`) y `orders` (`FieldOrder[]`).
- Los callbacks de `.filter()` (`order: FieldOrder`, `stop: RouteStop`).

## Contexto

No depende de otros GAPs de este lote. Puede migrarse de forma aislada; si se decide
también abordar GAP-V2-192 (extracción de la lógica de conteo) en el mismo PR, migrar
primero a `.tsx` y extraer después, para no mezclar cambio de tipado con cambio de
comportamiento en el mismo diff (protocolo de `CLAUDE.md`).

## Solución propuesta

1. Ejecutar `npm run type-check 2>&1` como baseline.
2. Renombrar `FieldDashboard.jsx` → `FieldDashboard.tsx`.
3. Tipar `todayRoute`, `orders`, y los parámetros de `.filter()` contra
   `DeliveryRoute`/`FieldOrder`/`RouteStop` de `src/types/field.ts`.
4. `npm run type-check 2>&1` inmediato y resolver todos los errores antes de continuar.

## Criterios de aceptación

- [ ] El archivo es `.tsx` sin `any` implícito.
- [ ] `npm run type-check` limpio.
- [ ] `npm run lint` limpio.

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
# Manual: /field — confirmar que el dashboard renderiza igual (ruta de hoy, pedidos
# operativos, actividad reciente) tras la migración.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-191 (migración de `labels.js`), GAP-V2-192 (extracción de
  lógica de conteo), GAP-V2-020/GAP-V2-073 (mismo patrón de migración en otros
  dashboards de rol)
