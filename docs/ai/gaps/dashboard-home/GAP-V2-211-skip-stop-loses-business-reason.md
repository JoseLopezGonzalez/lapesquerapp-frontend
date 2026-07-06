---
id: GAP-V2-211
title: "Omitir parada" no captura motivo de negocio pese a existir el campo
module: dashboard-home
category: domain-business
priority: P1
risk: medium
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Field/FieldRouteExecutionPage.jsx
  - src/components/Field/StopDetailDrawer.jsx
  - src/components/Field/ResultDialog.jsx
  - src/types/field.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-211 — "Omitir parada" no captura motivo de negocio pese a existir el campo

## Problema

`FieldDashboard.jsx` cuenta las paradas omitidas en la card "Actividad reciente"
(`skippedStops = routeStops.filter((stop) => stop.status === 'skipped').length`,
`FieldDashboard.jsx:82,191-193`) pero esa cifra nunca tiene un motivo asociado en
ningún punto del flujo, porque el propio botón "Omitir" no lo captura al origen:

```js
// FieldRouteExecutionPage.jsx:164-171 — handleSkipStop
const handleSkipStop = async (stop) => {
  const response = await notify.promise(
    updateStop({
      stopId: stop.id,
      payload: { status: 'skipped' },   // ← sin result_type ni result_notes
    }),
    ...
```

Esto contrasta directamente con `handleCompleteStop` (`FieldRouteExecutionPage.jsx:129-140`),
que sí envía `result_type` y `result_notes` capturados en `ResultDialog.jsx`, un diálogo
completo con `Select` de tipo de resultado (`delivery | autoventa | no_contact |
incident | visit`) y `Textarea` de notas. El botón "Omitir" en
`StopDetailDrawer.jsx:141-149` llama a `onSkipStop(focusedStop)` directamente, sin abrir
ningún diálogo — un único tap sin ningún campo intermedio.

El propio tipo `RouteStop` (`src/types/field.ts:63-64`) ya modela `resultType` y
`resultNotes` como campos aplicables a cualquier resultado de parada, no solo a las
completadas — la estructura de datos está preparada para esto, solo la UI de "Omitir"
no la usa.

## Por qué es un problema de negocio (no solo de código)

Para una empresa de autoventa/reparto de fresco y congelado, una parada omitida no es
un dato neutro: "cliente cerrado", "sin stock a bordo para lo pedido", "cliente
rechazó la entrega", "dirección incorrecta/no localizada" y "incidencia de acceso" son
motivos con consecuencias operativas completamente distintas — replanificación de la
ruta de mañana, aviso a comercial para renegociar, ajuste de la previsión de stock
cargado en el vehículo, o escalado de incidencia de cliente. Al perder el motivo en el
momento exacto en que el repartidor está frente al problema (y no lo recordará con
precisión horas después), esa información queda irrecuperable. El propio dashboard
expone el conteo agregado de "omitidas" como si fuera una métrica útil, pero sin el
motivo detrás, ese número no permite ninguna acción de negocio real — ni para el
repartidor, ni para quien planifica rutas al día siguiente.

## Objetivo

"Omitir parada" debe capturar un motivo estructurado (mínimo: tipo de motivo) antes de
guardar el estado `skipped`, usando el mismo mecanismo ya construido para "Cerrar
parada" (`ResultDialog`), no un tap directo sin diálogo.

## Contexto

No requiere cambios de tipos ni de backend — `resultType`/`resultNotes` ya existen en
`RouteStop` y ya se envían correctamente para el camino de "completar". Es
exclusivamente un problema de que el camino de "omitir" no pasa por el mismo diálogo.

## Solución propuesta

- Cambiar `StopDetailDrawer` para que el botón "Omitir" abra `ResultDialog`
  preconfigurado con un conjunto de motivos relevantes para omisión (p. ej.
  `no_contact`, `incident`, o un nuevo valor específico si Jose confirma que
  `no_contact`/`incident` no cubren todos los casos reales — ver pregunta abierta) en
  lugar de invocar `onSkipStop` directamente.
- `handleSkipStop`/el submit del diálogo debe enviar
  `{ status: 'skipped', result_type: resultType, result_notes: resultNotes }`, igual
  que `handleCompleteStop`.
- Revisar si `resultTypes` en `ResultDialog.jsx:22-28` necesita motivos adicionales
  específicos de omisión (p. ej. "Cliente cerrado", "Sin stock a bordo") en vez de
  reutilizar únicamente `no_contact`/`incident`, que describen el contacto pero no
  necesariamente la causa operativa real de negocio.

## Criterios de aceptación

- [ ] El botón "Omitir" abre un diálogo de motivo (reutilizando `ResultDialog` o una
      variante) antes de persistir `status: 'skipped'`.
- [ ] El payload de la mutación de omisión incluye `result_type` y, opcionalmente,
      `result_notes`.
- [ ] Ninguna parada puede quedar en `status: 'skipped'` sin un `result_type` asociado
      tras este cambio.

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual: omitir una parada desde StopDetailDrawer y confirmar que se pide
motivo antes de guardar; inspeccionar el payload de red.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno todavía en este módulo para esta superficie.

## Pregunta abierta para Jose

¿Qué motivos de omisión son reales en operación (más allá de "sin contacto" e
"incidencia")? Ejemplos hipotéticos: cliente cerrado/vacaciones, sin stock a bordo
para lo pedido, cliente rechaza recepción, dirección no localizada, ruta reordenada
por el propio repartidor. Esto determina si basta reutilizar `resultTypes` de
`ResultDialog` o si hace falta una lista de motivos específica para omisión.
