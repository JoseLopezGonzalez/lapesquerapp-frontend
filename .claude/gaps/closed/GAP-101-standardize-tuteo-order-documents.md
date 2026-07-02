# GAP-101 — Estandarizar registro (tuteo) en OrderDocuments y orderEditSchema

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-design copy order editor`. El editor de pedidos usa mayoritariamente tuteo ("Selecciona") en mensajes de validación y placeholders: `OrderIncident/index.js:64,179`, `useOrderPallets.js:223,528,589`, `OrderPallets/dialogs/CreateFromForecastDialog.jsx:70`, `OrderPallets/dialogs/StoreSelectionDialog.jsx:51`, `OrderExport/index.js:82`.

Sin embargo, `OrderDocuments/index.tsx` y `OrderEditSheet/schemas/orderEditSchema.ts` usan "usted" ("Seleccione") de forma consistente entre sí pero como outlier frente al resto del módulo.

Jose confirmó fijar el tuteo como registro estándar del editor de pedidos.

## Solución acordada

Cambiar todas las apariciones de "Seleccione" (usted) en `OrderDocuments/index.tsx` y `orderEditSchema.ts` a "Selecciona" (tuteo), manteniendo el resto del mensaje sin cambios.

## Referencias e inspiración

- Patrón mayoritario ya existente: `useOrderPallets.js:223` — `notify.error({ title: 'Selecciona al menos un palet' })`.

## Criterios de aceptación

- [ ] `OrderDocuments/index.tsx:217` — `'Por favor seleccione un documento'` → `'Selecciona un documento'` (alineado además con el criterio "sin 'Por favor'" ya aplicado al resto del módulo).
- [ ] `OrderDocuments/index.tsx:227` — `'Por favor seleccione al menos un destinatario'` → `'Selecciona al menos un destinatario'`.
- [ ] `OrderDocuments/index.tsx:545` — `'Seleccione un documento para enviarlo a múltiples destinatarios.'` → `'Selecciona un documento para enviarlo a múltiples destinatarios.'`.
- [ ] `OrderDocuments/index.tsx:554` — placeholder `"Seleccione un documento"` → `"Selecciona un documento"`.
- [ ] `OrderEditSheet/schemas/orderEditSchema.ts:13` — mensaje de validación Zod `'Seleccione un comercial'` → `'Selecciona un comercial'`.
- [ ] No quedan apariciones de "Seleccione" en `OrderDocuments/index.tsx` ni en `orderEditSchema.ts` (verificar con grep).
- [ ] No se modifica ningún otro texto, prop, ni lógica de validación además del literal de idioma.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx` (líneas 217, 227, 545, 554)
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/schemas/orderEditSchema.ts` (línea 13)

## Restricciones

- No cambiar el registro en ningún otro archivo del proyecto fuera del editor de pedidos — este GAP no busca fijar un estándar global de la app, solo resolver la inconsistencia dentro de este módulo.
- No modificar la lógica de validación de Zod, solo el string del mensaje.
- No tocar otros mensajes de `OrderDocuments/index.tsx` que ya usan tuteo o no tienen conjugación de "usted/tú".

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/schemas/orderEditSchema.ts`
- `.claude/gaps/in-progress/GAP-101-standardize-tuteo-order-documents.md`

### Decisiones tomadas durante la implementación

- Se cambiaron únicamente las apariciones de "Seleccione"/"Por favor seleccione" solicitadas por el GAP.
- Se mantuvo intacta la lógica de validación Zod y los flujos de envío de documentos.

### Desviaciones del plan (si las hay)

- `OrderDocuments/index.tsx` ya tenía cambios previos en el worktree. Se conservaron y solo se tocaron los literales de este GAP.

### Checks ejecutados

- `rg -n 'Seleccione|Por favor seleccione|Selecciona un documento|Selecciona al menos un destinatario|Selecciona un comercial' src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx src/components/Admin/OrdersManager/Order/OrderEditSheet/schemas/orderEditSchema.ts` — sin apariciones de "Seleccione"; textos esperados presentes.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx src/components/Admin/OrdersManager/Order/OrderEditSheet/schemas/orderEditSchema.ts` — correcto.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx src/components/Admin/OrdersManager/Order/OrderEditSheet/schemas/orderEditSchema.ts .claude/gaps/in-progress/GAP-101-standardize-tuteo-order-documents.md` — correcto.

---

## Auditoría

> Auditoría ligera ejecutada por Codex el 2026-07-02.

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos según revisión documental y comprobaciones puntuales
- [x] Sin fetch() directo nuevo detectado en el alcance del GAP
- [x] Sin hardcode de tenant detectado
- [x] Sin archivos .js nuevos creados por el GAP
- [x] Sin any sin justificación detectado en la revisión ligera
- [x] Hooks gigantes no tocados fuera del alcance aprobado
- [x] entitiesConfig.js no tocado fuera del alcance aprobado
- [x] Patrones del workflow de GAP respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

- `npm run type-check` pasa limpio en el estado actual del repositorio.
- Auditoría intencionadamente ligera: se revisaron criterios, implementación documentada y búsquedas puntuales de regresión; no se ejecutó smoke test visual/manual completo con backend real.
- Las observaciones o warnings preexistentes documentados en la implementación quedan fuera de alcance y no bloquean el cierre.

### Estado final de la implementación

GAP aprobado con observaciones y listo para cierre.
