---
id: GAP-V2-050
title: El botón "Confirmar cancelación" del dashboard Comercial envía un payload con forma incorrecta y omite el motivo obligatorio de negocio
module: dashboard-home
category: ux-ui
priority: P0
risk: medium
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/hooks/useAgenda.ts
  - src/services/crmService.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-050 — Cancelar acción pendiente desde el dashboard Comercial está roto

## Problema

En `src/components/Admin/Dashboard/ComercialDashboard/index.js:286-297`, `handleCancel`
llama a la mutación así:

```js
await notify.promise(cancelAgendaAction.mutateAsync(cancelDialog.item.agendaActionId), {
```

Pero `useAgendaMutations().cancelAgendaAction` (`src/hooks/useAgenda.ts:133-135`) espera
un objeto `{ id, reason }`:

```ts
cancelAgendaAction: useMutation({
  mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
    crmService.cancelAgendaAction(id, reason),
```

Y `crmService.cancelAgendaAction(id, reason)` (`src/services/crmService.ts:146-150`) envía
`reason` en el body a `crm/agenda/{id}/cancel`. Al pasar solo el `agendaActionId` como
argumento (en vez del objeto), dentro de `mutationFn` tanto `id` como `reason` quedan
`undefined` — la petición real se hace a `crm/agenda/undefined/cancel` con
`{ reason: undefined }`, y el backend rechazará la petición.

Este archivo es `.js` (no `.ts`), por lo que TypeScript nunca evaluó esta llamada — el
mismatch de firma no genera ningún error de compilación, solo falla en producción.

Además, el `AlertDialog` de cancelación en este mismo archivo (líneas 681-699) no incluye
ningún campo para el motivo (`reason`), pese a que el servicio lo requiere como
`string` obligatorio.

**Por qué el motivo es obligatorio, no un detalle de forma (fusionado desde GAP-V2-092,
hallazgo domain-business):** en el CRM comercial de una pesquera, cada acción pendiente en la
agenda representa un compromiso de seguimiento sobre un cliente o prospecto (llamar, visitar,
enviar oferta). Cuando esa acción se cancela en lugar de completarse, perder la razón ("el
cliente cambió de proveedor", "prospecto duplicado", "ya se resolvió por otra vía", "dato
erróneo") es perder memoria institucional sobre por qué se dejó de perseguir una oportunidad —
dato que Dirección necesita para revisar el pipeline comercial y que el propio comercial
necesita si retoma esa cuenta meses después. El propio contrato de la API ya asume que ese
motivo es obligatorio (`reason: string`, no `string | null`), lo que indica que esta es una
regla de negocio ya reconocida en el backend pero no implementada en la UI que la origina.

La implementación de referencia correcta ya existe en
`src/components/Comercial/CRM/AgendaPageClient.jsx:1059-1080,1224-1255`: incluye un
`Textarea` para `cancelReason`, valida que no esté vacío antes de enviar
(`if (!cancelReason.trim())`), llama a la mutación con
`{ id: cancelDialog.item.agendaActionId, reason: cancelReason.trim() }`, usa
`getAgendaDomainErrorMessage` para el mensaje de error, y deshabilita
`AlertDialogAction` mientras `cancelAgendaAction.isPending`. Ninguna de estas piezas
existe en la copia del dashboard Comercial: el botón `AlertDialogAction` en
`index.js:696` ni siquiera tiene `disabled={cancelAgendaAction.isPending}`.

## Objetivo

Cancelar una acción de agenda desde el widget "Agenda del día" del dashboard Comercial
debe funcionar exactamente igual que desde la página completa de Agenda: pedir un
motivo obligatorio, enviarlo con la forma de payload correcta, y deshabilitar el botón
de confirmación mientras la mutación está en curso.

## Contexto

Es un bug funcional bloqueante: cualquier comercial que intente cancelar una acción
pendiente directamente desde su dashboard (en vez de ir a `/comercial/agenda`)
encontrará que la acción falla silenciosamente o con un error genérico, sin explicación.
El patrón correcto ya existe en el mismo módulo CRM (`AgendaPageClient.jsx`) — no hay
que inventar la solución, solo replicarla.

## Solución propuesta

1. Añadir estado local `cancelReason` en `ComercialDashboard` (igual que
   `AgendaPageClient.jsx`).
2. Añadir un `Textarea` con `id="cancel-reason"` dentro del `AlertDialogContent` de
   cancelación, con el mismo placeholder orientativo que la versión de referencia.
3. Validar `cancelReason.trim()` antes de enviar y mostrar `notify.error` si está vacío.
4. Corregir `handleCancel` para llamar a
   `cancelAgendaAction.mutateAsync({ id: cancelDialog.item.agendaActionId, reason: cancelReason.trim() })`.
5. Limpiar `cancelReason` al cerrar el diálogo (`onOpenChange`).
6. Añadir `disabled={cancelAgendaAction.isPending}` a `AlertDialogAction`.
7. Evaluar extraer un componente compartido (`CancelAgendaActionDialog`) usado por
   ambas vistas para evitar que esta duplicación vuelva a divergir (ver también
   GAP-V2-051, que documenta el mismo problema de duplicación en el diálogo de
   reprogramar).

## Criterios de aceptación

- [ ] `handleCancel` envía `{ id, reason }` con la forma correcta al servicio.
- [ ] El diálogo de cancelación pide un motivo obligatorio y no permite confirmar
      sin él.
- [ ] `AlertDialogAction` se deshabilita mientras `cancelAgendaAction.isPending` es
      `true`.
- [ ] Probado manualmente: cancelar una acción desde el dashboard Comercial la marca
      como cancelada en `/comercial/agenda`.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en /comercial, abrir el widget "Agenda del día", cancelar una acción
# pendiente con un motivo, confirmar que aparece como cancelada al recargar y en
# /comercial/agenda. Confirmar también que el botón de confirmación se deshabilita
# durante el envío.
```

## Notas de implementación

**Fusión (gap-normalizer, 2026-07-06):** este GAP absorbe el contenido de GAP-V2-092
("Cancelar una acción pendiente de agenda no captura el motivo obligatorio que exige la
trazabilidad comercial", carril domain-business) — mismo bloque de código
(`handleCancel`/`AlertDialog` de cancelación en `ComercialDashboard/index.js`), dos ángulos del
mismo defecto (bug técnico de payload + regla de negocio de motivo obligatorio). GAP-V2-092
queda marcado `rejected` y redirige aquí.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-051 (mismo patrón de duplicación en el diálogo de reprogramar), GAP-V2-092 (fusionado aquí)
