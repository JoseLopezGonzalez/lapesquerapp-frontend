export const configs = {
  'raw-material-receptions': {
    title: "Recepciones de materia prima",
    description: "Crea, edita, genera reportes y más.",
    endpoint: "raw-material-receptions",
    viewRoute: "/admin/raw-material-receptions/:id",
    deleteEndpoint: "/raw-material-receptions/:id",
    createPath: "/admin/raw-material-receptions/create",
    filtersGroup: [
      {
        name: "search",
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Buscar",
            type: "search",
            placeholder: "Buscar por ID, proveedor o notas",
          },
        ]
      },
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
        ]
      },
      {
        name: "ids",
        label: "Numeros de ID",
        filters: [
          /* Text accumulator */
          {
            name: "ids",
            label: "Numeros de ID",
            type: "textAccumulator",
            placeholder: "Buscar por IDs",
          },
          /* SelectBoxes */
          {
            name: "status",
            label: "Estado",
            type: "pairSelectBoxes",
            options: [
              { name: "pending", label: "Pendiente", value: false },
              { name: "completed", label: "Completado", value: false },
            ],
          },
          /* Numbers */
          {
            name: "netWeight",
            label: "Peso Neto",
            type: "number",
            placeholder: "Buscar por peso neto",
          },
          /* Date */
          {
            name: "dateTest",
            label: "Fecha",
            type: "date",
            placeholder: "Buscar por fecha",
          },
        ]
      },


      /* Autocomplete */
      {
        name: "suppliers",
        label: "Proveedor",
        filters: [{
          name: "suppliers",
          label: "Proveedor",
          type: "autocomplete",
          placeholder: "Buscar por proveedor",
          endpoint: "suppliers", // Endpoint para obtener las opciones dinámicas
        }]
      },
      /* Autocomplete Species */
      {
        name: "species",
        label: "Especie",
        filters: [{
          name: "species",
          label: "Especie",
          type: "autocomplete",
          placeholder: "Buscar por especie",
          endpoint: "species",
        }]
      }

    ],
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "supplier", label: "Proveedor", type: "text", path: "supplier.name" },
        { name: "species", label: "Especie", type: "text", path: "species.name" },
        { name: "notes", label: "Notas", type: "text", path: "notes" },
        { name: "netWeight", label: "Peso Neto", type: "text", path: "netWeight" },
        { name: "date", label: "Fecha", type: "text", path: "date" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },

  },
  orders: {
    title: "Pedidos",
    description: "Gestiona, edita, y consulta pedidos.",
    endpoint: "orders",
    viewRoute: "/admin/orders/:id",
    deleteEndpoint: "/orders/:id",
    createPath: "/admin/orders/create",
    filtersGroup: [
      {
        name: "search",
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
      {
        name: "generals",
        label: "Generales",
        filters: [
          {
            name: "customer",
            label: "Cliente",
            type: "autocomplete",
            placeholder: "Seleccionar cliente",
            endpoint: "customers", // Endpoint para opciones dinámicas
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
        { name: "entryDate", label: "Fecha de entrada", type: "text", path: "entryDate" },
        { name: "loadDate", label: "Fecha de carga", type: "text", path: "loadDate" },
        { name: "numberOfPallets", label: "Nº Palets", type: "text", path: "numberOfPallets" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
};
