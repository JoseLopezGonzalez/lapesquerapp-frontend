# Bloque 8 — Producciones — Análisis

**Estado**: Completado  
**Última actualización**: 2026-02-15

---

## 1. Alcance del bloque

- **Listado**: `/admin/productions` → EntityClient (config `productions`).
- **Detalle de producción**: `/admin/productions/[id]` → ProductionClient → **ProductionView** (744 líneas).
- **Crear record**: `/admin/productions/[id]/records/create` → CreateProductionRecordPage.
- **Editar record**: `/admin/productions/[id]/records/[recordId]` → ProductionRecordClient → **ProductionRecordEditor** (dentro de ProductionRecordProvider).

Entidades y flujos involucrados: Production, ProductionRecord, Process (tipos de proceso), ProductionInput, ProductionOutput, ProductionOutputConsumption, costes, diagrama, conciliación, totales.

---

## 2. Inventario de archivos (por tamaño y rol)

### Rutas App

| Ruta | Componente principal |
|------|----------------------|
| `/admin/productions` | EntityClient (listado) |
| `/admin/productions/[id]` | ProductionView |
| `/admin/productions/[id]/records/create` | CreateProductionRecordPage → ProductionRecordEditor (modo crear) |
| `/admin/productions/[id]/records/[recordId]` | ProductionRecordEditor (modo editar) |

### Servicios

| Archivo | Líneas | Uso |
|---------|--------|-----|
| `src/services/productionService.js` | 690 | Todas las llamadas API de producciones: getProduction, getProductionProcessTree, getProductionTotals, getProductionRecord, createProductionRecord, updateProductionRecord, getProductionRecordsOptions, getProductionInputs, createProductionInput, createMultipleProductionInputs, deleteProductionInput, getProductionOutputs, createProductionOutput, deleteProductionOutput, getProductionRecordSourcesData, consumptions, costs, reconciliation, etc. |
| `src/services/domain/productions/productionService.js` | ~88 | EntityClient list (list, getById, create, update, delete, getOptions). |
| `src/services/costService.js` | (existente) | Costes. |

### Hooks

| Archivo | Líneas | Patrón |
|---------|--------|--------|
| `src/hooks/useProductionRecord.js` | 231 | **useEffect + useState**. Carga production, record, processes (fetch processes/options), existingRecords; saveRecord con create/update; refresh. |
| `src/hooks/production/useProductionData.js` | 164 | **useEffect + useState**. Hook genérico para inputs/outputs/consumptions: loadData, initialData del contexto, updateContext. |

### Contexto

| Archivo | Líneas | Rol |
|---------|--------|-----|
| `src/context/ProductionRecordContext.js` | 254 | ProductionRecordProvider usa useProductionRecord; expone updateInputs, updateOutputs, updateConsumptions (optimistic + rollback), updateRecord, recordInputs, recordOutputs, recordConsumptions. |

### Componentes (ordenados por líneas)

| Componente | Líneas | Prioridad |
|------------|--------|-----------|
| ProductionInputsManager.jsx | **2339** | P0 crítico |
| ProductionOutputsManager.jsx | **1859** | P0 crítico |
| ProductionOutputConsumptionsManager.jsx | **1501** | P0 crítico |
| ProductionView.jsx | 744 | P0 |
| productionService.js | 690 | Refactor/TS |
| diagramTransformers.js | 609 | Util |
| ProductionRecordImagesManager.jsx | 525 | P0 |
| ProductionRecordsManager.jsx | 447 | P0 |
| ProductionCostsManager.jsx | 419 | P0 |
| ProductionDiagram/index.jsx | 340 | P0 |
| CostCatalogManager.jsx | 348 | P0 |
| CostSourceSelector.jsx | 263 | P1 |
| CostBreakdownView.jsx | 239 | P1 |
| ProductionRecordEditor.jsx | 151 | OK |
| useProductionData.js | 164 | Migrar a RQ |
| useProductionRecord.js | 231 | Migrar a RQ |
| ProductionRecordContext.js | 254 | Depende de useProductionRecord |
| CostDisplay.jsx | 62 | OK |

### Helpers

- `src/helpers/production/normalizers.js` — normalizeProduction, normalizeProductionRecord, normalizeProductionInput, normalizeProductionOutput, etc.
- `src/helpers/production/formatters.js`, `recordHelpers.js`, `costFormatters.js`, `costNormalizers.js`, `dateFormatters.js`, `calculateTotals.js`.

---

## 3. Patrones actuales y desviaciones

### Data fetching

- **ProductionView**: un solo `useEffect` que llama en paralelo a `getProduction`, `getProductionProcessTree`, `getProductionTotals`; guarda en `useState`; sin React Query; sin caché ni invalidación.
- **useProductionRecord**: varias cargas con `useEffect` y callbacks (loadProcesses, loadExistingRecords, loadInitialData); `getProduction`, `getProductionRecord`, `getProductionRecordsOptions`, fetch directo a `processes/options`; sin React Query.
- **useProductionData**: sincroniza con `initialData` del contexto y opcionalmente `loadData(token, recordId)`; useEffect; sin React Query.
- **EntityClient** (listado): ya analizado; useEffect + entityService.list.

### Formularios

- ProductionRecordEditor usa react-hook-form; hay schemas en hooks (useRecordFormData, useRecordFormSubmission). Verificar si hay Zod en create/edit record.

### TypeScript

- Todo el bloque en JavaScript. productionService.js sin tipos. Normalizers y helpers en JS.

### Riesgos

1. **Componentes gigantes** (Inputs 2339, Outputs 1859, Consumptions 1501): imposibles de mantener y testear sin extracción.
2. **Sin caché**: cada entrada en detalle de producción recarga todo; no hay invalidación coordinada entre ProductionView y ProductionRecordEditor.
3. **Duplicidad de carga**: processes/options se pide en useProductionRecord con fetch directo; no hay hook reutilizable tipo useProcessOptions.
4. **productionService.js** muy grande (690 líneas) y monolítico.

---

## 4. Dependencias cruzadas

- ProductionView → ProductionRecordsManager, ProductionDiagram; usa getProduction, getProductionProcessTree, getProductionTotals.
- ProductionRecordEditor → ProductionRecordProvider → useProductionRecord; ProductionInputsManager, ProductionOutputsManager, ProductionOutputConsumptionsManager usan ProductionRecordContext y/o useProductionData.
- Varios componentes usan getProductOptions (productService) para salidas.

---

## 5. Resumen para planificación

- Introducir **React Query** en: (1) detalle de producción (ProductionView): un hook `useProductionDetail(productionId)` que agrupe getProduction + processTree + totals; (2) useProductionRecord: useQuery para production, record, processes, existingRecords; useMutation para saveRecord; (3) useProcessOptions como hook React Query para `processes/options`.
- **Tipos**: definir interfaces para Production, ProductionRecord, Process, ProductionInput, ProductionOutput (y opc. consumptions) en `src/types/production.ts`; tipar las funciones principales de productionService (o crear capa TS que reexporte).
- **Reducción de componentes**: prioridad en ProductionInputsManager, ProductionOutputsManager, ProductionOutputConsumptionsManager (extraer subcomponentes, hooks de tabla/formulario, secciones por pestaña).
- **ProductionRecordContext**: mantener; puede seguir usando useProductionRecord cuando este pase a React Query (el hook devolvería datos de las queries y mutaciones).
- **Validación**: asegurar Zod en formularios de record create/edit si no está.

Referencias: `docs/audits/nextjs-frontend-global-audit.md`, `docs/prompts/02_Nextjs frontend evolution prompt.md`.
