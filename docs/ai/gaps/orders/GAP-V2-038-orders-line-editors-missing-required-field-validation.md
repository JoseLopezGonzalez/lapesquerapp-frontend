---
id: GAP-V2-038
title: Editores de líneas (auxiliares y previsión) permiten guardar sin validar campos requeridos
module: orders
category: ux-ui
priority: P1
risk: medium
size: M
status: candidate
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
cual sí se captura vía `getErrorDescription`, pero no hay ninguna señal *antes* de intentar
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
  exige que exista *alguna* barrera antes del guardado, coherente con el resto del módulo.

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

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-037 (estilo de error inline de campos, si se decide reutilizar el mismo patrón visual)
