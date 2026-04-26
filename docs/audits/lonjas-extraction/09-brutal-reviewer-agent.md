# Auditoría: Brutal Reviewer Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** Brutal Reviewer Agent
**Scope:** Todo el bloque — sin diplomacia, sin priorizar relaciones, priorizando riesgos reales

---

## 1. Qué es débil

### 1.1 La API key de Azure está en el bundle del navegador

```javascript
const apiKey = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY;
```

Esto no es un riesgo teórico. Cualquier usuario que abra las herramientas de desarrollador del navegador puede ver la API key de Azure Document AI de la empresa en el código fuente. Con esa key puede:
- Llamar a Azure Document AI en nombre de la empresa
- Consumir créditos de Azure sin límite
- Extraer documentos arbitrarios contra el modelo entrenado de la empresa

`NEXT_PUBLIC_` significa "expuesto en el cliente". No hay ninguna circunstancia en la que una API key de un servicio de pago deba ser `NEXT_PUBLIC_`.

**Este es el problema más importante del bloque y debe corregirse antes de cualquier otra cosa.**

### 1.2 No hay tests para los módulos que generan dinero

Los `exportHelpers` generan las filas Excel que se importan en A3ERP y producen asientos contables. Son el corazón financiero del bloque. No tienen ni un solo test:

- `cofraExportHelper.js` — sin tests
- `lonjaDeIslaExportHelper.js` (492 líneas) — sin tests
- `asocExportHelper.js` — sin tests

Si se añade un barco mal en `exportData.js`, si se cambia una línea del parser, si se modifica un cálculo de precio — nada lo detecta automáticamente. El único control de calidad es que alguien abra el Excel resultante y lo revise a ojo.

Para un sistema que maneja datos financieros que entran en el ERP de la empresa, esto es inaceptable.

### 1.3 `common.js` duplica `BaseParser` con comportamiento diferente

```javascript
// BaseParser.parseDecimalValue — lanza ParsingError
// common.js:parseDecimalValue — retorna 0 silenciosamente
```

Hay dos funciones `parseDecimalValue` en el sistema con el mismo nombre y propósito pero comportamientos opuestos. `BaseParser` lanza error ante valores inválidos. `common.js` retorna 0 en silencio.

¿Cuál es correcto? No lo sabemos. Probablemente ninguno de los dos es siempre correcto — depende del contexto. Pero tener dos implementaciones divergentes garantiza que en algún momento se use la incorrecta en el contexto equivocado.

Nadie documentó por qué `common.js` existe como copia de `BaseParser` con diferente comportamiento. Es una trampa esperando a que alguien asuma que son equivalentes.

---

## 2. Qué es confuso

### 2.1 Tres parsers, tres convenciones de keys

- **Cofra**: transforma todas las keys de inglés a español (`details → detalles`, `tables → tablas`, `subastas`, `servicios`)
- **LonjaDeIsla**: mantiene las keys en inglés de Azure (`details`, `tables`, `ventas`, `peces`, `vendidurias`)
- **ASOC**: mantiene las keys en inglés de Azure

No hay ningún comentario ni documento que explique por qué Cofra es diferente. ¿Fue una decisión consciente? ¿Un mistake? ¿Un refactor a medias? Un desarrollador nuevo no puede saberlo.

El resultado práctico: para trabajar en cualquiera de los tres parsers, hay que leer el código completo para entender si el resultado usa keys en inglés o español. No hay forma de saberlo sin inspeccionar.

### 2.2 `isLonjaDeIslaSubastaDocument` determina el tipo de venta por si contiene "cinta"

```javascript
// lonjaDeIslaExportHelper.js:37-40
export function isLonjaDeIslaSubastaDocument(document) {
    const tipoVentas = document?.tables?.tipoVentas || [];
    return tipoVentas.some((row) =>
        normalizeText(row?.descripcion || '').includes('cinta')
    );
}
```

El tipo de venta (SUBASTA vs CONTRATO) se determina buscando la palabra "cinta" en la descripción del tipo de venta. Esta es una regla de negocio completamente opaca hardcodeada en el código. Si la lonja cambia su nomenclatura, el sistema clasifica silenciosamente todos los documentos como CONTRATO. No hay warning, no hay validación explícita.

### 2.3 El ExportModal de Cofra tiene lógica de negocio de exportación A3ERP (150 líneas)

```javascript
// AlbaranCofraWeb/ExportModal/index.js:50-143
const generateExcelForA3erp = async () => { ... }
```

Hay un `cofraExportHelper.js`. La lógica de exportación a A3ERP debería estar ahí. En cambio, 150 líneas de lógica de generación Excel viven en el componente UI. Esto hace que:
- Sea imposible testear la lógica de exportación sin renderizar el componente
- La misma lógica tenga dos ubicaciones posibles dependiendo del contexto
- Un cambio en la estructura de filas A3ERP requiere buscar en dos sitios

### 2.4 `getValidationStatus` construye la key de validación con transformación de fecha frágil

```javascript
// ExportModal/index.js:209
const key = `${linea.supplierId}_${linea.date.split('/').reverse().join('-')}`;
```

La key de lookup en el mapa de validación depende de transformar el formato de fecha de la UI (DD/MM/YYYY asumido) a ISO (YYYY-MM-DD). Si el OCR extrae la fecha en un formato diferente, la key es incorrecta y la validación no se muestra sin ningún error visible.

---

## 3. Qué está sobrecomplicado

### 3.1 Los catálogos estáticos `exportData.js` no deberían existir en el frontend

Los archivos `exportData.js` contienen CIFs, códigos A3ERP, matrículas de barcos, nombres de armadores — datos maestros del negocio. Estos datos:
- Cambian cuando se añade un nuevo barco o armador a la flota
- Son dependientes del tenant (Brisamar tiene sus barcos, otro cliente tendría los suyos)
- Deben ser consistentes con los datos del backend

Guardar estos datos en el frontend como arrays JavaScript hardcodeados es un anti-patrón. Cuando el backend tiene la entidad `barcos` con todos estos datos, el frontend debería consultarla. No hay razón técnica para que existan en dos lugares.

La razón histórica probable: fue más rápido escribirlos aquí que implementar un endpoint. Ahora son una deuda técnica que crece con cada barco nuevo añadido.

El archivo `ListadoComprasLonjaDeIsla/exportData.js` con 200+ barcos es la manifestación más extrema de este problema.

### 3.2 El polling manual de Azure es innecesariamente frágil

```javascript
// azure/index.js:74-114
do {
    attempts += 1;
    await sleep(defaultPollingDelay);
    // ...
} while (status === 'running' || status === 'notStarted');
```

Este loop tiene:
- Delay fijo de 5 segundos (no exponential backoff)
- Rate limit handling basado en regex sobre mensajes de error
- Sin AbortController
- Sin timeout user-visible
- Máximo 45 intentos hardcodeado

Azure Document AI SDK tiene un cliente oficial en JavaScript (`@azure/ai-form-recognizer`) que maneja todo esto correctamente con polling, retry, AbortSignal y tipos TypeScript. Se está reinventando la rueda de forma menos robusta.

### 3.3 `calculateImporteFromLinea` — lógica de "fuente de verdad doble"

```javascript
// common.js:70-96
if (declaredImporte === 0 && computedImporte > 0) {
    return computedImporte;
}
return declaredImporte;
```

Esta función intenta resolver el problema de que Azure a veces extrae el importe incorrectamente (0 cuando debería ser positivo). La solución es elegir entre el importe declarado y el calculado según reglas implícitas.

Este es un workaround para un fallo de OCR. El problema correcto a resolver es mejorar el modelo de Azure o añadir validación explícita que alerte cuando el importe declarado difiere significativamente del calculado. La lógica actual puede silenciosamente usar el valor incorrecto sin notificarlo.

---

## 4. Qué debería eliminarse o reducirse

| Elemento | Por qué | Alternativa |
|---|---|---|
| `NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY` | API key pública es inaceptable | API Route server-side |
| `exportData.js` × 3 | Datos de backend en el frontend | Endpoint `/api/v2/barcos/export-data` |
| `common.js:parseDecimalValue` | Duplicado de `BaseParser` con semántica diferente | Un solo helper con parámetro `silent: boolean` |
| `generateExcelForA3erp` en ExportModal | Lógica de negocio en componente UI | Mover a `cofraExportHelper.js` |
| Polling manual de Azure | Más frágil que el SDK oficial | Usar `@azure/ai-form-recognizer` SDK |
| Opciones "Facilcom" y "Otros" en Select | No implementadas, confunden al usuario | Eliminar hasta implementar |

---

## 5. Qué debe corregirse primero

**Orden de prioridad sin compromiso:**

1. **Mover la API key de Azure a servidor** — es un problema de seguridad activo en producción
2. **Añadir tests para los tres exportHelpers** — es un problema de integridad financiera sin tests
3. **Eliminar o comentar las opciones no implementadas** del Select (Facilcom, Otros) — confunden al usuario hoy
4. **Documentar la convención de keys** de los parsers (español vs inglés) — o unificarlos
5. **Mover `generateExcelForA3erp`** al `cofraExportHelper.js` donde corresponde

---

## 6. Recomendación final

El bloque MarketDataExtractor tiene un flujo principal que funciona y aporta valor real al negocio (extracción de documentos de lonjas para importación en A3ERP). Eso está bien.

Sin embargo, tiene dos problemas estructurales que deben atenderse:

**Seguridad**: la API key expuesta en el cliente no es una deuda técnica futura — es un problema activo. Si alguien ya ha inspeccionado el bundle de producción, la key ya puede estar comprometida.

**Fiabilidad financiera**: sin tests en los exportHelpers, el sistema es vulnerable a errores silenciosos en datos que van directamente al ERP. Cada vez que se modifica `exportData.js` (lo cual ocurre frecuentemente según el historial de commits), hay riesgo de que la exportación sea incorrecta sin que nadie lo detecte hasta que aparezca un descuadre contable.

El resto de los problemas son deuda técnica real pero manejable. Estos dos son riesgos operativos activos.
