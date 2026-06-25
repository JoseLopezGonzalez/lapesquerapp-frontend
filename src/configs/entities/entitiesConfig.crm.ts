// src/configs/entities/entitiesConfig.crm.ts
// Módulo de configuración de entidades: customers, prospect-categories, suppliers

const crmConfig: Record<string, any> = {
  customers: {
    title: 'Clientes',
    description: 'Gestiona, edita y consulta clientes.',
    emptyState: {
      title: 'No existen clientes según los filtros',
      description: 'Ajusta los filtros o crea un nuevo cliente.',
    },
    endpoint: 'customers',
    viewRoute: '/admin/customers/:id',
    deleteEndpoint: 'customers/:id',
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
            /* vat_number */
            {
              name: 'vatNumber',
              label: 'NIF',
              type: 'text',
              placeholder: 'Buscar por NIF',
            },
            /* country */
            {
              name: 'country',
              label: 'País',
              type: 'text',
              placeholder: 'Buscar por país',
            },
          ],
        },
        /* Salespeople */
        {
          name: 'salespeople',
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

        /* countries */
        {
          name: 'countries',
          label: 'Países',
          filters: [
            {
              name: 'countries',
              label: 'Países',
              type: 'autocomplete',
              placeholder: 'Buscar por país',
              endpoint: 'countries/options',
            },
          ],
        },
        /* paymentTerms */
        {
          name: 'paymentTerms',
          label: 'Formas de pago',
          filters: [
            {
              name: 'paymentTerms',
              label: 'Formas de pago',
              type: 'autocomplete',
              placeholder: 'Buscar por forma de pago',
              endpoint: 'payment-terms/options',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
        { name: 'vatNumber', label: 'NIF', type: 'text', path: 'vatNumber' },
        { name: 'facilcom_code', label: 'Código Facilcom', type: 'text', path: 'facilcomCode' },
        { name: 'a3erp_code', label: 'Código A3ERP', type: 'text', path: 'a3erpCode' },
        {
          name: 'paymentTerm',
          label: 'Forma de pago',
          type: 'text',
          path: 'paymentTerm.name',
          columnProps: { meta: { cellClass: 'whitespace-normal max-w-[180px]' } },
        },
        { name: 'salesperson', label: 'Comercial', type: 'text', path: 'salesperson.name' },
        /* emails */
        { name: 'emails', label: 'Emails', type: 'list', path: 'emails' },
        /* ccEmails */
        { name: 'ccEmails', label: 'Emails en copia (CC)', type: 'list', path: 'ccEmails' },
        { name: 'country', label: 'País', type: 'text', path: 'country.name' },
      ],
    },
    createForm: {
      title: 'Crear cliente',
      endpoint: 'customers',
      method: 'POST',
      successMessage: 'Cliente creado con éxito',
      errorMessage: 'Error al crear el cliente',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Introduce el nombre del cliente',
        validation: {
          required: 'El nombre es obligatorio',
        },
        cols: { sm: 6, md: 4, lg: 4, xl: 4 },
      },
      {
        name: 'vatNumber',
        label: 'NIF',
        type: 'text',
        placeholder: 'Introduce el NIF',
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'billing_address',
        path: 'billingAddress',
        label: 'Dirección de facturación',
        type: 'textarea',
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'shipping_address',
        path: 'shippingAddress',
        label: 'Dirección de envío',
        type: 'textarea',
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'transportation_notes',
        path: 'transportationNotes',
        label: 'Notas para transporte',
        type: 'textarea',
        cols: { sm: 6, md: 6, lg: 6, xl: 2 },
      },
      {
        name: 'production_notes',
        path: 'productionNotes',
        label: 'Notas para producción',
        type: 'textarea',
        cols: { sm: 3, md: 3, lg: 3, xl: 2 },
      },
      {
        name: 'accounting_notes',
        path: 'accountingNotes',
        label: 'Notas contables',
        type: 'textarea',
        cols: { sm: 3, md: 3, lg: 3, xl: 2 },
      },
      {
        name: 'emails',
        label: 'Emails',
        type: 'emailList',
        placeholder: 'Introduce correos electrónicos y pulsa Enter',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      /* ccEmails */
      {
        name: 'ccEmails',
        label: 'Emails en copia (CC)',
        type: 'emailList',
        placeholder: 'Introduce correos electrónicos en copia y pulsa Enter',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'contact_info',
        path: 'contactInfo',
        label: 'Información de contacto',
        type: 'textarea',
        placeholder: 'Introduce teléfonos u otra información de contacto',
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'salesperson_id',
        path: 'salesperson.id',
        label: 'Comercial',
        type: 'Autocomplete',
        placeholder: 'Selecciona el comercial',
        endpoint: 'salespeople/options',
        validation: {
          required: 'El comercial es obligatorio',
        },
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'field_operator_id',
        path: 'fieldOperator.id',
        label: 'Repartidor',
        type: 'Autocomplete',
        endpoint: 'field-operators/options',
        placeholder: 'Selecciona el repartidor',
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'operational_status',
        path: 'operationalStatus',
        label: 'Estado operativo',
        type: 'select',
        placeholder: 'Selecciona el estado operativo',
        defaultValue: 'normal',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'alta_operativa', label: 'Alta operativa' },
        ],
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'country_id',
        path: 'country.id',
        label: 'País',
        type: 'Autocomplete',
        endpoint: 'countries/options',
        validation: {
          required: 'El país es obligatorio',
        },
        placeholder: 'Selecciona el país',
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'payment_term_id',
        path: 'paymentTerm.id',
        label: 'Forma de pago',
        type: 'Autocomplete',
        endpoint: 'payment-terms/options',
        validation: {
          required: 'La forma de pago es obligatoria',
        },
        placeholder: 'Selecciona la forma de pago',
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'transport_id',
        path: 'transport.id',
        label: 'Transporte',
        type: 'Autocomplete',
        endpoint: 'transports/options',
        validation: {
          required: 'El transporte es obligatorio',
        },
        placeholder: 'Selecciona el transporte',
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'a3erp_code',
        path: 'a3erpCode',
        label: 'Código A3ERP',
        type: 'text',
        placeholder: "Código para exportaciones a 'a3ERP - Software ERP'",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: 'facilcom_code',
        path: 'facilcomCode',
        label: 'Código Facilcom',
        type: 'text',
        placeholder: "Código para exportaciones a 'Facilcom - Gestión comercial integral'",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
    ],
    editForm: {
      title: 'Editar Cliente',
      endpoint: 'customers', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Cliente actualizado con éxito',
      errorMessage: 'Error al actualizar el cliente',
    },
  },
  /* suppliers */
  'prospect-categories': {
    title: 'Categorías de Prospectos',
    description: 'Gestiona las categorías usadas para clasificar prospectos comerciales.',
    emptyState: {
      title: 'No existen categorías de prospectos según los filtros',
      description: 'Ajusta los filtros o crea una nueva categoría de prospecto.',
    },
    endpoint: 'prospect-categories',
    viewRoute: '/admin/prospect-categories/:id',
    deleteEndpoint: 'prospect-categories/:id',
    hideBulkDelete: true,
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'search',
            placeholder: 'Buscar por nombre',
          },
        ],
      },
      groups: [
        {
          name: 'generals',
          label: 'Generales',
          filters: [
            {
              name: 'name',
              label: 'Nombre',
              type: 'text',
              placeholder: 'Buscar por nombre',
            },
            {
              name: 'active',
              label: 'Estado',
              type: 'pairSelectBoxes',
              options: [
                { name: '1', label: 'Activas' },
                { name: '0', label: 'Inactivas' },
              ],
            },
            {
              name: 'ids',
              label: 'IDs',
              type: 'textAccumulator',
              placeholder: 'Buscar por ID',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
        {
          name: 'description',
          label: 'Descripción',
          type: 'text',
          path: 'description',
          hideOnMobile: true,
        },
        {
          name: 'active',
          label: 'Activa',
          type: 'badge',
          path: 'active',
          options: {
            true: { label: 'Activa', color: 'success', outline: true },
            false: { label: 'Inactiva', color: 'secondary', outline: true },
          },
        },
        {
          name: 'created_at',
          label: 'Fecha de creación',
          type: 'date',
          path: 'createdAt',
          hideOnMobile: true,
        },
        {
          name: 'updated_at',
          label: 'Fecha de actualización',
          type: 'date',
          path: 'updatedAt',
          hideOnMobile: true,
        },
      ],
    },
    createForm: {
      title: 'Nueva Categoría de Prospecto',
      endpoint: 'prospect-categories',
      method: 'POST',
      successMessage: 'Categoría de prospecto creada con éxito',
      errorMessage: 'Error al crear la categoría de prospecto',
    },
    beforeSubmit: {
      booleanFields: ['active'],
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Restaurante, Mayorista, Distribuidor...',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'active',
        label: 'Activa',
        type: 'select',
        placeholder: 'Estado',
        defaultValue: '1',
        options: [
          { value: '1', label: 'Activa' },
          { value: '0', label: 'Inactiva' },
        ],
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Descripción opcional de la categoría',
        validation: {
          maxLength: { value: 1000, message: 'Máximo 1.000 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
    editForm: {
      title: 'Editar Categoría de Prospecto',
      endpoint: 'prospect-categories',
      method: 'PUT',
      successMessage: 'Categoría de prospecto actualizada con éxito',
      errorMessage: 'Error al actualizar la categoría de prospecto',
    },
  },

  /* ceboDispatches*/
  suppliers: {
    title: 'Proveedores',
    description: 'Gestiona, edita y consulta proveedores.',
    emptyState: {
      title: 'No existen proveedores según los filtros',
      description: 'Ajusta los filtros o crea un nuevo proveedor.',
    },
    endpoint: 'suppliers',
    viewRoute: '/admin/suppliers/:id',
    deleteEndpoint: 'suppliers/:id',
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
        { name: 'facil_com_code', label: 'Código Facilcom', type: 'text', path: 'facilcomCode' },
        { name: 'address', label: 'Dirección', type: 'text', path: 'address' },
        {
          name: 'contactPerson',
          label: 'Persona de contacto',
          type: 'text',
          path: 'contactPerson',
        },
        { name: 'phone', label: 'Teléfono', type: 'text', path: 'phone' },
        { name: 'emails', label: 'Emails', type: 'list', path: 'emails' },
        { name: 'ccEmails', label: 'Emails (CC)', type: 'list', path: 'ccEmails' },
      ],
    },
    createForm: {
      title: 'Crear proveedor',
      endpoint: 'suppliers',
      method: 'POST',
      successMessage: 'Proveedor creado con éxito',
      errorMessage: 'Error al crear el proveedor',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Introduce el nombre del proveedor',
        validation: {
          required: 'El nombre es obligatorio',
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'contact_person',
        label: 'Persona de contacto',
        type: 'text',
        placeholder: 'Introduce la persona de contacto',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'phone',
        label: 'Teléfono',
        type: 'text',
        placeholder: 'Introduce el teléfono',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'emails',
        label: 'Emails principales',
        type: 'emailList',
        placeholder: 'Introduce un correo electronico y pulsa Enter',
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: 'ccEmails',
        label: 'Emails en copia (CC)',
        type: 'emailList',
        placeholder: 'Introduce un correo electronico y pulsa Enter',
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: 'address',
        label: 'Dirección',
        type: 'textarea',
        placeholder: 'Introduce la dirección del proveedor',
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'facil_com_code',
        path: 'facilcomCode',
        label: 'Código Facilcom',
        type: 'text',
        placeholder: "Código para exportaciones a 'Facilcom - Gestión comercial integral'",
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
    editForm: {
      title: 'Editar Proveedor',
      endpoint: 'suppliers', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Proveedor actualizado con éxito',
      errorMessage: 'Error al actualizar el proveedor',
    },
  },
  /* CaptureZones */
};

export default crmConfig;
