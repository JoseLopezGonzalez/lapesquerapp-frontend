# Skill: Nuevo Service — La PesquerApp

## Cuándo usar esta skill

Cuando necesites crear un service de dominio para una entidad que no existe todavía en `src/services/domain/`.

---

## Verificar primero que no existe

```bash
# Los 34 services existentes:
ls src/services/domain/

# activity-logs       boxes               capture-zones
# cebo-dispatches     countries           customers
# employees           external-users      field-operators
# fishing-gears       incoterms           orders
# pallets             payment-terms       product-categories
# product-families    productions         products
# punches             raw-material-receptions  roles
# salespeople         sessions            species
# stores              supplier-liquidations    suppliers
# taxes               transports          users
# cost-regularization prospect-categories
```

Si el service existe, usar el existente. Si necesitas un método nuevo, añadirlo al service existente.

---

## Template completo: `[entity]Service.ts`

```typescript
// src/services/domain/my-entities/myEntityService.ts
import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { addFiltersToParams } from '@/helpers/params/addFiltersToParams';
import {
  fetchEntitiesGeneric,
  deleteEntityGeneric,
  performActionGeneric,
  downloadFileGeneric,
} from '@/services/generic/entityService';
import { createEntityGeneric } from '@/services/generic/createEntityService';
import { editEntityGeneric } from '@/services/generic/editEntityService';
import type { CatalogListFilters, CatalogListResponse, CatalogOption } from '@/types/catalog';
import type { MyEntity } from '@/types/myEntity';

// Endpoint base — siempre como constante
const ENDPOINT = 'my-entities';

export const myEntityService = {
  /**
   * Listado paginado con filtros opcionales.
   * Usado por useMyEntityList hook.
   */
  async list(
    filters: CatalogListFilters = {},
    pagination: { page?: number; perPage?: number } = {}
  ): Promise<CatalogListResponse<MyEntity>> {
    const token = await getAuthToken();
    const { page = 1, perPage = 15 } = pagination;
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('per_page', String(perPage));
    addFiltersToParams(queryParams, filters);
    return fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`, token);
  },

  /**
   * Obtiene un registro por ID.
   * Usado en páginas de detalle.
   */
  async getById(id: number | string): Promise<MyEntity> {
    const token = await getAuthToken();
    return fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token);
  },

  /**
   * Crea un nuevo registro.
   * El payload es Record<string, unknown> para flexibilidad.
   */
  async create(data: Record<string, unknown>): Promise<MyEntity> {
    const token = await getAuthToken();
    return createEntityGeneric(`${API_URL_V2}${ENDPOINT}`, data, token);
  },

  /**
   * Actualiza un registro existente.
   */
  async update(id: number | string, data: Record<string, unknown>): Promise<MyEntity> {
    const token = await getAuthToken();
    return editEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, data, token);
  },

  /**
   * Elimina un registro.
   */
  async delete(id: number | string) {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}/${id}`, token);
  },

  /**
   * Elimina múltiples registros.
   */
  async deleteMultiple(ids: (number | string)[]) {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}${ENDPOINT}`, token, { ids });
  },

  /**
   * Opciones para selects/combobox.
   * Devuelve Array<{ value, label }> — payload ligero.
   */
  async getOptions(): Promise<CatalogOption[]> {
    const token = await getAuthToken();
    return fetchEntitiesGeneric(`${API_URL_V2}${ENDPOINT}/options`, token);
  },

  // Métodos adicionales según lo que exponga el backend:

  /**
   * Acción custom del backend (aprobar, cerrar, confirmar, etc.)
   */
  async performAction(id: number | string, action: string, data: Record<string, unknown> = {}) {
    const token = await getAuthToken();
    return performActionGeneric(`${API_URL_V2}${ENDPOINT}/${id}/${action}`, data, token);
  },

  /**
   * Descarga un archivo (PDF, Excel, etc.)
   */
  async downloadReport(id: number | string, fileName: string) {
    const token = await getAuthToken();
    return downloadFileGeneric(`${API_URL_V2}${ENDPOINT}/${id}/report`, token, fileName);
  },
};
```

---

## Tipos de la entidad

```typescript
// src/types/myEntity.ts — crear si no existe
import type { CatalogOption } from './catalog';

export interface MyEntity {
  id: number | string;
  name: string;
  // Campos conocidos del backend:
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Relaciones anidadas (si las devuelve el backend con ?with=relation):
  supplier?: { id: number; name: string };
  // Permite campos extra del backend sin romper el tipo:
  [key: string]: unknown;
}

// Payload de creación (puede diferir de la entidad completa)
export interface MyEntityCreatePayload {
  name: string;
  supplier_id?: number;
  // snake_case para los IDs de relación
}
```

---

## Registrar el service en entityServiceMapper

Si el EntityClient necesita usar este service, añadirlo al mapper:

```javascript
// src/services/domain/entityServiceMapper.js
// ⚠️ Este archivo está en JS — añadir con TODO de migración

import { myEntityService } from './my-entities/myEntityService';
// TODO: migrate to .ts

const serviceMap = {
  // ... servicios existentes ...
  'my-entities': myEntityService,
};
```

---

## Métodos mínimos obligatorios

Todo service de dominio debe exponer estos 5 métodos:

| Método                      | HTTP      | Endpoint                             |
| --------------------------- | --------- | ------------------------------------ |
| `list(filters, pagination)` | GET       | `/${ENDPOINT}?page=X&per_page=Y&...` |
| `getById(id)`               | GET       | `/${ENDPOINT}/${id}`                 |
| `create(data)`              | POST      | `/${ENDPOINT}`                       |
| `update(id, data)`          | PUT/PATCH | `/${ENDPOINT}/${id}`                 |
| `delete(id)`                | DELETE    | `/${ENDPOINT}/${id}`                 |

Y este método opcional muy recomendado:

- `getOptions()` → GET `/${ENDPOINT}/options` (para selects/combobox)

---

## Errores que NO debes cometer

```typescript
// ❌ fetch() directo en el service
const res = await fetch(`${API_URL_V2}${ENDPOINT}`);

// ❌ Gestionar el token manualmente en el componente
// Los componentes nunca llaman a getAuthToken()

// ❌ Añadir X-Tenant manualmente
headers: { 'X-Tenant': tenantId }  // fetchWithTenant lo hace solo

// ❌ Inventar campos que no existen en el backend
return { ...data, internalField: 'fabricado' };

// ❌ Asumir estructura de respuesta sin verificar
// Antes de tipar, inspeccionar la respuesta real o el servicio similar más cercano

// ❌ Crear el archivo en .js
// src/services/domain/my-entity/myEntityService.js  ← PROHIBIDO
// src/services/domain/my-entity/myEntityService.ts  ← CORRECTO
```
