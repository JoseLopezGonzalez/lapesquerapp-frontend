// src/configs/entities/entitiesConfig.field.ts
// Módulo de configuración de entidades: cebo-dispatches

const fieldConfig: Record<string, any> = {
  'cebo-dispatches': {
    hideEditButton: false,
    hideCreateButton: false,
    hideViewButton: true,
    createRedirect: '/admin/cebo-dispatches/create',
    editRedirect: '/admin/cebo-dispatches/:id/edit',
    title: 'Salidas de cebo',
    description: 'Gestiona, edita y consulta salidas de cebo.',
    emptyState: {
      title: 'No existen salidas de cebo según los filtros',
      description: 'Ajusta los filtros o crea una nueva salida de cebo.',
    },
    perPage: 17,
    endpoint: 'cebo-dispatches',
    viewRoute: '/admin/cebo-dispatches/:id',
    deleteEndpoint: 'cebo-dispatches/:id',
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
            /* notes */
            {
              name: 'notes',
              label: 'Notas',
              type: 'textarea',
              placeholder: 'Buscar por notas',
            },
            /* dates */
            {
              name: 'dates',
              label: 'Fecha',
              type: 'dateRange',
              visibleMonths: 1,
            },
          ],
        },
        /* suppliers */
        {
          name: 'suppliers',
          label: 'Proveedores',
          filters: [
            {
              name: 'suppliers',
              label: 'Proveedores',
              type: 'autocomplete',
              placeholder: 'Buscar por proveedor',
              endpoint: 'suppliers/options',
            },
          ],
        },
        /* products */
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
        /* species */
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
        /* date */
        { name: 'date', label: 'Fecha', type: 'date', path: 'date' },
        /* supplier */
        { name: 'supplier', label: 'Proveedor', type: 'text', path: 'supplier.name' },
        /* notes */
        { name: 'notes', label: 'Notas', type: 'text', path: 'notes' },
        /* netWeight */
        { name: 'netWeight', label: 'Peso neto', type: 'weight', path: 'netWeight' },
        /* liquidationStatus */
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
      /* cebo-dispatches/facilcom-xlsx */
      {
        title: 'Exportar a Facilcom',
        endpoint: 'cebo-dispatches/facilcom-xlsx',
        type: 'xlsx',
        waitingMessage: 'Generando exportación a Facilcom',
        fileName: 'Salidas_cebo_Facilcom',
      },
      /* cebo-dispatches/a3erp-xlsx */
      {
        title: 'Exportar a A3ERP',
        endpoint: 'cebo-dispatches/a3erp-xlsx',
        type: 'excel',
        waitingMessage: 'Generando exportación a A3ERP',
        fileName: 'Salidas_cebo_A3ERP',
      },
      /* cebo-dispatches/a3erp2-xlsx */
      {
        title: 'Exportar a A3ERP2',
        endpoint: 'cebo-dispatches/a3erp2-xlsx',
        type: 'excel',
        waitingMessage: 'Generando exportación a A3ERP2',
        fileName: 'Salidas_cebo_A3ERP2',
      },
    ],
  },

  /* Sessions */
};

export default fieldConfig;
