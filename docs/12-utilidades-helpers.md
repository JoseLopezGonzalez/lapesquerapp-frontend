# Utilidades y Helpers

## 📚 Documentación Relacionada

- **[07-servicios-api-v2.md](./07-servicios-api-v2.md)** - Servicios que utilizan `fetchWithTenant`
- **[04-components-admin.md](./04-components-admin.md)** - Componentes que utilizan helpers

---

## 📋 Introducción

Las utilidades y helpers están organizados en `/src/helpers/` y `/src/lib/`. Proporcionan funciones reutilizables para formateo, transformación de datos, manejo de fechas, números, textos, y operaciones específicas del dominio.

**Estructura**:

- `/src/helpers/` - Helpers organizados por categoría
- `/src/lib/` - Utilidades de librería (fetch, barcodes, utils)

---

## 📦 Helpers por Categoría

### 1. Formateo de Fechas

**Archivo**: `/src/helpers/formats/dates/formatDates.js`

#### formatDate

```javascript
export const formatDate = (date) => {
  const dateObj = new Date(date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};
```

**Formato**: `DD/MM/YYYY`

**Ejemplo**:

```javascript
formatDate('2024-01-15'); // "15/01/2024"
```

#### formatDateHour

```javascript
export const formatDateHour = (date) => {
  const dateObj = new Date(date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hour = String(dateObj.getHours()).padStart(2, '0');
  const minute = String(dateObj.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} - ${hour}:${minute}`;
};
```

**Formato**: `DD/MM/YYYY - HH:MM`

**Ejemplo**:

```javascript
formatDateHour('2024-01-15T14:30:00'); // "15/01/2024 - 14:30"
```

#### formatDateShort

```javascript
export const formatDateShort = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
```

**Formato**: `26 feb 2025` (formato español corto)

**Ejemplo**:

```javascript
formatDateShort('2025-02-26'); // "26 feb 2025"
```

---

### 2. Formateo de Números

**Archivo**: `/src/helpers/formats/numbers/formatNumbers.js`

#### formatInteger

```javascript
export const formatInteger = (number) => {
  return Intl.NumberFormat('es-ES', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(number);
};
```

**Formato**: Número entero con separadores de miles (formato español)

**Ejemplo**:

```javascript
formatInteger(1234); // "1.234"
formatInteger(1234567); // "1.234.567"
```

#### formatIntegerCurrency

```javascript
export const formatIntegerCurrency = (number) => {
  return `${formatInteger(number)} €`;
};
```

**Formato**: Número entero con símbolo de euro

**Ejemplo**:

```javascript
formatIntegerCurrency(1234); // "1.234 €"
```

#### formatIntegerWeight

```javascript
export const formatIntegerWeight = (number) => {
  return `${formatInteger(number)} Kg`;
};
```

**Formato**: Número entero con unidad de peso

**Ejemplo**:

```javascript
formatIntegerWeight(1234); // "1.234 Kg"
```

#### formatDecimal

```javascript
export const formatDecimal = (number) => {
  return Intl.NumberFormat('es-ES', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(Number(number));
};
```

**Formato**: Número decimal con 2 decimales y separadores de miles

**Ejemplo**:

```javascript
formatDecimal(1234.56); // "1.234,56"
formatDecimal(1234567.89); // "1.234.567,89"
```

#### formatDecimalCurrency

```javascript
export const formatDecimalCurrency = (number) => {
  return `${formatDecimal(number)} €`;
};
```

**Formato**: Número decimal con símbolo de euro

**Ejemplo**:

```javascript
formatDecimalCurrency(1234.56); // "1.234,56 €"
```

#### formatDecimalWeight

```javascript
export const formatDecimalWeight = (number) => {
  return `${formatDecimal(number)} kg`;
};
```

**Formato**: Número decimal con unidad de peso

**Ejemplo**:

```javascript
formatDecimalWeight(1234.56); // "1.234,56 kg"
```

#### parseEuropeanNumber

```javascript
export const parseEuropeanNumber = (str) => {
  if (typeof str !== 'string') return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.').trim()) || 0;
};
```

**Funcionalidad**: Parsea números en formato europeo (1.234,56 → 1234.56)

**Ejemplo**:

```javascript
parseEuropeanNumber('1.234,56'); // 1234.56
parseEuropeanNumber('1.234.567,89'); // 1234567.89
```

---

### 3. Formateo de Textos

**Archivo**: `/src/helpers/formats/texts/index.js`

#### normalizeText

```javascript
export const normalizeText = (nombre) => {
  return nombre
    ?.normalize('NFD') // quitar tildes
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '') // quitar puntos y comas
    .toLowerCase()
    .trim();
};
```

**Funcionalidad**: Normaliza texto para búsquedas (quita tildes, puntos, comas, convierte a minúsculas)

**Ejemplo**:

```javascript
normalizeText('José María'); // "jose maria"
normalizeText('Café, té.'); // "cafe te"
```

---

### 4. Utilidades de Fechas

**Archivo**: `/src/helpers/dates/index.js`

```javascript
export const today = new Date();

export const firstDayOfCurrentYear = new Date(today.getFullYear(), 0, 1);

export const firstDayOfCurrentYearLocaleDateString =
  firstDayOfCurrentYear.toLocaleDateString('sv-SE');

export const todayLocaleDateString = today.toLocaleDateString('sv-SE');

export const actualYearRange = {
  from: firstDayOfCurrentYear,
  to: today,
};
```

**Uso**:

- `today` - Fecha actual
- `firstDayOfCurrentYear` - 1 de enero del año actual
- `actualYearRange` - Rango del año actual (para DateRangePicker)

**Archivo**: `/src/helpers/dates/years.js`

```javascript
export const currentYear = new Date().getFullYear();
```

---

### 5. Utilidades de Estilos

**Archivo**: `/src/helpers/styles/classNames.js`

#### classNames

```javascript
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
```

**Funcionalidad**: Concatena clases CSS, filtrando valores falsy

**Ejemplo**:

```javascript
classNames('base-class', condition && 'conditional', null, undefined, 'another');
// "base-class conditional another"
```

**Nota**: Similar a `cn()` de `/src/lib/utils.js`, pero más simple. `cn()` usa `clsx` y `twMerge` para mejor manejo de conflictos de Tailwind.

---

### 6. Utilidades de Window

**Archivo**: `/src/helpers/window/goBack.js`

#### goBack

```javascript
export const goBack = () => {
  if (typeof window !== 'undefined') {
    window.history.back();
  }
};
```

**Funcionalidad**: Navega hacia atrás en el historial del navegador

**Uso**:

```javascript
import { goBack } from '@/helpers/window/goBack';

<Button onClick={goBack}>Volver</Button>;
```

---

### 7. Settings Helper

**Archivo**: `/src/helpers/getSettingValue.js`

#### getSettingValue

```javascript
let cachedSettings = null;

export async function getSettingValue(key, forceRefresh = false) {
  if (!cachedSettings || forceRefresh) {
    cachedSettings = await getSettings();
  }
  return cachedSettings?.[key];
}
```

**Funcionalidad**: Obtiene valor de setting con caché

**Parámetros**:

- `key` (string) - Clave del setting
- `forceRefresh` (boolean, opcional) - Forzar recarga del caché

**Ejemplo**:

```javascript
const companyName = await getSettingValue('company.name');
```

#### invalidateSettingsCache

```javascript
export function invalidateSettingsCache() {
  cachedSettings = null;
}
```

**Funcionalidad**: Invalida el caché de settings

**Uso**: Se llama desde `SettingsContext` cuando se actualizan settings.

---

### 8. Azure Document AI Helper

**Archivo**: `/src/helpers/azure/documentAI/index.js`

#### parseAzureDocumentAIResult

```javascript
export const parseAzureDocumentAIResult = (data) => {
  const analyzedDocuments = [];
  const documents = data.documents || [];

  documents.forEach((document) => {
    const fields = document.fields || {};
    const details = {};

    // Extraer campos simples
    for (const fieldKey in fields) {
      const field = fields[fieldKey];
      if (field && field.content) {
        details[fieldKey] = field.content;
      }
    }

    // Extraer tablas (arrays)
    const tables = {};
    for (const field in fields) {
      if (fields[field].type === 'array' && fields[field].valueArray) {
        tables[field] = [];
        fields[field].valueArray.forEach((item) => {
          const row = item.valueObject;
          const formattedRow = {};
          for (const key in row) {
            if (row[key].content) {
              formattedRow[key] = row[key].content;
            }
          }
          if (formattedRow) {
            tables[field].push(formattedRow);
          }
        });
      }
    }

    // Extraer objetos anidados
    const objects = {};
    // ... lógica similar para objetos

    analyzedDocuments.push({
      details,
      tables,
      objects,
    });
  });

  return analyzedDocuments;
};
```

**Funcionalidad**: Parsea resultado de Azure Document AI en estructura más simple

**Estructura de retorno**:

```javascript
[
  {
    details: { campo1: 'valor1', campo2: 'valor2' },
    tables: { tabla1: [{ col1: 'val1', col2: 'val2' }] },
    objects: { objeto1: { subcampo: 'valor' } },
  },
];
```

---

## 📚 Utilidades de Librería (`/src/lib/`)

### 0. Logger (desarrollo vs producción)

**Archivo**: `/src/lib/logger.js`

**Propósito**: Reducir ruido y overhead en producción. Los métodos `log`, `info` y `debug` son no-op en producción; `warn` y `error` se mantienen siempre.

**API**:

```javascript
import { log, info, debug, warn, error } from '@/lib/logger';

log('solo en desarrollo'); // no-op en producción
info('solo en desarrollo'); // no-op en producción
debug('solo en desarrollo'); // no-op en producción
warn('siempre visible'); // se muestra en todos los entornos
error('siempre visible'); // se muestra en todos los entornos
```

**Cuándo usar**:

- **log/info/debug**: mensajes de depuración, trazabilidad, logs de flujo.
- **warn/error**: errores reales o advertencias que deban verse en producción.

**Configuración adicional**: `next.config.mjs` incluye `compiler.removeConsole` en producción para eliminar `console.log`/`info`/`debug` del bundle (mantiene `error` y `warn`). Puede no aplicarse con Turbopack; el logger es la alternativa garantizada.

**Archivos que ya lo usan**: `useStore.js`, `fetchWithTenant.js`, `SettingsContext.js`.

**Guía**: Para nuevos logs de depuración, usar `log()` en lugar de `console.log()`.

---

### 1. fetchWithTenant

**Archivo**: `/src/lib/fetchWithTenant.js`

**Funcionalidad**: Wrapper de `fetch` que añade automáticamente header `X-Tenant` basado en subdominio.

**Detección de tenant**:

```javascript
// Cliente
const clientHost = window.location.host;
const parts = clientHost.split('.');
const tenant = isLocal
  ? parts.length > 1 && parts[0] !== 'localhost'
    ? parts[0]
    : 'brisamar'
  : parts[0];

// Servidor
const { headers } = await import('next/headers');
const headersList = headers();
const host = headersList.get('host');
const tenant = host.split('.')[0];
```

**Headers añadidos**:

```javascript
{
  'X-Tenant': tenant,
  'Content-Type': 'application/json',
  'User-Agent': navigator.userAgent
}
```

**Manejo de errores**:

- Detecta errores 401/403 y lanza `Error('No autenticado')`
- Intenta parsear error como JSON
- Si falla, intenta leer como texto
- Maneja errores de autenticación específicamente

**Uso**:

```javascript
import { fetchWithTenant } from '@/lib/fetchWithTenant';

const response = await fetchWithTenant(`${API_URL_V2}orders`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 2. utils.js

**Archivo**: `/src/lib/utils.js`

#### cn

```javascript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

**Funcionalidad**: Merge inteligente de clases CSS con resolución de conflictos de Tailwind

**Características**:

- `clsx`: Combina clases condicionalmente
- `twMerge`: Resuelve conflictos (ej: `p-4 p-2` → `p-2`)

**Uso**:

```javascript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className // Permite override desde props
)}>
```

---

### 3. barcodes.js

**Archivo**: `/src/lib/barcodes.js`

#### eanChecksum

```javascript
export function eanChecksum(digits) {
  const nums = digits.replace(/\D/g, '').split('').map(Number);
  let sum = 0;
  for (let i = nums.length - 1; i >= 0; i--) {
    const n = nums[i];
    sum += n * ((nums.length - i) % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}
```

**Funcionalidad**: Calcula dígito de control para códigos EAN

#### serializeBarcode

```javascript
export function serializeBarcode(value, type) {
  const plain = String(value ?? '');

  switch (type) {
    case 'ean13':
      return plain.replace(/\D/g, '').padStart(12, '0'); // sin checksum

    case 'ean14':
      return plain.replace(/\D/g, '').padStart(13, '0'); // sin checksum

    case 'gs1-128':
      return plain; // mantener paréntesis y estructura GS1 intacta

    default:
      return plain;
  }
}
```

**Funcionalidad**: Serializa valor de código de barras según tipo

**Tipos soportados**:

- `ean13` - EAN-13 (12 dígitos, sin checksum)
- `ean14` - EAN-14 (13 dígitos, sin checksum)
- `gs1-128` - GS1-128 (mantiene formato original)

**formatMap**:

```javascript
export const formatMap = {
  ean13: 'EAN13',
  ean14: 'EAN14',
  'gs1-128': 'CODE128',
};
```

---

## 🔧 Utilidades Específicas del Dominio

### 1. GS1-128 Parsing

**Ubicación**: `/src/hooks/usePallet.js`, `/src/components/Admin/Productions/ProductionInputsManager.jsx`

#### convertScannedCodeToGs1128

```javascript
const convertScannedCodeToGs1128 = (scannedCode) => {
  // Intentar primero con 3100 - kg
  let match = scannedCode.match(/01(\d{14})3100(\d{6})10(.+)/);
  if (match) {
    const [, gtin, weightStr, lot] = match;
    return `(01)${gtin}(3100)${weightStr}(10)${lot}`;
  }

  // Si no coincide, intentar con 3200 - libras
  match = scannedCode.match(/01(\d{14})3200(\d{6})10(.+)/);
  if (match) {
    const [, gtin, weightStr, lot] = match;
    return `(01)${gtin}(3200)${weightStr}(10)${lot}`;
  }

  return null; // No se pudo convertir
};
```

**Funcionalidad**: Convierte código escaneado a formato GS1-128 estándar

**Formatos soportados**:

- Con paréntesis: `(01)12345678901234(3100)001000(10)LOT001`
- Sin paréntesis: `0112345678901234310000100010LOT001`

**Aplicaciones Identificadas (AI)**:

- `(01)` - GTIN (14 dígitos)
- `(3100)` - Peso neto en kg (6 dígitos)
- `(3200)` - Peso neto en libras (6 dígitos)
- `(10)` - Número de lote (variable)

#### getGs1128

```javascript
const getGs1128 = (productId, lot, netWeight) => {
  const boxGtin = getBoxGtinById(productId);
  const formattedNetWeight = netWeight.toFixed(2).replace('.', '').padStart(6, '0');
  return `(01)${boxGtin}(3100)${formattedNetWeight}(10)${lot}`;
};
```

**Funcionalidad**: Genera código GS1-128 desde datos de producto

**Ejemplo**:

```javascript
getGs1128(123, 'LOT-001', 10.5);
// "(01)12345678901234(3100)001050(10)LOT-001"
```

#### getGs1128WithPounds

```javascript
const getGs1128WithPounds = (productId, lot, netWeightInPounds) => {
  const boxGtin = getBoxGtinById(productId);
  const formattedNetWeight = netWeightInPounds.toFixed(2).replace('.', '').padStart(6, '0');
  return `(01)${boxGtin}(3200)${formattedNetWeight}(10)${lot}`;
};
```

**Funcionalidad**: Genera código GS1-128 con peso en libras (AI 3200)

---

### 2. Utilidades de Entity Table

**Ubicación**: `/src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/utils/`

#### getSafeValue

**Archivo**: `getSafeValue.js`

```javascript
export function getSafeValue(value) {
  return value === undefined || value === null ? '-' : value;
}
```

**Funcionalidad**: Retorna "-" para valores null/undefined

#### renderByType

**Archivo**: `renderByType.js`

**Funcionalidad**: Renderiza valor según tipo de columna

**Tipos soportados**:

- `badge` - Renderiza badge
- `button` - Renderiza botones
- `date` - Formatea como fecha (DD/MM/YYYY)
- `dateHour` - Formatea como fecha y hora
- `currency` - Formatea como moneda (1.234,56 €)
- `weight` - Formatea como peso (1.234,56 kg)
- `list` - Renderiza lista
- `id` - Muestra en negrita
- `boolean` - "Sí" / "No"
- `text` - Texto normal

---

## 📊 Estadísticas de Uso

**Total de helpers**:

- Helpers de formateo: 3 archivos (dates, numbers, texts)
- Helpers de utilidad: 4 archivos (getSettingValue, classNames, goBack, dates)
- Helpers de Azure: 1 archivo
- Utilidades de lib: 3 archivos (fetchWithTenant, utils, barcodes)

**Funciones más usadas**:

- `formatDate` - ~50+ usos
- `formatDecimalCurrency` - ~30+ usos
- `formatDecimalWeight` - ~20+ usos
- `cn` - ~4500+ usos
- `fetchWithTenant` - ~100+ usos

---

## 🔄 Patrones de Uso

### 1. Formateo en Tablas

```javascript
import { formatDate, formatDateHour } from "@/helpers/formats/dates/formatDates";
import { formatDecimalCurrency, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";

// En renderByType
case "date":
  return safeValue === "-" ? "-" : formatDate(safeValue);
case "currency":
  return safeValue === "-" ? "-" : formatDecimalCurrency(safeValue);
```

### 2. Búsqueda Normalizada

```javascript
import { normalizeText } from '@/helpers/formats/texts/index';

const searchText = normalizeText(userInput);
const matches = items.filter((item) => normalizeText(item.name).includes(searchText));
```

### 3. Fetch con Tenant

```javascript
import { fetchWithTenant } from '@/lib/fetchWithTenant';

const response = await fetchWithTenant(`${API_URL_V2}orders`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 4. Merge de Clases

```javascript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className
)}>
```

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Código Comentado en barcodes.js

- **Archivo**: `/src/lib/barcodes.js`
- **Línea**: 18-36
- **Problema**: Función `serializeBarcode` antigua comentada
- **Impacto**: Confusión sobre qué versión usar
- **Recomendación**: Eliminar código comentado

### 2. eanChecksum No Se Usa

- **Archivo**: `/src/lib/barcodes.js`
- **Línea**: 1-9
- **Problema**: Función `eanChecksum` definida pero no se usa en `serializeBarcode`
- **Impacto**: Código muerto
- **Recomendación**: Eliminar si no se usa o implementar checksum en serialización

### 3. convertScannedCodeToGs1128 Duplicado

- **Archivo**: `/src/hooks/usePallet.js` y `/src/components/Admin/Productions/ProductionInputsManager.jsx`
- **Problema**: Misma función implementada en dos lugares con ligeras diferencias
- **Impacto**: Mantenimiento difícil, posible inconsistencia
- **Recomendación**: Extraer a helper común en `/src/helpers/barcodes/`

### 4. formatDate Sin Manejo de Errores

- **Archivo**: `/src/helpers/formats/dates/formatDates.js`
- **Línea**: 1-7
- **Problema**: No valida que `date` sea una fecha válida
- **Impacto**: Puede retornar "Invalid Date" o errores
- **Recomendación**: Añadir validación y retornar "-" o null si es inválida

### 5. parseEuropeanNumber Sin Validación

- **Archivo**: `/src/helpers/formats/numbers/formatNumbers.js`
- **Línea**: 36-39
- **Problema**: No valida formato antes de parsear
- **Impacto**: Puede retornar NaN sin feedback claro
- **Recomendación**: Añadir validación de formato

### 6. getSettingValue Sin Manejo de Errores

- **Archivo**: `/src/helpers/getSettingValue.js`
- **Línea**: 5-10
- **Problema**: No maneja errores si `getSettings()` falla
- **Impacto**: Puede lanzar error no manejado
- **Recomendación**: Añadir try-catch y retornar null o valor por defecto

### 7. Caché de Settings Sin TTL

- **Archivo**: `/src/helpers/getSettingValue.js`
- **Problema**: Caché nunca expira automáticamente
- **Impacto**: Settings pueden quedar obsoletos
- **Recomendación**: Añadir TTL o invalidación automática

### 8. classNames vs cn

- **Archivo**: `/src/helpers/styles/classNames.js` y `/src/lib/utils.js`
- **Problema**: Dos funciones similares (`classNames` y `cn`)
- **Impacto**: Confusión sobre cuál usar
- **Recomendación**: Unificar en una sola función (preferiblemente `cn`)

### 9. formatDateShort Usa toLocaleDateString

- **Archivo**: `/src/helpers/formats/dates/formatDates.js`
- **Línea**: 20-26
- **Problema**: Depende de locale del sistema, puede variar
- **Impacto**: Formato inconsistente entre sistemas
- **Recomendación**: Usar `date-fns` para formato consistente

### 10. parseAzureDocumentAIResult Sin Validación

- **Archivo**: `/src/helpers/azure/documentAI/index.js`
- **Problema**: No valida estructura de datos antes de parsear
- **Impacto**: Puede fallar silenciosamente con datos inesperados
- **Recomendación**: Añadir validación de estructura

### 11. fetchWithTenant Con Console.error en Servidor

- **Archivo**: `/src/lib/fetchWithTenant.js`
- **Línea**: 20
- **Problema**: Usa `console.error` en servidor (debería ser `console.log`)
- **Impacto**: Logs confusos
- **Recomendación**: Usar `console.log` o logger apropiado

### 12. Falta de Helper para Formatear Números con Unidad Personalizada

- **Archivo**: `/src/helpers/formats/numbers/formatNumbers.js`
- **Problema**: Solo hay formatos específicos (currency, weight)
- **Impacto**: Difícil formatear con otras unidades
- **Recomendación**: Añadir función genérica `formatDecimalWithUnit(number, unit)`

### 13. normalizeText Sin Preservar Espacios Múltiples

- **Archivo**: `/src/helpers/formats/texts/index.js`
- **Problema**: No normaliza espacios múltiples
- **Impacto**: "José María" no se normaliza correctamente
- **Recomendación**: Añadir `.replace(/\s+/g, ' ')` para normalizar espacios

### 14. Falta de Helper para Validar Fechas

- **Archivo**: `/src/helpers/formats/dates/formatDates.js`
- **Problema**: No hay función para validar si una fecha es válida
- **Impacto**: Código duplicado en múltiples lugares
- **Recomendación**: Añadir `isValidDate(date)` helper

### 15. goBack Sin Validación de Historial

- **Archivo**: `/src/helpers/window/goBack.js`
- **Problema**: No valida si hay historial antes de ir atrás
- **Impacto**: Puede no hacer nada si no hay historial
- **Recomendación**: Añadir validación o redirigir a ruta por defecto
