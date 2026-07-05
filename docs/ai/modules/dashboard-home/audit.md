# dashboard-home — Auditoría

> Única fuente de estado del módulo — no crear `audit-v2.md`, `audit-final.md` ni variantes con fecha.
> Al repetir una auditoría: leer este archivo como baseline, no partir de cero.

## NEXT ACTION

```text
Ejecutar:
/implement-next module=dashboard-home category=ux-ui
(también hay 2 GAPs de category a11y-responsive: GAP-V2-004, GAP-V2-007)

Contexto:
Primera pasada de auditoría cerrada: carril ui-audit-agent sobre el dashboard
Admin/Dirección. 9 GAPs ready, ninguno bloqueado. El resto de superficies
(Comercial, Operario/Almacén, Field) y el resto de carriles (code-audit-agent,
domain-business-auditor, permissions-multitenant-auditor) quedan pendientes
para próximas pasadas — no se han auditado todavía.

Restricciones:
GAP-V2-003 es size L (18 archivos) — valorar dividir en sub-GAPs por familia de
widget antes o durante la implementación. No reabrir la decisión ya tomada sobre
OrdersProfitabilityTimelineCard (integrar, GAP-V2-009) ni NewLabelingFeatureCard
(eliminar, GAP-V2-006).
```

---

## 1. Estado del módulo

```text
Estado general: ready_for_implementation

Funcional:        not_started
UI:                auditing
UX:                 auditing
Código:              not_started
Arquitectura:         not_started
Responsive:            partial
Accesibilidad:           partial
Performance:               not_started
Testing:                     not_started
Documentación:                 not_started

P0 abiertos: 1   P1 abiertos: 3   P2 abiertos: 3   P3 abiertos: 2

Estado de auditoría:      in_progress
Estado de implementación: not_started
Estado de verificación:   not_started
```

## 2. Cobertura

Superficies × carriles. Estados: `pending · partial · audited · needs_reaudit · not_applicable`.

| Superficie | ux-ui | code-quality | architecture-refactor | data-api | domain-business | a11y-responsive |
|---|---|---|---|---|---|---|
| dashboard admin/dirección (`Admin/Dashboard`) | audited | pending | pending | pending | pending | audited |
| dashboard comercial (`ComercialDashboard`) | pending | pending | pending | pending | pending | pending |
| dashboard operario/almacén (`OperarioDashboard`) | pending | pending | pending | pending | pending | pending |
| dashboard field/repartidor (`FieldDashboard`) | pending | pending | pending | pending | pending | pending |
| production (sin home propia) | pending | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| widgets KPI (cards) | audited | pending | pending | pending | pending | audited |
| gráficos (Recharts) | audited | pending | not_applicable | pending | pending | audited |
| estados loading | audited | pending | not_applicable | not_applicable | not_applicable | pending |
| estados empty | pending | pending | not_applicable | not_applicable | not_applicable | pending |
| estados error | audited | pending | not_applicable | pending | not_applicable | pending |
| permisos/roles (routing por rol) | pending | not_applicable | pending | pending | not_applicable | not_applicable |
| integración API | not_applicable | pending | pending | pending | pending | not_applicable |
| componentización / duplicación entre dashboards | not_applicable | pending | pending | not_applicable | not_applicable | not_applicable |
| dominio de negocio (KPIs pesca/congelados) | not_applicable | not_applicable | not_applicable | pending | pending | not_applicable |
| dead code (huérfanos detectados en mapeo) | audited | pending | pending | not_applicable | not_applicable | not_applicable |

## 3. Resumen ejecutivo

Primera pasada auditada (carril `ui-audit-agent`, superficie Admin/Dirección únicamente):
9 GAPs `ready`, ninguno bloqueado. El hallazgo más sistémico es que la mayoría de widgets
ignoran el `error` que sus propios hooks ya exponen (GAP-V2-003, confunde fallo de API con
"sin datos") y varios widgets usan spinner/`Loader2` en vez de `Skeleton` como loading
primario (GAP-V2-001/002), rompiendo el patrón que sí siguen correctamente
`TransportRadarChart` y `DailyCalibersBySpeciesCard`. Único P0: `CompanySetupAlert` se
solapa con el `BottomNav` en mobile (GAP-V2-004). Se resolvieron 2 dudas de producto con
Jose: `OrdersProfitabilityTimelineCard` se integra (GAP-V2-009, oculto para `supervisor`)
y `NewLabelingFeatureCard` se elimina (GAP-V2-006, ya no es "nueva funcionalidad").
Quedan pendientes: el resto de superficies (Comercial, Operario/Almacén, Field) y el resto
de carriles (code-audit-agent, domain-business-auditor, permissions-multitenant-auditor)
sobre esta misma superficie.

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

Carril `ui-audit-agent`, superficie Admin/Dirección:

- 🔴 P0 — `CompanySetupAlert.tsx` (`fixed right-4 bottom-4 z-50 w-96`) se solapa con
  `BottomNav` (mismo z-index) y desborda viewport <400px → GAP-V2-004.
- 🔴 P1 — `SalesChart`, `ReceptionChart`, `DispatchChart`, `AuxiliaryLinesChartCard`
  usan `Loader2` + texto en vez de `Skeleton` → GAP-V2-001.
- 🔴 P1 — `OrderRanking`, `SalesBySalespersonPieChart`, `AuxiliaryLinesByProductCard`,
  `AuxiliaryLinesByCustomerCard` usan `<Loader>` (reservado para session gates) →
  GAP-V2-002.
- 🔴 P1 — de ~18 widgets, solo `DailyCalibersBySpeciesCard` renderiza el `error` que
  su hook expone; el resto confunde fallo de API con "sin datos" → GAP-V2-003 (size L,
  18 archivos, valorar split en implementación).
- 🟡 P2 — `CompanySetupAlert` sin affordance de cierre → GAP-V2-005.
- 🟡 P2 — tooltips "Info" inconsistentes: `<span>` no focuseable en `CurrentStockCard`,
  `TotalAmountSoldCard`, `AuxiliaryLinesTotalCard` vs. `<button aria-label>` correcto en
  otros widgets → GAP-V2-007.
- 🟡 P2 — `OrdersProfitabilityTimelineCard` nunca integrado en el grid (para ningún rol,
  no es ocultamiento intencional) → GAP-V2-009 (integrar, oculto para supervisor).
- 🟢 P3 — `NewLabelingFeatureCard` código muerto, funcionalidad ya no es "nueva" →
  GAP-V2-006 (eliminar).
- 🟢 P3 — grid de KPI con 5 tarjetas en `2xl:grid-cols-4`, última fila desequilibrada →
  GAP-V2-008.

## 7. GAPs generados/actualizados

Ver `docs/ai/gaps/dashboard-home/gaps-registry.md` (regenerado con
`scripts/build-gaps-registry.mjs`). 9 GAPs, todos `ready`: GAP-V2-001 a GAP-V2-009.

## 8. GAPs resueltos o descartados

Ninguno todavía — primera pasada, ningún GAP implementado aún.

## 9. Bloqueos y riesgos

Sin bloqueos. GAP-V2-003 es size L (18 archivos) — riesgo de PR grande y difícil de
revisar; recomendable dividir en sub-GAPs por familia de widget al implementar
(`/implement-next` o `gap-implementor` pueden decidirlo).

## 10. Decisiones tomadas

- 2026-07-05 — Jose confirma alcance de la primera pasada: solo dashboard
  Admin/Dirección, solo carril `ui-audit-agent`.
- 2026-07-05 — Jose confirma: `OrdersProfitabilityTimelineCard` se integra en el grid
  (no estaba oculto por rol, era simplemente código sin conectar) → GAP-V2-009.
- 2026-07-05 — Jose confirma: `NewLabelingFeatureCard` se elimina → GAP-V2-006.

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
