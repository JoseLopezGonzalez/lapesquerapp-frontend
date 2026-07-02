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

### Archivos creados

Ninguno.

### Archivos modificados

- `src/lib/routes/queryKeys.ts` — añadida factory `palletTimelineKeys` con `detail(tenantId, palletId)` y `detailPrefix(tenantId, palletId)`, siguiendo el mismo patrón que `palletAttachmentKeys` (par list/listPrefix ya existente en el mismo archivo).
- `src/hooks/usePalletTimeline.ts` — reescrito completamente con `useQuery` de TanStack Query. Eliminados `useState`, `useEffect`, `useCallback`, `useRef` (`requestIdRef`) y la lógica manual de "carrera de peticiones" (ya no hace falta: TanStack Query gestiona cancelación/orden de resultados). `queryKey` viene de `palletTimelineKeys.detail(tenantId, palletId)`. `queryFn` llama a `getPalletTimeline(palletId)` sin token (confirmado que GAP-072 ya migró `palletService.ts` a `getAuthToken()` interno). `enabled: !!tenantId && isValid`. `staleTime: 60_000` (1 min, dato operativo de palet, según regla de hooks.md). El contrato de retorno se mantiene idéntico: `{ timeline, loading, error, refetch }`, mapeando `isLoading` → `loading` y devolviendo `error` como `Error | null` (antes ya era así, se preserva).

### Decisiones tomadas durante la implementación

- Verifiqué primero que GAP-072 (cerrado) ya había migrado `getPalletTimeline` en `src/services/palletService.ts` para no requerir `token` como parámetro — confirmado por lectura directa del archivo, así el `queryFn` no necesita resolver token ni usar `useSession()`.
- `getCurrentTenant()` se llama condicionado a `typeof window !== 'undefined'`, replicando el patrón exacto usado en `usePalletAttachments.ts` y en el resto de hooks de listado del proyecto (`.claude/rules/hooks.md`).
- `refetch` se expone como `() => { void refetch(); }` para mantener la firma `() => void` del contrato original (el `refetch` nativo de `useQuery` devuelve una `Promise`, y los consumidores actuales no esperan ese valor de retorno).
- Añadí `detailPrefix` en la factory tal y como pedía el GAP aunque no se use activamente en este hook (no hay mutaciones en este stack que invaliden el timeline por ahora) — se deja disponible por si un futuro GAP añade invalidación cruzada (p. ej. tras crear/editar palet), consistente con el patrón `listPrefix` de `palletAttachmentKeys`.
- No se tocó `PalletView/index.tsx`, `MobilePalletView/index.tsx` ni `HistorialTab.tsx`: los tres consumen el hook mediante el contrato `{ timeline, loading, error, refetch }` sin cambios, y `HistorialTab.tsx` ni siquiera importa el hook (recibe `timeline`/`timelineLoading` por props desde su padre).

### Desviaciones del plan (si las hay)

Ninguna. Scope respetado exactamente según la lista de archivos del GAP (`usePalletTimeline.ts` y `queryKeys.ts`).

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10 — implementación limpia y fiel al patrón de referencia (`usePalletAttachments.ts`); resto 1 punto por `detailPrefix` definido pero no consumido en este GAP (documentado como decisión, no bloqueante)

### Checklist

Criterios de aceptación del GAP:
- [x] `usePalletTimeline.ts` usa `useQuery` de TanStack Query — CUMPLIDO
- [x] `queryKey` viene de `palletTimelineKeys` en `queryKeys.ts` (no array inline) — CUMPLIDO
- [x] `enabled` condiciona tenant + palletId válido (no `'new'`, no `temp-*`) — CUMPLIDO, reutiliza `isValidPalletId` intacta
- [x] No queda `useEffect` para cargar timeline desde API — CUMPLIDO, grep confirma cero `useState`/`useEffect`/`useCallback`/`useRef` en el archivo
- [x] `refetch()` expuesto y funcional (pestaña Historial al abrir) — CUMPLIDO, verificado contra los 2 call sites (`PalletView/index.tsx:315,621`, `MobilePalletView/index.tsx:166`)
- [x] Contrato de retorno compatible con `HistorialTab` y otros consumidores sin cambios de UX — CUMPLIDO, `{ timeline, loading, error, refetch }` idéntico; `HistorialTab.tsx` ni siquiera importa el hook (recibe props del padre)
- [x] `npm run type-check` limpio — CUMPLIDO, exit 0, sin errores relacionados ni preexistentes

Checklist técnico del proyecto:
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación (grep confirma cero usos de `any` en ambos archivos)
- [x] Hooks gigantes no tocados sin permiso (usePalletTimeline no está en la lista de protegidos; cambio autorizado explícitamente por el GAP)
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados (factory de queryKeys, staleTime 60s para dato operativo, contrato `{ data, ...isLoading→loading, error, refetch }` de hooks.md)
- [x] Nomenclatura correcta (`palletTimelineKeys`, `usePalletTimeline` — camelCase/use-prefix consistente con `palletAttachmentKeys`/`usePalletAttachments`)
- [x] queryKeys usan factories de queryKeys.ts (no arrays inline) — regla ESLint verificada con `npx eslint` sobre ambos archivos, sin warnings
- [x] Errores de API — no aplica notify.error aquí (el hook no gestiona toasts, igual que la versión original; los consumidores deciden cómo mostrar `error`)

### Observaciones para Jose

Implementación sólida y minimalista. Confirmé primero que GAP-072 ya había eliminado el
parámetro `token` de `getPalletTimeline` en `palletService.ts` — el `queryFn` es una llamada
directa de una línea, sin gestión de auth en el hook (correcto).

El `useEffect`/`useState`/`useRef` de "carrera de peticiones" (`requestIdRef`) desaparece por
completo: TanStack Query resuelve ese problema internamente al indexar por `queryKey`, así que
no hace falta reimplementarlo.

Único punto de observación, no bloqueante: la factory `palletTimelineKeys.detailPrefix` se
definió tal como pedía el GAP, pero no se consume en ningún sitio de este PR porque no hay
mutaciones en el stack de palet que invaliden el timeline (el patrón actual es `refetch()`
manual al abrir la pestaña Historial, que ya funcionaba así en la versión anterior). Si en el
futuro se añade una mutación que deba invalidar el timeline automáticamente (p. ej. tras
`updatePallet`), ya existe la factory lista para usar con
`queryClient.invalidateQueries({ queryKey: palletTimelineKeys.detailPrefix(tenantId, palletId) })`.

Nota aparte (no relacionada con este GAP): `queryKeys.ts` tenía cambios preexistentes sin
commitear en `labelQueryKeys` de otra tarea en curso en el working tree — no los toqué, solo
inserté `palletTimelineKeys` en su sección correspondiente junto a `palletAttachmentKeys`.

No pude verificar en navegador que la pestaña Historial recarga visualmente al abrir (criterio
de aceptación 5) — solo verificación estática (lectura de código + tipos + grep de call sites).
Recomiendo una prueba manual rápida abriendo un palet real y la pestaña Historial antes de dar
esto por 100% verificado en producción.

### Estado final de la implementación

`usePalletTimeline.ts` ahora sigue el patrón estándar TanStack Query del proyecto: `useQuery`
con `queryKey` desde `palletTimelineKeys.detail(tenantId, palletId)`, `enabled` condicionado a
tenant + palletId válido, `staleTime: 60_000`. El contrato de retorno
`{ timeline, loading, error, refetch }` se mantiene sin cambios para los dos consumidores
(`PalletView/index.tsx`, `MobilePalletView/index.tsx`), que no requirieron ninguna modificación.
`npm run type-check` y `eslint` limpios en ambos archivos tocados.
