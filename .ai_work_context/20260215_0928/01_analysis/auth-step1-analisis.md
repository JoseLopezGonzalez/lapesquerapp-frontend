# STEP 1 — Bloque Auth: análisis

**Fecha**: 2026-02-15  
**Estado**: Completado  
**Última actualización**: 2026-02-15

---

## 1. Qué hace el módulo (global y por entidad)

- **Global**: Autenticación (login por OTP y magic link), verificación de tenant en login, protección de rutas por token y rol (middleware + AdminRouteProtection), cierre de sesión con revocación en backend, interceptación de 401/403 en cliente para redirigir al login. Multi-tenant vía X-Tenant en todas las peticiones (fetchWithTenant) y detección de tenant en cliente (getCurrentTenant).
- **LoginPage**: Pantalla de login (email → solicitar acceso → OTP o magic link); comprueba tenant activo; estados bienvenida móvil / formulario / OTP; redirección post-login por rol.
- **Auth verify**: Canjea token de magic link, signIn con credentials, redirección.
- **AdminRouteProtection**: Loading de sesión, overlay de logout, restricción de rutas para operario.
- **Middleware**: JWT, validación con backend, roleConfig, redirecciones.
- **authService**: requestAccess, verifyOtp, verifyMagicLinkToken, logout, getCurrentUser (todo contra API con fetchWithTenant).
- **AuthErrorInterceptor**: Intercepta fetch; 401/403 → signOut y redirección (o solo limpiar sesión en / o /auth/verify).

---

## 2. Estado y calidad por entidad / artefacto

| Entidad | Estado | Observaciones |
|---------|--------|----------------|
| **LoginPage** | Crítico | **610 líneas** → P0 (bloqueante >200). Sin Zod ni react-hook-form; validación manual y toast. Muchos useState/useEffect; mezcla UI + lógica (tenant check, redirect, OTP paste). |
| **authService** | Alto | **165 líneas**, solo JS. Sin tipos; respuestas API sin interfaces. Patrón correcto (fetchWithTenant, getSession para token). |
| **middleware** | Medio | 182 líneas; lógica clara pero verbosa (logs). roleConfig y getToken bien usados. |
| **NextAuth route** | Medio | Credentials, JWT/session callbacks, validación con backend; rate limit en memoria. Sin tipos en authorize/callbacks. |
| **AdminRouteProtection** | Aceptable | 63 líneas; hace una cosa. Duplicación de normalización de rol (array vs string) con middleware. |
| **ProtectedRoute** | Aceptable | No usado; podría unificarse con AdminRouteProtection o eliminarse si no se va a usar. |
| **AuthErrorInterceptor** | Aceptable | Intercepta fetch; lógica concentrada; evita doble redirect en login. |
| **LogoutContext / LogoutDialog** | Aceptable | Contexto simple; LogoutDialog con sessionStorage y hidratación considerada. |
| **authConfig** | Bueno | Constantes y helpers reutilizables; fácil de testear. |
| **roleConfig** | Bueno | Datos puros; usado por middleware. |
| **getCurrentTenant** | Bueno | Utilidad cliente; documentada. |
| **getAuthToken / getServerAuthToken** | Medio | getAuthToken con console.log en producción; serverTokenContext para API routes. |
| **next-auth.d.ts** | Bueno | Tipos Session/User/JWT; único artefacto TS del bloque. |
| **fetchWithTenant** | Bueno | Pilar multi-tenant y manejo 401/403; compartido con todo el proyecto. |

---

## 3. Rating antes: 4/10

**Justificación**: El flujo de auth es funcional y seguro (token, validación con backend, tenant, roles). Puntos fuertes: authConfig, roleConfig, next-auth.d.ts, fetchWithTenant, separación authService. Puntos débiles: **LoginPage >600 líneas (P0)**, **authService y resto en JavaScript sin tipos**, **formularios de login sin Zod (P1)**, **cero tests** en el bloque, y **data fetching en LoginPage** (tenant check) con fetch manual en useEffect en lugar de un hook o React Query. Para un bloque crítico (seguridad y entrada a la app), la mantenibilidad y la adherencia al stack del proyecto (TypeScript, Zod, componentes <150 líneas) están por debajo de lo aceptable.

---

## 4. Calidad arquitectónica

- **Separación de responsabilidades**: Servicios (authService) vs UI (LoginPage) está separado; el problema es el tamaño y la lógica dentro de LoginPage (tenant, redirect, OTP).
- **Patrones Next.js/React**: Uso correcto de SessionProvider, middleware, API route NextAuth. No hay Server Components en auth (login/verify son cliente por necesidad). Custom hook useIsLoggingOut está bien; falta extraer lógica de login (tenant, steps) a hooks.
- **Multi-tenant**: Muy bien resuelto: fetchWithTenant, middleware con host, getCurrentTenant, tenant en login (public/tenant).
- **Consistencia con el resto del proyecto**: Formularios en otros módulos usan react-hook-form + Zod; Auth no. Data fetching en proyecto tiende a useEffect + servicio; Auth igual (y no hay caché necesaria para login, pero el tenant check podría ser un hook reutilizable).

---

## 5. Riesgos identificados

| Riesgo | Nivel | Detalle |
|--------|--------|--------|
| Regresiones en login | Alto | Sin tests; cambios en LoginPage o authService sin red de seguridad. |
| Mantenibilidad LoginPage | Alto | 610 líneas; cualquier cambio toca un archivo enorme. |
| Tipos | Medio | authService y callbacks NextAuth sin tipos; respuestas API sin interfaces. |
| Validación cliente | Medio | Email/OTP sin Zod; solo validación mínima y mensajes backend; UX aceptable pero no alineada al estándar del proyecto. |

---

## 6. Uso de patrones estructurales (Next.js/React)

| Patrón | En Auth | Comentario |
|--------|--------|------------|
| Server / Client | Client donde toca (login, verify, protección) | Correcto; no hay RSC para auth. |
| Custom Hooks | useIsLoggingOut | Falta: useLoginSteps, useTenantCheck (o similar) para extraer lógica de LoginPage. |
| Data Fetching | Manual en LoginPage (tenant), authService (fetchWithTenant) | Auth no necesita React Query para login/verify (flujos únicos); tenant check podría ser hook con estado. |
| Formularios | useState en LoginPage | **No** react-hook-form + Zod; desalineado con el resto del proyecto. |
| API Layer | authService + fetchWithTenant | Correcto y consistente. |
| TypeScript | next-auth.d.ts solo | authService, middleware, componentes en JS. |
| Testing | Ninguno | Crítico para auth. |

---

## 7. TypeScript

- **next-auth.d.ts**: Bien; Session/User/JWT extendidos.
- **Resto del bloque**: .js / .jsx; sin interfaces para respuestas de auth (requestAccess, verifyOtp, verifyMagicLinkToken, getCurrentUser, /me). Prioridad: authService (P0) y tipos de API; luego componentes (P1).

---

## 8. Accesibilidad

- LoginPage: formularios con Label/Input de shadcn; botones y enlaces identificables. No revisado teclado/ARIA en detalle.
- Auth verify: Alert, botones, enlaces.
- AdminRouteProtection: Loader; LogoutDialog (modal). Sin auditoría WCAG específica en este bloque.

---

## 9. Variables de entorno

- NEXTAUTH_SECRET en servidor (NextAuth, middleware); correcto.
- API_URL_V2 / API_BASE_URL para backend; uso en authService y middleware. No hay secretos en NEXT_PUBLIC_ en el flujo de auth revisado.

---

## 10. Cumplimiento UI/UX (design system)

- **Componentes**: LoginPage y verify usan shadcn (Button, Input, Card, Label, Alert, InputOTP). LogoutDialog custom pero contenido con Loader/lucide. Alineado con shadcn.
- **Sin cambios no autorizados**: Este análisis no propone cambios de diseño, solo estructurales.

---

## 11. Cumplimiento tech stack del proyecto

| Requisito | Auth | Prioridad |
|-----------|------|-----------|
| React Query para server state | N/A (login/verify son flujos únicos) | — |
| Zod + react-hook-form en formularios | **No** en LoginPage ni verify | P1 |
| TypeScript en servicios y nuevo código | authService y resto en JS | P0/P1 |
| TenantContext / useTenant | getCurrentTenant usado; no TenantContext en Auth | P2 (si se introduce en proyecto) |
| Tests en módulos críticos | **Ninguno** en Auth | P0 |
| Componentes <150 líneas | LoginPage 610 → P0 | P0 |

---

## 12. Oportunidades de mejora (prioridad)

| # | Mejora | Prioridad | Entidades |
|---|--------|-----------|-----------|
| 1 | Reducir LoginPage: extraer subcomponentes (WelcomeStep, EmailStep, OtpStep) y hooks (useTenantCheck, useLoginRedirect, useOtpSubmit) hasta <150 líneas por archivo | P0 | LoginPage |
| 2 | Migrar authService a TypeScript; definir interfaces para respuestas API (requestAccess, verifyOtp, verifyMagicLinkToken, getCurrentUser, /me) | P0 | authService, tipos |
| 3 | Añadir tests: authService (requestAccess, verifyOtp, logout, getCurrentUser), authConfig (isAuthError, buildLoginUrl), y al menos un test de integración de flujo login (OTP) | P0 | authService, authConfig |
| 4 | Introducir Zod + react-hook-form en LoginPage (email + OTP) y validación cliente en verify si aplica; mantener mensajes backend como fallback | P1 | LoginPage, auth/verify |
| 5 | Migrar a TypeScript: middleware (tipos para getToken, roleConfig), NextAuth route (tipos en callbacks), componentes Auth (LoginPage, AdminRouteProtection, AuthErrorInterceptor, etc.) | P1 | Varios |
| 6 | Revisar getAuthToken: quitar o condicionar console.log en producción | P2 | getAuthToken |
| 7 | Decidir uso de ProtectedRoute: usar en alguna ruta o documentar como “no usado” y no mantener como dead code | P2 | ProtectedRoute |
| 8 | Reducir logs del middleware en producción (o nivel configurable) | P2 | middleware |

---

## 13. Alineación con el audit

- **Riesgos audit**: Data fetching sin caché → en Auth el tenant check es un fetch único; no bloqueante. TypeScript → Auth casi todo en JS. Componentes grandes → LoginPage 610. Tests mínimos → Auth sin tests. Clave Google Maps → no en Auth.
- **Mejoras audit**: React Query no prioritaria en Auth. TypeScript y dividir componentes grandes sí. Tests sí.

---

## 14. Resumen de prioridades

- **P0**: (1) Dividir LoginPage; (2) authService a TS + tipos API; (3) Tests (authService, authConfig, flujo login).
- **P1**: (4) Zod + react-hook-form en login/verify; (5) Migrar a TS resto del bloque (middleware, NextAuth route, componentes).
- **P2**: (6) getAuthToken logs; (7) ProtectedRoute; (8) middleware logs.

**Scope coverage**: Todas las entidades del STEP 0a han sido consideradas; las mejoras anteriores cubren servicios, componentes principales, config y middleware. ProtectedRoute y LogoutDialog/LogoutContext se mantienen o se ajustan en P2 según decisión de uso.
