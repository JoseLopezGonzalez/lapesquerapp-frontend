---
id: GAP-V2-070
title: CrmDashboardWidgets.jsx es código muerto — duplica 100% la lógica de ComercialDashboard y usa window.prompt()
module: dashboard-home
category: architecture-refactor
priority: P2
risk: low
size: S
status: rejected
dependencies: []
target_files:
  - src/components/Comercial/CRM/CrmDashboardWidgets.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-070 — `CrmDashboardWidgets.jsx` no se importa en ningún sitio

## Problema

`grep -rn "CrmDashboardWidgets" src/` solo devuelve la propia declaración
(`src/components/Comercial/CRM/CrmDashboardWidgets.jsx:154`) — ningún componente,
página o test lo importa. El dashboard de Comercial en producción
(`src/components/Admin/Dashboard/ComercialDashboard/index.js`) reimplementa la
misma UI (agenda del día, clientes inactivos, prospectos sin actividad) de forma
casi línea por línea, pero como componente independiente con su propio
`useCrmDashboard()` y su propio JSX — es decir, el archivo vivo y el muerto
divergieron sin que nadie lo notara.

Además, el código muerto contiene un anti-patrón que no debería reproducirse si
alguna vez se reutiliza: `handleReschedule` (línea 165-193) usa
`window.prompt()` para capturar fecha y nota en vez de un `Dialog` +
`DatePicker` (el propio `ComercialDashboard/index.js` sí usa un `Dialog`
correcto vía `RescheduleAgendaDialog`, líneas 197-239).

## Objetivo

El archivo `CrmDashboardWidgets.jsx` deja de existir en el repositorio, o si
Jose decide que tiene un uso futuro planeado, se documenta explícitamente ese
plan y se elimina la duplicación en su lugar.

## Contexto

Descubierto en la auditoría de code-quality de `dashboard-home`, carril
Comercial. Sigue el mismo patrón que `GAP-V2-006` (widget huérfano eliminado en
el dashboard de Admin) — la decisión estándar del proyecto ante código huérfano
confirmado por grep exhaustivo es eliminar salvo justificación explícita.

## Solución propuesta

1. Confirmar con Jose que no hay plan de reactivar este componente (p. ej. como
   variante compacta para otro rol).
2. Si se confirma eliminar: borrar
   `src/components/Comercial/CRM/CrmDashboardWidgets.jsx`.
3. Si se decide conservarlo por algún motivo, entonces resolver primero la
   duplicación con `ComercialDashboard/index.js` (ver GAP-V2-074) para que no
   sean dos implementaciones independientes de la misma lógica.

## Criterios de aceptación

- [ ] `grep -rn "CrmDashboardWidgets" src/` devuelve 0 resultados (si se
      elimina), o el archivo pasa a ser consumido desde al menos un punto real
      del árbol de componentes (si se conserva).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
grep -rn "CrmDashboardWidgets" src/
npm run type-check
npm run lint
```

## Notas de implementación

**Fusionado (gap-normalizer, 2026-07-06):** mismo hallazgo que GAP-V2-055
("CrmDashboardWidgets.jsx es un archivo huérfano — nunca se importa en ningún sitio", carril
ui-audit-agent), confirmado independientemente por ambos carriles. El detalle del anti-patrón
`window.prompt()` de este candidato se incorporó a GAP-V2-055. Este archivo queda `rejected` —
no se implementa por separado.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-006 (mismo patrón en Admin dashboard), GAP-V2-074
