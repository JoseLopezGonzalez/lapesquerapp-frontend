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
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "date", label: "Fecha", type: "date", path: "date" },
        { name: "supplier", label: "Proveedor", type: "text", path: "supplier.name" },
        { name: "species", label: "Especie", type: "text", path: "species.name" },
        { name: "notes", label: "Notas", type: "text", path: "notes" },
        { name: "netWeight", label: "Peso Neto", type: "weight", path: "netWeight" },
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
    exports: [
      {
        title: "Exportar a Excel",
        endpoint: "orders_report",
        type: "excel",
        waitingMessage: "Generando exportación a excel",
        fileName: "export_pedidos",
      },
      {
        title: "Exportar a PDF",
        endpoint: "/exports/orders_report/pdf",
        type: "pdf",
        waitingMessage: "Generando exportación a pdf",
        fileName: "export_pedidos",
      },
    ],
    reports: [
      {
        title: "Reporte de pedidos",
        endpoint: "/exports/orders_report/pdf",
        waitingMessage: "Generando reporte pdf",
        fileName: "report_pedidos",
      },
      {
        title: "Reporte de pedidos (Excel)",
        endpoint: "orders_report",
        waitingMessage: "Generando reporte excel",
        fileName: "report_pedidos",
      }
    ],
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Buscar",
            type: "search",
            placeholder: "Buscar por id",
          },
        ],
      },
      groups: [
        {
          name: "generals",
          label: "Generales",
          filters: [
            /* ids */
            {
              name: "ids",
              label: "Números de ID",
              type: "textAccumulator",
              placeholder: "Buscar por IDs",
            },


            /* Buyer reference */
            {
              name: "buyerReference",
              label: "Referencia",
              type: "text",
              placeholder: "Buscar por referencia",
            },
            {
              name: "status",
              label: "Estado",
              type: "pairSelectBoxes",
              options: [
                { name: "pending", label: "Pendiente", value: false },
                { name: "finished", label: "Finalizado", value: false },
              ],
            },
          ],
        },
        {
          name: "dates",
          label: "Fechas",
          filters: [
            /* {
              name: "entryDate",
              label: "Fecha de entrada",
              type: "dateRange",
              visibleMonths: 1,
            }, */
            {
              name: "loadDate",
              label: "Fecha de carga",
              type: "dateRange",
              visibleMonths: 1,
            },
          ],
        },
        /* Customers */
        {
          name: "customers",
          label: "Clientes",
          filters: [
            {
              name: "customers",
              label: "Clientes",
              type: "autocomplete",
              placeholder: "Buscar por cliente",
              endpoint: "customers",
            },
          ],
        },
        /* salesperson */
        {
          name: "salesperson",
          label: "Vendedor",
          filters: [
            {
              name: "salesperson",
              label: "Vendedor",
              type: "autocomplete",
              placeholder: "Buscar por vendedor",
              endpoint: "salespersons",
            },
          ],
        },
        /* Transporte */
        {
          name: "transport",
          label: "Transporte",
          filters: [
            {
              name: "transport",
              label: "Transporte",
              type: "autocomplete",
              placeholder: "Buscar por transporte",
              endpoint: "transports",
            },
          ],
        },
        /* incoterm */
        {
          name: "incoterm",
          label: "Incoterm",
          filters: [
            {
              name: "incoterm",
              label: "Incoterm",
              type: "autocomplete",
              placeholder: "Buscar por incoterm",
              endpoint: "incoterms",
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "loadDate", label: "Fecha Salida", type: "date", path: "loadDate" },
        { name: "customerName", label: "Cliente", type: "text", path: "customer.name" },
        { name: "buyerReference", label: "Referencia", type: "text", path: "buyerReference" },
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
        { name: "totalNetWeight", label: "Peso total", type: "weight", path: "totalNetWeight" },
        { name: "totalBoxes", label: "Cajas", type: "text", path: "totalBoxes" },
        { name: "pallets", label: "Palets", type: "text", path: "pallets" },
        { name: "salesperson", label: "Vendedor", type: "text", path: "salesperson.name" },
        { name: "incoterm", label: "Incoterm", type: "text", path: "incoterm.code" },
        { name: "transport", label: "Transporte", type: "text", path: "transport.name" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  users: {
    title: "Usuarios",
    description: "Gestiona, edita y consulta usuarios.",
    emptyState: {
      title: "No existen usuarios según los filtros",
      description: "Ajusta los filtros o crea un nuevo usuario.",
    },
    endpoint: "users",
    viewRoute: "/admin/users/:id",
    deleteEndpoint: "/users/:id",
    createPath: "/admin/users/create",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "name",
            label: "Nombre",
            type: "search",
            placeholder: "Buscar por nombre",
          },
          
        ],
      },
      groups: [
        {
          name: "generals",
          label: "Generales",
          filters: [
            {
              name: "id",
              label: "ID",
              type: "textAccumulator",
              placeholder: "Buscar por ID",
            },
            {
              name: "roles",
              label: "Roles",
              type: "autocomplete",
              placeholder: "Seleccionar roles",
              endpoint: "roles",
            },
          ],
        },
        {
          name: "dates",
          label: "Fechas",
          filters: [
            {
              name: "created_at",
              label: "Fecha de creación",
              type: "dateRange",
              visibleMonths: 1,
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "email", label: "Correo electrónico", type: "text", path: "email" },
        { name: "roles", label: "Rol", type: "text", path: "roles" },

       
        { name: "created_at", label: "Fecha de creación", type: "date", path: "created_at" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },

};




/* POR IMPLEMENTAR 
- type: "number"




*/
