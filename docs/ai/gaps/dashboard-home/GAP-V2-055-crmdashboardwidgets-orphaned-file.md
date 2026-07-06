---
id: GAP-V2-055
title: "`CrmDashboardWidgets.jsx` es un archivo huérfano — nunca se importa en ningún sitio"
module: dashboard-home
category: ux-ui
priority: P3
risk: low
size: XS
status: candidate
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

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-054 (duplicación similar con `ReminderRow` en el mismo módulo)
