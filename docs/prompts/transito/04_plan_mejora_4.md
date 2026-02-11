# Plan implementación – Mejora Nº 4

## Objetivo

Corregir el comportamiento del scroll en el Combobox al buscar: cuando el usuario escribe en el campo de búsqueda, la lista filtrada debe mostrarse **desde arriba** (scroll en la posición inicial), de modo que el primer resultado coincidente sea visible sin que el usuario tenga que subir el scroll manualmente. Opcionalmente, resetear el texto de búsqueda al cerrar el popover para que la próxima apertura muestre la lista completa.

---

## Archivos a modificar

| Archivo | Cambios |
|---------|--------|
| `src/components/Shadcn/Combobox/index.js` | (1) Añadir estado `searchValue` para el texto de búsqueda. (2) Pasar `value={searchValue}` y `onValueChange={setSearchValue}` a `CommandInput` (búsqueda controlada). (3) Añadir ref a `CommandList`. (4) En `useEffect` que dependa de `searchValue`, ejecutar `listRef.current.scrollTop = 0` para llevar el scroll al inicio. (5) En el callback de cierre del popover (`handleOpenChange`), cuando `!newOpen`, llamar a `setSearchValue("")` para resetear la búsqueda. |

No modificar `src/components/ui/command.jsx` (solución contenida en Combobox).

---

## Estrategia

### 1. Búsqueda controlada

- El componente `Command` de cmdk permite que el input de búsqueda sea controlado mediante `value` y `onValueChange` en `CommandInput` (según API de cmdk).
- En Combobox: `const [searchValue, setSearchValue] = React.useState("")` y pasar a `CommandInput`: `value={searchValue}` y `onValueChange={setSearchValue}`.
- Así tenemos un único origen de verdad y podemos reaccionar a cada cambio de texto.

### 2. Scroll a arriba al filtrar

- Crear `const listRef = React.useRef(null)` y asignarlo a `CommandList` con `ref={listRef}`.
- `React.useEffect(() => { if (listRef.current) listRef.current.scrollTop = 0; }, [searchValue])`. Cada vez que cambie el texto de búsqueda, la lista se filtra (por cmdk) y en el siguiente paint el efecto pone el scroll en 0.

### 3. Reset al cerrar

- En `handleOpenChange(newOpen)`: si `!newOpen`, llamar a `setSearchValue("")` para que la próxima vez que se abra el combobox el campo de búsqueda esté vacío y la lista completa visible.

### 4. Qué NO tocar

- CommandList en `command.jsx`: no añadir lógica allí; solo Combobox.
- No cambiar la API pública del Combobox (mismas props).
- Mantener el `onWheel` existente en CommandList si ya estaba (scroll con rueda).

---

## Qué NO tocar

- Componentes que *usan* el Combobox (no requieren cambios).
- `command.jsx`: no añadir lógica de scroll ni de búsqueda.
- Estilos del popover o del botón disparador, salvo que ya formaran parte del cambio.

---

## Protección Desktop/Mobile

- El cambio es solo comportamiento (scroll y estado del input); no hay breakpoints ni estilos específicos por viewport. Afecta por igual a desktop y mobile donde se use el Combobox.

---

## Estrategia anti-regresiones

- Cambios mínimos: un estado, un ref, un efecto y el reset en el cierre. No se modifica la lógica de opciones, valor seleccionado ni `onChange`.
- Probar en al menos un formulario que use Combobox (p. ej. producto en pedido o entidad): abrir, escribir, comprobar que la lista se filtra y que el primer resultado queda visible; cerrar y volver a abrir y comprobar que la búsqueda está vacía.

---

## Checklist de validación

- [ ] Abrir un Combobox, escribir texto: la lista se filtra y el scroll muestra los resultados desde arriba (primer resultado visible).
- [ ] Cerrar el popover y volver a abrirlo: el campo de búsqueda está vacío y la lista muestra todas las opciones.
- [ ] Seleccionar una opción y cerrar: comportamiento igual que antes (sin regresiones).
- [ ] Probar en desktop y, si aplica, en mobile donde se use Combobox.
