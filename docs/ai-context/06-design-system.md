# Design System — La PesquerApp

## Stack real

| Tecnología               | Versión             | Rol                                      |
| ------------------------ | ------------------- | ---------------------------------------- |
| Tailwind CSS             | **v4.2.1**          | Sistema de utilidades CSS                |
| shadcn/ui                | estilo `radix-nova` | Librería de componentes                  |
| Radix UI                 | v1.4.3 + primitivos | Base headless de los componentes         |
| class-variance-authority | ^0.7.1              | Variantes de componentes con `cva()`     |
| tailwind-merge           | **v3.0.1**          | Merge de clases con `twMerge()` / `cn()` |
| clsx                     | ^2.1.1              | Helper condicional de clases             |
| lucide-react             | ^0.575.0            | Iconos (única librería aprobada)         |
| tw-animate-css           | ^1.4.0              | Animaciones Tailwind v4                  |
| @reui                    | registry externo    | Componentes adicionales (reui.io)        |

---

## Tailwind v4 — diferencias críticas con v3

Este proyecto usa **Tailwind CSS v4**, que es fundamentalmente diferente a v3:

```css
/* globals.css — Tailwind v4 */
@import 'tailwindcss'; /* no más @tailwind base/components/utilities */
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));
@custom-variant data-active (&[data-state="active"]);

@theme inline {
  /* Los tokens se mapean aquí — en CSS, no en tailwind.config.js */
  --color-primary: var(--primary);
  --color-muted-foreground: var(--muted-foreground);
  --radius-lg: var(--radius);
}
```

El `tailwind.config.js` sigue existiendo para content paths, safelist y breakpoints custom, pero **los tokens de color se definen en `globals.css`**, no en el config.

---

## Tokens de diseño (oklch)

El sistema de color usa **oklch** (espacio perceptualmente uniforme):

### Tokens estándar shadcn

```css
bg-background / text-foreground
bg-card / text-card-foreground
bg-popover / text-popover-foreground
bg-primary / text-primary-foreground
bg-secondary / text-secondary-foreground
bg-muted / text-muted-foreground
bg-accent / text-accent-foreground
bg-destructive / text-destructive-foreground
border-border
bg-input
ring-ring
```

### Tokens semánticos extra (propios del proyecto)

```css
/* Estados de feedback */
bg-success / text-success-foreground    /* verde — confirmación */
bg-warning / text-warning-foreground    /* amarillo — advertencia */
bg-info / text-info-foreground          /* azul/morado — información */
bg-invert / text-invert-foreground      /* negro — contraste fuerte */

/* Escala de foreground (grises) */
bg-foreground-50                        /* casi blanco — fondos sutiles */
bg-foreground-100                       /* blanco roto */
text-foreground-300                     /* gris claro */
text-foreground-400                     /* gris medio — texto secundario */
```

**Regla**: nunca usar `bg-[#hex]` o `text-[#hex]` si existe un token equivalente.

### Radio (border-radius)

```css
rounded-sm   /* calc(var(--radius) - 4px) ≈ 6px */
rounded-md   /* calc(var(--radius) - 2px) ≈ 8px */
rounded-lg   /* var(--radius) = 0.625rem ≈ 10px */
rounded-xl   /* calc(var(--radius) + 4px) */
rounded-2xl  /* calc(var(--radius) + 8px) */
```

---

## Breakpoints

Además de los estándar de Tailwind (`sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`):

```javascript
"sm-md":   "704px"    // tablet pequeña
"md-lg":   "896px"    // tablet grande
"lg-xl":   "1152px"   // escritorio medio
"xl-2xl":  "1408px"
"2xl-3xl": "1632px"
"3xl":     "1728px"   // pantallas muy grandes
```

---

## Componentes disponibles (`src/components/ui/`)

52 archivos. Antes de crear cualquier componente, verificar que no existe ya:

```
accordion    alert          alert-dialog   avatar
badge        breadcrumb     button         button-group
calendar     card           carousel       chart
checkbox     collapsible    command        CustomSkeleton
datePicker   dateRangePicker  dialog       dropdown-menu
emailListInput  empty      field          input
input-group  input-otp      label         pagination
popover      progress       scroll-area   select
separator    sheet          sidebar       skeleton
slider       sonner         spinner       table
tabs         textarea       theme-toggle  toggle  tooltip
```

**Componentes custom del proyecto** (NO son shadcn estándar):

- `src/components/Shadcn/Combobox/` — select con búsqueda y carga desde API
- `src/components/Shadcn/SelectionDialog/` — dialog de selección múltiple
- `src/components/reui/phone-input.jsx` — input de teléfono internacional

---

## Cómo usar los componentes

### Importación

```javascript
// Siempre desde el alias @/components/ui/
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Para combinar clases
import { cn } from '@/lib/utils';
```

### Combinación de clases con cn()

```javascript
// tailwind-merge v3 + clsx
import { cn } from '@/lib/utils';

<div
  className={cn(
    'base-classes',
    isActive && 'conditional-class',
    variant === 'ghost' && 'ghost-classes',
    className // siempre pasar className como prop
  )}
/>;
```

### Variantes con cva()

```javascript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center gap-2 rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

### Dark mode

```css
@custom-variant dark (&:is(.dark *));
```

En Tailwind: `dark:bg-background`, `dark:text-foreground`, etc.

---

## Iconos

El proyecto usa **lucide-react** como única librería de iconos:

```javascript
import { ChevronDown, Trash2, Plus, Search } from 'lucide-react';

<ChevronDown className="size-4" />; // preferir size-4 sobre w-4 h-4
```

No introducir heroicons, phosphor icons u otras librerías.

---

## Reglas del design system

### Hacer

- Importar siempre desde `@/components/ui/`.
- Usar `cn()` para combinar clases — nunca concatenar strings.
- Usar `cva()` para componentes con múltiples variantes.
- Usar tokens semánticos (`bg-primary`, `text-muted-foreground`, etc.).
- Usar los tokens extra del proyecto (`bg-success`, `text-foreground-400`, etc.).
- Componer componentes shadcn antes de modificar sus archivos base.
- Usar `size-4` en lugar de `w-4 h-4` para iconos (Tailwind v4 shorthand).
- Usar `rounded-lg` (el radio base del proyecto) como radio por defecto.

### No hacer

- No usar colores arbitrarios `bg-[#hex]` si existe un token.
- No modificar archivos de `src/components/ui/` sin necesidad — preferir composición.
- No instalar otra librería de componentes UI.
- No instalar otro set de iconos.
- No usar sintaxis de Tailwind v3 (`@layer utilities { }`) en archivos nuevos.
- No hardcodear valores oklch en componentes — usar los tokens de CSS.
- No cambiar el estilo de shadcn (`radix-nova`) sin decisión arquitectónica documentada.
- No agregar nuevos tokens de color a `globals.css` sin documentarlo en `docs/decisions/`.

---

## Añadir un componente shadcn nuevo

1. Verificar que no existe en `src/components/ui/`.
2. Verificar que no existe en `src/components/Shadcn/` o `src/components/reui/`.
3. Instalar con: `npx shadcn@latest add {nombre}` (respeta el estilo `radix-nova`).
4. Si el componente viene del registry `@reui`: `npx shadcn@latest add @reui/{nombre}`.
5. El archivo aparece en `src/components/ui/` listo para usar.
6. Documentar en `docs/decisions/` si es una adición relevante.
