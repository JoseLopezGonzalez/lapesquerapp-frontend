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

- [ ] Existe una columna "Peso Bruto" en la tabla de cajas de la sub-tab "Disponibles", editable
      inline igual que "Peso Neto", oculta por defecto.
- [ ] Un conmutador en la toolbar de la tabla muestra/oculta la columna "Peso Bruto"; su estado
      persiste en `localStorage` entre sesiones (`STORAGE_KEYS.showGrossWeightColumn`).
- [ ] En la sub-tab "En Producción" (solo lectura), la columna "Peso Bruto" se muestra como texto
      cuando el conmutador está activo, sin ser editable.
- [ ] Al crear una caja nueva (cualquier método de alta), `grossWeight` sigue naciendo igual a
      `netWeight` — sin cambios de comportamiento en la creación.
- [ ] La pestaña "Acciones Masivas" tiene una nueva opción "Tara de caja" que, dado un valor de
      tara (kg), calcula `grossWeight = netWeight + tara` para las cajas seleccionadas
      (checkbox) o para todas las disponibles si no hay ninguna seleccionada.
- [ ] Editar el peso bruto de una caja individualmente no se sobrescribe automáticamente al
      editar después el peso neto de esa misma caja.
- [ ] `editBox.grossWeight` y `bulkEditBoxes.setGrossWeightFromTare` existen en
      `usePalletBoxOperations.ts` con la misma forma/convención que sus equivalentes de peso
      neto.
- [ ] `MobilePalletView` no se modifica.
- [ ] `npm run type-check` y `npm run lint` limpios.

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

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

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
