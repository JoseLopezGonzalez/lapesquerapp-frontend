# Exportaciones e Integraciones

## 📚 Documentación Relacionada

- **[04-components-admin.md](./04-components-admin.md)** - Componentes que implementan exportaciones
- **[12-utilidades-helpers.md](./12-utilidades-helpers.md)** - Helpers utilizados en exportaciones

---

## 📋 Introducción

La aplicación implementa múltiples sistemas de exportación e integración con sistemas externos. Las exportaciones incluyen documentos PDF, archivos Excel, y formatos específicos para sistemas ERP como A3ERP y Facilcom.

**Tecnologías utilizadas**:

- **XLSX** (v0.18.5) - Generación de archivos Excel
- **file-saver** (v2.0.5) - Descarga de archivos
- **jsPDF** (v3.0.0) - Generación de PDFs (backend)
- **html2canvas** (v1.4.1) - Captura de elementos HTML para PDF
- **Azure Document AI** - Extracción de datos de PDFs

---

## 📄 Exportación de Documentos de Pedidos

### Funcionalidad

**Archivo**: `/src/hooks/useOrder.js`

**Función**: `exportDocument`

```javascript
const exportDocument = async (documentName, type, documentLabel) => {
  const toastId = toast.loading(`Exportando ${documentLabel}.${type}`, getToastTheme());
  try {
    const response = await fetchWithTenant(
      `${API_URL_V2}orders/${order.id}/${type}/${documentName}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          'User-Agent': navigator.userAgent,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al exportar');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentLabel}_${order.id}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Exportación exitosa', { id: toastId });
  } catch (error) {
    toast.error('Error al exportar', { id: toastId });
  }
};
```

**Endpoint API v2**: `GET /api/v2/orders/:id/:type/:documentName`

**Tipos soportados**: `pdf`, `xls`, `xlsx`

### Documentos Disponibles

**Archivo**: `/src/hooks/useOrder.js` (líneas 336-447)

#### PDFs

1. **`loading-note`** - Nota de Carga
   - Campos: Datos básicos, Direcciones, Observaciones, Fechas, Lotes

2. **`restricted-loading-note`** - Nota de Carga (Restringida)
   - Campos: Datos básicos (sin nombre de cliente), Direcciones, Observaciones, Fechas, Lotes

3. **`traceability-document`** - Documento de Trazabilidad
   - Campos: Datos básicos, Direcciones, Observaciones, Fechas, Lotes, Historial

4. **`order-cmr`** - Documento de Transporte (CMR)
   - Campos: Datos básicos, Direcciones, Observaciones, Fechas, Lotes, Transportes

5. **`order-confirmation-document`** - Confirmación de Pedido
   - Campos: Datos básicos, Direcciones, Observaciones, Fechas, Precios

6. **`order-signs`** - Letreros de Transporte
   - Campos: Datos básicos, Direcciones, Observaciones, Fechas, Lotes, Transportes

7. **`order-sheet`** - Hoja de Pedido
   - Campos: Datos básicos, Direcciones, Observaciones, Fechas, Lotes, Productos

#### Excel/PDF

8. **`order-packing-list`** - Packing List
   - Tipos: `pdf`, `xls`
   - Campos: Datos básicos, Direcciones, Observaciones, Palets, Lotes, Productos

9. **`article-report`** - Reporte de Artículos
   - Tipos: `pdf`, `xls`
   - Campos: Datos básicos, Productos, Lotes, Palets

### Componente de Exportación

**Archivo**: `/src/components/Admin/OrdersManager/Order/OrderExport/index.js`

**Funcionalidades**:

- Exportación rápida (botones directos)
- Exportación múltiple (todos los documentos)
- Selector de documento y tipo
- Vista previa de campos incluidos

**Uso**:

```jsx
import { useOrderContext } from '@/context/OrderContext';

const { exportDocument, exportDocuments, fastExportDocuments } = useOrderContext();

// Exportación rápida
<Button onClick={() => exportDocument('loading-note', 'pdf', 'Nota de Carga')}>
  Nota de Carga
</Button>;

// Exportación múltiple
const handleExportAll = async () => {
  for (const doc of fastExportDocuments) {
    await exportDocument(doc.name, doc.type, doc.label);
  }
};
```

---

## 📊 Exportación Genérica de Entidades

### Funcionalidad

**Archivo**: `/src/components/Admin/Entity/EntityClient/index.js`

**Función**: `handleExport`

```javascript
const handleExport = async (exportOption) => {
  const { endpoint, fileName, type, waitingMessage } = exportOption;
  const hasSelectedRows = selectedRows?.length > 0;
  const queryString = hasSelectedRows
    ? `ids[]=${selectedRows.join('&ids[]=')}`
    : formatFilters(filters);
  const url = `${API_URL_V2}${endpoint}?${queryString}`;

  const toastId = toast.loading(waitingMessage || 'Generando exportación...', getToastTheme());

  try {
    await downloadFile(url, fileName, type);
    toast.success('Exportación generada correctamente', { id: toastId });
  } catch (error) {
    toast.error(errorMessage, { id: toastId });
  }
};
```

**Configuración en `entitiesConfig.js`**:

```javascript
exports: [
  {
    title: 'Exportar a Excel',
    endpoint: 'orders/excel',
    type: 'xlsx',
    waitingMessage: 'Generando exportación...',
    fileName: 'Pedidos',
  },
  {
    title: 'Exportar a PDF',
    endpoint: 'orders/pdf',
    type: 'pdf',
    waitingMessage: 'Generando PDF...',
    fileName: 'Pedidos',
  },
];
```

### Utilidad downloadFile

**Archivo**: `/src/services/entityService.js`

**Función**: `downloadFile`

```javascript
export const downloadFile = async (url, fileName, type) => {
  const headers = await getAuthHeaders();
  const now = new Date();
  const formattedDate = now.toLocaleDateString().replace(/\//g, '-');
  const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const currentDateTime = `${formattedDate}__${formattedTime}`;

  const response = await fetchWithTenant(url, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    // Manejo de errores detallado
    throw new Error(`Error HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${fileName}__${currentDateTime}.${type === 'excel' ? 'xls' : type === 'xlsx' ? 'xlsx' : 'pdf'}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};
```

**Características**:

- Añade timestamp al nombre del archivo
- Manejo de errores detallado
- Soporta PDF, XLS, XLSX
- Limpia URLs de objeto después de descarga

---

## 📦 Exportación a Excel (XLSX)

### Librería

**Paquete**: `xlsx` (v0.18.5)

**Uso básico**:

```javascript
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Crear datos
const data = [
  { Nombre: 'Producto 1', Cantidad: 10, Precio: 100 },
  { Nombre: 'Producto 2', Cantidad: 20, Precio: 200 },
];

// Crear worksheet
const worksheet = XLSX.utils.json_to_sheet(data);

// Crear workbook
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoja1');

// Generar archivo
const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
const blob = new Blob([excelBuffer], {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
saveAs(blob, 'archivo.xlsx');
```

### Ejemplos de Uso

#### 1. Exportación de Productos de Almacén

**Archivo**: `/src/components/Admin/Stores/StoresManager/Store/ProductSummaryDialog/ProductSummary/index.js`

```javascript
const generateExcel = () => {
  const allProducts = species.reduce((acc, species) => {
    const speciesProducts = species.products.map((product) => ({
      Producto: product.name,
      Especie: species.name,
      Cantidad: Number(product.quantity.toFixed(2)),
      Porcentaje: Number(product.productPercentage.toFixed(2)),
      Cajas: product.boxes,
    }));
    return acc.concat(speciesProducts);
  }, []);

  const worksheet = XLSX.utils.json_to_sheet(allProducts);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PRODUCTOS');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
  saveAs(blob, `Productos_${formattedStoreName}_${formattedDate}.xlsx`);
};
```

---

## 🔗 Integración con A3ERP

### Formato de Datos

**Estructura estándar**:

```javascript
{
  CABNUMDOC: number,      // Número de albarán
  CABFECHA: string,       // Fecha (YYYY-MM-DD)
  CABCODPRO: string,       // Código de proveedor en A3ERP
  CABREFERENCIA: string,   // Referencia del documento
  LINCODART: number,       // Código de artículo en A3ERP
  LINDESCLIN: string,      // Descripción de línea
  LINUNIDADES: number,     // Cantidad
  LINPRCMONEDA: number,    // Precio
  LINTIPIVA: string,       // Tipo de IVA (ej: 'RED10', 'ORD21')
}
```

### Ejemplo de Implementación

**Archivo**: `/src/components/Admin/MarketDataExtractor/FacturaDocapesca/ExportModal/index.js`

```javascript
const generateExcelForA3erp = () => {
  const processedRows = [];
  let albaranNumber = Number(initialAlbaranNumber);

  // Procesar ventas directas
  ventasDirectas.forEach((barco) => {
    barco.lineas.forEach((linea) => {
      processedRows.push({
        CABNUMDOC: albaranNumber,
        CABFECHA: fecha,
        CABCODPRO: barco.armador.codA3erp,
        CABREFERENCIA: `${fecha} - ${barco.nombre}`,
        LINCODART: productos.find((p) => p.nombre == linea.especie)?.codA3erp,
        LINDESCLIN: linea.especie,
        LINUNIDADES: Number(linea.kilos),
        LINPRCMONEDA: Number(linea.precio),
        LINTIPIVA: 'RED10',
      });
    });
    albaranNumber++;
  });

  // Procesar servicios
  servicios.forEach((line) => {
    processedRows.push({
      CABNUMDOC: albaranNumber,
      CABFECHA: fecha,
      CABCODPRO: lonjaDeIsla.codA3erp,
      CABREFERENCIA: `${fecha} - SERVICIOS`,
      LINCODART: 9999,
      LINDESCLIN: line.descripcion,
      LINUNIDADES: line.unidades,
      LINPRCMONEDA: line.precio,
      LINTIPIVA: 'RED10',
    });
  });

  // Crear Excel
  const worksheet = XLSX.utils.json_to_sheet(processedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ALBARANESCOMPRA');

  // Guardar
  const excelBuffer = XLSX.write(workbook, { bookType: 'xls', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
  saveAs(blob, `ALBARANES_A3ERP_LONJA_ISLA_${fecha}.xls`);
};
```

### Tipos de IVA

- **`RED10`** - IVA reducido 10%
- **`ORD21`** - IVA ordinario 21%

### Códigos Especiales

- **`9998`** - Servicios generales
- **`9999`** - Gastos de Lonja y OP

### Fuentes Soportadas

1. **AlbaranCofradiaPescadoresSantoCristoDelMar**
   - Archivo: `/src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js`

2. **ListadoComprasLonjaDeIsla**
   - Archivo: `/src/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/ExportModal/index.js`

3. **FacturaDocapesca**
   - Archivo: `/src/components/Admin/MarketDataExtractor/FacturaDocapesca/ExportModal/index.js`

4. **ListadoComprasAsocPuntaDelMoral**
   - Archivo: `/src/components/Admin/MarketDataExtractor/ListadoComprasAsocPuntaDelMoral/ExportModal/index.js`

---

## 🔗 Integración con Facilcom

### Estado Actual

**Problema**: La integración con Facilcom está **comentada** o **no implementada** en la mayoría de los componentes.

**Ejemplo**:

```javascript
const handleOnClickExport = () => {
  if (software === 'A3ERP') {
    generateExcelForA3erp();
  } else if (software === 'Facilcom') {
    // generateExcelForFacilcom(); // Comentado
  } else {
    // generateExcelForOtros(); // Comentado
  }
};
```

### Configuración en entitiesConfig

**Archivo**: `/src/configs/entitiesConfig.js`

```javascript
exports: [
  {
    title: 'Exportar a Facilcom',
    endpoint: 'cebo-dispatches/facilcom-xlsx',
    type: 'xlsx',
    waitingMessage: 'Generando exportación a Facilcom',
    fileName: 'Salidas_cebo_Facilcom',
  },
  {
    title: 'Exportar a A3ERP',
    endpoint: 'cebo-dispatches/a3erp-xlsx',
    type: 'excel',
    waitingMessage: 'Generando exportación a A3ERP',
    fileName: 'Salidas_cebo_A3ERP',
  },
];
```

**Nota**: La exportación a Facilcom se realiza desde el backend, no desde el frontend.

---

## 📤 Envío de Documentos por Email

### Funcionalidad

**Archivo**: `/src/hooks/useOrder.js`

#### Envío de Documentos Personalizados

```javascript
const sendCustomDocuments = async (json) => {
  const token = session?.user?.accessToken;

  return fetchWithTenant(`${API_URL_V2}orders/${order.id}/send-custom-documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': navigator.userAgent,
    },
    body: JSON.stringify(json),
  });
};
```

**Estructura JSON**:

```javascript
{
  documents: [
    {
      type: 'loading-note',
      recipients: ['email1@example.com', 'email2@example.com'],
    },
    {
      type: 'order-cmr',
      recipients: ['email3@example.com'],
    },
  ];
}
```

#### Envío de Documentos Estándar

```javascript
const sendStandarDocuments = async () => {
  const token = session?.user?.accessToken;

  return fetchWithTenant(`${API_URL_V2}orders/${order.id}/send-standard-documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': navigator.userAgent,
    },
  });
};
```

**Endpoint API v2**:

- `POST /api/v2/orders/:id/send-custom-documents`
- `POST /api/v2/orders/:id/send-standard-documents`

### Componente de Envío

**Archivo**: `/src/components/Admin/OrdersManager/Order/OrderDocuments/index.js`

**Funcionalidades**:

- Selección de documentos por destinatario
- Envío personalizado
- Envío estándar
- Vista previa de selección

---

## 🤖 Integración con Azure Document AI

### Funcionalidad

**Archivo**: `/src/services/azure/index.js`

**Función**: `extractDataWithAzureDocumentAi`

### Flujo Completo

1. **Subida de PDF**

   ```javascript
   const fileBuffer = await file.arrayBuffer();
   ```

2. **Llamada inicial a Azure**

   ```javascript
   const url = `${endpoint}formrecognizer/documentModels/${modelId}:analyze?api-version=${apiVersion}`;

   const response = await fetchWithTenant(url, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/pdf',
       'Ocp-Apim-Subscription-Key': apiKey,
     },
     body: fileBuffer,
   });
   ```

3. **Obtener URL de resultado**

   ```javascript
   const operationLocation = response.headers.get('Operation-Location');
   ```

4. **Polling hasta obtener resultado**

   ```javascript
   let attempts = 0;
   const maxAttempts = 45; // ~15 minutos
   const defaultPollingDelay = 5000; // 5 segundos
   const rateLimitDelay = 17000; // 17 segundos para rate limit

   do {
     await sleep(defaultPollingDelay);
     const resultResponse = await fetchWithTenant(operationLocation, {
       headers: { 'Ocp-Apim-Subscription-Key': apiKey },
     });

     const resultData = await resultResponse.json();
     status = resultData.status;

     if (status === 'succeeded') {
       analysisResult = resultData.analyzeResult;
     }
   } while (status === 'running' || status === 'notStarted');
   ```

5. **Parsear resultado**
   ```javascript
   return parseAzureDocumentAIResult(analysisResult);
   ```

### Tipos de Documentos Soportados

**Archivo**: `/src/services/azure/index.js`

```javascript
const documentTypes = [
  {
    name: 'ListadoComprasAsocArmadoresPuntaDelMoral',
    modelId:
      process.env
        .NEXT_PUBLIC_AZURE_DOCUMENT_AI_LISTADO_COMPRAS_ASOC_ARMADORES_PUNTA_DEL_MORAL_MODEL_ID,
    apiVersion: '2023-07-31',
  },
  {
    name: 'AlbaranCofradiaPescadoresSantoCristoDelMar',
    modelId:
      process.env
        .NEXT_PUBLIC_AZURE_DOCUMENT_AI_ALBARAN_COFRADIA_PESCADORES_SANTO_CRISTO_DEL_MAR_MODEL_ID,
    apiVersion: '2023-07-31',
  },
  {
    name: 'ListadoComprasLonjaDeIsla',
    modelId: process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_LISTADO_COMPRAS_LONJA_DE_ISLA_MODEL_ID,
    apiVersion: '2023-07-31',
  },
  {
    name: 'FacturaDocapesca',
    modelId: process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_FACTURA_DOCAPESCA_ID,
    apiVersion: '2023-07-31',
  },
];
```

### Variables de Entorno Requeridas

- `NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT`
- `NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY`
- `NEXT_PUBLIC_AZURE_DOCUMENT_AI_*_MODEL_ID` (por cada tipo de documento)

### Manejo de Rate Limits

```javascript
try {
  resultResponse = await fetchWithTenant(operationLocation, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
  });
} catch (error) {
  const isRateLimitError = /429|Too Many Requests|rate limit/i.test(error.message);

  if (isRateLimitError) {
    console.warn("⚠️ Azure rate limit alcanzado. Reintentando en 17 segundos.");
    await sleep(rateLimitDelay);
    continue;
  }

  throw error;
}
```

---

## 📋 Resumen de Endpoints API v2

### Exportaciones

- `GET /api/v2/orders/:id/pdf/:documentName` - Exportar documento PDF de pedido
- `GET /api/v2/orders/:id/xls/:documentName` - Exportar documento Excel de pedido
- `GET /api/v2/orders/:id/xlsx/:documentName` - Exportar documento XLSX de pedido
- `GET /api/v2/:entity/excel` - Exportar entidad a Excel (genérico)
- `GET /api/v2/:entity/pdf` - Exportar entidad a PDF (genérico)
- `GET /api/v2/cebo-dispatches/a3erp-xlsx` - Exportar salidas de cebo a A3ERP
- `GET /api/v2/cebo-dispatches/facilcom-xlsx` - Exportar salidas de cebo a Facilcom

### Envío de Documentos

- `POST /api/v2/orders/:id/send-custom-documents` - Enviar documentos personalizados
- `POST /api/v2/orders/:id/send-standard-documents` - Enviar documentos estándar

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Integración Facilcom No Implementada

- **Archivo**: Múltiples archivos de ExportModal
- **Problema**: Funciones `generateExcelForFacilcom()` comentadas o no implementadas
- **Impacto**: Usuarios no pueden exportar a Facilcom desde frontend
- **Recomendación**: Implementar formato de exportación para Facilcom o documentar que se hace desde backend

### 2. Código Duplicado en Exportaciones A3ERP

- **Archivo**: Múltiples archivos de ExportModal
- **Problema**: Misma lógica de generación de Excel para A3ERP duplicada en varios componentes
- **Impacto**: Mantenimiento difícil, posibles inconsistencias
- **Recomendación**: Extraer a función helper común en `/src/helpers/exports/generateA3ERPExcel.js`

### 3. Manejo de Errores Incompleto en exportDocument

- **Archivo**: `/src/hooks/useOrder.js`
- **Línea**: 236-267
- **Problema**: Error genérico "Error al exportar" sin detalles
- **Impacto**: Difícil debuggear problemas de exportación
- **Recomendación**: Añadir logging y mensajes de error más específicos

### 4. Falta de Validación de Datos en A3ERP Export

- **Archivo**: Múltiples archivos de ExportModal
- **Problema**: No valida que `codA3erp` exista antes de exportar
- **Impacto**: Puede generar archivos con datos inválidos
- **Recomendación**: Validar datos antes de generar Excel

### 5. Polling de Azure Sin Cancelación

- **Archivo**: `/src/services/azure/index.js`
- **Línea**: 79-119
- **Problema**: No hay forma de cancelar polling si usuario cierra componente
- **Impacto**: Llamadas innecesarias a Azure
- **Recomendación**: Implementar AbortController para cancelar polling

### 6. Rate Limit de Azure Hardcodeado

- **Archivo**: `/src/services/azure/index.js`
- **Línea**: 77
- **Problema**: `rateLimitDelay = 17000` está hardcodeado
- **Impacto**: No se puede ajustar sin cambiar código
- **Recomendación**: Mover a variable de entorno o configuración

### 7. Falta de Progress Indicator en Polling

- **Archivo**: `/src/services/azure/index.js`
- **Problema**: No hay indicador de progreso durante polling
- **Impacto**: Usuario no sabe cuánto tiempo falta
- **Recomendación**: Añadir callback de progreso o estimación de tiempo

### 8. downloadFile Sin Validación de Tipo

- **Archivo**: `/src/services/entityService.js`
- **Línea**: 112
- **Problema**: No valida que `type` sea válido antes de generar nombre
- **Impacto**: Puede generar nombres de archivo incorrectos
- **Recomendación**: Validar tipo y usar extensión correcta

### 9. Timestamp en Nombre de Archivo Inconsistente

- **Archivo**: `/src/services/entityService.js`
- **Línea**: 59-64
- **Problema**: Formato de fecha puede variar según locale
- **Impacto**: Nombres de archivo inconsistentes
- **Recomendación**: Usar formato ISO o formato fijo

### 10. Falta de Compresión en Archivos Excel Grandes

- **Archivo**: Múltiples archivos de ExportModal
- **Problema**: No comprime archivos Excel grandes
- **Impacto**: Archivos muy grandes pueden causar problemas
- **Recomendación**: Considerar compresión o streaming para archivos grandes

### 11. Envío de Documentos Sin Validación de Emails

- **Archivo**: `/src/components/Admin/OrdersManager/Order/OrderDocuments/index.js`
- **Problema**: No valida formato de emails antes de enviar
- **Impacto**: Puede enviar a emails inválidos
- **Recomendación**: Validar formato de emails antes de enviar

### 12. Falta de Confirmación en Exportación Múltiple

- **Archivo**: `/src/components/Admin/OrdersManager/Order/OrderExport/index.js`
- **Línea**: 27-31
- **Problema**: No pide confirmación antes de exportar todos
- **Impacto**: Puede generar muchos archivos sin querer
- **Recomendación**: Añadir diálogo de confirmación

### 13. Azure Document AI Sin Retry en Errores de Red

- **Archivo**: `/src/services/azure/index.js`
- **Problema**: Solo maneja rate limit, no otros errores de red
- **Impacto**: Puede fallar en errores temporales de red
- **Recomendación**: Implementar retry con backoff exponencial

### 14. Falta de Cache en Resultados de Azure

- **Archivo**: `/src/services/azure/index.js`
- **Problema**: No cachea resultados de análisis
- **Impacto**: Re-analiza mismo PDF si se vuelve a subir
- **Recomendación**: Implementar cache basado en hash del archivo

### 15. Exportación Sin Indicador de Progreso

- **Archivo**: Múltiples componentes
- **Problema**: Solo muestra toast, no progreso real
- **Impacto**: Usuario no sabe cuánto falta para archivos grandes
- **Recomendación**: Añadir indicador de progreso para exportaciones grandes
