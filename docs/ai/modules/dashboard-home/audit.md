# dashboard-home — Auditoría

> Única fuente de estado del módulo — no crear `audit-v2.md`, `audit-final.md` ni variantes con fecha.
> Al repetir una auditoría: leer este archivo como baseline, no partir de cero.

## NEXT ACTION

```text
Ejecutar:
/implement-next module=dashboard-home category=ux-ui
(hay GAPs ready listos en casi todas las categorías tras la normalización — ver §7 para
el desglose completo por categoría/status)

Contexto:
Segunda pasada de auditoría cerrada y normalizada (2026-07-06): 11 carriles en paralelo
(code-audit-agent, ui-audit-agent, domain-business-auditor) sobre Comercial, Operario/
Almacén y Field, completando la cobertura de Admin/Dirección de la primera pasada.
83 GAP candidates generados → gap-normalizer procesó, fusionó 8 duplicados y clasificó:
51 ready, 20 blocked, 4 later, 8 rejected (fusionados). Sumado a los 9 GAPs ready de la
primera pasada (GAP-V2-001..009), el módulo tiene 60 GAPs ready en total.

Antes de implementar en lote, revisar con Jose las 14 preguntas de negocio agrupadas al
final de §7 — desbloquean 20 GAPs `blocked`. Ninguna de esas preguntas bloquea los 60
GAPs `ready`, que pueden implementarse ya.

Restricciones:
No reabrir decisiones ya tomadas: OrdersProfitabilityTimelineCard integrado
(GAP-V2-009), NewLabelingFeatureCard eliminado (GAP-V2-006). GAP-V2-003 (ready, size L,
18 archivos) — valorar dividir en sub-GAPs por familia de widget al implementar.
Ningún GAP L/XL nuevo de esta pasada se marca ready sin autorización explícita de Jose
(ver lista en §7).
```

---

## 1. Estado del módulo

```text
Estado general: ready_for_implementation

Funcional:        auditing
UI:                auditing
UX:                 auditing
Código:              auditing
Arquitectura:         auditing
Responsive:            partial
Accesibilidad:           partial
Performance:               partial
Testing:                     not_started
Documentación:                 not_started

Tras normalización (2026-07-06): 84 GAPs vigentes (9 ready de la 1ª pasada + 75
resultantes de la 2ª pasada, tras fusionar 8 duplicados) — 60 ready · 20 blocked ·
4 later · 8 rejected (fusionados, no cuentan en el total vigente).

Estado de auditoría:      in_progress (Admin/Dirección, Comercial, Operario/Almacén y
                           Field cubiertos por sus carriles asignados; falta
                           permissions-multitenant-auditor sobre Comercial/Operario/Field)
Estado de implementación: not_started
Estado de verificación:   not_started
```

## 2. Cobertura

Superficies × carriles. Estados: `pending · partial · audited · needs_reaudit · not_applicable`.

| Superficie | ux-ui | code-quality | architecture-refactor | data-api | domain-business | a11y-responsive |
|---|---|---|---|---|---|---|
| dashboard admin/dirección (`Admin/Dashboard`) | audited | audited | audited | pending | audited | audited |
| dashboard comercial (`ComercialDashboard`) | audited | audited | audited | pending | audited | partial |
| dashboard operario/almacén (`OperarioDashboard`) | audited | audited | audited | pending | audited | partial |
| dashboard field/repartidor (`FieldDashboard`) | audited | audited | audited | pending | audited | partial |
| production (sin home propia) | pending | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| widgets KPI (cards) | audited | audited | audited | pending | audited | audited |
| gráficos (Recharts) | audited | audited | not_applicable | pending | audited | audited |
| estados loading | audited | audited | not_applicable | not_applicable | not_applicable | partial |
| estados empty | audited | pending | not_applicable | not_applicable | not_applicable | pending |
| estados error | audited | pending | not_applicable | pending | not_applicable | pending |
| permisos/roles (routing por rol) | pending | audited | audited | pending | not_applicable | not_applicable |
| integración API | not_applicable | audited | audited | pending | audited | not_applicable |
| componentización / duplicación entre dashboards | not_applicable | audited | audited | not_applicable | not_applicable | not_applicable |
| dominio de negocio (KPIs pesca/congelados) | not_applicable | not_applicable | not_applicable | pending | audited | not_applicable |
| dead code (huérfanos detectados en mapeo) | audited | audited | audited | not_applicable | not_applicable | not_applicable |

Pendiente explícito: carril `data-api`/`permissions-multitenant-auditor` no se ha lanzado
todavía sobre ninguna superficie de este módulo (aislamiento multi-tenant de los KPIs y
listados no auditado). `a11y-responsive` de Comercial/Operario/Field quedó cubierto solo
parcialmente dentro del carril `ui-audit-agent` (no fue un carril dedicado aparte).

## 3. Resumen ejecutivo

**Primera pasada** (`ui-audit-agent`, solo Admin/Dirección): 9 GAPs `ready`, ninguno bloqueado.
Hallazgo más sistémico: la mayoría de widgets ignoran el `error` que sus propios hooks ya
exponen (GAP-V2-003) y varios usan spinner/`Loader2` en vez de `Skeleton` (GAP-V2-001/002).
Único P0: `CompanySetupAlert` se solapa con el `BottomNav` en mobile (GAP-V2-004). Dos
decisiones de producto resueltas: `OrdersProfitabilityTimelineCard` se integra (GAP-V2-009)
y `NewLabelingFeatureCard` se elimina (GAP-V2-006).

**Segunda pasada** (2026-07-06, 11 carriles en paralelo — code-audit-agent, ui-audit-agent,
domain-business-auditor — completando Admin/Dirección y cubriendo Comercial, Operario/Almacén
y Field): 83 GAP candidates → normalizados a 75 GAPs (8 fusionados/`rejected`) → **51 ready,
20 blocked, 4 later**. Total acumulado del módulo: **60 GAPs ready, 20 blocked**. Hallazgos
más relevantes de esta pasada:
- **Crítico de negocio (Comercial):** el resumen "Tus ventas este año" del comercial en
  realidad muestra el total de ventas de toda la empresa — `salespersonId` existe en
  `AuthUser` pero ningún hook lo usa (GAP-V2-090/091/053, parcialmente `blocked` por
  depender de soporte del backend).
- **Bug técnico confirmado (Comercial):** el diálogo "Cancelar acción" de agenda envía un
  payload incompleto (`mutateAsync(id)` en vez de `{id, reason}`) mientras `reason` es
  obligatorio en el servicio — rompe la función tal cual está (GAP-V2-050, `ready`).
- **Arquitectura (Operario/Almacén):** `warehouse/[storeId]/page.js` reimplementa a mano con
  `useEffect`+`useState` lo que ya resuelve `useStoreData`, violando el patrón de hooks del
  proyecto (GAP-V2-135, `ready`); `storeId` no filtra recepciones/salidas pese a pasarse como
  prop (GAP-V2-112, `blocked`, pendiente de confirmar si el backend ya lo hace).
- **Código muerto confirmado (Comercial):** `CrmDashboardWidgets.jsx` (461 líneas, 0
  importadores) y la función `ReminderRow` dentro de `ComercialDashboard/index.js`, ambos
  señalados de forma independiente por 2 carriles distintos (GAP-V2-055/054).
- **Patrón transversal (4 dashboards):** cálculo de saludo/fecha duplicado literalmente en
  Admin/Comercial/Operario/Field (GAP-V2-199, `later`); mismo problema de "ignora el `error`
  del hook" repetido por superficie (ya cubierto por GAP separado en cada una).

20 GAPs `blocked`: 6 solo por tamaño L/XL pendientes de autorización de alcance, 14 por
preguntas de negocio/backend sin resolver (ver §7 para el detalle agrupado). Ninguna pregunta
pendiente bloquea los 60 GAPs `ready`.

Queda pendiente: carril `permissions-multitenant-auditor` (aislamiento multi-tenant, ningún
carril lo ha cubierto todavía en este módulo) sobre las 4 superficies.

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

Segunda pasada (2026-07-06), destacados por superficie (ver `gaps-registry.md` para el listado
completo de los 75 GAPs resultantes):

**Admin/Dirección (carriles code-audit-agent + domain-business-auditor):**
- 🟡 P1/P2 — `AuxiliaryLinesByProductCard` fuerza sufijo "kg" sobre líneas con `unit` distinta
  del backend → GAP-V2-030 (`blocked`, pendiente confirmar modelo de unidad).
- 🟡 — `isSupervisor` oculta solo `OrderRankingChart`, pero deja visibles márgenes/rentabilidad
  (dato más sensible) → GAP-V2-032 (`blocked`, pregunta de negocio nº2).

**Comercial (3 carriles):**
- 🔴 — Diálogo "Cancelar acción" de agenda envía payload incompleto, rompe la función →
  GAP-V2-050 (`ready`).
- 🔴 — "Tus ventas este año" del comercial muestra el total de empresa, no el suyo →
  GAP-V2-053/090/091 (`blocked`, pregunta nº4/5).
- 🟢 — `CrmDashboardWidgets.jsx` (dead code, 461 líneas) y función `ReminderRow` huérfana →
  GAP-V2-055/054 (`ready`).

**Operario/Almacén (3 carriles):**
- 🔴 — `warehouse/[storeId]/page.js` reimplementa a mano el fetch que ya resuelve
  `useStoreData` → GAP-V2-135 (`ready`).
- 🟡 — `storeId` no filtra recepciones/salidas del almacén asignado → GAP-V2-112 (`blocked`,
  pregunta nº7).
- 🟡 — Botones de acción en fila mobile por debajo del touch target 44×44px, contexto de
  almacén con guantes → GAP-V2-114 (`ready`).
- 🟡 — Dos `storeId` calculados de forma duplicada en 3 rutas distintas (patrón detectado en
  la primera pasada, confirmado) → GAP-V2-130 (`ready`).

**Field (3 carriles):**
- 🟡 — Widget ignora `error`/`refetch` de `useFieldRoutes`/`useFieldOrders` → GAP-V2-170
  (`ready`, fusión de GAP-V2-194).
- 🟡 — Token-as-parameter en `fieldOperatorService.ts` en vez de `getAuthToken()` interno
  (mismo patrón ya documentado como PL-010 en otros módulos) → GAP-V2-196 (`blocked`, size L).
- 🟢 — Saludo/fecha duplicados literalmente en los 4 dashboards de rol → GAP-V2-199 (`later`).

## 7. GAPs generados/actualizados

Segunda pasada (2026-07-06): 11 carriles en paralelo sobre 4 superficies (Admin/Dirección ya
tenía 9 GAPs `ready` de la primera pasada — GAP-V2-001..009, no tocados; + Comercial, Operario/
Almacén, Field como superficies nuevas). Se generaron 83 GAP candidates
(rangos: 010-034 Admin, 050-094 Comercial, 110-153 Operario/Almacén, 170-213 Field), procesados
por `gap-normalizer` el 2026-07-06.

**Fusiones/divisiones detectadas y resueltas** (8 candidatos duplicados, cada uno fusionado en
un GAP canónico y marcado `rejected`):

| Duplicado (`rejected`) | Fusionado en | Motivo |
|---|---|---|
| GAP-V2-070 | GAP-V2-055 | Mismo archivo huérfano `CrmDashboardWidgets.jsx`, confirmado por 2 carriles |
| GAP-V2-071 | GAP-V2-054 | Mismo código muerto `ReminderRow` en `ComercialDashboard/index.js` |
| GAP-V2-092 | GAP-V2-050 | Mismo bug de `handleCancel`/diálogo de cancelación, ángulos técnico + negocio |
| GAP-V2-075 | GAP-V2-052 + GAP-V2-053 | Mezclaba 2 componentes distintos, cada uno ya cubierto por separado — dividido y fusionado |
| GAP-V2-151 | GAP-V2-112 | Mismo hallazgo (`storeId` no filtra recepciones/salidas), ángulos técnico + negocio |
| GAP-V2-115 | GAP-V2-133 + GAP-V2-134 | Mezclaba hook `useReceptionsList` + `OperarioDashboard`, cada uno ya cubierto por separado — dividido y fusionado |
| GAP-V2-194 | GAP-V2-170 | Mismo hallazgo (FieldDashboard ignora error de rutas/pedidos), confirmado por 2 carriles |
| GAP-V2-212 | GAP-V2-172 | Mismo síntoma (conteo de "Pedidos operativos" incorrecto), causas complementarias |

**Resultado tras normalizar — 75 GAPs resultantes** (83 candidatos − 8 fusionados/rechazados):

*Ready (51):* GAP-V2-010, 012, 013, 014, 015, 016, 017, 021, 022, 030, 033 (Admin) ·
GAP-V2-050, 051, 052, 053, 054, 055, 056, 057, 072, 074, 076, 077, 094 (Comercial) ·
GAP-V2-110, 111, 114, 116, 117, 118, 119, 130, 131, 133, 134, 135, 136, 137, 139, 152
(Operario/Almacén) · GAP-V2-170, 171, 173, 174, 190, 192, 193, 195, 197, 210, 211 (Field).

*Blocked (20)* — requieren decisión de Jose o autorización explícita por tamaño L/XL antes de
`ready`:
- Por tamaño L/XL (sin decisión de negocio pendiente, solo autorización de alcance):
  GAP-V2-011, GAP-V2-019, GAP-V2-020, GAP-V2-073, GAP-V2-113, GAP-V2-196.
- Por pregunta de negocio/backend abierta (ver § 9 y resumen de preguntas al final de esta
  sección): GAP-V2-031, GAP-V2-032, GAP-V2-034, GAP-V2-090, GAP-V2-091, GAP-V2-093, GAP-V2-112,
  GAP-V2-132, GAP-V2-140, GAP-V2-150, GAP-V2-153, GAP-V2-172, GAP-V2-198, GAP-V2-213.

*Later (4)* — válidos pero de prioridad P4, no bloqueados: GAP-V2-018, GAP-V2-138, GAP-V2-191,
GAP-V2-199.

*Rejected (8)* — fusionados en otro GAP, ver tabla arriba: GAP-V2-070, GAP-V2-071, GAP-V2-075,
GAP-V2-092, GAP-V2-115, GAP-V2-151, GAP-V2-194, GAP-V2-212.

Ver `docs/ai/gaps/dashboard-home/gaps-registry.md` (a regenerar con
`scripts/build-gaps-registry.mjs` tras esta normalización). Total acumulado del módulo:
9 GAPs `ready` de la primera pasada (GAP-V2-001..009) + 75 resultantes de esta pasada = 84 GAPs
vigentes (no-`rejected`).

### Preguntas de negocio pendientes para Jose (agrupadas, bloquean los GAPs listados)

1. **Fresco/congelado — ¿se modela por categoría/familia de producto?** (GAP-V2-031). Sin esto
   no se puede confirmar si los widgets de stock deben permitir desglosar por tipo de
   conservación.
2. **Visibilidad de rentabilidad/margen para el rol `supervisor`** — ¿debe ocultarse en todos
   los widgets de rentabilidad o en ninguno? (GAP-V2-032, con impacto en si GAP-V2-009 —ya
   `ready`— debería revisarse).
3. **Alcance de "Rentabilidad bruta"** — ¿las líneas auxiliares (portes/extras) tienen coste/
   margen propio o son repercutido puro? (GAP-V2-034).
4. **Filtrado de estadísticas de pedidos por comercial** — ¿el backend soporta (o puede
   soportar) `salesperson_id` en `statistics/orders/*`? (GAP-V2-090, con GAP-V2-091 dependiente).
5. **Utilidad de "Empresas de transporte" (`TransportRadarChart`) para el rol comercial**
   (parte de GAP-V2-091).
6. **Umbral de inactividad (30/7 días) — ¿segmentado por cliente nacional vs. exportación o
   uniforme?** (GAP-V2-093).
7. **Scoping de almacén (`storeId`) en recepciones/salidas de cebo del dashboard operario** —
   ¿ya lo filtra el backend implícitamente o debe añadirse en frontend? (GAP-V2-112, con
   GAP-V2-153 dependiente).
8. **Alcance del refactor `'use client'` de `warehouse/[storeId]/page.js`** — ¿abordar también
   la rama no-operario (admin/técnico) en el mismo GAP o limitar el alcance? (GAP-V2-132).
9. **Consolidación de `storeService`** — ¿cuál de las dos implementaciones paralelas es la
   canónica? (GAP-V2-140).
10. **Escenario de pesaje de la calculadora de peso neto** — ¿pesaje por caja suelta o por
    palet completo? (GAP-V2-150).
11. **Métrica de stock más útil para el operario** en el panel diario (GAP-V2-153).
12. **Alcance del KPI "Pedidos operativos" en Field** — ¿todos los pedidos activos del operador
    o solo los de la ruta activa del día? (GAP-V2-172).
13. **Nombre final para `src/services/fieldOperatorService.ts`** (naming clash con el service
    de dominio homónimo) (GAP-V2-198).
14. **Validez semántica de una autoventa con `routeId` pero sin `routeStopId`** (GAP-V2-213,
    depende de GAP-V2-210 que sí es `ready`).

## 8. GAPs resueltos o descartados

Ninguno todavía — primera pasada, ningún GAP implementado aún.

## 9. Bloqueos y riesgos

20 GAPs `blocked` tras la normalización de 2026-07-06 — ver tabla de preguntas de negocio al
final de §7 para el detalle completo. Resumen:
- 6 bloqueados solo por tamaño L/XL (GAP-V2-011, 019, 020, 073, 113, 196) — no requieren
  respuesta de Jose, solo su autorización explícita de alcance antes de marcarlos `ready`.
- 14 bloqueados por una pregunta de negocio/backend sin resolver (GAP-V2-031, 032, 034, 090,
  091, 093, 112, 132, 140, 150, 153, 172, 198, 213).

GAP-V2-003 (ya `ready` de la 1ª pasada) sigue siendo size L (18 archivos) — riesgo de PR grande
y difícil de revisar; recomendable dividir en sub-GAPs por familia de widget al implementar
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
