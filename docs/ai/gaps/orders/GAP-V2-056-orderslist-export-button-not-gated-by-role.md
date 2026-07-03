---
id: GAP-V2-056
title: Botón "Exportar" de OrdersList visible en vista comercial readOnly sin capacidad explícita
module: orders
category: architecture-refactor
priority: P1
risk: medium
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/OrdersList/index.tsx
  - src/components/Comercial/CRM/ComercialOrdersManager.tsx
  - src/services/orderService.ts
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-056 — Botón "Exportar" de OrdersList visible en vista comercial readOnly sin capacidad explícita

## Problema

`src/components/Admin/OrdersManager/OrdersList/index.tsx:210-246` renderiza tres acciones en la
barra de herramientas desktop del listado: "Vista de Producción" (gateada por `!readOnly`, línea
212), "Crear nuevo pedido" (gateada por `canCreateOrder`, línea 224) y "Exportar" (líneas 236-245),
que se renderiza **sin ninguna condición** — ni `readOnly`, ni `canCreateOrder`, ni ninguna
capacidad equivalente a `canViewCostData` (la señal introducida en GAP-V2-020 para separar
lectura de visibilidad económica).

`ComercialOrdersManager.tsx:173-191` monta `<OrdersList ... readOnly canCreateOrder={canCreateOrder} />`
— el botón de exportar queda visible y funcional para el rol `comercial` en modo lectura, invocando
`downloadActivePlannedProductsXls()` (`src/services/orderService.ts:437-448`), que descarga
`orders/xlsx/active-planned-products` sin ningún filtro de capacidad en el frontend.

Precedente directo: `src/lib/orders/orderReadOnlyPermissions.ts:1-6` ya bloquea la sección
`export` **dentro del detalle de un pedido individual** (pestaña "Descargas", `sectionsConfig.ts:90`)
para comercial en curso, pero esa lista no cubre el botón de exportación a nivel de listado — son
dos superficies de exportación distintas y solo una quedó cubierta por el fix de GAP-V2-020/021.
No se ha verificado si el xlsx de "productos planificados activos" incluye columnas de coste/precio
(el nombre del reporte sugiere datos de producción — cajas/kg — similares a `ProductionView`, no
necesariamente económicos), pero el patrón establecido por GAP-V2-020 es no asumir que una acción
compartida es segura para una vista readOnly/comercial sin una capacidad explícita.

## Objetivo

Ninguna acción de exportación a nivel de listado debe quedar visible/ejecutable en una vista
`readOnly`/comercial sin pasar por la misma disciplina de capacidad explícita (`canExportListData`
o equivalente) ya aplicada a "Crear" y "Vista de Producción" en el mismo componente.

## Contexto

Continuación de GAP-V2-020/GAP-V2-021 (mismo módulo, mismo patrón `readOnly` vs. capacidad
explícita). Esta vez la superficie no auditada es el listado (`OrdersList`), no el detalle
(`Order`). El propio componente ya demuestra el patrón correcto para dos de tres botones — el
tercero quedó fuera por omisión, no por decisión de diseño.

## Solución propuesta

1. Confirmar con backend/Jose si `orders/xlsx/active-planned-products` incluye campos de
   coste/precio/margen.
2. Añadir una prop explícita a `OrdersList` (p.ej. `canExportListData?: boolean`, default
   `!readOnly` para no romper el comportamiento actual en `/admin`) y gatear el botón "Exportar"
   con ella, siguiendo el mismo patrón que `canCreateOrder`.
3. Pasar `canExportListData={false}` desde `ComercialOrdersManager.tsx` si el paso 1 confirma
   datos sensibles; si el reporte resulta no sensible, documentar la decisión explícitamente en
   `orderReadOnlyPermissions.ts` o en un comentario en el propio componente para que quede
   trazado por qué el botón permanece visible.

## Criterios de aceptación

- [ ] Verificado (con backend o Jose) si el xlsx exportado contiene coste/precio/margen.
- [ ] Si contiene datos sensibles: el botón "Exportar" de `OrdersList` no aparece en
      `/comercial/orders-manager`.
- [ ] Si no contiene datos sensibles: decisión documentada explícitamente (comentario o entrada en
      `orderReadOnlyPermissions.ts`) para que una futura auditoría no vuelva a marcarlo como hueco.
- [ ] El comportamiento en `/admin/orders-manager` no cambia (el botón sigue visible para roles
      internos).

## Plan de validación

```text
npm run lint
npm run type-check
Manual: entrar como comercial en /comercial/orders-manager y confirmar el estado final del botón
Exportar; entrar como administrador en /admin/orders-manager y confirmar que no hay regresión.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-020 (mismo patrón de capacidad explícita, aplicado al detalle en vez
  de al listado), GAP-V2-021 (acciones de creación en `OrdersList` para comercial)
