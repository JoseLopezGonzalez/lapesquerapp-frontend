# STEP 0a — Alcance del bloque Stock/Inventario/Almacenes

**Fecha**: 2026-02-15  
**Estado**: Pendiente de confirmación del usuario

---

## Entidades del bloque

El bloque **Stock/Inventario/Almacenes** comprende la lógica de:

| Entidad | Descripción | Rutas principales |
|---------|-------------|-------------------|
| **Almacenes (Stores)** | CRUD de almacenes + vista interactiva (mapa, posiciones, palets) | `/admin/stores`, `/admin/stores-manager`, `/admin/stores/:id` |
| **Cajas (Boxes)** | Listado/filtros de cajas en stock | `/admin/boxes` |
| **Palets (Pallets)** | CRUD de palets, vista detalle, etiquetas | `/admin/pallets`, `/admin/pallets/create`, `/admin/pallets/:id` |
| **Recepciones Materia Prima** | Crear y editar recepciones (entrada al almacén) | `/admin/raw-material-receptions`, `/create`, `/:id/edit` |
| **Warehouse (Operario)** | Vista operario por almacén: recepciones, salidas, dashboard | `/warehouse/[storeId]`, `/warehouse/[storeId]/receptions/create`, `/warehouse/[storeId]/dispatches/create` |
| **Dashboard Stock** | Tarjetas de stock en home admin | `/admin/home` (CurrentStockCard, StockBySpeciesCard, StockByProductsCard) |

**Exclusiones explícitas (por ahora):**
- **Salidas de Cebo** (`cebo-dispatches`): relacionado pero flujo distinto; se puede incluir en sub-bloque posterior si se confirma.
- **OrderPallets** (vincular palets a pedidos): pertenece al bloque Pedidos; aquí solo referencias cruzadas (StoreSelectionDialog, LinkPalletsDialog, etc.).

---

## Artefactos por entidad

### 1. Almacenes (Stores)

| Tipo | Archivos / Artefactos |
|------|------------------------|
| **Pages** | `app/admin/stores-manager/page.js`, `app/admin/[entity]/page.js` (entity=stores), `app/admin/[entity]/[id]/page.js` |
| **Components** | `Admin/Stores/index.js`, `StoresManager/Store/index.js`, `StoreCard`, `MapContainer`, `Map`, `Position`, `PositionSlideover`, `PositionPopover`, `PalletKanbanView`, `Filters`, `AddElementToPositionDialog`, `UnallocatedPositionSlideover`, `MovePalletToStoreDialog`, `MoveMultiplePalletsToStoreDialog`, `PalletsListDialog`, `ProductSummaryDialog`, `LoadingStoreDetails`, `LoadingStoresHeader` |
| **Hooks** | `useStore.js`, `useStores.js`, `useStoresOptions.js` |
| **Services** | `storeService.ts`, `services/domain/stores/storeService.js` |
| **Context** | `StoreContext.js` |
| **Config** | `entitiesConfig.js` (stores), `config.ts` (UNLOCATED_POSITION_ID), `useStores.js` (REGISTERED_PALLETS_STORE_ID) |
| **Tests** | ❌ No hay tests para stores/storeService/useStore/useStores |

### 2. Cajas (Boxes)

| Tipo | Archivos / Artefactos |
|------|------------------------|
| **Pages** | `app/admin/[entity]/page.js` (entity=boxes) — usa EntityClient genérico |
| **Components** | EntityClient + config de entitiesConfig.boxes |
| **Services** | Entity API vía fetchWithTenant (boxes endpoint) |
| **Config** | `entitiesConfig.js` (boxes) |
| **Tests** | ❌ No hay tests específicos |

### 3. Palets (Pallets)

| Tipo | Archivos / Artefactos |
|------|------------------------|
| **Pages** | `app/admin/pallets/[id]/page.js`, `PalletClient.js`, `pallets/create/page.js`, `PalletCreateClient.js`, `app/admin/[entity]/page.js` (entity=pallets para listado) |
| **Components** | `Admin/Pallets/PalletDialog`, `PalletView`, `PalletLabelDialog`, `PalletLabel`, `BoxesLabels`, `StoresManager/Store/PositionSlideover/PalletCard` |
| **Hooks** | `usePallet.js` |
| **Services** | `palletService.ts`, `services/domain/pallets/palletService.js` |
| **Helpers** | `helpers/pallet/boxAvailability.js` |
| **Config** | `entitiesConfig.js` (pallets) |
| **Tests** | ❌ No hay tests para palletService/usePallet |

### 4. Recepciones Materia Prima

| Tipo | Archivos / Artefactos |
|------|------------------------|
| **Pages** | `app/admin/raw-material-receptions/create/page.js`, `[id]/edit/page.js`, `app/admin/[entity]/page.js` (entity=raw-material-receptions), `app/warehouse/[storeId]/receptions/create/page.js` |
| **Components** | `Admin/RawMaterialReceptions/CreateReceptionForm`, `EditReceptionForm`, `ReceptionPrintDialog`, `ReceptionSummaryDialog`, `AllPalletsLabelDialog`, `Warehouse/OperarioCreateReceptionForm` |
| **Hooks** | `useReceptionForm.js` |
| **Services** | `rawMaterialReceptionService.js`, `services/domain/raw-material-receptions/rawMaterialReceptionService.js`, `getReceptionChartData.js`, stats |
| **Helpers** | `receptionCalculations.js`, `receptionTransformations.js`, `receptionValidators.js`, `receptionErrorHandler.js` |
| **Context** | `RawMaterialReceptionsOptionsContext.js` |
| **Config** | `entitiesConfig.js` (raw-material-receptions) |
| **Tests** | ✅ `receptionCalculations.test.js`, `receptionTransformations.test.js` |

### 5. Warehouse (Operario)

| Tipo | Archivos / Artefactos |
|------|------------------------|
| **Pages** | `app/warehouse/[storeId]/page.js`, `receptions/create/page.js`, `dispatches/create/page.js` |
| **Components** | `WarehouseOperatorLayout`, `OperarioDashboard`, `OperarioCreateReceptionForm`, `ReceptionsListCard`, `DispatchesListCard`, `DispatchPrintDialog`, `TablePagination` |
| **Services** | `storeService.ts` (getStore), rawMaterialReceptionService, ceboDispatchService (para dispatches) |
| **Tests** | ❌ No hay tests E2E ni unitarios para warehouse |

### 6. Dashboard Stock (tarjetas en home)

| Tipo | Archivos / Artefactos |
|------|------------------------|
| **Components** | `Dashboard/CurrentStockCard`, `StockBySpeciesCard`, `StockByProductsCard` |
| **Services** | `storeService.ts` (getTotalStockStats, getStockBySpeciesStats, getStockByProducts) |
| **Tests** | ❌ No hay tests |

---

## Resumen de alcance

| Categoría | Cantidad |
|-----------|----------|
| **Páginas** | ~12 (stores, boxes, pallets, receptions, warehouse) |
| **Componentes** | ~35+ |
| **Hooks** | 5 (useStore, useStores, useStoresOptions, usePallet, useReceptionForm) |
| **Services** | 5+ (storeService, palletService, rawMaterialReceptionService, domain services) |
| **Contexts** | 2 (StoreContext, RawMaterialReceptionsOptionsContext) |
| **Helpers** | 5 (receptionCalculations, receptionTransformations, receptionValidators, receptionErrorHandler, boxAvailability) |
| **Tests existentes** | 2 (receptionCalculations, receptionTransformations) |

---

## Componentes críticos por tamaño (P0/P1)

| Archivo | Líneas | Prioridad |
|---------|--------|-----------|
| `CreateReceptionForm/index.js` | ~1093 | **P0** (>200) |
| `OperarioCreateReceptionForm/index.js` | ~928 | **P0** (>200) |
| `useStore.js` | ~766 | **P0** (hook muy grande) |
| `Store/index.js` | ~244 | **P1** (>150) |

---

## Flujos principales a preservar

1. **Admin** → Almacenes → Ver listado / Crear-Editar almacén / Abrir Almacenes interactivos (stores-manager)
2. **Admin** → Almacenes interactivos → Seleccionar almacén → Ver mapa/posiciones/palets → Gestionar posiciones, mover palets, etiquetas
3. **Admin** → Cajas / Palets → Listar, filtrar, ver detalle, crear palet
4. **Admin** → Recepciones → Crear recepción / Editar recepción
5. **Operario** → Warehouse → Dashboard del almacén → Crear recepción / Crear salida
6. **Admin Home** → Ver tarjetas de stock (total, por especie, por producto)

---

## ¿Confirmas el alcance?

Por favor confirma o indica ajustes:

- ¿Incluir **Salidas de Cebo** (`cebo-dispatches`) en este bloque o dejarlo fuera?
- ¿Incluir **OrderPallets** (vincular palets a pedidos) solo como referencias cruzadas o como parte del alcance?
- ¿Alguna entidad/artefacto que añadir o quitar?

Una vez confirmado, procederé con **STEP 0** (documentar comportamiento actual de UI) y **STEP 1** (análisis con Rating antes).
