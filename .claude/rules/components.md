# Reglas de Componentes — La PesquerApp

## Estructura interna de un componente

```typescript
// 1. Directiva (solo si es Client Component)
'use client';

// 2. Imports externos (React, librerías)
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

// 3. Imports internos (por capas: components → hooks → services → lib → types)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomersList } from '@/hooks/useCustomersList';
import { notify } from '@/lib/notifications';
import type { Customer, CatalogListFilters } from '@/types/catalog';

// 4. Types / Interfaces de props
interface CustomerTableProps {
  filters?: CatalogListFilters;
  onRowClick?: (customer: Customer) => void;
}

// 5. Componente principal
export default function CustomerTable({ filters = {}, onRowClick }: CustomerTableProps) {
  // 5a. Hooks (en este orden: context, query, form, local state)
  const { data, meta, isLoading, error, refetch } = useCustomersList({ filters });

  // 5b. Derived state / computed values
  const isEmpty = !isLoading && data.length === 0;

  // 5c. Handlers
  const handleRowClick = (customer: Customer) => {
    onRowClick?.(customer);
  };

  // 5d. Early returns (loading, error, empty)
  if (isLoading) return <CustomerTableSkeleton />;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (isEmpty) return <EmptyState title="Sin clientes" description="Ajusta los filtros." />;

  // 5e. Render principal
  return (
    <div>
      {data.map((customer) => (
        <div key={customer.id} onClick={() => handleRowClick(customer)}>
          {customer.name}
        </div>
      ))}
    </div>
  );
}

// 6. Sub-componentes locales (si son pequeños y solo se usan aquí)
function CustomerTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
```

---

## Server Component vs Client Component

### Server Component por defecto (sin directiva)

Usar cuando el componente:

- Solo recibe props sin estado interactivo
- Hace fetch de datos en el servidor (Next.js App Router)
- No usa hooks de React (useState, useEffect, useQuery, etc.)
- No registra event handlers directamente

```typescript
// ✅ Server Component — page.tsx o componentes de layout
export default async function CustomersPage() {
  return <CustomersPageClient />;  // delega al client component
}
```

### Client Component — `'use client'`

Requerido cuando el componente:

- Usa `useSession`, `useQuery`, `useState`, `useEffect`, `useForm`
- Registra event handlers (`onClick`, `onChange`, etc.)
- Usa contextos de React
- Usa librerías que dependen del DOM

```typescript
'use client';
// Requiere 'use client': usa useQuery y event handlers interactivos
```

**Convención del proyecto:** Los pages de App Router son Server Components que importan un `XxxPageClient.tsx` que es el Client Component real. Ejemplo: `page.tsx` → `CustomersPageClient.tsx`.

---

## Cuándo crear un componente nuevo vs extender uno existente

### Extender primero — crear solo si es necesario

Antes de crear un componente nuevo:

1. Buscar en `src/components/ui/` — shadcn ya tiene Button, Input, Dialog, Badge, Card, Table, Skeleton, Select, Combobox, DatePicker…
2. Buscar en `src/components/Shared/` — puede haber componentes reutilizables
3. Buscar en el módulo de admin correspondiente (`src/components/Admin/[Módulo]/`)

### Criterios para crear componente nuevo

```
✅ Crear si:
- La UI se repite en 3+ lugares con la misma lógica
- El componente encapsula una responsabilidad única y clara
- Mide más de ~80 líneas en el componente padre

❌ No crear si:
- Es una variante de Button/Badge — usar variantes de shadcn
- Solo cambia clases CSS — usar props className
- Es código de UI que solo se usa una vez y es pequeño
```

---

## Props: required vs optional

```typescript
interface MyComponentProps {
  // Required: sin valor por defecto razonable
  id: number;
  title: string;
  onSubmit: (data: FormData) => void;

  // Optional: tienen valor por defecto o pueden no existir
  description?: string;
  isLoading?: boolean; // default: false
  className?: string; // para extensión de estilos
  onCancel?: () => void; // callback opcional
}

// ✅ Desestructurar con defaults en la firma
function MyComponent({ id, title, isLoading = false, className }: MyComponentProps) {}
```

---

## Loading states — patrón obligatorio

El proyecto usa un único patrón de loading: `Skeleton` + `isLoading` de TanStack Query.

```typescript
// ✅ Patrón real del proyecto
const { data, isLoading, error } = useCustomersList();

if (isLoading) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

// ❌ No usar spinners sueltos o divs con "Cargando..."
// ❌ No usar Suspense para loading de datos del servidor en client components
```

---

## Manejo de errores en componentes

```typescript
// ✅ Patrón de error display
if (error) {
  return (
    <p className="text-red-500 text-sm p-4">
      {error || 'Error al cargar los datos.'}
    </p>
  );
}

// ✅ Errores de formulario
{errors.supplier_id && (
  <p className="text-red-400 text-xs pt-1">* {errors.supplier_id.message}</p>
)}

// ✅ Toasts para errores de acciones
try {
  await customerService.delete(id);
  notify.success('Cliente eliminado correctamente');
} catch (error) {
  notify.error(getErrorMessage(error));
}
```

---

## Reglas de UI específicas del proyecto

```typescript
// ✅ Siempre usar componentes shadcn de src/components/ui/
import { Button } from '@/components/ui/button'; // 265+ usos
import { Badge } from '@/components/ui/badge'; // 100+ usos
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// ✅ Combobox para selects con búsqueda de API
// Select para listas estáticas pequeñas

// ✅ Confirmación antes de acciones destructivas
// Dialog de confirmación siempre antes de delete

// ✅ Acciones de botón
// Primary (crear, guardar): <Button>
// Destructivo (eliminar): <Button variant="destructive">
// Secundario (cancelar): <Button variant="outline"> o variant="ghost"

// ❌ No añadir animaciones Framer Motion a pantallas operativas
// ❌ No usar colores arbitrarios — usar Tailwind tokens
// ❌ No duplicar componentes shadcn — siempre importar de @/components/ui/
```

---

## Lógica de negocio — nunca en el componente

```typescript
// ❌ Lógica de negocio inline en el componente
function OrderForm() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/v2/orders') // ← PROHIBIDO: fetch directo
      .then((r) => r.json())
      .then(setOrders);
  }, []);

  const calculateTotal = (items) => {
    /* lógica de negocio */
  };
  // ...
}

// ✅ Lógica extraída a un hook
function OrderForm() {
  const { data: orders, isLoading } = useOrdersList();
  const { total, submit, isSubmitting } = useOrderCreateForm();
  // El componente solo renderiza
}
```

---

## Localización del componente en la estructura de carpetas

```
Componente reutilizable de UI pura:
→ src/components/ui/           (solo si es primitivo shadcn)
→ src/components/Shared/       (si se usa en múltiples módulos)

Componente de feature de admin:
→ src/components/Admin/[Módulo]/[ComponentName].tsx

Componente de comercial/field/warehouse:
→ src/components/[Rol]/[ComponentName].tsx

Page client component:
→ src/components/Admin/[Módulo]/[Entity]PageClient.tsx
  (colocado junto a la página o en el módulo correspondiente)
```
