# Auditoría del panel Superadmin — Estado del frontend

> **Fecha auditoría:** 2026-06-23  
> **Fecha cierre:** 2026-06-23  
> **Referencia backend:** `docs/to do/superadmin-tenant-audit.md`  
> **Alcance:** Mapeo completo del circuito frontend superadmin contrastado con los endpoints documentados.
> **Estado:** ✅ Todos los gaps identificados resueltos en la misma sesión.

---

## Resumen ejecutivo

El circuito superadmin estaba **muy bien implementado en su núcleo**: la separación de tokens era correcta, la base HTTP no enviaba `X-Tenant`, la autenticación magic link + OTP funcionaba, y el CRUD completo de tenants con su ciclo de vida estaba cubierto. Se identificaron y corrigieron **2 bugs silenciosos**, **1 módulo ausente**, y **8 gaps menores**.

---

## Inventario de archivos del módulo

```
src/app/superadmin/
├── layout.js                        → wrapper Server Component
├── SuperadminLayoutClient.jsx        → sidebar, breadcrumb, auth guard cliente
├── page.js                          → dashboard
├── login/page.js                    → login (magic link + OTP)
├── tenants/page.js                  → listado de tenants
├── tenants/new/page.js              → crear tenant
├── tenants/[id]/page.js             → detalle tenant (tabs)
├── alerts/page.js                   → alertas del sistema
├── impersonation/page.js            → historial + sesiones activas
├── admins/page.js                   → gestión de admins superadmin [NUEVO]
├── feature-flags/page.js            → feature flags globales [NUEVO]
└── system/page.js                   → cola + migraciones + error logs globales

src/components/Superadmin/
├── LoginForm.jsx
├── DashboardCards.jsx
├── ActivityFeed.jsx
├── AlertsWidget.jsx
├── QueueHealthWidget.jsx
├── ActiveSessionsBanner.jsx
├── TenantsTable.jsx
├── TenantForm.jsx
├── StatusBadge.jsx
├── FilterTabs.jsx
├── EmptyState.jsx
├── SubdomainField.jsx
├── AdminsManager.jsx                 [NUEVO]
├── GlobalFeatureFlagsTable.jsx       [NUEVO]
└── TenantDetailSections/
    ├── GeneralData.jsx
    ├── StatusActions.jsx
    ├── OnboardingProgress.jsx
    ├── TenantUsersTable.jsx
    ├── ImpersonationButtons.jsx
    ├── TokensTab.jsx
    ├── BlocklistTab.jsx
    ├── MigrationsTab.jsx
    ├── FeatureFlagsTab.jsx
    └── ErrorLogsTab.jsx

src/lib/superadminApi.js             → HTTP client (fetchSuperadmin, token helpers)
src/context/SuperadminAuthContext.jsx → proveedor de auth superadmin
src/configs/superadminConfig.js      → SUPERADMIN_API_URL
src/utils/superadminDateUtils.js     → helpers de fecha
```

---

## ✅ Implementado correctamente (preexistente)

### Arquitectura HTTP / separación de sistemas

- `fetchSuperadmin` en `src/lib/superadminApi.js` **no envía `X-Tenant`** ✅
- Token almacenado en `sessionStorage` bajo clave `__superadmin_token__`, completamente separado de la sesión NextAuth tenant ✅
- `SUPERADMIN_API_URL` derivado de `API_BASE_URL + /api/v2/superadmin` con override por env var `NEXT_PUBLIC_SUPERADMIN_API_URL` ✅
- El middleware (`src/middleware.ts:69`) hace `return NextResponse.next()` para todas las rutas `/superadmin`, delegando el auth guard al cliente ✅
- Manejo de 401 → evento `superadmin:unauthorized` → redirect a login ✅
- Manejo de 429 y 422 con mensajes diferenciados ✅

### Autenticación (sección 2)

| Endpoint | Estado |
|---|---|
| `POST /auth/request-access` | ✅ |
| `POST /auth/verify-otp` con auto-submit al completar 6 dígitos | ✅ |
| `POST /auth/verify-magic-link` desde parámetro `?token=` en URL | ✅ |
| Cooldown de reenvío (60s) | ✅ |
| `GET /auth/me` al montar el contexto | ✅ |
| `POST /auth/logout` | ✅ |

### Dashboard (sección 11)

| Elemento | Endpoint | Estado |
|---|---|---|
| Stats por estado | `GET /dashboard` | ✅ |
| Feed de actividad | `GET /dashboard/activity` | ✅ |
| Widget de alertas | `GET /alerts?resolved=false` | ✅ |
| Badge en sidebar con polling 60s | `GET /alerts?resolved=false` | ✅ |
| Estado de la cola | `GET /system/queue-health` | ✅ |
| Banner sesiones activas con polling 30s | `GET /impersonation/active` | ✅ |

### CRUD de tenants (sección 3)

| Operación | Endpoint | Estado |
|---|---|---|
| Listado paginado con filtros y búsqueda | `GET /tenants` | ✅ |
| Creación con todos los campos | `POST /tenants` | ✅ |
| Detalle | `GET /tenants/{id}` | ✅ |
| Edición (solo campos permitidos; `subdomain` y `database` readonly) | `PUT /tenants/{id}` | ✅ |
| Eliminación con `?confirm_delete=true` + checkbox `drop_database` | `DELETE /tenants/{id}` | ✅ |

### Ciclo de vida de estados (sección 4.1)

Botones condicionados por estado con lógica correcta — sin cambios requeridos.

### Onboarding (sección 4.2 — 4.4)

Progress bar 8 pasos, polling 4s, stalled detection, retry — sin cambios requeridos.

### Tabs del detalle de tenant

Tokens, Migraciones, Feature Flags por tenant, Errores por tenant — sin cambios requeridos.

### Alertas (sección 10.5–10.6)

Página completa con filtros, tab "Resueltas", resolver individual, paginación — sin cambios requeridos.

---

## ✅ Bugs corregidos

### Bug 1 — Impersonación silenciosa no abría ninguna pestaña

**Archivo:** `src/components/Superadmin/TenantDetailSections/ImpersonationButtons.jsx`

**Causa:** El código original comprobaba `if (data.redirect_url)` pero la API devuelve `access_token` + `tenant` (subdomain string), nunca `redirect_url`. La condición era siempre `false`, el log de impersonación quedaba abierto indefinidamente y no se hacía nada útil.

**Corrección:** Reescritura completa del componente:
- Helper `openTenantWithToken(subdomain, accessToken)`: abre `https://${subdomain}.lapesquerapp.es` en nueva pestaña y copia el token al portapapeles con `navigator.clipboard.writeText`.
- `handleSilent` usa `data.tenant ?? tenantSubdomain` para construir la URL.
- Nueva prop `tenantSubdomain` añadida (y pasada desde `TenantUsersTable`).
- Flujo con consentimiento completado: diálogo con `reason`, estado `pendingRequest`, botón "Usar token" que llama a `POST /impersonate/token`.

### Bug 2 — QueueHealthWidget siempre mostraba "Cola no disponible"

**Archivo:** `src/components/Superadmin/QueueHealthWidget.jsx`

**Causa:** `const isUnhealthy = !health.healthy` donde `health.healthy` no existe en la respuesta documentada `{pending_jobs, failed_jobs, driver}`. `!undefined === true` siempre, el widget siempre mostraba estado de error.

**Corrección:** Eliminadas referencias a `health.healthy` y `health.redis_status`. Estado derivado únicamente de campos documentados: `failedJobs = health.failed_jobs ?? 0`, punto verde si no hay fallidos, rojo si hay. Muestra contador de pendientes si `> 0`.

---

## ✅ Gaps corregidos

### Gap 1 — ActivityFeed: campos no coincidían con la documentación

**Corrección:** Fallbacks duales en `ActivityFeed.jsx`: `item.description ?? item.message`, `item.timestamp ?? item.at`. El componente ahora es robusto a ambas variantes de respuesta.

### Gap 2 — Onboarding badge ausente en la lista de tenants

**Corrección:** Sub-componente `OnboardingDot` añadido en `TenantsTable.jsx`. Lee `t.onboarding.status` y muestra un punto de color (verde `completed`, ámbar `in_progress`, rojo `failed`, gris `pending`) junto al `StatusBadge` en la columna Status.

### Gap 3 — Blocklist: sin distinción entre activos y expirados

**Corrección:** Helper `isBlockExpired(block)` en `BlocklistTab.jsx`. Filas expiradas con `opacity-50`. Columna "Expira" muestra "Expirado · {fecha}" para bloques ya vencidos. Contador del header cuenta solo activos: `blocks.filter(b => !isBlockExpired(b)).length`.

### Gap 4 — Planes inconsistentes: `'pro'` en lugar de `'professional'`

**Corrección:** `PLAN_OPTIONS` actualizado a `['basic', 'professional', 'enterprise']` en `TenantForm.jsx` y `GeneralData.jsx`.

### Gap 5 — Módulo de gestión de admins superadmin ausente

**Corrección:** Creados:
- `src/components/Superadmin/AdminsManager.jsx` — tabla de superadmins, crear (formulario), eliminar con self-delete guard (botón deshabilitado para la propia cuenta), badge "Tú" en la fila del usuario actual.
- `src/app/superadmin/admins/page.js` — wrapper.
- Entrada "Administradores" añadida en `NAV_GESTION` del sidebar, con icono `Users`.

### Gap 6 — Feature flags globales sin página

**Corrección:** Creados:
- `src/components/Superadmin/GlobalFeatureFlagsTable.jsx` — tabla de flags con toggle `Switch`, badge de plan mínimo, descripción. Llama a `GET /feature-flags` y `PUT /feature-flags/{key}`.
- `src/app/superadmin/feature-flags/page.js` — wrapper.
- Entrada "Feature Flags" añadida en `NAV_SISTEMA` del sidebar, con icono `Flag`.

### Gap 7 — Logs de error globales solo existían por tenant

**Corrección:** Componente `GlobalErrorLogs` añadido en `src/app/superadmin/system/page.js`. Llama a `GET /error-logs` con filtro de fecha. Tabla con nivel (badge color), mensaje truncado, expansión de contexto JSON.

### Gap 8 — SuperadminLayoutClient sin entradas de navegación para los nuevos módulos

**Corrección:** Actualizado `SuperadminLayoutClient.jsx`:
- `NAV_GESTION`: añadida entrada `Administradores` (`/superadmin/admins`, icono `Users`).
- `NAV_SISTEMA`: añadida entrada `Feature Flags` (`/superadmin/feature-flags`, icono `Flag`).
- `labels` del breadcrumb: añadidos `admins` y `feature-flags`.
- `TenantUsersTable.jsx`: añadida prop `tenantSubdomain={tenant.subdomain}` a `ImpersonationButtons`.

---

## Checklist final del backend vs. frontend

### Autenticación
- [x] Formulario email → `POST /auth/request-access`
- [x] Pantalla OTP con InputOTP → `POST /auth/verify-otp`
- [x] Magic link desde URL → `POST /auth/verify-magic-link`
- [x] Token almacenado separado de sesión tenant
- [x] Logout → `POST /auth/logout`
- [x] `GET /auth/me` al entrar al panel

### Dashboard
- [x] Conteos por estado → `GET /dashboard`
- [x] Feed de actividad → `GET /dashboard/activity` — fallbacks de campo añadidos
- [x] Alertas destacadas → `GET /alerts?resolved=false`
- [x] Estado de la cola → `GET /system/queue-health` — lógica corregida

### Listado de tenants
- [x] Tabla paginada → `GET /tenants`
- [x] Filtro por estado
- [x] Búsqueda por nombre o subdominio
- [x] Badge visual del estado de onboarding (`OnboardingDot`)
- [x] Indicador de color por estado del tenant

### Crear tenant
- [x] Formulario con todos los campos
- [x] Validación de subdominio
- [x] Plan options correctos (`basic` / `professional` / `enterprise`)
- [x] Polling de onboarding tras crear
- [x] Barra de progreso con paso actual
- [x] Estado fallido con botón "Reintentar"

### Detalle / editar tenant
- [x] Formulario de edición → `PUT /tenants/{id}`
- [x] `subdomain` y `database` solo lectura
- [x] Plan options correctos (`basic` / `professional` / `enterprise`)
- [x] Sección de onboarding con step actual
- [x] Botones de estado condicionados correctamente
- [x] Modal de confirmación antes de cambiar estado
- [x] Modal de eliminación con `drop_database` + `?confirm_delete=true`

### Usuarios del tenant
- [x] Lista → `GET /tenants/{id}/users`
- [x] Mensaje si onboarding incompleto

### Seguridad
- [x] Tokens activos → `GET /tenants/{id}/tokens`
- [x] Revocar individual → `DELETE /tenants/{id}/tokens/{tokenId}`
- [x] Revocar todos → `DELETE /tenants/{id}/tokens`
- [x] Blocklist con distinción activos/expirados — opacity-50 + contador correcto
- [x] Lista de bloqueos → `GET /tenants/{id}/blocks`
- [x] Formulario de bloqueo → `POST /tenants/{id}/block`
- [x] Desbloquear → `DELETE /tenants/{id}/blocks/{blockId}`

### Migraciones
- [x] Estado ejecutadas vs pendientes → `GET /tenants/{id}/migrations`
- [x] Ejecutar → `POST /tenants/{id}/migrations/run`
- [x] Historial → `GET /tenants/{id}/migrations/history`
- [x] Migrar todos → `POST /migrations/run-all`

### Impersonación
- [x] Impersonación silenciosa con razón → `POST /tenants/{id}/impersonate/silent`
- [x] Apertura de tenant en nueva pestaña + token copiado al portapapeles
- [x] Flujo completo con consentimiento (`reason` → `POST /impersonate/request` → `POST /impersonate/token`)
- [x] Finalizar desde el panel → `POST /impersonation/logs/{log}/end`
- [x] Historial con filtros → `GET /impersonation/logs`
- [x] Sesiones activas → `GET /impersonation/active`

### Feature flags
- [x] Tabla de flags globales por plan → `GET /feature-flags` — nueva página `/superadmin/feature-flags`
- [x] Toggle de flag global → `PUT /feature-flags/{key}`
- [x] Flags efectivos del tenant → `GET /tenants/{id}/feature-flags`
- [x] Toggle con razón → `PUT /tenants/{id}/feature-flags/{flag}`
- [x] Restaurar a valor del plan → `DELETE /tenants/{id}/feature-flags/{flag}`

### Observabilidad
- [x] Logs de error del tenant → `GET /tenants/{id}/error-logs`
- [x] Logs globales → `GET /error-logs` — sección añadida en `/superadmin/system`
- [x] Alertas con filtros → `GET /alerts`
- [x] Resolver alerta → `POST /alerts/{id}/resolve`

### Gestión de usuarios superadmin
- [x] Lista → `GET /admins`
- [x] Crear admin → `POST /admins`
- [x] Eliminar con self-delete guard → `DELETE /admins/{id}`
- [ ] Editar → `PUT /admins/{id}` — no implementado (no está en el checklist del backend como prioritario; se puede añadir cuando el backend lo requiera)

---

*Auditoría inicial: 2026-06-23. Todos los gaps resueltos: 2026-06-23.*
