export const configs = {
    'raw-material-receptions': {
      title: "Recepciones de materia prima",
      description: "Crea, edita, genera reportes y más.",
      endpoint: "raw-material-receptions",
      viewRoute: "/admin/raw-material-receptions/:id", // Endpoint para ver
      deleteEndpoint: "/raw-material-receptions/:id", // Endpoint para eliminar
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
  };
  