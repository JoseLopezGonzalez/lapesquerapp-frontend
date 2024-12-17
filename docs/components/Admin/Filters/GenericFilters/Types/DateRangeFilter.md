# DateRangeFilter Component

## Descripción
`DateRangeFilter` es un componente de React que permite seleccionar un **rango de fechas** utilizando dos campos de tipo `date`. El componente valida que la fecha de inicio no sea mayor que la fecha de fin, y viceversa. Está optimizado con `React.memo` para evitar renderizados innecesarios y soporta configuraciones adicionales como fechas mínimas y máximas.

---

## Props

| Propiedad        | Tipo            | Requerido | Descripción                                                                                  |
|------------------|-----------------|-----------|----------------------------------------------------------------------------------------------|
| `label`          | `string`        | Sí        | Etiqueta que describe el propósito del campo de rango de fechas.                             |
| `name`           | `string`        | Sí        | Nombre único para identificar el grupo de campos de fecha.                                   |
| `value`          | `object`        | No        | Objeto con los valores `start` y `end`. Por defecto: `{ start: '', end: '' }`.               |
| `onChange`       | `function`      | Sí        | Función que se ejecuta cuando cambia cualquiera de las fechas. Recibe el nuevo objeto `value`.|
| `min`            | `string`        | No        | Fecha mínima permitida (en formato `YYYY-MM-DD`).                                            |
| `max`            | `string`        | No        | Fecha máxima permitida (en formato `YYYY-MM-DD`).                                            |
| `placeholderStart` | `string`      | No        | Placeholder para el campo de fecha de inicio. Por defecto: `'Fecha de inicio'`.             |
| `placeholderEnd` | `string`        | No        | Placeholder para el campo de fecha de fin. Por defecto: `'Fecha de fin'`.                   |

---

## Validación del Rango de Fechas
El componente incluye una **validación automática** para evitar inconsistencias en el rango:
1. La **fecha de inicio** no puede ser mayor que la fecha de fin.
2. La **fecha de fin** no puede ser menor que la fecha de inicio.

Si se detecta una violación en la validación, el cambio no se aplicará.

---

## Uso
### Ejemplo de implementación:
```jsx
import React, { useState } from 'react';
import DateRangeFilter from './DateRangeFilter';

const Example = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        console.log('Nuevo rango de fechas:', newRange);
    };

    return (
        <DateRangeFilter
            label="Selecciona un rango de fechas"
            name="date-range"
            value={dateRange}
            onChange={handleDateRangeChange}
            min="2024-01-01"
            max="2024-12-31"
            placeholderStart="Inicio"
            placeholderEnd="Fin"
        />
    );
};

export default Example;
