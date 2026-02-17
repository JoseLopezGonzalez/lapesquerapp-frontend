# Ejemplos de Configuración de Entidades

Este documento muestra ejemplos prácticos de cómo configurar entidades con la nueva funcionalidad de columna de acciones automática.

## Configuración Básica

```javascript
export const configs = {
  products: {
    title: "Productos",
    description: "Gestiona el catálogo de productos",
    endpoint: "products",
    viewRoute: "/admin/products/:id",
    deleteEndpoint: "/products/:id",
    createPath: "/admin/products/create",
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "price", label: "Precio", type: "currency", path: "price" },
        // La columna de acciones se genera automáticamente
      ],
    },
  },
};
```

## Ocultar Botón de Crear

```javascript
export const configs = {
  logs: {
    title: "Registros del Sistema",
    description: "Solo lectura - no se pueden crear nuevos registros",
    hideCreateButton: true, // Oculta el botón de crear
    endpoint: "system-logs",
    viewRoute: "/admin/logs/:id",
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "message", label: "Mensaje", type: "text", path: "message" },
        { name: "timestamp", label: "Fecha", type: "date", path: "timestamp" },
      ],
    },
  },
};
```

## Ocultar Solo el Botón de Ver

```javascript
export const configs = {
  settings: {
    title: "Configuraciones",
    description: "Solo se pueden editar, no ver detalles",
    hideViewButton: true, // Solo oculta el botón de ver
    endpoint: "settings",
    deleteEndpoint: "/settings/:id",
    createPath: "/admin/settings/create",
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "name", label: "Nombre", type: "text", path: "name" },
        { name: "value", label: "Valor", type: "text", path: "value" },
      ],
    },
  },
};
```

## Ocultar Solo el Botón de Editar

```javascript
export const configs = {
  reports: {
    title: "Reportes",
    description: "Solo se pueden ver, no editar",
    hideEditButton: true, // Solo oculta el botón de editar
    endpoint: "reports",
    viewRoute: "/admin/reports/:id",
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "title", label: "Título", type: "text", path: "title" },
        { name: "generatedAt", label: "Generado", type: "date", path: "generatedAt" },
      ],
    },
  },
};
```

## Ocultar Toda la Columna de Acciones

```javascript
export const configs = {
  dashboard: {
    title: "Dashboard",
    description: "Vista de solo lectura sin acciones",
    hideActions: true, // Oculta toda la columna de acciones
    endpoint: "dashboard-data",
    table: {
      headers: [
        { name: "metric", label: "Métrica", type: "text", path: "metric" },
        { name: "value", label: "Valor", type: "number", path: "value" },
        { name: "trend", label: "Tendencia", type: "badge", path: "trend" },
      ],
    },
  },
};
```

## Configuración Completa con Todas las Opciones

```javascript
export const configs = {
  orders: {
    title: "Pedidos",
    description: "Gestión completa de pedidos",
  
    // Control de botones
    hideCreateButton: false, // Mostrar botón de crear
    hideActions: false, // Mostrar columna de acciones
    hideViewButton: false, // Mostrar botón de ver
    hideEditButton: false, // Mostrar botón de editar
  
    // Endpoints
    endpoint: "orders",
    viewRoute: "/admin/orders/:id",
    deleteEndpoint: "/orders/:id",
    createPath: "/admin/orders/create",
  
    // Filtros
    filtersGroup: {
      search: {
        label: "Buscar",
        filters: [
          {
            name: "id",
            label: "Buscar por ID",
            type: "search",
            placeholder: "Escribe un ID",
          },
        ],
      },
    },
  
    // Tabla
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "customer", label: "Cliente", type: "text", path: "customer.name" },
        { name: "status", label: "Estado", type: "badge", path: "status" },
        { name: "total", label: "Total", type: "currency", path: "total" },
        // La columna de acciones se genera automáticamente
      ],
    },
  
    // Formularios
    createForm: {
      title: "Nuevo Pedido",
      endpoint: "orders",
      method: "POST",
      successMessage: "Pedido creado con éxito",
      errorMessage: "Error al crear el pedido",
    },
  
    editForm: {
      title: "Editar Pedido",
      endpoint: "orders",
      method: "PUT",
      successMessage: "Pedido actualizado con éxito",
      errorMessage: "Error al actualizar el pedido",
    },
  },
};
```

## Migración desde Configuración Anterior

### Antes (Configuración Manual)

```javascript
table: {
  headers: [
    { name: "id", label: "ID", type: "text", path: "id" },
    { name: "name", label: "Nombre", type: "text", path: "name" },
    { name: "actions", label: "Acciones", type: "button" }, // ❌ Ya no necesario
  ],
},
```

### Después (Configuración Automática)

```javascript
table: {
  headers: [
    { name: "id", label: "ID", type: "text", path: "id" },
    { name: "name", label: "Nombre", type: "text", path: "name" },
    // ✅ La columna de acciones se genera automáticamente
  ],
},
```

## Beneficios de la Nueva Funcionalidad

1. **Menos código repetitivo**: No necesitas definir la columna de acciones en cada configuración
2. **Consistencia**: Todas las tablas tienen el mismo comportamiento de acciones
3. **Flexibilidad**: Puedes controlar la visibilidad de cada botón individualmente
4. **Mantenimiento**: Los cambios en la funcionalidad de acciones se aplican automáticamente
5. **Configuración opcional**: Solo necesitas configurar cuando quieres cambiar el comportamiento por defecto
