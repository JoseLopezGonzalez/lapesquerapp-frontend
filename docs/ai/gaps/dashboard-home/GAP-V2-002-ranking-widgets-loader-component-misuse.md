---
id: GAP-V2-002
title: Widgets de ranking usan el componente `<Loader>` (reservado para session gates) como loading de datos
module: dashboard-home
category: ux-ui
priority: P1
risk: low
size: M
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/OrderRanking/index.js
  - src/components/Admin/Dashboard/SalesBySalespersonPieChart/index.js
  - src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx
  - src/components/Admin/Dashboard/AuxiliaryLinesByCustomerCard/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-002 — Widgets de ranking usan `<Loader>` (session gate) como loading de datos

## Problema

`.claude/design-context.md:377-378` documenta explícitamente que
`src/components/Utilities/Loader/index.js` es aceptable **únicamente** para estados
de carga de sesión/auth de página completa, nunca como reemplazo de `Skeleton` para
datos. Cuatro widgets de este módulo lo usan precisamente para eso:

- `src/components/Admin/Dashboard/OrderRanking/index.js:210-213` — el bloque
  `isLoading ? <Loader /> : ...` sustituye el área del gráfico de barras al
  recargar datos (aunque el widget sí muestra un `Skeleton` completo para el
  estado `speciesLoading` inicial en las líneas 128-159 — la inconsistencia está
  entre el loading inicial, correcto, y el loading de refetch, incorrecto).
- `src/components/Admin/Dashboard/SalesBySalespersonPieChart/index.js:57-60` — este
  es el caso más grave: **no existe ningún `Skeleton`** en todo el archivo. El
  primer render con `isLoading === true` muestra directamente `<Loader />` dentro
  de un contenedor `h-48`, sin ninguna alternativa de shimmer.
- `src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx:78-81` — usa
  `Skeleton` correctamente para el primer load (`isLoading && chartData.length === 0`,
  líneas 49-63), pero al refrescar con datos ya cargados (`isLoading` true con
  `chartData.length > 0`, p.ej. al cambiar el rango de fechas) sustituye **todo** el
  contenido por `<Loader />`, perdiendo el gráfico que ya estaba visible en pantalla.
- `src/components/Admin/Dashboard/AuxiliaryLinesByCustomerCard/index.tsx:77-80` —
  mismo patrón que el anterior.

## Objetivo

Ningún widget de este módulo usa `<Loader>` para loading de datos. Los 4 widgets
usan `Skeleton` para el primer load, y para el caso de refetch con datos ya
visibles (`AuxiliaryLinesByProductCard`, `AuxiliaryLinesByCustomerCard`) el gráfico
existente permanece visible con un overlay ligero en vez de ser sustituido por
completo — replicando el patrón "processing overlay on top of already-loaded data"
documentado en `design-context.md:217` (p.ej. `Loader2` pequeño con
`backdrop-blur-sm`, no el componente `<Loader>` de página completa).

## Contexto

Ninguna dependencia. Comparte causa raíz con GAP-V2-001 (loading state que no
respeta el patrón Skeleton-first documentado), pero aquí el componente mal usado es
`<Loader>` (el de session gate), no `Loader2` + texto suelto.

## Solución propuesta

1. `SalesBySalespersonPieChart`: añadir un bloque `Skeleton` para el primer load
   (mismo tamaño que el `ChartContainer`, `aspect-square max-h-[300px]`), eliminar
   el `<Loader />` y el import de `Loader` de `@/components/Utilities/Loader`.
2. `OrderRanking`: sustituir el `<Loader />` de refetch (línea 210-213) por un
   `Skeleton` del área del gráfico o, si se prefiere no perder el gráfico visible,
   por un overlay `Loader2` + `backdrop-blur-sm` sobre el gráfico ya renderizado.
3. `AuxiliaryLinesByProductCard` y `AuxiliaryLinesByCustomerCard`: para el caso
   `isLoading && chartData.length > 0`, mantener el `ChartContainer` renderizado y
   superponer un overlay ligero (`Loader2` + `backdrop-blur-sm`, siguiendo el
   patrón documentado), en vez de sustituir el contenido entero por `<Loader />`.
4. Eliminar el import de `Loader` de `@/components/Utilities/Loader` en los 4
   archivos si queda sin uso tras el cambio.

## Criterios de aceptación

- [ ] Ningún archivo de `src/components/Admin/Dashboard/` importa
      `@/components/Utilities/Loader` (búsqueda de grep debe devolver 0 resultados
      en este módulo).
- [ ] `SalesBySalespersonPieChart` muestra `Skeleton` en el primer load.
- [ ] `AuxiliaryLinesByProductCard` y `AuxiliaryLinesByCustomerCard` no pierden el
      gráfico visible al refrescar filtros con datos ya cargados.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "Utilities/Loader" src/components/Admin/Dashboard/
# Manual: en /admin/home, cambiar el rango de fechas en Ranking Pedidos, Ranking
# ventas, Otros Artículos — Ranking por Artículo/Cliente y confirmar que no
# aparece el spinner de página completa ni se pierde el gráfico ya visible.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-001
