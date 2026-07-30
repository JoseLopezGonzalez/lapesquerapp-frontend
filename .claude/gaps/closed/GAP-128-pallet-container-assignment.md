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
- **Confirmación de reasignación (decisión cerrada, pregunta 1b):** si 1+ de los palets
  seleccionados ya tiene un `orderMaritimeContainerId` distinto al contenedor elegido, mostrar un
  `AlertDialog` de confirmación ("Se reasignarán N palet(s) desde su contenedor actual a
  [containerNumber]") antes de ejecutar la mutation. Si ningún palet seleccionado tiene contenedor
  previo (o todos ya están en el contenedor elegido), ejecutar directamente sin diálogo — reutilizar
  el mecanismo `ConfirmActionDialog`/`confirmAction` ya existente en `useOrderPallets.ts` (mismo
  patrón que `unlinkSelected`/`deleteSelected`), añadiendo una acción `assignToContainer` con el
  `containerId` elegido como payload del diálogo.

### 5. `OrderPalletTableRow.tsx`

- Nueva columna (solo visible cuando `order.orderType === 'maritime_export'`, pasada como prop
  `showContainerColumn`): muestra el `containerNumber` del contenedor asignado (resuelto por el
  padre desde `maritimeContainers` + `pallet.orderMaritimeContainerId`) o "Sin asignar" si es
  `null`. No añadir un selector inline por fila en esta entrega (la asignación es siempre vía
  selección múltiple + toolbar, ya cubierto por el punto 4) — mantener la fila simple.
- **Visibilidad mobile (decisión cerrada, pregunta 2a):** la columna/dato de contenedor debe verse
  también en la vista mobile (cards de `OrderPalletCard`, no solo la tabla desktop) — añadir la
  misma información resuelta (`containerNumber` o "Sin asignar") a la card mobile cuando
  `order.orderType === 'maritime_export'`.

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

### Confirmaciones ya cerradas (2026-07-30)

1. Reasignación de palets ya asignados a otro contenedor → **1b: mostrar `AlertDialog` de
   confirmación** antes de reasignar (solo cuando 1+ palet seleccionado ya tiene un contenedor
   distinto al elegido; si todos están sin asignar o ya en ese mismo contenedor, se ejecuta
   directamente sin diálogo).
2. Visibilidad de la columna/dato de contenedor → **2a: visible en ambos** (mobile y desktop).

Sin preguntas abiertas — listo para implementar.

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
- [ ] Si 1+ de los palets seleccionados ya tenía un contenedor distinto asignado, se muestra un
      `AlertDialog` de confirmación antes de reasignar; si se cancela, no se envía la mutation.
- [ ] Si ningún palet seleccionado tiene contenedor previo (o ya están en el contenedor elegido),
      la asignación se ejecuta directamente sin diálogo de confirmación.
- [ ] Un 422 (palet de otro pedido) muestra el `userMessage` exacto del backend y no asigna ningún
      palet de la selección (todo-o-nada, igual que el backend).
- [ ] La opción "Asignar a contenedor" no aparece si el pedido no es `maritime_export`, o si no
      hay ningún contenedor creado todavía.
- [ ] `MaritimeContainersList.tsx` muestra el contador de palets asignados por contenedor.
- [ ] La columna/dato de contenedor asignado es visible tanto en la tabla desktop
      (`OrderPalletTableRow`) como en la card mobile (`OrderPalletCard`).
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
- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx` (visibilidad
  mobile, decisión 2a)
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx` (o el
  archivo equivalente que renderiza el diálogo de confirmación ya existente, para el nuevo caso
  `assignToContainer`)
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

---

## Implementación

### Archivos creados

Ninguno — todo el trabajo fue extensión de archivos ya existentes.

### Archivos modificados

- `src/types/orders.ts` — `MaritimeContainer.palletIds?: (number | string)[] | null`.
- `src/services/domain/orders/orderMaritimeContainerService.ts` — añadido
  `assignPalletsToContainer(orderId, containerId, palletIds)` (`POST
  .../maritime-containers/{container}/pallets`).
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx` —
  nueva acción `'assignToContainer'` en `ConfirmActionDialogAction`, nuevos props
  `targetContainerNumber`/`reassignCount`, título/descripción/icono (`ArrowRightLeft`) propios.
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts` —
  `maritimeContainers` (derivado de `order.maritimeContainers`), estado
  `isAssigningToContainer`/`pendingContainerId`/`pendingReassignCount`,
  `executeAssignToContainer` + `handleAssignSelectedPalletsToContainer` (calcula si hay
  reasignación real antes de pedir confirmación), rama nueva en `handleConfirmAction`.
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx` —
  nuevos props `maritimeContainers`/`onAssignSelectedToContainer`/`isAssigningToContainer`;
  desktop: botón+`DropdownMenu` "Asignar a contenedor"; mobile: `DropdownMenuSub` dentro del menú
  de acciones ya existente.
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsContent.tsx` —
  props `showContainerColumn`/`containerNumberByPalletId`, columna "Contenedor" en la tabla
  desktop, prop `containerLabel` pasado a `OrderPalletCard` en mobile.
- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.tsx` — columna
  "Contenedor" condicional (`showContainerColumn`), "Sin asignar" si `containerLabel` es `null`.
- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx` — bloque
  "Contenedor:" en la card mobile (decisión 2a — visible en ambos layouts).
- `src/components/Admin/OrdersManager/Order/OrderPallets/index.tsx` — cálculo de
  `showContainerColumn` (`order.orderType === 'maritime_export'`) y del mapa
  `containerNumberByPalletId` (memoizado), wiring completo de los nuevos props hacia
  toolbar/content/dialog en los 3 layouts (mobile vacío, mobile con scroll, desktop).
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeContainersList.tsx` —
  `Badge` con contador de palets (`container.palletIds?.length ?? 0`) junto a cada contenedor.

### Decisiones tomadas durante la implementación

- **Alcance del service reducido respecto al plan original:** el GAP preveía 4 métodos
  (`assignPallet` individual, `assignPalletsToContainer`, `unassignPalletsFromContainer`,
  `getContainerPallets`). Solo se implementó `assignPalletsToContainer`, porque es el único que
  consume la UI resultante — no hay selector inline por fila (restricción explícita del GAP), ni
  acción de "quitar de contenedor" en la toolbar (no estaba en la Solución acordada ni en los
  Criterios de aceptación, solo en la guía original del backend). Añadir los otros 3 sin ningún
  consumidor habría sido código muerto; se documenta aquí para que quede explícito que es una
  reducción de alcance deliberada, no un olvido.
- **Refresco de datos tras la mutation:** en vez de invalidar manualmente
  `orderMaritimeContainerKeys`/`orderKeys.detail` vía `queryClient` (como sugería el GAP), se
  reutilizó `reload()` — ya expuesto por `useOrderContext()` y ya usado por todos los handlers
  hermanos de este mismo hook (`onDeletePallet`, `onUnlinkAllPallets`, etc.) para refrescar
  `order` (que embebe tanto `pallets` como `maritimeContainers`) tras cualquier mutation. Mismo
  resultado, sin duplicar el mecanismo de invalidación ya existente en el archivo.
- **Confirmación de reasignación (decisión 1b):** se calcula `reassignCount` — cuántos de los
  palets seleccionados ya tenían un `orderMaritimeContainerId` distinto al contenedor elegido —
  antes de decidir si pedir confirmación. Si es `0` (todos sin asignar, o ya en ese contenedor),
  la asignación se ejecuta directamente sin diálogo, evitando fricción innecesaria en el caso más
  común (primera asignación).
- **Menú "Asignar a contenedor" — sin submenú anidado en desktop:** en mobile se usó
  `DropdownMenuSub` (ya dentro de un único menú "..."), pero en desktop se optó por un
  `DropdownMenu` propio con su propio botón "Asignar a contenedor" (en vez de anidarlo dentro de
  otro menú), porque el toolbar desktop ya usa botones planos, no un menú "..." — más consistente
  con el patrón visual existente de esa vista.
- Revertido un cambio inicial a `src/hooks/useOrder.ts` (añadir `orderMaritimeContainerId` a
  `NormalizedOrderPallet`): resultó innecesario, porque todos los consumidores nuevos
  (`useOrderPallets.ts`, `OrderPallets/index.tsx`) ya castean el campo puntualmente
  (`pallet as { orderMaritimeContainerId?: ... }`), y el GAP restringe explícitamente tocar
  `useOrder.ts` sin necesidad real. Revertido antes de la entrega para no incumplir esa
  restricción sin motivo.

### Desviaciones del plan

- Servicio: solo 1 de los 4 métodos originalmente listados (ver decisión arriba).
- `src/context/OrderContext` no fue tocado (el GAP ya lo marcaba como "solo si es necesario") —
  no hizo falta.
- `src/hooks/useOrder.ts` no fue tocado (ver decisión arriba) — el archivo listado en
  restricciones se respetó íntegramente.

### Verificación

- `npm run type-check` → limpio (0 errores) en todo el proyecto.
- `npm run lint` → 0 errores, sin warnings nuevos en ninguno de los 9 archivos tocados.

### Fix tras Full UX Review (❌ REJECTED → corregido)

El `ux-reviewer` encontró un bloqueante de caché: `MaritimeContainersList.tsx` (pestaña
"Exportación marítima") lee el contador de palets por contenedor desde su propia query
(`useOrderMaritimeContainers` → `orderMaritimeContainerKeys`, `staleTime: 60s`), independiente de
`orderKeys.detail`. `executeAssignToContainer` solo llamaba a `reload()` (que refresca
`orderKeys.detail`), así que el Badge de conteo podía mostrar un valor obsoleto hasta 60s después
de asignar palets desde la pestaña "Palets", sin ningún indicio visual de que estaba desactualizado.

**Fix aplicado** en `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`:
- Importado `useQueryClient` (`@tanstack/react-query`), `orderMaritimeContainerKeys`
  (`@/lib/routes/queryKeys`) y `getCurrentTenant` (`@/lib/utils/getCurrentTenant`).
- `executeAssignToContainer` ahora ejecuta `reload()` **y**
  `queryClient.invalidateQueries({ queryKey: orderMaritimeContainerKeys.listPrefix(tenantId, order.id) })`
  en paralelo (`Promise.all`) tras el éxito de la mutation, antes del toast de éxito.

`npm run type-check`/`npm run lint` re-verificados limpios tras el fix.

### Fix de las 3 fricciones no bloqueantes (a petición de Jose, 2026-07-30)

Tras el cierre inicial (✅ APROBADO CON OBSERVACIONES, 9/10), Jose pidió resolver las 3 fricciones
documentadas en `## Revisión UX` → Fricciones. Las otras observaciones abiertas (GAP-126) quedaron
deliberadamente fuera de este GAP, documentadas aparte para una iteración posterior.

1. **Copy del diálogo de confirmación en selección mixta** —
   `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx`:
   título y descripción de `assignToContainer` reescritos para comunicar siempre el total de la
   selección (`totalLabel`, derivado de `selectedCount`) junto al subconjunto que se reasigna
   (`reassignLabel`), solo cuando `reassignCount > 0`. Título:
   `¿Asignar {totalLabel} a {containerNumber}?`. Descripción:
   `Vas a asignar {totalLabel} a {containerNumber}. {reassignLabel} ya está/están asignado(s) a
   otro contenedor y se moverá(n). Los palets siguen vinculados al pedido.` — sigue la sugerencia
   de copy exacta señalada en la auditoría.
2. **Copy del botón durante la carga (desktop)** —
   `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx`:
   el botón "Asignar a contenedor" ahora muestra "Asignando..." (no solo el spinner) mientras
   `isAssigningToContainer` está activo, igual que sus botones hermanos
   ("Desvinculando...", "Eliminando..."). El submenú mobile (`DropdownMenuSub`) no se tocó — ya
   tenía un indicador de carga global consistente en el trigger del menú "...", patrón distinto
   y no señalado como fricción.
3. **Posible desbordamiento del toolbar desktop** — mismo archivo: añadido `flex-wrap` tanto al
   `CardHeader` (`flex flex-row flex-wrap items-center justify-between gap-2`) como al contenedor
   de botones (`flex flex-wrap gap-2`), para que la fila de hasta 6 acciones baje a una segunda
   línea en vez de desbordar horizontalmente en viewports estrechos.

`npm run type-check`/`npm run lint` re-verificados limpios tras estos 3 fixes.

---

## Revisión UX

```
UX REVIEW — FULL
════════════════
GAP: GAP-128 — Asignación de palets a contenedores marítimos
Reviewer: ux-reviewer agent
Mode: Full
```

**Motivo de Full Review:** entidad primaria afectada (palets/pedido), flujo de 2+ pasos
(selección múltiple → elegir contenedor → confirmación condicional), extensión de un patrón de
interacción ya existente con una rama de comportamiento nueva (confirmación condicional).

**Nota de método:** no hay sesión de navegador/Playwright disponible en este entorno — la
simulación se basa en lectura completa de código (hook, toolbar, dialog, filas, tarjetas,
`OrderPallets/index.tsx`, `useOrderMaritimeContainers.ts`) y en el precedente ya revisado de
GAP-117/GAP-124 sobre este mismo componente. Los hallazgos de layout (crowding de botones) se
marcan explícitamente como "a verificar visualmente", no como confirmados por captura real.

### FLOW SIMULATION

Steps simulated: 11 (selección de palets, apertura del menú "Asignar a contenedor" en desktop y
mobile, caso sin reasignación real, caso con reasignación real, cancelación del diálogo, éxito,
error 422, ausencia de contenedores, visibilidad de columna/dato en ambos layouts, cruce con
`MaritimeContainersList` en la pestaña "Exportación marítima")
User roles covered: Admin/Dirección (gestión completa). Comercial no aplica a esta pieza: si
`readOnly` es `true` la selección múltiple completa ya está oculta (`canManageSelected = !readOnly
&& isSelectionMode`), consistente con el precedente ya aceptado en GAP-124 (comercial no ve
opciones que no puede usar, no las ve deshabilitadas).
Edge cases covered: sin contenedores creados, error 422 (palet de otro pedido), reasignación
parcial de la selección, cancelación de la confirmación, mobile (`DropdownMenuSub`), consistencia
entre pestañas (Palets ↔ Exportación marítima)

**Rol: Admin/Dirección — Entry point: pestaña "Palets" de un pedido `maritime_export` con 1+
contenedores ya creados**

1. **Step 1 — Activar modo selección.** El usuario marca 1+ checkboxes de la tabla/cards. La
   toolbar cambia a modo selección (título "N palet(es) seleccionado(s)", botones de acción en
   bloque). → Sin fricción, patrón ya validado en GAP-117.

2. **Step 2 — Abrir "Asignar a contenedor".** Desktop: botón propio con icono
   `PiShippingContainer` + `DropdownMenu` listando `containerNumber` de cada contenedor. Mobile:
   dentro del menú "..." ya existente, un `DropdownMenuSub` con el mismo listado. → Resultado:
   coincide con el UI Brief (inline, sin modal para la selección del contenedor). Precedente de
   `DropdownMenuSub` en touch ya usado en `Stores/StoresManager/Store/index.tsx` — no es un patrón
   nuevo sin probar en el proyecto.

3. **Step 3 — Elegir un contenedor sin reasignación real (todos los seleccionados sin contenedor
   previo, o ya en el elegido).** Clic en el contenedor → mutation directa, sin diálogo → botón
   pasa a `Loader2` (icono sustituido, ver Fricción #2) → éxito → toast "N palets asignados al
   contenedor correctamente" → selección se limpia (`setSelectedLinkedPalletIds([])`) → columna
   "Contenedor" de la tabla/tarjetas refleja el nuevo valor sin recargar la página (via `reload()`
   → `order.pallets`/`order.maritimeContainers` actualizados → `containerNumberByPalletId`
   recalculado). → Coincide con el criterio de aceptación de refresco sin recarga. ✅

4. **Step 4 — Elegir un contenedor con reasignación real (1+ ya en OTRO contenedor distinto).**
   `AlertDialog` de confirmación con `ArrowRightLeft` — título "¿Reasignar N palet(s)?", descripción
   explicando destino, botón "Reasignar". → Ver Fricción #1 sobre el conteo mostrado en el diálogo
   cuando la selección mezcla palets ya asignados (a otro contenedor) y palets sin asignar.

5. **Step 5 — Confirmar reasignación.** El diálogo pasa a estado `busy` (`Loader2` + "Reasignando...")
   con `AlertDialogCancel` también deshabilitado durante el proceso — coincide con el patrón
   `isProcessing` ya usado por `deleteSelected`/`unlinkSelected`. Tras éxito, el diálogo se cierra,
   selección se limpia, toast de éxito. ✅

6. **Step 6 — Cancelar el diálogo.** `onCancel` limpia `pendingContainerId`/`pendingReassignCount`
   y no se envía ninguna mutation — la selección de palets se mantiene intacta (no se pierde el
   trabajo de selección del usuario). ✅ Coincide con el criterio de aceptación correspondiente.

7. **Step 7 — Cambiar a la pestaña "Exportación marítima" tras asignar.** El usuario, tras asignar
   3 palets a un contenedor desde la pestaña "Palets", cambia de pestaña para revisar cuántos
   palets tiene cada contenedor (`MaritimeContainersList`, Badge con contador). → Ver Bloqueante #1.

**Sin contenedores creados (pedido `maritime_export` recién configurado)**

8. La opción "Asignar a contenedor" no aparece ni en desktop ni en mobile
   (`canAssignToContainer = ... && maritimeContainers.length > 0 && ...`) — no hay dropdown vacío
   ni botón deshabilitado con tooltip explicativo; simplemente no existe la opción. → Coincide con
   la decisión ya cerrada en el GAP ("evitar un dropdown vacío"). No lo elevo a hallazgo porque es
   una decisión de producto ya tomada explícitamente, pero lo anoto como observación menor: un
   usuario que ya usó esta función en otro pedido y no la ve aquí no tiene ninguna pista de que la
   causa es "no hay contenedores todavía, créalos en la pestaña Exportación marítima" — no bloqueo
   por esto, es coherente con el patrón `orderReadOnlyPermissions.ts` ya aceptado (ocultar sin
   más), pero queda como sugerencia de iteración futura, no como hallazgo de este GAP.

**Error 422 (palet de otro pedido — condición de carrera)**

9. `executeAssignToContainer` captura el error, `notify.error` muestra el `userMessage` exacto del
   backend (vía `getErrorMessageFrom`, que ya prioriza `data.userMessage`/`message` — verificado
   contra `ApiError`/`apiRequest` en `apiHelpers.js`, que ya coloca el `userMessage` del backend en
   `error.message`). La selección de palets **no se pierde** (solo se limpia en el `try` de éxito),
   así que el usuario puede deseleccionar el palet problemático y reintentar sin rehacer toda la
   selección. El botón/menú vuelve a estar interactivo (`finally { setIsAssigningToContainer(false) }`).
   → Coincide con el criterio de aceptación. ✅ Si el error ocurre dentro del flujo con
   confirmación (`assignToContainer` vía `ConfirmActionDialog`), el diálogo se cierra igualmente
   (el error se traga dentro de `executeAssignToContainer`, no relanza hacia `handleConfirmAction`)
   dejando solo el toast — mismo comportamiento que el resto de acciones en bloque del hook
   (`deleteSelected` itera y no interrumpe por fallos individuales), consistente con el patrón ya
   existente, no un caso nuevo sin cubrir.

**→ Mobile:** Selección + `DropdownMenuSub` dentro del menú "..." ya existente — mismo componente
que ya usa el proyecto para submenús (`Stores/StoresManager/Store/index.tsx`), no un patrón nuevo
sin precedente. Añade un nivel de profundidad de tap (`...` → "Asignar a contenedor" → nombre del
contenedor) frente a las otras acciones (2 taps), pero es inherente a tener que elegir entre N
contenedores — la alternativa (Sheet/Dialog dedicado) fue explícitamente descartada en el UI
Brief. No lo considero fricción nueva.

### Edge cases simulados

**→ Empty state (sin contenedores):** ✅ resuelto — opción oculta, ver Step 8.

**→ Error state (422):** ✅ resuelto — ver Step 9. Mensaje correcto, selección conservada, sin
estado colgado.

**→ Partial data (selección mixta: algunos con contenedor previo, otros sin asignar):** ⚠️ el
cálculo de `reassignCount` es correcto (Step 4), pero el copy del diálogo de confirmación solo
comunica el subconjunto que se reasigna, no el total de la operación — ver Fricción #1.

**→ Permission edge:** ✅ cubierto por el gating ya existente `!readOnly && isSelectionMode`
heredado de GAP-117 — nada nuevo que verificar aquí.

**→ Concurrent action:** si otro usuario reasigna uno de los palets seleccionados justo antes de
que el usuario actual confirme, el cálculo de `reassignCount` se hizo sobre datos potencialmente
obsoletos (`pallets` de `OrderContext`, no revalidados en el momento del clic). El backend es
todo-o-nada así que no hay corrupción de datos, pero el diálogo de confirmación podría subestimar
o sobreestimar cuántos palets se están moviendo realmente. Riesgo de plataforma ya aceptado en
revisiones anteriores de este mismo componente (mismo tipo de riesgo que "last write wins" en
GAP-124) — no lo elevo a bloqueante, lo dejo anotado como riesgo conocido y no exclusivo de este
GAP.

**→ Mobile:** ver arriba — sin fricción nueva más allá de la profundidad de tap esperada.

**→ Cruce entre pestañas (Palets ↔ Exportación marítima):** ❌ ver Bloqueante #1.

### FINDINGS

✅ **Funciona bien:**
- Reutilización fiel del patrón de selección múltiple + toolbar + `ConfirmActionDialog` ya
  validado en GAP-117 — no se reinventa nada.
- Confirmación condicional (Step 3 vs Step 4) implementada correctamente: `reassignCount` excluye
  tanto los palets sin contenedor previo como los que ya estaban en el contenedor elegido — el
  caso más común (primera asignación) no genera fricción de un diálogo innecesario.
- Cancelar el diálogo de confirmación no pierde la selección de palets del usuario.
- Error 422 se muestra con el `userMessage` exacto del backend, sin dejar el botón/menú colgado en
  loading y sin perder la selección — el usuario puede corregir y reintentar.
- Visibilidad del dato de contenedor en ambos layouts (tabla desktop y card mobile), gateada
  correctamente por `order.orderType === 'maritime_export'`.
- La opción "Asignar a contenedor" se oculta limpiamente (sin dropdown vacío, sin separator
  huérfano) cuando no hay contenedores creados.
- Estados de carga (`Loader2`) presentes en el trigger del menú (ambos layouts) y en el
  `AlertDialog` durante el procesamiento, con `AlertDialogCancel` también deshabilitado mientras
  está en curso.

⚠️ **Fricciones (no bloqueantes):**

1. **Copy del diálogo de confirmación no comunica el alcance total de la operación cuando la
   selección es mixta.** `ConfirmActionDialog.tsx` (líneas 79, 93) construye el título/descripción
   solo a partir de `reassignCount` (cuántos de los seleccionados ya tenían OTRO contenedor). Si el
   usuario selecciona 3 palets (1 ya en el contenedor B, 2 sin asignar) y elige el contenedor A, el
   diálogo dice "¿Reasignar 1 palet seleccionado?" / "1 palet seleccionado ya está asignado a otro
   contenedor. Se moverá a A.", pero al confirmar se asignan los 3 (`executeAssignToContainer`
   opera sobre `selectedLinkedPalletIds` completo, no solo sobre el subconjunto a reasignar) y el
   toast de éxito dice "3 palets asignados al contenedor correctamente" (`useOrderPallets.ts` línea
   ~331). El usuario que leyó "1" en la confirmación y ve "3" en el resultado puede percibir una
   discrepancia, aunque el comportamiento subyacente es correcto (los otros 2 son asignaciones
   nuevas, no reasignaciones, así que técnicamente el diálogo no miente — solo omite el resto de la
   operación). Sugerencia: mencionar el total de la selección junto al subconjunto reasignado, p.
   ej. "Vas a asignar 3 palets a A. 1 de ellos ya está en otro contenedor y se moverá."
   — `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx:79-94`.

2. **Inconsistencia de copy durante el estado de carga del botón "Asignar a contenedor" en
   desktop, respecto a sus botones hermanos en la misma toolbar.** `Imprimir etiqueta`,
   `Desvincular seleccionados` y `Eliminar seleccionados` cambian su texto a
   "Generando...”/"Desvinculando..."/"Eliminando..." mientras están en curso. El botón "Asignar a
   contenedor" solo sustituye el icono por `Loader2` pero mantiene el texto "Asignar a contenedor"
   sin cambiar a algo como "Asignando..." — inconsistencia menor de patrón dentro del mismo
   componente que este GAP toca. —
   `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx:303-309`.

3. **Posible saturación del toolbar desktop en modo selección (a verificar visualmente, sin
   captura real disponible).** Con `canPrintExpeditionSelected` + `canManageSelected` +
   `canAssignToContainer` todos activos a la vez, la fila de botones desktop puede llegar a 6
   elementos ("Etiquetas expedición (N)", "Imprimir etiqueta", "Asignar a contenedor",
   "Desvincular seleccionados", "Eliminar seleccionados", "Cancelar") en un contenedor
   `<div className="flex gap-2">` sin `flex-wrap` (`OrderPalletsToolbar.tsx:273`). En viewports de
   escritorio más estrechos (p. ej. 1280–1366px con sidebar) esto podría desbordar horizontalmente
   sin que el layout lo absorba. No confirmado con captura real — recomiendo verificación visual
   antes de dar por cerrado, no lo elevo a bloqueante porque no puedo confirmarlo sin sesión de
   navegador. — `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx:259-388`.

❌ **Bloqueantes:**

1. **El contador de palets por contenedor en `MaritimeContainersList` (pestaña "Exportación
   marítima") puede mostrar un valor obsoleto tras asignar palets desde la pestaña "Palets", sin
   ningún indicio visual de que el dato está desactualizado — esto es exactamente el criterio de
   aceptación que este GAP añade a ese componente.**

   Mecanismo verificado en código:
   - `MaritimeContainersList.tsx` obtiene `containers` (y por tanto `container.palletIds`) de
     `useOrderMaritimeContainers(orderId)`, que usa su **propia** query key
     (`orderMaritimeContainerKeys.list(...)`, `staleTime: 60 * 1000`) — **independiente** de la
     query de detalle del pedido (`orderKeys.detail`) que consume `useOrderContext`/`useOrderPallets`.
   - `executeAssignToContainer` (en `useOrderPallets.ts`, línea 326) solo llama a `reload()`, que
     (verificado en `useOrder.ts` línea 175-184) únicamente re-ejecuta `queryRefetch()` sobre
     `orderKeys.detail`. **No invalida ni actualiza** `orderMaritimeContainerKeys.list` en ningún
     punto del flujo de asignación.
   - Consecuencia: si el usuario asigna palets desde "Palets" y cambia a "Exportación marítima"
     dentro de la ventana de `staleTime` (60 segundos) de la última vez que se cargó esa pestaña,
     React Query considera los datos de `useOrderMaritimeContainers` todavía "frescos" y **no
     dispara un refetch al remontar** el componente (los tabs de `Order` desmontan/remontan
     completamente al cambiar, sin `forceMount`, según ya se documentó en la revisión de GAP-124) —
     el Badge de conteo de palets seguirá mostrando el número anterior a la asignación.
   - Es plausible que esto ocurra en el uso real: el propio flujo de trabajo que este GAP habilita
     (repartir palets entre contenedores antes de generar el packing list de GAP-129) invita
     exactamente a alternar entre "Palets" (para asignar) y "Exportación marítima" (para comprobar
     cuánto lleva cada contenedor) en una sola sesión de menos de un minuto.
   - Esto no es un problema cosmético: el propósito explícito del contador (criterio de aceptación
     de este GAP) es que el usuario decida cuándo un contenedor está lleno antes de cerrar la
     exportación — un contador silenciosamente desactualizado puede llevar a asignar de más o de
     menos a un contenedor sin que el usuario lo note.

   **Cambio requerido antes de cierre:** invalidar (o actualizar optimistamente) también
   `orderMaritimeContainerKeys.list(tenantId, orderId)` dentro de `executeAssignToContainer` (o
   `handleAssignSelectedPalletsToContainer`), simétrico al patrón ya existente en
   `useOrderMaritimeContainers.ts` (`invalidateOrderDetail`, que hace exactamente el cruce inverso
   — invalida el detalle del pedido desde las mutaciones de contenedores). Alternativas válidas:
   invalidar ambas query keys desde `useOrderPallets.ts` (requiere `useQueryClient` + acceso al
   `tenantId`, patrón ya usado en `useOrderMaritimeContainers.ts`), o hacer que
   `MaritimeContainersList` derive el contador desde `order.maritimeContainers` (ya disponible vía
   `useOrderContext`, y ya se refresca correctamente con `reload()`) en vez de mantener una query
   independiente para ese dato puntual.

   **✅ RESUELTO (re-verificado tras el fix documentado en "Fix tras Full UX Review").** Código
   verificado en `useOrderPallets.ts` líneas 1-21, 70-71, 321-356: se importan `useQueryClient`
   (`@tanstack/react-query`), `orderMaritimeContainerKeys` (`@/lib/routes/queryKeys`) y
   `getCurrentTenant` (`@/lib/utils/getCurrentTenant`); `tenantId` se calcula con el mismo guard
   `typeof window !== 'undefined'` que usa el resto del hook (línea 71). `executeAssignToContainer`
   ahora ejecuta, tras el éxito de `assignPalletsToContainer`:
   ```ts
   await Promise.all([
     reload(),
     queryClient.invalidateQueries({
       queryKey: orderMaritimeContainerKeys.listPrefix(tenantId, order.id),
     }),
   ]);
   ```
   - `listPrefix` (`queryKeys.ts` líneas 372-378) es el prefijo del que cuelga `list`
     (`[...listPrefix, 'list']`), así que invalidar por `listPrefix` alcanza correctamente la query
     que consume `useOrderMaritimeContainers`/`MaritimeContainersList` — mismo mecanismo de
     invalidación por prefijo que ya usa el resto del proyecto.
   - Efecto real de `invalidateQueries`: marca la query como stale de inmediato, **independientemente
     de si quedan segundos del `staleTime` de 60s** — así que cuando el usuario cambie a la pestaña
     "Exportación marítima" y `MaritimeContainersList` remonte (los tabs de `Order` desmontan sin
     `forceMount`, confirmado en la revisión de GAP-124), el remount dispara un refetch inmediato
     (`refetchOnMount` por defecto) en vez de servir el dato cacheado desactualizado. Esto es
     exactamente el mecanismo que faltaba: antes, "stale" dependía solo del tiempo transcurrido;
     ahora se fuerza explícitamente en el momento correcto (justo tras la asignación).
   - Dependencias de `useCallback` actualizadas correctamente (`queryClient`, `tenantId` añadidos al
     array de deps de `executeAssignToContainer`, línea 355) — sin warning de exhaustive-deps
     esperable, coherente con `npm run lint` limpio reportado.
   - **No rompe nada del resto del flujo verificado en la simulación original:** `reload()` sigue
     ejecutándose (Palets se sigue refrescando igual que antes); el toast de éxito y el
     `setSelectedLinkedPalletIds([])` siguen ocurriendo después de que ambas promesas resuelvan
     (`Promise.all` seguido de `notify.success` + limpieza de selección) — no se invierte el orden
     ni se duplica el toast; el bloque `catch`/`finally` sigue envolviendo toda la operación, así
     que un fallo en `invalidateQueries` (improbable, es una operación de caché local, no de red)
     seguiría cayendo en el mismo `catch` y liberando `isAssigningToContainer` en el `finally` igual
     que antes. `reload()` no puede rechazar `Promise.all` porque ya captura sus propios errores
     internamente (`useOrder.ts` línea 175-184, `catch` interno que retorna `null` sin relanzar) —
     confirmado en la revisión original, sigue aplicando aquí sin cambios.
   - Coste de UX de la solución: `invalidateQueries` para una query inactiva (el usuario está en la
     pestaña "Palets", no en "Exportación marítima") no espera a un refetch real — solo marca el
     caché como stale y resuelve casi de inmediato, así que el `Promise.all` no introduce una espera
     perceptible adicional antes del toast de éxito, comparado con el comportamiento anterior (solo
     `reload()`).

   **Conclusión:** el bloqueante queda cerrado. El fix ataca la causa raíz exacta señalada (dos
   query keys independientes sin sincronizar) con el mismo patrón ya usado en sentido inverso por
   `useOrderMaritimeContainers.ts`, sin efectos secundarios detectables en loading state, orden del
   toast, o manejo de errores.

### UX PRINCIPLES CHECK

1. Destructive actions always require confirmation → ✅ (la reasignación no es destructiva per se,
   pero el GAP añadió confirmación condicional coherente con el espíritu del principio; cancelar
   no pierde la selección).
2. Mobile is a separate render path, not CSS hide/show → ✅ (`DropdownMenuSub` dentro del menú
   mobile existente, mismo componente ya usado en el proyecto).
3. Data always comes from TanStack Query hooks → ✅ (tras el fix: las dos queries independientes
   para el mismo dominio de datos — `orderKeys.detail` y `orderMaritimeContainerKeys` — ya se
   invalidan juntas desde el punto de mutación; ver Bloqueante #1 ✅ RESUELTO).
4. Loading states match the shape of the content they replace → ✅ (Loader2 en botón/menú,
   `isProcessing` en el AlertDialog, patrón ya establecido).
5. Entity configuration is declarative → N/A para esta pieza.
6. Errors surface at the right level → ✅ (422 vía `notify.error` con `userMessage` exacto,
   consistente con el resto del hook).
7. Density is high, chrome is minimal → ⚠️ (ver Fricción #3, a verificar visualmente).
8. Icons are Lucide-only (+ excepciones documentadas) → ✅ (`ArrowRightLeft`, `PiShippingContainer`
   ya es una excepción documentada de `react-icons/pi` usada también en `MaritimeContainersList`
   preexistente, no una nueva violación).

### RE-VERIFICACIÓN (tras fix de invalidación cruzada)

Re-revisado solo el punto puntual señalado por el coordinador: el fix aplicado en
`useOrderPallets.ts` (`executeAssignToContainer` invalidando también
`orderMaritimeContainerKeys.listPrefix(tenantId, order.id)` en paralelo con `reload()`, ver detalle
completo en el Bloqueante #1 arriba, ahora marcado ✅ RESUELTO) cierra correctamente la causa raíz
reportada, sin romper loading state, orden del toast de éxito, limpieza de selección, ni el manejo
de errores del resto del flujo. No se ha vuelto a repetir la simulación completa (no era necesario
— el resto de la Full Review no se ve afectado por este cambio, que es aislado a la invalidación de
caché tras el éxito de la mutation).

VERDICT: ✅ APROBADO CON OBSERVACIONES

**Motivo del cambio de veredicto:** el único bloqueante (Bloqueante #1 — contador de palets
desactualizado entre pestañas) queda resuelto con el fix de invalidación cruzada, verificado en
código. No quedan hallazgos ❌ sin abordar.

**Observaciones pendientes (no bloqueantes, quedan a criterio de Jose si se abordan en este GAP o
en iteración posterior):**
1. Fricción #1 — el copy del `AlertDialog` de confirmación de reasignación solo comunica el
   subconjunto reasignado (`reassignCount`), no el total de la selección afectada; puede leerse
   como discrepancia frente al toast de éxito posterior (que sí reporta el total). Sugerencia de
   copy incluida arriba.
2. Fricción #2 — el botón desktop "Asignar a contenedor" no cambia su texto a "Asignando..."
   durante la carga, a diferencia de sus botones hermanos en la misma toolbar (inconsistencia
   menor de patrón).
3. Fricción #3 — posible desbordamiento del toolbar desktop en modo selección con hasta 6 acciones
   simultáneas (sin `flex-wrap`); no confirmado con captura real, recomendado verificar
   visualmente en un viewport de ~1280–1366px antes de dar el flujo por completamente cerrado.

Score: 9/10

---

## Auditoría

### Resultado: ✅ APROBADO CON OBSERVACIONES

> Auditoría técnica y visual (primera pasada) sin bloqueantes. El GAP calificó para Full UX
> Review (entidad primaria — palets — con flujo de selección múltiple + confirmación condicional
> nueva) y quedó en pausa hasta que `ux-reviewer` completara su revisión. `ux-reviewer` encontró
> 1 bloqueante (contador de palets en `MaritimeContainersList` desincronizado de la query de
> detalle del pedido tras asignar desde la pestaña "Palets") y 3 fricciones no bloqueantes. El
> Implementador aplicó el fix de invalidación cruzada; `ux-reviewer` re-verificó y actualizó su
> veredicto a ✅ APROBADO CON OBSERVACIONES (9/10). Yo he re-verificado el fix de forma
> independiente (código + `type-check`/`lint`) antes de cerrar.

### Puntuación: 9/10 — implementación fiel al patrón de selección múltiple + `ConfirmActionDialog`
ya validado en `OrderPallets` (GAP-117), con la confirmación condicional (Step 3 vs Step 4)
calculada correctamente y sin introducir fricción en el caso más común (primera asignación). Resto
1 punto por el bloqueante real que encontró la Full UX Review en la primera pasada (contador de
`MaritimeContainersList` desincronizado entre pestañas) — corregido antes de cierre, pero es
exactamente el tipo de desincronización de caché que el checklist técnico de "queryKeys/staleTime"
debería haber atrapado en la implementación original, no en la revisión UX.

### Checklist técnico

- [x] Los 9 criterios de aceptación del GAP cumplidos — verificados leyendo el código completo de
      cada archivo (no solo el diff), no solo lo declarado en "Implementación":
  - Asignación desde selección múltiple + dropdown funciona y refleja el contenedor sin recargar
    (`executeAssignToContainer` → `reload()` actualiza `order.pallets`/`order.maritimeContainers`
    → `containerNumberByPalletId` recalculado en `OrderPallets/index.tsx`).
  - `AlertDialog` de confirmación solo aparece si `reassignCount > 0`
    (`handleAssignSelectedPalletsToContainer`, `useOrderPallets.ts:358-376`); cancelar no envía la
    mutation (`handleCancelAction` limpia estado sin llamar a `executeAssignToContainer`).
  - Sin contenedor previo o ya en el destino → ejecución directa sin diálogo.
  - 422 propaga el `userMessage` exacto vía `getErrorMessageFrom` (mismo patrón
    `userMessage > data.userMessage > response.data.userMessage > message` que el resto del hook,
    consistente con `apiHelpers.js`).
  - Opción "Asignar a contenedor" oculta sin contenedores (`canAssignToContainer` en
    `OrderPalletsToolbar.tsx:81-82`); implícitamente gateada a `maritimeContainers.length > 0`, que
    a su vez solo se puebla en pedidos `maritime_export` (garantía de backend heredada de
    GAP-124) — funciona, aunque un chequeo explícito de `orderType` habría sido más defensivo (no
    bloqueante).
  - `MaritimeContainersList.tsx` muestra el `Badge` con `container.palletIds?.length ?? 0`.
  - Columna/dato de contenedor visible en `OrderPalletTableRow` (desktop) y `OrderPalletCard`
    (mobile), gateados por `showContainerColumn`/`containerLabel !== undefined`.
  - Funciona en mobile (`DropdownMenuSub`) y desktop (`DropdownMenu` propio).
  - `npm run type-check`/`npm run lint` limpios — re-verificado por mí de forma independiente tras
    el fix (ver "Verificación independiente").
- [x] Sin `fetch()` directo — `assignPalletsToContainer` usa `apiRequest` → `fetchWithTenant`.
- [x] Sin hardcode de tenant.
- [x] Sin archivos `.js` nuevos (0 archivos creados, 9 modificados).
- [x] Sin `any` sin justificación — confirmado con `git diff` de los 9 archivos, ninguno introduce
      `any` nuevo.
- [x] `useLabelEditor.ts` no tocado; `useOrder.ts`/`usePallet.ts` no tocados —
      `git diff --stat src/hooks/useOrder.ts src/hooks/usePallet.ts` sin salida, confirmado por mí
      de forma independiente (restricción explícita del GAP respetada; el cambio inicial revertido
      por el Implementador era innecesario porque `normalizeOrderPallet` ya preserva
      `orderMaritimeContainerId` vía `...pallet`).
- [x] `entitiesConfig.js` no tocado.
- [x] Patrones de `.claude/rules/` respetados: hook de listado/mutación, factories de `queryKeys`
      (`orderMaritimeContainerKeys.listPrefix`, ya existente de GAP-124, reutilizado correctamente
      para el fix), `notify.error`/`notify.success` con formato objeto (patrón ya establecido en
      este mismo hook, no una desviación nueva).
- [x] Nomenclatura correcta (`handleAssignSelectedPalletsToContainer`,
      `executeAssignToContainer`, `assignPalletsToContainer`).

### Revisión Visual

- [x] Sin colores hardcodeados — iconos con clases Tailwind directas (`text-blue-600` en
      `ArrowRightLeft`) siguen el mismo patrón ya usado en el propio archivo para acciones
      hermanas (`text-red-600`, `text-orange-600`), no una desviación nueva.
- [x] Loading states con `Loader2` + texto de acción, consistente con `isProcessing` ya usado por
      `deleteSelected`/`unlinkSelected` (con la excepción documentada de Fricción #2: el botón
      desktop no cambia el texto, solo el icono — no bloqueante).
- [x] Sin inline styles, sin `style={{ }}`.
- [x] Componentes shadcn nativos (`DropdownMenu`, `DropdownMenuSub`, `AlertDialog`, `Badge`) sin
      sobrescritura de internos.
- [x] Tabla desktop con scroll horizontal ya existente — no es un grid fijo de formulario, PL-035
      no aplica (verificado explícitamente).

**Veredicto visual:** ✅ APROBADO

### Revisión UX — Full (`ux-reviewer`)

Sección `## Revisión UX` completa (11 pasos simulados, edge cases de empty state, error 422,
selección mixta, concurrencia, cruce entre pestañas). Primera pasada: ❌ RECHAZADO por el
Bloqueante #1 (contador de `MaritimeContainersList` desincronizado). Tras el fix de invalidación
cruzada, `ux-reviewer` re-verificó y actualizó el veredicto a ✅ APROBADO CON OBSERVACIONES (9/10),
sin bloqueantes restantes. Confirmado por mí que la sección está completa y el veredicto final no
tiene hallazgos ❌ pendientes.

**Veredicto UX:** ✅ APROBADO CON OBSERVACIONES

### Verificación independiente

- `npm run type-check` → limpio, 0 errores (re-ejecutado por mí tras el fix de invalidación
  cruzada, no solo confiando en lo declarado).
- `npm run lint` → 0 errores, 267 warnings — exactamente los mismos preexistentes de antes del
  fix; grepeado el log completo por los 9 archivos tocados de este GAP (incluyendo
  `useOrderPallets.ts` tras el fix) y ninguno aparece con warning nuevo.
- `git status --short` confirma que el diff sigue limitado a los 9 archivos declarados (más el
  propio GAP.md) — el fix no tocó ningún archivo fuera de `useOrderPallets.ts`.
- Fix de invalidación cruzada revisado línea a línea en `useOrderPallets.ts`: import de
  `useQueryClient`/`orderMaritimeContainerKeys`/`getCurrentTenant`, `tenantId` calculado con el
  mismo guard `typeof window !== 'undefined'` que ya usa el resto del hook,
  `executeAssignToContainer` ejecuta `Promise.all([reload(), queryClient.invalidateQueries(...)])`
  tras el éxito de la mutation y antes del toast — orden correcto, no duplica el toast, no invierte
  la limpieza de selección. `orderMaritimeContainerKeys.listPrefix` confirmado en
  `src/lib/routes/queryKeys.ts:372-378` como el prefijo correcto del que cuelga `.list`, mismo
  mecanismo de invalidación por prefijo que ya usa el resto del proyecto.
- `reload()` no puede hacer rechazar el `Promise.all` (captura sus propios errores internamente en
  `useOrder.ts`), así que el fix no introduce un nuevo modo de fallo no gestionado.

### Observaciones para Jose

1. **Reducción de alcance del service (4→1 métodos) — razonable, no requería consulta previa.**
   El GAP preveía `assignPallet` individual, `assignPalletsToContainer`,
   `unassignPalletsFromContainer` y `getContainerPallets`; solo se implementó el único método
   consumido por la UI resultante (no hay selector inline por fila — restricción explícita del
   GAP — ni acción de "quitar de contenedor" en la Solución acordada ni en los Criterios de
   aceptación). Añadir los otros 3 sin consumidor habría sido código muerto. Sigue siendo relevante
   dejarlo anotado porque **GAP-129 (packing list PDF) es el siguiente de la serie** y podría
   necesitar `getContainerPallets` para el resumen antes de generar el PDF — si es así, se añade
   en ese momento con su propio consumidor real, no ahora.
2. Fricción #1 (UX) — el copy del `AlertDialog` de reasignación solo comunica el subconjunto
   reasignado, no el total de la selección; considera ajustarlo si Jose lo prioriza (sugerencia de
   copy ya incluida en `## Revisión UX`).
3. Fricción #2 (UX) — el botón desktop "Asignar a contenedor" no cambia texto a "Asignando..."
   durante la carga, a diferencia de sus hermanos en la misma toolbar — inconsistencia menor,
   fix de una línea si se quiere homogeneizar.
4. Fricción #3 (UX) — posible desbordamiento del toolbar desktop en modo selección con hasta 6
   acciones simultáneas sin `flex-wrap`, en viewports ~1280–1366px; no confirmado con captura real,
   recomendable verificar visualmente antes de considerar el flujo 100% cerrado.
5. El chequeo de `canAssignToContainer` en `OrderPalletsToolbar.tsx` no valida explícitamente
   `order.orderType === 'maritime_export'`, solo `maritimeContainers.length > 0` — funciona porque
   el backend solo puebla `maritimeContainers` en pedidos marítimos, pero un chequeo explícito
   sería más defensivo ante un futuro cambio de esa garantía. No bloqueante.

### Estado final de la implementación

`OrderPallets` gana una acción de bloque más ("Asignar a contenedor") reutilizando el patrón de
selección múltiple + `ConfirmActionDialog` ya validado por GAP-117, con una rama de confirmación
condicional nueva (`reassignCount`) que evita fricción en el caso común. La columna/dato de
contenedor es visible en ambos layouts. El único bloqueante real (desincronización de caché entre
`orderKeys.detail` y `orderMaritimeContainerKeys` tras la Full UX Review) quedó resuelto con una
invalidación cruzada de una línea, verificada de forma independiente. `useOrder.ts`/`usePallet.ts`
no fueron tocados, respetando la restricción explícita del GAP.

---

## Segunda ronda — fix de las 3 fricciones no bloqueantes (2026-07-30)

### Resultado: ✅ APROBADO

Jose pidió resolver las 3 fricciones no bloqueantes documentadas en `## Revisión UX` tras el cierre
inicial (9/10). Auditados los 2 archivos tocados leyendo el código completo (no solo el diff),
comparado línea a línea contra lo declarado en `## Implementación` → "Fix de las 3 fricciones no
bloqueantes".

**Fix 1 — Copy del diálogo de confirmación (`ConfirmActionDialog.tsx`):** verificado. `totalLabel`
(derivado de `selectedCount`) se usa en título y descripción; `reassignLabel` (derivado de
`reassignCount`) se añade condicionalmente solo si `reassignCount > 0`. Simulado el caso motivador
(3 seleccionados, 1 ya en contenedor B, 2 sin asignar, se elige A): título
`¿Asignar 3 palets a A?`, descripción `Vas a asignar 3 palets a A. 1 palet seleccionado ya está
asignado a otro contenedor y se moverá. Los palets siguen vinculados al pedido.` — coincide
exactamente con la sugerencia de copy de la auditoría UX original. Confirmado en
`useOrderPallets.ts` (`handleAssignSelectedPalletsToContainer`, líneas 358-382) que el diálogo
`assignToContainer` **solo se abre cuando `reassignCount > 0`** (si es `0`, `executeAssignToContainer`
se ejecuta directamente sin diálogo) — por tanto la rama `else ''` del ternario en la descripción
(cuando `reassignCount` sería `0`) es defensiva, no alcanzable con el flujo actual. Confirmado tal
y como pedía la verificación.

**Fix 2 — Copy del botón durante carga (desktop, `OrderPalletsToolbar.tsx`):** verificado. El botón
"Asignar a contenedor" ahora muestra `<Loader2 className="animate-spin" />Asignando...` mientras
`isAssigningToContainer` es `true` (líneas 303-313), igual patrón que sus hermanos
"Desvinculando..."/"Eliminando...". El submenú mobile (`DropdownMenuSub`, líneas 145-162) no fue
tocado — correcto: el trigger del menú "..." en mobile ya sustituye el icono por un `Loader2` global
y **deshabilita todo el trigger** (`disabled={isBulkActionBusy}`, línea 112) mientras cualquier
acción en bloque está en curso, incluida `isAssigningToContainer` (agregada en `isBulkActionBusy`,
línea 83) — el usuario ni siquiera puede reabrir el submenú durante la carga, así que no hay
inconsistencia nueva que corregir ahí; no tocar ese archivo fue la decisión correcta.

**Fix 3 — `flex-wrap` en el toolbar desktop (`OrderPalletsToolbar.tsx`):** verificado. `flex-wrap`
añadido tanto al `CardHeader` (línea 260: `flex flex-row flex-wrap items-center justify-between
gap-2`) como al contenedor de botones (línea 273: `flex flex-wrap gap-2`). No rompe el layout
normal: sin selección activa (3 botones: Vincular, Crear desde previsión, Crear palet) o con pocos
botones, `flex-wrap` solo actúa si el contenido excede el ancho disponible — sin cambio visible en
el caso común, y con hasta 6 acciones simultáneas ahora baja a una segunda línea en vez de desbordar.

### Verificación independiente

- Confirmado por timestamp de archivo (`ls -la --time-style=full-iso`) que solo
  `ConfirmActionDialog.tsx` y `OrderPalletsToolbar.tsx` fueron modificados en esta segunda ronda —
  el resto de archivos de la implementación original (`useOrderPallets.ts`,
  `MaritimeContainersList.tsx`, etc.) tienen timestamps anteriores, consistentes con el cierre de
  la primera ronda.
- `npm run type-check` → limpio, 0 errores (ejecutado de forma independiente).
- `npm run lint` → 0 errores, 267 warnings — idéntico al baseline ya reportado en la primera
  auditoría; grepeado el log filtrando por `ConfirmActionDialog|OrderPalletsToolbar` y no aparece
  ningún warning en ninguno de los 2 archivos.
- Sin `fetch()` directo, sin hardcode de tenant, sin archivos `.js` nuevos, sin `any` nuevo — no
  aplica ningún cambio de esta naturaleza (solo copy y clases Tailwind).

### Revisión UX — Light (hecha por mí)

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-128 — fix de 3 fricciones no bloqueantes (segunda ronda)
Mode: Light (copy + CSS, sin cambios de lógica ni de flujo, ya cubierto por Full Review previa)

[x] El cambio es autoexplicativo — el copy es más claro (total + subconjunto), sin instrucción
    adicional necesaria
[x] No introduce una decisión nueva del usuario — mismo flujo, mismo número de pasos
[x] Consistente con la UI circundante — "Asignando..." iguala el patrón ya usado por
    "Desvinculando..."/"Eliminando..." en la misma toolbar
[x] Interactivo: hover/focus/active — sin cambios, mismo componente `Button` shadcn
[x] Tono del texto nuevo coincide con el resto de la interfaz

VERDICT: ✅ APROBADO
```

**Motivo de Light (no Full):** los 3 cambios son puramente de copy y CSS, acotados exactamente a
las 3 fricciones ya simuladas y documentadas por `ux-reviewer` en su Full Review previa sobre este
mismo GAP — no introducen un flujo nuevo, no tocan lógica de negocio, no afectan permisos ni
navegación. Repetir una Full Review sería redundante sobre hallazgos ya analizados exhaustivamente.

### Veredicto final de esta segunda ronda: ✅ APROBADO

Las 3 fricciones quedan resueltas tal como se pidió, sin regresiones y sin archivos fuera de los 2
declarados. El GAP se mantiene en ✅ APROBADO (mejora sobre el 9/10 original — las 3 observaciones
que restaban puntuación ya están resueltas).
