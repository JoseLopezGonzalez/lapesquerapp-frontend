export const configs = {
  'raw-material-receptions': {
    title: "Recepciones de materia prima",
    description: "Crea, edita, genera reportes y más.",
    emptyState: {
      title: "No existen recepciones según los filtros",
      description: "Ajusta los filtros o crea una nueva recepción.",
   },
    endpoint: "raw-material-receptions",
    viewRoute: "/admin/raw-material-receptions/:id",
    deleteEndpoint: "/raw-material-receptions/:id",
    createPath: "/admin/raw-material-receptions/create",
    filtersGroup: {
      search: {
        name: "search",
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Buscar",
            type: "search",
            placeholder: "Buscar por ID, proveedor o notas",
          },
        ],
      },
      groups: [
        {
          name: "generals",
          label: "Generales",
          filters: [
            {
              name: "notes",
              label: "Notas",
              type: "textarea",
              placeholder: "Buscar por notas",
            },
            {
              name: "date",
              label: "Fecha",
              type: "dateRange",
            },
          ],
        },
        {
          name: "ids",
          label: "Números de ID",
          filters: [
            {
              name: "ids",
              label: "Números de ID",
              type: "textAccumulator",
              placeholder: "Buscar por IDs",
            },
            {
              name: "status",
              label: "Estado",
              type: "pairSelectBoxes",
              options: [
                { name: "pending", label: "Pendiente", value: false },
                { name: "completed", label: "Completado", value: false },
              ],
            },
            {
              name: "netWeight",
              label: "Peso Neto",
              type: "number",
              placeholder: "Buscar por peso neto",
            },
            {
              name: "dateTest",
              label: "Fecha",
              type: "date",
              placeholder: "Buscar por fecha",
            },
          ],
        },
        {
          name: "suppliers",
          label: "Proveedor",
          filters: [
            {
              name: "suppliers",
              label: "Proveedor",
              type: "autocomplete",
              placeholder: "Buscar por proveedor",
              endpoint: "suppliers",
            },
          ],
        },
        {
          name: "species",
          label: "Especie",
          filters: [
            {
              name: "species",
              label: "Especie",
              type: "autocomplete",
              placeholder: "Buscar por especie",
              endpoint: "species",
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "supplier", label: "Proveedor", type: "text", path: "supplier.name" },
        { name: "species", label: "Especie", type: "text", path: "species.name" },
        { name: "notes", label: "Notas", type: "text", path: "notes" },
        { name: "netWeight", label: "Peso Neto", type: "text", path: "netWeight" },
        { name: "date", label: "Fecha", type: "date", path: "date" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  orders: {
    title: "Pedidos",
    description: "Gestiona, edita, y consulta pedidos.",
    emptyState: {
      title: "No existen pedidos según los filtros",
      description: "Modifica los filtros o crea un nuevo pedido.",
    },
    endpoint: "orders",
    viewRoute: "/admin/orders/:id",
    deleteEndpoint: "/orders/:id",
    createPath: "/admin/orders/create",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Buscar",
            type: "search",
            placeholder: "Buscar por ID, referencia o cliente",
          },
        ],
      },
      groups: [
        {
          name: "generals",
          label: "Generales",
          filters: [
            {
              name: "customers",
              label: "Cliente",
              type: "autocomplete",
              placeholder: "Seleccionar cliente",
              endpoint: "customers",
            },
            {
              name: "status",
              label: "Estado",
              type: "pairSelectBoxes",
              options: [
                { name: "pending", label: "Pendiente", value: false },
                { name: "finished", label: "Finalizado", value: false },
                { name: "canceled", label: "Cancelado", value: false },
              ],
            },
          ],
        },
        {
          name: "dates",
          label: "Fechas",
          filters: [
            {
              name: "entryDate",
              label: "Fecha de entrada",
              type: "dateRange",
            },
            {
              name: "loadDate",
              label: "Fecha de carga",
              type: "dateRange",
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "buyerReference", label: "Referencia", type: "text", path: "buyerReference" },
        { name: "customerName", label: "Cliente", type: "text", path: "customer.name" },
        {
          name: "status",
          label: "Estado",
          type: "badge",
          options: {
            pending: { label: "Pendiente", color: "warning", outline: true },
            finished: { label: "Finalizado", color: "success", outline: true },
            canceled: { label: "Cancelado", color: "primary", outline: true },
            default: { label: "Desconocido", color: "secondary", outline: true },
          },
        },
        { name: "entryDate", label: "Fecha de entrada", type: "date", path: "entryDate" },
        { name: "loadDate", label: "Fecha de carga", type: "date", path: "loadDate" },
        { name: "numberOfPallets", label: "Nº Palets", type: "text", path: "numberOfPallets" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
};




/* POR IMPLEMENTAR 
- Empty state




*/
