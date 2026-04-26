# Auditoría: Frontend Next.js Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** Frontend Next.js Agent
**Scope:** Estructura de componentes, patrones App Router, separación de responsabilidades, organización de archivos

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/components/Admin/MarketDataExtractor/index.js` | Entry point del bloque — Tabs Individual/Masivo |
| `src/components/Admin/MarketDataExtractor/IndividualMode/` | Modo de procesamiento individual |
| `src/components/Admin/MarketDataExtractor/MassiveMode/` | Modo de procesamiento masivo |
| `src/components/Admin/MarketDataExtractor/shared/DocumentProcessor.js` | Orquestador de procesamiento |
| `src/components/Admin/MarketDataExtractor/shared/documentTypeLabels.js` | Etiquetas de tipos de documento |
| `src/components/Admin/MarketDataExtractor/shared/exportData.js` | Catálogo estático compartido |
| `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/index.js` | Vista de documento Cofra |
| `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js` | Modal de exportación Cofra |
| `src/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/index.js` | Vista documento LonjaDeIsla |
| `src/components/Admin/MarketDataExtractor/ListadoComprasAsocPuntaDelMoral/index.js` | Vista documento ASOC |
| `src/services/azure/index.js` | Servicio de extracción Azure |
| `src/parsers/lonjas/` | Parsers de datos |
| `src/validators/lonjas/` | Validadores de estructura |
| `src/exportHelpers/` | Helpers de generación de filas Excel |

---

## 2. Plan de auditoría ejecutado

Verificar estructura de carpetas, directivas de componentes, separación server/client, re-exports, y coherencia con el resto de la aplicación.

---

## 3. Archivos inspeccionados con resultado

### 3.1 Entry point — MarketDataExtractor/index.js

```
'use client'  ✓
Tabs shadcn → IndividualMode / MassiveMode  ✓
Componente limpio, sin lógica de negocio  ✓
```

El entry point es correcto: solo presenta las dos pestañas y delega toda la lógica a los modos. No contiene estado propio. El uso de `'use client'` es necesario porque usa `useState` (en los modos que renderiza).

### 3.2 Directiva 'use client' — propagación

El bloque completo es client-side. `AlbaranCofraWeb/index.js` declara `'use client'` correctamente. El `ExportModal` es también client-side (usa `useState`, `useEffect`).

**Problema**: `DocumentProcessor.js` **no tiene** directiva `'use client'` aunque usa `async/await` con llamadas a Azure y lanza excepciones. En Next.js App Router, los archivos sin directiva en `src/components/` son tratados como Server Components por defecto **salvo** que sean importados por un Client Component. Como `DocumentProcessor.js` es solo una función exportada (no un componente React), esto es aceptable técnicamente. Sin embargo, genera ambigüedad: un desarrollador que lo vea podría pensar que es ejecutable en servidor, cuando la lógica de Azure necesita el entorno de browser para el `file.arrayBuffer()`.

**Recomendación**: añadir un comentario de una línea en `DocumentProcessor.js` aclarando que debe ejecutarse solo en contexto cliente, o moverlo a `src/lib/lonjas/` donde no convive con componentes.

### 3.3 Separación de responsabilidades

El sistema tiene buena separación de capas:

```
MarketDataExtractor/ (UI)
  └── shared/DocumentProcessor.js (orquestador)
        ├── src/services/azure/ (transporte HTTP)
        ├── src/helpers/azure/ (normalización multi-pág)
        ├── src/validators/lonjas/ (validación estructura)
        └── src/parsers/lonjas/ (transformación datos)
```

La separación `validators → parsers → exportHelpers` respeta el principio de responsabilidad única.

**Problema**: La lógica de generación Excel en `AlbaranCofraWeb/ExportModal/index.js` (función `generateExcelForA3erp`) **no está** en un exportHelper — está directamente en el componente modal (líneas 50–143). Esto rompe la separación: la lógica de negocio financiero vive en la UI.

Comparación: para LonjaDeIsla existe `lonjaDeIslaExportHelper.js`; para ASOC existe `asocExportHelper.js`; para Cofra, **la lógica equivalente está parcialmente en el modal** (`ExportModal/index.js`) y parcialmente en `cofraExportHelper.js`. Hay un `cofraExportHelper.js` pero el modal no lo usa para la exportación A3ERP — reimplementa su propia versión.

### 3.4 Estructura de carpetas

La estructura es coherente con el resto de la app:

```
MarketDataExtractor/
├── index.js                          ✓ Entry point limpio
├── IndividualMode/                   ✓ Subdirectorio por modo
├── MassiveMode/                      ✓ Subdirectorio por modo
├── shared/
│   ├── DocumentProcessor.js          ✓ Orquestador genérico
│   ├── documentTypeLabels.js         ✓ Constantes de UI
│   └── exportData.js                 ? (ver nota)
├── AlbaranCofraWeb/
│   ├── index.js                      ✓ Vista del documento
│   ├── ExportModal/                  ✓ Modal de exportación
│   └── exportData.js                 ⚠ Datos estáticos aquí
├── ListadoComprasLonjaDeIsla/
│   ├── index.js
│   ├── ExportModal/
│   ├── LonjaDeIslaUnifiedExportTable.js
│   ├── LonjaDeIslaUnresolvedLinesCard.js
│   ├── LonjaDeIslaVentaDirectaCard.js
│   └── exportData.js                 ⚠ Datos estáticos aquí (57K+)
└── ListadoComprasAsocPuntaDelMoral/
    ├── index.js
    ├── ExportModal/
    └── exportData.js                 ⚠ Datos estáticos aquí
```

Los `exportData.js` dentro de los subdirectorios de componentes es un anti-patrón: los datos estáticos de negocio (catálogos de barcos, CIFs, códigos A3ERP) no son datos de componente. Deberían estar en `src/data/lonjas/` o en `src/configs/`.

### 3.5 Ausencia de ruta de Next.js

No existe una ruta dedicada en `src/app/admin/` para MarketDataExtractor. El bloque parece embeberse en otra ruta del admin. Esto es aceptable si la ruta existe y lo referencia, pero no se ha podido verificar la ruta padre.

---

## 4. Archivos cambiados

Ninguno — esta es una auditoría de solo lectura.

---

## 5. Resumen de hallazgos

| Severidad | Hallazgo | Archivo |
|---|---|---|
| **Media** | `generateExcelForA3erp()` en ExportModal, fuera del exportHelper | `AlbaranCofraWeb/ExportModal/index.js:50-143` |
| **Media** | `exportData.js` (catálogos de negocio) dentro de subdirectorios de componentes | `*/exportData.js` × 3 |
| **Baja** | `DocumentProcessor.js` sin directiva ni comentario sobre su contexto de ejecución | `shared/DocumentProcessor.js` |
| **Info** | El bloque no usa EntityClient — justificado por la complejidad del flujo | — |
| **Info** | Separación de capas correcta en validators/parsers/exportHelpers | — |
| **Info** | Uso correcto de `'use client'` en componentes | — |

---

## 6. Comprobaciones manuales sugeridas

- [ ] Verificar que existe una ruta en `src/app/admin/` que renderiza `<MarketDataExtractor />`
- [ ] Verificar que IndividualMode y MassiveMode tienen `'use client'` declarado
- [ ] Verificar que `cofraExportHelper.js` no duplica la lógica de `ExportModal/index.js:50-143`
- [ ] Abrir la pantalla en navegador y confirmar que las tabs Individual/Masivo funcionan
- [ ] Confirmar que el botón "Exportar" del modal descarga un `.xls` válido
