---
id: GAP-V2-055
title: "`CrmDashboardWidgets.jsx` es un archivo huérfano — nunca se importa en ningún sitio"
module: dashboard-home
category: architecture-refactor
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Comercial/CRM/CrmDashboardWidgets.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-055 — Confirmado: `CrmDashboardWidgets.jsx` no se importa desde ningún lugar del proyecto

## Problema

`grep -rn "CrmDashboardWidgets" src/` solo devuelve un resultado: la propia
declaración `export default function CrmDashboardWidgets()` en
`src/components/Comercial/CRM/CrmDashboardWidgets.jsx:154`. Ningún `page.tsx`,
`PageClient` ni otro componente lo importa. El dashboard Comercial real
(`ComercialDashboard/index.js`) reimplementa su propia lógica de widgets CRM
directamente inline (agenda, clientes inactivos, prospectos sin actividad) en vez de
usar este archivo.

## Objetivo

Decidir el destino del archivo: eliminarlo si es una versión abandonada/reemplazada,
o integrarlo si contiene lógica o UI que debería estar en uso.

## Contexto

Mencionado explícitamente como sospecha de código muerto en el encargo de esta
auditoría — confirmado con grep exhaustivo. Bajo impacto (no afecta a ningún usuario
real, es puro peso muerto en el repo), pero conviene resolverlo para no confundir a
futuros desarrolladores que busquen "dónde están los widgets CRM del dashboard".

**Fusionado desde GAP-V2-070 (carril code-audit-agent, mismo hallazgo confirmado
independientemente):** el código muerto contiene además un anti-patrón que no debería
reproducirse si alguna vez se reutiliza — `handleReschedule` (línea 165-193) usa
`window.prompt()` para capturar fecha y nota en vez de un `Dialog` + `DatePicker` (el propio
`ComercialDashboard/index.js` sí usa un `Dialog` correcto vía `RescheduleAgendaDialog`, líneas
197-239). Esto refuerza la recomendación de eliminar en vez de reactivar: reactivarlo
significaría también corregir ese anti-patrón de `window.prompt()`.

## Solución propuesta

1. Leer `CrmDashboardWidgets.jsx` completo y compararlo contra los widgets CRM
   realmente renderizados en `ComercialDashboard/index.js` (agenda del día, clientes
   inactivos, prospectos sin actividad).
2. Si es una versión anterior/duplicada sin funcionalidad adicional relevante:
   eliminar el archivo.
3. Si contiene alguna mejora no migrada (p.ej. otro layout, otra lógica de
   agrupación): evaluar si vale la pena portarla a `ComercialDashboard/index.js` antes
   de eliminar el archivo.

## Criterios de aceptación

- [ ] El archivo se elimina, o pasa a estar importado y en uso real.
- [ ] `npm run type-check` y `npm run lint` limpios tras el cambio.

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "CrmDashboardWidgets" src/   # debe devolver 0 resultados tras eliminar
```

## Notas de implementación

**Fusión (gap-normalizer, 2026-07-06):** este GAP absorbe GAP-V2-070 ("CrmDashboardWidgets.jsx
es código muerto — duplica 100% la lógica de ComercialDashboard y usa window.prompt()", carril
code-audit-agent) — mismo archivo huérfano confirmado independientemente por dos carriles.
GAP-V2-070 queda `rejected` y redirige aquí. Si Jose decide conservar el archivo en vez de
eliminarlo, resolver primero la duplicación con `ComercialDashboard/index.js` (ver GAP-V2-074).

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-054 (duplicación similar con `ReminderRow` en el mismo módulo),
  GAP-V2-070 (fusionado aquí), GAP-V2-074 (lógica de negocio duplicada, relevante si se decide
  conservar el archivo)
