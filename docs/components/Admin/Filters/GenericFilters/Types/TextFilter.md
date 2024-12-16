# TextFilter Component

## Descripción
`TextFilter` es un componente reutilizable de React diseñado para proporcionar un campo de entrada de texto, optimizado con `React.memo` para evitar renderizados innecesarios. Este componente es ideal para formularios o filtros dinámicos dentro de interfaces complejas.

---

## Props
| Propiedad     | Tipo       | Requerido | Descripción                                                                                  |
|---------------|------------|-----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`   | Sí        | Etiqueta que se mostrará encima del campo de texto.                                           |
| `name`        | `string`   | Sí        | Nombre único para identificar el campo de entrada.                                           |
| `value`       | `string`   | Sí        | Valor actual del campo de entrada.                                                           |
| `placeholder` | `string`   | No        | Texto que se mostrará como sugerencia en el campo cuando no haya un valor.                   |
| `onChange`    | `function` | Sí        | Función que se ejecutará al cambiar el valor del campo. Recibe el nuevo valor como argumento. |

---

## Optimización con `React.memo`
Este componente está envuelto en `React.memo`, lo que significa que:
- Solo se volverá a renderizar si alguna de sus props cambia.
- Es ideal para listas dinámicas de filtros o formularios donde el rendimiento es crucial.

---

## Uso
### Ejemplo de implementación:
```jsx
import React, { useState } from 'react';
import TextFilter from './TextFilter';

const Example = () => {
    const [filterValue, setFilterValue] = useState("");

    const handleFilterChange = (newValue) => {
        setFilterValue(newValue);
        console.log("Nuevo valor del filtro:", newValue);
    };

    return (
        <TextFilter
            label="Buscar"
            name="search"
            value={filterValue}
            placeholder="Escribe algo..."
            onChange={handleFilterChange}
        />
    );
};

export default Example;
