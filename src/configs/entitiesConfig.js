export const configs = {
  'raw-material-receptions': {
    title: "Recepciones de materia prima",
    description: "Crea, edita, genera reportes y más.",
    endpoint: "raw-material-receptions",
    viewRoute: "/admin/raw-material-receptions/:id",
    deleteEndpoint: "/raw-material-receptions/:id",
    createPath: "/admin/raw-material-receptions/create",
    filters: [
      {
        name: "id",
        label: "Buscar",
        type: "search",
        placeholder: "Buscar por ID, proveedor o notas",
      },
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
      /* Text accumulator */
      {
        name: "ids",
        label: "Numeros de ID",
        type: "textAccumulator",
        placeholder: "Buscar por IDs",
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
