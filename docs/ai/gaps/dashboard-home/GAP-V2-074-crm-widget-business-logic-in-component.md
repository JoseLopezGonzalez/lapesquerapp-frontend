---
id: GAP-V2-074
title: Lógica de negocio (merge y orden de reminders/clientes inactivos) embebida en el componente en vez del hook
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/hooks/useCrmDashboard.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-074 — Merge/orden de datos CRM vive en el componente, no en el hook

## Problema

`ComercialDashboard/index.js` calcula, dentro del `useMemo` de `masonryItems`
(líneas 361-367), dos transformaciones de datos que son lógica de negocio, no
de presentación:

```js
// línea 361
const reminders = [...(crmData?.overdue_actions ?? []), ...(crmData?.reminders_today ?? [])];

// líneas 362-367
const sortedInactiveCustomers = [...(crmData?.inactive_customers ?? [])].sort((a, b) => {
  const aNeverOrdered = a.lastOrderAt == null;
  const bNeverOrdered = b.lastOrderAt == null;
  if (aNeverOrdered === bNeverOrdered) return 0;
  return aNeverOrdered ? -1 : 1;
});
```

Esto viola `.claude/rules/components.md` § "Lógica de negocio — nunca en el
componente" ("No business logic in components — extracted to hooks"). El
propio hook `useCrmDashboard.ts` ya construye el objeto `mergedData` combinando
3 queries paralelas (`pendingActionsQuery`, `customersQuery`, `prospectsQuery`)
— es el lugar natural para devolver ya el array combinado y ordenado, en vez de
devolver los arrays crudos y dejar que cada consumidor repita la misma
transformación.

Adicionalmente, esta misma lógica está **duplicada literalmente** en
`CrmDashboardWidgets.jsx:226` (`const reminders = [...(data?.overdue_actions ??
[]), ...(data?.reminders_today ?? [])];`), confirmando que sin un punto único
de transformación, cualquier cambio futuro en el orden o criterio de fusión
requiere tocar 2+ archivos y es fácil que diverjan (como ya ocurrió: el archivo
muerto no tiene el `sortedInactiveCustomers`, indicando que ya divergieron).

## Objetivo

`useCrmDashboard()` devuelve directamente `reminders` (ya fusionado) y
`inactiveCustomersSorted` (ya ordenado) como parte de su `data`, o como campos
adicionales del retorno del hook. El componente solo lee esos campos, sin
recalcular nada.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`, carril
Comercial. Relacionado con GAP-V2-070 (si se elimina el archivo muerto, la
duplicación deja de ser un problema de 2 archivos y pasa a ser solo de
organización de capas en 1 archivo).

## Solución propuesta

1. En `useCrmDashboard.ts`, dentro del cálculo de `mergedData`, añadir:
   ```ts
   reminders: [
     ...(pendingActionsQuery.data?.data?.overdue_actions ?? []),
     ...(pendingActionsQuery.data?.data?.reminders_today ?? []),
   ],
   inactiveCustomersSorted: [...(customersQuery.data?.data?.inactive_customers ?? [])].sort(
     (a, b) => {
       const aNeverOrdered = a.lastOrderAt == null;
       const bNeverOrdered = b.lastOrderAt == null;
       if (aNeverOrdered === bNeverOrdered) return 0;
       return aNeverOrdered ? -1 : 1;
     }
   ),
   ```
2. Actualizar `CrmDashboardData` en `src/types/crm.ts` para incluir estos 2
   campos derivados (o documentar que son adicionales al shape de la API).
3. En `ComercialDashboard/index.js`, reemplazar el cálculo local por lectura
   directa de `crmData.reminders` / `crmData.inactiveCustomersSorted`.
4. Si GAP-V2-070 no se ha implementado aún, aplicar el mismo cambio en
   `CrmDashboardWidgets.jsx` para eliminar la duplicación mientras el archivo
   siga vivo.

## Criterios de aceptación

- [ ] `useCrmDashboard.ts` expone `reminders` e `inactiveCustomersSorted` ya
      calculados.
- [ ] `ComercialDashboard/index.js` no contiene lógica de fusión/orden inline.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: /comercial — confirmar que "Agenda del día" y "Clientes inactivos"
# muestran los mismos datos y orden que antes del cambio.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-070
