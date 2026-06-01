// src/configs/entities/entitiesConfig.orders.ts
// Módulo de configuración de entidades: orders, incoterms, payment-terms, salespeople

const ordersConfig: Record<string, any> = {
  orders: {
    /* hideCreateButton: true, */
    hideEditButton: true,
    title: 'Pedidos',
    description: 'Gestiona, edita, y consulta pedidos.',
    emptyState: {
      title: 'No existen pedidos según los filtros',
      description: 'Modifica los filtros o crea un nuevo pedido.',
    },
    perPage: 12,
    endpoint: 'orders',
    viewRoute: '/admin/orders/:id',
    deleteEndpoint: 'orders/:id',
    createRedirect: '/admin/orders-manager',
    exports: [
      {
        title: 'Exportar a A3ERP',
        endpoint: 'orders/xls/A3ERP-sales-delivery-note-filtered',
        type: 'excel',
        waitingMessage: 'Generando exportación a A3ERP',
        fileName: 'Exportacion_pedidos_A3ERP',
      },
      {
        title: 'Exportar a A3ERP2',
        endpoint: 'orders/xls/A3ERP2-sales-delivery-note-filtered',
        type: 'excel',
        waitingMessage: 'Generando exportación a A3ERP2',
        fileName: 'Exportacion_pedidos_A3ERP2',
      },
      {
        title: 'Exportar a Facilcom',
        endpoint: 'orders/xls/facilcom-sales-delivery-note',
        type: 'excel',
        waitingMessage: 'Generando exportación a Facilcom',
        fileName: 'Exportacion_pedidos_Facilcom',
      },
      {
        title: 'Exportar a Excel',
        endpoint: 'orders_report',
        type: 'excel',
        waitingMessage: 'Generando exportación a excel',
        fileName: 'export_pedidos',
      },
      {
        title: 'Imprimir Hojas de Pedidos',
        endpoint: 'orders/pdf/order-sheets-filtered',
        type: 'pdf',
        waitingMessage: 'Generando hojas de pedidos',
        fileName: 'Hojas_de_pedido_masivas',
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
        label: 'Buscar',
        filters: [
          {
            name: 'id',
            label: 'Buscar',
            type: 'search',
            placeholder: 'Buscar por id',
          },
        ],
      },
      groups: [
        {
          name: 'generals',
          label: 'Generales',
          filters: [
            /* ids */
            {
              name: 'ids',
              label: 'Números de ID',
              type: 'textAccumulator',
              placeholder: 'Buscar por IDs',
            },
            {
              name: 'loadDate',
              label: 'Fecha de carga',
              type: 'dateRange',
              visibleMonths: 1,
            },

            /* Buyer reference */
            {
              name: 'buyerReference',
              label: 'Referencia',
              type: 'text',
              placeholder: 'Buscar por referencia',
            },
            {
              name: 'status',
              label: 'Estado',
              type: 'pairSelectBoxes',
              options: [
                { name: 'pending', label: 'Pendiente', value: false },
                { name: 'finished', label: 'Finalizado', value: false },
              ],
            },
            {
              name: 'orderType',
              label: 'Tipo de pedido',
              type: 'pairSelectBoxes',
              options: [
                { name: 'standard', label: 'Pedido estándar', value: false },
                { name: 'autoventa', label: 'Autoventa', value: false },
              ],
            },
          ],
        },

        /* Customers */
        {
          name: 'customers',
          label: 'Clientes',
          filters: [
            {
              name: 'customers',
              label: 'Clientes',
              type: 'autocomplete',
              placeholder: 'Buscar por cliente',
              endpoint: 'customers/options',
            },
          ],
        },
        /* Species */
        {
          name: 'species',
          label: 'Especies',
          filters: [
            {
              name: 'species',
              label: 'Especies',
              type: 'autocomplete',
              placeholder: 'Buscar por especie',
              endpoint: 'species/options',
            },
          ],
        },
        /* Products */
        {
          name: 'products',
          label: 'Productos',
          filters: [
            {
              name: 'products',
              label: 'Productos',
              type: 'autocomplete',
              placeholder: 'Buscar por producto',
              endpoint: 'products/options',
            },
          ],
        },
        /* salesperson */
        {
          name: 'salespeple',
          label: 'Comerciales',
          filters: [
            {
              name: 'salespeople',
              label: 'Comerciales',
              type: 'autocomplete',
              placeholder: 'Buscar por comercial',
              endpoint: 'salespeople/options',
            },
          ],
        },
        /* Transporte */
        {
          name: 'transport',
          label: 'Transporte',
          filters: [
            {
              name: 'transport',
              label: 'Transporte',
              type: 'autocomplete',
              placeholder: 'Buscar por transporte',
              endpoint: 'transports/options',
            },
          ],
        },
        /* incoterm */
        {
          name: 'incoterm',
          label: 'Incoterm',
          filters: [
            {
              name: 'incoterm',
              label: 'Incoterm',
              type: 'autocomplete',
              placeholder: 'Buscar por incoterm',
              endpoint: 'incoterms/options',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'loadDate', label: 'Fecha Salida', type: 'date', path: 'loadDate' },
        { name: 'customerName', label: 'Cliente', type: 'text', path: 'customer.name' },
        {
          name: 'buyerReference',
          label: 'Referencia',
          type: 'text',
          path: 'buyerReference',
          hideOnMobile: true,
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'badge',
          options: {
            pending: { label: 'Pendiente', color: 'warning', outline: true },
            finished: { label: 'Finalizado', color: 'success', outline: true },
            incident: { label: 'Incidencia', color: 'danger', outline: true },
            default: { label: 'Desconocido', color: 'secondary', outline: true },
          },
        },
        {
          name: 'orderType',
          label: 'Tipo',
          type: 'text',
          path: 'orderType',
          hideOnMobile: true,
          options: {
            standard: { label: 'Estándar' },
            autoventa: { label: 'Autoventa' },
            default: { label: '—' },
          },
        },
        {
          name: 'totalNetWeight',
          label: 'Peso total',
          type: 'weight',
          path: 'totalNetWeight',
          hideOnMobile: true,
        },
        {
          name: 'totalBoxes',
          label: 'Cajas',
          type: 'text',
          path: 'totalBoxes',
          hideOnMobile: true,
        },
        { name: 'pallets', label: 'Palets', type: 'text', path: 'pallets', hideOnMobile: true },
        /* subtotalAmount */
        {
          name: 'subtotalAmount',
          label: 'Subtotal',
          type: 'currency',
          path: 'subtotalAmount',
          hideOnMobile: true,
        },
        /* totalAmount */
        {
          name: 'totalAmount',
          label: 'Total',
          type: 'currency',
          path: 'totalAmount',
          hideOnMobile: true,
        },
        {
          name: 'salesperson',
          label: 'Vendedor',
          type: 'text',
          path: 'salesperson.name',
          hideOnMobile: true,
        },
        {
          name: 'incoterm',
          label: 'Incoterm',
          type: 'text',
          path: 'incoterm.code',
          hideOnMobile: true,
        },
        {
          name: 'transport',
          label: 'Transporte',
          type: 'text',
          path: 'transport.name',
          hideOnMobile: true,
        },
      ],
    },
    createForm: {
      title: 'Nuevo Pedido',
      endpoint: 'v3/orders',
      method: 'POST',
      /* success Message */
      successMessage: 'Pedido creado con éxito',
      /* error message */
      errorMessage: 'Error al crear el pedido',
      fields: [
        /* Cliente Autocomplete */
        {
          name: 'customer',
          label: 'Cliente',
          type: 'Autocomplete',
          endpoint: 'customers/options',
          validation: {
            required: 'Seleccionar un cliente es obligatorio',
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 2,
            xl: 2,
          },
        },
        /* Buyer reference input */
        {
          name: 'buyerReference',
          label: 'Referencia',
          type: 'text',
          validation: {
            required: 'La referencia es obligatoria',
            minLength: {
              value: 3,
              message: 'La referencia debe tener al menos 3 caracteres',
            },
            maxLength: {
              value: 20,
              message: 'La referencia no puede tener más de 20 caracteres',
            },
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 2,
            xl: 1,
          },
        },

        /* Incoterm Autocomplete */
        {
          name: 'incoterm',
          label: 'Incoterm',
          type: 'Autocomplete',
          endpoint: 'incoterms/options',
          validation: {
            required: 'Seleccionar un Incoterm es obligatorio',
          },
          cols: {
            sm: 6,
            md: 6,
            lg: 2,
            xl: 1,
          },
        },
        /* entryDate */
        {
          name: 'entryDate',
          label: 'Fecha de entrada',
          type: 'date',
          validation: {
            required: 'La fecha de entrada es obligatoria',
            /* validate: {
              validDate: value => (new Date(value) >= new Date()) || "La fecha debe ser hoy o futura"
            } */
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 1,
          },
        },
        /* loadDate */
        {
          name: 'loadDate',
          label: 'Fecha de carga',
          type: 'date',
          validation: {
            required: 'La fecha de carga es obligatoria',
            /* validate: {
              validDate: value => (new Date(value) >= new Date()) || "La fecha debe ser hoy o futura"
            } */
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 1,
          },
        },
        /* Salesperson Autocomplete */
        {
          name: 'salesperson',
          label: 'Comercial',
          type: 'Autocomplete',
          endpoint: 'salespeople/options',
          validation: {
            required: 'Seleccionar un comercial es obligatorio',
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          },
        },
        /* Transport Autocomplete */
        {
          name: 'transport',
          label: 'Transporte',
          type: 'Autocomplete',
          endpoint: 'transports/options',
          validation: {
            required: 'Seleccionar un transporte es obligatorio',
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          },
        },
        /* paymentTerm Autocomplete */
        {
          name: 'paymentTerm',
          label: 'Forma de pago',
          type: 'Autocomplete',
          endpoint: 'payment-terms/options',
          validation: {
            required: 'Seleccionar una forma de pago es obligatorio',
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          },
        },
        /* billingAddress */
        {
          name: 'billingAddress',
          label: 'Dirección de facturación',
          type: 'textarea',
          validation: {
            required: 'La dirección de facturación es obligatoria',
            minLength: {
              value: 10,
              message: 'Debe contener al menos 10 caracteres',
            },
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          },
        },
        /* shippingAddress */
        {
          name: 'shippingAddress',
          label: 'Dirección de envío',
          type: 'textarea',
          validation: {
            required: 'La dirección de envío es obligatoria',
            minLength: {
              value: 10,
              message: 'Debe contener al menos 10 caracteres',
            },
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          },
        },
        /* productionNotes */
        {
          name: 'productionNotes',
          label: 'Notas de producción',
          type: 'textarea',
          validation: {
            maxLength: {
              value: 200,
              message: 'No puede exceder los 200 caracteres',
            },
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          },
        },
        /* accountingNotes */
        {
          name: 'accountingNotes',
          label: 'Notas de contabilidad',
          type: 'textarea',
          validation: {
            maxLength: {
              value: 200,
              message: 'No puede exceder los 200 caracteres',
            },
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          },
        },
        /* emails */
        {
          name: 'emails',
          label: 'Emails',
          type: 'textarea',
          validation: {
            required: 'El campo de emails es obligatorio',
            pattern: {
              value: '/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/',
              message: 'Formato de email no válido',
            },
          },
          cols: {
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
          },
        },
      ],
    },
  },
  incoterms: {
    title: 'Incoterms',
    description: 'Gestiona, edita y consulta incoterms.',
    emptyState: {
      title: 'No existen incoterms según los filtros',
      description: 'Ajusta los filtros o crea un nuevo incoterm.',
    },
    endpoint: 'incoterms',
    viewRoute: '/admin/incoterms/:id',
    deleteEndpoint: 'incoterms/:id',
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'id',
            label: 'Id',
            type: 'search',
            placeholder: 'Buscar por id',
          },
        ],
      },
      groups: [
        {
          name: 'generals',
          label: 'Generales',
          filters: [
            {
              name: 'ids',
              label: 'IDs',
              type: 'textAccumulator',
              placeholder: 'Buscar por ID',
            },
            /* code */
            {
              name: 'code',
              label: 'Código',
              type: 'text',
              placeholder: 'Buscar por código',
            },
            /* description */
            {
              name: 'description',
              label: 'Descripción',
              type: 'text',
              placeholder: 'Buscar por descripción',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'code', label: 'Código', type: 'text', path: 'code' },
        /* description */
        { name: 'description', label: 'Descripción', type: 'text', path: 'description' },
      ],
    },
    /* createForm */
    createForm: {
      title: 'Crear incoterm',
      endpoint: 'incoterms',
      method: 'POST',
      successMessage: 'Incoterm creado con éxito',
      errorMessage: 'Error al crear el incoterm',
    },
    fields: [
      {
        name: 'code',
        label: 'Código',
        type: 'text',
        validation: {
          required: 'El código es obligatorio',
        },
        cols: {
          sm: 2,
          md: 2,
          lg: 2,
          xl: 2,
        },
      },
      {
        name: 'description',
        label: 'Descripción',
        type: 'text',
        validation: {
          required: 'La descripción es obligatoria',
        },
        cols: {
          sm: 4,
          md: 4,
          lg: 4,
          xl: 4,
        },
      },
    ],
    /* editForm */
    editForm: {
      title: 'Editar incoterm',
      endpoint: 'incoterms', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Incoterm actualizado con éxito',
      errorMessage: 'Error al actualizar el incoterm',
    },
  },
  /* salespeople */
  'payment-terms': {
    title: 'Métodos de pago',
    description: 'Gestiona, edita y consulta métodos de pago.',
    emptyState: {
      title: 'No existen plazos de pago según los filtros',
      description: 'Ajusta los filtros o crea un nuevo plazo de pago.',
    },
    endpoint: 'payment-terms',
    viewRoute: '/admin/payment-terms/:id',
    deleteEndpoint: 'payment-terms/:id',
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'id',
            label: 'Id',
            type: 'search',
            placeholder: 'Buscar por id',
          },
        ],
      },
      groups: [
        {
          name: 'generals',
          label: 'Generales',
          filters: [
            /* ids */
            {
              name: 'ids',
              label: 'IDs',
              type: 'textAccumulator',
              placeholder: 'Buscar por ID',
            },
            /* name */
            {
              name: 'name',
              label: 'Nombre',
              type: 'text',
              placeholder: 'Buscar por nombre',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        /* name */
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
      ],
    },
    createForm: {
      title: 'Crear método de pago',
      endpoint: 'payment-terms',
      method: 'POST',
      successMessage: 'Método de pago creado con éxito',
      errorMessage: 'Error al crear el método de pago',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Introduce el nombre',
        validation: {
          required: 'El nombre es obligatorio',
        },
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        },
      },
    ],
    editForm: {
      title: 'Editar método de pago',
      endpoint: 'payment-terms', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Método de pago actualizado con éxito',
      errorMessage: 'Error al actualizar el método de pago',
    },
  },

  salespeople: {
    title: 'Comerciales',
    description: 'Gestiona, edita y consulta comerciales.',
    emptyState: {
      title: 'No existen comerciales según los filtros',
      description: 'Ajusta los filtros o crea un nuevo comercial.',
    },
    endpoint: 'salespeople',
    viewRoute: '/admin/salespeople/:id',
    deleteEndpoint: 'salespeople/:id',
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'id',
            label: 'Id',
            type: 'search',
            placeholder: 'Buscar por id',
          },
        ],
      },
      groups: [
        {
          name: 'generals',
          label: 'Generales',
          filters: [
            {
              name: 'ids',
              label: 'IDs',
              type: 'textAccumulator',
              placeholder: 'Buscar por ID',
            },
            /* name */
            {
              name: 'name',
              label: 'Nombre',
              type: 'text',
              placeholder: 'Buscar por nombre',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
        { name: 'emails', label: 'Emails', type: 'list', path: 'emails' },
        { name: 'ccEmails', label: 'Emails en copia (CC)', type: 'list', path: 'ccEmails' },
      ],
    },
    createForm: {
      title: 'Crear comercial',
      endpoint: 'salespeople',
      method: 'POST',
      successMessage: 'Comercial creado con éxito',
      errorMessage: 'Error al crear el comercial',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Ej. Juan Pérez',
        validation: {
          required: 'El nombre es obligatorio',
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'emails',
        label: 'Emails',
        type: 'emailList',
        placeholder: 'Introduce un correo y pulsa Enter',
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: 'ccEmails',
        label: 'Emails en copia (CC)',
        type: 'emailList',
        placeholder: 'Introduce un correo y pulsa Enter',
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
    ],
    editForm: {
      title: 'Editar comercial',
      endpoint: 'salespeople', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Comercial actualizado con éxito',
      errorMessage: 'Error al actualizar el comercial',
    },
  },
  /* fishing-gears */
};

export default ordersConfig;
