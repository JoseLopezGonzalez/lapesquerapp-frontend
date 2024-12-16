# TextAccumulatorFilter Component

## Descripción
`TextAccumulatorFilter` es un componente de React que permite al usuario añadir y eliminar valores acumulativos de una lista mediante un campo de texto. Cada valor añadido se muestra como una etiqueta, con la posibilidad de eliminarlo. El componente está optimizado con `React.memo` para evitar renderizados innecesarios.

---

## Props
| Propiedad     | Tipo            | Requerido | Descripción                                                                                  |
|---------------|-----------------|-----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`        | Sí        | Etiqueta que se mostrará encima del campo de texto.                                           |
| `name`        | `string`        | Sí        | Nombre único para identificar el campo de entrada.                                           |
| `value`       | `array`         | Sí        | Array de valores acumulados que se mostrarán como etiquetas.                                 |
| `placeholder` | `string`        | No        | Texto que se mostrará como sugerencia en el campo de entrada.                                |
| `onAdd`       | `function`      | Sí        | Función que se ejecuta al añadir un nuevo valor. Recibe el valor añadido como argumento.      |
| `onDelete`    | `function`      | Sí        | Función que se ejecuta al eliminar un valor. Recibe el valor eliminado como argumento.        |

---

## Optimización con `React.memo`
Este componente utiliza `React.memo` para:
- Evitar renderizados innecesarios cuando las props no cambian.
- Mejorar el rendimiento en formularios dinámicos o filtros con múltiples instancias.

---

## Uso
### Ejemplo de implementación:
```jsx
import React, { useState } from 'react';
import TextAccumulatorFilter from './TextAccumulatorFilter';

const Example = () => {
    const [items, setItems] = useState([]);

    const handleAdd = (newItem) => {
        setItems((prevItems) => [...prevItems, newItem]);
    };

    const handleDelete = (itemToDelete) => {
        setItems((prevItems) => prevItems.filter((item) => item !== itemToDelete));
    };

    return (
        <TextAccumulatorFilter
            label="Etiquetas"
            name="tags"
            value={items}
            placeholder="Escribe y presiona Enter..."
            onAdd={handleAdd}
            onDelete={handleDelete}
        />
    );
};

export default Example;
