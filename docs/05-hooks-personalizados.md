# Hooks Personalizados - Lógica de Negocio Reutilizable

## 📚 Documentación Relacionada

- **[06-context-api.md](./06-context-api.md)** - Contextos que complementan los hooks
- **[07-servicios-api-v2.md](./07-servicios-api-v2.md)** - Servicios utilizados por los hooks
- **[04-components-admin.md](./04-components-admin.md)** - Componentes que utilizan estos hooks

---

## 📋 Introducción

Los hooks personalizados están ubicados en `/src/hooks/` y encapsulan lógica de negocio reutilizable. Siguen las convenciones de React Hooks (prefijo `use`) y permiten compartir estado y lógica entre componentes.

**Total de hooks**: 13 hooks personalizados

---

## 🎯 Hooks por Categoría

### Hooks de Gestión de Entidades

- `useOrder` - Gestión completa de pedidos
- `useStore` - Gestión de almacenes individuales
- `useStores` - Lista de almacenes
- `usePallet` - Gestión de pallets

### Hooks de Configuración de Formularios

- `useOrderCreateFormConfig` - Configuración para crear pedidos
- `useOrderFormConfig` - Configuración para editar pedidos

### Hooks de Opciones (Selects/Combobox)

- `useProductOptions` - Opciones de productos
- `useTaxOptions` - Opciones de impuestos
- `useStoresOptions` - Opciones de almacenes

### Hooks de Etiquetas

- `useLabel` - Sistema de etiquetas
- `useLabelEditor` - Editor de etiquetas

### Hooks de Utilidad

- `usePrintElement` - Impresión de elementos
- `use-mobile` - Detección de dispositivos móviles

---

## 📦 Documentación Detallada

### 1. useOrder - Gestión de Pedidos

**Archivo**: `/src/hooks/useOrder.js`

**Tamaño**: ~645 líneas (hook más grande)

**Parámetros**:

```javascript
useOrder(orderId, onChange);
```

- `orderId` (string|number, requerido) - ID del pedido
- `onChange` (Function, opcional) - Callback cuando el pedido se actualiza

**Retorna**:

```javascript
{
  // Datos
  order: Object | null,                    // Datos del pedido
  pallets: Array,                          // Pallets del pedido
  plannedProductDetails: Array,            // Productos planificados
  mergedProductDetails: Array,             // Productos planificados + producción (merge)
  options: Object,                         // { productOptions, taxOptions }

  // Estado
  loading: boolean,
  error: Error | null,
  activeTab: string,                       // Tab activa ('details', etc.)

  // Acciones de productos planificados
  plannedProductDetailActions: {
    create: Function,
    update: Function,
    delete: Function
  },

  // Acciones de pedido
  updateOrderData: Function,               // Actualizar datos del pedido
  updateOrderStatus: Function,             // Cambiar estado
  updateTemperatureOrder: Function,        // Actualizar temperatura

  // Exportación
  exportDocument: Function,                // Exportar documento individual
  exportDocuments: Function,               // Exportar múltiples
  fastExportDocuments: Function,           // Exportación rápida
  sendDocuments: Function,                 // Enviar por email

  // Incidencias
  openOrderIncident: Function,            // Crear/abrir incidencia
  resolveOrderIncident: Function,          // Resolver incidencia
  deleteOrderIncident: Function,           // Eliminar incidencia

  // Pallets
  onEditingPallet: Function,              // Editar pallet
  onCreatingPallet: Function,             // Crear pallet
  onDeletePallet: Function,               // Eliminar pallet
  onUnlinkPallet: Function,               // Desvincular pallet

  // UI
  setActiveTab: Function,                 // Cambiar tab activa
  reload: Function                         // Recargar pedido
}
```

**Funcionalidad**:

1. **Carga inicial**: Obtiene pedido, opciones de productos e impuestos
2. **Merge de productos**: Combina productos planificados con datos de producción desde pallets
3. **Cálculo de diferencias**: Calcula diferencias entre planificado y real
4. **Gestión de estado**: Actualiza estado local y llama `onChange` cuando hay cambios
5. **CRUD de productos planificados**: Crear, actualizar, eliminar
6. **Gestión de incidencias**: Crear, resolver, eliminar
7. **Exportación**: Múltiples formatos (Excel, PDF, etc.)
8. **Gestión de pallets**: Vincular, desvincular, editar

**Uso**:

```javascript
import { useOrder } from '@/hooks/useOrder';

function OrderComponent({ orderId }) {
  const { order, loading, updateOrderStatus, plannedProductDetailActions } = useOrder(orderId, () =>
    console.log('Updated')
  );

  if (loading) return <Loader />;

  return (
    <div>
      <h1>Pedido {order.id}</h1>
      <button onClick={() => updateOrderStatus('completed')}>Completar</button>
    </div>
  );
}
```

**Nota**: Este hook es usado por `OrderContext` para proporcionar estado global.

---

### 2. useStore - Gestión de Almacén Individual

**Archivo**: `/src/hooks/useStore.js`

**Tamaño**: ~571 líneas (segundo hook más grande)

**Parámetros**:

```javascript
useStore({
  storeId,
  onUpdateCurrentStoreTotalNetWeight,
  onAddNetWeightToStore,
  setIsStoreLoading,
});
```

- `storeId` (number, requerido) - ID del almacén
- `onUpdateCurrentStoreTotalNetWeight` (Function) - Callback para actualizar peso total
- `onAddNetWeightToStore` (Function) - Callback para añadir peso
- `setIsStoreLoading` (Function) - Callback para establecer loading

**Retorna**:

```javascript
{
  // Datos
  store: Object | null,                    // Datos del almacén
  filteredPositionsMap: Map,                // Mapa de posiciones filtradas
  unlocatedPallets: Array,                  // Pallets sin posición
  speciesSummary: Array,                   // Resumen por especie
  palletsOptions: Array,                    // Opciones para filtros
  productsOptions: Array,                   // Opciones para filtros

  // Estado
  loading: boolean,
  error: Error | null,
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
  reload: Function
}
```

**Funcionalidad**:

1. **Carga inicial**: Obtiene almacén desde API v2
2. **Filtros**: Filtra por tipo (pallet, box, tub), productos, pallets
3. **Resúmenes**: Calcula resumen por especies y productos
4. **Gestión de UI**: Controla apertura/cierre de diálogos y slideovers
5. **Operaciones**: Añadir elementos a posiciones, mover pallets, asignar/quitar posiciones
6. **Callbacks externos**: Notifica cambios de peso al componente padre

**Uso**:

```javascript
import { useStore } from '@/hooks/useStore';

function StoreComponent({ storeId }) {
  const {
    store,
    loading,
    openPositionSlideover,
    isOpenPalletDialog,
    updateStoreWhenOnChangePallet,
  } = useStore({
    storeId,
    onUpdateCurrentStoreTotalNetWeight: (totalWeight) => {
      // Actualizar en lista de almacenes
    },
    onAddNetWeightToStore: () => {},
    setIsStoreLoading: () => {},
  });

  if (loading) return <Loader />;

  return (
    <div>
      <h1>Almacén {store.name}</h1>
      <button onClick={() => openPositionSlideover('A1')}>Ver posición A1</button>
    </div>
  );
}
```

**Nota**: Este hook es usado por `StoreContext` para proporcionar estado global.

---

### 3. useStores - Lista de Almacenes

**Archivo**: `/src/hooks/useStores.js`

**Parámetros**: Ninguno

**Retorna**:

```javascript
{
  stores: Array,                           // Lista de almacenes
  loading: boolean,
  error: Error | null,
  onUpdateCurrentStoreTotalNetWeight: Function,  // Actualizar peso total
  onAddNetWeightToStore: Function,                // Añadir peso
  isStoreLoading: boolean,
  setIsStoreLoading: Function
}
```

**Funcionalidad**:

1. **Carga inicial**: Obtiene lista de almacenes desde API v2
2. **Actualización de peso**: Callbacks para actualizar peso total de almacenes
3. **Estado de loading**: Controla loading individual por almacén

**Uso**:

```javascript
import { useStores } from '@/hooks/useStores';

function StoresList() {
  const { stores, loading, onUpdateCurrentStoreTotalNetWeight } = useStores();

  if (loading) return <Loader />;

  return (
    <div>
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onUpdateWeight={onUpdateCurrentStoreTotalNetWeight}
        />
      ))}
    </div>
  );
}
```

---

### 4. usePallet - Gestión de Pallets

**Archivo**: `/src/hooks/usePallet.js`

**Tamaño**: ~734 líneas (hook más grande)

**Parámetros**:

```javascript
usePallet({ id, onChange, initialStoreId, initialOrderId });
```

- `id` (string|number|null, requerido) - ID del pallet o 'new' para crear nuevo
- `onChange` (Function, opcional) - Callback cuando el pallet se actualiza
- `initialStoreId` (number, opcional) - ID de almacén inicial
- `initialOrderId` (number, opcional) - ID de pedido inicial

**Retorna**:

```javascript
{
  // Datos
  pallet: Object | null,                   // Pallet original (desde API)
  temporalPallet: Object | null,           // Pallet temporal (ediciones)
  temporalProductsSummary: Object,         // Resumen de productos
  temporalTotalProducts: number,           // Total de productos únicos
  temporalTotalLots: number,              // Total de lotes únicos
  temporalUniqueLots: Set,                // Set de lotes únicos

  // Opciones
  activeOrdersOptions: Array,              // Opciones de pedidos activos
  productsOptions: Array,                  // Opciones de productos

  // Estado de creación de cajas
  boxCreationData: Object,                 // Datos para crear cajas

  // Estado
  loading: boolean,
  error: Error | null,

  // Acciones de cajas
  editPallet: {
    box: {
      add: Function,                       // Añadir caja
      duplicate: Function,                // Duplicar caja
      delete: Function,                   // Eliminar caja
      edit: {                            // Editar caja individual
        product: Function,
        lot: Function,
        netWeight: Function
      },
      bulkEdit: {                        // Edición masiva (solo cajas disponibles)
        changeLot: Function,             // Cambiar lote de múltiples cajas disponibles
        changeNetWeight: Function        // Cambiar peso de múltiples cajas disponibles
      }
    },
    observations: Function,               // Editar observaciones
    orderId: Function                    // Editar orderId
  },

  // Funciones de creación
  boxCreationDataChange: Function,         // Cambiar datos de creación
  onResetBoxCreationData: Function,        // Resetear datos
  onAddNewBox: Function,                  // Añadir nueva caja (múltiples métodos)
  deleteAllBoxes: Function,               // Eliminar todas las cajas
  resetAllChanges: Function,              // Descartar cambios

  // Guardado
  onSavingChanges: Function,              // Guardar cambios (crear/actualizar)
  onClose: Function,                     // Cerrar y limpiar

  // Utilidades
  reloadPallet: Function,                 // Recargar pallet
  getPieChartData: Array,                 // Datos para gráfico de pastel
  setBoxPrinted: Function                 // Marcar caja como impresa
}
```

**Funcionalidad**:

1. **Carga inicial**:
   - Si `id === 'new'` o `null`: Crea pallet temporal vacío
   - Si `id` existe: Carga pallet desde API
   - Carga opciones de pedidos y productos

2. **Gestión de estado temporal**:
   - `pallet`: Estado original (desde API)
   - `temporalPallet`: Estado editable (cambios locales)
   - Permite descartar cambios con `resetAllChanges`

3. **Creación de cajas** (múltiples métodos):
   - **Manual**: Campos individuales (producto, lote, peso)
   - **Promedio**: Total de peso y número de cajas
   - **Masiva**: Lista de pesos (una por línea)
   - **Lector**: Escaneo de código GS1-128 (soporta kg y libras)
   - **GS1**: Pegado de múltiples códigos GS1-128

4. **Soporte GS1-128**:
   - Formato: `(01)GTIN(3100)peso(10)lote` (kg)
   - Formato: `(01)GTIN(3200)peso(10)lote` (libras)
   - Conversión automática de libras a kg (factor 0.453592)

5. **Cálculos automáticos**:
   - Recalcula `numberOfBoxes` y `netWeight` al añadir/eliminar cajas
   - Genera resumen de productos
   - Genera datos para gráfico de pastel

6. **Edición masiva**:
   - `bulkEdit.changeLot`: Cambia el lote de todas las cajas disponibles
   - `bulkEdit.changeNetWeight`: Cambia el peso de todas las cajas disponibles
   - **Restricción**: Solo se aplican cambios a cajas disponibles (no en producción)
   - Las cajas en producción no pueden ser modificadas mediante acciones masivas

7. **Guardado**:
   - Si `id === null`: Crea nuevo pallet
   - Si `id` existe: Actualiza pallet existente
   - Llama `onChange` con pallet actualizado

**Uso**:

```javascript
import { usePallet } from '@/hooks/usePallet';

function PalletDialog({ palletId, onClose }) {
  const {
    pallet,
    temporalPallet,
    loading,
    editPallet,
    onAddNewBox,
    onSavingChanges,
    boxCreationData,
    boxCreationDataChange,
  } = usePallet({
    id: palletId,
    onChange: (updatedPallet) => {
      console.log('Pallet updated:', updatedPallet);
      onClose();
    },
  });

  if (loading) return <Loader />;

  return (
    <div>
      <input
        value={boxCreationData.netWeight}
        onChange={(e) => boxCreationDataChange('netWeight', e.target.value)}
      />
      <button onClick={() => onAddNewBox({ method: 'manual' })}>Añadir Caja</button>
      <button onClick={onSavingChanges}>Guardar</button>
    </div>
  );
}
```

---

### 5. useLabel - Sistema de Etiquetas

**Archivo**: `/src/hooks/useLabel.js`

**Parámetros**:

```javascript
useLabel({ boxes, open });
```

- `boxes` (Array, opcional, default: []) - Array de cajas para generar etiquetas
- `open` (boolean, requerido) - Si el modal/diálogo está abierto

**Retorna**:

```javascript
{
  label: Object | null,                   // Etiqueta seleccionada
  labelsOptions: Array,                    // Opciones de etiquetas disponibles
  selectLabel: Function,                   // Seleccionar etiqueta (labelId)
  manualFields: Object,                    // Campos manuales { key: value }
  fields: Array,                          // Campos extraídos de cajas
  changeManualField: Function,            // Cambiar campo manual (key, value)
  values: Array,                          // Valores combinados (manualFields + fields)
  disabledPrintButton: boolean            // Si el botón imprimir está deshabilitado
}
```

**Funcionalidad**:

1. **Carga de opciones**: Carga opciones de etiquetas cuando `open === true`
2. **Selección de etiqueta**: Al seleccionar, extrae campos de la estructura de la etiqueta
3. **Extracción de campos**:
   - De elementos tipo `field`
   - De placeholders en HTML (`{{field}}`)
   - De contenido de QR y códigos de barras
4. **Relleno automático**: Rellena campos con valores de las cajas (usando paths como `product.name`)
5. **Campos manuales**: Permite campos manuales que se aplican a todas las cajas
6. **Validación**: Deshabilita botón imprimir si hay campos manuales vacíos

**Uso**:

```javascript
import { useLabel } from '@/hooks/useLabel';

function LabelDialog({ boxes, open, onClose }) {
  const {
    label,
    labelsOptions,
    selectLabel,
    manualFields,
    changeManualField,
    values,
    disabledPrintButton,
  } = useLabel({ boxes, open });

  return (
    <Dialog open={open}>
      <Select value={label?.id} onChange={selectLabel}>
        {labelsOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      {Object.entries(manualFields).map(([key, value]) => (
        <Input key={key} value={value} onChange={(e) => changeManualField(key, e.target.value)} />
      ))}

      <button disabled={disabledPrintButton} onClick={handlePrint}>
        Imprimir
      </button>
    </Dialog>
  );
}
```

---

### 6. useLabelEditor - Editor de Etiquetas

**Archivo**: `/src/hooks/useLabelEditor.js`

**Tamaño**: ~554 líneas

**Parámetros**:

```javascript
useLabelEditor(dataContext);
```

- `dataContext` (Object, opcional) - Contexto de datos por defecto para preview

**Retorna**:

```javascript
{
  // Estado del editor
  selectedLabel: Object | null,            // Etiqueta seleccionada
  elements: Array,                         // Elementos de la etiqueta
  labelName: string,                      // Nombre de la etiqueta
  labelId: number | null,                  // ID de la etiqueta

  // Estado de selección
  selectedElement: string | null,         // ID del elemento seleccionado

  // Estado de canvas
  canvasWidth: number,                     // Ancho del canvas (mm)
  canvasHeight: number,                    // Alto del canvas (mm)
  canvasRotation: number,                  // Rotación del canvas (0, 90, 180, 270)
  zoom: number,                            // Nivel de zoom

  // Estado de interacción
  isDragging: boolean,                      // Si se está arrastrando
  dragOffset: Object,                     // Offset del arrastre
  isResizing: boolean,                     // Si se está redimensionando
  resizeCorner: string | null,             // Esquina de redimensionamiento
  resizeStart: Object | null,              // Inicio del redimensionamiento

  // Estado de UI
  openSelector: boolean,                    // Si el selector está abierto
  manualValues: Object,                   // Valores manuales para preview
  showManualDialog: boolean,              // Si mostrar diálogo de valores manuales
  manualForm: Object,                     // Formulario de valores manuales

  // Opciones
  fieldOptions: Array,                    // Opciones de campos disponibles
  manualFieldOptions: Array,              // Opciones de campos manuales
  allFieldOptions: Array,                 // Todas las opciones (fields + manual)

  // Funciones de elementos
  addElement: Function,                   // Añadir elemento
  deleteElement: Function,                // Eliminar elemento
  updateElement: Function,                // Actualizar elemento
  duplicateElement: Function,             // Duplicar elemento

  // Funciones de canvas
  rotateCanvas: Function,                 // Rotar canvas 90°
  rotateCanvasTo: Function,               // Rotar canvas a ángulo específico
  handleCanvasRotationChange: Function,   // Cambiar rotación del canvas

  // Funciones de etiqueta
  handleSelectLabel: Function,            // Seleccionar etiqueta existente
  handleCreateNewLabel: Function,        // Crear nueva etiqueta
  handleSaveLabel: Function,             // Guardar etiqueta
  handleDeleteLabel: Function,           // Eliminar etiqueta
  handleLoadLabel: Function,             // Cargar etiqueta desde archivo JSON
  handleExportLabel: Function,           // Exportar etiqueta a JSON

  // Funciones de impresión
  handlePrint: Function,                 // Imprimir etiqueta
  handleConfirmManual: Function,          // Confirmar valores manuales e imprimir

  // Funciones de interacción
  handleElementClick: Function,          // Click en elemento
  handleElementDragStart: Function,      // Inicio de arrastre
  handleElementDrag: Function,           // Durante arrastre
  handleElementDragEnd: Function,       // Fin de arrastre
  handleElementResizeStart: Function,    // Inicio de redimensionamiento
  handleElementResize: Function,         // Durante redimensionamiento
  handleElementResizeEnd: Function,      // Fin de redimensionamiento
  handleElementRotationChange: Function  // Cambiar rotación de elemento
}
```

**Funcionalidad**:

1. **Editor visual**: Canvas interactivo para diseñar etiquetas
2. **Tipos de elementos**:
   - Texto
   - Campos (con placeholders)
   - Códigos de barras
   - QR codes
   - Campos manuales
3. **Interacción**:
   - Arrastrar elementos
   - Redimensionar elementos
   - Rotar elementos y canvas
   - Zoom
4. **Persistencia**:
   - Guardar en API v2
   - Cargar desde API v2
   - Exportar/importar JSON
5. **Impresión**: Integración con `usePrintElement`

**Uso**: Muy complejo, ver componente `LabelEditor` para ejemplo completo.

---

### 7. useOrderCreateFormConfig - Configuración de Formulario de Creación

**Archivo**: `/src/hooks/useOrderCreateFormConfig.js`

**Parámetros**: Ninguno

**Retorna**:

```javascript
{
  defaultValues: Object,                  // Valores por defecto
  formGroups: Array,                      // Grupos de campos del formulario
  loading: boolean                        // Si está cargando opciones
}
```

**Funcionalidad**:

1. **Carga de opciones**: Carga opciones de comerciales, términos de pago, incoterms, transportes, clientes
2. **Configuración de formulario**: Define estructura completa del formulario con:
   - Grupos de campos
   - Validaciones (rules)
   - Componentes (Input, Select, Combobox, DatePicker, etc.)
   - Props de cada campo
3. **Valores por defecto**: Define valores iniciales (fecha actual, arrays vacíos, etc.)

**Estructura de formGroups**:

```javascript
[
  {
    group: 'Cliente',
    grid: 'grid-cols-1 gap-4',
    fields: [
      {
        name: 'customer',
        label: 'Cliente',
        component: 'Combobox',
        rules: { required: '...' },
        options: [...],  // Se llena dinámicamente
        props: { ... }
      }
    ]
  },
  // ... más grupos
]
```

**Uso**:

```javascript
import { useOrderCreateFormConfig } from '@/hooks/useOrderCreateFormConfig';

function CreateOrderForm() {
  const { defaultValues, formGroups, loading } = useOrderCreateFormConfig();

  // Usar con React Hook Form
  const { register, handleSubmit } = useForm({
    defaultValues,
  });

  // Renderizar formGroups...
}
```

---

### 8. useOrderFormConfig - Configuración de Formulario de Edición

**Archivo**: `/src/hooks/useOrderFormConfig.js`

**Parámetros**: Ninguno

**Retorna**: Similar a `useOrderCreateFormConfig` pero sin campo de cliente (no se puede cambiar)

**Funcionalidad**: Similar a `useOrderCreateFormConfig` pero adaptado para edición (sin cliente, valores iniciales diferentes).

---

### 9. useProductOptions - Opciones de Productos

**Archivo**: `/src/hooks/useProductOptions.js`

**Parámetros**: Ninguno

**Retorna**:

```javascript
{
  productOptions: Array<{value: string, label: string}>,
  loading: boolean
}
```

**Funcionalidad**:

1. Carga opciones de productos desde API v2
2. Formatea a `{value: id, label: name}` para Select/Combobox

**Uso**:

```javascript
import { useProductOptions } from '@/hooks/useProductOptions';

function ProductSelect() {
  const { productOptions, loading } = useProductOptions();

  return (
    <Select>
      {productOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
```

---

### 10. useTaxOptions - Opciones de Impuestos

**Archivo**: `/src/hooks/useTaxOptions.js`

**Parámetros**: Ninguno

**Retorna**:

```javascript
{
  taxOptions: Array<{value: string, label: string}>,
  loading: boolean
}
```

**Funcionalidad**: Similar a `useProductOptions`, carga opciones de impuestos y formatea como `{value: id, label: 'rate %'}`.

---

### 11. useStoresOptions - Opciones de Almacenes

**Archivo**: `/src/hooks/useStoresOptions.js`

**Parámetros**: Ninguno

**Retorna**:

```javascript
{
  storeOptions: Array<{value: string, label: string}>,
  loading: boolean
}
```

**Funcionalidad**: Similar a otros hooks de opciones, carga opciones de almacenes.

**Nota**: Hay un error en el mensaje de error (dice "impuestos" en lugar de "almacenes").

---

### 12. usePrintElement - Impresión de Elementos

**Archivo**: `/src/hooks/usePrintElement.js`

**Parámetros**:

```javascript
usePrintElement({ id, width, height });
```

- `id` (string, requerido) - ID del elemento HTML a imprimir
- `width` (number, opcional, default: 100) - Ancho en mm
- `height` (number, opcional, default: 150) - Alto en mm

**Retorna**:

```javascript
{
  onPrint: Function; // Función para imprimir
}
```

**Funcionalidad**:

1. Crea iframe oculto
2. Copia estilos del documento actual
3. Añade estilos de impresión con tamaño específico
4. Copia contenido del elemento
5. Abre diálogo de impresión
6. Limpia iframe después de imprimir

**Uso**:

```javascript
import { usePrintElement } from '@/hooks/usePrintElement';

function LabelPrint() {
  const { onPrint } = usePrintElement({
    id: 'label-content',
    width: 110,
    height: 90,
  });

  return (
    <div>
      <div id="label-content">{/* Contenido de la etiqueta */}</div>
      <button onClick={onPrint}>Imprimir</button>
    </div>
  );
}
```

---

### 13. use-mobile - Detección de Dispositivos Móviles

**Archivo**: `/src/hooks/use-mobile.jsx`

**Parámetros**: Ninguno

**Retorna**: `boolean` - `true` si es móvil, `false` si no

**Funcionalidad**:

1. Usa `window.matchMedia` para detectar ancho de pantalla
2. Breakpoint: 768px (menor = móvil)
3. Escucha cambios de tamaño de ventana
4. Retorna estado actualizado

**Uso**:

```javascript
import { useIsMobile } from '@/hooks/use-mobile';

function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>{/* Contenido */}</div>;
}
```

---

## 🔄 Patrones Comunes

### 1. Carga de Datos con useSession

```javascript
const { data: session } = useSession();
const token = session?.user?.accessToken;

useEffect(() => {
  if (!token) return;
  // Cargar datos...
}, [token]);
```

### 2. Estado de Loading

```javascript
const [loading, setLoading] = useState(true);

useEffect(() => {
  setLoading(true);
  // Cargar datos...
    .finally(() => setLoading(false));
}, [dependencies]);
```

### 3. Manejo de Errores

```javascript
const [error, setError] = useState(null);

try {
  // Operación...
} catch (err) {
  setError(err);
  throw err; // Re-lanzar para manejo en componente
}
```

### 4. Callbacks Opcionales

```javascript
const updateData = async (data) => {
  // ... actualizar
  onChange?.(); // Llamar solo si existe
};
```

---

## 📊 Estadísticas

- **Total de hooks**: 13
- **Hooks más grandes**:
  - `usePallet`: ~734 líneas
  - `useOrder`: ~645 líneas
  - `useStore`: ~571 líneas
  - `useLabelEditor`: ~554 líneas
- **Hooks más pequeños**:
  - `use-mobile`: ~20 líneas
  - `useProductOptions`: ~27 líneas
  - `useTaxOptions`: ~27 líneas

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Hooks Demasiado Grandes

- **Archivo**: `usePallet.js`, `useOrder.js`, `useStore.js`, `useLabelEditor.js`
- **Problema**: Hooks con 500+ líneas, demasiada responsabilidad
- **Impacto**: Difícil de mantener, testear y entender
- **Recomendación**: Dividir en hooks más pequeños (ej: `usePalletData`, `usePalletBoxes`, `usePalletCreation`)

### 2. Archivo Duplicado

- **Archivo**: `/src/hooks/usePrintElement copy.js`
- **Problema**: Archivo duplicado con "copy" en el nombre
- **Impacto**: Confusión sobre cuál usar
- **Recomendación**: Eliminar archivo duplicado

### 3. useStoresOptions con Mensaje de Error Incorrecto

- **Archivo**: `/src/hooks/useStoresOptions.js`
- **Línea**: 18
- **Problema**: Mensaje dice "Error al cargar impuestos" en lugar de "almacenes"
- **Impacto**: Confusión en logs
- **Recomendación**: Corregir mensaje

### 4. Falta de Validación de Token

- **Archivo**: Múltiples hooks
- **Problema**: Algunos hooks no validan que `token` exista antes de hacer fetch
- **Impacto**: Errores en tiempo de ejecución
- **Recomendación**: Validar token al inicio o usar helper común

### 5. usePallet con Lógica Compleja de GS1-128

- **Archivo**: `/src/hooks/usePallet.js`
- **Línea**: 208-236, 461-509, 510-582
- **Problema**: Lógica de parsing de GS1-128 duplicada en múltiples lugares
- **Impacto**: Mantenimiento difícil, posible inconsistencia
- **Recomendación**: Extraer a función helper reutilizable

### 6. useOrder con Merge Complejo

- **Archivo**: `/src/hooks/useOrder.js`
- **Línea**: 13-57
- **Problema**: Función `mergeOrderDetails` muy compleja dentro del hook
- **Impacto**: Difícil de testear y mantener
- **Recomendación**: Extraer a función helper o hook separado

### 7. Falta de Memoización en Hooks

- **Archivo**: Múltiples hooks
- **Problema**: Cálculos costosos no están memoizados (ej: `mergedProductDetails`, `speciesSummary`)
- **Impacto**: Re-renders innecesarios
- **Recomendación**: Usar `useMemo` para cálculos costosos

### 8. useLabelEditor con Mucho Estado

- **Archivo**: `/src/hooks/useLabelEditor.js`
- **Problema**: ~20 estados diferentes en un solo hook
- **Impacto**: Difícil de seguir el flujo de estado
- **Recomendación**: Dividir en múltiples hooks o usar `useReducer`

### 9. Falta de Cleanup en use-mobile

- **Archivo**: `/src/hooks/use-mobile.jsx`
- **Línea**: 15
- **Problema**: Cleanup existe pero podría mejorarse
- **Impacto**: Menor, pero mejor práctica
- **Recomendación**: Verificar que cleanup funcione correctamente

### 10. Hooks de Opciones sin Manejo de Errores

- **Archivo**: `useProductOptions.js`, `useTaxOptions.js`, `useStoresOptions.js`
- **Problema**: Solo hacen `console.error`, no establecen estado de error
- **Impacto**: Componentes no pueden mostrar errores al usuario
- **Recomendación**: Añadir estado `error` y retornarlo

### 11. usePallet con IDs Temporales

- **Archivo**: `/src/hooks/usePallet.js`
- **Línea**: 43-47
- **Problema**: Usa `Date.now()` para generar IDs temporales, puede causar colisiones
- **Impacto**: Posibles IDs duplicados si se crean muy rápido
- **Recomendación**: Usar UUID o contador más robusto

### 12. Falta de TypeScript

- **Archivo**: Todos los hooks
- **Problema**: Sin tipos, no hay validación de parámetros ni retornos
- **Impacto**: Errores en tiempo de ejecución, menos productividad
- **Recomendación**: Migrar a TypeScript o añadir PropTypes/JSDoc completo
