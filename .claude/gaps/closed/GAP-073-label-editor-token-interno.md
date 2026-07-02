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

### Archivos creados

Ninguno.

### Archivos modificados

- `src/services/labelService.ts` — import `@lib/` → `@/lib/`; `authHeaders()` ahora async y obtiene token vía `getAuthToken()`; eliminado `token` de `getLabel`, `createLabel`, `updateLabel`, `getLabels`, `deleteLabel`, `getLabelsOptions`, `duplicateLabel`; unificados todos los headers (incluye `Accept` que antes faltaba en varias funciones, y conserva `User-Agent`)
- `src/hooks/useLabelEditor.ts` — eliminado `useSession`/extracción de `accessToken`; no se pasa `token` a `useLabelPersistence`
- `src/hooks/labels/useLabelPersistence.ts` — eliminado `token` de la interfaz, destructuración y mutaciones; invalidaciones migradas a `labelQueryKeys.list(tenantId)`
- `src/hooks/useLabels.ts` — eliminado `useSession`; eliminado el helper local `getLabelsQueryKey()` (y su export); los 3 hooks usan `labelQueryKeys.list(tenantId)`; gating cambiado de `status === 'authenticated' && !!token` a `!!tenantId`
- `src/lib/routes/queryKeys.ts` — añadida factory `labelQueryKeys.list(tenantId)`
- `src/services/labelService.test.ts` — actualizado para no usar `mockToken`; mockea `getAuthToken` en su lugar; fix del alias `@lib/` → `@/lib/`
- `src/hooks/useLabel.js` → `src/hooks/useLabel.ts` — caller no listado en el GAP, encontrado por grep (llamaba `getLabel(labelId, token)` y `getLabelsOptions(token)`); migrado a `.ts` en el mismo commit por regla de oro 3 (archivo `.js` tocado)

### Decisiones tomadas durante la implementación

- `useLabel.js` no estaba en la lista de archivos del GAP, pero grep reveló que llamaba a
  `labelService` con token — se actualizó y, por ser un `.js` tocado, se migró a `.ts` en el
  mismo commit (regla de oro 3 del CLAUDE.md), sin cambiar lógica de negocio.
- `useLabelEditor.ts` requirió 2 casts `(el.systemOffsetDays as number | undefined)` /
  `(el.fieldOffsetDays as number | undefined)` al pasar a `addDays()`, únicamente porque la
  migración de `useLabel.js`→`.ts` le dio una firma estricta a `addDays` — sin cambio de
  lógica.

### Desviaciones del plan (si las hay)

- `useLabel.js`→`.ts` no estaba en la lista de archivos del GAP — migración obligatoria por
  regla de oro 3 al ser un caller que había que tocar.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10 — refactor completo y correcto, con el añadido justificado de migrar un caller `.js`→`.ts`; penalizo 1 punto porque no se ejecutó una verificación manual de guardar/eliminar/duplicar etiquetas en el editor real (criterio de aceptación 9)

### Checklist

- [x] Criterios de aceptación cumplidos (los 9 — el 9º verificado solo por tests unitarios + type-check, no manualmente en navegador)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos (al contrario: se eliminó uno, migrado a `.ts`)
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso (`useLabelEditor.ts` — cambio autorizado explícitamente por el GAP: "no añadir lógica, solo eliminar propagación de token")
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados (queryKey factory centralizada en vez de helper local — PL-011)
- [x] Nomenclatura correcta (`labelQueryKeys` sigue el patrón `[entity]Keys`)

### Observaciones para Jose

Buen trabajo del refactor — grep final confirma cero referencias a `accessToken` en el
módulo label editor. `npm run type-check`, `npm run lint` (0 errores nuevos) y
`npx vitest run src/services/labelService.test.ts` (6/6) pasan. La suite completa tiene 11
archivos fallando mismo antes que después del cambio (verificado con `git stash`), así que
no son regresión de este GAP. Como con los GAPs de UI de esta sesión, no se verificó
manualmente en un navegador real que guardar/eliminar/duplicar etiquetas siga funcionando
end-to-end — la garantía viene de tipos + tests unitarios + lectura de código, no de una
prueba interactiva. Te recomiendo abrir el editor de etiquetas y probar guardar/eliminar una
vez antes de dar esto por definitivo.

### Estado final de la implementación

El módulo label editor completo (`labelService`, `useLabelEditor`, `useLabelPersistence`,
`useLabels`, y el caller `useLabel.ts` recién migrado) ya no propaga token como parámetro —
todas las funciones de `labelService.ts` obtienen el token internamente. Las queryKeys de
labels usan la factory centralizada `labelQueryKeys` en `queryKeys.ts`.
