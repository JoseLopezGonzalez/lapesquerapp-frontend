// src/configs/rawMaterialReceptions.js

export const rawMaterialReceptionsConfig = {
    // Información general de la entidad
    title: "Recepciones de Materia Prima",
    description: "Administra las recepciones de materia prima. Crea, edita, elimina y genera reportes.",
  
    // Endpoints de la API
    endpoints: {
      list: "/api/raw-material-receptions", // Endpoint para obtener datos paginados
      create: "/api/raw-material-receptions/create", // Endpoint para crear
      update: "/api/raw-material-receptions/update", // Endpoint para actualizar
      delete: "/api/raw-material-receptions/delete", // Endpoint para eliminar
      report: "/api/raw-material-receptions/report", // Generar reportes
    },
  
    // Configuración de la tabla
    table: {
      headers: [
        { name: "id", label: "ID", type: "text" },
        { name: "supplier", label: "Proveedor", type: "text" },
        { name: "notes", label: "Observaciones", type: "text" },
        { name: "netWeight", label: "Peso Neto", type: "text" },
        { name: "date", label: "Fecha", type: "text" },
        { name: "actions", label: "Acciones", type: "button" }, // Botones como ver/eliminar
      ],
    },
  
    // Configuración de filtros
    filters: [
      {
        name: "id",
        label: "ID",
        type: "text",
        placeholder: "Buscar por ID",
        value: "", // Valor inicial
      },
      {
        name: "supplier",
        label: "Proveedor",
        type: "autocomplete",
        placeholder: "Selecciona un proveedor",
        options: [], // Se llenará dinámicamente
        value: [],
      },
      {
        name: "dateRange",
        label: "Rango de Fechas",
        type: "dateRange",
        placeholder: "Selecciona un rango de fechas",
        value: { start: "", end: "" }, // Valores iniciales
      },
      {
        name: "notes",
        label: "Observaciones",
        type: "textarea",
        placeholder: "Introduce texto para buscar en observaciones",
        value: "",
      },
    ],
  
    // Botones del header de la tabla
    headerButtons: [
      {
        label: "Nuevo",
        action: "create", // Redirige a la página de creación
        icon: "PlusIcon", // Referencia a un ícono reutilizable
      },
      {
        label: "Exportar",
        action: "export", // Llama al endpoint para exportar datos
        icon: "ArrowDownTrayIcon",
      },
    ],
  };
  