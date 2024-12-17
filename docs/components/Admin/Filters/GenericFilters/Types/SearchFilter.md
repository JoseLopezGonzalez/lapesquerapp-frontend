# SearchFilter Component

## Descripción
`SearchFilter` es un componente reutilizable de React que proporciona un campo de búsqueda con un diseño moderno. Incluye un ícono de búsqueda y soporte para ejecutar acciones al presionar la tecla **Enter**. El componente está optimizado con `React.memo` para evitar renderizados innecesarios y mejorar el rendimiento en aplicaciones grandes.

---

## Props

| Propiedad     | Tipo            | Requerido | Descripción                                                                                  |
|---------------|-----------------|-----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`        | Sí        | Etiqueta accesible que describe el propósito del campo de búsqueda.                          |
| `name`        | `string`        | Sí        | Nombre único para identificar el campo de búsqueda.                                          |
| `value`       | `string`        | Sí        | Valor actual del campo de búsqueda.                                                          |
| `placeholder` | `string`        | No        | Texto de sugerencia que aparece cuando no hay un valor. Por defecto: `'Buscar...'`.          |
| `onChange`    | `function`      | Sí        | Función que se ejecuta cuando el valor del campo cambia. Recibe el nuevo valor como argumento.|
| `maxLength`   | `number`        | No        | Longitud máxima permitida para el texto de búsqueda. Por defecto: `100`.                     |
| `onKeyDown`   | `function`      | No        | Función que se ejecuta al presionar **Enter**. Ideal para disparar una búsqueda.             |

---

## Optimización con `React.memo`
- El componente utiliza `React.memo` para evitar renderizados innecesarios si las propiedades no cambian.
- Esto mejora significativamente el rendimiento en aplicaciones con múltiples campos de búsqueda.

---

## Uso
### Ejemplo de implementación:
```jsx
import React, { useState } from 'react';
import SearchFilter from './SearchFilter';

const Example = () => {
    const [searchValue, setSearchValue] = useState('');

    const handleSearchChange = (newValue) => {
        setSearchValue(newValue);
        console.log('Valor del campo de búsqueda:', newValue);
    };

    const handleSearchSubmit = () => {
        console.log('Iniciando búsqueda para:', searchValue);
    };

    return (
        <SearchFilter
            label="Buscar"
            name="search"
            value={searchValue}
            placeholder="Escribe para buscar..."
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
        />
    );
};

export default Example;
