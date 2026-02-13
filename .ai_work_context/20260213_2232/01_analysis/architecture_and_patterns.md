# Análisis de arquitectura y patrones

**Estado**: ✅ Completado  
**Última actualización**: 2026-02-13  
**Sesión**: 20260213_2232

## Stack tecnológico

- **Next.js**: 16.1.3 (Turbopack)
- **React**: 19.0.0-rc
- **next-auth**: 4.24.13
- **UI**: Radix UI, shadcn/ui, NextUI, Lucide React

## Patrones de render

### Server vs Client Components

- **~125+ archivos** con `"use client"` — proporción muy alta.
- **Root `/`**: `page.js` es 100% client por necesidad (useSession, hostname, routing).
- **ClientLayout**: envuelve toda la app con providers (SessionProvider, ThemeProvider, SettingsProvider, LogoutProvider). Todo el árbol hijo es client.
- **EntityPage** (`/admin/[entity]`): Server Component que solo pasa `config` a EntityClient. EntityClient es client y hace todo el fetch.
- **Admin home**: Client Component, bloquea render hasta `status === "loading"`.
- **Conclusión**: El modelo App Router no se aprovecha; casi todo es client-rendered tras autenticación.

### Rutas estáticas vs dinámicas

- **Estáticas (○)**: `/`, `/_not-found`, `/auth/verify`, `/unauthorized` — 4 rutas.
- **Dinámicas (ƒ)**: el resto — 35+ rutas. Todas las rutas de admin/warehouse son SSR on-demand.
- **Causa**: NextAuth, middleware con verificación de token, y dependencia de sesión en casi todas las páginas.

### loading.js

- Existen 14 `loading.js` en rutas de admin → Suspense boundaries correctos.
- Uso consistente de `<Loader />` durante navegación.

## Middleware

- **Matcher**: `/admin/*`, `/production/*`, `/warehouse/*`.
- **En cada request protegido**:
  1. getToken (JWT local).
  2. Validación de expiración.
  3. **fetch a `${API_BASE_URL}/api/v2/me`** para verificar token con backend.
- **Impacto**: latencia adicional en cada navegación protegida. Si el backend tarda 200–500 ms, suma al TTFB percibido.
- **console.log** en middleware en producción (líneas 77, 104, 106, 144–147, 152, 163, 164).

## Hot paths

1. **Inicio de sesión / subdominio**: `/` → useSession + hostname → render condicional (Landing/Login/redirect).
2. **Admin home**: `/admin/home` → useSession loading → Dashboard u OperarioDashboard.
3. **Entity CRUD**: `/admin/[entity]` → EntityClient → fetch en useEffect con filtros/paginación.
4. **Orders/Productions/Stores**: hooks complejos (useOrder, useStore, useProductionRecord) con múltiples fetches.
5. **Warehouse operator**: `/warehouse/[storeId]` → useStores, useStore → fetch pesado de pallets.
