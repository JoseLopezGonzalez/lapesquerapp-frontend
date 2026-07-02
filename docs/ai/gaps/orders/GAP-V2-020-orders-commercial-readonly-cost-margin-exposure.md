---
id: GAP-V2-020
title: El detalle comercial readOnly expone coste y margen del pedido
module: orders
category: architecture-refactor
priority: P1
risk: medium
size: M
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/ComercialOrderDetailClient.tsx
  - src/components/Comercial/CRM/ComercialOrdersManager.tsx
  - src/context/OrderContext.tsx
  - src/hooks/useOrder.ts
  - src/hooks/orders/useOrderCostAnalysis.ts
  - src/components/Admin/OrdersManager/Order/index.tsx
  - src/components/Admin/OrdersManager/Order/config/sectionsConfig.ts
  - src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx
  - src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.tsx
  - src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsContent.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.tsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-020 — El detalle comercial readOnly expone coste y margen del pedido

## Problema

`src/components/Admin/OrdersManager/ComercialOrderDetailClient.tsx:9-13` reutiliza el detalle interno con `<Order orderId={orderId} readOnly />`. Ese `readOnly` desactiva edición, pero no oculta datos económicos sensibles:

- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx:183-210` y `422-453` muestran coste total, coste/kg, margen bruto, margen/kg y margen %.
- `src/components/Admin/OrdersManager/Order/config/sectionsConfig.ts:74-79` incluye la sección `analysis`, y `OrderTabsDesktop` solo filtra las secciones bloqueadas recibidas.
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx:119-136`, `174-192`, `334-338`, `435-439` renderiza coste y margen por producto/palet.
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsContent.tsx:132-133`, `OrderPalletCard/index.tsx:312-323` y `OrderPalletTableRow.tsx:97-101` muestran coste de palets.

Además, `src/lib/orders/orderReadOnlyPermissions.ts:1-6` solo bloquea `labels`, `documents`, `incident` y `export` para comercial en curso; `details`, `analysis` y `pallets` siguen visibles.

## Objetivo

Un usuario `comercial` debe poder consultar el pedido en modo lectura sin ver coste, margen ni análisis económico interno.

## Contexto

`readOnly` hoy mezcla dos responsabilidades: deshabilitar acciones de escritura y representar una vista apta para comercial. La primera está parcialmente resuelta; la segunda no, porque los componentes compartidos siguen renderizando campos internos.

## Solución propuesta

Separar permisos de lectura por capacidad, no solo por `readOnly`. Introducir una señal explícita como `canViewCostData`/`viewerRole` desde el detalle comercial y usarla para:

- ocultar la tarjeta/sección de rentabilidad en `OrderDetails`;
- ocultar o bloquear la pestaña `analysis`;
- ocultar columnas/campos de coste en palets;
- evitar cargar `getOrderCostAnalysis` cuando el rol no puede verlo.

La solución ideal debería acompañarse de un contrato API que no devuelva esos campos a roles sin permiso; la UI no debe ser la única frontera.

## Criterios de aceptación

- [x] `/comercial/orders/[id]` y `/comercial/orders-manager` no muestran coste, margen ni análisis económico.
- [x] La pestaña/sección `analysis` no aparece para comercial.
- [x] Palets en vista comercial no muestran `costPerKg`, `totalCost` ni columnas equivalentes.
- [x] `getOrderCostAnalysis` no se invoca desde vistas comerciales.
- [x] El cambio no elimina la visibilidad de coste/margen para roles internos autorizados en `/admin/orders*`.

## Plan de validación

```text
npm run lint
npm run type-check
Manual: entrar como comercial en /comercial/orders/[id] y /comercial/orders-manager, revisar detalle desktop/mobile, pestañas y palets.
Manual: entrar como administrador en /admin/orders/[id] y confirmar que el análisis económico sigue disponible.
```

## Notas de implementación

- Se añade `canViewCostData` como capacidad explícita separada de `readOnly`.
- Las entradas comerciales (`/comercial/orders/[id]` y `/comercial/orders-manager`) montan `Order` con `canViewCostData={false}`.
- `OrderProvider`/`useOrder` propagan la capacidad hasta `useOrderCostAnalysis`, que no invoca `getOrderCostAnalysis` cuando `enabled=false`.
- `analysis` se bloquea en tabs/secciones si `canViewCostData=false`.
- `OrderDetails` y los componentes de palets ocultan coste, margen y columnas equivalentes cuando la capacidad está desactivada.
- La implementación tocó archivos de soporte no listados inicialmente para cumplir el criterio de no invocar el endpoint desde vistas comerciales.

## Resultado

Implementado. Validaciones locales: `npm run lint` sin errores (270 warnings preexistentes), `npm run type-check` OK y `npm run build` OK.

## Resultado de auditoría

`done` — auditoría con subagente limpio sin hallazgos bloqueantes. El auditor confirmó que comercial desactiva coste explícitamente, `analysis` queda filtrada, palets ocultan coste y `getOrderCostAnalysis` queda protegido con `enabled=false`; admin conserva visibilidad al usar el valor por defecto.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno
