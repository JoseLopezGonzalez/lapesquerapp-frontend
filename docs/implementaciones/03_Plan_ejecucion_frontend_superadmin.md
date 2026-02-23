# Plan de ejecución — Frontend Panel Superadmin

**Versión**: 1.0  
**Fecha**: 2026-02-23  
**Referencia**: [02_Spec_frontend_superadmin.md](./02_Spec_frontend_superadmin.md)  
**Objetivo**: Implementar el panel de superadmin integrado en el sistema actual (brisapp-nextjs), con un plan detallado y ordenado que encaje con la arquitectura existente.

---

## 1. Decisión de integración

### 1.1 Especificación vs plan de infraestructura

| Fuente | Enfoque |
|--------|--------|
| **Spec 02** | "Proyecto Next.js independiente", URL `admin.lapesquerapp.es`, puerto 3001 |
| **Plan 00** | "Ruta separada `/superadmin` con su propio layout", "Login propio en `/superadmin/login`" |

### 1.2 Recomendación: integrado en el mismo repo

Se recomienda **integrar el panel como rutas bajo `/superadmin`** en el mismo proyecto Next.js (brisapp-nextjs) por:

- **Coherencia con [00_Plan_infraestructura_SaaS.md](./00_Plan_infraestructura_SaaS.md)**: ya define rutas `/superadmin` y `/superadmin/login`.
- **Reutilización**: mismo stack (Next.js 16, React 19, NextUI/Radix, Tailwind), mismos patrones de layout y componentes.
- **Un solo despliegue**: un build, un dominio (o subruta); en producción se puede servir `admin.lapesquerapp.es` apuntando al mismo build con rewrites/dominio según infra.
- **Aislamiento lógico**: auth y cliente HTTP propios (sin next-auth ni `X-Tenant`), middleware que excluye `/superadmin` del flujo de tenants.

Si más adelante se exige **proyecto separado** (por seguridad, equipos o dominios distintos), el mismo código puede extraerse a un repo `pesquerapp-admin` con mínimos cambios (env, base path).

---

## 2. Ajustes al sistema actual

### 2.1 Middleware

- **Objetivo**: Las rutas `/superadmin` no deben pasar por next-auth ni por `roleConfig` de tenants.
- **Acción**:
  - En `config.matcher`, **no** incluir `/superadmin` (dejar que pase sin ejecutar la lógica de token JWT y roles).
  - Opcional: en la misma función, si `pathname.startsWith('/superadmin')` y no es `/superadmin/login`, comprobar si existe cookie o header de sesión superadmin y redirigir a `/superadmin/login` si no hay sesión (o hacer esta comprobación solo en layout cliente para simplificar).

**Archivo**: `src/middleware.ts`

- Añadir al inicio del middleware (tras los `pathname.startsWith` de estáticos):
  - Si `pathname.startsWith('/superadmin')` → `return NextResponse.next()` (no aplicar lógica tenant).
- Mantener `matcher` sin `/superadmin` para que las rutas superadmin no entren al middleware, **o** incluir `"/superadmin/:path*"` y dentro del middleware, para esas rutas, solo comprobar cookie de token superadmin (si se implementa cookie) y redirigir a login. Recomendación inicial: **no incluir superadmin en matcher** y proteger rutas en el layout de superadmin (cliente).

### 2.2 Configuración y variables de entorno

- **Nueva variable** (o uso de existente):
  - `NEXT_PUBLIC_SUPERADMIN_API_URL`: base de la API superadmin, sin trailing slash.  
    Ejemplo prod: `https://api.lapesquerapp.es/api/v2/superadmin`  
    Ejemplo dev: `http://localhost/api/v2/superadmin` (o la URL del backend local).
- **Archivo**: `src/configs/config.js` (o nuevo `src/configs/superadminConfig.js`):
  - Exportar `SUPERADMIN_API_URL = process.env.NEXT_PUBLIC_SUPERADMIN_API_URL || 'http://localhost/api/v2/superadmin'`.

### 2.3 Cliente HTTP superadmin

- **Regla**: No usar `fetchWithTenant` en superadmin (no enviar `X-Tenant`).
- **Acción**: Crear un cliente dedicado, por ejemplo `src/lib/superadminApi.ts` (o `.js`):
  - Base URL desde config superadmin.
  - Función `fetchSuperadmin(path, options)` que:
    - Añade `Authorization: Bearer {token}` (token obtenido de un store/context de superadmin).
    - No añade `X-Tenant`.
    - Si respuesta 401: redirigir a `/superadmin/login` (en cliente) o lanzar error que el layout maneje.
    - Si 429: mostrar mensaje tipo "Demasiadas peticiones, espera un momento".
    - Devuelve la respuesta o lanza con status/mensaje para que los componentes muestren errores (400, 422 con `errors`, etc.).

### 2.4 Estado de autenticación superadmin

- **Token**: Guardar en memoria (React context o Zustand) o en cookie httpOnly (más seguro, requiere API route para login).
- **Usuario**: Obtener con `GET /auth/me` al cargar la app y guardar en el mismo contexto/store.
- **Persistencia**: Si se usa solo memoria, al recargar se pierde; opción simple es `sessionStorage` para desarrollo y valorar cookie en producción.
- **Archivos sugeridos**:
  - `src/context/SuperadminAuthContext.tsx` (o store Zustand `src/stores/superadminAuthStore.ts`): guarda `token`, `user`, `setToken`, `logout`, `fetchMe`.
  - El cliente HTTP lee el token de este contexto/store.

---

## 3. Estructura de carpetas y archivos

```
src/
├── app/
│   └── superadmin/
│       ├── layout.js                 # Layout raíz: sidebar + header, protege rutas (redirige a login si no hay token)
│       ├── SuperadminLayoutClient.jsx # Sidebar (Dashboard, Tenants), header (usuario, logout)
│       ├── login/
│       │   └── page.js                # Login: email → request-access → OTP + magic link verify
│       ├── page.js                   # Dashboard (/)
│       ├── tenants/
│       │   ├── page.js               # Lista de tenants (filtros, búsqueda, paginación)
│       │   ├── new/
│       │   │   └── page.js           # Crear tenant (formulario + validación subdominio)
│       │   └── [id]/
│       │       └── page.js          # Detalle tenant (datos, acciones, onboarding, usuarios, impersonación)
├── components/
│   └── Superadmin/                   # Componentes específicos del panel
│       ├── LoginForm.jsx
│       ├── OtpStep.jsx
│       ├── DashboardCards.jsx
│       ├── TenantsTable.jsx
│       ├── TenantDetailSections/
│       │   ├── GeneralData.jsx
│       │   ├── StatusActions.jsx
│       │   ├── OnboardingProgress.jsx
│       │   ├── TenantUsersTable.jsx
│       │   └── ImpersonationButtons.jsx
│       ├── TenantForm.jsx            # Crear/editar tenant
│       ├── SubdomainField.jsx        # Validación + preview
│       └── StatusBadge.jsx
├── configs/
│   └── superadminConfig.js           # SUPERADMIN_API_URL (opcional, o en config.js)
├── context/
│   └── SuperadminAuthContext.tsx     # Token + user + logout + fetchMe
├── lib/
│   └── superadminApi.ts              # fetchSuperadmin (Bearer, sin X-Tenant, 401/429)
└── types/
    └── superadmin.ts                 # Tipos: Tenant, Dashboard, User, etc. (opcional si usas TS)
```

---

## 4. Fases de implementación en detalle

### Fase 0: Preparación (orden recomendado)

| # | Tarea | Archivos | Notas |
|---|--------|----------|--------|
| 0.1 | Añadir variable de entorno y config superadmin | `.env.example`, `src/configs/config.js` o `superadminConfig.js` | Documentar `NEXT_PUBLIC_SUPERADMIN_API_URL` |
| 0.2 | Crear cliente HTTP superadmin (sin X-Tenant, Bearer, 401/429) | `src/lib/superadminApi.ts` | Token inyectado desde contexto/store |
| 0.3 | Crear contexto/store de auth superadmin (token, user, logout, fetchMe) | `src/context/SuperadminAuthContext.tsx` | Integrar con cliente HTTP |
| 0.4 | Ajustar middleware: no aplicar lógica tenant a `/superadmin` | `src/middleware.ts` | `pathname.startsWith('/superadmin') → next()` y no incluir en matcher O incluir y solo redirigir si no cookie; recomendación: no matcher superadmin |

### Fase 1: Autenticación y layout

| # | Tarea | Descripción |
|---|--------|-------------|
| 1.1 | Página login `/superadmin/login` | Formulario email → POST request-access; transición a paso OTP (campo 6 dígitos, "Verificar", "Reenviar código" con cooldown 60s). Auto-verificar si `?token=xxx` (magic link). |
| 1.2 | Integración verify-otp y verify-magic-link | Al verificar, guardar `access_token` y user en contexto; redirigir a `/superadmin`. |
| 1.3 | Layout superadmin | `layout.js` que envuelve con `SuperadminAuthContext` y `SuperadminLayoutClient`. En cliente: si no hay token y ruta no es login, redirigir a `/superadmin/login`. |
| 1.4 | Sidebar y header | Navegación: Dashboard (`/superadmin`), Tenants (`/superadmin/tenants`). Header: nombre usuario (de `/me`), botón Cerrar sesión (POST logout + limpiar token). |
| 1.5 | Verificación inicial con `/me` | Al montar layout (o app), llamar GET `/auth/me`; si 401, redirigir a login. |

### Fase 2: Dashboard

| # | Tarea | Descripción |
|---|--------|-------------|
| 2.1 | Página dashboard `/superadmin` | GET `/dashboard`. Mostrar cards: Total, Activos, Suspendidos, Pendientes (y Cancelled si viene en la respuesta). |
| 2.2 | Bloque "Últimos tenants" | Usar `last_onboarding` (o lista si el backend lo amplía). Tabla: Nombre, Subdominio, Status, Fecha. |
| 2.3 | Acciones | Botones "Crear tenant" (→ `/superadmin/tenants/new`) y "Ver todos" (→ `/superadmin/tenants`). |

### Fase 3: Lista de tenants

| # | Tarea | Descripción |
|---|--------|-------------|
| 3.1 | Página `/superadmin/tenants` | GET `/tenants` con query params: `status`, `search`, `per_page`, `page`. |
| 3.2 | Filtros y búsqueda | Tabs o botones: Todos, Activos, Suspendidos, Pendientes, Cancelados. Campo búsqueda (debounce) por nombre/subdominio. |
| 3.3 | Tabla | Columnas: Nombre, Subdominio, Plan, Status (badge por color), Última actividad. Enlace a detalle por fila. |
| 3.4 | Paginación | Usar `meta` y `links` de la respuesta. Botón "+ Nuevo" → `/superadmin/tenants/new`. |

### Fase 4: Detalle de tenant

| # | Tarea | Descripción |
|---|--------|-------------|
| 4.1 | Página `/superadmin/tenants/[id]` | GET `/tenants/{id}`. Secciones: A. Datos generales, B. Acciones de estado, C. Onboarding (si pending y step < 8), D. Usuarios, E. Impersonación. |
| 4.2 | Datos generales | Tabla de solo lectura con botón "Editar". Modal o inline para PUT con campos editables (name, plan, renewal_at, timezone, branding_image_url, admin_email). subdomain y database solo lectura. |
| 4.3 | Acciones de estado | Botones según status: active → Suspender, Cancelar; suspended → Activar, Cancelar; pending → Activar, Cancelar, Reintentar onboarding; cancelled → Activar. Diálogo de confirmación antes de cada POST. |
| 4.4 | Barra de onboarding | Solo si `status === 'pending'` y `onboarding_step < 8`. 8 segmentos; completados en verde, actual animado. Polling GET `/tenants/{id}` cada 3–5 s. Botón "Reintentar" si >30 s en el mismo paso. Al llegar a paso 8: parar polling, toast "Onboarding completado", refrescar datos. |
| 4.5 | Tabla usuarios | GET `/tenants/{id}/users`. Columnas: Nombre, Email, Rol (badge), Activo, Último acceso, Acciones. |
| 4.6 | Impersonación | Por cada admin: "Solicitar acceso" (consentimiento) y "Acceso directo" (silencioso). Flujos según spec (request → toast; silent → confirmación → window.open). Opcional: UI para terminar sesión de impersonación (POST `/impersonate/end` con log_id). |

### Fase 5: Crear tenant

| # | Tarea | Descripción |
|---|--------|-------------|
| 5.1 | Página `/superadmin/tenants/new` | Formulario: nombre empresa, subdominio, email administrador, plan (select), timezone (select), URL logo. |
| 5.2 | Validación subdominio | Regex formato en tiempo real; al blur o debounce 300 ms comprobar disponibilidad (lista cargada o endpoint dedicado). Preview: `{subdominio}.lapesquerapp.es`. |
| 5.3 | Envío | POST `/tenants`. 201: redirigir a `/superadmin/tenants/{id}`. 422: mostrar `errors` en campos. |

### Fase 6: Errores y pulido

| # | Tarea | Descripción |
|---|--------|-------------|
| 6.1 | Tratamiento de errores HTTP | 400: mensaje del body. 422: errores por campo. 429: mensaje fijo. 500: genérico. Usar toasts o inline según contexto. |
| 6.2 | Responsive | Sidebar colapsable / hamburger en móvil/tablet. Contenido full-width. |
| 6.3 | Loading y estados | Skeletons o spinners en listas y detalle. Disabled en botones durante submit. |

---

## 5. Orden de ejecución resumido

1. **Fase 0** (config, API client, auth context, middleware).  
2. **Fase 1** (login + layout + protección).  
3. **Fase 2** (dashboard).  
4. **Fase 3** (lista tenants).  
5. **Fase 4** (detalle tenant: datos, acciones, onboarding, usuarios, impersonación).  
6. **Fase 5** (crear tenant).  
7. **Fase 6** (errores, responsive, loading).

Las fases 4 y 5 pueden solaparse (p. ej. formulario crear tenant antes de todas las secciones del detalle), pero conviene tener lista la lista y el detalle básico antes de impersonación.

---

## 6. Checklist de implementación (traza a la spec)

- [ ] **Config y cliente**: env `NEXT_PUBLIC_SUPERADMIN_API_URL`, cliente HTTP sin `X-Tenant`, Bearer, 401→login, 429→mensaje.
- [ ] **Auth**: request-access, verify-otp, verify-magic-link (incl. ?token= en URL), /me al cargar, logout.
- [ ] **Protección**: rutas bajo `/superadmin` (salvo login) requieren token; redirección a `/superadmin/login`.
- [ ] **Layout**: sidebar (Dashboard, Tenants), header (usuario, logout).
- [ ] **Login**: email, solicitar acceso, paso OTP con reenviar (60s), auto-verify magic link.
- [ ] **Dashboard**: cards total/active/suspended/pending, última lista tenants, Crear tenant, Ver todos.
- [ ] **Lista tenants**: filtro status, búsqueda, tabla, paginación, + Nuevo.
- [ ] **Detalle tenant**: datos generales + editar, acciones de estado con confirmación, onboarding con polling y reintentar, tabla usuarios, impersonación (consent + silent).
- [ ] **Crear tenant**: formulario completo, validación subdominio en tiempo real, preview, POST y redirección a detalle.
- [ ] **Errores**: 400, 422, 429, 500 y mensajes coherentes.
- [ ] **Responsive**: sidebar/hamburger en móvil/tablet.
- [ ] (Opcional) **E2E**: login, listar/crear/editar tenant, onboarding, impersonación (Playwright/Cypress).
- [ ] (Opcional) **Deploy**: configurar en Coolify/dominio `admin.lapesquerapp.es` si aplica (mismo build con rewrites o proyecto separado más adelante).

---

## 7. Diferencias clave con el resto de la app

| Aspecto | App tenant (admin/operator/comercial) | Panel superadmin |
|---------|--------------------------------------|-------------------|
| Auth | next-auth (JWT) + Bearer a `/api/v2/me` (tenant) | Token Sanctum en contexto; GET `/api/v2/superadmin/auth/me` |
| Cliente HTTP | `fetchWithTenant` + header `X-Tenant` | `fetchSuperadmin` sin `X-Tenant` |
| Base API | `API_URL_V2` (tenant) | `SUPERADMIN_API_URL` |
| Middleware | Incluido en matcher; roles con roleConfig | No incluido en matcher (o lógica propia solo redirigir a login) |
| Rutas | `/admin`, `/operator`, `/comercial`, etc. | `/superadmin`, `/superadmin/login`, `/superadmin/tenants/*` |

---

## 8. Referencias rápidas de endpoints (spec)

- Auth: `POST request-access`, `POST verify-otp`, `POST verify-magic-link`, `GET me`, `POST logout` (base `/auth`).
- Dashboard: `GET /dashboard`.
- Tenants: `GET /tenants`, `GET/PUT /tenants/{id}`, `POST /tenants`, `POST /tenants/{id}/activate|suspend|cancel|retry-onboarding`, `GET /tenants/{id}/users`.
- Impersonación: `POST /tenants/{id}/impersonate/request`, `POST /tenants/{id}/impersonate/token`, `POST /tenants/{id}/impersonate/silent`, `POST /impersonate/end`.

Con este plan se puede implementar el panel de superadmin alineado con la spec y con el sistema actual en un solo repo y un solo despliegue, manteniendo la opción de extraer a proyecto independiente si se requiere más adelante.
