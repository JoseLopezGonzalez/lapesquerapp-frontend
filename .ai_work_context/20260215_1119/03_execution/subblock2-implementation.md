# Sub-bloque 2 — Implementación

**Fecha**: 2026-02-15  
**Status**: ✅ Completado

---

## Cambios aplicados

### 1. useStoreData.js (nuevo)
- useQuery para getStore / getRegisteredPallets
- queryKey: ['store', tenantId, storeId]
- Maneja ghost store (REGISTERED_PALLETS_STORE_ID)
- Callback setIsStoreLoading para StoresManager

### 2. useStore.js
- Sustituido useEffect de fetch por useStoreData
- Eliminados log() y console.log comentados
- store se sincroniza con fetchedStore vía useEffect

### 3. useStores.js
- Migrado a useInfiniteQuery
- queryKey: ['stores', tenantId]
- Primera página: getStores(1) + getRegisteredPallets
- Páginas siguientes: getStores(pageParam)
- onUpdateCurrentStoreTotalNetWeight / onAddNetWeightToStore usan setQueryData

### 4. useStores.test.js
- 3 tests: stores con ghost, error, loadMoreStores/hasMoreStores

---

## Archivos modificados/creados

| Archivo | Acción |
|---------|--------|
| src/hooks/useStoreData.js | Crear |
| src/hooks/useStore.js | Modificar |
| src/hooks/useStores.js | Modificar |
| src/__tests__/hooks/useStores.test.js | Crear |
