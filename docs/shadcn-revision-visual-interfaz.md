# Siguiente paso: revisión visual in situ de la interfaz (shadcn)

**Estado:** En curso / por empezar  
**Contexto:** Tras migrar los componentes básicos a **radix-nova** y documentar la gestión en [shadcn-gestion.md](shadcn-gestion.md), el siguiente paso es revisar la app **en la interfaz**, pantalla a pantalla, para detectar inconsistencias de diseño y mal uso de los componentes.

---

## Objetivo

- Encontrar **inconsistencias de diseño** derivadas del cambio a los nuevos componentes (radix-nova).
- Detectar **usos incorrectos** de los componentes (props, variantes, contexto inadecuado).
- Identificar **diseños raros** o que no encajen con el resto de la app (espaciados, tamaños, jerarquía visual).

La revisión es **in situ**: usando la app en el navegador, no solo leyendo código. Se hace **uso por uso** y **zona por zona** de la web app.

---

## Enfoque de la revisión

1. **Recorrer la interfaz** de forma ordenada (por rol, por módulo o por ruta).
2. En cada pantalla o flujo:
   - Revisar **botones** (variantes, tamaños, alineación con el contenido).
   - Revisar **inputs, selects, textareas** (altura, bordes, estados focus/error).
   - Revisar **cards, tablas, listas** (espaciado, tipografía, sombras si las hay).
   - Revisar **dialogs, sheets, popovers, dropdowns** (abertura, cierre, overlay, contenido).
   - Revisar **badges, tabs, toggles** (legibilidad, contraste, consistencia con el tema).
3. Anotar:
   - **Dónde** aparece el problema (ruta, pantalla, componente concreto).
   - **Qué** se ve mal o se usa mal (descripción breve).
   - **Acción** a tomar si está claro (ajustar clase, cambiar variante, corregir uso del componente).

No es obligatorio documentar cada hallazgo en este mismo doc; puede usarse como guía de proceso y, si se quiere, una sección “Hallazgos” o una lista externa (por ejemplo en \_worklog o en issues).

---

## Áreas a cubrir (sugerencia)

Para no dejarse nada, se puede seguir un orden como este (adaptar a la estructura real de la app):

| Área                                 | Rutas / pantallas típicas                           | Componentes a vigilar                               |
| ------------------------------------ | --------------------------------------------------- | --------------------------------------------------- |
| **Login / auth**                     | Login, verificación, recuperación                   | Button, Input, Card                                 |
| **Dashboard**                        | `/admin/home`, gráficos, filtros, selects           | Card, Select, Tabs, Button, DateRangePicker         |
| **Listados / tablas**                | `/admin/[entity]`, tablas de datos, filtros         | Table, Button, Input, Select, Pagination, Dropdown  |
| **Formularios de creación/edición**  | Create/Edit por entidad, recepciones, pedidos, etc. | Input, Select, Textarea, Button, Card, Dialog/Sheet |
| **Detalle / vistas**                 | Detalle de pedido, pallet, producción, etc.         | Card, Badge, Tabs, Button, Dialog, Accordion        |
| **Sidebar y navegación**             | Sidebar, menús, theme toggle                        | Sidebar, Dropdown, Button, ThemeToggle              |
| **Modales y overlays**               | Confirmaciones, alertas, wizards                    | Dialog, AlertDialog, Sheet, Popover                 |
| **Comercial / Operador / Warehouse** | Layouts y pantallas por rol                         | Los mismos componentes en contexto distinto         |

---

## Cómo usar este documento

- **Antes de empezar:** Tener la app en marcha (`npm run dev`) y, si ayuda, una lista de rutas o un mapa de la app (p. ej. desde [00-docs-map.md](00-docs-map.md) o la estructura de `src/app`).
- **Durante la revisión:** Ir tachando o anotando las áreas revisadas; opcionalmente, ir apuntando hallazgos en una sección “Hallazgos” debajo o en un archivo aparte.
- **Después:** Priorizar correcciones (críticas vs cosméticas) y aplicar cambios por bloques (por ejemplo “todos los Select de filtros”, “todos los botones primarios en formularios”).

---

## Relación con otros docs

- **Configuración y gestión de shadcn:** [shadcn-gestion.md](shadcn-gestion.md)
- **Componentes con personalizaciones (no reinstalados):** tabla en la sección 6 de shadcn-gestion.md y detalle en [shadcn-advanced-components.md](shadcn-advanced-components.md)
- **Estilos y design system:** [10-estilos-design-system.md](10-estilos-design-system.md) (por si hay criterios de espaciado o tipografía ya definidos)

---

_Documento creado para marcar y guiar la revisión visual in situ tras la migración a componentes radix-nova._
