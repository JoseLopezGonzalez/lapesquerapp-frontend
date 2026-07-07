---
id: GAP-V2-063
title: 'PalletTimeline usa <Loader/> en vez de Skeleton para la carga de datos del historial (PL-023)'
module: pallets
category: ux-ui
priority: P1
risk: low
size: S
status: done
dependencies: []
target_files:
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.jsx
created_at: 2026-07-05
updated_at: 2026-07-07
normalized_at: 2026-07-05
---

# GAP-V2-063 — `PalletTimeline` usa `<Loader/>` en vez de `Skeleton` para la carga de datos del historial (desktop)

## Problema

`PalletTimeline` (el componente compartido que renderiza la pestaña "Historial" en
desktop) muestra el spinner de sesión/auth `<Loader/>` mientras el timeline está
cargando, en vez de un `Skeleton`:

```jsx
// src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.jsx:6,15
import Loader from '@/components/Utilities/Loader';
...
export function PalletTimeline({ timeline = [], loading, error, openStates, onItemOpenChange }) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-4">
        <Loader />
      </div>
    );
  }
  ...
```

`loading` aquí viene de `usePalletTimeline` (una query de datos, no un gate de
sesión/autenticación). Esto es exactamente el patrón ya documentado como
`ANTI_PATTERN` en `project-learnings.md` PL-023: `<Loader>` está reservado
exclusivamente para gates de sesión/auth de página completa, nunca como sustituto
de `Skeleton` para carga de datos de una pestaña (ver `design-context.md` §
Loading States, Exception). Este es exactamente el mismo caso ya documentado en
el editor de pedidos, ahora en un módulo distinto.

El propio módulo Pallets ya tiene la solución correcta implementada en el lado
mobile: el `HistorialTab` mobile evita este bug porque gestiona su propio
`Skeleton` y solo delega en `PalletTimeline` cuando ya terminó de cargar:

```tsx
// src/components/Admin/Pallets/PalletDialog/MobilePalletView/HistorialTab.tsx:30-48
{timelineLoading ? (
  <div className="space-y-2">
    {[1, 2, 3, 4].map((i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
) : !timeline || timeline.length === 0 ? (
  ...
) : (
  <PalletTimeline timeline={...} loading={false} ... />
)}
```

Es decir, el bug es exclusivo del camino desktop (`PalletView/index.tsx` pasa
`loading={timelineLoading}` directamente a `PalletTimeline`), mientras mobile
nunca llega a ejercitar la rama `if (loading)` del componente compartido.

## Objetivo

La pestaña "Historial" del editor de palet muestra un `Skeleton` con la forma del
timeline (filas de eventos), no el spinner `<Loader/>` de sesión, tanto en
desktop como (indirectamente, ya sin cambios necesarios) en mobile.

## Contexto

Ver PL-023 en `.claude/project-learnings.md` — recurrencia directa, ya detectada
antes en el módulo Orders (GAP-078 legacy). Es un componente compartido entre
desktop y mobile (`PalletTimeline`), pero solo desktop invoca la rama de loading
defectuosa porque mobile ya filtra el estado de carga antes de delegar.

Este GAP fusiona dos candidatos de la misma pasada que reportaban exactamente el
mismo bug desde ángulos distintos: el carril `code-audit-agent` (calidad de
código) y el carril `ui-audit-agent` (UX de loading states), fusionados por
`gap-normalizer` el 2026-07-05. Se conserva el ID más bajo (GAP-V2-063); el
candidato GAP-V2-070 queda absorbido — ver su archivo para la nota de fusión.

El candidato original GAP-V2-063 mezclaba además un segundo problema no
relacionado (migración de `.jsx` + `.d.ts` manual a `.tsx` nativo en los 3
archivos del sub-módulo `PalletTimeline`). Ese problema se separó a
**GAP-V2-067**, que puede implementarse y verificarse de forma independiente de
este.

## Solución propuesta

Reemplazar el bloque `if (loading)` de `PalletTimeline/index.jsx` (o su
equivalente `.tsx` si GAP-V2-067 se implementa antes) por un `Skeleton` de filas
de timeline, siguiendo el mismo patrón ya usado en `HistorialTab.tsx` mobile
(varias filas `Skeleton` de altura fija simulando eventos), eliminando el import
de `Loader`. Alternativamente, mover el guard de loading a nivel de la pestaña
"Historial" en `PalletView/index.tsx` (igual que ya se hace en mobile) y dejar
que `PalletTimeline` reciba siempre `loading={false}` — pero como el propio
componente expone la prop `loading`, la opción más simple y sin duplicar la
lógica en dos sitios es corregir el `Skeleton` dentro del propio componente
compartido.

## Criterios de aceptación

- [ ] `PalletTimeline` no importa `Loader` de `@/components/Utilities/Loader`.
- [ ] El estado de carga muestra `Skeleton` con una forma que aproxima las filas
      del timeline (icono + card, altura similar a una entrada real).
- [ ] El comportamiento en mobile (`HistorialTab.tsx`) no cambia — sigue
      mostrando su propio `Skeleton` de 4 filas antes de delegar en
      `PalletTimeline` con `loading={false}`.
- [ ] Los estados de error y vacío del componente no se ven afectados.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run   # palletLabelQrPayload.test.js no debería verse afectado, pero confirmar
# Manual: en desktop, abrir un palet existente → pestaña Historial → confirmar
# que durante la carga se ve un Skeleton (no el spinner "Cargando") y que tras
# cargar se ve el timeline normal.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** dividido en dos GAPs (este
conserva solo el problema de `Loader` vs `Skeleton`; la migración `.jsx`→`.tsx` +
eliminación del `.d.ts` manual pasó a GAP-V2-067) y fusionado con GAP-V2-070
(mismo bug, carril `ui-audit-agent`). Prioridad armonizada a P1, consistente con
la recurrencia ya establecida de PL-023 y con la prioridad que le dio
`ui-audit-agent` en el candidato original GAP-V2-070.

## Resultado

Reemplazado el `<Loader/>` de `PalletTimeline/index.jsx` por 4 filas `Skeleton`
(mismo patrón que `HistorialTab.tsx` mobile), eliminado el import de
`Loader`. No se tocó el guard de `HistorialTab.tsx` mobile (sigue mostrando su
propio `Skeleton` antes de delegar con `loading={false}`). Estados de error y
vacío sin cambios. `npm run type-check` y `npm run lint` limpios.

## Resultado de auditoría

**gap-auditor (2026-07-07):** ✅ APROBADO — done. Sin `Loader`, sin `fetch`/tenant,
sin cambios a `entitiesConfig.js`. Los 4 criterios de aceptación se cumplen.
`npm run type-check` limpio, `npm run lint` sin warnings nuevos,
`palletLabelQrPayload.test.js` pasa. Revisión UX Light: autoexplicativo,
consistente con la referencia mobile — aprobado.

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: PL-023 (project-learnings.md), GAP-078 legacy (Orders, misma
  recurrencia), GAP-V2-067 (migración `.jsx`→`.tsx` del mismo sub-módulo, separada
  de este GAP)
- Fusionado con: GAP-V2-070 (absorbido, ver nota en su archivo)
