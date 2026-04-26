# Auditoría: API Client Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** API Client Agent
**Scope:** Servicios, payloads, respuestas, gestión de errores, cabeceras de auth, awareness de tenant

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/services/azure/index.js` | Servicio principal de extracción Azure Document AI |
| `src/components/Admin/MarketDataExtractor/shared/DocumentProcessor.js` | Orquestador — consumidor del servicio Azure |
| `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js` | Consumidor de `linkService` y `excelGenerator` |
| `src/services/export/linkService.js` | Servicio de vinculación de compras con API interna |
| `src/lib/fetchWithTenant.js` | Capa HTTP centralizada |

---

## 2. Endpoints usados

### 2.1 Azure Document AI (externo)

```
POST {AZURE_ENDPOINT}formrecognizer/documentModels/{modelId}:analyze?api-version=2023-07-31
GET  {OPERATION_LOCATION}   (polling — URL devuelta por Azure en Operation-Location header)
```

**Modelos por tipo de documento:**
- `ASOC`: `NEXT_PUBLIC_AZURE_DOCUMENT_AI_LISTADO_COMPRAS_ASOC_ARMADORES_PUNTA_DEL_MORAL_MODEL_ID`
- `Cofra`: `NEXT_PUBLIC_AZURE_DOCUMENT_AI_ALBARAN_COFRADIA_PESCADORES_SANTO_CRISTO_DEL_MAR_MODEL_ID`
- `LonjaDeIsla`: `NEXT_PUBLIC_AZURE_DOCUMENT_AI_LISTADO_COMPRAS_LONJA_DE_ISLA_MODEL_ID`

### 2.2 API interna (La PesquerApp backend)

- `validatePurchases()` — endpoint de validación de recepciones (en `linkService.js`)
- `linkAllPurchases()` — endpoint de vinculación bulk de compras (en `linkService.js`)

---

## 3. Payloads

### 3.1 Request a Azure

```javascript
{
  method: 'POST',
  headers: {
    'Content-Type': 'application/pdf',
    'Ocp-Apim-Subscription-Key': apiKey,   // ← API key de Azure
  },
  body: fileBuffer,   // ArrayBuffer del PDF
}
```

### 3.2 Polling de Azure

```javascript
{
  headers: {
    'Ocp-Apim-Subscription-Key': apiKey,
  }
}
// No body — GET request
```

---

## 4. Response assumptions

### 4.1 Respuesta inicial de Azure

```javascript
response.headers.get('Operation-Location')  // URL para polling
response.ok                                  // boolean
```

### 4.2 Respuesta de polling

```json
{
  "status": "running" | "notStarted" | "succeeded" | "failed",
  "analyzeResult": { ... }    // Solo cuando status === "succeeded"
}
```

El resultado se pasa directamente a `parseAzureDocumentAIResult()` — se asume que la estructura de `analyzeResult` es consistente entre los tres tipos de modelo.

---

## 5. Gestión de errores

### 5.1 Errores de Azure — análisis

```javascript
// azure/index.js:56-58
if (!response.ok) {
    throw new Error(`Error Azure inicial: ${response.statusText}`);
}
```

**Problema**: `response.statusText` puede estar vacío en muchos entornos (es opcional en HTTP/2 y Fetch API). El mensaje de error puede ser simplemente `"Error Azure inicial: "` sin información útil. Debería incluir `response.status` como mínimo.

```javascript
// azure/index.js:101-102
if (!resultResponse.ok) {
    throw new Error(`Error Azure resultado: ${resultResponse.statusText}`);
}
```

El mismo problema aplica para el polling.

### 5.2 Rate limiting

```javascript
// azure/index.js:88-97
const isRateLimitError = /429|Too Many Requests|rate limit/i.test(errorMessage);
if (isRateLimitError) {
    await sleep(rateLimitDelay);  // 17 segundos hardcodeados
    continue;
}
```

**Problema**: La detección de rate limit se hace sobre `error.message`, pero el error de red puede no contener "429" en el mensaje — el status code 429 está en la respuesta HTTP, no en la excepción. Si Azure devuelve 429 como respuesta HTTP (no como excepción de red), este `catch` nunca se ejecuta porque `resultResponse.ok === false` dispara el error anterior (`throw new Error('Error Azure resultado: ...')`).

### 5.3 Clasificación de errores en DocumentProcessor

```javascript
// DocumentProcessor.js:104
} else if (error.name === 'Error' && error.message.includes('Azure')) {
```

**Problema crítico**: La detección del tipo "azure" se basa en que el mensaje contenga la cadena "Azure". Esto es extremadamente frágil. Si se cambia el mensaje de error en `azure/index.js`, la clasificación falla silenciosamente y el error se clasifica como "unknown". Debería usarse una clase de error custom `AzureError` similar a `ValidationError` y `ParsingError`.

### 5.4 Timeout global

No existe un timeout global para el proceso completo. El loop de polling puede correr hasta `45 × 5s + posibles × 17s` = potencialmente más de 12 minutos. No hay `AbortController` ni mecanismo para que el usuario cancele el proceso una vez iniciado.

---

## 6. Hallazgos críticos de seguridad y arquitectura

### 6.1 [CRÍTICO] API key de Azure expuesta en el cliente

```javascript
// azure/index.js:29-30
const endpoint = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT;
const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY;
```

**Las variables `NEXT_PUBLIC_*` se incluyen en el bundle JavaScript del cliente.** Esto significa que la API key de Azure Document AI y el endpoint están visibles en el código fuente del navegador para cualquier usuario autenticado (y potencialmente para cualquiera que inspeccione el bundle).

**Impacto**: cualquier persona con acceso al bundle puede extraer la API key y usar el servicio Azure a cargo de la empresa, potencialmente incurriendo en costes no autorizados.

**Solución**: mover la llamada a Azure a una API Route de Next.js (`src/app/api/lonjas/extract/route.ts`). El componente cliente envía el PDF al backend Next.js, que mantiene la API key en variable de entorno privada (`AZURE_DOCUMENT_AI_KEY` sin `NEXT_PUBLIC_`) y llama a Azure server-side.

### 6.2 `fetchWithTenant` usado para Azure (API externa)

```javascript
// azure/index.js:47
const response = await fetchWithTenant(url, { ... });
```

`fetchWithTenant()` añade automáticamente la cabecera `X-Tenant` a todas las peticiones. Azure Document AI no procesa ni espera esta cabecera — es ruido que podría causar problemas inesperados si Azure llegara a rechazar headers desconocidos en el futuro.

Además, `fetchWithTenant` gestiona errores 401 disparando `AUTH_SESSION_EXPIRED_EVENT`. Si Azure devuelve un 401 (por API key inválida), el sistema podría redirigir al usuario al login de La PesquerApp de forma incorrecta.

**Solución**: las llamadas a Azure deberían usar `fetch()` nativo directamente (no `fetchWithTenant`), ya que son llamadas a un servicio externo sin relación con el sistema de autenticación del tenant.

### 6.3 API version hardcodeada

```javascript
// azure/index.js:8-9
apiVersion: '2023-07-31',
```

La versión de API está hardcodeada en el código fuente. Si Azure depreca esta versión, habrá que modificar el código. Debería estar en la configuración o en `src/configs/config.js`.

### 6.4 Cabecera de auth incorrecta para Azure

La API de Azure usa `Ocp-Apim-Subscription-Key`, no `Bearer`. Esto es correcto para Azure, pero rompe el patrón uniforme del resto del sistema donde toda autenticación usa `Authorization: Bearer {token}`. No es un bug — es una inconsistencia de patrón documentada.

---

## 7. Resumen de endpoints y riesgos

| Endpoint | Tipo | Auth | Riesgo |
|---|---|---|---|
| Azure Document AI analyze | Externo (POST) | `Ocp-Apim-Subscription-Key` expuesta en cliente | **CRÍTICO** |
| Azure Document AI polling | Externo (GET) | `Ocp-Apim-Subscription-Key` expuesta en cliente | **CRÍTICO** |
| `validatePurchases()` | Interno API Laravel | Bearer token (inferido) | Info |
| `linkAllPurchases()` | Interno API Laravel | Bearer token (inferido) | Info |

---

## 8. Prioridad de correcciones

1. **[P0]** Mover llamada Azure a API Route server-side — eliminar `NEXT_PUBLIC_` de la key
2. **[P1]** Reemplazar `fetchWithTenant` por `fetch` nativo para llamadas a Azure
3. **[P2]** Crear clase `AzureError` custom para clasificar errores de forma robusta
4. **[P3]** Mejorar mensajes de error (`response.status + response.statusText`)
5. **[P3]** Añadir `AbortController` para poder cancelar el polling
6. **[P4]** Mover `apiVersion` a configuración

---

## 5. Riesgos operativos

- Si Azure cambia el formato de `analyzeResult`, `parseAzureDocumentAIResult` puede fallar sin un error claro
- Si la API key es comprometida, el coste de Azure es imposible de controlar hasta que se revoque
- Sin timeout user-controlable, el bloqueo de UI durante el procesamiento puede ser de más de 10 minutos
