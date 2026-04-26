# Frontend Architecture — La PesquerApp

## Stack real

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16 (App Router) | Framework principal |
| React | 19 RC | UI |
| TypeScript | 5.9 | Tipado |
| Tailwind CSS | 4 | Estilos |
| shadcn/ui + Radix UI | — | Componentes UI |
| TanStack Query | 5 | Data fetching y caché |
| TanStack Table | 8 | Tablas |
| React Hook Form | 7 | Estado de formularios |
| Zod | 3 | Validación y schemas |
| NextAuth | 4 | Autenticación JWT |
| Mapbox GL JS | — | Mapas |
| Recharts | 2 | Gráficos |
| Framer Motion | 11 | Animaciones (uso puntual) |
| AI SDK | 6 | Integración IA (@ai-sdk/openai, @ai-sdk/react) |

---

## Estructura de carpetas (`src/`)

```
src/
├── app/                    # Next.js App Router — rutas por rol
│   ├── admin/              # Administrador, dirección, técnico
│   ├── operator/           # Operario (almacén)
│   ├── comercial/          # Comercial (ventas)
│   ├── field/              # Repartidor autoventa
│   ├── production/         # Producción (varios roles)
│   ├── warehouse/          # Almacén (admin + técnico)
│   ├── external/           # Usuario externo (cliente)
│   ├── superadmin/         # Superadministración
│   ├── auth/               # Rutas de autenticación
│   ├── api/                # API routes internas de Next.js
│   ├── layout.js           # Layout raíz
│   ├── ClientLayout.js     # Providers cliente (Query, Session, etc.)
│   └── globals.css         # CSS global
│
├── components/
│   ├── Admin/              # 27 subdirectorios (orders, customers, labels, etc.)
│   ├── Warehouse/          # Operativa de almacén
│   ├── Comercial/          # Ventas y CRM
│   ├── Field/              # Operativa de campo (móvil)
│   ├── External/           # Portal de cliente externo
│   ├── Shared/             # Componentes reutilizables entre roles
│   ├── Shadcn/             # Wrappers shadcn/ui con configuración propia
│   ├── ui/                 # Primitivos shadcn generados (button, input, card…)
│   ├── UI/                 # Componentes UI propios adicionales
│   ├── AI/                 # Componentes de IA
│   ├── Maps/               # Integración Mapbox
│   ├── Providers/          # React providers
│   ├── PWA/                # Instalación PWA
│   ├── ProtectedRoute/     # Protección de rutas cliente
│   └── Utilities/          # Loader y utilidades genéricas
│
├── services/
│   ├── domain/             # 31 servicios de dominio (uno por entidad)
│   └── generic/            # Helpers privados del service layer
│
├── hooks/                  # 97 hooks (mayoría wrappers TanStack Query)
│   └── production/         # Hooks de producción
│
├── context/                # 7 providers de estado global
├── lib/                    # Fetch, auth, query keys, validación, utilidades
├── configs/                # Configuración de roles, navegación, entidades, branding
├── types/                  # 14 archivos de tipos TypeScript
├── schemas/                # Schemas Zod
├── helpers/                # 9 subdirectorios de helpers
├── utils/                  # Utilidades generales
├── constants/              # Constantes
├── data/                   # Datos estáticos
├── parsers/                # Parsers de respuestas API
├── validators/             # Funciones de validación
├── errors/                 # Clases de error custom
├── exportHelpers/          # Helpers para exportación (xlsx, etc.)
├── __tests__/              # Tests (11 subdirectorios)
└── middleware.ts           # Middleware Next.js (auth + tenant + rol)
```

---

## Capa de servicios (`src/services/`)

### Patrón de dominio

Cada entidad tiene su propio servicio en `src/services/domain/{entidad}/{entidad}Service.ts`.

Las 31 entidades actuales:
`activity-logs`, `boxes`, `capture-zones`, `cebo-dispatches`, `countries`, `customers`, `employees`, `external-users`, `field-operators`, `fishing-gears`, `incoterms`, `orders`, `pallets`, `payment-terms`, `product-categories`, `product-families`, `productions`, `products`, `punches`, `raw-material-receptions`, `roles`, `salespeople`, `sessions`, `species`, `stores`, `supplier-liquidations`, `suppliers`, `taxes`, `transports`, `users`

### Patrón estándar de un servicio

```typescript
const customerService = {
  async list(filters = {}, pagination = {}) {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;
    const queryParams = new URLSearchParams();
    addFiltersToParams(queryParams, filters);
    const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
    return fetchEntitiesGeneric(url, token);
  },
  async getById(id) { ... },
  async create(data) { ... },
  async update(id, data) { ... },
  async delete(id) { ... },
  async getOptions() { ... }   // Para selects/combobox
};
```

### Helpers genéricos (`src/services/generic/`)

Los servicios de dominio no hacen fetch directo. Usan helpers privados:

- `entityService.js` — `fetchEntitiesGeneric()`, `deleteEntityGeneric()`, `performActionGeneric()`, `downloadFileGeneric()`
- `createEntityService.js` — Wrapper de creación
- `editEntityService.js` — Fetch de datos y submit de edición

Todos los helpers llaman a `fetchWithTenant()` (ver abajo).

### URL base

```javascript
// src/configs/config.js
export const API_URL_V2 = `${API_BASE_URL}/api/v2/`;

// En dev: /api-backend/api/v2/ → proxy a http://localhost:8000/api/v2/
// En prod: ${NEXT_PUBLIC_API_URL}/api/v2/
```

---

## Fetch centralizado (`src/lib/fetchWithTenant.js`)

Toda la comunicación con la API pasa por `fetchWithTenant()`:

```javascript
export async function fetchWithTenant(url, options = {}, reqHeaders = null) {
  // 1. Detecta tenant desde Host header (server) o window.location.host (client)
  // 2. Añade cabeceras: X-Tenant, Content-Type: application/json, User-Agent
  // 3. Gestiona 401:
  //    - Si está en proceso de logout: deja pasar
  //    - Si es error de validación: deja pasar (no es fallo de auth)
  //    - Si es JWT expirado/inválido: dispara AUTH_SESSION_EXPIRED_EVENT → logout
  // 4. Gestiona 403: muestra userMessage, no dispara logout
  // 5. Parsea errors JSON o texto
}
```

**Regla clave**: nunca llamar a `fetch()` directamente desde componentes o servicios. Siempre usar `fetchWithTenant()` a través de los helpers genéricos.

---

## Autenticación y sesión

### Flujo de token

1. NextAuth gestiona la sesión JWT en cookies httpOnly.
2. Todos los servicios llaman a `getAuthToken()` para obtener el `accessToken`.
3. El token se incluye como `Authorization: Bearer {token}` en cada petición.

### Estructura de la sesión

```typescript
// src/types/next-auth.d.ts
user: {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  role: string | string[];           // ej. "administrador", "comercial"
  actorType: 'internal_user' | 'external_user';
  assignedStoreId: number | null;
  exp: number;                       // Unix timestamp
}
```

### Roles del sistema

| Rol | Ruta base |
|---|---|
| `administrador` | `/admin`, `/production`, `/warehouse` |
| `direccion` | `/admin`, `/production`, `/warehouse` |
| `tecnico` | `/admin`, `/production`, `/warehouse` |
| `operario` | `/operator`, `/production` |
| `comercial` | `/comercial` |
| `repartidor_autoventa` | `/field` |
| `external_user` | `/external` |

La configuración de roles vive en `src/configs/roleConfig.ts`.

---

## Middleware (`src/middleware.ts`)

El middleware protege todas las rutas de la aplicación:

1. Extrae el JWT de NextAuth.
2. Verifica expiración.
3. Llama a `/api/v2/me` para validar la sesión (cacheado 60 segundos en cookie `__session_verified`).
4. Mapea rol del token a rutas permitidas.
5. Redirige si no tiene acceso: `/?from={pathname}`, `/unauthorized`, o ruta home del rol.

**Multi-tenant en middleware**: el tenant se extrae del subdominio del Host (`dev.localhost` → `dev`, `empresa.lapesquerapp.es` → `empresa`). Por defecto: `brisamar`.

---

## Hooks (`src/hooks/`)

### Patrón estándar (TanStack Query)

```typescript
export function useCustomersList(params = {}) {
  const tenantId = getCurrentTenant();
  
  const query = useQuery({
    queryKey: customerKeys.list(tenantId, params),
    queryFn: () => customerService.list(params),
    enabled: Boolean(tenantId),
    select: (response) => ({
      data: response.data,
      meta: response.meta,
    }),
  });
  
  return {
    data: query.data?.data ?? [],
    meta: query.data?.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

### Convenciones de hooks

- Los hooks de listado devuelven `{ data, meta, isLoading, error, refetch }`.
- Los hooks de mutación usan `useMutation()` con `onSuccess`/`onError`.
- Las query keys están centralizadas en `src/lib/routes/` (evitar duplicados).
- Los hooks condicionan `enabled` al tenant y al estado de auth.
- Algunos hooks son grandes y contienen lógica compleja de formularios (`useOrder.js` ~40KB, `usePallet.js` ~48KB, `useLabelEditor.ts` ~52KB): respetar ese patrón, no extraer lógica sin necesidad.

---

## Estado global (`src/context/`)

El estado global se usa con moderación. Hay 7 providers:

| Context | Propósito |
|---|---|
| `OrderContext.jsx` | Estado de edición de pedido (usa `useOrder`) |
| `ProductionRecordContext.js` | Estado de registro de producción |
| `OptionsContext.js` | Opciones compartidas de selects/autocomplete |
| `BottomNavContext.jsx` | Navegación inferior móvil |
| `FieldOperatorContext.tsx` | Estado de rutas del operador de campo |
| `LogoutContext.tsx` | Coordinación de logout |
| `StoreContext.js` | Tienda actual |

La mayor parte del estado de datos fluye por TanStack Query, no por Context.

---

## Flujo de datos completo

```
Componente
  → llama a hook (useX)
    → hook llama a service (xService.list())
      → service construye URL con filtros/paginación
      → service llama a helper genérico (fetchEntitiesGeneric)
        → helper llama a fetchWithTenant()
          → fetchWithTenant añade X-Tenant + Authorization
          → fetchWithTenant gestiona errores 401/403
        → helper parsea JSON
      → service devuelve datos tipados
    → hook aplica select() + caché TanStack Query
  → componente recibe { data, isLoading, error, refetch }
```

---

## Configuración clave (`src/configs/`)

| Archivo | Contenido |
|---|---|
| `config.js` | `API_URL_V2`, `COMPANY_NAME`, `PALLET_LABEL_SIZE` |
| `roleConfig.ts` | Mapa rol → rutas permitidas |
| `navigationConfig.js` | Menús de navegación por rol |
| `authConfig.ts` | `isAuthError()`, `buildLoginUrl()`, delay de redirección |
| `entitiesConfig.js` | **117KB** — Configuración masiva de todas las entidades: formularios, columnas, filtros, iconos |
| `branding.js` | Logos y URLs de fallback |

**Nota**: `entitiesConfig.js` es el archivo más complejo del proyecto. No modificarlo sin entender su impacto total.

---

## Multi-tenant

El sistema es multi-tenant. El tenant se propaga así:

1. **Detección**: subdominio del Host header en server-side; `window.location.host` en client-side.
2. **Propagación**: cabecera `X-Tenant` en cada petición HTTP vía `fetchWithTenant`.
3. **Aislamiento**: el backend usa `X-Tenant` para filtrar todos los datos.
4. **Nunca hardcodear** el tenant en el frontend.

---

## Proxy de desarrollo

En desarrollo, para evitar CORS:

```javascript
// next.config.mjs
rewrites: [
  { source: '/api-backend/:path*', destination: 'http://localhost:8000/:path*' }
]
```

Las variables de entorno relevantes:

```
NEXT_PUBLIC_API_URL=          # URL base del backend en producción
NEXTAUTH_URL=                 # URL del frontend para NextAuth
NEXTAUTH_SECRET=              # Secret de NextAuth
```

---

## Principios de arquitectura para agentes

1. **No llamar a fetch directamente**. Usar siempre el service layer.
2. **No duplicar servicios**. Antes de crear uno nuevo, buscar en `src/services/domain/`.
3. **No inventar endpoints**. Verificar los existentes en los servicios antes de asumir.
4. **No saltarse TanStack Query**. Los datos se cachean, se sincronizan y se invalidan desde los hooks.
5. **No modificar `entitiesConfig.js` a la ligera**. Es el corazón de la configuración de entidades.
6. **No añadir state global sin necesidad**. TanStack Query ya cachea los datos; el Context es para estado de UI o flujos complejos.
7. **Respetar los roles**. Las rutas tienen control de acceso en middleware; no asumir que cualquier usuario puede acceder a cualquier ruta.
8. **Respetar el tenant**. `X-Tenant` se añade automáticamente en `fetchWithTenant`; no manipular manualmente.
