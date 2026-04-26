# Auditoría: Frontend Performance Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** Frontend Performance Agent
**Scope:** Rendimiento de carga de datos, re-renders, payload de API, comportamiento de loading, bundle size

---

## 1. Archivos inspeccionados

| Archivo | Relevancia |
|---|---|
| `src/services/azure/index.js` | Polling loop — 45 iteraciones |
| `src/exportHelpers/lonjaDeIslaExportHelper.js` | 492 líneas — lógica de generación por fila |
| `src/exportHelpers/common.js` | Helpers de cálculo usados en cada fila |
| `src/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/exportData.js` | Catálogo estático masivo |
| `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js` | Lógica de generación Excel inline |

---

## 2. Bottlenecks identificados

### 2.1 [CRÍTICO] exportData.js de LonjaDeIsla — carga masiva en bundle

```
src/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/exportData.js
```

Este archivo contiene más de **200 entradas de barcos**, datos de vendidurias, productos, servicios, y toda la configuración estática de Lonja de Isla. El explorador reportó ~57K tokens de contenido — potencialmente decenas de KB de JavaScript.

**Problema**: este archivo se importa directamente en `lonjaDeIslaExportHelper.js`:

```javascript
import { barcos, barcosVentaDirecta, datosVendidurias, lonjaDeIsla, ... }
  from '@/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/exportData';
```

Esto significa que **todo el catálogo se incluye en el bundle** del cliente aunque el usuario nunca abra un documento de Lonja de Isla. Next.js solo puede hacer tree-shaking de exportaciones no usadas si el module bundler lo infiere; en este caso, con re-exports, es probable que todo el módulo entre en el bundle.

**Impacto estimado**: si el archivo tiene 200+ objetos con 8-10 campos cada uno, puede representar 50-100KB de datos de catálogo en el bundle comprimido.

**Solución**: mover los catálogos a API Routes o fetch lazy cuando se necesiten. Alternativamente, usar `import()` dinámico en el ExportHelper.

### 2.2 [CRÍTICO] Polling sin AbortController — memoria y red en background

```javascript
// azure/index.js:74-114
do {
    attempts += 1;
    await sleep(defaultPollingDelay);
    // ... fetch ...
} while (status === 'running' || status === 'notStarted');
```

El polling loop usa `sleep()` con `setTimeout` dentro de una `Promise`. No hay `AbortController` ni ningún mecanismo de cancelación.

**Escenario problemático**: el usuario sube un PDF, espera 30 segundos, se aburre y navega a otra pantalla. El polling continúa durante hasta **3.75 minutos adicionales** en background, haciendo peticiones a Azure cada 5 segundos. En modo masivo con múltiples documentos, esto puede multiplicarse.

**Impacto**: peticiones de red innecesarias, posible rate limiting de Azure, coste innecesario si Azure cobra por petición de polling.

### 2.3 [Alta] Modo masivo — concurrencia sin límite

El modo masivo puede iniciar múltiples llamadas a `processDocument()` en paralelo. Si se suben 10 PDFs simultáneamente, se lanzan 10 polling loops concurrentes. Cada uno hace peticiones cada 5 segundos → 10 peticiones cada 5 segundos a Azure.

Con el límite de 45 intentos por documento, en el peor caso hay 450 peticiones de polling antes de que todas terminen (o fallen por timeout).

**Solución**: implementar concurrencia controlada (ej. máximo 3 documentos en paralelo con una queue).

### 2.4 [Media] Re-renders en ExportModal por `useEffect` con dependencia shallow

```javascript
// ExportModal/index.js:178-205
useEffect(() => {
    const initialSelection = groupedLinkedSummary...;
    setSelectedLinks(initialSelection);
    validatePurchases(groupedLinkedSummary)...;
}, [groupedLinkedSummary.length]);
```

`groupedLinkedSummary` se recalcula en cada render como `Object.values(subastasGroupedByBarco)` — es una nueva referencia en cada render. La dependencia `[groupedLinkedSummary.length]` solo es estable en número, pero si la referencia cambia sin cambiar el length, el `useEffect` no se re-ejecuta (correcto), pero si el array sí cambia de contenido con el mismo length, tampoco se re-ejecuta (potencial bug).

Más importante: `groupedLinkedSummary` y `subastasGroupedByBarco` se calculan en el cuerpo del componente con `reduce` en cada render. Para documentos con 50+ subastas, esto puede ser costoso.

**Solución**: memoizar `groupedLinkedSummary` con `useMemo`.

### 2.5 [Media] Import dinámico de xlsx en tiempo de exportación — correcto

```javascript
// ExportModal/index.js:51
const [XLSX, { saveAs }] = await Promise.all([import('xlsx'), import('file-saver')]);
```

El import dinámico es correcto — `xlsx` y `file-saver` no se incluyen en el bundle principal. Solo se cargan cuando el usuario hace clic en "Exportar". Esto es un buen patrón que debería replicarse en los otros ExportModals.

### 2.6 [Baja] `calculateImporteFromLinea` — comparaciones redundantes por fila

```javascript
// common.js:70-96
export function calculateImporteFromLinea(linea, weightKey = 'kilos') {
    const declaredImporteRaw = linea?.importe;
    const hasDeclaredImporte = ... // String(declaredImporteRaw).trim() !== ''
    const computedImporte = calculateImporte(...);
    // ...
}
```

Esta función se llama para cada fila de subasta. Para documentos con 100+ líneas, la doble computación (computedImporte + declaredImporte) se ejecuta en cada fila. Es negligible en términos de tiempo de CPU, pero es un patrón de "calcular dos veces y elegir" que podría simplificarse.

---

## 3. Prioridad de correcciones

| Prioridad | Bottleneck | Solución mínima |
|---|---|---|
| P0 | exportData.js masivo en bundle | Lazy import o mover a API Route |
| P0 | Polling sin AbortController | Añadir AbortController con cleanup en useEffect |
| P1 | Concurrencia sin límite en modo masivo | Queue con límite de 3 paralelos |
| P2 | `groupedLinkedSummary` recalculado en cada render | `useMemo` |
| P3 | `calculateImporteFromLinea` doble cálculo | Simplificar lógica |

---

## 4. Riesgos de performance

- **Coste de Azure**: el polling sin cancel puede generar peticiones innecesarias que cuestan dinero real
- **Rate limiting**: el modo masivo sin control de concurrencia puede disparar el rate limit de Azure (429)
- **Bundle size**: si se añaden más lonjas con catálogos estáticos, el problema del bundle crece linealmente
- **UX de espera**: sin indicador de progreso real (solo "procesando..."), el usuario no sabe si el proceso está avanzando o colgado. El tiempo máximo de espera es de >10 minutos sin ningún feedback de progreso parcial.

---

## 5. Comprobaciones manuales

- [ ] Abrir DevTools → Network, subir un PDF de LonjaDeIsla — verificar que no hay peticiones a Azure cada 5s durante más de 5 minutos
- [ ] Navegar a otra pantalla durante el procesamiento — verificar en Network que el polling se detiene
- [ ] Subir 5 PDFs en modo masivo — verificar en Network que no se lanzan 5 polling loops concurrentes sin control
- [ ] Verificar el tamaño del bundle: `next build --debug` y buscar el tamaño de los chunks que incluyen `exportData`
- [ ] Medir tiempo de render del ExportModal con un documento de 50+ subastas en React DevTools Profiler
