# SKILL: mobile-crud-generator — Generador de UI Mobile para CRUD Genérico

## Propósito

Generar la UI mobile completa para una entidad CRUD simple (catálogos, entidades maestras)
a partir de su estructura de datos, reutilizando el patrón EntityClient con AccordionBody
que ya existe en el proyecto.

---

## Input que necesitas antes de generar

1. Nombre de la entidad (ej: `Especie`, `Puerto`, `Calibre`)
2. Ruta en el router (ej: `/admin/[entity]` o ruta propia como `/admin/field-operators`)
3. Campos de la entidad: nombre, tipo, si es filtrable, si va en el header del Accordion
4. Hook/servicio existente que consulta la API
5. ¿Tiene acciones: crear / editar / eliminar?
6. Patrón actual: ¿EntityClient genérico o componente propio?

---

## Output que produces

### Opción A — EntityClient ya usado (la mayoría de casos)

El EntityClient ya tiene `AccordionBody` para mobile. Solo mejorar:

1. Editar `getMobilePrimaryFields.js` para que el Accordion muestre los 3 campos más relevantes
2. Verificar que `CreateEntityForm` y `EditEntityForm` usan `Sheet side="bottom"` en mobile
3. Ningún componente nuevo necesario — solo ajuste de configuración

### Opción B — Componente propio (listas no-EntityClient)

Crear:
1. `[Entidad]MobileList.tsx` — lista con cards y FAB de creación
2. `[Entidad]MobileCard.tsx` — card individual con acciones inline o DropdownMenu
3. `[Entidad]MobileForm.tsx` — formulario en Sheet `side="bottom"`
4. Modificación mínima al componente padre para switchear mobile/desktop

---

## Switch mobile/desktop — patrón obligatorio del proyecto

```typescript
'use client';
import { useIsMobileSafe } from '@/hooks/use-mobile';

export function MiEntidadView() {
  const { isMobile, mounted } = useIsMobileSafe();

  // Render neutro hasta que esté montado (evita hydration mismatch)
  if (!mounted) return <MiEntidadSkeleton />;

  if (isMobile) return <MiEntidadMobileList />;
  return <MiEntidadDesktopTable />;
}
```

**NUNCA usar `useMediaQuery` — el proyecto usa `useIsMobileSafe` de `src/hooks/use-mobile.jsx`**

---

## Estructura de MobileList (Opción B)

```typescript
// src/components/[Módulo]/[Entidad]/[Entidad]MobileList.tsx
'use client';

import { useIsMobileSafe } from '@/hooks/use-mobile';
import { useHideBottomNav } from '@/context/BottomNavContext';
import { MOBILE_SPACING } from '@/lib/design-tokens-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MiEntidadMobileList({ onCreateClick, onEditClick, onDeleteClick }) {
  const { data, isLoading, error } = useMiEntidadList();

  if (isLoading) return <MiEntidadListSkeleton />;
  if (error) return <p className="p-4 text-sm text-red-500">{error}</p>;
  if (!data.length) return <EmptyState title="Sin registros" />;

  return (
    <div className="relative h-full">
      <ScrollArea className="h-full">
        <div className={cn('flex flex-col gap-3 p-4 pb-24')}>
          {data.map(item => (
            <MiEntidadMobileCard
              key={item.id}
              item={item}
              onEdit={() => onEditClick(item)}
              onDelete={() => onDeleteClick(item.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* FAB de creación — encima del BottomNav */}
      <Button
        size="icon"
        className="fixed right-4 bottom-24 z-40 h-14 w-14 rounded-full shadow-lg"
        onClick={onCreateClick}
        aria-label="Crear nuevo"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
```

---

## Estructura de MobileCard (Opción B)

```typescript
// Acciones según cantidad:
// 1 acción (editar):      botón inline
// 2 acciones (edit+del):  botón editar inline + AlertDialog eliminar
// 3+ acciones:            DropdownMenu de tres puntos

// Con 2 acciones — patrón más común
function MiEntidadMobileCard({ item, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.nombre}</p>
          <p className="text-sm text-muted-foreground">{item.campoSecundario}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>
          <DeleteAlertDialog onConfirm={onDelete} />
        </div>
      </div>
    </div>
  );
}
```

---

## Estructura de MobileForm (Opción B)

```typescript
// Sheet desde abajo — formulario de creación/edición
function MiEntidadMobileForm({ open, onOpenChange, item }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>{item ? 'Editar' : 'Crear'} MiEntidad</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 overflow-auto">
          <div className="flex flex-col gap-4 p-4">
            {/* Campos apilados — NUNCA grid de columnas en mobile */}
            <div className="flex flex-col gap-1.5">
              <Label>Nombre</Label>
              <Input className="h-12 text-base" autoFocus />
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="px-4 pb-4 pt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Reglas de generación

- Reutilizar hooks existentes: no duplicar fetch logic
- Reutilizar componentes UI del proyecto: Skeleton de shadcn, ScrollArea, Sheet, Dialog, AlertDialog
- FAB solo si la entidad tiene acción "crear"
- DropdownMenu en card solo si hay 3+ acciones por ítem
- Si solo hay "editar" + "eliminar": botón inline de editar + AlertDialog de eliminar
- `useHideBottomNav(true)` en formularios o detalles que lo necesiten
- **Nunca modificar lógica de negocio** — solo la capa de presentación
