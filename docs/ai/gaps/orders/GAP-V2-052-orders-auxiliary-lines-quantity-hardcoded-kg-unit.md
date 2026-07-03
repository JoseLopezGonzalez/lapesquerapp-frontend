---
id: GAP-V2-052
title: La cantidad de una línea auxiliar se muestra siempre en "kg" aunque el catálogo defina otra unidad (ud, sacos...)
module: orders
category: domain-business
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-052 — La cantidad de una línea auxiliar se muestra siempre en "kg" aunque el catálogo defina otra unidad

## Problema

`AuxiliaryProductOption` (`src/types/catalog.ts:110-116`) modela `unit` como campo
obligatorio del catálogo de artículos auxiliares — es decir, cada artículo (nieve, envases,
palets, servicios) ya tiene una unidad canónica definida por el negocio (p.ej. `kg` para
nieve, `ud` para palets/envases). `OrderAuxiliaryLines` incluso autorrellena esa unidad al
seleccionar un artículo del catálogo:

```ts
// línea 196-199
const matched = catalogOptionsMap.get(value);
row.auxiliaryProduct = { id: value, name: matched?.name ?? '' };
if (matched?.unit) row.unit = matched.unit;
```

Pero al **mostrar** la cantidad de la línea (fuera de modo edición), tanto en la vista mobile
como en la desktop, el valor se formatea siempre con `formatDecimalWeight`, que añade el
sufijo `kg` de forma incondicional sin mirar `row.unit`:

- Mobile, línea 383: `{formatDecimalWeight(Number(row.quantity))}`
- Desktop, línea 602: `formatDecimalWeight(Number(row.quantity))`

Para artículos cuya unidad canónica NO es `kg` (p.ej. palets contados en `ud`, sacos, cajas
de envases), la pantalla muestra literalmente "5,00 kg" para una cantidad que en realidad son
5 unidades — una etiqueta de unidad incorrecta en una pantalla que un operario de almacén usa
para verificar qué se está facturando al cliente junto al pedido. Esto es precisamente lo que
`.claude/agents/domain-business-auditor.md` Fase 3 pide verificar ("¿Los pesos/tallas/formatos
se calculan y muestran con la unidad y precisión correctas?") — aquí la unidad mostrada
contradice la unidad real del artículo, pese a que el dato correcto (`row.unit`) ya está
disponible en el mismo componente.

## Objetivo

La cantidad de una línea auxiliar debe mostrarse con la unidad real de esa línea
(`row.unit`), no con un sufijo "kg" fijo independiente del artículo.

## Contexto

No depende de ningún GAP previo. Es un hallazgo aislado en la misma superficie que
GAP-V2-051 (líneas auxiliares), pero de naturaleza distinta (unidad de formato, no regla
fiscal) — se mantiene como GAP separado para no mezclar dos causas raíz distintas en la
misma implementación (ver PL-017/PL-BUILD-05: no mezclar cambios no relacionados en el mismo
commit/PR).

## Solución propuesta

1. Sustituir `formatDecimalWeight(Number(row.quantity))` en las dos vistas (mobile línea
   383, desktop línea 602) por un formateo que combine el número decimal (`formatDecimal`)
   con `row.unit` como sufijo real, cayendo a `kg` solo si `row.unit` está vacío (fallback
   razonable, no supuesto por defecto).
2. Revisar si el mismo patrón debe aplicarse al diálogo de totales (`OrderTotalsSummaryDialog`
   usado en este componente) — los totales ahí son monetarios (`formatDecimalCurrency`), por
   lo que no aplica, pero confirmar que ninguna otra vista de esta pantalla repite el mismo
   sufijo fijo.

## Criterios de aceptación

- [ ] Una línea auxiliar con `unit` distinto de `kg` (p.ej. `ud`) muestra esa unidad en la
      cantidad, no "kg", tanto en mobile como en desktop.
- [ ] Una línea auxiliar con `unit === 'kg'` sigue mostrando `kg` sin regresión visual.
- [ ] Una línea sin `unit` definido (descripción libre sin catálogo) tiene un fallback
      explícito y no rompe el layout.

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual: crear una línea auxiliar seleccionando un artículo del catálogo cuya
unidad no sea "kg" (o forzar unit="ud" con descripción libre) y confirmar que la cantidad
mostrada en modo lectura usa esa unidad, en mobile y desktop.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- Evidencia: `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx:196-199,383,602`
- Referencia de tipo: `src/types/catalog.ts:110-116` (`AuxiliaryProductOption.unit`)
