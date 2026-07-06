---
id: GAP-V2-092
title: Cancelar una acción pendiente de agenda no captura el motivo obligatorio que exige la trazabilidad comercial
module: dashboard-home
category: domain-business
priority: P2
risk: medium
size: S
status: rejected
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/hooks/useAgenda.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-092 — Cancelar una acción pendiente de agenda no captura el motivo obligatorio que exige la trazabilidad comercial

## Problema

El contrato de la mutación de cancelación ya modela un `reason` obligatorio (no
opcional) como parte del propio tipo:

```ts
// src/hooks/useAgenda.ts:133-135
cancelAgendaAction: useMutation({
  mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
    crmService.cancelAgendaAction(id, reason),
```

Sin embargo, el `AlertDialog` de confirmación en `ComercialDashboard/index.js:681-699`
no tiene ningún campo de texto para capturar ese motivo — solo un texto fijo
("Esta acción dejará de estar activa en la agenda comercial") y dos botones. Y
`handleCancel` (líneas 286-297) llama a la mutación pasando directamente el id
como único argumento:

```js
await notify.promise(cancelAgendaAction.mutateAsync(cancelDialog.item.agendaActionId), {
```

en vez de `{ id: cancelDialog.item.agendaActionId, reason: <algo> }` — el payload
real enviado a `crmService.cancelAgendaAction(id, reason)` termina con `id` y
`reason` ambos `undefined` (nota: la forma incorrecta del payload es en sí un bug
de código, señalado aparte para `code-audit-agent`; el punto de negocio de este GAP
es que, incluso arreglando el payload, no existe ningún punto en el flujo donde el
comercial pueda escribir por qué está cancelando la tarea).

**Por qué es un problema de negocio:** en el CRM comercial de una pesquera, cada
acción pendiente en la agenda representa un compromiso de seguimiento sobre un
cliente o prospecto (llamar, visitar, enviar oferta). Cuando esa acción se cancela
en lugar de completarse, perder la razón ("el cliente cambió de proveedor",
"prospecto duplicado", "ya se resolvió por otra vía", "dato erróneo") es perder
memoria institucional sobre por qué se dejó de perseguir una oportunidad — dato que
Dirección necesita para revisar el pipeline comercial y que el propio comercial
necesita si retoma esa cuenta meses después. El propio contrato de la API ya asume
que ese motivo es obligatorio (`reason: string`, no `string | null`), lo que indica
que esta es una regla de negocio ya reconocida en el backend pero no implementada
en la UI que la origina.

## Objetivo

Cancelar una acción de agenda desde el dashboard de Comercial exige registrar un
motivo textual, que se envía correctamente a la API junto con el id de la acción.

## Contexto

Descubierto en la auditoría domain-business de `dashboard-home`, carril Comercial.
El bug de forma del payload (`mutateAsync(id)` en vez de `mutateAsync({id, reason})`)
debe señalarse también a `code-audit-agent`/`gap-implementor` como parte del mismo
arreglo, ya que ambos defectos viven en el mismo bloque de código y no tiene
sentido corregir uno sin el otro.

## Solución propuesta

1. Añadir un campo de texto (p.ej. `Textarea`) al `AlertDialog` de cancelación (o
   sustituirlo por un `Dialog` normal, ya que `AlertDialog` de shadcn no está
   pensado para llevar inputs) donde el comercial escriba el motivo.
2. Corregir `handleCancel` para enviar
   `cancelAgendaAction.mutateAsync({ id: cancelDialog.item.agendaActionId, reason })`.
3. Validar que el motivo no esté vacío antes de habilitar el botón de confirmar
   (patrón consistente con otros formularios del proyecto vía React Hook Form/Zod
   si se decide invertir en un `Dialog` con formulario, o una validación simple de
   `disabled` si se mantiene ligero).

## Criterios de aceptación

- [ ] El diálogo de cancelación captura un motivo de texto antes de permitir
      confirmar.
- [ ] `cancelAgendaAction.mutateAsync` recibe `{ id, reason }` con ambos valores
      reales (no `undefined`).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: desde /comercial, cancelar una acción pendiente de la agenda y
# confirmar que el motivo introducido queda registrado (revisar respuesta de
# red o el detalle del prospecto/cliente tras cancelar).
```

## Notas de implementación

**Fusionado (gap-normalizer, 2026-07-06):** este hallazgo describe el mismo bloque de código
que GAP-V2-050 ("El botón 'Confirmar cancelación' del dashboard Comercial envía un payload con
forma incorrecta y omite el motivo obligatorio"), que ya cubría el bug técnico de payload en
`handleCancel`. Se ha fusionado el análisis de negocio (por qué el motivo es obligatorio para
la trazabilidad comercial) dentro de GAP-V2-050, que queda como GAP único e implementable para
este defecto. Este archivo queda `rejected` para no duplicar el trabajo — no se implementa por
separado. Ver GAP-V2-050 para el contenido completo y los criterios de aceptación vigentes.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno conocido en este módulo
