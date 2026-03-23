# Estructura del Proyecto - Directorios y Organización

## 📚 Documentación Relacionada

- **[00-overview-introduction.md](./00-overview-introduction.md)** - Visión general del proyecto
- **[01-architecture-app-router.md](./01-architecture-app-router.md)** - Arquitectura Next.js App Router

---

## 📁 Estructura General

```
src/
├── app/                    # Next.js App Router (rutas y páginas)
├── components/             # Componentes React reutilizables
├── context/                # Context API providers
├── hooks/                  # Hooks personalizados
├── services/               # Servicios API v2
├── lib/                    # Utilidades y funciones base
├── configs/                # Configuraciones del proyecto
├── customs/                # Personalizaciones de librerías
├── data/                   # Datos estáticos
├── helpers/                # Funciones auxiliares
└── middleware.js           # Middleware de Next.js
```

---

## 📂 `/src/app` - Next.js App Router

**Propósito**: Contiene todas las rutas de la aplicación usando el sistema de enrutamiento basado en archivos de Next.js 16.

**Estructura**:
```
app/
├── layout.js              # Layout raíz (Server Component)
├── page.js                # Página principal "/" (Client Component)
├── ClientLayout.js        # Layout cliente (Client Component)
├── globals.css            # Estilos globales
├── admin/                 # Rutas de administración
│   ├── layout.js          # Layout admin (Server Component)
│   ├── page.js            # Página principal admin
│   ├── home/              # Dashboard
│   ├── orders/            # Gestión de pedidos
│   ├── productions/       # Gestión de producción (en construcción)
│   ├── stores-manager/    # Gestión de almacenes
│   ├── [entity]/          # Sistema genérico de entidades
│   └── ...                # Otros módulos
├── warehouse/             # Rutas de operador de almacén
│   └── [storeId]/         # Almacén específico
├── home/                  # Página de inicio alternativa
├── unauthorized/          # Página de acceso denegado
└── api/                   # API routes de Next.js (si existen)
```

**Características**:
- Usa App Router de Next.js 16
- Mezcla de Server Components y Client Components
- Layouts anidados
- Rutas dinámicas con `[param]`
- Metadata SEO en layouts

**Documentación relacionada**: Ver `01-architecture-app-router.md` para detalles completos.

---

## 📂 `/src/components` - Componentes React

**Propósito**: Contiene todos los componentes React reutilizables de la aplicación.

**Estructura**:
```
components/
├── Admin/                 # Componentes específicos del módulo Admin
│   ├── Dashboard/         # Componentes del dashboard
│   ├── OrdersManager/     # Gestión de pedidos
│   ├── Productions/       # Gestión de producción
│   ├── Stores/            # Gestión de almacenes
│   ├── Entity/            # Sistema genérico de entidades
│   ├── Forms/             # Formularios genéricos
│   ├── Labels/            # Sistema de etiquetas
│   ├── Pallets/           # Gestión de pallets
│   ├── Settings/          # Configuraciones
│   └── ...                # Otros módulos admin
├── ui/                    # Componentes UI base (ShadCN)
│   ├── button.jsx
│   ├── input.jsx
│   ├── dialog.jsx
│   └── ...                # ~30 componentes ShadCN
├── Shadcn/                # Componentes ShadCN personalizados
│   └── Combobox/          # Combobox personalizado
├── Utilities/             # Componentes de utilidad
│   ├── AuthErrorInterceptor.js
│   ├── Loader/
│   ├── EmptyState/
│   └── ...                # Otros componentes utilitarios
├── AdminRouteProtection/  # Protección de rutas admin
├── ProtectedRoute/        # Protección genérica de rutas
├── WarehouseOperatorLayout/ # Layout para operadores
├── LoginPage/             # Componentes de login
└── LandingPage/           # Componentes de landing
```

**Organización**:
- Componentes UI base en `/ui` (ShadCN)
- Componentes de negocio en `/Admin`
- Componentes de utilidad en `/Utilities`
- Componentes de layout en raíz

**Documentación relacionada**: Ver `03-components-ui-shadcn.md` y `04-components-admin.md`.

---

## 📂 `/src/context` - Context API

**Propósito**: Contiene los providers de Context API para estado global.

**Archivos**:
- `OrderContext.js` - Context para gestión de pedidos
- `StoreContext.js` - Context para gestión de almacenes
- `SettingsContext.js` - Context para configuraciones globales

**Uso**:
```javascript
// Provider
<OrderProvider orderId={id}>
  <Component />
</OrderProvider>

// Consumo
const { order, loading } = useOrderContext();
```

**Documentación relacionada**: Ver `06-context-api.md`.

---

## 📂 `/src/hooks` - Hooks Personalizados

**Propósito**: Contiene hooks personalizados que encapsulan lógica de negocio reutilizable.

**Archivos principales**:
- `useOrder.js` - Hook para gestión de pedidos
- `useStore.js` - Hook para gestión de almacenes
- `useStores.js` - Hook para lista de almacenes
- `usePallet.js` - Hook para gestión de pallets
- `useLabel.js` - Hook para sistema de etiquetas
- `useLabelEditor.js` - Hook para editor de etiquetas
- `useOrderCreateFormConfig.js` - Configuración de formulario de creación
- `useOrderFormConfig.js` - Configuración de formulario de edición
- `useProductOptions.js` - Opciones de productos
- `useTaxOptions.js` - Opciones de impuestos
- `useStoresOptions.js` - Opciones de almacenes
- `usePrintElement.js` - Impresión de elementos
- `use-mobile.jsx` - Detección de dispositivos móviles

**Patrón común**:
```javascript
export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  // ... lógica
  return { order, loading, updateOrder, ... };
}
```

**Documentación relacionada**: Ver `05-hooks-personalizados.md`.

---

## 📂 `/src/services` - Servicios API v2

**Propósito**: Contiene todos los servicios que interactúan con la API v2 del backend.

**Estructura**:
```
services/
├── orderService.js              # CRUD de pedidos
├── productionService.js          # CRUD de producción
├── storeService.js               # CRUD de almacenes
├── customerService.js            # CRUD de clientes
├── productService.js             # CRUD de productos
├── palletService.js              # CRUD de pallets
├── labelService.js               # Sistema de etiquetas
├── settingsService.js            # Configuraciones
├── salespersonService.js         # Comerciales
├── transportService.js           # Transportes
├── paymentTernService.js          # Términos de pago
├── incotermService.js            # Incoterms
├── taxService.js                 # Impuestos
├── speciesService.js             # Especies
├── productCategoryService.js     # Categorías de productos
├── productFamilyService.js       # Familias de productos
├── autocompleteService.js        # Autocompletado genérico
├── entityService.js              # Servicio genérico de entidades
├── createEntityService.js        # Creación genérica
├── editEntityService.js          # Edición genérica
├── rawMaterialReception/         # Recepciones de materia prima
├── ceboDispatch/                 # Salidas de cebo
└── azure/                        # Servicios de Azure
```

**Patrón común**:
```javascript
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";

export function getOrder(orderId, token) {
  return fetchWithTenant(`${API_URL_V2}orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  .then(response => response.json())
  .then(data => data.data);
}
```

**Características**:
- Todos usan `fetchWithTenant` para multi-tenant
- Todos usan `API_URL_V2` (versión activa)
- Reciben `token` como parámetro
- Retornan Promises
- Manejo consistente de errores

**Documentación relacionada**: Ver `07-servicios-api-v2.md`.

---

## 📂 `/src/lib` - Utilidades Base

**Propósito**: Contiene funciones utilitarias fundamentales y helpers base.

**Archivos**:
- `logger.js` - Logger condicional: `log`/`info`/`debug` no-op en producción; `warn`/`error` siempre activos
- `utils.js` - Función `cn()` para merge de clases Tailwind
- `fetchWithTenant.js` - Función base para fetch con soporte multi-tenant
- `barcodes.js` - Utilidades para códigos de barras (EAN13, EAN14, GS1-128)

### `logger.js`
**Propósito**: Reducir ruido y overhead en producción. Usar `log()` en lugar de `console.log()` para depuración.

```javascript
import { log, warn, error } from "@/lib/logger";

log("solo en desarrollo");   // no-op en producción
warn("siempre visible");
error("siempre visible");
```

**Documentación detallada**: Ver `12-utilidades-helpers.md` sección Logger.

### `utils.js`
```javascript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```
**Uso**: Merge inteligente de clases Tailwind, usado en todos los componentes.

### `fetchWithTenant.js`
**Funcionalidad**:
- Detecta tenant automáticamente (cliente y servidor)
- Añade header `X-Tenant` a todas las peticiones
- Maneja errores de autenticación
- Usado por todos los servicios API v2

### `barcodes.js`
**Funciones**:
- `eanChecksum()` - Calcula checksum EAN
- `serializeBarcode()` - Serializa códigos de barras según tipo
- `formatMap` - Mapeo de formatos

**Documentación relacionada**: Ver `12-utilidades-helpers.md`.

---

## 📂 `/src/configs` - Configuraciones

**Propósito**: Contiene todas las configuraciones centralizadas del proyecto.

**Archivos**:
- `config.js` - Configuración general (API URLs, constantes)
- `roleConfig.js` - Configuración de roles y permisos
- `navgationConfig.js` - Configuración de navegación (sidebar)
- `entitiesConfig.js` - Configuración del sistema genérico de entidades
- `authConfig.js` - Configuración de autenticación y manejo de errores

### `config.js`
```javascript
export const API_URL = 'https://api.lapesquerapp.es/api/';
export const API_URL_V1 = `${API_URL}v1/`;  // Obsoleta
export const API_URL_V2 = `${API_URL}v2/`;  // Activa
export const COMPANY_NAME = 'Congelados Brisamar S.L.';
export const UNLOCATED_POSITION_ID = "unlocated";
export const PALLET_LABEL_SIZE = { width: "110mm", height: "90mm" };
```

### `roleConfig.js`
```javascript
const roleConfig = {
  "/admin": ["admin", "manager", "superuser"],
  "/production": ["admin", "worker", "superuser"],
  "/admin/orders": ["admin", "manager", "superuser"],
  "/warehouse": ["store_operator", "superuser"],
};
```

### `navgationConfig.js`
Configuración del sidebar con:
- Nombre de cada item
- Icono
- Ruta (`href`)
- Roles permitidos
- Items anidados (children)

### `entitiesConfig.js`
Configuración extensa (3500+ líneas) para el sistema genérico de entidades:
- Configuración por entidad (raw-material-receptions, etc.)
- Filtros personalizados
- Endpoints
- Rutas de vista/edición
- Estados vacíos
- Paginación

### `authConfig.js`
```javascript
export const AUTH_ERROR_CONFIG = {
  AUTH_ERROR_MESSAGES: ['No autenticado', 'Unauthorized', ...],
  REDIRECT_DELAY: 1500,
  DEFAULT_LOGIN_URL: '/',
  FROM_PARAM: 'from'
};

export function isAuthError(error) { ... }
export function isAuthStatusCode(status) { ... }
export function buildLoginUrl(currentPath) { ... }
```

---

## 📂 `/src/customs` - Personalizaciones

**Propósito**: Contiene personalizaciones y estilos custom para librerías de terceros.

**Estructura**:
```
customs/
└── reactDayPicker/
    └── reactDayPickerStyles.css    # Estilos personalizados para DatePicker
```

**Nota**: Las notificaciones toast usan `notify` como fachada estable; el runtime actual está montado sobre Sonner con un toaster propio.

---

## 📂 `/src/data` - Datos Estáticos

**Propósito**: Contiene datos estáticos y constantes que se usan en la aplicación.

**Estructura**:
```
data/
└── dates/
    └── years.js                    # Lista de años (probablemente)
```

**Uso**: Datos que no cambian y se usan en múltiples lugares (años, meses, opciones predefinidas, etc.).

---

## 📂 `/src/helpers` - Funciones Auxiliares

**Propósito**: Contiene funciones auxiliares organizadas por categoría.

**Estructura**:
```
helpers/
├── getSettingValue.js              # Helper para obtener settings con caché
├── azure/
│   └── documentAI/                 # Helpers para Azure Document AI
├── dates/
│   ├── index.js                    # Constantes de fechas (today, firstDayOfYear, etc.)
│   └── years.js                    # Helpers relacionados con años
├── formats/
│   ├── dates/
│   │   └── formatDates.js         # Formateo de fechas (DD/MM/YYYY, etc.)
│   ├── numbers/
│   │   └── formatNumbers.js       # Formateo de números (moneda, peso, etc.)
│   └── texts/
│       └── index.js                # Normalización de textos
├── styles/
│   └── classNames.js               # Helper para concatenar clases (similar a clsx)
└── window/
    └── goBack.js                    # Helper para navegación (window.history.back)
```

### Helpers Principales

#### `getSettingValue.js`
```javascript
let cachedSettings = null;

export async function getSettingValue(key, forceRefresh = false) {
  if (!cachedSettings || forceRefresh) {
    cachedSettings = await getSettings();
  }
  return cachedSettings?.[key];
}

export function invalidateSettingsCache() {
  cachedSettings = null;
}
```
**Funcionalidad**: Caché de settings para evitar múltiples llamadas API.

#### `formats/dates/formatDates.js`
```javascript
export const formatDate = (date) => { ... }           // DD/MM/YYYY
export const formatDateHour = (date) => { ... }        // DD/MM/YYYY - HH:MM
export const formatDateShort = (dateString) => { ... } // 26 feb 2025
```

#### `formats/numbers/formatNumbers.js`
```javascript
export const formatInteger = (number) => { ... }           // 1.234
export const formatIntegerCurrency = (number) => { ... }   // 1.234 €
export const formatIntegerWeight = (number) => { ... }     // 1.234 Kg
export const formatDecimal = (number) => { ... }            // 1.234,56
export const formatDecimalCurrency = (number) => { ... }    // 1.234,56 €
export const formatDecimalWeight = (number) => { ... }      // 1.234,56 kg
export const parseEuropeanNumber = (str) => { ... }         // Parsea formato europeo
```

#### `formats/texts/index.js`
```javascript
export const normalizeText = (nombre) => {
  return nombre
    ?.normalize('NFD')                    // quitar tildes
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '')                 // quitar puntos y comas
    .toLowerCase()
    .trim();
};
```

#### `dates/index.js`
```javascript
export const today = new Date()
export const firstDayOfCurrentYear = new Date(today.getFullYear(), 0, 1)
export const firstDayOfCurrentYearLocaleDateString = firstDayOfCurrentYear.toLocaleDateString('sv-SE')
export const todayLocaleDateString = today.toLocaleDateString('sv-SE')
export const actualYearRange = {
  from: firstDayOfCurrentYear,
  to: today
}
```

#### `styles/classNames.js`
```javascript
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
```
**Nota**: Similar a `clsx`, pero más simple. La función `cn()` en `lib/utils.js` es más completa.

#### `window/goBack.js`
```javascript
export const goBack = () => {
  if (typeof window !== 'undefined') {
    window.history.back();
  }
};
```

**Documentación relacionada**: Ver `12-utilidades-helpers.md`.

---

## 📂 `/src/middleware.js` - Middleware de Next.js

**Propósito**: Middleware que se ejecuta antes de cada request para validar autenticación y autorización.

**Funcionalidad**:
1. Valida token de NextAuth
2. Verifica expiración
3. Valida token con backend (`/api/v2/me`)
4. Controla acceso por roles
5. Redirige según validaciones

**Matcher**: Se aplica a `/admin/*`, `/production/*`, `/warehouse/*`

**Documentación relacionada**: Ver `01-architecture-app-router.md` y `11-autenticacion-autorizacion.md`.

---

## 🔧 Path Aliases (jsconfig.json)

**Archivo**: `/jsconfig.json`

**Configuración**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

**Uso en imports**:
```javascript
import { cn } from "@/lib/utils";
import { getOrder } from "@/services/orderService";
import { Button } from "@/components/ui/button";
```

**Aliases disponibles**:
- `@/` → `/src/`
- `@lib/` → `/src/lib/`

---

## 📊 Flujo de Dependencias

```
Componente
  ├── Hook personalizado
  │     └── Servicio API v2
  │           └── fetchWithTenant (lib)
  │                 └── Config (configs)
  ├── Context
  │     └── Hook personalizado
  ├── Helper
  │     └── Servicio API v2 (si necesita datos)
  └── Utilidad (lib/utils, helpers)
```

---

## 🎯 Convenciones de Organización

### Nomenclatura de Archivos
- **Componentes**: PascalCase (`OrderManager.jsx`)
- **Hooks**: camelCase con prefijo `use` (`useOrder.js`)
- **Servicios**: camelCase (`orderService.js`)
- **Helpers**: camelCase (`formatDates.js`)
- **Configs**: camelCase (`roleConfig.js`)

### Estructura de Módulos
Cada módulo principal sigue esta estructura:
```
/admin/{modulo}/
  ├── page.js              # Página principal
  ├── create/              # Crear
  └── [id]/                # Ver/Editar

/components/Admin/{Modulo}/
  ├── {Modulo}Manager/     # Gestión
  ├── {Modulo}Form/         # Formularios
  └── ...
```

### Separación de Responsabilidades
- **Components**: Solo presentación y lógica de UI
- **Hooks**: Lógica de negocio y estado
- **Services**: Comunicación con API
- **Helpers**: Funciones puras y utilidades
- **Configs**: Configuración estática

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Duplicación de Funciones de Clases
- **Archivo**: `/src/helpers/styles/classNames.js` y `/src/lib/utils.js`
- **Problema**: `classNames()` en helpers hace lo mismo que `cn()` en lib/utils, pero `cn()` es más completo (usa `twMerge`)
- **Impacto**: Inconsistencia, posible uso de función menos completa
- **Recomendación**: Eliminar `classNames()` y usar solo `cn()` de `lib/utils.js`

### 2. Configuración de Entidades Muy Grande
- **Archivo**: `/src/configs/entitiesConfig.js`
- **Línea**: ~3500 líneas
- **Problema**: Un solo archivo con toda la configuración de entidades
- **Impacto**: Difícil de mantener, posible problema de rendimiento al importar
- **Recomendación**: Dividir en archivos por entidad o usar sistema de carga dinámica

### 3. Falta de Index Files en Helpers
- **Archivo**: `/src/helpers/`
- **Problema**: No hay archivos `index.js` que exporten todas las funciones de cada subdirectorio
- **Impacto**: Imports más largos y menos organizados
- **Recomendación**: Crear `index.js` en cada subdirectorio de helpers para exports centralizados

### 4. Helpers de Fechas Duplicados
- **Archivo**: `/src/helpers/dates/` y `/src/data/dates/`
- **Problema**: Posible duplicación de lógica relacionada con fechas
- **Impacto**: Confusión sobre dónde buscar funciones de fechas
- **Recomendación**: Consolidar en un solo lugar o documentar claramente la diferencia

### 5. Falta de Organización en Services
- **Archivo**: `/src/services/`
- **Problema**: Algunos servicios están en subdirectorios (azure/, rawMaterialReception/, ceboDispatch/) pero otros no
- **Impacto**: Inconsistencia en organización
- **Recomendación**: Estandarizar organización (todos en raíz o todos en subdirectorios por módulo)

### 6. Archivo de Configuración con Typo
- **Archivo**: `/src/configs/navgationConfig.js`
- **Problema**: Nombre tiene typo: "navgation" en lugar de "navigation"
- **Impacto**: Confusión, inconsistencia
- **Recomendación**: Renombrar a `navigationConfig.js` (requiere actualizar imports)

### 7. Falta de Documentación de Helpers
- **Archivo**: Múltiples archivos en `/src/helpers/`
- **Problema**: Funciones sin JSDoc o comentarios explicativos
- **Impacto**: Dificulta entender el propósito y uso de cada función
- **Recomendación**: Añadir JSDoc a todas las funciones exportadas

### 8. Helper getSettingValue con Caché Global
- **Archivo**: `/src/helpers/getSettingValue.js`
- **Línea**: 3
- **Problema**: Caché global (`let cachedSettings`) puede causar problemas en SSR si no se maneja correctamente
- **Impacto**: Posibles inconsistencias entre servidor y cliente
- **Recomendación**: Usar Context API o estado de React para caché en lugar de variable global

### 9. Falta de Validación en Helpers de Formato
- **Archivo**: `/src/helpers/formats/`
- **Problema**: Funciones de formato no validan inputs (pueden recibir null, undefined, etc.)
- **Impacto**: Posibles errores en tiempo de ejecución
- **Recomendación**: Añadir validación y valores por defecto

### 10. Estructura de Components/Utilities
- **Archivo**: `/src/components/Utilities/`
- **Problema**: Algunos componentes utilitarios están en `/Utilities/` y otros podrían estar en `/ui/`
- **Impacto**: Confusión sobre dónde buscar componentes
- **Recomendación**: Documentar claramente la diferencia: `/ui/` para componentes ShadCN base, `/Utilities/` para componentes de utilidad específicos de la app
