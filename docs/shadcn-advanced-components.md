# Componentes UI avanzados o personalizados (revisión posterior)

**Gestión general de shadcn en el proyecto:** [docs/shadcn-gestion.md](shadcn-gestion.md).

Lista de componentes que **no** se han sobrescrito en la pasada actual de alineación con el preset Nova. Incluye qué tienen de propio (locale, APIs, estilos, integraciones) para decidir más adelante si se actualizan desde shadcn, se migran a mano desde el preset, o se dejan como están.

## Inventario

| Componente | Ubicación | Peculiaridades / personalizaciones |
|------------|-----------|-------------------------------------|
| **sidebar** | `src/components/ui/sidebar.jsx` | Cookie de estado, atajo teclado (Ctrl/Cmd+B), ancho icon/expandido, integración con Sheet móvil, `useIsMobile`, ~630 líneas. Muy acoplado al layout. |
| **theme-toggle** | `src/components/ui/theme-toggle.jsx` | next-themes, labels en español, estilos sidebar (border, bg), placeholder antes de mount para hidratación. |
| **datePicker** | `src/components/ui/datePicker.jsx` | Locale `es`, formato short/long, `parseShortDate` (dd/mm/yyyy), input manual + calendar, validación de fechas. |
| **dateRangePicker** | `src/components/ui/dateRangePicker.jsx` | Locale `es`, botones "año anterior", "último año", "año actual", `useIsMobileSafe`, ancho popover móvil, `differenceInCalendarDays` para mantener longitud del rango. |
| **calendar** | `src/components/ui/calendar.jsx` | Usado por DatePicker y DateRangePicker, `classNames` extensos, soporte `mode="range"`, botones nav con `buttonVariants`. |
| **command** | `src/components/ui/command.jsx` | Base del Combobox; `CommandDialog` con clases propias; usado en búsquedas/selects. Revisar si Nova cambia estilos de lista/input. |
| **Combobox** | `src/components/Shadcn/Combobox/index.js` | No es componente de `ui/`; usa Command + Popover + Button; loading, onBlur, búsqueda, scroll al cambiar búsqueda. No sobrescribir; al actualizar Command, comprobar compatibilidad. |
| **input-otp** | `src/components/ui/input-otp.jsx` | Estilo de slots (bordes, ring), caret blink; depende de librería `input-otp`. |
| **emailListInput** | `src/components/ui/emailListInput.jsx` | Componente propio (no shadcn): validación email, badges con eliminación, Heroicons X. |
| **CustomSkeleton** | `src/components/ui/CustomSkeleton.jsx` | Componente propio: shimmer, `neutral-800/700`, no es skeleton de shadcn. |
| **chart** | `src/components/ui/chart.jsx` | Wrapper de recharts; si usáis chart primitives de shadcn, anotar si hay colores/ejes custom. |
| **carousel** | `src/components/ui/carousel.jsx` | Embla; anotar si hay breakpoints o estilos propios. |

## Nota sobre la instalación de básicos

La configuración actual usa **`style: "radix-nova"`** en `components.json` (no `"nova"`, que no existe en el registry de `add`). Los componentes básicos se han reinstalado con radix-nova; el proyecto tiene la dependencia **`radix-ui`** porque esos componentes importan del paquete unificado. Ver [shadcn-gestion.md](shadcn-gestion.md) para el flujo completo.

## Próximos pasos

1. Revisar Command + Combobox tras actualizar Popover/Button.
2. Comparar DatePicker/DateRangePicker con el bloque de fecha del preset.
3. Decidir si Sidebar se actualiza por partes (solo estilos) o se mantiene.
