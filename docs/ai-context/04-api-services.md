# API Services — La PesquerApp

## Backend

- API Laravel bajo `/api/v2/`
- Autenticación: Bearer token (JWT gestionado por NextAuth)
- Multi-tenant: cabecera `X-Tenant` en cada petición
- URL base: `${API_URL_V2}` definida en `src/configs/config.js`

En desarrollo, las peticiones a `/api-backend/*` se proxifican a `http://localhost:8000/*` (ver `next.config.mjs`).

---

## Servicios de dominio existentes (31)

Antes de crear un nuevo servicio, verificar que no existe ya en `src/services/domain/`:

```
activity-logs       boxes               capture-zones
cebo-dispatches     countries           customers
employees           external-users      field-operators
fishing-gears       incoterms           orders
pallets             payment-terms       product-categories
product-families    productions         products
punches             raw-material-receptions  roles
salespeople         sessions            species
stores              supplier-liquidations    suppliers
taxes               transports          users
```

Cada uno sigue el patrón `src/services/domain/{entidad}/{entidad}Service.ts`.

---

## Patrón de servicio

```typescript
// Ejemplo: customerService
const customerService = {
  async list(filters = {}, pagination = {}) {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;
    const queryParams = new URLSearchParams();
    addFiltersToParams(queryParams, filters); // helper de src/helpers/
    const url = `${API_URL_V2}customers?${queryParams.toString()}`;
    return fetchEntitiesGeneric(url, token); // helper genérico
  },

  async getById(id) {
    const token = await getAuthToken();
    return fetchEntitiesGeneric(`${API_URL_V2}customers/${id}`, token);
  },

  async create(data) {
    const token = await getAuthToken();
    return createEntityGeneric(`${API_URL_V2}customers`, data, token);
  },

  async update(id, data) {
    const token = await getAuthToken();
    return editEntityGeneric(`${API_URL_V2}customers/${id}`, data, token);
  },

  async delete(id) {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${API_URL_V2}customers/${id}`, token);
  },

  async getOptions() {
    // Listado ligero para selects/combobox — minimal payload
    const token = await getAuthToken();
    return fetchEntitiesGeneric(`${API_URL_V2}customers/options`, token);
  },
};
```

---

## Helpers genéricos (`src/services/generic/`)

Los servicios de dominio no hacen fetch directamente. Usan:

| Helper                                      | Uso                       |
| ------------------------------------------- | ------------------------- |
| `fetchEntitiesGeneric(url, token)`          | GET — listados y detalles |
| `createEntityGeneric(url, data, token)`     | POST — creación           |
| `editEntityGeneric(url, data, token)`       | PUT/PATCH — edición       |
| `deleteEntityGeneric(url, token)`           | DELETE — eliminación      |
| `performActionGeneric(url, data, token)`    | POST — acciones custom    |
| `downloadFileGeneric(url, token, fileName)` | GET — descarga de archivo |

Todos estos helpers llaman a `fetchWithTenant()` internamente.

---

## fetchWithTenant — capa centralizada

`src/lib/fetchWithTenant.js` es el único punto de salida HTTP del frontend.

Añade automáticamente:

- `X-Tenant: {tenant}` — extraído del subdominio del Host
- `Authorization: Bearer {token}` — si se pasa token
- `Content-Type: application/json`

Gestiona automáticamente:

- **401 JWT expirado/inválido** → dispara `AUTH_SESSION_EXPIRED_EVENT` → logout automático
- **401 error de validación** → deja pasar (no dispara logout)
- **403 Forbidden** → devuelve el error con `userMessage` — la UI lo gestiona
- **Logout en progreso** → suprime eventos de auth para no interrumpir el flujo

**Regla crítica**: nunca usar `fetch()` o `axios` directamente en componentes, hooks o servicios. Siempre pasar por los helpers genéricos o por `fetchWithTenant`.

---

## Cabeceras de autenticación

```javascript
// Cómo construye las cabeceras fetchWithTenant internamente:
{
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
  "X-Tenant": tenantId,               // detectado del Host
  "User-Agent": "lapesquerapp-frontend"
}
```

---

## Gestión de errores

### Estructura de error del backend

```json
{
  "message": "Error genérico",
  "userMessage": "Mensaje amigable para mostrar al usuario",
  "errors": {
    "field_name": ["El campo es obligatorio"]
  }
}
```

### En el frontend

- Usar `getErrorMessage(errorData)` para extraer el mensaje más apropiado (`userMessage` > `message`).
- Errores 422 con `errors{}`: mapear con `setErrorsFrom422(setError, errorData.errors)`.
- Errores de red o inesperados: mostrar toast de error genérico.
- **No mostrar al usuario mensajes de error técnicos del backend** que contengan rutas, SQL, etc.

---

## Paginación y filtros

Los endpoints de listado aceptan query params estándar:

```
GET /api/v2/customers?page=1&per_page=15&search=brisamar&supplier_id=5
```

Los servicios usan `URLSearchParams` y helpers como `addFiltersToParams()` para construir la query string.

La respuesta paginada tiene estructura:

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 72
  }
}
```

---

## Endpoints de opciones (selects/combobox)

Para poblar selects y combobox, muchas entidades exponen un endpoint ligero:

```
GET /api/v2/customers/options
GET /api/v2/suppliers/options
GET /api/v2/products/options
```

Respuesta esperada: `CatalogOption[]` — array de `{ id, name }` o `{ value, label }`.

**No usar el endpoint de listado completo para poblar un select** — usar siempre el endpoint `/options` si existe.

---

## Servicios especiales

Algunos servicios tienen métodos adicionales más allá del CRUD estándar:

- **`orderService.ts`**: `getActiveOrders()`, `getRankingStats()`, `getSalesChartData()`
- **`palletService.ts`**: 15+ métodos para gestión de palets
- **`crmService.ts`**: operaciones CRM, listado de pedidos comerciales
- **`labelService.ts`**: generación y gestión de etiquetas
- **`costService.js`**: cálculos de coste

---

## Reglas para agentes

1. **Nunca llamar a `fetch()` directamente** desde un componente o hook.
2. **Siempre buscar el servicio de dominio existente** antes de crear uno nuevo.
3. **Los IDs de tenant y auth se gestionan automáticamente** — no manipularlos en los componentes.
4. **Para selects**: usar el método `getOptions()` del servicio, no `list()`.
5. **Para descargas de archivos**: usar `downloadFileGeneric()`, no hacer fetch manual.
6. **No asumir campos del payload** sin verificar los tipos en `src/types/` o en el servicio existente.
7. **Errores 422**: siempre mapear con `setErrorsFrom422` si hay campos de formulario afectados.
8. **No exponer el token** en logs, estado de React o respuestas de API routes.
