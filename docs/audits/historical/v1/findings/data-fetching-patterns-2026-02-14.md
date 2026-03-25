# Hallazgos: Patrones de data fetching

**Documento de soporte a**: `docs/audits/nextjs-frontend-global-audit.md`  
**Fecha**: 2026-02-14

---

## Resumen

El proyecto **no usa React Query ni SWR**. Toda la carga de datos se hace con **fetch manual** (a través de `fetchWithTenant` y servicios), desde **hooks personalizados** o desde **componentes** con `useEffect` + `useState`. No hay capa de caché ni invalidación centralizada; cada pantalla o hook gestiona loading y error de forma independiente.

---

## Capa de transporte

- **`src/lib/fetchWithTenant.js`**: Añade `X-Tenant`, Content-Type y User-Agent; maneja 401/403 y coordinación con logout. Punto único de uso de `fetch` para el backend.
- **`src/lib/api/apiHelpers.js`**: `apiRequest` envuelve `fetchWithTenant` con headers por defecto y manejo de respuestas no JSON y errores.
- **Servicios** (`src/services/`): entityService, storeService, orderService, authService, etc. Exponen funciones que reciben token (y a veces otros params) y llaman a `fetchWithTenant` o `apiRequest`. No cachean respuestas.

Toda petición al backend pasa por esta capa; el problema no es la dispersión de llamadas directas a `fetch`, sino la ausencia de una capa superior de “estado de servidor” (caché, deduplicación, invalidación).

---

## Patrones por módulo

### Hooks que cargan datos

- **useOrder**: Carga pedido y datos relacionados; `useEffect` con dependencias (orderId, token); estado local `loading`/`error`/datos; sin caché.
- **useStore**: Carga almacén (o palés registrados); mismo patrón.
- **usePallet**: Carga palé y contexto; lógica más compleja, mismo esquema.
- **useProductionRecord**: Carga producción, record, procesos; `useEffect` + estado local.
- **useStores**, **useProductionData**, etc.: Patrón repetido: `useEffect` → llamada a servicio → `setLoading`/`setData`/`setError`.

### Componentes que cargan datos

- **EntityClient**: `fetchData` en callback con dependencias (config, filters, page); `useEffect` que reacciona a cambios de filtros/página; loading y error en estado local y mostrados en UI.
- **ProductionView**: Carga datos de producción al montar; loading/error en estado; render condicional (Loader, Card de error, contenido).
- **Warehouse page** (`warehouse/[storeId]/page.js`): "use client"; usa `getStore(storeId, token)` en `useEffect`; loading con Loader; redirección en error.

En todos los casos: **fetch en cliente**, **estado local**, **sin reutilización de resultado** entre rutas o componentes (cada uno vuelve a pedir al montar).

---

## Loading y error

- **Loading**: Patrón repetido: `loading === true` → `<Loader />` o esqueleto. A veces el loader es local al componente; en rutas hay `loading.js` que Next.js muestra mientras se carga la página.
- **Error**: Toast (toast.error) en muchos sitios; en otros, Card o bloque con mensaje y botón “Volver” o “Reintentar”. Los mensajes suelen priorizar `userMessage` o equivalentes del backend. No hay un “error boundary” por tipo de error de red; el global `error.js` captura errores de render.

La experiencia es aceptable para el usuario, pero el código está duplicado en muchos archivos; una capa tipo React Query unificaría loading/error y reduciría lógica repetida.

---

## Consistencia y problemas

- **Consistencia**: El patrón “useEffect + servicio + useState(loading/data/error)” es coherente en todo el proyecto, pero no hay convención única para “reintentar”, “invalidar” o “refetch en foco”.
- **Deduplicación**: Si dos componentes necesitan el mismo pedido o almacén, cada uno puede disparar su propio fetch; no hay deduplicación por clave.
- **Navegación**: Al ir y volver entre listado y detalle, se vuelve a hacer fetch; no hay caché por pantalla ni por tiempo.
- **Optimistic updates**: Donde existan (p. ej. en formularios), se implementan a mano; no hay integración con una capa de caché.

---

## Alineación con buenas prácticas

- **Next.js**: La documentación recomienda fetch en Server Components o uso de librerías como React Query para estado de servidor. El proyecto hace fetch casi siempre en cliente; solo unas pocas páginas son Server Components y no hacen fetch.
- **React**: Separar “server state” (datos de API) de “client state” (UI, formularios) con una librería (React Query, SWR) simplificaría los hooks y reduciría estado local repetido.

---

## Recomendaciones

1. **Introducir React Query (o SWR)** como capa de estado de servidor: definir queries por recurso (order, store, pallet, production, listados) y usar los hooks en componentes; mantener servicios como funciones que React Query llame.
2. **Migrar de forma incremental**: Empezar por 1–2 flujos (p. ej. listado de entidades o detalle de almacén) y extender luego a pedidos, palés y producción.
3. **Mantener `fetchWithTenant` y servicios**: React Query puede usar la misma capa; solo cambia quién maneja loading/error/caché (React Query en lugar de useState/useEffect).
4. **Definir política de staleTime/cacheTime** por tipo de dato (listados vs detalle, datos que cambian poco vs mucho) para equilibrar frescura y rendimiento.
5. **Considerar prefetch** en listados (al hacer hover o al ver un enlace al detalle) para mejorar la percepción de velocidad.
