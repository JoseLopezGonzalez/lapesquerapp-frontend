export const configs = {
  'raw-material-receptions': {
    hideCreateButton: false,
    hideEditButton: false,
    hideViewButton: true,
    editRedirect: "/admin/raw-material-receptions/:id/edit",
    title: "Recepciones de materia prima",
    description: "Crea, edita, genera reportes y más.",
    emptyState: {
      title: "No existen recepciones según los filtros",
      description: "Ajusta los filtros o crea una nueva recepción.",
    },
    perPage: 17,
    endpoint: "raw-material-receptions",
    viewRoute: "/admin/raw-material-receptions/:id",
    deleteEndpoint: "raw-material-receptions/:id",
    createRedirect: "/admin/raw-material-receptions/create",
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
          }
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
            }
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
            }
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
            }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "date", label: "Fecha", type: "date", path: "date" },
        { name: "supplier", label: "Proveedor", type: "text", path: "supplier.name" },
        { name: "species", label: "Especie", type: "text", path: "species.name", hideOnMobile: true },
        { name: "notes", label: "Notas", type: "text", path: "notes", hideOnMobile: true },
        { name: "netWeight", label: "Peso Neto", type: "weight", path: "netWeight" },
        { name: "totalAmount", label: "Importe Total", type: "currency", path: "totalAmount", hideOnMobile: true },
        { name: "declaredTotalAmount", label: "Importe Total Declarado", type: "currency", path: "declaredTotalAmount", hideOnMobile: true },
        { name: "declaredTotalNetWeight", label: "Peso Neto Total Declarado", type: "weight", path: "declaredTotalNetWeight", hideOnMobile: true }
      ],
    },

    exports: [
      {
        title: "Exportar a Facilcom",
        endpoint: "raw-material-receptions/facilcom-xls",
        type: "excel",
        waitingMessage: "Generando exportación a Facilcom",
        fileName: "Exportacion_recepciones_Facilcom",
      },
      /* raw-material-receptions/a3erp-xlsx */
      {
        title: "Exportar a A3ERP",
        endpoint: "raw-material-receptions/a3erp-xls",
        type: "excel",
        waitingMessage: "Generando exportación a A3ERP",
        fileName: "Exportacion_recepciones_A3ERP",
      },
    ],
  },
  orders: {
    /* hideCreateButton: true, */
    hideEditButton: true,
    title: "Pedidos",
    description: "Gestiona, edita, y consulta pedidos.",
    emptyState: {
      title: "No existen pedidos según los filtros",
      description: "Modifica los filtros o crea un nuevo pedido.",
    },
    perPage: 12,
    endpoint: "orders",
    viewRoute: "/admin/orders/:id",
    deleteEndpoint: "orders/:id",
    createRedirect: "/admin/orders-manager",
    exports: [
      {
        title: "Exportar a A3ERP",
        endpoint: "orders/xls/A3ERP-sales-delivery-note-filtered",
        type: "excel",
        waitingMessage: "Generando exportación a A3ERP",
        fileName: "Exportacion_pedidos_A3ERP",
      },
      {
        title: "Exportar a A3ERP2",
        endpoint: "orders/xls/A3ERP2-sales-delivery-note-filtered",
        type: "excel",
        waitingMessage: "Generando exportación a A3ERP2",
        fileName: "Exportacion_pedidos_A3ERP2",
      },
      {
        title: "Exportar a Facilcom",
        endpoint: "orders/xls/facilcom-sales-delivery-note",
        type: "excel",
        waitingMessage: "Generando exportación a Facilcom",
        fileName: "Exportacion_pedidos_Facilcom",
      },
      {
        title: "Exportar a Excel",
        endpoint: "orders_report",
        type: "excel",
        waitingMessage: "Generando exportación a excel",
        fileName: "export_pedidos",
      },
      {
        title: "Imprimir Hojas de Pedidos",
        endpoint: "orders/pdf/order-sheets-filtered",
        type: "pdf",
        waitingMessage: "Generando hojas de pedidos",
        fileName: "Hojas_de_pedido_masivas",
      },
      /* {
        title: "Exportar a PDF",
        endpoint: "/exports/orders_report/pdf",
        type: "pdf",
        waitingMessage: "Generando exportación a pdf",
        fileName: "export_pedidos",
      } */
    ],
    /* reports: [
      {
        title: "Reporte de pedidos (Repetido)",
        endpoint: "orders_report",
        waitingMessage: "Generando reporte excel",
        fileName: "report_pedidos",
      }
    ], */
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Buscar",
            type: "search",
            placeholder: "Buscar por id",
          }
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
                { name: "finished", label: "Finalizado", value: false }
              ],
            },
            {
              name: "orderType",
              label: "Tipo de pedido",
              type: "pairSelectBoxes",
              options: [
                { name: "standard", label: "Pedido estándar", value: false },
                { name: "autoventa", label: "Autoventa", value: false }
              ],
            }
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
            }
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
            }
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
            }
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
            }
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
            }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "loadDate", label: "Fecha Salida", type: "date", path: "loadDate" },
        { name: "customerName", label: "Cliente", type: "text", path: "customer.name" },
        { name: "buyerReference", label: "Referencia", type: "text", path: "buyerReference", hideOnMobile: true },
        {
          name: "status",
          label: "Estado",
          type: "badge",
          options: {
            pending: { label: "Pendiente", color: "warning", outline: true },
            finished: { label: "Finalizado", color: "success", outline: true },
            incident: { label: "Incidencia", color: "danger", outline: true },
            default: { label: "Desconocido", color: "secondary", outline: true },
          },
        },
        {
          name: "orderType",
          label: "Tipo",
          type: "text",
          path: "orderType",
          hideOnMobile: true,
          options: {
            standard: { label: "Estándar" },
            autoventa: { label: "Autoventa" },
            default: { label: "—" },
          },
        },
        { name: "totalNetWeight", label: "Peso total", type: "weight", path: "totalNetWeight", hideOnMobile: true },
        { name: "totalBoxes", label: "Cajas", type: "text", path: "totalBoxes", hideOnMobile: true },
        { name: "pallets", label: "Palets", type: "text", path: "pallets", hideOnMobile: true },
        /* subtotalAmount */
        { name: "subtotalAmount", label: "Subtotal", type: "currency", path: "subtotalAmount", hideOnMobile: true },
        /* totalAmount */
        { name: "totalAmount", label: "Total", type: "currency", path: "totalAmount", hideOnMobile: true },
        { name: "salesperson", label: "Vendedor", type: "text", path: "salesperson.name", hideOnMobile: true },
        { name: "incoterm", label: "Incoterm", type: "text", path: "incoterm.code", hideOnMobile: true },
        { name: "transport", label: "Transporte", type: "text", path: "transport.name", hideOnMobile: true }
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
    hideEditButton: true,
    hideViewButton: true,
    hideCreateButton: true,
    description: "Gestiona, edita y consulta usuarios.",
    emptyState: {
      title: "No existen usuarios según los filtros",
      description: "Ajusta los filtros o crea un nuevo usuario.",
    },
    endpoint: "users",
    viewRoute: "/admin/users/:id",
    deleteEndpoint: "/users/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "name",
            label: "Nombre",
            type: "search",
            placeholder: "Buscar por nombre",
          }
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
              name: "role",
              label: "Rol",
              type: "autocomplete",
              placeholder: "Seleccionar rol",
              endpoint: "roles/options",
            }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "email", label: "Correo electrónico", type: "text", path: "email", hideOnMobile: true },
        { name: "role", label: "Rol", type: "text", path: "role", hideOnMobile: true },
        { name: "created_at", label: "Fecha de creación", type: "date", path: "created_at", hideOnMobile: true }
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
              value: "^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$",
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
          name: "role",
          label: "Rol",
          type: "Autocomplete",
          placeholder: "Selecciona el rol",
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
        }
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
    deleteEndpoint: "transports/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "vatNumber", label: "NIF/CIF", type: "text", path: "vatNumber" },
        { name: "address", label: "Dirección", type: "text", path: "address" },
        { name: "emails", label: "Emails", type: "list", path: "emails" },
        { name: "ccEmails", label: "Emails en copia (CC)", type: "list", path: "ccEmails" }
      ],
    },
    createForm: {
      title: "Nuevo Transporte",
      endpoint: "transports",
      method: "POST",
      successMessage: "Transporte creado con éxito",
      errorMessage: "Error al crear el transporte",

    },
    editForm: {
      title: "Editar Transporte",
      endpoint: "transports",
      method: "PUT",
      successMessage: "Transporte actualizado con éxito",
      errorMessage: "Error al actualizar el transporte",
    },
    fields: [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        validation: {
          required: "El nombre es obligatorio",
          minLength: { value: 3, message: "Debe tener al menos 3 caracteres" },
        },
        cols: { sm: 6, md: 6, lg: 4, xl: 4 },
      },
      {
        name: "vatNumber",
        label: "CIF",
        type: "text",
        validation: {
          required: "El CIF es obligatorio",
          pattern: {
            value: '/^[A-Z0-9]{8,12}$/',
            message: "Formato no válido",
          },
        },
        cols: { sm: 6, md: 6, lg: 2, xl: 2 },
      },
      {
        name: "address",
        label: "Dirección",
        type: "textarea",
        validation: {
          required: "La dirección es obligatoria",
          minLength: { value: 10, message: "Debe contener al menos 10 caracteres" },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: "emails",
        label: "Emails de contacto",
        type: "emailList",
        placeholder: "Introduce cada email individualmente y pulsa 'Enter'",
        validation: {
          required: "Al menos un email es obligatorio",
        },
        cols: {
          sm: 6,
          md: 6,
          lg: 3,
          xl: 3,
        },
      },
      {
        name: "ccEmails",
        label: "Emails en copia",
        type: "emailList",
        placeholder: "Introduce cada email individualmente y pulsa 'Enter' para confirmarlo",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      }
    ],
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
    deleteEndpoint: "products/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
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
            }
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
            }
          ],
        },

        /* Product Families */
        {
          name: "productFamilies",
          label: "Familias",
          filters: [
            {
              name: "productFamilies",
              label: "Familias",
              type: "autocomplete",
              placeholder: "Buscar por familia",
              endpoint: "product-families/options",
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "family", label: "Familia", type: "text", path: "family.name", hideOnMobile: true },
        { name: "a3erp_code", label: "Código A3ERP", type: "text", path: "a3erpCode", hideOnMobile: true },
        { name: "facil_com_code", label: "Código Facilcom", type: "text", path: "facilcomCode", hideOnMobile: true },
        { name: "species", label: "Especie", type: "text", path: "species.name", hideOnMobile: true },
        { name: "captureZone", label: "Zona de captura", type: "text", path: "captureZone.name", hideOnMobile: true },
        { name: "articleGtin", label: "GTIN", type: "text", path: "articleGtin", hideOnMobile: true },
        { name: "boxGtin", label: "GTIN Caja", type: "text", path: "boxGtin", hideOnMobile: true },
        { name: "palletGtin", label: "GTIN Palet", type: "text", path: "palletGtin", hideOnMobile: true }
      ],
    },
    createForm: {
      title: "Nuevo Producto",
      endpoint: "products",
      method: "POST",
      successMessage: "Producto creado con éxito",
      errorMessage: "Error al crear el producto",
    },
    fields: [
      {
        name: "name",
        label: "Nombre del producto",
        type: "text",
        validation: {
          required: "El nombre es obligatorio",
          minLength: { value: 3, message: "Debe tener al menos 3 caracteres" },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: "speciesId",
        path: "species.id",
        label: "Especie",
        type: "Autocomplete",
        placeholder: "Selecciona la especie",
        endpoint: "species/options",
        validation: {
          required: "La especie es obligatoria",
        },
        cols: { sm: 3, md: 3, lg: 2, xl: 2 },
      },
      {
        name: "captureZoneId",
        path: "captureZone.id",
        label: "Zona de captura",
        type: "Autocomplete",
        placeholder: "Selecciona la zona de captura",
        endpoint: "capture-zones/options",
        validation: {
          required: "La zona de captura es obligatoria",
        },
        cols: { sm: 6, md: 3, lg: 2, xl: 2 },
      },

      {
        name: "familyId",
        path: "family.id",
        label: "Familia",
        type: "Autocomplete",
        placeholder: "Selecciona la familia",
        endpoint: "product-families/options",
        validation: {
          required: "La familia es obligatoria",
        },
        cols: { sm: 6, md: 6, lg: 2, xl: 2 },
      },
      {
        name: "articleGtin",
        label: "GTIN-13 del artículo",
        type: "text",
        placeholder: "13 dígitos",
        validation: {
          pattern: {
            value: '/^[0-9]{8,14}$/',
            message: "GTIN inválido. Debe contener entre 8 y 14 dígitos.",
          },
        },
        cols: { sm: 4, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "boxGtin",
        label: "GTIN-14 de caja",
        type: "text",
        placeholder: "14 dígitos",
        validation: {
          pattern: {
            value: '/^[0-9]{8,14}$/',
            message: "GTIN de caja inválido. Debe contener entre 8 y 14 dígitos.",
          },
        },
        cols: { sm: 4, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "a3erp_code",
        path: "a3erpCode",
        label: "Código A3ERP",
        type: "text",
        placeholder: 'Código para exportaciones a "a3ERP - Software ERP"',
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: "facil_com_code",
        path: "facilcomCode",
        label: "Código Facilcom",
        type: "text",
        placeholder: 'Código para exportaciones a "Facilcom - Gestión comercial integral"',
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      }
    ],
    editForm: {
      title: "Editar Producto",
      endpoint: "products",
      method: "PUT",
      successMessage: "Producto actualizado con éxito",
      errorMessage: "Error al actualizar el producto",
    },
  },

  /* Stores */
  stores: {
    title: "Almacenes",
    description: "Gestiona, edita y consulta almacenes.",
    hideViewButton: true,
    emptyState: {
      title: "No existen almacenes según los filtros",
      description: "Ajusta los filtros o crea un nuevo almacén.",
    },
    endpoint: "stores",
    viewRoute: "/admin/stores/:id",
    deleteEndpoint: "stores/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
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
        { name: "capacity", label: "Capacidad", type: "weight", path: "capacity" }
      ],
    },
    createForm: {
      title: "Crear almacén",
      endpoint: "stores",
      method: "POST",
      successMessage: "Almacén creado con éxito",
      errorMessage: "Error al crear el almacén",
    },
    editForm: {
      title: "Editar Almacén",
      endpoint: "stores", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Almacén actualizado con éxito",
      errorMessage: "Error al actualizar el almacén",
    },
    fields: [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        placeholder: "Introduce el nombre del almacén",
        validation: {
          required: "El nombre es obligatorio",
          minLength: {
            value: 3,
            message: "Debe tener al menos 3 caracteres",
          },
          maxLength: {
            value: 255,
            message: "No puede exceder los 255 caracteres",
          },
        },
        cols: {
          sm: 3, md: 3, lg: 3, xl: 6,
        },
      },
      {
        name: "temperature",
        label: "Temperatura",
        type: "number",
        placeholder: "Ej. -18",
        validation: {
          required: "La temperatura es obligatoria",
          valueAsNumber: true,
          min: {
            value: -99.99,
            message: "La temperatura debe ser mayor o igual a -99.99",
          },
          max: {
            value: 99.99,
            message: "La temperatura debe ser menor o igual a 99.99",
          },
        },
        cols: {
          sm: 3, md: 3, lg: 3, xl: 3,
        },
      },
      {
        name: "capacity",
        label: "Capacidad (kg)",
        type: "number",
        placeholder: "Capacidad máxima en kg",
        validation: {
          required: "La capacidad es obligatoria",
          valueAsNumber: true,
          min: {
            value: 0,
            message: "Debe ser un valor mayor o igual a 0",
          },
        },
        cols: {
          sm: 3, md: 3, lg: 3, xl: 3,
        },
      }
    ],
  },
  /* boxes */
  boxes: {
    hideCreateButton: true,
    hideEditButton: true,
    hideViewButton: true,
    title: "Cajas",
    description: "Gestiona, edita y consulta cajas.",
    emptyState: {
      title: "No existen cajas según los filtros",
      description: "Ajusta los filtros o crea una nueva caja.",
    },
    perPage: 17,
    endpoint: "boxes",
    viewRoute: "/admin/boxes/:id",
    deleteEndpoint: "boxes/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
              placeholder: "Introduce un ID",
            },
            {
              name: "lots",
              label: "Lotes",
              type: "textAccumulator",
              placeholder: "Introduce un lote",
            },
            /* gs1128 */
            {
              name: "gs1128",
              label: "GS1128",
              type: "textAccumulator",
              placeholder: "Introduce un GS1128",
            },

            /* createdAt */
            {
              name: "createdAt",
              label: "Fecha de lectura",
              type: "dateRange",
              visibleMonths: 1,
            }
          ],
        },
        {
          name: "products",
          label: "Productos",
          filters: [
            {
              name: "products",
              label: "Productos",
              type: "autocomplete",
              placeholder: "Selecciona un producto",
              endpoint: "products/options",
            }
          ],
        },
        {
          name: "species",
          label: "Especies",
          filters: [
            {
              name: "species",
              label: "Especies",
              type: "autocomplete",
              placeholder: "Selecciona una especie",
              endpoint: "species/options",
            }
          ],
        },
        /* ordersGroup - orderIds - orderDates - orderBuyerReference- orderState */
        {
          name: "ordersGroup",
          label: "Pedidos",
          filters: [
            /* orderIds - options */
            {
              name: "orderIds",
              label: "IDs de pedidos",
              type: "autocomplete",
              placeholder: "Buscar por IDs de pedidos",
              endpoint: "orders/options",
            },
            /* orderDates */
            {
              name: "orderDates",
              label: "Fechas de pedidos",
              type: "dateRange",
              visibleMonths: 1,
            },
            /* orderBuyerReference */
            {
              name: "orderBuyerReference",
              label: "Referencia de cliente",
              type: "text",
              placeholder: "Buscar por referencia de compra",
            },
            /* orderState */
            {
              name: "orderState",
              label: "Estado del Pedido",
              type: "pairSelectBoxes",
              options: [
                { name: "pending", label: "Pendiente", value: false },
                { name: "finished", label: "Finalizado", value: false },
              ],
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
              placeholder: 'Introduce un número de palet',
            },
            {
              name: "palletState",
              label: "Estado del Palet",
              type: "pairSelectBoxes",
              options: [
                { name: "registered", label: "Registrado", value: false },
                { name: "stored", label: "Almacenado", value: false },
                { name: "shipped", label: "Enviado", value: false },
                { name: "processed", label: "Procesado", value: false },
              ],
            },
            {
              name: "orderState",
              label: "Estado del Pedido",
              type: "pairSelectBoxes",
              options: [
                { name: "pending", label: "Pendiente", value: false },
                { name: "finished", label: "Finalizado", value: false },
              ],
            },
            {
              name: "position",
              label: "Posición",
              type: "pairSelectBoxes",
              options: [
                { name: "located", label: "Ubicado", value: false },
                { name: "unlocated", label: "Sin Ubicar", value: false },
              ],
            },
            {
              name: "stores",
              label: "Almacenes",
              type: "autocomplete",
              placeholder: "Selecciona almacenes",
              endpoint: "stores/options",
              multiple: true,
            },
            {
              name: "orders",
              label: "Pedidos",
              type: "autocomplete",
              placeholder: "Selecciona órdenes",
              endpoint: "orders/options",
              multiple: true,
            },
            {
              name: "notes",
              label: "Observaciones del Palet",
              type: "text",
              placeholder: "Buscar en observaciones del palet",
            }
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
              placeholder: "Selecciona almacenes",
              endpoint: "stores/options",
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "product.name" },
        { name: "lot", label: "Lote", type: "text", path: "lot" },
        { name: "gs1128", label: "GS1128", type: "text", path: "gs1128" },
        { name: "netWeight", label: "Peso neto", type: "weight", path: "netWeight" },
        { name: "palletId", label: "Palet", type: "text", path: "palletId" }
      ],
    },
    exports: [
      {
        title: "Exportar a excel",
        endpoint: "boxes/xlsx",
        type: "xlsx",
        waitingMessage: "Generando exportación a excel",
        fileName: "Cajas",
      },
    ],
  },
  /* Pallets */
  pallets: {
    hideEditButton: true,
    title: "Palets",
    description: "Gestiona, edita y consulta palets.",
    emptyState: {
      title: "No existen palets según los filtros",
      description: "Ajusta los filtros o crea un nuevo palet.",
    },
    endpoint: "pallets",
    viewRoute: "/admin/pallets/:id",
    deleteEndpoint: "pallets/:id",
    createRedirect: "/admin/pallets/create",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
                { name: "registered", label: "Registrado", value: false },
                { name: "stored", label: "Almacenado", value: false },
                { name: "shipped", label: "Enviado", value: false },
                { name: "processed", label: "Procesado", value: false }
              ]
            },
            /* orderState */
            {
              name: "orderState",
              label: "Estado del pedido",
              type: "pairSelectBoxes",
              options: [
                { name: "pending", label: "Pendiente", value: false },
                { name: "finished", label: "Finalizado", value: false }
              ]
            },
            /*  Position; locatd, unlocated*/
            {
              name: "position",
              label: "Posición",
              type: "pairSelectBoxes",
              options: [
                { name: "located", label: "Ubicado", value: false },
                { name: "unlocated", label: "No ubicado", value: false }
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
            }
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
            }
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
            }
          ],
        },
        /* Species   */
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
            }
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
            }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        /* productsNames */
        { name: "productsNames", label: "Artículos", type: "list", path: "productsNames" },
        /* lots */
        { name: "lots", label: "Lotes", type: "list", path: "lots" },
        /* observations */
        { name: "observations", label: "Observaciones", type: "text", path: "observations" },
        /* store */
        { name: "store", label: "Almacén", type: "text", path: "store.name" },
        /* orderId*/
        { name: "orderId", label: "Pedido", type: "text", path: "orderId" },
        /* { name: "name", label: "Nombre", type: "text", path: "article.name" }, */
        {
          name: "state", label: "Estado", type: "badge", path: "state.name",
          options:
          {
            registered: { label: "Registrado", color: "secondary", outline: true },
            stored: { label: "Almacenado", color: "warning", outline: true },
            shipped: { label: "Enviado", color: "success", outline: true },
            processed: { label: "Procesado", color: "primary", outline: true },
            default: { label: "Desconocido", color: "secondary", outline: true },
          }
        },
        /* numberOfBoxes */
        { name: "numberOfBoxes", label: "Cajas", type: "text", path: "numberOfBoxes" },
        /* netWeight */
        { name: "netWeight", label: "Peso neto", type: "weight", path: "netWeight" },
        /* availableBoxesCount */
        { name: "availableBoxesCount", label: "Cajas Disponibles", type: "text", path: "availableBoxesCount" },
        /* usedBoxesCount */
        { name: "usedBoxesCount", label: "Cajas en Producción", type: "text", path: "usedBoxesCount" },
        /* totalAvailableWeight */
        { name: "totalAvailableWeight", label: "Peso Disponible", type: "weight", path: "totalAvailableWeight" },
        /* totalUsedWeight */
        { name: "totalUsedWeight", label: "Peso en Producción", type: "weight", path: "totalUsedWeight" }
      ],
    },
    actions: [
      /* {
        title: 'Cambiar estado a Enviado',
        endpoint: '/orders/mark-as-sent',
        confirmation: '¿Estás seguro de que deseas marcar estos pedidos como enviados?',
        successMessage: 'Pedidos actualizados correctamente.',
        errorMessage: 'Error al actualizar pedidos.',
        method: 'POST'
      }, */
      /* {
        title: 'Cambiar estado a Almacenado',
        endpoint: '/orders/mark-as-sent',
        confirmation: '¿Estás seguro de que deseas marcar estos pedidos como enviados?',
        successMessage: 'Pedidos actualizados correctamente.',
        errorMessage: 'Error al actualizar pedidos.',
        method: 'POST'
      }, */
      {
        title: 'Cambiar estado a Registrado',
        endpoint: 'pallets/update-state',
        confirmation: '¿Deseas marcar estos pallets como registrados?',
        successMessage: 'Palets actualizados correctamente.',
        errorMessage: 'Hubo un error al actualizar los palets.',
        method: 'POST',
        body: { status: 1 } // Estado "registered"
      },
      {
        title: 'Cambiar estado a Almacenado',
        endpoint: 'pallets/update-state',
        confirmation: '¿Deseas marcar estos pallets como almacenados?',
        successMessage: 'Palets actualizados correctamente.',
        errorMessage: 'Hubo un error al actualizar los palets.',
        method: 'POST',
        body: { status: 2 } // Estado "stored"
      },
      {
        title: 'Cambiar estado a Enviado',
        endpoint: 'pallets/update-state',
        confirmation: '¿Deseas marcar estos pallets como enviados?',
        successMessage: 'Palets actualizados correctamente.',
        errorMessage: 'Hubo un error al actualizar los palets.',
        method: 'POST',
        body: { status: 3 } // Estado "shipped"
      },
      {
        title: 'Cambiar estado a Procesado',
        endpoint: 'pallets/update-state',
        confirmation: '¿Deseas marcar estos pallets como procesados?',
        successMessage: 'Palets actualizados correctamente.',
        errorMessage: 'Hubo un error al actualizar los palets.',
        method: 'POST',
        body: { status: 4 } // Estado "processed"
      }
    ],
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
    deleteEndpoint: "customers/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
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
            }
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
            }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "vatNumber", label: "NIF", type: "text", path: "vatNumber" },
        { name: "facilcom_code", label: "Código Facilcom", type: "text", path: "facilcomCode" },
        { name: "a3erp_code", label: "Código A3ERP", type: "text", path: "a3erpCode" },
        { name: "paymentTerm", label: "Plazo de pago", type: "text", path: "paymentTerm.name" },
        { name: "salesperson", label: "Comercial", type: "text", path: "salesperson.name" },
        /* emails */
        { name: "emails", label: "Emails", type: "list", path: "emails" },
        /* ccEmails */
        { name: "ccEmails", label: "Emails en copia (CC)", type: "list", path: "ccEmails" },
        { name: "country", label: "País", type: "text", path: "country.name" }
      ],
    },
    createForm: {
      title: "Crear cliente",
      endpoint: "customers",
      method: "POST",
      successMessage: "Cliente creado con éxito",
      errorMessage: "Error al crear el cliente",

    },
    fields: [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        placeholder: "Introduce el nombre del cliente",
        validation: {
          required: "El nombre es obligatorio",
        },
        cols: { sm: 6, md: 4, lg: 4, xl: 4 },
      },
      {
        name: "vatNumber",
        label: "NIF",
        type: "text",
        placeholder: "Introduce el NIF",
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: "billing_address",
        path: "billingAddress",
        label: "Dirección de facturación",
        type: "textarea",
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "shipping_address",
        path: "shippingAddress",
        label: "Dirección de envío",
        type: "textarea",
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "transportation_notes",
        path: "transportationNotes",
        label: "Notas para transporte",
        type: "textarea",
        cols: { sm: 6, md: 6, lg: 6, xl: 2 },
      },
      {
        name: "production_notes",
        path: "productionNotes",
        label: "Notas para producción",
        type: "textarea",
        cols: { sm: 3, md: 3, lg: 3, xl: 2 },
      },
      {
        name: "accounting_notes",
        path: "accountingNotes",
        label: "Notas contables",
        type: "textarea",
        cols: { sm: 3, md: 3, lg: 3, xl: 2 },
      },
      {
        name: "emails",
        label: "Emails",
        type: "emailList",
        placeholder: "Introduce correos electrónicos y pulsa Enter",
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      /* ccEmails */
      {
        name: "ccEmails",
        label: "Emails en copia (CC)",
        type: "emailList",
        placeholder: "Introduce correos electrónicos en copia y pulsa Enter",
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "contact_info",
        path: "contactInfo",
        label: "Información de contacto",
        type: "textarea",
        placeholder: "Introduce teléfonos u otra información de contacto",
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: "salesperson_id",
        path: "salesperson.id",
        label: "Comercial",
        type: "Autocomplete",
        placeholder: "Selecciona el comercial",
        endpoint: "salespeople/options",
        validation: {
          required: "El comercial es obligatorio",
        },
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "country_id",
        path: "country.id",
        label: "País",
        type: "Autocomplete",
        endpoint: "countries/options",
        validation: {
          required: "El país es obligatorio",
        },
        placeholder: "Selecciona el país",
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "payment_term_id",
        path: "paymentTerm.id",
        label: "Forma de pago",
        type: "Autocomplete",
        endpoint: "payment-terms/options",
        validation: {
          required: "La forma de pago es obligatoria",
        },
        placeholder: "Selecciona la forma de pago",
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "transport_id",
        path: "transport.id",
        label: "Transporte",
        type: "Autocomplete",
        endpoint: "transports/options",
        validation: {
          required: "El transporte es obligatorio",
        },
        placeholder: "Selecciona el transporte",
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "a3erp_code",
        path: "a3erpCode",
        label: "Código A3ERP",
        type: "text",
        placeholder: "Código para exportaciones a 'a3ERP - Software ERP'",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: "facilcom_code",
        path: "facilcomCode",
        label: "Código Facilcom",
        type: "text",
        placeholder: "Código para exportaciones a 'Facilcom - Gestión comercial integral'",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      }
    ],
    editForm: {
      title: "Editar Cliente",
      endpoint: "customers", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Cliente actualizado con éxito",
      errorMessage: "Error al actualizar el cliente",
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
    deleteEndpoint: "suppliers/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "facil_com_code", label: "Código Facilcom", type: "text", path: "facilcomCode" },
        { name: "address", label: "Dirección", type: "text", path: "address" },
        { name: "contactPerson", label: "Persona de contacto", type: "text", path: "contactPerson" },
        { name: "phone", label: "Teléfono", type: "text", path: "phone" },
        { name: "emails", label: "Emails", type: "list", path: "emails" },
        { name: "ccEmails", label: "Emails (CC)", type: "list", path: "ccEmails" }
      ],
    },
    createForm: {
      title: "Crear proveedor",
      endpoint: "suppliers",
      method: "POST",
      successMessage: "Proveedor creado con éxito",
      errorMessage: "Error al crear el proveedor",

    },
    fields: [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        placeholder: "Introduce el nombre del proveedor",
        validation: {
          required: "El nombre es obligatorio",
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: "contact_person",
        label: "Persona de contacto",
        type: "text",
        placeholder: "Introduce la persona de contacto",
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "phone",
        label: "Teléfono",
        type: "text",
        placeholder: "Introduce el teléfono",
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: "emails",
        label: "Emails principales",
        type: "emailList",
        placeholder: "Introduce un correo electronico y pulsa Enter",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: "ccEmails",
        label: "Emails en copia (CC)",
        type: "emailList",
        placeholder: "Introduce un correo electronico y pulsa Enter",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: "address",
        label: "Dirección",
        type: "textarea",
        placeholder: "Introduce la dirección del proveedor",
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: "facil_com_code",
        path: "facilcomCode",
        label: "Código Facilcom",
        type: "text",
        placeholder: "Código para exportaciones a 'Facilcom - Gestión comercial integral'",
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      }
    ],
    editForm: {
      title: "Editar Proveedor",
      endpoint: "suppliers", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Proveedor actualizado con éxito",
      errorMessage: "Error al actualizar el proveedor",
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
    deleteEndpoint: "capture-zones/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" }
      ],
    },
    createForm: {
      title: "Nueva Zona de Captura",
      endpoint: "capture-zones",
      method: "POST",
      successMessage: "Zona de captura creada con éxito",
      errorMessage: "Error al crear la zona de captura",

    },
    editForm: {
      title: "Editar Zona de Captura",
      endpoint: "capture-zones", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Zona de captura actualizada con éxito",
      errorMessage: "Error al actualizar la zona de captura",
    },
    fields: [
      {
        name: "name",
        label: "Nombre de la zona",
        type: "text",
        placeholder: "Ej. Atlántico Noroeste",
        validation: {
          required: "El nombre es obligatorio",
          minLength: {
            value: 3,
            message: "Debe tener al menos 3 caracteres",
          },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      }
    ],

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
    deleteEndpoint: "species/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
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
            }
          ],
        }
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
        { name: "fishingGear", label: "Arte de pesca", type: "text", path: "fishingGear.name" }
      ],
    },
    createForm: {
      title: "Nueva Especie",
      endpoint: "species",
      method: "POST",
      successMessage: "Especie creada con éxito",
      errorMessage: "Error al crear la especie",

    },
    editForm: {
      title: "Editar Especie",
      endpoint: "species", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Especie actualizada con éxito",
      errorMessage: "Error al actualizar especie",
    },
    fields: [
      {
        name: "name",
        label: "Nombre común",
        type: "text",
        placeholder: "Ej. Pulpo",
        validation: {
          required: "El nombre es obligatorio",
          minLength: {
            value: 2,
            message: "Debe tener al menos 2 caracteres",
          },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: "scientificName",
        label: "Nombre científico",
        type: "text",
        placeholder: "Ej. Octopus vulgaris",
        validation: {
          required: "El nombre científico es obligatorio",
          minLength: {
            value: 2,
            message: "Debe tener al menos 2 caracteres",
          },
        },
        cols: { sm: 6, md: 4, lg: 4, xl: 4 },
      },
      {
        name: "fao",
        label: "Código FAO",
        type: "text",
        placeholder: "Ej. OCT",
        validation: {
          required: "El código FAO es obligatorio",
          pattern: {
            value: "/^[A-Z]{3,5}$/",
            message: "Debe contener entre 3 y 5 letras mayúsculas",
          },
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: "fishingGearId",
        path: "fishingGear.id",
        label: "Arte de pesca",
        type: "Autocomplete",
        placeholder: "Selecciona un arte de pesca",
        endpoint: "fishing-gears/options",
        validation: {
          required: "El arte de pesca es obligatorio",
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      }
    ],

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
    deleteEndpoint: "incoterms/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "code", label: "Código", type: "text", path: "code" },
        /* description */
        { name: "description", label: "Descripción", type: "text", path: "description" }
      ],
    },
    /* createForm */
    createForm: {
      title: "Crear incoterm",
      endpoint: "incoterms",
      method: "POST",
      successMessage: "Incoterm creado con éxito",
      errorMessage: "Error al crear el incoterm",

    },
    fields: [
      {
        name: "code",
        label: "Código",
        type: "text",
        validation: {
          required: "El código es obligatorio",
        },
        cols: {
          sm: 2,
          md: 2,
          lg: 2,
          xl: 2,
        },
      },
      {
        name: "description",
        label: "Descripción",
        type: "text",
        validation: {
          required: "La descripción es obligatoria",
        },
        cols: {
          sm: 4,
          md: 4,
          lg: 4,
          xl: 4,
        },
      }
    ],
    /* editForm */
    editForm: {
      title: "Editar incoterm",
      endpoint: "incoterms", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Incoterm actualizado con éxito",
      errorMessage: "Error al actualizar el incoterm",
    },

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
    deleteEndpoint: "salespeople/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "emails", label: "Emails", type: "list", path: "emails" },
        { name: "ccEmails", label: "Emails en copia (CC)", type: "list", path: "ccEmails" }
      ],
    },
    createForm: {
      title: "Crear comercial",
      endpoint: "salespeople",
      method: "POST",
      successMessage: "Comercial creado con éxito",
      errorMessage: "Error al crear el comercial",

    },
    fields: [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        placeholder: "Ej. Juan Pérez",
        validation: {
          required: "El nombre es obligatorio",
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: "emails",
        label: "Emails",
        type: "emailList",
        placeholder: "Introduce un correo y pulsa Enter",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: "ccEmails",
        label: "Emails en copia (CC)",
        type: "emailList",
        placeholder: "Introduce un correo y pulsa Enter",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      }
    ],
    editForm: {
      title: "Editar comercial",
      endpoint: "salespeople", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Comercial actualizado con éxito",
      errorMessage: "Error al actualizar el comercial",
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
    deleteEndpoint: "fishing-gears/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" }
      ],
    },
    createForm: {
      title: "Nuevo Arte de Pesca",
      endpoint: "fishing-gears",
      method: "POST",
      successMessage: "Arte de pesca creado con éxito",
      errorMessage: "Error al crear el arte de pesca",

    },
    fields: [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        placeholder: "Ej. Nasas, Trasmallo, Arrastre...",
        validation: {
          required: "El nombre es obligatorio",
          minLength: {
            value: 2,
            message: "Debe tener al menos 2 caracteres",
          },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      }
    ],
    editForm: {
      title: "Editar Arte de Pesca",
      endpoint: "fishing-gears", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Arte de pesca actualizado con éxito",
      errorMessage: "Error al actualizar el arte de pesca",
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
    deleteEndpoint: "countries/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        /* action */

      ],
    },
    createForm: {
      title: "Crear país",
      endpoint: "countries",
      method: "POST",
      successMessage: "País creado con éxito",
      errorMessage: "Error al crear el país",

    },
    fields: [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        placeholder: "Introduce el nombre del país",
        validation: {
          required: "El nombre es obligatorio",
        },
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        },
      }
    ],
    editForm: {
      title: "Editar país",
      endpoint: "countries", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "País actualizado con éxito",
      errorMessage: "Error al actualizar el país",
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
    deleteEndpoint: "payment-terms/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        /* name */
        { name: "name", label: "Nombre", type: "text", path: "name" }
      ],
    },
    createForm: {
      title: "Crear método de pago",
      endpoint: "payment-terms",
      method: "POST",
      successMessage: "Método de pago creado con éxito",
      errorMessage: "Error al crear el método de pago",

    },
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
        },
      }
    ],
    editForm: {
      title: "Editar método de pago",
      endpoint: "payment-terms", // sin /:id, lo añadiremos dinámicamente
      method: "PUT",
      successMessage: "Método de pago actualizado con éxito",
      errorMessage: "Error al actualizar el método de pago",
    },

  },

  /* ceboDispatches*/
  'cebo-dispatches': {
    hideEditButton: false,
    hideCreateButton: false,
    hideViewButton: true,
    createRedirect: "/admin/cebo-dispatches/create",
    editRedirect: "/admin/cebo-dispatches/:id/edit",
    title: "Salidas de cebo",
    description: "Gestiona, edita y consulta salidas de cebo.",
    emptyState: {
      title: "No existen salidas de cebo según los filtros",
      description: "Ajusta los filtros o crea una nueva salida de cebo.",
    },
    perPage: 17,
    endpoint: "cebo-dispatches",
    viewRoute: "/admin/cebo-dispatches/:id",
    deleteEndpoint: "cebo-dispatches/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
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
            }
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
            }
          ],
        },
        /* species */
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
            }
          ],
        }
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
        { name: "netWeight", label: "Peso neto", type: "weight", path: "netWeight" }
      ],
    },
    exports: [
      /* cebo-dispatches/facilcom-xlsx */
      {
        title: "Exportar a Facilcom",
        endpoint: "cebo-dispatches/facilcom-xlsx",
        type: "xlsx",
        waitingMessage: "Generando exportación a Facilcom",
        fileName: "Salidas_cebo_Facilcom",
      },
      /* cebo-dispatches/a3erp-xlsx */
      {
        title: "Exportar a A3ERP",
        endpoint: "cebo-dispatches/a3erp-xlsx",
        type: "excel",
        waitingMessage: "Generando exportación a A3ERP",
        fileName: "Salidas_cebo_A3ERP",
      },
      /* cebo-dispatches/a3erp2-xlsx */
      {
        title: "Exportar a A3ERP2",
        endpoint: "cebo-dispatches/a3erp2-xlsx",
        type: "excel",
        waitingMessage: "Generando exportación a A3ERP2",
        fileName: "Salidas_cebo_A3ERP2",
      },
    ],
  },

  /* Sessions */
  sessions: {
    hideCreateButton: true,
    hideEditButton: true,
    hideViewButton: true,
    title: "Sesiones",
    description: "Gestiona, edita y consulta sesiones.",
    emptyState: {
      title: "No existen sesiones según los filtros",
      description: "Ajusta los filtros o crea una nueva sesión.",
    },
    endpoint: "sessions",
    perPage: 15,
    viewRoute: "/admin/sessions/:id",
    deleteEndpoint: "sessions/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
          ],
        }
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
        { name: "expires_at", label: "Expira", type: "date", path: "expires_at" }
      ],
    },
  },

  /* activity-logs */
  'activity-logs': {
    hideCreateButton: true,
    hideEditButton: true,
    hideViewButton: true,
    perPage: 18,
    title: "Registros de actividad",
    description: "Gestiona, edita y consulta registros de actividad.",
    emptyState: {
      title: "No existen registros de actividad según los filtros",
      description: "Ajusta los filtros o crea un nuevo registro de actividad.",
    },
    endpoint: "activity-logs",
    viewRoute: "/admin/activity-logs/:id",
    deleteEndpoint: "activity-logs/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
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
            }
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
            }
          ],
        }
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
        { name: "method", label: "Método", type: "text", path: "method" }
      ],
    },
  },

  /* Product Categories */
  'product-categories': {
    title: "Categorías de Productos",
    description: "Gestiona, edita y consulta categorías de productos.",
    emptyState: {
      title: "No existen categorías de productos según los filtros",
      description: "Ajusta los filtros o crea una nueva categoría de producto.",
    },
    endpoint: "product-categories",
    viewRoute: "/admin/product-categories/:id",
    deleteEndpoint: "product-categories/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
        ],
      },
      groups: [
        {
          name: "generals",
          label: "Generales",
          filters: [
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "description", label: "Descripción", type: "text", path: "description", hideOnMobile: true },
        { name: "created_at", label: "Fecha de creación", type: "date", path: "createdAt" },
        { name: "updated_at", label: "Fecha de actualización", type: "date", path: "updatedAt" }
      ],
    },
    createForm: {
      title: "Nueva Categoría de Producto",
      endpoint: "product-categories",
      method: "POST",
      successMessage: "Categoría de producto creada con éxito",
      errorMessage: "Error al crear la categoría de producto",
    },
    fields: [
      {
        name: "name",
        label: "Nombre de la categoría",
        type: "text",
        validation: {
          required: "El nombre es obligatorio",
          minLength: { value: 3, message: "Debe tener al menos 3 caracteres" },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: "description",
        label: "Descripción",
        type: "textarea",
        placeholder: "Descripción opcional de la categoría",
        validation: {},
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      }
    ],
    editForm: {
      title: "Editar Categoría de Producto",
      endpoint: "product-categories",
      method: "PUT",
      successMessage: "Categoría de producto actualizada con éxito",
      errorMessage: "Error al actualizar la categoría de producto",
    },
  },

  /* Product Families */
  'product-families': {
    title: "Familias de Productos",
    description: "Gestiona, edita y consulta familias de productos.",
    emptyState: {
      title: "No existen familias de productos según los filtros",
      description: "Ajusta los filtros o crea una nueva familia de producto.",
    },
    endpoint: "product-families",
    viewRoute: "/admin/product-families/:id",
    deleteEndpoint: "product-families/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id",
          }
        ],
      },
      groups: [
        {
          name: "generals",
          label: "Generales",
          filters: [
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
            }
          ],
        },
        {
          name: "category",
          label: "Categoría",
          filters: [
            {
              name: "categoryId",
              label: "Categoría",
              type: "autocomplete",
              placeholder: "Buscar por categoría",
              endpoint: "product-categories/options",
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "description", label: "Descripción", type: "text", path: "description", hideOnMobile: true },
        { name: "category", label: "Categoría", type: "text", path: "category.name" },
        { name: "created_at", label: "Fecha de creación", type: "date", path: "createdAt" },
        { name: "updated_at", label: "Fecha de actualización", type: "date", path: "updatedAt" }
      ],
    },
    createForm: {
      title: "Nueva Familia de Producto",
      endpoint: "product-families",
      method: "POST",
      successMessage: "Familia de producto creada con éxito",
      errorMessage: "Error al crear la familia de producto",
    },
    fields: [
      {
        name: "name",
        label: "Nombre de la familia",
        type: "text",
        validation: {
          required: "El nombre es obligatorio",
          minLength: { value: 3, message: "Debe tener al menos 3 caracteres" },
        },
        cols: { sm: 6, md: 4, lg: 4, xl: 4 },
      },
      {
        name: "categoryId",
        path: "category.id",
        label: "Categoría",
        type: "Autocomplete",
        placeholder: "Selecciona la categoría",
        endpoint: "product-categories/options",
        validation: {
          required: "La categoría es obligatoria",
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: "description",
        label: "Descripción",
        type: "textarea",
        placeholder: "Descripción opcional de la familia",
        validation: {},
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },


    ],
    editForm: {
      title: "Editar Familia de Producto",
      endpoint: "product-families",
      method: "PUT",
      successMessage: "Familia de producto actualizada con éxito",
      errorMessage: "Error al actualizar la familia de producto",
    },
  },

  /* Productions */
  productions: {
    title: "Producciones",
    hideEditButton: true,
    description: "Gestiona, edita y consulta lotes de producción.",
    emptyState: {
      title: "No existen producciones según los filtros",
      description: "Ajusta los filtros o crea una nueva producción.",
    },
    perPage: 15,
    endpoint: "productions",
    viewRoute: "/admin/productions/:id",
    deleteEndpoint: "productions/:id",
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Id",
            type: "search",
            placeholder: "Buscar por id o lote",
          }
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
              name: "lot",
              label: "Lote",
              type: "text",
              placeholder: "Buscar por lote",
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
              visibleMonths: 1,
            },
            {
              name: "status",
              label: "Estado",
              type: "pairSelectBoxes",
              options: [
                { name: "open", label: "Abierto", value: false },
                { name: "closed", label: "Cerrado", value: false },
              ],
            }
          ],
        },
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
            }
          ],
        },
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
            }
          ],
        }
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "lot", label: "Lote", type: "text", path: "lot" },
        { name: "species", label: "Especie", type: "text", path: "species.name", hideOnMobile: true },
        { name: "openedAt", label: "Fecha apertura", type: "date", path: "openedAt" },
        { name: "closedAt", label: "Fecha cierre", type: "date", path: "closedAt", hideOnMobile: true },
        {
          name: "status",
          label: "Estado",
          type: "badge",
          path: "status",
          options: {
            open: { label: "Abierto", color: "success", outline: true },
            closed: { label: "Cerrado", color: "secondary", outline: true },
            default: { label: "Desconocido", color: "secondary", outline: true },
          }
        },
        { name: "notes", label: "Notas", type: "text", path: "notes", hideOnMobile: true }
      ],
    },
    createForm: {
      title: "Nueva Producción",
      endpoint: "productions",
      method: "POST",
      successMessage: "Producción creada con éxito",
      errorMessage: "Error al crear la producción",
      fields: [
        {
          name: "lot",
          label: "Número de lote",
          type: "text",
          placeholder: "Ej. LOT-2025-001",
          validation: {
            required: "El número de lote es obligatorio",
            minLength: {
              value: 3,
              message: "El lote debe tener al menos 3 caracteres"
            }
          },
          cols: {
            sm: 6,
            md: 4,
            lg: 3,
            xl: 3,
          }
        },
        {
          name: "speciesId",
          path: "species.id",
          label: "Especie",
          type: "Autocomplete",
          placeholder: "Selecciona la especie (opcional)",
          endpoint: "species/options",
          validation: {},
          cols: {
            sm: 6,
            md: 4,
            lg: 3,
            xl: 3,
          }
        },
        {
          name: "captureZoneId",
          path: "captureZone.id",
          label: "Zona de captura",
          type: "Autocomplete",
          placeholder: "Selecciona la zona de captura",
          endpoint: "capture-zones/options",
          validation: {
            required: "La zona de captura es obligatoria",
          },
          cols: {
            sm: 6,
            md: 4,
            lg: 3,
            xl: 3,
          }
        },
        {
          name: "notes",
          label: "Notas",
          type: "textarea",
          placeholder: "Notas adicionales sobre la producción",
          validation: {},
          cols: {
            sm: 6,
            md: 6,
            lg: 6,
            xl: 6,
          }
        }
      ]
    },
    editForm: {
      title: "Editar Producción",
      endpoint: "productions",
      method: "PUT",
      successMessage: "Producción actualizada con éxito",
      errorMessage: "Error al actualizar la producción",
    },
  },

  employees: {
    hideCreateButton: false,
    hideEditButton: false,
    hideViewButton: true,
    title: "Empleados",
    description: "Gestiona los empleados del sistema.",
    emptyState: {
      title: "No existen empleados según los filtros",
      description: "Ajusta los filtros o crea un nuevo empleado.",
    },
    perPage: 15,
    endpoint: "employees",
    deleteEndpoint: "employees/:id",
    filtersGroup: {
      search: {
        name: "search",
        label: "Buscar",
        filters: [
          {
            name: "name",
            label: "Buscar",
            type: "search",
            placeholder: "Buscar por nombre",
          }
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
              name: "nfc_uid",
              label: "UID NFC",
              type: "text",
              placeholder: "Buscar por UID NFC",
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "nfcUid", label: "UID NFC", type: "text", path: "nfcUid", hideOnMobile: true },
        { name: "createdAt", label: "Fecha de creación", type: "dateTime", path: "createdAt", hideOnMobile: true },
        { name: "updatedAt", label: "Última actualización", type: "dateTime", path: "updatedAt", hideOnMobile: true },
      ],
    },
    fields: [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        placeholder: "Nombre completo del empleado",
        validation: {
          required: "El nombre es obligatorio",
          minLength: {
            value: 3,
            message: "El nombre debe tener al menos 3 caracteres"
          }
        },
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        }
      },
      {
        name: "nfc_uid",
        label: "UID NFC",
        type: "text",
        placeholder: "UID de la tarjeta NFC (opcional)",
        validation: {},
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        }
      }
    ],
    createForm: {
      title: "Nuevo Empleado",
      endpoint: "employees",
      method: "POST",
      successMessage: "Empleado creado con éxito",
      errorMessage: "Error al crear el empleado",
    },
    editForm: {
      title: "Editar Empleado",
      endpoint: "employees",
      method: "PUT",
      successMessage: "Empleado actualizado con éxito",
      errorMessage: "Error al actualizar el empleado",
    },
  },

  punches: {
    hideCreateButton: true, // Los fichajes se crean desde el gestor de registro horario
    hideEditButton: false, // Habilitar edición en modal
    hideViewButton: true,
    title: "Eventos de Fichaje",
    description: "Consulta y gestiona los eventos de fichaje registrados.",
    emptyState: {
      title: "No existen eventos de fichaje según los filtros",
      description: "Ajusta los filtros para ver más eventos.",
    },
    perPage: 15,
    endpoint: "punches",
    deleteEndpoint: "punches/:id",
    fields: [
      {
        name: "employeeId",
        path: "employee.id",
        label: "Empleado",
        type: "Autocomplete",
        placeholder: "Selecciona el empleado",
        endpoint: "employees/options",
        validation: {
          required: "El empleado es obligatorio",
        },
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        }
      },
      {
        name: "eventType",
        path: "eventType",
        label: "Tipo de evento",
        type: "select",
        placeholder: "Selecciona el tipo",
        options: [
          { value: "IN", label: "Entrada" },
          { value: "OUT", label: "Salida" },
        ],
        validation: {
          required: "El tipo de evento es obligatorio",
        },
        cols: {
          sm: 6,
          md: 3,
          lg: 3,
          xl: 3,
        }
      },
      {
        name: "deviceId",
        path: "deviceId",
        label: "Dispositivo",
        type: "text",
        placeholder: "Identificador del dispositivo",
        validation: {},
        cols: {
          sm: 6,
          md: 3,
          lg: 3,
          xl: 3,
        }
      },
      {
        name: "timestamp",
        path: "timestamp",
        label: "Fecha y Hora",
        type: "datetime-local",
        placeholder: "Fecha y hora del evento",
        validation: {},
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        }
      }
    ],
    editForm: {
      title: "Editar Evento de Fichaje",
      endpoint: "punches",
      method: "PUT",
      successMessage: "Evento de fichaje actualizado con éxito",
      errorMessage: "Error al actualizar el evento de fichaje",
    },
    filtersGroup: {
      search: {
        name: "search",
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Buscar",
            type: "search",
            placeholder: "Buscar por ID",
          }
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
              name: "dates",
              label: "Fecha",
              type: "dateRange",
            },
            {
              name: "event_type",
              label: "Tipo de evento",
              type: "select",
              options: [
                { value: "IN", label: "Entrada" },
                { value: "OUT", label: "Salida" },
              ],
            },
            {
              name: "device_id",
              label: "Dispositivo",
              type: "text",
              placeholder: "Buscar por dispositivo",
            },
          ],
        },
        {
          name: "employees",
          label: "Empleado",
          filters: [
            {
              name: "employee_id",
              label: "Empleado",
              type: "autocomplete",
              placeholder: "Buscar por empleado",
              endpoint: "employees/options",
            }
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "id", path: "id" },
        { name: "employee", label: "Empleado", type: "text", path: "employee.name" },
        { name: "eventType", label: "Tipo", type: "badge", path: "eventType", 
          options: {
            IN: { label: "Entrada", color: "success", outline: true },
            OUT: { label: "Salida", color: "secondary", outline: true },
          }
        },
        { name: "timestamp", label: "Fecha y Hora", type: "dateHour", path: "timestamp" },
        { name: "deviceId", label: "Dispositivo", type: "text", path: "deviceId", hideOnMobile: true },
        { name: "createdAt", label: "Registrado", type: "dateHour", path: "createdAt" },
      ],
    },
  },

};



