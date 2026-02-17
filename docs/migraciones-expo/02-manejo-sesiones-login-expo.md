# Guía Completa: Manejo de Sesiones y Página de Login para Expo/React Native

**Fecha de Creación**: 2024  
**Versión del Documento**: 1.0  
**Proyecto Origen**: brisapp-nextjs (Next.js + NextAuth.js)  
**Proyecto Destino**: Expo/React Native

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema de Autenticación](#arquitectura-del-sistema-de-autenticación)
3. [Página de Login (LoginPage)](#página-de-login-loginpage)
4. [Configuración de NextAuth](#configuración-de-nextauth)
5. [Manejo de Sesiones (JWT)](#manejo-de-sesiones-jwt)
6. [Middleware de Protección](#middleware-de-protección)
7. [Interceptor de Errores de Autenticación](#interceptor-de-errores-de-autenticación)
8. [Flujos de Autenticación](#flujos-de-autenticación)
9. [Estilos y Componentes UI](#estilos-y-componentes-ui)
10. [Consideraciones y Diferencias Web vs Native](#consideraciones-y-diferencias-web-vs-native)
11. [Requisitos de Implementación](#requisitos-de-implementación)

---

## 📖 Resumen Ejecutivo

El sistema de autenticación de la aplicación utiliza **NextAuth.js 4.24.13** para gestionar sesiones mediante **JWT (JSON Web Tokens)**. Proporciona:

- **Página de login** con validación de tenant, modo demo y branding dinámico
- **Autenticación por credenciales** (email/password)
- **Sesiones JWT** con duración de 7 días
- **Rate limiting** por IP (5 intentos en 10 minutos)
- **Protección de rutas** mediante middleware
- **Intercepción de errores** de autenticación (401/403)
- **Soporte multi-tenant** basado en subdominios
- **Validación de tenant activo** antes de permitir login

### Características Técnicas

- **Framework de Autenticación**: NextAuth.js 4.24.13
- **Estrategia de Sesión**: JWT (JSON Web Token)
- **Duración de Sesión**: 7 días (604,800 segundos)
- **Actualización de Token**: Cada 24 horas
- **Rate Limiting**: 5 intentos por IP en 10 minutos
- **UI Library**: shadcn/ui
- **Notificaciones**: react-hot-toast
- **Manejo de Errores**: Interceptor global de fetch

---

## 🏗️ Arquitectura del Sistema de Autenticación

### Estructura de Archivos

```
src/
├── components/
│   ├── LoginPage/
│   │   └── index.js              # Componente de login (228 líneas)
│   ├── Utilities/
│   │   ├── RotatingText/         # Texto rotativo animado
│   │   └── Loader/               # Componente de carga
│   └── ui/
│       ├── button.jsx            # Botón
│       ├── input.jsx             # Input
│       ├── card.jsx              # Card
│       ├── label.jsx             # Label
│       └── alert.jsx             # Alert
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.js      # Configuración NextAuth (119 líneas)
│   ├── page.js                   # Página principal (HomePage) (72 líneas)
│   └── globals.css               # Estilos globales (login-background)
├── middleware.js                 # Middleware de protección (156 líneas)
├── configs/
│   ├── authConfig.js             # Configuración de errores auth
│   ├── roleConfig.js             # Configuración de roles por ruta
│   └── config.js                 # API_URL_V2
└── components/
    └── Utilities/
        └── AuthErrorInterceptor.js  # Interceptor de errores (91 líneas)
```

### Flujo de Autenticación General

```
Usuario accede a aplicación
  │
  ├── HomePage (src/app/page.js)
  │   ├── Detecta subdominio
  │   ├── Verifica sesión (useSession)
  │   └── Renderiza LoginPage o redirige
  │
  ├── LoginPage (src/components/LoginPage/index.js)
  │   ├── Valida tenant activo
  │   ├── Usuario ingresa credenciales
  │   └── Llama signIn("credentials")
  │
  ├── NextAuth API Route (src/app/api/auth/[...nextauth]/route.js)
  │   ├── Rate limiting
  │   ├── Llama API backend (POST /api/v2/login)
  │   ├── Crea token JWT
  │   └── Retorna sesión
  │
  ├── Middleware (src/middleware.js)
  │   ├── Valida token JWT
  │   ├── Verifica expiración
  │   ├── Valida con backend (/api/v2/me)
  │   └── Verifica roles según ruta
  │
  └── AuthErrorInterceptor (src/components/Utilities/AuthErrorInterceptor.js)
      ├── Intercepta errores 401/403
      ├── Cierra sesión
      └── Redirige a login
```

---

## 🚪 Página de Login (LoginPage)

**Archivo**: `src/components/LoginPage/index.js`

### Responsabilidades

- Renderizar formulario de login
- Validar tenant activo antes de permitir login
- Detectar subdominio para branding dinámico
- Soporte para modo demo (subdominio "test")
- Toggle para mostrar/ocultar contraseña
- Manejo de estado de carga
- Redirección después de login exitoso
- Mostrar alerta si tenant está inactivo

### Estado del Componente

```javascript
{
  email: string,                  // Email del usuario
  password: string,               // Contraseña
  loading: boolean,               // Estado de carga durante login
  tenantActive: boolean,          // Si el tenant está activo
  brandingImageUrl: string,       // URL de imagen de branding
  tenantChecked: boolean,         // Si ya se verificó el tenant
  isDemo: boolean,                // Si está en modo demo
  showPassword: boolean           // Si mostrar u ocultar contraseña
}
```

### Props

Ninguno (componente autónomo)

### Hooks Utilizados

- `useState()` - Estado del componente
- `useEffect()` - Efectos al montar (validar tenant, modo demo)

### Funcionalidades Clave

#### 1. Detección de Subdominio y Modo Demo

**Lógica**:
```javascript
const hostname = window.location.hostname;
const subdomain = hostname.split(".")[0];

// Modo demo si subdominio es "test"
if (subdomain === "test") {
  setEmail("admin@lapesquerapp.es");
  setPassword("admin");
  setIsDemo(true);
}
```

**Comportamiento**:
- Extrae subdominio del hostname
- Si subdominio es "test": auto-rellena credenciales y marca como demo
- Muestra badge "MODO DEMO" en la esquina superior derecha del card

#### 2. Validación de Tenant Activo

**Endpoint**: `${API_URL_V2}public/tenant/${subdomain}`

**Flujo**:
1. Hace fetch al endpoint público de tenant
2. Verifica si `data.active === false` o si hay error
3. Si tenant inactivo: muestra Alert y deshabilita formulario
4. Si tenant activo: permite login

**Respuesta Esperada**:
```javascript
{
  active: boolean,
  // ... otros datos del tenant
}
```

**Estados**:
- `tenantChecked: false` → Muestra Loader
- `tenantActive: false` → Muestra Alert de error
- `tenantActive: true` → Muestra formulario habilitado

#### 3. Branding Dinámico

**Lógica**:
```javascript
const brandingImagePath = `/images/tenants/${subdomain}/image.png`;
setBrandingImageUrl(brandingImagePath);
```

**Comportamiento**:
- Intenta cargar imagen desde `/images/tenants/{subdomain}/image.png`
- Si falla, usa fallback: `/images/landing.png`
- Imagen se muestra en panel izquierdo del card

#### 4. Proceso de Login

**Función**: `handleLogin(e)`

**Flujo**:
1. Previene submit por defecto
2. Valida tenant activo (si no, muestra error)
3. Activa loading
4. Obtiene parámetro `from` de URL (ruta de redirección)
5. Llama `signIn("credentials", { email, password })`
6. Si éxito: muestra toast y redirige
7. Si error: limpia campos, muestra toast de error
8. Desactiva loading

**Parámetros de signIn**:
```javascript
{
  redirect: false,    // No redirigir automáticamente
  email: string,      // Email del usuario
  password: string    // Contraseña
}
```

**Manejo de Errores**:
- `CredentialsSignin` → "Datos de acceso incorrectos"
- Otros errores → Mensaje del error o "Error al iniciar sesión"

**Redirección**:
```javascript
const params = new URLSearchParams(window.location.search);
const redirectTo = params.get("from") || "/admin/home";
window.location.href = redirectTo;
```

#### 5. Toggle de Contraseña

**Estado**: `showPassword`

**Comportamiento**:
- Botón con icono EyeIcon/EyeOffIcon
- Cambia tipo de input entre "password" y "text"
- Posicionado absolutamente a la derecha del input

### Estructura del Render

```
<div className="login-background">
  <div className="container">
    {!tenantActive && <Alert />}
    <Card>
      {isDemo && <Badge MODO DEMO />}
      <div className="image-panel">
        <Image src={brandingImageUrl} />
      </div>
      <div className="form-panel">
        <form>
          <h2>La PesquerApp</h2>
          <RotatingText />
          <Input email />
          <Input password con toggle />
          <Button submit />
          <Link contacto />
        </form>
      </div>
    </Card>
  </div>
</div>
```

### Estilos Clave

**Container principal**:
- `login-background`: Background con imagen fija (ver globals.css)
- `flex min-h-screen items-center justify-center`
- `bg-white dark:bg-black`

**Card**:
- `flex sm:flex-row flex-col`
- `w-full h-full p-2`
- Responsive: column en mobile, row en desktop

**Panel de imagen**:
- `w-full max-w-[500px]`
- `min-h-[240px]`
- `rounded-lg overflow-hidden`

**Panel de formulario**:
- `flex flex-col items-center justify-center`
- `p-8 lg:p-12`

---

## ⚙️ Configuración de NextAuth

**Archivo**: `src/app/api/auth/[...nextauth]/route.js`

### Provider: CredentialsProvider

**Configuración**:
```javascript
CredentialsProvider({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'text' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials, req) {
    // ... lógica de autenticación
  }
})
```

### Función authorize

**Responsabilidades**:
1. Rate limiting por IP
2. Llamar API backend para autenticar
3. Retornar datos del usuario con accessToken

**Flujo**:
```javascript
async authorize(credentials, req) {
  // 1. Rate limiting
  const ip = getClientIp(req);
  // Verificar intentos y bloquear si excede
  
  // 2. Llamar API
  const res = await fetchWithTenant(`${API_URL_V2}login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  // 3. Procesar respuesta
  const data = await res.json();
  
  if (res.ok && data.access_token) {
    return { ...data.user, accessToken: data.access_token };
  }
  
  throw new Error(data.message || 'Error al iniciar sesión');
}
```

**Respuesta Esperada del Backend**:
```javascript
{
  access_token: string,           // Token JWT del backend
  user: {
    id: number,
    email: string,
    name: string,
    role: string | string[],      // Rol(es) del usuario
    assignedStoreId?: number,     // ID de almacén (store_operator)
    companyName?: string,         // Nombre de empresa
    companyLogoUrl?: string,      // URL del logo
    // ... otros campos
  }
}
```

**Valor Retornado**:
```javascript
{
  ...data.user,                   // Todos los campos del usuario
  accessToken: data.access_token  // Token de acceso
}
```

### Rate Limiting

**Configuración**:
```javascript
const MAX_ATTEMPTS = 5;                    // Máximo de intentos
const WINDOW_MS = 10 * 60 * 1000;         // Ventana de tiempo (10 minutos)
const loginAttempts = {};                 // Almacenamiento en memoria
```

**Lógica**:
1. Obtener IP del cliente
2. Filtrar intentos antiguos (mayores a WINDOW_MS)
3. Verificar si excede MAX_ATTEMPTS
4. Si excede: lanzar error "Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde."
5. Si no excede: agregar timestamp al array

**Limitación**: Rate limiting es en memoria, se resetea al reiniciar el servidor.

**Función getClientIp**:
```javascript
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
```

### Configuración de Sesión

```javascript
session: {
  strategy: 'jwt',                    // Usar JWT en lugar de base de datos
  maxAge: 60 * 60 * 24 * 7,          // 7 días (604,800 segundos)
  updateAge: 60 * 60 * 24,           // Actualizar token cada 24 horas
}
```

**Explicación**:
- `strategy: 'jwt'`: Las sesiones se almacenan en el token JWT (no en base de datos)
- `maxAge`: Duración máxima de la sesión
- `updateAge`: Frecuencia con la que se actualiza el token

### Callbacks

#### Callback JWT

**Función**: `async jwt({ token, user })`

**Responsabilidades**:
- Agregar datos del usuario al token cuando inicia sesión
- Validar expiración del token (actualmente deshabilitado)

**Lógica**:
```javascript
async jwt({ token, user }) {
  // Si el usuario está presente (inicio de sesión)
  if (user) {
    token.accessToken = user.accessToken;
    token.role = user.role;
    
    // Campos opcionales
    if (user.assignedStoreId) token.assignedStoreId = user.assignedStoreId;
    if (user.companyName) token.companyName = user.companyName;
    if (user.companyLogoUrl) token.companyLogoUrl = user.companyLogoUrl;
  }
  
  // Validar expiración (actualmente no implementado)
  const tokenIsExpired = false;
  if (tokenIsExpired) return null;
  
  return token;
}
```

**Estructura del Token JWT**:
```javascript
{
  accessToken: string,              // Token del backend
  role: string | string[],          // Rol(es)
  assignedStoreId?: number,         // ID de almacén
  companyName?: string,             // Nombre de empresa
  companyLogoUrl?: string,          // URL del logo
  exp: number,                      // Expiración (timestamp)
  iat: number,                      // Emitido en (timestamp)
  // ... otros campos estándar de JWT
}
```

#### Callback Session

**Función**: `async session({ session, token })`

**Responsabilidades**:
- Copiar datos del token a la sesión
- Validar que el token exista

**Lógica**:
```javascript
async session({ session, token }) {
  if (!token) return null;          // Si no hay token, cerrar sesión
  session.user = token;             // Copiar datos del token
  return session;
}
```

**Estructura de Session**:
```javascript
{
  user: {
    accessToken: string,
    role: string | string[],
    assignedStoreId?: number,
    companyName?: string,
    companyLogoUrl?: string,
    exp: number,
    // ... otros campos
  },
  expires: string                   // Fecha de expiración (ISO string)
}
```

### Events

```javascript
events: {
  async signOut(message) {
    // Se ejecuta cuando el usuario cierra sesión
    // Actualmente solo tiene console.log comentado
  }
}
```

### Páginas Personalizadas

```javascript
pages: {
  signIn: '/',      // Página de login personalizada
  error: '/'        // Redirigir a login en caso de error
}
```

### Secret

```javascript
secret: process.env.NEXTAUTH_SECRET
```

**Variable de entorno requerida**: `NEXTAUTH_SECRET`

---

## 🔐 Manejo de Sesiones (JWT)

### Estrategia de Sesión

El sistema usa **JWT (JSON Web Token)** para almacenar la sesión del usuario. Los tokens se almacenan en cookies del navegador (manejados automáticamente por NextAuth).

### Duración de Sesión

- **Duración máxima**: 7 días (604,800 segundos)
- **Actualización**: Cada 24 horas
- **Expiración**: Se valida en middleware y callbacks

### Acceso a la Sesión

#### En Cliente (useSession)

```javascript
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();

// status puede ser: 'loading' | 'authenticated' | 'unauthenticated'
// session.user contiene los datos del usuario
// session.user.accessToken contiene el token del backend
// session.user.role contiene el/los rol(es)
```

**Hook useSession**:
- Proporciona sesión reactiva
- Actualiza automáticamente cuando cambia la sesión
- Estado `loading` mientras verifica
- Estado `authenticated` si hay sesión válida
- Estado `unauthenticated` si no hay sesión

#### En Servidor (getSession)

```javascript
import { getSession } from 'next-auth/react';

const session = await getSession();
const token = session?.user?.accessToken;
```

**Limitación**: En componentes servidor de Next.js, se debe usar `getServerSession` en lugar de `getSession`.

### Datos Almacenados en Sesión

**Campos siempre presentes**:
- `accessToken`: Token JWT del backend para llamadas API
- `role`: Rol(es) del usuario (string o array)
- `exp`: Timestamp de expiración
- `iat`: Timestamp de emisión

**Campos opcionales**:
- `assignedStoreId`: ID de almacén asignado (para `store_operator`)
- `companyName`: Nombre de la empresa
- `companyLogoUrl`: URL del logo de la empresa

### Validación de Sesión

El middleware y los callbacks validan:
1. **Existencia del token**: Si no existe, redirige a login
2. **Expiración**: Si `exp` < fecha actual, redirige a login
3. **Validez con backend**: Llama a `/api/v2/me` para verificar que el token siga siendo válido

---

## 🛡️ Middleware de Protección

**Archivo**: `src/middleware.js`

### Responsabilidades

- Interceptar requests a rutas protegidas
- Validar token JWT
- Verificar expiración del token
- Validar token con backend
- Verificar permisos según roles
- Redirigir si no hay acceso

### Rutas Protegidas

**Configuración**:
```javascript
export const config = {
  matcher: [
    '/admin/:path*',
    '/production/:path*',
    '/warehouse/:path*',
  ],
};
```

El middleware solo se ejecuta en estas rutas.

### Flujo del Middleware

```
Request a ruta protegida
  │
  ├── ¿Es archivo estático? → Permitir
  │
  ├── Obtener token JWT de cookies
  │   ├── ¿No hay token? → Redirigir a login
  │
  ├── Verificar expiración (token.exp)
  │   ├── ¿Expirado? → Redirigir a login
  │
  ├── Validar token con backend (GET /api/v2/me)
  │   ├── ¿No válido? → Redirigir a login
  │
  ├── Obtener ruta más específica de roleConfig
  │
  ├── Verificar roles permitidos
  │   ├── ¿No tiene acceso? → Redirigir a /unauthorized
  │   ├── ¿Es store_operator en /admin? → Redirigir a /warehouse/{id}
  │
  └── Permitir acceso
```

### Validación de Token

**Función getToken**:
```javascript
import { getToken } from "next-auth/jwt";

token = await getToken({ 
  req: requestForToken,
  secret: process.env.NEXTAUTH_SECRET 
});
```

**Wrapper de cookies** (para Next.js 16):
```javascript
const requestForToken = {
  url: req.url,
  headers: req.headers,
  cookies: {
    get: (name) => {
      const cookie = req.cookies.get(name);
      return cookie ? { name: cookie.name, value: cookie.value } : undefined;
    },
    getAll: () => {
      return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
    },
  },
};
```

### Verificación de Expiración

```javascript
const tokenExpiration = token?.exp * 1000; // Convertir a milisegundos
if (Date.now() > tokenExpiration) {
  // Redirigir a login
}
```

### Validación con Backend

**Endpoint**: `GET /api/v2/me`

**Headers**:
```javascript
{
  Authorization: `Bearer ${token.accessToken}`
}
```

**Comportamiento**:
- Si respuesta no es OK (status !== 200): Token inválido o sesión cancelada
- Redirige a login con parámetro `from`

### Verificación de Roles

**Configuración**: `src/configs/roleConfig.js`

**Lógica**:
1. Encuentra la ruta más específica que coincida con `pathname`
2. Obtiene roles permitidos para esa ruta
3. Normaliza roles del usuario a array
4. Verifica si algún rol del usuario está en roles permitidos

**Código**:
```javascript
const matchingRoutes = Object.keys(roleConfig).filter((route) =>
  pathname.startsWith(route)
);
const matchingRoute = matchingRoutes.sort((a, b) => b.length - a.length)[0];
const rolesAllowed = matchingRoute ? roleConfig[matchingRoute] : [];

const userRoles = Array.isArray(token.role) ? token.role : [token.role];
const hasAccess = userRoles.some((role) => rolesAllowed.includes(role));
```

**Caso Especial - store_operator**:
Si un `store_operator` intenta acceder a `/admin` sin permisos:
- Redirige a `/warehouse/{assignedStoreId}` si tiene `assignedStoreId`
- Redirige a `/unauthorized` si no tiene `assignedStoreId`

### Redirección a Login

**URL construida**:
```javascript
const loginUrl = new URL("/", req.url);
loginUrl.searchParams.set("from", pathname);
return NextResponse.redirect(loginUrl);
```

**Parámetro `from`**: Se usa para redirigir al usuario a la página original después de login.

---

## 🔄 Interceptor de Errores de Autenticación

**Archivo**: `src/components/Utilities/AuthErrorInterceptor.js`

### Responsabilidades

- Interceptar errores 401/403 en fetch
- Detectar errores de autenticación globales
- Cerrar sesión automáticamente
- Redirigir a login con parámetro `from`
- Mostrar notificación al usuario

### Funcionamiento

#### Interceptación de Fetch

**Lógica**:
```javascript
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    
    // Verificar status code
    if (isAuthStatusCode(response.status)) {
      // Manejar error de autenticación
    }
    
    return response;
  } catch (error) {
    // Verificar si es error de autenticación
    if (isAuthError(error)) {
      // Manejar error
    }
    throw error;
  }
};
```

**Cleanup**: Restaura `window.fetch` original cuando el componente se desmonta.

#### Interceptación de Errores Globales

**Event Listeners**:
```javascript
window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleGlobalError);
```

**Función handleGlobalError**:
```javascript
const handleGlobalError = (event) => {
  const error = event.error || event.reason;
  if (isAuthError(error)) {
    // Manejar error de autenticación
  }
};
```

### Manejo de Error de Autenticación

**Flujo**:
1. Detectar error 401/403 o error de autenticación
2. Mostrar toast: "Sesión expirada. Redirigiendo al login..."
3. Esperar delay (1500ms)
4. Cerrar sesión: `signOut({ redirect: false })`
5. Construir URL de login con parámetro `from`
6. Redirigir: `window.location.href = loginUrl`

**Configuración**:
```javascript
// src/configs/authConfig.js
export const AUTH_ERROR_CONFIG = {
  REDIRECT_DELAY: 1500,           // Delay antes de redirigir (ms)
  DEFAULT_LOGIN_URL: '/',         // URL de login
  FROM_PARAM: 'from'              // Parámetro para guardar ruta actual
};
```

### Funciones de Utilidad

**isAuthStatusCode**:
```javascript
export function isAuthStatusCode(status) {
  return status === 401 || status === 403;
}
```

**isAuthError**:
```javascript
export function isAuthError(error) {
  if (!error || !error.message) return false;
  
  const message = error.message.toLowerCase();
  return AUTH_ERROR_CONFIG.AUTH_ERROR_MESSAGES.some(
    authMessage => message.includes(authMessage.toLowerCase())
  );
}
```

**buildLoginUrl**:
```javascript
export function buildLoginUrl(currentPath = '') {
  const url = new URL(AUTH_ERROR_CONFIG.DEFAULT_LOGIN_URL, window.location.origin);
  if (currentPath) {
    url.searchParams.set(AUTH_ERROR_CONFIG.FROM_PARAM, currentPath);
  }
  return url.toString();
}
```

---

## 🔄 Flujos de Autenticación

### Flujo de Login Completo

```
1. Usuario accede a "/"
   │
   ├── HomePage detecta subdominio
   ├── Verifica sesión (useSession)
   ├── Si autenticado: redirige según rol
   └── Si no autenticado: muestra LoginPage
   │
2. LoginPage
   │
   ├── useEffect al montar:
   │   ├── Detecta subdominio
   │   ├── Si subdominio "test": modo demo
   │   ├── Carga imagen de branding
   │   └── Valida tenant activo (fetch)
   │
   ├── Usuario ingresa credenciales
   │
   ├── handleLogin:
   │   ├── Valida tenant activo
   │   ├── Obtiene parámetro "from" de URL
   │   ├── Llama signIn("credentials")
   │   ├── Si éxito: toast + redirige
   │   └── Si error: limpia campos + toast
   │
3. NextAuth API Route
   │
   ├── Rate limiting (verifica IP)
   │
   ├── authorize:
   │   ├── POST /api/v2/login (con credenciales)
   │   ├── Recibe { access_token, user }
   │   └── Retorna { ...user, accessToken }
   │
   ├── Callback JWT:
   │   └── Agrega datos al token
   │
   └── Callback Session:
       └── Copia token a session
   │
4. Redirección
   │
   └── window.location.href = redirectTo (desde parámetro "from" o "/admin/home")
```

### Flujo de Protección de Ruta

```
1. Usuario navega a ruta protegida (ej: /admin/products)
   │
2. Middleware intercepta request
   │
   ├── Obtiene token JWT de cookies
   │   └── Si no hay: redirige a "/?from=/admin/products"
   │
   ├── Verifica expiración
   │   └── Si expirado: redirige a "/?from=/admin/products"
   │
   ├── Valida con backend (GET /api/v2/me)
   │   └── Si inválido: redirige a "/?from=/admin/products"
   │
   ├── Obtiene roles permitidos (roleConfig)
   │
   ├── Verifica acceso
   │   ├── Si no tiene acceso: redirige a "/unauthorized"
   │   ├── Si es store_operator en /admin: redirige a /warehouse/{id}
   │   └── Si tiene acceso: permite request
   │
3. Usuario accede a la página
```

### Flujo de Error de Autenticación

```
1. Usuario está autenticado y hace request a API
   │
2. API retorna error 401/403
   │
3. AuthErrorInterceptor detecta error
   │
   ├── Muestra toast: "Sesión expirada. Redirigiendo al login..."
   │
   ├── Espera 1500ms
   │
   ├── signOut({ redirect: false })
   │
   ├── Construye URL: "/?from={currentPath}"
   │
   └── window.location.href = loginUrl
   │
4. Usuario ve LoginPage
```

### Flujo de Logout

```
1. Usuario hace click en "Cerrar Sesión"
   │
2. handleLogout (en Sidebar o Navbar)
   │
   ├── signOut({ redirect: false })
   │
   ├── window.location.href = '/'
   │
   ├── Toast: "Sesión cerrada correctamente"
   │
   └── Event signOut de NextAuth se ejecuta
   │
3. Usuario ve LoginPage
```

---

## 🎨 Estilos y Componentes UI

### Estilos del Login

**Clase `login-background`** (globals.css):

```css
.login-background {
  position: relative;
  z-index: 0;
}

.login-background::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/images/background-light-v2.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  opacity: 0.2;
  z-index: -1;
}

.dark .login-background::before {
  background-image: url('/images/background-dark.png');
  opacity: 0.15;
}
```

**Comportamiento**:
- Background con imagen fija
- Imagen diferente para tema claro/oscuro
- Opacidad reducida (0.2 claro, 0.15 oscuro)
- Posicionamiento fixed para efecto parallax

### Componentes UI Utilizados

#### Card

**Componente**: `src/components/ui/card.jsx`

**Uso**:
```javascript
<Card className="relative flex sm:flex-row flex-col w-full h-full p-2 mt-4">
  {/* Contenido */}
</Card>
```

**Estilos**:
- `rounded-xl border bg-card text-card-foreground shadow`
- Responsive: `flex-col` en mobile, `flex-row` en desktop

#### Input

**Componente**: `src/components/ui/input.jsx`

**Estilos**:
- `h-9 rounded-md border border-input`
- `px-3 py-1 text-base md:text-sm`
- `focus-visible:ring-1 focus-visible:ring-ring`

#### Label

**Componente**: `src/components/ui/label.jsx`

**Estilos**:
- `text-sm font-medium leading-none`

#### Button

**Componente**: `src/components/ui/button.jsx`

**Estados**:
- Normal: Estilos por defecto
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: Muestra "Entrando..." en lugar de "Login"

#### Alert

**Componente**: `src/components/ui/alert.jsx`

**Variante**: `destructive`

**Uso**:
```javascript
<Alert variant="destructive">
  <AlertCircleIcon />
  <AlertTitle>Cuentas deshabilitadas para esta empresa</AlertTitle>
  <AlertDescription>
    {/* Descripción */}
  </AlertDescription>
</Alert>
```

### Componente RotatingText

**Archivo**: `src/components/Utilities/RotatingText/index.js`

**Props utilizadas**:
```javascript
<RotatingText
  texts={["al día.", "segura.", "eficiente.", "organizada."]}
  mainClassName="text-xl text-primary font-medium"
  staggerFrom="last"
  initial={{ y: "100%" }}
  animate={{ y: 0 }}
  exit={{ y: "-120%" }}
  staggerDuration={0.025}
  splitLevelClassName="overflow-hidden"
  transition={{ type: "spring", damping: 30, stiffness: 400 }}
  rotationInterval={6000}
/>
```

**Comportamiento**:
- Rotación automática de textos cada 6 segundos
- Animación con Framer Motion
- Efecto de entrada/salida tipo spring
- Textos: "al día.", "segura.", "eficiente.", "organizada."

### Imagen de Branding

**Ruta**: `/images/tenants/{subdomain}/image.png`

**Fallback**: `/images/landing.png`

**Componente Next.js Image**:
- `fill`: Imagen ocupa todo el contenedor
- `object-cover`: Mantiene proporción, recorta si es necesario
- `priority`: Carga prioritaria
- `onError`: Cambia a fallback si falla

---

## ⚠️ Consideraciones y Diferencias Web vs Native

### 1. Gestión de Sesiones

**Web (NextAuth.js)**:
- Sesiones almacenadas en cookies del navegador
- Manejo automático de cookies por NextAuth
- Refresh automático de tokens
- Persistencia entre recargas de página

**Native (Expo)**:
- No hay cookies nativas
- Almacenamiento en AsyncStorage o SecureStore
- Gestión manual de tokens
- Refresh manual de tokens

**Consideraciones**:
- Se debe implementar almacenamiento seguro de tokens (SecureStore recomendado)
- Se debe implementar refresh manual de tokens
- Se debe implementar validación de expiración
- El acceso a la sesión debe ser mediante Context API o estado global

---

### 2. Autenticación

**Web (NextAuth.js)**:
- API route `/api/auth/[...nextauth]` maneja todo
- CredentialsProvider con authorize
- Callbacks JWT y Session automáticos
- Rate limiting en memoria del servidor

**Native (Expo)**:
- No hay API routes
- Autenticación directa con backend
- Gestión manual de tokens
- Rate limiting debe ser en el backend

**Consideraciones**:
- Se debe llamar directamente al endpoint `/api/v2/login`
- Se debe gestionar manualmente el almacenamiento del access_token
- El rate limiting debe manejarse en el backend (no en cliente)
- Se debe implementar refresh token si el backend lo soporta

---

### 3. Protección de Rutas

**Web (Middleware de Next.js)**:
- Middleware intercepta requests en servidor
- Validación automática en cada request
- Redirección automática

**Native (React Navigation)**:
- No hay middleware
- Validación en componentes o hooks
- Navegación condicional

**Consideraciones**:
- Se debe implementar hook o HOC para protección de pantallas
- Validación debe hacerse en cada navegación
- Redirección mediante `navigation.navigate()` o `navigation.replace()`
- Se debe validar token antes de permitir acceso a pantallas protegidas

---

### 4. Interceptación de Errores

**Web (AuthErrorInterceptor)**:
- Intercepta `window.fetch`
- Event listeners globales
- Redirección con `window.location.href`

**Native (Expo)**:
- No hay `window.fetch` global
- Interceptores de axios/fetch personalizados
- Navegación mediante React Navigation

**Consideraciones**:
- Se debe implementar interceptor en la librería HTTP utilizada (axios, fetch wrapper)
- Manejo de errores 401/403 en cada llamada API
- Navegación a pantalla de login mediante `navigation.navigate()`
- Toast/notificaciones nativas en lugar de react-hot-toast

---

### 5. Validación de Tenant

**Web (LoginPage)**:
- Fetch en useEffect al montar
- `window.location.hostname` para subdominio
- Mostrar Alert si inactivo

**Native (Expo)**:
- No hay hostname/subdominio
- Validación mediante configuración o API
- Mostrar Alert/Snackbar nativo

**Consideraciones**:
- En Expo no hay concepto de subdominio en URL
- La validación de tenant debe hacerse mediante API o configuración
- Se puede usar el nombre de la app o configuración para identificar tenant
- El branding debe cargarse desde API o assets estáticos

---

### 6. Modo Demo

**Web (LoginPage)**:
- Detecta subdominio "test"
- Auto-rellena credenciales
- Badge visual "MODO DEMO"

**Native (Expo)**:
- No hay subdominios
- Modo demo mediante configuración o build variant
- Badge visual similar

**Consideraciones**:
- El modo demo debe activarse mediante configuración, build variant o variable de entorno
- Se puede usar `__DEV__` de React Native para desarrollo
- Las credenciales demo deben estar en configuración

---

### 7. Navegación y Redirección

**Web (Next.js)**:
- `window.location.href` para redirección
- `useRouter().push()` para navegación
- Parámetros en URL query string

**Native (React Navigation)**:
- `navigation.navigate()` o `navigation.replace()`
- Parámetros pasados como objeto
- Stack navigation para flujo login → app

**Consideraciones**:
- Parámetro `from` debe pasarse como parámetro de navegación, no query string
- Redirección después de login debe usar `navigation.replace()` para evitar volver atrás
- Stack de navegación debe separar pantallas públicas y privadas

---

### 8. Estilos y UI

**Web (Tailwind CSS)**:
- Clases utility
- Variables CSS para tema
- Background images
- Responsive con breakpoints

**Native (StyleSheet)**:
- Objetos de estilo
- Colores como valores JS
- Images como assets o URL
- Dimensions para responsive

**Consideraciones**:
- Background images deben ser componentes Image o View con estilo
- Los estilos deben convertirse a StyleSheet
- Colores del tema deben estar en objeto JS
- Responsive mediante Dimensions API

---

## ✅ Requisitos de Implementación

### Componentes a Implementar

1. **LoginScreen** - Pantalla de login con formulario
2. **SessionProvider** - Provider de contexto para sesión
3. **ProtectedRoute/HOC** - Componente/HOC para proteger pantallas
4. **AuthInterceptor** - Interceptor de errores de autenticación
5. **TokenStorage** - Utilidad para almacenar/recuperar tokens

### Funcionalidades Requeridas

1. **Autenticación**:
   - Formulario de login (email/password)
   - Validación de credenciales con backend
   - Almacenamiento seguro de access_token
   - Manejo de errores de autenticación

2. **Gestión de Sesión**:
   - Almacenamiento de token en SecureStore
   - Validación de expiración del token
   - Refresh de token (si está disponible)
   - Acceso a sesión mediante Context API

3. **Protección de Pantallas**:
   - Validación de token antes de mostrar pantallas protegidas
   - Redirección a login si no hay sesión válida
   - Verificación de roles para acceso a pantallas específicas

4. **Validación de Tenant**:
   - Verificación de tenant activo antes de permitir login
   - Carga de branding/configuración del tenant
   - Manejo de tenant inactivo

5. **Manejo de Errores**:
   - Intercepción de errores 401/403
   - Cierre automático de sesión
   - Redirección a login con pantalla actual guardada
   - Notificaciones al usuario

### Endpoints API Requeridos

1. **POST /api/v2/login**
   - Body: `{ email, password }`
   - Response: `{ access_token, user }`

2. **GET /api/v2/me**
   - Headers: `Authorization: Bearer {access_token}`
   - Response: Datos del usuario

3. **GET /api/v2/public/tenant/{subdomain}**
   - Response: `{ active: boolean, ... }`

### Configuración Necesaria

1. **Variables de Entorno**:
   - `API_BASE_URL` - URL base de la API
   - `NEXTAUTH_SECRET` - No aplica en Expo (solo backend)
   - Configuración de tenant (si aplica)

2. **Configuración de Sesión**:
   - Duración de sesión: 7 días
   - Estrategia: JWT
   - Refresh interval: 24 horas

3. **Rate Limiting**:
   - Debe manejarse en el backend
   - No es necesario en cliente

### Estructura de Datos

**Respuesta de Login**:
```javascript
{
  access_token: string,
  user: {
    id: number,
    email: string,
    name: string,
    role: string | string[],
    assignedStoreId?: number,
    companyName?: string,
    companyLogoUrl?: string
  }
}
```

**Sesión Almacenada**:
```javascript
{
  accessToken: string,
  user: {
    id: number,
    email: string,
    name: string,
    role: string | string[],
    assignedStoreId?: number,
    companyName?: string,
    companyLogoUrl?: string
  },
  expiresAt: number  // Timestamp
}
```

### Estilos y Dimensiones

**Login Screen**:
- Formulario centrado vertical y horizontalmente
- Card con imagen de branding a la izquierda (desktop)
- Imagen responsive: column en mobile, row en desktop
- Espaciado consistente entre campos

**Colores del Tema**: Ver sistema de colores del tema (igual que sidebar)

**Tipografía**:
- Título: "La PesquerApp" - text-2xl sm:text-3xl font-bold
- Subtítulo: text-md sm:text-xl
- Labels: text-sm font-medium
- Inputs: text-base md:text-sm

### Integraciones Requeridas

1. **Sistema de Navegación**: React Navigation (Stack Navigator)
2. **Almacenamiento**: @react-native-async-storage/async-storage o expo-secure-store
3. **Notificaciones**: react-native-toast-message o similar
4. **HTTP Client**: axios o fetch wrapper
5. **Gestión de Estado**: Context API o Redux para sesión

---

## 📄 Conclusión

Este documento describe completamente el sistema de autenticación y la página de login de la aplicación Next.js para su replicación en Expo/React Native. Proporciona:

- **Arquitectura completa**: Flujo de autenticación y protección de rutas
- **Detalles técnicos**: Configuración de NextAuth, JWT, callbacks
- **Componentes**: LoginPage, middleware, interceptores
- **Funcionalidades**: Login, logout, validación, protección
- **Estilos**: Componentes UI, estilos del login, branding
- **Diferencias**: Consideraciones entre plataformas web y nativa

La lógica de autenticación (validación de credenciales, gestión de tokens, verificación de roles) se mantiene igual, solo cambia la implementación técnica (NextAuth → almacenamiento nativo, cookies → SecureStore, middleware → protección en componentes).

---

**Fin del Documento**

*Última actualización: 2024*

