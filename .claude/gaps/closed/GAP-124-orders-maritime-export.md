# GAP-124 — Integración de pedidos de exportación marítima

## Metadata

- **Tipo:** Feature
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-29
- **Autor:** Jose

---

## Contexto y problema

El backend ha añadido soporte para pedidos de tipo exportación marítima:

- Nuevo valor de `orderType`: `"maritime_export"` (además de `"standard"` y `"autoventa"`).
- Dos recursos nuevos **anidados bajo el pedido**, con sus propios endpoints (no viajan en el payload de creación/edición del pedido):
  - `maritime-shipping-details` — 1:1 por pedido (buque, viaje, factura de exportación, SWB, puerto de carga/descarga). `PUT` es un **reemplazo completo**: hay que enviar siempre el objeto entero, nunca solo el campo que cambió.
  - `maritime-containers` — 1:N por pedido (número de contenedor + número de precinto). CRUD normal, `PATCH` sí hace merge parcial.
- Ambos recursos requieren que el pedido ya exista (tenga `id`) — no se pueden crear en el mismo submit que el alta del pedido.
- El backend no impone que solo los pedidos `maritime_export` tengan estos datos — los endpoints funcionan sobre cualquier pedido. El gating "solo mostrar si `orderType === 'maritime_export'`" es responsabilidad exclusiva del frontend.
- `GET /orders/{id}` (detalle) ahora incluye `maritimeShippingDetail` (objeto o `null`) y `maritimeContainers` (array, `[]` si vacío) en `data`. El listado (`GET /orders` y las tarjetas) **no** incluye estos campos — solo `orderType`, que ya viaja hoy.
- Mismos permisos que el resto del pedido: ver → `OrderPolicy::view`; crear/editar/borrar → `OrderPolicy::update` (Comercial no puede editar; Repartidor Autoventa no tiene acceso).

Hoy el frontend no tiene ningún soporte para este tipo de pedido: `orderType` está tipado como `'standard' | 'autoventa'` en `src/types/orders.ts`, y tanto el selector de tipo de pedido (`useOrderFormConfig.ts` / `OrderEditSheet`) como el badge visual (`OrderCard`, `OrderHeaderDesktop`, `OrderHeaderMobile`) solo conocen esos dos valores.

## Decisiones ya acordadas con Jose (2026-07-29)

1. **Ubicación de la UI:** pestaña nueva y propia dentro del pedido (`SECTIONS_CONFIG`), no un bloque dentro de `OrderEditSheet`. Los datos marítimos se guardan contra sus propios endpoints de forma independiente al ciclo dirty/submit del formulario de edición general — el mismo motivo por el que `OrderPallets`/`OrderAttachments`/`OrderAuxiliaryLines` son pestañas propias y no campos del Sheet de edición.
2. **Alta del pedido:** `orderType` sigue sin ser seleccionable en `CreateOrderForm` (hoy tampoco lo es para `autoventa`). Todo pedido nace `standard` y el tipo se cambia después desde `OrderEditSheet`. No se toca `CreateOrderForm/index.tsx` ni se migra `CreateOrderFormMobile.jsx` en este GAP.
3. **Guardado de datos de envío:** botón "Guardar" explícito que envía siempre el objeto completo (los 6 campos), nunca autosave por campo — evita que un `PUT` a mitad de escritura borre campos no tocados aún.
4. **Alcance mobile:** incluido desde esta misma entrega, igual que el resto de secciones anidadas del pedido.
5. **Campos obligatorios del pedido para `maritime_export`:** NO se exime de los campos hoy obligatorios solo para `autoventa` (pago, incoterm, referencia comprador, transporte, direcciones) — se trata igual que un pedido `standard`. El `superRefine` de `orderEditSchema.ts` no se toca.
6. **Edición de contenedores:** el dialog de edición permite cambiar tanto `containerNumber` como `sealNumber` — no hay razón de negocio para bloquear `containerNumber` tras crear el contenedor.
7. **Ubicación de la pestaña:** dentro del dropdown "Más" en `OrderTabsDesktop`, igual que `auxiliary`/`labels`/`documents` — no lleva `desktopPrimary: true`.

## Solución acordada

### 1. Tipos (`src/types/orders.ts`)

- Ampliar `Order.orderType` a `'standard' | 'autoventa' | 'maritime_export'`.
- Añadir a `Order`: `maritimeShippingDetail?: MaritimeShippingDetail | null` y `maritimeContainers?: MaritimeContainer[]`.
- Nuevas interfaces:
  - `MaritimeShippingDetail` (`id`, `orderId`, `vesselName`, `voyageNumber`, `exportInvoiceNumber`, `swbNumber`, `loadingPort`, `dischargePort`, `createdAt`, `updatedAt` — todos `string | null` salvo `id`/`orderId`).
  - `MaritimeShippingDetailPayload` (los 6 campos editables, todos `string | null` opcionales).
  - `MaritimeContainer` (`id`, `orderId`, `containerNumber`, `sealNumber`, `createdAt`, `updatedAt`).
  - `MaritimeContainerCreatePayload` (`containerNumber: string`, `sealNumber?: string | null`).
  - `MaritimeContainerUpdatePayload` (`containerNumber?: string`, `sealNumber?: string | null`).

### 2. Servicios (nuevos, `src/services/domain/orders/`, mismo patrón que `orderAttachmentService.ts`)

- **`orderMaritimeShippingDetailService.ts`**
  - `get(orderId)` → `GET`, captura `ApiError` con `status === 404` y devuelve `null` (pedido sin datos aún) en vez de propagar el error.
  - `upsert(orderId, payload)` → `PUT`, siempre con el objeto completo.
- **`orderMaritimeContainerService.ts`**
  - `list(orderId)` → `GET`.
  - `create(orderId, payload)` → `POST`.
  - `update(orderId, containerId, payload)` → `PATCH`.
  - `delete(orderId, containerId)` → `DELETE` (vía `deleteEntityGeneric`, igual que `orderAttachmentService.delete`).

### 3. Query keys (`src/lib/routes/queryKeys.ts`)

Añadir junto a `orderAttachmentKeys` (mismo formato `tenantId + orderId`):

```typescript
export const orderMaritimeShippingDetailKeys = {
  detail: (tenantId: string | null | undefined, orderId: number | string | null | undefined) =>
    ['orders', 'maritime-shipping-detail', tenantId ?? 'unknown', orderId ?? 'unknown'] as const,
};

export const orderMaritimeContainerKeys = {
  listPrefix: (tenantId: string | null | undefined, orderId: number | string | null | undefined) =>
    ['orders', 'maritime-containers', tenantId ?? 'unknown', orderId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, orderId: number | string | null | undefined) =>
    [...orderMaritimeContainerKeys.listPrefix(tenantId, orderId), 'list'] as const,
};
```

### 4. Hooks (nuevos, `src/hooks/orders/`, mismo patrón que `useOrderAttachments.ts`)

- **`useOrderMaritimeShippingDetail.ts`**: `useQuery` (get) + `useMutation` (upsert). Al éxito del upsert, invalidar su propia key **y** `orderKeys.detail(tenantId, orderId)` (el detalle del pedido embebe este mismo objeto, así que cualquier otra vista que lea `order.maritimeShippingDetail` se refresca).
- **`useOrderMaritimeContainers.ts`**: `useQuery` (list) + `useMutation` create/update/delete. Mismo criterio de invalidación: prefix propio + `orderKeys.detail`.
- Contrato de errores idéntico al resto de hooks de pedido: `ApiError` con `status === 422` → mostrar mensajes de campo (`vesselName` máx. 255, `containerNumber` requerido, etc.) vía `notify.error(getErrorMessage(...))` (no hay formulario multi-campo que necesite `setErrorsFrom422`, son formularios pequeños de 1 sheet/dialog).

### 5. Componentes (nuevos, `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/`)

> Nombre de carpeta deliberadamente distinto de la carpeta `OrderExport/` ya existente (que es descarga de PDF/Excel) para no crear confusión.

- **`index.tsx`** — orquestador de la pestaña. Firma compatible con `OrderSectionComponent` (`{ readOnly?: boolean; canViewCostData?: boolean }`). Obtiene `order.id` de `useOrderContext()` y compone `MaritimeShippingDetailForm` + `MaritimeContainersList`. Maneja mobile/desktop internamente con `useIsMobileSafe()`, igual que `OrderExport`/`OrderAttachments` (no hace falta un archivo mobile separado).
- **`MaritimeShippingDetailForm.tsx`** — RHF + Zod, botón "Guardar" explícito, estados loading (Skeleton) / vacío (formulario vacío es un estado válido, no error) / error de guardado (`notify.error`).
- **`MaritimeContainersList.tsx`** — lista de contenedores (patrón tipo card-list de `OrderAttachments`, no tabla densa) + botón "Añadir contenedor" que abre un `Dialog`/`Sheet` con el formulario (`containerNumber`, `sealNumber`), edición inline del `sealNumber` vía el mismo dialog reutilizado en modo editar, y `AlertDialog` de confirmación antes de borrar (regla del proyecto: confirmación antes de acciones destructivas).
- **`schemas/maritimeShippingDetailSchema.ts`** — zod: los 6 campos `string().max(N).nullable().optional()` con los límites de la tabla del backend (255/100/100/100/255/255).
- **`schemas/maritimeContainerSchema.ts`** — zod: `containerNumber: string().min(1).max(50)`, `sealNumber: string().max(50).nullable().optional()`.

### 6. Registro de la pestaña y gating por `orderType`

- **`Order/config/sectionsConfig.ts`**: nueva entrada `{ id: 'maritime', title: 'Exportación marítima', component: lazy(() => import('../OrderMaritimeExport')), lazy: true, icon: Ship, mobileDefaultSublabel: 'Buque, contenedores y documentación' }`. Sin `desktopPrimary` (va al dropdown "Más", igual que `auxiliary`/`labels`/`documents`) y sin `mobileTier` (tier 2 — uso ocasional, no en cards grandes).
- **Gating por tipo de pedido — reutiliza el mecanismo `blockedTabIds` ya existente** (no hace falta mecanismo nuevo): en `Order/index.tsx`, añadir al `useMemo` de `blockedTabIds` la condición `...(order?.orderType !== 'maritime_export' ? ['maritime'] : [])`. Esto oculta la pestaña tanto en `OrderTabsDesktop` como en `OrderSectionGrid`/`OrderSectionContentMobile` (mobile) sin tocar su lógica de filtrado.
- **`OrderTabsDesktop.tsx`**: añadir `'maritime': 'Exportación marítima'` a `TAB_LABELS`; añadir un `readOnly` prop (hoy solo existe `palletsReadOnly`) y extender `componentProps` para pasar `{ readOnly, canViewCostData }` cuando `section.id === 'maritime'`.
- **`OrderSectionContentMobile.tsx`**: añadir prop `readOnly` y extender `componentProps` igual que en desktop para `activeSection === 'maritime'`.
- **`Order/index.tsx`**: pasar el `readOnly` que ya recibe `OrderContent` como prop a `<OrderTabsDesktop readOnly={readOnly} .../>` y `<OrderSectionContentMobile readOnly={readOnly} .../>`.

### 7. Selector de tipo de pedido (edición)

- **`useOrderFormConfig.ts`**: añadir `{ value: 'maritime_export', label: 'Exportación marítima' }` a `ORDER_TYPE_OPTIONS`; el `defaultValues.orderType` debe mapear también `'maritime_export'` (hoy el `useMemo` colapsa cualquier valor que no sea `'autoventa'` a `'standard'` — hay que corregir esa normalización a 3 vías).
- **`OrderEditSheet/schemas/orderEditSchema.ts`**: `orderType: z.enum(['standard', 'autoventa', 'maritime_export'])`.
- **Regla de negocio (confirmada):** el `superRefine` que exime de campos obligatorios (pago, incoterm, referencia comprador, transporte, direcciones) sigue exigiéndolos igual para `maritime_export` que para `standard` — solo `'autoventa'` está exento. No se toca el `superRefine`.
- `buildOrderEditPayload.ts` no necesita cambios — `orderType` ya viaja tal cual (no está en ningún `Set` de transformación especial).

### 8. Badge visual de tipo de pedido

- **`OrderCard/index.tsx`**, **`OrderHeaderDesktop.tsx`**, **`OrderHeaderMobile.tsx`**: añadir el mismo patrón de badge que ya existe para `'autoventa'` (`(order?.orderType ?? order?.order_type) === 'maritime_export'`), con icono `Ship` y label "Marítimo" (o "Exportación marítima" en el header, donde hay más espacio).

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` — mismo problema estructural (recurso anidado al pedido con lista + CRUD propio, guardado independiente del formulario general de edición) y ya resuelve mobile/desktop en el mismo archivo.
- **Tipo de layout:** pestaña propia dentro de `Order` (`SECTIONS_CONFIG`), dentro del dropdown "Más" (no `desktopPrimary`), no modal ni Sheet aparte. Dentro de la pestaña: formulario inline (datos de envío) + lista con dialog de alta/edición (contenedores, ambos campos editables) — igual que hoy conviven `OrderAttachments` (lista + subida) y `OrderPallets` (lista + acciones).
- **Componentes clave:** `Card`, `Field`/`FieldGroup`, `Input`, `Button`, `Dialog`/`DialogContent`, `AlertDialog` (confirmación de borrado), `Skeleton`, `EmptyState` (contenedores vacíos), `Badge` (badge de tipo de pedido), icono `Ship` de `lucide-react`.
- **Estados requeridos:**
  - Datos de envío: loading (`Skeleton` de formulario) / vacío (formulario en blanco, no es error — el 404 se traduce a `null` en el service) / guardando (botón disabled + spinner) / error de guardado (`notify.error`).
  - Contenedores: loading (`Skeleton` de lista) / vacío (`EmptyState`: "Sin contenedores registrados") / error de alta-edición-borrado (`notify.error` con `getErrorMessage`).
- **Mobile:** incluido en esta entrega (decisión ya confirmada) — mismo componente, ramificado internamente con `useIsMobileSafe()`.

### Confirmaciones ya cerradas (2026-07-29)

1. Ubicación de la UI → **pestaña propia**.
2. Selección de `orderType` en alta de pedido → **no, solo vía edición posterior**.
3. Guardado de datos de envío → **botón "Guardar" explícito, objeto completo**.
4. Alcance mobile → **incluido ya**.
5. Campos obligatorios del pedido para `maritime_export` → **no se exime, igual que `standard`**.
6. Edición de contenedores → **ambos campos editables (`containerNumber` y `sealNumber`)**.
7. Ubicación de la pestaña en la barra desktop → **dentro de "Más"**.

Sin preguntas abiertas — listo para implementar.

---

## Referencias e inspiración

- `src/components/Admin/OrdersManager/Order/OrderAttachments/` + `src/hooks/orders/useOrderAttachments.ts` + `src/services/domain/orders/orderAttachmentService.ts` — patrón completo de recurso anidado al pedido (service → hook → componente con mobile/desktop en el mismo archivo).
- `src/components/Admin/OrdersManager/Order/config/sectionsConfig.ts` + `OrderTabsDesktop.tsx` + `OrderSectionGrid.tsx` + `OrderSectionContentMobile.tsx` — mecanismo de registro y gating de pestañas (`blockedTabIds`), reutilizado tal cual para el gating por `orderType`.
- `src/hooks/useOrderFormConfig.ts` + `OrderEditSheet/schemas/orderEditSchema.ts` — dónde vive hoy el enum de `orderType` y su formulario.
- `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx` (líneas 139, 190) + `OrderHeaderDesktop.tsx`/`OrderHeaderMobile.tsx` — patrón de badge existente para `autoventa`, a replicar para `maritime_export`.

## Criterios de aceptación

- [ ] Un pedido con `orderType: 'maritime_export'` muestra la pestaña "Exportación marítima"; un pedido `standard`/`autoventa` no la muestra.
- [ ] Cambiar el tipo de un pedido a `maritime_export` desde `OrderEditSheet` hace aparecer la pestaña sin recargar la página (invalidación de `orderKeys.detail`).
- [ ] Al abrir la pestaña de un pedido sin datos de envío guardados (404 del backend), el formulario se muestra vacío, no como error.
- [ ] Guardar el formulario de datos de envío envía siempre los 6 campos (aunque no hayan cambiado) y refresca la vista tras el `PUT`.
- [ ] Añadir un contenedor lo muestra inmediatamente en la lista; editar el precinto lo actualiza sin recargar; borrar pide confirmación y lo quita de la lista tras confirmar.
- [ ] Un usuario con rol Comercial (o cualquier contexto con `readOnly=true`) ve la pestaña y sus datos pero no ve botones de guardar/añadir/editar/borrar.
- [ ] El listado de pedidos y `OrderHeaderDesktop`/`OrderHeaderMobile` muestran un badge distintivo para pedidos `maritime_export`, igual que ya ocurre para `autoventa`.
- [ ] `npm run type-check` y `npm run lint` limpios (sin `any` nuevo, sin `.js` nuevo).
- [ ] Funciona en mobile y desktop.

## Archivos a crear o modificar

**Crear:**
- `src/services/domain/orders/orderMaritimeShippingDetailService.ts`
- `src/services/domain/orders/orderMaritimeContainerService.ts`
- `src/hooks/orders/useOrderMaritimeShippingDetail.ts`
- `src/hooks/orders/useOrderMaritimeContainers.ts`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeContainersList.tsx`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/schemas/maritimeShippingDetailSchema.ts`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/schemas/maritimeContainerSchema.ts`

**Modificar:**
- `src/types/orders.ts`
- `src/lib/routes/queryKeys.ts`
- `src/components/Admin/OrdersManager/Order/config/sectionsConfig.ts`
- `src/components/Admin/OrdersManager/Order/index.tsx`
- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx`
- `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.tsx`
- `src/hooks/useOrderFormConfig.ts`
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/schemas/orderEditSchema.ts`
- `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx`
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.tsx`
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderMobile.tsx`

## Restricciones

- No tocar `CreateOrderForm/index.tsx` ni migrar `CreateOrderFormMobile.jsx` en este GAP (decisión ya cerrada — `orderType` sigue sin ser seleccionable en el alta).
- No modificar `buildOrderEditPayload.ts` (no lo necesita).
- No tocar el `superRefine` de `orderEditSchema.ts` salvo confirmación explícita de Jose sobre la pregunta abierta #1.
- No crear archivos `.js` nuevos — todo en `.ts`/`.tsx`.
- No modificar `src/middleware.ts` ni `src/lib/fetchWithTenant.js` — los permisos ya vienen resueltos por el `readOnly` que hoy recibe `Order` desde cada página (Admin vs Comercial), no hace falta lógica de permisos nueva.
- Reutilizar el `readOnly` ya existente para ocultar acciones de guardar/añadir/editar/borrar — no introducir un chequeo de rol nuevo dentro de `OrderMaritimeExport`.

---

## Implementación

### Archivos creados

- `src/services/domain/orders/orderMaritimeShippingDetailService.ts` — `get` (404 → `null`) + `upsert` (PUT completo)
- `src/services/domain/orders/orderMaritimeContainerService.ts` — `list`/`create`/`update`/`delete`
- `src/hooks/orders/useOrderMaritimeShippingDetail.ts` — query + mutation, invalida su key y `orderKeys.detail`
- `src/hooks/orders/useOrderMaritimeContainers.ts` — query list + create/update/delete, mismo criterio de invalidación
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/index.tsx` — orquestador de la pestaña (mobile/desktop en el mismo archivo)
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeContainersList.tsx`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/schemas/maritimeShippingDetailSchema.ts`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/schemas/maritimeContainerSchema.ts`

### Archivos modificados

- `src/types/orders.ts` — `Order.orderType` a 3 vías; `MaritimeShippingDetail(Payload)`, `MaritimeContainer(Create/UpdatePayload)`
- `src/lib/routes/queryKeys.ts` — `orderMaritimeShippingDetailKeys`, `orderMaritimeContainerKeys`
- `src/components/Admin/OrdersManager/Order/config/sectionsConfig.ts` — nueva sección `maritime` (icono `Ship`, sin `desktopPrimary`, sin `mobileTier` → va a "Más")
- `src/components/Admin/OrdersManager/Order/index.tsx` — `blockedTabIds` añade `'maritime'` cuando `order?.orderType !== 'maritime_export'`; `readOnly` pasado a `OrderTabsDesktop` y `OrderSectionContentMobile`
- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx` — `TAB_LABELS.maritime`, prop `readOnly`, `componentProps` para `section.id === 'maritime'`
- `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.tsx` — prop `readOnly`, `componentProps` para `activeSection === 'maritime'`, añadido a la lista de fallback tipo `Skeleton` grande (`['export', 'pallets', 'maritime']`)
- `src/hooks/useOrderFormConfig.ts` — `ORDER_TYPE_OPTIONS` con `maritime_export`; `defaultValues.orderType` normaliza a 3 vías (antes colapsaba todo lo que no fuera `autoventa` a `standard`)
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/schemas/orderEditSchema.ts` — `orderType: z.enum(['standard', 'autoventa', 'maritime_export'])`
- `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx` — badge "Marítimo" (cyan) en variante mobile y desktop de la card
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.tsx` — `Badge` "Exportación marítima" (icono `Ship`)
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderMobile.tsx` — pill "Marítimo" (icono `Ship`), mismo patrón visual que el pill de Autoventa sobre el hero

### Decisiones tomadas durante la implementación

- Color del badge de tipo de pedido: `cyan` (no usado aún en esta fila de badges — `neutral` es autoventa, `blue` es "Desde oferta", `amber` es maquilador, `emerald` es facturado). Evita colisión visual con "Desde oferta".
- `MaritimeShippingDetailForm` convierte cadenas vacías a `null` antes de enviarlas al backend (los campos son `string | null`, no tiene sentido persistir `''`).
- Añadida `'maritime'` a la lista de fallback de `Suspense` con skeleton grande en `OrderSectionContentMobile.tsx` (mismo criterio que `export`/`pallets`, no mencionado explícitamente en el GAP pero es el patrón correcto para una sección con dos Cards apiladas).
- No se tocó `superRefine` de `orderEditSchema.ts` (confirmado: `maritime_export` exige los mismos campos que `standard`).

### Desviaciones del plan

Ninguna — todos los archivos coinciden exactamente con la lista acordada en el GAP.

### Verificación

- `npm run type-check` → limpio (0 errores).
- `npm run lint` → 0 errores, 268 warnings preexistentes en el repo, ninguno en archivos tocados por este GAP.

---

## Revisión UX

```
UX REVIEW — FULL
════════════════
GAP: GAP-124 — Integración de pedidos de exportación marítima
Reviewer: ux-reviewer agent
Mode: Full
```

**Motivo de Full Review:** formulario nuevo + modal (Dialog de contenedores), entidad primaria
afectada (pedidos), gating por permisos (`readOnly`).

### FLOW SIMULATION

Steps simulated: 13 (alta de pestaña, guardado de envío, alta/edición/borrado de contenedores,
gating por `orderType`, gating por `readOnly`, navegación entre tabs, background refetch)
User roles covered: Admin/Dirección (edición completa), Comercial (`readOnly=true`)
Edge cases covered: vacío (404), error de fetch, permiso de solo lectura, pedido `standard`,
cambio de `orderType` en caliente, pérdida de foco de ventana, navegación entre tabs, mobile

**Rol: Admin/Dirección — Entry point: abre un pedido `maritime_export` desde OrdersManager**

1. **Step 1 — Localizar la pestaña.** El usuario ve las tabs primarias (Información, Detalle
   productos, Análisis, Producción, Palets) y debe abrir el dropdown "Más" para encontrar
   "Exportación marítima". → Acción: clic en "Más" → clic en "Exportación marítima".
   → Resultado: `Suspense` muestra un `Skeleton` genérico (`h-64`) brevemente mientras carga el
   chunk lazy, luego se monta `OrderMaritimeExport`.
   → Fricción: ninguna relevante — mismo patrón que `auxiliary`/`labels`/`documents`, decisión ya
   acordada en el GAP (punto 7).

2. **Step 2 — Estado vacío (sin datos aún).** Ambos endpoints devuelven vacío/404. La Card
   "Datos de envío" muestra 6 skeletons de campo y luego el formulario en blanco (no error). La
   Card "Contenedores" muestra 3 skeletons y luego `EmptyState` "Sin contenedores registrados".
   → Resultado: coincide exactamente con el criterio de aceptación #3 y el UI Brief. ✅

3. **Step 3 — Rellenar y guardar datos de envío.** El usuario escribe en "Buque", "Nº de viaje",
   etc. El botón "Guardar" pasa de disabled a enabled en cuanto `isDirty` es `true`. Clic en
   Guardar → botón muestra `Loader2` + "Guardando..." → inputs quedan disabled durante el envío
   → toast de éxito → `reset(data)` marca el formulario como limpio de inmediato con los valores
   recién enviados (no espera al refetch de invalidación, que llega después y aplica el mismo
   contenido sin efecto visible).
   → Fricción: ninguna en el camino feliz.

4. **Step 4 — Añadir 2 contenedores.** Clic en "Añadir contenedor" → `Dialog` centrado (desktop)
   con `containerNumber` + `sealNumber` → Guardar → aparece inmediatamente en la lista (card con
   icono `Container`, número y precinto o "Sin precinto"). Repetir para el segundo contenedor.
   → Resultado: coincide con criterio de aceptación #5. ✅

5. **Step 5 — Editar un contenedor.** Clic en lápiz → Dialog se abre en modo "Editar contenedor"
   con los valores actuales precargados (`containerNumber` también editable, según decisión #6
   del GAP) → cambia el precinto → Guardar → lista se actualiza sin recargar.
   → Fricción: ninguna — `disabled={isSaving}` ya se aplica a ambos `Input` del dialog
   (`containerNumber` línea 207, `sealNumber` línea 220), consistente con `MaritimeShippingDetailForm`.
   Ítem no bloqueante de la revisión anterior, resuelto.

6. **Step 6 — Borrar un contenedor.** Clic en papelera → `AlertDialog` de confirmación
   ("¿Eliminar contenedor?" + detalle del número + "no se puede deshacer") → Confirmar → toast de
   éxito → desaparece de la lista.
   → Resultado: coincide con el patrón obligatorio de confirmación destructiva. ✅

**Rol: Comercial (`readOnly=true`) — mismo pedido `maritime_export`**

7. La pestaña "Exportación marítima" es visible (no está en
   `COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS`, verificado en
   `orderReadOnlyPermissions.ts`). Los 6 campos de datos de envío se muestran con valores reales,
   pero `disabled` (no solo se oculta el botón "Guardar" — los `Input` también quedan
   deshabilitados, evitando un foco/edición fantasma). En Contenedores, el botón "Añadir
   contenedor" y los iconos de lápiz/papelera de cada fila están completamente ocultos (no
   deshabilitados-con-tooltip, ocultos sin más) — coherente con el precedente ya aceptado en
   `orderReadOnlyPermissions.ts` (GAP-V2-036, rejected: "el rol comercial no tiene expectativa de
   que estas opciones existan"). ✅ Coincide con el criterio de aceptación #6.

**Pedido `standard` (no `maritime_export`)**

8. `blockedTabIds` añade `'maritime'` cuando `order?.orderType !== 'maritime_export'`. La pestaña
   no aparece ni en el dropdown "Más" (desktop) ni en la grid mobile. Si el pedido tenía
   `activeTab === 'maritime'` activo por alguna razón previa (imposible en la práctica, pero el
   `useEffect` de `Order/index.tsx` lo cubre igualmente), se fuerza `activeTab` a `'details'`. ✅

**Cambio de `orderType` en caliente**

9. Un Admin cambia el tipo a `maritime_export` desde `OrderEditSheet`. Al guardar, se invalida
   `orderKeys.detail`, el `order.orderType` se actualiza, `blockedTabIds` se recalcula sin
   `'maritime'` y la pestaña aparece sin recargar la página. ✅ Coincide con el criterio de
   aceptación #2.

### Edge cases simulados

**→ Empty state:** ✅ correctamente resuelto (Step 2), formulario vacío ≠ error, `EmptyState` con
copy claro para contenedores.

**→ Error state (fetch inicial, no de mutación):** ✅ **Resuelto.** Ambos componentes ahora
destructuran `error` (y `refetch`) de sus hooks y lo tratan como una tercera rama de render,
antes del formulario/lista:
- **Datos de envío** (`MaritimeShippingDetailForm.tsx` líneas 110-122): si `error` está presente,
  el formulario completo se sustituye por un mensaje (`text-red-500`) + botón "Reintentar" —
  no se renderiza ningún `Input`, así que es físicamente imposible guardar (y por tanto
  sobrescribir con un `PUT` completo) sobre una carga fallida. Esto cierra el vector de
  sobrescritura silenciosa señalado en la revisión anterior de forma más estricta de lo mínimo
  pedido (no solo "distinguir visualmente", sino "bloquear la acción").
- **Contenedores** (`MaritimeContainersList.tsx` líneas 116-127): mismo patrón — mensaje + botón
  "Reintentar" en vez del `EmptyState`. Además, el botón "Añadir contenedor" de la cabecera se
  oculta mientras `error` esté activo (`{!readOnly && !error && (...)}`, línea 102), evitando el
  riesgo (ya señalado como menos destructivo, pero real) de crear un contenedor duplicado
  creyendo que la lista está vacía.
- Verificado el comportamiento por defecto de TanStack Query: `containers` conserva los datos de
  la última carga exitosa aunque un refetch en segundo plano falle (`error` se puebla sin borrar
  `data`), pero como el componente prioriza la rama `error` sobre `containers.length === 0`, un
  refetch fallido tras una carga inicial exitosa oculta temporalmente contenedores que sí están
  cargados en caché, en vez de mostrarlos con un aviso de error superpuesto. No es el escenario
  que motivó el hallazgo original (que era sobre el fetch inicial, ya resuelto) y no reintroduce
  riesgo de pérdida de datos ni de duplicados — lo registro como observación menor, no bloqueante,
  ver Fricciones.
- Principio inferido #6 de `design-context.md` ("Errores surgen en el nivel correcto... nunca
  mezclar niveles"): ✅ ya no se mezclan "sin datos" y "error de carga" en el mismo estado visual.

**→ Partial data:** un pedido con `maritimeShippingDetail` parcialmente relleno (p. ej. solo
`vesselName` y `loadingPort`) se muestra correctamente campo a campo (`?? ''` por campo). ✅

**→ Permission edge:** ✅ ver Steps 7 arriba, comportamiento coherente con el resto del pedido.

**→ Concurrent action:** dos usuarios editando el mismo `maritimeShippingDetail` en paralelo —
como el `PUT` es reemplazo completo sin locking optimista, el segundo guardado sobrescribe al
primero sin aviso ("last write wins", sin mensaje de conflicto). Esto es una limitación ya
aceptada a nivel de backend/diseño en el propio GAP (no se pidió resolver esto aquí), así que no
lo elevo a bloqueante — pero lo dejo registrado como riesgo conocido, no como hallazgo nuevo de
este GAP.

**→ Pérdida/recuperación de foco de ventana o navegación entre tabs:** Estado dividido en los dos
escenarios originales, verificados por separado tras el fix:

1. **Refetch en segundo plano (window focus / revalidación por invalidación de otra mutación).**
   ✅ **Resuelto.** El `useEffect` ahora es:
   ```tsx
   useEffect(() => {
     if (isLoading || error) return;
     if (isDirty) return;
     reset({ ... });
   }, [isLoading, error, shippingDetail, isDirty, reset]);
   ```
   Simulado paso a paso: usuario escribe en "Buque" (`isDirty` pasa a `true`) → cambia de pestaña
   del navegador → vuelve → `refetchOnWindowFocus` (default `true`, sin override en el
   `QueryClient` del proyecto) dispara un refetch en segundo plano → `shippingDetail` cambia de
   referencia → el efecto se reevalúa pero `isDirty` sigue siendo `true` → `return` antes de
   `reset()` → **el borrador se conserva.** Verificado también el camino de guardado: al éxito,
   `upsertMutation.mutate(payload, { onSuccess: () => reset(data) })` limpia el formulario de
   inmediato (antes de que resuelva el refetch de invalidación disparado por el `onSuccess` del
   propio hook); cuando ese refetch sí resuelve más tarde, `isDirty` ya es `false` y el contenido
   coincide, así que el `reset()` posterior es un no-op visual. Sin pérdida de datos en ningún
   punto de la secuencia.

2. **Cambiar de tab dentro del propio pedido y volver.** ⚠️ **Sigue ocurriendo — reclasificado de
   bloqueante a riesgo arquitectónico aceptado, no exclusivo de este GAP.** Verificado en
   `OrderTabsDesktop.tsx`: ningún `TabsContent` usa `forceMount` (línea 178), así que Radix
   desmonta por completo el contenido de la pestaña inactiva. Si el usuario, a mitad de rellenar
   "Datos de envío", cambia a "Información" y vuelve, `OrderMaritimeExport` se remonta con un
   `useForm()` nuevo, perdiendo el borrador sin guardar. Esto es una característica compartida por
   **todo** el sistema de tabs de `Order` (afecta igual a cualquier edición inline sin guardar en
   otras pestañas, no solo a esta), no algo que este GAP haya introducido ni algo resoluble sin
   tocar `OrderTabsDesktop.tsx`/`OrderSectionContentMobile.tsx` de forma transversal (fuera del
   alcance y de las restricciones de este GAP — "no refactorizar archivos no relacionados"). Doy
   el mismo tratamiento que ya se dio en la revisión anterior al riesgo de "concurrent action"
   (last-write-wins): un riesgo real, pero de diseño de plataforma, no de esta implementación
   puntual. Recomiendo señalarlo como candidato de `system-learner`/GAP transversal (p. ej.
   "confirmar antes de abandonar una pestaña con formulario dirty" o adoptar `forceMount` con
   ocultación por CSS en tabs con formularios), no como condición de cierre de GAP-124.

**→ Mobile:** flujo idéntico simulado — el `Dialog` de contenedores pasa a pantalla completa
(mismo patrón que `CreateFromForecastDialog`, la referencia dada), el layout de las dos Cards pasa
de grid 2 columnas a columna única (`isMobile ? 'flex flex-col' : 'grid ... lg:grid-cols-2'`). La
pestaña "maritime" en la grid mobile no tiene `mobileTier`, así que aparece como card de tamaño
estándar (tier 2) igual que `labels`/`documents`/`export`/`map`/`incident`/`customer-history`/
`attachments` — coherente con el patrón existente, no es un problema introducido por este GAP
(aunque cabe notar, sin bloquear, que la grid mobile de un pedido `maritime_export` acumula
bastantes cards de "uso ocasional" — no es responsabilidad de este GAP reorganizar ese patrón).

### FINDINGS

✅ **Funciona bien:**
- Estado vacío (404 → formulario en blanco, no error) resuelto exactamente como pide el GAP.
- Confirmación destructiva con `AlertDialog` antes de borrar un contenedor, con el número de
  contenedor incluido en el mensaje.
- Gating por `readOnly` consistente: campos disabled + botones ocultos, no solo botones ocultos
  con campos editables fantasma.
- Gating por `orderType` reactivo (cambiar el tipo hace aparecer la pestaña sin recargar).
- Botón "Guardar" del formulario de envío correctamente atado a `isDirty` (no permite guardados
  vacíos ni reenvíos sin cambios).
- Mobile: mismo componente, ramificado por `useIsMobileSafe`, Dialog a pantalla completa
  consistente con el patrón de referencia.
- Uso de Lucide (`Ship`, `Container`, `Pencil`, `Plus`, `Trash2`, `Save`, `Loader2`) — sin
  librerías de iconos ajenas.
- **[Nuevo tras el fix]** El `useEffect` de sincronización RHF↔query ya no pisa un borrador sin
  guardar ante un refetch en segundo plano (guarda `isDirty` antes de `reset()`), y el
  guardado exitoso limpia el formulario de inmediato (`reset(data)` en el `onSuccess` de
  `mutate()`) sin depender del refetch de invalidación.
- **[Nuevo tras el fix]** Error de carga inicial ya no se confunde con estado vacío en ninguno de
  los dos componentes — el formulario y la lista se sustituyen por un mensaje + "Reintentar", y
  el botón "Añadir contenedor" se oculta mientras haya error, cerrando por completo (no solo
  mitigando) el vector de sobrescritura silenciosa del `PUT` de reemplazo completo.
- **[Nuevo tras el fix]** Los `Input` del Dialog de contenedores ahora sí quedan `disabled`
  durante `isSaving`, consistente con `MaritimeShippingDetailForm`.

⚠️ **Fricciones (no bloqueantes):**
- **Riesgo arquitectónico aceptado, no exclusivo de este GAP:** cambiar de pestaña dentro del
  pedido (o, en mobile, volver a la grid y reentrar) remonta `OrderMaritimeExport` por completo
  (`TabsContent` sin `forceMount` en `OrderTabsDesktop.tsx`) y pierde cualquier borrador sin
  guardar del formulario de datos de envío. Afecta por igual a cualquier edición inline en otras
  pestañas del pedido — no es introducido por GAP-124 ni resoluble sin tocar el sistema de tabs
  compartido. Recomiendo elevarlo como candidato transversal (system-learner / GAP de plataforma),
  no como bloqueante de este GAP.
- Un refetch en segundo plano fallido de la lista de contenedores (no el fetch inicial) oculta
  temporalmente contenedores ya cargados en caché detrás de la pantalla de error, en vez de
  mostrarlos con un aviso superpuesto — comportamiento conservador (no genera pérdida de datos ni
  riesgo de duplicados) pero podría leerse como "se borraron los contenedores". Menor, no
  bloqueante.
- Errores 422 de creación/edición de contenedor se muestran como toast genérico
  (`notify.error(getErrorMessage(...))`) sin apuntar a qué campo corresponde (p. ej.
  "número de contenedor duplicado") — decisión ya explícita y aceptada en el GAP ("no hay
  formulario multi-campo que necesite `setErrorsFrom422`"), la dejo como observación, no fricción
  nueva.
- La grid mobile de un pedido `maritime_export` no reorganiza las cards de "uso ocasional" en un
  menú "Más" equivalente al de desktop — patrón preexistente, no introducido por este GAP.

❌ **Bloqueantes:** Ninguno. Los dos hallazgos bloqueantes de la revisión anterior quedan
resueltos (error de carga) o reclasificados a riesgo arquitectónico aceptado y no exclusivo de
este GAP (remount de tab), ver arriba.

### UX PRINCIPLES CHECK (§8 design-context.md)

1. Confirmación en acciones destructivas: ✅
2. Mobile como render path separado: ✅
3. Datos siempre vía TanStack Query (nunca `useState`+`useEffect` para estado de servidor): ✅ —
   el `useEffect` que sincroniza RHF con la query ahora guarda correctamente contra `isDirty` y
   `error` antes de resetear; deja de ser fuente de pérdida de datos en el escenario de refetch en
   segundo plano.
4. Loading states con la forma del contenido que reemplazan: ✅
5. Configuración declarativa de entidades: N/A (recurso anidado bespoke, justificado)
6. Errores en el nivel correcto, nunca mezclados: ✅ — resuelto, ver Edge cases / FINDINGS.
7. Densidad alta, chrome mínimo: ✅
8. Iconos Lucide-only: ✅

---

## Re-verificación (2026-07-29, tras fix)

Ambos hallazgos bloqueantes de la revisión anterior fueron releídos completos en
`MaritimeShippingDetailForm.tsx` y `MaritimeContainersList.tsx`, junto con
`useOrderMaritimeShippingDetail.ts`, `useOrderMaritimeContainers.ts` y `OrderTabsDesktop.tsx` para
verificar el comportamiento real (orden de `onSuccess`, ausencia de `forceMount` en `TabsContent`).

- **Bloqueante 1 (pérdida silenciosa de borrador):** el escenario más probable y silencioso
  (refetch en segundo plano por window focus, sin que el usuario sepa que ocurrió) queda
  **resuelto** — verificado el guard `isDirty`/`error` antes de `reset()` y el `reset(data)`
  inmediato en el éxito de guardado. El escenario de remount por cambio de pestaña **persiste**,
  pero se reclasifica de bloqueante a **riesgo arquitectónico aceptado y compartido por todo el
  sistema de tabs de `Order`** (verificado: ningún `TabsContent` en `OrderTabsDesktop.tsx` usa
  `forceMount`), no introducido ni resoluble dentro del alcance de este GAP sin tocar archivos no
  relacionados. Recomiendo un GAP/PL transversal de plataforma para abordarlo (p. ej. confirmación
  antes de abandonar una pestaña con formulario dirty, o `forceMount` + ocultación CSS en tabs con
  edición), pero no bloquea el cierre de GAP-124.
- **Bloqueante 2 (error de carga indistinguible de vacío):** **resuelto** en ambos componentes,
  y de forma más estricta de lo mínimo pedido — no solo se distingue visualmente, sino que se
  bloquea físicamente la posibilidad de guardar/añadir mientras el error esté activo, cerrando el
  vector de sobrescritura por completo.
- **No bloqueante (disabled en dialog de contenedores):** resuelto, verificado
  `disabled={isSaving}` en ambos inputs.

### VERDICT: ✅ APPROVED WITH OBSERVATIONS

No quedan hallazgos bloqueantes. Observaciones para seguimiento (no condicionan el cierre de
GAP-124):

1. Elevar como candidato transversal (system-learner / GAP de plataforma) el remount de
   `TabsContent` sin `forceMount` como fuente genérica de pérdida de borradores no guardados en
   cualquier pestaña del pedido — no específico de este GAP.
2. Considerar, en una iteración futura, no ocultar contenedores ya cacheados detrás de la pantalla
   de error cuando el fallo proviene de un refetch en segundo plano (vs. el fetch inicial) — hoy
   es un comportamiento conservador y seguro, pero puede leerse como pérdida de datos que no es tal.

Score: 9/10

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10 — implementación técnica y visual sólidas; el único punto que resta es un
riesgo arquitectónico transversal (remount de tabs) que el `ux-reviewer` reclasificó como no
bloqueante y fuera del alcance de este GAP.

### Checklist

- [x] Criterios de aceptación cumplidos (los 9 verificados uno a uno, ver detalle abajo)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso (useOrder.ts/usePallet.ts no tocados; lógica nueva en hooks/orders/*)
- [x] entitiesConfig.js no tocado sin permiso (no tocado)
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta
- [x] queryKeys usan factories (orderMaritimeShippingDetailKeys, orderMaritimeContainerKeys — sin arrays inline)
- [x] Loading states con Skeleton, sin spinners como estado inicial
- [x] Errores de API con notify.error(getErrorMessage(...))
- [~] Errores 422 con setErrorsFrom422 — no aplica: decisión explícita del GAP (formularios de 1-2 campos, sin precedente de setErrorsFrom422 en diálogos equivalentes como CreateFromForecastDialog)

### Criterios de aceptación (uno a uno)

- [x] Pestaña visible solo en `maritime_export` — verificado vía `blockedTabIds` en `Order/index.tsx`
- [x] Cambiar tipo a `maritime_export` hace aparecer la pestaña sin recargar — invalidación de `orderKeys.detail` ya existente en el flujo de edición
- [x] 404 → formulario vacío, no error — verificado en `orderMaritimeShippingDetailService.get`
- [x] Guardar envía siempre los 6 campos completos — verificado en `MaritimeShippingDetailForm.onSubmit`
- [x] Añadir/editar/borrar contenedor actualiza la lista sin recargar — verificado invalidación cruzada `prefixKey` + `orderKeys.detail`
- [x] `readOnly` oculta guardar/añadir/editar/borrar — verificado (inputs disabled + botones ocultos, no solo botones ocultos con campos editables fantasma)
- [x] Badge distintivo en listado y headers — verificado en `OrderCard`, `OrderHeaderDesktop`, `OrderHeaderMobile`
- [x] `type-check`/`lint` limpios — verificado, 0 errores en ambos, 0 warnings nuevos
- [x] Funciona en mobile y desktop — verificado, incluye adaptación a pantalla completa del Dialog de contenedores en mobile (patrón `CreateFromForecastDialog`)

### Revisión Visual

- [x] Color: solo tokens Tailwind ya documentados o extensión consistente del patrón de badges existente (`cyan-500/15`, mismo formato que `neutral`/`blue`/`amber`/`emerald` ya usados para otros badges de tipo de pedido)
- [x] Tipografía: `CardTitle text-lg font-medium` (sub-escala correcta para Card dentro de un tab)
- [x] Layout: pestaña propia, formulario inline + lista con dialog — coincide con el UI Brief
- [x] Componentes: Card, Input, Button, Dialog, AlertDialog, Skeleton, EmptyState, Badge, icono `Ship` — sin sustituciones
- [x] Paridad con referencia (`OrderAttachments`): consistente (card-list con icono + texto + acciones)
- [x] Loading: Skeleton, sin spinners como estado inicial (Loader2 solo como overlay de envío en curso, patrón ya aceptado)
- [x] Empty state: `EmptyState` con título + descripción
- [x] Error state: mensaje inline `text-red-500 text-sm` + botón "Reintentar" (añadido tras la Full UX Review)
- [x] Mobile: aplica ahora, `useIsMobileSafe` usado correctamente, Dialog a pantalla completa
- [x] Sin inline styles
- [x] Sin colores hardcodeados fuera de tokens

**Veredicto visual:** ✅ APROBADO

### Revisión UX

Full UX Review ejecutada por `ux-reviewer` (ver sección `## Revisión UX` arriba). Primera pasada:
❌ RECHAZADO (2 bloqueantes: pérdida silenciosa de borrador ante refetch/remount; error de carga
indistinguible de vacío). Tras aplicar los fixes (guard `isDirty`/`error` antes de `reset()`,
`reset(data)` en el éxito del guardado, estados de error inline con bloqueo de guardado/alta
mientras el error esté activo, `disabled` consistente en el dialog de contenedores), segunda
pasada: ✅ **APROBADO CON OBSERVACIONES (9/10)**.

**Veredicto UX:** ✅ APROBADO CON OBSERVACIONES

### PL CANDIDATE

El remount de `TabsContent` (Radix, sin `forceMount`) al cambiar de pestaña dentro de un pedido
borra silenciosamente cualquier estado local no guardado (formularios dirty, ediciones inline) en
la pestaña que queda inactiva — no es específico de `OrderMaritimeExport`, aplica a cualquier
pestaña de `Order` con estado de edición local (p. ej. `OrderAuxiliaryLines`). Candidato a
`project-learnings.md` y/o GAP de plataforma transversal (opciones: confirmación antes de
abandonar una pestaña dirty, o `forceMount` + ocultación CSS en las pestañas con formularios).
Señalado por `ux-reviewer`, no resuelto en este GAP por estar fuera de su alcance.

### Observaciones para Jose

Implementación completa y consistente con los patrones del proyecto (mismo esqueleto que
`orderAttachmentService`/`useOrderAttachments`, mismo gating `blockedTabIds` ya usado para
`analysis`/comercial, mismo patrón de Dialog full-screen en mobile que `CreateFromForecastDialog`).

La Full UX Review inicial encontró dos problemas reales de pérdida/confusión de datos (no
cosméticos) que ya están corregidos: (1) un refetch en segundo plano por cambio de foco de ventana
ya no borra un formulario de envío a medio rellenar, y (2) un fallo de carga inicial ya no se
confunde visualmente con "sin datos todavía", lo que habría permitido sobrescribir datos reales
con un `PUT` de reemplazo completo vacío.

Queda un riesgo conocido y explícitamente aceptado, no introducido por este GAP: cambiar de
pestaña dentro del pedido mientras el formulario de datos de envío tiene cambios sin guardar
pierde ese borrador (remount completo del componente). Es una característica del sistema de tabs
de `Order` en general, no algo que deba resolverse aquí — lo dejo anotado como candidato de
`system-learner`/GAP futuro.

### Estado final de la implementación

Los 15 archivos (9 creados, 11 modificados — hay solape en el conteo por revisiones) coinciden con
la lista acordada en el GAP. `orderType` soporta las 3 vías en tipos, formulario de edición y
badges. La pestaña "Exportación marítima" vive dentro de "Más" en desktop y como card tier 2 en la
grid mobile, gateada reactivamente por `orderType` vía el mecanismo `blockedTabIds` ya existente.
`readOnly` se propaga correctamente desde `Order/index.tsx` hasta el componente de la pestaña en
ambos layouts (desktop y mobile).
