# STEP 0 — Document Current UI Behavior

**Bloque**: 6 — Proveedores (proveedores, liquidaciones)

---

## Proveedores (EntityClient / admin/suppliers)

### UI States

- **Loading**: Skeleton/loader mientras se cargan datos
- **Empty**: "No existen proveedores según los filtros"
- **Error**: Toast + mensaje de error
- **Populated**: Tabla con columnas según config (ID, nombre, dirección, etc.)
- **Filtering**: Filtros genéricos (search por defecto)

### User Interactions

- Crear proveedor → CreateEntityForm
- Editar proveedor → EditEntityForm
- Ver detalle → vista individual
- Eliminar → confirmación + borrado
- Filtros → cambio de filtros dispara refetch (fetch manual actualmente)
- Paginación → cambio de página

### Data Flow

- EntityClient → getEntityService('suppliers') → supplierService.list()
- useEffect con fetchData cuando cambian filtros/página (no React Query)
- Create/Edit: submitEntityFormGeneric vía config

### Validation Rules

- Zod/entity config en CreateEntityForm/EditEntityForm
- Campos requeridos según entitiesConfig (name, etc.)

### Error Handling

- Toast para errores de API
- getErrorMessage para mensajes user-friendly

---

## Liquidación de Proveedores (SupplierLiquidationList)

### UI States

- **Initial**: "Seleccione un rango de fechas para comenzar"
- **Loading**: Loader mientras fetch
- **Error**: Mensaje en Card + toast
- **Empty**: "No se encontraron proveedores con actividad"
- **Populated**: Tabla con columnas (Proveedor, Recepciones, Salidas, Peso Recepciones, Peso Salidas, Importe Recepciones, Importe Salidas, Acción)

### User Interactions

- Seleccionar rango de fechas (DateRangePicker)
- Botón "Buscar" → getSuppliersWithActivity(startDate, endDate)
- Click en fila proveedor → abre nueva pestaña: /admin/supplier-liquidations/{supplierId}?start=...&end=...

### Data Flow

- useEffect(fetchSuppliers, [dateRange]) — fetch cuando cambia dateRange
- getSuppliersWithActivity(startDate, endDate) → supplierLiquidationService

### Validation Rules

- dateRange.from y dateRange.to obligatorios
- dateRange.from <= dateRange.to (toast si no)

---

## Liquidación Detalle (SupplierLiquidationDetail)

### UI States

- **Loading**: Loader centrado
- **Error**: Card con mensaje + botón "Volver al listado"
- **Populated**: Header (proveedor, fechas), controles (método pago, gasto gestión, mostrar transferencia), tabla Recepciones, tabla Salidas de Cebo

### User Interactions

- Volver → router.push("/admin/supplier-liquidations")
- Generar PDF → downloadSupplierLiquidationPdf con selección de recepciones/salidas
- Checkboxes: seleccionar/deseleccionar recepciones y salidas para PDF
- Switch método de pago: Efectivo / Transferencia
- Checkbox gasto de gestión, mostrar pago por transferencia

### Data Flow

- searchParams: start, end
- useEffect → getSupplierLiquidationDetails(supplierId, start, end)
- handleDownloadPdf → downloadSupplierLiquidationPdf con selectedReceptions, selectedDispatches, paymentMethod, hasManagementFee, showTransferPayment

### Validation Rules

- start/end en URL obligatorios (si no → error "Fechas no especificadas")
- paymentMethod obligatorio para PDF (toast si no)

---

## Verificación

**¿El comportamiento actual coincide con reglas de negocio documentadas?**

- Sí. No se han detectado incoherencias en la documentación existente. Los flujos son: listado CRUD proveedores, listado liquidaciones por fechas, detalle liquidación con PDF personalizable.
