# GAP-101 — Estandarizar registro (tuteo) en OrderDocuments y orderEditSchema

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
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
