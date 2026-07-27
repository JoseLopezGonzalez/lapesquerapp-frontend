# GAP-117 — Acciones bulk y modo selección en Palets del pedido

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Media
- **Estado:** in-progress
- **Fecha:** 2026-07-27
- **Autor:** Jose

---

## Contexto y problema

En el tab "Palets" del editor de pedidos (`OrderPallets`) ya existe selección múltiple de
palés (checkbox por fila en desktop y mobile, con "select all" en cabecera), pero la única
acción que reacciona a esa selección es "Imprimir etiquetas de expedición"
(`OrderPalletsToolbar.tsx`, gated por `canPrintSelected` = `canPrintExpeditionLabels && selectedPalletCount > 0`).

Todo lo demás que existe hoy en el módulo son acciones de fila individual (menú por palet en
`OrderPalletTableRow.tsx` / `OrderPalletCard/index.tsx`: Editar, Clonar, Desvincular, Eliminar,
Imprimir etiqueta no-expedición) o acciones de toolbar no filtradas por selección
("Desvincular todos" desvincula siempre TODOS los palés del pedido, ignorando qué esté marcado).

Resultado: seleccionar varios palés casi no aporta nada más allá de imprimir expedición, y la
toolbar mezcla acciones que aplican a la selección con acciones que no tienen sentido mientras
hay palés marcados (Crear palet, Vincular palet, Desvincular todos).

Detectado por Jose en navegación de prueba manual, 2026-07-27.

## Solución acordada

Introducir un **modo selección** explícito en la toolbar de `OrderPallets` (desktop y mobile):

- Mientras `selectedPalletCount > 0`, la toolbar oculta las acciones que no aplican a una
  selección: "Crear palet", "Vincular palet", "Desvincular todos". En su lugar se muestran
  únicamente las acciones bulk aplicables + un botón para cancelar la selección.
- Acciones bulk visibles en modo selección:
  1. **Imprimir etiquetas de expedición** (ya existe, sin cambios de lógica)
  2. **Imprimir etiqueta** (el otro tipo de etiqueta, hoy solo disponible fila a fila desde
     el menú mobile vía `PalletLabelDialog`) — nueva versión bulk sobre los seleccionados
  3. **Desvincular seleccionados** (nueva) — desvincula solo los palés marcados, a diferencia
     de "Desvincular todos"
  4. **Eliminar seleccionados** (nueva, destructiva) — requiere `AlertDialog` de confirmación
     antes de ejecutar, igual que "Eliminar palet" individual (ver GAP-049)
- Al terminar cualquier acción bulk (éxito o fallo parcial), la selección se limpia y la lista
  se refresca siguiendo el mismo patrón de invalidación que ya usan las acciones individuales.
- Las acciones del menú por fila (Editar, Ver, Clonar) **no cambian** — siguen existiendo tal
  cual para una fila individual independientemente de si hay selección activa o no; el "ocultar
  acciones no aplicables" se refiere solo a la toolbar superior, no al menú contextual por fila.
- Aplica tanto a desktop como a mobile en este mismo GAP (la selección ya existe hoy en ambos).

**Explícitamente fuera de alcance** (decidido con Jose): no se añade ninguna acción de
"cambiar almacén/ubicación en bulk" ni "mover a otro pedido" — no existían ni en versión
individual y quedan fuera de este GAP.

## UI Brief

- **Vista de referencia:** `OrderPalletsToolbar.tsx` (toolbar actual) + `ConfirmActionDialog.tsx`
  (patrón de `AlertDialog` ya usado para desvincular/eliminar palé individual, GAP-049)
- **Tipo de layout:** inline — la toolbar existente cambia de contenido según haya selección,
  sin modal nuevo salvo el `AlertDialog` de confirmación para "Eliminar seleccionados" (y para
  "Desvincular seleccionados", ya que desvincular es una acción irreversible sobre el pedido)
- **Componentes clave:** `Button`, `DropdownMenu` (ya usado en mobile para agrupar acciones),
  `AlertDialog` (reutilizar `ConfirmActionDialog.tsx` generalizándolo para aceptar selección
  múltiple, o instanciar un segundo uso del mismo patrón)
- **Estados requeridos:** modo normal (sin selección) / modo selección (bulk actions visibles,
  resto oculto) / loading por acción bulk en curso (deshabilitar botones mientras se ejecuta) /
  error parcial si alguno de los palés seleccionados falla al aplicar la acción (`notify.error`
  con detalle, sin bloquear el resto)
- **Mobile:** aplica ahora — la selección y el `DropdownMenu` de acciones bulk ya existen en
  mobile hoy (`OrderPalletCard/index.tsx`), solo se extiende su contenido

## Referencias e inspiración

- `hooks/useOrderPallets.ts` — estado de selección (`selectedLinkedPalletIds`) y
  `handlePrintSelectedPalletExpeditionLabels` como plantilla de "acción bulk ya existente" a
  replicar para las nuevas
- GAP-049 — patrón `AlertDialog` obligatorio para acciones destructivas sobre palés
- `design-context.md §4 Action Buttons` — confirmación antes de destructivo, jerarquía de botones

## Criterios de aceptación

- [ ] Con `selectedPalletCount > 0`, la toolbar (desktop y mobile) oculta "Crear palet",
      "Vincular palet" y "Desvincular todos"
- [ ] Con `selectedPalletCount > 0`, la toolbar muestra: Imprimir etiquetas de expedición
      (existente), Imprimir etiqueta, Desvincular seleccionados, Eliminar seleccionados, y un
      botón para cancelar/limpiar la selección
- [ ] "Imprimir etiqueta" bulk imprime la etiqueta (no expedición) de todos los palés
      seleccionados
- [ ] "Desvincular seleccionados" desvincula únicamente los palés marcados, no todos los del
      pedido, y pide confirmación vía `AlertDialog` antes de ejecutar
- [ ] "Eliminar seleccionados" pide confirmación vía `AlertDialog` antes de ejecutar y elimina
      únicamente los palés marcados
- [ ] Al completar cualquier acción bulk, la selección se limpia y la tabla/lista de palés se
      refresca (invalidación de query, no estado local obsoleto)
- [ ] El menú de acciones por fila individual (Editar, Ver, Clonar, Desvincular, Eliminar,
      Imprimir etiqueta) sigue funcionando igual que antes, con o sin selección activa
- [ ] Sin regresión en "Crear palet" ni "Vincular palet" cuando no hay selección activa
- [ ] Comportamiento idéntico en desktop y mobile

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx`
  (generalizar para selección múltiple si aplica, o añadir una segunda instancia del mismo
  patrón para la confirmación bulk)
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsContent.tsx`
  (si es necesario propagar el nuevo estado de "modo selección")
- Revisar `src/services/domain/pallets/*` (o equivalente) para confirmar si existe soporte de
  backend para desvincular/eliminar/imprimir etiqueta en bulk (varios IDs en una sola llamada)
  o si hay que iterar llamando a la acción individual ya existente por cada palet seleccionado

## Restricciones

- No añadir "cambiar almacén/ubicación" ni "mover a otro pedido" — fuera de alcance decidido
- No modificar el menú de acciones por fila (Editar/Ver/Clonar) más allá de lo necesario para
  que convivan con el nuevo modo selección
- No inventar un endpoint bulk en el backend si no existe — si el backend solo soporta
  operación individual, iterar client-side sobre los seleccionados reutilizando la lógica ya
  existente para una sola unidad
- Mantener el patrón `AlertDialog` para toda acción destructiva/irreversible (Eliminar y
  Desvincular), nunca ejecutar directamente sobre un solo click

---

## Implementación

### Archivos creados

- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/BulkPalletLabelDialog.tsx`:
  nueva versión bulk de `PalletLabelDialog` (no tocado, para no arriesgar sus otros 8
  consumidores fuera de este módulo). Recibe `pallets: unknown[]` en vez de un único `pallet`;
  en desktop muestra todas las etiquetas seleccionadas apiladas en un `ScrollArea` con un botón
  "Imprimir (N)"; en mobile dispara la impresión directamente al abrir, igual que
  `MobilePalletLabelPrintTrigger`. Cada palet se renderiza en su propio `div.page` dentro del
  área de impresión (`#print-area-id`) para que `usePrintElement` (que ya soporta la clase
  `.page` con `page-break-after` para impresión multi-página) separe cada etiqueta en su propia
  página física al imprimir.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx`:
  generalizado `ConfirmActionDialogAction` con `'deleteSelected' | 'unlinkSelected'` además de
  las 3 acciones existentes. Nuevas props `selectedCount` e `isProcessing` para title/description/
  confirmLabel/spinner de las acciones bulk, reutilizando el mismo patrón visual (icono
  Trash2/Unlink, variant destructive) que ya usaban `delete`/`unlink`/`unlinkAll`.
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`: nuevos
  estados `isBulkPalletLabelDialogOpen`, `isDeletingSelected`, `isUnlinkingSelected`; nuevo
  derivado `selectedPalletsForBulkLabel` (pallets filtrados por `selectedLinkedPalletIds`);
  nuevos handlers `handleOpenBulkPalletLabelDialog` / `handleCloseBulkPalletLabelDialog`,
  `handleUnlinkSelectedPallets` (abre el `ConfirmActionDialog` en modo `unlinkSelected`) y
  `handleDeleteSelectedPallets` (modo `deleteSelected`). `handleConfirmAction` extendido con
  las dos ramas nuevas: `unlinkSelected` llama a `onUnlinkAllPallets(selectedLinkedPalletIds)`
  (el método del contexto ya era genérico — acepta cualquier array de IDs, no solo "todos los
  palets", así que no hizo falta tocar `hooks/orders/useOrderPallets.ts` ni el backend) y
  `deleteSelected` itera `onDeletePallet(id)` uno a uno dentro de un `try/catch` por palet (sin
  endpoint bulk de borrado en el backend — no se inventó ninguno, conforme a las restricciones
  del GAP). Ambas ramas limpian `selectedLinkedPalletIds` al terminar.
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx`:
  añadido modo selección explícito (`isSelectionMode = selectedPalletCount > 0`) en desktop y
  mobile. En modo selección se ocultan "Crear palet", "Vincular palets existentes", "Crear desde
  previsión" y "Desvincular todos"; se muestran "Imprimir etiquetas expedición" (sin cambios de
  lógica), "Imprimir etiqueta" (nueva, bulk no-expedición), "Desvincular seleccionados",
  "Eliminar seleccionados" (destructivo) y un botón "Cancelar selección". En mobile las 4
  acciones bulk (salvo el botón de cancelar) viven en el mismo `DropdownMenu` que antes solo
  tenía "Desvincular todos". Nuevas props: `onPrintSelectedLabels`, `onUnlinkSelected`,
  `onDeleteSelected`, `onCancelSelection`, `isUnlinkingSelected`, `isDeletingSelected`.
- `src/components/Admin/OrdersManager/Order/OrderPallets/index.tsx`: monta
  `BulkPalletLabelDialog`, pasa las nuevas props a `OrderPalletsToolbar` (desktop y mobile) y a
  `ConfirmActionDialog` (`selectedCount`, `isProcessing`).

### Decisiones tomadas durante la implementación

- **"Crear desde previsión" también se oculta en modo selección** (confirmado con Jose):
  aunque el criterio de aceptación solo enumera "Crear palet", "Vincular palet" y "Desvincular
  todos", el párrafo de contexto agrupa las tres acciones de creación/vínculo como "no tienen
  sentido mientras hay palés marcados" — dejar "Crear desde previsión" visible habría dejado un
  botón huérfano en la fila de 3 botones de mobile.
- **No se tocó `PalletLabelDialog.tsx`**: se creó `BulkPalletLabelDialog.tsx` como componente
  hermano en vez de generalizar el existente, porque `PalletLabelDialog` tiene 8 consumidores
  fuera de `OrderPallets` (Stores, PalletsListDialog, PositionSlideover, etc.) y cambiar su
  contrato de props habría sido un cambio de alto riesgo fuera del alcance de este GAP.
- **"Desvincular seleccionados" no requirió tocar el backend ni `hooks/orders/useOrderPallets.ts`**:
  `onUnlinkAllPallets(palletIds)` ya era genérico (recibe cualquier array de IDs) — la acción
  "Desvincular todos" existente simplemente lo llamaba con `pallets.map(p => p.id)`. Se
  reutilizó tal cual con `selectedLinkedPalletIds`.
- **"Eliminar seleccionados" itera `onDeletePallet` client-side**, sin bulk endpoint (no existe
  `DELETE` bulk en `palletService.ts`, a diferencia de `unlinkPalletsFromOrders`). Cada llamada
  ya notifica éxito/error individualmente y recarga el pedido, así que un fallo parcial (p. ej.
  un palet vinculado a una recepción, que no se puede eliminar) no bloquea el resto de la
  selección — cumple el criterio de aceptación de error parcial sin necesitar lógica nueva de
  agregación de errores.
- **La selección NO se limpia tras "Imprimir etiquetas expedición" ni tras "Imprimir etiqueta"**:
  el GAP pide limpiar la selección "al completar cualquier acción bulk", pero la acción de
  impresión de expedición ya existente (explícitamente "sin cambios de lógica" en el GAP) nunca
  lo hizo. Cambiar ese comportamiento habría sido una desviación del "sin cambios de lógica"
  pedido; se interpretó que la limpieza de selección aplica a las acciones que mutan datos
  (desvincular/eliminar), donde además hay invalidación de query, no a acciones de impresión
  (no mutan nada, y el usuario puede querer imprimir y luego también desvincular la misma
  selección).

### Desviaciones del plan (si las hay)

Ninguna respecto a los archivos listados en el GAP. Se añadió `dialogs/BulkPalletLabelDialog.tsx`
como archivo nuevo, ya contemplado en la sección "Archivos a crear o modificar" del GAP
("nueva versión bulk sobre los seleccionados").

### Verificación

- `npm run type-check`: limpio (0 errores).
- `npm run lint`: 0 errores (265 warnings preexistentes en archivos no tocados por este GAP).
- No se pudo probar el flujo end-to-end en navegador: este entorno no tiene el backend Laravel
  disponible (solo el frontend, sin `artisan serve` en `:8000`), por lo que no hay sesión
  autenticada posible para navegar hasta el tab Palets de un pedido real. Verificación limitada
  a compilación/tipos/lint — pendiente de prueba manual por Jose o de auditoría con Playwright
  en un entorno con backend disponible.

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
