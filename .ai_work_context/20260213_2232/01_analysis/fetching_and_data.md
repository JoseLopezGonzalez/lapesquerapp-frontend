# Fetching y datos

**Estado**: ✅ Completado  
**Última actualización**: 2026-02-13

## Estrategia de fetching

- **No hay** SWR, React Query, ni tanstack-query.
- **Patrón predominante**: `useEffect` + `useState` + `fetch` (directo o vía services).
- **fetchWithTenant**: wrapper centralizado que añade `X-Tenant`, maneja 401/403 y eventos de logout.

## Ejemplos de fetch en cliente

| Componente/Hook | Patrón | Observaciones |
|-----------------|--------|---------------|
| EntityClient | useEffect + fetchDataRef | Ref para evitar doble fetch, pero lógica compleja |
| useStores | useEffect + Promise.all | Carga stores + pallets registrados en paralelo |
| useStore | useEffect + getStore/getRegisteredPallets | Fetch pesado, **21 console.log** en flujo |
| useOrder | useEffect + orderService | Lógica muy extensa (~900 líneas) |
| usePallet | Similar | ~1000 líneas, lógica pesada |
| SettingsContext | useEffect + getSettings | Polling cada 2s para cambio de tenant |
| useProductionData | useEffect + loadData | Sincroniza initialData con API |

## Server-side fetch

- **EntityPage**: no hace fetch; solo pasa config a EntityClient.
- **Productions/[id]/page.js**: `ProductionClient` recibe props; el fetch inicial está en cliente.
- En general, **no hay prefetch en Server Components** para datos de negocio.

## Problemas detectados

1. **Waterfall de fetches**: EntityClient y otros cargan datos tras montaje; no hay preload.
2. **Sin caché global**: cada navegación recarga datos completos.
3. **console.log en producción**: useStore, middleware, fetchWithTenant, diagramTransformers, etc.
4. **SettingsProvider**: ~~setInterval 2s~~ ✅ Reemplazado por `visibilitychange` + `focus` — sin polling constante.
