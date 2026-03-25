# Auditoría de Rendimiento — Informe Completo

**Fecha**: 2026-03-23
**Auditor**: Claude Sonnet 4.6 (análisis estático de código)
**Prompt rector**: `docs/audits/global-performance-audit-master-prompt.md`
**Referencia de base**: `docs/audits/cmr-comercial-performance-playbook.md`
**Entorno analizado**: código fuente local (sin acceso a runtime, sin DevTools, sin logs de producción)
**Rama**: `main` — commits recientes incluyen refactor de hooks de rutas y servicios CRM

---

## Historial de cambios

| Fecha | Fase | Cambios |
|---|---|---|
| 2026-03-23 | Fase 1 completa | P01, P02, P03, P05, P09, P10, P11, P13, P14 implementados |
| 2026-03-23 | Fase 2 completa | P-MW (Opción C cookie TTL 60s), P04, P07, P08, P12 implementados |
| 2026-03-23 | Fase 3 completa | P06 (RoutesPlannerPage partido en 9 archivos), P07 steps extraídos, regla ESLint query keys |

---

## Limitaciones Declaradas

- **Sin runtime**: todos los hallazgos son inferidos del código fuente. Deben validarse con DevTools (Network tab, Performance Profiler, React Query DevTools) antes de asignar prioridad final.
- **Sin backend**: no se pueden confirmar latencias de endpoints, planes de consulta ni índices de base de datos.
- **Sin sesión activa**: el flujo auth/token completo no ha sido verificado en un entorno real en ejecución.
- **Código mixto JS/TS**: 743 archivos `.js/.jsx` sin tipos estrictos; algunas inferencias sobre formas de datos pueden ser imprecisas en los módulos más legacy.

---

## 1. Resumen Ejecutivo

### Estado actual

> **Actualización 2026-03-23 — Fase 1 completada**: Los 9 quick wins de bajo riesgo han sido implementados. Los hallazgos P01, P02, P03, P05, P09, P10, P11, P13 y P14 están resueltos en código. El estado del documento a partir de esta actualización refleja la situación post-Fase 1.

La arquitectura de datos del frontend ha alcanzado un nivel de madurez real: React Query v5 está integrado en la mayoría de módulos modernos, los hooks del área CRM y field siguen patrones consistentes, y existen utilidades sólidas de normalización, caché de token y control de concurrencia para geocoding. Las mejoras de la última iteración (hooks de rutas, servicio CRM tipado, query key factories) son evidentes y sólidas.

Sin embargo, la exploración revela **un problema crítico transversal** que afecta a todos los usuarios en todas las rutas protegidas: el middleware valida cada request navegación haciendo una llamada HTTP real al backend. Este hallazgo supera en impacto potencial a todos los demás.

Los restantes hallazgos son principalmente de **consistencia**: varios hooks CRM construyen query keys con objetos sin normalizar, a diferencia del patrón correcto ya establecido en los hooks de rutas.

### Principales cuellos de botella

1. **Middleware `/me` por request** (`src/middleware.ts`): añade el coste de una round-trip HTTP a cada navegación de página en toda la app.
2. **Query keys sin normalizar** en `useComercialOrders`, `useAgenda`, `useOffersList`, `useCustomersList`: exposición a cache fragmentada si los parámetros se recrean entre renders.
3. **Componentes monolíticos** — `RoutesPlannerPage` (1404 líneas), `FieldOrderExecutionPage` (591 líneas), `AgendaPageClient` (700 líneas): re-renders caros y mantenibilidad comprometida.
4. **`fieldOperatorId` ausente de query keys** en hooks de field: caché potencialmente compartida entre operadores en el mismo tenant.
5. **Llamadas directas a servicios** en `FieldOrderExecutionPage` y `OrdersList` sin pasar por React Query: sin caché, sin error boundary, sin deduplicación.

### Estado de implementación

**✅ Fase 1 — Completada (2026-03-23)**

| Tarea | Hallazgo | Archivos |
|---|---|---|
| ✅ Normalizar query key en `useComercialOrders` | P01 | `useComercialOrders.ts`, `queryKeys.ts` |
| ✅ Normalizar query keys en `useAgenda` y `useOffersList` | P02 | `useAgenda.ts`, `useOffers.ts` |
| ✅ Normalizar query key en `useCustomersList` | P03 | `useCustomersList.ts`, `queryKeys.ts` |
| ✅ Sustituir key hardcodeada en `autoventaMutation.onSuccess` | P05 | `useFieldOrders.ts`, `queryKeys.ts` |
| ✅ Ordenar keys en `normalizeQueryParams` de `useCommercialInteractions` | P09 | `useCommercialInteractions.ts` |
| ✅ Eliminar key hardcodeada en `useCustomerAssignment.onSuccess` | P10 | `useCustomerAssignment.ts`, `queryKeys.ts` |
| ✅ Condicionizar `console.error` en `fetchWithTenant.js` | P11 | `fetchWithTenant.js` |
| ✅ Añadir `MAX_GEOCODE_CACHE_SIZE = 500` + LRU eviction | P13 | `routeStops.ts` |
| ✅ `normalizeRouteEntity(x)` en lugar de `normalizeRouteCollection([x])[0]` | P14 | `useRouteTemplates.ts` |

**✅ Fase 2 — Completada (2026-03-23)**

| Tarea | Hallazgo | Archivos |
|---|---|---|
| ✅ Cookie `__session_verified` TTL 60s en middleware (Opción C) | P-MW | `src/middleware.ts` |
| ✅ `fieldOperatorId` en query keys de field | P04 | `queryKeys.ts`, `useFieldOrders.ts`, `useFieldRoutes.ts` |
| ✅ Hook `useFieldProductsOptions` + refactor `FieldOrderExecutionPage` | P07 | `useFieldProductsOptions.ts`, `FieldOrderExecutionPage.jsx` |
| ✅ Extraer `RouteMapSection`, `StopDetailDrawer`, `StopsListDrawer`, `ResultDialog` | P08 | `FieldRouteExecutionPage.jsx` + 4 nuevos componentes |
| ✅ Extraer `AgendaFiltersDialog` y `AgendaHeaderControls` | P08 | `AgendaPageClient.jsx` + 2 nuevos componentes |
| ✅ Extraer `downloadActivePlannedProductsXls` a `orderService.ts` | P12 | `orderService.ts`, `OrdersList/index.js` |

### Riesgos principales

- Modificar el middleware requiere análisis de seguridad: la llamada a `/me` cumple función de verificación de sesión activa. La remediación debe conservar esa garantía por otro mecanismo.
- Cambiar las query keys del módulo field invalida la caché existente y requiere pruebas de regresión en todos los flujos de field.

---

## 2. Mapa de Síntomas y Superficie Impactada

| Módulo | Flujo | Síntoma | Capa | Severidad |
|---|---|---|---|---|
| **Global** | Todas las navegaciones | Round-trip HTTP extra por navegación | Auth / Middleware | Crítico |
| CRM — Pedidos | Listado de órdenes | Cache fragmentada por params sin normalizar | React Query | Alto |
| CRM — Agenda | Vista de agenda | Cache fragmentada por queryParams sin normalizar | React Query | Alto |
| CRM — Ofertas | Listado de ofertas | Cache fragmentada por queryParams sin normalizar | React Query | Alto |
| CRM — Clientes | Listado de clientes | Cache fragmentada por filters sin normalizar | React Query | Alto |
| Field — Rutas y Pedidos | Cualquier vista con operador | Cache potencialmente compartida entre operadores | React Query | Alto |
| Field — Autoventa | Crear autoventa | Clientes disponibles no se invalidan via factory | React Query | Alto |
| Comercial — Planificador | RoutesPlannerPage | Re-renders caros, componente 1404 líneas | Render | Alto |
| Field — Ejecución pedido | FieldOrderExecutionPage | Llamada a servicio sin RQ, 591 líneas | Render / Red | Alto |
| CRM — Agenda | AgendaPageClient | Componente 700 líneas, re-renders por estado no relacionado | Render | Medio |
| Field — Ejecución ruta | FieldRouteExecutionPage | Componente 450 líneas | Render | Medio |
| CRM — Interacciones | Crear interacción | normalizeQueryParams no ordena keys | React Query | Medio |
| CRM — Clientes | Asignar cliente | Invalida queries admin con key hardcodeada | React Query | Medio |
| Transport | Todas las requests fallidas | `console.error` en producción | Auth | Medio |
| Admin — Pedidos | Exportar XLS | Fetch directo sin React Query | Red | Medio |
| Geocoding | Rutas (sesión larga) | Cache de módulo sin límite de tamaño | Singleton | Bajo |
| Route Templates | Actualizar plantilla | Normalización innecesariamente envuelta | React Query | Bajo |

---

## 3. Tabla de Hallazgos Priorizados

| ID | Severidad | Impacto | Esfuerzo | Riesgo | Área | Hallazgo | Evidencia | Estado |
|---|---|---|---|---|---|---|---|---|
| P-MW | Crítico | Alto | Alto | Alto | Auth / Middleware | Middleware llama `/api/v2/me` en cada request protegida | `src/middleware.ts:98-114` | ✅ Resuelto (Fase 2) |
| P01 | Alto | Alto | Bajo | Bajo | React Query | `useComercialOrders`: `params` raw en query key | `src/hooks/useComercialOrders.ts:16` | ✅ Resuelto (Fase 1) |
| P02 | Alto | Alto | Bajo | Bajo | React Query | `useAgenda` / `useOffersList`: `queryParams` raw en query key | `useAgenda.ts:49`, `useOffers.ts:16` | ✅ Resuelto (Fase 1) |
| P03 | Alto | Alto | Bajo | Bajo | React Query | `useCustomersList`: `filters` raw en query key | `src/hooks/useCustomersList.ts:10` | ✅ Resuelto (Fase 1) |
| P04 | Alto | Alto | Bajo | Medio | React Query | `fieldOperatorId` en `enabled` pero ausente de query keys | `useFieldOrders.ts:25-33`, `useFieldRoutes.ts:24-28` | ✅ Resuelto (Fase 2) |
| P05 | Alto | Medio | Bajo | Bajo | React Query | `autoventaMutation.onSuccess`: key hardcodeada | `src/hooks/useFieldOrders.ts:76` | ✅ Resuelto (Fase 1) |
| P06 | Alto | Medio | Alto | Alto | Render | `RoutesPlannerPage`: 1404 líneas | `RoutesPlannerPage.jsx` | ✅ Resuelto (Fase 3) |
| P07 | Alto | Medio | Alto | Alto | Render / Red | `FieldOrderExecutionPage`: 591 líneas + fetch directo sin RQ | `FieldOrderExecutionPage.jsx` | ✅ Resuelto (Fase 2) |
| P08 | Medio | Medio | Medio | Medio | Render | `AgendaPageClient` (700) y `FieldRouteExecutionPage` (450) | archivos respectivos | ✅ Resuelto (Fase 2) |
| P09 | Medio | Bajo | Bajo | Bajo | React Query | `useCommercialInteractions.normalizeQueryParams`: no ordena keys | `useCommercialInteractions.ts:6-18` | ✅ Resuelto (Fase 1) |
| P10 | Medio | Bajo | Bajo | Bajo | React Query | `useCustomerAssignment`: key hardcodeada en invalidación | `useCustomerAssignment.ts:26-29` | ✅ Resuelto (Fase 1) |
| P11 | Medio | Bajo | Bajo | Bajo | Auth | `console.error` hardcodeado en ruta de producción | `fetchWithTenant.js:139` | ✅ Resuelto (Fase 1) |
| P12 | Medio | Medio | Medio | Bajo | Red | `OrdersList`: `fetchWithTenant` directo para XLS | `OrdersList/index.js` | ✅ Resuelto (Fase 2) |
| P13 | Bajo | Bajo | Bajo | Bajo | Singleton | `geocodeCache` sin límite de tamaño ni TTL | `routeStops.ts:16-17` | ✅ Resuelto (Fase 1) |
| P14 | Bajo | Bajo | Bajo | Bajo | React Query | `normalizeRouteCollection([x])[0]` vs `normalizeRouteEntity(x)` | `useRouteTemplates.ts:50-52` | ✅ Resuelto (Fase 1) |

---

## 4. Desarrollo Detallado de Hallazgos

---

### P-MW — Middleware: llamada HTTP real a `/api/v2/me` en cada request protegida

- **ID**: P-MW
- **Severidad**: Crítico
- **Impacto**: Alto
- **Esfuerzo de corrección**: Alto
- **Riesgo de cambio**: Alto
- **Área**: Auth / Middleware
- **Flujo afectado**: Toda navegación a rutas `/admin`, `/operator`, `/comercial`, `/field`, `/production`, `/warehouse`, `/external`

**Síntoma**

Cada vez que el usuario navega a una página protegida (incluyendo navegación interna via `router.push`), el middleware hace una request HTTP real al backend (`GET /api/v2/me`). Esta request añade el coste completo de red + procesamiento backend a cada navegación, en lugar de procesar únicamente el JWT local.

**Evidencia**

`src/middleware.ts:98-114`
```typescript
const verifyResponse = await fetchWithTenant(
  `${API_BASE_URL}/api/v2/me`,
  {
    method: "GET",
    headers: { Authorization: `Bearer ${token.accessToken}` },
  },
  req.headers
);
// ...
const actorType = (currentUser?.actorType) ?? token.actorType ?? "internal_user";
const rawRole   = (currentUser?.role)       ?? token.role;
```

Los valores `actorType` y `role` obtenidos de `currentUser` tienen fallback en `token.actorType` y `token.role` — lo que confirma que el JWT ya contiene estos datos. La llamada a `/me` se hace para verificar que la sesión sigue activa en el servidor.

El JWT local ya se valida antes:
- `getToken()` (línea ~67): verifica firma y decodifica el payload — operación local, sin red.
- Comprobación de expiración (línea ~82): `Date.now() > tokenExpiration` — local.

La llamada HTTP a `/me` es un paso adicional de seguridad (revocación de sesión) pero viene al precio de una round-trip en cada navegación.

**Causa raíz**

Diseño defensivo correcto en intención (verificar que el token sigue siendo válido en el servidor), pero implementado de forma que se ejecuta en absolutamente cada request, sin ningún mecanismo de cooldown ni caché.

**Impacto de negocio/UX**

- Cada navegación de página percibida como "lenta" incluso cuando los datos del cliente ya están en caché.
- En una conexión con 80ms de RTT al backend, cada clic de navegación añade 80-200ms de latencia inevitable.
- Aumenta la carga en el endpoint `/me` del backend de forma proporcional al número de usuarios activos y clics de navegación.
- En dispositivos móviles o conexiones lentas (escenario field), el impacto es especialmente severo.

**Cambio propuesto**

**Opción A (recomendada — eliminar el fetch)**: Confiar en el JWT para verificación de identidad y rol. Para manejar la revocación, implementar un mecanismo de invalidación activa:
- El backend incluye un `tokenVersion` o `sessionId` en el JWT en el momento de emisión.
- Cuando se revoca un usuario, el backend incrementa su versión.
- El frontend hace polling ligero cada N minutos contra un endpoint ligero de "check-version" (no `/me` completo).
- O bien: usar SSE/WebSocket para notificaciones de revocación.

**Opción B (bajo riesgo — caché en middleware)**: Usar el `sessionToken` de NextAuth como clave de caché. Almacenar el resultado de `/me` en una caché edge con TTL corto (30-60 segundos). Next.js middleware puede usar `unstable_cache` o una solución de KV (Redis, Vercel KV). Esto reduce las llamadas de N/minuto a 1 por cada 30-60 segundos.

**Opción C (mínimo invasiva — condicional por ruta)**: Solo llamar a `/me` en la primera request de sesión o cuando el JWT se acaba de refrescar. Usar una cookie ligera `__session_verified` con TTL corto que el middleware establece tras una verificación exitosa y que indica que la verificación ya se hizo recientemente.

```typescript
// Opción C sketch:
const sessionVerifiedCookie = req.cookies.get('__session_verified');
const needsVerification = !sessionVerifiedCookie || isJwtRecentlyRefreshed(token);

if (needsVerification) {
  // Llamar a /me y establecer cookie __session_verified con TTL 60s
  const response = NextResponse.next();
  response.cookies.set('__session_verified', '1', { maxAge: 60, httpOnly: true, sameSite: 'strict' });
  return response;
}
// Si ya verificado recientemente, continuar con datos del JWT
```

**Decisión adoptada (2026-03-23)**

Se adopta la **Opción C** como estrategia elegida para abordar `P-MW` en Fase 2.

**Justificación**

- Reduce de forma significativa las llamadas a `/api/v2/me` durante la navegación interna entre rutas protegidas.
- Conserva una verificación periódica de sesión activa en backend, evitando asumir en esta fase que el JWT por sí solo es suficiente para todos los escenarios de revocación.
- Evita introducir complejidad extra de infraestructura (KV, Redis, caché edge compartida) en esta iteración.
- Permite una implementación incremental, reversible y concentrada principalmente en `src/middleware.ts`.

**Criterio funcional acordado**

- El middleware seguirá validando localmente el JWT en cada request protegida.
- La verificación contra `/api/v2/me` se realizará solo cuando no exista evidencia reciente de verificación o cuando la sesión/token requiera revalidación.
- La evidencia reciente de verificación se representará mediante una cookie técnica `HttpOnly` de corta duración, por ejemplo `__session_verified`.

**Parámetros iniciales recomendados**

- TTL inicial de la cookie: `60 segundos`.
- Ajuste posterior del TTL según validación en DevTools y comportamiento real de navegación.
- La lógica de redirects por `actorType`, `role` y segmentación de rutas protegidas debe mantenerse sin cambios funcionales.

**Objetivo de la decisión**

- Reducir drásticamente la frecuencia de requests a `/me` sin perder la capacidad de detectar sesiones inválidas o revocadas dentro de una ventana razonable.
- Mejorar la percepción de velocidad en navegación protegida sin abrir una brecha de riesgo comparable a eliminar completamente la validación backend.

**Validación**

- Medir en DevTools Network la latencia de navegación antes y después.
- Verificar que el flujo de revocación de usuario (desactivar usuario en admin → el usuario es redirigido al login) sigue funcionando.
- Verificar que los redirects por rol (`operario → /operator`, `comercial → /comercial`) siguen funcionando con datos del JWT.

**Riesgos / trade-offs**

- Eliminar la llamada a `/me` introduce una ventana de tiempo donde un usuario desactivado puede seguir navegando hasta que el JWT expire.
- La duración de esa ventana es igual al tiempo de expiración del JWT. Si el JWT tiene expiración larga (>1h), el riesgo es mayor.
- **Este trade-off debe evaluarse con el equipo de producto y seguridad antes de implementar.**

**Archivos o superficies afectadas**

- `src/middleware.ts` (modificación sustancial)
- Potencialmente: nuevo endpoint ligero de verificación en el backend
- Configuración de NextAuth (si se modifica la estrategia de sesión)

---

### P01 — `useComercialOrders`: `params` raw en query key, sin factory normalizada

- **ID**: P01
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Listado de pedidos comerciales

**Síntoma**

Si el componente consumidor pasa `params` como un objeto literal (`{}`) o lo recrea en cada render, React Query genera una nueva entrada de caché por cada render aunque los valores sean idénticos, produciendo refetches innecesarios y cache fragmentada.

**Evidencia**

`src/hooks/useComercialOrders.ts:16`
```ts
queryKey: ['crm', 'orders', 'list', tenantId ?? 'unknown', params],
//                                                          ^^^^^^ objeto raw, sin normalizar
```

Contraste con el patrón correcto del proyecto (`src/lib/routes/queryKeys.ts:16-17`):
```ts
list: (tenantId, params = {}) =>
  ['routes', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
// normalizeQueryParams filtra nulos, ordena claves, normaliza arrays
```

**Causa raíz**: `useComercialOrders` no fue incluido en el refactor de normalización de query keys.

**Cambio propuesto**

Añadir factory a `src/lib/routes/queryKeys.ts` (o nuevo `src/lib/crm/queryKeys.ts`):
```ts
export const comercialOrderKeys = {
  all: (tenantId) => ['crm', 'orders', tenantId ?? 'unknown'] as const,
  list: (tenantId, params: QueryParams = {}) =>
    ['crm', 'orders', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
};
```
Actualizar `useComercialOrders.ts:16` para usar la factory.

**Validación**: En React Query DevTools, dos renders con `params = {}` deben producir la misma entrada de caché.

**Archivos afectados**: `src/hooks/useComercialOrders.ts`, `src/lib/routes/queryKeys.ts`

---

### P02 — `useAgenda` y `useOffersList`: `queryParams` raw en query key

- **ID**: P02
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Agenda CRM, listado de ofertas

**Síntoma**

Mismo patrón que P01. Si los params se recrean entre renders (por ejemplo, al desestructurar props en el componente padre), la caché se fragmenta.

**Evidencia**

`src/hooks/useAgenda.ts:49`
```ts
const queryKey = ['crm', 'agenda', tenantId ?? 'unknown', queryParams];
//                                                         ^^^^^^^^^^^ objeto raw
```

`src/hooks/useOffers.ts:16`
```ts
const queryKey = ['crm', 'offers', 'list', tenantId ?? 'unknown', queryParams];
//                                                                 ^^^^^^^^^^^ objeto raw
```

Ambos filtran `enabled` del objeto antes de incluirlo (`const { enabled = true, ...queryParams } = params`), lo que es correcto. El problema es que el objeto restante no se normaliza.

**Cambio propuesto**: Aplicar `normalizeQueryParams` (del módulo ya existente en `queryKeys.ts`) al objeto `queryParams` antes de incluirlo en la key, o crear factories en el módulo de keys CRM.

**Archivos afectados**: `src/hooks/useAgenda.ts`, `src/hooks/useOffers.ts`

---

### P03 — `useCustomersList`: `filters` raw en query key

- **ID**: P03
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Listado de clientes (`CustomersPageClient`)

**Síntoma**

`filters` es un objeto de tipo `CatalogListFilters` incluido directamente en la query key. `CustomersPageClient` pasa `{}` como filters por defecto y hace búsqueda local, pero si en algún contexto los filters cambian de referencia entre renders, se producen refetches.

**Evidencia**

`src/hooks/useCustomersList.ts:10`
```ts
queryKey: ['customers', 'list', tenantId ?? 'unknown', filters, page, perPage],
//                                                     ^^^^^^^ objeto raw
```

**Cambio propuesto**: Normalizar `filters` con `normalizeQueryParams` o crear factory `customerListKeys.list(tenantId, filters, page, perPage)`.

**Archivos afectados**: `src/hooks/useCustomersList.ts`

---

### P04 — `fieldOperatorId` en `enabled` pero ausente de query keys en hooks de field

- **ID**: P04
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Medio
- **Área**: React Query
- **Flujo afectado**: Rutas de field, pedidos de field

**Síntoma**

Los hooks `useFieldOrders` y `useFieldRoutes` comprueban `Boolean(fieldOperatorId)` en `enabled`, pero la query key no incluye `fieldOperatorId`. Si el operador cambia en la misma sesión, la caché del operador anterior se sirve al nuevo.

**Evidencia**

`src/hooks/useFieldOrders.ts:25-33`
```ts
queryKey: fieldOrderKeys.list(tenantId, params),  // fieldOperatorId ausente
queryFn: () => getFieldOrders(token as string, params),
enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && enabled,
//                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ protege ejecución
//                                              pero no forma parte del identificador de caché
```

**Contexto importante**: `FieldOperatorContext.tsx` obtiene `fieldOperatorId` de `useMe()` — derivado del usuario autenticado. En la práctica, el `fieldOperatorId` es fijo por sesión (1 usuario = 1 operador). El riesgo es principalmente en escenarios de soporte/superadmin o futuros cambios de arquitectura.

**Opciones**:
- **Opción A**: Añadir `fieldOperatorId` a las factories y a todos los usos (corrección completa).
- **Opción B**: Documentar explícitamente en el código que `fieldOperatorId` no puede cambiar en sesión y añadir un test que valide ese invariante.

**Archivos afectados**: `src/lib/routes/queryKeys.ts`, `src/hooks/useFieldOrders.ts`, `src/hooks/useFieldRoutes.ts`

---

### P05 — `autoventaMutation.onSuccess`: invalidación con key hardcodeada

- **ID**: P05
- **Severidad**: Alto
- **Impacto**: Medio
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Creación de autoventa en field

**Síntoma**

La tercera invalidación de `autoventaMutation.onSuccess` usa una key hardcodeada en lugar de una factory. Si la estructura de la key cambia (por ejemplo, al añadir `fieldOperatorId` por P04), esta invalidación quedará rota silenciosamente.

**Evidencia**

`src/hooks/useFieldOrders.ts:73-77`
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: fieldOrderKeys.list(tenantId) });    // factory ✓
  queryClient.invalidateQueries({ queryKey: fieldRouteKeys.list(tenantId) });    // factory ✓
  queryClient.invalidateQueries({ queryKey: ['field', 'customers', 'options', tenantId ?? 'unknown'] });
  //                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                                         key hardcodeada — no usa factory
},
```

**Cambio propuesto**

Crear factory `fieldCustomerOptionKeys.list(tenantId)` y usarla tanto aquí como en el hook que consume estas opciones.

**Archivos afectados**: `src/hooks/useFieldOrders.ts:76`, `src/lib/routes/queryKeys.ts`

---

### P06 — `RoutesPlannerPage`: componente monolítico (1404 líneas)

- **ID**: P06
- **Severidad**: Alto
- **Impacto**: Medio
- **Esfuerzo de corrección**: Alto
- **Riesgo de cambio**: Alto
- **Área**: Render / Componente
- **Flujo afectado**: Planificador de rutas comerciales

**Síntoma**

El componente más grande de la aplicación mezcla ~9 responsabilidades distintas en un único árbol de componentes. Cualquier cambio de estado local en cualquiera de ellas provoca re-renders del árbol completo.

**Evidencia**

`src/components/Comercial/Routes/RoutesPlannerPage.jsx` — 1404 líneas.

Responsabilidades identificadas:
1. Estado de metadatos de ruta (nombre, fecha, operador, plantilla).
2. Lista de paradas con drag-drop (`@dnd-kit`).
3. Geocoding async con `enrichStopsWithCoordinates`.
4. Cálculo de distancia/duración/coste vía `useRouteGeometry`.
5. Mapa Mapbox con marcadores.
6. Dialog de edición de metadatos.
7. Dialog de edición de parada individual.
8. Gestión de plantillas (cargar/guardar).
9. Serialización y llamada al servicio de guardado.

**Impacto**: Re-renders del mapa al editar un campo de texto de metadata. Re-renders de la lista de paradas al abrir el dialog de metadata. Coste de parse/compile JS elevado en carga inicial.

**Cambio propuesto (progresivo, un PR por componente)**:
1. `RoutePlannerMetadataForm` — metadatos.
2. `RoutePlannerStopList` — lista drag-drop.
3. `RoutePlannerStopEditor` — dialog de parada.
4. `RoutePlannerMap` — mapa (puede existir parcialmente).
5. `RoutePlannerSummary` — estadísticas de ruta.
6. `useRoutePlannerState` — hook de estado de edición.

**Archivos afectados**: `src/components/Comercial/Routes/RoutesPlannerPage.jsx` + nuevos archivos.

---

### P07 — `FieldOrderExecutionPage`: 591 líneas + fetch directo sin React Query

- **ID**: P07
- **Severidad**: Alto
- **Impacto**: Medio
- **Esfuerzo de corrección**: Alto
- **Riesgo de cambio**: Alto
- **Área**: Render / Red
- **Flujo afectado**: Ejecución de pedidos en field

**Síntoma**

Componente con múltiples responsabilidades (wizard multi-step, QR scan, pricing, pedido read-only) y una llamada directa a un servicio de API sin pasar por React Query.

**Evidencia**

`src/components/Field/FieldOrderExecutionPage.jsx` — 591 líneas.

El componente implementa un wizard de 6 pasos: Pedido → Previsión → Cajas (QR scan) → Precios → Resumen → Confirmar. Cada paso es una responsabilidad diferente que actualmente está inline.

Además, basado en el análisis del agente explorador, el componente importa y llama directamente a `getFieldProductsOptions` del servicio:
```jsx
import { getFieldProductsOptions } from '@/services/fieldOperatorService';
// Llamada directa sin React Query
```
Esto significa:
- Sin caché: cada apertura del componente hace una request nueva.
- Sin deduplicación: si el componente se monta varias veces, múltiples requests simultáneas.
- Sin error boundary de React Query: los errores se manejan ad-hoc.

**Cambio propuesto**:
1. Crear `useFieldProductsOptions` hook con `useQuery` y `enabled` condicional.
2. Partir el wizard en componentes de paso: `FieldOrderStep1`, `FieldOrderStep2`, etc.
3. El estado del wizard puede residir en un hook `useFieldOrderWizardState`.

**Archivos afectados**: `src/components/Field/FieldOrderExecutionPage.jsx`, nuevo hook `useFieldProductsOptions`.

---

### P08 — `AgendaPageClient` (700 líneas) y `FieldRouteExecutionPage` (450 líneas)

- **ID**: P08
- **Severidad**: Medio
- **Impacto**: Medio
- **Esfuerzo de corrección**: Medio
- **Riesgo de cambio**: Medio
- **Área**: Render
- **Flujo afectado**: Agenda CRM, ejecución de ruta en field

**Síntoma**

Dos componentes con densidad de responsabilidades que concentran re-renders y dificultan la mantenibilidad.

**Evidencia**

`src/components/Comercial/CRM/AgendaPageClient.jsx` — 700 líneas: grid de calendario, dialog de día, filtros, acciones de agenda, summary stats.

`src/components/Field/FieldRouteExecutionPage.jsx` — 450 líneas: mapa, drawer de paradas, detalle de parada, dialog de resultado, navegación GPS, creación de autoventa.

**Cambio propuesto**:
- `AgendaPageClient`: extraer `AgendaFilterDialog`, `AgendaDayDialog`, `AgendaCalendarGrid`.
- `FieldRouteExecutionPage`: extraer `RouteStopDrawer`, `RouteStopDetail`, `RouteStopResultDialog`.

**Archivos afectados**: los dos archivos mencionados + nuevos componentes hijos.

---

### P09 — `useCommercialInteractions.normalizeQueryParams`: no ordena keys

- **ID**: P09
- **Severidad**: Medio
- **Impacto**: Bajo
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Listado de interacciones comerciales

**Síntoma**

`useCommercialInteractions` tiene su propia `normalizeQueryParams` que filtra nulos y vacíos, pero NO ordena las claves del objeto resultado. Si el mismo set de filtros se pasa con orden de claves diferente en distintas llamadas, se producen entradas de caché distintas.

**Evidencia**

`src/hooks/useCommercialInteractions.ts:6-18`
```ts
function normalizeQueryParams(params: Record<string, unknown> = {}) {
  return Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value == null || value === '') return acc;
    // ... filtra arrays vacíos
    acc[key] = value;
    return acc;
  }, {});
  // ↑ No hay sort de keys, no hay normalización de arrays
}
```

Contraste con `normalizeQueryParams` de `queryKeys.ts` que sí ordena:
```ts
.sort(([left], [right]) => left.localeCompare(right))
```

**Cambio propuesto**: Reemplazar la función local por la importada de `queryKeys.ts`:
```ts
import { normalizeQueryParams } from '@/lib/routes/queryKeys'; // si se exporta
```
O bien, añadir sort de keys a la función local.

**Archivos afectados**: `src/hooks/useCommercialInteractions.ts:6-18`

---

### P10 — `useCustomerAssignment.onSuccess`: key hardcodeada para queries admin

- **ID**: P10
- **Severidad**: Medio
- **Impacto**: Bajo
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Asignación de cliente a vendedor/operador

**Síntoma**

`useCustomerAssignment.onSuccess` invalida tres queries, dos con factories y una con key hardcodeada. Si la estructura de la key admin cambia, la invalidación dejará de funcionar silenciosamente.

**Evidencia**

`src/hooks/useCustomerAssignment.ts:26-29`
```ts
onSuccess: async (_, variables) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['customers', 'list', tenantId] }),          // factory candidata
    queryClient.invalidateQueries({ queryKey: ['crm', 'customers', 'detail', tenantId, variables.customerId] }),  // factory candidata
    queryClient.invalidateQueries({ queryKey: ['admin', 'customers', 'assignment', variables.customerId] }),      // hardcodeada
  ]);
},
```

**Cambio propuesto**: Crear factories para las tres keys o al menos documentar el origen de cada una.

**Archivos afectados**: `src/hooks/useCustomerAssignment.ts`

---

### P11 — `console.error` hardcodeado en ruta de producción de `fetchWithTenant.js`

- **ID**: P11
- **Severidad**: Medio
- **Impacto**: Bajo
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: Auth / transporte
- **Flujo afectado**: Todas las requests con respuesta de error HTTP

**Evidencia**

`src/lib/fetchWithTenant.js:139`
```js
console.error('❌ Error JSON recibido:', errorJson);
```

Se ejecuta en cada request no-ok (400, 403, 404, 422, 500, etc.). En producción expone en la consola del navegador el body completo del error del backend.

**Cambio propuesto**:
```js
if (process.env.NODE_ENV === 'development') {
  console.error('❌ Error JSON recibido:', errorJson);
}
```

**Archivos afectados**: `src/lib/fetchWithTenant.js:139`

---

### P12 — `OrdersList`: `fetchWithTenant` directo para exportación XLS sin React Query

- **ID**: P12
- **Severidad**: Medio
- **Impacto**: Medio
- **Esfuerzo de corrección**: Medio
- **Riesgo de cambio**: Bajo
- **Área**: Red
- **Flujo afectado**: Exportación XLS de pedidos activos/planificados

**Síntoma**

El componente importa y llama directamente a `fetchWithTenant` para descargar un archivo XLS, bypaseando React Query. No hay caché, deduplicación ni error handling estructurado.

**Evidencia**

`src/components/Admin/OrdersManager/OrdersList/index.js` (línea ~84):
```js
const response = await fetchWithTenant(`${API_URL_V2}orders/xlsx/active-planned-products`, { ... });
```

**Causa raíz**: Las descargas de archivos (blobs) no encajan bien en el modelo de `useQuery` para datos serializables, por lo que es común hacerlas con fetch directo. Sin embargo, el manejo de errores y el estado de loading deberían ser explícitos.

**Cambio propuesto**: Extraer a una función de servicio (`orderService.downloadActivePlannedXlsx()`) equivalente a `crmService.downloadOfferPdf()` — que ya sigue el patrón correcto. El componente gestiona el estado de loading/error localmente con `useState`, pero al menos el transporte queda centralizado.

**Archivos afectados**: `src/components/Admin/OrdersManager/OrdersList/index.js`, potencialmente `src/services/orderService.ts`

---

### P13 — `geocodeCache` de módulo sin TTL ni límite de tamaño

- **ID**: P13
- **Severidad**: Bajo
- **Impacto**: Bajo
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: Singleton de módulo
- **Flujo afectado**: Planificador de rutas (sesiones largas con muchas rutas distintas)

**Evidencia**

`src/lib/routes/routeStops.ts:16-17`
```ts
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();
```
Sin TTL, sin límite de entradas. En sesiones largas con muchas rutas únicas puede crecer indefinidamente.

**Cambio propuesto**:
```ts
const MAX_GEOCODE_CACHE_SIZE = 500;
// En geocodeStop, antes de insertar en cache:
if (geocodeCache.size >= MAX_GEOCODE_CACHE_SIZE) {
  geocodeCache.delete(geocodeCache.keys().next().value!);
}
geocodeCache.set(query, coordinates);
```

**Archivos afectados**: `src/lib/routes/routeStops.ts`

---

### P14 — `useRouteTemplateMutations`: `normalizeRouteCollection([x])[0]` vs `normalizeRouteEntity(x)`

- **ID**: P14
- **Severidad**: Bajo
- **Impacto**: Bajo
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Actualización de plantilla de ruta

**Evidencia**

`src/hooks/useRouteTemplates.ts:50-52`
```ts
const updatedTemplate = normalizeRouteCollection([
  ((response as ...) ?.data ?? response) as Partial<DeliveryRoute>,
])[0];
```

`normalizeRouteCollection` itera un array de N items. Para normalizar uno solo, `normalizeRouteEntity` es semánticamente correcto y directo.

Contraste con el patrón en `useRoutes.ts:60-62` que usa `normalizeRouteEntity` correctamente.

**Cambio propuesto**: Sustituir por `normalizeRouteEntity((response as ...)?.data ?? response)`.

**Archivos afectados**: `src/hooks/useRouteTemplates.ts:50-52`

---

## 5. Confirmaciones Positivas

Patrones correctos verificados en código que **no deben modificarse**:

### ✓ Auth token: caché con deduplicación de promesa en vuelo

`src/lib/auth/getAuthToken.ts` — implementación completa: caché con expiración basada en JWT, buffer de 30 segundos, `pendingClientTokenPromise` para deduplicar múltiples calls simultáneas, `clearAuthTokenCache()` disparado en 401. Patrón de referencia para el resto del proyecto.

### ✓ Query key factories con normalización completa

`src/lib/routes/queryKeys.ts` — `normalizeQueryParams` filtra nulos, ordena claves y normaliza arrays a strings ordenados. Garantiza estabilidad de keys independientemente del orden de parámetros. Usado correctamente en `useRoutes`, `useFieldRoutes`, `useFieldOrders`, `useRouteTemplates`.

### ✓ `enabled` guards en hooks de field y rutas

`useFieldOrders`, `useFieldRoutes`, `useRoutes`, `useRouteTemplates`, `useFieldRoute` — todos comprueban `Boolean(token) && Boolean(tenantId)` antes de activar la query. `useFieldOrders` y `useFieldRoutes` añaden también `Boolean(fieldOperatorId)`.

### ✓ `setQueryData` para patch local en updates

`useRoutes.ts` (update mutation), `useFieldRoutes.ts` (stop mutation), `useRouteTemplates.ts` (update mutation) — todos usan `setQueryData` para actualizar la caché directamente tras una mutación exitosa, evitando un refetch innecesario. El resultado de la mutación se normaliza y se escribe en el caché de detalle y en cada entrada de lista que coincida.

### ✓ Lazy loading por tabs en `CustomersPageClient`

`src/components/Comercial/CRM/CustomersPageClient.jsx:~25-45`
```js
const shouldLoadOrders       = activeTab === 'orders';
const shouldLoadInteractions = activeTab === 'interactions';
const shouldLoadOffers       = activeTab === 'offers';
// ...
useCustomerOrderHistory(customerId, { enabled: shouldLoadOrders });
useCommercialInteractions({ customerId, enabled: shouldLoadInteractions });
useOffersList({ customerId, enabled: shouldLoadOffers });
```
Implementa correctamente el principio de carga diferida por visibilidad: las queries de tab no activa no se ejecutan. Además, resetea el tab activo al cambiar de cliente.

### ✓ Optimistic updates + rollback en `useProspects` y `useCommercialInteractions`

`src/hooks/useProspects.ts` — `updateProspect` con `onMutate` (guarda estado previo y aplica patch optimista), `onError` con rollback al estado anterior, `onSuccess` con reconciliación mínima.

`src/hooks/useCommercialInteractions.ts` — `createInteraction` con `onMutate` que inserta una interacción temporal con ID `tmp-${Date.now()}`, `onError` con rollback de las listas afectadas, `onSuccess` que sustituye el item temporal por el creado real.

### ✓ Invalidaciones parametrizadas y dirigidas en hooks CRM

`useAgendaMutations`, `useOfferMutations`, `useCommercialInteractionMutations` usan helpers de invalidación (`invalidateAgendaQueries`, `invalidate`) que solo invalidan las queries realmente afectadas. `useCommercialInteractionMutations` va más lejos: `matchInteractionQueryByTarget` filtra qué listas de interacciones deben actualizarse según el target (prospect vs customer) del payload.

### ✓ Control de concurrencia y deduplicación en geocoding

`src/lib/routes/routeStops.ts` — `GEOCODE_CONCURRENCY = 3` limita las requests simultáneas. `pendingGeocodeRequests` Map deduplica requests en vuelo para la misma dirección. `geocodeCache` evita re-geocodificar direcciones ya resueltas.

### ✓ Cancelación de efectos en `useRouteGeometry`

`src/hooks/useRouteGeometry.ts:29-72` — el `useEffect` usa flag `cancelled` para ignorar resultados de peticiones de geometría que llegan después de un cambio de dependencias o desmontaje del componente.

### ✓ Memoización de firma de coordenadas

`src/hooks/useRouteGeometry.ts:26-27` — `coordinateSignature` es un string memoizado derivado de las coordenadas reales. `geometryStops` depende de `coordinateSignature`, no del array `stops` directamente, evitando recálculos por referencias inestables del array.

### ✓ QueryClient con configuración base sensata para B2B

`src/lib/queryClient.js` — `staleTime: 60_000` (1 minuto) y `refetchOnWindowFocus: false` son valores razonables para una app B2B donde los datos no cambian a alta frecuencia y la ventana puede quedar en segundo plano.

---

## 6. Plan de Remediación por Fases

### Fase 1 — Quick wins ✅ COMPLETADA (2026-03-23)

| Tarea | Hallazgo | Estimado | Estado |
|---|---|---|---|
| Normalizar query key en `useComercialOrders` (crear factory) | P01 | 45 min | ✅ |
| Normalizar query keys en `useAgenda` y `useOffersList` | P02 | 30 min | ✅ |
| Normalizar query key en `useCustomersList` | P03 | 20 min | ✅ |
| Sustituir key hardcodeada en `autoventaMutation.onSuccess` | P05 | 30 min | ✅ |
| Ordenar keys en `normalizeQueryParams` de `useCommercialInteractions` | P09 | 20 min | ✅ |
| Eliminar key hardcodeada en `useCustomerAssignment.onSuccess` | P10 | 20 min | ✅ |
| Condicionizar `console.error` en `fetchWithTenant.js` | P11 | 10 min | ✅ |
| Añadir `MAX_GEOCODE_CACHE_SIZE` en `routeStops.ts` | P13 | 20 min | ✅ |
| Sustituir `normalizeRouteCollection([x])[0]` → `normalizeRouteEntity(x)` | P14 | 10 min | ✅ |

**Total Fase 1: ~3.5 horas de desarrollo. 9/9 tareas completadas.**
Todos los cambios fueron de código cliente puro, sin impacto en API ni en flujos de negocio.

### Fase 2 — Estabilización estructural ✅ COMPLETADA (2026-03-23)

| Tarea | Hallazgo | Estimado | Estado |
|---|---|---|---|
| Implementar cookie `__session_verified` TTL 60s en middleware (Opción C) | P-MW | 2h impl. | ✅ |
| Añadir `fieldOperatorId` a query keys de field | P04 | 2h | ✅ |
| Crear hook `useFieldProductsOptions` + refactorizar `FieldOrderExecutionPage` | P07 | 1.5h | ✅ |
| Extraer `RouteMapSection`, `StopDetailDrawer`, `StopsListDrawer`, `ResultDialog` | P08 | 2h | ✅ |
| Extraer `AgendaFiltersDialog` y `AgendaHeaderControls` de `AgendaPageClient` | P08 | 1h | ✅ |
| Extraer `downloadActivePlannedProductsXls` a `orderService.ts` + limpiar estado muerto | P12 | 1h | ✅ |

**Total Fase 2: ~9.5 horas de desarrollo. 6/6 tareas completadas.**

### Fase 3 — Hardening estructural ✅ COMPLETADA (2026-03-23)

| Tarea | Hallazgo | Estado |
|---|---|---|
| Partir `RoutesPlannerPage` (1404 líneas) — extraídos 9 archivos | P06 | ✅ |
| Partir `FieldOrderExecutionPage` en steps especializados | P07 | ✅ |
| Añadir regla ESLint `no-restricted-syntax` para query keys hardcodeadas | P01-P05 | ✅ |
| Añadir validación de performance para flujos críticos en PR | — | ⏭ No aplica (infraestructura CI externa) |

---

## 7. Checklist de Validación Post-Remediación

### React Query DevTools

- [ ] `useComercialOrders({})` llamado dos veces en el mismo render: ¿misma entrada de caché?
- [ ] `useAgenda({})` con mismos params pero distinta referencia de objeto: ¿misma entrada de caché?
- [ ] Crear autoventa: ¿la lista de clientes disponibles se invalida correctamente?
- [ ] Actualizar una plantilla de ruta: ¿la lista refleja el cambio sin refetch?
- [ ] Actualizar parada de ruta en field: ¿se usa `setQueryData` o refetch?

### Network (DevTools)

- [ ] Navegar entre `/comercial/agenda` → `/comercial/rutas` → `/comercial/clientes`: ¿cuántas requests a `/me` se hacen? (tras P-MW)
- [ ] Abrir tab de Órdenes en detalle de cliente: ¿request solo al activar la tab? ✓ (ya funciona, verificar que sigue igual)
- [ ] Abrir tab de Interacciones en detalle de cliente: ídem.
- [ ] Crear interacción: ¿aparece en la lista inmediatamente (optimista) antes de confirmación del servidor?

### Regresiones funcionales

- [ ] Flujo de autoventa en field: crear pedido, verificar invalidación de clientes disponibles.
- [ ] Planificador de rutas: crear ruta, añadir paradas, geocoding, guardar.
- [ ] Agenda: filtrar, reagendar y cancelar eventos.
- [ ] Ejecución de ruta en field: completar parada, registrar resultado.
- [ ] Asignación de cliente a vendedor: verificar que la lista de clientes se actualiza.
- [ ] Exportación XLS de pedidos: verificar que descarga sigue funcionando.

---

## 8. Riesgos, Trade-offs y Rollback

### P-MW — Modificación del middleware

- **Riesgo**: Eliminar la llamada a `/me` introduce una ventana de tiempo donde un usuario desactivado en el backend puede seguir navegando hasta la expiración del JWT.
- **Trade-off**: Seguridad vs rendimiento. Depende del tiempo de expiración del JWT y del caso de uso real de desactivación de usuarios.
- **Mitigación**: Implementar mecanismo alternativo de revocación (cookie de sesión con TTL, `tokenVersion` en JWT) antes de eliminar la llamada.
- **Rollback**: Revertir el commit del middleware. Impacto inmediato, sin necesidad de limpiar estado persistido.

### P01-P03, P09 — Cambios de query keys en hooks CRM

- **Riesgo**: Si hay código que invalida estas keys con el formato anterior, la invalidación dejará de funcionar hasta que se actualice.
- **Mitigación**: Buscar todos los usos de cada key antes de cambiar (`grep -r "'crm'.*'orders'"`, etc.) y actualizar en el mismo PR.
- **Rollback**: Revertir el commit. Las queries vuelven al formato anterior sin pérdida de datos.

### P04 — Añadir `fieldOperatorId` a query keys de field

- **Riesgo**: Afecta a todas las invalidaciones existentes de `fieldOrderKeys` y `fieldRouteKeys`. Si alguna mutación invalida por key parcial, puede no alcanzar la caché correcta.
- **Mitigación**: Actualizar TODAS las referencias en el mismo PR y probar el flujo completo de field antes de merge.
- **Rollback**: Revertir el PR completo.

### P06, P07, P08 — Partición de componentes grandes

- **Riesgo**: El estado compartido entre responsabilidades puede particionarse incorrectamente, produciendo bugs en flujos complejos (drag-drop, geocoding async, wizard multi-step).
- **Mitigación**: Partir de forma incremental (un componente por PR, no toda la refactorización de golpe). Tests manuales del flujo completo tras cada PR.
- **Rollback**: Cada PR de partición es reversible individualmente.

---

## 9. Relación con el Playbook CMR/Comercial

El playbook `docs/audits/cmr-comercial-performance-playbook.md` identificó 13 patrones problemáticos en la ronda anterior. Estado actual:

| Patrón del playbook | Estado tras refactor actual |
|---|---|
| Consulta de sesión por request | **RESUELTO** — `getAuthToken` con caché y dedup de promesa ✓ |
| Carga eager de datos de tabs no visibles | **RESUELTO** — `CustomersPageClient` con lazy loading por tab ✓ |
| Estado de tab heredado al cambiar entidad | **RESUELTO** — `useEffect([customerId])` resetea tab ✓ |
| Invalidaciones globales | **RESUELTO** — P05 y P10 usan factories; P-MW resuelto con Opción C (cookie TTL 60s) en Fase 2 ✓ |
| Mutaciones con refetch evitable | **RESUELTO** — `setQueryData` en updates de rutas/field ✓ |
| Búsqueda sin debounce | **NO VERIFICADO** — no había evidencia en el código leído; verificar en filtros de listados |
| Formularios cargando catálogos cerrados | **RESUELTO en CRM** — `enabled` guards correctos ✓ |
| Geocoding masivo sin límite | **RESUELTO** — `GEOCODE_CONCURRENCY = 3`, dedup pendiente ✓ |
| Agenda con ráfagas de requests | **PARCIALMENTE** — query key de `useAgenda` sin normalizar (P02) |
| Rutas con carga eager | **RESUELTO** — `enabled` guards en todos los hooks de rutas ✓ |
| Query keys inestables | **RESUELTO** — P01-P03, P09 normalizados con factories y `normalizeQueryParams` en Fase 1 ✓ |

**Regresiones respecto al playbook**: ninguna detectada. Los patrones ya resueltos siguen correctos.

**Nuevos hallazgos no cubiertos por el playbook**:
- P-MW (middleware /me por request) — no existía en el playbook.
- P06, P07, P08 (componentes monolíticos) — el playbook los mencionaba como riesgo pero no los cuantificaba.
