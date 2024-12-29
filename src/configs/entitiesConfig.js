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
      /* Autocomplete */
      {
        name: "suppliers",
        label: "Proveedor",
        type: "autocomplete",
        placeholder: "Buscar por proveedor",
        endpoint: "suppliers", // Endpoint para obtener las opciones dinámicas
      },
      /* Autocomplete Species */
      {
        name: "species",
        label: "Especie",
        type: "autocomplete",
        placeholder: "Buscar por especie",
        endpoint: "species",
      },
      
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
};
