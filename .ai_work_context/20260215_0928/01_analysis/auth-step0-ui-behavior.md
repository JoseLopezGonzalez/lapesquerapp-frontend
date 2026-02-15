# STEP 0 — Bloque Auth: comportamiento UI actual

**Fecha**: 2026-02-15  
**Estado**: Completado  
**Última actualización**: 2026-02-15

---

## 1. Estados de la UI

### 1.1 LoginPage (`/` con subdominio)

| Estado | Condición | Qué ve el usuario |
|-------|-----------|-------------------|
| Comprobando tenant | `!tenantChecked` | Loader a pantalla completa. |
| Tenant inactivo | `tenantActive === false` | Alert destructivo "Cuentas deshabilitadas para esta empresa" + formulario deshabilitado (o bloqueado). |
| Bienvenida (móvil) | `isMobile && !showForm` | Pantalla con imagen de branding, título "La PesquerApp", texto rotativo, botón "Continuar", enlaces términos/privacidad. |
| Formulario email | `showForm && !accessRequested` | Campo email, botón "Solicitar acceso" / "Enviar código". |
| Esperando OTP | `accessRequested` | Campo OTP (6 dígitos), opción "Volver" al email, botón "Verificar código". |
| Loading | `loading === true` | Botones deshabilitados / Loader durante requestAccess o verifyOtp. |
| Demo | subdominio `test` | Email prefijado admin@lapesquerapp.es, badge "MODO DEMO". |

### 1.2 HomePage raíz (`app/page.js`)

| Estado | Condición | Qué ve el usuario |
|--------|-----------|-------------------|
| Determinando subdominio | `isSubdomain === null` | Loader. |
| Subdominio + autenticado | subdominio y `status === "authenticated"` | Loader mientras redirige a `/admin/home`. |
| Subdominio + no autenticado / loading | subdominio y (loading o unauthenticated) | `<LoginPage />`. |
| Sin subdominio | dominio principal | `<LandingPage />`. |

### 1.3 Auth verify (`/auth/verify?token=...`)

| Estado | Condición | Qué ve el usuario |
|--------|-----------|-------------------|
| Loading | verificando token con backend | "Verificando enlace..." + Loader. |
| Error | token inválido / expirado / usuario desactivado | Alert destructivo con mensaje, botones "Volver al inicio" y "Solicitar nuevo enlace". |
| Success | token canjeado, signIn OK | "Redirigiendo..." + Loader → redirect a getRedirectUrl (operario → /admin/home, resto → `from` o /admin/home). |

### 1.4 AdminRouteProtection (rutas bajo `/admin`)

| Estado | Condición | Qué ve el usuario |
|--------|-----------|-------------------|
| Logout en curso | `useIsLoggingOut() === true` | `<LogoutDialog open={true} />` (overlay "Cerrando sesión..."). |
| Sesión loading | `status === "loading"` | Loader centrado a pantalla completa. |
| Operario en ruta no permitida | rol operario y path no en OPERARIO_ALLOWED_PATHS | Loader mientras redirige a `/admin/home`. |
| Autenticado y autorizado | sesión OK y rol permitido para la ruta | `children` (contenido admin). |

*Nota: El middleware ya hace redirección a `/` o `/unauthorized` según token y roleConfig; AdminRouteProtection refuerza en cliente (loading, operario, logout).*

### 1.5 ProtectedRoute

| Estado | Condición | Qué ve el usuario |
|--------|-----------|-------------------|
| Loading | `status === "loading"` | "Cargando...". |
| No autenticado | `status === "unauthenticated"` | Redirección a `buildLoginUrl(pathname)`. |
| Autenticado sin rol permitido | `allowedRoles` no incluye el rol del usuario | Redirección a `/unauthorized`. |
| Autenticado y autorizado | sesión OK y rol en `allowedRoles` | `children`. |

*Actualmente no se usa en el árbol de componentes; el bloque Auth lo incluye por consistencia.*

### 1.6 AuthErrorInterceptor (global, cliente)

- No tiene estado visible propio: intercepta `fetch`.
- En 401/403 (y no siendo request a `/logout`): toast "Sesión expirada. Redirigiendo al login...", luego `signOut({ redirect: false })` y `window.location.href = buildLoginUrl(pathname)`.
- Si ya está en `/` o `/auth/verify`: solo `signOut` para evitar loader infinito.

### 1.7 UnauthorizedPage (`/unauthorized`)

- Siempre: `<ErrorPage statusCode={403} homeHref="/admin/home" />`.

---

## 2. Interacciones del usuario y cambios de estado

| Acción | Dónde | Efecto |
|--------|--------|--------|
| "Continuar" (móvil) | LoginPage bienvenida | `setShowForm(true)` → se muestra formulario. |
| Introducir email + "Solicitar acceso" / "Enviar código" | LoginPage | `requestAccess(email)` → éxito: `setAccessRequested(true)`; error: toast.error. |
| "Volver" desde OTP | LoginPage | `setAccessRequested(false)`, `setCode("")`. |
| Introducir OTP + "Verificar código" | LoginPage | `verifyOtp(email, code)` → signIn(credentials) → toast.success + `window.location.href = getRedirectUrl(user)`. |
| Pegar 6 dígitos en OTP | LoginPage | handleOtpPaste actualiza `code`. |
| Cerrar sesión (menú usuario en admin) | AdminLayoutClient | `authService.logout()` → `signOut({ redirect: false })` → toast → `window.location.replace("/")`. LogoutContext puede mostrar LogoutDialog si se usa `setIsLoggingOut` en algún flujo. |
| Navegar a ruta /admin sin token | Middleware | Redirección a `/?from=pathname`. |
| Navegar a ruta /admin con rol no permitido | Middleware | Redirección a `/unauthorized` (o `/admin/home` si es operario). |
| Recibir 401/403 en cualquier fetch (cliente) | AuthErrorInterceptor | signOut + redirección al login (o solo signOut si ya en login/verify). |

---

## 3. Flujo de datos

- **Login (OTP)**  
  Usuario escribe email → requestAccess (authService → API con fetchWithTenant) → backend envía código → usuario escribe código → verifyOtp (authService) → backend devuelve access_token + user → signIn("credentials", { accessToken, user }) → NextAuth guarda sesión → redirección a getRedirectUrl(user).

- **Login (magic link)**  
  Usuario abre `/auth/verify?token=...` → VerifyContent llama verifyMagicLinkToken(token) → signIn(credentials) → redirect.

- **Tenant en login**  
  LoginPage: `useEffect` con `window.location.hostname` → subdominio; fetch `${API_URL_V2}public/tenant/${subdomain}` → actualiza tenantActive y tenantChecked. fetch sin fetchWithTenant (ruta pública).

- **Protección de rutas**  
  Middleware: getToken (JWT) → si no hay token o expirado → redirect `/`. Si hay token, fetch backend `/api/v2/me` con Authorization → si 401/403 → redirect `/`. Luego roleConfig: pathname → roles permitidos; si rol no permitido → redirect `/unauthorized` o (operario) `/admin/home`.

- **Token en servicios**  
  authService usa getSession() (next-auth/react) en logout y getCurrentUser para obtener accessToken y enviarlo en Authorization. fetchWithTenant inyecta X-Tenant desde host (servidor o window.location en cliente).

---

## 4. Validación (cliente)

- **LoginPage**: Sin Zod ni react-hook-form. Validación mínima: `tenantActive && email?.trim()` antes de requestAccess; `tenantActive && email?.trim() && code?.trim()` antes de verifyOtp. Errores mostrados por toast y mensajes del backend.
- **Auth verify**: Solo comprueba presencia de `token` en query; errores de backend (403 usuario desactivado, etc.) en catch → setErrorMessage.
- **Middleware**: No valida formularios; valida JWT y respuesta de /api/v2/me.

---

## 5. Permisos y roles

- **roleConfig** define por ruta los roles permitidos (administrador, direccion, tecnico, operario, etc.).
- **Middleware**: aplica roleConfig a `/admin/*`, `/production/*`, `/warehouse/*`; operario solo puede rutas que lo incluyan; si no tiene acceso → /unauthorized o /admin/home (operario).
- **AdminRouteProtection**: operario solo puede estar en OPERARIO_ALLOWED_PATHS; si navega a otra ruta /admin, redirect /admin/home.
- **ProtectedRoute**: genérico por `allowedRoles` (no usado actualmente).

---

## 6. Manejo de errores

| Origen | Comportamiento |
|--------|----------------|
| requestAccess / requestOtp (429) | Error "Demasiados intentos; espera un momento...". |
| requestAccess / verifyOtp / verifyMagicLinkToken (backend) | Mensaje data.message o data.userMessage o genérico; toast.error (LoginPage) o setErrorMessage (verify). |
| verifyOtp 403 | Mensaje "Usuario desactivado." en verify. |
| signIn(credentials) error | Toast o mensaje "Error al iniciar sesión." / "Error al verificar el código.". |
| Middleware: token inválido o /me 401|403 | Redirect a `/` con from. |
| fetchWithTenant 401|403 (cliente) | AuthErrorInterceptor: signOut + redirect (o solo signOut en / o /auth/verify). Flag __is_logging_out__ evita doble manejo en logout. |
| Logout backend falla | authService.logout no lanza; se hace signOut y redirect igual (AdminLayoutClient). |

---

## 7. Checkpoint de validación (STEP 0)

**¿El comportamiento actual de la UI coincide con las reglas de negocio documentadas?**

- Sí, para el flujo documentado: login por OTP/magic link, verificación de tenant, redirección por rol (operario a /admin/home), protección por middleware y AdminRouteProtection, logout con revocación en backend y signOut. No se ha detectado inconsistencia que requiera pausa como "bug a confirmar por usuario".  
- **Conclusión**: Proceder con mejoras estructurales (STEP 1 y siguientes) sin cambiar lógica de negocio salvo que se detecte y apruebe un cambio explícito.
