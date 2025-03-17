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
              name: "ids",
              label: "Números de ID",
              type: "textAccumulator",
              placeholder: "Buscar por IDs",
            },
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
    perPage: 12,
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
            {
              name: "loadDate",
              label: "Fecha de carga",
              type: "dateRange",
              visibleMonths: 1,
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
    createForm: {
      title: "Nuevo Pedido",
      endpoint: "v3/orders",
      method: "POST",
      /* success Message */
      successMessage: "Pedido creado con éxito",
      /* error message */
      errorMessage: "Error al crear el pedido",
      fields: [
        /* Cliente Autocomplete */
        {
          name: "customer",
          label: "Cliente",
          type: "Autocomplete",
          endpoint: "customers/options",
          validation: {
            required: "Seleccionar un cliente es obligatorio"
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 2,
            xl: 2,
          }
        },
        /* Buyer reference input */
        {
          name: "buyerReference",
          label: "Referencia",
          type: "text",
          validation: {
            required: "La referencia es obligatoria",
            minLength: {
              value: 3,
              message: "La referencia debe tener al menos 3 caracteres"
            },
            maxLength: {
              value: 20,
              message: "La referencia no puede tener más de 20 caracteres"
            }
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 2,
            xl: 1,
          }
        },
        
        /* Incoterm Autocomplete */
        {
          name: "incoterm",
          label: "Incoterm",
          type: "Autocomplete",
          endpoint: "incoterms/options",
          validation: {
            required: "Seleccionar un Incoterm es obligatorio"
          },
          cols: {
            sm: 6,
            md: 6,
            lg: 2,
            xl: 1,
          }
        },
        /* entryDate */
        {
          name: "entryDate",
          label: "Fecha de entrada",
          type: "date",
          validation: {
            required: "La fecha de entrada es obligatoria",
            /* validate: {
              validDate: value => (new Date(value) >= new Date()) || "La fecha debe ser hoy o futura"
            } */
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 1,
          }
        },
        /* loadDate */
        {
          name: "loadDate",
          label: "Fecha de carga",
          type: "date",
          validation: {
            required: "La fecha de carga es obligatoria",
            /* validate: {
              validDate: value => (new Date(value) >= new Date()) || "La fecha debe ser hoy o futura"
            } */
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 1,
          }
        },
        /* Salesperson Autocomplete */
        {
          name: "salesperson",
          label: "Comercial",
          type: "Autocomplete",
          endpoint: "salespeople/options",
          validation: {
            required: "Seleccionar un comercial es obligatorio"
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          }
        },
        /* Transport Autocomplete */
        {
          name: "transport",
          label: "Transporte",
          type: "Autocomplete",
          endpoint: "transports/options",
          validation: {
            required: "Seleccionar un transporte es obligatorio"
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          }
        },
        /* paymentTerm Autocomplete */
        {
          name: "paymentTerm",
          label: "Forma de pago",
          type: "Autocomplete",
          endpoint: "payment-terms/options",
          validation: {
            required: "Seleccionar una forma de pago es obligatorio"
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          }
        },
        /* billingAddress */
        {
          name: "billingAddress",
          label: "Dirección de facturación",
          type: "textarea",
          validation: {
            required: "La dirección de facturación es obligatoria",
            minLength: {
              value: 10,
              message: "Debe contener al menos 10 caracteres"
            }
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          }
        },
        /* shippingAddress */
        {
          name: "shippingAddress",
          label: "Dirección de envío",
          type: "textarea",
          validation: {
            required: "La dirección de envío es obligatoria",
            minLength: {
              value: 10,
              message: "Debe contener al menos 10 caracteres"
            }
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          }
        },
        /* productionNotes */
        {
          name: "productionNotes",
          label: "Notas de producción",
          type: "textarea",
          validation: {
            maxLength: {
              value: 200,
              message: "No puede exceder los 200 caracteres"
            }
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          }
        },
        /* accountingNotes */
        {
          name: "accountingNotes",
          label: "Notas de contabilidad",
          type: "textarea",
          validation: {
            maxLength: {
              value: 200,
              message: "No puede exceder los 200 caracteres"
            }
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          }
        },
        /* emails */
        {
          name: "emails",
          label: "Emails",
          type: "textarea",
          validation: {
            required: "El campo de emails es obligatorio",
            pattern: {
              value: "/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/",
              message: "Formato de email no válido"
            }
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          }
        }
      ]
    }

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
    /* createForm */
    createForm: {
      title: "Nuevo Usuario",
      endpoint: "users",
      method: "POST",
      successMessage: "Usuario creado con éxito",
      errorMessage: "Error al crear el usuario",
      fields: [
        {
          name: "name",
          label: "Nombre",
          type: "text",
          validation: {
            required: "El nombre es obligatorio",
            minLength: {
              value: 3,
              message: "El nombre debe tener al menos 3 caracteres"
            },
            maxLength: {
              value: 50,
              message: "El nombre no puede tener más de 50 caracteres"
            }
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          }
        },
        {
          name: "email",
          label: "Correo electrónico",
          type: "text",
          validation: {
            required: "El correo electrónico es obligatorio",
            pattern: {
              value: "/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/",
              message: "Formato de email no válido"
            }
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          }
        },
        {
          name: "password",
          label: "Contraseña",
          type: "text",
          validation: {
            required: "La contraseña es obligatoria",
            minLength: {
              value: 6,
              message: "La contraseña debe tener al menos 6 caracteres"
            },
            maxLength: {
              value: 20,
              message: "La contraseña no puede tener más de 20 caracteres"
            }
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          }
        },
        {
          name: "role",
          label: "Rol",
          type: "Autocomplete",
          endpoint: "roles/options",
          validation: {
            required: "Seleccionar un rol es obligatorio"
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          }
        },
      ]
    }
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
            /* address text area*/
            {
              name: "address",
              label: "Dirección",
              type: "textarea",
              placeholder: "Buscar por dirección",
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
  products: {
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
            /* articleGtin */
            {
              name: "articleGtin",
              label: "GTIN",
              type: "text",
              placeholder: "Buscar por GTIN",
            },
            /* boxGtin */
            {
              name: "boxGtin",
              label: "GTIN Caja",
              type: "text",
              placeholder: "Buscar por GTIN Caja",
            },
            /* palletGtin */
            {
              name: "palletGtin",
              label: "GTIN Palet",
              type: "text",
              placeholder: "Buscar por GTIN Palet",
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
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
  /* boxes */
  boxes: {
    title: "Cajas",
    description: "Gestiona, edita y consulta cajas.",
    emptyState: {
      title: "No existen cajas según los filtros",
      description: "Ajusta los filtros o crea una nueva caja.",
    },
    endpoint: "boxes",
    viewRoute: "/admin/boxes/:id",
    deleteEndpoint: "/boxes/:id",
    createPath: "/admin/boxes/create",
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
            {
              name: "lots",
              label: "Lotes",
              type: "textAccumulator",
              placeholder: "Buscar por lotes",
            },
            /* gs1128 */
            {
              name: "gs1128",
              label: "GS1128",
              type: "textAccumulator",
              placeholder: "Buscar por GS1128",
            },

            /* createdAt */
            {
              name: "createdAt",
              label: "Fecha de lectura",
              type: "dateRange",
              visibleMonths: 1,
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

        /* Pallets */
        {
          name: "pallets",
          label: "Palets",
          filters: [
            {
              name: "pallets",
              label: "Palets",
              type: "textAccumulator",
              placeholder: "Buscar por palet",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "product.name" },
        { name: "lot", label: "Lote", type: "text", path: "lot" },
        { name: "gs1128", label: "GS1128", type: "text", path: "gs1128" },
        { name: "netWeight", label: "Peso neto", type: "weight", path: "netWeight" },
        { name: "palletId", label: "Palet", type: "text", path: "palletId" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  /* Pallets */
  pallets: {
    title: "Palets",
    description: "Gestiona, edita y consulta palets.",
    emptyState: {
      title: "No existen palets según los filtros",
      description: "Ajusta los filtros o crea un nuevo palet.",
    },
    endpoint: "pallets",
    viewRoute: "/admin/pallets/:id",
    deleteEndpoint: "/pallets/:id",
    createPath: "/admin/pallets/create",
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
            /* state */
            {
              name: "state",
              label: "Estado",
              type: "pairSelectBoxes",
              options: [
                { name: "stored", label: "Almacenado", value: false },
                { name: "shipped", label: "Enviado", value: false },
              ]
            },
            /* orderState */
            {
              name: "orderState",
              label: "Estado del pedido",
              type: "pairSelectBoxes",
              options: [
                { name: "pending", label: "Pendiente", value: false },
                { name: "finished", label: "Finalizado", value: false },
              ]
            },
            /*  Position; locatd, unlocated*/
            {
              name: "position",
              label: "Posición",
              type: "pairSelectBoxes",
              options: [
                { name: "located", label: "Ubicado", value: false },
                { name: "unlocated", label: "No ubicado", value: false },
              ]
            },
            /* Notes */
            {
              name: "notes",
              label: "Notas",
              type: "textarea",
              placeholder: "Buscar por notas",
            },
            /* lots */
            {
              name: "lots",
              label: "Lotes",
              type: "textAccumulator",
              placeholder: "Buscar por lotes",
            },
          ],
        },
        {
          name: "dates",
          label: "Fechas",
          filters: [
            {
              name: "dates",
              label: "Fecha de creación",
              type: "dateRange",
              visibleMonths: 1,
            },
          ],
        },
        /* products */
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
        /* Stores */
        {
          name: "stores",
          label: "Almacenes",
          filters: [
            {
              name: "stores",
              label: "Almacenes",
              type: "autocomplete",
              placeholder: "Buscar por almacén",
              endpoint: "stores/options",
            },
          ],
        },
        /* Order */
        {
          name: "orders",
          label: "Pedidos",
          filters: [
            {
              name: "orders",
              label: "Pedidos",
              type: "textAccumulator",
              placeholder: "Buscar por pedidos",
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        /* articlesNames */
        { name: "articlesNames", label: "Artículos", type: "list", path: "articlesNames" },
        /* lots */
        { name: "lots", label: "Lotes", type: "list", path: "lots" },
        /* observations */
        { name: "observations", label: "Observaciones", type: "text", path: "observations" },
        /* store */
        { name: "store", label: "Almacén", type: "text", path: "store" },
        /* orderId*/
        { name: "orderId", label: "Pedido", type: "text", path: "orderId" },
        /* { name: "name", label: "Nombre", type: "text", path: "article.name" }, */
        {
          name: "state", label: "Estado", type: "badge",
          options:
          {
            almacenado: { label: "Almacenado", color: "warning", outline: true },
            enviado: { label: "Enviado", color: "success", outline: true },
            default: { label: "Desconocido", color: "secondary", outline: true },
          }
        },
        /* numberOfBoxes */
        { name: "numberOfBoxes", label: "Cajas", type: "text", path: "numberOfBoxes" },
        /* netWeight */
        { name: "netWeight", label: "Peso neto", type: "weight", path: "netWeight" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  /* customers */
  customers: {
    title: "Clientes",
    description: "Gestiona, edita y consulta clientes.",
    emptyState: {
      title: "No existen clientes según los filtros",
      description: "Ajusta los filtros o crea un nuevo cliente.",
    },
    endpoint: "customers",
    viewRoute: "/admin/customers/:id",
    deleteEndpoint: "/customers/:id",
    createPath: "/admin/customers/create",
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
            /* vat_number */
            {
              name: "vatNumber",
              label: "NIF",
              type: "text",
              placeholder: "Buscar por NIF",
            },
            /* country */
            {
              name: "country",
              label: "País",
              type: "text",
              placeholder: "Buscar por país",
            },
          ],
        },
        /* Salespeople */
        {
          name: "salespeople",
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

        /* countries */
        {
          name: "countries",
          label: "Países",
          filters: [
            {
              name: "countries",
              label: "Países",
              type: "autocomplete",
              placeholder: "Buscar por país",
              endpoint: "countries/options",
            },
          ],
        },
        /* paymentTerms */
        {
          name: "paymentTerms",
          label: "Formas de pago",
          filters: [
            {
              name: "paymentTerms",
              label: "Formas de pago",
              type: "autocomplete",
              placeholder: "Buscar por forma de pago",
              endpoint: "payment-terms/options",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        /* vat_number */
        { name: "vatNumber", label: "NIF", type: "text", path: "vatNumber" },
        /* paymenTerm */
        { name: "paymentTerm", label: "Plazo de pago", type: "text", path: "paymentTerm.name" },
        /* salesperson */
        { name: "salesperson", label: "Comercial", type: "text", path: "salesperson.name" },
        /* Country */
        { name: "country", label: "País", type: "text", path: "country.name" },

        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  /* suppliers */
  suppliers: {
    title: "Proveedores",
    description: "Gestiona, edita y consulta proveedores.",
    emptyState: {
      title: "No existen proveedores según los filtros",
      description: "Ajusta los filtros o crea un nuevo proveedor.",
    },
    endpoint: "suppliers",
    viewRoute: "/admin/suppliers/:id",
    deleteEndpoint: "/suppliers/:id",
    createPath: "/admin/suppliers/create",
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        /* 'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'contact_person' => $this->contact_person,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at, */
        /* email*/
        { name: "email", label: "Correo electrónico", type: "text", path: "email" },


        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  /* CaptureZones */
  'capture-zones': {
    title: "Zonas de captura",
    description: "Gestiona, edita y consulta zonas de captura.",
    emptyState: {
      title: "No existen zonas de captura según los filtros",
      description: "Ajusta los filtros o crea una nueva zona de captura.",
    },
    endpoint: "capture-zones",
    viewRoute: "/admin/capture-zones/:id",
    deleteEndpoint: "/capture-zones/:id",
    createPath: "/admin/capture-zones/create",
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  /* species */
  species: {
    title: "Especies",
    description: "Gestiona, edita y consulta especies.",
    emptyState: {
      title: "No existen especies según los filtros",
      description: "Ajusta los filtros o crea una nueva especie.",
    },
    endpoint: "species",
    viewRoute: "/admin/species/:id",
    deleteEndpoint: "/species/:id",
    createPath: "/admin/species/create",
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
            /* scientificName */
            {
              name: "scientificName",
              label: "Nombre científico",
              type: "text",
              placeholder: "Buscar por nombre científico",
            },
            /* fao */
            {
              name: "fao",
              label: "FAO",
              type: "text",
              placeholder: "Buscar por FAO",
            },
          ],
        },
        /* fishingGears */
        {
          name: "fishingGears",
          label: "Artes de pesca",
          filters: [
            {
              name: "fishingGears",
              label: "Artes de pesca",
              type: "autocomplete",
              placeholder: "Buscar por arte de pesca",
              endpoint: "fishing-gears/options",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "scientificName", label: "Nombre científico", type: "text", path: "scientificName" },
        /* fao */
        { name: "fao", label: "FAO", type: "text", path: "fao" },
        /* fishingGear */
        { name: "fishingGear", label: "Arte de pesca", type: "text", path: "fishingGear.name" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },

  /* incoterms */
  incoterms: {
    title: "Incoterms",
    description: "Gestiona, edita y consulta incoterms.",
    emptyState: {
      title: "No existen incoterms según los filtros",
      description: "Ajusta los filtros o crea un nuevo incoterm.",
    },
    endpoint: "incoterms",
    viewRoute: "/admin/incoterms/:id",
    deleteEndpoint: "/incoterms/:id",
    createPath: "/admin/incoterms/create",
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
            /* code */
            {
              name: "code",
              label: "Código",
              type: "text",
              placeholder: "Buscar por código",
            },
            /* description */
            {
              name: "description",
              label: "Descripción",
              type: "text",
              placeholder: "Buscar por descripción",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "code", label: "Código", type: "text", path: "code" },
        /* description */
        { name: "description", label: "Descripción", type: "text", path: "description" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
    /* createForm */
    createForm: {
      title: "Crear incoterm",
      fields: [
        {
          name: "code",
          label: "Código",
          type: "text",
          validations: {
            required: "El código es obligatorio",
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          }
        },
        {
          name: "description",
          label: "Descripción",
          type: "text",
          validations: {
            required: "La descripción es obligatoria",
          },
          cols: {
            sm: 4,
            md: 4,
            lg: 4,
            xl: 4,
          }
        }
      ]
    }
  },
  /* salespeople */
  salespeople: {
    title: "Comerciales",
    description: "Gestiona, edita y consulta comerciales.",
    emptyState: {
      title: "No existen comerciales según los filtros",
      description: "Ajusta los filtros o crea un nuevo comercial.",
    },
    endpoint: "salespeople",
    viewRoute: "/admin/salespeople/:id",
    deleteEndpoint: "/salespeople/:id",
    createPath: "/admin/salespeople/create",
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        /* email */
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  /* fishing-gears */
  'fishing-gears': {
    title: "Artes de pesca",
    description: "Gestiona, edita y consulta artes de pesca.",
    emptyState: {
      title: "No existen artes de pesca según los filtros",
      description: "Ajusta los filtros o crea un nuevo arte de pesca.",
    },
    endpoint: "fishing-gears",
    viewRoute: "/admin/fishing-gears/:id",
    deleteEndpoint: "/fishing-gears/:id",
    createPath: "/admin/fishing-gears/create",
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  /* payment-terms */
  'payment-terms': {
    title: "Plazos de pago",
    description: "Gestiona, edita y consulta plazos de pago.",
    emptyState: {
      title: "No existen plazos de pago según los filtros",
      description: "Ajusta los filtros o crea un nuevo plazo de pago.",
    },
    endpoint: "payment-terms",
    viewRoute: "/admin/payment-terms/:id",
    deleteEndpoint: "/payment-terms/:id",
    createPath: "/admin/payment-terms/create",
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
      ],
    },
  },
  /* countries */
  countries: {
    title: "Países",
    description: "Gestiona, edita y consulta países.",
    emptyState: {
      title: "No existen países según los filtros",
      description: "Ajusta los filtros o crea un nuevo país.",
    },
    endpoint: "countries",
    viewRoute: "/admin/countries/:id",
    deleteEndpoint: "/countries/:id",
    createPath: "/admin/countries/create",
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
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },

          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        /* action */
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },

  /* paymentTerms */
  'payment-terms': {
    title: "Métodos de pago",
    description: "Gestiona, edita y consulta métodos de pago.",
    emptyState: {
      title: "No existen plazos de pago según los filtros",
      description: "Ajusta los filtros o crea un nuevo plazo de pago.",
    },
    endpoint: "payment-terms",
    viewRoute: "/admin/payment-terms/:id",
    deleteEndpoint: "/payment-terms/:id",
    createPath: "/admin/payment-terms/create",
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
            /* ids */
            {
              name: "ids",
              label: "IDs",
              type: "textAccumulator",
              placeholder: "Buscar por ID",
            },
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        /* name */
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
    /* CreateForm */
    createForm: {
      title: "Crear método de pago",
      fields: [
        {
          name: "name",
          label: "Nombre",
          type: "text",
          placeholder: "Introduce el nombre",
          validation: {
            required: "El nombre es obligatorio",
          },
          cols: {
            sm: 6,
            md: 6,
            lg: 6,
            xl: 6,
          }
        },
      ],
    },
    
  },

  /* ceboDispatches*/
  'cebo-dispatches': {
    title: "Envíos de cebo",
    description: "Gestiona, edita y consulta envíos de cebo.",
    emptyState: {
      title: "No existen envíos de cebo según los filtros",
      description: "Ajusta los filtros o crea un nuevo envío de cebo.",
    },
    endpoint: "cebo-dispatches",
    viewRoute: "/admin/cebo-dispatches/:id",
    deleteEndpoint: "/cebo-dispatches/:id",
    createPath: "/admin/cebo-dispatches/create",
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
            /* ids */
            {
              name: "ids",
              label: "IDs",
              type: "textAccumulator",
              placeholder: "Buscar por ID",
            },
            /* notes */
            {
              name: "notes",
              label: "Notas",
              type: "textarea",
              placeholder: "Buscar por notas",
            },
            /* dates */
            {
              name: "dates",
              label: "Fecha",
              type: "dateRange",
              visibleMonths: 1,
            },
          ],
        },
        /* suppliers */
        {
          name: "suppliers",
          label: "Proveedores",
          filters: [
            {
              name: "suppliers",
              label: "Proveedores",
              type: "autocomplete",
              placeholder: "Buscar por proveedor",
              endpoint: "suppliers/options",
            },
          ],
        },
        /* products */
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
        /* date */
        { name: "date", label: "Fecha", type: "date", path: "date" },
        /* supplier */
        { name: "supplier", label: "Proveedor", type: "text", path: "supplier.name" },
        /* notes */
        { name: "notes", label: "Notas", type: "text", path: "notes" },
        /* netWeight */
        { name: "netWeight", label: "Peso neto", type: "weight", path: "netWeight" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },

  /* Sessions */
  sessions: {
    title: "Sesiones",
    description: "Gestiona, edita y consulta sesiones.",
    emptyState: {
      title: "No existen sesiones según los filtros",
      description: "Ajusta los filtros o crea una nueva sesión.",
    },
    endpoint: "sessions",
    viewRoute: "/admin/sessions/:id",
    deleteEndpoint: "sessions/:id",
    createPath: "/admin/sessions/create",
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
            /* ids */
            {
              name: "ids",
              label: "IDs",
              type: "textAccumulator",
              placeholder: "Buscar por ID",
            },
            /* name */
            {
              name: "name",
              label: "Nombre",
              type: "text",
              placeholder: "Buscar por nombre",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        /* user_name */
        { name: "user_name", label: "Usuario", type: "text", path: "user_name" },
        /* created_at */
        { name: "created_at", label: "Fecha de creación", type: "date", path: "created_at" },
        /* last_used_at */
        { name: "last_used_at", label: "Último uso", type: "date", path: "last_used_at" },
        /* expires_at */
        { name: "expires_at", label: "Expira", type: "date", path: "expires_at" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
  /* activity-logs */
  'activity-logs': {
    title: "Registros de actividad",
    description: "Gestiona, edita y consulta registros de actividad.",
    emptyState: {
      title: "No existen registros de actividad según los filtros",
      description: "Ajusta los filtros o crea un nuevo registro de actividad.",
    },
    endpoint: "activity-logs",
    viewRoute: "/admin/activity-logs/:id",
    deleteEndpoint: "activity-logs/:id",
    createPath: "/admin/activity-logs/create",
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
            /* ids */
            {
              name: "ids",
              label: "IDs",
              type: "textAccumulator",
              placeholder: "Buscar por ID",
            },
            /* path */
            {
              name: "path",
              label: "Ruta",
              type: "text",
              placeholder: "Buscar por ruta",
            },


            /* created_at */
            {
              name: "dates",
              label: "Fecha",
              type: "dateRange",
              visibleMonths: 1,
            },
          ],
        },
        /* users */
        {
          name: "users",
          label: "Usuarios",
          filters: [
            {
              name: "users",
              label: "Usuarios",
              type: "autocomplete",
              placeholder: "Buscar por usuario",
              endpoint: "users/options",
            },
          ],
        },

      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        /* id Primaria	
  2	user_id 
  3	ip_address	
  4	device	
  5	browser		
  6	location		
  7	created_at	
  8	updated_at	
  9	country		
  10	city		
  11	region		
  12	platform		
  13	path		
  14	method */

        /* user */
        { name: "user", label: "Usuario", type: "text", path: "user.name" },
        /* tokenId */
        { name: "tokenId", label: "Token", type: "text", path: "tokenId" },
        /* created_at */
        { name: "created_at", label: "Fecha de creación", type: "dateHour", path: "createdAt" },
        /* ip_address */
        { name: "ip_address", label: "Dirección IP", type: "text", path: "ipAddress" },
        /* browser */
        { name: "browser", label: "Navegador", type: "text", path: "browser" },
        /* location */
        { name: "location", label: "Ubicación", type: "text", path: "location" },
        /* region */
        { name: "region", label: "Región", type: "text", path: "region" },
        /* platform */
        { name: "platform", label: "Plataforma", type: "text", path: "platform" },
        /* path */
        { name: "path", label: "Ruta", type: "text", path: "path" },
        /* method */
        { name: "method", label: "Método", type: "text", path: "method" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },






};




/* POR IMPLEMENTAR 
- type: "number"




*/
