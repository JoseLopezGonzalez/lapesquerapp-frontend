# Migración del sistema de extracción de documentos de lonja: Azure → proveedores múltiples

> Última actualización: 2026-05-07
> Estado: En planificación
> Responsable: Jose

---

## 1. Estado actual del sistema de extracción con Azure

### Pipeline actual

```
PDF subido por el usuario
  ↓
extractDataWithAzureDocumentAi()        ← src/services/azure/index.js
  (sube a Azure, polling hasta resultado)
  ↓
parseAzureDocumentAIResult()            ← src/helpers/azure/documentAI/index.js
  (transforma la estructura anidada de Azure)
  ↓
DocumentProcessor.processDocument()     ← src/components/Admin/MarketDataExtractor/shared/DocumentProcessor.js
  ├─ normalizador multi-página (si aplica)
  ├─ validador de estructura (BaseValidator)
  └─ parser de datos (BaseParser)
  ↓
Resultado tipado { details/detalles, tables/tablas, [subtotales] }
  ↓
Componentes de UI (MarketDataExtractor, RawMaterialReceptions)
  ↓
Export helpers + linking con proveedores/barcos
```

### Tipos de documento soportados

| Clave interna | Modelo Azure | Proveedor real |
|---|---|---|
| `listadoComprasLonjaDeIsla` | `ListadoComprasLonjaDeIsla` | Lonja de Isla Cristina |
| `albaranCofradiaPescadoresSantoCristoDelMar` | `AlbaranCofradiaPescadoresSantoCristoDelMar` | Cofradía Punta del Moral |
| `listadoComprasAsocArmadoresPuntaDelMoral` | `ListadoComprasAsocArmadoresPuntaDelMoral` | Asoc. Armadores Punta del Moral |

### Archivos clave del sistema actual

| Capa | Archivo |
|---|---|
| Servicio Azure | `src/services/azure/index.js` |
| Parser respuesta Azure | `src/helpers/azure/documentAI/index.js` |
| Normalizadores multi-página | `src/helpers/azure/lonjaDeIslaMultiPageNormalizer.js`, `asocMultiPageNormalizer.js` |
| Validadores de estructura | `src/validators/lonjas/lonjaDeIslaValidator.js`, `cofraValidator.js`, `asocValidator.js` |
| Parsers de datos | `src/parsers/lonjas/lonjaDeIslaParser.js`, `cofraParser.js`, `asocParser.js` |
| Orquestador | `src/components/Admin/MarketDataExtractor/shared/DocumentProcessor.js` |
| Errores custom | `src/errors/lonjasErrors.js` |
| UI principal | `src/components/Admin/MarketDataExtractor/index.js` |
| Export helpers | `src/exportHelpers/lonjaDeIslaExportHelper.js`, `cofraExportHelper.js`, `asocExportHelper.js` |

---

## 2. Problemas y limitaciones detectadas

### 2.1 Dependencia del modelo entrenado

Cada tipo de documento requiere un modelo entrenado en Azure Document Intelligence. Si el formato del documento cambia (nueva columna, reordenación de campos, cambio de maquetación), hay que reentrenar el modelo.

### 2.2 Costes y latencia de Azure

- Azure cobra por página procesada.
- El polling (hasta 45 intentos con 5 segundos de intervalo) introduce latencia significativa en documentos grandes o cuando Azure está saturado.
- Hay que mantener modelos activos, lo que implica coste incluso en periodos de inactividad.

### 2.3 Lógica de parsing compleja y frágil

- `parseAzureDocumentAIResult()` transforma una estructura muy anidada (campos, tablas, objetos) devuelta por Azure en algo usable.
- Cada tipo de documento tiene su propio normalizador multi-página porque Azure puede fragmentar filas entre páginas.
- Los parsers tienen que interpretar valores decimales con coma, limpiar strings, resolver OCR ambiguo.
- Cuando Azure comete un error de OCR, la capa de parsing falla silenciosamente o produce datos incorrectos.

### 2.4 Cobertura limitada de documentos

Añadir soporte para un nuevo tipo de documento implica: entrenar modelo → implementar validador → implementar parser → implementar normalizador (si es multi-página) → integrarlo en `DocumentProcessor`. Es un proceso costoso.

### 2.5 Datos de entorno expuestos

Las credenciales y model IDs de Azure están prefijados con `NEXT_PUBLIC_`, lo que los expone en el bundle de cliente. No es un problema de seguridad crítico en este contexto, pero no es una práctica óptima.

---

## 3. Nueva arquitectura: sistema de proveedores de extracción

### 3.1 Concepto

Introducir una abstracción de "proveedor de extracción" que permita usar Azure o ChatGPT de forma intercambiable, manteniendo la misma interfaz hacia el resto del sistema.

```
PDF subido por el usuario
  ↓
Selección de proveedor: azure | chatgpt
  ↓
ExtractionProvider.extract(file, documentType)
  ├─ [azure]   → pipeline actual (sin cambios)
  └─ [chatgpt] → nueva llamada a OpenAI → JSON estructurado
  ↓
Resultado normalizado común (ExtractionResult)
  ↓
Validaciones de totales e integridad
  ↓
Si cuadra:    guardar / importar / exportar
Si no cuadra: marcar como needs_review, mostrar al usuario
```

### 3.2 Interfaz común de resultado

Ambos proveedores deben devolver un objeto `ExtractionResult` con la misma forma:

```typescript
type ExtractionResult = {
  success: boolean;
  provider: 'azure' | 'chatgpt';
  documentType: string;
  data: ParsedDocument[];       // array por si hay múltiples hojas/secciones
  fileName: string;
  needsReview: boolean;         // true si los totales no cuadran
  reviewReasons?: string[];     // lista de discrepancias detectadas
  error?: string;
  errorType?: 'validation' | 'parsing' | 'provider' | 'unknown';
};
```

### 3.3 Estado de cada proveedor

| Proveedor | Estado | Notas |
|---|---|---|
| `azure` | **Legacy / Deprecated** | Se mantiene funcional pero no se expande. No añadir nuevos tipos de documento. |
| `chatgpt` | **Recomendado** | Nuevo proveedor. Usar para todos los tipos de documento, incluidos los nuevos. |

---

## 4. Cómo el usuario elige el proveedor

### Opción A: Selector en la UI (recomendado para fase inicial)

Añadir un `<Select>` o toggle en `IndividualMode` y `MassiveMode` antes de procesar:

```tsx
<Select value={provider} onValueChange={setProvider}>
  <SelectItem value="chatgpt">ChatGPT (recomendado)</SelectItem>
  <SelectItem value="azure">Azure Document AI (legacy)</SelectItem>
</Select>
```

El proveedor seleccionado se pasa a `processDocument(file, documentType, { provider })`.

### Opción B: Variable de entorno global

```env
NEXT_PUBLIC_EXTRACTION_PROVIDER=chatgpt   # 'azure' | 'chatgpt'
```

Útil para rollout progresivo o para entornos de prueba. La UI puede mostrar el proveedor activo como información.

### Opción C: Configuración por tipo de documento

Un mapa de configuración permite rutas de migración incrementales:

```javascript
// src/configs/extractionConfig.js
export const extractionProviderByDocumentType = {
  listadoComprasLonjaDeIsla: 'chatgpt',
  albaranCofradiaPescadoresSantoCristoDelMar: 'chatgpt',
  listadoComprasAsocArmadoresPuntaDelMoral: 'azure',  // todavía en pruebas
};
```

**Recomendación**: empezar con la Opción A (selector manual), pasar a la Opción B o C cuando ChatGPT esté validado en producción.

---

## 5. Qué partes del sistema actual se mantienen intactas

| Componente | ¿Se mantiene? | Notas |
|---|---|---|
| `src/services/azure/index.js` | Sí, sin cambios | Se encapsula dentro del proveedor `azure` |
| `src/helpers/azure/documentAI/index.js` | Sí, sin cambios | Solo lo usa el proveedor `azure` |
| `src/helpers/azure/*MultiPageNormalizer.js` | Sí, sin cambios | Solo lo usa el proveedor `azure` |
| `src/validators/lonjas/*.js` | Sí, sin cambios | Azure: validan estructura tras el parser. ChatGPT: validan el JSON recibido directamente. |
| `src/parsers/lonjas/*.js` | Sí, sin cambios | **Solo los usa el proveedor `azure`**. ChatGPT devuelve el JSON ya en formato final; no pasa por parsers. |
| `src/errors/lonjasErrors.js` | Sí, sin cambios | Compartido entre proveedores |
| `src/exportHelpers/` | Sí, sin cambios | Agnósticos al proveedor |
| `src/components/Admin/MarketDataExtractor/` | Modificación mínima | Añadir selector de proveedor y pasar `provider` a `processDocument` |
| `DocumentProcessor.js` | Modificación mínima | Añadir bifurcación por proveedor antes de llamar al extracto |

---

## 6. Qué partes deben cambiar o crearse para ChatGPT

### 6.1 API route de Next.js para ChatGPT

Crear `src/app/api/extraction/chatgpt/route.js`:
- Recibe el PDF (como base64 o buffer).
- Llama a la API de OpenAI con el PDF adjunto como imagen o texto extraído.
- Devuelve el JSON estructurado.
- Gestiona errores de la API de OpenAI.

**Importante**: esta ruta debe ser server-side para no exponer la API key de OpenAI en el cliente. Usar `OPENAI_API_KEY` (sin prefijo `NEXT_PUBLIC_`).

### 6.2 Servicio de extracción ChatGPT

Crear `src/services/chatgpt/extractionService.js`:
- Función `extractDataWithChatGPT(file, documentType)`.
- Envía el PDF a la API route interna `/api/extraction/chatgpt`.
- Devuelve la respuesta parseada.

### 6.3 Proveedor ChatGPT en DocumentProcessor

Modificar `DocumentProcessor.processDocument()` para bifurcar según el proveedor:

```javascript
async function processDocument(file, documentType, options = {}) {
  const provider = options.provider ?? 'chatgpt';

  if (provider === 'azure') {
    // pipeline actual, sin cambios
    return processWithAzure(file, documentType);
  }

  if (provider === 'chatgpt') {
    return processWithChatGPT(file, documentType);
  }
}

async function processWithChatGPT(file, documentType) {
  // 1. Llamar a extractDataWithChatGPT → JSON ya en formato final (sin parseAzureDocumentAIResult, sin normalizador, sin parser)
  // 2. Validar estructura con el validador del tipo de documento (reutilizado de Azure)
  // 3. Validar totales (nueva lógica compartida)
  // 4. Devolver ExtractionResult
  // NO se llama a ningún normalizador multi-página ni a ningún parser
}
```

---

## 7. Qué JSON debe devolver ChatGPT

El objetivo es que ChatGPT devuelva directamente el JSON que los parsers actuales producen, de modo que la app solo tenga que validar y persistir.

### 7.1 ListadoComprasLonjaDeIsla

```json
{
  "details": {
    "lonja": "Lonja de Isla Cristina",
    "fecha": "2024-03-15",
    "cifComprador": "B12345678",
    "comprador": "Congelados Brisamar S.L.",
    "numeroComprador": "123",
    "importeTotal": 15432.50
  },
  "tables": {
    "ventas": [
      {
        "venta": "001",
        "barco": "NUEVO HORIZONTE",
        "matricula": "IS-1234",
        "cajas": 12,
        "especie": "GAMBA BLANCA",
        "kilos": 84.5,
        "precio": 18.20,
        "importe": 1537.90
      }
    ],
    "peces": [
      {
        "fao": "NEP",
        "descripcion": "CIGALA",
        "cajas": 8,
        "kilos": 56.0,
        "importe": 896.00
      }
    ],
    "vendidurias": [
      {
        "vendiduria": "V-01",
        "cajas": 20,
        "kilos": 140.5,
        "importe": 2433.90
      }
    ],
    "cajas": [
      {
        "descripcion": "CAJA PLASTICO",
        "cajas": 20,
        "importe": 40.00
      }
    ],
    "tipoVentas": []
  }
}
```

### 7.2 AlbaranCofradiaPescadoresSantoCristoDelMar

```json
{
  "detalles": {
    "lonja": "Cofradía Punta del Moral",
    "cifLonja": "G12345678",
    "numero": "2024/0123",
    "fecha": "2024-03-15",
    "ejercicio": "2024",
    "comprador": "Congelados Brisamar S.L.",
    "numeroComprador": "42",
    "cifComprador": "B12345678",
    "importeTotal": 8750.30
  },
  "tablas": {
    "subastas": [
      {
        "cajas": 10,
        "tipoCaja": "PLASTICO",
        "kilos": 70.5,
        "pescado": "GAMBA BLANCA",
        "cod": "GBL",
        "barco": "VIRGEN DEL ROCIO",
        "armador": "Juan García Pérez",
        "cifArmador": "12345678Z",
        "precio": 22.50,
        "importe": 1586.25
      }
    ],
    "servicios": [
      {
        "codigo": "SRV-01",
        "descripcion": "Servicio manipulación",
        "fecha": "2024-03-15",
        "iva": 10,
        "unidades": 1,
        "precio": 50.00,
        "importe": 50.00
      }
    ]
  },
  "subtotales": {
    "pesca": {
      "subtotal": 8000.00,
      "iva": 10,
      "total": 8800.00
    },
    "servicios": {
      "subtotal": 50.00,
      "iva": 21,
      "total": 60.50
    },
    "cajas": {
      "subtotal": 0.00,
      "iva": 0,
      "total": 0.00
    }
  }
}
```

### 7.3 ListadoComprasAsocArmadoresPuntaDelMoral

Estructura similar a `ListadoComprasLonjaDeIsla`. Definir en detalle cuando se implemente este tipo.

### 7.4 Reglas del prompt para ChatGPT

El prompt del sistema debe incluir:

- Instrucción de devolver **exclusivamente JSON válido**, sin texto adicional.
- El schema exacto esperado para el tipo de documento procesado.
- Reglas de normalización: fechas en `yyyy-MM-dd`, decimales con punto (no coma), valores numéricos como `number` (no string).
- Instrucción de incluir todos los campos aunque estén vacíos (`null` o `[]`).
- Instrucción de no inventar datos: si un campo no aparece en el documento, devolver `null`.

---

## 8. Validaciones internas que debe hacer la aplicación

Los dos proveedores convergen en el mismo punto de validación, pero llegan con diferente recorrido previo:

- **Azure**: PDF → Azure API → `parseAzureDocumentAIResult` → normalizador multi-página → parser → **validación de estructura** → validación de totales.
- **ChatGPT**: PDF → ChatGPT API → JSON en formato final → **validación de estructura** → validación de totales.

Los parsers y normalizadores son exclusivos del camino Azure. La validación de estructura y totales es compartida.

### 8.1 Validación de estructura (reutilizar validadores existentes)

Los validadores de `src/validators/lonjas/` comprueban que todos los campos requeridos están presentes y tienen los tipos correctos. Para ChatGPT se aplican directamente sobre el JSON devuelto por la API (sin transformación previa). Para Azure se aplican después del parser, exactamente igual que hoy.

### 8.2 Validación de totales (nueva)

Antes de permitir guardar/exportar, verificar que:

- Suma de `importe` en líneas de ventas ≈ `importeTotal` del encabezado (tolerancia ±0.02 por redondeos).
- Suma de `kilos` por especie ≈ totales por especie si el documento los incluye.
- Si el documento incluye subtotales por categoría (Cofra), verificar que cuadran con los totales.

Si una validación de totales falla → `needsReview = true`, `reviewReasons` describe la discrepancia.

```javascript
function validateTotals(data, documentType) {
  const reasons = [];

  if (documentType === 'albaranCofradiaPescadoresSantoCristoDelMar') {
    const sumSubastas = data.tablas.subastas.reduce((acc, r) => acc + r.importe, 0);
    const totalDeclarado = data.detalles.importeTotal;
    if (Math.abs(sumSubastas - totalDeclarado) > 0.02) {
      reasons.push(`Suma de subastas (${sumSubastas.toFixed(2)}) ≠ importe total (${totalDeclarado})`);
    }
  }

  // ... validaciones por tipo de documento

  return { needsReview: reasons.length > 0, reviewReasons: reasons };
}
```

### 8.3 Normalización mínima post-ChatGPT

Aunque ChatGPT devuelva el JSON casi listo, aplicar normalización defensiva:

- Redondear valores numéricos a 2 decimales.
- Recortar espacios en strings.
- Convertir `null` a `""` en campos de texto opcionales si la UI lo requiere.
- NO transformar claves ni estructuras: ChatGPT ya devuelve el formato final.

---

## 9. Plan de implementación por fases

### Fase 1 — Preparar la abstracción (sin romper nada)

**Objetivo**: introducir el concepto de proveedor sin tocar el pipeline de Azure.

Tareas:
1. Crear `src/configs/extractionConfig.js` con la configuración de proveedores.
2. Modificar `DocumentProcessor.processDocument()` para aceptar `options.provider`.
3. Encapsular el pipeline actual de Azure en `processWithAzure()` (refactor interno, sin cambios de comportamiento).
4. Añadir selector de proveedor en `IndividualMode` (por defecto: `azure` en esta fase).
5. Añadir variable de entorno `NEXT_PUBLIC_EXTRACTION_PROVIDER` como override global.

**Archivos a tocar**: `DocumentProcessor.js`, `IndividualMode/index.js`, nuevo `extractionConfig.js`.
**Tests**: verificar que el pipeline de Azure sigue pasando todos los tests existentes.

---

### Fase 2 — Implementar el proveedor ChatGPT (un tipo de documento piloto)

**Objetivo**: tener ChatGPT funcionando para `albaranCofradiaPescadoresSantoCristoDelMar` (es el que tiene la estructura más compleja, buen banco de pruebas).

Tareas:
1. Crear `src/app/api/extraction/chatgpt/route.js` (server-side, `OPENAI_API_KEY` sin prefijo `NEXT_PUBLIC_`).
2. Crear `src/services/chatgpt/extractionService.js`.
3. Diseñar y testear el prompt del sistema para el tipo piloto.
4. Implementar `processWithChatGPT()` en `DocumentProcessor.js`.
5. Implementar `validateTotals()` para el tipo piloto.
6. Conectar en la UI: cuando `provider === 'chatgpt'`, usar el nuevo flujo.
7. Tests con documentos reales de producción, comparando resultados Azure vs ChatGPT.

**Archivos a crear**: `src/app/api/extraction/chatgpt/route.js`, `src/services/chatgpt/extractionService.js`.
**Archivos a modificar**: `DocumentProcessor.js`.

---

### Fase 3 — Extender ChatGPT a todos los tipos de documento

**Objetivo**: cubrir los tres tipos de documento con ChatGPT y validar en producción.

Tareas:
1. Repetir el proceso de la Fase 2 para `listadoComprasLonjaDeIsla` y `listadoComprasAsocArmadoresPuntaDelMoral`.
2. Implementar `validateTotals()` para los tres tipos.
3. Actualizar `IndividualMode` y `MassiveMode` para que el selector de proveedor esté disponible en ambos.
4. Marcar `azure` como `deprecated` en la UI (badge o tooltip explicativo).
5. Cambiar el proveedor por defecto a `chatgpt` en `extractionConfig.js`.

---

### Fase 4 — Validación en producción y ajuste de prompts

**Objetivo**: afinar la calidad de extracción de ChatGPT con datos reales.

Tareas:
1. Comparar resultados de ChatGPT vs Azure en un conjunto de documentos históricos.
2. Ajustar prompts según los errores más frecuentes.
3. Implementar un mecanismo de feedback: cuando el usuario corrige un dato extraído, registrar la corrección para refinar el prompt.
4. Evaluar si `needsReview` se activa demasiado (prompt demasiado conservador) o muy poco (prompt demasiado permisivo).

---

### Fase 5 — Deprecación progresiva de Azure (opcional, largo plazo)

**Objetivo**: reducir costes y mantenimiento eliminando la dependencia de Azure.

Tareas:
1. Verificar que ChatGPT cubre el 100% de los casos que Azure cubría.
2. Mantener Azure como fallback de emergencia, no como opción principal.
3. Decidir si mantener la integración Azure activa o desactivarla completamente.
4. Actualizar `.env.example` marcando las variables de Azure como opcionales.

**Decisión**: esta fase es opcional y depende de los resultados de la Fase 4. No hay prisa.

---

## 10. Variables de entorno necesarias

### Existentes (Azure, se mantienen)

```env
NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT=
NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY=
NEXT_PUBLIC_AZURE_DOCUMENT_AI_LISTADO_COMPRAS_LONJA_DE_ISLA_MODEL_ID=
NEXT_PUBLIC_AZURE_DOCUMENT_AI_LISTADO_COMPRAS_ASOC_ARMADORES_PUNTA_DEL_MORAL_MODEL_ID=
NEXT_PUBLIC_AZURE_DOCUMENT_AI_ALBARAN_COFRADIA_PESCADORES_SANTO_CRISTO_DEL_MAR_MODEL_ID=
NEXT_PUBLIC_AZURE_DOCUMENT_AI_FACTURA_DOCAPESCA_ID=
```

### Nuevas (ChatGPT)

```env
OPENAI_API_KEY=                          # Server-side únicamente, sin NEXT_PUBLIC_
NEXT_PUBLIC_EXTRACTION_PROVIDER=chatgpt  # 'azure' | 'chatgpt' — override global opcional
```

**Importante**: `OPENAI_API_KEY` NO debe llevar el prefijo `NEXT_PUBLIC_`. Solo se usa en la API route server-side.

---

## 11. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| ChatGPT devuelve JSON malformado | Alto | Validación estricta + try/catch + fallback a `needs_review` |
| ChatGPT alucina datos que no están en el PDF | Alto | Prompt con instrucción explícita de no inventar; validación de totales |
| Latencia de ChatGPT mayor de lo esperado | Medio | Mostrar spinner con mensaje de espera; timeout configurable |
| Coste de tokens por PDFs grandes | Medio | Enviar solo el texto extraído del PDF, no la imagen, si la calidad es suficiente |
| Cambio en la API de OpenAI | Bajo | API route interna abstrae el proveedor; cambiar en un solo lugar |
| Azure se elimina antes de que ChatGPT esté validado | Alto | No eliminar Azure hasta que Fase 4 esté superada |

---

## 12. Criterios de éxito

ChatGPT se considera validado para producción cuando:

- [ ] Tasa de extracción correcta ≥ 95% en documentos del conjunto de prueba.
- [ ] `needsReview` se activa en < 5% de documentos correctos (falsos positivos bajos).
- [ ] `needsReview` se activa en > 95% de documentos con errores reales (sensibilidad alta).
- [ ] Latencia media de extracción < 15 segundos para documentos de hasta 5 páginas.
- [ ] Ningún campo crítico (`importeTotal`, `fecha`, `barco`) inventado en el conjunto de prueba.
