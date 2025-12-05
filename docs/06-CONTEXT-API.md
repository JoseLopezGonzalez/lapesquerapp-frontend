# Context API - Gestión de Estado Global

## 📚 Documentación Relacionada

- **[05-HOOKS-PERSONALIZADOS.md](./05-HOOKS-PERSONALIZADOS.md)** - Hooks que complementan los contextos
- **[01-ARQUITECTURA.md](./01-ARQUITECTURA.md)** - Arquitectura y uso de providers
- **[USO_SETTINGS.md](./USO_SETTINGS.md)** - Guía práctica de uso de Settings

---

## 📋 Introducción

La aplicación utiliza **Context API de React** para gestionar estado global compartido entre componentes. A diferencia de otras aplicaciones que usan Zustand o Redux, esta aplicación se basa exclusivamente en Context API.

**Ubicación**: `/src/context/`

---

## 🏗️ Arquitectura de Contextos

### Patrón Utilizado

Todos los contextos siguen el mismo patrón:

1. **Provider Component**: Envuelve componentes hijos y proporciona estado
2. **Custom Hook**: Facilita el consumo del contexto con validación
3. **Hook de Negocio**: Encapsula la lógica (useOrder, useStore, etc.)

```
Provider Component
  └── Hook de Negocio (useOrder, useStore, etc.)
       └── Context.Provider
            └── Custom Hook (useOrderContext, useStoreContext)
```

---

## 📦 Contextos Disponibles

### 1. SettingsContext - Configuraciones Globales

**Archivo**: `/src/context/SettingsContext.js`

**Tipo**: Client Component (`"use client"`)

**Provider**: `SettingsProvider`

**Hook de consumo**: `useSettings()`

#### Props del Provider

```javascript
<SettingsProvider>
  {children}
</SettingsProvider>
```

No requiere props, carga settings automáticamente.

#### Estado Proporcionado

```javascript
{
  settings: Object | null,      // Configuraciones del sistema
  loading: boolean,            // Estado de carga
  setSettings: Function        // Función para actualizar settings
}
```

#### Funcionalidad

1. **Carga inicial**: Obtiene settings desde API v2 al montar
2. **Manejo de errores**: 
   - Errores de autenticación: No establece settings (AuthErrorInterceptor maneja redirección)
   - Otros errores: Establece settings vacío `{}`
3. **Invalidación de caché**: Al actualizar settings, invalida caché global en `getSettingValue`

#### Uso

**En Componentes React**:
```javascript
import { useSettings } from "@/context/SettingsContext";

function MyComponent() {
  const { settings, loading, setSettings } = useSettings();
  
  if (loading) return <Loader />;
  
  const companyName = settings?.companyName;
  
  // Actualizar settings
  const handleUpdate = async () => {
    const newSettings = await updateSettings();
    setSettings(newSettings); // Invalida caché automáticamente
  };
  
  return <div>{companyName}</div>;
}
```

**Desde Helpers o Servicios (fuera de React)**:
```javascript
import { getSettingValue } from '@/helpers/getSettingValue';

async function hacerAlgo() {
  const valor = await getSettingValue('nombre_setting');
  // ... usar valor
}

// Forzar recarga
const valor = await getSettingValue('nombre_setting', true);
```

**Actualización de Settings y Notificación Global**:
Cuando actualices los settings desde la UI de administración, **debes notificar al Contexto** para que todos los consumidores se actualicen automáticamente:

```javascript
import { useSettings } from '@/context/SettingsContext';
import { updateSettings } from '@/services/settingsService';

const { setSettings } = useSettings();

async function guardarSettings(nuevosSettings) {
  await updateSettings(nuevosSettings);
  setSettings(nuevosSettings); // Notifica a todos los consumidores y borra el caché global
}
```

Esto asegura que:
- Todos los componentes React que usan `useSettings` se actualizan automáticamente
- El helper `getSettingValue` invalidará su caché y obtendrá los valores frescos en la próxima llamada

**Buenas Prácticas**:
- No modifiques los settings directamente: Usa siempre el flujo `updateSettings` + `setSettings`
- No asumas que los settings están disponibles inmediatamente: Comprueba siempre el estado `loading`
- Si usas el helper fuera de React, recuerda que el caché solo se actualiza tras llamar a `setSettings` en el Context

**Guía práctica completa**: Ver [`USO_SETTINGS.md`](../USO_SETTINGS.md) para más ejemplos y casos de uso.

#### Ubicación del Provider

Se incluye en el **Root Layout** (`/src/app/layout.js`), por lo que está disponible en toda la aplicación.

```javascript
// /src/app/layout.js
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SettingsProvider>
          <ClientLayout>{children}</ClientLayout>
        </SettingsProvider>
      </body>
    </html>
  );
}
```

---

### 2. OrderContext - Estado de Pedido

**Archivo**: `/src/context/OrderContext.js`

**Tipo**: Client Component (`"use client"`)

**Provider**: `OrderProvider`

**Hook de consumo**: `useOrderContext()`

**Hook de negocio**: `useOrder()` (en `/src/hooks/useOrder.js`)

#### Props del Provider

```javascript
<OrderProvider orderId={string} onChange={Function}>
  {children}
</OrderProvider>
```

- `orderId` (string, requerido) - ID del pedido a cargar
- `onChange` (Function, opcional) - Callback cuando el pedido se actualiza

#### Estado Proporcionado

El contexto proporciona todo lo que retorna `useOrder()`:

```javascript
{
  // Datos
  order: Object | null,                    // Datos del pedido
  pallets: Array,                          // Pallets del pedido
  plannedProductDetails: Array,            // Productos planificados
  mergedProductDetails: Array,            // Productos planificados + producción
  options: Object,                         // Opciones (productos, impuestos)
  
  // Estado
  loading: boolean,                        // Estado de carga
  error: Error | null,                    // Error si existe
  activeTab: string,                      // Tab activa ('details', etc.)
  
  // Acciones de productos planificados
  plannedProductDetailActions: {
    create: Function,
    update: Function,
    delete: Function
  },
  
  // Acciones de pedido
  updateOrderData: Function,               // Actualizar datos del pedido
  updateOrderStatus: Function,             // Cambiar estado del pedido
  updateTemperatureOrder: Function,       // Actualizar temperatura
  
  // Exportación
  exportDocument: Function,               // Exportar documento individual
  exportDocuments: Function,              // Exportar múltiples documentos
  fastExportDocuments: Function,          // Exportación rápida
  sendDocuments: Function,                // Enviar documentos por email
  
  // Incidencias
  openOrderIncident: Function,            // Crear/abrir incidencia
  resolveOrderIncident: Function,          // Resolver incidencia
  deleteOrderIncident: Function,          // Eliminar incidencia
  
  // Pallets
  onEditingPallet: Function,              // Editar pallet
  onCreatingPallet: Function,             // Crear pallet
  onDeletePallet: Function,               // Eliminar pallet
  onUnlinkPallet: Function,               // Desvincular pallet
  
  // UI
  setActiveTab: Function                  // Cambiar tab activa
}
```

#### Funcionalidad del Hook useOrder

1. **Carga inicial**: 
   - Obtiene pedido desde API v2
   - Carga opciones de productos e impuestos
   - Merge de productos planificados con producción

2. **Merge de productos**: 
   - Combina `plannedProductDetails` con datos de producción desde pallets
   - Calcula diferencias (planificado vs real)
   - Determina estado (success, difference, pending, noPlanned)

3. **Gestión de estado**:
   - Actualiza estado local cuando se modifican datos
   - Llama a `onChange` callback cuando hay cambios
   - Maneja loading y errores

4. **Acciones**:
   - CRUD de productos planificados
   - Cambio de estado del pedido
   - Gestión de incidencias
   - Gestión de pallets vinculados

#### Uso

```javascript
import { OrderProvider, useOrderContext } from "@/context/OrderContext";

// En la página/componente padre
function OrderPage({ orderId }) {
  return (
    <OrderProvider orderId={orderId} onChange={() => console.log('Updated')}>
      <OrderContent />
    </OrderProvider>
  );
}

// En componentes hijos
function OrderContent() {
  const { 
    order, 
    loading, 
    updateOrderStatus,
    pallets,
    onCreatingPallet 
  } = useOrderContext();
  
  if (loading) return <Loader />;
  
  return (
    <div>
      <h1>Pedido {order.id}</h1>
      <button onClick={() => updateOrderStatus('completed')}>
        Completar
      </button>
    </div>
  );
}
```

#### Ubicación del Provider

Se usa en páginas específicas de pedidos, típicamente en `/src/app/admin/orders/[id]/page.js` o componentes relacionados.

**Ejemplo real**:
```javascript
// /src/components/Admin/OrdersManager/Order/index.js
export default function Order({ orderId }) {
  return (
    <OrderProvider orderId={orderId}>
      <OrderContent />
    </OrderProvider>
  );
}
```

---

### 3. StoreContext - Estado de Almacén

**Archivo**: `/src/context/StoreContext.js`

**Tipo**: Client Component (`"use client"`)

**Provider**: `StoreProvider`

**Hook de consumo**: `useStoreContext()`

**Hook de negocio**: `useStore()` (en `/src/hooks/useStore.js`)

#### Props del Provider

```javascript
<StoreProvider 
  storeId={number}
  onUpdateCurrentStoreTotalNetWeight={Function}
  onAddNetWeightToStore={Function}
  setIsStoreLoading={Function}
>
  {children}
</StoreProvider>
```

- `storeId` (number, requerido) - ID del almacén
- `onUpdateCurrentStoreTotalNetWeight` (Function) - Callback para actualizar peso total
- `onAddNetWeightToStore` (Function) - Callback para añadir peso
- `setIsStoreLoading` (Function) - Callback para establecer loading

#### Estado Proporcionado

El contexto proporciona todo lo que retorna `useStore()`:

```javascript
{
  // Datos
  store: Object | null,                   // Datos del almacén
  filteredPositionsMap: Map,              // Mapa de posiciones filtradas
  unlocatedPallets: Array,                 // Pallets sin posición
  speciesSummary: Array,                   // Resumen por especie
  palletsOptions: Array,                   // Opciones de pallets para filtros
  productsOptions: Array,                   // Opciones de productos para filtros
  
  // Estado
  loading: boolean,                        // Estado de carga
  error: Error | null,                     // Error si existe
  filters: Object,                         // Filtros activos
  
  // Estado de diálogos/slideovers
  isOpenPositionSlideover: boolean,
  isOpenUnallocatedPositionSlideover: boolean,
  isOpenAddElementToPositionDialog: boolean,
  isOpenPalletDialog: boolean,
  isOpenPalletLabelDialog: boolean,
  isOpenMovePalletToStoreDialog: boolean,
  
  // Datos de diálogos
  selectedPosition: string | null,
  addElementToPositionDialogData: Object | null,
  palletDialogData: Object | null,
  palletLabelDialogData: Object | null,
  movePalletToStoreDialogData: number | null,
  
  // Funciones de posiciones
  openPositionSlideover: Function,
  closePositionSlideover: Function,
  openUnallocatedPositionSlideover: Function,
  closeUnallocatedPositionSlideover: Function,
  getPosition: Function,
  getPositionPallets: Function,
  isPositionFilled: Function,
  isPositionRelevant: Function,
  
  // Funciones de elementos
  openAddElementToPosition: Function,
  closeAddElementToPosition: Function,
  
  // Funciones de pallets
  openCreatePalletDialog: Function,
  openPalletDialog: Function,
  closePalletDialog: Function,
  openPalletLabelDialog: Function,
  closePalletLabelDialog: Function,
  openMovePalletToStoreDialog: Function,
  closeMovePalletToStoreDialog: Function,
  updateStoreWhenOnChangePallet: Function,
  removePalletFromPosition: Function,
  
  // Filtros
  onChangeFilters: Function,
  resetFilters: Function,
  
  // Recarga
  reload: Function                         // Forzar recarga del almacén
}
```

#### Funcionalidad del Hook useStore

1. **Carga inicial**: 
   - Obtiene almacén desde API v2
   - Procesa pallets y posiciones
   - Calcula resúmenes (especies, productos)

2. **Filtros**:
   - Filtra por tipo (pallet, box, tub)
   - Filtra por productos
   - Filtra por pallets
   - Genera mapa de posiciones filtradas

3. **Gestión de UI**:
   - Controla apertura/cierre de diálogos y slideovers
   - Gestiona datos de diálogos (pallet seleccionado, posición, etc.)

4. **Operaciones**:
   - Añadir elementos a posiciones
   - Mover pallets entre almacenes
   - Asignar/quitar posiciones
   - Actualizar pallets

5. **Callbacks externos**:
   - Notifica cambios de peso total al componente padre
   - Permite control de loading desde fuera

#### Uso

```javascript
import { StoreProvider, useStoreContext } from "@/context/StoreContext";

// En el componente padre
function Store({ storeId }) {
  const handleUpdateWeight = (totalWeight) => {
    // Actualizar peso en lista de almacenes
  };
  
  return (
    <StoreProvider 
      storeId={storeId}
      onUpdateCurrentStoreTotalNetWeight={handleUpdateWeight}
      onAddNetWeightToStore={() => {}}
      setIsStoreLoading={() => {}}
    >
      <StoreContent />
    </StoreProvider>
  );
}

// En componentes hijos
function StoreContent() {
  const {
    store,
    loading,
    openPositionSlideover,
    isOpenPalletDialog,
    palletDialogData,
    updateStoreWhenOnChangePallet
  } = useStoreContext();
  
  if (loading) return <Loader />;
  
  return (
    <div>
      <h1>Almacén {store.name}</h1>
      <button onClick={() => openPositionSlideover('A1')}>
        Ver posición A1
      </button>
    </div>
  );
}
```

#### Ubicación del Provider

Se usa en componentes de almacenes, típicamente en `/src/components/Admin/Stores/StoresManager/Store/index.js`.

**Ejemplo real**:
```javascript
// /src/components/Admin/Stores/StoresManager/Store/index.js
export const Store = ({ storeId, ...callbacks }) => {
  return (
    <StoreProvider storeId={storeId} {...callbacks}>
      <StoreContent />
    </StoreProvider>
  );
};
```

---

## 🔄 Flujo de Datos

### SettingsContext (Global)

```
RootLayout
  └── SettingsProvider
       └── Carga settings desde API v2
            └── Disponible en toda la app via useSettings()
```

### OrderContext (Local a página)

```
OrderPage
  └── OrderProvider (orderId)
       └── useOrder(orderId)
            └── Carga pedido desde API v2
                 └── Disponible en hijos via useOrderContext()
```

### StoreContext (Local a componente)

```
Store Component
  └── StoreProvider (storeId)
       └── useStore(storeId)
            └── Carga almacén desde API v2
                 └── Disponible en hijos via useStoreContext()
```

---

## 🎯 Patrones de Uso

### 1. Provider en Layout/Página

```javascript
// Página
export default function OrderPage({ params }) {
  const { id } = await params;
  
  return (
    <OrderProvider orderId={id}>
      <OrderContent />
    </OrderProvider>
  );
}
```

### 2. Consumo en Componentes Hijos

```javascript
// Componente hijo
function OrderDetails() {
  const { order, loading } = useOrderContext();
  // ...
}
```

### 3. Múltiples Contextos Anidados

```javascript
// Es posible anidar contextos
<OrderProvider orderId={id}>
  <StoreProvider storeId={storeId}>
    <Component />
  </StoreProvider>
</OrderProvider>
```

### 4. Validación de Contexto

Todos los hooks de consumo validan que el contexto exista:

```javascript
export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
}
```

Esto previene errores si se usa el hook fuera del Provider.

---

## ⚠️ Consideraciones Importantes

### 1. SettingsContext es Global

- Se carga una vez al iniciar la app
- Disponible en toda la aplicación
- No requiere Provider adicional en páginas

### 2. OrderContext y StoreContext son Locales

- Requieren Provider en cada página/componente que los use
- Se recrean cuando cambia el `orderId` o `storeId`
- No persisten entre navegaciones

### 3. Callbacks en StoreContext

StoreContext requiere callbacks del componente padre para:
- Actualizar peso total en lista de almacenes
- Controlar loading desde fuera
- Sincronizar estado entre componentes

Esto crea una dependencia bidireccional.

### 4. Invalidación de Caché

SettingsContext invalida caché global al actualizar:
- Llama a `invalidateSettingsCache()` de `/src/helpers/getSettingValue.js`
- Asegura que helpers obtengan settings actualizados

---

## 📊 Estadísticas de Uso

Según búsqueda en el código:
- **31 archivos** usan contextos
- **OrderContext**: ~15 componentes
- **StoreContext**: ~10 componentes
- **SettingsContext**: ~6 componentes

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Comentario Incorrecto en StoreContext
- **Archivo**: `/src/context/StoreContext.js`
- **Línea**: 1, 11
- **Problema**: Comentario dice "OrderContext" y "datos del pedido" en lugar de "StoreContext" y "datos del almacén"
- **Impacto**: Confusión al leer el código
- **Recomendación**: Corregir comentarios

### 2. StoreContext con Muchas Props de Callback
- **Archivo**: `/src/context/StoreContext.js`
- **Línea**: 10
- **Problema**: StoreProvider requiere 4 callbacks del padre (onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, setIsStoreLoading)
- **Impacto**: Acoplamiento fuerte, difícil de usar, prop drilling
- **Recomendación**: Considerar mover lógica de callbacks dentro del hook o usar eventos/callbacks opcionales

### 3. Falta de Memoización en Providers
- **Archivo**: Todos los contextos
- **Problema**: Los valores del contexto no están memoizados
- **Impacto**: Re-renders innecesarios de todos los consumidores cuando cambia cualquier valor
- **Recomendación**: Usar `useMemo` para el valor del contexto

### 4. OrderContext con onChange Opcional
- **Archivo**: `/src/context/OrderContext.js`
- **Línea**: 10
- **Problema**: `onChange` es opcional pero se usa sin validación en algunos lugares del hook
- **Impacto**: Posibles errores si se espera que siempre exista
- **Recomendación**: Validar existencia antes de llamar o hacer requerido

### 5. SettingsContext sin Manejo de Re-carga
- **Archivo**: `/src/context/SettingsContext.js`
- **Línea**: 13-29
- **Problema**: Settings solo se cargan una vez al montar, no hay forma de recargar
- **Impacto**: Si settings cambian en el backend, no se reflejan sin recargar página
- **Recomendación**: Añadir función `reload()` o invalidar y recargar automáticamente

### 6. useStore con Estado Complejo
- **Archivo**: `/src/hooks/useStore.js`
- **Línea**: 23-571
- **Problema**: Hook muy grande (571 líneas) con mucha lógica y estado
- **Impacto**: Difícil de mantener, testear y entender
- **Recomendación**: Dividir en hooks más pequeños (useStoreData, useStoreFilters, useStoreDialogs)

### 7. useOrder con Estado Complejo
- **Archivo**: `/src/hooks/useOrder.js`
- **Línea**: 59-645
- **Problema**: Hook muy grande (645 líneas) con mucha lógica
- **Impacto**: Similar a useStore, difícil de mantener
- **Recomendación**: Dividir en hooks más pequeños

### 8. Falta de TypeScript
- **Archivo**: Todos los contextos
- **Problema**: Sin tipos, no hay validación de props ni autocompletado
- **Impacto**: Errores en tiempo de ejecución, menos productividad
- **Recomendación**: Migrar a TypeScript o añadir PropTypes

### 9. Contextos sin Valor por Defecto
- **Archivo**: Todos los contextos
- **Problema**: Contextos creados sin valor por defecto: `createContext()`
- **Impacto**: Si se usa fuera del Provider, el valor es `undefined` (aunque hay validación en hooks)
- **Recomendación**: Considerar valor por defecto o mantener validación en hooks (actual)

### 10. Posible Prop Drilling en StoreContext
- **Archivo**: `/src/context/StoreContext.js`
- **Problema**: Callbacks vienen del componente padre, que probablemente los recibe de su padre
- **Impacto**: Prop drilling a través de múltiples niveles
- **Recomendación**: Revisar si los callbacks son realmente necesarios o pueden manejarse dentro del contexto

