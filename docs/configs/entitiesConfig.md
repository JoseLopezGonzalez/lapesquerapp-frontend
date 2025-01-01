# Documentación para Configuración de Instancias

Este documento detalla cómo configurar instancias para gestionar entidades en la aplicación. Las configuraciones definen cómo se visualizan y manejan las entidades en la interfaz y los puntos de interacción con la API.

---

## Estructura General de Configuración
Cada configuración sigue esta estructura base:

```javascript
{
  'instance-key': {
    title: "Título de la entidad",
    description: "Descripción breve de la funcionalidad",
    emptyState: {
      title: "Mensaje cuando no hay datos",
      description: "Sugerencia o acción recomendada",
    },
    endpoint: "URL para obtener los datos",
    viewRoute: "Ruta para ver detalles, usa :id para reemplazo dinámico",
    deleteEndpoint: "Endpoint para eliminar datos",
    createPath: "Ruta para crear nuevas entidades",
    filtersGroup: {
      search: {
        label: "Etiqueta del filtro de búsqueda",
        filters: [/* Definición de filtros de búsqueda */],
      },
      groups: [/* Definición de grupos de filtros */],
    },
    table: {
      headers: [/* Definición de columnas de la tabla */],
    },
  },
}
```

---

## Opciones de Filtros

### Tipos de Filtros (`type`)

#### 1. **`search`**
Filtro de texto general para búsquedas rápidas.

**Opciones adicionales:**
- `placeholder`: Texto de ayuda en el campo.
- `name`: Nombre único del filtro.

**Ejemplo:**
```javascript
{
  name: "id",
  label: "Buscar por ID",
  type: "search",
  placeholder: "Escribe un ID para buscar",
}
```

---

#### 2. **`text`**
Campo de texto simple.

**Opciones adicionales:**
- `placeholder`: Texto de ayuda.
- `name`: Nombre único.

**Ejemplo:**
```javascript
{
  name: "notes",
  label: "Notas",
  type: "text",
  placeholder: "Escribe notas...",
}
```

---

#### 3. **`textarea`**
Campo de texto para múltiples líneas.

**Opciones adicionales:**
- `placeholder`: Texto de ayuda.
- `name`: Nombre único.

**Ejemplo:**
```javascript
{
  name: "comments",
  label: "Comentarios",
  type: "textarea",
  placeholder: "Agrega comentarios detallados...",
}
```

---

#### 4. **`textAccumulator`**
Permite acumular varias entradas de texto.

**Opciones adicionales:**
- `placeholder`: Texto de ayuda.
- `name`: Nombre único.

**Ejemplo:**
```javascript
{
  name: "ids",
  label: "IDs acumulados",
  type: "textAccumulator",
  placeholder: "Introduce IDs",
}
```

---

#### 5. **`number`**
Campo para valores numéricos.

**Opciones adicionales:**
- `placeholder`: Texto de ayuda.
- `name`: Nombre único.

**Ejemplo:**
```javascript
{
  name: "netWeight",
  label: "Peso Neto",
  type: "number",
  placeholder: "Introduce el peso en kg",
}
```

---

#### 6. **`date`**
Selector para una fecha específica.

**Opciones adicionales:**
- `placeholder`: Texto de ayuda.
- `name`: Nombre único.

**Ejemplo:**
```javascript
{
  name: "deliveryDate",
  label: "Fecha de entrega",
  type: "date",
  placeholder: "Selecciona una fecha",
}
```

---

#### 7. **`dateRange`**
Selector para un rango de fechas (inicio y fin).

**Opciones adicionales:**
- `name`: Nombre único.

**Ejemplo:**
```javascript
{
  name: "dateRange",
  label: "Rango de fechas",
  type: "dateRange",
}
```

---

#### 8. **`pairSelectBoxes`**
Filtro con opciones seleccionables en dos listas.

**Opciones adicionales:**
- `options`: Array de objetos con:
  - `name`: Identificador único.
  - `label`: Texto visible.
  - `value`: Valor inicial (booleano).

**Ejemplo:**
```javascript
{
  name: "status",
  label: "Estado",
  type: "pairSelectBoxes",
  options: [
    { name: "pending", label: "Pendiente", value: false },
    { name: "completed", label: "Completado", value: false },
  ],
}
```

---

#### 9. **`autocomplete`**
Selector con opciones dinámicas obtenidas de un endpoint.

**Opciones adicionales:**
- `endpoint`: URL para obtener opciones.
- `placeholder`: Texto de ayuda.
- `name`: Nombre único.

**Ejemplo:**
```javascript
{
  name: "supplier",
  label: "Proveedor",
  type: "autocomplete",
  placeholder: "Selecciona un proveedor",
  endpoint: "suppliers",
}
```

---

## Opciones de la Tabla

### Tipos de Columnas (`type`)

#### 1. **`text`**
Columna de texto simple, basada en un valor o ruta.

**Ejemplo:**
```javascript
{
  name: "id",
  label: "ID",
  type: "text",
  path: "id",
}
```

---

#### 2. **`badge`**
Columna que muestra indicadores visuales.

**Opciones adicionales:**
- `options`: Mapa de configuraciones para cada valor.
  - `label`: Texto del badge.
  - `color`: Color del badge.
  - `outline`: Si el badge solo tiene borde (booleano).

**Ejemplo:**
```javascript
{
  name: "status",
  label: "Estado",
  type: "badge",
  options: {
    pending: { label: "Pendiente", color: "warning", outline: true },
    completed: { label: "Completado", color: "success", outline: false },
  },
}
```

---

#### 3. **`date`**
Columna para mostrar fechas.

**Ejemplo:**
```javascript
{
  name: "createdAt",
  label: "Fecha de Creación",
  type: "date",
  path: "createdAt",
}
```

---

#### 4. **`button`**
Columna para acciones como botones.

**Ejemplo:**
```javascript
{
  name: "actions",
  label: "Acciones",
  type: "button",
}
```

---

## Ejemplo Completo de Configuración

```javascript
export const configs = {
  orders: {
    title: "Pedidos",
    description: "Gestiona y consulta pedidos.",
    emptyState: {
      title: "No hay pedidos",
      description: "Modifica los filtros o crea un nuevo pedido.",
    },
    endpoint: "orders",
    viewRoute: "/admin/orders/:id",
    deleteEndpoint: "/orders/:id",
    createPath: "/admin/orders/create",
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
      groups: [
        {
          name: "generals",
          label: "Generales",
          filters: [
            {
              name: "status",
              label: "Estado",
              type: "pairSelectBoxes",
              options: [
                { name: "pending", label: "Pendiente", value: false },
                { name: "completed", label: "Completado", value: false },
              ],
            },
          ],
        },
      ],
    },
    table: {
      headers: [
        { name: "id", label: "ID", type: "text", path: "id" },
        { name: "status", label: "Estado", type: "badge" },
        { name: "actions", label: "Acciones", type: "button" },
      ],
    },
  },
};
```

