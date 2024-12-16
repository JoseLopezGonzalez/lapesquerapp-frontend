# TextAreaFilter Component

## Descripción
`TextAreaFilter` es un componente reutilizable de React que proporciona un campo de entrada para texto multilínea (textarea). Está optimizado con `React.memo` para evitar renderizados innecesarios, lo que lo hace ideal para formularios o filtros avanzados.

---

## Props
| Propiedad     | Tipo       | Requerido | Descripción                                                                                  |
|---------------|------------|-----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`   | Sí        | Etiqueta que se mostrará encima del campo de texto multilínea.                               |
| `name`        | `string`   | Sí        | Nombre único para identificar el campo de entrada.                                           |
| `value`       | `string`   | Sí        | Valor actual del campo de entrada.                                                           |
| `placeholder` | `string`   | No        | Texto que se mostrará como sugerencia en el campo cuando no haya un valor.                   |
| `onChange`    | `function` | Sí        | Función que se ejecutará al cambiar el valor del campo. Recibe el nuevo valor como argumento. |

---

## Optimización con `React.memo`
Este componente está envuelto en `React.memo` para:
- Reducir renderizados innecesarios.
- Mejorar el rendimiento en aplicaciones con formularios complejos o listas dinámicas.

---

## Uso
### Ejemplo de implementación:
```jsx
import React, { useState } from 'react';
import TextAreaFilter from './TextAreaFilter';

const Example = () => {
    const [description, setDescription] = useState("");

    const handleDescriptionChange = (newValue) => {
        setDescription(newValue);
        console.log("Nuevo valor del textarea:", newValue);
    };

    return (
        <TextAreaFilter
            label="Descripción"
            name="description"
            value={description}
            placeholder="Escribe una descripción..."
            onChange={handleDescriptionChange}
        />
    );
};

export default Example;
