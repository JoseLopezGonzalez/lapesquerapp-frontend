# Bloque 5: Clientes — STEP 0a: Block Scope & Entity Mapping

**Fecha**: 2026-02-16  
**Estado**: Completado

## Alcance del bloque

El bloque **Clientes** incluye la gestión CRUD de clientes (admin) y su uso en contexto de pedidos (Order). Incluye dos flujos principales:

1. **Admin CRUD**: Listado, creación, edición, vista y eliminación de clientes vía EntityClient genérico
2. **Contexto Pedidos**: Selector de cliente en CreateOrderForm, historial de pedidos en OrderCustomerHistory

---

## Entidades y artefactos

### Entidad principal: Cliente (Customer)

| Tipo | Artefacto | Ruta / Ubicación |
|------|-----------|------------------|
| **Pages** | admin/customers (list) | `app/admin/[entity]/page.js` (entity=customers) |
| | admin/customers/create | `app/admin/[entity]/create/page.js` |
| | admin/customers/[id] (edit/view) | `app/admin/[entity]/[id]/page.js` |
| **Components** | EntityClient | `components/Admin/Entity/EntityClient/index.js` (genérico) |
| | CreateEntityForm | `components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm/index.js` |
| | EditEntityForm | `components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js` |
| | OrderCustomerHistory | `components/Admin/OrdersManager/Order/OrderCustomerHistory/index.js` |
| | CreateOrderForm (usa cliente) | `components/Admin/OrdersManager/CreateOrderForm/index.js` |
| **Hooks** | useCustomerHistory | `hooks/useCustomerHistory.js` |
| | useOrderCreateFormConfig | `hooks/useOrderCreateFormConfig.js` |
| **Services** | customerService (domain CRUD) | `services/domain/customers/customerService.js` |
| | customerService (options, history) | `services/customerService.ts` |
| **Config** | entitiesConfig.customers | `configs/entitiesConfig.js` |
| **Types** | — | No existen tipos para Customer (solo interfaces en customerService.ts parciales) |
| **Tests** | useCustomerHistory.test.js | `__tests__/hooks/useCustomerHistory.test.js` |

### Flujos de datos

- **EntityClient** → `getEntityService('customers')` → domain `customerService.js` (list, getById, create, update, delete, getOptions)
- **useCustomerHistory** → `customerService.ts` → getCustomerOrderHistory (useEffect + useState)
- **CreateOrderForm / useOrderCreateFormConfig** → `customerService.ts` → getCustomer, getCustomersOptions

### Dualidad de servicios

Existen **dos** servicios relacionados con clientes:

1. **domain/customers/customerService.js**: CRUD genérico para EntityClient (list, getById, create, update, delete, getOptions). Usa helpers genéricos (fetchEntitiesGeneric, createEntityGeneric, etc.).
2. **customerService.ts**: Funciones específicas para contexto pedidos: getCustomersOptions, getCustomer, getCustomerOrderHistory. Ya en TypeScript con tipos parciales.

---

## Resumen de alcance

**Bloque 5 (Clientes) incluye:**
- **Entidades**: Cliente (CRUD admin) + uso en pedidos (selector + historial)
- **Artefactos**: 2 servicios, 2 hooks, 5+ componentes (EntityClient/Create/Edit genéricos, OrderCustomerHistory, CreateOrderForm), 1 test
- **Scope rule**: Las mejoras deben cubrir todos los artefactos en alcance (servicios, hooks, componentes que consumen datos de clientes)
