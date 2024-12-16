# TextFilter Component

## Descripción
`TextFilter` es un componente reutilizable de React que proporciona un filtro basado en un campo de entrada de texto. Este componente es útil para filtrar datos o capturar entradas de texto dentro de formularios o interfaces de usuario.

---

## Propiedades (Props)
| Propiedad     | Tipo       | Requerido | Descripción                                                                                  |
|---------------|------------|-----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`   | Sí        | Etiqueta que se mostrará encima del campo de texto.                                           |
| `name`        | `string`   | Sí        | Nombre único para identificar el campo de entrada.                                           |
| `value`       | `string`   | Sí        | Valor actual del campo de entrada.                                                           |
| `placeholder` | `string`   | No        | Texto que se mostrará como sugerencia en el campo cuando no haya un valor.                   |
| `onChange`    | `function` | Sí        | Función que se ejecutará al cambiar el valor del campo. Recibe el nuevo valor como argumento. |

---

## Uso
### Ejemplo de implementación:
```jsx
import { TextFilter } from './TextFilter';

const Example = () => {
    const [filterValue, setFilterValue] = React.useState("");

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
