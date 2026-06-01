# Reglas de Hooks — La PesquerApp

## Nomenclatura obligatoria

```typescript
use[Entity]List       // Hook de listado paginado
use[Entity]           // Hook de detalle + lógica de formulario
use[Action]Form       // Hook de formulario específico (create/edit)
use[Utility]          // Hook de utilidad (useDebounce, useMobile, useIsMobile)
```

Ejemplos reales del proyecto:

- `useCustomersList` — listado de clientes con paginación
- `useCustomer` — detalle de cliente
- `useOrderCreateForm` — formulario de creación de pedido
- `useDebounce` — utilidad de debounce
- `useMe` — usuario autenticado actual

---

## Patrón obligatorio para hooks de listado

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { customerListKeys } from '@/lib/routes/queryKeys';
import { customerService } from '@/services/domain/customers/customerService';
import type { CatalogListFilters, PaginationMeta, Customer } from '@/types/catalog';

export function useCustomersList(
  params: {
    filters?: CatalogListFilters;
    page?: number;
    perPage?: number;
    enabled?: boolean;
  } = {}
) {
  const { filters = {}, page = 1, perPage = 12, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: customerListKeys.list(tenantId, filters as Record<string, unknown>, page, perPage),
    queryFn: () => customerService.list(filters, { page, perPage }),
    enabled: !!tenantId && enabled,
  });

  const data = response?.data ?? [];
  const meta = response?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
  };

  return {
    data: Array.isArray(data) ? data : [],
    meta: meta as PaginationMeta,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
```

**Contrato de retorno obligatorio para hooks de listado:**

```typescript
{ data: T[], meta: PaginationMeta, isLoading: boolean, error: string | null, refetch: () => void }
```

---

## Query Keys — regla ESLint activa

El proyecto tiene una regla ESLint que **prohíbe arrays literales en `queryKey`**.

```typescript
// ❌ PROHIBIDO — ESLint lo marcará como warning
queryKey: ['customers', tenantId, filters];

// ✅ OBLIGATORIO — usar siempre una factory de queryKeys.ts
import { customerListKeys } from '@/lib/routes/queryKeys';
queryKey: customerListKeys.list(tenantId, filters, page, perPage);
```

Si necesitas un nuevo tipo de query, añadir la factory en `src/lib/routes/queryKeys.ts`.

---

## TanStack Query — convenciones del proyecto

```typescript
// staleTime por tipo de dato
staleTime: 5 * 60 * 1000,   // 5 minutos — usuario actual (useMe), datos de sesión
staleTime: 60 * 1000,        // 1 minuto — datos cambiantes (pedidos, palets)
staleTime: undefined,         // default (0) — datos muy volátiles

// enabled: siempre condicionar al tenant y al token
enabled: !!tenantId && enabled,
enabled: Boolean(token) && Boolean(tenantId),

// select: transformar datos si el backend devuelve wrapping extra
select: (response) => ({
  data: response.data,
  meta: response.meta,
}),
```

---

## Mutaciones — patrón de invalidación

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerListKeys } from '@/lib/routes/queryKeys';
import { customerService } from '@/services/domain/customers/customerService';
import { notify } from '@/lib/notifications';

export function useCustomerCreate() {
  const queryClient = useQueryClient();
  const tenantId = getCurrentTenant();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => customerService.create(data),
    onSuccess: () => {
      // Invalidar el listado para que se recargue
      queryClient.invalidateQueries({
        queryKey: customerListKeys.listPrefix(tenantId),
      });
      notify.success('Cliente creado correctamente');
    },
    onError: (error) => {
      notify.error(getErrorMessage(error));
    },
  });
}
```

---

## Nunca estado local para datos del servidor

```typescript
// ❌ PROHIBIDO — estado local para datos que vienen del servidor
const [customers, setCustomers] = useState<Customer[]>([]);
useEffect(() => {
  fetchCustomers().then(setCustomers);
}, []);

// ✅ CORRECTO — TanStack Query gestiona el estado del servidor
const { data: customers, isLoading } = useCustomersList();
```

---

## Hooks gigantes — regla DURA

Los siguientes hooks NO deben recibir más lógica directamente:

| Hook                          | Tamaño | Sub-hook destino                    |
| ----------------------------- | ------ | ----------------------------------- |
| `src/hooks/useOrder.js`       | ~40 KB | `src/hooks/orders/useOrderXxx.ts`   |
| `src/hooks/usePallet.js`      | ~48 KB | `src/hooks/pallets/usePalletXxx.ts` |
| `src/hooks/useLabelEditor.ts` | ~52 KB | `src/hooks/labels/useLabelXxx.ts`   |

```typescript
// ❌ NUNCA añadir lógica directamente al hook gigante
// src/hooks/useOrder.js
export function useOrder() {
  // ... 40KB de lógica
  const newFeatureLogic = () => {
    /* ← NO */
  };
}

// ✅ Crear sub-hook nuevo y usarlo desde el hook gigante o desde el componente
// src/hooks/orders/useOrderProfitability.ts
export function useOrderProfitability(orderId: number) {
  return useQuery({
    queryKey: ['order-profitability', orderId],
    queryFn: () => orderService.getProfitability(orderId),
  });
}
```

---

## Manejo de errores en hooks

```typescript
// En hooks de mutación — capturar y mapear errores 422
const { mutate, isPending } = useMutation({
  mutationFn: customerService.create,
  onSuccess: (data) => {
    notify.success('Cliente creado');
    onSuccess?.(data);
  },
  onError: (error: unknown) => {
    if (error instanceof ApiError && error.status === 422) {
      setErrorsFrom422(setError, (error.data as { errors: Record<string, string[]> }).errors);
    } else {
      notify.error(getErrorMessage(error));
    }
  },
});
```

---

## Dirección de dependencias en hooks

Un hook solo puede importar de:

- Servicios (`@/services/domain/`)
- Helpers genéricos (`@/lib/`)
- Tipos (`@/types/`)
- Otros hooks de utilidad (`useDebounce`, `useMobile`)

Un hook **no puede** importar de:

- Componentes React
- `@/configs/entitiesConfig.js`
- Otros hooks de dominio (evitar acoplamiento entre hooks de entidades distintas)
