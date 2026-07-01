# GAP-077 — Quick fixes pallet + label editor (imports muertos y limpieza menor)

## Metadata

- **Tipo:** Mejora
- **Módulo:** Stock / Etiquetas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Batch de hallazgos **Improvement** de la auditoría `/audit-code quality pallet editor`
(2026-07-01). Cambios pequeños, sin lógica de negocio nueva.

### FND-PE-001 — Import muerto en label-editor page

`src/app/admin/label-editor/page.js:2`:
```js
import StoresManager from '@/components/Admin/Stores';
```
No se usa en el render. Solo se monta `<LabelEditor />`.

### FND-PE-002 — Deuda JS legacy en rutas pallet (documentación, sin migración)

Rutas y clientes en `.js` dentro del scope auditado:
- `src/app/admin/pallets/[id]/page.js`, `PalletClient.js`
- `src/app/admin/pallets/create/page.js`, `PalletCreateClient.js`
- `src/services/domain/pallets/palletService.js`

**Este GAP no migra esos archivos** — solo documenta la deuda. La migración JS→TS es scope
de un GAP `/audit-code migrate` futuro si Jose lo promueve.

### FND-PE-003 — Alias `@lib/` en labelService (si GAP-073 no lo corrige antes)

`src/services/labelService.ts:1` usa `@lib/fetchWithTenant`. Si GAP-073 se implementa primero,
este ítem queda cubierto — el implementador verifica y marca N/A.

---

## Solución acordada

1. Eliminar import muerto `StoresManager` de `src/app/admin/label-editor/page.js`
2. Si `labelService.ts` aún tiene `@lib/fetchWithTenant` al implementar este GAP, corregir a
   `@/lib/fetchWithTenant` (una línea)
3. No migrar archivos `.js` legacy en este GAP

---

## Criterios de aceptación

- [ ] `src/app/admin/label-editor/page.js` no importa `StoresManager`
- [ ] La ruta `/admin/label-editor` sigue renderizando `LabelEditor` correctamente
- [ ] Si se tocó `labelService.ts`, el import usa `@/lib/fetchWithTenant`
- [ ] `npm run lint` y `npm run type-check` sin errores nuevos

## Archivos a crear o modificar

- `src/app/admin/label-editor/page.js` — eliminar import muerto
- `src/services/labelService.ts` — solo si GAP-073 no está hecho (fix alias)

## Restricciones

- No migrar `.js` → `.tsx` en este GAP
- No refactorizar `LabelEditor` ni rutas de pallet
- Coordinar con GAP-073 para no duplicar trabajo en `labelService.ts`

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
