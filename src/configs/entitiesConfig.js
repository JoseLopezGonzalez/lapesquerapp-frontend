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
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "supplier", label: "Proveedor", type: "text", path: "supplier.name" },
        { name: "notes", label: "Notas", type: "text", path: "notes" },
        { name: "netWeight", label: "Peso Neto", type: "text", path: "netWeight" },
        { name: "date", label: "Fecha", type: "text", path: "date" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
};
