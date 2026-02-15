# Sub-bloque 1 — Implementación

**Fecha**: 2026-02-15  
**Status**: ✅ Completado

---

## Cambios aplicados

### 1. Hooks useStockStats
- **Archivo nuevo**: `src/hooks/useStockStats.js`
- `useTotalStockStats()` — React Query para getTotalStockStats
- `useStockBySpeciesStats()` — React Query para getStockBySpeciesStats
- `useStockByProductsStats()` — React Query para getStockByProducts
- queryKey incluye tenantId (getCurrentTenant)
- enabled: !!token && !!tenantId

### 2. Dashboard Stock Cards → React Query
- **CurrentStockCard**: reemplazado useEffect+useState por useTotalStockStats
- **StockBySpeciesCard**: reemplazado por useStockBySpeciesStats
- **StockByProductsCard**: reemplazado por useStockByProductsStats

### 3. StoresManager
- **ScrollShadow (NextUI)** → div con `overflow-x-auto overflow-y-hidden flex gap-3`
- Preservado onWheel para scroll horizontal con rueda
- **Eliminados** console.log de debug

### 4. Tests storeService
- **Archivo nuevo**: `src/__tests__/services/storeService.test.js`
- getTotalStockStats: 2 tests (éxito, error)
- getStockBySpeciesStats: 2 tests (éxito, error)
- getStockByProducts: 3 tests (éxito, wrapped response, error)

---

## Verificación

- [x] Tests storeService pasan (7 tests)
- [x] Build exitoso
- [x] Sin errores de linter en archivos modificados
- [x] No hay imports de @nextui-org en StoresManager

---

## Archivos modificados/creados

| Archivo | Acción |
|---------|--------|
| src/hooks/useStockStats.js | Crear |
| src/components/Admin/Dashboard/CurrentStockCard/index.js | Modificar |
| src/components/Admin/Dashboard/StockBySpeciesCard/index.js | Modificar |
| src/components/Admin/Dashboard/StockByProductsCard/index.js | Modificar |
| src/components/Admin/Stores/index.js | Modificar |
| src/__tests__/services/storeService.test.js | Crear |
