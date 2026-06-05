// src/configs/entities/entitiesConfig.suppliers.ts
// Módulo de configuración de entidades: supplier-liquidations

const suppliersConfig: Record<string, any> = {
  'supplier-liquidations': {
    title: 'Liquidaciones',
    description: 'Histórico de liquidaciones de proveedor cerradas.',
    emptyState: {
      title: 'No hay liquidaciones cerradas',
      description: 'Cierra una liquidación desde el apartado "Nueva liquidación".',
    },
    perPage: 15,
    endpoint: 'supplier-liquidations',
    viewRoute: '/admin/supplier-liquidations/show/:id',
    deleteEndpoint: 'supplier-liquidations/:id',
    createRedirect: '/admin/supplier-liquidations/nueva',
    sameTabNavigation: true,
    hideEditButton: true,
    hideViewButton: false,
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
          name: 'period',
          label: 'Período liquidado',
          filters: [
            {
              name: 'dates',
              label: 'Período liquidado',
              type: 'dateRange',
            },
          ],
        },
        {
          name: 'closed_at',
          label: 'Fecha de cierre',
          filters: [
            {
              name: 'closed_at',
              label: 'Fecha de cierre',
              type: 'dateRange',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'supplier', label: 'Proveedor', type: 'text', path: 'supplier.name' },
        { name: 'start_date', label: 'Inicio período', type: 'date', path: 'start_date' },
        { name: 'end_date', label: 'Fin período', type: 'date', path: 'end_date', hideOnMobile: true },
        { name: 'closed_at', label: 'Fecha cierre', type: 'dateHour', path: 'closed_at' },
        {
          name: 'closed_by',
          label: 'Cerrada por',
          type: 'text',
          path: 'closed_by.name',
          hideOnMobile: true,
        },
        {
          name: 'receptions_count',
          label: 'Recepciones',
          type: 'text',
          path: 'receptions_count',
          hideOnMobile: true,
        },
        {
          name: 'dispatches_count',
          label: 'Salidas cebo',
          type: 'text',
          path: 'dispatches_count',
          hideOnMobile: true,
        },
      ],
    },
  },
};

export default suppliersConfig;
