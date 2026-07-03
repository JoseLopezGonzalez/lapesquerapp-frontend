---
id: GAP-V2-038
title: Editores de líneas (auxiliares y previsión) permiten guardar sin validar campos requeridos
module: orders
category: ux-ui
priority: P1
risk: medium
size: M
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-038 — Editores de líneas (auxiliares y previsión) permiten guardar sin validar campos requeridos

## Problema

`OrderAuxiliaryLines` y `OrderPlannedProductDetails` implementan cada uno su propio editor de
filas inline (mobile: cards, desktop: `Table`), sin usar React Hook Form + Zod (a diferencia de
`OrderEditSheet` y `CreateOrderForm`). El botón "Guardar" de cada fila nunca se deshabilita ni
muestra un error de validación:

- `OrderAuxiliaryLines/index.tsx:442` (mobile) y `:652` (desktop): `<Button
onClick={handleOnClickSaveLine} ...>` — sin `disabled` condicionado a ningún campo.
  `handleOnClickSaveLine` (línea 232) construye el payload directamente con
  `Number(row.quantity)` / `Number(row.unitPrice)` sin comprobar que no sean `NaN`, `0` o que
  `auxiliaryProduct`/`description` no estén ambos vacíos.
- `OrderPlannedProductDetails/index.tsx:582` (mobile) y `:823` (desktop): mismo patrón —
  `handleOnClickSaveLine` (línea 277) convierte `boxes`/`quantity`/`unitPrice` con `Number(...)`
  sin ninguna comprobación previa, y el botón "Guardar" no tiene `disabled`.

Esto contrasta con el resto de acciones del mismo módulo que sí bloquean el envío hasta cumplir un
mínimo:

- `OrderIncident/index.tsx:286` — `disabled={loading || !newDescription}` en "Crear incidencia".
- `OrderDocuments/index.tsx:522` — `disabled={numberOfSelectedDocuments === 0}` en "Enviar
  selección".
- `OrderEditSheet/index.tsx:431` — `disabled={saving || !isDirty || loading}` + validación Zod
  completa antes de enviar.

Un usuario puede pulsar "Guardar" en una línea auxiliar o de previsión sin artículo, sin
cantidad y sin precio, y la petición se envía igualmente (el backend puede rechazarla con 422, lo
cual sí se captura vía `getErrorDescription`, pero no hay ninguna señal _antes_ de intentar
guardar — el usuario descubre el problema solo tras el roundtrip y el toast de error genérico del
backend, sin marcar qué campo falta).

## Objetivo

Guardar una línea auxiliar o de previsión debe bloquear el envío (botón deshabilitado o mensaje
inline) cuando falten los campos mínimos para que la línea tenga sentido de negocio (al menos:
artículo/descripción, cantidad > 0), en vez de depender exclusivamente del error 422 del backend.

## Contexto

- Estas dos superficies ("edición"/"validaciones") estaban `pending` en la cobertura de este
  módulo — no se habían auditado antes.
- No se propone migrar estos editores a React Hook Form + Zod en este GAP (cambio de mayor
  tamaño) — el objetivo es la validación mínima de guardado, no un rediseño del formulario.
- El dominio de negocio de qué constituye una línea "completa" no se cuestiona aquí — solo se
  exige que exista _alguna_ barrera antes del guardado, coherente con el resto del módulo.

## Solución propuesta

Para cada uno de los dos componentes, en `handleOnClickSaveLine`:

1. Definir una función `isRowValid(row)` (auxiliar) / `isDetailValid(detail)` (previsión) que
   compruebe como mínimo: hay artículo o descripción libre, `quantity` es un número > 0, y
   `unitPrice` es un número >= 0 (ajustar umbral exacto con Jose si aplica una regla de negocio
   distinta).
2. Deshabilitar el botón "Guardar" de la fila en edición (`disabled={!isRowValid(row) || saving}`)
   en ambas vistas (mobile card y desktop table row), consistente con el patrón ya usado en
   `OrderIncident`/`OrderDocuments`.
3. Opcional pero recomendado: mostrar un mensaje inline breve bajo el campo incompleto (mismo
   patrón `text-red-400 text-xs` u homólogo que se defina en GAP-V2-037) para que el usuario sepa
   qué falta, no solo que el botón está inactivo.
4. No tocar la lógica de creación/actualización en sí (`auxiliaryLineActions`/
   `plannedProductDetailActions`) — cambio acotado a la capa de presentación/guardia antes del
   submit.

## Criterios de aceptación

- [ ] En ambos componentes, el botón "Guardar" de una fila en edición está deshabilitado mientras
      falten los campos mínimos definidos.
- [ ] No es posible crear una línea con cantidad `0`/vacía o sin artículo ni descripción sin que la
      UI lo impida antes de la petición HTTP.
- [ ] El comportamiento es idéntico en mobile (cards) y desktop (tabla).
- [ ] No se modifica el contrato de `auxiliaryLineActions`/`plannedProductDetailActions` ni el
      payload enviado al backend para filas válidas.

## Plan de validación

```text
npm run lint
npm run type-check
npm run test:run
Verificación manual: en ambas pestañas (Otros artículos / Previsión de productos), añadir una
línea nueva sin rellenar cantidad/artículo y confirmar que "Guardar" permanece deshabilitado en
mobile y desktop hasta completar los campos mínimos.
```

## Notas de implementación

- No se migró ninguno de los dos editores a React Hook Form + Zod (explícitamente fuera de
  alcance según el propio GAP) — validación mínima de guardado únicamente.
- `OrderAuxiliaryLines/index.tsx`: añadida `isRowValid(row)` (función de módulo, pura):
  `hasArticle` (`auxiliaryProduct != null || description.trim() !== ''`) + `quantity` numérico
  finito `> 0` + `unitPrice` numérico finito `>= 0` (cadena vacía se trata como inválido, no
  como `0`). Aplicada como `disabled={!isRowValid(row)}` en el botón "Guardar" de la card mobile
  y de la fila de tabla desktop, y como guard de retorno temprano al inicio de
  `handleOnClickSaveLine` (defensa en profundidad, aunque no hay ruta de submit por teclado que
  la bypasee actualmente).
- `OrderPlannedProductDetails/index.tsx`: mismo patrón con `isDetailValid(detail)`: `hasProduct`
  (`product?.id != null && product.id !== ''`) + `quantity > 0` + `unitPrice >= 0`. Se dejó
  `boxes` fuera de la validación mínima a propósito — el GAP solo prescribe cantidad/precio como
  umbrales numéricos y no se quiso inventar una regla de negocio adicional no solicitada (todas
  las líneas nuevas ya arrancan con `boxes` precargado desde el producto detectado o vacío en el
  flujo de línea manual, sin que el GAP pida bloquear ese campo).
- Ambos editores ya usaban objetos mutables de fila por índice (`rows[index]` /
  `details[index]`) actualizados vía `setRows`/`setDetails` en cada `handleInputChange`, así que
  `disabled` se recalcula en cada keystroke sin necesidad de estado adicional.
- No se tocó `auxiliaryLineActions`/`plannedProductDetailActions` ni el payload enviado — cambio
  acotado a la capa de presentación/guardia antes del submit, como exige el criterio de
  aceptación.

## Resultado

`npm run type-check` limpio. `eslint` sobre los 2 archivos: 0 errores (solo 1 warning
preexistente y no relacionado en `OrderPlannedProductDetails/index.tsx:296`,
`react-hooks/immutability` sobre una mutación directa de `detail.boxes` que ya existía antes de
este GAP). `npm run test:run` completo: 267/289 tests en verde; los 22 fallos (11 ficheros) son
preexistentes y no tocan ninguno de los 2 componentes de este GAP ni sus hooks/services
relacionados (afectan a `receptionCalculations`, `useOrdersProfitabilityStats`,
`useProductionRecord`, `useStores`, `authService`, `getDispatchChartData`,
`getReceptionChartData`, `settingsService`, `storeService`, `DocumentProcessor`,
`useProcessOptions` — ninguno de `orders`/líneas). Pendiente de verificación manual (añadir
línea sin artículo/cantidad y confirmar que "Guardar" permanece deshabilitado en mobile y
desktop, en ambas pestañas) por `gap-auditor`.

## Resultado de auditoría

### Veredicto: ✅ APROBADO (done)

Verificado contra el diff real de ambos archivos:

**`OrderAuxiliaryLines/index.tsx`:**

- `isRowValid(row)` (función de módulo, líneas 71-81): `hasArticle` (auxiliaryProduct no nulo o
  description no vacía tras `trim()`) + `quantity` finito `> 0` + `unitPrice` finito `>= 0`, con
  cadena vacía tratada explícitamente como `NaN` (no como `0`) vía
  `row.quantity === '' ? NaN : Number(row.quantity)`.
- Botón "Guardar" mobile (línea 456: `disabled={!isRowValid(row)}`) y desktop (línea 676:
  `disabled={!isRowValid(row)}`) — ambas vistas cubiertas.
- `handleOnClickSaveLine` (línea 244): `if (!row || !isRowValid(row)) return;` — guard de retorno
  temprano confirmado, defensa en profundidad tal como describe el GAP.
- No se tocó el payload (`AuxiliaryOrderLinePayload`) ni `auxiliaryLineActions`.

**`OrderPlannedProductDetails/index.tsx`:**

- `isDetailValid(detail)` (líneas 96-106): `hasProduct` (`detail.product?.id != null &&
detail.product.id !== ''`) + `quantity` finito `> 0` + `unitPrice` finito `>= 0`. `boxes`
  queda fuera de la validación mínima, tal como documentan las notas — el GAP no lo exige.
- Botón "Guardar" mobile (línea 597: `disabled={!isDetailValid(detail)}`) y desktop (línea 839:
  `disabled={!isDetailValid(detail)}`).
- `handleOnClickSaveLine` (línea 293): `if (!detail || !isDetailValid(detail)) return;` — guard
  de retorno temprano presente.
- No se tocó el payload ni `plannedProductDetailActions`.

**Interacción con GAP-V2-051 (mismo archivo `OrderAuxiliaryLines/index.tsx`):** sin conflicto —
`isRowValid` opera sobre `quantity`/`unitPrice`/artículo, mientras que el cambio de GAP-V2-051
opera sobre `tax.rate`; no hay solapamiento de líneas ni de lógica entre ambos GAPs en el mismo
archivo, confirmado en el diff combinado.

- Desviación de tests documentada y aceptada (regla de `.claude/rules/testing.md`) — no
  bloqueante.
- `npm run type-check` limpio confirmado en esta auditoría.

Sin hallazgos bloqueantes.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-037 (estilo de error inline de campos, si se decide reutilizar el mismo patrón visual)
