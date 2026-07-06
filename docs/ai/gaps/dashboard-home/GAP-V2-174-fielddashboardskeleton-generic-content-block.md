---
id: GAP-V2-174
title: FieldDashboardSkeleton usa un mismo bloque genérico para 3 cards con contenido real distinto
module: dashboard-home
category: ux-ui
priority: P3
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-174 — FieldDashboardSkeleton usa un mismo bloque genérico para 3 cards distintas

## Problema

`FieldDashboardSkeleton` (`src/components/Field/FieldDashboard.jsx:34-63`) genera
las 3 cards del skeleton con un bucle idéntico:

```jsx
{Array.from({ length: 3 }).map((_, i) => (
  <Card key={i} className="border-border/70">
    <CardHeader className="space-y-3">
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-44" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[120px] w-full rounded-xl" />
    </CardContent>
  </Card>
))}
```

El `CardHeader` (icono + título + descripción) sí es fiel a las 3 cards reales, que
comparten esa estructura. Pero el `CardContent` de las 3 cards reales tiene formas
muy distintas entre sí:

- **"Ruta de hoy"** (líneas 113-136): texto de una línea + subtítulo + un botón
  full-width.
- **"Pedidos operativos"** (líneas 152-173): grid de 2 columnas con dos bloques de
  estadística (label + número grande) + un botón full-width.
- **"Actividad reciente"** (líneas 188-207): dos bloques de texto apilados + un
  botón full-width.

El skeleton sustituye las tres por un único bloque rectangular de `h-[120px]` sin
distinguir el grid de 2 columnas de la card central, ni reservar espacio aparte
para el botón (que en las 3 cards reales es un elemento visualmente distinto, con
su propio alto e ícono `ArrowRight`/`ShoppingCart`). El resultado es un salto de
layout perceptible al pasar de skeleton a contenido real, especialmente notorio en
la card "Pedidos operativos" (single block → grid 2 columnas).

## Objetivo

El skeleton de cada card refleja la estructura real de su contenido (grid de
estadísticas vs texto apilado vs estado vacío) y reserva espacio explícito para el
botón, evitando salto de layout al cargar los datos.

## Contexto

Ninguna dependencia. Este hallazgo es de fidelidad de skeleton — si se prefiere,
puede derivarse a una pasada de `/audit-skeletons` para un tratamiento más
exhaustivo (incluye también el caso "Ruta de hoy" con vs sin ruta, que tiene dos
estructuras reales distintas — con datos vs `EmptyState`).

## Solución propuesta

Reemplazar el bucle genérico por 3 bloques de skeleton específicos por card:

1. **"Ruta de hoy":** `Skeleton` de una línea ancha (nombre de ruta) + una línea
   más corta (estado + contador de paradas) + `Skeleton` de alto de botón
   (`h-11`/`MOBILE_HEIGHTS.BUTTON`, ver GAP-V2-171).
2. **"Pedidos operativos":** `grid grid-cols-2 gap-3` con dos bloques `Skeleton`
   que reserven el alto real de los bloques de estadística (`rounded-xl border
   p-4` con label + número), más el `Skeleton` de botón.
3. **"Actividad reciente":** dos bloques `Skeleton` apilados del alto real de los
   bloques de texto, más el `Skeleton` de botón.

## Criterios de aceptación

- [ ] El skeleton de cada card reproduce la estructura real de esa card
      (grid/apilado según corresponda), no un bloque genérico compartido.
- [ ] No hay salto de layout perceptible (CLS) al pasar de skeleton a contenido
      real en ninguna de las 3 cards.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: throttle de red en DevTools para prolongar el estado de loading y
# comparar visualmente skeleton vs contenido real en las 3 cards.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
