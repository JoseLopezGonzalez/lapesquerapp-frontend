# STEP 0a — Block Scope & Entity Mapping

**Bloque**: 6 — Proveedores (proveedores, liquidaciones)

---

## Entidades principales

| Entidad | Descripción |
|---------|-------------|
| **Suppliers (Proveedores)** | CRUD de proveedores (EntityClient, config suppliers) |
| **Supplier Liquidations** | Listado por fechas, detalle por proveedor, generación PDF |

---

## Artefactos por entidad

### Proveedores (suppliers)

| Tipo | Artefacto | Ubicación |
|------|-----------|-----------|
| Página | Admin suppliers list | `app/admin/suppliers/` (EntityClient) |
| Página | Admin supplier detail | `app/admin/suppliers/[id]/` |
| Componente | EntityClient | `components/Admin/Entity/EntityClient/index.js` |
| Servicio | supplierService | `services/domain/suppliers/supplierService.js` |
| Hook | useSupplierOptions | `hooks/useSupplierOptions.js` |
| Config | entitiesConfig.suppliers | `configs/entitiesConfig.js` |
| Mapper | entityServiceMapper | `services/domain/entityServiceMapper.js` |

**Tests existentes**: Ninguno para suppliers.

**Estado**: EntityClient usa fetch manual (no useSuppliersList). supplierService en JavaScript. useSupplierOptions usa RawMaterialReceptionsOptionsContext + getSupplierOptions (rawMaterialReceptionService), no supplierService.

---

### Liquidaciones (supplier-liquidations)

| Tipo | Artefacto | Ubicación |
|------|-----------|-----------|
| Página | Listado liquidaciones | `app/admin/supplier-liquidations/page.js` |
| Página | Detalle liquidación | `app/admin/supplier-liquidations/[supplierId]/page.js` |
| Componente | SupplierLiquidationList | `components/Admin/SupplierLiquidations/SupplierLiquidationList.jsx` |
| Componente | SupplierLiquidationDetail | `components/Admin/SupplierLiquidations/SupplierLiquidationDetail.jsx` |
| Servicio | supplierLiquidationService | `services/supplierLiquidationService.js` |

**Tests existentes**: Ninguno.

**Estado**: useEffect + useState; fetch manual; sin React Query. supplierLiquidationService usa getSession(), fetchWithTenant; no getAuthToken() como otros domain services.

---

## Uso transversal

- **useSupplierOptions** (proveedores para select): usado en RawMaterialReceptions (CreateReceptionForm, OperarioCreateReceptionForm), useAdminReceptionForm, useOperarioReceptionForm.
- **RawMaterialReceptionsOptionsContext**: carga supplierOptions via getSupplierOptions (rawMaterialReceptionService), no supplierService.

---

## Alcance del bloque

**Bloque 6 incluye**:

- **Entidades**: suppliers, supplier-liquidations
- **Artefactos**: supplierService, supplierLiquidationService, SupplierLiquidationList, SupplierLiquidationDetail, useSupplierOptions, EntityClient para suppliers (config), páginas admin/suppliers y admin/supplier-liquidations

**Fuera de alcance para este bloque** (se mantiene como está por ahora):

- RawMaterialReceptionsOptionsContext (usa getSupplierOptions de rawMaterialReceptionService; migrar useSupplierOptions a supplierService.getOptions es parte del bloque)
- ExportModal / linkService (groupLinkedSummaryBySupplier) — usa supplier como dato, no como entidad CRUD
