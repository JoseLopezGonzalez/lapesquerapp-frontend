# GAP-103 — Estandarizar copy de confirmaciones destructivas en el editor de pedidos

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** in-progress
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-design copy order editor`. Las confirmaciones destructivas (`AlertDialog`) del editor de pedidos no siguen un formato único:

- **Formato pregunta** (correcto, ya documentado en `design-context.md` con el ejemplo `<AlertDialogTitle>¿Eliminar [entidad]?</AlertDialogTitle>`): `OrderAttachments/index.tsx:714` (`"¿Eliminar adjunto?"`) y `:737` (`"¿Eliminar todos los adjuntos?"`).
- **Formato enunciado sin pregunta** (outlier): `OrderAuxiliaryLines/index.tsx:720` (`"Eliminar línea auxiliar"`), `OrderPlannedProductDetails/index.js:851` (`"Eliminar línea prevista"`), `OrderPallets/dialogs/ConfirmActionDialog.jsx:28-31` (`"Eliminar Palet"`, `"Desvincular Palet"`, `"Desvincular todos los palets"` — con Title Case suelto en las dos primeras).

Además, el nivel de detalle del `AlertDialogDescription` es desigual:
- `OrderAttachments/index.tsx:717` y `ConfirmActionDialog.jsx` sí indican irreversibilidad ("Esta acción no se puede deshacer" / "es permanente y no se puede deshacer").
- `OrderAuxiliaryLines/index.tsx:722` y `OrderPlannedProductDetails/index.js:852-854` describen una consecuencia pero omiten la frase de irreversibilidad.
- `ConfirmActionDialog.jsx` no nombra el palet concreto en el caso de borrado individual (`"¿Estás seguro de que quieres eliminar este palet?"`), pese a que el identificador (`pallet.id`) está disponible en el mismo flujo (ver `OrderPalletCard/index.js:91` — `"Palet #{pallet.id}"`).

Jose confirmó fijar como estándar: **título en formato pregunta + nombrar la entidad concreta cuando el dato esté disponible + frase de irreversibilidad siempre presente**.

## Solución acordada

1. Reescribir los títulos de `AlertDialogTitle` de los tres componentes outlier al formato pregunta.
2. Añadir la frase de irreversibilidad a `OrderAuxiliaryLines` y `OrderPlannedProductDetails` donde falta.
3. En `ConfirmActionDialog.jsx`, nombrar el palet concreto en el caso de borrado/desvinculación individual usando el dato ya disponible en las props del componente (verificar qué prop expone el ID/número de palet al componente; si no se pasa hoy, añadirlo como prop nueva desde el caller).

## Referencias e inspiración

- `design-context.md` § Modales y Diálogos — patrón de confirmación destructiva documentado con formato pregunta.
- `OrderAttachments/index.tsx:737-740` — ejemplo ya correcto de detalle específico + irreversibilidad: `"Se eliminarán {total} {total === 1 ? 'adjunto' : 'adjuntos'} de forma permanente. Esta acción no se puede deshacer."`

## Criterios de aceptación

- [ ] `OrderAuxiliaryLines/index.tsx:720` — título cambia a `"¿Eliminar línea auxiliar?"`.
- [ ] `OrderAuxiliaryLines/index.tsx:722` — descripción incluye ahora la frase de irreversibilidad, ej.: `"Esta acción eliminará la línea del pedido y puede afectar los importes totales. No se puede deshacer."`
- [ ] `OrderPlannedProductDetails/index.js:851` — título cambia a `"¿Eliminar línea prevista?"`.
- [ ] `OrderPlannedProductDetails/index.js:852-854` — descripción incluye la frase de irreversibilidad.
- [ ] `ConfirmActionDialog.jsx` — título de borrado individual cambia a `"¿Eliminar el palet #{id}?"` (usando el identificador real del palet, no un placeholder genérico); título de desvinculación individual cambia a `"¿Desvincular el palet #{id}?"`; título de desvinculación masiva cambia a `"¿Desvincular todos los palets?"`.
- [ ] `ConfirmActionDialog.jsx` — si el componente no recibe hoy el ID del palet como prop, se añade la prop necesaria y se actualiza el/los caller(s) (`OrderPalletCard`, `OrderPalletTableRow`, `OrderPalletsToolbar` — verificar cuál invoca el diálogo en cada caso) para pasarlo.
- [ ] Ningún título queda en Title Case suelto (`"Eliminar Palet"` desaparece).
- [ ] Los botones de acción (`AlertDialogAction`) mantienen su texto actual ("Eliminar", "Desvincular", "Desvincular todos") — este GAP no cambia el copy de los botones, solo el título y la descripción del diálogo.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx` (líneas ~720-723)
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx` (líneas ~851-855)
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx` (título/descripción, posible prop nueva)
- Callers de `ConfirmActionDialog` que haya que actualizar para pasar el ID del palet (a identificar durante la implementación — probablemente `OrderPallets/OrderPalletCard/index.js`, `OrderPallets/OrderPalletTableRow.jsx`, `OrderPallets/components/OrderPalletsToolbar.jsx`)

## Restricciones

- No cambiar el comportamiento de `onConfirm`/`onCancel` ni la lógica de borrado/desvinculación, solo el copy y el dato adicional necesario para mostrarlo.
- No tocar `OrderAttachments/index.tsx` (ya cumple el estándar, sirve de referencia).
- Si añadir la prop de ID a `ConfirmActionDialog` requiere tocar más de los 3 callers previstos, avisar antes de continuar.

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/index.tsx`
- `.claude/gaps/in-progress/GAP-103-standardize-destructive-confirmation-copy.md`

### Decisiones tomadas durante la implementación

- Se cambiaron los títulos destructivos outlier a formato pregunta.
- Se añadió la frase `"No se puede deshacer."` donde faltaba en líneas auxiliares y líneas previstas.
- `useOrderPallets` ya exponía `confirmPalletId`; no hizo falta modificar el hook ni los callers de card/row/toolbar. Se destructuró en `OrderPallets/index.tsx` y se pasó como prop opcional `palletId` a `ConfirmActionDialog`.
- `ConfirmActionDialog` usa `el palet #{id}` cuando `palletId` está disponible y fallback genérico `el palet` si no lo está.
- Se mantuvo el texto de los botones de acción (`Eliminar`, `Desvincular`, `Desvincular todos`).

### Desviaciones del plan (si las hay)

- Las rutas reales actuales son `.tsx`, no `.js`/`.jsx`.
- No se tocaron `OrderPalletCard`, `OrderPalletTableRow` ni `OrderPalletsToolbar` porque el ID ya estaba centralizado en `confirmPalletId`.
- Algunos archivos del área de palets ya tenían cambios previos en el worktree; se conservaron.

### Checks ejecutados

- `rg -n 'Eliminar línea auxiliar|¿Eliminar línea auxiliar\\?|Eliminar línea prevista|¿Eliminar línea prevista\\?|Eliminar Palet|Desvincular Palet|Desvincular todos los palets|¿Eliminar el palet|¿Desvincular el palet|¿Desvincular todos los palets\\?|No se puede deshacer' ...` — títulos antiguos ausentes; títulos pregunta esperados presentes.
- `rg -n 'Eliminar Palet|Desvincular Palet|¿Eliminar \\$\\{palletLabel\\}|¿Desvincular \\$\\{palletLabel\\}|Esta acción no se puede deshacer|palletId=\\{confirmPalletId\\}|confirmPalletId' ...` — `confirmPalletId` se pasa al diálogo y las descripciones incluyen irreversibilidad.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx src/components/Admin/OrdersManager/Order/OrderPallets/index.tsx` — sin errores; mantiene 1 warning preexistente `react-hooks/immutability` en `OrderPlannedProductDetails/index.tsx:289`, fuera del alcance de este GAP.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.tsx src/components/Admin/OrdersManager/Order/OrderPallets/index.tsx .claude/gaps/in-progress/GAP-103-standardize-destructive-confirmation-copy.md` — correcto.

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
