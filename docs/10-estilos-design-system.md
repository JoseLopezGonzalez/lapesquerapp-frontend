# Estilos y Design System

## 📚 Documentación Relacionada

- **[03-components-ui-shadcn.md](./03-components-ui-shadcn.md)** - Componentes ShadCN UI
- **[04-components-admin.md](./04-components-admin.md)** - Componentes que utilizan el sistema de diseño

---

## 📋 Introducción

La aplicación utiliza **Tailwind CSS 3.x** como framework de estilos principal, **ShadCN UI** como biblioteca de componentes, y **NextUI** para algunos componentes adicionales. El sistema de diseño está basado en variables CSS (design tokens) para facilitar la personalización y el soporte de dark mode.

**Archivos principales**:

- `/tailwind.config.js` - Configuración de Tailwind
- `/src/app/globals.css` - Estilos globales y variables CSS
- `/src/lib/utils.js` - Función `cn()` para merge de clases
- `/components.json` - Configuración de ShadCN UI

---

## 🎨 Tailwind CSS

### Configuración

**Archivo**: `/tailwind.config.js`

**Características**:

- **Content paths**: Incluye `src/pages`, `src/components`, `src/app`, y `@nextui-org/theme`
- **Safelist**: Clases de grid dinámicas (`sm:col-span-1` a `sm:col-span-6`, etc.)
- **Dark mode**: `["class"]` - Se activa con clase `.dark`
- **Plugins**:
  - `tailwindcss-animate` - Animaciones
  - `nextui()` - NextUI integration

### Breakpoints Personalizados

```javascript
screens: {
  'sm-md': '704px',    // entre sm y md
  'md-lg': '896px',    // entre md y lg
  'lg-xl': '1152px',   // entre lg y xl
  'xl-2xl': '1408px',  // entre xl y 2xl
  "2xl-3xl": "1632px", // entre 2xl y 3xl
  "3xl": "1728px",     // nuevo punto superior
}
```

**Breakpoints estándar de Tailwind**:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Uso**:

```jsx
<div className="md-lg:grid-cols-2 xl-2xl:grid-cols-3 grid-cols-1">{/* Contenido */}</div>
```

### Safelist

Clases de grid dinámicas que se generan en runtime están en safelist para evitar que Tailwind las elimine:

```javascript
safelist: [
  'sm:col-span-1',
  'sm:col-span-2',
  'sm:col-span-3',
  'sm:col-span-4',
  'sm:col-span-5',
  'sm:col-span-6',
  'md:col-span-1',
  'md:col-span-2',
  'md:col-span-3',
  'md:col-span-4',
  'md:col-span-5',
  'md:col-span-6',
  'lg:col-span-1',
  'lg:col-span-2',
  'lg:col-span-3',
  'lg:col-span-4',
  'lg:col-span-5',
  'lg:col-span-6',
  'xl:col-span-1',
  'xl:col-span-2',
  'xl:col-span-3',
  'xl:col-span-4',
  'xl:col-span-5',
  'xl:col-span-6',
];
```

**Razón**: Se usan en formularios genéricos donde el número de columnas se determina dinámicamente desde configuración.

---

## 🎨 Design Tokens (Variables CSS)

### Ubicación

**Archivo**: `/src/app/globals.css`

### Colores Base

Todos los colores usan formato HSL y variables CSS:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 5%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 5%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 5%;
  --primary: 0 0% 19%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 5%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --accent: 0 0% 96%;
  --accent-foreground: 0 0% 5%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 92%;
  --input: 0 0% 85%;
  --ring: 0 0% 76%;
  --radius: 0.5rem;
}
```

### Dark Mode

```css
.dark {
  --background: 0 0% 6%;
  --foreground: 0 0% 98%;
  --card: 0 0% 7%;
  --card-foreground: 0 0% 98%;
  /* ... más colores */
}
```

### Sidebar Colors

Variables específicas para el sidebar:

```css
:root {
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 0 0% 26.1%;
  --sidebar-primary: 0 0% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 0 0% 95.9%;
  --sidebar-accent-foreground: 0 0% 10%;
  --sidebar-border: 0 0% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}
```

### Chart Colors

Colores para gráficos (usando colores sky):

```css
:root {
  --chart-1: theme('colors.sky.400');
  --chart-2: theme('colors.sky.500');
  --chart-3: theme('colors.sky.600');
  --chart-4: theme('colors.sky.700');
  --chart-5: theme('colors.sky.800');
  --chart-6: theme('colors.sky.900');
}

.dark {
  --chart-1: theme('colors.sky.300');
  --chart-2: theme('colors.sky.400');
  --chart-3: theme('colors.sky.500');
  --chart-4: theme('colors.sky.600');
  --chart-5: theme('colors.sky.700');
  --chart-6: theme('colors.sky.800');
}
```

### Uso en Tailwind

Los colores se usan con la función `hsl()`:

```jsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">Botón</button>
</div>
```

---

## 🧩 ShadCN UI

### Configuración

**Archivo**: `/components.json`

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Características**:

- **Estilo**: `new-york` (estilo de ShadCN)
- **Base color**: `neutral` (escala de grises)
- **CSS variables**: Habilitadas
- **Icon library**: `lucide-react`

### Componentes Disponibles

**Ubicación**: `/src/components/ui/`

1. **Button** (`button.jsx`)
   - Variantes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
   - Tamaños: `default`, `sm`, `lg`, `icon`
   - Usa `class-variance-authority` (cva)

2. **Input** (`input.jsx`)
   - Input HTML nativo con estilos Tailwind
   - Soporte para `type="file"`

3. **Card** (`card.jsx`)
   - Componentes: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

4. **Dialog** (`dialog.jsx`)
   - Base: `@radix-ui/react-dialog`
   - Componentes: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`

5. **Select** (`select.jsx`)
   - Base: `@radix-ui/react-select`
   - Componentes: `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`

6. **Badge** (`badge.jsx`)
   - Variantes: `default`, `secondary`, `destructive`, `outline`
   - Usa `cva`

7. **Skeleton** (`skeleton.jsx`)
   - Animación `animate-pulse`
   - Color `bg-primary/10`

8. **CustomSkeleton** (`CustomSkeleton.jsx`)
   - Skeleton personalizado con animación `shimmer`
   - Usa `animate-shimmer` (definido en globals.css)

9. **Tabs** (`tabs.jsx`)
   - Base: `@radix-ui/react-tabs`

10. **Sheet** (`sheet.jsx`)
    - Panel lateral deslizable
    - Base: `@radix-ui/react-dialog`

11. **Sidebar** (`sidebar.jsx`)
    - Componente de sidebar colapsable
    - Variante `floating`

12. **Table** (`table.jsx`)
    - Componentes: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`

13. **DatePicker** (`datePicker.jsx`)
    - Componente personalizado basado en `react-day-picker`

14. **DateRangePicker** (`dateRangePicker.jsx`)
    - Selector de rango de fechas

15. **Chart** (`chart.jsx`)
    - Wrapper para Recharts
    - Componentes: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, etc.

16. **Más componentes**: `accordion`, `alert`, `avatar`, `breadcrumb`, `calendar`, `checkbox`, `collapsible`, `command`, `dropdown-menu`, `emailListInput`, `label`, `pagination`, `popover`, `scroll-area`, `separator`, `slider`, `textarea`, `toggle`, `tooltip`

### Personalizaciones

#### CustomSkeleton

**Archivo**: `/src/components/ui/CustomSkeleton.jsx`

```jsx
const CustomSkeleton = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden rounded-md bg-neutral-800 ${className}`}>
      <div
        className={`animate-shimmer absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-neutral-700/40 to-transparent`}
      />
    </div>
  );
};
```

**Características**:

- Fondo `bg-neutral-800`
- Animación `shimmer` personalizada
- Gradiente animado

#### EmailListInput

**Archivo**: `/src/components/ui/emailListInput.jsx`

Componente personalizado para listas de emails con validación y prevención de duplicados.

---

## 🛠️ Función `cn()` (Merge de Clases)

**Archivo**: `/src/lib/utils.js`

```javascript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

**Funcionalidad**:

- `clsx`: Combina clases condicionalmente
- `twMerge`: Resuelve conflictos de clases de Tailwind (ej: `p-4 p-2` → `p-2`)

**Uso**:

```jsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className // Permite override desde props
)}>
```

---

## 🎭 Animaciones

### Animaciones de Tailwind

**Plugin**: `tailwindcss-animate`

Animaciones disponibles:

- `animate-spin` - Rotación continua
- `animate-pulse` - Pulso (usado en Skeleton)
- `animate-bounce` - Rebote
- `animate-ping` - Ping
- Y más...

### Animaciones Personalizadas

**Definidas en** `/src/app/globals.css`:

#### Accordion

```css
@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}

.animate-accordion-down {
  animation: accordion-down 0.2s ease-out;
}

.animate-accordion-up {
  animation: accordion-up 0.2s ease-out;
}
```

#### Shimmer (Skeleton)

```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}
```

#### Flash

```css
@keyframes flash {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.flash {
  animation: flash 1s linear infinite;
}
```

---

## 🌓 Dark Mode

### Activación

**Modo**: `class` (se activa con clase `.dark` en el elemento raíz)

**Configuración en Tailwind**:

```javascript
darkMode: ['class'];
```

### Implementación

Probablemente se usa un componente o hook para toggle, pero no se encontró en el código explorado. El dark mode se activa añadiendo la clase `dark` al elemento `<html>` o contenedor principal.

### Variables CSS

Todas las variables CSS tienen versiones para dark mode:

```css
:root {
  --background: 0 0% 100%; /* Light */
}

.dark {
  --background: 0 0% 6%; /* Dark */
}
```

### Uso

```jsx
<div className="bg-background text-foreground">{/* Se adapta automáticamente según .dark */}</div>
```

---

## 📐 Border Radius

### Variables

```css
--radius: 0.5rem;
```

### Uso en Tailwind

```javascript
borderRadius: {
  lg: 'var(--radius)',           // 0.5rem
  md: 'calc(var(--radius) - 2px)', // ~0.375rem
  sm: 'calc(var(--radius) - 4px)'   // ~0.25rem
}
```

**Uso**:

```jsx
<div className="rounded-lg">  {/* 0.5rem */}
<div className="rounded-md">  {/* ~0.375rem */}
<div className="rounded-sm">  {/* ~0.25rem */}
```

---

## 🎨 Estilos Globales Personalizados

### Scrollbar

**Archivo**: `/src/app/globals.css`

```css
/* Webkit (Chrome, Safari) */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 9999px;
  min-height: 24px;
  min-width: 24px;
  transition: background 0.2s;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground));
}

::-webkit-scrollbar-track {
  display: none;
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}
```

### Login Background

```css
.login-background {
  position: relative;
  z-index: 0;
}

.login-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/images/background-light-v2.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  opacity: 0.2;
  z-index: -1;
}

.dark .login-background::before {
  background-image: url('/images/background-dark.png');
  opacity: 0.15;
}
```

### Preserve Line Breaks

```css
.preserve-line-breaks {
  white-space: pre-line;
}
```

### Bold First Line

```css
.bold-first-line::first-line {
  font-weight: bold;
}
```

### Post-it Effect

```css
.postit::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50px;
  height: 50px;
  background-color: rgba(255, 255, 255, 0.6);
  border-bottom-left-radius: 12px;
  box-shadow: -3px -3px 4px rgba(0, 0, 0, 0.2);
  clip-path: polygon(0 0, 100% 0, 0 100%);
}
```

### Print Styles

```css
@media print {
  #headlessui-portal-root {
    display: none; /* Oculta modales de Headless UI al imprimir */
  }
}
```

### Z-index Utilities

```css
.z-max {
  z-index: 9999;
}
```

### Masonry

```css
.masonry-column {
  background-clip: padding-box;
}
```

---

## 🎯 Convenciones de Uso

### Merge de Clases

**Siempre usar `cn()`**:

```jsx
// ✅ Correcto
<div className={cn("base-class", condition && "conditional", className)}>

// ❌ Incorrecto
<div className={`base-class ${condition ? "conditional" : ""} ${className}`}>
```

### Variantes de Componentes

**Usar `cva` (class-variance-authority)**:

```jsx
// Ejemplo: Button
const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', outline: '...' },
    size: { sm: '...', lg: '...' },
  },
});
```

### Responsive Design

**Mobile-first**:

```jsx
// ✅ Correcto
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ Incorrecto
<div className="lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
```

### Dark Mode

**Usar variables CSS**:

```jsx
// ✅ Correcto
<div className="bg-background text-foreground">

// ❌ Incorrecto (hardcodeado)
<div className="bg-white dark:bg-black">
```

### Spacing

**Usar escala de Tailwind**:

- `p-1` = 0.25rem (4px)
- `p-2` = 0.5rem (8px)
- `p-4` = 1rem (16px)
- `p-6` = 1.5rem (24px)
- `p-8` = 2rem (32px)

### Colors

**Usar design tokens**:

```jsx
// ✅ Correcto
<button className="bg-primary text-primary-foreground">

// ❌ Incorrecto
<button className="bg-gray-900 text-white">
```

---

## 📊 Estadísticas

- **Componentes ShadCN**: ~35 componentes
- **Variables CSS**: ~30 variables de color
- **Breakpoints personalizados**: 6 adicionales
- **Animaciones personalizadas**: 3 (accordion, shimmer, flash)
- **Plugins Tailwind**: 2 (tailwindcss-animate, nextui)

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Código CSS Comentado

- **Archivo**: `/src/app/globals.css`
- **Línea**: 141-212, 397-413
- **Problema**: Hay bloques grandes de CSS comentado (variables de color alternativas)
- **Impacto**: Confusión sobre qué está activo
- **Recomendación**: Eliminar código comentado o documentar por qué está

### 2. Safelist Muy Grande

- **Archivo**: `/tailwind.config.js`
- **Línea**: 12-16
- **Problema**: Safelist con muchas clases de grid puede aumentar el bundle size
- **Impacto**: CSS más grande de lo necesario
- **Recomendación**: Considerar generar clases dinámicamente o usar un enfoque diferente

### 3. CustomSkeleton con Clases Hardcodeadas

- **Archivo**: `/src/components/ui/CustomSkeleton.jsx`
- **Línea**: 5-6
- **Problema**: Usa `bg-neutral-800` y `via-neutral-700/40` hardcodeados en lugar de variables CSS
- **Impacto**: No se adapta al dark mode automáticamente
- **Recomendación**: Usar variables CSS como `bg-muted`

### 4. Falta de Documentación de Breakpoints Personalizados

- **Archivo**: `/tailwind.config.js`
- **Línea**: 99-106
- **Problema**: Breakpoints personalizados no están documentados
- **Impacto**: Desarrolladores pueden no saber cuándo usarlos
- **Recomendación**: Documentar en comentarios o README

### 5. Variables CSS Duplicadas

- **Archivo**: `/src/app/globals.css`
- **Línea**: 216-278, 292-300, 320-359
- **Problema**: Hay múltiples bloques `@layer base` con algunas variables duplicadas
- **Impacto**: Confusión sobre qué valores están activos
- **Recomendación**: Consolidar en un solo bloque

### 6. Falta de Sistema de Espaciado Consistente

- **Archivo**: Múltiples componentes
- **Problema**: Algunos componentes usan espaciado inconsistente (p-4 vs p-6)
- **Impacto**: UI inconsistente
- **Recomendación**: Definir sistema de espaciado y documentarlo

### 7. Chart Colors Solo Sky

- **Archivo**: `/src/app/globals.css`
- **Línea**: 377-395
- **Problema**: Todos los gráficos usan colores sky, puede ser monótono
- **Impacto**: Difícil distinguir múltiples series
- **Recomendación**: Considerar paleta más diversa o configurable

### 8. Falta de Utilidades de Tipografía

- **Archivo**: `/src/app/globals.css`
- **Problema**: No hay variables CSS para tipografía (font-family, font-sizes)
- **Impacto**: Tipografía inconsistente
- **Recomendación**: Añadir variables de tipografía al sistema de design tokens

### 9. Post-it Effect No Documentado

- **Archivo**: `/src/app/globals.css`
- **Línea**: 99-115
- **Problema**: Clase `.postit` no está documentada ni se encuentra uso en el código
- **Impacto**: Código muerto o sin documentar
- **Recomendación**: Documentar uso o eliminar si no se usa

### 10. Lottie Styles Comentados

- **Archivo**: `/src/app/globals.css`
- **Línea**: 362-374
- **Problema**: Estilos de `.lottie` tienen código comentado
- **Impacto**: Confusión sobre qué estilos están activos
- **Recomendación**: Limpiar código comentado

### 11. Falta de Variables para Shadows

- **Archivo**: `/src/app/globals.css`
- **Problema**: No hay variables CSS para sombras
- **Impacto**: Sombras inconsistentes
- **Recomendación**: Añadir variables de sombra al sistema

### 12. NextUI Integration No Documentada

- **Archivo**: `/tailwind.config.js`
- **Línea**: 3, 10, 111
- **Problema**: NextUI está integrado pero no está claro dónde se usa
- **Impacto**: Confusión sobre qué componentes usar
- **Recomendación**: Documentar componentes NextUI usados o considerar remover si no se usa
