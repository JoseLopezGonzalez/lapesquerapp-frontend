# Auditoria de bug: bucle login/logout y loading infinito

Fecha: 2026-05-27 (auditoría) / 2026-05-29 (implementación)  
Estado: bugs corregidos — pendiente validación manual con backend real  
Alcance: frontend Next.js, NextAuth, middleware, fetch centralizado, guards cliente, login OTP/magic link y logout.

---

## 1. Que se entiende del problema

Se ha observado en algunos usuarios y dispositivos que, estando ya logueados, la aplicacion entra a veces en:

- bucle aparente de login/logout;
- redirecciones repetidas entre una ruta protegida y `/`;
- pantalla de carga continua sin posibilidad de actuar.

La informacion de reproduccion aun es incompleta: no esta confirmado si siempre ocurre con token expirado, sesion revocada en backend, usuarios desactivados, cambio de rol, dispositivos moviles, PWA, retorno desde segundo plano, o combinaciones de esos factores.

Objetivo de esta auditoria: documentar causas probables verificadas en codigo sin corregir flujos existentes.

---

## 2. Archivos inspeccionados

Documentacion base:

- `docs/ai-context/00-project-brief.md`
- `docs/ai-context/01-frontend-architecture.md`
- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/03-form-system.md`
- `docs/ai-context/04-api-services.md`
- `docs/ai-context/05-entity-client.md`
- `docs/ai-context/10-current-priorities.md`
- `docs/11-autenticacion-autorizacion.md`
- `docs/51-analisis-flujo-logout.md`
- `docs/61-logout-screen-implementation-plan.md`
- `docs/templates/qa-report.md`

Codigo de autenticacion/sesion (leido linea a linea):

- `src/middleware.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/lib/fetchWithTenant.js`
- `src/components/Utilities/AuthErrorInterceptor.tsx`
- `src/configs/authConfig.ts`
- `src/app/ClientLayout.js`
- `src/app/page.js`
- `src/components/LoginPage/index.tsx`
- `src/hooks/useLoginActions.ts`
- `src/hooks/useLoginTenant.ts`
- `src/utils/loginUtils.ts`
- `src/services/authService.ts`
- `src/lib/auth/getAuthToken.ts`
- `src/lib/auth/getServerAuthToken.ts`
- `src/lib/auth/actor.ts`
- `src/context/LogoutContext.tsx`
- `src/hooks/useIsLoggingOut.ts`
- `src/components/AdminRouteProtection/index.tsx`
- `src/app/admin/AdminLayoutClient.jsx`
- `src/app/comercial/ComercialLayoutClient.jsx`
- `src/app/field/FieldLayoutClient.jsx`
- `src/app/operator/OperatorLayoutClient.jsx`
- `src/components/External/ExternalLayoutClient.jsx`
- `src/hooks/useSettingsData.js`
- `src/services/settingsService.ts`
- `src/services/generic/entityService.js`
- `src/lib/queryClient.js`
- `src/configs/config.js`
- `src/configs/roleConfig.ts`

Tests existentes revisados:

- `src/__tests__/configs/authConfig.test.ts`
- `src/__tests__/services/authService.test.ts`
- `src/__tests__/utils/loginUtils.test.ts`
- busqueda general en `src/__tests__` sobre auth, middleware, interceptor, session expired y flags de logout.

---

## 3. Mapa actual del flujo

### Login

1. `/` decide si esta en subdominio y muestra `LoginPage` si no hay sesion autenticada.
2. `LoginPage` valida tenant publico con `useLoginTenant`.
3. `useLoginActions` solicita acceso, verifica OTP y ejecuta `signIn("credentials", { redirect: false })`.
4. Tras login, `getRedirectUrl` redirige a `from` si es seguro, o a la ruta por rol.

### Sesion NextAuth

1. `SessionProvider` envuelve toda la app con `refetchOnWindowFocus={false}`.
2. El callback `jwt` guarda token y rol al hacer login.
3. En cada ejecucion del callback `jwt` (login + cada 24h por `updateAge`), si hay `accessToken`, llama a `/api/v2/me`.
4. Si `/me` devuelve 401 o 403 **y fetchWithTenant retorna la respuesta** (solo cliente), el callback devuelve `null`.
5. El callback `session` devuelve `null` si no hay token.

### Proteccion servidor

1. `middleware.ts` protege `/admin`, `/operator`, `/comercial`, `/field`, `/production`, `/warehouse`, `/external`.
2. Obtiene JWT con `getToken`.
3. Si no hay token o `token.exp` esta vencido, redirige a `/?from={pathname}`.
4. Si no existe cookie `__session_verified`, llama a `/api/v2/me`.
5. Cuando `/me` falla, `fetchWithTenant` lanza excepcion; el catch del middleware evalua `isAuthError`.
6. Si todo va bien, autoriza por rol/ruta.

### Errores API en cliente

1. Los servicios usan `fetchWithTenant`.
2. `fetchWithTenant` llama a `window.fetch` (que ya esta parcheado por `AuthErrorInterceptor`).
3. El parche detecta 401 y llama a `handleAuthError()` directamente.
4. `fetchWithTenant` tambien detecta el 401 de la respuesta y despacha `auth:session-expired`.
5. El listener del evento llama a `handleAuthError()` de nuevo (segunda vez por el mismo 401).
6. `isRedirecting` evita que la segunda llamada actue (dentro de la misma closure).
7. `handleAuthError` hace `signOut({ redirect: false })` y redirige a login con `from`.

---

## 4. Hallazgos principales

### H1. El check explicito de 401/403 en `middleware.ts` lineas 122-141 es codigo muerto

Archivo: `src/middleware.ts:102-156`

Observacion verificada en codigo:

El middleware llama a `fetchWithTenant` para verificar `/me` (linea 111). En el servidor, `fetchWithTenant` nunca retorna una respuesta con status 401; en cambio **lanza una excepcion** con `code = 'UNAUTHENTICATED'` (linea 129-132 de `fetchWithTenant.js`). El bloque:

```typescript
// middleware.ts:122-130
if (!verifyResponse.ok) {
  if (verifyResponse.status === 401 || verifyResponse.status === 403) {
    return NextResponse.redirect(loginUrl);
  }
}
```

Nunca se ejecuta porque `fetchWithTenant` ya ha lanzado antes de retornar `verifyResponse`.

Quien realmente maneja el 401 del middleware es el catch en lineas 142-156, donde `isAuthError(err)` detecta `code === 'UNAUTHENTICATED'` y redirige a login. Eso funciona correctamente para 401.

Para 403, `fetchWithTenant` lanza un error generico (sin `code = 'UNAUTHENTICATED'`). `isAuthError` solo lo detecta si el mensaje del backend contiene palabras clave del array `AUTH_ERROR_MESSAGES`. Si el backend devuelve "Usuario desactivado", `isAuthError` retorna **false** y el middleware **no redirige**: continua con los datos del JWT y deja pasar al usuario.

Nivel de riesgo: **critico** — el codigo aparenta manejar 403 pero en la mayoria de casos no lo hace.

---

### H2. El check de 401/403 en el callback JWT de NextAuth tambien es codigo muerto

Archivo: `src/app/api/auth/[...nextauth]/route.ts:78-122`

Observacion verificada en codigo:

El callback `jwt` llama a `fetchWithTenant` (linea 80) para obtener datos frescos del usuario. El callback **es codigo servidor** (API route). Cuando el backend devuelve 401, `fetchWithTenant` lanza la excepcion `UNAUTHENTICATED` antes de retornar. El check explicio:

```typescript
// route.ts:88-91
if (response.status === 401 || response.status === 403) {
  return null as unknown as typeof token; // NEVER REACHED
}
```

Nunca se ejecuta porque `fetchWithTenant` ya ha lanzado. El catch del callback (lineas 120-122) **solo loguea el error y continua**, devolviendo el token original sin invalidarlo:

```typescript
} catch (error) {
  console.error("Error refrescando datos del usuario:", error);
}
// continua a return token; — sesion NO invalidada
```

Consecuencia: **el callback JWT nunca invalida la sesion NextAuth cuando el backend rechaza el token**. La sesion NextAuth puede permanecer "authenticated" durante sus 7 dias de `maxAge` aunque el backend haya revocado el access token.

Nivel de riesgo: **critico** — causa directa del bucle.

---

### H3. `tokenIsExpired = false` es codigo muerto intencionado a medias

Archivo: `src/app/api/auth/[...nextauth]/route.ts:125-126`

Observacion:

```typescript
const tokenIsExpired = false;
if (tokenIsExpired) return null as unknown as typeof token;
```

Esta constante es `false` en hardcode. Nunca produce invalidacion. Parece un placeholder para un check de expiracion del access token Laravel que nunca se implemento.

Nivel de riesgo: **medio** — no es la causa del bug actual, pero indica logica incompleta.

---

### H4. El callback JWT se ejecuta durante `signIn` y puede crear un login aparentemente exitoso con sesion real invalida

Archivo: `src/app/api/auth/[...nextauth]/route.ts:57-127`, `src/hooks/useLoginActions.ts:70-82`

Observacion verificada:

Cuando el usuario introduce el OTP correctamente:
1. `verifyOtp` devuelve `access_token` y `user`.
2. `signIn("credentials", { redirect: false, accessToken, user })` es llamado.
3. NextAuth invoca el callback `jwt` con el nuevo `user`.
4. El callback guarda el token y llama a `/me`.
5. Si `/me` falla (red, latencia, backend inconsistente), `fetchWithTenant` lanza.
6. El catch solo loguea. El callback retorna `token` (valido).
7. `signIn` retorna `{ ok: true, error: undefined }`.
8. `useLoginActions` verifica `!signInResult.error` → pasa. Muestra "Inicio de sesion exitoso".
9. `window.location.href = getRedirectUrl(result.user, search)` navega a ruta protegida.
10. Middleware: `getToken()` lee el JWT — **parece valido** porque el callback no lo invalido.
11. Pero si en el siguiente refresco (24h despues) o en el middleware, la sesion se detecta invalida, el usuario es sacado.

Escenario adicional: si el backend devuelve 401 o 403 durante `/me` en el login, el callback no invalida el token (H2 aplica aqui tambien). La sesion queda viva con datos del `user` object pero el access token puede haber sido revocado.

Nivel de riesgo: **medio-alto**.

---

### H5. El bucle principal: NextAuth "authenticated" + backend rechaza + page.js redirige al default route

Archivos: `src/app/page.js:44-77`, `src/middleware.ts:84-156`, `src/lib/auth/actor.ts:45-55`

Mecanismo del bucle verificado en codigo:

```
[Estado inicial]
  NextAuth cookie: valida (sesion de 7 dias)
  Backend: rechaza el access token (revocado o usuario desactivado)
  __session_verified: ausente o expirada (TTL 5 min)

[Iteracion del bucle]
  1. Browser en /?from=/admin/home
  2. page.js: status = "authenticated" (NextAuth aun valido)
     → muestra <Loader />
     → dispara router.replace(getDefaultAuthenticatedRoute(user)) = "/admin/home"
  3. Browser navega a /admin/home
  4. Middleware: __session_verified ausente → llama /me → backend rechaza
     → fetchWithTenant throws UNAUTHENTICATED → isAuthError = true
     → redirect a /?from=/admin/home
  5. Volver al paso 1 (mismo from)
```

`getDefaultAuthenticatedRoute` (`actor.ts:45-55`) **nunca usa el parametro `?from=`** de la URL. Ignora donde queria ir el usuario y siempre envia al default del rol. Esto estabiliza el bucle en una ruta concreta en vez de saltar entre rutas, pero no lo rompe.

`page.js` muestra `<Loader />` mientras status es "authenticated". No hace llamadas API, por lo que `AuthErrorInterceptor` no tiene nada que interceptar en la pagina raiz durante el bucle.

Condicion de escape del bucle:
- `__session_verified` aun vigente (< 5 min desde ultima verificacion exitosa): el middleware deja pasar, la pagina protegida monta, las queries hacen fetch con el token revocado → 401 → `AuthErrorInterceptor` → signOut → status = "unauthenticated" → LoginPage.
- Algun provider de contexto en `ClientLayout` hace llamadas API (p.ej. `SettingsProvider`) que reciben 401 incluso desde `/` → `AuthErrorInterceptor.alreadyOnLogin = true` → `clearSession()` sin redireccion → status = "unauthenticated" → LoginPage.
- El usuario limpia cookies manualmente.
- La sesion NextAuth expira naturalmente (7 dias).

Si `SettingsProvider` hace llamadas API en cada montaje (incluyendo cuando la app esta en `/`), el bucle deberia romperse rapidamente. Si no las hace (o las cachea indefinidamente), el bucle puede durar hasta que `__session_verified` expire y una pagina protegida llegue a montar.

Nivel de riesgo: **critico** — mecanismo del bucle confirmado en codigo.

---

### H6. El flag `__is_logging_out__` no se escribe en ningun handler actual

Archivos:
- Escritura esperada: `src/app/admin/AdminLayoutClient.jsx:23-44`, todos los layout clients
- Lecturas: `src/lib/fetchWithTenant.js:62-64`, `src/hooks/useIsLoggingOut.ts:14`, `src/components/AdminRouteProtection/index.tsx:36`

Observacion verificada en codigo:

Ningun `handleLogout` de los cinco layouts (`AdminLayoutClient`, `OperatorLayoutClient`, `ComercialLayoutClient`, `FieldLayoutClient`, `ExternalLayoutClient`) escribe `sessionStorage.setItem("__is_logging_out__", "true")`. `LogoutContext.setIsLoggingOut(true)` tampoco es llamado desde ningun handler.

Consecuencia:
- `fetchWithTenant` siempre lee `__is_logging_out__ === null` → nunca suprime eventos de sesion expirada durante logout.
- `useIsLoggingOut()` siempre retorna `false`.
- `AdminRouteProtection` nunca muestra el `LogoutDialog`.
- Durante logout manual, si hay peticiones en vuelo que reciben 401 al revocarse el token, `fetchWithTenant` despacha `auth:session-expired`, que activa `AuthErrorInterceptor` ademas del propio flujo de logout.
- Resultado: doble `signOut`, doble redireccion, posible toast "Sesion expirada" justo antes del toast "Sesion cerrada".

`LogoutContext` existe y tiene el estado, pero nadie lo usa para escribir. `useIsLoggingOut` hace polling de sessionStorage cada 100ms, pero el flag nunca cambia.

Nivel de riesgo: **alto** — mecanismo de supresion completamente inoperativo.

---

### H7. Doble despacho de autenticacion por el mismo 401 en cliente

Archivos: `src/components/Utilities/AuthErrorInterceptor.tsx:41-85`, `src/lib/fetchWithTenant.js:124-133`

Observacion verificada en codigo:

`AuthErrorInterceptor` parchea `window.fetch`. `fetchWithTenant` llama a `fetch(url, config)`, que es el `window.fetch` parcheado. Cuando el backend devuelve 401:

1. La funcion parcheada ejecuta `originalFetch(url, config)` → obtiene respuesta 401.
2. La funcion parcheada detecta 401 → llama a `handleAuthError()` directamente (primera llamada). `isRedirecting = true`.
3. La funcion parcheada **retorna la respuesta 401** a `fetchWithTenant`.
4. `fetchWithTenant` recibe la respuesta, detecta `!res.ok`, detecta 401 → despacha `auth:session-expired`.
5. El listener del evento llama a `handleAuthError()` (segunda llamada). `isRedirecting` ya es `true` → no-op (dentro de la misma closure).

Efecto colateral: si hay listeners acumulados por desmontaje/remontaje del componente (ver H8), cada listener acumulado tiene su propio `isRedirecting = false`, y la segunda llamada en esos closures no es un no-op.

Nivel de riesgo: **medio** — con un solo montaje funciona por el guard, pero el doble despacho es innecesario y fragil.

---

### H8. Listener de `auth:session-expired` se acumula porque removeEventListener usa funcion anonima distinta

Archivo: `src/components/Utilities/AuthErrorInterceptor.tsx:106-111`

Observacion verificada en codigo:

```typescript
// mount
window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, () => handleAuthError());

// cleanup
window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, () => handleAuthError());
```

`() => handleAuthError()` en mount y en cleanup son **dos funciones distintas**. `removeEventListener` requiere la misma referencia que se paso a `addEventListener`. El listener **nunca se elimina**.

En React 18 Strict Mode (desarrollo), `useEffect` monta dos veces: el primer ciclo monta y desmonta (sin limpiar el listener), el segundo monta. Resultado: dos listeners activos, cada uno con su propio `isRedirecting = false`. Un solo evento `auth:session-expired` puede ejecutar `handleAuthError()` dos veces, lo que produce dos `signOut` y dos schedules de redireccion.

En produccion, si el componente se desmonta y remonta (cambio de layout, hot-reload interno, edge case de routing), el acumulo es identico.

Nivel de riesgo: **medio-alto** — mayor en desarrollo, plausible en produccion con ciertos flujos de navegacion.

---

### H9. La cache de token no se limpia cuando el interceptor hace signOut

Archivos: `src/lib/auth/getAuthToken.ts:8-13`, `src/components/Utilities/AuthErrorInterceptor.tsx:20-28`

Observacion verificada en codigo:

`getAuthToken.ts` mantiene `cachedClientToken` y `cachedClientTokenExpiresAt` como variables de modulo. El token se invalida cuando `cachedClientTokenExpiresAt` pasa, que es la expiracion del JWT del access token del backend.

`authService.logout()` llama `clearAuthTokenCache()` antes de navegar (linea 128 de `authService.ts`).

`AuthErrorInterceptor.handleAuthError()` llama a `signOut({ redirect: false })` pero **no llama a `clearAuthTokenCache()`**.

Consecuencia: entre la llamada a `signOut` y la navegacion a `window.location.href` (delay de 1500ms), cualquier query en vuelo que llame a `getAuthToken()` recibe el token cacheado stale → lo envia al backend → recibe 401 → despacha `auth:session-expired` → segunda llamada a `handleAuthError()` (no-op por `isRedirecting`) → pero la query falla con error visible.

Nivel de riesgo: **bajo-medio** — ventana pequeña (1500ms) en condiciones normales; mayor riesgo en paginas densas con muchas queries.

---

### H10. `AdminRouteProtection` no maneja status "unauthenticated"

Archivo: `src/components/AdminRouteProtection/index.tsx:24-57`

Observacion verificada en codigo:

```typescript
// AdminRouteProtection
if (isLoggingOut) return <LogoutDialog open={true} />;  // isLoggingOut siempre false (ver H6)
if (status === "loading") return <Loader />;
if (status === "authenticated" && (role === "operario" || role === "repartidor_autoventa")) {
  return <Loader />;
}
return <>{children}</>;  // incluye el caso status === "unauthenticated"!
```

Si `status === "unauthenticated"` (NextAuth sin sesion), el componente renderiza los children. Los children llaman a `getAuthToken()`, que lanza `"No hay sesion autenticada. No se puede realizar la operacion."`. TanStack Query captura este error como estado de error del hook; no es una excepcion visible, pero los componentes muestran su estado de error en vez de redirigir al login.

Contraste: `OperatorRouteProtection`, `ComercialRouteProtection` y `FieldRouteProtection` si manejan `unauthenticated` con `router.replace('/')`.

Nivel de riesgo: **medio** — degradacion de experiencia visible; el middleware server-side deberia haber evitado llegar aqui, pero la asimetria entre guards es un riesgo.

---

### H11. `page.js` usa `getDefaultAuthenticatedRoute` en el efecto, ignorando `?from=`

Archivo: `src/app/page.js:44-48`, `src/lib/auth/actor.ts:45-55`

Observacion verificada en codigo:

```javascript
// page.js
useEffect(() => {
  if (isSubdomain && status === "authenticated" && session?.user) {
    router.replace(getDefaultAuthenticatedRoute(session.user));  // ignora ?from=
  }
}, [isSubdomain, status, session, router]);
```

`getDefaultAuthenticatedRoute` devuelve la ruta base del rol (`/admin/home`, `/operator`, etc.) sin considerar `window.location.search`. El parametro `?from=` que el middleware pone en la URL es descartado.

Por contraste, `useLoginActions.ts:80` si pasa `window.location.search` a `getRedirectUrl`, que si usa `?from=`. La inconsistencia es que el login manual respeta `from`, pero el efecto de reintento tras middleware-redirect no.

Consecuencia directa en el bucle (H5): el bucle siempre vuelve al default del rol, no a la ruta original. Aunque es un comportamiento razonable de seguridad, contribuye al loop estabilizandolo en la ruta default.

Nivel de riesgo: **medio** — contribuye al bucle; corregirlo sin cerrar el bucle no ayuda.

---

### H12. TTL de `__session_verified` documentado como 60s pero implementado como 5 min

Archivo: `src/middleware.ts:18-26`, comentario en linea 97

Observacion:

```typescript
// Comentario: "TTL 60s"
response.cookies.set("__session_verified", "1", {
  maxAge: 5 * 60,  // 300 segundos = 5 minutos
  ...
});
```

Duracion real: 5 minutos. Durante esa ventana, el middleware no llama a `/me`, confia en los datos del JWT. Si el token fue revocado en backend, el middleware permite el paso durante hasta 5 minutos.

Consecuencia en el bucle: si la revocacion ocurre justo despues de que la cookie se renueva, el usuario tiene 5 minutos de acceso sin verificacion backend. Los fetch cliente fallaran con 401 y activaran el interceptor. Si el usuario no llega a hacer ninguna llamada API (solo navega), el interceptor no se activa hasta que la cookie expira.

Nivel de riesgo: **medio** — contribuye al delay de deteccion; el bug documentado (60s vs 5 min) infla la ventana de riesgo.

---

### H13. `page.js` no bloquea por `status === "loading"` intencionalmente, lo que crea una ventana de doble renderizado

Archivo: `src/app/page.js:69-77`

Observacion verificada en codigo:

```javascript
// 3️⃣ TODO lo demás (loading + unauthenticated) → LOGIN
// ❌ NO bloquear por status === "loading"
return <LoginPage />;
```

La decision es deliberada para evitar bloquear el formulario de login mientras NextAuth resuelve. Pero hay una ventana en el arranque:
1. Status = "loading" → `<LoginPage />` se muestra.
2. Status pasa a "authenticated" → el efecto dispara `router.replace(getDefaultAuthenticatedRoute)`.
3. `<Loader />` reemplaza `<LoginPage />` brevemente.
4. Ruta protegida carga (o el middleware rechaza y el bucle empieza).

En movil/PWA al volver de segundo plano, el status puede pasar de "loading" a "authenticated" mas lentamente, alargando la ventana visible del login antes del redirect.

Nivel de riesgo: **bajo-medio** — experiencia de usuario degradada; riesgo mayor en PWA/movil.

---

### H14. El callback JWT llama a `/me` en cada refresh (cada 24h) usando `fetchWithTenant` en contexto servidor sin `reqHeaders`

Archivo: `src/app/api/auth/[...nextauth]/route.ts:80-86`

Observacion:

```typescript
const response = await fetchWithTenant(`${API_URL_V2}me`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token.accessToken}`,
    "Content-Type": "application/json",
  },
});
// Sin tercer argumento reqHeaders
```

Sin `reqHeaders`, `fetchWithTenant` intenta importar `headers` de `next/headers` para detectar el tenant (lineas 17-23 de `fetchWithTenant.js`). En el contexto de la API route de NextAuth, `headers()` puede fallar o retornar el host incorrecto dependiendo de la version de Next.js y del modo de ejecucion (Edge vs Node).

Si la deteccion de tenant falla o retorna "brisamar" (el fallback por defecto) cuando el tenant real es otro, la llamada a `/me` usaria el tenant equivocado → podria retornar 404 o un usuario incorrecto.

Nivel de riesgo: **medio** — dependiente del entorno de despliegue; puede afectar tenants que no sean "brisamar".

---

### H15. El mecanismo de signOut en los handlers de logout no coordina con el interceptor

Archivos: `src/app/admin/AdminLayoutClient.jsx:23-44`, `src/services/authService.ts:120-147`

Observacion verificada en codigo:

Secuencia de `handleLogout` en `AdminLayoutClient`:
1. `logoutBackend()` → llama a `/logout` → el backend revoca el token.
2. `signOut({ redirect: false })`.
3. `notify.success("Sesion cerrada")`.
4. `setTimeout(() => window.location.replace('/'), 500)`.

Entre el paso 1 y el paso 4, si hay queries en vuelo (TanStack Query refetching, settings, etc.) que llegaron al backend y reciben 401 (token ya revocado):
- `fetchWithTenant`: `isLogoutRequest = false` (no son llamadas a `/logout`), `__is_logging_out__ = null` (flag nunca escrito).
- Despacha `auth:session-expired`.
- `AuthErrorInterceptor` recibe el evento, `isRedirecting = false` → llama a `handleAuthError()`.
- `handleAuthError` hace `signOut` de nuevo (ya esta hecho o en proceso).
- Schedula otro `window.location.href = buildLoginUrl(pathname)`.
- El usuario puede ver el toast "Sesion expirada" solapado con "Sesion cerrada".

El delay de `window.location.replace` (500ms) y el delay del interceptor (1500ms) crean una carrera: normalmente `location.replace` gana y el interceptor cancela su redirect porque la pagina ya ha navegado. Pero en red lenta o device lento, el orden puede invertirse.

Nivel de riesgo: **medio-alto** — degrada la experiencia de logout; en casos extremos puede producir redirecciones inesperadas.

---

### H16. No hay pruebas integradas del flujo real de expiracion/revocacion

Observacion (de la auditoria inicial, confirmada):

Los tests unitarios existentes (`authConfig.test.ts`, `authService.test.ts`, `loginUtils.test.ts`) no cubren:

- `middleware.ts` con el path real de error (fetchWithTenant lanza vs retorna).
- La interaccion `window.fetch` parcheado + `fetchWithTenant` dispatchEvent.
- El callback JWT cuando `/me` lanza (el bug H2).
- La sesion NextAuth con token revocado en backend.
- `from` apuntando a rutas protegidas que vuelven a fallar.
- Varios 401 concurrentes.
- PWA/movil retorno desde segundo plano.
- El flag `__is_logging_out__` no escrito.

Nivel de riesgo: **alto** — sin tests, cualquier fix puede romper el flujo sano sin saberlo.

---

## 5. Mapa de codigo muerto identificado

Estos bloques existen en el codigo actual pero **nunca se ejecutan** en condiciones reales:

| Archivo | Lineas | Descripcion | Por que es muerto |
|---|---|---|---|
| `middleware.ts` | 122-141 | `if (!verifyResponse.ok)` con checks de status | `fetchWithTenant` lanza antes de retornar en servidor |
| `route.ts` | 88-91 | `if (response.status === 401 \|\| response.status === 403) return null` | Misma razon; el catch no invalida |
| `route.ts` | 125-126 | `const tokenIsExpired = false; if (tokenIsExpired)...` | Hardcodeado a false siempre |
| `useIsLoggingOut.ts` | 14 | Lee `sessionStorage.__is_logging_out__` | El flag nunca se escribe |
| `AdminRouteProtection` | 36-38 | `if (isLoggingOut) return <LogoutDialog>` | `useIsLoggingOut()` siempre false |
| `LogoutContext.tsx` | Estado `isLoggingOut` | Context de logout | Nunca se llama a `setIsLoggingOut(true)` |

---

## 6. Hipotesis de causa raiz revisadas

### Hipotesis A: bucle ruta protegida → login → ruta protegida (CONFIRMADA EN CODIGO)

Condicion: token revocado en backend, sesion NextAuth aun valida, `__session_verified` expirada.

Secuencia exacta documentada en H5. El bucle es cerrado y estable. La unica salida dinamica es que algun fetch API (settings u otro contexto) reciba 401 en `/` y active el interceptor, o que el usuario espere 7 dias.

Probabilidad: **certeza** (el mecanismo esta en el codigo; depende de las condiciones).

---

### Hipotesis B: 403 de `/me` tratado de forma inconsistente (PARCIALMENTE CONFIRMADA, MAS COMPLEJA)

La auditoria inicial decia que el middleware convierte 403 en login. En codigo real: el middleware **intenta** convertirlo, pero el path explicito es codigo muerto (H1). El catch del middleware solo redirige si `isAuthError` retorna true basandose en el mensaje del backend. Si el mensaje no coincide con las palabras clave, el middleware **deja pasar al usuario** con datos del JWT.

El callback JWT tampoco invalida por 403 (H2).

El interceptor cliente NO redirige por 403 generico (solo por el patron de "acceso externo desactivado").

Resultado real: 403 de `/me` puede producir comportamiento no determinista dependiendo del mensaje backend:
- Mensaje con palabras clave de auth → redirect a login (middleware).
- Mensaje sin palabras clave → usuario pasa el middleware con datos stale, hace fetch, recibe 403 → UI muestra userMessage (sin logout), o recibe 401 si el token tambien expira → loop.

Probabilidad: **alta** si el backend usa 403 en `/me`.

---

### Hipotesis C: estado mixto de logout previo (CONFIRMADA EN CODIGO)

El flag `__is_logging_out__` nunca se escribe (H6). El mecanismo de supresion esta roto. Durante cualquier logout manual con queries en vuelo, el interceptor puede activarse en paralelo (H15).

Probabilidad: **alta en paginas densas** con muchas queries activas.

---

### Hipotesis D: sesion NextAuth mas larga que access token Laravel (CONFIRMADA Y AGRAVADA)

El callback JWT no puede invalidar la sesion (H2). Aunque el access token expire o sea revocado, NextAuth sigue diciendo "authenticated" por 7 dias. El middleware es el unico que detecta la invalidez en cada request (si `__session_verified` ha expirado). Esta asimetria es la raiz del bucle H5.

Probabilidad: **alta como condicion base** del bug principal.

---

## 7. Escenarios de reproduccion recomendados

### Escenario 1: token revocado con sesion NextAuth viva

1. Loguearse.
2. Revocar el token en backend desde otro dispositivo o endpoint administrativo.
3. Mantener cookie NextAuth intacta.
4. Esperar mas de 5 minutos (para que `__session_verified` expire).
5. Abrir `/admin/home`.
6. Observar: bucle de redirect, o escape via settings query.

### Escenario 2: access token expirado, NextAuth no expirado

1. Loguearse.
2. Forzar expiracion del access token backend (tiempo de vida corto o revocacion manual).
3. Esperar 5+ minutos.
4. Recargar ruta protegida.
5. Medir si `AuthErrorInterceptor` llega a dispararse o si el bucle puro (middleware-only) se sostiene.

### Escenario 3: `/me` devuelve 403 con mensaje no-estandar

1. Loguearse con usuario valido.
2. Desactivar usuario en backend de forma que `/me` retorne 403 con mensaje como "Cuenta suspendida".
3. Entrar en ruta protegida.
4. Confirmar si el middleware redirige a login o deja pasar; si deja pasar, confirmar si la pagina muestra error o otro comportamiento.

### Escenario 4: logout con queries en vuelo

1. Loguearse en pantalla densa (dashboard/admin con settings y tablas activas).
2. Hacer click en logout exactamente cuando TanStack Query esta refetching.
3. Observar si aparece el toast "Sesion expirada" ademas de "Sesion cerrada".
4. Confirmar si hay multiples redirects.

### Escenario 5: movil/PWA retorno desde segundo plano

1. Loguearse en movil o modo PWA.
2. Dejar la app en segundo plano hasta que `__session_verified` expire.
3. Volver a foreground.
4. Observar la transicion de status en `useSession` y si el interceptor se activa.

---

## 8. Instrumentacion sugerida antes de corregir

Para capturar evidencia sin cambios de logica:

- `middleware.ts`: log en el catch con `{ pathname, err.code, err.message, err.status, wasAuthError: isAuthError(err) }`. Tambien loguear cuando `needsVerification = false` (cookie presente) para medir la tasa de bypass.
- `route.ts` callback `jwt`: loguear cuando `/me` lanza (diferente de cuando retorna 401/403). Log de si el token fue renovado o si se continuo con datos stale.
- `AuthErrorInterceptor`: contar cuantas veces `handleAuthError` es llamada por el mismo evento (para detectar listeners acumulados). Loguear el origen: "direct-fetch-patch" vs "session-expired-event".
- `fetchWithTenant`: loguear path, status, `isLogoutRequest`, `isLoggingOut` en todos los 401/403 **sin datos sensibles**.
- `page.js`: loguear transiciones de `status` de `useSession` y la URL de redirect resultante.

Importante: no loguear tokens, emails reales, tenant sensible ni payloads completos.

---

## 9. Plan de pruebas antes de cualquier fix

### Unitarias (en orden de prioridad)

- `fetchWithTenant` servidor vs cliente con 401:
  - Servidor: confirmar que lanza con `code = 'UNAUTHENTICATED'`, no retorna la respuesta.
  - Cliente: confirmar que despacha evento, retorna respuesta.
- `fetchWithTenant` con 403:
  - Servidor: confirmar que lanza error generico sin `code`.
  - Cliente: confirmar que NO despacha evento de sesion expirada.
- `AuthErrorInterceptor`:
  - Un solo 401 → `handleAuthError` llamado una sola vez (no dos).
  - Listener cleanup: montar + desmontar + montar → solo un listener activo.
  - `isRedirecting` se resetea correctamente entre sesiones.
- `middleware.ts` con mocks de `fetchWithTenant`:
  - Mock que lanza UNAUTHENTICATED → confirmar redirect a login.
  - Mock que lanza error generico (403) → confirmar comportamiento.
  - Mock que resuelve ok → confirmar acceso y cookie `__session_verified`.
- JWT callback con mock de `fetchWithTenant`:
  - Mock que lanza (simula 401) → confirmar que el token NO es invalidado (bug confirmado).
  - Mock que retorna ok → confirmar que el token es actualizado.
  - Mock que retorna 401 response (caso imposible en servidor, documentar como tal).

### Integracion

- Middleware → page.js: verificar que el bucle de H5 se puede reproducir y romper con conditions controladas.
- `__is_logging_out__` flag: escribir el flag antes de logout, confirmar que queries concurrentes lo leen.
- Logout manual: confirmar que el interceptor no dispara "sesion expirada" durante logout con flag activo.

### E2E/manual

- Login OTP normal por rol.
- Magic link normal.
- Reload en ruta protegida con sesion valida.
- Token revocado desde backend (esperar 5+ min para que `__session_verified` expire).
- Token expirado.
- Usuario desactivado.
- Tenant desactivado.
- Movil/PWA foreground despues de inactividad.

---

## 10. Recomendaciones de investigacion, no implementacion

1. **Confirmar contrato backend de `/api/v2/me`**:
   - Que status usa para token expirado.
   - Que status usa para usuario desactivado.
   - Que status usa para tenant desactivado.
   - Que status usa para rol sin permiso.
   - Si el cuerpo del 403 contiene palabras clave reconocibles por `isAuthError`.

2. **Definir una unica politica por status**:
   - 401: sesion invalida, limpiar NextAuth y llevar a login.
   - 403: acceso bloqueado o sin permiso, mostrar mensaje y no reloguear salvo caso explicitamente definido.

3. **Confirmar cuando el callback JWT realmente se dispara**:
   - Verificar si `updateAge: 86400` provoca el callback en cada request o solo en el primero de cada 24h.
   - Documentar si hay otro trigger del callback que no sea sign-in y el refresh periodico.

4. **Confirmar si `SettingsProvider` hace llamadas API desde `/`**:
   - Si lo hace: el bucle de H5 se rompe rapidamente via interceptor.
   - Si no lo hace o cachea: el bucle puede durar horas.

5. **Revisar si `__session_verified` debe durar 60s o 5 minutos**:
   - El comentario del codigo dice 60s, el codigo implementa 5 min.
   - Mayor TTL = mayor ventana de "paso libre" con token revocado.
   - Menor TTL = mas llamadas a `/me` = mas riesgo de carrera.

6. **Antes de cambiar produccion**: crear pruebas de regresion sobre las hipotesis anteriores, especialmente H5 y H6.

---

## 11. Riesgos de tocar sin pruebas

- Romper login normal OTP/magic link.
- Convertir 403 de permisos en logout global.
- Dejar usuarios validos atrapados en `/`.
- Romper usuarios externos por `actorType`.
- Romper roles moviles (`operario`, `repartidor_autoventa`) que tienen layouts/guards especificos.
- Introducir doble redirect entre server middleware y cliente.
- Ocultar errores reales de tenant/usuario desactivado como si fueran expiracion normal.
- Al corregir el callback JWT (H2), crear un nuevo bucle si la logica de invalidacion no es idempotente.

---

## 12. Conclusiones

El bug no viene de una unica pieza. La causa raiz es una combinacion de:

1. **El callback JWT no puede invalidar la sesion** cuando el backend rechaza el token, porque `fetchWithTenant` lanza en servidor antes de retornar la respuesta. El check explicito en el codigo es letra muerta. La sesion NextAuth puede vivir 7 dias aunque el backend haya revocado el token.

2. **El bucle principal** existe porque `page.js` (authenticated + loader) navega al default del rol, el middleware rechaza, vuelve a `/`, y se repite indefinidamente. La unica salida dinamica es que algun fetch cliente reciba 401 (lo que requiere que una pagina llegue a montar y hacer queries antes de ser expulsada).

3. **El mecanismo de supresion de logout** (sessionStorage flag, LogoutContext, useIsLoggingOut) existe en el codigo pero esta completamente inoperativo: el flag nunca se escribe.

4. **El check de 401/403 del middleware** (en el bloque `if (!verifyResponse.ok)`) es codigo muerto. El manejo real va por el catch, que solo reconoce 401 de forma fiable. El 403 puede pasar desapercibido segun el mensaje del backend.

5. **El doble despacho de auth events** (window.fetch patch + fetchWithTenant dispatch) y la fuga del listener de `auth:session-expired` crean condiciones para signOut y redirect multiples en escenarios de desmontaje.

La siguiente fase debe ser: instrumentacion controlada para capturar evidencia real (que status exacto devuelve `/me` cuando el token expira/es revocado), seguida de un plan de correccion que cierre los bugs criticos en orden: primero H5 (el bucle), luego H6 (el flag de logout), luego H2 (el callback JWT), luego H8 (el listener leak).
