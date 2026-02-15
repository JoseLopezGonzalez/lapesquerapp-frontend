# Bloque 8 — Producciones — Plan incremental

**Estado**: En ejecución  
**Última actualización**: 2026-02-15

---

## Criterios

- Bloques reversibles; verificación manual o con tests.
- Sin cambios de UI/UX (textos, layout, flujos) salvo correcciones de a11y/responsive.
- React Query para server state; tipos en TypeScript donde se toque código nuevo o servicios clave.

---

## Fase 1 — Base de datos y detalle de producción

### Bloque 8.1 — Tipos TypeScript para Production y ProductionRecord

- Crear `src/types/production.ts` con interfaces: Production (id, lot, openedAt, closedAt, species, captureZone, reconciliation, totals, etc.), ProductionRecord (según normalizers), Process, ProductionInput, ProductionOutput (mínimo necesario para hooks).
- Opcional: tipos para process-tree y totals según uso en ProductionView.
- No cambiar aún producciónService.js; solo añadir tipos para uso en hooks.

### Bloque 8.2 — useProductionDetail (React Query) y uso en ProductionView

- Crear hook `useProductionDetail(productionId)` que:
  - use `useQuery` con queryKey `['productions', 'detail', tenantId, productionId]`.
  - En queryFn llame en paralelo a getProduction, getProductionProcessTree, getProductionTotals (misma lógica que hoy en loadProductionData).
  - Devuelva `{ production, processTree, totals, isLoading, error, refetch }`.
- Sustituir en ProductionView el useState + useEffect + loadProductionData por useProductionDetail.
- Mantener mismo manejo de loading/error y misma UI.
- Verificación: pantalla detalle de producción igual; refetch al volver a la pestaña o tras acción (si se invalida la query).

### Bloque 8.3 — useProcessOptions (React Query)

- Crear hook `useProcessOptions()` que llame a `processes/options` con useQuery (queryKey tenant-aware).
- Sustituir en useProductionRecord la carga de processes (loadProcesses con fetch directo) por useProcessOptions cuando migremos useProductionRecord a React Query (Bloque 8.4).

---

## Fase 2 — useProductionRecord con React Query

### Bloque 8.4 — useProductionRecord migrado a React Query y mutaciones

- **Queries**:
  - useQuery producción: `['productions', 'detail', tenantId, productionId]` o reutilizar useProductionDetail si solo se necesita production (evitar duplicar getProduction).
  - useQuery record (si recordId): getProductionRecord → queryKey `['productionRecords', recordId]`.
  - useQuery processes: useProcessOptions (Bloque 8.3).
  - useQuery existingRecords: getProductionRecordsOptions → queryKey `['productionRecords', 'options', productionId, recordId]`.
- **Mutaciones**:
  - useMutation createProductionRecord / updateProductionRecord; onSuccess invalidar `['productionRecords']`, `['productions', 'detail', productionId]` y opcionalmente llamar a onRefresh.
- Mantener la misma API del hook (record, production, processes, existingRecords, saveRecord, refresh, loading, saving, error) para no romper ProductionRecordContext ni ProductionRecordEditor.
- Verificación: crear y editar record desde UI; totales y contexto actualizados.

### Bloque 8.5 — Invalidación coordinada

- Cuando se crea/actualiza/elimina record, inputs, outputs o consumptions, invalidar queries de production detail y del record para que ProductionView y diagrama se actualicen.
- Revisar que ProductionRecordContext.updateRecord/updateInputs/updateOutputs/updateConsumptions sigan funcionando (pueden seguir llamando a refetch del hook o a invalidateQueries).

---

## Fase 3 — Componentes críticos (reducción de tamaño)

### Bloque 8.6 — ProductionInputsManager: extracción de hooks y subcomponentes

- Objetivo: bajar de 2339 a &lt; 400 líneas por archivo (varios archivos).
- Extraer: hook useProductionInputsManager (estado de tabla, selección, carga de boxes, createMultipleProductionInputs, deleteProductionInput).
- Extraer subcomponentes: tabla de inputs, fila de input, modal/dialog de añadir cajas, barra de acciones.
- Mantener misma UI y flujos.

### Bloque 8.7 — ProductionOutputsManager: extracción de hooks y subcomponentes

- Objetivo: bajar de 1859 líneas.
- Extraer hook useProductionOutputsManager y subcomponentes (tabla outputs, formulario de creación, etc.).
- Mantener misma UI.

### Bloque 8.8 — ProductionOutputConsumptionsManager: extracción

- Objetivo: bajar de 1501 líneas.
- Misma estrategia: hook + subcomponentes.
- Mantener misma UI.

---

## Fase 4 — Cierre y documentación

### Bloque 8.9 — productionService: tipado y opcional división

- Añadir tipos a las funciones más usadas (getProduction, getProductionRecord, createProductionRecord, etc.) creando `productionService.types.ts` o migrando a `productionService.ts` gradualmente.
- Opcional: dividir productionService.js en módulos (productions, production-records, production-inputs, production-outputs) si facilita mantenimiento; sin romper imports existentes (reexportar desde index).

### Bloque 8.10 — Tests y CORE 9/10

- Añadir tests (Vitest) para useProductionDetail, useProductionRecord (queries y mutaciones), useProcessOptions.
- Actualizar `docs/00_CORE CONSOLIDATION PLAN` Bloque 8 a **9/10** con nota de lo realizado.

---

## Orden de ejecución recomendado

1. **8.1** — Tipos production.ts  
2. **8.2** — useProductionDetail + ProductionView  
3. **8.3** — useProcessOptions  
4. **8.4** — useProductionRecord con React Query + mutaciones  
5. **8.5** — Invalidación coordinada (integrar en 8.4 si es posible)  
6. **8.6–8.8** — Reducción Inputs/Outputs/Consumptions (por tiempo, al menos uno completo o parcial)  
7. **8.9** — Tipado productionService (mínimo)  
8. **8.10** — Tests mínimos + CORE 9/10  

Con 8.1–8.5 y 8.9–8.10 el bloque queda estable, con React Query y tipado suficiente para 9/10. 8.6–8.8 mejoran mantenibilidad a medio plazo.
