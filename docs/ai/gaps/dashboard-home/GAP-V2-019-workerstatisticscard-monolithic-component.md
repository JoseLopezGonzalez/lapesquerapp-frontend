---
id: GAP-V2-019
title: WorkerStatisticsCard es un componente monolítico de 652 líneas — dividir en subcomponentes y extraer helpers de formato
module: dashboard-home
category: architecture-refactor
priority: P3
risk: medium
size: L
status: blocked
dependencies: []
target_files:
  - src/components/Admin/Dashboard/WorkerStatisticsCard/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-019 — WorkerStatisticsCard: 652 líneas en un único componente

## Problema

`src/components/Admin/Dashboard/WorkerStatisticsCard/index.js` tiene 652 líneas en un único
componente, muy por encima del umbral documentado en `.claude/rules/components.md`
("mide más de ~80 líneas en el componente padre" como criterio para crear un subcomponente).
Contiene, todo en el mismo archivo y función:

- Sección "Horas Trabajadas" (con breakdown de top/bottom empleados — dos bloques JSX casi
  idénticos, líneas ~220-282)
- Sección "Actividad" (con breakdown de días más/menos activos — otros dos bloques JSX casi
  idénticos, líneas ~319-441)
- Sección "Incidencias" (líneas ~445-522)
- Sección "Anomalías" (líneas ~524-601)
- Sección "Contexto" (líneas ~603-647)

Además, 6 funciones de formato (`formatHours`, `formatPercentage`, `formatDate`,
`formatDateShort`, `getVariationColor`, `getVariationIcon`) están definidas dentro del
cuerpo del componente (líneas 51-111), por lo que se recrean en cada render en vez de vivir
como funciones puras a nivel de módulo o en un helper compartido — contra el patrón de
"lógica de negocio nunca en el componente" de `components.md`.

Los bloques "Top empleados"/"Bottom empleados" y "Días más activos"/"Días menos activos" son
prácticamente el mismo JSX repetido con distinta clase de color (verde/rojo) y distinto
icono — mismo tipo de duplicación mecánica señalada en otros widgets del módulo
(`GAP-V2-011`, `GAP-V2-012`), pero dentro de un único archivo en vez de entre archivos.

## Objetivo

`WorkerStatisticsCard` se reduce a un orquestador que compone subcomponentes con
responsabilidad única (p. ej. `WorkHoursSection`, `ActivitySection`, `IncidentsSection`,
`AnomaliesSection`, `ContextSection`, y un `EmployeeRankingList` reutilizado por
top/bottom y más/menos activos). Los formatters se mueven a un helper de módulo o a
`src/helpers/formats/`.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`. No es uno de los hooks
gigantes protegidos (`useLabelEditor.ts`) — es un componente de presentación, por lo que no
aplica la restricción de "archivo protegido", pero sí viola la guía de tamaño/estructura de
`components.md`.

## Solución propuesta

1. Extraer `formatHours`, `formatPercentage`, `formatDate`, `formatDateShort`,
   `getVariationColor`, `getVariationIcon` a nivel de módulo (fuera del componente) o a
   `src/helpers/formats/` si se reutilizan en otro lugar (verificar duplicados en el resto
   del código antes de decidir la ubicación final).
2. Crear un subcomponente `EmployeeRankingList` (o nombre equivalente) parametrizado por
   lista de empleados + variante de color (verde/rojo), reutilizado en los 4 bloques de
   ranking (top/bottom horas, más/menos días activos).
3. Dividir el resto en subcomponentes por sección (Horas, Actividad, Incidencias, Anomalías,
   Contexto), cada uno recibiendo solo los datos que necesita como props.
4. Mantener `WorkerStatisticsCard` como orquestador delgado que llama a `usePunchesStatistics`
   y distribuye los datos a las secciones.

## Criterios de aceptación

- [ ] `WorkerStatisticsCard/index.js` (o `.tsx` si se migra en el mismo cambio) queda por
      debajo de ~150 líneas
- [ ] Ningún subcomponente supera ~120 líneas
- [ ] El comportamiento visual y los datos mostrados no cambian
- [ ] `npm run lint` y `npm run type-check` limpios

## Plan de validación

```text
npm run lint
npm run type-check
npm run build
# Manual: comparar visualmente la card "Estadísticas de Trabajadores" antes/después
# con el mismo rango de fechas, confirmando que todas las secciones (horas, actividad,
# incidencias, anomalías, contexto) muestran los mismos datos
```

## Notas de implementación

**Bloqueado por tamaño (gap-normalizer, 2026-07-06):** `size: L` — requiere autorización
explícita de Jose antes de marcarlo `ready`, según la regla del proyecto para GAPs L/XL.

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-011, GAP-V2-012 (mismo tipo de duplicación mecánica)
