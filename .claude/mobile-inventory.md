# Inventario Mobile — PesquerApp
> Generado: 2026-06-01. Actualizar tras cada `/mobile merge [vista]`.
>
> Estado: ⬜ pendiente | 🔶 parcial/responsive básico | ✅ mobile nativo completado

---

## Infraestructura mobile (base del sistema)

| Componente | Ubicación | Estado |
|---|---|---|
| BottomNav (5 slots + framer-motion) | `src/components/Admin/Layout/BottomNav/` | ✅ |
| NavigationSheet (vaul drawer) | `src/components/Admin/Layout/NavigationSheet/` | ✅ |
| ResponsiveLayout (switch desktop/mobile) | `src/components/Admin/Layout/ResponsiveLayout/` | ✅ |
| useIsMobile / useIsMobileSafe | `src/hooks/use-mobile.jsx` | ✅ |
| useHideBottomNav / BottomNavContext | `src/context/BottomNavContext.jsx` | ✅ |
| design-tokens-mobile | `src/lib/design-tokens-mobile.js` | ✅ |
| motion-presets | `src/lib/motion-presets.js` | ✅ |
| EntityClient AccordionBody | `src/components/Admin/Entity/EntityClient/` | 🔶 |

---

## Vistas Tipo A — Complejas / Master-detail

| Vista | Rol | Ruta | Estado | Rama activa | Notas |
|---|---|---|---|---|---|
| OrdersManager — lista | Admin | `/admin/orders-manager` | 🔶 | — | OrderCard ✅, filtros mobile ✅, paginación pendiente |
| OrdersManager — detalle | Admin | `/admin/orders/[id]` | 🔶 | — | Header/Summary/SectionList ✅, secciones internas ⬜ |
| OrdersManager — crear | Admin | `/admin/orders/create` | 🔶 | — | CreateOrderFormMobile ✅, validación pendiente |
| StoresManager | Admin | `/admin/stores-manager` | 🔶 | `mobile/stores-manager` | Lista vertical ✅, mapa full-screen ✅, filtros bottom sheet ✅, dialogs reutilizados ✅ |
| StoresManager | Operator | `/operator/stores-manager` | ⬜ | — | Misma vista que admin — pendiente switch mobile |
| StoresManager | External | `/external/stores-manager` | ⬜ | — | Versión limitada — pendiente |
| Warehouse store | Warehouse | `/warehouse/[storeId]` | ⬜ | — | Vista de almacén por tienda |
| Productions — lista | Admin | `/admin/productions` | ⬜ | — | Lista + detalle producción |
| Productions — detalle | Admin | `/admin/productions/[id]` | ⬜ | — | Complejo: records, materiales |
| Productions — control panel | Admin | `/admin/productions/control-panel` | ⬜ | — | Dashboard operativo |
| Label Editor | Admin | `/admin/label-editor` | ⬜ | — | Editor visual — probable no mobile |
| Market Data Extractor (IA) | Admin | `/admin/market-data-extractor` | ⬜ | — | Extracción docs lonja |
| Autoventa wizard | Comercial | `/comercial/autoventa` | ⬜ | — | Wizard mobile-first crítico |
| Autoventa wizard | Field | `/field/autoventa` | ⬜ | — | Versión repartidor — prioridad alta |
| Clientes CRM — detalle | Admin | `/admin/customers/[id]` | ⬜ | — | CRM completo por cliente |
| Clientes CRM — lista | Comercial | `/comercial/clientes` | ⬜ | — | Lista clientes comercial |
| Clientes CRM — detalle | Comercial | `/comercial/clientes/[id]` | ⬜ | — | Detalle cliente comercial |
| Prospectos — lista | Comercial | `/comercial/prospectos` | ⬜ | — | CRM leads |
| Prospectos — detalle | Comercial | `/comercial/prospectos/[id]` | ⬜ | — | Detalle lead |
| Agenda CRM | Comercial | `/comercial/agenda` | ⬜ | — | Calendario de visitas |
| Rutas — lista | Comercial | `/comercial/rutas` | ⬜ | — | Rutas de reparto |
| Rutas — detalle | Comercial | `/comercial/rutas/[id]` | ⬜ | — | Detalle con mapa |
| Rutas — lista | Field | `/field/rutas` | ⬜ | — | Repartidor — prioridad alta |
| Rutas — detalle | Field | `/field/rutas/[id]` | ⬜ | — | Repartidor con mapa |
| Pedidos field — lista | Field | `/field/pedidos` | ⬜ | — | Lista pedidos repartidor |
| Pedidos field — detalle | Field | `/field/pedidos/[id]` | ⬜ | — | Detalle pedido repartidor |
| Ofertas — lista | Comercial | `/comercial/ofertas` | ⬜ | — | Lista ofertas |
| Ofertas — detalle | Comercial | `/comercial/ofertas/[id]` | ⬜ | — | Detalle oferta |
| OrdersManager | Comercial | `/comercial/orders-manager` | ⬜ | — | OrdersManager para comercial |
| Pallets — detalle | Admin | `/admin/pallets/[id]` | ⬜ | — | Detalle palet |
| Orquestador | Admin | `/admin/orquestador` | ⬜ | — | Vista operativa |
| Orquestador | Operator | `/operator/orquestador` | ⬜ | — | Vista operador |
| Supplier Liquidations — detalle | Admin | `/admin/supplier-liquidations/[supplierId]` | ⬜ | — | Detalle liquidación |
| Time Punch Manager | Admin | `/admin/time-punch-manager` | ⬜ | — | Gestión fichajes |
| NFC Punch Manager | Admin | `/admin/nfc-punch-manager` | ⬜ | — | Fichajes NFC |
| NFC Punch Manager | Operator | `/operator/nfc-punch-manager` | ⬜ | — | Fichajes NFC operador |
| Punches Calendar | Admin | `/admin/punches-calendar` | ⬜ | — | Calendario fichajes |
| CMR Manual | Admin | `/admin/cmr-manual` | ⬜ | — | CMR manual |
| Cost Regularization | Admin | `/admin/cost-regularization` | ⬜ | — | Regularización costes |

---

## Vistas Tipo B — CRUD Genérico (EntityClient)

| Vista | Rol | Ruta | Estado | Notas |
|---|---|---|---|---|
| Entidades genéricas | Admin | `/admin/[entity]` | 🔶 | AccordionBody ✅, getPrimaryFields mobile mejorable |
| Entidades — crear | Admin | `/admin/[entity]/create` | 🔶 | CreateEntityForm — Sheet bottom pendiente |
| Entidades — detalle | Admin | `/admin/[entity]/[id]` | ⬜ | Detalle entidad genérico |
| Field Operators — lista | Admin | `/admin/field-operators` | ⬜ | Lista repartidores |
| Field Operators — detalle | Admin | `/admin/field-operators/[id]` | ⬜ | Detalle repartidor |
| Supplier Liquidations — lista | Admin | `/admin/supplier-liquidations` | ⬜ | Lista liquidaciones |
| Pallets — lista (EntityClient) | Admin | via `/admin/[entity]` | 🔶 | PaletAccordionCard ya existe |
| Pallets — crear | Admin | `/admin/pallets/create` | ⬜ | Crear palet |
| Prospectos — crear | Comercial | `/comercial/prospectos/create` | ⬜ | Crear lead |
| Rutas — plantillas — lista | Comercial | `/comercial/rutas/plantillas` | ⬜ | Plantillas de rutas |
| Rutas — plantillas — detalle | Comercial | `/comercial/rutas/plantillas/[id]` | ⬜ | Detalle plantilla |
| External store — detalle | External | `/external/stores/[storeId]` | ⬜ | Vista almacén externo |

---

## Vistas de operador / dispatches

| Vista | Rol | Ruta | Estado | Notas |
|---|---|---|---|---|
| Dispatches — crear | Operator | `/operator/dispatches/create` | ⬜ | Crear despacho |
| Receptions — crear | Operator | `/operator/receptions/create` | ⬜ | Crear recepción |
| Warehouse dispatches — crear | Warehouse | `/warehouse/[storeId]/dispatches/create` | ⬜ | |
| Warehouse receptions — crear | Warehouse | `/warehouse/[storeId]/receptions/create` | ⬜ | |
| Cebo dispatches — editar | Admin | `/admin/cebo-dispatches/[id]/edit` | ⬜ | |
| Cebo dispatches — crear | Admin | `/admin/cebo-dispatches/create` | ⬜ | |
| Raw material receptions — crear | Admin | `/admin/raw-material-receptions/create` | ⬜ | |
| Raw material receptions — editar | Admin | `/admin/raw-material-receptions/[id]/edit` | ⬜ | |
| Manual punches | Admin | `/admin/manual-punches` | ⬜ | Fichajes manuales |

---

## Vistas de dashboard / home

| Vista | Rol | Ruta | Estado | Notas |
|---|---|---|---|---|
| Home admin | Admin | `/admin/home` | ⬜ | Dashboard principal |
| Home comercial | Comercial | `/comercial` | ⬜ | Dashboard comercial |
| Home field | Field | `/field` | ⬜ | Home repartidor — prioridad alta |
| Home operator | Operator | `/operator` | ⬜ | Home operador |
| Settings | Admin | `/admin/settings` | ⬜ | Configuración |

---

## Prioridad de implementación sugerida

### Sprint 1 — Impacto alto, usuarios field/comercial (mobile-first por naturaleza)

| Prioridad | Vista | Por qué |
|---|---|---|
| 🔴 1 | **Field home** `/field` | El rol field ES mobile-first, punto de entrada |
| 🔴 2 | **Field rutas** `/field/rutas` + `[id]` | Repartidores en campo — usan solo mobile |
| 🔴 3 | **Field autoventa** `/field/autoventa` | Venta directa en campo — crítico |
| 🔴 4 | **Field pedidos** `/field/pedidos` + `[id]` | Gestión pedidos repartidor |
| 🟠 5 | **OrdersManager — completar detalle** `/admin/orders/[id]` | Base ya existe, completar secciones |
| 🟠 6 | **StoresManager** `/admin/stores-manager` | Muy usado en tablet/mobile en almacén |

### Sprint 2 — CRM comercial y operativa de almacén

| Prioridad | Vista | Por qué |
|---|---|---|
| 🟡 7 | **Comercial clientes** `/comercial/clientes` + `[id]` | CRM en movilidad |
| 🟡 8 | **Comercial prospectos** `/comercial/prospectos` | Prospección en campo |
| 🟡 9 | **Operator stores** `/operator/stores-manager` | Operarios en almacén |
| 🟡 10 | **Productions lista** `/admin/productions` | Control producción |

### Sprint 3 — CRUD genérico y herramientas internas

| Prioridad | Vista | Por qué |
|---|---|---|
| 🟢 11 | **EntityClient mejora AccordionBody** | Mejora global para todos los CRUDs |
| 🟢 12 | **Pallets detalle** `/admin/pallets/[id]` | Gestión de almacén |
| 🟢 13 | **Supplier liquidations** | Operativa financiera |
| 🟢 14 | **Dashboards home** admin/comercial | Métricas en mobile |

### Sin adaptar (probable no mobile)

| Vista | Razón |
|---|---|
| Label Editor | Editor visual canvas — no adaptable a mobile |
| Market Data Extractor | Herramienta de back-office, uso desktop |
| Superadmin | Solo uso interno de admin técnico |

---

## Historial de merges

| Fecha | Vista | GAP | Notas |
|---|---|---|---|
| *(vacío al inicio)* | | | |
