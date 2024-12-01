export const configs = {
    rawMaterialReceptions: {
      title: "Recepciones de Materia Prima",
      description: "Gestión de recepciones de materia prima.",
      endpoint: "https://api.congeladosbrisamar.es/api/v1/raw-material-receptions",
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
    suppliers: {
      title: "Proveedores",
      description: "Gestión de proveedores.",
      endpoint: "/api/suppliers",
      filters: [
        {
          name: "name",
          label: "Nombre",
          type: "text",
          placeholder: "Buscar por nombre",
        },
        {
          name: "email",
          label: "Email",
          type: "text",
          placeholder: "Buscar por email",
        },
      ],
      table: {
        headers: [
          { name: "id", label: "ID", type: "text" },
          { name: "name", label: "Nombre", type: "text" },
          { name: "email", label: "Email", type: "text" },
          { name: "phone", label: "Teléfono", type: "text" },
          { name: "actions", label: "Acciones", type: "button" },
        ],
      },
    },
    // Agrega más entidades aquí...
  };
  