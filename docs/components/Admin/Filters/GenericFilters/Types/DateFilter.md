# DateFilter Component

## Descripción
`DateFilter` es un componente de React que proporciona un campo de entrada de tipo **fecha** (`<input type="date">`). Está optimizado con `React.memo` para evitar renderizados innecesarios y es útil en formularios y filtros donde se requiere seleccionar fechas.

---

## Props
| Propiedad     | Tipo            | Requerido | Descripción                                                                                  |
|---------------|-----------------|-----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`        | Sí        | Etiqueta que describe el propósito del campo de fecha.                                        |
| `name`        | `string`        | Sí        | Nombre único para identificar el campo de entrada.                                           |
| `value`       | `string`        | Sí        | Valor actual del campo de entrada en formato `YYYY-MM-DD`.                                    |
| `placeholder` | `string`        | No        | Texto que se mostrará como sugerencia en el campo si no hay un valor seleccionado.            |
| `onChange`    | `function`      | Sí        | Función que se ejecuta cuando el valor del campo cambia. Recibe el nuevo valor como argumento. |

---

## Optimización con `React.memo`
- El componente está envuelto en `React.memo` para evitar renderizados innecesarios si las props (`name`, `label`, `value`, `placeholder`, `onChange`) no cambian.
- Esto mejora el rendimiento en aplicaciones con múltiples filtros o formularios dinámicos.

---

## Uso
### Ejemplo de implementación:
```jsx
import React, { useState } from 'react';
import DateFilter from './DateFilter';

const Example = () => {
    const [selectedDate, setSelectedDate] = useState('');

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        console.log('Nueva fecha seleccionada:', newDate);
    };

    return (
        <DateFilter
            label="Selecciona una fecha"
            name="date-filter"
            value={selectedDate}
            placeholder="YYYY-MM-DD"
            onChange={handleDateChange}
        />
    );
};

export default Example;
