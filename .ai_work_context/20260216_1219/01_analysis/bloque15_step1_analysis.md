# Bloque 15: Informes básicos — STEP 1: Analysis

**Fecha**: 2026-02-16  
**Rating antes: 7/10**

## Justificación del rating

- **Fortalezas**: React Query en todos los hooks ✅, orderService/storeService en TypeScript ✅, storeService.test y orderService.test existen ✅, shadcn/ui + Recharts ✅
- **Debilidades**: useDashboardCharts, useOrdersStats, useStockStats en .js; getReceptionChartData, getDispatchChartData en .js; sin tests para chart services ni hooks de informes; getCurrentTenant en vez de useTenant

## Prioridades por entidad

| Entidad | P0 | P1 | P2 |
|---------|----|----|-----|
| useDashboardCharts | — | Migrar a TS | — |
| useOrdersStats | — | Migrar a TS | — |
| useStockStats | — | Migrar a TS | — |
| getReceptionChartData | — | Migrar a TS | Tests |
| getDispatchChartData | — | Migrar a TS | Tests |
| Hooks useDashboardCharts/useOrdersStats | — | — | Tests unitarios |

## Technical Debt

- JavaScript en hooks de informes y chart services
- Sin tipos explícitos en respuestas de chart data
- getCurrentTenant (P2: TenantContext no obligatorio si no hay problemas)

## Improvement plan (sub-blocks)

1. **Sub-block 1**: Migrar useDashboardCharts.js → .ts, getReceptionChartData.js → .ts, getDispatchChartData.js → .ts
2. **Sub-block 2**: Migrar useOrdersStats.js → .ts, useStockStats.js → .ts
3. **Sub-block 3**: Añadir tests para getReceptionChartData y getDispatchChartData
4. **Sub-block 4**: Tipos para respuestas de chart (opcional si tiempo)

Riesgo: Bajo. No hay cambio de contrato ni lógica de negocio.
