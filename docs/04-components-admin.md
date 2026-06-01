# Componentes Admin - Módulos y Funcionalidad

## 📚 Documentación Relacionada

- **[03-components-ui-shadcn.md](./03-components-ui-shadcn.md)** - Componentes base ShadCN UI
- **[05-hooks-personalizados.md](./05-hooks-personalizados.md)** - Hooks utilizados por los componentes
- **[07-servicios-api-v2.md](./07-servicios-api-v2.md)** - Servicios API utilizados

---

## 📋 Introducción

Los componentes del módulo Admin están ubicados en `/src/components/Admin/` y representan la funcionalidad principal de la aplicación. Están organizados por módulos de negocio (Orders, Stores, Productions, etc.) y componentes compartidos (Layout, Filters, Forms).

**Total de módulos principales**: 13 módulos

---

## 🏗️ Estructura de Módulos

```
Admin/
├── Dashboard/          # Panel principal con métricas y gráficos
├── OrdersManager/      # Gestión de pedidos
├── Entity/            # Cliente genérico para CRUD de entidades
├── Stores/            # Gestión de almacenes
├── Productions/        # Gestión de producciones
├── Pallets/           # Gestión de pallets
├── Labels/            # Sistema de etiquetas
├── LabelEditor/       # Editor visual de etiquetas
├── Layout/            # Sidebar, Navbar
├── Filters/            # Filtros genéricos
├── Settings/           # Configuración
├── Home/              # Panel de control alternativo
└── MarketDataExtractor/ # Extracción de datos de mercado
```

---

## 📦 Módulos Principales

### 1. Dashboard

**Archivo**: `/src/components/Admin/Dashboard/index.js`

**Funcionalidad**: Panel principal con métricas, gráficos y resúmenes.

**Componentes incluidos**:

- `CurrentStockCard` - Stock actual
- `TotalQuantitySoldCard` - Cantidad total vendida
- `TotalAmountSoldCard` - Importe total vendido
- `NewLabelingFeatureCard` - Tarjeta de nueva funcionalidad de etiquetado
- `OrderRankingChart` - Ranking de pedidos
- `SalesBySalespersonPieChart` - Ventas por comercial (gráfico de pastel)
- `StockBySpeciesCard` - Stock por especies
- `StockByProductsCard` - Stock por productos
- `SalesChart` - Gráfico de ventas
- `ReceptionChart` - Gráfico de recepciones
- `DispatchChart` - Gráfico de despachos
- `TransportRadarChart` - Gráfico radar de transportes

**Características**:

- Saludo dinámico según hora del día (Buenos días/tardes/noches)
- Layout responsive con grid de columnas
- ScrollArea para contenido largo
- Layout tipo masonry comentado (no activo)

**Uso**:

```javascript
import Dashboard from '@/components/Admin/Dashboard';

function AdminPage() {
  return <Dashboard />;
}
```

---

### 2. OrdersManager

**Archivo**: `/src/components/Admin/OrdersManager/index.js`

**Funcionalidad**: Gestión completa de pedidos activos.

**Estado**:

```javascript
{
  orders: Array,              // Lista de pedidos
  selectedOrder: number|null, // ID del pedido seleccionado
  categories: Array,          // Categorías de filtrado
  searchText: string,        // Texto de búsqueda
  loading: boolean,          // Estado de carga
  onCreatingNewOrder: boolean // Si está creando nuevo pedido
}
```

**Categorías**:

- `all` - Todos los pedidos
- `pending` - En producción
- `finished` - Terminados

**Funcionalidad**:

1. **Carga inicial**: Obtiene pedidos activos desde API v2
2. **Filtrado**: Por categoría y texto de búsqueda (cliente o ID)
3. **Ordenamiento**: Por fecha de carga (`loadDate`)
4. **Selección**: Click en tarjeta de pedido para ver detalles
5. **Creación**: Botón para crear nuevo pedido

**Componentes hijos**:

- `OrdersList` - Lista de pedidos (tarjetas)
- `Order` - Vista detallada del pedido seleccionado
- `CreateOrderForm` - Formulario de creación

**Uso**:

```javascript
import OrdersManager from '@/components/Admin/OrdersManager';

function OrdersPage() {
  return <OrdersManager />;
}
```

#### Order (Vista Detallada)

**Archivo**: `/src/components/Admin/OrdersManager/Order/index.js`

**Funcionalidad**: Vista completa de un pedido con múltiples tabs.

**Tabs disponibles**:

- `details` - Detalles del pedido
- `products` - Productos planificados y reales
- `pallets` - Pallets del pedido
- `production` - Producción asociada
- `documents` - Documentos (PDFs, Excel)
- `labels` - Etiquetas
- `map` - Mapa (si aplica)
- `incidents` - Incidencias
- `customer-history` - Historial del cliente

**Componentes hijos**:

- `OrderDetails` - Detalles generales
- `OrderProductDetails` - Productos reales (desde pallets)
- `OrderPlannedProductDetails` - Productos planificados
- `OrderPallets` - Lista de pallets
- `OrderProduction` - Producción asociada
- `OrderDocuments` - Gestión de documentos
- `OrderExport` - Exportación (Excel, PDF, etc.)
- `OrderLabels` - Sistema de etiquetas
- `OrderMap` - Mapa (si aplica)
- `OrderIncident` - Gestión de incidencias
- `OrderCustomerHistory` - Historial del cliente
- `OrderEditSheet` - Edición del pedido (Sheet lateral)
- `OrderSkeleton` - Skeleton de carga

**Características**:

- Usa `OrderContext` para estado global
- Badges de estado (pending, finished, incident)
- Cambio de estado del pedido
- Actualización de temperatura
- Exportación de documentos
- Gestión de incidencias

**Uso**:

```javascript
import { OrderProvider } from '@/context/OrderContext';

function OrderView({ orderId }) {
  return (
    <OrderProvider orderId={orderId}>
      <Order />
    </OrderProvider>
  );
}
```

---

### 3. EntityClient (CRUD Genérico)

**Archivo**: `/src/components/Admin/Entity/EntityClient/index.js`

**Funcionalidad**: Cliente genérico para CRUD de cualquier entidad configurada en `entitiesConfig.js`.

**Props**:

```javascript
<EntityClient config={entityConfig} />
```

**Configuración** (desde `entitiesConfig.js`):

```javascript
{
  endpoint: "users",              // Endpoint API v2
  deleteEndpoint: "users/:id",    // Endpoint para eliminar
  perPage: 12,                    // Items por página
  table: {
    headers: [...]                // Columnas de la tabla
  },
  createForm: {...},              // Configuración de formulario de creación
  editForm: {...}                // Configuración de formulario de edición
}
```

**Funcionalidad**:

1. **Tabla de datos**: Muestra entidades con paginación
2. **Filtros genéricos**: Sistema de filtros configurable
3. **Búsqueda**: Búsqueda por texto
4. **CRUD**: Crear, editar, eliminar entidades
5. **Exportación**: Exportar a Excel o PDF
6. **Acciones**: Acciones personalizadas por entidad
7. **Selección múltiple**: Seleccionar múltiples filas

**Componentes hijos**:

- `EntityTable` - Tabla principal
- `EntityTableHeader` - Encabezado con acciones
- `EntityTableBody` - Cuerpo de la tabla
- `EntityFooter` - Footer con paginación
- `GenericFilters` - Filtros genéricos
- `CreateEntityForm` - Formulario de creación
- `EditEntityForm` - Formulario de edición

**Formato de filtros**:

```javascript
// Filtros se formatean para API v2
{
  "name[start]": "2024-01-01",  // Rango de fechas
  "name[end]": "2024-12-31",
  "status[]": [1, 2, 3],        // Array de valores
  "search": "texto"              // Búsqueda
}
```

**Uso**:

```javascript
import EntityClient from '@/components/Admin/Entity/EntityClient';
import { configs } from '@/configs/entitiesConfig';

function UsersPage() {
  const config = configs['users'];
  return <EntityClient config={config} />;
}
```

#### Configuración de Entidades

**Archivo de configuración**: `/src/configs/entitiesConfig.js`

El sistema de entidades se configura mediante un objeto de configuración que define cómo se visualizan y manejan las entidades. Cada entidad tiene su propia configuración.

**Estructura básica**:

```javascript
{
  'instance-key': {
    title: "Título de la entidad",
    description: "Descripción breve de la funcionalidad",
    emptyState: {
      title: "Mensaje cuando no hay datos",
      description: "Sugerencia o acción recomendada",
    },
    endpoint: "URL para obtener los datos",
    viewRoute: "Ruta para ver detalles, usa :id para reemplazo dinámico",
    deleteEndpoint: "Endpoint para eliminar datos",
    createPath: "Ruta para crear nuevas entidades",
    filtersGroup: { /* Configuración de filtros */ },
    table: { /* Configuración de tabla */ },
  },
}
```

**Opciones de control de acciones**:

- `hideCreateButton: true` - Oculta el botón de crear
- `hideActions: true` - Oculta toda la columna de acciones
- `hideViewButton: true` - Oculta solo el botón de ver
- `hideEditButton: true` - Oculta solo el botón de editar

**Tipos de filtros soportados**:

- `search` - Búsqueda por texto general
- `text` - Campo de texto simple
- `textarea` - Campo de texto multilínea
- `textAccumulator` - Acumulador de texto (múltiples valores)
- `number` - Campo numérico
- `date` - Selector de fecha única
- `dateRange` - Selector de rango de fechas
- `pairSelectBoxes` - Filtro con opciones seleccionables en dos listas
- `autocomplete` - Selector con opciones dinámicas desde endpoint

**Tipos de columnas de tabla**:

- `text` - Columna de texto simple
- `badge` - Columna con indicadores visuales (requiere `options` con `label`, `color`, `outline`)
- `date` - Columna para mostrar fechas
- `currency` - Columna para mostrar moneda
- `weight` - Columna para mostrar peso
- `button` - Columna de acciones (se genera automáticamente, no necesita definirse)

**Ejemplo completo**:

```javascript
export const configs = {
  orders: {
    title: 'Pedidos',
    description: 'Gestión completa de pedidos',
    endpoint: 'orders',
    viewRoute: '/admin/orders/:id',
    deleteEndpoint: '/orders/:id',
    createPath: '/admin/orders/create',
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'id',
            label: 'Buscar por ID',
            type: 'search',
            placeholder: 'Escribe un ID',
          },
        ],
      },
      groups: [
        {
          name: 'generals',
          label: 'Generales',
          filters: [
            {
              name: 'status',
              label: 'Estado',
              type: 'pairSelectBoxes',
              options: [
                { name: 'pending', label: 'Pendiente', value: false },
                { name: 'completed', label: 'Completado', value: false },
              ],
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'text', path: 'id' },
        { name: 'customer', label: 'Cliente', type: 'text', path: 'customer.name' },
        { name: 'status', label: 'Estado', type: 'badge', path: 'status' },
        { name: 'total', label: 'Total', type: 'currency', path: 'total' },
        // La columna de acciones se genera automáticamente
      ],
    },
  },
};
```

**Documentación detallada**: Ver [`configs/00-entities-config.md`](../configs/00-entities-config.md) y [`examples/00-entity-config-examples.md`](../examples/00-entity-config-examples.md) para más detalles y ejemplos.

---

### 4. Stores (Almacenes)

**Archivo**: `/src/components/Admin/Stores/index.js`

**Funcionalidad**: Gestión de almacenes con visualización de posiciones.

**Estado**:

```javascript
{
  stores: Array,              // Lista de almacenes
  selectedStoreId: number|null, // ID del almacén seleccionado
  loading: boolean
}
```

**Funcionalidad**:

1. **Lista de almacenes**: Tarjetas horizontales con scroll
2. **Selección**: Click en tarjeta para ver almacén
3. **Visualización**: Mapa de posiciones del almacén
4. **Gestión**: Añadir/quitar pallets, mover elementos

**Componentes hijos**:

- `StoreCard` - Tarjeta de almacén
- `Store` - Vista detallada del almacén
- `SkeletonStoreCard` - Skeleton de carga

**Uso**:

```javascript
import StoresManager from '@/components/Admin/Stores';

function StoresPage() {
  return <StoresManager />;
}
```

#### Store (Vista Detallada)

**Archivo**: `/src/components/Admin/Stores/StoresManager/Store/index.js`

**Funcionalidad**: Vista completa de un almacén con mapa de posiciones.

**Características**:

- Mapa visual de posiciones
- Filtros por tipo (pallet, box, tub), productos, pallets
- Resumen por especies y productos
- Gestión de posiciones (añadir/quitar elementos)
- Diálogos para operaciones:
  - `PositionSlideover` - Ver posición
  - `AddElementToPositionDialog` - Añadir elemento
  - `PalletDialog` - Ver/editar pallet
  - `PalletLabelDialog` - Imprimir etiqueta
  - `MovePalletToStoreDialog` - Mover pallet a otro almacén
  - `ProductSummaryDialog` - Resumen de productos

**Usa `StoreContext`** para estado global del almacén.

---

### 5. Productions (Producciones)

**Archivo**: `/src/components/Admin/Productions/ProductionView.jsx`

**Funcionalidad**: Vista de producción individual con múltiples tabs.

**Estado**:

```javascript
{
  production: Object|null,
  processTree: Object|null,
  totals: Object|null,
  reconciliation: Object|null,
  loading: boolean,
  error: Error|null
}
```

**Tabs**:

- Información general
- Registros de producción
- Inputs (entradas)
- Outputs (salidas)
- Consumos

**Componentes hijos**:

- `ProductionRecordsManager` - Gestión de registros
- `ProductionInputsManager` - Gestión de inputs
- `ProductionOutputsManager` - Gestión de outputs
- `ProductionOutputConsumptionsManager` - Gestión de consumos
- `ProductionRecordEditor` - Editor de registros
- `ProductionRecordImagesManager` - Gestión de imágenes

**Funcionalidad**:

1. **Carga de datos**: Carga producción, árbol de procesos, totales, reconciliación
2. **Visualización**: Muestra información general, fechas, pesos
3. **Gestión**: Crear/editar registros, inputs, outputs
4. **Imágenes**: Subir y gestionar imágenes de registros

**Uso**:

```javascript
import ProductionView from '@/components/Admin/Productions/ProductionView';

function ProductionPage({ productionId }) {
  return <ProductionView productionId={productionId} />;
}
```

---

### 6. Pallets

**Ubicación**: `/src/components/Admin/Pallets/`

**Componentes**:

- `PalletDialog` - Diálogo principal para ver/editar pallet
- `PalletView` - Vista principal del editor de pallet con todas las funcionalidades
- `PalletLabel` - Componente de etiqueta de pallet
- `PalletLabelDialog` - Diálogo para imprimir etiqueta

**Funcionalidad**:

- Visualización de pallet con cajas
- Edición de cajas (añadir, eliminar, editar)
- **Acciones masivas**: Cambiar lote o peso de múltiples cajas simultáneamente
- Escaneo de códigos GS1-128
- Impresión de etiquetas
- Gestión de observaciones
- Vinculación con pedidos
- Filtrado de cajas: Disponibles, En Producción, Todas

**Acciones Masivas**:
El editor de pallet incluye un sistema de acciones masivas que permite:

- **Cambiar lote masivamente**: Aplicar un nuevo lote a todas las cajas disponibles
- **Cambiar peso masivamente**: Aplicar un nuevo peso neto a todas las cajas disponibles
- **Restricción de seguridad**: Los cambios solo se aplican a cajas disponibles (no en producción). Las cajas en producción no pueden ser modificadas mediante acciones masivas.

**Uso**:

```javascript
import PalletView from '@/components/Admin/Pallets/PalletDialog/PalletView';

function PalletPage({ palletId }) {
  return <PalletView palletId={palletId} />;
}
```

**Acceso a acciones masivas**:

- Pestaña "Acciones Masivas" en el menú principal de pestañas del editor
- Interfaz dedicada con vista previa de todas las cajas
- Validación automática de datos antes de aplicar cambios
- Panel informativo con instrucciones de uso

**Usa `usePallet` hook** para lógica de negocio.

---

### 7. Labels (Etiquetas)

**Ubicación**: `/src/components/Admin/Labels/`

**Componentes**:

- `BoxLabelPrintDialog` - Diálogo para imprimir etiquetas de cajas

**Funcionalidad**:

- Selección de etiqueta
- Relleno automático de campos desde cajas
- Campos manuales
- Impresión de etiquetas

**Usa `useLabel` hook** para lógica.

---

### 8. LabelEditor (Editor de Etiquetas)

**Archivo**: `/src/components/Admin/LabelEditor/index.js`

**Funcionalidad**: Editor visual WYSIWYG para diseñar etiquetas.

**Características**:

- Canvas interactivo
- Tipos de elementos:
  - Texto
  - Campos (placeholders)
  - Códigos de barras
  - QR codes
  - Imágenes
  - Campos manuales
  - Rich text (párrafos con formato)
- Interacción:
  - Arrastrar elementos
  - Redimensionar elementos
  - Rotar elementos y canvas
  - Zoom in/out
- Persistencia:
  - Guardar en API v2
  - Cargar desde API v2
  - Exportar/importar JSON
- Impresión: Integración con `usePrintElement`

**Componentes hijos**:

- `LabelSelectorSheet` - Selector de etiqueta existente
- `LabelEditorPreview` - Preview de la etiqueta
- `LabelRender` - Renderizado de la etiqueta
- `QRConfigPanel` - Panel de configuración de QR
- `BarcodeConfigPanel` - Panel de configuración de código de barras
- `RichParagraphConfigPanel` - Panel de configuración de párrafo rico

**Usa `useLabelEditor` hook** para lógica.

**Uso**:

```javascript
import LabelEditor from '@/components/Admin/LabelEditor';

function LabelsPage() {
  return <LabelEditor />;
}
```

---

### 9. Layout

**Ubicación**: `/src/components/Admin/Layout/`

#### Sidebar

**Archivo**: `/src/components/Admin/Layout/SideBar/index.js`

**Funcionalidad**: Barra lateral de navegación.

**Componentes**:

- `AppSwitcher` - Selector de aplicación (Admin, Producción, World Trade)
- `NavManagers` - Navegación de gestores (Orders, Stores, etc.)
- `NavMain` - Navegación principal
- `NavUser` - Información del usuario y logout

**Características**:

- Colapsable (modo icono)
- Variante flotante
- Filtrado por roles (si aplica)
- Resalta ruta actual
- Logout con confirmación

**Uso**:

```javascript
import { AppSidebar } from '@/components/Admin/Layout/SideBar';

function AdminLayout({ children }) {
  return (
    <div className="flex">
      <AppSidebar />
      <main>{children}</main>
    </div>
  );
}
```

#### Navbar

**Archivo**: `/src/components/Admin/Layout/Navbar/index.js`

**Funcionalidad**: Barra de navegación superior (alternativa al Sidebar).

**Características**:

- Logo de la aplicación
- Navegación con filtrado por roles
- Logout
- Resalta ruta actual

**Nota**: Parece ser una alternativa al Sidebar, posiblemente para layouts diferentes.

---

### 10. Filters (Filtros Genéricos)

**Ubicación**: `/src/components/Admin/Filters/GenericFilters/`

**Componente principal**: `GenericFilters`

**Funcionalidad**: Sistema de filtros genérico y reutilizable.

**Tipos de filtros soportados**:

- `search` - Búsqueda por texto
- `text` - Input de texto
- `textarea` - Campo de texto multilínea
- `select` - Select con opciones
- `autocomplete` - Autocomplete con carga desde endpoint
- `dateRange` - Rango de fechas
- `date` - Fecha única
- `number` - Número
- `textAccumulator` - Acumulador de texto (múltiples valores)
- `pairSelectBoxes` - Filtro con opciones seleccionables en dos listas

**Características**:

- Modal para mostrar filtros
- Contador de filtros activos
- Reset de filtros
- Formateo automático para API v2

**Componentes de filtros individuales**:
Cada tipo de filtro tiene su propio componente en `/src/components/Admin/Filters/GenericFilters/Types/`:

- `TextFilter` - Campo de texto optimizado con `React.memo`
- `SearchFilter` - Búsqueda con debounce
- `NumberFilter` - Campo numérico con validación
- `DateFilter` - Selector de fecha (`<input type="date">`)
- `DateRangeFilter` - Selector de rango de fechas
- `TextAreaFilter` - Campo de texto multilínea
- `TextAccumulatorFilter` - Acumulador de múltiples valores
- `PairSelectBoxesFilter` - Dos listas de selección

**Uso**:

```javascript
import { GenericFilters } from '@/components/Admin/Filters/GenericFilters';

function FilteredTable() {
  const [filters, setFilters] = useState([]);

  return <GenericFilters filters={filters} onChange={setFilters} config={filterConfig} />;
}
```

**Documentación técnica de componentes**: Ver [`components/Admin/Filters/GenericFilters/Types/`](../components/Admin/Filters/GenericFilters/Types/) para detalles técnicos de cada componente de filtro.

---

### 11. Settings (Configuración)

**Archivo**: `/src/components/Admin/Settings/SettingsForm.js`

**Funcionalidad**: Formulario de configuración de la empresa.

**⚠️ IMPORTANTE**: Este formulario **NO usa React Hook Form**, usa `useState` directamente.

**Secciones**:

- Datos generales (nombre, CIF, registro sanitario)
- Dirección (calle, código postal, ciudad, provincia, país)
- Web y Logo
- Otros datos (lugar de carga, lugar de firma, email BCC)
- Contactos (emails y teléfonos por área)
- Legales (URLs de términos y privacidad)

**Características**:

- Carga configuración desde API v2
- Actualiza `SettingsContext` al guardar
- Campos anidados (ej: `company.name`, `company.address.street`)

**Uso**:

```javascript
import SettingsForm from '@/components/Admin/Settings/SettingsForm';

function SettingsPage() {
  return <SettingsForm />;
}
```

---

### 12. Home (Panel de Control)

**Archivo**: `/src/components/Admin/Home/index.jsx`

**Funcionalidad**: Panel de control alternativo con gráficos de inventario.

**Componentes**:

- `SpeciesInventoryOverview` - Resumen de inventario por especies
- `RawMaterialRadialBarChart` - Gráfico radial de materias primas
- `ProductsInventoryOverview` - Resumen de inventario de productos
- `RawAreaChart` - Gráfico de área de materias primas

**Layout**: Grid responsive de 10 columnas.

**Uso**:

```javascript
import Home from '@/components/Admin/Home';

function HomePage() {
  return <Home />;
}
```

---

### 13. MarketDataExtractor (Extractor de Datos de Mercado)

**Archivo**: `/src/components/Admin/MarketDataExtractor/index.js`

**Funcionalidad**: Extracción de datos de documentos PDF de diferentes fuentes de mercado.

**Fuentes soportadas**:

- `AlbaranCofraWeb` - Albaranes de Cofra Web
- `ListadoComprasAsocPuntaDelMoral` - Listado de compras de Asociación Punta del Moral
- `ListadoComprasLonjaDeIsla` - Listado de compras de Lonja de Isla
- `FacturaDocapesca` - Facturas de Docapesca

**Funcionalidad**:

1. **Subida de PDF**: Componente `PdfUpload` para subir archivos
2. **Extracción con Azure Document AI**: Usa Azure Document AI para extraer texto y tablas
3. **Parsing específico**: Cada fuente tiene su parser específico
4. **Exportación**: Exportar datos extraídos a Excel

**Flujo**:

```javascript
1. Usuario sube PDF
2. Se envía a Azure Document AI
3. Se parsea resultado según fuente
4. Se muestra preview de datos extraídos
5. Usuario puede exportar a Excel
```

**Uso**:

```javascript
import MarketDataExtractor from '@/components/Admin/MarketDataExtractor';

function MarketDataPage() {
  return <MarketDataExtractor />;
}
```

---

## 🔄 Patrones Comunes

### 1. Uso de Context API

Muchos componentes usan Context para estado global:

- `OrderContext` - Estado del pedido
- `StoreContext` - Estado del almacén
- `SettingsContext` - Configuración global

### 2. Hooks Personalizados

Los componentes usan hooks personalizados para lógica:

- `useOrder` - Lógica de pedidos
- `useStore` - Lógica de almacenes
- `usePallet` - Lógica de pallets
- `useLabel` - Lógica de etiquetas
- `useLabelEditor` - Lógica del editor

### 3. Servicios API v2

Todos los componentes usan servicios de API v2:

- `orderService`
- `storeService`
- `productionService`
- `entityService`
- etc.

### 4. Toast Notifications

`notify` como fachada estable del sistema de toasts (título y descripción separados, posición top-center, tema dark/light automático):

```javascript
import { notify } from '@/lib/notifications';

// Mensaje simple (solo título)
notify.success('Éxito');
notify.error('Algo falló');

// Título + descripción (recomendado para errores y contexto)
notify.error({ title: 'Algo falló', description: 'Por favor, inténtalo de nuevo más tarde.' });
notify.success({ title: 'Guardado', description: 'Los cambios se aplicaron correctamente.' });

// Flujos async: usar siempre notify.promise (muestra loading → success/error nativo)
await notify.promise(fetchAlgo(), {
  loading: 'Cargando...',
  success: 'Listo',
  error: (err) => err?.message ?? 'Error',
});
```

### 5. Loading States

Patrón común de loading:

```javascript
const [loading, setLoading] = useState(true);

if (loading) return <Loader />;
```

### 6. Skeleton Components

Componentes skeleton para mejor UX:

- `OrderSkeleton`
- `SkeletonStoreCard`
- `Skeleton` (ShadCN)

---

## 📊 Estadísticas

- **Total de módulos principales**: 13
- **Componentes más complejos**:
  - `EntityClient` - ~429 líneas
  - `LabelEditor` - ~1100+ líneas
  - `Order` - ~313+ líneas
  - `ProductionView` - ~335+ líneas
- **Componentes más simples**:
  - `Home` - ~36 líneas
  - `Dashboard` - ~109 líneas

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Archivo Duplicado en Dashboard

- **Archivo**: `/src/components/Admin/Dashboard/index copy.js`
- **Problema**: Archivo duplicado con "copy" en el nombre
- **Impacto**: Confusión sobre cuál usar
- **Recomendación**: Eliminar archivo duplicado

### 2. Código Comentado en Dashboard

- **Archivo**: `/src/components/Admin/Dashboard/index.js`
- **Línea**: 63-74
- **Problema**: Código de Masonry comentado, posible código muerto
- **Impacto**: Confusión sobre si se usará en el futuro
- **Recomendación**: Eliminar si no se va a usar o documentar por qué está comentado

### 3. Timeout Hardcodeado en OrdersManager

- **Archivo**: `/src/components/Admin/OrdersManager/index.js`
- **Línea**: 40-46
- **Problema**: Timeout de 6 segundos hardcodeado para setLoading(false)
- **Impacto**: Loading puede desaparecer antes de que carguen los datos
- **Recomendación**: Eliminar timeout, usar estado real de carga

### 4. EntityClient con Lógica Compleja

- **Archivo**: `/src/components/Admin/Entity/EntityClient/index.js`
- **Problema**: Componente muy grande (~429 líneas) con múltiples responsabilidades
- **Impacto**: Difícil de mantener y testear
- **Recomendación**: Dividir en componentes más pequeños

### 5. Falta de Manejo de Errores en MarketDataExtractor

- **Archivo**: `/src/components/Admin/MarketDataExtractor/index.js`
- **Problema**: Parsers específicos pueden fallar sin manejo adecuado
- **Impacto**: Errores no manejados pueden romper la UI
- **Recomendación**: Añadir try-catch y manejo de errores en parsers

### 6. SettingsForm sin React Hook Form

- **Archivo**: `/src/components/Admin/Settings/SettingsForm.js`
- **Problema**: Único formulario que no usa React Hook Form
- **Impacto**: Inconsistencia con el resto de formularios
- **Recomendación**: Migrar a React Hook Form

### 7. LabelEditor Muy Grande

- **Archivo**: `/src/components/Admin/LabelEditor/index.js`
- **Problema**: Componente de ~1100+ líneas, demasiado grande
- **Impacto**: Muy difícil de mantener
- **Recomendación**: Dividir en múltiples componentes más pequeños

### 8. Falta de Validación de Permisos

- **Archivo**: Múltiples componentes
- **Problema**: Algunos componentes no validan permisos antes de mostrar acciones
- **Impacto**: Usuarios pueden ver botones que no pueden usar
- **Recomendación**: Añadir validación de permisos consistente

### 9. Uso de window.confirm en EntityClient

- **Archivo**: `/src/components/Admin/Entity/EntityClient/index.js`
- **Línea**: 99
- **Problema**: Usa `window.confirm` nativo en lugar de componente de diálogo
- **Impacto**: UX inconsistente, no se puede personalizar
- **Recomendación**: Usar Dialog component de ShadCN

### 10. Falta de Memoización en Componentes con Cálculos

- **Archivo**: Múltiples componentes
- **Problema**: Cálculos costosos no están memoizados
- **Impacto**: Re-renders innecesarios
- **Recomendación**: Usar `useMemo` para cálculos costosos

### 11. ProductionView con Carga en Paralelo sin Manejo de Errores Parciales

- **Archivo**: `/src/components/Admin/Productions/ProductionView.jsx`
- **Línea**: 40-45
- **Problema**: Usa `Promise.all` con `.catch(() => null)`, puede ocultar errores importantes
- **Impacto**: Errores silenciosos
- **Recomendación**: Manejar errores individualmente y mostrar mensajes apropiados

### 12. StoresManager con Código Comentado

- **Archivo**: `/src/components/Admin/Stores/index.js`
- **Línea**: 4-13, 32-33, 38
- **Problema**: Código comentado extenso
- **Impacto**: Confusión, posible código muerto
- **Recomendación**: Eliminar código comentado o documentar por qué está

### 13. Falta de TypeScript

- **Archivo**: Todos los componentes
- **Problema**: Sin tipos, no hay validación de props ni retornos
- **Impacto**: Errores en tiempo de ejecución, menos productividad
- **Recomendación**: Migrar a TypeScript o añadir PropTypes completo

### 14. Navbar y Sidebar Duplicados

- **Archivo**: `/src/components/Admin/Layout/Navbar/` y `/src/components/Admin/Layout/SideBar/`
- **Problema**: Dos sistemas de navegación diferentes
- **Impacto**: Confusión sobre cuál usar, posible duplicación de lógica
- **Recomendación**: Documentar cuándo usar cada uno o unificar

### 15. Falta de Tests

- **Archivo**: Todos los componentes
- **Problema**: No se encontraron archivos de tests
- **Impacto**: Sin garantía de que los componentes funcionen correctamente
- **Recomendación**: Añadir tests unitarios y de integración
