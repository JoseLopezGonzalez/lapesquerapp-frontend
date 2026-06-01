# Especificación Frontend — Panel Superadmin PesquerApp

**Versión**: 1.0  
**Fecha**: 2026-02-23  
**Estado**: Backend implementado y testeado. Frontend pendiente.  
**Audiencia**: Equipo de desarrollo frontend.

---

## 1. Visión general

Panel de administración de la plataforma SaaS PesquerApp. Permite gestionar tenants (empresas), monitorizar onboarding, impersonar usuarios y ver métricas globales.

| Aspecto            | Valor                                                           |
| ------------------ | --------------------------------------------------------------- |
| URL producción     | `https://admin.lapesquerapp.es`                                 |
| URL desarrollo     | `http://localhost:3001` (o el puerto que se configure)          |
| API base           | `https://api.lapesquerapp.es/api/v2/superadmin`                 |
| API base (dev)     | `http://localhost/api/v2/superadmin`                            |
| Tech               | Next.js (proyecto independiente del frontend de tenants)        |
| Auth               | Magic link + OTP (sin contraseña)                               |
| Token              | Bearer token (Sanctum) en header `Authorization`                |
| No requiere header | `X-Tenant` (las rutas superadmin no pasan por TenantMiddleware) |

---

## 2. Autenticación

### 2.1 Flujo

```
[Email] → POST request-access → [Pantalla OTP + mensaje "revisa tu email"]
                                          │
                              ┌────────────┴────────────┐
                              │                         │
                    POST verify-otp          Click magic link en email
                    { email, code }          POST verify-magic-link { token }
                              │                         │
                              └────────────┬────────────┘
                                           │
                                   { access_token, user }
                                           │
                                     Guardar token
                                     Redirigir a /
```

### 2.2 Endpoints de auth

**Base**: `/api/v2/superadmin/auth`

#### `POST /request-access`

Solicita acceso. Siempre devuelve 200 (no revela si el email existe).

```json
// Request
{ "email": "jose@lapesquerapp.es" }

// Response 200
{ "message": "Si el correo está registrado, recibirás un correo con un enlace y un código para acceder." }
```

**Rate limit**: 5 peticiones por minuto.

#### `POST /verify-magic-link`

Verifica el token del magic link recibido por email.

```json
// Request
{ "token": "abc123...64chars" }

// Response 200
{
    "access_token": "1|xxxxxxxxxx",
    "token_type": "Bearer",
    "user": {
        "id": 1,
        "name": "Jose",
        "email": "jose@lapesquerapp.es"
    }
}

// Response 400 (token inválido o expirado)
{ "message": "El enlace no es válido o ha expirado. Solicita uno nuevo." }
```

**Rate limit**: 10 peticiones por minuto.

#### `POST /verify-otp`

Verifica el código OTP de 6 dígitos.

```json
// Request
{ "email": "jose@lapesquerapp.es", "code": "482916" }

// Response 200
{
    "access_token": "1|xxxxxxxxxx",
    "token_type": "Bearer",
    "user": {
        "id": 1,
        "name": "Jose",
        "email": "jose@lapesquerapp.es"
    }
}

// Response 400 (código inválido o expirado)
{ "message": "El código no es válido o ha expirado. Solicita uno nuevo." }
```

**Rate limit**: 10 peticiones por minuto.

#### `GET /me`

Devuelve el usuario autenticado. Usar para verificar sesión al cargar la app.

```
Authorization: Bearer {token}
```

```json
// Response 200
{
    "data": {
        "id": 1,
        "name": "Jose",
        "email": "jose@lapesquerapp.es",
        "last_login_at": "2026-02-23T14:30:00.000000Z"
    }
}

// Response 401
{ "error": "Unauthorized" }
```

#### `POST /logout`

Revoca el token actual.

```json
// Response 200
{ "message": "Sesión cerrada correctamente" }
```

### 2.3 Gestión del token

- Guardar `access_token` en memoria (o cookie httpOnly si se prefiere).
- Enviar en cada request protegida: `Authorization: Bearer {token}`.
- Si cualquier request devuelve 401, redirigir a `/login`.
- No enviar header `X-Tenant`.

---

## 3. Pantallas

### 3.1 Login (`/login`)

**Componentes:**

- Campo de email con validación
- Botón "Solicitar acceso"
- Al enviar: transición a paso de verificación
  - Campo OTP (6 dígitos, auto-focus, paste support)
  - Texto: "Revisa tu email para el enlace de acceso, o introduce el código"
  - Botón "Verificar"
  - Link "Reenviar código" (con cooldown de 60s)

**UX:**

- Si el usuario llega con query param `?token=xxx` (desde magic link en email), auto-verificar.
- Loading state durante las peticiones.
- Mensajes de error inline.

---

### 3.2 Dashboard (`/`)

**Ruta protegida** — redirigir a `/login` si no hay token.

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│  PesquerApp Admin                    [Jose] [Logout] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Total   │ │ Activos │ │Suspendid│ │Pendiente│   │
│  │    12    │ │    9    │ │    2    │ │    1    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                      │
│  Últimos tenants creados                             │
│  ┌──────────────────────────────────────────────┐   │
│  │ Nombre        │ Subdominio │ Status │ Fecha  │   │
│  │ Brisamar      │ brisamar   │ ● act  │ 23/02  │   │
│  │ Costa Sur     │ costasur   │ ● pend │ 22/02  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Crear tenant]  [Ver todos →]                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Endpoint**: `GET /api/v2/superadmin/dashboard`

```json
// Response 200
{
  "total": 12,
  "active": 9,
  "suspended": 2,
  "pending": 1,
  "cancelled": 0,
  "last_onboarding": {
    "id": 5,
    "name": "Costa Sur S.L.",
    "subdomain": "costasur",
    "onboarding_step": 6,
    "created_at": "2026-02-22T10:00:00.000000Z"
  }
}
```

---

### 3.3 Lista de tenants (`/tenants`)

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│  Tenants                              [+ Nuevo]      │
├──────────────────────────────────────────────────────┤
│  [Todos] [Activos] [Suspendidos] [Pendientes] [Canc] │
│                                                      │
│  Buscar: [________________]                          │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Nombre      │ Subdom. │ Plan │ Status │ Activ. │  │
│  ├─────────────┼─────────┼──────┼────────┼────────┤  │
│  │ Brisamar    │ brisa.. │ pro  │ ●activ │ 2h ago │  │
│  │ Costa Sur   │ costa.. │ basic│ ●pend  │ -      │  │
│  │ PymColorao  │ pymco.. │ pro  │ ●susp  │ 5d ago │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ← 1 2 3 →                                          │
└──────────────────────────────────────────────────────┘
```

**Endpoint**: `GET /api/v2/superadmin/tenants`

**Query params:**

| Param      | Tipo   | Descripción                                                       |
| ---------- | ------ | ----------------------------------------------------------------- |
| `status`   | string | Filtrar por status: `active`, `suspended`, `pending`, `cancelled` |
| `search`   | string | Buscar por nombre o subdominio (parcial)                          |
| `per_page` | int    | Items por página (default 15)                                     |
| `page`     | int    | Página actual                                                     |

```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "name": "Congelados Brisamar S.L.",
      "subdomain": "brisamar",
      "database": "tenant_brisamar",
      "status": "active",
      "plan": "pro",
      "renewal_at": "2027-02-23",
      "timezone": "Europe/Madrid",
      "branding_image_url": "https://...",
      "last_activity_at": "2026-02-23T12:30:00.000000Z",
      "onboarding_step": 8,
      "admin_email": "admin@brisamar.es",
      "created_at": "2025-06-15T10:00:00.000000Z",
      "updated_at": "2026-02-23T12:30:00.000000Z"
    }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 42 }
}
```

**Badges de status:**

| Status      | Color   | Label      |
| ----------- | ------- | ---------- |
| `active`    | verde   | Activo     |
| `suspended` | naranja | Suspendido |
| `pending`   | azul    | Pendiente  |
| `cancelled` | rojo    | Cancelado  |

---

### 3.4 Detalle de tenant (`/tenants/[id]`)

**Secciones:**

#### A. Datos generales

Tabla de datos del tenant con botón "Editar". Los campos `subdomain` y `database` son de solo lectura.

**Endpoint lectura**: `GET /api/v2/superadmin/tenants/{id}`

```json
// Response 200 — mismo schema que en la lista
{
  "data": {
    "id": 1,
    "name": "Congelados Brisamar S.L.",
    "subdomain": "brisamar",
    "database": "tenant_brisamar",
    "status": "active",
    "plan": "pro",
    "renewal_at": "2027-02-23",
    "timezone": "Europe/Madrid",
    "branding_image_url": "https://...",
    "last_activity_at": "2026-02-23T12:30:00.000000Z",
    "onboarding_step": 8,
    "admin_email": "admin@brisamar.es",
    "created_at": "2025-06-15T10:00:00.000000Z",
    "updated_at": "2026-02-23T12:30:00.000000Z"
  }
}
```

**Endpoint actualización**: `PUT /api/v2/superadmin/tenants/{id}`

```json
// Request (todos los campos opcionales)
{
    "name": "Nuevo nombre S.L.",
    "plan": "enterprise",
    "renewal_at": "2027-06-01",
    "timezone": "Atlantic/Canary",
    "branding_image_url": "https://new-logo.png",
    "admin_email": "nuevo@admin.es"
}

// Response 200
{ "data": { /* TenantResource completo */ } }
```

#### B. Acciones de estado

Botones contextuales según el status actual:

| Status actual | Acciones disponibles                     |
| ------------- | ---------------------------------------- |
| `active`      | Suspender, Cancelar                      |
| `suspended`   | Activar, Cancelar                        |
| `pending`     | Activar, Cancelar, Reintentar onboarding |
| `cancelled`   | Activar                                  |

Cada acción requiere diálogo de confirmación.

**Endpoints:**

```
POST /api/v2/superadmin/tenants/{id}/activate    → 200 TenantResource
POST /api/v2/superadmin/tenants/{id}/suspend     → 200 TenantResource
POST /api/v2/superadmin/tenants/{id}/cancel      → 200 TenantResource
POST /api/v2/superadmin/tenants/{id}/retry-onboarding → 200 { message, onboarding_step }
```

#### C. Progreso de onboarding

Visible solo si `status === 'pending'` y `onboarding_step < 8`.

**Pasos del onboarding:**

| Paso | Etiqueta               |
| ---- | ---------------------- |
| 1    | Registro creado        |
| 2    | Base de datos creada   |
| 3    | Migraciones ejecutadas |
| 4    | Catálogos iniciales    |
| 5    | Usuario administrador  |
| 6    | Configuración empresa  |
| 7    | Activación             |
| 8    | Email de bienvenida    |

**Implementación:**

- Barra de progreso con 8 segmentos.
- El segmento actual (= `onboarding_step + 1`) parpadeante/animado.
- Segmentos <= `onboarding_step` en verde (completados).
- Polling: `GET /tenants/{id}` cada 3-5 segundos mientras `onboarding_step < 8`.
- Botón "Reintentar" si lleva más de 30 segundos en el mismo paso.
- Al llegar a paso 8, dejar de hacer polling, mostrar toast "Onboarding completado", refrescar datos.

#### D. Usuarios del tenant

Tabla con los usuarios de la base de datos del tenant.

**Endpoint**: `GET /api/v2/superadmin/tenants/{id}/users`

```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "name": "Admin Brisamar",
      "email": "admin@brisamar.es",
      "role": "administrador",
      "active": true,
      "last_login_at": "2026-02-22T10:15:00.000000Z"
    },
    {
      "id": 2,
      "name": "Operario 1",
      "email": "op1@brisamar.es",
      "role": "operario",
      "active": true,
      "last_login_at": null
    }
  ]
}
```

**Columnas**: Nombre, Email, Rol (badge), Activo, Último acceso, Acciones.

#### E. Impersonación

Junto a cada usuario de rol `administrador` en la tabla de usuarios:

- **Botón "Solicitar acceso"** → modo consentimiento (envía email al admin del tenant)
- **Botón "Acceso directo"** → modo silencioso (sin notificar, con log)

Ver sección 5 para el flujo completo.

---

### 3.5 Crear tenant (`/tenants/new`)

**Formulario:**

| Campo               | Tipo   | Requerido | Validación                                                         |
| ------------------- | ------ | --------- | ------------------------------------------------------------------ |
| Nombre empresa      | text   | Sí        | max 255                                                            |
| Subdominio          | text   | Sí        | solo `a-z`, `0-9`, `-`; no empezar/terminar con `-`; max 63; único |
| Email administrador | email  | Sí        | email válido                                                       |
| Plan                | select | No        | Opciones: basic, pro, enterprise (o libre)                         |
| Zona horaria        | select | No        | Default: Europe/Madrid                                             |
| URL logo            | url    | No        | URL válida                                                         |

**Validación de subdominio en tiempo real:**

- Mientras el usuario escribe, validar formato (regex: `/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/`).
- Al perder foco o tras debounce (300ms), verificar disponibilidad contra la lista de tenants cargados (o un endpoint dedicado si se prefiere).
- Mostrar preview: `{subdominio}.lapesquerapp.es`.

**Endpoint**: `POST /api/v2/superadmin/tenants`

```json
// Request
{
    "name": "Nueva Empresa S.L.",
    "subdomain": "nuevaempresa",
    "admin_email": "admin@nuevaempresa.es",
    "plan": "basic",
    "timezone": "Europe/Madrid",
    "branding_image_url": null
}

// Response 201
{
    "data": {
        "id": 13,
        "name": "Nueva Empresa S.L.",
        "subdomain": "nuevaempresa",
        "database": "tenant_nuevaempresa",
        "status": "pending",
        "plan": "basic",
        "timezone": "Europe/Madrid",
        "branding_image_url": null,
        "last_activity_at": null,
        "onboarding_step": 0,
        "admin_email": "admin@nuevaempresa.es",
        "created_at": "2026-02-23T15:00:00.000000Z",
        "updated_at": "2026-02-23T15:00:00.000000Z"
    },
    "message": "Tenant creado. Onboarding en progreso."
}

// Response 422 (validación)
{
    "message": "The given data was invalid.",
    "errors": {
        "subdomain": ["El subdominio ya está en uso."]
    }
}
```

**Post-envío**: Redirigir a `/tenants/{id}` para mostrar el progreso de onboarding.

---

## 4. Errores y respuestas HTTP

### Códigos comunes

| Código | Significado                      | Acción frontend                                    |
| ------ | -------------------------------- | -------------------------------------------------- |
| 200    | OK                               | Procesar respuesta                                 |
| 201    | Creado                           | Procesar + redirigir                               |
| 400    | Bad request (token/OTP inválido) | Mostrar `message` al usuario                       |
| 401    | No autenticado                   | Redirigir a `/login`                               |
| 404    | No encontrado                    | Mostrar página 404                                 |
| 422    | Validación                       | Mostrar `errors` en los campos                     |
| 429    | Rate limit                       | Mostrar "Demasiadas peticiones, espera un momento" |
| 500    | Error servidor                   | Mostrar error genérico                             |

### Formato de errores de validación

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "campo": ["Mensaje de error 1", "Mensaje de error 2"],
    "otro_campo": ["Mensaje"]
  }
}
```

---

## 5. Impersonación — flujo frontend

### 5.1 Modo consentimiento ("Solicitar acceso")

```
[Click "Solicitar acceso"]
         │
    POST /tenants/{id}/impersonate/request
    { target_user_id: 1 }
         │
    Response: { message, request_id }
         │
    Mostrar toast: "Solicitud enviada. Esperando aprobación."
         │
    (El admin del tenant recibe email con links Aprobar/Rechazar)
         │
    (Si aprueba) → superadmin puede hacer:
         │
    POST /tenants/{id}/impersonate/token
         │
    Response: { impersonation_token, redirect_url }
         │
    window.open(redirect_url)
```

**Nota**: El frontend puede hacer polling a algún estado (no implementado actualmente) o simplemente mostrar el botón "Generar token" que el superadmin pulsa cuando sabe que fue aprobado. Si la solicitud no fue aprobada, el endpoint `token` devolverá 404.

### 5.2 Modo silencioso ("Acceso directo")

```
[Click "Acceso directo"]
         │
    Diálogo de confirmación:
    "Accederás a la cuenta de {nombre} sin notificarlo.
     Esta acción queda registrada en el log de auditoría."
    [Cancelar] [Confirmar]
         │
    POST /tenants/{id}/impersonate/silent
    { target_user_id: 1 }
         │
    Response: { impersonation_token, redirect_url, log_id }
         │
    window.open(redirect_url)
    Guardar log_id para poder cerrar sesión después
```

### 5.3 Fin de sesión de impersonación

```
POST /api/v2/superadmin/impersonate/end
{ log_id: 42 }

Response: { message: "Sesión de impersonación finalizada." }
```

---

## 6. Layout y navegación

### Sidebar / Navbar

```
┌──────────────────┐
│  🐟 PesquerApp   │
│     Admin        │
├──────────────────┤
│  Dashboard       │
│  Tenants         │
├──────────────────┤
│                  │
│  Jose            │
│  [Cerrar sesión] │
└──────────────────┘
```

**Navegación principal:**

- Dashboard (`/`)
- Tenants (`/tenants`)

**Header:**

- Nombre del superadmin (de `/me`)
- Botón logout

### Responsive

- Desktop: sidebar fija + contenido
- Tablet/mobile: hamburger menu + contenido full-width

---

## 7. Consideraciones técnicas

### 7.1 Proyecto Next.js

- Proyecto independiente (no el mismo repo que el frontend de tenants).
- `next.config.js`: configurar `API_BASE_URL` desde env.
- App Router recomendado (Next.js 14+).

### 7.2 Variables de entorno

```env
NEXT_PUBLIC_API_BASE_URL=https://api.lapesquerapp.es/api/v2/superadmin
```

### 7.3 HTTP client

- Wrapper sobre `fetch` o Axios que:
  - Añade `Authorization: Bearer {token}` automáticamente.
  - Intercepta 401 para redirigir a login.
  - Maneja rate limiting (429) con mensaje al usuario.

### 7.4 Estado global

- Token de auth: en memoria (context/zustand/similar).
- Datos del usuario: del endpoint `/me`.
- No se necesita estado complejo — la app es principalmente CRUD.

### 7.5 CORS

Las peticiones desde `admin.lapesquerapp.es` están autorizadas (está en `allowed_origins` de la API). En desarrollo local, `localhost:3001` (o el puerto configurado) también está autorizado si se añade a la lista.

### 7.6 Sin header X-Tenant

A diferencia del frontend de tenants, el panel superadmin NO envía `X-Tenant`. Las rutas `/api/v2/superadmin/*` no pasan por TenantMiddleware.

---

## 8. Flujo de datos — resumen visual

```
                          ┌─────────────────────┐
                          │  admin.lapesquerapp  │
                          │    (Next.js app)     │
                          └─────────┬───────────┘
                                    │
                        Authorization: Bearer xxx
                        (no X-Tenant header)
                                    │
                          ┌─────────▼───────────┐
                          │  api.lapesquerapp.es │
                          │  /api/v2/superadmin  │
                          └─────────┬───────────┘
                                    │
                       SuperadminMiddleware
                       (guard sanctum → superadmin_users)
                                    │
                          ┌─────────▼───────────┐
                          │   BD Central (mysql) │
                          │                      │
                          │  tenants             │
                          │  superadmin_users    │
                          │  superadmin_*_tokens │
                          │  impersonation_*     │
                          └──────────────────────┘
                                    │
                          (para /tenants/{id}/users)
                                    │
                          ┌─────────▼───────────┐
                          │  BD Tenant (lectura) │
                          │  users table         │
                          └──────────────────────┘
```

---

## 9. Checklist de implementación

- [ ] Crear proyecto Next.js (`npx create-next-app@latest pesquerapp-admin`)
- [ ] Configurar env y HTTP client con interceptors
- [ ] Implementar auth flow (login, OTP, magic link auto-verify)
- [ ] Implementar layout con sidebar y protección de rutas
- [ ] Implementar Dashboard con cards y tabla
- [ ] Implementar lista de tenants con filtros, búsqueda y paginación
- [ ] Implementar detalle de tenant con edición inline
- [ ] Implementar acciones de estado (activar/suspender/cancelar) con confirmación
- [ ] Implementar barra de progreso de onboarding con polling
- [ ] Implementar formulario de creación de tenant con validación de subdominio
- [ ] Implementar tabla de usuarios del tenant
- [ ] Implementar flujo de impersonación (consentimiento + silenciosa)
- [ ] Testing E2E (Playwright/Cypress): login, CRUD tenant, onboarding, impersonación
- [ ] Deploy en Coolify bajo dominio `admin.lapesquerapp.es`
