---
id: GAP-V2-056
title: Botón "Exportar" de OrdersList visible en vista comercial readOnly sin capacidad explícita
module: orders
category: architecture-refactor
priority: P1
risk: medium
size: S
status: done
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

**Acción por defecto (no requiere esperar la confirmación de contenido del xlsx — gatea por la
misma disciplina de capacidad ya usada por los botones hermanos, independientemente de si el
reporte expone coste/margen):**

1. Añadir una prop explícita a `OrdersList` (p.ej. `canExportListData?: boolean`, default
   `!readOnly` para no romper el comportamiento actual en `/admin`) y gatear el botón "Exportar"
   con ella, siguiendo el mismo patrón que `canCreateOrder` y `!readOnly` de "Vista de
   Producción" en el mismo componente.
2. `ComercialOrdersManager.tsx` monta `<OrdersList readOnly ... />`, por lo que
   `canExportListData` queda en `false` automáticamente por el default — no hace falta pasar
   ningún prop adicional desde ese componente para conseguir el gateo; se documenta así en el
   propio componente (comentario) para que quede explícito que es intencional, no un olvido.

**Seguimiento opcional (no bloquea este GAP):** confirmar con backend/Jose si
`orders/xlsx/active-planned-products` contiene columnas de coste/precio/margen. Si se confirma
que NO contiene datos sensibles, un GAP de seguimiento puede reactivar el botón para comercial
pasando `canExportListData` explícitamente en `ComercialOrdersManager.tsx` — pero mientras no se
confirme, el default seguro (oculto en cualquier vista `readOnly`) es el comportamiento correcto.

## Criterios de aceptación

- [ ] El botón "Exportar" de `OrdersList` está gateado por una capacidad explícita
      (`canExportListData` o equivalente) igual que "Crear" (`canCreateOrder`) y "Vista de
      Producción" (`!readOnly`) en la misma barra de herramientas.
- [ ] El botón "Exportar" no aparece ni es funcional en `/comercial/orders-manager` (por el
      default `!readOnly`, sin necesidad de esperar confirmación sobre el contenido del xlsx).
- [ ] El comportamiento en `/admin/orders-manager` no cambia (el botón sigue visible para roles
      internos).
- [ ] Queda un comentario o nota en el código indicando que el gateo es intencional y que la
      confirmación de contenido del xlsx (coste/margen) es un seguimiento opcional, no un
      bloqueo de este GAP.

## Plan de validación

```text
npm run lint
npm run type-check
Manual: entrar como comercial en /comercial/orders-manager y confirmar el estado final del botón
Exportar; entrar como administrador en /admin/orders-manager y confirmar que no hay regresión.
```

## Notas de implementación

Nota de `gap-normalizer` (2026-07-03): este GAP queda `ready` (no `blocked`) porque el propio
fix propuesto — gatear por `canExportListData` con default `!readOnly` — resuelve el hallazgo
de seguridad/permisos sin necesitar confirmar antes si el xlsx expone coste/margen. La
verificación de contenido del reporte queda como seguimiento opcional, no como bloqueo.

- Añadida prop `canExportListData?: boolean` a `OrdersListProps`, con default `!readOnly`
  (mismo patrón que `canCreateOrder`), siguiendo el mismo estilo que los dos botones hermanos.
- Botón "Exportar" del toolbar desktop envuelto en `{canExportListData && (...)}`, igual que
  "Vista de Producción" (`!readOnly`) y "Crear nuevo pedido" (`canCreateOrder`) en el mismo
  bloque.
- `ComercialOrdersManager.tsx` no pasa `canExportListData` explícitamente — queda en `false`
  automáticamente por el default `!readOnly` (el componente ya monta `<OrdersList readOnly ... />`).
  Añadido comentario explícito junto al JSX documentando que la omisión es intencional.
- `orderService.ts` no requirió cambios — `downloadActivePlannedProductsXls` ya usa
  `fetchWithTenant` sin excepciones; el gateo es puramente de UI en el listado.
- `/admin/orders-manager` no pasa `readOnly`, por lo que `canExportListData` sigue en `true` por
  defecto — sin regresión para roles internos.

## Resultado

`npm run type-check` limpio. `eslint` sobre los 2 archivos tocados: 0 errores (solo 5 warnings
preexistentes en `ComercialOrdersManager.tsx` no relacionados con este cambio — `set-state-in-effect`
y `exhaustive-deps` en código ya existente). Pendiente de verificación manual en
`/comercial/orders-manager` y `/admin/orders-manager` por `gap-auditor`.

## Resultado de auditoría

### Veredicto: ✅ APROBADO (done)

Verificado contra el diff real de los 3 archivos:

- `OrdersList/index.tsx`: nueva prop `canExportListData?: boolean` (línea 53), con
  `canExportListData = canExportListDataProp ?? !readOnly` (línea 89), siguiendo exactamente el
  mismo patrón que `canCreateOrder`. El botón "Exportar" (líneas 239-250) queda envuelto en
  `{canExportListData && (...)}`, en la misma barra de herramientas desktop que `!readOnly`
  (Vista de Producción, línea 215) y `canCreateOrder` (línea 227) — mismo nivel, mismo patrón,
  sin romper el layout flex del contenedor.
- `ComercialOrdersManager.tsx`: monta `<OrdersList readOnly canCreateOrder={canCreateOrder} />`
  sin pasar `canExportListData`, por lo que el default `!readOnly` lo deja en `false`
  automáticamente. Comentario explícito añadido junto al JSX (líneas 189-191) documentando que la
  omisión es intencional y referenciando este GAP.
- `/admin/orders-manager`: no se tocó ningún punto de montaje de `OrdersList` fuera de
  `ComercialOrdersManager.tsx` — no pasa `readOnly`, por lo que `canExportListData` sigue en
  `true` por defecto. Sin regresión.
- `orderService.ts`: confirmado sin diff — coincide con la nota del implementador de que el gateo
  es puramente de UI y no requería cambios en el service.
- `npm run type-check` limpio confirmado en esta auditoría.

Sin hallazgos bloqueantes.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-020 (mismo patrón de capacidad explícita, aplicado al detalle en vez
  de al listado), GAP-V2-021 (acciones de creación en `OrdersList` para comercial)
