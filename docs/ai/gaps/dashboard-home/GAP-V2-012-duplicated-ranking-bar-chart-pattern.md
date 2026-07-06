---
id: GAP-V2-012
title: Patrón "ranking horizontal bar chart" duplicado en OrderRanking, AuxiliaryLinesByProductCard y AuxiliaryLinesByCustomerCard
module: dashboard-home
category: architecture-refactor
priority: P3
risk: low
size: M
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/OrderRanking/index.js
  - src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx
  - src/components/Admin/Dashboard/AuxiliaryLinesByCustomerCard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-012 — Patrón de ranking en barras horizontales triplicado

## Problema

`AuxiliaryLinesByProductCard/index.tsx` y `AuxiliaryLinesByCustomerCard/index.tsx` son casi
idénticos: mismo `BarChart` vertical con `layout="vertical"`, mismo `CartesianGrid`, mismo
`YAxis`/`XAxis` ocultos, mismo `ChartTooltipContent` con formatter custom, mismos dos
`LabelList` (valor a la derecha, nombre dentro de la barra), mismo estado vacío
(`SearchX` + copy), mismo `Skeleton` de carga. La única diferencia real es el shape de
`chartData` (`quantity`/`unit` vs `total`) y el color (`--chart-1` vs `--chart-2`).

`OrderRanking/index.js` reimplementa el mismo patrón de gráfico de barras horizontal por
tercera vez, con variaciones menores (usa `Loader` en vez de `Skeleton` durante `isLoading`,
lo cual ya está señalado en `GAP-V2-002`; y añade filtros extra de agrupación/tipo de valor
que las otras dos cards no necesitan).

## Objetivo

Extraer un componente compartido `RankingBarChart` (nombre de la barra, valor, tooltip
formatter, altura dinámica `Math.max(data.length * 45, 200)`, estado vacío) reutilizado por
los 3 widgets, dejando en cada wrapper solo la lógica específica de filtros y el hook de
datos.

## Contexto

Detectado junto con `GAP-V2-011` (mismo tipo de duplicación mecánica, pero para el
subpatrón de gráfico de barras horizontal en vez de área temporal). No se solapa con
`GAP-V2-002` (que trata el uso incorrecto del componente `Loader` como loading de datos,
carril UI).

## Solución propuesta

1. Crear `src/components/Admin/Dashboard/_shared/RankingBarChart.tsx` parametrizado por
   `data`, `valueFormatter`, `tooltipExtra(payload)` (para el detalle extra que muestra cada
   card: peso/unidad en un caso, total con IVA en el otro), `color`, `emptyStateCopy`.
2. Migrar `AuxiliaryLinesByProductCard` y `AuxiliaryLinesByCustomerCard` primero (son .tsx,
   riesgo bajo).
3. Evaluar si `OrderRanking` (con sus filtros adicionales) puede envolver el mismo
   componente compartido o si su complejidad extra justifica mantenerlo aparte — decidir en
   la implementación, no forzar la unificación si añade complejidad condicional excesiva al
   componente compartido.

## Criterios de aceptación

- [ ] `AuxiliaryLinesByProductCard` y `AuxiliaryLinesByCustomerCard` comparten el mismo
      componente de gráfico de barras
- [ ] Los datos y el comportamiento visual no cambian
- [ ] `npm run lint` y `npm run type-check` limpios

## Plan de validación

```text
npm run lint
npm run type-check
npm run build
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-002 (loading), GAP-V2-011 (duplicación de gráfico de área)
