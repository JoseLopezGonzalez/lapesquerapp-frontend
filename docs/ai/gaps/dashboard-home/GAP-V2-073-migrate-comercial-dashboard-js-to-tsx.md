---
id: GAP-V2-073
title: Migrar ComercialDashboard/index.js y CommercialSalesSummaryCard.jsx a TypeScript
module: dashboard-home
category: architecture-refactor
priority: P3
risk: medium
size: L
status: candidate
dependencies: [GAP-V2-070, GAP-V2-071, GAP-V2-072]
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/components/Comercial/CRM/CommercialSalesSummaryCard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-073 — Dos archivos `.js`/`.jsx` del dashboard Comercial pendientes de migración

## Problema

Ambos archivos violan la regla de oro 3 de `CLAUDE.md` ("nunca crear archivos
`.js` nuevos... migrar al tocar cualquier archivo legacy") y la deuda técnica
documentada ("Codebase mixto JS/TS — migrar al tocar cualquier archivo
legacy"):

- `src/components/Admin/Dashboard/ComercialDashboard/index.js` — 704 líneas,
  sin ningún tipo explícito: `ReminderRow({ item, onReschedule, onCancel,
  onComplete })`, `RescheduleAgendaDialog({ open, onOpenChange, item, onConfirm,
  loading })`, `EmptyWidget({ icon, title, description })` — todos con
  parámetros sin anotar (implicit any si se migrase tal cual).
- `src/components/Comercial/CRM/CommercialSalesSummaryCard.jsx` — 40 líneas,
  complejidad baja (solo consume `useOrdersTotalAmountStats`, ya tipado en
  `useOrdersStats.ts`).

**Evaluación de complejidad:**

| Archivo | Complejidad | Motivo |
|---|---|---|
| `CommercialSalesSummaryCard.jsx` | LOW | Un solo hook ya tipado, sin estado local |
| `ComercialDashboard/index.js` | MEDIUM | 704 líneas, pero sin generics complejos; el tipado de `crmData` ya existe en `CrmDashboardData` (`src/types/crm.ts`) y los handlers son simples. La complejidad viene del volumen (masonryItems, 3 diálogos) no de tipos difíciles |

Ninguno alcanza HIGH por generics o dependencias externas — la única razón
para tratar `ComercialDashboard/index.js` con cuidado es su tamaño, no
dificultad de tipado.

## Objetivo

Ambos archivos pasan a `.tsx` con tipos explícitos (props, estado,
parámetros de callbacks), sin `any` implícito, usando `CrmDashboardData`,
`AgendaAction` y demás tipos ya existentes en `src/types/crm.ts`.

## Contexto

Depende de GAP-V2-070 (eliminar el archivo hermano muerto reduce el riesgo de
migrar una lógica que luego se descarta), GAP-V2-071 (eliminar código muerto
interno antes de tipar innecesariamente una función no usada) y GAP-V2-072
(mover de carpeta antes de migrar evita hacer ambos cambios en el mismo diff,
dificultando la revisión). Si Jose prefiere no depender de esos 3 GAPs, se
puede migrar en su ubicación/estado actual y aplicar el resto después — el
orden no es obligatorio, solo recomendado para minimizar el diff de cada PR.

## Solución propuesta

1. Ejecutar `npm run type-check 2>&1` como baseline antes de tocar cada
   archivo (protocolo de migración de `CLAUDE.md`).
2. Migrar `CommercialSalesSummaryCard.jsx` → `.tsx` primero (LOW, sirve de
   calentamiento).
3. Migrar `ComercialDashboard/index.js` → `.tsx`, tipando:
   - Props de `ReminderRow`, `RescheduleAgendaDialog`, `EmptyWidget`,
     `LoadingWidget`.
   - El estado de `interactionModal`, `rescheduleDialog`, `cancelDialog` con
     interfaces explícitas (no objetos anónimos con casing mixto).
   - El item de agenda (`item.prospectId`, `item.customerId`,
     `item.agendaActionId`, etc.) contra el tipo real que devuelve
     `useCrmDashboard` (`CrmDashboardData['overdue_actions'][number]` o
     equivalente en `types/crm.ts` — verificar si ya existe o crearlo).
4. Tras cada archivo, `npm run type-check 2>&1` inmediato y resolver TODOS
   los errores antes de continuar (protocolo cascada de `CLAUDE.md`).
5. No mezclar en el mismo commit la migración de tipos con cambios de
   comportamiento.

## Criterios de aceptación

- [ ] Los 2 archivos son `.tsx` sin `any` implícito.
- [ ] Ningún archivo `.js`/`.jsx` nuevo creado en el proceso.
- [ ] `npm run type-check` limpio tras cada archivo migrado.
- [ ] `npm run lint` limpio.

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
# Manual: /comercial — confirmar que el dashboard y la card de ventas
# renderizan igual que antes de la migración.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-070, GAP-V2-071, GAP-V2-072, GAP-V2-020 (mismo
  patrón de migración por lotes en el dashboard de Admin)
