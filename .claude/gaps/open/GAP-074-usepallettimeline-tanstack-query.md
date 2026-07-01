# GAP-074 — Migrar usePalletTimeline a TanStack Query + queryKeys

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock / Palets
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/usePalletTimeline.ts` carga el historial de un palet con `useEffect` + `useState`
+ `useSession` para token, en lugar del patrón estándar del proyecto (TanStack Query + factories
en `queryKeys.ts`).

Impacto actual:
- Sin caché ni staleTime consistente con el resto del módulo
- Lógica de fetch duplicada entre `useEffect` inicial y `refetch` manual
- Acoplado al anti-patrón token-as-parameter (se resuelve en GAP-072 para el service)

Detectado en auditoría `/audit-code quality pallet editor` (2026-07-01).

---

## Solución acordada

1. Añadir factory en `src/lib/routes/queryKeys.ts`:
   ```ts
   export const palletTimelineKeys = {
     detail: (tenantId, palletId) => [...] as const,
     detailPrefix: (tenantId, palletId) => [...] as const,
   };
   ```
2. Reescribir `usePalletTimeline.ts` con `useQuery`:
   - `queryKey`: `palletTimelineKeys.detail(tenantId, palletId)`
   - `queryFn`: `() => palletService.getPalletTimeline(palletId)` (sin token tras GAP-072)
   - `enabled`: `!!tenantId && isValidPalletId(palletId)`
   - `staleTime`: 60_000 (1 min — datos operativos de palet, coherente con hooks rules)
3. Mantener contrato de retorno compatible con consumidores actuales:
   ```ts
   { timeline, loading, error, refetch }
   ```
   Mapear `isLoading` → `loading`, `error?.message` → `error` si los componentes esperan string.
4. Eliminar `useEffect` manual, `requestIdRef` y estado local de timeline/loading/error.

**Dependencia recomendada:** Implementar después de GAP-072 (service sin token). Si se hace
antes, el `queryFn` puede usar token temporalmente y ajustarse en el mismo PR que GAP-072.

---

## Referencias e inspiración

- `.claude/rules/hooks.md` — patrón useQuery para server state
- `usePalletAttachments.ts` — referencia en el mismo módulo (queryKeys + mutations)
- GAP-030 — factories queryKey centralizadas
- PL-011 — prohibido helper local de queryKey

## Criterios de aceptación

- [ ] `usePalletTimeline.ts` usa `useQuery` de TanStack Query
- [ ] `queryKey` viene de `palletTimelineKeys` en `queryKeys.ts` (no array inline)
- [ ] `enabled` condiciona tenant + palletId válido (no `'new'`, no `temp-*`)
- [ ] No queda `useEffect` para cargar timeline desde API
- [ ] `refetch()` expuesto y funcional (pestaña Historial al abrir)
- [ ] Contrato de retorno compatible con `HistorialTab` y otros consumidores sin cambios de UX
- [ ] `npm run type-check` limpio

## Archivos a crear o modificar

- `src/hooks/usePalletTimeline.ts`
- `src/lib/routes/queryKeys.ts`

**Verificar consumidores (sin cambios salvo tipos si hace falta):**
- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/HistorialTab.tsx`
- Cualquier otro import de `usePalletTimeline`

## Restricciones

- No cambiar forma de los eventos del timeline ni el endpoint
- No añadir polling — solo fetch on mount + refetch manual
- No mezclar con refactor de UI del timeline

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
