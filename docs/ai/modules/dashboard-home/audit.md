# dashboard-home — Auditoría

> Única fuente de estado del módulo — no crear `audit-v2.md`, `audit-final.md` ni variantes con fecha.
> Al repetir una auditoría: leer este archivo como baseline, no partir de cero.

## NEXT ACTION

```text
Ejecutar:
Pendiente de aprobación de Jose sobre alcance (superficies × carriles) — Fase 3 del skill deep-audit-module.

Contexto:
Primera auditoría del módulo. Mapeo de superficie completado (Fase 2). El módulo
"dashboard-home" en realidad son 4 dashboards de rol distintos que reutilizan
piezas entre sí, más un dashboard de superadmin desconectado.

Restricciones:
No lanzar carriles hasta confirmación explícita del alcance.
```

---

## 1. Estado del módulo

```text
Estado general: not_started

Funcional:        not_started
UI:                not_started
UX:                 not_started
Código:              not_started
Arquitectura:         not_started
Responsive:            not_started
Accesibilidad:           not_started
Performance:               not_started
Testing:                     not_started
Documentación:                 not_started

P0 abiertos: 0   P1 abiertos: 0   P2 abiertos: 0   P3 abiertos: 0

Estado de auditoría:      not_started
Estado de implementación: not_started
Estado de verificación:   not_started
```

## 2. Cobertura

Superficies × carriles. Estados: `pending · partial · audited · needs_reaudit · not_applicable`.

| Superficie | ux-ui | code-quality | architecture-refactor | data-api | domain-business | a11y-responsive |
|---|---|---|---|---|---|---|
| dashboard admin/dirección (`Admin/Dashboard`) | pending | pending | pending | pending | pending | pending |
| dashboard comercial (`ComercialDashboard`) | pending | pending | pending | pending | pending | pending |
| dashboard operario/almacén (`OperarioDashboard`) | pending | pending | pending | pending | pending | pending |
| dashboard field/repartidor (`FieldDashboard`) | pending | pending | pending | pending | pending | pending |
| production (sin home propia) | pending | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| widgets KPI (cards) | pending | pending | pending | pending | pending | pending |
| gráficos (Recharts) | pending | pending | not_applicable | pending | pending | pending |
| estados loading | pending | pending | not_applicable | not_applicable | not_applicable | pending |
| estados empty | pending | pending | not_applicable | not_applicable | not_applicable | pending |
| estados error | pending | pending | not_applicable | pending | not_applicable | pending |
| permisos/roles (routing por rol) | pending | not_applicable | pending | pending | not_applicable | not_applicable |
| integración API | not_applicable | pending | pending | pending | pending | not_applicable |
| componentización / duplicación entre dashboards | not_applicable | pending | pending | not_applicable | not_applicable | not_applicable |
| dominio de negocio (KPIs pesca/congelados) | not_applicable | not_applicable | not_applicable | pending | pending | not_applicable |
| dead code (huérfanos detectados en mapeo) | not_applicable | pending | pending | not_applicable | not_applicable | not_applicable |

## 3. Resumen ejecutivo

Primera pasada: solo mapeo de superficie (Fase 2), sin auditoría de contenido todavía.
Hallazgo temprano relevante: el componente `CrmDashboardWidgets.jsx` parece dead code,
`OrdersProfitabilityTimelineCard` no está importado en `Dashboard/index.tsx`, y `production/`
no tiene página home propia. Pendiente de aprobación de alcance para lanzar carriles.

## 4. Baseline anterior

Ninguna — primera pasada.

## 5. Alcance del módulo

```text
Rutas:
  src/app/admin/page.js                    → redirect a /admin/home
  src/app/admin/home/page.js                → dispatcher por rol (Dashboard | OperarioDashboard | redirect a /field)
  src/app/comercial/page.js                  → ComercialDashboard
  src/app/operator/page.js                    → OperarioDashboard
  src/app/warehouse/[storeId]/page.js          → OperarioDashboard (rol operario) | Store (admin/tecnico)
  src/app/field/page.js                         → FieldDashboard
  src/app/production/                            → sin page.js raíz (sin home propia)
  src/app/superadmin/page.tsx                     → fuera de alcance por defecto (stack de datos distinto)

Componentes:
  src/components/Admin/Dashboard/index.tsx (+ ~18 widgets en su carpeta)
  src/components/Admin/Dashboard/ComercialDashboard/index.js
  src/components/Warehouse/OperarioDashboard/index.tsx (+ ReceptionsListCard, DispatchesListCard, NetWeightCalculatorDialog)
  src/components/Field/FieldDashboard.jsx
  src/components/Comercial/CRM/CrmDashboardWidgets.jsx (candidato a dead code)

Hooks:
  useOrdersStats.ts · useStockStats.ts · useDashboardCharts.ts · useSpeciesOptions.js ·
  useDailyCalibersBySpecies.js · useProductOptions.js · usePunches.js · useCompanySetupCheck.ts ·
  useCrmDashboard.ts · useAgenda.ts (useAgendaMutations) · useReceptionsList.js · useDispatchesList.ts ·
  useFieldRoutes.ts · useFieldOrders.ts

Services:
  orderService · storeService · speciesService · productService · productCategoryService ·
  productFamilyService · punchService · crmService · rawMaterialReceptionService ·
  ceboDispatchService · fieldOperatorService · services/rawMaterialReception/getReceptionChartData ·
  services/ceboDispatch/getDispatchChartData

Tipos:
  src/types/crm.ts · src/types/field.ts
  (stats de Admin/Comercial: interfaces inline en los propios hooks, sin archivo dedicado en src/types/)
```

## 6. Hallazgos vigentes

{pendiente — se completa tras lanzar carriles}

## 7. GAPs generados/actualizados

{pendiente}

## 8. GAPs resueltos o descartados

{pendiente — primera pasada}

## 9. Bloqueos y riesgos

Esperando confirmación de Jose sobre qué superficies (roles) y carriles cubrir en esta
primera pasada — el módulo es más amplio de lo que sugiere el nombre "dashboard-home"
(4 dashboards de rol reales + 1 de superadmin desconectado).

## 10. Decisiones tomadas

{pendiente}

## 11. Cambios desde la última auditoría

N/A — primera pasada.

## 12. Instrucciones para retomar en otro chat/modelo

Este módulo agrupa 4 dashboards de rol que comparten algunos componentes/cards
(p. ej. `TotalQuantitySoldCard`, `TotalAmountSoldCard`, `TransportRadarChart` se
reutilizan entre `Dashboard` y `ComercialDashboard`; `OperarioDashboard` se reutiliza
en 3 rutas distintas). Ver § 5 para el mapeo completo. `production/` no tiene home
propia — verificar si es un gap intencional o pendiente.

## 13. Reglas específicas para futuras auditorías de este módulo

- No confundir esta auditoría con la de `superadmin` — stack de datos y auth distintos,
  fuera de alcance salvo que Jose lo pida explícitamente.
- `Admin/Dashboard/OrdersProfitabilityTimelineCard` no está importado actualmente —
  confirmar con Jose si es intencional antes de marcarlo como bug.
- `Comercial/CRM/CrmDashboardWidgets.jsx` no tiene referencias en el proyecto —
  candidato a dead code, confirmar antes de proponer borrado.

## Legacy references

| Legacy GAP (`.claude/gaps/`) | Estado legacy | Relación | Nota |
|---|---|---|---|
| | | | |
