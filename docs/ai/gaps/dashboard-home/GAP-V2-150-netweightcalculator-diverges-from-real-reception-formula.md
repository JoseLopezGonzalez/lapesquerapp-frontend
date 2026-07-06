---
id: GAP-V2-150
title: NetWeightCalculatorDialog usa una fórmula y catálogo de tara distintos de los que usa la creación real de recepciones/salidas
module: dashboard-home
category: domain-business
priority: P1
risk: medium
size: S
status: blocked
dependencies: []
target_files:
  - src/components/Warehouse/NetWeightCalculatorDialog/index.js
  - src/helpers/receptionCalculations.js
  - src/components/Warehouse/OperarioCreateReceptionForm/index.js
  - src/components/Warehouse/OperarioCreateCeboForm/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-150 — NetWeightCalculatorDialog diverge de la fórmula real de peso neto

## Problema

El dashboard del operario ofrece una "Calculadora" de peso neto (`NetWeightCalculatorDialog`)
pensada como herramienta rápida de apoyo antes/durante el registro de una recepción o salida
de cebo. Su fórmula y su catálogo de taras **no coinciden** con los que usa el sistema al
guardar de verdad una recepción o una salida:

- `NetWeightCalculatorDialog/index.js:33-38`:
  ```js
  function calcNetWeight(gross, boxes, tarePerBox, tarePerPallet) {
    ...
    return Math.max(0, g - b * tBox - tPallet);
  }
  ```
  Resta tara por caja **y además** una tara de palet independiente (`tarePerPallet`).

- `src/helpers/receptionCalculations.js:13-19` (`calculateNetWeight`), que es la función que
  realmente usan `OperarioCreateReceptionForm/index.js:125` y
  `OperarioCreateCeboForm/index.js:135,401` para calcular y guardar el peso neto de cada
  línea de recepción/salida:
  ```js
  export const calculateNetWeight = (grossWeight, boxes, tare) => {
    ...
    return Math.max(0, gross - tareWeight * boxCount);
  };
  ```
  **No tiene ningún término de tara de palet.**

Además, el catálogo de taras por caja que ofrece cada uno difiere:

- Calculadora del dashboard (`NetWeightCalculatorDialog/index.js:24-31`,
  `TARE_PER_BOX_OPTIONS`): `1, 2, 2.7, 3, 4, 5` kg.
- Formularios reales de creación (`OperarioCreateReceptionForm/index.js:44-49` y
  `OperarioCreateCeboForm/index.js:44-49`, ambos `TARE_OPTIONS`): `3, 2.7, 1.4, 1.5` kg.

Un operario que usa la calculadora del dashboard para verificar el peso neto de un palet
recién pesado en báscula (bruto − N cajas × tara/caja − tara/palet) obtiene un número que el
sistema **nunca podrá reproducir** cuando dé de alta esa misma recepción: (a) la creación real
no descuenta la tara del palet, y (b) los valores de tara por caja disponibles en la
calculadora (1/2/4/5 kg) ni siquiera existen en el catálogo real de formatos de caja de la
empresa (1.4/1.5/2.7/3 kg). Esto es exactamente el patrón "regla de negocio codificada de
forma distinta en dos sitios del módulo" — con el agravante de que aquí el resultado es un
peso, un dato que alimenta trazabilidad y conciliación de stock.

## Objetivo

Que exista una única fuente de verdad para "peso neto = peso bruto − taras" en el módulo de
almacén, y que la calculadora del dashboard sea consistente con lo que el sistema realmente
calculará al guardar la recepción/salida — en fórmula y en catálogo de tara.

## Contexto

Antes de resolver, hace falta una decisión operativa de Jose (ver pregunta abajo): ¿la
báscula real pesa la caja/línea suelta (sin palet, que es lo que asume
`calculateNetWeight`) o pesa el palet completo cargado (que es lo que asume la fórmula de la
calculadora, con tara de palet aparte)? Si ambos escenarios son reales (p. ej. cebo se pesa
por caja, materia prima a veces se pesa por palet completo), la solución debe dejarlo
explícito en la UI, no fusionar en una única fórmula sin decir cuál aplica a qué flujo.

## Solución propuesta

1. Extraer una única función parametrizable en `receptionCalculations.ts` que soporte tara de
   palet opcional (`calculateNetWeight(gross, boxes, tarePerBox, tarePerPallet = 0)`), usada
   tanto por `OperarioCreateReceptionForm`/`OperarioCreateCeboForm` como por
   `NetWeightCalculatorDialog`.
2. Unificar el catálogo de tara por caja en una única constante compartida (mismo
   `TARE_OPTIONS` en los tres sitios), en vez de tres arrays literales redundantes.
3. Si tras la conversación con Jose se confirma que son dos escenarios de pesaje distintos,
   añadir un selector explícito en la calculadora ("Pesaje por caja" vs. "Pesaje de palet
   completo") en vez de mostrarla como una fórmula genérica sin contexto.

## Criterios de aceptación

- [ ] Existe una única función de cálculo de peso neto usada por los 3 componentes.
- [ ] El catálogo de tara por caja es idéntico en los 3 sitios (o está justificado por qué
      difiere, documentado en código).
- [ ] Un operario que introduce los mismos valores de bruto/cajas/tara en la calculadora y en
      el formulario real de creación obtiene el mismo peso neto.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run  # si existen tests de receptionCalculations.js, ampliarlos con el caso tara/palet
Verificación manual: introducir el mismo bruto/cajas/tara en la calculadora y en
OperarioCreateReceptionForm y comparar el peso neto resultante.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
