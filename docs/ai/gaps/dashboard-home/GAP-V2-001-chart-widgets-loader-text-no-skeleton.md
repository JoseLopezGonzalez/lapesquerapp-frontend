---
id: GAP-V2-001
title: Widgets de gráfico con filtros muestran spinner + "Cargando datos..." como loading primario en vez de Skeleton
module: dashboard-home
category: ux-ui
priority: P1
risk: low
size: M
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/SalesChart/index.js
  - src/components/Admin/Dashboard/ReceptionChart/index.js
  - src/components/Admin/Dashboard/DispatchChart/index.js
  - src/components/Admin/Dashboard/AuxiliaryLinesChartCard/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-001 — Widgets de gráfico con filtros usan spinner + texto como loading primario

## Problema

Cuatro widgets del dashboard de Admin/Dirección comparten el mismo layout (Tabs de
agrupación + filtros + área de gráfico de 250px) y los cuatro reemplazan el área del
gráfico, en su estado `isLoading`, por un `Loader2` girando junto al texto
"Cargando datos...", sin ningún `Skeleton` antes ni después:

- `src/components/Admin/Dashboard/SalesChart/index.js:167-171`
- `src/components/Admin/Dashboard/ReceptionChart/index.js:172-176`
- `src/components/Admin/Dashboard/DispatchChart/index.js:172-176`
- `src/components/Admin/Dashboard/AuxiliaryLinesChartCard/index.tsx:64-68`

Esto contradice directamente `.claude/design-context.md`:
- línea 217: *"Loader2 spinner is acceptable only as a processing overlay on top of
  already-loaded data. Never as a primary loading replacement for Skeleton."*
- línea 384: *"Never render 'Cargando...' text as a loading state (except inside
  `<Loader>` for session gates)"*

La inconsistencia es verificable dentro del mismo módulo: `TransportRadarChart`
(`src/components/Admin/Dashboard/TransportRadarChart/index.js:53-54`) y
`DailyCalibersBySpeciesCard` (`src/components/Admin/Dashboard/DailyCalibersBySpeciesCard/index.js:154-166`)
resuelven el mismo tipo de estado con `Skeleton` correctamente — son el patrón de
referencia ya existente en el propio módulo.

Efecto en el usuario: cada vez que Jose o su equipo cambian el rango de fechas,
especie, categoría o familia en estos 4 widgets, el gráfico entero desaparece y es
reemplazado por un spinner centrado con texto, en vez de mantener la forma del
contenido (patrón shimmer). Esto ocurre varias veces por sesión de uso del dashboard,
ya que son los widgets con más filtros interactivos.

## Objetivo

Los 4 widgets muestran un `Skeleton` con la forma del área de gráfico (alto ~250px,
ancho completo) durante `isLoading`, igual que `TransportRadarChart` y
`DailyCalibersBySpeciesCard` ya hacen.

## Contexto

Ninguna dependencia. Los 4 archivos comparten estructura casi idéntica (mismo
`initialDateRange`, mismos hooks de opciones, mismo bloque `isLoading ? ... :
chartData.length > 0 ? ... : ...`), por lo que el fix es mecánico y repetible.

## Solución propuesta

En cada uno de los 4 archivos, sustituir el bloque:

```jsx
<Loader2 className="text-primary h-8 w-8 animate-spin" />
<p className="text-muted-foreground mt-4 text-sm">Cargando datos...</p>
```

por un `<Skeleton className="h-full w-full rounded-xl" />` (o dimensiones
equivalentes a las usadas en `TransportRadarChart`), manteniendo el contenedor
`h-[250px] w-full` que ya envuelve el bloque condicional. Eliminar el import de
`Loader2` de cada archivo si ya no se usa en ningún otro sitio del componente.

## Criterios de aceptación

- [ ] Los 4 widgets usan `Skeleton` (no `Loader2`/spinner ni texto "Cargando...")
      como estado de loading primario del área de gráfico.
- [ ] El import de `Loader2` se elimina de los 4 archivos si queda sin uso.
- [ ] El comportamiento de los estados "sin datos" y "con datos" no cambia.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en /admin/home, cambiar el rango de fechas en Ventas, Recepciones,
# Salidas de cebo y Otros Artículos — Evolución, confirmar que se ve un Skeleton
# (no un spinner con texto) mientras carga cada gráfico.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-002 (mismo problema de fondo en otros widgets, con `<Loader>` en vez de `Loader2`+texto)
