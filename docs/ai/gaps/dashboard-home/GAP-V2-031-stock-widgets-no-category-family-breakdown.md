---
id: GAP-V2-031
title: Widgets de stock (CurrentStockCard/StockBySpeciesCard/StockByProductsCard) no permiten desglosar por categoría/familia de producto
module: dashboard-home
category: domain-business
priority: P2
risk: low
size: M
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/CurrentStockCard/index.js
  - src/components/Admin/Dashboard/StockBySpeciesCard/index.js
  - src/components/Admin/Dashboard/StockByProductsCard/index.js
  - src/hooks/useStockStats.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-031 — Widgets de stock no permiten desglosar por categoría/familia de producto (posible mezcla fresco/congelado)

## Problema

`CurrentStockCard`, `StockBySpeciesCard` y `StockByProductsCard` (los tres widgets de "stock
actual" del dashboard Admin/Dirección) reportan un único número o un desglose exclusivamente
por especie/producto, sin ningún filtro por categoría o familia de producto:

- `CurrentStockCard` (`src/components/Admin/Dashboard/CurrentStockCard/index.js:17-102`):
  un solo bloque `totalNetWeight` para todo el stock de la empresa.
- `StockBySpeciesCard` (`src/components/Admin/Dashboard/StockBySpeciesCard/index.js:9-84`):
  desglose por especie, sin categoría/familia.
- `StockByProductsCard` (`src/components/Admin/Dashboard/StockByProductsCard/index.js:20-161`):
  desglose por producto con buscador de texto libre, sin filtro estructurado.

En contraste, dos widgets del mismo dashboard que leen datos de un dominio adyacente
(recepciones de materia prima y salidas de cebo) sí exponen `categoryId`/`familyId` como
filtros de primera clase, usando los mismos hooks de catálogo
(`useProductCategoryOptions`/`useProductFamilyOptions`):
`src/components/Admin/Dashboard/ReceptionChart/index.js:52-53,129-168` y
`src/components/Admin/Dashboard/DispatchChart/index.js:52-53,129-168`.

Esto es relevante para el sector porque la categoría/familia de producto es habitualmente
donde se modela la distinción fresco/congelado (u otras distinciones operativas equivalentes:
salazón, ahumado, IV gama, etc.), cada una con requisitos de gestión de stock muy distintos
— el stock fresco tiene riesgo de caducidad y rotación FIFO obligatoria, el congelado no. Un
"Stock actual" que mezcla ambos en un único número (o en un desglose solo por especie) oculta
si la cifra total incluye stock con riesgo de caducidad inminente, información que un
administrador/dirección necesitaría para decisiones de venta urgente o mermas.

## Objetivo

Confirmar con Jose si la distinción fresco/congelado (o equivalente) está modelada como
categoría/familia de producto en el catálogo de PesquerApp. Si es así, los tres widgets de
stock deben permitir el mismo nivel de segmentación por categoría/familia que ya existe en
`ReceptionChart`/`DispatchChart`, para que "Stock actual" pueda leerse desglosado por tipo de
conservación cuando la operativa lo requiera.

## Contexto

Encontrado durante la auditoría domain-business de `dashboard-home` (carril
`domain-business-auditor`), superficie Admin/Dirección. No se ha encontrado en el frontend
ningún campo explícito `is_fresh`/`conservation_type`/`temperature_regime` a nivel de
producto — la distinción fresco/congelado, si existe, probablemente vive en
`productCategoryService`/`productFamilyService` (ya usados en `ReceptionChart`/`DispatchChart`)
en vez de en un campo booleano dedicado. **Esta es una pregunta que requiere confirmación de
Jose antes de implementar**: si la taxonomía actual de categorías/familias no distingue
conservación, el objetivo de este GAP no aplica tal cual y habría que reformularlo.

## Solución propuesta

Sujeta a confirmación de Jose. Si se confirma que categoría/familia sí distingue
fresco/congelado:

1. Añadir filtro `categoryId`/`familyId` (reutilizando `useProductCategoryOptions`/
   `useProductFamilyOptions`, ya existentes) a `StockBySpeciesCard` y `StockByProductsCard`.
2. Extender `getTotalStockStats`/`useTotalStockStats` para aceptar un filtro de
   categoría/familia opcional, de forma que `CurrentStockCard` pueda mostrar (o el usuario
   pueda alternar) el desglose fresco vs. congelado del stock total.

## Criterios de aceptación

- [ ] Confirmación de Jose sobre si fresco/congelado está modelado vía categoría/familia de
      producto (o de otra forma) antes de tocar código.
- [ ] Si aplica: los tres widgets de stock permiten filtrar/segmentar por la misma
      categoría/familia que `ReceptionChart`/`DispatchChart`.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Verificación manual: confirmar que el filtro de categoría/familia en los widgets de stock
# permite aislar stock fresco de stock congelado (o la distinción operativa equivalente).
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
- **Pendiente de confirmación de Jose**: ver sección Contexto.
