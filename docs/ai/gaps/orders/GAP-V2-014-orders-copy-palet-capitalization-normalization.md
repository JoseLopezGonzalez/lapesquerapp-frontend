---
id: GAP-V2-014
title: Normalizar copy de palets, tildes y capitalización restante en Orders Manager
module: orders
category: ux-ui
priority: P3
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/LinkPalletsDialog.tsx
  - src/components/Admin/OrdersManager/CreateOrderForm/index.tsx
  - src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-014 — Normalizar copy de palets, tildes y capitalización restante en Orders Manager

## Problema

La auditoría design-quality pendiente encontró inconsistencias visibles de copy que no están cubiertas por `GAP-V2-009`:

- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx:354`, `357`, `590`, `593` usan "Pallets" en inglés, mientras el resto del módulo usa mayoritariamente "palets".
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx:435`, `458`, `567`, `584`, `646`, `667` mezcla "pallet", "Pallet" y "Pallet ID" con el término español "palet".
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx:371`, `374`, `388`, `391`, `608`, `611`, `626`, `629` usa Title Case en placeholders/opciones de filtro ("Todos los Lotes", "Todos los Productos") mientras el resto de controles operativos tiende a sentence case.
- `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx:304` muestra "Produccion" sin tilde.
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx:124-125` mezcla Title Case ("Gestión de Palets") con "orden" en una superficie donde la entidad se llama "pedido".
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/LinkPalletsDialog.tsx:107` usa Title Case ("Vincular Palets Existentes") frente al botón de entrada sentence case (`Vincular palets existentes`).
- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx:900` y `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx:845` muestran "Crear Pedido" con P mayúscula, inconsistente con otros botones como "Crear pedido nuevo".

## Objetivo

El módulo Orders Manager debe usar una terminología y capitalización consistentes para las mismas entidades y acciones visibles: "palet/palets", "pedido", tildes correctas y sentence case en botones, filtros, títulos secundarios y placeholders equivalentes.

## Contexto

`GAP-V2-009` ya cubre dos inconsistencias concretas: "Envio de Documentos" y el placeholder "ID/id" del buscador. Este GAP complementa ese trabajo con el resto de drift textual detectado en la misma familia de pantallas, sin reabrir el alcance de `GAP-V2-009`.

## Solución propuesta

Normalizar las cadenas visibles en los archivos objetivo:

- Cambiar "Pallet/Pallets/pallet" visible por "palet/palets", salvo nombres técnicos no renderizados.
- Cambiar "Produccion" por "Producción".
- Usar "pedido" en vez de "orden" para la entidad orders.
- Pasar filtros, títulos secundarios y botones equivalentes a sentence case cuando no sean nombres propios.

## Criterios de aceptación

- [ ] No quedan cadenas visibles "Pallet", "Pallets", "pallet" ni "Pallet ID" en `OrderLabels/index.tsx`; se usa "palet/palets" de forma consistente.
- [ ] La cabecera de producción muestra "Producción" con tilde.
- [ ] `OrderPalletsToolbar` usa "pedido" y capitalización consistente con el resto del módulo.
- [ ] El diálogo de vincular palets y los botones de crear pedido usan sentence case coherente.
- [ ] `GAP-V2-009` sigue pudiendo implementarse de forma independiente o junto con este GAP sin conflicto.

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: revisar el detalle de pedido en las secciones Producción, Etiquetas,
# Palets y el formulario de creación, comprobando términos y capitalización.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: `GAP-V2-009`
