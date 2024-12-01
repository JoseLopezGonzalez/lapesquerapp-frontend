src/
├── app/                         # Carpeta principal del App Router
│   ├── (admin)/                 # Namespace para rutas de administración
│   │   ├── raw-material-receptions/
│   │   │   ├── page.jsx         # Página principal de Recepciones
│   │   │   ├── create/          # Página para crear recepción
│   │   │   │   ├── page.jsx     # Página Create
│   │   │   ├── edit/[id]/       # Página para editar recepción
│   │   │   │   ├── page.jsx     # Página Edit (usando ID dinámico)
│   │   │   ├── layout.jsx       # Layout específico para Recepciones
│   │   └── layout.jsx           # Layout genérico de administración
│   ├── (public)/                # Namespace para rutas públicas (opcional)
│   └── layout.jsx               # Layout general del proyecto
├── components/                  # Componentes reutilizables
│   ├── tables/                  # Componentes genéricos de tablas
│   │   ├── GenericTable.jsx     # Componente genérico para tablas
│   │   └── Pagination.jsx       # Componente de paginación
│   ├── forms/                   # Componentes genéricos de formularios
│   │   ├── GenericForm.jsx      # Componente genérico para formularios
│   ├── modals/                  # Componentes para modales
│   │   ├── DeleteModal.jsx      # Modal para eliminar entidades
│   └── filters/                 # Componentes para filtros
│       ├── FilterModal.jsx      # Modal genérico para filtros
│       ├── FilterFields.jsx     # Filtros dinámicos (text, date, etc.)
├── configs/                     # Configuración por entidad
│   ├── rawMaterialReceptions.js # Configuración de Recepciones
│   └── otherEntity.js           # Configuración de otras entidades
├── hooks/                       # Hooks personalizados
│   ├── usePaginatedData.js      # Hook genérico para datos paginados
│   ├── useFilters.js            # Hook genérico para filtros
├── services/                    # Llamadas a APIs
│   ├── rawMaterialReceptions.js # Funciones para la API de recepciones
├── styles/                      # Estilos globales y específicos
│   ├── globals.css              # Estilos globales
│   └── components/              # Estilos específicos de componentes
└── utils/                       # Utilidades y helpers
    ├── formatters.js            # Formateadores de datos (fechas, pesos)
    └── validators.js            # Validadores reutilizables
