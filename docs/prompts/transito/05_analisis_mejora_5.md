# Mejora Nº 5 – Análisis

## 1️⃣ Estado actual (según código real)

**Formulario de creación de pedido (CreateOrderForm)**

- **Desktop** (`src/components/Admin/OrdersManager/CreateOrderForm/index.js`): La sección "Productos previstos" renderiza cada línea con `flex items-center justify-center gap-2`. El Combobox de producto es el primer hijo, sin `className` ni wrapper. El botón interno del Combobox tiene `w-full`, pero al estar en un flex sin `min-width` ni `flex: 1`, el contenedor del combobox **se comprime** cuando hay varios campos en fila (cantidad, cajas, precio, IVA, eliminar). Nombres largos de producto se truncan y el ancho efectivo queda pequeño.
- **Mobile**: Se usa `CreateOrderFormMobile.jsx` (stepper). Cada línea de producto es una card; el Combobox producto está en un bloque con Label "Producto", a ancho completo. No se aplica altura explícita al Combobox (los Input tienen `h-12 text-base`). No hay `searchPlaceholder` ni `notFoundMessage` (sí en edición).

**Edición de pedido – Previsión (OrderPlannedProductDetails)**

- **Desktop** (`OrderPlannedProductDetails/index.js`): Tabla con columna "Artículo" que contiene el Combobox al editar. La celda no tiene `min-width`; el ancho depende del layout de la tabla. Combobox con `placeholder`, `searchPlaceholder`, `notFoundMessage`.
- **Mobile**: Vista en cards. Combobox envuelto en `<div className="[&_button]:!h-9">` (altura fija del botón). Combobox a ancho completo dentro de la card.

**Resumen**: En crear pedido (desktop) el combobox de producto es el que sufre: queda estrecho en la fila flex. En edición, la tabla reparte espacio pero la columna artículo no tiene ancho mínimo garantizado. En mobile, crear no unifica altura del combobox con el resto de campos (h-12) ni con el estilo de edición (h-9).

---

## 2️⃣ Zonas afectadas

| Archivo | Qué tocar |
|--------|------------|
| `src/components/Admin/OrdersManager/CreateOrderForm/index.js` | Líneas de "Productos previstos": dar ancho mínimo o columna prioritaria al Combobox producto (desktop); opcionalmente misma altura que otros campos en mobile si se unifica con edición. |
| `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx` | Combobox producto en cada línea: opcionalmente altura consistente (h-12 como los Input o h-9 como en OrderPlannedProductDetails) y/o `searchPlaceholder` / `notFoundMessage` para alinear con edición. |
| `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js` | Opcional: en tabla desktop, asegurar ancho mínimo en la celda/columna "Artículo" para nombres largos (referencia de "comportamiento igual"). |

El componente `Combobox` (`src/components/Shadcn/Combobox/index.js`) ya acepta `className` y se puede usar para aplicar `min-w-*` o contenedores; no es obligatorio modificarlo si se envuelve o se dan clases desde el padre.

---

## 3️⃣ Riesgos detectados

- **Layout desktop**: Si se cambia el flex de la línea de productos por grid o se añade `min-w-[...]` al combobox, comprobar que no se rompa en ventanas estrechas (p. ej. tabla que haga scroll horizontal o línea que se parta de forma rara).
- **Mobile**: Unificar altura (h-9 vs h-12) con edición puede ser decisión de producto: h-9 más compacto como en edición, o h-12 como el resto de inputs del crear. Cambio solo visual/UX, bajo riesgo.
- **OrderPlannedProductDetails**: Añadir `min-width` a la columna Artículo puede aumentar el ancho mínimo de la tabla; revisar en pantallas pequeñas.

---

## 4️⃣ Preguntas necesarias antes de planificar

1. **Referencia "igual que en edición"**: ¿Se desea que en **crear** pedido el combobox de producto tenga exactamente la misma altura que en edición (h-9 en mobile) o prefiere mantener h-12 en mobile para alinearlo con cantidad/cajas/precio del mismo formulario?
2. **Ancho mínimo concreto**: ¿Hay un valor deseado para el ancho mínimo del combobox producto en desktop (p. ej. 200px, 280px) o se deja a criterio técnico (p. ej. min-w-[200px] o min-w-[14rem])?
3. **Placeholders en crear**: ¿Se quieren añadir en el Combobox de producto de crear pedido `searchPlaceholder` y `notFoundMessage` como en edición, o se deja solo el cambio de tamaño/comportamiento?

---

## 5️⃣ Nivel de riesgo real

**Bajo**: Cambios acotados a estilos y opcionalmente props de texto; sin cambios de lógica ni de APIs. Riesgo principal es layout en viewports intermedios, mitigable probando desktop y mobile.
