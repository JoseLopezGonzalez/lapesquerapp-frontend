# GAP-073 — Eliminar token-as-parameter en módulo label editor

## Metadata

- **Tipo:** Refactor
- **Módulo:** Etiquetas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Auditoría `/audit-code quality pallet editor` (2026-07-01). El módulo label editor mantiene
el anti-patrón PL-010 de forma sistemática: `labelService.ts` exige `token: string` en todas
sus funciones y los hooks extraen `accessToken` de `useSession()` para pasarlo.

**Instancias detectadas:**

| Archivo | Patrón |
|---|---|
| `src/services/labelService.ts` | Todas las funciones CRUD reciben `token: string` |
| `src/services/labelService.ts:1` | Import `@lib/fetchWithTenant` (alias incorrecto PL-BUILD-02) |
| `src/hooks/useLabelEditor.ts:242-243,318` | `useSession()` → token → `useLabelPersistence` |
| `src/hooks/labels/useLabelPersistence.ts:24,54,152,164` | Propaga token a `createLabel` / `updateLabel` / `deleteLabel` |
| `src/hooks/useLabels.ts:15-16,21,32,46` | `useSession()` + `getLabelsQueryKey()` local + token a services |

`useLabelPrint.ts` y `useLabelCanvasInteraction.ts` no usan token — fuera de scope.

---

## Solución acordada

1. **`labelService.ts`**:
   - Corregir import: `@lib/fetchWithTenant` → `@/lib/fetchWithTenant`
   - En cada función exportada, obtener token con `getAuthToken()` internamente
   - Eliminar parámetro `token` de firmas: `getLabel`, `createLabel`, `updateLabel`,
     `getLabels`, `deleteLabel`, `getLabelsOptions`, `duplicateLabel`
   - Eliminar helper `authHeaders(token)` o refactorizar para usar token interno
2. **`useLabelEditor.ts`**: eliminar extracción de `accessToken`; no pasar `token` a
   `useLabelPersistence`
3. **`useLabelPersistence.ts`**: eliminar prop `token` y argumentos token en mutaciones
4. **`useLabels.ts`**:
   - Eliminar `useSession` para token
   - Mover `getLabelsQueryKey()` a factory en `src/lib/routes/queryKeys.ts` (PL-011)
   - Actualizar invalidaciones para usar la factory centralizada
5. Grep de todos los callers de `labelService` en el repo y actualizar en el mismo commit

---

## Referencias e inspiración

- PL-010, PL-011 (queryKey factories centralizadas)
- PL-BUILD-02 (alias `@/` vs `@lib/`)
- GAP-028, GAP-056 (mismo patrón en orderService)
- GAP-030 (factories queryKey — añadir `labelQueryKeys` si no existe)

## Criterios de aceptación

- [ ] Ninguna función de `labelService.ts` recibe `token` como parámetro
- [ ] `labelService.ts` usa `@/lib/fetchWithTenant` (no `@lib/`)
- [ ] `useLabelEditor.ts` no extrae `accessToken` para HTTP
- [ ] `useLabelPersistence.ts` no recibe ni reenvía `token`
- [ ] `useLabels.ts` no extrae `accessToken`; usa factory de `queryKeys.ts`
- [ ] Factory `labelQueryKeys` (o equivalente) existe en `src/lib/routes/queryKeys.ts`
- [ ] Grep de `labelService` sin callers que pasen token
- [ ] `npm run type-check` limpio
- [ ] Guardar, eliminar, listar y duplicar etiquetas en el editor siguen funcionando

## Archivos a crear o modificar

**Modificar:**
- `src/services/labelService.ts`
- `src/hooks/useLabelEditor.ts`
- `src/hooks/labels/useLabelPersistence.ts`
- `src/hooks/useLabels.ts`
- `src/lib/routes/queryKeys.ts` — añadir factories de labels

**Verificar (grep callers):**
- Cualquier componente o hook que importe funciones de `labelService` con token

## Restricciones

- No añadir lógica a `useLabelEditor.ts` — solo eliminar propagación de token
- No refactorizar canvas, impresión ni validación de elementos
- No inventar endpoints ni campos de API
- Verificar type-check completo antes de push (PL-BUILD-05)

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
