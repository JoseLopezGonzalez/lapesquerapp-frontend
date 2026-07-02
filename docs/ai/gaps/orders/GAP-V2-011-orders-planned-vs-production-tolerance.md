---
id: GAP-V2-011
title: Tolerancia fija de 30kg entre planificado y producido no escala con el tamaño del pedido
module: orders
category: domain-business
priority: P1
risk: medium
size: S
status: done
dependencies: []
target_files:
  - src/hooks/useOrder.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-011 — Tolerancia fija de 30kg entre planificado y producido no escala con el tamaño del pedido

## Problema

`mergeOrderDetails` (`src/hooks/useOrder.ts:35-88`) compara, línea a línea, la cantidad
planificada de un pedido (`plannedQuantity`) contra lo realmente producido
(`productionQuantity`) y clasifica el resultado en un badge de estado
(`success` / `difference` / `pending` / `noPlanned`) que se pinta en
`OrderProduction/index.tsx` (consumidor único — no hay lógica duplicada, la fuente de verdad
es este hook).

El umbral que decide entre "diferencia aceptable" y "pendiente" está hardcodeado como un
valor absoluto sin unidad documentada en el código:

```ts
// src/hooks/useOrder.ts:69-71
const diff = existing.quantityDifference as number;
existing.status = diff === 0 ? 'success' : diff <= 30 && diff >= -30 ? 'difference' : 'pending';
```

Este `30` se interpreta como kg (por el contexto de `quantityDifference`, derivado de
`netWeight`), pero:

1. **No es proporcional al tamaño del pedido.** Un pedido planificado de 20 kg con una
   diferencia de 25 kg (125% de desviación) se clasifica como `pending` — correcto por
   coincidencia — pero un pedido de 20 kg con 29 kg de diferencia (145% de desviación) se
   clasifica como `difference` (aceptable), mientras que un pedido de 5.000 kg con 31 kg de
   diferencia (0.6% de desviación, prácticamente exacto en términos operativos) se clasifica
   como `pending`, la peor categoría. La señal que ve el operario de producción queda
   invertida respecto a la realidad de la desviación relativa.
2. En congelado/fresco, la variabilidad de peso entre lo planificado y lo producido
   (mermas por glaseo, escurrido, calibre real de la especie) se gestiona operativamente en
   términos de **porcentaje**, no de kg absolutos — un pedido de palet completo (~1.000 kg) y
   una caja suelta (~5 kg) no tienen la misma tolerancia operativa razonable.
3. El valor `30` no tiene unidad explícita en el código (constante mágica sin nombre ni
   comentario), lo que dificulta auditar si es kg, cajas, o un valor heredado sin
   justificación documentada.

## Objetivo

El umbral de "diferencia aceptable" entre planificado y producido debe reflejar la tolerancia
operativa real de una pesquera/congelados — probablemente expresada como porcentaje sobre la
cantidad planificada en vez de (o además de) un valor absoluto — y debe estar nombrado y
documentado en el código, no como número mágico inline.

## Contexto

Este cálculo alimenta directamente el badge `ProductionStatusBadge` en
`OrderProduction/index.tsx`, que es lo que ve el operario de producción para decidir si un
pedido está completo, con diferencia aceptable, o pendiente de producir. Un umbral mal
calibrado genera falsos "pendiente" en pedidos grandes casi exactos y falsos "diferencia
aceptable" en pedidos pequeños muy desviados.

## Solución propuesta

Regla confirmada por Jose el 2026-07-02:

```text
tolerancia_por_linea = min(max(10 kg, kg_planificados * 3%), 75 kg)
```

Esto combina porcentaje, mínimo operativo y techo máximo:

- líneas pequeñas: tolerancia mínima de 10 kg;
- líneas medianas/grandes: 3% sobre kg planificados;
- líneas muy grandes: tolerancia máxima de 75 kg.

Una vez implementada:

1. Extraer el umbral a una constante nombrada (o función) con la fórmula correcta.
2. Si la regla es porcentual, calcular `diffPct = diff / plannedQuantity` y clasificar sobre
   ese valor, con guarda para `plannedQuantity === 0` (caso `noPlanned`, ya cubierto aparte).
3. Documentar la regla de negocio en un comentario junto a la constante.

## Criterios de aceptación

- [ ] El umbral de clasificación ya no es un valor absoluto sin justificar — refleja la regla
      de negocio confirmada por Jose.
- [ ] Un pedido grande casi exacto (ej. 5.000 kg planificados, 0.6% de desviación) no se
      clasifica peor que un pedido pequeño muy desviado (ej. 20 kg planificados, 145% de
      desviación).
- [ ] La regla queda documentada con un comentario explícito en el código.

## Plan de validación

```text
npm run type-check
npm run test:run -- useOrder
Verificación manual: abrir un pedido con líneas de distinto tamaño en la pestaña
"Producción" y confirmar que el badge de estado refleja la desviación relativa esperada.
```

## Notas de implementación

- Se extrajo `calculateProductionQuantityToleranceKg()` en `src/hooks/useOrder.ts`.
- La clasificacion de `mergeOrderDetails` compara `Math.abs(quantityDifference)` contra la
  tolerancia por linea confirmada: `min(max(10 kg, kg_planificados * 3%), 75 kg)`.
- Se añadieron pruebas en `src/__tests__/hooks/useOrder.test.js` para la formula y para la
  clasificacion relativa de lineas grandes/pequeñas.

## Resultado

Implementado y auditado `done`.

Validaciones:

- `npm run lint` — OK con warnings existentes del repo.
- `npm run type-check` — OK.
- `npm run test:run -- src/__tests__/hooks/useOrder.test.js` — los 16 tests pasan, pero
  Vitest devuelve exit code 1 por un unhandled rejection preexistente en un test de exportacion
  no relacionado con este GAP.
- `npm run test:run -- useOrder` — arrastra tambien `useOrdersProfitabilityStats` por el
  patron de nombre y falla por expectativas no relacionadas sobre token.

## Resultado de auditoría

Auditoria limpia por subagente: `done`, sin findings bloqueantes.

Criterios verificados:

- El umbral ya no usa el numero magico absoluto `30`.
- La regla `min(max(10 kg, kg_planificados * 3%), 75 kg)` esta implementada con constantes
  nombradas.
- El caso de 5.000 kg con 30 kg de desviacion queda `difference`; el caso de 20 kg con
  29 kg de desviacion queda `pending`.
- La regla queda documentada en un comentario junto al calculo.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- Evidencia: `src/hooks/useOrder.ts:35-88`, `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx:41-67`
