// src/configs/entities/entitiesConfig.stock.ts
// Módulo de configuración de entidades: stores, boxes, pallets

const stockConfig: Record<string, any> = {
  stores: {
    title: 'Almacenes',
    description: 'Gestiona, edita y consulta almacenes.',
    hideViewButton: true,
    emptyState: {
      title: 'No existen almacenes según los filtros',
      description: 'Ajusta los filtros o crea un nuevo almacén.',
    },
    endpoint: 'stores',
    viewRoute: '/admin/stores/:id',
    deleteEndpoint: 'stores/:id',
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
            {
              name: 'store_type',
              label: 'Tipo',
              type: 'text',
              placeholder: 'interno o externo',
            },
            {
              name: 'external_user_id',
              label: 'Usuario externo',
              type: 'autocomplete',
              placeholder: 'Filtrar por usuario externo',
              endpoint: 'external-users/options',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
        { name: 'storeType', label: 'Tipo', type: 'text', path: 'storeType' },
        { name: 'externalUser', label: 'Usuario externo', type: 'text', path: 'externalUser.name' },
        /* temperatur */
        { name: 'temperature', label: 'Temperatura', type: 'text', path: 'temperature' },
        /* totalNetWeight */
        { name: 'totalNetWeight', label: 'Peso total', type: 'weight', path: 'totalNetWeight' },
        /* Capacity */
        { name: 'capacity', label: 'Capacidad', type: 'weight', path: 'capacity' },
      ],
    },
    createForm: {
      title: 'Crear almacén',
      endpoint: 'stores',
      method: 'POST',
      successMessage: 'Almacén creado con éxito',
      errorMessage: 'Error al crear el almacén',
    },
    editForm: {
      title: 'Editar Almacén',
      endpoint: 'stores', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Almacén actualizado con éxito',
      errorMessage: 'Error al actualizar el almacén',
    },
    // beforeSubmit para stores se aplica en cliente (entityFormTransforms.js) para que la config sea serializable
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Introduce el nombre del almacén',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: {
            value: 3,
            message: 'Debe tener al menos 3 caracteres',
          },
          maxLength: {
            value: 255,
            message: 'No puede exceder los 255 caracteres',
          },
        },
        cols: {
          sm: 3,
          md: 3,
          lg: 3,
          xl: 6,
        },
      },
      {
        name: 'temperature',
        label: 'Temperatura',
        type: 'number',
        placeholder: 'Ej. -18',
        validation: {
          required: 'La temperatura es obligatoria',
          valueAsNumber: true,
          min: {
            value: -99.99,
            message: 'La temperatura debe ser mayor o igual a -99.99',
          },
          max: {
            value: 99.99,
            message: 'La temperatura debe ser menor o igual a 99.99',
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
        name: 'capacity',
        label: 'Capacidad (kg)',
        type: 'number',
        placeholder: 'Capacidad máxima en kg',
        validation: {
          required: 'La capacidad es obligatoria',
          valueAsNumber: true,
          min: {
            value: 0,
            message: 'Debe ser un valor mayor o igual a 0',
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
        name: 'storeType',
        label: 'Tipo de almacén',
        type: 'select',
        placeholder: 'Selecciona el tipo',
        options: [
          { value: 'interno', label: 'Interno' },
          { value: 'externo', label: 'Externo' },
        ],
        validation: {
          required: 'El tipo de almacén es obligatorio',
        },
        cols: {
          sm: 3,
          md: 3,
          lg: 3,
          xl: 3,
        },
      },
      {
        name: 'external_user_id',
        path: 'externalUser.id',
        label: 'Usuario externo',
        type: 'Autocomplete',
        placeholder: 'Selecciona un usuario externo',
        endpoint: 'external-users/options',
        validation: {},
        displayWhen: { field: 'storeType', eq: 'externo' },
        cols: {
          sm: 3,
          md: 3,
          lg: 3,
          xl: 3,
        },
      },
    ],
  },
  /* boxes */
  boxes: {
    hideCreateButton: true,
    hideEditButton: true,
    hideViewButton: true,
    title: 'Cajas',
    description: 'Gestiona, edita y consulta cajas.',
    emptyState: {
      title: 'No existen cajas según los filtros',
      description: 'Ajusta los filtros o crea una nueva caja.',
    },
    perPage: 17,
    endpoint: 'boxes',
    viewRoute: '/admin/boxes/:id',
    deleteEndpoint: 'boxes/:id',
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
              placeholder: 'Introduce un ID',
            },
            {
              name: 'lots',
              label: 'Lotes',
              type: 'textAccumulator',
              placeholder: 'Introduce un lote',
            },
            /* gs1128 */
            {
              name: 'gs1128',
              label: 'GS1128',
              type: 'textAccumulator',
              placeholder: 'Introduce un GS1128',
            },

            /* createdAt */
            {
              name: 'createdAt',
              label: 'Fecha de lectura',
              type: 'dateRange',
              visibleMonths: 1,
            },
          ],
        },
        {
          name: 'products',
          label: 'Productos',
          filters: [
            {
              name: 'products',
              label: 'Productos',
              type: 'autocomplete',
              placeholder: 'Selecciona un producto',
              endpoint: 'products/options',
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
              placeholder: 'Selecciona una especie',
              endpoint: 'species/options',
            },
          ],
        },
        /* ordersGroup - orderIds - orderDates - orderBuyerReference- orderState */
        {
          name: 'ordersGroup',
          label: 'Pedidos',
          filters: [
            /* orderIds - options */
            {
              name: 'orderIds',
              label: 'IDs de pedidos',
              type: 'autocomplete',
              placeholder: 'Buscar por IDs de pedidos',
              endpoint: 'orders/options',
            },
            /* orderDates */
            {
              name: 'orderDates',
              label: 'Fechas de pedidos',
              type: 'dateRange',
              visibleMonths: 1,
            },
            /* orderBuyerReference */
            {
              name: 'orderBuyerReference',
              label: 'Referencia de cliente',
              type: 'text',
              placeholder: 'Buscar por referencia de compra',
            },
            /* orderState */
            {
              name: 'orderState',
              label: 'Estado del Pedido',
              type: 'pairSelectBoxes',
              options: [
                { name: 'pending', label: 'Pendiente', value: false },
                { name: 'finished', label: 'Finalizado', value: false },
              ],
            },
          ],
        },

        /* Pallets */
        {
          name: 'pallets',
          label: 'Palets',
          filters: [
            {
              name: 'pallets',
              label: 'Palets',
              type: 'textAccumulator',
              placeholder: 'Introduce un número de palet',
            },
            {
              name: 'palletState',
              label: 'Estado del Palet',
              type: 'pairSelectBoxes',
              options: [
                { name: 'registered', label: 'Registrado', value: false },
                { name: 'stored', label: 'Almacenado', value: false },
                { name: 'shipped', label: 'Enviado', value: false },
                { name: 'processed', label: 'Procesado', value: false },
              ],
            },
            {
              name: 'orderState',
              label: 'Estado del Pedido',
              type: 'pairSelectBoxes',
              options: [
                { name: 'pending', label: 'Pendiente', value: false },
                { name: 'finished', label: 'Finalizado', value: false },
              ],
            },
            {
              name: 'position',
              label: 'Posición',
              type: 'pairSelectBoxes',
              options: [
                { name: 'located', label: 'Ubicado', value: false },
                { name: 'unlocated', label: 'Sin Ubicar', value: false },
              ],
            },
            {
              name: 'stores',
              label: 'Almacenes',
              type: 'autocomplete',
              placeholder: 'Selecciona almacenes',
              endpoint: 'stores/options',
              multiple: true,
            },
            {
              name: 'orders',
              label: 'Pedidos',
              type: 'autocomplete',
              placeholder: 'Selecciona órdenes',
              endpoint: 'orders/options',
              multiple: true,
            },
            {
              name: 'notes',
              label: 'Observaciones del Palet',
              type: 'text',
              placeholder: 'Buscar en observaciones del palet',
            },
          ],
        },
        /* Stores */
        {
          name: 'stores',
          label: 'Almacenes',
          filters: [
            {
              name: 'stores',
              label: 'Almacenes',
              type: 'autocomplete',
              placeholder: 'Selecciona almacenes',
              endpoint: 'stores/options',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'product.name' },
        { name: 'lot', label: 'Lote', type: 'text', path: 'lot' },
        { name: 'gs1128', label: 'GS1128', type: 'text', path: 'gs1128' },
        { name: 'netWeight', label: 'Peso neto', type: 'weight', path: 'netWeight' },
        { name: 'palletId', label: 'Palet', type: 'text', path: 'palletId' },
      ],
    },
    exports: [
      {
        title: 'Exportar a excel',
        endpoint: 'boxes/xlsx',
        type: 'xlsx',
        waitingMessage: 'Generando exportación a excel',
        fileName: 'Cajas',
      },
    ],
  },
  /* Pallets */
  pallets: {
    hideEditButton: true,
    title: 'Palets',
    description: 'Gestiona, edita y consulta palets.',
    emptyState: {
      title: 'No existen palets según los filtros',
      description: 'Ajusta los filtros o crea un nuevo palet.',
    },
    endpoint: 'pallets',
    viewRoute: '/admin/pallets/:id',
    deleteEndpoint: 'pallets/:id',
    createRedirect: '/admin/pallets/create',
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
            /* state */
            {
              name: 'state',
              label: 'Estado',
              type: 'pairSelectBoxes',
              options: [
                { name: 'registered', label: 'Registrado', value: false },
                { name: 'stored', label: 'Almacenado', value: false },
                { name: 'shipped', label: 'Enviado', value: false },
                { name: 'processed', label: 'Procesado', value: false },
              ],
            },
            /* orderState */
            {
              name: 'orderState',
              label: 'Estado del pedido',
              type: 'pairSelectBoxes',
              options: [
                { name: 'pending', label: 'Pendiente', value: false },
                { name: 'finished', label: 'Finalizado', value: false },
              ],
            },
            /*  Position; locatd, unlocated*/
            {
              name: 'position',
              label: 'Posición',
              type: 'pairSelectBoxes',
              options: [
                { name: 'located', label: 'Ubicado', value: false },
                { name: 'unlocated', label: 'No ubicado', value: false },
              ],
            },
            /* Notes */
            {
              name: 'notes',
              label: 'Notas',
              type: 'textarea',
              placeholder: 'Buscar por notas',
            },
            /* lots */
            {
              name: 'lots',
              label: 'Lotes',
              type: 'textAccumulator',
              placeholder: 'Buscar por lotes',
            },
          ],
        },
        {
          name: 'dates',
          label: 'Fechas',
          filters: [
            {
              name: 'dates',
              label: 'Fecha de creación',
              type: 'dateRange',
              visibleMonths: 1,
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
        /* Species   */
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
        /* Stores */
        {
          name: 'stores',
          label: 'Almacenes',
          filters: [
            {
              name: 'stores',
              label: 'Almacenes',
              type: 'autocomplete',
              placeholder: 'Buscar por almacén',
              endpoint: 'stores/options',
            },
          ],
        },
        /* Order */
        {
          name: 'orders',
          label: 'Pedidos',
          filters: [
            {
              name: 'orders',
              label: 'Pedidos',
              type: 'textAccumulator',
              placeholder: 'Buscar por pedidos',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        /* productsNames */
        { name: 'productsNames', label: 'Artículos', type: 'list', path: 'productsNames' },
        /* lots */
        { name: 'lots', label: 'Lotes', type: 'list', path: 'lots' },
        /* observations */
        { name: 'observations', label: 'Observaciones', type: 'text', path: 'observations' },
        /* store */
        { name: 'store', label: 'Almacén', type: 'text', path: 'store.name' },
        /* orderId*/
        { name: 'orderId', label: 'Pedido', type: 'text', path: 'orderId' },
        /* { name: "name", label: "Nombre", type: "text", path: "article.name" }, */
        {
          name: 'state',
          label: 'Estado',
          type: 'badge',
          path: 'state.name',
          options: {
            registered: { label: 'Registrado', color: 'secondary', outline: true },
            stored: { label: 'Almacenado', color: 'warning', outline: true },
            shipped: { label: 'Enviado', color: 'success', outline: true },
            processed: { label: 'Procesado', color: 'primary', outline: true },
            default: { label: 'Desconocido', color: 'secondary', outline: true },
          },
        },
        /* numberOfBoxes */
        { name: 'numberOfBoxes', label: 'Cajas', type: 'text', path: 'numberOfBoxes' },
        /* netWeight */
        { name: 'netWeight', label: 'Peso neto', type: 'weight', path: 'netWeight' },
        /* availableBoxesCount */
        {
          name: 'availableBoxesCount',
          label: 'Cajas Disponibles',
          type: 'text',
          path: 'availableBoxesCount',
        },
        /* usedBoxesCount */
        {
          name: 'usedBoxesCount',
          label: 'Cajas en Producción',
          type: 'text',
          path: 'usedBoxesCount',
        },
        /* totalAvailableWeight */
        {
          name: 'totalAvailableWeight',
          label: 'Peso Disponible',
          type: 'weight',
          path: 'totalAvailableWeight',
        },
        /* totalUsedWeight */
        {
          name: 'totalUsedWeight',
          label: 'Peso en Producción',
          type: 'weight',
          path: 'totalUsedWeight',
        },
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
        body: { status: 1 }, // Estado "registered"
      },
      {
        title: 'Cambiar estado a Almacenado',
        endpoint: 'pallets/update-state',
        confirmation: '¿Deseas marcar estos pallets como almacenados?',
        successMessage: 'Palets actualizados correctamente.',
        errorMessage: 'Hubo un error al actualizar los palets.',
        method: 'POST',
        body: { status: 2 }, // Estado "stored"
      },
      {
        title: 'Cambiar estado a Enviado',
        endpoint: 'pallets/update-state',
        confirmation: '¿Deseas marcar estos pallets como enviados?',
        successMessage: 'Palets actualizados correctamente.',
        errorMessage: 'Hubo un error al actualizar los palets.',
        method: 'POST',
        body: { status: 3 }, // Estado "shipped"
      },
      {
        title: 'Cambiar estado a Procesado',
        endpoint: 'pallets/update-state',
        confirmation: '¿Deseas marcar estos pallets como procesados?',
        successMessage: 'Palets actualizados correctamente.',
        errorMessage: 'Hubo un error al actualizar los palets.',
        method: 'POST',
        body: { status: 4 }, // Estado "processed"
      },
    ],
  },
  /* customers */
};

export default stockConfig;
