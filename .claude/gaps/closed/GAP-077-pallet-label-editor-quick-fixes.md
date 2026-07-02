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

### Archivos creados

Ninguno.

### Archivos modificados

- `src/app/admin/label-editor/page.js` — eliminado import muerto `StoresManager`
- `src/services/labelService.ts` — **no tocado en este GAP**: GAP-073 (implementado en la
  misma sesión, antes que este) ya corrigió el alias `@lib/` → `@/lib/fetchWithTenant` como
  parte de su propio scope. Verificado con grep — FND-PE-003 queda N/A.

### Decisiones tomadas durante la implementación

- FND-PE-002 (deuda JS legacy en rutas pallet) no requiere acción — el propio GAP dice
  explícitamente "este GAP no migra esos archivos, solo documenta la deuda". Ya está
  documentado en el contexto del GAP, no hace falta ninguna acción adicional.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — import muerto eliminado, alias ya resuelto por GAP-073 sin duplicar trabajo

### Checklist

- [x] Criterios de aceptación cumplidos (`label-editor/page.js` sin `StoresManager`; ruta renderiza solo `LabelEditor`; `labelService.ts` usa `@/lib/fetchWithTenant` vía GAP-073; lint/type-check sin errores nuevos)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

FND-PE-003 se coordinó correctamente con GAP-073 tal como preveía el propio GAP — sin
duplicar el fix del alias. FND-PE-002 queda documentado como deuda, sin acción (por diseño
del GAP).

### Estado final de la implementación

`/admin/label-editor` ya no importa `StoresManager` sin usar. `labelService.ts` usa el alias
correcto `@/lib/fetchWithTenant` (resuelto por GAP-073).
