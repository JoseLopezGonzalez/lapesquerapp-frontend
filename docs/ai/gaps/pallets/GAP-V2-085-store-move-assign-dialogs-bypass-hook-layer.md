---
id: GAP-V2-085
title: Diálogos de mover/ubicar palets llaman a palletService directamente y extraen el token en el componente
module: pallets
category: architecture-refactor
priority: P1
risk: medium
size: M
status: ready
dependencies: []
target_files:
  - src/components/Admin/Stores/StoresManager/Store/MovePalletToStoreDialog/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/AddElementToPositionDialog/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx
  - src/services/palletService.ts
  - src/hooks/useStorePositions.ts
  - src/hooks/useStore.ts
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-085 — Diálogos de movimiento de palets llaman al service directamente desde el componente

## Problema

Tres diálogos de la Superficie B (movimientos de almacén) llaman a funciones de
`src/services/palletService.ts` directamente desde el componente, saltándose la capa
de hook por completo (`Componente → hook → service` de CLAUDE.md):

- `src/components/Admin/Stores/StoresManager/Store/MovePalletToStoreDialog/index.tsx:17,58`
  — importa `movePalletToStore` y lo llama directamente en `handleSubmit`.
- `src/components/Admin/Stores/StoresManager/Store/AddElementToPositionDialog/index.tsx:22,68`
  — importa `assignPalletsToPosition` y lo llama directamente en `onSubmit`.
- `src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx:29,148`
  — importa `moveMultiplePalletsToStore` y lo llama directamente en `handleSubmit`.

Dos de los tres (`MovePalletToStoreDialog:14,30-31` y
`AddElementToPositionDialog:23,63-64`) además extraen el token de sesión
**directamente en el componente**:

```tsx
// MovePalletToStoreDialog/index.tsx:30-31
const { data: session } = useSession();
const token = session?.user?.accessToken;
// ...:58
movePalletToStore(palletId, selectedStoreValue, token ?? '');
```

Esto viola dos reglas explícitas de `.claude/rules/api-client.md`: "Token retrieval
uses getAuthToken() inside services — never in components" y la prohibición de
saltarse capas ("Un componente nunca llama a un helper directamente"). El tercer
diálogo (`MoveMultiplePalletsToStoreDialog`) no extrae token porque
`moveMultiplePalletsToStore` ya obtiene el token internamente vía `getAuthToken()`
(`src/services/palletService.ts:335`) — la única función de las cuatro de este
grupo que sigue el patrón correcto — lo que confirma que el problema es
arreglable: el propio archivo demuestra el patrón correcto en la función hermana.

Raíz del problema en el service: `assignPalletsToPosition` (`palletService.ts:273`),
`movePalletToStore` (:300) y `removePalletPosition` (:356) reciben `token` como
parámetro (anti-patrón token-as-parameter, PL-010), obligando a cualquier llamador a
extraer la sesión manualmente. `moveMultiplePalletsToStore` (:331-335) no lo hace y
usa `getAuthToken()` internamente — inconsistencia dentro del mismo archivo.

Consecuencia adicional detectada en el mismo análisis (dos de los tres diálogos sin
guard de pending/`isSubmitting`): **normalizada por separado en GAP-V2-099**
(mismo módulo, mismos dos componentes), para no duplicar la corrección en dos
GAPs. Este GAP se acota exclusivamente a la capa de llamada (service directo desde
componente + token-as-parameter); el guard de `isSubmitting`/doble envío se
implementa y verifica en GAP-V2-099. Si GAP-V2-085 se implementa primero (moviendo
las llamadas a un hook con `useMutation`), el estado `isSubmitting` de GAP-V2-099
puede derivarse directamente de `isPending` de la mutación en vez de un `useState`
manual — documentar esa simplificación en las notas de implementación de
GAP-V2-099 si aplica.

## Objetivo

Las tres operaciones de movimiento/ubicación de palets se invocan desde un hook
(`useMutation` o wrapper equivalente), no directamente desde el componente. Ningún
componente de este grupo extrae el token de sesión. (El guard de `isSubmitting`
durante el envío se cubre en GAP-V2-099, no es objetivo de este GAP.)

## Contexto

Los tres diálogos ya reciben su estado de UI (open/close, datos seleccionados) desde
`useStoreContext()` / `useStoreDialogs.ts`, así que el punto natural para las
llamadas HTTP es ese mismo hook (o un hook hermano dedicado a las mutaciones de
movimiento), no el componente. Este GAP es independiente del hallazgo de
GAP-V2-025/026 (orders): aquellos cubren `src/hooks/orders/useOrderPallets.ts`
(sub-hook de `useOrder`), un archivo completamente distinto al aquí referenciado.

## Solución propuesta

- En `src/services/palletService.ts`, hacer que `assignPalletsToPosition`,
  `movePalletToStore` y `removePalletPosition` obtengan el token internamente con
  `getAuthToken()` (como ya hace `moveMultiplePalletsToStore`), eliminando el
  parámetro `token` de sus firmas públicas.
- Mover las llamadas a estas tres funciones desde los componentes hacia
  `useStoreDialogs.ts` (o un hook nuevo `useStorePalletMovements.ts` si se prefiere
  aislar responsabilidad), exponiendo funciones como `moveToStore`,
  `assignToPosition` con su propio estado `isSubmitting`/`isPending`.
- Actualizar `useStorePositions.ts:217-219` (`removePalletPosition(palletId, token)`)
  para dejar de recibir/forwardear `token` una vez el service lo obtenga
  internamente; limpiar el parámetro `token` de `useStore.ts` en cascada si deja de
  ser necesario en algún consumidor (verificar primero si `openDuplicatePalletDialog`
  en `useStoreDialogs.ts:152-156` sigue necesitando el guard de token — si
  `getPallet` ya usa `getAuthToken()` internamente, ese guard también podría
  simplificarse, pero no es obligatorio para este GAP).
- No incluir aquí el guard de `isSubmitting`/deshabilitado de botón — se
  implementa y verifica en GAP-V2-099 (mismos dos componentes).

## Criterios de aceptación

- [ ] Ningún componente bajo `src/components/Admin/Stores/StoresManager/Store/**`
      importa funciones de `@/services/palletService` directamente.
- [ ] `assignPalletsToPosition`, `movePalletToStore`, `removePalletPosition` ya no
      reciben `token` como parámetro.
- [ ] Ningún componente de este grupo llama a `useSession()` para extraer
      `accessToken`.
- [ ] Las tres operaciones (mover, ubicar, mover múltiples) siguen funcionando igual
      desde la UI.
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "from '@/services/palletService'" src/components/Admin/Stores/
# debe devolver 0 resultados tras el fix
# Manual: abrir un almacén, mover un palet individual, ubicar un palet sin ubicar
# en una posición, mover varios palets a la vez. Confirmar que el comportamiento
# visible no cambia.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** categoría cambiada de
`code-quality` a `architecture-refactor` (violación de la capa
componente→hook→service, no solo estilo de código). Se retiró el criterio de
`isSubmitting`/doble envío de este GAP porque duplica exactamente el alcance de
GAP-V2-099 (carril ui-audit-agent, mismos 2 componentes) — queda como nota de
implementación para quien resuelva GAP-V2-099: si este GAP (085) se implementa
primero, el `isSubmitting` de 099 puede derivarse de `isPending` de la mutación en
vez de un `useState` manual nuevo. Complementa (no se fusiona con) GAP-V2-087,
que cubre la sincronización de la query de `useStoreData` tras estas mutaciones —
GAP-V2-087 depende explícitamente de este GAP.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-025, GAP-V2-026 (orders, hook distinto — sin
  solapamiento), GAP-V2-099 (isSubmitting de estos mismos 2 componentes,
  normalizado por separado), GAP-V2-087 (depende de este GAP)
