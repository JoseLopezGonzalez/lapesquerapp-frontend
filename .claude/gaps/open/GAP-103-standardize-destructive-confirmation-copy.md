# GAP-103 — Estandarizar copy de confirmaciones destructivas en el editor de pedidos

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
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
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js` (líneas ~851-855)
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.jsx` (título/descripción, posible prop nueva)
- Callers de `ConfirmActionDialog` que haya que actualizar para pasar el ID del palet (a identificar durante la implementación — probablemente `OrderPallets/OrderPalletCard/index.js`, `OrderPallets/OrderPalletTableRow.jsx`, `OrderPallets/components/OrderPalletsToolbar.jsx`)

## Restricciones

- No cambiar el comportamiento de `onConfirm`/`onCancel` ni la lógica de borrado/desvinculación, solo el copy y el dato adicional necesario para mostrarlo.
- No tocar `OrderAttachments/index.tsx` (ya cumple el estándar, sirve de referencia).
- Si añadir la prop de ID a `ConfirmActionDialog` requiere tocar más de los 3 callers previstos, avisar antes de continuar.

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
