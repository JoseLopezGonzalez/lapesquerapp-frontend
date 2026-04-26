# Auditoría: UI/Form System Agent
# Bloque: Pedidos - creación, edición y líneas

**Fecha:** 2026-04-26
**Rol auditor:** UI/Form System Agent
**Scope:** React Hook Form, Zod, arrays dinámicos, default values, payloads, errores y submit

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/components/Admin/OrdersManager/CreateOrderForm/index.js` | Formulario principal de creación |
| `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx` | Stepper móvil de creación |
| `src/components/Admin/OrdersManager/CreateOrderForm/schemas/orderCreateSchema.js` | Validación Zod de creación |
| `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js` | Sheet de edición de cabecera del pedido |
| `src/components/Admin/OrdersManager/Order/OrderEditSheet/schemas/orderEditSchema.js` | Validación Zod de edición |
| `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js` | Edición inline de previsión de productos |
| `src/hooks/useOrderCreateFormConfig.js` | Configuración dinámica del formulario de alta |
| `src/hooks/useOrderFormConfig.js` | Configuración dinámica del formulario de edición |

---

## 2. Resultado general

El sistema de formularios de pedidos usa bien React Hook Form, `Controller`, Zod y `useFieldArray` en creación. El mayor riesgo está en que hay tres modelos de formulario distintos para el mismo dominio: alta con Zod y array dinámico, edición de cabecera con dirty fields, y edición inline de líneas sin React Hook Form ni Zod. Esta mezcla hace que las garantías de validación varíen según el punto del flujo.

### Nota global: **6.4 / 10**

---

## 3. Hallazgos

| Severidad | Hallazgo | Referencia |
|---|---|---|
| Alta | La edición inline de líneas convierte números y guarda sin validación Zod ni bloqueo claro de valores inválidos. | `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js:185` |
| Alta | La eliminación de líneas previstas persistidas no muestra confirmación previa. Es una acción destructiva de pedido. | `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js:221` |
| Media | En creación, `taxLoading` no forma parte de `loading`; el formulario puede renderizar mientras impuestos aún cargan. | `src/components/Admin/OrdersManager/CreateOrderForm/index.js:62`, `src/components/Admin/OrdersManager/CreateOrderForm/index.js:72` |
| Media | `fieldOperator` se envía como `undefined` en creación cuando no hay valor, mientras edición lo normaliza a `null`. | `src/components/Admin/OrdersManager/CreateOrderForm/index.js:194`, `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:102` |
| Media | El formulario móvil añade reglas inline además del schema Zod, duplicando validación. | `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx:414`, `src/components/Admin/OrdersManager/CreateOrderForm/schemas/orderCreateSchema.js:3` |
| Media | `OrderEditSheet` solo envía dirty fields, correcto para eficiencia, pero los nombres de payload quedan acoplados a los nombres del formulario. | `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:95` |
| Baja | El submit de creación deshabilita solo por `isSubmitting`, no por carga de opciones ni por `!isValid`. | `src/components/Admin/OrdersManager/CreateOrderForm/index.js:532` |
| Baja | La UX móvil usa Framer Motion en un formulario operativo; tiene `prefersReducedMotion`, pero añade complejidad no esencial. | `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx:4`, `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx:179` |

---

## 4. Puntos fuertes

- Creación usa `zodResolver(orderCreateSchema)` con `mode: 'onChange'`.
- El alta usa `useFieldArray` para `plannedProducts`, patrón correcto para líneas dinámicas.
- Los errores 422 se mapean con `setErrorsFrom422` tanto en alta como en edición.
- La edición protege cierre con cambios sucios mediante diálogo de descarte.
- Los campos custom usan `Controller`, alineado con las reglas del repositorio.

---

## 5. Recomendaciones

1. Añadir schema específico para líneas de previsión editadas inline y validar antes de llamar a `plannedProductDetailActions.create/update`.
2. Añadir confirm dialog para eliminar líneas de previsión persistidas.
3. Unificar normalización de payload entre creación y edición: `fieldOperator`, IDs, fechas y emails.
4. Incluir `taxLoading` en el estado global de carga del formulario de creación.
5. Evitar duplicar reglas inline en mobile cuando el schema Zod ya cubre el caso.

---

## 6. Checks manuales sugeridos

- [ ] Crear pedido sin líneas y confirmar error de `plannedProducts`.
- [ ] Crear pedido con impuesto todavía cargando y verificar que no permite enviar una línea incompleta.
- [ ] Editar cabecera, cerrar con cambios y confirmar diálogo de descarte.
- [ ] Añadir línea prevista con cantidad, cajas, precio e IVA inválidos.
- [ ] Eliminar una línea persistida y comprobar si existe confirmación.

