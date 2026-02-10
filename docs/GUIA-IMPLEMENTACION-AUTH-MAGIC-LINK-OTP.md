# Guía de implementación — Migración Auth: Magic Link y OTP (sin contraseña)

Documento generado tras el análisis exhaustivo del frontend. Describe **todos los cambios** necesarios para alinear la aplicación con el nuevo sistema de autenticación del backend (solo Magic Link y OTP; **sin contraseña** en login ni en creación/edición de usuarios).

**Referencia API:** Ver la guía frontend proporcionada (resumen de endpoints y flujos en la introducción de este doc).

**Base URL API:** `API_URL_V2` (`/api/v2`). Header obligatorio: `X-Tenant: {subdominio}` (ya cubierto por `fetchWithTenant`).

---

## 1. Resumen ejecutivo

| Área | Estado actual (frontend) | Cambio requerido |
|------|---------------------------|------------------|
| **Login** | `LoginPage` usa email + contraseña y `signIn("credentials", { email, password })`. NextAuth llama a `POST /v2/login`. | Eliminar contraseña. Solo "Enviar enlace" y "Enviar código" (email). No llamar a `POST /v2/login`. |
| **Verificación de enlace** | No existe. | Nueva ruta `/auth/verify?token=xxx` que canjea token con `POST /v2/auth/magic-link/verify` y establece sesión. |
| **NextAuth** | `CredentialsProvider` con email/password → `POST /v2/login`. | Mantener NextAuth; `authorize` solo aceptará credenciales "token" (accessToken + user) tras canjear magic link u OTP en el cliente. |
| **Crear usuario** | `entitiesConfig.users.createForm` incluye campo `password`. `hideCreateButton: true`. | Quitar campo `password`. Opcional: mostrar botón crear y/o "Reenviar invitación". |
| **Reenviar invitación** | No existe. | Nuevo endpoint en `userService`: `POST /v2/users/{id}/resend-invitation`. Botón en lista/ficha de usuarios. |
| **Rol** | Uso de `role` (string) ya en varios sitios; API devuelve `role`. | Asegurar que en toda la app se use `role` (string), no `roles` (array). |
| **Eliminar usuario** | `DELETE /v2/users/{id}` ya usado. | Sin cambios de llamada; backend hace soft delete. |

---

## 2. Cambios por archivo (orden recomendado)

### 2.1 Servicios de autenticación (nuevos flujos)

#### **`src/services/authService.js`**

- **Solicitar acceso (un solo correo con enlace + código):**
  - `requestAccess(email)` → `POST /v2/auth/request-access` con body `{ email }`. Sin auth. Reemplaza a magic-link/request y otp/request. Respuesta 200 con mensaje genérico.
- **Canjear enlace:** `verifyMagicLinkToken(token)` → `POST /v2/auth/magic-link/verify` con body `{ token }`. Sin auth. Devolver `{ access_token, user }`.
- **Canjear código:** `verifyOtp(email, code)` → `POST /v2/auth/otp/verify` con body `{ email, code }`. Sin auth. Devolver `{ access_token, user }`.
- Usar `fetchWithTenant` y `API_URL_V2`; en estas llamadas **no** enviar `Authorization` (son pre-login).
- Tratar **429** (Too Many Requests): lanzar error con mensaje tipo "Demasiados intentos; espera un momento antes de volver a intentar." para mostrarlo en UI.

**Detalle:** Todas las peticiones deben llevar `X-Tenant` (ya lo añade `fetchWithTenant`). La URL base debe ser la misma que usa el resto de la app (ej. `API_URL_V2` desde `@/configs/config`).

---

### 2.2 NextAuth: dejar de usar login con contraseña

#### **`src/app/api/auth/[...nextauth]/route.js`**

- **Eliminar** la lógica que llama a `POST /v2/login` con email/password en `CredentialsProvider.authorize`.
- **Actualizar** el objeto `credentials` del provider: quitar `email` y `password`; definir `accessToken` y `user` (para que refleje lo que envía el cliente y no quede referencia a contraseña).
- **Nueva lógica en `authorize`:**
  - Si `credentials.accessToken` y `credentials.user` están presentes: es el flujo post Magic Link / OTP (el cliente ya canjeó el token/código y envía el token + user). En ese caso:
    - Opcional: validar que el token no esté vacío.
    - Devolver `{ ...JSON.parse(credentials.user), accessToken: credentials.accessToken }` (o el formato que use la sesión actual: `accessToken`, `role`, etc.).
  - Si no: devolver `null` (o lanzar error indicando que el acceso es solo por enlace/código).
- **Mantener** rate limiting por IP si se desea (ahora aplicaría a magic-link/request y otp/request en backend; el frontend no llama a `/v2/login`).
- **Mantener** callbacks `jwt` y `session` tal cual (ya guardan `accessToken`, `role`, `assignedStoreId`, `companyName`, `companyLogoUrl`). Asegurar que `role` se normalice a string si la API devuelve array.

**Importante:** El login "clásico" desde la pantalla de login ya no llamará a NextAuth con email/password. Solo se llamará a `signIn("credentials", { ... })` desde:
- La página `/auth/verify` tras canjear el magic link (con `accessToken` + `user`).
- La pantalla de login tras canjear el código OTP (con `accessToken` + `user`).

---

### 2.3 Pantalla de login

#### **`src/components/LoginPage/index.js`**

- **Eliminar:** estado y campos de contraseña (`password`, `showPassword`), y cualquier lógica de demo que rellene contraseña (ej. `setPassword("admin")`). El modo demo puede rellenar solo email o desactivarse para login.
- **Mantener:** comprobación de tenant activo, branding por subdominio, y redirección con `from` (ej. `redirectTo = params.get("from") || "/admin/home"`).
- **Nuevo flujo (un solo botón "Acceder"):**
  - Un solo campo: **email** (obligatorio) y un solo botón **"Acceder"**.
  - Al pulsar "Acceder": llamar a `authService.requestAccess(email)` → `POST /v2/auth/request-access` con body `{ email }`.
  - Mensaje tras enviar: "Si el correo está registrado y activo, recibirás un correo con un enlace y un código para acceder." (o similar: "Revisa tu correo: tienes un enlace y un código para acceder.").
  - En la misma pantalla (o paso siguiente), mostrar campo para el **código de 6 dígitos** (por si el usuario abre el correo en otro dispositivo). Al enviar el código → `POST /v2/auth/otp/verify` con `{ email, code }`; con 200 guardar `access_token` y `user`, hacer `signIn` y redirigir.
- **No** llamar a `signIn` con email/password ni a `POST /v2/login`.
- **Eliminar** cualquier opción "Entrar con contraseña".
- Manejo de 429 (throttle) en pantallas de auth.

---

### 2.4 Página de verificación de Magic Link (nueva)

#### **Nueva ruta: `src/app/auth/verify/page.js`** (o `page.jsx` según convención del proyecto)

- Página que se abre cuando el usuario hace clic en el enlace del correo. La URL del enlace debe ser la del **frontend**, por ejemplo:  
  `https://{subdominio}.lapesquerapp.es/auth/verify?token=XXXX`
- **Comportamiento:**
  1. Leer el query param `token` (ej. `useSearchParams()`).
  2. Si no hay `token`, mostrar mensaje "Enlace no válido" y un enlace/botón para volver a `/` (login).
  3. Si hay `token`: llamar a `authService.verifyMagicLinkToken(token)`.
  4. Si la respuesta es correcta (200 con `access_token` y `user`):
    - Llamar a `signIn("credentials", { redirect: false, accessToken: data.access_token, user: JSON.stringify(data.user) })`.
    - Tras éxito, redirigir a la URL guardada en `from` o por defecto a `/admin/home` (y para operario a `/warehouse/{assignedStoreId}` si aplica).
  5. Si la API devuelve **400** (enlace no válido o expirado): mostrar mensaje "Enlace no válido o expirado" y opción "Solicitar nuevo enlace" (enlace a `/`).
  6. Si **403** (usuario desactivado): mostrar mensaje acorde.
  7. Mostrar estado de carga mientras se verifica el token.
- **Tenant:** La app ya obtiene el tenant por subdominio en el cliente; `fetchWithTenant` lo enviará en `X-Tenant`. No hace falta lógica adicional si la URL del correo usa el mismo subdominio.

---

### 2.5 Middleware y rutas públicas

#### **`src/middleware.js`**

- **No** incluir `/auth/verify` en las rutas protegidas: el matcher actual es `['/admin/:path*', '/production/:path*', '/warehouse/:path*']`, por tanto `/auth/verify` ya es accesible sin token. No cambiar el matcher para exigir auth en `/auth/verify`.
- Comprobar que, si en el futuro se añaden más rutas bajo `/auth`, no se protejan por error (la página de verify debe ser pública).

---

### 2.6 Configuración de errores de auth

#### **`src/configs/authConfig.js`**

- Añadir a `AUTH_ERROR_MESSAGES` (opcional) algo como `"Too Many Requests"` o `"429"` si se quiere que el interceptor trate el throttle como error de "auth" para redirigir o mostrar mensaje.
- **Recomendación:** En las pantallas de login y verify, manejar **429** explícitamente y mostrar: "Demasiados intentos; espera un momento antes de volver a intentar." sin necesidad de añadirlo a la lista global de mensajes de auth.

---

### 2.7 Gestión de usuarios: configuración y servicio

#### **`src/configs/entitiesConfig.js`** — entidad `users`

- En **`users.createForm.fields`**:
  - **Eliminar** por completo el campo con `name: "password"` (incluyendo label, type, validation, cols).
  - **Mantener** campos: `name`, `email`, `role`. Opcional: añadir campo `active` (boolean) si la API lo acepta al crear.
- Opcional: cambiar `hideCreateButton` de `true` a `false` para permitir crear usuarios desde el listado (sin contraseña; acceso por Magic Link/OTP). Si se mantiene en `true`, la creación solo estará disponible si hay otra entrada (ej. ruta directa) que use la misma config.
- **No** añadir campo contraseña en edit (la guía indica que no se usa contraseña al editar).

#### **`src/services/domain/users/userService.js`**

- **Añadir** método `resendInvitation(id)`:
  - `POST ${API_URL_V2}users/${id}/resend-invitation`
  - Con `Authorization: Bearer ${token}` y mismo uso de `fetchWithTenant`/tenant que el resto.
  - Sin body.
  - Devolver la respuesta (ej. mensaje de éxito); en caso de error, dejar que el servicio lance (403, 404, 500) para que la UI muestre el mensaje.
- **create:** ya no enviar `password`; el backend no lo acepta. El formulario dejará de incluir el campo, así que el payload enviado desde el cliente ya no lo llevará.
- **delete:** sin cambios (DELETE ya existe; backend hace soft delete).

---

### 2.8 Botón "Reenviar invitación" en la lista/ficha de usuarios

Actualmente la tabla de entidades tiene columnas de acciones "Editar" y "Ver" según `config.hideEditButton` / `config.hideViewButton`. No hay acción por fila tipo "Reenviar invitación".

Opciones (elegir una):

- **Opción A (recomendada):** Añadir en `entitiesConfig.users` una propiedad que defina acciones extra por fila, por ejemplo `table.rowActions` o `extraRowActions`, con una acción "Reenviar invitación" que llame a `userService.resendInvitation(row.id)`. Luego en el componente que construye las columnas de la tabla (p. ej. `EntityClient` o `generateColumns2` / `EntityBody`), si existe `config.table.rowActions`, renderizar un botón adicional por fila que ejecute esa acción (solo para la entidad `users` o de forma genérica si se implementa para varias entidades).
- **Opción B:** En el mismo componente de tabla, si `config.endpoint === 'users'`, añadir una columna de acciones extra con el botón "Reenviar invitación" que llame a `userService.resendInvitation(id)` y muestre toast de éxito/error.

**Archivos a tocar:**

- **`src/configs/entitiesConfig.js`** — En `users`, añadir algo como:
  - `table.rowActions: [{ label: 'Reenviar invitación', action: 'resendInvitation' }]`  
  o la estructura que se decida para acciones por fila.
- **`src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/generateColumns.js`** (o donde se construyan las columnas): si la config tiene `rowActions` y la entidad es `users`, añadir botón "Reenviar invitación" que llame a `userService.resendInvitation(id)` con confirmación opcional y toast.
- **`src/components/Admin/Entity/EntityClient/index.js`** — Si la acción se resuelve por config, pasar `config` (o `rowActions`) al generador de columnas para que pueda mostrar el botón.

Tras éxito de "Reenviar invitación", opcionalmente refrescar la lista.

---

### 2.9 Interceptor de errores de auth (opcional)

#### **`src/components/Utilities/AuthErrorInterceptor.js`**

- Si se quiere que un **429** en cualquier petición no dispare redirección al login (porque 429 no es "sesión expirada"), asegurar que el interceptor no trate 429 como 401/403, o que solo redirija en 401/403. No es obligatorio cambiar nada si actualmente solo se reacciona a códigos 401/403.

---

### 2.10 Documentación interna

#### **`docs/11-AUTENTICACION-AUTORIZACION.md`**

- Actualizar para reflejar:
  - Login solo por Magic Link y OTP (sin contraseña).
  - Nueva ruta `/auth/verify` y flujo de canje de enlace.
  - Uso de `signIn("credentials", { accessToken, user })` solo tras verify (magic link u OTP).
  - Eliminación de `POST /v2/login` para acceso.
  - Endpoints nuevos: `auth/magic-link/request`, `auth/magic-link/verify`, `auth/otp/request`, `auth/otp/verify`.
  - Reenviar invitación: `POST /v2/users/{id}/resend-invitation`.
  - Crear usuario sin contraseña; acceso por enlace/código.
  - Throttle 429 y mensaje recomendado.

---

## 3. Tipos / TypeScript (si se usa)

Si en el futuro se añaden tipos para la API:

- **AuthUser:** `id`, `name`, `email`, `assignedStoreId?`, `companyName?`, `companyLogoUrl?`, `role` (string).
- **LoginResponse:** `access_token`, `token_type`, `user`: AuthUser.
- **CreateUserPayload:** `name`, `email`, `role`, `active?`; **sin** `password`.
- **Roles:** valores `tecnico`, `administrador`, `direccion`, `administracion`, `comercial`, `operario`.

El código actual es JavaScript; este apartado es solo de referencia.

---

## 4. Checklist de implementación

- [ ] **authService.js:** Añadir `requestMagicLink`, `verifyMagicLinkToken`, `requestOtp`, `verifyOtp`; manejo de 429; no enviar Authorization en estas llamadas.
- [ ] **NextAuth route:** Dejar de llamar a `POST /v2/login`; actualizar `credentials` del provider a `accessToken` y `user`; en `authorize` solo aceptar `accessToken` + `user` y devolver objeto usuario con `accessToken`.
- [ ] **LoginPage:** Quitar contraseña y flujo email+password; solo email + "Enviar enlace" + "Enviar código" (+ campo y botón para verificar código OTP).
- [ ] **Nueva página `/auth/verify`:** Leer `token`, llamar a `verifyMagicLinkToken`, luego `signIn` con token+user; redirigir con misma lógica que `page.js` (operario → warehouse, resto → `from` o `/admin/home`); validar `from` para evitar open redirect; manejar 400/403.
- [ ] **Middleware:** Confirmar que `/auth/verify` no está protegida.
- [ ] **ProtectedRoute:** Cambiar redirección de `/login` a `/` o `buildLoginUrl()` cuando no autenticado.
- [ ] **entitiesConfig users:** Quitar campo `password` de `createForm.fields`; opcional `active`; opcional mostrar botón crear.
- [ ] **userService:** Añadir `resendInvitation(id)`; asegurar que create no envíe `password`.
- [ ] **Lista/ficha usuarios:** Añadir botón "Reenviar invitación" (vía rowActions o lógica específica para `users`) que llame a `userService.resendInvitation(id)`.
- [ ] **AuthErrorInterceptor (opcional):** Excluir pathname `/auth/verify` para no redirigir al login si una petición de verify devuelve 401.
- [ ] **LoginPage:** Eliminar o dejar de usar `index copy.js`; ningún import debe apuntar a la copia.
- [ ] **authConfig (opcional):** Mensaje o manejo 429 en pantallas de auth.
- [ ] **docs/11-AUTENTICACION-AUTORIZACION.md:** Actualizar con los nuevos flujos y endpoints.
- [ ] **Backend (recordatorio):** Configurar URL base del frontend por tenant para el enlace del correo (magic link).

---

## 5. Resumen de archivos afectados

| Archivo | Acción |
|---------|--------|
| `src/services/authService.js` | Añadir 4 funciones (magic link + OTP request/verify); sin Authorization. |
| `src/app/api/auth/[...nextauth]/route.js` | Cambiar `credentials` a accessToken/user; `authorize`: solo token+user; quitar llamada a `/v2/login`. |
| `src/components/LoginPage/index.js` | Quitar contraseña; añadir flujo "Enviar enlace" y "Enviar código" + verificación OTP. |
| `src/app/auth/verify/page.js` | **Crear:** canjear token, signIn, redirigir (operario/from); validar `from`; manejar 400/403. |
| `src/middleware.js` | Solo verificar que `/auth/verify` no esté protegida. |
| `src/components/ProtectedRoute/index.js` | Redirigir a `/` o `buildLoginUrl()` en lugar de `/login`. |
| `src/configs/authConfig.js` | Opcional: mensaje o manejo 429. |
| `src/configs/entitiesConfig.js` | users: quitar campo password; opcional rowActions / active; opcional hideCreateButton. |
| `src/services/domain/users/userService.js` | Añadir `resendInvitation(id)`. |
| `src/components/Admin/Entity/...` (EntityClient / generateColumns / EntityBody) | Añadir botón "Reenviar invitación" para usuarios (por config o por endpoint). |
| `src/components/Utilities/AuthErrorInterceptor.js` | Opcional: no redirigir cuando pathname es `/auth/verify`. |
| `src/components/LoginPage/index copy.js` | Eliminar o dejar de usar (evitar imports). |
| `docs/11-AUTENTICACION-AUTORIZACION.md` | Actualizar documentación de auth. |

---

## 6. Orden sugerido de ejecución

1. **Servicios:** `authService` (nuevas funciones) y `userService.resendInvitation`.
2. **NextAuth:** Ajustar `authorize` para token+user.
3. **Login:** Cambiar `LoginPage` a solo email + enlace + OTP.
4. **Verify:** Crear `/auth/verify` y probar el enlace del correo.
5. **Usuarios:** Quitar password en config; añadir botón "Reenviar invitación" y opcionalmente mostrar crear usuario.
6. **Documentación y pulido:** authConfig, interceptor, docs.

Cuando autorices la ejecución, se puede implementar siguiendo esta guía y el checklist anterior.

---

## 7. Segunda revisión — Puntos adicionales

Tras una segunda pasada por el código, se han identificado los siguientes puntos para no dejar nada atrás.

### 7.1 Redirección al login: ruta correcta

- **`src/components/ProtectedRoute/index.js`**  
  Actualmente redirige a **`/login`** cuando `status === "unauthenticated"`. En la app la pantalla de login está en **`/`**, no en `/login`.  
  **Cambio:** Usar `router.push('/')` o `router.push(buildLoginUrl())` en lugar de `router.push("/login")` para mantener coherencia y que el parámetro `from` se preserve si se usa `buildLoginUrl`.

### 7.2 NextAuth: esquema de credenciales del provider

- **`src/app/api/auth/[...nextauth]/route.js`**  
  El `CredentialsProvider` define `credentials: { email, password }`. Cuando el único flujo sea token + user, conviene que el esquema refleje lo que se envía desde el cliente.  
  **Cambio:** Sustituir por algo como `credentials: { accessToken: { label: 'Access Token', type: 'text' }, user: { label: 'User', type: 'text' } }`. Así queda documentado qué acepta `authorize` y se evita confusión con email/password.

### 7.3 Interceptor y página de verify

- **`src/components/Utilities/AuthErrorInterceptor.js`**  
  Solo reacciona a **401/403** (`isAuthStatusCode`). Un 429 no dispara redirección al login; no hace falta cambiar nada por throttle.  
  **Recomendación:** Si en algún caso la API devolviera **401** en la página de verify (p. ej. token inválido), el interceptor podría redirigir a login mientras se muestra el mensaje de “enlace inválido”. Para evitarlo, se puede excluir la ruta de verify: al inicio de `handleAuthError`, si `window.location.pathname === '/auth/verify'`, no ejecutar la redirección (o no llamar a `handleAuthError` cuando la petición que falló sea la de verify). La API indica 400 para enlace inválido/expirado; esta comprobación es por si en el futuro se usa 401.

### 7.4 Copia de LoginPage

- **`src/components/LoginPage/index copy.js`**  
  Existe una copia del componente de login. Para no mantener dos versiones y evitar que alguien importe la copia por error, **eliminarla** o renombrarla a algo explícito (ej. `LoginPage.legacy.js`) y no usarla en la app. Si se elimina, comprobar que ningún import apunte a “index copy” o al nombre del archivo copia.

### 7.5 URL del enlace en el correo (backend)

- La URL que el usuario recibe en el correo (magic link) debe apuntar al **frontend**, por ejemplo:  
  `https://{subdominio}.lapesquerapp.es/auth/verify?token=XXXX`  
  Esto se configura en el **backend** (variable de entorno o config por tenant). No es un cambio de frontend, pero hay que asegurarse de que el backend esté configurado con la base URL correcta del frontend por tenant para que el enlace funcione.

### 7.6 Parámetro `from` en `/auth/verify` (seguridad)

- En la página `/auth/verify`, al redirigir tras un login exitoso se usará el query `from` si existe. Para evitar **open redirect** (redirigir a un dominio externo), validar que `from` sea una ruta interna: por ejemplo, que empiece por `/` y no contenga `//` ni protocolo (`http:`, `https:`). Si no es válido, usar por defecto `/admin/home` (o la lógica de operario). Lo mismo aplica en la página de login si se usa `from` para redirigir después del OTP.

### 7.7 authService: no enviar Authorization en request/verify

- En las nuevas funciones (`requestMagicLink`, `verifyMagicLinkToken`, `requestOtp`, `verifyOtp`) no debe enviarse el header **Authorization**. `fetchWithTenant` añade `X-Tenant` y `Content-Type`; si en esas llamadas no se pasan headers con `Authorization`, no se enviará. Confirmar que en `authService` no se use `getSession()` ni `getAuthToken()` para estas cuatro funciones.

### 7.8 Redirección post-login en verify (operario y `from`)

- En `/auth/verify`, tras un `signIn` exitoso, la redirección debe seguir la **misma lógica que en `app/page.js`**: si el usuario tiene rol **operario** y tiene `assignedStoreId`, redirigir a `/warehouse/{assignedStoreId}`; en caso contrario, redirigir a la URL en `from` (si es válida) o a `/admin/home`. Así se evita llevar al operario al admin y se respeta la intención de “volver a la página que pedía login”.
