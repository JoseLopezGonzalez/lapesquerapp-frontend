---
id: GAP-V2-090
title: Algoritmo de reparto de peso y construcción de GS1-128 embebido en el hook, no testeable en aislamiento
module: pallets
category: code-quality
priority: P3
risk: medium
size: S
status: ready
dependencies:
  - GAP-V2-109
target_files:
  - src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts
  - src/components/Admin/OrdersManager/Order/OrderPallets/utils/roundToTwoDecimals.ts
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-090 — Lógica de reparto de peso y GS1-128 embebida en el hook, no extraída a util

## Problema

`handleCreatePalletFromForecast` en
`src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts:580-747`
contiene, definida inline dentro del callback, la lógica de:

1. Construcción del código GS1-128 (`buildGs1128`, líneas 636-651): concatena
   GTIN normalizado, peso formateado y lote en un string con formato
   `(01)...(3100)...(10)...` — formato crítico para la impresión de etiquetas de
   expedición.
2. Reparto del peso total de la previsión entre N cajas (bucle líneas 663-691):
   calcula peso por caja, ajusta la última caja para que la suma cuadre
   exactamente con el total (`totalQty - accumulated`), usando
   `roundToTwoDecimals` (ya extraído a `../utils/roundToTwoDecimals.ts`, buen
   precedente que no se aplicó aquí).

A diferencia de `roundToTwoDecimals` (correctamente extraído a su propio archivo de
utilidad en el mismo módulo), `buildGs1128` y el algoritmo de reparto de peso viven
como funciones anónimas/locales dentro del cuerpo de un `useCallback`, sin exportar,
sin poder importarse ni testearse de forma aislada. `.claude/rules/testing.md`
marca `helpers/` y utilidades puras como prioridad alta para tests — esta lógica,
pese a ser pura y crítica para la corrección del código de barras impreso en la
etiqueta física del palet, no es testeable como está escrita hoy sin renderizar el
hook completo (que a su vez depende de `useOrderContext`, `useSession`,
`useStoresOptions` — mucho más difícil de montar en un test unitario que una
función pura).

## Objetivo

`buildGs1128` y el reparto de peso entre cajas son funciones puras exportadas desde
`utils/`, importables y testeables sin necesidad de montar el hook completo.

## Contexto

Encontrado en la Superficie C (vinculación masiva/creación de palets desde el
pedido) de esta segunda pasada. Bajo riesgo funcional inmediato (el código ya
funciona), pero alto valor de prevención: un error futuro en el formato GS1-128 o en
el reparto de peso solo se detectaría manualmente en una etiqueta impresa, no en CI.

**Depende de GAP-V2-109** (mismo archivo, misma función `buildGs1128`, bug de AI
de precisión incorrecto 3100→3102): implementar primero la corrección del valor en
GAP-V2-109 y después extraer la función ya corregida a `utils/` aquí, para no
extraer una función pura con un bug conocido y tener que tocarla dos veces.

## Solución propuesta

- Extraer `buildGs1128` a `src/components/Admin/OrdersManager/Order/OrderPallets/utils/buildGs1128.ts`,
  con firma pura `(productId, boxGtin, lot, netWeight) => string`, sin depender de
  cierres sobre `productOptionsMap`.
- Extraer el reparto de peso a
  `src/components/Admin/OrdersManager/Order/OrderPallets/utils/distributeWeightAcrossBoxes.ts`,
  función pura `(totalQty, numBoxes) => number[]` (o estructura equivalente),
  reutilizando `roundToTwoDecimals`.
- Añadir tests unitarios para ambas en `src/__tests__/utils/` o
  `src/__tests__/helpers/` siguiendo el patrón de `labelEditorValidation.test.js`
  (casos límite: 1 caja, resto no exacto tras redondeo, GTIN vacío/inválido).
- `handleCreatePalletFromForecast` pasa a importar y llamar ambas utilidades en vez
  de definirlas inline.

## Criterios de aceptación

- [ ] `buildGs1128` y el reparto de peso son funciones exportadas desde `utils/`,
      sin cierres sobre estado del hook.
- [ ] Al menos un test unitario por función cubriendo el caso de redondeo del último
      elemento.
- [ ] El GS1-128 y el reparto de peso generados para un caso real no cambian
      respecto al comportamiento actual (mismo output para los mismos inputs).
- [ ] `npm run type-check`, `npm run lint` y `npm run test:run` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: crear un palet desde previsión con un producto que reparta peso no
# exacto entre cajas (p.ej. 10kg entre 3 cajas), confirmar que la suma de netWeight
# de las cajas generadas sigue coincidiendo con el total y que el GS1-128 impreso
# es idéntico al que se generaba antes del refactor.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** añadida dependencia explícita de
GAP-V2-109 (mismo archivo/función, corrección del AI GS1-128 P0) — implementar
109 primero. GAP-V2-109 ya está `ready` (dependiente a su vez de GAP-V2-078,
también `ready`), así que esta cadena de dependencias es ejecutable de inmediato
sin bloqueo real. Tamaño S — no requiere autorización de Jose.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-089 (split general del hook)
