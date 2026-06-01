# Arquitectura - Next.js App Router y Organización

## 📐 Arquitectura General

La aplicación utiliza **Next.js 16** con **App Router**, el sistema de enrutamiento basado en archivos introducido en Next.js 13+. La arquitectura sigue un patrón híbrido donde la mayoría de componentes son **Client Components** debido a la alta interactividad requerida.

## 📚 Documentación Relacionada

- **[00-overview-introduction.md](./00-overview-introduction.md)** - Visión general y stack tecnológico
- **[02-project-structure.md](./02-project-structure.md)** - Estructura detallada de directorios

---

## 🗂️ Estructura de Rutas (App Router)

### Jerarquía de Layouts

La aplicación tiene una jerarquía de layouts anidados:

```
RootLayout (Server Component)
  └── ClientLayout (Client Component)
       └── SettingsProvider
            └── AdminLayout (Server Component) [solo en /admin/*]
                 └── AdminRouteProtection (Client Component)
                      └── Páginas específicas
```

### 1. Root Layout (`/src/app/layout.js`)

**Tipo**: Server Component (por defecto en Next.js)

**Archivo**: `/src/app/layout.js`

**Responsabilidades**:

- Metadata SEO (OpenGraph, Twitter Cards)
- Estructura HTML base (`<html>`, `<body>`)
- Importa estilos globales (`globals.css`)
- Envuelve la aplicación con `SettingsProvider`

**Código clave**:

```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-background w-full">
        <SettingsProvider>
          <ClientLayout>{children}</ClientLayout>
        </SettingsProvider>
      </body>
    </html>
  );
}
```

### 2. Client Layout (`/src/app/ClientLayout.js`)

**Tipo**: Client Component (`"use client"`)

**Archivo**: `/src/app/ClientLayout.js`

**Responsabilidades**:

- Proporciona `SessionProvider` de NextAuth para toda la app
- Intercepta errores de autenticación (`AuthErrorInterceptor`)
- Renderiza notificaciones toast globales (`Toaster`)

**Código clave**:

```javascript
export default function ClientLayout({ children }) {
  return (
    <SessionProvider>
      <AuthErrorInterceptor />
      {children}
      <Toaster />
    </SessionProvider>
  );
}
```

**Nota**: Este layout es necesario porque NextAuth requiere un Client Component para `SessionProvider`, pero el Root Layout es un Server Component.

### 3. Admin Layout (`/src/app/admin/layout.js`)

**Tipo**: Server Component (no tiene `"use client"`)

**Archivo**: `/src/app/admin/layout.js`

**Responsabilidades**:

- Layout específico para todas las rutas `/admin/*`
- Renderiza sidebar (`AppSidebar`)
- Proporciona estructura de layout con breadcrumbs
- Protege rutas con `AdminRouteProtection`

**Código clave**:

```javascript
export default function AdminLayout({ children }) {
  return (
    <AdminRouteProtection>
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </AdminRouteProtection>
  );
}
```

**Aplicación**: Se aplica automáticamente a todas las rutas bajo `/admin/*` debido a la convención de Next.js App Router.

---

## 🛣️ Estructura de Rutas Principales

### Rutas Públicas

#### `/` (Página Principal)

- **Archivo**: `/src/app/page.js`
- **Tipo**: Client Component
- **Funcionalidad**:
  - Detecta si es subdominio (multi-tenant)
  - Muestra `LoginPage` si es subdominio
  - Muestra `LandingPage` si es dominio principal
  - Redirige automáticamente según autenticación

### Rutas de Administración (`/admin/*`)

Todas las rutas bajo `/admin/*` heredan el `AdminLayout` y están protegidas por middleware y `AdminRouteProtection`.

#### `/admin` (Página Principal Admin)

- **Archivo**: `/src/app/admin/page.js`
- **Tipo**: Server Component
- **Renderiza**: Componente `Home` (Dashboard)

#### `/admin/home` (Dashboard)

- **Archivo**: `/src/app/admin/home/page.js`
- **Tipo**: Server Component
- **Renderiza**: Componente `Dashboard`

#### `/admin/orders` (Gestión de Pedidos)

- **Estructura**:
  - `/admin/orders` - Lista de pedidos
  - `/admin/orders/create` - Crear pedido (Client Component)
  - `/admin/orders/[id]` - Ver/Editar pedido (Server Component que renderiza Client Component)

**Ejemplo de ruta dinámica**:

```javascript
// /src/app/admin/orders/[id]/page.js
export default async function OrderPage({ params }) {
  const { id } = await params; // Next.js 15 requiere await
  return <OrderClient orderId={id} />;
}
```

#### `/admin/productions` (Producción) ⚠️ **EN CONSTRUCCIÓN**

- **Estructura**:
  - `/admin/productions` - Lista de producciones
  - `/admin/productions/[id]` - Detalle de producción
  - `/admin/productions/[id]/records/[recordId]` - Registro de producción

#### `/admin/stores-manager` (Gestión de Almacenes)

- Gestión completa de almacenes
- Visualización de posiciones
- Gestión de pallets y cajas

#### `/admin/[entity]` (Sistema Genérico de Entidades)

- **Archivo**: `/src/app/admin/[entity]/page.js`
- **Tipo**: Server Component
- **Funcionalidad**: Sistema genérico que renderiza diferentes entidades basado en configuración
- **Configuración**: `/src/configs/entitiesConfig.js`

**Ejemplo**:

```javascript
export default async function EntityPage({ params }) {
  const { entity } = await params;
  const config = configs[entity];
  if (!config) return <p>Entidad no encontrada</p>;
  return <EntityClient config={config} />;
}
```

#### Otras Rutas Admin:

- `/admin/customers` - Clientes
- `/admin/products` - Productos
- `/admin/suppliers` - Proveedores
- `/admin/pallets` - Pallets
- `/admin/label-editor` - Editor de etiquetas
- `/admin/settings` - Configuraciones
- `/admin/market-data-extractor` - Extractor de datos de lonja
- `/admin/sessions` - Sesiones

### Rutas de Operador de Almacén (`/warehouse/*`)

#### `/warehouse/[storeId]`

- **Archivo**: `/src/app/warehouse/[storeId]/page.js`
- **Tipo**: Client Component
- **Funcionalidad**:
  - Interfaz específica para operadores de almacén
  - Valida que el usuario tenga acceso al almacén
  - Renderiza componente `Store` con layout específico

**Protección**:

- Middleware valida rol `store_operator` o `superuser`
- Componente valida que `assignedStoreId` coincida con `storeId` de la URL
- Redirige a almacén correcto si hay discrepancia

---

## 🔐 Protección de Rutas

### Middleware (`/src/middleware.js`)

**Archivo**: `/src/middleware.js`

**Funcionalidad**:

1. **Validación de token**: Verifica que el token de NextAuth exista y no esté expirado
2. **Validación con backend**: Hace fetch a `/api/v2/me` para verificar que el token sea válido
3. **Control de roles**: Usa `roleConfig` para determinar qué roles pueden acceder a cada ruta
4. **Redirecciones automáticas**:
   - Sin token → `/` (login)
   - Token expirado → `/` (login)
   - Token inválido → `/` (login)
   - Rol incorrecto → `/unauthorized`
   - `store_operator` intentando acceder a `/admin` → redirige a su almacén

**Configuración de roles** (`/src/configs/roleConfig.js`):

```javascript
const roleConfig = {
  '/admin': ['admin', 'manager', 'superuser'],
  '/production': ['admin', 'worker', 'superuser'],
  '/admin/orders': ['admin', 'manager', 'superuser'],
  '/warehouse': ['store_operator', 'superuser'],
};
```

**Matcher** (rutas donde se aplica):

```javascript
export const config = {
  matcher: ['/admin/:path*', '/production/:path*', '/warehouse/:path*'],
};
```

### Componentes de Protección

#### AdminRouteProtection (`/src/components/AdminRouteProtection/index.js`)

- **Tipo**: Client Component
- **Funcionalidad**:
  - Protección adicional para rutas admin
  - Redirige `store_operator` a su almacén si intenta acceder a admin
  - Muestra loader durante validación

#### ProtectedRoute (`/src/components/ProtectedRoute/index.js`)

- **Tipo**: Client Component
- **Funcionalidad**: Protección genérica con roles permitidos
- **Uso**: Menos usado, la mayoría de protección se hace en middleware

---

## 🏗️ Client Components vs Server Components

### Distribución Actual

**Server Components** (pocos):

- Layouts principales (`layout.js`)
- Páginas que solo renderizan Client Components
- Ejemplo: `/src/app/admin/orders/[id]/page.js`

**Client Components** (mayoría):

- Casi todos los componentes de UI
- Componentes con interactividad (formularios, modales, etc.)
- Componentes que usan hooks (`useState`, `useEffect`, `useSession`)
- Componentes que acceden a `window` o `localStorage`

### Patrón Híbrido Usado

**Patrón común**:

```javascript
// Server Component (page.js)
export default async function Page({ params }) {
  const { id } = await params;
  return <ClientComponent id={id} />;
}

// Client Component (ClientComponent.js)
"use client";
export default function ClientComponent({ id }) {
  // Lógica interactiva aquí
}
```

**Razón**: Permite aprovechar Server Components para metadata y estructura, mientras mantiene interactividad en Client Components.

---

## 🏢 Arquitectura Multi-Tenant

### Detección de Tenant

**Función**: `fetchWithTenant` en `/src/lib/fetchWithTenant.js`

**Lógica**:

1. **En servidor**: Lee header `host` de Next.js
2. **En cliente**: Lee `window.location.host`
3. **Extrae tenant**: Primera parte del subdominio
   - `brisamar.lapesquerapp.es` → tenant: `brisamar`
   - `brisamar.localhost` → tenant: `brisamar`
   - Sin subdominio → tenant: `brisamar` (default)

**Header enviado**: `X-Tenant: {tenant}` en todas las peticiones API v2

**Ejemplo**:

```javascript
// Cliente
const tenant = window.location.host.split('.')[0]; // "brisamar"

// Servidor
const headersList = headers();
const host = headersList.get('host');
const tenant = host.split('.')[0];
```

### Configuración

**Archivo**: `/src/configs/config.js`

- `API_URL`: Base URL de la API
- `API_URL_V2`: Endpoint v2 activo
- `COMPANY_NAME`: Nombre de empresa por defecto

---

## 📦 Providers y Context

### SettingsProvider

**Archivo**: `/src/context/SettingsContext.js`

**Tipo**: Client Component

**Funcionalidad**:

- Carga configuraciones globales desde API v2
- Proporciona `settings` a toda la aplicación
- Invalida caché cuando se actualizan settings

**Uso**:

```javascript
const { settings, loading } = useSettings();
```

**Ubicación**: Envolviendo toda la app en `RootLayout`

### SessionProvider (NextAuth)

**Archivo**: Proporcionado por NextAuth

**Ubicación**: En `ClientLayout`

**Funcionalidad**:

- Gestiona sesiones de usuario
- Proporciona `useSession()` hook
- Maneja tokens de autenticación

### OrderContext

**Archivo**: `/src/context/OrderContext.js`

**Uso**: Para páginas específicas de pedidos

**Funcionalidad**: Estado global de un pedido activo

### StoreContext

**Archivo**: `/src/context/StoreContext.js`

**Uso**: Para páginas de almacenes

**Funcionalidad**: Estado global de un almacén activo

---

## 🔄 Flujo de Autenticación

### 1. Usuario accede a ruta protegida

```
Usuario → Middleware
```

### 2. Middleware valida

```
Middleware:
  ├── ¿Token existe? → NO → Redirige a /
  ├── ¿Token expirado? → SÍ → Redirige a /
  ├── ¿Token válido en backend? → NO → Redirige a /
  └── ¿Rol permitido? → NO → Redirige a /unauthorized
```

### 3. Si pasa validación

```
Middleware → Página solicitada
```

### 4. En la página (Client Component)

```
useSession() → Obtiene datos de sesión
  ├── Si no autenticado → Redirige
  └── Si autenticado → Renderiza contenido
```

### 5. Protección adicional (AdminRouteProtection)

```
AdminRouteProtection:
  ├── ¿Es store_operator? → SÍ → Redirige a /warehouse/{id}
  └── ¿Otro rol? → Renderiza contenido
```

---

## 📁 Organización de Módulos

### Módulos Principales

Cada módulo sigue una estructura similar:

```
/admin/{modulo}/
  ├── page.js              # Página principal (lista)
  ├── create/              # Crear nuevo
  │   └── page.js
  ├── [id]/                # Ver/Editar
  │   └── page.js
  └── loading.js           # Loading state (obligatorio según estándar; ver docs/estandar-loading-rutas.md)
```

### Componentes por Módulo

Los componentes específicos de cada módulo están en:

```
/src/components/Admin/{Modulo}/
  ├── {Modulo}Manager/     # Gestión principal
  ├── {Modulo}Form/        # Formularios
  ├── {Modulo}Table/       # Tablas
  └── ...
```

### Ejemplo: Módulo de Pedidos

```
/src/app/admin/orders/
  ├── page.js                    # Lista de pedidos
  ├── create/
  │   └── page.js                # Crear pedido
  └── [id]/
      └── page.js                # Ver/Editar pedido

/src/components/Admin/OrdersManager/
  ├── Order/                     # Componente de pedido
  ├── CreateOrderForm/           # Formulario de creación
  └── ...
```

---

## 🔌 Integración con API v2

### Función Base: `fetchWithTenant`

**Archivo**: `/src/lib/fetchWithTenant.js`

**Funcionalidad**:

- Añade header `X-Tenant` automáticamente
- Detecta tenant en cliente y servidor
- Maneja errores de autenticación
- Lanza errores descriptivos

**Uso en servicios**:

```javascript
import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';

export function getOrder(orderId, token) {
  return fetchWithTenant(`${API_URL_V2}orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => data.data);
}
```

### Estructura de Servicios

Todos los servicios están en `/src/services/` y siguen el patrón:

- Importan `fetchWithTenant` y `API_URL_V2`
- Reciben `token` como parámetro
- Retornan Promises
- Manejan errores consistentemente

---

## 🎨 Sistema de Layouts por Módulo

### Layout Admin (Global)

Aplicado a todas las rutas `/admin/*`:

- Sidebar con navegación
- Breadcrumbs
- Estructura consistente

### Layout Warehouse

Aplicado a rutas `/warehouse/*`:

- Layout específico para operadores
- Sin sidebar completo
- Interfaz simplificada

**Archivo**: `/src/components/WarehouseOperatorLayout/index.js`

---

## 📊 Estado de la Aplicación

### Estado Global (Context API)

1. **SettingsContext**: Configuraciones globales
2. **OrderContext**: Estado de pedido activo (cuando se usa)
3. **StoreContext**: Estado de almacén activo (cuando se usa)

### Estado Local (Hooks)

- `useState` para estado de componente
- Hooks personalizados (`useOrder`, `useStore`, etc.) para lógica de negocio

### Estado de Servidor (Next.js)

- Metadata en Server Components
- Params de rutas dinámicas
- Headers y cookies accesibles en Server Components

---

## ⚠️ Observaciones Críticas

Para una lista completa de observaciones críticas, consulta **[15-observaciones-criticas.md](./15-observaciones-criticas.md)**.

**Principales observaciones arquitectónicas:**

- Mezcla inconsistente de Server/Client Components (oportunidad de optimización)
- Middleware hace fetch al backend en cada request (posible impacto en rendimiento)
- Falta de Error Boundaries para capturar errores de renderizado
- Falta de Suspense boundaries para loading states asíncronos
