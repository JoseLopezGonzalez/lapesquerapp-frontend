# GAP-128 — Asignación de palets a contenedores marítimos

## Metadata

- **Tipo:** Feature
- **Módulo:** Ventas / Stock
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-30
- **Autor:** Jose

---

## Contexto y problema

Un pedido `maritime_export` puede tener varios `OrderMaritimeContainer` (GAP-124, ya
implementado). El backend añade la posibilidad de repartir los `Pallet` reales del pedido entre
esos contenedores:

- `Pallet.orderMaritimeContainerId: number | null` — contenedor asignado, si alguno. Asignar a un
  contenedor nuevo desvincula automáticamente cualquier asignación previa (no hace falta
  desasignar antes).
- `MaritimeContainer.palletIds: number[] | null` — solo presente cuando la relación viene cargada
  (p. ej. detalle del pedido); `null` si no se cargó.

Endpoints nuevos:

- `PATCH /orders/{order}/pallets/{pallet}/maritime-container` — `{ containerId: number | null }`.
  `null` desasigna. 404 si el contenedor no es del mismo pedido o el palet no pertenece al pedido
  de la URL. `200` con `{ message, data: Pallet }`.
- `POST /orders/{order}/maritime-containers/{container}/pallets` — `{ palletIds: number[] }`,
  asignación en bloque, todo-o-nada. **422** si algún id no pertenece al pedido (con el id
  concreto en `userMessage`).
- `DELETE /orders/{order}/maritime-containers/{container}/pallets` — `{ palletIds: number[] }`,
  desasignación en bloque; ids que no pertenecen a ese contenedor se ignoran silenciosamente (no
  da error).
- `GET /orders/{order}/maritime-containers/{container}/pallets` — palets actualmente asignados a
  ese contenedor (shape completo de `Pallet`), útil para un resumen antes de generar el PDF
  (GAP-129).

El proyecto ya tiene, dentro de `OrderPallets` (gestión de palets del pedido), un patrón completo
de selección múltiple + acciones en bloque que hay que **reutilizar**, no reinventar:

- `useOrderPallets.ts` (`src/components/Admin/OrdersManager/Order/OrderPallets/hooks/`): estado
  `selectedLinkedPalletIds` + `handleToggleLinkedPalletSelection`,
  `handleSelectAllLinkedPallets`, `handleDeselectAllLinkedPallets`, y acciones en bloque ya
  existentes (`handleUnlinkSelectedPallets`, `handleDeleteSelectedPallets`,
  `handlePrintSelectedPalletExpeditionLabels`).
- `OrderPalletsToolbar.tsx`: toolbar que cambia a "modo selección" cuando
  `selectedPalletCount > 0`, con botones/dropdown de acciones en bloque (mobile: barra fija
  inferior con `DropdownMenu`; desktop: fila de botones en el `CardHeader`).
- `OrderPalletTableRow.tsx`: fila con `Checkbox` + columnas de datos del palet.

No existe hoy un endpoint bulk de borrado real en backend para palets (el patrón actual de
`handleDeleteSelectedPallets` itera uno a uno) — aquí sí hay endpoint bulk real (POST/DELETE de
`.../pallets`), así que la implementación es más directa que ese precedente.

## Solución acordada

### 1. Tipos

- `src/types/orders.ts`: `MaritimeContainer.palletIds?: (number | string)[] | null`.
- Tipo de `Pallet` usado en `OrderPalletTableRow.tsx` (`OrderPalletTableRowData`, definido
  localmente en ese archivo) y el `PalletState`/tipo que exponga `useOrderContext().pallets`:
  añadir `orderMaritimeContainerId?: number | string | null` — confirmar en
  `src/context/OrderContext` cuál es el tipo real de `pallets` antes de tocarlo (puede ser
  `unknown[]` o un tipo más laxo; añadir el campo donde corresponda sin romper el resto).

### 2. Service

En `src/services/domain/orders/` (nuevo archivo `orderMaritimeContainerPalletService.ts`, o
extender `orderMaritimeContainerService.ts` existente si encaja mejor por cohesión — decidir en
implementación):

- `assignPallet(orderId, palletId, containerId)` → `PATCH .../pallets/{pallet}/maritime-container`.
- `assignPalletsToContainer(orderId, containerId, palletIds)` → `POST .../maritime-containers/{container}/pallets`.
- `unassignPalletsFromContainer(orderId, containerId, palletIds)` → `DELETE .../maritime-containers/{container}/pallets`.
- `getContainerPallets(orderId, containerId)` → `GET .../maritime-containers/{container}/pallets`.

### 3. Hook — extender `useOrderPallets.ts`

- Nueva mutation/handler `handleAssignSelectedPalletsToContainer(containerId: number | string)`
  que llama a `assignPalletsToContainer` con `selectedLinkedPalletIds`, con manejo de 422
  (`userMessage` incluye el id concreto que falla — mostrarlo tal cual vía
  `notify.error(getErrorMessage(...))`, igual que el resto de errores del hook), y tras éxito
  invalida la query de contenedores (`orderMaritimeContainerKeys`) y `orderKeys.detail` (el
  detalle del pedido embebe `maritimeContainers`).
- Nuevo handler `handleUnassignPalletFromContainer(palletId)` (individual, vía el endpoint PATCH)
  para el selector inline de cada fila (ver punto 5).
- Exponer `maritimeContainers` (de `order.maritimeContainers` vía `useOrderContext()`) para que
  el componente de toolbar/dropdown pueda listar los contenedores disponibles.

### 4. `OrderPalletsToolbar.tsx`

- Nuevo prop `maritimeContainers?: MaritimeContainer[]` y `onAssignSelectedToContainer?:
  (containerId) => void`.
- Solo se renderiza cuando `order.orderType === 'maritime_export'` **y** hay al menos 1
  contenedor: un `DropdownMenu` "Asignar a contenedor ▾" listando `containerNumber` de cada
  contenedor, visible en modo selección (junto a los botones ya existentes de
  desvincular/eliminar/imprimir), tanto en la fila de botones desktop como en el `DropdownMenu`
  mobile ya existente.
- Si no hay contenedores creados todavía, no mostrar la opción (evitar un dropdown vacío) — el
  usuario debe crear al menos un contenedor primero (desde la pestaña "Exportación marítima").

### 5. `OrderPalletTableRow.tsx`

- Nueva columna (solo visible cuando `order.orderType === 'maritime_export'`, pasada como prop
  `showContainerColumn`): muestra el `containerNumber` del contenedor asignado (resuelto por el
  padre desde `maritimeContainers` + `pallet.orderMaritimeContainerId`) o "Sin asignar" si es
  `null`. No añadir un selector inline por fila en esta entrega (la asignación es siempre vía
  selección múltiple + toolbar, ya cubierto por el punto 4) — mantener la fila simple.

### 6. `MaritimeContainersList.tsx`

- Mostrar, junto a cada contenedor, un contador de palets asignados (derivado de
  `container.palletIds?.length ?? 0`) para dar visibilidad sin necesitar un endpoint adicional en
  el primer render (el detalle del pedido ya trae `palletIds` cuando la relación está cargada).

---

## UI Brief

- **Vista de referencia:** el propio `OrderPallets` (selección múltiple + `OrderPalletsToolbar`)
  ya resuelve exactamente este patrón de interacción (checkbox por fila → modo selección → acción
  en bloque desde dropdown/botones) para "desvincular"/"eliminar"/"imprimir" — se extiende con una
  acción más, no se construye un patrón nuevo.
- **Tipo de layout:** inline dentro de la tabla/toolbar ya existente — no modal, no Sheet nuevo.
  La selección del contenedor destino es un `DropdownMenu` (no un Dialog), igual que el resto de
  acciones en bloque del proyecto que no requieren más de 1 decisión del usuario.
- **Componentes clave:** `DropdownMenu`/`DropdownMenuItem` (ya usados en el toolbar), `Checkbox`
  (ya usado en la fila), `Badge` opcional para el contador de palets en `MaritimeContainersList`.
- **Estados requeridos:** loading del propio botón/acción mientras la mutation está en curso
  (mismo patrón `isPending` → `Loader2` + texto "Asignando..." que ya usan
  `isUnlinkingSelected`/`isDeletingSelected`); error 422 vía `notify.error` con el `userMessage`
  del backend (incluye el id del palet problemático).
- **Mobile:** el dropdown de acciones en bloque ya existe en la barra fija inferior mobile — la
  opción "Asignar a contenedor" se añade ahí, sin layout nuevo.

### Preguntas de confirmación para Jose

1. Cuando un palet ya está asignado a un contenedor y el usuario lo selecciona junto a otros para
   "Asignar a contenedor X" (un contenedor distinto), ¿debe verse algún aviso previo, o simplemente
   reasignarlo sin más (comportamiento ya confirmado por el backend: "desvincula automáticamente
   cualquier asignación previa")?
   a) Reasignar sin aviso (recomendado — el backend ya lo trata como comportamiento esperado, no
      como un caso destructivo)
   b) Mostrar un `AlertDialog` de confirmación antes de reasignar palets que ya tenían contenedor

2. La columna "Contenedor" en la tabla de palets (punto 5), ¿debe ser visible también en la vista
   mobile (cards), o queda solo en desktop por ahora?
   a) Visible en ambos (mobile y desktop)
   b) Solo desktop en esta entrega

Responde con el número y la letra (ej. "1a, 2a") — el Implementador no empieza hasta tener
respuesta.

---

## Referencias e inspiración

- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts` (líneas 95,
  194-307) — patrón exacto de selección + acciones en bloque a extender.
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx` —
  patrón exacto de toolbar/dropdown de acciones en bloque (mobile y desktop).
- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.tsx` — fila a
  extender con la columna de contenedor.
- `src/services/domain/orders/orderMaritimeContainerService.ts` — service hermano, mismo patrón
  de endpoints anidados al pedido.

## Criterios de aceptación

- [ ] Seleccionar 1+ palets en la tabla de palets de un pedido `maritime_export` y elegir "Asignar
      a contenedor X" desde el dropdown los asigna correctamente; la tabla refleja el contenedor
      asignado sin recargar la página.
- [ ] Asignar un palet que ya estaba en otro contenedor lo reasigna (comportamiento del backend,
      sin acción extra del frontend).
- [ ] Un 422 (palet de otro pedido) muestra el `userMessage` exacto del backend y no asigna ningún
      palet de la selección (todo-o-nada, igual que el backend).
- [ ] La opción "Asignar a contenedor" no aparece si el pedido no es `maritime_export`, o si no
      hay ningún contenedor creado todavía.
- [ ] `MaritimeContainersList.tsx` muestra el contador de palets asignados por contenedor.
- [ ] Funciona en mobile y desktop (dropdown de acciones en bloque ya existente en ambos layouts).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Archivos a crear o modificar

**Crear:**
- `src/services/domain/orders/orderMaritimeContainerPalletService.ts` (o extender
  `orderMaritimeContainerService.ts`, a decidir en implementación)

**Modificar:**
- `src/types/orders.ts`
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.tsx`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeContainersList.tsx`
- Posiblemente `src/context/OrderContext` (tipo de `pallets`, solo si es necesario para tipar
  `orderMaritimeContainerId` sin `any`)

## Restricciones

- No introducir un selector inline por fila en esta entrega — la asignación es exclusivamente vía
  selección múltiple + toolbar (decisión ya tomada arriba, punto 5).
- No modificar `src/hooks/useOrder.ts` ni `src/hooks/usePallet.ts` directamente — la lógica nueva
  va en `useOrderPallets.ts` (hook ya específico de esta vista, no el hook gigante genérico de
  pedido/palet).
- No crear archivos `.js` nuevos.
- No implementar el endpoint 4.4 (`GET .../pallets`) como componente de resumen ampliado en esta
  entrega salvo que sea trivial — el contador de `palletIds.length` ya cubre el criterio de
  aceptación mínimo; un resumen con peso/cajas puede ser una iteración posterior si Jose lo pide.
