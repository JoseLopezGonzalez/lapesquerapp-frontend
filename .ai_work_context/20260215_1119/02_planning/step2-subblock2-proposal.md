# Sub-bloque 2 — Propuesta: useStoreData + useStores React Query

**Rating antes**: 5/10

---

## Mejoras a aplicar

1. **Extraer useStoreData** — Hook que usa useQuery para getStore/getRegisteredPallets
   - Reemplaza el useEffect de fetch en useStore
   - queryKey: ['store', storeId] o ['store', 'registered']
   - Devuelve { store, loading, error, refetch }
   - useStore consumirá useStoreData y mantendrá el resto de la lógica

2. **Migrar useStores a React Query**
   - useQuery para carga inicial (getStores + getRegisteredPallets)
   - loadMoreStores: fetchNextPage o invalidate + refetch con página
   - queryKey tenant-aware

3. **Eliminar console.log/console.warn** en useStore y useStores

4. **Tests básicos** para useStores (con mock de React Query)

---

## Riesgo: Medio

- useStore y useStores tienen muchas dependencias (StoreContext, StoresManager)
- Cambios en la forma de exponer loading/error pueden afectar UI
