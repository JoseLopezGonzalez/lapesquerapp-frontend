---
id: GAP-V2-091
title: Índice de array como key en el resumen de productos por palet, duplicado en 4 archivos
module: pallets
category: code-quality
priority: P4
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/SearchPalletCard/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/AddElementToPositionDialog/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-091 — `key={index}` en el resumen de productos de un palet, repetido en 4 archivos

## Problema

El mismo patrón de renderizado del resumen de productos por palet
(`productsSummaryArray.map((product, index) => ...)`) usa el índice del array como
`key` en 4 archivos distintos de las Superficies B y C de esta pasada, señal de que
el bloque se copió/pegó entre el flujo de mover palets (Stores) y el flujo de
vincular palets (Orders) sin extraerse a un componente compartido:

- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx:251-252`
- `src/components/Admin/OrdersManager/Order/OrderPallets/SearchPalletCard/index.tsx:137-138`
- `src/components/Admin/Stores/StoresManager/Store/AddElementToPositionDialog/index.tsx:321`
  (dentro de `PalletList`, el sub-componente local del archivo)
- `src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx:347-349`
  (dentro de `getPalletInfo`/`PalletSection`)

En los 4 casos, `productsSummaryArray` es un array derivado de `box.product.id`
(agrupado por producto) — cada elemento tiene un `id` de producto disponible en el
objeto `product` fuente, así que existe una key estable real (`product.id` o
`product.name` si el id no se propaga al resumen) que no se está usando. Viola
REACT PATTERNS del checklist ("No array index as key in lists with dynamic items").

Severidad baja en la práctica actual (las listas de productos por palet no suelen
reordenarse ni filtrarse dinámicamente tras el render inicial), pero es el tipo de
duplicación que, si mañana se añade una función de reordenar o filtrar productos
dentro de la tarjeta, provocará bugs de re-render silenciosos (contenido de un item
desplazándose al key de otro) en los 4 sitios a la vez por venir del mismo origen
copiado.

## Objetivo

Los 4 archivos usan una key estable (id o nombre de producto) en vez del índice del
array, y de paso queda documentado que es el mismo bloque duplicado 4 veces — útil
para una futura extracción a componente compartido si se decide abordar la
duplicación en sí (fuera del alcance de este GAP puntual).

## Contexto

Encontrado durante la revisión de código de las Superficies B y C de esta segunda
pasada del módulo `pallets`. Cambio mecánico y de bajo riesgo.

## Solución propuesta

En los 4 sitios, cambiar `key={index}` por `key={product.id ?? product.name ?? index}`
(fallback a index solo si ninguno de los dos identificadores está disponible, para no
romper el render si el dato viene incompleto).

## Criterios de aceptación

- [ ] Los 4 archivos usan `product.id`/`product.name` como key primaria, con index
      solo como fallback última instancia.
- [ ] El render visual de las tarjetas de palet no cambia.
- [ ] `npm run lint` sin nuevos errores.

## Plan de validación

```text
npm run lint
grep -rn "key={index}" src/components/Admin/OrdersManager/Order/OrderPallets/ src/components/Admin/Stores/StoresManager/Store/
# debe devolver 0 resultados tras el fix (sobre estos 4 archivos)
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: ninguno
