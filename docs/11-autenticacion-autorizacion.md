# Autenticación y Autorización

## 📚 Documentación Relacionada

- **[01-architecture-app-router.md](./01-architecture-app-router.md)** - Middleware y protección de rutas
- **[02-project-structure.md](./02-project-structure.md)** - Estructura de archivos de autenticación

---

## 📋 Introducción

La aplicación utiliza **NextAuth.js** para la gestión de autenticación y sesiones. **El acceso es solo por Magic Link o código OTP** enviado por correo; no se usa contraseña en login ni al crear/editar usuarios.

- **Login:** El usuario introduce su email y elige "Enviar enlace" o "Enviar código". Tras canjear el enlace (ruta `/auth/verify?token=xxx`) o el código OTP, se establece la sesión con el token devuelto por la API.
- **NextAuth** solo acepta credenciales `accessToken` + `user` (tras canjear magic link u OTP en el cliente); no se llama a `POST /v2/login`.
- **Usuarios:** Creación sin campo contraseña; "Reenviar invitación" envía el magic link al correo del usuario (`POST /v2/users/{id}/resend-invitation`).

**Archivos principales**:

- `/src/app/api/auth/[...nextauth]/route.js` - Configuración de NextAuth
- `/src/middleware.js` - Middleware de protección de rutas
- `/src/configs/roleConfig.js` - Configuración de roles por ruta
- `/src/configs/authConfig.js` - Configuración de manejo de errores
- `/src/components/AdminRouteProtection/index.js` - Componente de protección
- `/src/components/ProtectedRoute/index.js` - Componente genérico de protección

---

## 🔐 NextAuth.js

### Configuración

**Archivo**: `/src/app/api/auth/[...nextauth]/route.js`

**Provider**: `CredentialsProvider`

**Estrategia de sesión**: JWT (JSON Web Token)

**Configuración de sesión**:

```javascript
session: {
  strategy: 'jwt',
  maxAge: 60 * 60 * 24 * 7,  // 7 días
  updateAge: 60 * 60 * 24,   // Actualizar token cada 1 día
}
```

### Rate Limiting

**Implementación**: Rate limiting simple en memoria por IP

**Configuración**:

```javascript
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
```

**Funcionalidad**:

- Rastrea intentos de login por IP
- Bloquea después de 5 intentos en 10 minutos
- Mensaje: "Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde."

**Limitación**: El rate limiting es en memoria, se resetea al reiniciar el servidor.

### Flujo de Autenticación (Magic Link y OTP)

1. **Pantalla de login** (`/`): el usuario introduce **email** y pulsa **"Acceder"**:
   - Se llama a `POST /v2/auth/request-access` con body `{ email }` (un solo correo con enlace + código).
   - Mensaje: "Si el correo está registrado y activo, recibirás un correo con un enlace y un código para acceder."
   - Se muestra un campo para el código de 6 dígitos (por si abre el correo en otro dispositivo). Al enviar el código → `POST /v2/auth/otp/verify` con `{ email, code }`.
   - El correo también lleva un enlace a `/auth/verify?token=xxx` para canjear desde el mismo dispositivo.

2. **Tras canjear enlace o código**, el cliente recibe `access_token` y `user`. Entonces se llama a NextAuth:

   ```javascript
   await signIn('credentials', {
     redirect: false,
     accessToken: data.access_token,
     user: JSON.stringify(data.user),
   });
   ```

3. **NextAuth `authorize`** solo acepta credenciales token+user (no email/password ni `POST /v2/login`):

   ```javascript
   if (credentials?.accessToken && credentials?.user) {
     const user = JSON.parse(credentials.user);
     return { ...user, accessToken: credentials.accessToken };
   }
   return null;
   }
   ```

4. **Página `/auth/verify`:** Lee `token` de la URL, llama a `POST /v2/auth/magic-link/verify`, y tras éxito hace `signIn` con el token y user y redirige (operario → `/warehouse/{id}`, resto → `from` o `/admin/home`). Si la API devuelve 400/403, se muestra mensaje y opción de volver al login.

5. **Callback JWT**

   ```javascript
   async jwt({ token, user }) {
     if (user) {
       token.accessToken = user.accessToken;
       token.role = user.role;
       if (user.assignedStoreId) token.assignedStoreId = user.assignedStoreId;
       if (user.companyName) token.companyName = user.companyName;
       if (user.companyLogoUrl) token.companyLogoUrl = user.companyLogoUrl;
     }
     return token;
   }
   ```

6. **Callback Session**
   ```javascript
   async session({ session, token }) {
     if (!token) return null;
     session.user = token;
     return session;
   }
   ```

### Estructura del Token JWT

```javascript
{
  accessToken: string,        // Token de acceso para API v2
  role: string,               // Rol único del usuario (tecnico, administrador, direccion, etc.)
  assignedStoreId?: number,   // ID de almacén asignado (operario)
  companyName?: string,       // Nombre de la empresa
  companyLogoUrl?: string,    // URL del logo de la empresa
  exp: number,                // Expiración (timestamp)
  // ... más campos del usuario
}
```

### Páginas Personalizadas

```javascript
pages: {
  signIn: '/',    // Página de login
  error: '/',     // Redirigir a login en caso de error
}
```

---

## 🛡️ Middleware de Protección

**Archivo**: `/src/middleware.js`

**Funcionalidad**: Protección de rutas a nivel de servidor antes de que la request llegue a la página.

### Rutas Protegidas

```javascript
export const config = {
  matcher: ['/admin/:path*', '/production/:path*', '/warehouse/:path*'],
};
```

### Flujo del Middleware

1. **Ignorar recursos estáticos**

   ```javascript
   if (
     pathname.startsWith('/_next') ||
     pathname.startsWith('/api') ||
     pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
   ) {
     return NextResponse.next();
   }
   ```

2. **Obtener token JWT**

   ```javascript
   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
   ```

3. **Validar existencia de token**

   ```javascript
   if (!token) {
     const loginUrl = new URL('/', req.url);
     loginUrl.searchParams.set('from', pathname);
     return NextResponse.redirect(loginUrl);
   }
   ```

4. **Validar expiración**

   ```javascript
   const tokenExpiration = token?.exp * 1000;
   if (Date.now() > tokenExpiration) {
     // Redirigir a login
   }
   ```

5. **Validar token con backend**

   ```javascript
   const verifyResponse = await fetchWithTenant(
     `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/me`,
     {
       headers: { Authorization: `Bearer ${token.accessToken}` },
     }
   );

   if (!verifyResponse.ok) {
     // Token inválido o revocado, redirigir a login
   }
   ```

6. **Verificar roles**

   ```javascript
   // Obtener ruta coincidente más específica
   const matchingRoute = Object.keys(roleConfig)
     .filter((route) => pathname.startsWith(route))
     .sort((a, b) => b.length - a.length)[0];

   const rolesAllowed = roleConfig[matchingRoute] || [];
   const userRoles = Array.isArray(token.role) ? token.role : [token.role];

   const hasAccess = userRoles.some((role) => rolesAllowed.includes(role));
   ```

7. **Manejo especial para store_operator**

   ```javascript
   if (!hasAccess && userRoles.includes('store_operator') && pathname.startsWith('/admin')) {
     if (token.assignedStoreId) {
       return NextResponse.redirect(`/warehouse/${token.assignedStoreId}`);
     } else {
       return NextResponse.redirect('/unauthorized');
     }
   }
   ```

8. **Redirigir si no tiene acceso**
   ```javascript
   if (!rolesAllowed.length || !hasAccess) {
     return NextResponse.redirect('/unauthorized');
   }
   ```

---

## 👥 Roles y Permisos

### Roles Disponibles

1. **`admin`** - Administrador completo
2. **`manager`** - Gestor (acceso limitado)
3. **`superuser`** - Superusuario (acceso total)
4. **`store_operator`** - Operador de almacén (acceso solo a almacén asignado)
5. **`worker`** - Trabajador (producción)

### Configuración de Roles por Ruta

**Archivo**: `/src/configs/roleConfig.js`

```javascript
const roleConfig = {
  '/admin': ['admin', 'manager', 'superuser'],
  '/production': ['admin', 'worker', 'superuser'],
  '/admin/orders': ['admin', 'manager', 'superuser'],
  '/warehouse': ['store_operator', 'superuser'],
};
```

**Lógica**:

- Se selecciona la ruta más específica que coincida
- El usuario debe tener al menos uno de los roles permitidos
- `superuser` tiene acceso a todas las rutas

### Roles en Navegación

**Archivo**: `/src/configs/navgationConfig.js`

Los elementos de navegación también tienen `allowedRoles`:

```javascript
{
  name: 'Pedidos',
  href: '/admin/orders',
  allowedRoles: ["admin", "manager", "superuser"],
}
```

**Filtrado**: Los elementos se filtran según los roles del usuario.

---

## 🔒 Componentes de Protección

### AdminRouteProtection

**Archivo**: `/src/components/AdminRouteProtection/index.js`

**Funcionalidad**: Protección adicional para rutas admin.

**Características**:

- Redirige `store_operator` a su almacén si intenta acceder a admin
- Muestra loader durante validación
- Se usa en layouts de admin

**Uso**:

```jsx
import AdminRouteProtection from '@/components/AdminRouteProtection';

export default function AdminLayout({ children }) {
  return <AdminRouteProtection>{children}</AdminRouteProtection>;
}
```

### ProtectedRoute

**Archivo**: `/src/components/ProtectedRoute/index.js`

**Funcionalidad**: Protección genérica con roles permitidos.

**Props**:

```javascript
<ProtectedRoute allowedRoles={['admin', 'manager']}>{children}</ProtectedRoute>
```

**Características**:

- Valida sesión con `useSession`
- Redirige a `/unauthorized` si no tiene rol permitido
- Redirige a `/login` si no está autenticado
- Muestra loader durante validación

**Limitación**: Este componente parece no usarse mucho, la protección principal está en el middleware.

---

## 🚪 Flujo de Login

### LoginPage

**Archivo**: `/src/components/LoginPage/index.js`

**Características**:

- Validación de tenant activo y detección de subdominio para branding
- Modo demo (subdominio "test"): solo se rellena el email
- **Sin contraseña:** solo campo email y un botón **"Acceder"** que llama a `authService.requestAccess(email)` → `POST /v2/auth/request-access`. Tras enviar, se muestra mensaje y campo para el código de 6 dígitos; al verificar el código, `authService.verifyOtp(email, code)` y después `signIn("credentials", { accessToken, user })` y redirección
- Redirección tras OTP exitoso: operario → `/warehouse/{assignedStoreId}`, resto → parámetro `from` (validado) o `/admin/home`

### Ruta `/auth/verify`

**Archivo**: `/src/app/auth/verify/page.js`

- El enlace del correo (magic link) apunta al frontend: `.../auth/verify?token=xxx`
- Lee `token`, llama a `authService.verifyMagicLinkToken(token)`, luego `signIn` con el token y user y redirige con la misma lógica que el login
- Si el enlace es inválido o expirado (400) o usuario desactivado (403), muestra mensaje y enlaces para volver o solicitar nuevo enlace

### Endpoints de auth (API v2)

- `POST /v2/auth/request-access` — solicitar acceso: un solo email, el correo incluye enlace + código (body: `{ email }`)
- `POST /v2/auth/magic-link/verify` — canjear token del enlace (body: `{ token }`) → `access_token` y `user`
- `POST /v2/auth/otp/verify` — canjear código (body: `{ email, code }`) → `access_token` y `user`
- `POST /v2/login` — **ya no se usa** para acceso (la API devuelve 400)

### Throttle (429)

Si se supera el límite de peticiones por IP, la API devuelve **429**. El frontend muestra: "Demasiados intentos; espera un momento antes de volver a intentar."

---

## 🚪 Flujo de Logout

### Implementación

**Desde Sidebar**:

```javascript
const handleLogout = async () => {
  try {
    await signOut({ redirect: false });
    window.location.href = '/login';
    toast.success('Sesión cerrada correctamente');
  } catch (err) {
    toast.error(err.message || 'Error al cerrar sesión');
  }
};
```

**Desde Navbar**:

```javascript
const handleLogout = async () => {
  try {
    await signOut({ redirect: false });
    window.location.href = '/login';
    toast.success('Sesión cerrada correctamente');
  } catch (err) {
    toast.error(err.message || 'Error al cerrar sesión');
  }
};
```

**Evento de NextAuth**:

```javascript
events: {
  async signOut(message) {
    // Lógica adicional si es necesaria
  },
}
```

---

## ⚠️ Manejo de Errores de Autenticación

### AuthErrorInterceptor

**Archivo**: `/src/components/Utilities/AuthErrorInterceptor.js`

**Funcionalidad**: Intercepta errores de autenticación globalmente y redirige al login.

**Implementación**:

1. **Intercepta `window.fetch`**

   ```javascript
   const originalFetch = window.fetch;
   window.fetch = async (...args) => {
     const response = await originalFetch(...args);
     if (isAuthStatusCode(response.status)) {
       // Redirigir al login
     }
   };
   ```

2. **Intercepta errores globales**

   ```javascript
   window.addEventListener('error', handleGlobalError);
   window.addEventListener('unhandledrejection', handleGlobalError);
   ```

3. **Redirección con delay**
   ```javascript
   toast.error('Sesión expirada. Redirigiendo al login...');
   setTimeout(async () => {
     await signOut({ redirect: false });
     window.location.href = buildLoginUrl(currentPath);
   }, AUTH_ERROR_CONFIG.REDIRECT_DELAY); // 1500ms
   ```

### authConfig

**Archivo**: `/src/configs/authConfig.js`

**Funcionalidades**:

- `isAuthError(error)` - Detecta si un error es de autenticación
- `isAuthStatusCode(status)` - Detecta si un status code es 401 o 403
- `buildLoginUrl(currentPath)` - Construye URL de login con parámetro `from`

**Mensajes de error detectados**:

```javascript
AUTH_ERROR_MESSAGES: [
  'No autenticado',
  'Unauthorized',
  '401',
  'Token',
  'Sesión expirada',
  'Session expired',
  'Invalid token',
  'Token expired',
];
```

---

## 🏪 Operador de Almacén (store_operator)

### Características Especiales

1. **Acceso limitado**: Solo a su almacén asignado
2. **Redirección automática**: Si intenta acceder a `/admin`, se redirige a `/warehouse/{assignedStoreId}`
3. **Validación de almacén**: Solo puede acceder al almacén asignado en su token

### Ruta Especial

**Archivo**: `/src/app/warehouse/[storeId]/page.js`

**Validaciones**:

```javascript
// 1. Validar autenticación
if (status === 'unauthenticated') {
  router.push('/');
  return;
}

// 2. Validar rol (rol único string)
if (session.user.role !== 'operario' && session.user.role !== 'administrador') {
  router.push('/unauthorized');
  return;
}

// 3. Validar que sea su almacén asignado (operario)
if (session.user.role === 'operario' && session.user.assignedStoreId !== parseInt(storeId)) {
  // Redirigir a almacén correcto o mostrar error
}
```

### Layout Especial

**Componente**: `WarehouseOperatorLayout`

**Características**:

- Sin sidebar de navegación
- Header con logo de la empresa colaboradora
- Mensaje de colaboración
- Solo muestra el componente `Store`

---

## 🚫 Página de No Autorizado

**Archivo**: `/src/app/unauthorized/page.js`

**Funcionalidad**: Página mostrada cuando el usuario no tiene permisos.

**Características**:

- Mensaje de error 403
- Botón para volver al inicio
- Logo de la aplicación

---

## 🔄 Uso de Sesión en Componentes

### useSession Hook

**Uso común**:

```javascript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <Loader />;
  if (status === 'unauthenticated') return <LoginPrompt />;

  const token = session?.user?.accessToken;
  const role = session?.user?.role;

  // Usar token para llamadas API
}
```

### getSession (Server Side)

**Uso en servicios**:

```javascript
import { getSession } from 'next-auth/react';

export async function myService() {
  const session = await getSession();
  const token = session?.user?.accessToken;

  // Usar token para llamadas API
}
```

---

## 🔐 Variables de Entorno

### Requeridas

- `NEXTAUTH_SECRET` - Secreto para firmar tokens JWT
- `NEXT_PUBLIC_API_BASE_URL` - URL base de la API v2

### Uso

```javascript
// En NextAuth
secret: process.env.NEXTAUTH_SECRET;

// En middleware
const verifyResponse = await fetchWithTenant(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/me`
  // ...
);
```

---

## 📊 Resumen de Flujos

### Login

1. Usuario accede a `/`
2. Ingresa credenciales
3. NextAuth valida con API v2
4. Se crea token JWT con datos del usuario
5. Se redirige a ruta original o `/admin/home`

### Protección de Ruta

1. Middleware intercepta request
2. Valida token JWT
3. Verifica expiración
4. Valida token con backend (`/api/v2/me`)
5. Verifica roles según `roleConfig`
6. Permite o redirige

### Logout

1. Usuario hace click en "Cerrar sesión"
2. Se llama `signOut({ redirect: false })`
3. Se redirige a `/login`
4. Se muestra toast de confirmación

### Error de Autenticación

1. `AuthErrorInterceptor` detecta error 401/403
2. Muestra toast de sesión expirada
3. Espera 1.5 segundos
4. Cierra sesión
5. Redirige a login con parámetro `from`

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Rate Limiting en Memoria

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 7-9
- **Problema**: Rate limiting se resetea al reiniciar el servidor
- **Impacto**: No es persistente entre reinicios
- **Recomendación**: Usar Redis o base de datos para rate limiting persistente

### 2. Validación de Token con Backend en Cada Request

- **Archivo**: `/src/middleware.js`
- **Línea**: 43-56
- **Problema**: Hace fetch a `/api/v2/me` en cada request protegida
- **Impacto**: Latencia adicional, carga en el backend
- **Recomendación**: Cachear validación o validar solo periódicamente

### 3. Falta de Refresh Token

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Problema**: No hay mecanismo de refresh token
- **Impacto**: Usuario debe hacer login nuevamente cuando expira
- **Recomendación**: Implementar refresh token para mejor UX

### 4. Token Expiration Hardcodeado

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 67
- **Problema**: `maxAge: 60 * 60 * 24 * 7` (7 días) está hardcodeado
- **Impacto**: No se puede configurar sin cambiar código
- **Recomendación**: Mover a variable de entorno

### 5. Validación de Token Expirado Incompleta

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 89
- **Problema**: `tokenIsExpired` siempre es `false`, no valida realmente
- **Impacto**: Tokens expirados pueden seguir siendo válidos
- **Recomendación**: Implementar validación real de expiración

### 6. AuthErrorInterceptor Modifica window.fetch Globalmente

- **Archivo**: `/src/components/Utilities/AuthErrorInterceptor.js`
- **Línea**: 12-56
- **Problema**: Modifica `window.fetch` globalmente, puede causar conflictos
- **Impacto**: Puede interferir con otras librerías
- **Recomendación**: Usar interceptor más específico o fetch wrapper

### 7. Falta de Validación de Roles en Algunos Componentes

- **Archivo**: Múltiples componentes
- **Problema**: Algunos componentes no validan roles antes de mostrar acciones
- **Impacto**: Usuarios pueden ver botones que no pueden usar
- **Recomendación**: Añadir validación de permisos en componentes críticos

### 8. Store Operator sin Validación de Almacén en Backend

- **Archivo**: `/src/app/warehouse/[storeId]/page.js`
- **Problema**: Validación solo en frontend, no en backend
- **Impacto**: Posible acceso no autorizado si se manipula el frontend
- **Recomendación**: Validar en backend también

### 9. Falta de Logout en Todas las Páginas

- **Archivo**: Múltiples componentes
- **Problema**: No todas las páginas tienen opción de logout visible
- **Impacto**: Usuario puede quedar atrapado si hay problemas
- **Recomendación**: Añadir opción de logout en layout principal

### 10. Parámetro "from" No Validado

- **Archivo**: `/src/components/LoginPage/index.js`
- **Línea**: 65
- **Problema**: Parámetro `from` de URL no se valida antes de redirigir
- **Impacto**: Posible redirección a URL maliciosa
- **Recomendación**: Validar que `from` sea una ruta válida de la aplicación

### 11. Rate Limiting Sin Limpieza

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 36
- **Problema**: Solo limpia intentos viejos cuando hay nuevo intento
- **Impacto**: Memoria puede crecer si hay muchas IPs
- **Recomendación**: Añadir limpieza periódica o usar TTL

### 12. Falta de CSRF Protection

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Problema**: No hay protección explícita contra CSRF
- **Impacto**: Vulnerable a ataques CSRF
- **Recomendación**: NextAuth tiene protección por defecto, pero documentar y verificar

### 13. Secret No Validado al Inicio

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 116
- **Problema**: `NEXTAUTH_SECRET` puede estar undefined sin error claro
- **Impacto**: Aplicación puede fallar silenciosamente
- **Recomendación**: Validar que exista al inicio de la aplicación

### 14. Token en Session No Encriptado

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 98-104
- **Problema**: Token de acceso se almacena directamente en session
- **Impacto**: Si session se compromete, token también
- **Recomendación**: Considerar encriptar o almacenar de forma más segura

### 15. Falta de Logging de Intentos de Acceso No Autorizados

- **Archivo**: `/src/middleware.js`
- **Problema**: No se registran intentos de acceso no autorizados
- **Impacto**: Difícil detectar intentos de acceso maliciosos
- **Recomendación**: Añadir logging de intentos fallidos
