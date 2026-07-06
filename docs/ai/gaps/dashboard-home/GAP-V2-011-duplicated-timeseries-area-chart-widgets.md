---
id: GAP-V2-011
title: SalesChart, ReceptionChart y DispatchChart son ~95% código duplicado (mismo componente 3 veces)
module: dashboard-home
category: architecture-refactor
priority: P2
risk: medium
size: L
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/SalesChart/index.js
  - src/components/Admin/Dashboard/ReceptionChart/index.js
  - src/components/Admin/Dashboard/DispatchChart/index.js
  - src/hooks/useDashboardCharts.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-011 — SalesChart, ReceptionChart y DispatchChart son casi el mismo componente triplicado

## Problema

`src/components/Admin/Dashboard/SalesChart/index.js` (300 líneas),
`src/components/Admin/Dashboard/ReceptionChart/index.js` (310 líneas) y
`src/components/Admin/Dashboard/DispatchChart/index.js` (310 líneas) son prácticamente
idénticos carácter a carácter: mismos filtros (especie/categoría/familia/unidad/agrupación),
mismo `AreaChart` de Recharts, mismo `tickFormatter`, mismo `ChartTooltipContent`, mismo
`CardFooter` con total condicional. Las únicas diferencias reales son:

- El hook de datos (`useSalesChartData` / `useReceptionChartData` / `useDispatchChartData`)
- El título (`Ventas` / `Recepciones` / `Salidas de cebo`)
- Un par de strings de copy (`"Análisis de las ventas de productos."` etc.)
- El `id` del `<linearGradient>` (`fillValue` / `fillValue` (duplicado, ver nota) / `fillValueDispatch`)

Ejemplo del bloque de `tickFormatter` duplicado literalmente 3 veces:

```js
tickFormatter={(value) => {
  if (groupBy === 'month')
    return new Date(value + '-01').toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
  if (groupBy === 'week') return value.replace('W', 'S');
  return new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}}
```

Nota adicional: `SalesChart/index.js` y `ReceptionChart/index.js` usan el mismo id de
gradiente `fillValue` en su `<linearGradient>` — si ambos widgets llegaran a montarse en el
mismo árbol DOM (son parte del mismo `Masonry` grid en `Dashboard/index.tsx`), los IDs SVG
duplicados en el documento pueden hacer que el navegador reutilice el primer `<linearGradient>`
para ambos `<Area>`, produciendo un relleno incorrecto en uno de los dos gráficos.

Cualquier cambio futuro (nuevo formato de fecha, nuevo estado vacío, nueva opción de
agrupación) debe repetirse manualmente 3 veces, con alto riesgo de que las copias diverjan
silenciosamente (ya ha empezado a pasar: `SalesChart` no comenta `{/* Formateo condicional
según tipo */}` mientras que `ReceptionChart`/`DispatchChart` sí, señal de ediciones
independientes del mismo bloque).

## Objetivo

Un único componente genérico (p. ej. `TimeSeriesAreaChartCard`) parametrizado por
título/descripción/hook de datos/etiqueta de la serie/copy de estado vacío, usado por los
3 widgets. Los 3 archivos actuales quedan como wrappers finos que solo pasan configuración.

## Contexto

Encontrado durante la auditoría de code-quality del módulo `dashboard-home`
(`docs/ai/modules/dashboard-home/audit.md`). No se solapa con los hallazgos de UI/UX ya
cubiertos por `ui-audit-agent` (GAP-V2-001 a 009) — este es puramente de arquitectura de
componentes.

## Solución propuesta

1. Crear `src/components/Admin/Dashboard/_shared/TimeSeriesAreaChartCard.tsx` (o ubicación
   equivalente ya usada en el proyecto para componentes compartidos de este módulo) con
   props: `title`, `description(unit)`, `useChartData(params)`, `entityLabel` (para el
   tooltip), `emptyStateCopy`, `footerCopy(unit)`, `gradientId` (generado con `useId()` de
   React para evitar colisiones de IDs SVG entre instancias).
2. Migrar `SalesChart`, `ReceptionChart` y `DispatchChart` a usar el componente compartido.
3. Aprovechar la migración para pasar los 3 archivos a `.tsx` (ver también candidato de
   migración JS→TS del módulo).

## Criterios de aceptación

- [ ] Un solo componente contiene la lógica de renderizado del `AreaChart`
- [ ] Los 3 widgets siguen mostrando exactamente los mismos datos y comportamiento que antes
- [ ] Los `<linearGradient>` usan IDs únicos por instancia (sin colisión si se montan a la vez)
- [ ] `npm run lint` y `npm run type-check` limpios

## Plan de validación

```text
npm run lint
npm run type-check
npm run build
# Manual: verificar visualmente los 3 gráficos en /admin/home con filtros distintos
# entre sí simultáneamente (para descartar contaminación cruzada del gradiente)
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
