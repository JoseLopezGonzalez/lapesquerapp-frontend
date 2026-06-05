// src/configs/entities/entitiesConfig.production.ts
// Módulo de configuración de entidades: raw-material-receptions, productions

const productionConfig: Record<string, any> = {
  'raw-material-receptions': {
    hideCreateButton: false,
    hideEditButton: false,
    hideViewButton: true,
    editRedirect: '/admin/raw-material-receptions/:id/edit',
    title: 'Recepciones de materia prima',
    description: 'Crea, edita, genera reportes y más.',
    emptyState: {
      title: 'No existen recepciones según los filtros',
      description: 'Ajusta los filtros o crea una nueva recepción.',
    },
    perPage: 17,
    endpoint: 'raw-material-receptions',
    viewRoute: '/admin/raw-material-receptions/:id',
    deleteEndpoint: 'raw-material-receptions/:id',
    createRedirect: '/admin/raw-material-receptions/create',
    filtersGroup: {
      search: {
        name: 'search',
        label: 'Buscar',
        filters: [
          {
            name: 'id',
            label: 'Buscar',
            type: 'search',
            placeholder: 'Buscar por ID, proveedor o notas',
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
              name: 'notes',
              label: 'Notas',
              type: 'textarea',
              placeholder: 'Buscar por notas',
            },
            {
              name: 'dates',
              label: 'Fecha',
              type: 'dateRange',
            },
          ],
        },
        {
          name: 'suppliers',
          label: 'Proveedor',
          filters: [
            {
              name: 'suppliers',
              label: 'Proveedor',
              type: 'autocomplete',
              placeholder: 'Buscar por proveedor',
              endpoint: 'suppliers/options',
            },
          ],
        },
        {
          name: 'species',
          label: 'Especie',
          filters: [
            {
              name: 'species',
              label: 'Especie',
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
        /* Estado liquidación */
        {
          name: 'liquidation',
          label: 'Liquidación',
          filters: [
            {
              name: 'liquidation_status',
              label: 'Estado liquidación',
              type: 'pairSelectBoxes',
              options: [
                { name: 'open', label: 'Sin liquidar', value: false },
                { name: 'closed', label: 'Liquidada', value: false },
              ],
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'date', label: 'Fecha', type: 'date', path: 'date' },
        { name: 'supplier', label: 'Proveedor', type: 'text', path: 'supplier.name' },
        {
          name: 'species',
          label: 'Especie',
          type: 'text',
          path: 'species.name',
          hideOnMobile: true,
        },
        { name: 'notes', label: 'Notas', type: 'text', path: 'notes', hideOnMobile: true },
        { name: 'netWeight', label: 'Peso Neto', type: 'weight', path: 'netWeight' },
        {
          name: 'totalAmount',
          label: 'Importe Total',
          type: 'currency',
          path: 'totalAmount',
          hideOnMobile: true,
        },
        {
          name: 'declaredTotalAmount',
          label: 'Importe Total Declarado',
          type: 'currency',
          path: 'declaredTotalAmount',
          hideOnMobile: true,
        },
        {
          name: 'declaredTotalNetWeight',
          label: 'Peso Neto Total Declarado',
          type: 'weight',
          path: 'declaredTotalNetWeight',
          hideOnMobile: true,
        },
        {
          name: 'liquidationStatus',
          label: 'Liquidación',
          type: 'badge',
          path: 'supplier_liquidation_id',
          hideOnMobile: true,
          options: {
            null: { label: 'Sin liquidar', color: 'success', outline: true },
            default: { label: 'Liquidada', color: 'secondary', outline: true },
          },
        },
      ],
    },

    exports: [
      {
        title: 'Exportar a Facilcom',
        endpoint: 'raw-material-receptions/facilcom-xls',
        type: 'excel',
        waitingMessage: 'Generando exportación a Facilcom',
        fileName: 'Exportacion_recepciones_Facilcom',
      },
      /* raw-material-receptions/a3erp-xlsx */
      {
        title: 'Exportar a A3ERP',
        endpoint: 'raw-material-receptions/a3erp-xls',
        type: 'excel',
        waitingMessage: 'Generando exportación a A3ERP',
        fileName: 'Exportacion_recepciones_A3ERP',
      },
    ],
  },
  productions: {
    title: 'Producciones',
    hideEditButton: true,
    sameTabNavigation: true,
    description: 'Gestiona, edita y consulta lotes de producción.',
    emptyState: {
      title: 'No existen producciones según los filtros',
      description: 'Ajusta los filtros o crea una nueva producción.',
    },
    perPage: 15,
    endpoint: 'productions',
    viewRoute: '/admin/productions/:id',
    deleteEndpoint: 'productions/:id',
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'id',
            label: 'Id',
            type: 'search',
            placeholder: 'Buscar por id o lote',
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
            {
              name: 'lot',
              label: 'Lote',
              type: 'text',
              placeholder: 'Buscar por lote',
            },
            {
              name: 'notes',
              label: 'Notas',
              type: 'textarea',
              placeholder: 'Buscar por notas',
            },
            {
              name: 'dates',
              label: 'Fecha',
              type: 'dateRange',
              visibleMonths: 1,
            },
            {
              name: 'status',
              label: 'Estado',
              type: 'pairSelectBoxes',
              options: [
                { name: 'open', label: 'Abierto', value: false },
                { name: 'closed', label: 'Cerrado', value: false },
              ],
            },
          ],
        },
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
        {
          name: 'captureZones',
          label: 'Zonas de captura',
          filters: [
            {
              name: 'captureZones',
              label: 'Zonas de captura',
              type: 'autocomplete',
              placeholder: 'Buscar por zona de captura',
              endpoint: 'capture-zones/options',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'lot', label: 'Lote', type: 'text', path: 'lot' },
        {
          name: 'species',
          label: 'Especie',
          type: 'text',
          path: 'species.name',
          hideOnMobile: true,
        },
        { name: 'openedAt', label: 'Fecha apertura', type: 'date', path: 'openedAt' },
        {
          name: 'closedAt',
          label: 'Fecha cierre',
          type: 'date',
          path: 'closedAt',
          hideOnMobile: true,
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'badge',
          path: 'status',
          options: {
            open: { label: 'Abierto', color: 'success', outline: true },
            closed: { label: 'Cerrado', color: 'secondary', outline: true },
            default: { label: 'Desconocido', color: 'secondary', outline: true },
          },
        },
        { name: 'notes', label: 'Notas', type: 'text', path: 'notes', hideOnMobile: true },
      ],
    },
    createForm: {
      title: 'Nueva Producción',
      endpoint: 'productions',
      method: 'POST',
      successMessage: 'Producción creada con éxito',
      errorMessage: 'Error al crear la producción',
      fields: [
        {
          name: 'lot',
          label: 'Número de lote',
          type: 'text',
          placeholder: 'Ej. LOT-2025-001',
          validation: {
            required: 'El número de lote es obligatorio',
            minLength: {
              value: 3,
              message: 'El lote debe tener al menos 3 caracteres',
            },
          },
          cols: {
            sm: 6,
            md: 4,
            lg: 3,
            xl: 3,
          },
        },
        {
          name: 'speciesId',
          path: 'species.id',
          label: 'Especie',
          type: 'Autocomplete',
          placeholder: 'Selecciona la especie (opcional)',
          endpoint: 'species/options',
          validation: {},
          cols: {
            sm: 6,
            md: 4,
            lg: 3,
            xl: 3,
          },
        },
        {
          name: 'captureZoneId',
          path: 'captureZone.id',
          label: 'Zona de captura',
          type: 'Autocomplete',
          placeholder: 'Selecciona la zona de captura',
          endpoint: 'capture-zones/options',
          validation: {
            required: 'La zona de captura es obligatoria',
          },
          cols: {
            sm: 6,
            md: 4,
            lg: 3,
            xl: 3,
          },
        },
        {
          name: 'notes',
          label: 'Notas',
          type: 'textarea',
          placeholder: 'Notas adicionales sobre la producción',
          validation: {},
          cols: {
            sm: 6,
            md: 6,
            lg: 6,
            xl: 6,
          },
        },
      ],
    },
    editForm: {
      title: 'Editar Producción',
      endpoint: 'productions',
      method: 'PUT',
      successMessage: 'Producción actualizada con éxito',
      errorMessage: 'Error al actualizar la producción',
    },
  },
};

export default productionConfig;
