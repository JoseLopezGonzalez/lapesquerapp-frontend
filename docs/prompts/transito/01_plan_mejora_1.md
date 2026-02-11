# Plan implementación – Mejora Nº 1

## Objetivo

Completar validaciones en los formularios indicados para que, al guardar, los errores se muestren **inline** (junto a cada campo). Incluye:

1. **Errores 422 del backend**: cuando el API devuelve HTTP 422 con `errors` (campos en camelCase, arrays como `plannedProducts.0.product`), mapearlos a `setError()` de React Hook Form para mostrarlos inline.
2. **Botón Guardar deshabilitado con errores**: en CreateEntityForm y EditEntityForm, deshabilitar el botón cuando haya errores de validación y mostrar en la UI el motivo (ej. texto “Corrige los errores marcados para poder guardar”).
3. **Revisión de validación en entidades genéricas**: asegurar que los campos críticos de las entidades que usan CreateEntityForm/EditEntityForm tengan `validation` en `entitiesConfig.js` (solo revisión/ajuste, sin cambiar estructura).

---

## Archivos a modificar

| Archivo | Cambios |
|---------|--------|
| `src/lib/api/apiHelpers.js` | (opcional) Exportar helper `setErrorsFrom422(setError, errors)` o crear `src/lib/validation/setErrorsFrom422.js` para reutilizar en todos los formularios. |
| `src/services/orderService.js` | En `createOrder` y `updateOrder`: ante `!response.ok` y status 422, parsear body y lanzar un error que incluya `errors` (ej. usar `ApiError` con `status` y `data`) en lugar de solo `new Error(message)`. |
| `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js` | En el `catch` de `onSubmit`: si el error tiene `data?.errors` (422), llamar al helper para `setError` de cada campo; mantener toast con userMessage. |
| `src/components/Admin/OrdersManager/CreateOrderForm/index.js` | En el `catch` de `handleCreate`: si el error tiene `data?.errors`, mapear a `setError`; mantener toast. Añadir texto explicativo cuando el botón esté deshabilitado por errores (si no existe ya). |
| `src/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm/index.js` | En el `catch` de `onSubmit`: si el error es `Response` con status 422, hacer `await error.json()`, si existe `errors` llamar al helper con `setError`. Mostrar toast con userMessage. Deshabilitar botón Guardar cuando `Object.keys(errors).length > 0` y mostrar texto tipo “Corrige los errores marcados para poder guardar”. |
| `src/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js` | Mismo tratamiento 422 + deshabilitar botón con errores y texto explicativo. |
| `src/configs/entitiesConfig.js` | Solo si tras revisión faltan validaciones en campos críticos: añadir `validation: { required: "..." }` (u otras reglas) en los campos que lo requieran. |

**Nuevo archivo (recomendado):**

- `src/lib/validation/setErrorsFrom422.js`: función `setErrorsFrom422(setError, errors)` que recorre el objeto `errors` del backend (claves camelCase, ej. `plannedProducts.0.product`) y por cada una llama a `setError(key, { type: 'server', message: errors[key][0] })`.

---

## Estrategia

### 1. Helper para mapear 422 a React Hook Form

- Contrato del backend: `errors` es un objeto `{ "campo": ["mensaje"], "plannedProducts.0.product": ["mensaje"], ... }`.
- Implementación: iterar `Object.entries(errors)` y para cada clave válida llamar `setError(key, { type: 'server', message: Array.isArray(val) ? val[0] : val })`. No tocar claves que no existan como nombres de campo en el formulario (opcional: ignorar claves desconocidas para evitar ruido).

### 2. Servicios de pedidos (orderService)

- **createOrder**: si `!response.ok`, hacer `const errorData = await response.json()`. Si `response.status === 422`, lanzar `new ApiError(getErrorMessage(errorData), 422, errorData)` (o un objeto `{ message, status: 422, data: errorData }`) para que el componente pueda leer `error.data.errors`.
- **updateOrder**: mismo criterio (parsear body, si 422 lanzar error enriquecido con `data.errors`).

Comprobar que `ApiError` en `apiHelpers.js` tenga `status` y `data`; si no, usar un objeto plano o extender `ApiError`.

### 3. Formularios de pedidos (OrderEditSheet, CreateOrderForm)

- Obtener `setError` de `useForm` (ya disponible).
- En el `catch` del submit: comprobar si `error?.status === 422` o `error?.data?.errors`. Si existe `error.data.errors`, llamar `setErrorsFrom422(setError, error.data.errors)`.
- Seguir mostrando toast con `error.userMessage` o `error.data?.userMessage` o `getErrorMessage(error.data)`.
- CreateOrderForm: si el botón se deshabilita por `!isValid` o por errores, asegurar que haya un texto visible (debajo del formulario o junto al botón) tipo “Corrige los errores marcados para poder guardar” cuando `Object.keys(errors).length > 0`.

### 4. Formularios genéricos (CreateEntityForm, EditEntityForm)

- El servicio genérico lanza la `Response` cuando `!response.ok`. En el `catch`: si `err instanceof Response && err.status === 422`, hacer `const data = await err.json()` (o `err.clone().json()` si hubiera consumo previo). Si `data.errors`, llamar `setErrorsFrom422(setError, data.errors)` y toast con `data.userMessage` o `data.message`.
- Añadir `setError` en el destructuring de `useForm`.
- Deshabilitar el botón “Guardar” cuando `Object.keys(errors).length > 0` (además de `isSubmitting`).
- Mostrar un texto claro cuando haya errores: por ejemplo “Corrige los errores marcados en el formulario para poder guardar” (debajo del formulario o encima del pie con botones), y/o `aria-label` / `title` en el botón indicando que está deshabilitado por errores de validación.

### 5. Revisión entitiesConfig

- Revisar entidades que usan CreateEntityForm/EditEntityForm y comprobar que los campos obligatorios/críticos tengan `validation` (p. ej. `required`). Añadir solo donde falte, sin refactorizar estructura.

---

## Qué NO tocar

- No cambiar la estructura de `createForm` / `editForm` / `fields` en `entitiesConfig` más allá de añadir `validation` donde falte.
- No modificar hooks `useOrderFormConfig` ni `useOrderCreateFormConfig` en lógica de reglas (solo se usan ya para validación e inline).
- No tocar otros formularios (Settings, RawMaterialReceptions, etc.) ni otros endpoints.

---

## Protección Desktop/Mobile

- Los cambios son en lógica de validación y mensajes; no se modifican breakpoints ni layouts. OrderEditSheet y CreateOrderForm ya tienen variantes mobile; el texto explicativo del botón deshabilitado debe verse en ambas (incluido en el mismo bloque del botón o debajo del formulario).

---

## Estrategia anti-regresiones

- Mantener el comportamiento actual cuando no hay 422: mismo toast y mismo flujo.
- Solo añadir código en bloques `if (status === 422 && data?.errors)` / `if (err instanceof Response && err.status === 422)`.
- Probar manualmente: enviar formulario con datos inválidos que provoquen 422 y comprobar que los mensajes aparecen junto a los campos y que el toast sigue mostrando userMessage.

---

## Checklist de validación

- [ ] OrderEditSheet: al recibir 422, los errores del API aparecen inline en cada campo; el toast muestra userMessage.
- [ ] CreateOrderForm: igual para 422; errores en líneas de previsión (`plannedProducts.i.campo`) se muestran inline; texto visible cuando el botón está deshabilitado por errores.
- [ ] CreateEntityForm: 422 mapeado a setError; botón deshabilitado cuando hay errores; texto “Corrige los errores…” (o equivalente) visible.
- [ ] EditEntityForm: mismo comportamiento que CreateEntityForm.
- [ ] orderService: createOrder y updateOrder lanzan error con `data.errors` en 422 sin romper otros consumidores (solo se lee en los formularios indicados).
- [ ] entitiesConfig: revisión hecha; campos críticos con validación donde faltaba.
- [ ] Desktop y mobile: botón deshabilitado y mensaje explicativo visibles en ambos.
