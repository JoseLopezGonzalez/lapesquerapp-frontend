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
              name: "dates",
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
              endpoint: "suppliers/options",
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
              endpoint: "species/options",
            },
          ],
        },
        /* Products */
        {
          name: "products",
          label: "Productos",
          filters: [
            {
              name: "products",
              label: "Productos",
              type: "autocomplete",
              placeholder: "Buscar por producto",
              endpoint: "products/options",
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
              endpoint: "customers/options",
            },
          ],
        },
        /* salesperson */
        {
          name: "salespeple",
          label: "Comerciales",
          filters: [
            {
              name: "salespeople",
              label: "Comerciales",
              type: "autocomplete",
              placeholder: "Buscar por comercial",
              endpoint: "salespeople/options",
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
              endpoint: "transports/options",
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
              endpoint: "incoterms/options",
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
  /* Transports */
  transports: {
    title: "Transportes",
    description: "Gestiona, edita y consulta transportes.",
    emptyState: {
      title: "No existen transportes según los filtros",
      description: "Ajusta los filtros o crea un nuevo transporte.",
    },
    endpoint: "transports",
    viewRoute: "/admin/transports/:id",
    deleteEndpoint: "/transports/:id",
    createPath: "/admin/transports/create",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
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
            {
              name: "ids",
              label: "IDs",
              type: "textAccumulator",
              placeholder: "Buscar por ID",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        /* Address */
        { name: "address", label: "Dirección", type: "text", path: "address" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },

  /* Products */
  products:{
    title: "Productos",
    description: "Gestiona, edita y consulta productos.",
    emptyState: {
      title: "No existen productos según los filtros",
      description: "Ajusta los filtros o crea un nuevo producto.",
    },
    endpoint: "products",
    viewRoute: "/admin/products/:id",
    deleteEndpoint: "/products/:id",
    createPath: "/admin/products/create",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
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
            /* NAme */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
            {
              name: "ids",
              label: "IDs",
              type: "textAccumulator",
              placeholder: "Buscar por ID",
            },
          ],
        },
        /* Species */
        {
          name: "species",
          label: "Especies",
          filters: [
            {
              name: "species",
              label: "Especies",
              type: "autocomplete",
              placeholder: "Buscar por especie",
              endpoint: "species/options",
            },
          ],
        },
        /* Capture Zones */
        {
          name: "captureZones",
          label: "Zonas de captura",
          filters: [
            {
              name: "captureZones",
              label: "Zonas de captura",
              type: "autocomplete",
              placeholder: "Buscar por zona de captura",
              endpoint: "capture-zones/options",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        /* species */
        { name: "species", label: "Especie", type: "text", path: "species.name" },
        /* captureZone */
        { name: "captureZone", label: "Zona de captura", type: "text", path: "captureZone.name" },
        /* articleGtin */
        { name: "articleGtin", label: "GTIN", type: "text", path: "articleGtin" },
        /* boxGtin */
        { name: "boxGtin", label: "GTIN Caja", type: "text", path: "boxGtin" },
        /* palletGtin */
        { name: "palletGtin", label: "GTIN Palet", type: "text", path: "palletGtin" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },

  /* Stores */
  stores: {
    title: "Almacenes",
    description: "Gestiona, edita y consulta almacenes.",
    emptyState: {
      title: "No existen almacenes según los filtros",
      description: "Ajusta los filtros o crea un nuevo almacén.",
    },
    endpoint: "stores",
    viewRoute: "/admin/stores/:id",
    deleteEndpoint: "/stores/:id",
    createPath: "/admin/stores/create",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
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
            {
              name: "ids",
              label: "IDs",
              type: "textAccumulator",
              placeholder: "Buscar por ID",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        /* temperatur */
        { name: "temperature", label: "Temperatura", type: "text", path: "temperature" },
        /* totalNetWeight */
        { name: "totalNetWeight", label: "Peso total", type: "weight", path: "totalNetWeight" },
        /* Capacity */
        { name: "capacity", label: "Capacidad", type: "weight", path: "capacity" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },

};




/* POR IMPLEMENTAR 
- type: "number"




*/
