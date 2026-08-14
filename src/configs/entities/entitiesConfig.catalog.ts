// src/configs/entities/entitiesConfig.catalog.ts
// Módulo de configuración de entidades: products, product-categories, product-families, species, fishing-gears, capture-zones, countries, external-processors

const catalogConfig: Record<string, any> = {
  products: {
    title: 'Productos',
    description: 'Gestiona, edita y consulta productos.',
    emptyState: {
      title: 'No existen productos según los filtros',
      description: 'Ajusta los filtros o crea un nuevo producto.',
    },
    endpoint: 'products',
    viewRoute: '/admin/products/:id',
    deleteEndpoint: 'products/:id',
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
            /* NAme */
            {
              name: 'name',
              label: 'Nombre',
              type: 'text',
              placeholder: 'Buscar por nombre',
            },
            {
              name: 'ids',
              label: 'IDs',
              type: 'textAccumulator',
              placeholder: 'Buscar por ID',
            },
            /* articleGtin */
            {
              name: 'articleGtin',
              label: 'GTIN',
              type: 'text',
              placeholder: 'Buscar por GTIN',
            },
            /* boxGtin */
            {
              name: 'boxGtin',
              label: 'GTIN Caja',
              type: 'text',
              placeholder: 'Buscar por GTIN Caja',
            },
            /* palletGtin */
            {
              name: 'palletGtin',
              label: 'GTIN Palet',
              type: 'text',
              placeholder: 'Buscar por GTIN Palet',
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
        /* Capture Zones */
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

        /* Product Families */
        {
          name: 'productFamilies',
          label: 'Familias',
          filters: [
            {
              name: 'productFamilies',
              label: 'Familias',
              type: 'autocomplete',
              placeholder: 'Buscar por familia',
              endpoint: 'product-families/options',
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: 'id', label: 'ID', type: 'id', path: 'id' },
        { name: 'name', label: 'Nombre', type: 'text', path: 'name' },
        { name: 'family', label: 'Familia', type: 'text', path: 'family.name', hideOnMobile: true },
        {
          name: 'a3erp_code',
          label: 'Código A3ERP',
          type: 'text',
          path: 'a3erpCode',
          hideOnMobile: true,
        },
        {
          name: 'facil_com_code',
          label: 'Código Facilcom',
          type: 'text',
          path: 'facilcomCode',
          hideOnMobile: true,
        },
        {
          name: 'species',
          label: 'Especie',
          type: 'text',
          path: 'species.name',
          hideOnMobile: true,
        },
        {
          name: 'captureZone',
          label: 'Zona de captura',
          type: 'text',
          path: 'captureZone.name',
          hideOnMobile: true,
        },
        {
          name: 'articleGtin',
          label: 'GTIN',
          type: 'text',
          path: 'articleGtin',
          hideOnMobile: true,
        },
        { name: 'boxGtin', label: 'GTIN Caja', type: 'text', path: 'boxGtin', hideOnMobile: true },
        { name: 'hsCode', label: 'HS Code', type: 'text', path: 'hsCode', hideOnMobile: true },
        {
          name: 'palletGtin',
          label: 'GTIN Palet',
          type: 'text',
          path: 'palletGtin',
          hideOnMobile: true,
        },
      ],
    },
    createForm: {
      title: 'Nuevo Producto',
      endpoint: 'products',
      method: 'POST',
      successMessage: 'Producto creado con éxito',
      errorMessage: 'Error al crear el producto',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre del producto',
        type: 'text',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'speciesId',
        path: 'species.id',
        label: 'Especie',
        type: 'Autocomplete',
        placeholder: 'Selecciona la especie',
        endpoint: 'species/options',
        validation: {
          required: 'La especie es obligatoria',
        },
        cols: { sm: 3, md: 3, lg: 2, xl: 2 },
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
        cols: { sm: 6, md: 3, lg: 2, xl: 2 },
      },

      {
        name: 'familyId',
        path: 'family.id',
        label: 'Familia',
        type: 'Autocomplete',
        placeholder: 'Selecciona la familia',
        endpoint: 'product-families/options',
        validation: {
          required: 'La familia es obligatoria',
        },
        cols: { sm: 6, md: 6, lg: 2, xl: 2 },
      },
      {
        name: 'articleGtin',
        label: 'GTIN-13 del artículo',
        type: 'text',
        placeholder: '13 dígitos',
        validation: {
          pattern: {
            value: '/^[0-9]{8,14}$/',
            message: 'GTIN inválido. Debe contener entre 8 y 14 dígitos.',
          },
        },
        cols: { sm: 4, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'boxGtin',
        label: 'GTIN-14 de caja',
        type: 'text',
        placeholder: '14 dígitos',
        validation: {
          pattern: {
            value: '/^[0-9]{8,14}$/',
            message: 'GTIN de caja inválido. Debe contener entre 8 y 14 dígitos.',
          },
        },
        cols: { sm: 4, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'hsCode',
        label: 'Código arancelario (HS Code)',
        type: 'text',
        placeholder: 'ej. 0307520000',
        validation: {
          pattern: {
            value: '/^[0-9]{6,10}$/',
            message: 'Debe contener entre 6 y 10 dígitos',
          },
        },
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: 'a3erp_code',
        path: 'a3erpCode',
        label: 'Código A3ERP',
        type: 'text',
        placeholder: 'Código para exportaciones a "a3ERP - Software ERP"',
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
      {
        name: 'facil_com_code',
        path: 'facilcomCode',
        label: 'Código Facilcom',
        type: 'text',
        placeholder: 'Código para exportaciones a "Facilcom - Gestión comercial integral"',
        cols: { sm: 6, md: 6, lg: 3, xl: 3 },
      },
    ],
    editForm: {
      title: 'Editar Producto',
      endpoint: 'products',
      method: 'PUT',
      successMessage: 'Producto actualizado con éxito',
      errorMessage: 'Error al actualizar el producto',
    },
  },

  /* Stores */
  'product-categories': {
    title: 'Categorías de Productos',
    description: 'Gestiona, edita y consulta categorías de productos.',
    emptyState: {
      title: 'No existen categorías de productos según los filtros',
      description: 'Ajusta los filtros o crea una nueva categoría de producto.',
    },
    endpoint: 'product-categories',
    viewRoute: '/admin/product-categories/:id',
    deleteEndpoint: 'product-categories/:id',
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
              name: 'name',
              label: 'Nombre',
              type: 'text',
              placeholder: 'Buscar por nombre',
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
        { name: 'created_at', label: 'Fecha de creación', type: 'date', path: 'createdAt' },
        { name: 'updated_at', label: 'Fecha de actualización', type: 'date', path: 'updatedAt' },
      ],
    },
    createForm: {
      title: 'Nueva Categoría de Producto',
      endpoint: 'product-categories',
      method: 'POST',
      successMessage: 'Categoría de producto creada con éxito',
      errorMessage: 'Error al crear la categoría de producto',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre de la categoría',
        type: 'text',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Descripción opcional de la categoría',
        validation: {},
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
    editForm: {
      title: 'Editar Categoría de Producto',
      endpoint: 'product-categories',
      method: 'PUT',
      successMessage: 'Categoría de producto actualizada con éxito',
      errorMessage: 'Error al actualizar la categoría de producto',
    },
  },

  /* Product Families */
  'product-families': {
    title: 'Familias de Productos',
    description: 'Gestiona, edita y consulta familias de productos.',
    emptyState: {
      title: 'No existen familias de productos según los filtros',
      description: 'Ajusta los filtros o crea una nueva familia de producto.',
    },
    endpoint: 'product-families',
    viewRoute: '/admin/product-families/:id',
    deleteEndpoint: 'product-families/:id',
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
              name: 'name',
              label: 'Nombre',
              type: 'text',
              placeholder: 'Buscar por nombre',
            },
            {
              name: 'ids',
              label: 'IDs',
              type: 'textAccumulator',
              placeholder: 'Buscar por ID',
            },
          ],
        },
        {
          name: 'category',
          label: 'Categoría',
          filters: [
            {
              name: 'categoryId',
              label: 'Categoría',
              type: 'autocomplete',
              placeholder: 'Buscar por categoría',
              endpoint: 'product-categories/options',
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
        { name: 'category', label: 'Categoría', type: 'text', path: 'category.name' },
        { name: 'created_at', label: 'Fecha de creación', type: 'date', path: 'createdAt' },
        { name: 'updated_at', label: 'Fecha de actualización', type: 'date', path: 'updatedAt' },
      ],
    },
    createForm: {
      title: 'Nueva Familia de Producto',
      endpoint: 'product-families',
      method: 'POST',
      successMessage: 'Familia de producto creada con éxito',
      errorMessage: 'Error al crear la familia de producto',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre de la familia',
        type: 'text',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
        },
        cols: { sm: 6, md: 4, lg: 4, xl: 4 },
      },
      {
        name: 'categoryId',
        path: 'category.id',
        label: 'Categoría',
        type: 'Autocomplete',
        placeholder: 'Selecciona la categoría',
        endpoint: 'product-categories/options',
        validation: {
          required: 'La categoría es obligatoria',
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Descripción opcional de la familia',
        validation: {},
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
    editForm: {
      title: 'Editar Familia de Producto',
      endpoint: 'product-families',
      method: 'PUT',
      successMessage: 'Familia de producto actualizada con éxito',
      errorMessage: 'Error al actualizar la familia de producto',
    },
  },

  /* Productions */
  species: {
    title: 'Especies',
    description: 'Gestiona, edita y consulta especies.',
    emptyState: {
      title: 'No existen especies según los filtros',
      description: 'Ajusta los filtros o crea una nueva especie.',
    },
    endpoint: 'species',
    viewRoute: '/admin/species/:id',
    deleteEndpoint: 'species/:id',
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
            /* scientificName */
            {
              name: 'scientificName',
              label: 'Nombre científico',
              type: 'text',
              placeholder: 'Buscar por nombre científico',
            },
            /* fao */
            {
              name: 'fao',
              label: 'FAO',
              type: 'text',
              placeholder: 'Buscar por FAO',
            },
          ],
        },
        /* fishingGears */
        {
          name: 'fishingGears',
          label: 'Artes de pesca',
          filters: [
            {
              name: 'fishingGears',
              label: 'Artes de pesca',
              type: 'autocomplete',
              placeholder: 'Buscar por arte de pesca',
              endpoint: 'fishing-gears/options',
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
          name: 'scientificName',
          label: 'Nombre científico',
          type: 'text',
          path: 'scientificName',
        },
        /* fao */
        { name: 'fao', label: 'FAO', type: 'text', path: 'fao' },
        /* fishingGear */
        { name: 'fishingGear', label: 'Arte de pesca', type: 'text', path: 'fishingGear.name' },
      ],
    },
    createForm: {
      title: 'Nueva Especie',
      endpoint: 'species',
      method: 'POST',
      successMessage: 'Especie creada con éxito',
      errorMessage: 'Error al crear la especie',
    },
    editForm: {
      title: 'Editar Especie',
      endpoint: 'species', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Especie actualizada con éxito',
      errorMessage: 'Error al actualizar especie',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre común',
        type: 'text',
        placeholder: 'Ej. Pulpo',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: {
            value: 2,
            message: 'Debe tener al menos 2 caracteres',
          },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'scientificName',
        label: 'Nombre científico',
        type: 'text',
        placeholder: 'Ej. Octopus vulgaris',
        validation: {
          required: 'El nombre científico es obligatorio',
          minLength: {
            value: 2,
            message: 'Debe tener al menos 2 caracteres',
          },
        },
        cols: { sm: 6, md: 4, lg: 4, xl: 4 },
      },
      {
        name: 'fao',
        label: 'Código FAO',
        type: 'text',
        placeholder: 'Ej. OCT',
        validation: {
          required: 'El código FAO es obligatorio',
          pattern: {
            value: '/^[A-Z]{3,5}$/',
            message: 'Debe contener entre 3 y 5 letras mayúsculas',
          },
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'fishingGearId',
        path: 'fishingGear.id',
        label: 'Arte de pesca',
        type: 'Autocomplete',
        placeholder: 'Selecciona un arte de pesca',
        endpoint: 'fishing-gears/options',
        validation: {
          required: 'El arte de pesca es obligatorio',
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
  },

  /* incoterms */
  'fishing-gears': {
    title: 'Artes de pesca',
    description: 'Gestiona, edita y consulta artes de pesca.',
    emptyState: {
      title: 'No existen artes de pesca según los filtros',
      description: 'Ajusta los filtros o crea un nuevo arte de pesca.',
    },
    endpoint: 'fishing-gears',
    viewRoute: '/admin/fishing-gears/:id',
    deleteEndpoint: 'fishing-gears/:id',
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
      ],
    },
    createForm: {
      title: 'Nuevo Arte de Pesca',
      endpoint: 'fishing-gears',
      method: 'POST',
      successMessage: 'Arte de pesca creado con éxito',
      errorMessage: 'Error al crear el arte de pesca',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Ej. Nasas, Trasmallo, Arrastre...',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: {
            value: 2,
            message: 'Debe tener al menos 2 caracteres',
          },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
    editForm: {
      title: 'Editar Arte de Pesca',
      endpoint: 'fishing-gears', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Arte de pesca actualizado con éxito',
      errorMessage: 'Error al actualizar el arte de pesca',
    },
  },

  /* countries */
  'capture-zones': {
    title: 'Zonas de captura',
    description: 'Gestiona, edita y consulta zonas de captura.',
    emptyState: {
      title: 'No existen zonas de captura según los filtros',
      description: 'Ajusta los filtros o crea una nueva zona de captura.',
    },
    endpoint: 'capture-zones',
    viewRoute: '/admin/capture-zones/:id',
    deleteEndpoint: 'capture-zones/:id',
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
      ],
    },
    createForm: {
      title: 'Nueva Zona de Captura',
      endpoint: 'capture-zones',
      method: 'POST',
      successMessage: 'Zona de captura creada con éxito',
      errorMessage: 'Error al crear la zona de captura',
    },
    editForm: {
      title: 'Editar Zona de Captura',
      endpoint: 'capture-zones', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'Zona de captura actualizada con éxito',
      errorMessage: 'Error al actualizar la zona de captura',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre de la zona',
        type: 'text',
        placeholder: 'Ej. Atlántico Noroeste',
        validation: {
          required: 'El nombre es obligatorio',
          minLength: {
            value: 3,
            message: 'Debe tener al menos 3 caracteres',
          },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
  },
  /* species */
  countries: {
    title: 'Países',
    description: 'Gestiona, edita y consulta países.',
    emptyState: {
      title: 'No existen países según los filtros',
      description: 'Ajusta los filtros o crea un nuevo país.',
    },
    endpoint: 'countries',
    viewRoute: '/admin/countries/:id',
    deleteEndpoint: 'countries/:id',
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
        /* action */
      ],
    },
    createForm: {
      title: 'Crear país',
      endpoint: 'countries',
      method: 'POST',
      successMessage: 'País creado con éxito',
      errorMessage: 'Error al crear el país',
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Introduce el nombre del país',
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
      title: 'Editar país',
      endpoint: 'countries', // sin /:id, lo añadiremos dinámicamente
      method: 'PUT',
      successMessage: 'País actualizado con éxito',
      errorMessage: 'Error al actualizar el país',
    },
  },

  /* external processors */
  'external-processors': {
    title: 'Transformadores externos',
    description: 'Gestiona empresas externas que transforman producto del tenant.',
    emptyState: {
      title: 'No hay transformadores externos todavía',
      description: 'Crea un transformador externo o ajusta los filtros aplicados.',
    },
    endpoint: 'external-processors',
    viewRoute: '/admin/external-processors/:id',
    deleteEndpoint: 'external-processors/:id',
    perPage: 12,
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'search',
            placeholder: 'Buscar por nombre o razón social',
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
              name: 'vatNumber',
              label: 'CIF/NIF/VAT',
              type: 'text',
              placeholder: 'Buscar por CIF/NIF/VAT',
            },
            {
              name: 'sanitaryRegistrationNumber',
              label: 'Registro sanitario',
              type: 'text',
              placeholder: 'Buscar por registro sanitario',
            },
            {
              name: 'isActive',
              label: 'Estado',
              type: 'select',
              options: [
                { value: '1', label: 'Activo' },
                { value: '0', label: 'Inactivo' },
              ],
            },
            {
              name: 'countryId',
              label: 'País',
              type: 'autocomplete',
              placeholder: 'Buscar por país',
              endpoint: 'countries/options',
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
          name: 'legalName',
          label: 'Razón social',
          type: 'text',
          path: 'legalName',
          hideOnMobile: true,
        },
        { name: 'vatNumber', label: 'CIF/NIF/VAT', type: 'text', path: 'vatNumber' },
        {
          name: 'sanitaryRegistrationNumber',
          label: 'Registro sanitario',
          type: 'text',
          path: 'sanitaryRegistrationNumber',
          hideOnMobile: true,
        },
        { name: 'contactPerson', label: 'Contacto', type: 'text', path: 'contactPerson' },
        { name: 'phone', label: 'Teléfono', type: 'text', path: 'phone', hideOnMobile: true },
        { name: 'email', label: 'Email', type: 'text', path: 'emails.0', hideOnMobile: true },
        { name: 'city', label: 'Ciudad', type: 'text', path: 'city', hideOnMobile: true },
        {
          name: 'province',
          label: 'Provincia',
          type: 'text',
          path: 'province',
          hideOnMobile: true,
        },
        { name: 'country', label: 'País', type: 'text', path: 'country.name', hideOnMobile: true },
        {
          name: 'isActive',
          label: 'Estado',
          type: 'badge',
          path: 'isActive',
          options: {
            true: { label: 'Activo', color: 'success', outline: true },
            false: { label: 'Inactivo', color: 'secondary', outline: true },
          },
        },
      ],
    },
    rowActions: [
      {
        key: 'activate',
        label: 'Activar',
        shortLabel: 'A',
        serviceMethod: 'activate',
        successMessage: 'Transformador externo activado.',
        confirmation: '¿Activar a {{name}}?',
        hiddenWhen: { path: 'isActive', value: true },
      },
      {
        key: 'deactivate',
        label: 'Desactivar',
        shortLabel: 'D',
        serviceMethod: 'deactivate',
        successMessage: 'Transformador externo desactivado.',
        confirmation: '¿Desactivar a {{name}}?',
        hiddenWhen: { path: 'isActive', value: false },
      },
    ],
    createForm: {
      title: 'Nuevo transformador externo',
      endpoint: 'external-processors',
      method: 'POST',
      successMessage: 'Transformador externo creado con éxito',
      errorMessage: 'Error al crear el transformador externo',
    },
    editForm: {
      title: 'Editar transformador externo',
      endpoint: 'external-processors',
      method: 'PUT',
      successMessage: 'Transformador externo actualizado con éxito',
      errorMessage: 'Error al actualizar el transformador externo',
    },
    beforeSubmit: {
      booleanFields: ['isActive'],
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Nombre comercial',
        validation: {
          required: 'El nombre es obligatorio',
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'legalName',
        label: 'Razón social',
        type: 'text',
        placeholder: 'Razón social completa',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'vatNumber',
        label: 'CIF/NIF/VAT',
        type: 'text',
        placeholder: 'B12345678',
        validation: {
          required: 'El CIF/NIF/VAT es obligatorio',
          maxLength: { value: 32, message: 'Máximo 32 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'sanitaryRegistrationNumber',
        label: 'Registro sanitario',
        type: 'text',
        placeholder: '12.34567/PO',
        validation: {
          maxLength: { value: 64, message: 'Máximo 64 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'isActive',
        label: 'Estado',
        type: 'select',
        placeholder: 'Estado',
        defaultValue: '1',
        options: [
          { value: '1', label: 'Activo' },
          { value: '0', label: 'Inactivo' },
        ],
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'contactPerson',
        label: 'Persona de contacto',
        type: 'text',
        placeholder: 'Nombre de contacto',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'phone',
        label: 'Teléfono',
        type: 'text',
        placeholder: '+34 986 000 000',
        validation: {
          maxLength: { value: 50, message: 'Máximo 50 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'emails',
        label: 'Emails principales',
        type: 'emailList',
        placeholder: 'Introduce un correo electrónico y pulsa Enter',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'ccEmails',
        label: 'Emails en copia',
        type: 'emailList',
        placeholder: 'Introduce un correo electrónico y pulsa Enter',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'address',
        label: 'Dirección',
        type: 'textarea',
        placeholder: 'Dirección completa',
        rows: 2,
        validation: {
          maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'city',
        label: 'Ciudad',
        type: 'text',
        placeholder: 'Ciudad',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'postalCode',
        label: 'Código postal',
        type: 'text',
        placeholder: '36201',
        validation: {
          maxLength: { value: 20, message: 'Máximo 20 caracteres' },
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'province',
        label: 'Provincia',
        type: 'text',
        placeholder: 'Provincia',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'countryId',
        path: 'country.id',
        label: 'País',
        type: 'Autocomplete',
        endpoint: 'countries/options',
        placeholder: 'Selecciona un país',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'notes',
        label: 'Notas internas',
        type: 'textarea',
        placeholder: 'Notas visibles solo para gestión interna',
        rows: 4,
        validation: {
          maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
  },

  /* toll clients (clientes de maquila) */
  'toll-clients': {
    title: 'Clientes de maquila',
    description: 'Gestiona los clientes de maquila y la marca de su portal (logo/banner de login).',
    emptyState: {
      title: 'No hay clientes de maquila todavía',
      description: 'Crea un cliente de maquila o ajusta los filtros aplicados.',
    },
    endpoint: 'toll-clients',
    viewRoute: '/admin/toll-clients/:id/branding',
    deleteEndpoint: 'toll-clients/:id',
    perPage: 12,
    filtersGroup: {
      search: {
        label: 'Buscar',
        filters: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'search',
            placeholder: 'Buscar por nombre o razón social',
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
              name: 'vatNumber',
              label: 'CIF/NIF/VAT',
              type: 'text',
              placeholder: 'Buscar por CIF/NIF/VAT',
            },
            {
              name: 'sanitaryRegistrationNumber',
              label: 'Registro sanitario',
              type: 'text',
              placeholder: 'Buscar por registro sanitario',
            },
            {
              name: 'isActive',
              label: 'Estado',
              type: 'select',
              options: [
                { value: '1', label: 'Activo' },
                { value: '0', label: 'Inactivo' },
              ],
            },
            {
              name: 'countryId',
              label: 'País',
              type: 'autocomplete',
              placeholder: 'Buscar por país',
              endpoint: 'countries/options',
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
          name: 'slug',
          label: 'Slug (URL portal)',
          type: 'text',
          path: 'slug',
          hideOnMobile: true,
        },
        { name: 'vatNumber', label: 'CIF/NIF/VAT', type: 'text', path: 'vatNumber' },
        { name: 'contactPerson', label: 'Contacto', type: 'text', path: 'contactPerson' },
        { name: 'phone', label: 'Teléfono', type: 'text', path: 'phone', hideOnMobile: true },
        { name: 'email', label: 'Email', type: 'text', path: 'emails.0', hideOnMobile: true },
        { name: 'country', label: 'País', type: 'text', path: 'country.name', hideOnMobile: true },
        {
          name: 'isActive',
          label: 'Estado',
          type: 'badge',
          path: 'isActive',
          options: {
            true: { label: 'Activo', color: 'success', outline: true },
            false: { label: 'Inactivo', color: 'secondary', outline: true },
          },
        },
      ],
    },
    rowActions: [
      {
        key: 'activate',
        label: 'Activar',
        shortLabel: 'A',
        serviceMethod: 'activate',
        successMessage: 'Cliente de maquila activado.',
        confirmation: '¿Activar a {{name}}?',
        hiddenWhen: { path: 'isActive', value: true },
      },
      {
        key: 'deactivate',
        label: 'Desactivar',
        shortLabel: 'D',
        serviceMethod: 'deactivate',
        successMessage: 'Cliente de maquila desactivado.',
        confirmation: '¿Desactivar a {{name}}?',
        hiddenWhen: { path: 'isActive', value: false },
      },
    ],
    createForm: {
      title: 'Nuevo cliente de maquila',
      endpoint: 'toll-clients',
      method: 'POST',
      successMessage: 'Cliente de maquila creado con éxito',
      errorMessage: 'Error al crear el cliente de maquila',
    },
    editForm: {
      title: 'Editar cliente de maquila',
      endpoint: 'toll-clients',
      method: 'PUT',
      successMessage: 'Cliente de maquila actualizado con éxito',
      errorMessage: 'Error al actualizar el cliente de maquila',
    },
    beforeSubmit: {
      booleanFields: ['isActive'],
    },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Nombre comercial',
        validation: {
          required: 'El nombre es obligatorio',
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'legalName',
        label: 'Razón social',
        type: 'text',
        placeholder: 'Razón social completa',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'vatNumber',
        label: 'CIF/NIF/VAT',
        type: 'text',
        placeholder: 'B12345678',
        validation: {
          required: 'El CIF/NIF/VAT es obligatorio',
          maxLength: { value: 32, message: 'Máximo 32 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'isActive',
        label: 'Estado',
        type: 'select',
        placeholder: 'Estado',
        defaultValue: '1',
        options: [
          { value: '1', label: 'Activo' },
          { value: '0', label: 'Inactivo' },
        ],
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'contactPerson',
        label: 'Persona de contacto',
        type: 'text',
        placeholder: 'Nombre de contacto',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'phone',
        label: 'Teléfono',
        type: 'text',
        placeholder: '+34 986 000 000',
        validation: {
          maxLength: { value: 50, message: 'Máximo 50 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'sanitaryRegistrationNumber',
        label: 'Registro sanitario',
        type: 'text',
        placeholder: '12.34567/PO',
        validation: {
          maxLength: { value: 64, message: 'Máximo 64 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'a3erpCode',
        label: 'Código A3ERP',
        type: 'text',
        placeholder: 'Código de exportación contable A3ERP',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'facilcomCode',
        label: 'Código Facilcom',
        type: 'text',
        placeholder: 'Código de exportación contable Facilcom',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'emails',
        label: 'Emails principales',
        type: 'emailList',
        placeholder: 'Introduce un correo electrónico y pulsa Enter',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'ccEmails',
        label: 'Emails en copia',
        type: 'emailList',
        placeholder: 'Introduce un correo electrónico y pulsa Enter',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'address',
        label: 'Dirección',
        type: 'textarea',
        placeholder: 'Dirección completa',
        rows: 2,
        validation: {
          maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
      {
        name: 'city',
        label: 'Ciudad',
        type: 'text',
        placeholder: 'Ciudad',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'postalCode',
        label: 'Código postal',
        type: 'text',
        placeholder: '36201',
        validation: {
          maxLength: { value: 20, message: 'Máximo 20 caracteres' },
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'province',
        label: 'Provincia',
        type: 'text',
        placeholder: 'Provincia',
        validation: {
          maxLength: { value: 255, message: 'Máximo 255 caracteres' },
        },
        cols: { sm: 6, md: 2, lg: 2, xl: 2 },
      },
      {
        name: 'countryId',
        path: 'country.id',
        label: 'País',
        type: 'Autocomplete',
        endpoint: 'countries/options',
        placeholder: 'Selecciona un país',
        cols: { sm: 6, md: 3, lg: 3, xl: 3 },
      },
      {
        name: 'notes',
        label: 'Notas internas',
        type: 'textarea',
        placeholder: 'Notas visibles solo para gestión interna',
        rows: 4,
        validation: {
          maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
        },
        cols: { sm: 6, md: 6, lg: 6, xl: 6 },
      },
    ],
  },

  /* paymentTerms */
};

export default catalogConfig;
