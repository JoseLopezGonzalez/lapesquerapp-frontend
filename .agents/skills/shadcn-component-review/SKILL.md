---
name: shadcn-component-review
description: >
  Reviews React components against shadcn/ui patterns, accessibility, composition, tokens, and project conventions.
---

# Skill: shadcn Component Review

## Categoría

Análisis

## Cuándo se activa

Cuando el usuario dice: "revisa este componente shadcn", "audita el componente", "component review", "está bien construido este componente", "cumple con los patrones shadcn", "revisa si sigo las convenciones shadcn", "shadcn review".

También se activa **proactivamente** al finalizar la creación de un componente nuevo — antes de dar la tarea por completada, se audita el resultado.

---

## Qué hace

Audita componentes React contra los patrones de diseño de shadcn/ui. Detecta desviaciones en spacing, tokens de diseño, composabilidad y accesibilidad. Reporta issues por severidad con fixes inline.

---

## Proceso de auditoría

### 1. Obtener información del tema activo

```bash
npx shadcn@latest info --json
```

Esto permite validar contra el estilo visual activo del proyecto (Vega, Nova, Maia, Lyra, Mira, u otro).

### 2. Revisar las 5 categorías

---

## Categorías de revisión

### A. Estructura y composición

```typescript
// ✅ Usar data-slot para identificar partes del componente
<div data-slot="card-header" className="...">

// ✅ CVA para variantes (class-variance-authority)
import { cva, type VariantProps } from 'class-variance-authority';
const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', destructive: '...', outline: '...' },
    size: { default: '...', sm: '...', lg: '...' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

// ✅ cn() para composición de clases
import { cn } from '@/lib/utils';
<div className={cn('base', isActive && 'active', className)} />

// ❌ Clases hardcodeadas sin posibilidad de override
<div className="p-4 bg-blue-500">  // sin cn(), sin className prop
```

### B. Spacing

```typescript
// ✅ gap en lugar de space-y/space-x para flexbox y grid
<div className="flex flex-col gap-4">
<div className="grid grid-cols-2 gap-6">

// ⚠️ space-y es aceptable solo en children de flow normal (no flex/grid)
<div className="space-y-2">  // OK si no es flex/grid

// ❌ Spacing hardcodeado sin relación con el sistema de diseño
<div style={{ marginBottom: '16px' }}>
```

### C. Tokens de diseño (colores semánticos)

```typescript
// ✅ Variables semánticas CSS de shadcn
bg-primary          text-primary-foreground
bg-secondary        text-secondary-foreground
bg-muted            text-muted-foreground
bg-accent           text-accent-foreground
bg-destructive      text-destructive-foreground
bg-card             text-card-foreground
bg-popover          text-popover-foreground
border-border
ring-ring

// ❌ Colores hardcodeados de Tailwind
bg-blue-500         text-gray-900         bg-red-100
// ❌ Colores CSS directos
style={{ color: '#333' }}
style={{ backgroundColor: 'rgb(59, 130, 246)' }}
```

### D. Composabilidad

```typescript
// ✅ Aceptar className como prop para extensión externa
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// ✅ Usar Radix UI Slot para composición polimórfica
import { Slot } from '@radix-ui/react-slot';
const Comp = asChild ? Slot : 'button';

// ✅ Exponer las partes del componente (patrón compound)
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };

// ❌ Componente monolítico que no permite composición
export default function Card({ title, content, footer }) { ... }
```

### E. Accesibilidad y responsivo

```typescript
// ✅ Roles y atributos ARIA correctos
<button aria-label="Cerrar diálogo" onClick={onClose}>
<nav aria-label="Navegación principal">
<img alt="Logo de la empresa" src="..." />

// ✅ DialogTitle siempre presente en Dialog
<Dialog>
  <DialogContent>
    <DialogTitle>Título visible o sr-only</DialogTitle>
  </DialogContent>
</Dialog>

// ✅ Focus visible para teclado
// (shadcn lo maneja via focus-visible:ring-2 focus-visible:ring-ring)

// ❌ onClick en divs sin role="button" y tabIndex={0}
<div onClick={handleClick}>  // inaccesible para teclado
```

---

## Formato de reporte

````
## Auditoría de componente: [NombreComponente]

### ✅ Correcto
- [Aspectos que cumplen los estándares]

### ⚠️ Advertencias (no bloquean, pero mejorar)
- **[Categoría]**: [descripción del problema]
  ```tsx
  // ❌ Actual
  [código actual]

  // ✅ Sugerido
  [código corregido]
````

### 🚨 Issues críticos (deben corregirse)

- **[Categoría]**: [descripción del problema]

  ```tsx
  // ❌ Actual
  [código actual]

  // ✅ Correcto
  [código corregido]
  ```

### Puntuación: X/10

[Veredicto en una frase]

```

---

## Severidades

| Nivel | Significado |
|---|---|
| 🚨 Crítico | Bloquea la revisión — debe corregirse antes de merge |
| ⚠️ Advertencia | Deuda técnica — corregir en el mismo PR si es pequeño |
| 💡 Sugerencia | Mejora opcional — considerar para componentes nuevos |

---

## Checklist rápido

```

[ ] ¿Usa data-slot en componentes compound?
[ ] ¿CVA para variantes en lugar de ternarios de clases?
[ ] ¿cn() para composición de clases?
[ ] ¿gap en lugar de space-y en flex/grid?
[ ] ¿Variables semánticas en lugar de colores Tailwind?
[ ] ¿Acepta className como prop?
[ ] ¿DialogTitle presente en todos los Dialog?
[ ] ¿Roles ARIA en elementos interactivos no semánticos?
[ ] ¿Focus visible funciona con teclado?

```

---

## Fuente

Basado en [mattbx/shadcn-skills](https://github.com/mattbx/shadcn-skills) · MIT License.
```
