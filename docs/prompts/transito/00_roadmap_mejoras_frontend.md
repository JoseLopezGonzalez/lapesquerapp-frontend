# ROADMAP DE MEJORAS FRONTEND

| Nº | Mejora | Afecta a | Impacto | Estado |
|----|--------|----------|---------|--------|
| 1 | Validaciones completas e inline en formularios (pedidos, productos, entidades genéricas) | Editor pedido (sheet), gestor pedidos (crear), forms entidades productos/pedidos | Alto | ✅ Implementada |
| 2 | Replicar cambio de nombres de campos en editor de etiquetas a campos que los usan (QR, párrafos, etc.) | Label editor, formatos de etiqueta | Medio | ✅ Implementada |
| 3 | Restricciones en formatos de etiquetas: campos críticos obligatorios antes de guardar | Gestor de etiquetas | Medio | ⏳ Pendiente |
| 4 | Corregir scroll en combobox al buscar (resultado arriba, scroll en medio) | Comboboxes globales / Shadcn | Medio | ⏳ Pendiente |
| 5 | Combobox producto en líneas de previsión (crear pedido): tamaño y comportamiento como en edición | Gestor pedidos, form crear pedido | Bajo | ⏳ Pendiente |
| 6 | Paginación nativa Shadcn en dialog vincular palets (edición pedido) | Edición pedido, apartado palets | Bajo | ⏳ Pendiente |
| 7 | Reset estado panel derecho al cambiar de formato en label editor | Label editor | Medio | ⏳ Pendiente |
| 8 | Mejorar diseño cards listado campos (panel izquierdo label editor): Shadcn nativos, minimalistas | Label editor | Bajo | ⏳ Pendiente |

---

## Detalle de mejoras

### Mejora Nº 1 – Validaciones completas e inline en formularios
- **Descripción reinterpretada:** Revisar si existen validaciones y, si no, implementarlas al completo en los formularios indicados, de modo que al guardar los errores se muestren inline. Ámbito: sheet de editar pedido (editor de pedido), form de crear pedido (gestor de pedidos), todas las entidades genéricas de productos (forms crear/editar), todas las entidades genéricas de pedidos (forms crear/editar).
- **Afecta a:** Editor de pedido (sheet), gestor de pedidos (form crear pedido), forms de entidades genéricas productos y pedidos.
- **Impacto estimado:** Alto (UX y consistencia de datos).
- **Estado:** ✅ Implementada
- **Notas:** 2025-02-11. Errores 422 del backend se mapean a setError (inline). Helper setErrorsFrom422. orderService lanza ApiError con data en 422. OrderEditSheet, CreateOrderForm, CreateEntityForm y EditEntityForm muestran errores inline y texto “Corrige los errores…” cuando el botón está deshabilitado por validación.

### Mejora Nº 2 – Replicar cambio de nombres de campos en editor de etiquetas
- **Descripción reinterpretada:** En el editor de etiquetas de un formato, cuando se cambie el nombre de un campo, ese cambio debe replicarse en todos los lugares que referencian ese campo (QR, párrafos, etc.) para que sigan funcionando correctamente.
- **Afecta a:** Label editor, definición de formatos de etiqueta y referencias entre campos.
- **Impacto estimado:** Medio (correcto funcionamiento de etiquetas).
- **Estado:** ✅ Implementada
- **Notas:** 2025-02-11. En useLabelEditor: al cambiar key en updateElement se reemplaza {{oldKey}} por {{newKey}} en qrContent, html y barcodeContent de todos los elementos. Al duplicar un campo con key se asigna nombre único (ej. "Lote copia", "Lote 2"). Helpers: replacePlaceholderInContent, normalizeKeyForStorage, escapeRegex.

### Mejora Nº 3 – Restricciones en formatos de etiquetas
- **Descripción reinterpretada:** En el gestor de etiquetas, imponer restricciones: todos los campos críticos (nombre, valores, etc.) deben estar rellenos; si no, no se permitirá guardar el formato.
- **Afecta a:** Gestor de etiquetas, formularios de creación/edición de formatos.
- **Impacto estimado:** Medio (integridad de datos, evitar formatos inválidos).
- **Estado:** ⏳ Pendiente
- **Notas:**

### Mejora Nº 4 – Scroll en combobox al buscar
- **Descripción reinterpretada:** Corregir el comportamiento del scroll en los combobox al introducir texto para buscar: el resultado correcto queda arriba del cuadro de opciones pero el scroll se sitúa en medio sin sentido.
- **Afecta a:** Componentes combobox (posiblemente Shadcn o custom).
- **Impacto estimado:** Medio (UX en búsqueda/selector).
- **Estado:** ⏳ Pendiente
- **Notas:**

### Mejora Nº 5 – Combobox producto en líneas de previsión (crear pedido)
- **Descripción reinterpretada:** El combobox de producto en las líneas de previsión del form de creación de pedido (gestor de pedidos) debe ser grande en previsión de productos con nombres largos y ajustarse igual que en el apartado de previsión de la edición de pedidos.
- **Afecta a:** Gestor de pedidos, form de creación de pedido, líneas de previsión.
- **Impacto estimado:** Bajo (consistencia y legibilidad).
- **Estado:** ⏳ Pendiente
- **Notas:**

### Mejora Nº 6 – Paginación nativa Shadcn en dialog vincular palets
- **Descripción reinterpretada:** Mejorar la paginación del dialog de vincular palets (apartado palets de la edición de pedidos) usando paginación nativa de Shadcn en lugar de una solución que parece inventada.
- **Afecta a:** Edición de pedidos, apartado palets, dialog vincular palets.
- **Impacto estimado:** Bajo (consistencia UI, mantenibilidad).
- **Estado:** ⏳ Pendiente
- **Notas:**

### Mejora Nº 7 – Reset estado panel derecho al cambiar de formato (label editor)
- **Descripción reinterpretada:** Corregir que el panel derecho de edición de un campo del label editor mantenga el estado del campo/formato anterior cuando se cambia de formato de etiqueta; debe resetearse o actualizarse correctamente.
- **Afecta a:** Label editor, panel derecho de edición de campo.
- **Impacto estimado:** Medio (evitar confusión y datos cruzados).
- **Estado:** ⏳ Pendiente
- **Notas:**

### Mejora Nº 8 – Diseño cards listado campos (label editor)
- **Descripción reinterpretada:** Mejorar la interfaz gráfica de los cards del listado de campos de un formato (panel izquierdo del label editor): usar cards más nativos de Shadcn, más bonitos y minimalistas.
- **Afecta a:** Label editor, panel izquierdo, listado de campos.
- **Impacto estimado:** Bajo (estética y consistencia con Shadcn).
- **Estado:** ⏳ Pendiente
- **Notas:**
