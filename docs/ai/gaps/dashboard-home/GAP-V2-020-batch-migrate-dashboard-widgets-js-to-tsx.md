---
id: GAP-V2-020
title: Migración por lotes JS→TS de los 15 widgets del Dashboard que siguen en .js
module: dashboard-home
category: architecture-refactor
priority: P4
risk: medium
size: XL
status: blocked
dependencies: []
target_files:
  - src/components/Admin/Dashboard/CurrentStockCard/index.js
  - src/components/Admin/Dashboard/TotalQuantitySoldCard/index.js
  - src/components/Admin/Dashboard/OrdersProfitabilitySummaryCard/index.js
  - src/components/Admin/Dashboard/OrderRanking/index.js
  - src/components/Admin/Dashboard/SalesBySalespersonPieChart/index.js
  - src/components/Admin/Dashboard/StockBySpeciesCard/index.js
  - src/components/Admin/Dashboard/StockByProductsCard/index.js
  - src/components/Admin/Dashboard/OrdersProfitabilityProductsCard/index.js
  - src/components/Admin/Dashboard/SalesChart/index.js
  - src/components/Admin/Dashboard/ReceptionChart/index.js
  - src/components/Admin/Dashboard/DispatchChart/index.js
  - src/components/Admin/Dashboard/TransportRadarChart/index.js
  - src/components/Admin/Dashboard/WorkingEmployeesCard/index.js
  - src/components/Admin/Dashboard/WorkerStatisticsCard/index.js
  - src/components/Admin/Dashboard/DailyCalibersBySpeciesCard/index.js
  - src/components/Admin/Dashboard/OrdersProfitabilityTimelineCard/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-020 — 15 de los 22 widgets del Dashboard siguen en .js

## Problema

De las ~22 carpetas de widgets en `src/components/Admin/Dashboard/*/`, solo 6 ya son
`.tsx` (`AuxiliaryLinesByCustomerCard`, `AuxiliaryLinesByProductCard`,
`AuxiliaryLinesChartCard`, `AuxiliaryLinesTotalCard`, `TotalAmountSoldCard`, y
`CompanySetupAlert.tsx`). Los 15 restantes listados en `target_files` siguen en `.js`, en
contra de la regla de oro 3 de `CLAUDE.md` ("nunca crear archivos .js nuevos... migrar al
tocar cualquier archivo legacy") y de la deuda técnica documentada en el propio `CLAUDE.md`
("Codebase mixto JS/TS — servicios legacy en .js. Migrar al tocar cualquier archivo legacy").

**Evaluación de complejidad de migración** (todos son Client Components de presentación
puros, sin generics complejos ni dependencias de tipos externas fuera de los hooks del propio
módulo, ya tipados):

| Archivo | Complejidad | Motivo |
|---|---|---|
| `CurrentStockCard` | LOW | Solo consume un hook ya tipado (`useTotalStockStats`) |
| `TotalQuantitySoldCard` | LOW | ídem (`useOrdersTotalNetWeightStats`) |
| `StockBySpeciesCard` | LOW | ídem (`useStockBySpeciesStats`) |
| `StockByProductsCard` | LOW | ídem + estado local simple (`search`) |
| `WorkingEmployeesCard` | LOW | Solo lectura y formateo de `data` |
| `DailyCalibersBySpeciesCard` | MEDIUM | Maneja `error` con shape no tipado (ver GAP-V2-022) |
| `OrdersProfitabilitySummaryCard` | LOW | Funciones locales sin tipar (ver GAP-V2-013) |
| `OrdersProfitabilityProductsCard` | MEDIUM | Tabla + orden + filtros, más superficie de tipos |
| `OrdersProfitabilityTimelineCard` | MEDIUM | `metricConfig` con claves dinámicas |
| `OrderRanking` | MEDIUM | Combobox + export a Excel (import dinámico de `xlsx`) |
| `SalesBySalespersonPieChart` | LOW | Ver también bug de GAP-V2-010 antes de migrar |
| `SalesChart` / `ReceptionChart` / `DispatchChart` | MEDIUM (LOW si se resuelve GAP-V2-011 primero) | Casi idénticos entre sí |
| `TransportRadarChart` | LOW | Ver también bug de GAP-V2-010 antes de migrar |
| `WorkerStatisticsCard` | HIGH (por tamaño, no por tipos) | 652 líneas — resolver GAP-V2-019 antes o durante la migración |

Ninguno alcanza complejidad HIGH por generics o dependencias externas de tipado — la única
razón de HIGH en `WorkerStatisticsCard` es el tamaño del archivo, no la dificultad de
tipado en sí.

## Objetivo

Los 15 archivos pasan a `.tsx` con tipos explícitos (props, estado, parámetros de
callbacks), sin `any` implícito, siguiendo el patrón ya establecido en los 6 widgets que ya
son `.tsx` de este mismo módulo.

## Contexto

GAP de tamaño XL — no se espera implementar en un único PR. Se documenta como candidato de
migración por lotes según lo permitido para modo MIGRATE ("migrar todos los .js LOW
complexity a .ts como un único GAP"), pero dado el volumen (15 archivos) se recomienda
trocear la implementación en sub-lotes de 3-4 archivos por PR, empezando por los de
complejidad LOW y dejando para el final los que dependen de otros GAPs
(`WorkerStatisticsCard` → GAP-V2-019; `SalesChart`/`ReceptionChart`/`DispatchChart` → GAP-V2-011;
`SalesBySalespersonPieChart`/`TransportRadarChart` → GAP-V2-010).

## Solución propuesta

1. Priorizar migración en este orden: LOW primero (`CurrentStockCard`,
   `TotalQuantitySoldCard`, `StockBySpeciesCard`, `StockByProductsCard`,
   `WorkingEmployeesCard`, `OrdersProfitabilitySummaryCard`), luego MEDIUM
   (`DailyCalibersBySpeciesCard`, `OrdersProfitabilityProductsCard`,
   `OrdersProfitabilityTimelineCard`, `OrderRanking`), luego los que dependen de otros GAPs.
2. Seguir el protocolo de migración `.jsx`→`.tsx` de `CLAUDE.md`: baseline de
   `npm run type-check` antes de cada archivo, migrar uno, type-check inmediato, resolver
   antes de continuar con el siguiente.
3. No mezclar en el mismo commit la migración de tipado con cambios de comportamiento (los
   fixes de GAP-V2-010/011/012/013/019 deben ir en commits/PRs separados, aunque puedan
   secuenciarse antes de migrar el archivo correspondiente).

## Criterios de aceptación

- [ ] Los 15 archivos son `.tsx` sin `any` implícito
- [ ] Ningún archivo `.js` nuevo creado en el proceso
- [ ] `npm run type-check` limpio tras cada sub-lote

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
npm run test:run
```

## Notas de implementación

**Bloqueado por tamaño (gap-normalizer, 2026-07-06):** `size: XL` — el propio GAP ya recomienda
trocearlo en sub-lotes; no se marca `ready` sin que Jose decida el orden/alcance de esos
sub-lotes y autorice explícitamente empezar.

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-010, GAP-V2-011, GAP-V2-013, GAP-V2-019, GAP-V2-022
