# Componentes UI - ShadCN y Componentes Personalizados

## 📚 Documentación Relacionada

- **[04-COMPONENTES-ADMIN.md](./04-COMPONENTES-ADMIN.md)** - Componentes del módulo Admin
- **[10-ESTILOS-DESIGN-SYSTEM.md](./10-ESTILOS-DESIGN-SYSTEM.md)** - Sistema de diseño y estilos

---

## 📦 Componentes Base (ShadCN UI)

Los componentes base están ubicados en `/src/components/ui/` y están basados en **ShadCN UI** (que a su vez usa **Radix UI** como primitivos accesibles).

### Características Generales

- **Base**: Radix UI primitives (accesibles, sin estilos)
- **Estilos**: Tailwind CSS con variables CSS (design tokens)
- **Variantes**: Usan `class-variance-authority` (cva) para variantes
- **Merge de clases**: Usan función `cn()` de `/src/lib/utils.js`
- **Iconos**: Lucide React (configurado como icon library principal)

---

## 📋 Lista de Componentes UI

### 1. **Button** (`button.jsx`)

**Archivo**: `/src/components/ui/button.jsx`

**Base**: `@radix-ui/react-slot`

**Variantes**:
- `default` - Botón primario (bg-primary)
- `destructive` - Botón de acción destructiva (rojo)
- `outline` - Botón con borde
- `secondary` - Botón secundario
- `ghost` - Botón sin fondo
- `link` - Estilo de enlace

**Tamaños**:
- `default` - h-9 px-4 py-2
- `sm` - h-8 px-3 text-xs
- `lg` - h-10 px-8
- `icon` - h-9 w-9 (cuadrado)

**Props especiales**:
- `asChild` - Renderiza como Slot (útil para wrappers)

**Uso**:
```jsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg">Click me</Button>
<Button variant="outline" asChild>
  <Link href="/">Link</Link>
</Button>
```

---

### 2. **Input** (`input.jsx`)

**Archivo**: `/src/components/ui/input.jsx`

**Características**:
- Input HTML nativo con estilos Tailwind
- Soporte para `type="file"` con estilos personalizados
- Placeholder con color muted
- Focus ring visible
- Estados disabled

**Uso**:
```jsx
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="Nombre" />
<Input type="email" />
<Input type="file" />
```

---

### 3. **Dialog** (`dialog.jsx`)

**Archivo**: `/src/components/ui/dialog.jsx`

**Base**: `@radix-ui/react-dialog`

**Componentes exportados**:
- `Dialog` - Root (controla estado open/onOpenChange)
- `DialogTrigger` - Botón que abre el diálogo
- `DialogContent` - Contenido del diálogo (con overlay y botón cerrar)
- `DialogHeader` - Header del diálogo
- `DialogFooter` - Footer del diálogo
- `DialogTitle` - Título (accesible)
- `DialogDescription` - Descripción (accesible)
- `DialogClose` - Botón de cerrar
- `DialogOverlay` - Overlay de fondo
- `DialogPortal` - Portal para renderizar fuera del DOM

**Características**:
- Animaciones de entrada/salida
- Overlay oscuro (bg-black/80)
- Botón cerrar (X) en esquina superior derecha
- Centrado en pantalla
- Responsive (max-w-lg por defecto)

**Uso**:
```jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger>Abrir</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
    </DialogHeader>
    Contenido...
  </DialogContent>
</Dialog>
```

---

### 4. **Select** (`select.jsx`)

**Archivo**: `/src/components/ui/select.jsx`

**Base**: `@radix-ui/react-select`

**Componentes exportados**:
- `Select` - Root
- `SelectTrigger` - Botón que abre el select
- `SelectValue` - Valor seleccionado mostrado
- `SelectContent` - Contenedor del dropdown
- `SelectItem` - Item individual
- `SelectGroup` - Grupo de items
- `SelectLabel` - Etiqueta de grupo
- `SelectSeparator` - Separador
- `SelectScrollUpButton` - Botón scroll arriba
- `SelectScrollDownButton` - Botón scroll abajo

**Características**:
- Dropdown con scroll automático
- Indicador de selección (checkmark)
- Animaciones
- Portal para renderizar fuera del DOM
- Soporte para grupos y separadores

**Uso**:
```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opción 1</SelectItem>
    <SelectItem value="option2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

---

### 5. **DatePicker** (`datePicker.jsx`)

**Archivo**: `/src/components/ui/datePicker.jsx`

**Tipo**: Client Component personalizado

**Dependencias**:
- `react-day-picker` (Calendar)
- `date-fns` (format, locale es)
- `Popover` (ShadCN)
- `Input` (ShadCN)
- `Button` (ShadCN)

**Props**:
- `date` - Date object o null
- `onChange` - Función (date) => void
- `formatStyle` - "short" (DD/MM/YYYY) o "long" (formato largo)

**Características**:
- Input editable con validación
- Calendario en popover
- Formato corto por defecto (DD/MM/YYYY)
- Parsing manual de fecha desde input
- Ajuste de zona horaria (setHours 12:00 para evitar problemas UTC)
- Tecla Enter para confirmar fecha escrita
- Tecla ArrowDown para abrir calendario

**Uso**:
```jsx
import { DatePicker } from "@/components/ui/datePicker";

<DatePicker 
  date={selectedDate} 
  onChange={setSelectedDate}
  formatStyle="short"
/>
```

---

### 6. **DateRangePicker** (`dateRangePicker.jsx`)

**Archivo**: `/src/components/ui/dateRangePicker.jsx`

**Tipo**: Client Component personalizado

**Dependencias**:
- `react-day-picker` (Calendar mode="range")
- `date-fns` (format, subYears, startOfYear, endOfYear, etc.)

**Props**:
- `dateRange` - `{ from: Date, to: Date }` o `undefined`
- `onChange` - Función (range) => void

**Características**:
- Selección de rango de fechas
- Calendario de 2 meses
- Botones rápidos:
  - "Año anterior" - Mismo rango del año anterior
  - "Año pasado completo" - Todo el año pasado
  - "Año actual" - Desde inicio de año hasta hoy
- Botón limpiar (Eraser icon)
- Formato: "DD/MM/yyyy - DD/MM/yyyy"

**Uso**:
```jsx
import { DateRangePicker } from "@/components/ui/dateRangePicker";

<DateRangePicker 
  dateRange={range} 
  onChange={setRange}
/>
```

---

### 7. **Table** (`table.jsx`)

**Archivo**: `/src/components/ui/table.jsx`

**Componentes exportados**:
- `Table` - Contenedor con scroll
- `TableHeader` - `<thead>`
- `TableBody` - `<tbody>`
- `TableFooter` - `<tfoot>`
- `TableRow` - `<tr>`
- `TableHead` - `<th>`
- `TableCell` - `<td>`
- `TableCaption` - `<caption>`

**Características**:
- Estilos consistentes
- Hover en filas
- Soporte para checkboxes
- Responsive con scroll horizontal

**Uso**:
```jsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Valor</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### 8. **Card** (`card.jsx`)

**Archivo**: `/src/components/ui/card.jsx`

**Componentes exportados**:
- `Card` - Contenedor principal
- `CardHeader` - Header con padding
- `CardTitle` - Título
- `CardDescription` - Descripción
- `CardContent` - Contenido principal
- `CardFooter` - Footer

**Características**:
- Border redondeado (rounded-xl)
- Sombra
- Estilos de texto consistentes

**Uso**:
```jsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>Contenido</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

---

### 9. **EmailListInput** (`emailListInput.jsx`)

**Archivo**: `/src/components/ui/emailListInput.jsx`

**Tipo**: Client Component personalizado

**Props**:
- `value` - Array de strings (emails)
- `onChange` - Función (emails: string[]) => void
- `placeholder` - String (opcional, default: "Introduce correos y pulsa Enter")

**Características**:
- Input para agregar múltiples emails
- Validación de email con regex
- Prevención de duplicados
- Badges para cada email con botón eliminar
- Enter para agregar email
- Mensajes de error (email inválido, duplicado)

**Uso**:
```jsx
import { EmailListInput } from "@/components/ui/emailListInput";

<EmailListInput 
  value={emails} 
  onChange={setEmails}
  placeholder="Añadir emails..."
/>
```

---

### 10. **CustomSkeleton** (`CustomSkeleton.jsx`)

**Archivo**: `/src/components/ui/CustomSkeleton.jsx`

**Tipo**: Componente de loading personalizado

**Props**:
- `className` - Clases adicionales

**Características**:
- Skeleton con animación shimmer
- Gradiente animado
- Color neutral-800 de fondo

**Uso**:
```jsx
import CustomSkeleton from "@/components/ui/CustomSkeleton";

<CustomSkeleton className="h-20 w-full" />
```

---

### Otros Componentes UI Disponibles

Los siguientes componentes también están disponibles en `/src/components/ui/`:

- **Accordion** (`accordion.jsx`) - Acordeón colapsable
- **Alert** (`alert.jsx`) - Alertas y notificaciones
- **Avatar** (`avatar.jsx`) - Avatares de usuario
- **Badge** (`badge.jsx`) - Badges y etiquetas
- **Breadcrumb** (`breadcrumb.jsx`) - Navegación breadcrumb
- **Calendar** (`calendar.jsx`) - Calendario (usado por DatePicker)
- **Checkbox** (`checkbox.jsx`) - Checkboxes
- **Collapsible** (`collapsible.jsx`) - Contenido colapsable
- **Command** (`command.jsx`) - Command menu (usado por Combobox)
- **Chart** (`chart.jsx`) - Componente base para gráficos
- **Dropdown Menu** (`dropdown-menu.jsx`) - Menús desplegables
- **Label** (`label.jsx`) - Etiquetas de formulario
- **Pagination** (`pagination.jsx`) - Paginación
- **Popover** (`popover.jsx`) - Popovers (usado por DatePicker, Combobox)
- **Scroll Area** (`scroll-area.jsx`) - Área con scroll personalizado
- **Separator** (`separator.jsx`) - Separadores visuales
- **Sheet** (`sheet.jsx`) - Paneles laterales deslizantes
- **Sidebar** (`sidebar.jsx`) - Sidebar component
- **Skeleton** (`skeleton.jsx`) - Skeleton loading (ShadCN base)
- **Slider** (`slider.jsx`) - Sliders
- **Tabs** (`tabs.jsx`) - Pestañas
- **Textarea** (`textarea.jsx`) - Área de texto
- **Toggle** (`toggle.jsx`) - Toggle buttons
- **Tooltip** (`tooltip.jsx`) - Tooltips

**Nota**: Estos componentes siguen el mismo patrón que los documentados arriba. Consulta el código fuente para detalles específicos.

---

## 🎨 Componentes ShadCN Personalizados

### Combobox (`/src/components/Shadcn/Combobox/index.js`)

**Archivo**: `/src/components/Shadcn/Combobox/index.js`

**Tipo**: Client Component

**Base**: 
- `Command` (ShadCN) para búsqueda
- `Popover` (ShadCN) para dropdown

**Props**:
- `options` - Array de `{ value: string, label: string }`
- `value` - String (valor seleccionado)
- `onChange` - Función (value: string) => void
- `placeholder` - String (texto cuando no hay selección)
- `searchPlaceholder` - String (placeholder del input de búsqueda)
- `notFoundMessage` - String (mensaje cuando no hay resultados)
- `className` - String (clases adicionales)
- `loading` - Boolean (opcional, por defecto `false`) - Muestra spinner y deshabilita el componente mientras carga
- `disabled` - Boolean (opcional, por defecto `false`) - Deshabilita el componente

**Características**:
- Búsqueda en tiempo real
- Scroll con rueda de ratón mejorado
- Indicador de selección (checkmark)
- Cierre automático al seleccionar
- Deselección al hacer click en item seleccionado
- **Estado de carga**: Muestra spinner y mensaje "Cargando opciones..." cuando `loading={true}`
- **Deshabilitado**: Se deshabilita automáticamente cuando `loading={true}` o `disabled={true}`

**Uso**:
```jsx
import { Combobox } from "@/components/Shadcn/Combobox";

<Combobox
  options={[
    { value: "1", label: "Opción 1" },
    { value: "2", label: "Opción 2" },
  ]}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="Seleccionar..."
  searchPlaceholder="Buscar..."
  notFoundMessage="No se encontraron resultados"
  loading={isLoading}
/>
```

**Diferencia con Select**: Combobox permite búsqueda, Select es un dropdown simple.

---

## 🛠️ Componentes de Utilidad

### AuthErrorInterceptor (`/src/components/Utilities/AuthErrorInterceptor.js`)

**Archivo**: `/src/components/Utilities/AuthErrorInterceptor.js`

**Tipo**: Client Component

**Funcionalidad**:
- Intercepta todas las peticiones `fetch` del navegador
- Detecta errores de autenticación (401, 403)
- Muestra toast de error
- Cierra sesión automáticamente
- Redirige al login con parámetro `from`

**Uso**: Se incluye en `ClientLayout`, no requiere uso manual.

**Dependencias**:
- `next-auth/react` (signOut)
- `react-hot-toast` (toast)
- `@/configs/authConfig` (isAuthError, isAuthStatusCode, buildLoginUrl)

---

**Nota**: El componente `AutocompleteSelector` ha sido eliminado. Se debe usar `Combobox` de Shadcn en su lugar.

---

### Loader (`/src/components/Utilities/Loader/`)

**Archivo**: `/src/components/Utilities/Loader/`

**Funcionalidad**: Componente de carga/spinner.

**Uso común**:
```jsx
import Loader from "@/components/Utilities/Loader";

{loading && <Loader />}
```

---

### EmptyState (`/src/components/Utilities/EmptyState/`)

**Archivo**: `/src/components/Utilities/EmptyState/`

**Funcionalidad**: Estado vacío para listas/tablas sin datos.

---

### Otros Componentes de Utilidad

- **PdfUpload** - Subida de archivos PDF
- **RotatingText** - Texto rotativo
- **ShinyText** - Texto con efecto shiny
- **SparklesLoader** - Loader con sparkles
- **Squares** - Componente de cuadrados decorativos
- **StarBorder** - Borde con estrellas

---

## 🎯 Patrones de Uso

### Componentes Compuestos

Muchos componentes ShadCN son **compuestos** (múltiples sub-componentes):

```jsx
// Dialog es compuesto
<Dialog>
  <DialogTrigger>...</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
    </DialogHeader>
    ...
  </DialogContent>
</Dialog>

// Table es compuesto
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
```

### Variantes con CVA

Componentes con variantes usan `class-variance-authority`:

```jsx
// Button tiene variantes
<Button variant="destructive" size="lg">Eliminar</Button>
```

### Merge de Clases

Todos los componentes usan `cn()` para merge inteligente:

```jsx
// En el componente
className={cn("base-classes", className)}
// Permite sobrescribir clases desde props
```

---

## 📊 Estadísticas de Uso

Según búsqueda en el código:
- **483 imports** de componentes UI en **124 archivos**
- Componentes más usados:
  - `Button`
  - `Dialog` / `DialogContent`
  - `Input`
  - `Card` / `CardContent`
  - `Table` y sub-componentes
  - `Select` y sub-componentes

---

## 🔗 Dependencias Externas

### Radix UI
Componentes primitivos accesibles:
- `@radix-ui/react-dialog`
- `@radix-ui/react-select`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-tabs`
- `@radix-ui/react-accordion`
- Y otros...

### Otras Librerías
- `react-day-picker` - Para DatePicker y Calendar
- `date-fns` - Para formateo de fechas
- `lucide-react` - Iconos
- `class-variance-authority` - Para variantes
- `tailwind-merge` - Para merge de clases

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. DatePicker con Ajuste Manual de Zona Horaria
- **Archivo**: `/src/components/ui/datePicker.jsx`
- **Línea**: 78-80, 95-97
- **Problema**: Se hace `setHours(12, 0, 0, 0)` manualmente para evitar problemas UTC
- **Impacto**: Solución temporal, puede causar problemas en otros casos de uso
- **Recomendación**: Considerar usar librería de fechas más robusta o manejar timezone correctamente

### 2. EmailListInput sin Validación de Dominio
- **Archivo**: `/src/components/ui/emailListInput.jsx`
- **Línea**: 8-10
- **Problema**: Regex de validación de email es básica (`/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/`)
- **Impacto**: Puede aceptar emails inválidos o rechazar válidos
- **Recomendación**: Usar librería de validación de email o regex más completa

### 3. CustomSkeleton con Color Hardcodeado
- **Archivo**: `/src/components/ui/CustomSkeleton.jsx`
- **Línea**: 5
- **Problema**: Color `bg-neutral-800` hardcodeado, no usa design tokens
- **Impacto**: No se adapta al tema (dark/light mode)
- **Recomendación**: Usar variables CSS del design system (`bg-muted` o similar)

### 4. Combobox con Scroll Personalizado
- **Archivo**: `/src/components/Shadcn/Combobox/index.js`
- **Línea**: 49-56
- **Problema**: Scroll con rueda de ratón forzado con multiplicador `* 2`
- **Impacto**: Puede causar comportamiento inesperado en algunos navegadores
- **Recomendación**: Revisar si es necesario o usar comportamiento nativo

### 5. Falta de Documentación JSDoc
- **Archivo**: Todos los componentes UI
- **Problema**: Componentes sin JSDoc explicando props y uso
- **Impacto**: Dificulta entender el propósito y uso de cada componente
- **Recomendación**: Añadir JSDoc a todos los componentes exportados

### 6. DateRangePicker con Lógica Compleja
- **Archivo**: `/src/components/ui/dateRangePicker.jsx`
- **Línea**: 31-53
- **Problema**: Lógica de botones rápidos mezclada con el componente
- **Impacto**: Componente más difícil de mantener y testear
- **Recomendación**: Extraer lógica de botones rápidos a hooks o funciones separadas

### 7. Falta de Tests
- **Archivo**: Todos los componentes UI
- **Problema**: No se encontraron tests para componentes UI
- **Impacto**: Riesgo de regresiones al modificar componentes
- **Recomendación**: Implementar tests unitarios para componentes críticos

### 8. Inconsistencia en Nombres de Archivos
- **Archivo**: `/src/components/ui/`
- **Problema**: Algunos archivos son `.jsx` (button.jsx) y otros podrían ser `.js`
- **Impacto**: Inconsistencia menor
- **Recomendación**: Estandarizar extensión (preferiblemente `.jsx` para componentes React)

### 9. Componentes UI sin TypeScript
- **Archivo**: Todos los componentes UI
- **Problema**: Componentes en JavaScript puro, sin tipos
- **Impacto**: Menor seguridad de tipos, más errores en tiempo de ejecución
- **Recomendación**: Considerar migración gradual a TypeScript

### 10. Falta de Storybook o Documentación Visual
- **Archivo**: Proyecto completo
- **Problema**: No hay Storybook o documentación visual de componentes
- **Impacto**: Difícil ver todos los componentes y sus variantes en un solo lugar
- **Recomendación**: Considerar implementar Storybook para documentación visual de componentes

