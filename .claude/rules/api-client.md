# Reglas de API Client — La PesquerApp

## Arquitectura de la capa HTTP

```
Componente / Hook
  ↓
Service (xService.ts)
  ↓
Helper genérico (entityService.js / apiHelpers.js)
  ↓
fetchWithTenant (src/lib/fetchWithTenant.js)
  ↓
API Laravel /api/v2/
```

**Regla absoluta:** Nunca saltarse capas. Un componente nunca llama a un helper directamente. Un hook nunca llama a `fetchWithTenant` directamente.

---

## URL base — siempre desde config.js

```typescript
// ✅ Correcto — desde la constante de configuración
import { API_URL_V2 } from '@/configs/config';
const url = `${API_URL_V2}customers`;         // → /api-backend/api/v2/customers (dev)
                                               // → https://api.lapesquerapp.es/api/v2/customers (prod)

// ❌ Nunca hardcodear URLs
const url = 'http://localhost:8000/api/v2/customers';
const url = '/api/v2/customers';
const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v2/customers`;  // ← usar API_URL_V2 en su lugar
```

En desarrollo, `next.config.mjs` proxifica `/api-backend/*` → `http://localhost:8000/*`.

---

## fetchWithTenant — qué hace automáticamente

```typescript
// src/lib/fetchWithTenant.js — no llames a esto directamente desde hooks/componentes
// Lo que añade en cada petición:
{
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
  "X-Tenant": tenantId,          // detectado del hostname automáticamente
  "User-Agent": "lapesquerapp-frontend"
}
```

**Gestión de errores automática:**
- **401 JWT expirado/inválido** → dispara `AUTH_SESSION_EXPIRED_EVENT` → logout automático
- **401 error de validación** → deja pasar (no dispara logout)
- **403 Forbidden** → devuelve el error con `userMessage` — la UI lo gestiona
- **Logout en progreso** → suprime eventos de auth para no interrumpir el flujo

---

## Helpers genéricos — cuándo usar cada uno

```typescript
import {
  fetchEntitiesGeneric,
  deleteEntityGeneric,
  performActionGeneric,
  downloadFileGeneric,
} from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import { editEntityGeneric } from '@/services/generic/editEntityService';

// fetchEntitiesGeneric — GET (listados y detalles)
const customers = await fetchEntitiesGeneric(`${API_URL_V2}customers?page=1`, token);

// createEntityGeneric — POST (creación)
const newCustomer = await createEntityGeneric(`${API_URL_V2}customers`, data, token);

// editEntityGeneric — PUT/PATCH (edición)
const updated = await editEntityGeneric(`${API_URL_V2}customers/${id}`, data, token);

// deleteEntityGeneric — DELETE
await deleteEntityGeneric(`${API_URL_V2}customers/${id}`, token);

// performActionGeneric — POST acciones custom (aprobar, cerrar, etc.)
await performActionGeneric(`${API_URL_V2}orders/${id}/close`, {}, token);

// downloadFileGeneric — GET para descargar archivos
await downloadFileGeneric(`${API_URL_V2}orders/${id}/pdf`, token, 'pedido.pdf');
```

---

## Estructura de un service de dominio

```typescript
// src/services/domain/entities/entityService.ts

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { addFiltersToParams } from '@/helpers/params/addFiltersToParams';
import {
  fetchEntitiesGeneric,
  deleteEntityGeneric,
} from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import { editEntityGeneric } from '@/services/generic/editEntityService';
import type { CatalogListFilters, CatalogListResponse, CatalogOption } from '@/types/catalog';

const ENDPOINT = 'entities';

export const entityService = {
  async list(
    filters: CatalogListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<Entity>> {
    const token = await getAuthToken();
    const { page = 1, perPage = 15 } = pagination;
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('per_page', String(perPage));
    addFiltersToParams(queryParams, filters);
    return fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`, token);
  },

  async getById(id: number | string): Promise<Entity> {
    const token = await getAuthToken();
    return fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token);
  },

  async create(data: Record<string, unknown>): Promise<Entity> {
    const token = await getAuthToken();
    return createEntityGeneric(`${API_URL_V2}${ENDPOINT}`, data, token);
  },

  async update(id: number | string, data: Record<string, unknown>): Promise<Entity> {
    const token = await getAuthToken();
    return editEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, data, token);
  },

  async delete(id: number | string) {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token);
  },

  async deleteMultiple(ids: (number | string)[]) {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}`, token, { ids });
  },

  async getOptions(): Promise<CatalogOption[]> {
    const token = await getAuthToken();
    return fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}/options`, token);
  },
};
```

---

## Manejo de errores por código HTTP

```typescript
// 400 Bad Request — error de datos enviados
// La API devuelve: { message: "...", userMessage: "..." }
notify.error(getErrorMessage(errorData));

// 401 Unauthorized
// fetchWithTenant lo gestiona automáticamente — dispara logout
// En el service: nunca gestionar 401 manualmente

// 403 Forbidden — sin permiso para esta acción
// La API devuelve: { userMessage: "No tienes permiso para..." }
notify.error(getErrorMessage(errorData));

// 422 Unprocessable Entity — errores de validación del backend
// La API devuelve: { errors: { field_name: ["mensaje"] } }
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
if (error instanceof ApiError && error.status === 422) {
  const errorData = error.data as { errors?: Record<string, string[]> };
  if (errorData.errors) {
    setErrorsFrom422(setError, errorData.errors);  // ← mapear a campos del form
  }
}

// 500 Server Error — error interno del backend
notify.error('Error del servidor. Inténtalo de nuevo.');
// No mostrar el mensaje técnico del backend al usuario
```

---

## Extracción del mensaje de error

```typescript
// src/lib/api/apiHelpers.js — función real del proyecto
// Prioridad: userMessage > message > genérico
import { getErrorMessage } from '@/lib/api/apiHelpers';

const message = getErrorMessage(errorData);
// errorData.userMessage → "El cliente ya existe con ese NIF"
// errorData.message     → "The given data was invalid"
// fallback              → "Error desconocido"
```

---

## Paginación y filtros

```typescript
// Construcción de query params — patrón real
const queryParams = new URLSearchParams();
queryParams.set('page', String(page));
queryParams.set('per_page', String(perPage));
addFiltersToParams(queryParams, filters);
// Resultado: ?page=1&per_page=15&supplier_id=5&date_from=2024-01-01

// Respuesta paginada estándar del backend
interface ApiPaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
```

---

## Endpoints de opciones para selects

Para poblar Combobox y Select, usar siempre el endpoint `/options`:

```typescript
// ✅ Correcto — endpoint ligero para selects
await fetchEntitiesGeneric(`${API_URL_V2}customers/options`, token);
// Devuelve: Array<{ value: number, label: string }>

// ❌ Incorrecto — no usar el endpoint de listado para un select
await fetchEntitiesGeneric(`${API_URL_V2}customers?per_page=1000`, token);
```

---

## Autenticación — obtener token

```typescript
// Siempre usar getAuthToken() desde el service — nunca en el componente
import { getAuthToken } from '@/lib/auth/getAuthToken';

async list(filters = {}) {
  const token = await getAuthToken();  // ← obtiene el accessToken de NextAuth
  return fetchEntitiesGeneric(url, token);
}
```

---

## Prohibiciones

```typescript
// ❌ NUNCA llamar a fetch() directamente
await fetch(url, options);

// ❌ NUNCA importar fetchWithTenant en un componente o hook
import { fetchWithTenant } from '@/lib/fetchWithTenant';

// ❌ NUNCA hardcodear el token
headers: { Authorization: 'Bearer eyJ...' }

// ❌ NUNCA añadir X-Tenant manualmente
headers: { 'X-Tenant': 'brisamar' }

// ❌ NUNCA asumir la estructura de una respuesta de API sin verificar en types/
const name = response.data.customer_full_name;  // ← verificar que existe en Customer type
```
