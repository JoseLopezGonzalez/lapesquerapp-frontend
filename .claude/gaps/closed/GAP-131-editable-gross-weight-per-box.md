# GAP-131 — Peso bruto real y editable por caja, con conmutador de columna y generación masiva por tara

## Metadata

- **Tipo:** Feature
- **Módulo:** Stock (Pallets)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-31
- **Autor:** Jose

---

## Contexto y problema

El campo `grossWeight` (peso bruto) existe en `PalletBox` (`src/hooks/pallets/palletHelpers.ts:8`)
y viaja en el payload de creación/edición de cajas hacia el backend, pero hoy **siempre se
fabrica igual al peso neto** — nunca es un dato independiente:

```ts
// src/hooks/pallets/usePalletBoxOperations.ts:119 (addBox)
grossWeight: roundedNetWeight,   // ← siempre = netWeight
```

Esto ya estaba documentado como problema en `docs/ai/gaps/pallets/GAP-V2-079.md`, donde la
decisión previa (2026-07-05) fue **eliminar** el campo por considerarse un dato fabricado sin
valor. Esa decisión queda **revertida por este GAP**: ahora se necesita un peso bruto real y
editable a nivel de caja, porque el packing list de exportación marítima debe poder reflejar el
peso bruto real de la mercancía por contenedor/palet, y ese dato solo puede ser fiable si nace de
cajas con peso bruto real, no fabricado.

**`GAP-V2-079` queda superado por este GAP** y debe cerrarse/archivarse cuando este se implemente
(ya no aplica "eliminar el campo": ahora se reafirma y se completa). `GAP-V2-082` (tara al dar de
alta una caja en modo manual, pesando en báscula) **sigue siendo un GAP independiente y no forma
parte de este** — este GAP trabaja sobre cajas ya existentes en el palet, no sobre el flujo de
alta.

---

## Solución acordada

### 1. Columna "Peso Bruto" editable por caja, oculta por defecto

- Añadir un input editable de peso bruto (kg) por caja en las tablas de cajas de
  `PalletView/index.tsx` (tab "Edición" → sub-tab "Disponibles", que ya tiene edición inline de
  peso neto). En la sub-tab "En Producción" (solo lectura) se muestra como texto, no editable —
  igual que ya ocurre con el peso neto ahí.
- La columna **no se muestra por defecto** — un conmutador (Switch) en la toolbar de la tabla de
  cajas la muestra/oculta, para no sobrecargar la tabla en el caso de uso habitual donde el bruto
  no se consulta.
- El estado del conmutador se persiste en `localStorage`, siguiendo el patrón ya existente de
  `STORAGE_KEYS` en `palletHelpers.ts:59-61` (`showPalletWeight`, `showBoxTare`) — nueva clave
  `showGrossWeightColumn`. Es una preferencia global del usuario, no de una sesión de edición
  concreta.
- Requiere el primitivo shadcn `Switch`, no instalado en el proyecto (`src/components/ui/` no
  tiene `switch.tsx`). **Instalar con `npx shadcn@latest add switch` antes de usarlo** (regla del
  proyecto: nunca escribir un primitivo de UI a mano).

### 2. Valor por defecto: igual al neto (sin cambios de comportamiento en creación)

- Al crear una caja (cualquiera de los 5 métodos de alta), `grossWeight` sigue naciendo igual a
  `netWeight`, exactamente como hoy. Este GAP no toca el flujo de alta de cajas.
- El peso bruto se convierte en un dato real solo cuando el usuario lo edita explícitamente
  (caja a caja, o mediante la generación masiva del punto 3).

### 3. Generación masiva de peso bruto mediante tara de caja

- Nueva acción dentro de la pestaña "Acciones Masivas" ya existente
  (`PalletView/index.tsx:2141-2439`, junto a las acciones `lot`/`weight`/`weightAdd`/`product`/
  `cost`), con un nuevo `bulkActionType: 'grossWeightTare'`.
- El usuario introduce un único valor **"Tara de caja (kg)"** — este valor ya cubre cartón,
  envases y plásticos en conjunto (no hay un campo separado de "envases"; queda descartado tras
  confirmación explícita).
- Fórmula: `grossWeight = netWeight + tara` para cada caja objetivo (confirmado con ejemplo
  numérico: neto 10 kg + tara 0.5 kg → bruto 10.5 kg).
- Reutiliza el patrón de selección ya existente (`selectedBoxIds` / `targetBoxIds` en
  `PalletView/index.tsx:2372-2373`): si hay cajas marcadas con checkbox, se aplica solo a esas; si
  no hay ninguna marcada, se aplica a todas las cajas disponibles de la tab "Disponibles" — el
  mismo mensaje de `Alert` ya existente (`PalletView/index.tsx:2348-2366`) cubre ambos casos sin
  necesidad de UI adicional.
- Nuevo método `bulkEditBoxes.setGrossWeightFromTare(boxIds | null, tara)` en
  `usePalletBoxOperations.ts`, análogo a `addOrSubtractWeight` ya existente.

### 4. Edición individual

- Nuevo método `editBox.grossWeight(boxId, grossWeight)` en `usePalletBoxOperations.ts`, análogo
  a `editBox.netWeight` ya existente (`usePalletBoxOperations.ts:218`).
- Tras editar manualmente el peso bruto de una caja, el valor queda fijo (no se recalcula
  automáticamente si luego se edita el peso neto de esa misma caja) — coherente con cómo ya se
  comporta `manualCostPerKg` como override independiente en este mismo módulo.

### Fuera de alcance de este GAP

- **Mobile** (`MobilePalletView/*`) — se deja para un sprint posterior, decisión explícita de
  Jose.
- El flujo de alta de cajas (los 5 métodos) — no se modifica; eso es `GAP-V2-082`, que sigue
  independiente.
- El packing list de exportación marítima en sí (`MaritimeShippingDetailForm`, schema, PDF) — no
  se toca en este GAP. Este GAP solo sienta la base de datos real; consumir el bruto desde el
  packing list es un GAP posterior.

---

## Referencias e inspiración

- Patrón de acción masiva con selección opcional: `PalletView/index.tsx:2368-2439`
  (`bulkActionType`, `selectedBoxIds`, `targetBoxIds`).
- Patrón de edición individual de peso: `usePalletBoxOperations.ts:218` (`editBox.netWeight`).
- Patrón de toggle persistente en localStorage: `palletHelpers.ts:59-61` (`STORAGE_KEYS`).
- Peso bruto real ya calculado correctamente a nivel de palet (tara + neto):
  `MobilePalletView/ResumenTab.tsx:29` — mismo principio (`neto + tara`), no se toca en este GAP.
- Decisión previa revertida: `docs/ai/gaps/pallets/GAP-V2-079.md`.
- GAP relacionado e independiente: `docs/ai/gaps/pallets/GAP-V2-082.md`.

## UI Brief

- **Vista de referencia:** `PalletView/index.tsx` — tab "Edición" (tabla de cajas "Disponibles"
  con edición inline ya existente) y tab "Acciones Masivas" (panel de botones de acción +
  formulario dinámico ya existente).
- **Tipo de layout:** inline dentro de la vista existente (columna de tabla + toolbar switch +
  nuevo botón de acción masiva). No se crea ninguna vista ni modal nuevo.
- **Componentes clave:** `Switch` (shadcn, instalar), `Input type="number"` (ya usado para el
  resto de acciones masivas), `Checkbox` (ya existente para selección de filas), `Alert` (ya
  existente para el mensaje "se aplicará a todas/seleccionadas").
- **Estados requeridos:** el mismo patrón de validación ya usado en las demás acciones masivas
  (botón deshabilitado si el valor no es numérico o es negativo); sin nuevos estados de
  loading/error — es edición de estado local del palet en memoria, no una llamada de red aparte.
- **Mobile:** no aplica en este sprint — decisión explícita de Jose.

### Preguntas de confirmación para Jose

Ya resueltas en el diálogo previo a este GAP:
1. Alcance masivo → checkbox para seleccionar cajas concretas; sin selección, aplica a todas. ✅
2. Fórmula → `grossWeight = netWeight + tara` (un único campo de tara, cubre cartón+envases). ✅
3. Dónde vive → botón nuevo en la pestaña "Acciones Masivas" ya existente. ✅
4. Mobile → fuera de alcance este sprint. ✅

5. Conmutador → `Switch` de shadcn (`npx shadcn@latest add switch`, no instalado hoy). Aprobado
   por Jose 2026-07-31.

---

## Criterios de aceptación

- [x] Existe una columna "Peso Bruto" en la tabla de cajas de la sub-tab "Disponibles", editable
      inline igual que "Peso Neto", oculta por defecto.
- [x] Un conmutador en la toolbar de la tabla muestra/oculta la columna "Peso Bruto"; su estado
      persiste en `localStorage` entre sesiones (`STORAGE_KEYS.showGrossWeightColumn`).
- [x] En la sub-tab "En Producción" (solo lectura), la columna "Peso Bruto" se muestra como texto
      cuando el conmutador está activo, sin ser editable.
- [x] Al crear una caja nueva (cualquier método de alta), `grossWeight` sigue naciendo igual a
      `netWeight` — sin cambios de comportamiento en la creación.
- [x] La pestaña "Acciones Masivas" tiene una nueva opción "Tara de caja" que, dado un valor de
      tara (kg), calcula `grossWeight = netWeight + tara` para las cajas seleccionadas
      (checkbox) o para todas las disponibles si no hay ninguna seleccionada.
- [x] Editar el peso bruto de una caja individualmente no se sobrescribe automáticamente al
      editar después el peso neto de esa misma caja.
- [x] `editBox.grossWeight` y `bulkEditBoxes.setGrossWeightFromTare` existen en
      `usePalletBoxOperations.ts` con la misma forma/convención que sus equivalentes de peso
      neto.
- [x] `MobilePalletView` no se modifica.
- [x] `npm run type-check` y `npm run lint` limpios.

## Archivos a crear o modificar

- `src/components/ui/switch.tsx` — nuevo, vía `npx shadcn@latest add switch` (aprobado, ver
  pregunta 5 del UI Brief).
- `src/hooks/pallets/palletHelpers.ts` — nueva clave en `STORAGE_KEYS`
  (`showGrossWeightColumn`), sin cambios en la interfaz `PalletBox` (`grossWeight` ya existe).
- `src/hooks/pallets/usePalletBoxOperations.ts` — `editBox.grossWeight`,
  `bulkEditBoxes.setGrossWeightFromTare`.
- `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx` — columna nueva en las tablas
  de cajas afectadas, conmutador en la toolbar, nuevo botón + formulario en "Acciones Masivas".

## Restricciones

- No tocar `MobilePalletView/*` en este GAP.
- No tocar el flujo de alta de cajas (los 5 métodos en `usePalletBoxCreation.ts`) — eso es
  `GAP-V2-082`, fuera de alcance.
- No tocar `MaritimeShippingDetailForm`, su schema, ni el servicio de descarga del packing list —
  ese consumo es un GAP posterior.
- No añadir un catálogo de tara por tipo de envase — la tara es un valor libre introducido en el
  momento, sin memoria entre usos (mismo patrón ya establecido en el módulo).
- Al implementar, marcar `docs/ai/gaps/pallets/GAP-V2-079.md` como superado por este GAP (no
  eliminar el archivo, documentar el enlace) en el mismo commit.

---

## Implementación

### Archivos creados

- `src/components/ui/switch.jsx` — primitivo shadcn Switch, generado vía
  `npx shadcn@latest add switch` (el proyecto tiene `components.json` con `"tsx": false`, por
  lo que todos los primitivos de `src/components/ui/` son `.jsx`, no `.tsx` — 41 de los 52 ya
  existentes siguen este mismo patrón; `switch.jsx` es coherente con él).
- `src/components/ui/switch.d.ts` — declaración de tipos para `Switch`, siguiendo el mismo
  patrón ya usado en 24 primitivos `.jsx` del proyecto (p. ej. `checkbox.d.ts`) para que los
  consumidores `.tsx` reciban props opcionales correctas (`className`, `checked`,
  `onCheckedChange`, etc.) en vez de que TypeScript infiera `className` como requerido.

### Archivos modificados

- `src/hooks/pallets/palletHelpers.ts` — añadida `showGrossWeightColumn` a `STORAGE_KEYS`.
- `src/hooks/pallets/usePalletBoxOperations.ts` — `editBox.grossWeight` (mirror de
  `editBox.netWeight`) y `bulkEditBoxes.setGrossWeightFromTare` (mirror de
  `addOrSubtractWeight`/`changeNetWeight`, reutiliza el filtro `boxIds ?? cajas disponibles`).
- `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx`:
  - Conmutador "Mostrar peso bruto" (Switch + Label) junto al título "Cajas en el Palet" de la
    tab "Edición", persistido en `localStorage` vía `getStoredValue`/`setStoredValue`.
  - Columna "Peso Bruto" añadida (gateada por `showGrossWeightColumn`) en las 6 tablas de cajas
    del archivo: "Disponibles" (editable inline), "Todas", "En Producción" (solo lectura), la
    "Vista Previa de Cajas" de la tab "Acciones Masivas", y la tabla de la tab "Eliminar" — en
    todas menos "Disponibles" se muestra como texto, no editable.
  - Nuevo botón "Tara de Caja" (`bulkActionType: 'grossWeightTare'`) en "Acciones Masivas", con
    input de tara (kg), texto explicativo, entrada en el switch del botón "Aplicar Cambios" y en
    la condición de `disabled`. Reutiliza el patrón existente `targetBoxIds = selectedBoxIds.length
    > 0 ? selectedBoxIds : null` (selección o todas) sin UI adicional.
  - Nuevo handler `handleOnChangeBoxGrossWeight` (mirror de `handleOnChangeBoxNetWeight`, misma
    comprobación de caja en producción).
  - Bullet nuevo en la tarjeta "Información" de "Acciones Masivas" describiendo "Tara de Caja".

### Decisiones tomadas durante la implementación

- El conmutador `showGrossWeightColumn` es un único estado de componente que gatea la columna en
  **todas** las tablas de cajas del archivo (no solo "Disponibles"/"En Producción" mencionadas
  literalmente en la Solución acordada), incluyendo las de "Acciones Masivas" y "Eliminar".
  Motivo: son la misma lista de cajas vista desde distintas tabs; exponer la columna en unas y no
  en otras habría hecho que el conmutador pareciera roto en esas vistas.
- `switch.jsx` (no `.tsx`) y su `switch.d.ts` compañero: decisión técnica forzada por
  `components.json` (`"tsx": false`) y por el patrón ya establecido en el proyecto (ver Archivos
  creados). No es una desviación de la Regla de Oro 3 (`.jsx` no es `.js`, y coincide con el resto
  de `src/components/ui/`).
- Sin validación de `grossWeight >= netWeight` en la edición individual (`editBox.grossWeight`):
  se mantiene la misma ausencia de validación que ya tiene `editBox.netWeight`, para no introducir
  un comportamiento asimétrico entre campos hermanos no solicitado por el GAP.

### Desviaciones del plan (si las hay)

- Se creó también `src/components/ui/switch.d.ts` (no listado explícitamente en "Archivos a
  crear o modificar"), necesario para que `npm run type-check` pasara limpio al consumir `Switch`
  desde un archivo `.tsx` — ver justificación arriba.
- Se detectó una feature completamente distinta y no relacionada (envío de documentos de
  exportación marítima: `useSendMaritimeExportDocuments.ts`, cambios en
  `OrderMaritimeExport/index.tsx`, `orderDocumentService.ts`, `types/orders.ts`) ya presente sin
  commitear en el working directory antes de empezar este GAP. No se ha tocado ni modificado —
  queda exactamente como estaba, es trabajo en curso ajeno a GAP-131.

---

## Revisión UX

### Modo: Full

**FLOW SIMULATION**

Rol: Administrador / operario de almacén editando un palet existente en desktop.
Entrada: `PalletDialog` → tab "Edición" → sub-tab "Disponibles".

1. **Columna oculta por defecto.** El conmutador "Mostrar peso bruto" (`PalletView/index.tsx:1654-1666`)
   vive junto al título "Cajas en el Palet", al mismo nivel visual que el resumen de
   cajas/peso/productos/lotes. Es descubrible sin instrucción: label explícito junto al Switch,
   mismo patrón que otros toggles de UI del proyecto. No requiere onboarding.
2. **Activar el conmutador.** La columna "Peso Bruto" aparece con el mismo valor que el neto por
   defecto (`box.grossWeight ?? box.netWeight`, `index.tsx:1439` y `:1568`), como `Input` idéntico
   en estilo al de "Peso Neto" en la misma fila (`index.tsx:1420-1450` vs `:1435-1450`) — incluso
   comparte el `onClick={(e) => e.stopPropagation()}` para no disparar la selección de fila al
   editar. Ningún usuario que ya sepa editar el peso neto tiene curva de aprendizaje aquí.
3. **Edición individual.** `handleOnChangeBoxGrossWeight` (`index.tsx:455-467`) es un mirror
   exacto de `handleOnChangeBoxNetWeight`, incluida la misma notificación de error "Caja en uso"
   si la caja está en producción. Feedback consistente: el valor se refleja en el input igual que
   el neto, sin toast (correcto — tampoco lo tiene el neto; el propio input es el feedback).
4. **Tara de caja (masivo).** Botón "Tara de Caja" en "Acciones Masivas" (`index.tsx:2314-2328`),
   mismo patrón visual que los demás botones de acción (icono + label, estado activo/outline).
   El formulario muestra `Label "Tara de caja (kg)"` + texto explicativo bajo el input
   (`index.tsx:2457-2460`: "El peso bruto se calculará como peso neto + tara (cartón, envases y
   plásticos incluidos) para cada caja") — suficiente para un operario sin conocimiento técnico:
   nombra la fórmula en lenguaje llano y aclara qué cubre el valor único de tara, coherente con
   la decisión ya cerrada en el UI Brief (un solo campo, sin desglose por tipo de envase).
5. **Selección opcional (todas vs. seleccionadas).** El mismo `Alert` azul ya existente
   (`index.tsx:2493-2511`) cambia su texto según `selectedBoxIds.length`: "se aplicarán solo a las
   N cajas seleccionadas (en la tab "Disponibles")" vs. "se aplicarán a todas las cajas disponibles
   (no en producción)". No hay ambigüedad sobre cuál de los dos casos va a ocurrir — el usuario ve
   el mensaje correcto antes de pulsar "Aplicar Cambios"/"Aplicar a N seleccionadas". Verificado en
   `usePalletBoxOperations.ts:538-542`: `setGrossWeightFromTare` filtra por `boxIds ?? disponibles`,
   coincide exactamente con lo que promete el Alert.
6. **Feedback tras aplicar la tara masiva.** `notify.success` con título "Peso bruto calculado" y
   descripción "Se ha calculado el peso bruto (neto + X kg de tara) en N caja(s) disponible(s)"
   (`usePalletBoxOperations.ts:575-578`) — confirma la fórmula aplicada y el alcance real, cerrando
   el loop de confianza antes de que el usuario vuelva a "Disponibles" a verificar.
7. **Consistencia post-aplicación (verificado por lectura de código, no captura real).** El cálculo
   `grossWeight = netWeight + tare` (`usePalletBoxOperations.ts:566-570`) usa el `netWeight` vigente
   de cada caja en el momento de aplicar la tara, y el resultado se re-renderiza en las mismas
   tablas que ya leen `box.grossWeight` — no hay desincronización posible porque es el mismo estado
   `temporalPallet` en memoria.
8. **Caja en producción.** En la sub-tab "En Producción" y en la tabla de "Eliminar", el peso bruto
   se muestra como texto plano (`{box.grossWeight ?? box.netWeight} kg`, sin `Input`) exactamente
   igual que el peso neto en las mismas filas (`index.tsx:2202-2207`, `:3208-3211`) — mismo
   tratamiento visual, misma ausencia de affordance de edición. Claro que no es editable.

Edge cases simulados:
  → Empty state: tabla vacía (`filteredAvailableBoxes.length === 0`) — `colSpan` del `EmptyState`
    ya contempla `showGrossWeightColumn` (`index.tsx:2055-2058`), sin desalineación de tabla.
  → Error state: no aplica llamada de red aparte (edición en memoria); errores de validación
    (tara negativa/no numérica) bloquean el botón "Aplicar" vía `disabled` (`index.tsx:2584-2588`),
    coherente con el resto de acciones masivas — no hay un estado de error visible aparte porque
    nunca se puede llegar a intentar el envío con un valor inválido.
  → Partial data: `box.grossWeight ?? box.netWeight` cubre cajas legacy sin `grossWeight` propio en
    todas las tablas de solo lectura — no hay ningún punto donde se muestre `undefined`/`NaN`.
  → Permission edge: `isReadOnly` (palet de recepción) deshabilita edición individual y bloquea la
    tab de acciones masivas con el Alert naranja ya existente — pero el conmutador de visibilidad
    de columna NO se deshabilita en modo `isReadOnly`, comportamiento correcto: es una preferencia
    de visualización, no una edición del palet.
  → Concurrent action: no aplica — edición en memoria de un único usuario sobre `temporalPallet`,
    sin colaboración multi-usuario en este editor.
  → Mobile: no aplica — confirmado que `MobilePalletView/*` no fue tocado (grep sin resultados).

**FINDINGS**

✅ Funciona bien:
- Feature aditiva y oculta por defecto: cero impacto en el flujo habitual de un usuario que no
  necesita el bruto.
- Cada pieza nueva (input individual, botón masivo, columna de tabla) es un mirror deliberado de
  un patrón ya validado en el mismo archivo (peso neto), lo que elimina virtualmente toda curva de
  aprendizaje.
- El mensaje de alcance ("todas" vs "seleccionadas") y el mensaje de confirmación tras aplicar son
  específicos y verificables contra el código de negocio real, no genéricos.

⚠️ Fricciones menores (no bloqueantes):
- El bullet nuevo en la tarjeta "Información" ("Tara de Caja: Calcula el peso bruto (neto + tara)
  de todas las cajas disponibles", `index.tsx:2636-2639`) no menciona el caso de selección parcial,
  a diferencia del `Alert` dinámico que sí lo hace. Es un patrón ya preexistente e idéntico en los
  demás bullets ("Cambiar Lote", "Cambiar Peso", etc. — ninguno menciona selección tampoco), así
  que no es una regresión de este GAP ni una inconsistencia introducida por él; queda documentado
  por si en algún momento se decide corregir el texto informativo para las 5 acciones a la vez.
- El Switch "Mostrar peso bruto" es una única preferencia global para las 6 tablas del archivo
  (decisión documentada explícitamente en "Decisiones tomadas durante la implementación"). Un
  usuario que solo quería ver el bruto en "Disponibles" también lo verá en "Eliminar" o "Vista
  Previa" sin poder desactivarlo solo ahí. Es la decisión correcta (evita que el toggle "parezca
  roto" en otras tabs, como ya razona el propio GAP) y no amerita cambio.

❌ Bloqueantes: ninguno.

**UX PRINCIPLES CHECK** (`.claude/design-context.md` § 8)

1. Confirmación en acciones destructivas: N/A — esta feature no borra datos, solo calcula un valor.
2. Mobile como render path separado: ✅ — no tocado, fuera de alcance documentado y verificado.
3. Datos de servidor solo vía TanStack Query: ✅ — edición en memoria de `temporalPallet` (estado
   local del formulario del diálogo, no dato de servidor cacheado), mismo patrón que el resto de
   la edición de cajas del palet.
4. Loading states con la forma del contenido: N/A — no hay llamada de red nueva.
5. Configuración declarativa (EntityClient): N/A — este editor no usa EntityClient, es un patrón
   ya establecido de tabla custom para cajas de palet.
6. Errores al nivel correcto: ✅ — validación de tara inline vía `disabled` en el botón, error de
   "Caja en uso" vía `notify.error` a nivel de acción, igual que el resto del módulo.
7. Densidad alta, chrome mínimo: ✅ — columna añadida sin aumentar el ruido visual por defecto
   (oculta), inputs del mismo tamaño/tipografía que los ya existentes.
8. Iconos Lucide-only: ✅ — `Box` (lucide-react) para el botón "Tara de Caja".

### VERDICT: ✅ APROBADO

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos — los 9 criterios verificados uno a uno contra el código
      real (`grep` de `showGrossWeightColumn`, `grossWeightTare`, `editBox.grossWeight`,
      `setGrossWeightFromTare` en los 4 archivos tocados).
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos — `switch.jsx` es `.jsx` (no `.js`), consistente con los 41 de 52
      primitivos ya existentes en `src/components/ui/` bajo `components.json` (`"tsx": false`).
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso (`useLabelEditor.ts` intacto)
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados — `editBox.grossWeight` y
      `bulkEditBoxes.setGrossWeightFromTare` son mirrors exactos de `editBox.netWeight` y
      `bulkEditBoxes.addOrSubtractWeight`/`changeNetWeight`, misma convención de notificaciones y
      filtrado por disponibilidad.
- [x] Nomenclatura correcta

### Revisión Visual

- [x] Color: sin valores hex/rgb/oklch hardcodeados.
- [x] Tipografía: `text-sm font-normal` en el label del conmutador — encaja como texto secundario
      inline junto a un control, no como label de formulario.
- [x] Layout: la fila del toggle reutiliza la misma estructura flex del header de tabla existente.
- [x] Componentes: exactamente los listados en el UI Brief (Switch, Input, Checkbox, Alert).
- [x] Paridad con referencia: la columna editable es un mirror pixel-a-pixel del patrón de "Peso
      Neto" ya existente en la misma fila.
- [x] Sin inline styles, sin colores arbitrarios.
- [x] Mobile: correctamente fuera de alcance, `MobilePalletView/*` no tocado.

**Veredicto visual: ✅ APROBADO**

### Revisión UX

Full UX Review realizada por `ux-reviewer` (ver sección `## Revisión UX` arriba) — **✅ APROBADO**,
sin bloqueantes. Dos fricciones menores documentadas, ninguna exige acción.

### Observaciones para Jose

Implementación sólida y sin sorpresas: cada pieza nueva (columna, conmutador, acción masiva) es
un mirror deliberado de un patrón que ya existía en el mismo archivo para el peso neto, así que no
hay curva de aprendizaje ni inconsistencia visual. Dos matices menores, ninguno bloqueante:

1. El conmutador es un único estado que afecta a las **6** tablas de cajas del archivo
   (Disponibles, Todas, En Producción, Vista Previa de Acciones Masivas, y la tabla de Eliminar),
   no solo las 2 mencionadas literalmente en la Solución acordada. Fue una decisión deliberada del
   Implementador para evitar que el conmutador pareciera "roto" en las otras vistas — documentada
   en la sección Implementación. Si prefieres que el bruto solo aparezca en "Disponibles"/"En
   Producción", es un ajuste de 10 minutos.
2. No hay validación de que el peso bruto introducido sea ≥ peso neto (individual). Se decidió así
   para no introducir una regla de negocio no pedida explícitamente — el neto tampoco se valida
   hoy. Si quieres blindarlo, es una mejora de seguimiento, no un bloqueante.

Resto pendiente para consumir este dato: el packing list de exportación marítima en sí (fuera de
alcance de este GAP, ver "Fuera de alcance").

### Estado final de la implementación

`grossWeight` es ahora un campo real por caja: nace igual al neto (sin cambios en los 5 métodos de
alta), es editable inline caja a caja tras activar el conmutador "Mostrar peso bruto", y puede
recalcularse en bloque (`neto + tara`) desde "Acciones Masivas" para todas las cajas disponibles o
solo las seleccionadas. `type-check` y `lint` limpios (0 errores; los warnings preexistentes del
proyecto no tocan ningún archivo de este GAP). `GAP-V2-079` queda superado — su contenido histórico
se mantiene como registro, pero la decisión "eliminar el campo" ya no aplica.
