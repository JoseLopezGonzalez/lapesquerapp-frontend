# Skill: shadcn/ui for Next.js

## Categoría
Desarrollo

## Cuándo se activa

Cuando el usuario dice: "shadcn", "añade un componente shadcn", "usa shadcn para", "instala el componente X de shadcn", "agrega shadcn", "shadcn ui", "componente de UI", "npx shadcn", "add shadcn component".

También se activa implícitamente cuando se construye cualquier UI nueva — antes de escribir un componente desde cero, verificar si shadcn ya lo tiene.

---

## Qué hace

Guía la integración correcta de shadcn/ui en este proyecto Next.js con App Router. Proporciona patrones de uso, comandos de instalación, integración con React Hook Form + Zod, TanStack Table, y Recharts — alineados con el stack real del proyecto.

shadcn/ui **no es un paquete npm**. El CLI copia el código fuente de cada componente directamente a `src/components/ui/`, dándote control total sobre el código.

---

## Comandos esenciales

```bash
# Añadir un componente nuevo
npx shadcn@latest add button
npx shadcn@latest add dialog card badge skeleton

# Ver info de configuración actual
npx shadcn@latest info --json

# Inicializar (solo si no está ya configurado — este proyecto YA lo tiene)
npx shadcn@latest init
```

Los componentes se instalan en `src/components/ui/` — **nunca editar directamente** los archivos generados por shadcn salvo customización explícita.

---

## Proceso al recibir una tarea de UI

### 1. Verificar si el componente ya existe

```bash
ls src/components/ui/
```

Este proyecto tiene 52 primitivos instalados. Siempre verificar antes de instalar.

### 2. Si no existe, instalar via CLI

```bash
npx shadcn@latest add [nombre-componente]
```

### 3. Importar desde el path correcto

```typescript
// ✅ Correcto
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// ❌ Nunca así
import { Button } from 'shadcn';
import { Button } from '@shadcn/ui';
```

---

## Integración con Next.js App Router

### Server vs Client

- Componentes shadcn usan hooks de Radix UI internamente → requieren contexto de cliente
- **Pages con shadcn**: añadir `'use client'` o envolver en un Client Component
- **Patrón del proyecto**: `page.tsx` (Server) → `XxxPageClient.tsx` (`'use client'`)

```typescript
// page.tsx — Server Component
export default async function CustomersPage() {
  return <CustomersPageClient />;
}

// CustomersPageClient.tsx — Client Component
'use client';
import { Button } from '@/components/ui/button';
import { useCustomersList } from '@/hooks/useCustomersList';
// ...
```

---

## Formularios — React Hook Form + Zod + Form shadcn

Este proyecto ya tiene React Hook Form 7.54.2 + Zod 3.25.76 instalados.

```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido').optional(),
});

type FormData = z.infer<typeof schema>;

export function CustomerForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}
```

---

## Data Tables — TanStack Table + shadcn Table

Este proyecto ya tiene TanStack Table 8.21.3. El patrón de tres archivos:

```
columns.tsx      — Define ColumnDef[] con accessors y cell renderers
data-table.tsx   — Componente <DataTable> reutilizable con useReactTable
[page]Client.tsx — Fetch de datos y paso a la tabla
```

```typescript
// columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import type { Customer } from '@/types/catalog';

export const columns: ColumnDef<Customer>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Email' },
  {
    id: 'actions',
    cell: ({ row }) => <CustomerActions customer={row.original} />,
  },
];
```

---

## Theming — CSS Variables

shadcn usa variables CSS en `globals.css`. **Nunca hardcodear colores**.

```typescript
// ❌ Nunca — colores hardcodeados
<div className="bg-blue-500 text-white">

// ✅ Siempre — variables semánticas
<div className="bg-primary text-primary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="bg-accent text-accent-foreground">
<div className="bg-destructive text-destructive-foreground">
```

Variables disponibles: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--card`, `--popover`, `--border`, `--input`, `--ring`.

---

## Reglas de UI del proyecto

```typescript
// ✅ Usar componentes shadcn nativamente
import { Button } from '@/components/ui/button';

// ✅ Extender via className con cn()
import { cn } from '@/lib/utils';
<Button className={cn('w-full', isLoading && 'opacity-50')} />

// ✅ Usar gap en lugar de space-y para spacing en flexbox/grid
<div className="flex flex-col gap-4">

// ✅ Siempre incluir DialogTitle en Dialog
<Dialog>
  <DialogContent>
    <DialogTitle>Título del diálogo</DialogTitle>
    {/* contenido */}
  </DialogContent>
</Dialog>

// ✅ Confirmación antes de acciones destructivas
<Button variant="destructive" onClick={handleDelete}>Eliminar</Button>

// ❌ Nunca reescribir internos de un componente shadcn
// ❌ Nunca crear wrappers para ajustes menores de estilo
// ❌ Nunca copiar bloques sin instalar sus dependencias
```

---

## Componentes disponibles en este proyecto (src/components/ui/)

Verificar con `ls src/components/ui/` antes de instalar. El proyecto tiene 52 primitivos incluyendo:

`accordion` · `alert` · `alert-dialog` · `avatar` · `badge` · `button` · `calendar` · `card` · `checkbox` · `combobox` · `command` · `dialog` · `dropdown-menu` · `form` · `input` · `label` · `pagination` · `popover` · `select` · `separator` · `sheet` · `skeleton` · `table` · `tabs` · `textarea` · `toast` · `tooltip` y más.

---

## Charts — Recharts + shadcn Chart

Este proyecto ya tiene Recharts 2.15.4.

```typescript
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

const chartConfig: ChartConfig = {
  ventas: { label: 'Ventas', color: 'hsl(var(--chart-1))' },
};

<ChartContainer config={chartConfig} className="h-64">
  <BarChart data={data}>
    <XAxis dataKey="mes" />
    <YAxis />
    <Bar dataKey="ventas" fill="var(--color-ventas)" />
  </BarChart>
</ChartContainer>
```

---

## Fuente

Basado en [capraidev/shadcn-claude-skill](https://github.com/capraidev/shadcn-claude-skill) · MIT License.
