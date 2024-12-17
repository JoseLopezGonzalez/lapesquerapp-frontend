# NumberFilter Component

## Descripción
`NumberFilter` es un componente de React optimizado con `React.memo` que proporciona un campo de entrada numérico. Permite solo valores numéricos y el punto decimal, siendo ideal para filtros y formularios donde se requieren entradas numéricas.

---

## Props
| Propiedad     | Tipo            | Requerido | Descripción                                                                                  |
|---------------|-----------------|-----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`        | Sí        | Etiqueta que se mostrará encima del campo de entrada.                                         |
| `name`        | `string`        | Sí        | Nombre único para identificar el campo de entrada.                                           |
| `value`       | `string`        | Sí        | Valor actual del campo de entrada.                                                           |
| `placeholder` | `string`        | No        | Texto que se mostrará como sugerencia en el campo cuando no haya un valor.                   |
| `onChange`    | `function`      | Sí        | Función que se ejecuta al cambiar el valor del campo. Recibe el nuevo valor como argumento.   |

---

## Comportamiento
- Permite solo **números** y el **punto decimal** en el campo de entrada.
- Utiliza una expresión regular (`/^[0-9]*\.?[0-9]*$/`) para validar las entradas en tiempo real.
- Es ideal para aplicaciones donde se necesita capturar valores numéricos como cantidades, precios o filtros de rango.

---

## Optimización con `React.memo`
- El componente está envuelto en `React.memo` para evitar renderizados innecesarios si las props no cambian.
- Esto mejora el rendimiento en aplicaciones con múltiples filtros o formularios dinámicos.

---

## Uso
### Ejemplo de implementación:
```jsx
import React, { useState } from 'react';
import NumberFilter from './NumberFilter';

const Example = () => {
    const [numberValue, setNumberValue] = useState('');

    const handleNumberChange = (newValue) => {
        setNumberValue(newValue);
        console.log("Nuevo valor numérico:", newValue);
    };

    return (
        <NumberFilter
            label="Cantidad"
            name="quantity"
            value={numberValue}
            placeholder="Escribe un número..."
            onChange={handleNumberChange}
        />
    );
};

export default Example;
