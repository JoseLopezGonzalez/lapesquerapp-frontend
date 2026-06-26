// src/configs/entities/entitiesConfig.admin.ts
// Módulo de configuración de entidades: users, external-users, transports, employees, sessions, activity-logs, punches

const adminConfig: Record<string, any> = {
  users: {
    title: 'Usuarios',
    hideEditButton: true,
    hideViewButton: true,
    hideCreateButton: true,
    description: 'Gestiona, edita y consulta usuarios.',
    emptyState: {
      title: 'No existen usuarios según los filtros',
      description: 'Ajusta los filtros o crea un nuevo usuario.',
    },
    endpoint: 'users',
    viewRoute: '/admin/users/:id',
    deleteEndpoint: '/users/:id',
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
              name: 'id',
              label: 'ID',
              type: 'textAccumulator',
              placeholder: 'Buscar por ID',
            },
            {
              name: 'role',
              label: 'Rol',
              type: 'autocomplete',
              placeholder: 'Seleccionar rol',
              endpoint: 'roles/options',
            },
          ],
        },
        {
          name: 'dates',
          label: 'Fechas',
          filters: [
            {
              name: 'created_at',
              label: 'Fecha de creación',
              type: 'dateRange',
              visibleMonths: 1,
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
          name: 'email',
          label: 'Correo electrónico',
          type: 'text',
          path: 'email',
          hideOnMobile: true,
        },
        { name: 'role', label: 'Rol', type: 'text', path: 'role', hideOnMobile: true },
        {
          name: 'created_at',
          label: 'Fecha de creación',
          type: 'date',
          path: 'created_at',
          hideOnMobile: true,
        },
      ],
    },
    /* createForm */
    createForm: {
      title: 'Nuevo Usuario',
      endpoint: 'users',
      method: 'POST',
      successMessage: 'Usuario creado con éxito',
      errorMessage: 'Error al crear el usuario',
      fields: [
        {
          name: 'name',
          label: 'Nombre',
          type: 'text',
          validation: {
            required: 'El nombre es obligatorio',
            minLength: {
              value: 3,
              message: 'El nombre debe tener al menos 3 caracteres',
            },
            maxLength: {
              value: 50,
              message: 'El nombre no puede tener más de 50 caracteres',
            },
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          },
        },
        {
          name: 'email',
          label: 'Correo electrónico',
          type: 'text',
          validation: {
            required: 'El correo electrónico es obligatorio',
            pattern: {
              value: '^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$',
              message: 'Formato de email no válido',
            },
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          },
        },
        {
          name: 'role',
          label: 'Rol',
          type: 'Autocomplete',
          placeholder: 'Selecciona el rol',
          endpoint: 'roles/options',
          validation: {
            required: 'Seleccionar un rol es obligatorio',
          },
          cols: {
            sm: 3,
            md: 3,
            lg: 3,
            xl: 3,
          },
        },
      ],
    },
  },
  'external-users': {
    title: 'Usuarios externos',
    description: 'Gestiona, edita y consulta accesos externos.',
    emptyState: {
      title: 'No existen usuarios externos según los filtros',
      description: 'Ajusta los filtros o crea un nuevo usuario externo.',
    },
    endpoint: 'external-users',
    viewRoute: '/admin/external-users/:id',
    deleteEndpoint: 'external-users/:id',
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'search',
            label: 'Buscar',
            type: 'search',
            placeholder: 'Buscar por nombre, email o empresa',
          },
        ],
      },
      groups: [
        {
          name: 'generals',
          label: 'Generales',
          filters: [
            {
              name: 'type',
              label: 'Tipo',
              type: 'text',
              placeholder: 'maquilador',
            },
            {
              name: 'is_active',
              label: 'Activo',
              type: 'text',
              placeholder: '1 o 0',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
        { name: 'companyName', label: 'Empresa', type: 'text', path: 'companyName' },
        { name: 'email', label: 'Email', type: 'text', path: 'email', hideOnMobile: true },
        { name: 'type', label: 'Tipo', type: 'text', path: 'type' },
        {
          name: 'isActive',
          label: 'Activo',
          type: 'badge',
          path: 'isActive',
          options: {
            true: { label: 'Activo', color: 'success', outline: true },
            false: { label: 'Inactivo', color: 'secondary', outline: true },
          },
        },
        {
          name: 'storesCount',
          label: 'Almacenes',
          type: 'text',
          path: 'storesCount',
          hideOnMobile: true,
        },
        {
          name: 'created_at',
          label: 'Creado',
          type: 'date',
          path: 'created_at',
          hideOnMobile: true,
        },
      ],
    },
    rowActions: [
      {
        key: 'resend-access',
        label: 'Reenviar acceso',
        shortLabel: 'R',
        serviceMethod: 'resendAccess',
        successMessage: 'Acceso reenviado correctamente.',
        confirmation: '¿Reenviar acceso a {{name}}?',
      },
      {
        key: 'activate',
        label: 'Activar',
        shortLabel: 'A',
        serviceMethod: 'activate',
        successMessage: 'Usuario externo activado.',
        confirmation: '¿Activar a {{name}}?',
        hiddenWhen: { path: 'isActive', value: true },
      },
      {
        key: 'deactivate',
        label: 'Desactivar',
        shortLabel: 'D',
        serviceMethod: 'deactivate',
        successMessage: 'Usuario externo desactivado.',
        confirmation: '¿Desactivar a {{name}}?',
        hiddenWhen: { path: 'isActive', value: false },
      },
    ],
    createForm: {
      title: 'Crear usuario externo',
      endpoint: 'external-users',
      method: 'POST',
      successMessage: 'Usuario externo creado con éxito',
      errorMessage: 'Error al crear el usuario externo',
    },
    editForm: {
      title: 'Editar usuario externo',
      endpoint: 'external-users',
      method: 'PUT',
      successMessage: 'Usuario externo actualizado con éxito',
      errorMessage: 'Error al actualizar el usuario externo',
    },
    beforeSubmit: {
      defaults: { type: 'maquilador' },
      booleanFields: ['is_active'],
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Nombre del usuario externo',
        validation: { required: 'El nombre es obligatorio' },
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'company_name',
        path: 'companyName',
        label: 'Empresa',
        type: 'text',
        placeholder: 'Empresa del colaborador',
        validation: { required: 'La empresa es obligatoria' },
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'email',
        label: 'Email',
        type: 'text',
        placeholder: 'correo@empresa.com',
        validation: {
          required: 'El email es obligatorio',
          pattern: {
            value: '^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$',
            message: 'Formato de email no válido',
          },
        },
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'type',
        label: 'Tipo',
        type: 'select',
        placeholder: 'Selecciona el tipo',
        options: [{ value: 'maquilador', label: 'Maquilador' }],
        validation: { required: 'El tipo es obligatorio' },
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'is_active',
        path: 'isActive',
        label: 'Activo',
        type: 'select',
        placeholder: 'Estado',
        options: [
          { value: '1', label: 'Activo' },
          { value: '0', label: 'Inactivo' },
        ],
        cols: { sm: 3, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'notes',
        label: 'Notas',
        type: 'textarea',
        placeholder: 'Notas internas',
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
  },
  /* Transports */
  transports: {
    title: 'Transportes',
    description: 'Gestiona, edita y consulta transportes.',
    emptyState: {
      title: 'No existen transportes según los filtros',
      description: 'Ajusta los filtros o crea un nuevo transporte.',
    },
    endpoint: 'transports',
    viewRoute: '/admin/transports/:id',
    deleteEndpoint: 'transports/:id',
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
            /* address text area*/
            {
              name: 'address',
              label: 'Dirección',
              type: 'textarea',
              placeholder: 'Buscar por dirección',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
        { name: 'vatNumber', label: 'NIF/CIF', type: 'text', path: 'vatNumber' },
        { name: 'address', label: 'Dirección', type: 'text', path: 'address' },
        { name: 'emails', label: 'Emails', type: 'list', path: 'emails' },
        { name: 'ccEmails', label: 'Emails en copia (CC)', type: 'list', path: 'ccEmails' },
        { name: 'contactos', label: 'Contactos', type: 'text', path: 'contactos', hideOnMobile: true },
      ],
    },
    createForm: {
      title: 'Nuevo Transporte',
      endpoint: 'transports',
      method: 'POST',
      successMessage: 'Transporte creado con éxito',
      errorMessage: 'Error al crear el transporte',
    },
    editForm: {
      title: 'Editar Transporte',
      endpoint: 'transports',
      method: 'PUT',
      successMessage: 'Transporte actualizado con éxito',
      errorMessage: 'Error al actualizar el transporte',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 4, xl: 4 },
      },
      {
        name: 'vatNumber',
        label: 'CIF',
        type: 'text',
        validation: {
          required: 'El CIF es obligatorio',
          pattern: {
            value: '/^[A-Z0-9]{8,12}$/',
            message: 'Formato no válido',
          },
        },
        cols: { sm: 6, md: 6, lg: 2, xl: 2 },
      },
      {
        name: 'address',
        label: 'Dirección',
        type: 'textarea',
        validation: {
          required: 'La dirección es obligatoria',
          minLength: { value: 10, message: 'Debe contener al menos 10 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'emails',
        label: 'Emails de contacto',
        type: 'emailList',
        placeholder: "Introduce cada email individualmente y pulsa 'Enter'",
        validation: {
          required: 'Al menos un email es obligatorio',
        },
        cols: {
          sm: 6,
          md: 6,
          lg: 3,
          xl: 3,
        },
      },
      {
        name: 'ccEmails',
        label: 'Emails en copia',
        type: 'emailList',
        placeholder: "Introduce cada email individualmente y pulsa 'Enter' para confirmarlo",
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: 'contactos',
        label: 'Contactos',
        type: 'textarea',
        placeholder: 'Ej: Juan García - 612 345 678\nMaría López - pedidos@trans.es',
        validation: {
          maxLength: { value: 5000, message: 'Máximo 5000 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
  },

  /* Products */
  employees: {
    hideCreateButton: false,
    hideEditButton: false,
    hideViewButton: true,
    title: 'Empleados',
    description: 'Gestiona los empleados del sistema.',
    emptyState: {
      title: 'No existen empleados según los filtros',
      description: 'Ajusta los filtros o crea un nuevo empleado.',
    },
    perPage: 15,
    endpoint: 'employees',
    deleteEndpoint: 'employees/:id',
    filtersGroup: {
      search: {
        name: 'search',
        label: 'Buscar',
        filters: [
          {
            name: 'name',
            label: 'Buscar',
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
              name: 'ids',
              label: 'Números de ID',
              type: 'textAccumulator',
              placeholder: 'Buscar por IDs',
            },
            {
              name: 'nfc_uid',
              label: 'UID NFC',
              type: 'text',
              placeholder: 'Buscar por UID NFC',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
        { name: 'nfcUid', label: 'UID NFC', type: 'text', path: 'nfcUid', hideOnMobile: true },
        {
          name: 'createdAt',
          label: 'Fecha de creación',
          type: 'dateTime',
          path: 'createdAt',
          hideOnMobile: true,
        },
        {
          name: 'updatedAt',
          label: 'Última actualización',
          type: 'dateTime',
          path: 'updatedAt',
          hideOnMobile: true,
        },
      ],
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Nombre completo del empleado',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: {
            value: 3,
            message: 'El nombre debe tener al menos 3 caracteres',
          },
        },
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        },
      },
      {
        name: 'nfc_uid',
        label: 'UID NFC',
        type: 'text',
        placeholder: 'UID de la tarjeta NFC (opcional)',
        validation: {},
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        },
      },
    ],
    createForm: {
      title: 'Nuevo Empleado',
      endpoint: 'employees',
      method: 'POST',
      successMessage: 'Empleado creado con éxito',
      errorMessage: 'Error al crear el empleado',
    },
    editForm: {
      title: 'Editar Empleado',
      endpoint: 'employees',
      method: 'PUT',
      successMessage: 'Empleado actualizado con éxito',
      errorMessage: 'Error al actualizar el empleado',
    },
  },

  sessions: {
    hideCreateButton: true,
    hideEditButton: true,
    hideViewButton: true,
    title: 'Sesiones',
    description: 'Gestiona, edita y consulta sesiones.',
    emptyState: {
      title: 'No existen sesiones según los filtros',
      description: 'Ajusta los filtros o crea una nueva sesión.',
    },
    endpoint: 'sessions',
    perPage: 15,
    viewRoute: '/admin/sessions/:id',
    deleteEndpoint: 'sessions/:id',
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
        /* user_name */
        { name: 'user_name', label: 'Usuario', type: 'text', path: 'user_name' },
        /* created_at */
        { name: 'created_at', label: 'Fecha de creación', type: 'date', path: 'created_at' },
        /* last_used_at */
        { name: 'last_used_at', label: 'Último uso', type: 'date', path: 'last_used_at' },
        /* expires_at */
        { name: 'expires_at', label: 'Expira', type: 'date', path: 'expires_at' },
      ],
    },
  },

  /* activity-logs */
  'activity-logs': {
    hideCreateButton: true,
    hideEditButton: true,
    hideViewButton: true,
    perPage: 18,
    title: 'Registros de actividad',
    description: 'Gestiona, edita y consulta registros de actividad.',
    emptyState: {
      title: 'No existen registros de actividad según los filtros',
      description: 'Ajusta los filtros o crea un nuevo registro de actividad.',
    },
    endpoint: 'activity-logs',
    viewRoute: '/admin/activity-logs/:id',
    deleteEndpoint: 'activity-logs/:id',
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
            /* path */
            {
              name: 'path',
              label: 'Ruta',
              type: 'text',
              placeholder: 'Buscar por ruta',
            },

            /* created_at */
            {
              name: 'dates',
              label: 'Fecha',
              type: 'dateRange',
              visibleMonths: 1,
            },
          ],
        },
        /* users */
        {
          name: 'users',
          label: 'Usuarios',
          filters: [
            {
              name: 'users',
              label: 'Usuarios',
              type: 'autocomplete',
              placeholder: 'Buscar por usuario',
              endpoint: 'users/options',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
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
        { name: 'user', label: 'Usuario', type: 'text', path: 'user.name' },
        /* tokenId */
        { name: 'tokenId', label: 'Token', type: 'text', path: 'tokenId' },
        /* created_at */
        { name: 'created_at', label: 'Fecha de creación', type: 'dateHour', path: 'createdAt' },
        /* ip_address */
        { name: 'ip_address', label: 'Dirección IP', type: 'text', path: 'ipAddress' },
        /* browser */
        { name: 'browser', label: 'Navegador', type: 'text', path: 'browser' },
        /* location */
        { name: 'location', label: 'Ubicación', type: 'text', path: 'location' },
        /* region */
        { name: 'region', label: 'Región', type: 'text', path: 'region' },
        /* platform */
        { name: 'platform', label: 'Plataforma', type: 'text', path: 'platform' },
        /* path */
        { name: 'path', label: 'Ruta', type: 'text', path: 'path' },
        /* method */
        { name: 'method', label: 'Método', type: 'text', path: 'method' },
      ],
    },
  },

  /* Product Categories */
  punches: {
    hideCreateButton: true, // Los fichajes se crean desde el gestor de registro horario
    hideEditButton: false, // Habilitar edición en modal
    hideViewButton: true,
    title: 'Eventos de Fichaje',
    description: 'Consulta y gestiona los eventos de fichaje registrados.',
    emptyState: {
      title: 'No existen eventos de fichaje según los filtros',
      description: 'Ajusta los filtros para ver más eventos.',
    },
    perPage: 15,
    endpoint: 'punches',
    deleteEndpoint: 'punches/:id',
    fields: [
      {
        name: 'employeeId',
        path: 'employee.id',
        label: 'Empleado',
        type: 'Autocomplete',
        placeholder: 'Selecciona el empleado',
        endpoint: 'employees/options',
        validation: {
          required: 'El empleado es obligatorio',
        },
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        },
      },
      {
        name: 'eventType',
        path: 'eventType',
        label: 'Tipo de evento',
        type: 'select',
        placeholder: 'Selecciona el tipo',
        options: [
          { value: 'IN', label: 'Entrada' },
          { value: 'OUT', label: 'Salida' },
        ],
        validation: {
          required: 'El tipo de evento es obligatorio',
        },
        cols: {
          sm: 6,
          md: 3,
          lg: 3,
          xl: 3,
        },
      },
      {
        name: 'deviceId',
        path: 'deviceId',
        label: 'Dispositivo',
        type: 'text',
        placeholder: 'Identificador del dispositivo',
        validation: {},
        cols: {
          sm: 6,
          md: 3,
          lg: 3,
          xl: 3,
        },
      },
      {
        name: 'timestamp',
        path: 'timestamp',
        label: 'Fecha y Hora',
        type: 'datetime-local',
        placeholder: 'Fecha y hora del evento',
        validation: {},
        cols: {
          sm: 6,
          md: 6,
          lg: 6,
          xl: 6,
        },
      },
    ],
    editForm: {
      title: 'Editar Evento de Fichaje',
      endpoint: 'punches',
      method: 'PUT',
      successMessage: 'Evento de fichaje actualizado con éxito',
      errorMessage: 'Error al actualizar el evento de fichaje',
    },
    filtersGroup: {
      search: {
        name: 'search',
        label: 'Buscar',
        filters: [
          {
            name: 'id',
            label: 'Buscar',
            type: 'search',
            placeholder: 'Buscar por ID',
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
              label: 'Números de ID',
              type: 'textAccumulator',
              placeholder: 'Buscar por IDs',
            },
            {
              name: 'dates',
              label: 'Fecha',
              type: 'dateRange',
            },
            {
              name: 'event_type',
              label: 'Tipo de evento',
              type: 'select',
              options: [
                { value: 'IN', label: 'Entrada' },
                { value: 'OUT', label: 'Salida' },
              ],
            },
            {
              name: 'device_id',
              label: 'Dispositivo',
              type: 'text',
              placeholder: 'Buscar por dispositivo',
            },
          ],
        },
        {
          name: 'employees',
          label: 'Empleado',
          filters: [
            {
              name: 'employee_id',
              label: 'Empleado',
              type: 'autocomplete',
              placeholder: 'Buscar por empleado',
              endpoint: 'employees/options',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'employee', label: 'Empleado', type: 'text', path: 'employee.name' },
        {
          name: 'eventType',
          label: 'Tipo',
          type: 'badge',
          path: 'eventType',
          options: {
            IN: { label: 'Entrada', color: 'success', outline: true },
            OUT: { label: 'Salida', color: 'secondary', outline: true },
          },
        },
        { name: 'timestamp', label: 'Fecha y Hora', type: 'dateHour', path: 'timestamp' },
        {
          name: 'deviceId',
          label: 'Dispositivo',
          type: 'text',
          path: 'deviceId',
          hideOnMobile: true,
        },
        { name: 'createdAt', label: 'Registrado', type: 'dateHour', path: 'createdAt' },
      ],
    },
  },
};

export default adminConfig;
