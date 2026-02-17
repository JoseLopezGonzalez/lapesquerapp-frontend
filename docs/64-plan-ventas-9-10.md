# Plan Bloque Ventas → 9/10

Plan ordenado para llevar el Bloque Ventas de **6.5/10** a **9/10**, siguiendo el flujo de evolución incremental.

**Fecha**: 2026-02-14  
**Estado actual**: 6.5/10

---

## Resumen de fases

| Fase | Objetivo | Esfuerzo | Rating esperado |
|------|----------|----------|-----------------|
| 1 | Reducir Order (~647 líneas) | Medio | 7/10 |
| 2 | Reducir OrderPallets (~903 líneas) | Alto | 7.5/10 |
| 3 | Formularios + Zod | Medio | 8/10 |
| 4 | Más tests | Medio | 9/10 |

---

## Fase 1: Reducir Order (~647 líneas)

**Objetivo**: Bajar Order/index.js de ~647 a &lt;250 líneas mediante extracción de subcomponentes y config.

### Sub-bloque 1.1: Extraer configuración y utilidades

**Archivos a crear:**
- `Order/config/sectionsConfig.js` — SECTIONS_CONFIG, PRIMARY_SECTION_IDS_MOBILE
- `Order/utils/getTransportImage.js` — función helper

**Beneficio**: ~40 líneas fuera del componente principal.

### Sub-bloque 1.2: Extraer OrderHeaderMobile

**Archivo**: `Order/components/OrderHeaderMobile.jsx`

**Responsabilidad**: Header con botón back, título (#order.id), menú ⋮ (secciones, Editar, Imprimir).

**Props**: `order`, `onClose`, `onEdit`, `onPrint`, `onNavigateSection`, `sectionsConfig`, `primarySectionIds`.

**Beneficio**: ~50 líneas extraídas.

### Sub-bloque 1.3: Extraer OrderSummaryMobile

**Archivo**: `Order/components/OrderSummaryMobile.jsx`

**Responsabilidad**: Cabecera centrada con cliente, transporte, badge estado, fecha carga, temperatura, palets, importe.

**Props**: `order`, `transportImage`, `renderStatusBadge`, `handleTemperatureChange`.

**Beneficio**: ~80 líneas extraídas.

### Sub-bloque 1.4: Extraer OrderSectionList

**Archivo**: `Order/components/OrderSectionList.jsx`

**Responsabilidad**: Lista de secciones principales (botones con icono + ChevronRight).

**Props**: `sections`, `onSelectSection`.

**Beneficio**: ~35 líneas extraídas.

### Sub-bloque 1.5: Extraer OrderStatusDropdown y OrderTemperatureDropdown

**Archivos**: 
- `Order/components/OrderStatusDropdown.jsx` — StatusBadge + DropdownMenu para cambiar estado
- `Order/components/OrderTemperatureDropdown.jsx` — temperatura + DropdownMenu (0, 4, -18, -23)

**Props**: `order`, `onStatusChange`, `onTemperatureChange`.

**Beneficio**: ~60 líneas extraídas.

### Sub-bloque 1.6: Extraer OrderHeaderDesktop y OrderTabsDesktop

**Archivos**:
- `Order/components/OrderHeaderDesktop.jsx` — header con título, transporte, badge, fecha, etc.
- `Order/components/OrderTabsDesktop.jsx` — TabsList + TabsTrigger para secciones

**Beneficio**: ~100 líneas extraídas.

### Resultado esperado Fase 1

- Order/index.js: ~280 líneas (orquestación)
- Componentes reutilizables en Order/components/
- Rating: 7/10

---

## Fase 2: Reducir OrderPallets (~903 líneas)

**Objetivo**: Bajar OrderPallets de ~903 a &lt;400 líneas.

### Sub-bloque 2.1: Extraer useOrderPallets

**Archivo**: `OrderPallets/hooks/useOrderPallets.js`

**Responsabilidad**: 
- Estados: isPalletDialogOpen, selectedPalletId, isStoreSelectionOpen, dialogs, search, pagination, cloning, unlinking, createFromForecast
- Handlers: handleOpenNewPallet, handleOpenEditPallet, handleStoreSelection, handlePalletChange, handleDeletePallet, handleUnlinkPallet, handleLinkPallets, handleCreateFromForecast, etc.
- Lógica de búsqueda, paginación, vincular/desvincular

**Beneficio**: ~200 líneas fuera del componente, lógica testeable.

### Sub-bloque 2.2: Extraer OrderPalletsToolbar

**Archivo**: `OrderPallets/components/OrderPalletsToolbar.jsx`

**Responsabilidad**: Botones Crear palet, Vincular, Crear desde previsión, Desvincular todos, y menú ⋮ (Etiquetas, etc.).

**Props**: `onCreate`, `onLink`, `onCreateFromForecast`, `onUnlinkAll`, `canUnlinkAll`, `isMobile`, etc.

**Beneficio**: ~80 líneas extraídas.

### Sub-bloque 2.3: Extraer OrderPalletsContent

**Archivo**: `OrderPallets/components/OrderPalletsContent.jsx`

**Responsabilidad**: Render condicional: móvil (OrderPalletCard list) vs desktop (tabla con OrderPalletTableRow). Recibe pallets, handlers, loading states.

**Beneficio**: ~120 líneas extraídas.

### Sub-bloque 2.4: Extraer lógica de búsqueda/vincular a custom hook o utilidad

**Archivo**: `OrderPallets/hooks/useLinkPallets.js` (opcional)

**Responsabilidad**: Estado y lógica de LinkPalletsDialog (searchResults, pagination, selectedPalletIds, handleSearch, handleLink).

**Beneficio**: Desacoplar lógica del UI.

### Resultado esperado Fase 2

- OrderPallets/index.js: ~380 líneas
- OrderPallets/hooks/useOrderPallets.js
- OrderPallets/components/OrderPalletsToolbar.jsx, OrderPalletsContent.jsx
- Rating: 7.5/10

---

## Fase 3: Formularios + Zod

**Objetivo**: Validación cliente con Zod antes de submit; backend 422 como fallback.

### Sub-bloque 3.1: CreateOrderForm + Zod

**Archivo**: `CreateOrderForm/schemas/orderCreateSchema.js` (o .ts)

**Esquema Zod**:
- customer: z.string().min(1, 'Cliente requerido')
- salesperson, payment, incoterm, transport: z.string().optional()
- loadDate: z.date()
- plannedProducts: z.array(z.object({ productId, quantity, ... })).min(1, 'Al menos un producto')
- billingAddress, shippingAddress: z.string().optional()
- emails: z.array(z.string().email()).optional()

**Cambios en CreateOrderForm**:
- `useForm({ resolver: zodResolver(orderCreateSchema), ... })`
- Eliminar validación manual si existiera
- setErrorsFrom422 sigue como fallback en onError

**Beneficio**: Feedback inmediato, menos requests inválidos.

### Sub-bloque 3.2: OrderEditSheet + Zod

**Archivo**: `OrderEditSheet/schemas/orderEditSchema.js`

**Esquema**: Campos editables del pedido (loadDate, temperature, notes, etc.)

**Cambios en OrderEditSheet**:
- `useForm({ resolver: zodResolver(orderEditSchema), ... })`
- setErrorsFrom422 como fallback

**Beneficio**: Consistencia con CreateOrderForm.

### Resultado esperado Fase 3

- CreateOrderForm y OrderEditSheet con Zod
- Rating: 8/10

---

## Fase 4: Más tests

**Objetivo**: Cobertura de hooks y componentes críticos para estabilidad.

### Sub-bloque 4.1: Tests useOrder

**Archivo**: `src/__tests__/hooks/useOrder.test.js`

**Casos**:
- Devuelve order, loading, error
- updateOrderStatus actualiza caché
- exportDocument llama al servicio
- Manejo de error 401

**Dependencia**: Mock de useOrderContext, React Query.

### Sub-bloque 4.2: Tests useCustomerHistory

**Archivo**: `src/__tests__/hooks/useCustomerHistory.test.js`

**Casos**:
- Devuelve filteredHistory, generalMetrics, loading
- dateFilter cambia filteredHistory
- calculateTrend devuelve dirección correcta
- getDateRange según dateFilter

### Sub-bloque 4.3: Tests useOrders

**Archivo**: `src/__tests__/hooks/useOrders.test.js`

**Casos**:
- Devuelve orders, isLoading
- Invalida caché al crear/actualizar

### Sub-bloque 4.4: Tests componentes críticos (opcional)

**Archivos**:
- `StatusBadge.test.jsx` — renderiza según color/label
- `GeneralMetricsGrid.test.jsx` — renderiza métricas
- `OrderStatusDropdown.test.jsx` — cambia estado al hacer click

**Prioridad**: Menor; los hooks son más críticos para regresión.

### Resultado esperado Fase 4

- 3 hooks con tests
- orderService ya tiene 14 tests
- Rating: 9/10

---

## Orden de ejecución recomendado

```
Fase 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6
Fase 2.1 → 2.2 → 2.3 (2.4 opcional)
Fase 3.1 → 3.2
Fase 4.1 → 4.2 → 4.3 (4.4 opcional)
```

Cada sub-bloque debe:
1. Implementarse de forma incremental
2. Verificarse con `npm run build` y `npm run test:run`
3. Registrarse en `docs/audits/nextjs-evolution-log.md`

---

## Criterios de éxito 9/10

| Criterio | Objetivo |
|----------|----------|
| Order | &lt;250 líneas |
| OrderPallets | &lt;450 líneas |
| Formularios Ventas | Zod + setErrorsFrom422 |
| Tests | orderService + useOrder + useCustomerHistory + useOrders |
| Componentes &gt;200 líneas | Ninguno crítico en Ventas |
| TypeScript | Servicios ya migrados; componentes opcional |

---

## Rollback por fase

Cada sub-bloque debe tener un plan de rollback documentado (git revert). No hacer cambios irreversibles sin backup.
