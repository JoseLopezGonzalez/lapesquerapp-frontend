export const configs = {
  'raw-material-receptions': {
    title: "Recepciones de materia prima",
    description: "Crea, edita, genera reportes y más.",
    endpoint: "raw-material-receptions",
    viewRoute: "/admin/raw-material-receptions/:id",
    deleteEndpoint: "/raw-material-receptions/:id",
    filters: [
      {
        name: "supplier",
        label: "Proveedor",
        type: "text",
        placeholder: "Buscar por proveedor",
      },
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
    table: {
      headers: [
        { name: "id", label: "ID", type: "text" },
        { name: "supplier", label: "Proveedor", type: "text" },
        { name: "notes", label: "Notas", type: "text" },
        { name: "netWeight", label: "Peso Neto", type: "text" },
        { name: "date", label: "Fecha", type: "text" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  orders: {
    title: "Pedidos",
    description: "Gestiona pedidos, edita detalles y más.",
    endpoint: "orders",
    viewRoute: "/admin/orders/:id",
    deleteEndpoint: "/orders/:id",
    filters: [
      {
        name: "status",
        label: "Estado",
        type: "pairSelectBox",
        options: [
          { name: "pending", label: "Pendiente" },
          { name: "completed", label: "Completado" },
        ],
      },
      {
        name: "customer",
        label: "Cliente",
        type: "autocomplete",
        placeholder: "Buscar por cliente",
      },
      {
        name: "date",
        label: "Fecha",
        type: "dateRange",
      },
    ],
    table: {
      headers: [
        { name: "id", label: "ID", type: "text" },
        { name: "status", label: "Estado", type: "text" },
        { name: "customer", label: "Cliente", type: "text" },
        { name: "total", label: "Total", type: "text" },
        { name: "date", label: "Fecha", type: "text" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
};
