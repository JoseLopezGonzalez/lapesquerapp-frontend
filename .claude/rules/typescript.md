# Reglas TypeScript — La PesquerApp

## Configuración activa

- **strict: true** — todos los checks estrictos habilitados
- **target: ES2017** — sintaxis de salida
- **paths:** `@/*` → `src/*` · `@lib/*` → `src/lib/*`
- **allowJs: true** — permite JS legacy, pero **no crear nuevos .js**

---

## Regla fundamental: TypeScript first

```typescript
// ❌ Nunca crear archivos nuevos en JS
src/services/domain/products/helper.js

// ✅ Siempre en TypeScript
src/services/domain/products/helper.ts

// Si tocas un .js legacy por cualquier razón, migrarlo a .ts en ese mismo commit
```

---

## Interfaces vs Types

### Usa `interface` para shapes de datos de API y objetos de dominio

```typescript
// ✅ Entidades del backend
interface Customer {
  id: number | string;
  name: string;
  email?: string;
  [key: string]: unknown;  // permite campos extra del backend sin romper el tipo
}

// ✅ Respuestas paginadas de la API
interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

interface CatalogListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ✅ Props de componentes
interface CustomerCardProps {
  customer: Customer;
  onEdit?: (id: number) => void;
  isLoading?: boolean;
}
```

### Usa `type` para uniones, utilidades e intersecciones

```typescript
// ✅ Uniones de roles
type RoleKey =
  | 'administrador'
  | 'direccion'
  | 'tecnico'
  | 'operario'
  | 'comercial'
  | 'repartidor_autoventa';

// ✅ Alias de tipos de utilidad
type CatalogOption = { value: number | string; label: string };
type ApiFilters = Record<string, unknown>;

// ✅ Discriminated unions para estados de UI
type FormState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: unknown }
  | { status: 'error'; message: string };
```

---

## Tipado de respuestas de API

### Patrón real del proyecto

```typescript
// src/types/catalog.ts — tipos base reutilizables
export interface CatalogListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CatalogOption {
  value: number | string;
  label: string;
}

// En el service — tipar el return del helper genérico
async list(
  filters: CatalogListFilters = {},
  pagination: { page?: number; perPage?: number } = {}
): Promise<CatalogListResponse<Customer>> {
  // ...
  return fetchEntitiesGeneric(url, token);
}
```

### Patrón de [key: string]: unknown

Los tipos de entidades usan `[key: string]: unknown` para aceptar campos extra del backend:

```typescript
// ✅ Permite campos extra sin necesidad de tipar todo el backend
interface Product {
  id: number | string;
  name: string;
  sku?: string;
  [key: string]: unknown;  // campos como 'pivot', relaciones anidadas, etc.
}
```

---

## Manejo de errores de API

### Clase ApiError (real del proyecto)

```typescript
// src/lib/api/apiHelpers.js — clase real del proyecto
export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// ✅ Tipado en catch
try {
  await customerService.create(data);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 422 && (error.data as { errors?: Record<string, string[]> })?.errors) {
      setErrorsFrom422(setError, (error.data as { errors: Record<string, string[]> }).errors);
    } else {
      notify.error(getErrorMessage(error.data));
    }
  }
}
```

---

## Prohibiciones estrictas

```typescript
// ❌ any sin justificación
const data: any = response;
function process(input: any) {}

// ❌ @ts-ignore sin comentario explicativo
// @ts-ignore

// ❌ as any
const result = something as any;

// ✅ Alternativas correctas
const data: unknown = response;  // luego narrowing
// @ts-ignore — [RAZÓN ESPECÍFICA: librería X no exporta tipo correcto en versión Y]
const result = something as SpecificType;  // cast con tipo concreto
```

---

## Naming conventions detectadas en el proyecto

```typescript
// Componentes: PascalCase
AdminCustomerDetailPageClient
OrdersManager
EntityClient
CreateOrderForm

// Hooks: camelCase con prefijo use
useCustomersList       // listados paginados
useCustomer            // detalle + formulario
useOrderCreateForm     // formulario específico
useDebounce            // utilidad

// Services: camelCase con sufijo Service
customerService
productService
palletService

// Types/Interfaces: PascalCase
Customer
PaginationMeta
CatalogListResponse<T>
CatalogOption

// Archivos de tipos: camelCase.ts
catalog.ts
crm.ts
labelEditor.ts

// Constantes: SCREAMING_SNAKE_CASE
API_URL_V2
AUTH_SESSION_EXPIRED_EVENT

// Query keys: camelCase con sufijo Keys
customerListKeys
productOptionKeys
productionQueryKeys
```

---

## Imports y path aliases

```typescript
// ✅ Usar siempre el alias @/ (o @lib/ para src/lib/)
import { customerService } from '@/services/domain/customers/customerService';
import { notify } from '@/lib/notifications';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

// ❌ Nunca paths relativos cruzando carpetas principales
import { customerService } from '../../../services/domain/customers/customerService';
```

---

## Componentes — Client vs Server

```typescript
// Server Component (por defecto — sin directiva)
// ✅ Cuando: solo fetching de datos, sin estado, sin event handlers
export default async function CustomerPage({ params }) {
  const customer = await customerService.getById(params.id);
  return <CustomerDetail customer={customer} />;
}

// Client Component — añadir 'use client' CON comentario si no es obvio
'use client';
// Necesita 'use client': usa useSession, useState, useQuery
import { useCustomersList } from '@/hooks/useCustomersList';
export default function CustomerListClient() { ... }
```

---

## ⚠️ Deuda técnica de TypeScript

El proyecto mezcla `.js` y `.ts`. Al tocar un archivo `.js` legacy:
1. Renombrarlo a `.ts` (o `.tsx` si contiene JSX)
2. Añadir tipos a parámetros y returns
3. Corregir los errores de TypeScript que aparezcan
4. No parchear tipado con `any` — si hay duda, usar `unknown`
