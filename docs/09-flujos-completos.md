# Flujos Funcionales Completos

## 📚 Documentación Relacionada

- **[04-components-admin.md](./04-components-admin.md)** - Componentes mencionados en los flujos
- **[05-hooks-personalizados.md](./05-hooks-personalizados.md)** - Hooks utilizados en los flujos
- **[07-servicios-api-v2.md](./07-servicios-api-v2.md)** - Servicios API utilizados
- **[08-formularios.md](./08-formularios.md)** - Formularios en los flujos

---

## 📋 Introducción

Este documento describe los flujos funcionales completos de la aplicación, desde la interacción del usuario hasta la comunicación con la API v2. Para cada flujo se detallan: componentes implicados, hooks, servicios, contexto global, y archivos participantes.

---

## 🔄 Flujo 1: Crear Pedido

### Descripción

Flujo completo para crear un nuevo pedido con cliente, fechas, productos planificados y configuración comercial.

### Componentes Implicados

1. **OrdersManager** (`/src/components/Admin/OrdersManager/index.js`)
   - Renderiza lista de pedidos
   - Muestra botón "Crear pedido"
   - Gestiona estado `onCreatingNewOrder`

2. **CreateOrderForm** (`/src/components/Admin/OrdersManager/CreateOrderForm/index.js`)
   - Formulario principal de creación
   - Usa React Hook Form
   - Renderiza grupos de campos dinámicamente

### Hooks Utilizados

1. **useOrderCreateFormConfig** (`/src/hooks/useOrderCreateFormConfig.js`)
   - Carga opciones de comerciales, términos de pago, incoterms, transportes
   - Retorna `defaultValues` y `formGroups`
   - Proporciona `handleGetCustomer`

2. **useProductOptions** (`/src/hooks/useProductOptions.js`)
   - Carga opciones de productos para el array dinámico

3. **useTaxOptions** (`/src/hooks/useTaxOptions.js`)
   - Carga opciones de impuestos

4. **useFieldArray** (React Hook Form)
   - Gestiona array dinámico de `plannedProducts`

### Servicios API v2

1. **getCustomer** (`/src/services/customerService.js`)
   - Endpoint: `GET /api/v2/customers/:id`
   - Carga datos del cliente cuando se selecciona
   - Auto-rellena campos comerciales

2. **createOrder** (`/src/services/orderService.js`)
   - Endpoint: `POST /api/v2/orders`
   - Crea el pedido con payload completo

### Flujo Paso a Paso

1. **Usuario hace click en "Crear pedido"**

   ```javascript
   // OrdersManager
   setOnCreatingNewOrder(true);
   ```

2. **Se renderiza CreateOrderForm**
   - Carga configuración desde `useOrderCreateFormConfig`
   - Inicializa React Hook Form con `defaultValues`
   - Carga opciones de productos e impuestos

3. **Usuario selecciona cliente**

   ```javascript
   // CreateOrderForm - useEffect
   const customerId = watch('customer');
   if (!customerId) return;

   getCustomer(customerId, token).then((customer) => {
     setValue('salesperson', customer.salesperson?.id);
     setValue('payment', customer.paymentTerm?.id);
     setValue('incoterm', customer.incoterm?.id);
     // ... más campos
   });
   ```

4. **Usuario añade productos planificados**

   ```javascript
   // useFieldArray
   const { fields, append, remove } = useFieldArray({
     control,
     name: 'plannedProducts',
   });

   // Añadir producto
   append({ product: '', quantity: 0, boxes: 0, unitPrice: 0, tax: '' });
   ```

5. **Usuario envía formulario**

   ```javascript
   const handleCreate = async (formData) => {
     const payload = {
       customer: parseInt(formData.customer),
       entryDate: format(formData.entryDate, 'yyyy-MM-dd'),
       loadDate: format(formData.loadDate, 'yyyy-MM-dd'),
       plannedProducts: formData.plannedProducts.map((line) => ({
         product: parseInt(line.product),
         quantity: parseFloat(line.quantity),
         boxes: parseInt(line.boxes),
         unitPrice: parseFloat(line.unitPrice),
         tax: parseInt(line.tax),
       })),
     };

     const newOrder = await createOrder(payload);
     onCreate(newOrder.id); // Redirige a vista del pedido
   };
   ```

6. **Redirección**
   - Se cierra el formulario
   - Se actualiza la lista de pedidos
   - Se abre la vista del pedido creado

### Archivos Participantes

- `/src/components/Admin/OrdersManager/index.js`
- `/src/components/Admin/OrdersManager/CreateOrderForm/index.js`
- `/src/hooks/useOrderCreateFormConfig.js`
- `/src/hooks/useProductOptions.js`
- `/src/hooks/useTaxOptions.js`
- `/src/services/customerService.js`
- `/src/services/orderService.js`

---

## 🔄 Flujo 2: Editar Pedido

### Descripción

Flujo para editar un pedido existente (sin cambiar cliente).

### Componentes Implicados

1. **Order** (`/src/components/Admin/OrdersManager/Order/index.js`)
   - Vista principal del pedido
   - Renderiza tabs (details, products, pallets, etc.)

2. **OrderEditSheet** (`/src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js`)
   - Sheet lateral con formulario de edición
   - Se abre desde botón "Editar" en Order

### Hooks Utilizados

1. **useOrder** (`/src/hooks/useOrder.js`)
   - Gestiona estado del pedido
   - Proporciona `updateOrderData`

2. **useOrderFormConfig** (`/src/hooks/useOrderFormConfig.js`)
   - Configuración del formulario de edición
   - Similar a `useOrderCreateFormConfig` pero sin campo de cliente

3. **useOrderContext** (`/src/context/OrderContext.js`)
   - Contexto global del pedido
   - Proporciona `order` y `updateOrderData`

### Servicios API v2

1. **updateOrder** (`/src/services/orderService.js`)
   - Endpoint: `PUT /api/v2/orders/:id`
   - Actualiza datos del pedido

### Flujo Paso a Paso

1. **Usuario hace click en "Editar"**

   ```javascript
   // OrderEditSheet se abre en Sheet lateral
   ```

2. **Se carga configuración del formulario**

   ```javascript
   const { formGroups, defaultValues } = useOrderFormConfig({ orderData: order });
   ```

3. **Se inicializa formulario con datos del pedido**

   ```javascript
   useEffect(() => {
     reset(defaultValues); // Datos del pedido
   }, [defaultValues]);
   ```

4. **Usuario modifica campos**
   - Fechas, comerciales, direcciones, notas, etc.

5. **Usuario envía formulario**

   ```javascript
   const onSubmit = async (data) => {
     const payload = {
       ...data,
       entryDate: format(data.entryDate, 'yyyy-MM-dd'),
       loadDate: format(data.loadDate, 'yyyy-MM-dd'),
     };

     await updateOrderData(payload); // Desde OrderContext
   };
   ```

6. **Actualización**
   - Se actualiza `OrderContext`
   - Se cierra el Sheet
   - Se muestra toast de éxito

### Archivos Participantes

- `/src/components/Admin/OrdersManager/Order/index.js`
- `/src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js`
- `/src/hooks/useOrder.js`
- `/src/hooks/useOrderFormConfig.js`
- `/src/context/OrderContext.js`
- `/src/services/orderService.js`

---

## 🔄 Flujo 3: Proceso de Incidencias

### Descripción

Flujo completo para crear, resolver y eliminar incidencias en pedidos.

### Componentes Implicados

1. **OrderIncident** (`/src/components/Admin/OrdersManager/Order/OrderIncident/index.js`)
   - Panel de gestión de incidencias
   - Formularios para crear/resolver/eliminar

### Hooks Utilizados

1. **useOrderContext** (`/src/context/OrderContext.js`)
   - Proporciona `order`, `openOrderIncident`, `resolveOrderIncident`, `deleteOrderIncident`

2. **useOrder** (`/src/hooks/useOrder.js`)
   - Implementa funciones de incidencias
   - Actualiza estado del pedido

### Servicios API v2

1. **createOrderIncident** (`/src/services/orderService.js`)
   - Endpoint: `POST /api/v2/orders/:id/incident`
   - Crea incidencia y cambia estado del pedido a `incident`

2. **updateOrderIncident** (`/src/services/orderService.js`)
   - Endpoint: `PUT /api/v2/orders/:id/incident`
   - Resuelve incidencia con tipo y notas

3. **destroyOrderIncident** (`/src/services/orderService.js`)
   - Endpoint: `DELETE /api/v2/orders/:id/incident`
   - Elimina incidencia y cambia estado a `finished`

### Flujo Paso a Paso

#### Crear Incidencia

1. **Usuario escribe descripción**

   ```javascript
   const [newDescription, setNewDescription] = useState('');
   ```

2. **Usuario hace click en "Crear incidencia"**

   ```javascript
   const handleCreate = async () => {
     if (!newDescription) return toast.error('La descripción es obligatoria');

     await openOrderIncident(newDescription);
     // Cambia estado del pedido a 'incident'
   };
   ```

3. **Actualización**
   - Estado del pedido cambia a `incident`
   - Se muestra badge de incidencia abierta
   - Se guarda incidencia en backend

#### Resolver Incidencia

1. **Usuario selecciona tipo de resolución**

   ```javascript
   const [resolutionType, setResolutionType] = useState('');
   // Opciones: 'resolved', 'cancelled', etc.
   ```

2. **Usuario escribe notas (opcional)**

   ```javascript
   const [resolutionNotes, setResolutionNotes] = useState('');
   ```

3. **Usuario hace click en "Resolver"**
   ```javascript
   const handleResolve = async () => {
     await resolveOrderIncident(resolutionType, resolutionNotes);
     // Cambia estado de incidencia a 'resolved'
   };
   ```

#### Eliminar Incidencia

1. **Usuario hace click en "Cancelar Incidencia"**
   ```javascript
   const handleDelete = async () => {
     await deleteOrderIncident();
     // Elimina incidencia y cambia estado a 'finished'
   };
   ```

### Archivos Participantes

- `/src/components/Admin/OrdersManager/Order/OrderIncident/index.js`
- `/src/hooks/useOrder.js`
- `/src/context/OrderContext.js`
- `/src/services/orderService.js`

---

## 🔄 Flujo 4: Exportación de Documentos

### Descripción

Flujo para exportar documentos del pedido en diferentes formatos (PDF, Excel).

### Componentes Implicados

1. **OrderExport** (`/src/components/Admin/OrdersManager/Order/OrderExport/index.js`)
   - Panel de exportación
   - Botones de exportación rápida
   - Selector de documento y tipo

### Hooks Utilizados

1. **useOrderContext** (`/src/context/OrderContext.js`)
   - Proporciona `exportDocument`, `exportDocuments`, `fastExportDocuments`

2. **useOrder** (`/src/hooks/useOrder.js`)
   - Define lista de documentos exportables
   - Implementa función `exportDocument`

### Servicios API v2

1. **exportOrderDocument** (`/src/services/orderService.js`)
   - Endpoint: `GET /api/v2/orders/:id/export/:documentType?type=pdf`
   - Genera y descarga documento

### Tipos de Documentos

1. **PDFs**:
   - `loading-note` - Nota de carga
   - `restricted-loading-note` - Nota de carga restringida
   - `traceability-document` - Documento de trazabilidad
   - `order-cmr` - Documento de transporte (CMR)
   - `order-confirmation-document` - Confirmación de pedido
   - `order-signs` - Letreros de transporte
   - `order-sheet` - Hoja de pedido

2. **Excel/PDF**:
   - `order-packing-list` - Packing List
   - `article-report` - Reporte de artículos

### Flujo Paso a Paso

1. **Usuario selecciona documento**

   ```javascript
   const [selectedDocument, setSelectedDocument] = useState('loading-note');
   const [selectedType, setSelectedType] = useState('pdf');
   ```

2. **Usuario hace click en "Exportar"**

   ```javascript
   const handleOnClickSelectExport = () => {
     const documentLabel = exportDocuments.find((doc) => doc.name === selectedDocument)?.label;
     exportDocument(selectedDocument, selectedType, documentLabel);
   };
   ```

3. **Exportación rápida**

   ```javascript
   // Botones directos para documentos comunes
   fastExportDocuments.map((doc) => (
     <Button onClick={() => exportDocument(doc.name, doc.type, doc.label)}>{doc.label}</Button>
   ));
   ```

4. **Exportación múltiple**

   ```javascript
   const handleOnClickExportAll = async () => {
     for (const doc of fastExportDocuments) {
       await exportDocument(doc.name, doc.type, doc.label);
     }
   };
   ```

5. **Descarga**
   - Se muestra toast de carga
   - Se genera documento en backend
   - Se descarga automáticamente
   - Se muestra toast de éxito

### Archivos Participantes

- `/src/components/Admin/OrdersManager/Order/OrderExport/index.js`
- `/src/hooks/useOrder.js`
- `/src/context/OrderContext.js`
- `/src/services/orderService.js`

---

## 🔄 Flujo 5: Crear y Gestionar Pallets

### Descripción

Flujo completo para crear pallets, añadir cajas (múltiples métodos), escanear códigos GS1-128, y guardar.

### Componentes Implicados

1. **PalletDialog** (`/src/components/Admin/Pallets/PalletDialog/index.js`)
   - Diálogo principal para crear/editar pallet
   - Múltiples métodos de creación de cajas

2. **PalletView** (`/src/components/Admin/Pallets/PalletDialog/PalletView/index.js`)
   - Vista del pallet con lista de cajas
   - Formularios de creación de cajas

### Hooks Utilizados

1. **usePallet** (`/src/hooks/usePallet.js`)
   - Lógica completa de gestión de pallets
   - Múltiples métodos de creación de cajas
   - Soporte GS1-128

### Servicios API v2

1. **createPallet** (`/src/services/palletService.js`)
   - Endpoint: `POST /api/v2/pallets`
   - Crea nuevo pallet

2. **updatePallet** (`/src/services/palletService.js`)
   - Endpoint: `PUT /api/v2/pallets/:id`
   - Actualiza pallet existente

### Métodos de Creación de Cajas

#### 1. Manual

```javascript
// Campos individuales
{
  productId: "123",
  lot: "LOT-001",
  netWeight: "10.5"
}
```

#### 2. Promedio

```javascript
// Total de peso y número de cajas
{
  totalWeight: "100",
  numberOfBoxes: "10"
}
// Calcula: netWeight = totalWeight / numberOfBoxes
```

#### 3. Masiva

```javascript
// Lista de pesos (una por línea)
weights: '10.5\n11.2\n9.8';
// Crea una caja por cada peso
```

#### 4. Lector (GS1-128)

```javascript
// Escaneo de código
scannedCode: '(01)12345678901234(3100)001000(10)LOT001';
// Parsea automáticamente: GTIN, peso (kg), lote
```

#### 5. GS1 (Múltiples códigos)

```javascript
// Pegado de múltiples códigos
gs1codes: '(01)12345678901234(3100)001000(10)LOT001\n(01)12345678901234(3200)002204(10)LOT002';
// Crea una caja por cada código
// Soporta libras (3200) con conversión a kg
```

### Flujo Paso a Paso

1. **Usuario abre diálogo de pallet**

   ```javascript
   // Desde Order o Store
   <PalletDialog palletId={null} /> // Nuevo pallet
   ```

2. **Se inicializa hook**

   ```javascript
   const { temporalPallet, boxCreationData, onAddNewBox, onSavingChanges } = usePallet({
     id: null, // Nuevo pallet
     onChange: (pallet) => {
       // Callback cuando se guarda
     },
   });
   ```

3. **Usuario selecciona método de creación**
   - Manual, Promedio, Masiva, Lector, GS1

4. **Usuario añade cajas**

   ```javascript
   // Ejemplo: Método manual
   boxCreationDataChange('productId', '123');
   boxCreationDataChange('lot', 'LOT-001');
   boxCreationDataChange('netWeight', '10.5');

   onAddNewBox({ method: 'manual' });
   ```

5. **Escaneo automático (si es lector)**

   ```javascript
   // useEffect detecta cuando scannedCode >= 42 caracteres
   useEffect(() => {
     if (boxCreationData.scannedCode.length >= 42) {
       onAddNewBox({ method: 'lector' });
       setBoxCreationData(initialboxCreationData);
     }
   }, [boxCreationData.scannedCode]);
   ```

6. **Usuario guarda pallet**

   ```javascript
   onSavingChanges();
   // Si id === null: crea nuevo pallet
   // Si id existe: actualiza pallet
   ```

7. **Actualización**
   - Se guarda en API v2
   - Se llama `onChange` con pallet actualizado
   - Se cierra diálogo
   - Se actualiza lista de pallets en Order/Store

### Soporte GS1-128

**Formato**:

- `(01)GTIN(3100)peso(10)lote` - Peso en kg
- `(01)GTIN(3200)peso(10)lote` - Peso en libras

**Conversión**:

- Libras → kg: `peso * 0.453592`

**Ejemplo**:

```
(01)12345678901234(3200)002204(10)LOT001
→ GTIN: 12345678901234
→ Peso: 2.204 libras = 1.0 kg
→ Lote: LOT001
```

### Archivos Participantes

- `/src/components/Admin/Pallets/PalletDialog/index.js`
- `/src/components/Admin/Pallets/PalletDialog/PalletView/index.js`
- `/src/hooks/usePallet.js`
- `/src/services/palletService.js`

---

## 🔄 Flujo 6: Subida y Procesamiento de PDFs de Lonja

### Descripción

Flujo completo para subir PDFs de documentos de lonja, extraer datos con Azure Document AI, parsear según fuente, y exportar a Excel.

### Componentes Implicados

1. **MarketDataExtractor** (`/src/components/Admin/MarketDataExtractor/index.js`)
   - Componente principal
   - Selector de tipo de documento
   - Preview de datos extraídos

2. **PdfUpload** (`/src/components/Utilities/PdfUpload/index.js`)
   - Componente de subida de PDF
   - Validación de tipo y tamaño

3. **ExportModal** (por fuente)
   - `/src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js`
   - `/src/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/ExportModal/index.js`
   - etc.

### Servicios

1. **extractDataWithAzureDocumentAi** (`/src/services/azure/index.js`)
   - Envía PDF a Azure Document AI
   - Polling hasta obtener resultado
   - Maneja rate limits

2. **parseAzureDocumentAIResult** (`/src/helpers/azure/documentAI.js`)
   - Parsea resultado de Azure
   - Extrae texto y tablas

### Fuentes Soportadas

1. **AlbaranCofraWeb** - Albaranes de Cofradía Pescadores Santo Cristo del Mar
2. **ListadoComprasAsocPuntaDelMoral** - Listado de compras de Asociación Punta del Moral
3. **ListadoComprasLonjaDeIsla** - Listado de compras de Lonja de Isla
4. **FacturaDocapesca** - Facturas de Docapesca

### Flujo Paso a Paso

1. **Usuario selecciona tipo de documento**

   ```javascript
   const [documentType, setDocumentType] = useState('');
   // Opciones: albaranCofradiaPescadoresSantoCristoDelMar, etc.
   ```

2. **Usuario sube PDF**

   ```javascript
   <PdfUpload onChange={handleOnSetFile} maxSizeMB={10} />
   ```

3. **Usuario hace click en "Extraer datos con IA"**

   ```javascript
   const handleProcess = async () => {
     setProcessing(true);

     // Extraer con Azure Document AI
     const result = await extractDataWithAzureDocumentAi({
       file: pdfFile,
       documentType: documentType,
     });

     // Parsear según fuente
     const parsedData = parseDocument(result, documentType);

     setExtractedData(parsedData);
     setProcessing(false);
   };
   ```

4. **Azure Document AI - Proceso**

   ```javascript
   // 1. Enviar PDF a Azure
   const response = await fetchWithTenant(url, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/pdf',
       'Ocp-Apim-Subscription-Key': apiKey,
     },
     body: fileBuffer,
   });

   // 2. Obtener Operation-Location
   const operationLocation = response.headers.get('Operation-Location');

   // 3. Polling hasta obtener resultado
   do {
     await sleep(5000);
     const resultResponse = await fetchWithTenant(operationLocation, {
       headers: { 'Ocp-Apim-Subscription-Key': apiKey },
     });
     const resultData = await resultResponse.json();
     status = resultData.status;
   } while (status === 'running');
   ```

5. **Parsing específico por fuente**

   ```javascript
   // Ejemplo: AlbaranCofraWeb
   const parseAlbaranesCofraWeb = (data) => {
     const detalles = {
       lonja: data.details.lonja,
       numero: data.details.numero,
       fecha: data.details.fecha,
       // ...
     };

     const tablaSubastas = data.tables.subastas.map((row) => ({
       cajas: row.Cajas,
       kilos: row.Kilos,
       pescado: row.Pescado,
       // ...
     }));

     return { detalles, tablaSubastas, tablaServicios, subtotales };
   };
   ```

6. **Preview de datos extraídos**
   - Se muestra preview con datos parseados
   - Usuario puede revisar y corregir

7. **Exportación a Excel**

   ```javascript
   // ExportModal
   const generateExcelForA3erp = () => {
     const processedRows = [];
     // Procesar datos según formato A3ERP
     const worksheet = XLSX.utils.json_to_sheet(processedRows);
     const workbook = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(workbook, worksheet, 'ALBARANESCOMPRA');

     const excelBuffer = XLSX.write(workbook, { bookType: 'xls', type: 'array' });
     const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
     saveAs(blob, `ALBARANES_A3ERP_${fecha}.xls`);
   };
   ```

### Archivos Participantes

- `/src/components/Admin/MarketDataExtractor/index.js`
- `/src/components/Utilities/PdfUpload/index.js`
- `/src/components/Admin/MarketDataExtractor/*/ExportModal/index.js`
- `/src/services/azure/index.js`
- `/src/helpers/azure/documentAI.js`

---

## 🔄 Flujo 7: Sistema de Etiquetas

### Descripción

Flujo completo para seleccionar etiqueta, rellenar campos automáticamente desde cajas, añadir campos manuales, e imprimir.

### Componentes Implicados

1. **BoxLabelPrintDialog** (`/src/components/Admin/Labels/BoxLabelPrintDialog/index.js`)
   - Diálogo para imprimir etiquetas de cajas
   - Selector de etiqueta
   - Campos manuales

2. **LabelRender** (`/src/components/Admin/LabelEditor/LabelRender/index.js`)
   - Renderiza etiqueta con datos reales
   - Reemplaza placeholders con valores

### Hooks Utilizados

1. **useLabel** (`/src/hooks/useLabel.js`)
   - Carga opciones de etiquetas
   - Extrae campos de la estructura de etiqueta
   - Rellena campos desde cajas
   - Gestiona campos manuales

2. **usePrintElement** (`/src/hooks/usePrintElement.js`)
   - Imprime elemento HTML
   - Crea iframe oculto
   - Abre diálogo de impresión

### Servicios API v2

1. **getLabelsOptions** (`/src/services/labelService.js`)
   - Endpoint: `GET /api/v2/labels/options`
   - Carga opciones de etiquetas

2. **getLabel** (`/src/services/labelService.js`)
   - Endpoint: `GET /api/v2/labels/:id`
   - Carga estructura de etiqueta

### Flujo Paso a Paso

1. **Usuario selecciona cajas**

   ```javascript
   const boxes = [
     { id: 1, product: { name: 'Producto A' }, lot: 'LOT-001', netWeight: 10.5 },
     { id: 2, product: { name: 'Producto B' }, lot: 'LOT-002', netWeight: 12.3 },
   ];
   ```

2. **Usuario abre diálogo de etiquetas**

   ```javascript
   <BoxLabelPrintDialog boxes={boxes} open={true} />
   ```

3. **Se cargan opciones de etiquetas**

   ```javascript
   const { labelsOptions, selectLabel } = useLabel({ boxes, open: true });
   ```

4. **Usuario selecciona etiqueta**

   ```javascript
   selectLabel(labelId);
   // Se carga estructura de etiqueta
   // Se extraen campos (placeholders, fields, etc.)
   ```

5. **Extracción automática de campos**

   ```javascript
   // De elementos tipo 'field'
   // De placeholders en HTML: {{field}}
   // De contenido de QR y códigos de barras

   // Ejemplo: {{product.name}} → "Producto A"
   ```

6. **Relleno automático desde cajas**

   ```javascript
   // Usa paths como product.name, lot, netWeight
   fields = [
     { name: 'product', path: 'product.name', value: 'Producto A' },
     { name: 'lot', path: 'lot', value: 'LOT-001' },
     { name: 'weight', path: 'netWeight', value: '10.5' },
   ];
   ```

7. **Usuario añade campos manuales (opcional)**

   ```javascript
   changeManualField('operator', 'Juan Pérez');
   changeManualField('date', '2024-01-15');
   ```

8. **Usuario hace click en "Imprimir"**

   ```javascript
   const { onPrint } = usePrintElement({
     id: 'label-content',
     width: 110,
     height: 90,
   });

   onPrint();
   ```

9. **Impresión**
   - Se renderiza etiqueta con datos reales
   - Se crea iframe oculto
   - Se copia contenido y estilos
   - Se abre diálogo de impresión del navegador

### Archivos Participantes

- `/src/components/Admin/Labels/BoxLabelPrintDialog/index.js`
- `/src/components/Admin/LabelEditor/LabelRender/index.js`
- `/src/hooks/useLabel.js`
- `/src/hooks/usePrintElement.js`
- `/src/services/labelService.js`

---

## 🔄 Flujo 8: Crear Producción (En Construcción)

### Descripción

Flujo para crear una nueva producción. **Nota**: El módulo de producción está en construcción.

### Componentes Implicados

1. **EntityClient** (`/src/components/Admin/Entity/EntityClient/index.js`)
   - Usa configuración genérica de `entitiesConfig.js`
   - Formulario de creación desde `CreateEntityForm`

### Configuración

**Archivo**: `/src/configs/entitiesConfig.js`

```javascript
'productions': {
  createForm: {
    title: "Nueva Producción",
    endpoint: "v2/productions",
    method: "POST",
    fields: [
      {
        name: "lot",
        label: "Número de lote",
        type: "text",
        validation: { required: "El número de lote es obligatorio" }
      },
      {
        name: "speciesId",
        label: "Especie",
        type: "Autocomplete",
        endpoint: "species/options"
      },
      {
        name: "notes",
        label: "Notas",
        type: "textarea"
      }
    ]
  }
}
```

### Flujo Paso a Paso

1. **Usuario navega a `/admin/productions`**
   - Se renderiza `EntityClient` con configuración de producciones

2. **Usuario hace click en "Crear"**
   - Se abre `CreateEntityForm` con campos configurados

3. **Usuario completa formulario**
   - Número de lote (obligatorio)
   - Especie (opcional, autocomplete)
   - Notas (opcional)

4. **Usuario envía formulario**

   ```javascript
   // CreateEntityForm
   const onSubmit = async (data) => {
     await createEntity(`${API_URL_V2}productions`, data);
     // Redirige o actualiza lista
   };
   ```

5. **Creación en backend**
   - Endpoint: `POST /api/v2/productions`
   - Crea producción con datos proporcionados

### Estado Actual

- ✅ Creación básica de producción
- ✅ Edición básica de producción
- ✅ Gestión de registros de producción
- ✅ Gestión de inputs/outputs
- ✅ Gestión de imágenes de registros
- ⚠️ Algunas funcionalidades pueden estar incompletas

### Archivos Participantes

- `/src/components/Admin/Entity/EntityClient/index.js`
- `/src/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm/index.js`
- `/src/configs/entitiesConfig.js`
- `/src/services/entityService.js`
- `/src/services/productionService.js`

---

## 📊 Resumen de Flujos

| Flujo         | Componentes         | Hooks                                                      | Servicios                                                      | Contexto     |
| ------------- | ------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- | ------------ |
| Crear Pedido  | CreateOrderForm     | useOrderCreateFormConfig, useProductOptions, useTaxOptions | createOrder, getCustomer                                       | -            |
| Editar Pedido | OrderEditSheet      | useOrderFormConfig, useOrder                               | updateOrder                                                    | OrderContext |
| Incidencias   | OrderIncident       | useOrder                                                   | createOrderIncident, updateOrderIncident, destroyOrderIncident | OrderContext |
| Exportación   | OrderExport         | useOrder                                                   | exportOrderDocument                                            | OrderContext |
| Pallets       | PalletDialog        | usePallet                                                  | createPallet, updatePallet                                     | -            |
| PDFs Lonja    | MarketDataExtractor | -                                                          | extractDataWithAzureDocumentAi                                 | -            |
| Etiquetas     | BoxLabelPrintDialog | useLabel, usePrintElement                                  | getLabel, getLabelsOptions                                     | -            |
| Producción    | EntityClient        | -                                                          | createEntity                                                   | -            |

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Flujo de Crear Pedido sin Validación de Productos

- **Archivo**: `/src/components/Admin/OrdersManager/CreateOrderForm/index.js`
- **Problema**: No hay validación de que `plannedProducts` tenga al menos un elemento
- **Impacto**: Se puede crear pedido sin productos
- **Recomendación**: Añadir validación `minLength: 1` al array

### 2. Flujo de Exportación sin Manejo de Errores de Red

- **Archivo**: `/src/hooks/useOrder.js`
- **Problema**: Si falla la descarga, no hay manejo de errores específico
- **Impacto**: Usuario no sabe qué pasó
- **Recomendación**: Añadir manejo de errores con mensajes claros

### 3. Flujo de Pallets con IDs Temporales Débiles

- **Archivo**: `/src/hooks/usePallet.js`
- **Línea**: 43-47
- **Problema**: Usa `Date.now()` para IDs temporales, puede causar colisiones
- **Impacto**: Posibles IDs duplicados si se crean muy rápido
- **Recomendación**: Usar UUID o contador más robusto

### 4. Flujo de PDFs sin Validación de Tamaño en Azure

- **Archivo**: `/src/services/azure/index.js`
- **Problema**: No valida tamaño máximo antes de enviar a Azure
- **Impacto**: Puede fallar en Azure sin feedback claro
- **Recomendación**: Validar tamaño antes de enviar

### 5. Flujo de Etiquetas sin Validación de Campos Requeridos

- **Archivo**: `/src/hooks/useLabel.js`
- **Problema**: Solo valida campos manuales, no campos requeridos de la etiqueta
- **Impacto**: Puede imprimir etiquetas incompletas
- **Recomendación**: Validar campos requeridos antes de imprimir

### 6. Flujo de Producción Incompleto

- **Archivo**: Múltiples archivos
- **Problema**: Módulo en construcción, funcionalidades incompletas
- **Impacto**: Algunas operaciones pueden no funcionar
- **Recomendación**: Documentar claramente qué está completo y qué no

### 7. Flujo de Exportación Múltiple sin Control de Concurrencia

- **Archivo**: `/src/components/Admin/OrdersManager/Order/OrderExport/index.js`
- **Línea**: 27-31
- **Problema**: Exporta todos los documentos en secuencia sin control
- **Impacto**: Puede saturar el navegador con múltiples descargas
- **Recomendación**: Añadir delay entre exportaciones o control de concurrencia

### 8. Flujo de Incidencias sin Confirmación de Eliminación

- **Archivo**: `/src/components/Admin/OrdersManager/Order/OrderIncident/index.js`
- **Problema**: Elimina incidencia sin confirmación
- **Impacto**: Posible eliminación accidental
- **Recomendación**: Añadir diálogo de confirmación

### 9. Flujo de Pallets sin Validación de Peso Total

- **Archivo**: `/src/hooks/usePallet.js`
- **Problema**: No valida que el peso total del pallet sea razonable
- **Impacto**: Puede crear pallets con pesos incorrectos
- **Recomendación**: Añadir validación de peso máximo

### 10. Flujo de PDFs sin Manejo de Timeout

- **Archivo**: `/src/services/azure/index.js`
- **Línea**: 75
- **Problema**: Timeout de 45 intentos (~15 minutos) puede ser muy largo
- **Impacto**: Usuario espera mucho tiempo sin feedback
- **Recomendación**: Mostrar progreso o reducir timeout con mejor manejo de errores
