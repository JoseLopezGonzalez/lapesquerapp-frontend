# STEP 2 — Bloque Dashboard: Cambios propuestos (Sub-bloque 1)

**Fecha**: 2026-02-15  
**Sub-bloque**: 1 — TotalQuantitySoldCard + TotalAmountSoldCard  
**Estado**: Pendiente aprobación del usuario

---

## 1. Mejoras a aplicar

1. **Crear hook `useOrdersStats`** en `src/hooks/useOrdersStats.js` (o `.ts` si migramos a TS):
   - `useOrdersTotalNetWeightStats()` — encapsula React Query para `getOrdersTotalNetWeightStats`
   - `useOrdersTotalAmountStats()` — encapsula React Query para `getOrdersTotalAmountStats`
   - QueryKey incluyendo tenantId (cuando useTenant exista; por ahora getCurrentTenant)
   - Date range: año en curso (1 ene → hoy) — igual que hoy

2. **Migrar TotalQuantitySoldCard**:
   - Sustituir useEffect + useState por `useOrdersTotalNetWeightStats()`
   - Mantener UI idéntica (loading, empty, populated, trend badge)
   - Eliminar import directo de orderService en el componente

3. **Migrar TotalAmountSoldCard**:
   - Sustituir useEffect + useState por `useOrdersTotalAmountStats()`
   - Mantener UI idéntica
   - Eliminar import directo de orderService en el componente

---

## 2. Impacto esperado

- **Consistencia**: Alineado con useStockStats y requisito de React Query
- **Caché**: Datos cacheados por React Query; menos requests duplicados si ambas cards se montan juntas
- **Invalidación**: Posibilidad futura de invalidar al crear/editar pedidos
- **Mantenibilidad**: Lógica de fetching centralizada en hooks

---

## 3. Riesgo

- **Bajo**: Cambio estructural; no se modifica lógica de negocio ni UI
- **Regresión**: Misma fecha range y misma API; comportamiento debe ser idéntico

---

## 4. Plan de verificación

- [ ] Compilación sin errores
- [ ] Linter sin errores
- [ ] Dashboard carga correctamente
- [ ] TotalQuantitySoldCard muestra datos y trend
- [ ] TotalAmountSoldCard muestra datos y tooltip
- [ ] Estados loading y "Sin datos" funcionan
- [ ] React Query DevTools muestra queries correctas

---

## 5. Plan de rollback

```bash
git revert <commit-hash>
```

---

## 6. Cambios que rompen

- Ninguno: mismas props (ninguna), misma API, misma UI

---

## 7. Gap tras sub-bloque 1

Rating después estimado: **6/10** (sube 1 punto por migración de 2 cards).

**Pendiente para siguientes sub-bloques**:
- Sub-bloque 2: OrderRankingChart, SalesBySalespersonPieChart
- Sub-bloque 3: SalesChart, ReceptionChart, DispatchChart
- Sub-bloque 4: TransportRadarChart
- Sub-bloque 5: WorkingEmployeesCard, WorkerStatisticsCard
- Sub-bloque 6: ReceptionsListCard, DispatchesListCard
- Sub-bloque 7: useStockStats, Dashboard/index.js

---

**STOP — Esperando aprobación explícita del usuario para aplicar STEP 3 (Implementación).**
