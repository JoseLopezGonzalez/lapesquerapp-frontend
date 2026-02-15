# STEP 0a — Bloque Auth: alcance y mapeo de entidades

**Fecha**: 2026-02-15  
**Estado**: Pendiente de confirmación del usuario  
**Última actualización**: 2026-02-15

---

## 1. Entidades del bloque Auth

### 1.1 Componentes principales

| Entidad | Ubicación | Descripción |
|--------|------------|-------------|
| **LoginPage** | `src/components/LoginPage/index.js` | Pantalla de login (email → solicitar acceso / OTP / magic link), tenant check, branding, redirección post-login. |
| **AuthVerifyPage** | `src/app/auth/verify/page.js` | Página que canjea token de magic link; llama a authService + signIn(credentials) y redirige. |
| **HomePage** (raíz) | `src/app/page.js` | Decide landing vs login por subdominio; si subdominio + autenticado redirige a /admin/home. |
| **AdminRouteProtection** | `src/components/AdminRouteProtection/index.js` | Protección de rutas /admin: sesión, loading, operario solo rutas permitidas, overlay de logout. |
| **ProtectedRoute** | `src/components/ProtectedRoute/index.js` | Protección genérica por sesión y `allowedRoles`; redirige a login o /unauthorized. (No usado actualmente en el repo; parte del bloque Auth.) |
| **AuthErrorInterceptor** | `src/components/Utilities/AuthErrorInterceptor.js` | Intercepta fetch; en 401/403 hace signOut y redirige al login (o solo limpia sesión si ya en /). |
| **LogoutDialog** | `src/components/Utilities/LogoutDialog.jsx` | Overlay de “Cerrando sesión…” durante el logout. |
| **LogoutProvider / useLogout** | `src/context/LogoutContext.jsx` | Contexto para estado “isLoggingOut” y mostrar LogoutDialog. |
| **UnauthorizedPage** | `src/app/unauthorized/page.js` | Página 403 (ErrorPage) cuando el rol no tiene acceso. |

### 1.2 API y servicios

| Entidad | Ubicación | Descripción |
|--------|------------|-------------|
| **NextAuth route** | `src/app/api/auth/[...nextauth]/route.js` | Configuración NextAuth: CredentialsProvider, JWT/session callbacks, validación token con backend, rate limit por IP. |
| **authService** | `src/services/authService.js` | requestAccess, verifyMagicLinkToken, requestOtp, verifyOtp, logout, getCurrentUser (llamadas a API con fetchWithTenant). |
| **authConfig** | `src/configs/authConfig.js` | Constantes y helpers: isAuthError, isAuthStatusCode, buildLoginUrl, AUTH_ERROR_CONFIG. |
| **roleConfig** | `src/configs/roleConfig.js` | Mapa ruta → roles permitidos; usado por middleware para autorización. |

### 1.3 Middleware y tenant

| Entidad | Ubicación | Descripción |
|--------|------------|-------------|
| **middleware** | `src/middleware.js` | getToken(JWT), redirección sin token/expirado, validación token con backend /api/v2/me, roleConfig para rutas /admin|/production|/warehouse, redirección a / o /unauthorized. |
| **fetchWithTenant** | `src/lib/fetchWithTenant.js` | Inyecta X-Tenant (desde host o headers), manejo 401/403 y coordinación con __is_logging_out__. |
| **getCurrentTenant** | `src/lib/utils/getCurrentTenant.js` | Utilidad cliente: tenant desde window.location.host (localhost → subdominio o 'brisamar'). |

### 1.4 Helpers de token y tipos

| Entidad | Ubicación | Descripción |
|--------|------------|-------------|
| **getAuthToken** | `src/lib/auth/getAuthToken.js` | Token desde sesión cliente o contexto servidor (API routes). |
| **getServerAuthToken** | `src/lib/auth/getServerAuthToken.js` | Token desde sesión servidor (getServerSession). |
| **next-auth.d.ts** | `src/types/next-auth.d.ts` | Tipos Session/User/JWT (accessToken, role, assignedStoreId, companyName, companyLogoUrl). |

### 1.5 Integración en layout y logout

| Entidad | Ubicación | Descripción |
|--------|------------|-------------|
| **ClientLayout** | `src/app/ClientLayout.js` | SessionProvider, AuthErrorInterceptor, LogoutProvider, QueryClientProvider, etc. |
| **AdminLayoutClient** | `src/app/admin/AdminLayoutClient.jsx` | handleLogout (authService.logout + signOut), envuelve hijos con AdminRouteProtection. |
| **useIsLoggingOut** | `src/hooks/useIsLoggingOut.js` | Lee sessionStorage __is_logging_out__; usado por AdminRouteProtection. |

---

## 2. Artefactos por tipo (resumen)

| Tipo | Artefactos |
|------|------------|
| **Páginas** | `app/page.js`, `app/auth/verify/page.js`, `app/unauthorized/page.js` |
| **Componentes** | LoginPage, AuthVerifyPage (VerifyContent), AdminRouteProtection, ProtectedRoute, AuthErrorInterceptor, LogoutDialog |
| **Contextos** | LogoutContext (LogoutProvider, useLogout) |
| **Hooks** | useIsLoggingOut |
| **Servicios** | authService.js |
| **Config** | authConfig.js, roleConfig.js |
| **API** | app/api/auth/[...nextauth]/route.js |
| **Middleware** | middleware.js |
| **Lib** | fetchWithTenant.js, getCurrentTenant.js, getAuthToken.js, getServerAuthToken.js |
| **Tipos** | next-auth.d.ts |
| **Layout** | ClientLayout (SessionProvider + AuthErrorInterceptor + LogoutProvider), AdminLayoutClient (handleLogout, AdminRouteProtection) |

**Tests existentes**: Ninguno específico de Auth. (Hay tests en `__tests__/` para hooks/servicios de pedidos, no para auth.)

---

## 3. Alcance propuesto para el bloque Auth

- **Incluido en el bloque**: Todo lo listado en las tablas anteriores (login, verify, logout, protección de rutas, middleware, tenant en auth, token helpers, tipos NextAuth).
- **No incluido como entidades principales**: LandingPage (solo como consumidor de LoginPage y sesión), navegación/filtros por rol fuera de Auth, Settings/Options (aunque se usen en layout).

**Criterio**: Pertenece al bloque Auth si el artefacto existe principalmente para **autenticación, autorización por sesión/rol, tenant en requests de auth, o manejo de sesión (login/logout/error)**.

---

## 4. Confirmación solicitada

**Bloque Auth incluye:**

- **Entidades**: LoginPage, AuthVerifyPage, HomePage (decisión landing vs login), AdminRouteProtection, ProtectedRoute, AuthErrorInterceptor, LogoutDialog, LogoutContext, useIsLoggingOut, UnauthorizedPage.
- **Artefactos**: NextAuth route, authService, authConfig, roleConfig, middleware, fetchWithTenant, getCurrentTenant, getAuthToken, getServerAuthToken, next-auth.d.ts, ClientLayout (parte auth), AdminLayoutClient (parte logout + AdminRouteProtection).

**¿Confirmas este alcance o quieres añadir/quitar algo antes de seguir con STEP 0 (comportamiento UI actual) y STEP 1 (análisis)?**

Responder por ejemplo: *"Confirmado"* o *"Añadir X"* / *"Quitar Y"*.
