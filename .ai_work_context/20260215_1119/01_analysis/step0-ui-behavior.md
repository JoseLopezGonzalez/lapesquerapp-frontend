# STEP 0 — Documentación del comportamiento actual de UI

**Bloque**: Stock/Inventario/Almacenes  
**Fecha**: 2026-02-15

---

## 1. Almacenes (Stores)

### 1.1 Listado de almacenes (Entity: /admin/stores)

- **UI States**: loading, empty, populated (tabla con filas), error
- **User Interactions**: filtros (id, nombre), crear, editar, ver detalle (redirige a stores-manager si aplica)
- **Data Flow**: EntityClient genérico → API stores con fetch paginado
- **Validation**: react-hook-form + zod en formularios create/edit (entitiesConfig)
- **Permissions**: administrador, direccion, tecnico (nav)
- **Error Handling**: Errores 401/403 → logout; 422 → mensajes de validación en formulario

### 1.2 Almacenes interactivos (Stores Manager: /admin/stores-manager)

- **UI States**:
  - loading (LoadingStoresHeader)
  - empty (sin almacenes reales: card "Crear almacén")
  - populated (scroll horizontal de StoreCards + área de contenido)
  - store selected → Store/StoreContent (mapa o kanban)
  - loading store details (LoadingStoreDetails)
- **User Interactions**:
  - Clic en StoreCard → selecciona almacén y carga Store
  - Clic en "Crear almacén" → /admin/stores/create
  - LoadMoreStoreCard → carga más almacenes (paginated)
  - Dentro de Store: clic en posición del mapa, "Elementos sin ubicar", "Nuevo" (Palet), "Traspaso masivo"
- **Data Flow**: useStores → getStores (paginated); useStore (StoreContext) → getStore(id) + getRegisteredPallets
- **Validation**: Posiciones, palets: validaciones en backend y en diálogos
- **Permissions**: administrador, direccion, operario, tecnico (Almacenes interactivos)
- **Error Handling**: Loading/error en useStores; toast en operaciones de palet

### 1.3 Vista Store (almacén concreto)

- **Modos**:
  - **Almacén fantasma** (id=registered, "En espera"): PalletKanbanView + Traspaso masivo + Filters
  - **Almacén real**: Mapa (MapContainer/Map) + botones (Elementos sin ubicar, Nuevo, Traspaso masivo) + Filters
- **UI States**: loading, error, mapa/kanban con posiciones y palets
- **User Interactions**:
  - Clic en posición → PositionSlideover
  - "Elementos sin ubicar" → UnallocatedPositionSlideover
  - "Nuevo" → Palet (CreatePallet)
  - "Traspaso masivo" → MoveMultiplePalletsToStoreDialog
  - Filtros (types, products, pallets)
- **Data Flow**: StoreContext (useStore) → store.content (positions, pallets)

---

## 2. Cajas (Boxes)

- **UI States**: loading, empty, populated, error
- **User Interactions**: filtros (entitiesConfig.boxes), export xlsx
- **Data Flow**: EntityClient → API boxes
- **Permissions**: administrador, direccion, tecnico
- **Error Handling**: Estándar EntityClient

---

## 3. Palets (Pallets)

### 3.1 Listado (/admin/pallets)

- **UI States**: loading, empty, populated, error
- **User Interactions**: filtros (estado, posición, productos, especies, almacenes, lotes, fechas), crear → /admin/pallets/create
- **Data Flow**: EntityClient → API pallets
- **Permissions**: administrador, direccion, tecnico
- **Error Handling**: Estándar EntityClient

### 3.2 Crear Palet (/admin/pallets/create)

- **UI States**: form, loading submit, success (redirect)
- **User Interactions**: Formulario PalletCreateClient
- **Data Flow**: Form → palletService
- **Validation**: react-hook-form + zod

### 3.3 Detalle Palet (/admin/pallets/[id])

- **UI States**: loading, populated (PalletDialog/PalletView), error
- **User Interactions**: Ver cajas, etiquetas, editar
- **Data Flow**: PalletClient → getPallet(id)

---

## 4. Recepciones Materia Prima

### 4.1 Listado (/admin/raw-material-receptions)

- **UI States**: loading, empty, populated, error
- **User Interactions**: filtros (entity config), crear → /create
- **Data Flow**: EntityClient → raw-material-receptions
- **Permissions**: administrador, direccion, tecnico (operario redirige a warehouse)

### 4.2 Crear recepción (admin)

- **Modos**: automático (líneas) / manual (palets)
- **UI States**: loading options (productos, proveedores), form, isSubmitting, mode change dialog
- **User Interactions**: Cambiar modo, añadir líneas/palets, sincronización de precios, submit
- **Validation**: receptionValidators (supplier, date, details, temporalPallets)
- **Data Flow**: useProductOptions, useSupplierOptions, usePriceSynchronization → createRawMaterialReception
- **Error Handling**: formatReceptionError, toast, backend 422 → setError en formulario

### 4.3 Crear recepción (operario)

- **Stepper**: Paso 0 Especie → 1 Proveedor → 2 Observaciones → 3 Líneas
- **UI States**: step, editingLineIndex, lineDialogOpen, loading options
- **User Interactions**: Navegación por pasos, quick picks (historial localStorage), añadir líneas
- **Validation**: Validación por paso (receptionValidators)
- **Data Flow**: useSupplierOptions, speciesService, productService → createRawMaterialReception
- **Error Handling**: Toast, errores en campos

### 4.4 Editar recepción (/admin/raw-material-receptions/[id]/edit)

- **UI States**: loading, form populated, isSubmitting
- **User Interactions**: Editar campos, guardar
- **Data Flow**: getById → EditReceptionForm → update

---

## 5. Warehouse (Operario)

### 5.1 Página warehouse (/warehouse/[storeId])

- **UI States**: loading (session + store), unauthenticated → redirect /, unauthorized → pantalla "Acceso no autorizado" o redirect, store not found, populated
- **User Interactions**: Operario → OperarioDashboard; Admin/Técnico → Store (vista almacenes interactivos)
- **Permissions**:
  - operario: solo su assignedStoreId; si storeId ≠ assignedId → pantalla "No tienes permisos" + botón "Ir a mi almacén"
  - administrador, tecnico: cualquier almacén
  - otros roles → /unauthorized
- **Error Handling**: Error al cargar store → redirect /unauthorized

### 5.2 OperarioDashboard

- **UI States**: greeting, hora/fecha/día (actualizado cada segundo), cards de recepciones y salidas
- **User Interactions**: Links a crear recepción, crear salida, imprimir
- **Data Flow**: ReceptionsListCard (rawMaterialReceptionService.list), DispatchesListCard
- **ReceptionsListCard**: loading, populated (tabla paginada), toggle cantidades (ocultar/mostrar), imprimir
- **DispatchesListCard**: similar para salidas

### 5.3 Crear recepción (warehouse)

- Mismo OperarioCreateReceptionForm que admin/create (con storeId si aplica)
- onSuccess operario → redirect /admin/home

### 5.4 Crear salida (warehouse/dispatches/create)

- Formulario de salida de cebo
- storeId para contexto

---

## 6. Dashboard Stock (admin/home)

### 6.1 CurrentStockCard

- **UI States**: loading (skeleton), populated (totalNetWeight, totalPallets, totalBoxes, totalStores)
- **User Interactions**: Clic en imagen → /admin/stores-manager
- **Data Flow**: getTotalStockStats(accessToken) en useEffect

### 6.2 StockBySpeciesCard

- **UI States**: loading, populated (gráfico por especie)
- **Data Flow**: getStockBySpeciesStats en useEffect

### 6.3 StockByProductsCard

- **UI States**: loading, populated (tabla con búsqueda)
- **User Interactions**: Buscar en tabla
- **Data Flow**: getStockByProducts en useEffect

---

## 7. Validación de reglas de negocio

| Área | Regla documentada | ¿UI cumple? |
|------|-------------------|-------------|
| Operario solo su almacén | assignedStoreId === storeId | Sí (warehouse page) |
| Operario no reubicar | Ocultar/deshabilitar Reubicar en PalletCard, PalletsListDialog, PositionPopover | Sí |
| Recepciones: proveedor requerido | validateSupplier | Sí |
| Recepciones: fecha requerida | validateDate | Sí |
| Recepciones: al menos una línea/palet | validateReceptionDetails, validateTemporalPallets | Sí |
| Stores: name 3-255 chars, temp -99.99 a 99.99, capacity ≥ 0 | entitiesConfig validation | Sí |

---

## 8. Resumen de data flow

- **Patrón predominante**: useEffect + useState + fetch (manual)
- **Sin React Query**: No hay caché ni invalidación unificada
- **Tenant**: fetchWithTenant inyecta X-Tenant; getCurrentTenant() en cliente donde se necesita
- **Sesión**: useSession() para accessToken y role
