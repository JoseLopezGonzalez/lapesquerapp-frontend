# STEP 1 — Análisis Bloque 6: Proveedores

**Bloque**: 6 — Proveedores (proveedores, liquidaciones)  
**Rating antes: 4/10**

---

## Resumen del módulo

- **Proveedores**: CRUD vía EntityClient + supplierService. Listado usa fetch manual (useEffect + fetchData), no React Query.
- **Liquidaciones**: Listado con DateRangePicker + tabla; detalle con recepciones/salidas y generación PDF. Todo con useEffect + useState y fetch manual.

---

## Análisis por entidad

### Proveedores (suppliers)

| Aspecto | Estado | Observaciones |
|---------|--------|---------------|
| Servicio | supplierService.js | JavaScript, sin tipos. Métodos: list, getById, create, update, delete, deleteMultiple, getOptions. |
| Data fetching | Manual | EntityClient usa fetchData (useEffect). No useSuppliersList. |
| EntityClient | No React Query | suppliers NO está en isQueryDriven. Usa fetch manual como transports/incoterms antes de migración. |
| Hooks | useSupplierOptions | Usa RawMaterialReceptionsOptionsContext + getSupplierOptions (rawMaterialReceptionService). No usa supplierService.getOptions. |
| Tests | Ninguno | Sin tests para supplierService ni para flujos de proveedores. |

### Liquidaciones

| Aspecto | Estado | Observaciones |
|---------|--------|---------------|
| Servicio | supplierLiquidationService.js | JavaScript, sin tipos. Usa getSession() en lugar de getAuthToken(). fetchWithTenant directo. |
| Data fetching | Manual | useEffect + useState en SupplierLiquidationList y SupplierLiquidationDetail. |
| Componentes | .jsx | SupplierLiquidationList ~266 L, SupplierLiquidationDetail ~497 L. Tamaño aceptable (<200 sería ideal para Detail). |
| Tests | Ninguno | Sin tests. |

---

## Uso de patrones Next.js/React

| Patrón | Proveedores | Liquidaciones |
|--------|-------------|---------------|
| React Query | ❌ No | ❌ No |
| TypeScript | ❌ No | ❌ No |
| Custom Hooks | useSupplierOptions (contexto recepciones) | ❌ Lógica en componentes |
| Server/Client | Client | Client |
| Formularios Zod | ✅ Entity forms (genéricos) | N/A (fechas por URL, opciones locales) |
| shadcn/ui | ✅ | ✅ |

---

## Deuda técnica y prioridades

### P0 — Crítico

- **Sin TypeScript** en supplierService, supplierLiquidationService (servicios críticos).
- **Sin tests** para servicios de proveedores/liquidaciones.

### P1 — Alto

- **Data fetching manual** en EntityClient para suppliers (debería usar useSuppliersList + React Query).
- **Data fetching manual** en SupplierLiquidationList y SupplierLiquidationDetail (debería usar React Query).
- **useSupplierOptions** usa getSupplierOptions (rawMaterialReceptionService) en lugar de supplierService.getOptions; además usa useEffect + Context, no React Query.

### P2 — Medio

- **supplierLiquidationService** usa getSession() en lugar de getAuthToken() (inconsistencia con domain services).
- **SupplierLiquidationDetail** ~497 líneas (podría extraer hooks useSupplierLiquidationDetail, useLiquidationPdf).
- **Tipos** para Supplier, SupplierWithActivity, LiquidationDetails, etc.

### P3 — Bajo

- Documentación de API ya existe en docs/API-references.

---

## Alineación con CORE Plan y auditoría

- Bloque 5 (Clientes) ya migrado: customerService.ts, useCustomersList (React Query), EntityClient isQueryDriven para customers.
- Bloque 10 (Catálogos): transportService, incotermService, salespersonService en TS; useTransportsList, useIncotermsList, useSalespeopleList.
- **Proveedores** debe seguir el mismo patrón: supplierService.ts, useSuppliersList.ts, EntityClient isQueryDriven para suppliers.
- **Liquidaciones**: supplierLiquidationService.ts, useSuppliersWithActivity, useSupplierLiquidationDetails (React Query).

---

## Riesgos identificados

- **Bajo**: Migración es estructural; no cambia contratos ni lógica de negocio.
- **Medio**: useSupplierOptions está acoplado a RawMaterialReceptionsOptionsContext; migrar a supplierService.getOptions + React Query puede requerir ajustar ese contexto o crear useSupplierOptions que use React Query y supplierService.

---

## Oportunidades de mejora (ordenadas)

1. Migrar supplierService.js → supplierService.ts con tipos (Supplier, CatalogOption, CatalogListResponse, etc.).
2. Crear useSuppliersList.ts (React Query) siguiendo useCustomersList.
3. Integrar useSuppliersList en EntityClient para config.endpoint === 'suppliers'.
4. Migrar supplierLiquidationService.js → supplierLiquidationService.ts con tipos.
5. Crear useSuppliersWithActivity y useSupplierLiquidationDetails (React Query).
6. Refactorizar SupplierLiquidationList y SupplierLiquidationDetail para usar esos hooks.
7. Opcional: useSupplierOptions migrado a React Query + supplierService.getOptions (impacta RawMaterialReceptions; evaluar alcance).
8. Añadir tests para supplierService y supplierLiquidationService.

---

## Rating antes: 4/10

**Justificación**: Servicios en JavaScript sin tipos, data fetching manual sin React Query, EntityClient para suppliers sin caché ni invalidación, liquidaciones con useEffect/useState, sin tests. Estructura de carpetas y uso de EntityClient/config existente son puntos positivos.
