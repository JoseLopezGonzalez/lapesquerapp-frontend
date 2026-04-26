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

| ID | Severidad | Hallazgo | Explicación del problema | Referencia | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OB02-01 | Alta | La edición inline de líneas convierte números y guarda sin validación Zod ni bloqueo claro de valores inválidos. | Una línea mal guardada impacta cantidades, cajas, precio e impuestos; ahora cada campo depende de conversiones manuales. | `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js:185` | Crear schema de línea prevista y validar antes de create/update. | Pendiente |  |
| OB02-02 | Alta | La eliminación de líneas previstas persistidas no muestra confirmación previa. | El usuario puede borrar datos comerciales reales con un click, sin paso de recuperación ni confirmación. | `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js:221` | Añadir confirm dialog solo para líneas persistidas. | Hecho | Confirmación añadida para líneas persistidas; las líneas temporales siguen eliminándose localmente sin diálogo. |
| OB02-03 | Media | En creación, `taxLoading` no forma parte de `loading`; el formulario puede renderizar mientras impuestos aún cargan. | El usuario puede intentar completar líneas sin opciones fiscales listas, generando errores evitables. | `src/components/Admin/OrdersManager/CreateOrderForm/index.js:62`, `src/components/Admin/OrdersManager/CreateOrderForm/index.js:72` | Incluir `taxLoading` en `loading` y deshabilitar submit mientras cargan opciones críticas. | Hecho | `loading` incluye `taxLoading`; el formulario espera impuestos antes de renderizar y el submit queda cubierto por `submitDisabled`. |
| OB02-04 | Media | `fieldOperator` se envía como `undefined` en creación cuando no hay valor, mientras edición lo normaliza a `null`. | Dos payloads distintos para el mismo campo aumentan la probabilidad de diferencias backend entre alta y edición. | `src/components/Admin/OrdersManager/CreateOrderForm/index.js:194`, `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:102` | Unificar normalización de payload para alta y edición. | Hecho | Creación normaliza `fieldOperator` a entero o `null`, igual que edición. |
| OB02-05 | Media | El formulario móvil añade reglas inline además del schema Zod, duplicando validación. | Las reglas pueden divergir y mostrar errores distintos entre desktop, mobile y backend. | `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx:414`, `src/components/Admin/OrdersManager/CreateOrderForm/schemas/orderCreateSchema.js:3` | Dejar Zod como fuente principal y usar reglas inline solo para UX local imprescindible. | Hecho | Eliminadas reglas inline duplicadas en móvil; se mantiene Zod como fuente de validación y `valueAsNumber` solo como transformación. |
| OB02-06 | Media | `OrderEditSheet` solo envía dirty fields, correcto para eficiencia, pero los nombres de payload quedan acoplados a los nombres del formulario. | Si un campo cambia de nombre visual o backend, la transformación implícita puede romperse sin un punto claro de revisión. | `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:95` | Añadir función explícita de transformación `form -> payload`. | Hecho | Extraído `buildOrderEditPayload` con tests para dirty fields, fechas y `fieldOperator`. |
| OB02-07 | Baja | El submit de creación deshabilita solo por `isSubmitting`, no por carga de opciones ni por `!isValid`. | Permite pulsar guardar en estados donde el formulario todavía no tiene datos auxiliares o validación completa. | `src/components/Admin/OrdersManager/CreateOrderForm/index.js:532` | Deshabilitar cuando haya submit activo, carga pendiente o formulario inválido. | Hecho | Añadido `submitDisabled` compartido para desktop/mobile: `isSubmitting`, `loading` o formulario inválido. |
| OB02-08 | Baja | La UX móvil usa Framer Motion en un formulario operativo; tiene `prefersReducedMotion`, pero añade complejidad no esencial. | En dispositivos modestos puede penalizar fluidez y complica un flujo que debe priorizar rapidez. | `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx:4`, `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx:179` | Simplificar transiciones si no mejoran velocidad de uso. | Pendiente |  |

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
