---
id: GAP-V2-006
title: CreateOrderForm en desktop no tiene forma de cancelar/cerrar
module: orders
category: ux-ui
priority: P1
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/CreateOrderForm/index.tsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-006 — CreateOrderForm en desktop no tiene forma de cancelar/cerrar

## Problema

El panel de creación de pedido (`CreateOrderForm`) recibe una prop `onClose` (ver
`src/components/Admin/OrdersManager/CreateOrderForm/index.tsx:81,144`) que `OrdersManager`
pasa siempre (`onClose={handleCloseDetail}` en
`src/components/Admin/OrdersManager/index.tsx:323-327`, sin condicionar a `isMobile` como sí
se hace con `<Order onClose={isMobile ? handleCloseDetail : undefined} />` unas líneas antes).

Sin embargo, la rama **desktop** de `CreateOrderForm` (el `return` que arranca en la línea 576,
usado cuando `!isMobile`) nunca invoca ni renderiza nada que use `onClose`:

- El header del panel (líneas 578-584) solo muestra el título `Crear nuevo pedido`, sin botón
  de cerrar/volver.
- El footer del formulario (líneas 889-902) solo contiene el botón `type="submit"` ("Crear
  Pedido"). No hay botón "Cancelar".

En contraste, `CreateOrderFormMobile.jsx` sí usa `onClose` para renderizar un botón de volver
(`src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx:149,162-163,217`).

Resultado: en desktop, una vez el usuario pulsa "Crear pedido nuevo", la única forma de salir
del formulario de creación es hacer clic en otro pedido de la lista lateral — no existe una
acción explícita de cancelar. Esto contradice el patrón documentado en
`.claude/design-context.md` §4 Forms ("Cancel: second-to-last in DialogFooter/página,
`variant="outline"`") y §Action Buttons ("Cancel: second-to-last ... `variant="outline"`").

## Objetivo

En desktop, el panel de creación de pedido debe ofrecer una acción explícita para cancelar y
volver al estado "Seleccione un pedido", igual que ya ocurre en mobile.

## Contexto

`OrdersManager/index.tsx` ya expone `handleCloseDetail` y lo pasa sin condicionar a
`CreateOrderForm`. El problema es exclusivamente que la rama desktop del componente hijo no lo
usa. No requiere cambios en el padre.

## Solución propuesta

- Añadir un botón "Cancelar" (`variant="outline"`) junto al submit en el footer
  (líneas 889-902), colocado antes del submit (`flex justify-end gap-2`), que invoque `onClose`.
- Opcional/complementario: añadir un botón de cerrar en el header del panel (línea 578-584),
  consistente con el patrón de `OrderHeaderMobile`/`OrdersList` (icon button, `aria-label`).
- Si hay cambios sin guardar en el formulario, evaluar si aplica el mismo patrón de
  confirmación con `AlertDialog` que usa `PalletDialog` (ver design-context.md Reference Views)
  — no es obligatorio para este GAP si el formulario de creación no tiene ese patrón hoy, pero
  debe documentarse como fuera de alcance si se descarta.

## Criterios de aceptación

- [ ] En desktop, existe un botón "Cancelar" visible en el panel de creación de pedido que
      cierra el panel y vuelve al estado vacío ("Seleccione un pedido").
- [ ] El botón usa `variant="outline"` y se posiciona antes del submit, según el patrón de
      `design-context.md` §4 Forms.
- [ ] No se rompe el flujo mobile existente (`CreateOrderFormMobile` no se toca salvo que se
      decida compartir lógica).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en desktop (viewport ≥1280px), abrir "Crear pedido nuevo" desde OrdersManager y
# verificar que el nuevo botón Cancelar cierra el panel sin crear el pedido.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno detectado
