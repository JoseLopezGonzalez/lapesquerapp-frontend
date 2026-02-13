# Performance Audit Report — PesquerApp (brisapp-nextjs)

**Proyecto**: PesquerApp  
**Stack**: Next.js 16, React 19 RC, App Router  
**Fecha**: 2026-02-13  
**Auditor**: Staff/Principal Frontend Engineer (AI)

---

## 1. Resumen ejecutivo

La aplicación es un ERP para el sector pesquero con arquitectura multi-tenant. La auditoría identifica problemas de **rendimiento inicial**, **uso excesivo de Client Components**, **fetching sin caché**, **middleware bloqueante** y **bundle pesado** en rutas críticas. El sistema es funcional pero tiene margen significativo para mejorar TTFB, FCP, LCP y la experiencia en móvil.

---

## 2. Top 10 problemas detectados

| # | Problema | Severidad | Impacto | Riesgo intervención |
|---|----------|-----------|---------|---------------------|
| 1 | Middleware hace fetch a `/api/v2/me` en cada request protegido | **Crítico** | Añade 200–500 ms al TTFB en cada navegación | Bajo |
| 2 | ~125+ componentes con "use client" — poco aprovechamiento de Server Components | **Alto** | Mayor JS inicial, hidratación pesada, menos streaming | Medio |
| 3 | Sin caché de datos (SWR/React Query); todo fetch en cliente | **Alto** | Re-fetch en cada navegación, waterfalls | Bajo |
| 4 | Home page `/` obligatoriamente client por useSession + hostname | **Alto** | FCP/LCP degradados en landing y login | Medio |
| 5 | Dependencias pesadas (recharts, xlsx, jspdf, React Flow) en rutas frecuentes | **Alto** | Bundle grande, tiempo de parse/ejecución | Medio |
| 6 | ~~SettingsProvider: setInterval 2s~~ | ~~Medio~~ | **✅ Implementado** — Reemplazado por `visibilitychange` + `focus` | — |
| 7 | ~~100+ console.log en producción~~ | ~~Medio~~ | **✅ Implementado** — removeConsole en next.config + `src/lib/logger.js` | — |
| 8 | next.config.mjs mínimo — sin optimizaciones de build | **Medio** | Oportunidad perdida en compresión, headers, imágenes | Bajo |
| 9 | ~~useStore con 21 console.log~~ | ~~Medio~~ | **✅ Implementado** — Migrado a `log()` de logger en useStore, fetchWithTenant, SettingsContext | — |
| 10 | Falta dynamic import en rutas pesadas (orquestador, market-data-extractor) | **Medio** | Carga inicial lenta en esas rutas | Bajo |

---

## 3. Evidencias y explicación detallada

### 3.1 Middleware con fetch bloqueante (Crítico)

**Archivo**: `src/middleware.js` líneas 78–87

```javascript
const verifyResponse = await fetchWithTenant(
  `${API_BASE_URL}/api/v2/me`,
  { method: "GET", headers: { Authorization: `Bearer ${token.accessToken}` } },
  req.headers
);
```

- **Evidencia**: Se ejecuta en **cada** request a `/admin/*`, `/production/*`, `/warehouse/*`.
- **Impacto**: Añade la latencia de una llamada HTTP al backend antes de servir la página. Si el backend tarda 300 ms, el usuario espera 300 ms extra en cada navegación.
- **Verificación**: Medir TTFB con y sin esta validación; comparar tiempos de navegación.
- **Reversión**: Revertir cambio de validación; volver a validar solo con JWT local si se acepta el riesgo de tokens revocados.

---

### 3.2 Exceso de Client Components (Alto)

**Evidencia**: `grep "use client" src --count` → ~125 archivos

- **Patrón**: ClientLayout envuelve toda la app. Casi todas las páginas admin son client.
- **Impacto**: Todo el árbol se hidrata en cliente; no hay streaming de Server Components; el bundle inicial incluye más lógica.
- **Archivos clave**: `src/app/ClientLayout.js`, `src/app/page.js`, `src/app/admin/home/page.js`, EntityClient, Dashboard, etc.
- **Reversión**: Mantener Client donde sea necesario (SessionProvider, formularios); migrar vistas de solo lectura a Server Components con fetch en servidor.

---

### 3.3 Sin caché de datos (Alto)

**Evidencia**: No hay imports de `swr`, `@tanstack/react-query`, ni equivalente.

- **Patrón actual**: useEffect + fetch en EntityClient, useStores, useStore, useOrder, etc.
- **Impacto**: Cada navegación recarga datos; waterfalls en páginas con múltiples fuentes.
- **Archivos**: `src/components/Admin/Entity/EntityClient/index.js`, `src/hooks/useStores.js`, `src/hooks/useStore.js`
- **Reversión**: Desinstalar SWR/React Query y volver a fetch manual si se requiere.

---

### 3.4 Home page 100% client (Alto)

**Archivo**: `src/app/page.js`

- **Razón**: Necesita `useSession`, `window.location.hostname`, `useRouter`.
- **Impacto**: Landing y login no pueden ser pre-renderizados como estáticos; FCP y LCP se degradan.
- **Posible mitigación**: Separar landing estática (sin auth) de la ruta de tenant; usar middleware para redirigir según host.

---

### 3.5 Dependencias pesadas (Alto)

**Archivo**: `package.json`

- recharts, xlsx, jspdf, html2canvas, framer-motion, @xyflow/react, dagre, lottie-web.
- **Impacto**: Chunks de 95–155 KB individuales; tiempo de parse y ejecución en dispositivos lentos.
- **Reversión**: Revertir dynamic imports; asegurar tree-shaking donde exista.

---

### 3.6 ~~SettingsProvider setInterval~~ ✅ Implementado

**Archivo**: `src/context/SettingsContext.js`

- **Antes**: `setInterval(checkTenantChange, 2000)` ejecutándose cada 2 segundos.
- **Implementado**: Reemplazado por listeners `visibilitychange` y `focus`; solo se verifica tenant al volver a la pestaña.

---

### 3.7 ~~console.log en producción~~ ✅ Implementado

- **Implementado**: (1) `next.config.mjs` con `compiler.removeConsole` (excluye error/warn); (2) utilidad `src/lib/logger.js` usada en useStore, fetchWithTenant, SettingsContext. Logs de depuración pasan por `log()` que es no-op en producción.
- **Doc**: Ver `docs/12-UTILIDADES-HELPERS.md` sección Logger.

---

### 3.8 next.config.mjs mínimo (Medio)

**Archivo**: `next.config.mjs`

- Solo `turbopack` y `rewrites`. Sin `compress`, `images`, `headers`, `experimental`.
- **Impacto**: Oportunidades de optimización no aplicadas.
- **Reversión**: Revertir cambios en next.config.mjs.

---

### 3.9 ~~useStore con logs~~ ✅ Implementado (fetch pesado pendiente)

**Archivo**: `src/hooks/useStore.js`

- **Logs**: ✅ Migrados a `log()` de `@/lib/logger` — no se ejecutan en producción.
- **Pendiente**: Fetch de pallets/boxes completo en cada carga; requiere plan de paginación/virtualización.

---

### 3.10 Falta dynamic en rutas pesadas (Medio)

**Evidencia**: Orquestador (React Flow + dagre), Market Data Extractor cargan en el bundle de ruta sin `dynamic(ssr: false)`.

- **Impacto**: Primera visita a esas rutas carga muchos KB de JS.
- **Reversión**: Quitar `dynamic()` si causa problemas de hidratación.

---

## 4. Tabla de severidad

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| Crítico | 1 | Bloquea o degrada significativamente la experiencia |
| Alto | 4 | Impacto notable en métricas o UX |
| Medio | 5 | Mejorable con esfuerzo moderado |
| Bajo | 0 | Impacto menor |

---

## 5. Impacto estimado

| Área | Estado actual | Con mejoras |
|------|---------------|-------------|
| TTFB (navegación protegida) | +200–500 ms por middleware | Reducible 200–400 ms |
| FCP (landing/login) | Client-only, sin preload | Mejorable con separación de rutas |
| LCP | Depende de imágenes (next/image usado en Landing) | Estable; revisar prioridad |
| Bundle inicial | ~9.2 MB chunks, algunos >100 KB | Reducible 15–25 % con dynamic imports |
| Hidratación | Todo el árbol client | Más ligera si se migran vistas a Server |
| Memoria cliente | Sin caché, re-fetch constante | Mejor con SWR/React Query |

---

## 6. Recomendación profesional

**El frontend está operativo pero no optimizado para escalar.** Para un uso intensivo y móvil, se recomienda:

1. **Quick wins**: ~~Eliminar/condicionar logs~~ ✅, optimizar middleware (cachear validación o hacerla async), añadir dynamic imports en rutas pesadas, configurar next.config. ~~Reducir intervalo de SettingsProvider~~ ✅.
2. **Mejoras estructurales**: Introducir SWR o React Query.
3. **Refactor a medio plazo**: Separar landing estática, migrar vistas de solo lectura a Server Components, evaluar sustitución de librerías muy pesadas (xlsx, recharts) por alternativas más ligeras o carga bajo demanda.

**Veredicto**: El sistema puede escalar con las mejoras propuestas; sin ellas, la experiencia en dispositivos lentos y redes débiles se verá afectada.
