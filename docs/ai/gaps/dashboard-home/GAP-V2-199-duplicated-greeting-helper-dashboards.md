---
id: GAP-V2-199
title: getGreeting()/getTodayDateString() duplicados en 4 dashboards de rol — extraer a util compartida
module: dashboard-home
category: code-quality
priority: P4
risk: low
size: S
status: later
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-199 — Helper de saludo/fecha duplicado entre dashboards de rol

## Problema

`getGreeting()` (saludo según hora del día) y/o `getTodayDateString()` (fecha local en
formato `YYYY-MM-DD`) están definidos de forma idéntica o casi idéntica como funciones
locales en 4 archivos distintos:

- `src/components/Field/FieldDashboard.jsx:16-32`
- `src/components/Admin/Dashboard/index.tsx`
- `src/components/Warehouse/OperarioDashboard/index.tsx`
- `src/components/Admin/Dashboard/ComercialDashboard/index.js`

Es lógica pura, sin dependencias de framework, candidata obvia a un util compartido —
hoy cualquier cambio en el criterio de saludo (p. ej. ajustar el rango horario) requiere
tocar 4 archivos y arriesga que diverjan entre sí (ya podrían estar ligeramente
desincronizados; no verificado byte a byte).

## Objetivo

Existe un único `src/lib/utils/getGreeting.ts` (o `src/helpers/dashboard/greeting.ts`)
del que los 4 dashboards importan `getGreeting()` y `getTodayDateString()`.

## Contexto

Esta pasada de auditoría cubre solo la superficie FieldDashboard — el alcance de este
GAP se limita a migrar el uso en `FieldDashboard.jsx` hacia el nuevo util compartido. Los
otros 3 dashboards (Admin, Operario, Comercial) quedan fuera de este módulo/alcance;
adoptarlos ahí es un follow-up natural pero no forma parte de este GAP para no tocar
código fuera del área asignada a este carril de auditoría.

## Solución propuesta

1. Crear `src/lib/utils/getGreeting.ts` con `getGreeting(date?: Date): string` y
   `getTodayDateString(date?: Date): string` (aceptar `Date` opcional para
   testeabilidad).
2. Añadir test en `src/__tests__/utils/getGreeting.test.ts` cubriendo los 3 rangos
   horarios y el formato de fecha.
3. Actualizar `FieldDashboard.jsx` (o `.tsx` si GAP-V2-190 ya se aplicó) para importar
   desde el nuevo util y eliminar las funciones locales duplicadas.
4. Dejar como nota de seguimiento (no como tarea de este GAP) que Admin/Operario/
   Comercial deberían migrar al mismo util en una pasada posterior.

## Criterios de aceptación

- [ ] Util compartido creado y testeado.
- [ ] `FieldDashboard` ya no define `getGreeting`/`getTodayDateString` localmente.
- [ ] `npm run test:run`, `npm run lint`, `npm run type-check` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: /field — confirmar que el saludo y la fecha de "ruta de hoy" siguen siendo
# correctos.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-190
