---
id: GAP-V2-058
title: usePallet fetches pallet/orders/products via useEffect+useState instead of TanStack Query, causing duplicate network requests per dialog open
module: pallets
category: architecture-refactor
priority: P1
risk: high
size: L
status: blocked
dependencies: []
target_files:
  - src/hooks/usePallet.ts
  - src/components/Admin/Pallets/PalletDialog/index.tsx
  - src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx
  - src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-058 — usePallet bypasses TanStack Query and is called twice per dialog open

## Problema

`src/hooks/usePallet.ts` (302 líneas, ya "refactorizado" en GAP-005 hacia sub-hooks
`hooks/pallets/*`) sigue gestionando los tres fetches de datos del editor de palet
(`getPallet`, `getActiveOrdersOptions`, `getProductOptions`) con el patrón
`useState`+`useEffect` (líneas 44-59 declaran `pallet`, `activeOrdersOptions`,
`productsOptions`, `loading`, etc. como estado local; el `useEffect` de las líneas
74-148 dispara las tres llamadas). Esto viola dos reglas activas de
`.claude/rules/hooks.md` / CLAUDE.md § REACT PATTERNS: "no server data en `useState`
local" y "useEffect no debe usarse como mecanismo de fetching — usar TanStack Query".

El síntoma concreto que esto produce: `usePallet` se invoca **tres veces
independientes** para el mismo `palletId` en el flujo normal de apertura del diálogo:

1. `src/components/Admin/Pallets/PalletDialog/index.tsx:80-87` — con
   `skipBackendSave: true`, solo para leer `temporalPallet` (título del diálogo,
   badge de recepción).
2. `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx:154` — vista
   desktop.
3. `src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx:126-132`
   — vista mobile (mutuamente excluyente con la anterior, pero el punto 1 más el
   punto 2 o 3 sí conviven siempre).

Como `usePallet` no usa `useQuery` (sin caché, sin dedupe, sin `staleTime`), cada
apertura del diálogo de palet dispara como mínimo el doble de peticiones HTTP
necesarias: `GET pallets/{id}`, `GET orders` (opciones activas) y `GET products`
(opciones) se piden una vez desde `PalletDialog` y otra vez desde
`PalletView`/`MobilePalletView`.

## Objetivo

`usePallet` obtiene los tres recursos de servidor (`pallet`, `activeOrdersOptions`,
`productsOptions`) vía `useQuery` de TanStack Query, con `queryKey` factories en
`src/lib/routes/queryKeys.ts`, `enabled: !!tenantId && ...` y `staleTime` acorde a
`rules/hooks.md`. `PalletDialog` y `PalletView`/`MobilePalletView` comparten la
misma entrada de caché para el mismo `palletId` — abrir el diálogo ya no duplica
peticiones de red.

## Contexto

`usePallet`/sub-hooks de `hooks/pallets/*` fueron migrados a TypeScript y
reorganizados en GAP-005 (ver PL-019), pero esa migración fue estructural (dividir
el archivo), no arquitectónica (seguir usando `useState`+`useEffect` para datos de
servidor). El estado local editable (`temporalPallet`, borrador de cajas) es
legítimamente local — no es servidor — pero la fuente `pallet` (snapshot original)
sí debería venir de `useQuery`.

## Solución propuesta

- Extraer un nuevo sub-hook `hooks/pallets/usePalletQuery.ts` (o similar) que
  encapsule `useQuery` para `getPallet(id)`, con `queryKey: palletKeys.detail(tenantId, id)`.
- Migrar `getActiveOrdersOptions` y `getProductOptions` a sus propios `useQuery`
  (posiblemente ya compartibles con otros módulos si existen hooks equivalentes
  para pedidos/productos — revisar antes de crear nuevos).
- `usePallet` pasa a orquestar estos `useQuery` en vez de `useState`+`useEffect`;
  `temporalPallet` se sigue derivando localmente del `data` de la query (mismo
  patrón que ya usa para "borrador editable").
- Verificar que `PalletDialog` no necesite volver a llamar `usePallet` completo
  solo para leer `receptionId`/título — si se comparte la queryKey, la llamada ya
  no duplica la petición de red aunque siga habiendo dos invocaciones del hook.

## Criterios de aceptación

- [ ] `usePallet` no contiene `useState`+`useEffect` para datos de servidor —
      usa `useQuery` para pallet, opciones de pedidos y opciones de productos.
- [ ] Abrir el diálogo de palet dispara cada petición HTTP relevante una sola vez
      (verificar con Network tab: `GET pallets/{id}` una vez, no dos).
- [ ] `queryKey` usa factories de `src/lib/routes/queryKeys.ts` — no arrays inline.
- [ ] Comportamiento funcional idéntico: creación, edición, guardado, descarte de
      cambios siguen funcionando igual en desktop y mobile.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: abrir /admin/pallets/create y /admin/pallets/[id] con Network tab abierta,
# confirmar una sola petición GET por recurso al montar el editor.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** contenido completo y verificable
(criterios de aceptación y plan de validación claros), pero `size: L` no puede
marcarse `ready` sin autorización explícita de Jose (regla dura de
`.claude/agents/gap-normalizer.md`). Marcado `blocked` únicamente por esa razón —
no falta información técnica. GAP-V2-062 y GAP-V2-065 dependen indirectamente de
este GAP (062 lo declara como dependencia explícita); su desbloqueo también
espera a esta decisión de tamaño.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-005 (refactor previo de usePallet a sub-hooks)
