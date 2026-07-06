---
id: GAP-V2-077
title: rescheduleAgendaAction y cancelAgendaAction no invalidan crmDashboardKeys — el componente compensa con refetch manual
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/hooks/useAgenda.ts
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-077 — Invalidación de caché incompleta en 2 de las 3 mutaciones de agenda

## Problema

`useAgendaMutations()` (`src/hooks/useAgenda.ts:121-158`) define 3 mutaciones.
Solo una invalida correctamente la caché del dashboard CRM:

```ts
// líneas 126-132 — rescheduleAgendaAction
onSuccess: async () => {
  await invalidateAgendaQueries(queryClient, tenantId); // solo agendaKeys.*
},

// líneas 133-142 — cancelAgendaAction
onSuccess: async () => {
  await Promise.all([
    invalidateAgendaQueries(queryClient, tenantId), // solo agendaKeys.*
    queryClient.invalidateQueries({ queryKey: agendaKeys.pendingPrefix(tenantId) }),
  ]);
},

// líneas 143-156 — resolveNextAction (correcto)
onSuccess: async (_data, payload) => {
  await Promise.all([
    invalidateAgendaQueries(queryClient, tenantId),
    queryClient.invalidateQueries({ queryKey: agendaKeys.pendingPrefix(tenantId) }),
    queryClient.invalidateQueries({ queryKey: crmDashboardKeys.all(tenantId) }), // ← esta línea falta en las otras 2
    ...
  ]);
},
```

Ni `rescheduleAgendaAction` ni `cancelAgendaAction` invalidan
`crmDashboardKeys.all(tenantId)`, pese a que ambas acciones cambian
directamente los datos que muestra `useCrmDashboard()` (una acción
reprogramada o cancelada debería desaparecer de `overdue_actions`/
`reminders_today`). El único motivo por el que el dashboard Comercial se
actualiza hoy es que `ComercialDashboard/index.js` compensa manualmente
llamando a `refetchCrm()` tras cada mutación (líneas 282 y 295) — un
mecanismo que funciona pero que viola el patrón de `.claude/rules/hooks.md` §
"Mutaciones — patrón de invalidación" ("Mutations invalidate relevant queries
in onSuccess"): la invalidación es responsabilidad del hook de mutación, no
del componente consumidor. Cualquier futuro consumidor de estas mutaciones que
no recuerde llamar `refetch()` manualmente (p. ej. si se reactivase
`CrmDashboardWidgets.jsx`, que también invoca las suyas de forma similar via
`useProspectMutations`, no `useAgendaMutations` — ver nota) mostraría datos
obsoletos.

## Objetivo

`rescheduleAgendaAction` y `cancelAgendaAction` invalidan también
`crmDashboardKeys.all(tenantId)` en su `onSuccess`, igual que ya hace
`resolveNextAction`. El `refetchCrm()` manual en `ComercialDashboard/index.js`
se puede mantener como refuerzo (refetch inmediato en primer plano) o
eliminarse una vez la invalidación de caché sea correcta — a decidir en
implementación.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`, carril
Comercial. Riesgo bajo porque el síntoma visible ya está mitigado por el
refetch manual del componente — este GAP corrige la causa raíz arquitectónica,
no un bug visible hoy.

## Solución propuesta

1. En `src/hooks/useAgenda.ts`, añadir
   `queryClient.invalidateQueries({ queryKey: crmDashboardKeys.all(tenantId) })`
   al `onSuccess` de `rescheduleAgendaAction` (línea ~129) y de
   `cancelAgendaAction` (línea ~139), dentro de sus respectivos `Promise.all`.
2. Evaluar en la implementación si los `refetchCrm()` manuales en
   `ComercialDashboard/index.js:282,295` pasan a ser redundantes y se pueden
   quitar, o si se mantienen como refuerzo explícito (documentar la decisión
   en "Notas de implementación").

## Criterios de aceptación

- [ ] `rescheduleAgendaAction` y `cancelAgendaAction` invalidan
      `crmDashboardKeys.all(tenantId)` en su `onSuccess`.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Manual: reprogramar/cancelar una acción desde `/comercial` sigue
      actualizando las cards CRM sin necesidad de recargar la página.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: /comercial — reprogramar y cancelar una acción de agenda, confirmar
# que "Agenda del día" se actualiza correctamente en ambos casos.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
