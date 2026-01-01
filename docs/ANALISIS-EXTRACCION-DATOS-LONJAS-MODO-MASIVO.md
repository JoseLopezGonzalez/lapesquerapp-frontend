# Análisis: Modo Masivo de Extracción de Datos de Lonjas

**Fecha:** Diciembre 2024  
**Versión:** 1.0  
**Objetivo:** Analizar cómo afecta la implementación del modo masivo a la arquitectura actual y documentar la refactorización necesaria

---

## 📋 Resumen Ejecutivo

Se requiere implementar un **modo masivo** de extracción de datos que permita:
- Cargar múltiples PDFs simultáneamente
- Seleccionar tipo de documento para cada PDF
- Extraer datos de todos los documentos
- Enlazar todos los documentos de una sola vez
- Exportar todo a un único archivo Excel
- Un único botón para enlazar todas las compras

Este documento analiza la estructura actual y propone una arquitectura que permita compartir código entre el modo individual y masivo.

---

## 🏗️ Arquitectura Actual

### Componente Principal: `MarketDataExtractor`

**Ubicación:** `src/components/Admin/MarketDataExtractor/index.js`

**Responsabilidades actuales:**
1. **Gestión de archivo único:** `file` (estado)
2. **Selección de tipo de documento:** `documentType` (estado)
3. **Procesamiento individual:** Tres funciones específicas por tipo:
   - `processAlbaranCofradiaPescadoresSantoCristoDelMar()`
   - `processListadoComprasAsocArmadoresPuntaDelMoral()`
   - `processListadoComprasLonjaDeIsla()`
4. **Renderizado condicional:** Muestra un componente de visualización según `viewDocumentType`
5. **Estado de documentos procesados:** `processedDocuments` (array con un solo documento)

**Flujo actual:**
```
Usuario selecciona PDF
  ↓
Usuario selecciona tipo de documento
  ↓
Usuario hace clic en "Extraer datos con IA"
  ↓
extractDataWithAzureDocumentAi() → Azure Document AI
  ↓
validateStructure() → Validación
  ↓
parseData() → Parsing
  ↓
setProcessedDocuments([document]) → Un solo documento
  ↓
Renderiza componente específico (AlbaranCofraWeb, etc.)
  ↓
Usuario puede exportar/enlazar desde el componente
```

### Componentes de Visualización

Cada tipo de documento tiene su propio componente:
- `AlbaranCofraWeb/` - Visualiza documentos de Cofra
- `ListadoComprasLonjaDeIsla/` - Visualiza documentos de Lonja de Isla
- `ListadoComprasAsocPuntaDelMoral/` - Visualiza documentos de Asoc

**Características comunes:**
- Reciben `document` como prop
- Incluyen un `ExportModal` con botón de exportar
- `ExportModal` maneja:
  - Generación de Excel (función específica por tipo)
  - Lógica de enlace (función específica por tipo)
  - UI de selección de links (checkboxes)

### ExportModal - Lógica Actual

**Ubicación:** Cada tipo tiene su propio `ExportModal/index.js`

**Responsabilidades:**
1. **Generación de Excel:** `generateExcelForA3erp()`
   - Genera filas para Excel con formato específico
   - Crea un único archivo Excel
   - Usa XLSX library

2. **Lógica de enlace:** `handleOnClickLinkPurchases()`
   - Filtra `linkedSummary` según selección
   - Hace llamadas API individuales: `update-declared-data`
   - Usa `Promise.allSettled()` para manejar múltiples llamadas
   - Muestra toasts de éxito/error

3. **Generación de linkedSummary:**
   - Cada tipo genera su propia estructura de `linkedSummary`
   - Campos comunes: `supplierId`, `date`, `declaredTotalNetWeight`, `declaredTotalAmount`, `barcoNombre`, `error`

---

## 🎯 Requisitos del Modo Masivo

### Funcionalidades Requeridas

1. **Carga múltiple de PDFs:**
   - Permitir seleccionar múltiples archivos PDF
   - Para cada PDF, permitir seleccionar su tipo de documento
   - Mostrar lista de PDFs cargados con su tipo asignado

2. **Procesamiento masivo:**
   - Procesar todos los PDFs uno por uno
   - Mostrar progreso del procesamiento
   - Manejar errores individuales sin detener el proceso completo

3. **Enlace masivo:**
   - Un único botón para enlazar todas las compras de todos los documentos
   - Agregar todas las `linkedSummary` de todos los documentos
   - Hacer todas las llamadas API en paralelo

4. **Exportación masiva:**
   - Un único archivo Excel con todos los documentos
   - Consolidar todas las filas de todos los documentos
   - Mantener la lógica de series y numeración (CABSERIE, CABNUMDOC)

5. **Interfaz de usuario:**
   - Toggle o selector entre "Modo Individual" y "Modo Masivo"
   - En modo masivo: Lista de documentos procesados con estado
   - Vista previa de cada documento (opcional, colapsable)
   - Botones de acción global: "Enlazar Todo", "Exportar Todo"

---

## 🔍 Análisis de Componentes Reutilizables

### ✅ Componentes que SE PUEDEN reutilizar sin cambios

1. **Validadores y Parsers:**
   - `src/validators/lonjas/*` - Ya son funciones puras
   - `src/parsers/lonjas/*` - Ya son funciones puras
   - `src/errors/lonjasErrors.js` - Clases de error

2. **Servicios Azure:**
   - `src/services/azure/index.js` - `extractDataWithAzureDocumentAi()` ya acepta un archivo

3. **Helpers:**
   - `src/helpers/azure/documentAI/index.js` - `parseAzureDocumentAIResult()`
   - Helpers de formato numérico

### ⚠️ Componentes que NECESITAN refactorización

1. **Funciones de procesamiento (`process*`):**
   - **Problema actual:** Están acopladas al estado del componente (`setLoading`, `setProcessedDocuments`, `setViewDocumentType`)
   - **Necesidad:** Convertir a funciones puras que retornen el resultado
   - **Ubicación:** `src/components/Admin/MarketDataExtractor/index.js`

2. **Generación de Excel (`generateExcelForA3erp`):**
   - **Problema actual:** Está dentro de `ExportModal`, es específica por tipo, y genera un archivo directamente
   - **Necesidad:** Extraer la lógica de generación de filas a funciones reutilizables
   - **Necesidad:** Separar "generar filas" de "crear archivo Excel"
   - **Ubicación:** Cada `ExportModal/index.js`

3. **Lógica de enlace (`handleOnClickLinkPurchases`):**
   - **Problema actual:** Está dentro de `ExportModal`, es específica por tipo
   - **Necesidad:** Extraer la lógica de preparación de datos para enlace
   - **Necesidad:** Crear función genérica de enlace que acepte array de `linkedSummary`
   - **Ubicación:** Cada `ExportModal/index.js`

4. **Generación de `linkedSummary`:**
   - **Problema actual:** Lógica específica por tipo dentro de `ExportModal`
   - **Necesidad:** Extraer a funciones puras por tipo
   - **Ubicación:** Cada `ExportModal/index.js`

### 🆕 Componentes que NECESITAN crearse

1. **Hook o utilidad para procesamiento:**
   - Función genérica que acepte `(file, documentType)` y retorne `Promise<processedDocument>`
   - Maneje validación, parsing, y errores de forma unificada

2. **Servicio de exportación masiva:**
   - Función que acepte array de documentos procesados y genere un único Excel
   - Necesita conocer el tipo de cada documento para usar la lógica correcta

3. **Servicio de enlace masivo:**
   - Función que acepte array de `linkedSummary` y haga todas las llamadas API
   - Maneje errores individuales sin detener el proceso

4. **Componente de lista de documentos:**
   - Para mostrar múltiples documentos procesados
   - Estado de cada uno (procesando, éxito, error)
   - Permitir vista previa individual

---

## 📐 Arquitectura Propuesta

### Estructura de Carpetas Propuesta

```
src/
├── components/Admin/MarketDataExtractor/
│   ├── index.js                          # Componente principal (refactorizado)
│   ├── IndividualMode/                   # 🆕 Componente para modo individual
│   │   └── index.js
│   ├── MassiveMode/                      # 🆕 Componente para modo masivo
│   │   ├── index.js
│   │   ├── DocumentList.js              # Lista de documentos con estado
│   │   ├── DocumentPreview.js           # Vista previa colapsable
│   │   └── MassiveExportModal.js        # Modal para exportar/enlazar todo
│   ├── shared/                           # 🆕 Componentes compartidos
│   │   ├── DocumentProcessor.js         # Hook/utilidad para procesar un documento
│   │   └── ProcessingStatus.js          # Componente de estado de procesamiento
│   ├── AlbaranCofraWeb/                 # Sin cambios (visualización)
│   ├── ListadoComprasLonjaDeIsla/       # Sin cambios (visualización)
│   └── ListadoComprasAsocPuntaDelMoral/ # Sin cambios (visualización)
├── services/
│   ├── azure/                           # Sin cambios
│   └── export/                          # 🆕 Nuevo servicio
│       ├── index.js                     # Funciones de exportación
│       ├── excelGenerator.js            # Generación de Excel masivo
│       └── linkService.js               # Servicio de enlace masivo
└── exportHelpers/                       # 🆕 Helpers de exportación por tipo
    ├── index.js
    ├── cofraExportHelper.js             # Lógica de exportación Cofra
    ├── lonjaDeIslaExportHelper.js       # Lógica de exportación LonjaDeIsla
    └── asocExportHelper.js              # Lógica de exportación Asoc
```

### Refactorización de Funciones de Procesamiento

**Estado actual:**
```javascript
const processAlbaranCofradiaPescadoresSantoCristoDelMar = () => {
    setLoading(true);
    setProcessedDocuments([]);
    
    extractDataWithAzureDocumentAi({ file, documentType: '...' })
        .then((azureData) => {
            validateAlbaranCofraStructure(azureData);
            const processedData = parseAlbaranCofraData(azureData);
            setProcessedDocuments(processedData);
            setViewDocumentType("...");
        })
        .catch(...)
        .finally(() => setLoading(false));
}
```

**Propuesta - Función pura:**
```javascript
// src/components/Admin/MarketDataExtractor/shared/DocumentProcessor.js

export async function processDocument(file, documentType) {
    // 1. Extraer datos de Azure
    const azureData = await extractDataWithAzureDocumentAi({ file, documentType });
    
    // 2. Validar estructura
    const validator = getValidator(documentType);
    validator(azureData);
    
    // 3. Parsear datos
    const parser = getParser(documentType);
    const processedData = parser(azureData);
    
    // 4. Retornar resultado
    return {
        success: true,
        documentType,
        data: processedData,
        file: file.name
    };
}
```

**Mapeo de tipos:**
```javascript
const DOCUMENT_PROCESSORS = {
    'albaranCofradiaPescadoresSantoCristoDelMar': {
        azureType: 'AlbaranCofradiaPescadoresSantoCristoDelMar',
        validator: validateAlbaranCofraStructure,
        parser: parseAlbaranCofraData
    },
    'listadoComprasLonjaDeIsla': {
        azureType: 'ListadoComprasLonjaDeIsla',
        validator: validateLonjaDeIslaStructure,
        parser: parseLonjaDeIslaData
    },
    'listadoComprasAsocArmadoresPuntaDelMoral': {
        azureType: 'ListadoComprasAsocArmadoresPuntaDelMoral',
        validator: validateAsocStructure,
        parser: parseAsocData
    }
};
```

### Refactorización de Lógica de Exportación

**Problema actual:** La lógica de generación de filas está mezclada con la creación del archivo Excel dentro de `ExportModal`.

**Propuesta:** Extraer la lógica de generación de filas a helpers reutilizables:

```javascript
// src/exportHelpers/cofraExportHelper.js

export function generateCofraExcelRows(document, options = {}) {
    const { CABSERIE = "CF", startSequence = 1 } = options;
    const { detalles: { numero, fecha } } = document;
    const numeroLimpio = String(numero).replace(/[^0-9]/g, '');
    let albaranSequence = startSequence;
    const processedRows = [];
    
    // ... lógica de generación de filas (igual que ahora, pero retorna rows)
    
    return {
        rows: processedRows,
        nextSequence: albaranSequence
    };
}
```

**Servicio de exportación masiva:**
```javascript
// src/services/export/excelGenerator.js

export function generateMassiveExcel(documents) {
    // Agrupar documentos por tipo
    // Para cada tipo, usar su helper correspondiente
    // Consolidar todas las filas
    // Generar un único Excel
    // Retornar blob
}
```

### Refactorización de Lógica de Enlace

**Problema actual:** Cada `ExportModal` tiene su propia función de enlace que prepara `linkedSummary` y hace las llamadas API.

**Propuesta:** Extraer la preparación de `linkedSummary` y crear servicio de enlace genérico:

```javascript
// src/exportHelpers/cofraExportHelper.js

export function generateCofraLinkedSummary(document) {
    // Lógica específica de Cofra para generar linkedSummary
    // Retorna array de objetos con: supplierId, date, declaredTotalNetWeight, declaredTotalAmount, barcoNombre, error
}
```

```javascript
// src/services/export/linkService.js

export async function linkAllPurchases(linkedSummaryArray) {
    // Filtrar solo los sin error
    // Hacer todas las llamadas API en paralelo
    // Manejar errores individuales
    // Retornar estadísticas (correctas, errores)
}
```

---

## 🔄 Flujo Propuesto para Modo Masivo

### 1. Carga de PDFs

```
Usuario selecciona múltiples PDFs
  ↓
Para cada PDF, usuario selecciona tipo de documento
  ↓
Estado: Array de { file, documentType, status: 'pending' }
```

### 2. Procesamiento

```
Usuario hace clic en "Procesar Todos"
  ↓
Para cada PDF en estado 'pending':
  - Cambiar status a 'processing'
  - Llamar processDocument(file, documentType)
  - Si éxito: status = 'success', guardar processedData
  - Si error: status = 'error', guardar errorMessage
  ↓
Estado: Array de { file, documentType, status, processedData?, error? }
```

### 3. Vista de Resultados

```
Mostrar lista de documentos procesados:
  - ✅ Éxito: Mostrar preview (colapsable)
  - ❌ Error: Mostrar mensaje de error
  - ⏳ Procesando: Mostrar spinner
```

### 4. Enlace Masivo

```
Usuario hace clic en "Enlazar Todo"
  ↓
Para cada documento con status = 'success':
  - Obtener linkedSummary usando helper específico del tipo
  - Agregar a array global de linkedSummary
  ↓
Llamar linkAllPurchases(globalLinkedSummary)
  ↓
Mostrar estadísticas (X correctas, Y errores)
```

### 5. Exportación Masiva

```
Usuario hace clic en "Exportar Todo"
  ↓
Para cada documento con status = 'success':
  - Obtener filas Excel usando helper específico del tipo
  - Agregar a array global de filas (con secuencia continua)
  ↓
Generar un único Excel con todas las filas
  ↓
Descargar archivo
```

---

## 📝 Plan de Implementación

### Fase 1: Refactorización de Funciones de Procesamiento

**Objetivo:** Extraer lógica de procesamiento a funciones reutilizables

1. Crear `src/components/Admin/MarketDataExtractor/shared/DocumentProcessor.js`
   - Función `processDocument(file, documentType)` que retorna Promise
   - Mapeo de tipos de documento a validadores/parsers
   - Manejo de errores unificado

2. Actualizar `MarketDataExtractor/index.js`
   - Usar `processDocument()` en las funciones `process*`
   - Mantener compatibilidad con modo individual actual

**Resultado:** Las funciones de procesamiento serán reutilizables tanto para modo individual como masivo.

---

### Fase 2: Refactorización de Lógica de Exportación

**Objetivo:** Extraer lógica de generación de Excel a helpers reutilizables

1. Crear `src/exportHelpers/`
   - `cofraExportHelper.js`: `generateCofraExcelRows()`, `generateCofraLinkedSummary()`
   - `lonjaDeIslaExportHelper.js`: `generateLonjaDeIslaExcelRows()`, `generateLonjaDeIslaLinkedSummary()`
   - `asocExportHelper.js`: `generateAsocExcelRows()`, `generateAsocLinkedSummary()`
   - `index.js`: Exportar todas las funciones

2. Actualizar `ExportModal` de cada tipo
   - Usar helpers en lugar de lógica inline
   - Mantener UI y funcionalidad actual

3. Crear `src/services/export/excelGenerator.js`
   - Función `generateMassiveExcel(documents)`
   - Consolidar filas de todos los documentos
   - Manejar secuencias continuas de CABNUMDOC

**Resultado:** La lógica de exportación será reutilizable para exportación masiva.

---

### Fase 3: Servicio de Enlace Masivo

**Objetivo:** Crear servicio genérico para enlace masivo

1. Crear `src/services/export/linkService.js`
   - Función `linkAllPurchases(linkedSummaryArray)`
   - Manejar múltiples llamadas API en paralelo
   - Retornar estadísticas de éxito/error

**Resultado:** Servicio reutilizable para enlace masivo.

---

### Fase 4: Componente de Modo Individual Refactorizado

**Objetivo:** Separar modo individual en componente propio

1. Crear `src/components/Admin/MarketDataExtractor/IndividualMode/index.js`
   - Mover lógica actual de `MarketDataExtractor` aquí
   - Usar `DocumentProcessor` para procesamiento
   - Mantener UI actual

2. Actualizar `MarketDataExtractor/index.js`
   - Agregar selector de modo (Individual/Masivo)
   - Renderizar `IndividualMode` o `MassiveMode` según selección

**Resultado:** Modo individual separado y más mantenible.

---

### Fase 5: Componente de Modo Masivo

**Objetivo:** Implementar funcionalidad completa de modo masivo

1. Crear `src/components/Admin/MarketDataExtractor/MassiveMode/index.js`
   - Estado: Array de documentos con estado
   - UI: Lista de PDFs con selector de tipo
   - Botón "Procesar Todos"
   - Usar `DocumentProcessor` para cada documento

2. Crear `src/components/Admin/MarketDataExtractor/MassiveMode/DocumentList.js`
   - Mostrar lista de documentos procesados
   - Estado de cada uno (success/error/processing)
   - Preview colapsable para cada documento

3. Crear `src/components/Admin/MarketDataExtractor/MassiveMode/MassiveExportModal.js`
   - Botón "Enlazar Todo": Usar `linkAllPurchases()`
   - Botón "Exportar Todo": Usar `generateMassiveExcel()`
   - Mostrar estadísticas de enlace

**Resultado:** Modo masivo completamente funcional.

---

## ⚠️ Consideraciones Importantes

### 1. Compatibilidad hacia atrás

- El modo individual actual DEBE seguir funcionando exactamente igual
- No romper la experiencia de usuario existente
- Los cambios internos deben ser transparentes

### 2. Manejo de errores

- En modo masivo, un error en un documento NO debe detener el procesamiento de los demás
- Mostrar claramente qué documentos fallaron y por qué
- Permitir reintentar documentos fallidos individualmente

### 3. Performance

- Procesar múltiples documentos puede ser lento
- Considerar procesamiento en paralelo (con límite de concurrencia)
- Mostrar progreso claro al usuario

### 4. Secuencias de numeración

- En exportación masiva, las secuencias de CABNUMDOC deben ser continuas
- El último número de un documento debe ser el inicio del siguiente
- Considerar si cada documento mantiene su propia secuencia o si es global

### 5. Validación de tipos

- El usuario debe poder cambiar el tipo de documento antes de procesar
- Validar que todos los documentos tengan tipo asignado antes de procesar

---

## 📊 Estructura de Datos Propuesta

### Estado de un Documento en Modo Masivo

```typescript
interface MassiveDocument {
    id: string;                    // ID único (UUID o índice)
    file: File;                    // Archivo PDF
    documentType: string | null;   // Tipo seleccionado (o null)
    status: 'pending' | 'processing' | 'success' | 'error';
    processedData?: any[];         // Datos procesados (si success)
    error?: string;                // Mensaje de error (si error)
    linkedSummary?: any[];         // Linked summary generado (para enlace)
}
```

### Estado del Modo Masivo

```typescript
interface MassiveModeState {
    documents: MassiveDocument[];
    isProcessing: boolean;
    processedCount: number;
    successCount: number;
    errorCount: number;
}
```

---

## 🎨 UI/UX Propuesta

### Selector de Modo

```
[Modo Individual] [Modo Masivo]  ← Tabs o Toggle
```

### Vista de Modo Masivo

```
┌─────────────────────────────────────────┐
│ Extracción datos lonjas - Modo Masivo   │
├─────────────────────────────────────────┤
│                                         │
│ [📎 Seleccionar PDFs]  (múltiple)      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📄 documento1.pdf                    │ │
│ │ Tipo: [Select: Cofra ▼]             │ │
│ │ [❌ Eliminar]                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📄 documento2.pdf                    │ │
│ │ Tipo: [Select: LonjaDeIsla ▼]       │ │
│ │ [❌ Eliminar]                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [✨ Procesar Todos]                    │
│                                         │
│ ───────────────────────────────────────│
│                                         │
│ 📊 Progreso: 2/5 procesados            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ documento1.pdf (Cofra)            │ │
│ │    [👁️ Ver detalles]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⏳ documento2.pdf (LonjaDeIsla)      │ │
│ │    Procesando...                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ❌ documento3.pdf (Asoc)             │ │
│ │    Error: Campo requerido faltante   │ │
│ │    [🔄 Reintentar]                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [🔗 Enlazar Todo] [📥 Exportar Todo]   │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

### Fase 1: Refactorización Base
- [ ] Crear `DocumentProcessor.js` con función `processDocument()`
- [ ] Crear mapeo de tipos de documento
- [ ] Actualizar funciones `process*` para usar `DocumentProcessor`
- [ ] Tests de `processDocument()`

### Fase 2: Exportación
- [ ] Crear `exportHelpers/cofraExportHelper.js`
- [ ] Crear `exportHelpers/lonjaDeIslaExportHelper.js`
- [ ] Crear `exportHelpers/asocExportHelper.js`
- [ ] Actualizar `ExportModal` de cada tipo para usar helpers
- [ ] Crear `services/export/excelGenerator.js`
- [ ] Tests de helpers de exportación

### Fase 3: Enlace
- [ ] Extraer `generateLinkedSummary()` a helpers
- [ ] Crear `services/export/linkService.js`
- [ ] Tests de servicio de enlace

### Fase 4: Modo Individual
- [ ] Crear `IndividualMode/index.js`
- [ ] Mover lógica actual a `IndividualMode`
- [ ] Actualizar `MarketDataExtractor` con selector de modo
- [ ] Verificar que modo individual funciona igual

### Fase 5: Modo Masivo
- [ ] Crear `MassiveMode/index.js`
- [ ] Crear `MassiveMode/DocumentList.js`
- [ ] Crear `MassiveMode/MassiveExportModal.js`
- [ ] Implementar carga múltiple de PDFs
- [ ] Implementar procesamiento masivo
- [ ] Implementar enlace masivo
- [ ] Implementar exportación masiva
- [ ] Tests de modo masivo

---

## 🔮 Mejoras Futuras (Post-Implementación)

1. **Procesamiento en paralelo con límite:**
   - Procesar múltiples documentos simultáneamente (ej: máximo 3 a la vez)
   - Mejorar tiempo de procesamiento

2. **Guardar estado en localStorage:**
   - Permitir al usuario guardar y continuar más tarde
   - Útil para procesar grandes volúmenes

3. **Filtros y búsqueda:**
   - Filtrar documentos por tipo
   - Buscar documentos por nombre
   - Ordenar por fecha/estado

4. **Estadísticas y reportes:**
   - Dashboard con estadísticas de procesamiento
   - Exportar reporte de errores

5. **Validación previa:**
   - Pre-validar archivos antes de procesar
   - Detectar posibles problemas temprano

---

## 📚 Referencias

- Documentación de validación y parsing: `docs/ANALISIS-EXTRACCION-DATOS-LONJAS.md`
- Estructura actual de componentes: `src/components/Admin/MarketDataExtractor/`
- Servicios Azure: `src/services/azure/`

---

**Nota:** Este documento es un análisis y plan de implementación. No se debe comenzar la implementación hasta que este documento sea revisado y aprobado.

