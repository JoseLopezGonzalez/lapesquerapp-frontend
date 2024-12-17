# PairSelectBoxesFilter Component

## Descripción
`PairSelectBoxesFilter` es un componente de React que muestra una lista de opciones como cajas de selección (checkboxes) donde solo **una opción puede estar seleccionada** a la vez. Si se hace clic en una opción seleccionada, se deselecciona. Está optimizado con `React.memo` para evitar renderizados innecesarios.

---

## Props
| Propiedad     | Tipo            | Requerido | Descripción                                                                                  |
|---------------|-----------------|-----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`        | Sí        | Etiqueta principal que describe el propósito del filtro.                                      |
| `name`        | `string`        | Sí        | Nombre único para identificar el grupo de checkboxes.                                        |
| `value`       | `string`        | No        | Valor actualmente seleccionado. Si no hay ninguno, es `null`.                                |
| `onChange`    | `function`      | Sí        | Función que se ejecuta cuando se selecciona o deselecciona una opción. Recibe el valor como argumento. |
| `options`     | `array`         | Sí        | Lista de opciones a mostrar. Cada opción es un objeto con las propiedades:                   |
|               |                 |           | - `name` (`string`): Identificador único de la opción.                                       |
|               |                 |           | - `label` (`string`): Texto que se muestra al usuario.                                       |

---

## Optimización con `React.memo`
- El componente está envuelto en `React.memo` para evitar renderizados innecesarios si las props (`label`, `name`, `value`, `onChange`, `options`) no cambian.
- Esto mejora significativamente el rendimiento en formularios dinámicos o con múltiples filtros.

---

## Uso
### Ejemplo de implementación:
```jsx
import React, { useState } from 'react';
import PairSelectBoxesFilter from './PairSelectBoxesFilter';

const Example = () => {
    const [selectedOption, setSelectedOption] = useState(null);

    const handleFilterChange = (newValue) => {
        setSelectedOption(newValue);
        console.log("Nueva opción seleccionada:", newValue);
    };

    const options = [
        { name: "option1", label: "Opción 1" },
        { name: "option2", label: "Opción 2" },
        { name: "option3", label: "Opción 3" },
    ];

    return (
        <PairSelectBoxesFilter
            label="Selecciona una opción"
            name="pair-select-boxes"
            value={selectedOption}
            onChange={handleFilterChange}
            options={options}
        />
    );
};

export default Example;
