## Auditoría técnica (profunda) — Bucle de login/redirect tras logout

**Fecha**: 2026-03-25
**Proyecto**: brisapp-nextjs
**Síntoma reportado**: "al desloguearme empezó un bucle; luego al intentar logearme con otra cuenta sigue".
**Ejemplo observado**: `/?from=%2Fadmin%2Fhome` (en producción: subdominio tenant `brisamar.lapesquerapp.es`).

**Observación de campo adicional** _(confirmada 2026-03-25)_:

- El bucle **no ocurre siempre ni en todos los contextos**: probado en otras instancias del mismo proyecto en dominios distintos → sin bucle; probado con otro PC en el mismo dominio → sin bucle; probado con otro navegador en el mismo dominio → sin bucle.
- **Conclusión diagnóstica**: el problema **no es de servidor** (código, variables de entorno, NEXTAUTH_SECRET) sino de **estado de sesión corrompido en el navegador afectado**. Ver §1 y §4b.

---

### 1) Resumen ejecutivo

El bucle cuadra con un **ping‑pong entre el redirect del Home (`/`) y el redirect del `middleware`**:

- **Home (`/`)**: cuando detecta sesión "authenticated" en subdominio, redirige a la ruta por defecto del usuario (por ejemplo `/admin/home`).
- **`middleware.ts`**: al entrar a una ruta protegida (`/admin/*`, `/operator/*`, etc.), si no puede obtener/validar token (o lo considera expirado o el backend lo rechaza), **redirige de vuelta a `/`** añadiendo `?from=<ruta>`.

El resultado visual es un "bucle de login" aunque en realidad es un **bucle de redirecciones**. El análisis profundo revela que existen **tres capas independientes** que pueden generar el bucle, y que pueden actuar en paralelo amplificándose mutuamente.

**Patrón de reproducción confirmado en campo**: el bucle no es universal — solo afecta al navegador concreto que realizó el logout problemático. Mismo dominio en otro equipo o navegador funciona sin incidencias. Esto descarta causas de servidor y señala directamente una **cookie de sesión NextAuth corrompida** en ese navegador específico. Ver §4b para el análisis completo.

---

### 2) Alcance y componentes implicados

- **Edge Middleware**: `src/middleware.ts`
- **NextAuth**: `src/app/api/auth/[...nextauth]/route.ts`
- **Home / gate de login**: `src/app/page.js`
- **Resolver de ruta por defecto**: `src/lib/auth/actor.ts`
- **Redirección post-login**: `src/utils/loginUtils.ts` y `src/hooks/useLoginActions.ts`
- **Interceptor global de 401**: `src/components/Utilities/AuthErrorInterceptor.tsx`
- **Configuración de errores auth**: `src/configs/authConfig.ts` _(añadido en esta revisión)_

---

### 3) Evidencias directas en código (con líneas)

#### 3.1 Home (`/`) redirige si hay sesión autenticada (subdominio)

Cuando estás en subdominio y `useSession()` indica `authenticated`, se ejecuta un redirect inmediato:

- Archivo: `src/app/page.js`
- Líneas:

```44:48:src/app/page.js
  useEffect(() => {
    if (isSubdomain && status === "authenticated" && session?.user) {
      router.replace(getDefaultAuthenticatedRoute(session.user));
    }
  }, [isSubdomain, status, session, router]);
```

La ruta por defecto para internos cae en `/admin/home` salvo roles especiales:

```28:38:src/lib/auth/actor.ts
export function getDefaultAuthenticatedRoute(
  user?: AuthActorLike | null
): string {
  if (isExternalActor(user)) return "/external/stores-manager";

  const role = normalizeRole(user?.role);
  if (role === "operario") return "/operator";
  if (role === "comercial") return "/comercial";
  if (role === "repartidor_autoventa") return "/field";
  return "/admin/home";
}
```

**Riesgo adicional**: el check `session?.user` solo requiere que el objeto `user` exista, no que tenga `accessToken` válido. Si `useSession()` devuelve un user con `accessToken: undefined` (posible en estados intermedios de NextAuth), la redirección a la ruta protegida igualmente se dispara.

#### 3.2 Middleware redirige a `/` si `getToken()` falla o si "expira"

Si no hay token:

```84:88:src/middleware.ts
  if (!token) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
```

Chequeo de expiración:

```90:95:src/middleware.ts
  const tokenExpiration = (token?.exp ?? 0) * 1000;
  if (Date.now() > tokenExpiration) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
```

**Riesgo crítico**: si `token.exp` no existe (`undefined`) → `(token?.exp ?? 0) = 0` → `Date.now() > 0` siempre → **redirect infinito**.

#### 3.3 Middleware hace verificación `/me` con `Bearer ${token.accessToken}` sin guardas

```99:120:src/middleware.ts
  const needsVerification = !req.cookies.get("__session_verified");
  let currentUser: Record<string, unknown> | null = null;

  if (needsVerification) {
    try {
      const verifyResponse = await fetchWithTenant(
        `${API_BASE_URL}/api/v2/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        },
        req.headers
      );
```

Si el backend responde 401/403, se redirige a login:

```127:131:src/middleware.ts
        if (verifyResponse.status === 401 || verifyResponse.status === 403) {
          const loginUrl = new URL("/", req.url);
          loginUrl.searchParams.set("from", pathname);
          return NextResponse.redirect(loginUrl);
        }
```

**Riesgo crítico post-logout**: si el token existe pero `token.accessToken` quedó `undefined` (o stale), la cabecera termina en `Bearer undefined` → 401 → redirect → loop.

#### 3.4 NextAuth invalida sesión si `/me` devuelve 401/403

En callback `jwt`, si el backend rechaza el token:

```78:91:src/app/api/auth/[...nextauth]/route.ts
      if (token.accessToken) {
        try {
          const response = await fetchWithTenant(`${API_URL_V2}me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.status === 401 || response.status === 403) {
            console.warn("[NextAuth] Token rechazado por el backend (401/403), invalidando sesión");
            return null as unknown as typeof token;
          }
```

Esto puede generar transiciones rápidas de estado (`loading` ↔ `authenticated` ↔ `unauthenticated`) alrededor del logout/login.

**Hallazgo adicional**: la línea `125: const tokenIsExpired = false;` está **hardcodeada** — el callback `jwt` nunca marca un token como expirado por tiempo. Esto significa que la única fuente de "expiración" para el middleware es `token.exp`, que como se vio en §3.2 puede ser `undefined`.

#### 3.5 `useLoginActions.ts` — Hard redirect sin validar sesión establecida _(nuevo)_

Tras verificar el OTP y llamar a `signIn()`:

```70:81:src/hooks/useLoginActions.ts
        const signInResult = await signIn("credentials", {
          redirect: false,
          accessToken,
          user: JSON.stringify({ ...result.user, actorType, externalUserType }),
        });
        if (signInResult?.error) {
          notify.error({ title: "Error al iniciar sesión", description: signInResult.error });
          return;
        }
        // ... (no hay check de signInResult.ok)
        window.location.href = getRedirectUrl(result.user, search);
```

**Riesgo crítico**: El código solo comprueba `signInResult?.error`, pero **no valida `signInResult.ok === true`**. Si `signIn()` completa sin `error` pero con `ok: false` (fallo silencioso de NextAuth), el redirect se ejecuta de todos modos hacia la ruta protegida. El middleware la bloquea, la redirige a `/`, y el ciclo comienza.

Además, `window.location.href` es una **navegación dura** (no Next.js router). Si la sesión no quedó persistida en la cookie antes de que el browser navegue, el middleware ve `token = null` → redirect a `/?from=<ruta>`.

#### 3.6 `AuthErrorInterceptor.tsx` — Flag `isRedirecting` con scope de closure _(nuevo)_

```11:12:src/components/Utilities/AuthErrorInterceptor.tsx
  useEffect(() => {
    let isRedirecting = false;
```

El flag `isRedirecting` vive **dentro del closure del `useEffect`**. Cada vez que el componente `AuthErrorInterceptor` se desmonta y remonta (lo que ocurre cuando Next.js realiza una navegación client-side completa), el flag se resetea a `false`.

Si el redirect inicial de `handleAuthError()` causa que el layout se re-renderice y `AuthErrorInterceptor` se remonte, la protección contra doble dispatch desaparece. Consecuencia: pueden dispararse múltiples `handleAuthError()` en el mismo "bucle".

**Agravante**: el `setTimeout` de 1500ms (`REDIRECT_DELAY`) en línea 35 puede solaparse con un nuevo dispatch si el componente se remontó durante ese intervalo.

#### 3.7 Doble interceptación simultánea (servidor + cliente) _(nuevo)_

Cuando una llamada API desde una ruta protegida devuelve 401, **dos sistemas reaccionan en paralelo**:

| Capa                             | Mecanismo                            | Timing                                    | Destino                                              |
| -------------------------------- | ------------------------------------ | ----------------------------------------- | ---------------------------------------------------- |
| Middleware (servidor)            | `if (verifyResponse.status === 401)` | Inmediato (antes de que la página cargue) | `/?from=<pathname>` vía `NextResponse.redirect`      |
| `AuthErrorInterceptor` (cliente) | `window.fetch` interceptado          | Inmediato + 1500ms delay                  | `buildLoginUrl(pathname)` vía `window.location.href` |

El flujo problemático es:

1. Middleware redirige a `/?from=/admin/home` (inmediato).
2. El browser carga `/`. El usuario ve la pantalla de login.
3. **1500ms después**: el `setTimeout` del interceptor ejecuta `window.location.href = "/?from=/admin/home"`.
4. Esto provoca una **segunda navegación a `/`**, sobreescribiendo cualquier estado que el usuario haya iniciado en ese intervalo (por ejemplo, si ya estaba escribiendo el email).
5. Si el usuario logra hacer login completo en esos 1500ms y ser redirigido a `/admin/home`, el `setTimeout` lo devuelve a `/` en plena sesión válida.

#### 3.8 `__session_verified` no se limpia en logout _(nuevo)_

La cookie de verificación tiene TTL de 5 minutos:

```20:20:src/middleware.ts
  // maxAge: 5 * 60  (inferido del código de set-cookie)
```

En el flujo logout → login rápido (< 5 min) con **otra cuenta**:

1. Usuario A hace logout → su sesión NextAuth se borra, pero `__session_verified` persiste.
2. Usuario B hace login en el mismo browser → nueva sesión creada.
3. El middleware encuentra `__session_verified` → **salta la verificación `/me`** para la nueva sesión de B.
4. Si el backend tiene al usuario B desactivado o el tenant incorrecto, el middleware no lo detecta.
5. La llamada API que haga la página sí devuelve 401 → `AuthErrorInterceptor` lo detecta → redirect → loop.

La cookie no está atada al token/usuario actual, es solo un "cache" temporal que no distingue entre sesiones.

#### 3.9 `getRedirectUrl` — Externos pueden recibir `from` hacia rutas internas _(nuevo)_

```25:30:src/utils/loginUtils.ts
  if (user?.actorType === "external_user") return safeFrom || "/external/stores-manager";
  const role = Array.isArray(user?.role) ? user?.role[0] : user?.role;
  if (role === "operario") return "/operator";
  if (role === "comercial") return "/comercial";
  if (role === "repartidor_autoventa") return "/field";
  return safeFrom || "/admin/home";
```

Para usuarios externos, `safeFrom` (el `?from` del URL) se usa **si está presente**, sin validar si la ruta destino es de tipo interno. Un usuario externo podría llegar a `/admin/*` si el `from` original apuntaba ahí. El middleware eventualmente lo redirigirá a `/external/stores-manager`, pero esto genera un redirect extra innecesario y potencialmente confuso.

Para operarios/comerciales/repartidores, el `from` se ignora completamente. Si llegaron a login desde `/operario/alguna-vista`, ese contexto se pierde.

---

### 4) Hipótesis de causa raíz (ordenadas por probabilidad)

#### H1 — `token.exp` ausente en middleware ⇒ "expira" siempre _(alta probabilidad)_

**Señal**: loop inmediato para cualquier ruta protegida; `from` siempre reaparece.
**Causa**: el middleware depende de `token.exp`, pero si `getToken()` no lo provee (o llega como `undefined`), el cálculo `(token?.exp ?? 0) * 1000 = 0` fuerza expiración perpetua.

#### H2 — token existe pero `accessToken` está ausente/stale tras logout ⇒ `/me` 401 ⇒ redirect _(alta probabilidad)_

**Señal**: empieza específicamente después de logout; a veces persiste incluso al intentar iniciar sesión con otra cuenta.
**Causa**: `middleware.ts` llama `/me` incluso si `token.accessToken` es falsy, causando 401 reproducible con `Bearer undefined`.

#### H3 — `getToken()` devuelve `null` en producción (secret/cookies/subdominio) ~~_(media probabilidad)_~~ → **DESCARTADA**

**Descartada por**: el bucle es browser-specific (ver §4b). Si `NEXTAUTH_SECRET` fuera la causa, afectaría a todos los usuarios en ese dominio sin excepción.
**Señal original**: el cliente cree que autenticó (o `signIn` retorna ok), pero el middleware siempre cae en `!token`.
**Mantener como check de infra**: verificar de todos modos que `NEXTAUTH_SECRET` sea idéntico en Edge y Node por higiene (Fix D).

#### H4 — `isRedirecting` flag se resetea al remontar `AuthErrorInterceptor` _(media probabilidad)_

**Señal**: el interceptor dispara múltiples redirects; la notificación de "sesión expirada" aparece varias veces.
**Causa**: el flag vive en el closure del `useEffect`. Cada remount de Next.js durante la navegación resetea la protección.

#### H5 — Doble interceptación (middleware + `AuthErrorInterceptor`) actúa sobre el mismo 401 _(media probabilidad)_

**Señal**: el loop parece "resolverse" y luego vuelve a empezar 1-2 segundos después.
**Causa**: el `setTimeout(1500ms)` del interceptor dispara después de que el middleware ya redirigió, sobreescribiendo el estado de login recién iniciado.

#### H6 — `signIn()` silent failure: `ok: false` sin `error` ⇒ redirect a ruta protegida con sesión inválida _(media-baja probabilidad)_

**Señal**: el usuario hace login con OTP exitosamente (sin mensaje de error) pero inmediatamente aparece `?from=<ruta>`.
**Causa**: `useLoginActions.ts` solo comprueba `signInResult?.error`, no `signInResult?.ok`. NextAuth puede devolver `ok: false` sin `error` si el `authorize` devuelve `null` o lanza una excepción interna.

---

### 4b) Análisis de campo — Por qué el bucle es selectivo (browser-specific)

**Datos observados:**
| Escenario | ¿Bucle? |
|-----------|---------|
| Dominio afectado, PC afectado, navegador afectado | **Sí** |
| Dominio afectado, PC distinto | No |
| Dominio afectado, mismo PC, navegador distinto | No |
| Dominio distinto (otra instancia), cualquier PC | No |

**Qué descarta este patrón:**

- **H3 descartada como causa primaria**: si `NEXTAUTH_SECRET` fuera inconsistente o hubiera un error de configuración en el servidor, `getToken()` devolvería `null` para **todos** los usuarios en ese dominio. Como otros PCs en el mismo dominio funcionan, la infraestructura del servidor es correcta.
- **No es un bug de código puro**: el mismo código funciona perfectamente en otras sesiones. El código tiene las vulnerabilidades descritas en §3, pero no se activan solos — necesitan un estado previo incorrecto.

**Causa raíz real: cookie de sesión NextAuth corrompida en ese navegador**

La cookie `next-auth.session-token` (o `__Secure-next-auth.session-token` en producción HTTPS) almacena el JWT cifrado. En ese browser específico, tras el logout problemático, esa cookie quedó en un **estado intermedio** donde:

- El objeto `token` existe y `getToken()` lo puede descifrar (por eso no cae en `!token`)
- Pero `token.accessToken` es `null` o `undefined` → el middleware envía `Bearer undefined` → 401 → redirect
- O `token.exp` es `0` o `undefined` → el middleware lo trata como siempre expirado → redirect

**Mecanismo probable de la corrupción (race condition en logout):**

```
1. Usuario hace logout → signOut() se llama
2. NextAuth intenta invalidar/borrar la cookie
3. Simultáneamente, el callback `jwt` puede estar ejecutándose (por una request en vuelo o por el `updateAge`)
4. El callback devuelve `null` (§3.4) para invalidar → NextAuth escribe una cookie "nula"
5. Pero si signOut() y el callback jwt compiten, la cookie puede quedar con un JWT parcialmente vaciado:
   - `exp` del JWT original sigue presente pero `accessToken` ya fue limpiado, o
   - el JWT fue reescrito con `accessToken: undefined` antes de que signOut borrara la cookie
6. La cookie queda con un JWT que pasa el decrypt pero tiene campos vacíos
7. En la próxima visita, ese JWT corrompido activa los bugs de §3.2 y §3.3
```

**Por qué persiste entre recargas y reinicios del navegador:**

Las cookies de NextAuth son persistentes (`maxAge: 7 días`). El JWT corrompido sobrevive a:

- Recargas de página
- Cierre y reapertura del navegador
- Incluso reinicios del PC

Solo se elimina si:

- El usuario borra manualmente las cookies del dominio
- La cookie expira (hasta 7 días después)
- O una nueva sesión válida sobreescribe la cookie

**Por qué el intento de login con otra cuenta "también sigue" con bucle:**

Al hacer login nuevo con otra cuenta, `signIn("credentials", ...)` debería sobreescribir la cookie. Pero si la sesión corrompida hace que el middleware siga redirigiendo _antes de que la nueva sesión quede guardada_ (la navegación dura via `window.location.href` de `useLoginActions.ts:81` no espera a que la cookie esté flushed), el ciclo se reinicia con la nueva cuenta antes de que su cookie llegue a establecerse correctamente.

**Acción inmediata para el usuario afectado:**

1. DevTools → Application → Storage → Cookies → seleccionar el dominio afectado
2. Borrar `next-auth.session-token` (o `__Secure-next-auth.session-token`)
3. Borrar `__session_verified` si existe
4. Recargar → el bucle debería desaparecer

Si tras borrar la cookie desaparece el bucle, queda **confirmado** que la causa raíz es la cookie corrompida y que los Fix A + B son los parches de código necesarios para que esto no vuelva a ser un problema incluso si la corrupción ocurre de nuevo.

---

### 5) Modelo de reproducción (secuencia esperada del bucle)

**Bucle primario (H1/H2):**

1. Usuario llega a `/` (en subdominio).
2. `useSession()` resuelve `authenticated` (posible estado transitorio) y Home redirige a `/admin/home`.
3. El middleware intercepta `/admin/home` y:
   - o `getToken()` es null → redirect a `/`
   - o `exp` falta → "expirado" → redirect a `/`
   - o `/me` responde 401/403 (por `Bearer undefined` o token revocado) → redirect a `/`
4. Vuelve a `/` con `?from=/admin/home`.
5. Se repite.

**Bucle secundario (H4/H5 — amplificador):**

1. Middleware redirige a `/?from=/admin/home`.
2. El browser carga login. `AuthErrorInterceptor` re-monta; `isRedirecting = false`.
3. Una llamada API en segundo plano recibe 401 → interceptor dispara nuevo `handleAuthError()`.
4. 1500ms después, `window.location.href = "/?from=/admin/home"` → navegación dura a login otra vez.
5. Ciclo se amplifica.

**Bucle post-logout con otra cuenta (H2/E):**

1. Usuario A hace logout; `__session_verified` permanece activa.
2. Usuario B hace login vía OTP. `signIn()` completa.
3. `useLoginActions` hace `window.location.href = "/admin/home"` (navegación dura).
4. Middleware encuentra `__session_verified` → salta verificación.
5. La ruta carga... pero si el accessToken de B es rechazado por la primera llamada API, el interceptor detecta 401 y redirige. El middleware en la siguiente petición ve token de A stale (o B sin cookie verificada si expiró) → redirect.

---

### 5b) Matriz de riesgo

| Hipótesis                                             | Probabilidad             | Impacto                                           | Prioridad |
| ----------------------------------------------------- | ------------------------ | ------------------------------------------------- | --------- |
| **Cookie corrompida post-logout** _(causa raíz, §4b)_ | **Confirmada**           | **Crítico (origen del estado)**                   | **P0**    |
| H1 — `token.exp` undefined activa loop                | Alta                     | Crítico (loop permanente dado cookie corrompida)  | **P0**    |
| H2 — `Bearer undefined` → 401 activa loop             | Alta                     | Crítico (loop post-logout dado cookie corrompida) | **P0**    |
| H5 — Doble interceptación 1500ms                      | Media                    | Alto (loop re-disparo)                            | **P1**    |
| H4 — `isRedirecting` reset                            | Media                    | Alto (amplificador)                               | **P1**    |
| H6 — `signIn` silent failure                          | Media-baja               | Alto (loop post-login)                            | **P2**    |
| E — `__session_verified` cross-session                | Baja                     | Medio (auth bypass)                               | **P2**    |
| H3 — `getToken()` null                                | ~~Media~~ **Descartada** | —                                                 | —         |
| F — `from` externo → ruta interna                     | Baja                     | Bajo (redirect extra)                             | **P3**    |

---

### 6) Diagnóstico recomendado (sin cambiar código)

#### 6.1 Confirmar que el redirect es de middleware

En DevTools → Network:

- Navegar a `/admin/home`
- Ver si la respuesta es `307/308` hacia `/?from=/admin/home` **antes de que cargue el HTML de la página**.

Si sí, el origen del loop es el **middleware**.

#### 6.2 Diferenciar H1 vs H2 vs H3

- **H3 (token null)**: existe cookie de sesión en el navegador, pero el middleware nunca ve token y siempre ejecuta `if (!token)`.
- **H1 (exp faltante)**: token aparece pero `exp` no; el código actual trata `exp` faltante como expirado.
- **H2 (accessToken faltante)**: token aparece, pero `accessToken` no; el middleware pega a `/me` con `Bearer undefined` y recibe 401.

#### 6.3 Detectar H4/H5 (amplificador del interceptor)

En DevTools → Console:

- Buscar múltiples impresiones del mensaje "Sesión expirada" o `console.warn("[NextAuth]...")`.
- Si aparecen 2+ veces en < 3 segundos, el flag `isRedirecting` se está reseteando.

#### 6.4 Detectar H6 (signIn silent failure)

Añadir temporalmente `console.log("signInResult:", signInResult)` en `useLoginActions.ts:80`.

- Si `ok: false` aparece sin `error`, estamos ante H6.

---

### 7) Set de cambios propuestos (parches recomendados)

> Nota: estos cambios son propuestos; no están aplicados en este documento.

#### Fix A (prioridad P0): endurecer expiración en `middleware.ts`

Archivo: `src/middleware.ts`, líneas 90-95.

- No tratar `exp` ausente como expirado.
- Validar expiración **solo** si `typeof token.exp === "number" && token.exp > 0`.

```ts
// ANTES
const tokenExpiration = (token?.exp ?? 0) * 1000;
if (Date.now() > tokenExpiration) { ... }

// DESPUÉS
if (typeof token.exp === "number" && token.exp > 0) {
  const tokenExpiration = token.exp * 1000;
  if (Date.now() > tokenExpiration) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}
```

#### Fix B (prioridad P0): no llamar `/me` sin `accessToken`

Archivo: `src/middleware.ts`, antes de `fetchWithTenant("/me")`.

```ts
// Añadir antes de la llamada a /me (línea ~98):
if (!token.accessToken) {
  const loginUrl = new URL('/', req.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}
```

Esto elimina el caso `Bearer undefined` y corta loops post-logout.

#### Fix C (prioridad P1): gate defensivo en `/`

Archivo: `src/app/page.js`, línea 45.

```ts
// ANTES
if (isSubdomain && status === "authenticated" && session?.user) {

// DESPUÉS
if (isSubdomain && status === "authenticated" && session?.user?.accessToken) {
```

Exige que `accessToken` esté presente en el objeto de sesión antes de redirigir a una ruta protegida.

#### Fix D (prioridad P1): coherencia de `NEXTAUTH_SECRET` en Edge + API

Verificar que `NEXTAUTH_SECRET` sea idéntico y accesible para:

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/middleware.ts`

Si no lo es, `getToken()` tenderá a devolver `null`.

#### Fix E (prioridad P2): limpiar `__session_verified` en logout _(nuevo)_

Archivo: la lógica de logout (handler de NextAuth o el endpoint `/logout` del backend).

Al hacer `signOut()` o antes de que NextAuth destruya la sesión:

```ts
// En el handler de signOut / logout
res.cookies.delete('__session_verified');
// o en middleware al detectar signOut
```

Esto garantiza que la próxima sesión siempre se verifique contra el backend.

#### Fix F (prioridad P1): sacar `isRedirecting` a nivel de módulo en `AuthErrorInterceptor` _(nuevo)_

Archivo: `src/components/Utilities/AuthErrorInterceptor.tsx`.

```ts
// ANTES (dentro de useEffect — se resetea en cada remount):
useEffect(() => {
  let isRedirecting = false;
  ...

// DESPUÉS (fuera del componente — persiste entre remounts):
let isRedirecting = false;

export default function AuthErrorInterceptor() {
  useEffect(() => {
    ...
```

Esto garantiza que incluso si el componente se remonta durante una navegación, el flag no se resetea.

#### Fix G (prioridad P1): cancelar el `setTimeout` si el componente se desmonta _(nuevo)_

Archivo: `src/components/Utilities/AuthErrorInterceptor.tsx`, `handleAuthError`.

```ts
const handleAuthError = (customMessage?: string) => {
  if (isRedirecting) return;
  ...
  const timeoutId = setTimeout(async () => {
    await clearSession();
    window.location.href = buildLoginUrl(window.location.pathname);
  }, AUTH_ERROR_CONFIG.REDIRECT_DELAY);

  // Guardar timeoutId para cancelarlo en cleanup
  return timeoutId;
};

// En el cleanup del useEffect:
return () => {
  clearTimeout(activeTimeoutId);
  window.fetch = originalFetch;
  ...
};
```

#### Fix H (prioridad P2): validar `signInResult.ok` en `useLoginActions.ts` _(nuevo)_

Archivo: `src/hooks/useLoginActions.ts`, línea ~76.

```ts
// ANTES
if (signInResult?.error) {
  notify.error({ ... });
  return;
}
window.location.href = getRedirectUrl(result.user, search);

// DESPUÉS
if (signInResult?.error || !signInResult?.ok) {
  notify.error({
    title: "Error al iniciar sesión",
    description: signInResult?.error || "No se pudo establecer la sesión. Inténtalo de nuevo.",
  });
  return;
}
window.location.href = getRedirectUrl(result.user, search);
```

#### Fix I (prioridad P3): validar `from` para usuarios externos _(nuevo)_

Archivo: `src/utils/loginUtils.ts`, línea 25.

```ts
// ANTES
if (user?.actorType === 'external_user') return safeFrom || '/external/stores-manager';

// DESPUÉS — solo usar `from` si es una ruta válida para externos
const EXTERNAL_ALLOWED_PREFIXES = ['/external/'];
if (user?.actorType === 'external_user') {
  const isExternalRoute = safeFrom && EXTERNAL_ALLOWED_PREFIXES.some((p) => safeFrom.startsWith(p));
  return isExternalRoute ? safeFrom : '/external/stores-manager';
}
```

---

### 8) Riesgos y efectos colaterales

- **Fix A (exp ausente)**: puede aumentar requests a `/me` si se elimina el early redirect; mitigable con `__session_verified` cuando el token no tiene `exp`.
- **Fix B (no /me sin accessToken)**: seguro y reduce carga/errores. Sin efectos colaterales conocidos.
- **Fix C (gate defensivo en /)**: puede introducir un loader adicional si el `SessionProvider` tarda en poblar `accessToken` en el objeto de sesión, pero evita el loop.
- **Fix E (limpiar \_\_session_verified)**: aumenta las llamadas a `/me` en flujos logout→login rápido, pero es el comportamiento correcto.
- **Fix F (isRedirecting a módulo)**: el flag persiste entre remounts, pero también entre múltiples tabs si el módulo se cachea. Necesita considerar si el módulo es singleton (en Next.js app router, generalmente sí).
- **Fix G (cancelar setTimeout)**: sin efectos colaterales; solo evita redirects extemporáneos.
- **Fix H (validar ok)**: puede mostrar error donde antes había silencio; mejora la UX informando al usuario del fallo.

---

### 9) Conclusión

Con la evidencia de campo confirmada, el cuadro completo es:

- El **origen** es una **cookie NextAuth corrompida** en ese navegador específico, resultado de una race condition durante el logout (§4b). No es un problema de servidor ni de código universal.
- La cookie corrompida **activa vulnerabilidades latentes** en el middleware (H1, H2) que sin ese estado no causan problemas.
- hay redirect automático desde `/` a rutas protegidas,
- y hay redirect desde middleware de vuelta al login ante token ausente/expirado/rechazado,
- con **dos riesgos P0** que se activan cuando la cookie está corrompida: `exp` faltante y `accessToken` faltante (`Bearer undefined`),
- y **tres amplificadores** (H4, H5, H6) que pueden reiniciar el ciclo incluso si los P0 están corregidos.

**Importante**: el bucle es "solo ese navegador" en el sentido de que la cookie corrompida vive ahí. Pero no es un problema del usuario — es un bug de código que causa esa corrupción y que no tiene defensas ante ella.

**Orden de aplicación recomendado:**

1. **Fix B** (no llamar `/me` sin `accessToken`) — corta el loop post-logout más común
2. **Fix A** (endurecer expiración) — corta el loop por `exp` faltante
3. **Fix F** (sacar `isRedirecting` a módulo) — elimina el amplificador
4. **Fix G** (cancelar setTimeout en cleanup) — evita el timeout extemporáneo
5. **Fix C** (gate defensivo en `/`) — robustez adicional ante estados intermedios de sesión
6. **Fix H** (validar `signIn.ok`) — cierra el vector H6
7. **Fix E** (limpiar `__session_verified`) — evita el bypass cross-session
8. **Fix D** (coherencia `NEXTAUTH_SECRET`) — verificación de infra (no código)
9. **Fix I** (externos con `from` interna) — hardening mínimo

---

### 10) Snippets de implementación listos para aplicar

#### `src/middleware.ts` — Fixes A + B combinados

Buscar el bloque de expiración (líneas ~90-95) y la llamada a `/me` (líneas ~96-130). Aplicar en este orden:

```ts
// 1. Después del check !token (línea ~88):
if (!token.accessToken) {
  const loginUrl = new URL('/', req.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

// 2. Reemplazar el bloque de expiración (líneas ~90-95):
if (typeof token.exp === 'number' && token.exp > 0) {
  const tokenExpiration = token.exp * 1000;
  if (Date.now() > tokenExpiration) {
    const loginUrl = new URL('/', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
}
// Si token.exp está ausente, continuar sin redirigir (el backend lo validará)
```

#### `src/components/Utilities/AuthErrorInterceptor.tsx` — Fixes F + G

```ts
"use client";
// ... imports

// MOVER a nivel de módulo (fuera del componente):
let isRedirecting = false;
let redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;

export default function AuthErrorInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;
    const disabledExternalUserPattern = /acceso externo.*desactivad/i;

    const handleAuthError = (customMessage?: string) => {
      if (isRedirecting) return;
      const pathname = window.location.pathname;
      const alreadyOnLogin = pathname === "/" || pathname === "/auth/verify";
      isRedirecting = true;
      const clearSession = async () => { ... };
      if (alreadyOnLogin) {
        clearSession();
        return;
      }
      notify.error({ ... });
      redirectTimeoutId = setTimeout(async () => {
        redirectTimeoutId = null;
        await clearSession();
        window.location.href = buildLoginUrl(window.location.pathname);
      }, AUTH_ERROR_CONFIG.REDIRECT_DELAY);
    };

    // ... resto del interceptor sin cambios ...

    return () => {
      window.fetch = originalFetch;
      // Cancelar timeout pendiente si el componente se desmonta
      if (redirectTimeoutId !== null) {
        clearTimeout(redirectTimeoutId);
        redirectTimeoutId = null;
        isRedirecting = false; // Reset solo en cleanup explícito
      }
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, () => handleAuthError());
    };
  }, []);
  return null;
}
```

#### `src/hooks/useLoginActions.ts` — Fix H

```ts
// Reemplazar el bloque post-signIn (líneas ~74-81):
if (signInResult?.error || !signInResult?.ok) {
  notify.error({
    title: 'Error al iniciar sesión',
    description: signInResult?.error || 'No se pudo establecer la sesión. Inténtalo de nuevo.',
  });
  return;
}
window.location.href = getRedirectUrl(result.user, search);
```

#### `src/app/page.js` — Fix C

```js
// Reemplazar la condición del useEffect (línea 45):
if (isSubdomain && status === 'authenticated' && session?.user?.accessToken) {
  router.replace(getDefaultAuthenticatedRoute(session.user));
}
```
