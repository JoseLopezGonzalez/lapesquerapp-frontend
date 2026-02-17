# Análisis — Referencias en el codebase

**Estado**: Completado  
**Última actualización**: 2025-02-17

## Flujo operario (recepciones)

| Elemento | Ruta | Uso para cebo |
|----------|------|----------------|
| Página create | `src/app/admin/raw-material-receptions/create/page.js` | Patrón: sesión, `isOperario`, operario sin Card + estado éxito/formulario; otros con Card. |
| Formulario | `src/components/Warehouse/OperarioCreateReceptionForm/index.js` | Stepper, diálogo línea, empty state, "Añadir línea". Clonar y adaptar textos a "salida de cebo". |
| Hook | `src/hooks/useOperarioReceptionForm.js` | **Crítico**: en `goNext` (líneas 284–301) está el aviso "Algunas líneas no tienen cajas" con `notify.action` y `someLinesWithoutBoxes`. En cebo operario **no** ejecutar esa rama; envío directo. |
| Éxito | `src/components/Warehouse/ReceptionSuccessActions/index.js` | Referencia para CeboSuccessActions; ya enlaza a `/admin/cebo-dispatches/create?supplierId=...`. |

## Flujo admin (recepciones)

| Elemento | Ruta | Uso para cebo |
|----------|------|----------------|
| Formulario | `src/components/Admin/RawMaterialReceptions/CreateReceptionForm/index.js` | Tabs "Por Líneas" / "Por Palets". Para cebo: **solo líneas** (sin Tabs, sin PalletDialog, sin `temporalPallets`). |
| Hook | `src/hooks/useAdminReceptionForm.js` | Modo `automatic`: `validateReceptionDetails`, `transformDetailsToApiFormat`, payload `supplier`, `date`, `notes`, `details`. En cebo usar solo esta rama; no `mode === 'manual'` ni payload con `pallets`. |

## Servicios y rutas

| Elemento | Detalle |
|----------|---------|
| Cebo | `src/services/domain/cebo-dispatches/ceboDispatchService.js` — ya tiene `create(data)`. Payload: mismo contrato que recepciones modo líneas: `{ supplier: { id }, date, notes, details }`. |
| Página create cebo | No existe `src/app/admin/cebo-dispatches/create/page.js`; el genérico `[entity]/create` usa CreateEntityClient (form genérico). Hay que **crear** página específica como en recepciones. |
| entitiesConfig | `cebo-dispatches`: `hideCreateButton: true` (línea 2854). Añadir `createRedirect: "/admin/cebo-dispatches/create"` y poner `hideCreateButton: false`. |

## Helpers reutilizables

- `transformDetailsToApiFormat` (receptionTransformations.js) — reutilizar para payload `details` de cebo.
- `validateReceptionDetails`, `validateSupplier`, `validateDate` (receptionValidators.js) — reutilizar en admin cebo.
- `calculateNetWeight` (receptionCalculations.js) — reutilizar en operario cebo.
