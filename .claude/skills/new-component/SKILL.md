# Skill: Nuevo Componente — La PesquerApp

## Cuándo usar esta skill

Cuando necesites crear un componente React reutilizable que no existe en shadcn/ui ni en `src/components/Shared/`.

---

## Antes de crear — verificar primero

```
1. ¿Existe en src/components/ui/?       → usar el primitivo shadcn
2. ¿Existe en src/components/Shared/?   → usar o extender el existente
3. ¿Es solo una variante de Button/Badge/Card? → usar variante de shadcn
4. ¿Solo cambia estilos? → usar prop className en el componente existente
```

Solo crear un componente nuevo si ninguna de las opciones anteriores aplica.

---

## Template base con TypeScript

```typescript
// src/components/Admin/[Módulo]/MyNewComponent.tsx
'use client';  // Omitir si es Server Component

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';  // helper de clsx + tailwind-merge
import type { MyEntity } from '@/types/myEntity';

// Props — siempre con interface, nunca type inline
interface MyNewComponentProps {
  // Requeridos
  items: MyEntity[];
  onItemClick: (item: MyEntity) => void;

  // Opcionales con defaults razonables
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export default function MyNewComponent({
  items,
  onItemClick,
  isLoading = false,
  emptyMessage = 'No hay elementos.',
  className,
}: MyNewComponentProps) {
  // Estado local solo para UI (no para datos del servidor)
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Loading state — patrón Skeleton del proyecto
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground text-center py-8', className)}>
        {emptyMessage}
      </p>
    );
  }

  // Render principal
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <MyNewComponentRow
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onClick={() => {
            setSelectedId(item.id as number);
            onItemClick(item);
          }}
        />
      ))}
    </div>
  );
}

// Sub-componentes locales — solo si son pequeños y solo se usan aquí
interface MyNewComponentRowProps {
  item: MyEntity;
  isSelected: boolean;
  onClick: () => void;
}

function MyNewComponentRow({ item, isSelected, onClick }: MyNewComponentRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 border rounded-md cursor-pointer',
        'hover:bg-muted/50 transition-colors',
        isSelected && 'border-primary bg-primary/5'
      )}
      onClick={onClick}
    >
      <span className="font-medium text-sm">{String(item.name)}</span>
      <Badge variant={isSelected ? 'default' : 'outline'}>
        {String(item.id)}
      </Badge>
    </div>
  );
}
```

---

## Props: reglas del proyecto

```typescript
// ✅ Interface siempre — nunca type para props
interface ComponentProps {
  required: string; // requerido
  optional?: string; // opcional
  withDefault?: boolean; // opcional con default en la firma
  callback?: () => void; // callback opcional
  children?: React.ReactNode; // children si aplica
  className?: string; // siempre añadir si el componente puede necesitar override de estilos
}

// ✅ Desestructurar con defaults en la firma
function Component({ required, optional, withDefault = false }: ComponentProps) {}

// ❌ No usar defaultProps en componentes funcionales (obsoleto)
Component.defaultProps = { withDefault: false };
```

---

## Cuándo usar React.memo

```typescript
// ✅ Usar cuando el componente:
// 1. Es un ítem de una lista grande (>20 elementos)
// 2. Recibe callbacks como props (combinado con useCallback en el padre)
// 3. El render es costoso y las props cambian raramente

export default React.memo(function MyListItem({ item, onSelect }: ItemProps) {
  return (
    <div onClick={() => onSelect(item.id)}>
      {item.name}
    </div>
  );
});

// ❌ No usar React.memo para:
// - Componentes simples de layout
// - Componentes que siempre reciben props nuevas
// - Optimización prematura sin problema medido
```

---

## Cómo conectar con un hook existente

```typescript
// El componente recibe datos como props (patrón preferido para componentes reutilizables)
function CustomerList({ customers, isLoading }: { customers: Customer[]; isLoading: boolean }) {
  // No llama al hook directamente — más reutilizable y testeable
}

// El componente padre provee los datos del hook
function CustomerListPageClient() {
  const { data: customers, isLoading } = useCustomersList();
  return <CustomerList customers={customers} isLoading={isLoading} />;
}

// EXCEPCIÓN: componentes de pantalla completa (PageClient) sí llaman hooks directamente
function CustomerListPageClient() {
  const { data, isLoading, meta } = useCustomersList();
  // ...
}
```

---

## Dónde colocar el componente

```
Componente de UI pura (sin lógica de dominio):
→ src/components/Shared/[ComponentName].tsx    (si se usa en múltiples módulos)

Componente de feature de admin:
→ src/components/Admin/[Módulo]/[ComponentName].tsx

Componente de comercial/field/warehouse:
→ src/components/[Rol]/[ComponentName].tsx

Variante/extensión de primitivo shadcn:
→ src/components/Shadcn/[ComponentName]/   (como el Combobox existente)
```

---

## Ejemplo: componente conectado a un hook de mutación

```typescript
// src/components/Admin/Customers/CustomerStatusToggle.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomerToggleActive } from '@/hooks/useCustomerToggleActive';
import type { Customer } from '@/types/catalog';

interface CustomerStatusToggleProps {
  customer: Customer;
  onSuccess?: () => void;
}

export default function CustomerStatusToggle({ customer, onSuccess }: CustomerStatusToggleProps) {
  const { mutate: toggleActive, isPending } = useCustomerToggleActive({ onSuccess });
  const isActive = Boolean(customer.active);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Activo' : 'Inactivo'}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => toggleActive(customer.id as number)}
      >
        {isPending ? 'Cambiando...' : isActive ? 'Desactivar' : 'Activar'}
      </Button>
    </div>
  );
}
```
