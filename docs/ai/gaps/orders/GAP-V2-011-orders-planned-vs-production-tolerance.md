---
id: GAP-V2-011
title: Tolerancia fija de 30kg entre planificado y producido no escala con el tamaño del pedido
module: orders
category: domain-business
priority: P1
risk: medium
size: S
status: blocked
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
existing.status =
  diff === 0 ? 'success' : diff <= 30 && diff >= -30 ? 'difference' : 'pending';
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

**Requiere confirmación de Jose antes de implementar** — la regla de tolerancia real
(¿porcentaje?, ¿kg absolutos?, ¿combinación con mínimo y máximo?, ¿depende de si el producto
es fresco o congelado?) es conocimiento operativo que no está documentado en ningún sitio del
código ni en `project-learnings.md`. Una vez confirmada la regla:

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

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- Evidencia: `src/hooks/useOrder.ts:35-88`, `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx:41-67`
