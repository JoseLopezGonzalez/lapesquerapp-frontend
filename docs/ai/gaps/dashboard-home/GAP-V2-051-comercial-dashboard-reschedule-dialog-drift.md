---
id: GAP-V2-051
title: El diálogo "Reprogramar acción" del dashboard Comercial permite fechas pasadas y muestra un texto que referencia un campo de nota inexistente
module: dashboard-home
category: ux-ui
priority: P1
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/components/Comercial/CRM/AgendaPageClient.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-051 — `RescheduleAgendaDialog` del dashboard Comercial diverge de la versión canónica de `AgendaPageClient`

## Problema

`ComercialDashboard/index.js:197-239` define su propia copia de
`RescheduleAgendaDialog`, distinta de la que ya existe en
`src/components/Comercial/CRM/AgendaPageClient.jsx:283-330`. Ambas hacen lo mismo
(reprogramar la fecha de una acción de agenda pendiente) pero la copia del dashboard
ha divergido en dos puntos concretos:

1. **Permite reprogramar a una fecha pasada.** La versión de `AgendaPageClient.jsx`
   calcula `minDate` (día siguiente a `item.scheduledAt` o a hoy) y lo pasa como
   `fromDate={minDate}` al `DatePicker`, que usa esa prop tanto para deshabilitar
   días en el calendario (`disabled={fromDate ? { before: fromDate } : undefined}` en
   `src/components/ui/datePicker.jsx:162`) como para validar la entrada manual por
   teclado (`datePicker.jsx:89-93`). La copia del dashboard
   (`ComercialDashboard/index.js:218`) llama a `<DatePicker date={nextActionAt}
   onChange={setNextActionAt} formatStyle="short" />` sin `fromDate` — no hay ninguna
   restricción, ni en el calendario ni en la entrada manual. Además, el valor inicial
   al abrir el diálogo es `item.nextActionAt` (línea 202), que para una acción vencida
   es una fecha ya pasada — si el usuario confirma sin tocar el campo, "reprograma" la
   acción a la misma fecha ya vencida.
2. **Texto de `DialogDescription` incorrecto.** `index.js:210-213` muestra: "Cambia
   solo la fecha. Si no se envía nota, la nueva acción pendiente conservará
   automáticamente el detalle actual." — mencionando una "nota" que no existe en este
   diálogo (solo hay un `DatePicker`, ningún campo de texto/nota). Parece texto
   copiado de otro flujo (posiblemente `QuickInteractionModal` o `resolveNextAction`,
   que sí manejan notas) y nunca actualizado tras simplificar el diálogo.

## Objetivo

El diálogo de reprogramar del dashboard Comercial debe impedir seleccionar una fecha
anterior a "mañana" (o a la fecha ya programada + 1 día, igual que
`AgendaPageClient`), y su texto debe describir con precisión lo que el diálogo hace.

## Contexto

Ambos componentes viven en el mismo dominio CRM y resuelven el mismo caso de uso;
la duplicación sin compartir código ya ha producido drift real (esta misma sesión de
auditoría encontró un bug equivalente en el diálogo de cancelar, ver GAP-V2-050).

## Solución propuesta

1. Corto plazo: alinear `ComercialDashboard/index.js`'s `RescheduleAgendaDialog` con
   la lógica de `AgendaPageClient.jsx:283-330` — añadir el cálculo de `minDate` y
   pasar `fromDate={minDate}`, inicializar `nextActionAt` a `minDate` en vez de
   `item.nextActionAt`, y corregir el texto de `DialogDescription` a algo equivalente
   a "Elige una nueva fecha para la acción. La descripción se mantendrá tal como
   está."
2. Medio plazo (recomendado): extraer `RescheduleAgendaDialog` a un componente
   compartido (p.ej. `src/components/Comercial/CRM/RescheduleAgendaDialog.tsx`) usado
   por ambas vistas, para que un futuro cambio no vuelva a divergir.

## Criterios de aceptación

- [ ] El `DatePicker` del diálogo de reprogramar en el dashboard Comercial no permite
      seleccionar (ni por calendario ni por entrada manual) una fecha anterior al
      mínimo permitido.
- [ ] El valor inicial del campo al abrir el diálogo es una fecha futura válida, no la
      fecha ya vencida del ítem.
- [ ] El texto de `DialogDescription` no menciona ningún campo que no exista en el
      diálogo.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en /comercial, abrir "Agenda del día", reprogramar una acción vencida y
# confirmar que no se puede seleccionar una fecha pasada ni la fecha ya vencida.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-050
