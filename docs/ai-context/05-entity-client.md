# EntityClient — Pantallas de entidad en La PesquerApp

## Qué es EntityClient

`EntityClient` es el componente central de administración CRUD de La PesquerApp. Un único componente config-driven de 769 líneas que genera una pantalla de listado + gestión completa para cualquier entidad.

**Archivo:** `src/components/Admin/Entity/EntityClient/index.js`

**Uso:** La ruta dinámica `/admin/[entity]/page.js` resuelve el config del entity y pasa al componente:

```javascript
// src/app/admin/[entity]/page.js
export default async function EntityPage({ params }) {
  const { entity } = await params;
  const config = configs[entity]; // configs viene de entitiesConfig.js
  if (!config) notFound();
  return <EntityClient config={config} />;
}
```

---

## Estructura del config (entitiesConfig.js)

El config de cada entidad vive en `src/configs/entitiesConfig.js` (117KB). Cada entidad exporta un objeto con esta forma:

```javascript
configs['raw-material-receptions'] = {
  // Visibilidad de botones
  hideCreateButton: false,
  hideEditButton: false,
  hideViewButton: true,

  // Títulos y textos
  title: "Recepciones de materia prima",
  description: "Crea, edita, genera reportes y más.",
  emptyState: { title: "...", description: "..." },

  // API
  endpoint: "raw-material-receptions",      // mapea a rawMaterialReceptionsService
  deleteEndpoint: "raw-material-receptions/:id",
  perPage: 17,

  // Rutas de navegación
  viewRoute: "/admin/raw-material-receptions/:id",
  editRedirect: "/admin/raw-material-receptions/:id/edit",
  createRedirect: "/admin/raw-material-receptions/create",

  // Filtros
  filtersGroup: {
    search: { name: "search", label: "Buscar", filters: [...] },
    groups: [
      {
        name: "generals",
        label: "Generales",
        filters: [
          { name: "supplier_id", label: "Proveedor", type: "autocomplete", endpoint: "suppliers" },
          { name: "date", label: "Fecha", type: "dateRange" },
          // tipos disponibles: search, textAccumulator, dateRange, autocomplete, textarea
        ]
      }
    ]
  },

  // Columnas de tabla
  table: {
    headers: [
      { name: "id",       label: "ID",       type: "id",   path: "id" },
      { name: "date",     label: "Fecha",    type: "date", path: "date" },
      { name: "supplier", label: "Proveedor", type: "text", path: "supplier.name" },
      // path admite rutas anidadas vía lodash.get (e.g. "supplier.name")
      // tipos: id, text, date, datetime, badge, number, boolean, image, link
    ]
  },

  // Formulario de creación (inline en modal)
  createForm: {
    fields: [
      {
        name: "supplier_id",
        label: "Proveedor",
        type: "Autocomplete",
        endpoint: "suppliers",
        validation: { required: "Campo requerido" },
        colSpan: 2,
      },
      {
        name: "date",
        label: "Fecha",
        type: "date",
        defaultValue: new Date(),
        validation: { required: "Campo requerido" },
      },
      // tipos de campo: text, email, number, date, datetime-local,
      //                 select, Autocomplete, textarea, emailList
    ]
  },

  // Exportaciones
  exports: [
    {
      title: "Exportar a Facilcom",
      endpoint: "raw-material-receptions/facilcom-xls",
      type: "excel",
      waitingMessage: "Generando exportación...",
      fileName: "Exportacion_recepciones_Facilcom",
    }
  ]
}
```

---

## Comportamiento interno de EntityClient

**Estado interno:**

- `data`: `{ loading: boolean, rows: [] }` — datos del listado
- `filters`: array de `{ name, value, type }` — filtros activos
- `paginationMeta`: `{ currentPage, totalPages, totalItems, perPage }`
- `selectedRows`: IDs para operaciones en bloque
- `modal`: `{ open, mode: 'create' | 'edit', editId }`
- Flags de loading: `isRefreshing`, `isDeleting`, `isGeneratingReport`, `isExporting`

**Cómo obtiene el servicio:**  
`getEntityService(config.endpoint)` mapea el string del endpoint al servicio de dominio correspondiente (e.g., `"customers"` → `customerService`).

**Subcomponentes internos:**

- `EntityTableHeader` — título, descripción, filtros, botones de acción
- `EntityBody` — filas con `generateColumns2()`, checkboxes de selección
- `EntityFooter` — paginación + resumen
- `CreateEntityForm` — formulario modal de creación
- `EditEntityForm` — formulario modal de edición

---

## Cuándo usar EntityClient y cuándo NO

**Usar EntityClient cuando:**

- Se trata de un CRUD estándar de una entidad del admin.
- El listado + crear + editar + eliminar caben en el patrón config.
- Los filtros, columnas y formulario son configurables desde el config.

**NO usar EntityClient cuando:**

- La pantalla tiene lógica de negocio muy específica (e.g., `usePallet.js`, `useOrder.js`).
- La entidad necesita un formulario complejo con campos dinámicos no soportados por `createForm`.
- La pantalla tiene múltiples estados o flujos que no caben en el patrón lista/modal.
- Ya existe una pantalla dedicada para esa entidad fuera de `/admin/[entity]/`.

### Caso especial: pedidos

El bloque de pedidos combina un listado EntityClient con gestores operativos dedicados:

| Ruta                        | Implementación                                                                                       | Propósito                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/admin/orders`             | Ruta dinámica `src/app/admin/[entity]/page.js` + `configs.orders` en `src/configs/entitiesConfig.js` | Listado administrativo EntityClient: filtros, tabla, selección y exportaciones. No existe `src/app/admin/orders/page.js`. |
| `/admin/orders-manager`     | `src/app/admin/orders-manager/page.js` + `src/components/Admin/OrdersManager/`                       | Gestor operacional admin: creación, detalle/editor, producción, documentos, palets y rentabilidad.                        |
| `/comercial/orders`         | `src/app/comercial/orders/page.js` con config de pedidos adaptada                                    | Listado comercial read-only basado en EntityClient.                                                                       |
| `/comercial/orders-manager` | `src/app/comercial/orders-manager/page.js` + gestor comercial                                        | Gestor operacional comercial con restricciones por rol.                                                                   |

Cuando se modifique el listado de pedidos, revisar `configs.orders` y el flujo EntityClient. Cuando se modifique la operación diaria de pedidos, revisar `OrdersManager` y sus hooks/servicios relacionados. No crear un `src/app/admin/orders/page.js` salvo decisión arquitectónica explícita: la ruta ya está cubierta por `/admin/[entity]`.

---

## Cómo añadir una nueva entidad al EntityClient

1. Añadir el config en `src/configs/entitiesConfig.js` bajo la clave del endpoint.
2. Verificar que existe el servicio correspondiente en `src/services/domain/{entidad}/`.
3. Si el servicio no existe, crearlo siguiendo el patrón de los servicios existentes.
4. La ruta `/admin/{entidad}` ya existe automáticamente (ruta dinámica).
5. Añadir la entidad a `navigationConfig.js` si debe aparecer en el menú.

---

## Reglas para agentes

- No modificar `EntityClient/index.js` para casos específicos de una entidad — usar el config.
- No duplicar lógica de tabla o filtros que el EntityClient ya gestiona.
- Antes de crear una pantalla de admin desde cero, verificar si el EntityClient puede cubrir el caso.
- Si el config de `entitiesConfig.js` no soporta un campo necesario, proponer la extensión del config antes de crear una pantalla alternativa.
- Los cambios en `entitiesConfig.js` afectan a todas las entidades que lo usan — revisar impacto antes de modificar propiedades generales.
- Las rutas de navegación en el config usan `:id` como placeholder: `"/admin/customers/:id"`.
