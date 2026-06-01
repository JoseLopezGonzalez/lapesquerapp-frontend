# UI Conventions — La PesquerApp

## Principio general

La UI de La PesquerApp es operativa, no decorativa. Las pantallas están diseñadas para usuarios de negocio que trabajan con ellas durante horas: densidad de información, claridad y velocidad son más importantes que la estética.

---

## Componentes shadcn/ui disponibles

El proyecto tiene 52 componentes shadcn en `src/components/ui/`. Los más usados:

| Componente                                  | Uso principal                  | Importación                   |
| ------------------------------------------- | ------------------------------ | ----------------------------- |
| `Button`                                    | Acciones (265+ usos)           | `@/components/ui/button`      |
| `Input`                                     | Campos de texto                | `@/components/ui/input`       |
| `Label`                                     | Etiquetas de campo             | `@/components/ui/label`       |
| `Badge`                                     | Estados, etiquetas (100+ usos) | `@/components/ui/badge`       |
| `Card` + CardContent/Header/Title           | Contenedores de sección        | `@/components/ui/card`        |
| `Select` + SelectTrigger/Value/Content/Item | Desplegables                   | `@/components/ui/select`      |
| `Dialog` + DialogContent/Header/Title       | Modales                        | `@/components/ui/dialog`      |
| `ScrollArea`                                | Scroll personalizado           | `@/components/ui/scroll-area` |
| `Textarea`                                  | Texto multilínea               | `@/components/ui/textarea`    |
| `Table` + TableHeader/Body/Row/Cell         | Tablas                         | `@/components/ui/table`       |
| `Accordion` + AccordionItem/Trigger/Content | Secciones colapsables          | `@/components/ui/accordion`   |
| `Pagination`                                | Paginación                     | `@/components/ui/pagination`  |
| `DatePicker`                                | Selector de fecha              | `@/components/ui/datePicker`  |
| `Tabs`                                      | Pestañas                       | `@/components/ui/tabs`        |
| `Separator`                                 | Línea divisoria                | `@/components/ui/separator`   |
| `Skeleton`                                  | Estados de carga               | `@/components/ui/skeleton`    |

**Componentes especializados propios:**

- `Combobox` — autocomplete con búsqueda, en `src/components/Shadcn/Combobox`
- `DatePicker` — selector de fecha con popover calendario (custom, no el de shadcn)
- `InputOTP` — entrada de código OTP de 6 dígitos con slots
- `emailListInput` — acumulador de múltiples emails

---

## Reglas de uso de componentes

- **Usar siempre el componente existente antes de crear uno nuevo.** Si hay un `DatePicker` custom, usarlo — no crear otro.
- **No editar los archivos generados de shadcn en `src/components/ui/`** salvo que sea necesario. Preferir composición.
- **`Combobox`** para selects con búsqueda de opciones que vienen de API. **`Select`** para listas pequeñas y estáticas.
- **`Dialog`** para modales de creación/edición/confirmación. Evitar modales demasiado grandes.
- **`Badge`** para estados de entidades (activo, pendiente, cancelado, etc.) con variantes de color.
- **`Card`** como contenedor de sección. No usar divs sueltos con estilos de card.

---

## Patrones de pantalla

### Pantalla de listado (EntityClient)

```
┌─────────────────────────────────────────────┐
│ Título + Descripción                        │
│ [Filtros] [Botones de acción]               │
├─────────────────────────────────────────────┤
│ Tabla con columnas                          │
│ [Selección] [Col1] [Col2] ... [Acciones]   │
├─────────────────────────────────────────────┤
│ Paginación                                  │
└─────────────────────────────────────────────┘
```

### Pantalla de detalle

```
┌─────────────────────────────────────────────┐
│ [← Volver] Título de la entidad             │
│ [Acciones (editar, exportar, etc.)]         │
├──────────────────┬──────────────────────────┤
│ Información      │ Información              │
│ principal        │ secundaria               │
├──────────────────┴──────────────────────────┤
│ Sección adicional (tabla, acordeón, etc.)   │
└─────────────────────────────────────────────┘
```

### Modal de formulario

```
┌─────────────────────────────────────────────┐
│ Título del modal                     [X]    │
├─────────────────────────────────────────────┤
│ [Campo 1] [Campo 2]                         │
│ [Campo amplio]                              │
│ [Campo 3] [Campo 4]                         │
├─────────────────────────────────────────────┤
│ [Cancelar]                    [Guardar]     │
└─────────────────────────────────────────────┘
```

---

## Botones y acciones

- **Acción principal** (crear, guardar): `Button` sin variante o con `variant="default"`.
- **Acciones destructivas** (eliminar): `Button variant="destructive"` + confirmación siempre.
- **Acciones secundarias** (cancelar, volver): `Button variant="outline"` o `variant="ghost"`.
- **No amontonar más de 3-4 acciones** en la misma área visual.
- **Los botones de eliminar deben tener confirmation dialog** — nunca eliminar sin pedir confirmación.

---

## Tablas

- Usar el patrón de `EntityClient` para listados de admin cuando sea posible.
- Columnas con tipo `badge` para estados.
- Columnas con tipo `date` para fechas formateadas.
- Rutas anidadas en columnas vía `path: "entidad.campo"` (lodash.get).
- Siempre incluir estado vacío (`emptyState`) y estado de carga.
- Paginación siempre visible si hay más de una página.
- Acciones de fila a la derecha, consistentes en todas las tablas.

---

## Estados de UI obligatorios

Cada pantalla o componente de datos debe manejar:

1. **Loading** — `Skeleton` o `Loader` mientras carga.
2. **Empty state** — texto descriptivo cuando no hay datos.
3. **Error** — mensaje claro si falla la carga.
4. **Success** — confirmación visible tras una acción (toast via `sonner`).

Los toasts se lanzan con `notify.success("mensaje")` / `notify.error("mensaje")`.

---

## Responsividad

- Las pantallas de admin son principalmente de escritorio.
- Las pantallas de `field/` y `operator/` son de uso mayoritario en móvil.
- Usar `useIsMobile()` hook cuando se necesite comportamiento específico por dispositivo.
- Tailwind responsive classes (`sm:`, `md:`, `lg:`) para layout adaptativo.
- No añadir responsividad móvil a pantallas de admin salvo que se pida explícitamente.

---

## Lo que NO hacer en UI

- No añadir animaciones de Framer Motion a pantallas operativas de negocio.
- No usar colores arbitrarios — usar los tokens de Tailwind o los CSS vars del design system.
- No duplicar componentes shadcn — siempre importar de `@/components/ui/`.
- No crear componentes de card, button o input propios si ya existe el shadcn.
- No ocultar información crítica de negocio detrás de demasiados clicks.
- No hacer cambios visuales globales en `globals.css` sin entender el impacto.
