# Skill: Nueva Página — La PesquerApp

## Cuándo usar esta skill

Cuando necesites crear una pantalla completa nueva para un módulo del admin (o comercial/warehouse/field). La página incluye: ruta Next.js, componente principal, hook de datos y, si es una entidad nueva, el service.

---

## Checklist de archivos a crear

```
Para una entidad nueva "suppliers-dashboard" en admin:

1. [ ] src/types/suppliersDashboard.ts          ← tipos de la entidad (si no existen)
2. [ ] src/services/domain/[entity]/[entity]Service.ts  ← service (si no existe)
3. [ ] src/lib/routes/queryKeys.ts               ← añadir factory de queryKeys
4. [ ] src/hooks/use[Entity]List.ts              ← hook de listado
5. [ ] src/components/Admin/[Módulo]/[Entity]PageClient.tsx  ← componente principal
6. [ ] src/app/admin/[entity]/page.tsx           ← route page (Server Component)
7. [ ] src/configs/navigationConfig.js           ← añadir al menú (si aplica)
8. [ ] src/configs/roleConfig.ts                 ← añadir restricción de rol (si aplica)
```

---

## Template: `page.tsx` (Server Component wrapper)

```typescript
// src/app/admin/my-entities/page.tsx
import MyEntitiesPageClient from '@/components/Admin/MyEntities/MyEntitiesPageClient';

export default function MyEntitiesPage() {
  return <MyEntitiesPageClient />;
}
```

> **Nota:** La page de Next.js es un Server Component por defecto. Toda la lógica interactiva va en el `PageClient`.

---

## Template: `[Entity]PageClient.tsx` (componente principal)

```typescript
// src/components/Admin/MyEntities/MyEntitiesPageClient.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useMyEntityList } from '@/hooks/useMyEntityList';
import type { MyEntity } from '@/types/myEntity';

export default function MyEntitiesPageClient() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  const { data, meta, isLoading, error, refetch } = useMyEntityList({
    filters,
    page,
    perPage: 15,
  });

  if (isLoading) return <MyEntitiesPageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500 text-sm">{error}</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-2">
          Reintentar
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">No hay registros todavía.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Entidades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {meta.total} registros
          </p>
        </div>
        <Button onClick={() => { /* abrir modal de creación */ }}>
          Nueva entidad
        </Button>
      </div>

      {/* Tabla / listado */}
      <div className="space-y-2">
        {data.map((item: MyEntity) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
          >
            <span className="font-medium">{String(item.name)}</span>
            <Badge variant="outline">activo</Badge>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm self-center">
            {meta.current_page} / {meta.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === meta.last_page}
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

function MyEntitiesPageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}
```

---

## Template: hook `useMyEntityList.ts`

```typescript
// src/hooks/useMyEntityList.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { myEntityListKeys } from '@/lib/routes/queryKeys';
import { myEntityService } from '@/services/domain/my-entity/myEntityService';
import type { CatalogListFilters, PaginationMeta } from '@/types/catalog';
import type { MyEntity } from '@/types/myEntity';

export function useMyEntityList(
  params: {
    filters?: CatalogListFilters;
    page?: number;
    perPage?: number;
    enabled?: boolean;
  } = {}
) {
  const { filters = {}, page = 1, perPage = 15, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: myEntityListKeys.list(tenantId, filters as Record<string, unknown>, page, perPage),
    queryFn: () => myEntityService.list(filters, { page, perPage }),
    enabled: !!tenantId && enabled,
  });

  return {
    data: (response?.data ?? []) as MyEntity[],
    meta: (response?.meta ?? {
      current_page: 1,
      last_page: 1,
      per_page: perPage,
      total: 0,
    }) as PaginationMeta,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
```

---

## Cómo añadir al menú de navegación

```javascript
// src/configs/navigationConfig.js — buscar el rol correcto y añadir el ítem

// Ejemplo para el menú de admin:
{
  name: "Mis Entidades",
  href: "/admin/my-entities",
  icon: SomeIcon,
  roles: ["administrador", "direccion", "tecnico"],
}
```

---

## Cómo proteger la ruta por rol

```typescript
// src/configs/roleConfig.ts — añadir la nueva ruta
export const roleConfig: Record<string, RoleKey[]> = {
  // ... rutas existentes ...
  '/admin/my-entities': ['administrador', 'direccion', 'tecnico'],
};
```

---

## Alternativa: usar EntityClient (para CRUDs estándar)

Si la entidad es un CRUD estándar (lista + crear + editar + eliminar), usar EntityClient en lugar de crear página desde cero:

1. Añadir config en `src/configs/entitiesConfig.js` (⚠️ ZONA PROTEGIDA — pedir permiso)
2. Verificar que existe el service en `src/services/domain/[entity]/`
3. La ruta `/admin/[entity]` ya existe automáticamente (ruta dinámica)

Solo crear página desde cero cuando la pantalla tiene lógica específica que EntityClient no soporta.
