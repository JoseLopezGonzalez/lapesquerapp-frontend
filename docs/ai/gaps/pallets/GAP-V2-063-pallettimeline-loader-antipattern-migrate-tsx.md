---
id: GAP-V2-063
title: PalletTimeline uses <Loader> for tab data loading (PL-023) and ships a hand-written .d.ts instead of native .tsx typing
module: pallets
category: code-quality
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.jsx
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.d.ts
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/TimelineEventItem.jsx
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/TimelineEventDetail.jsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-063 — `PalletTimeline` usa `<Loader>` para carga de datos y un `.d.ts` manual en vez de `.tsx`

## Problema

**1. `<Loader>` como sustituto de `Skeleton` para carga de datos (PL-023):**

`src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.jsx:6,15`:

```jsx
import Loader from '@/components/Utilities/Loader';
...
if (loading) {
  return (
    <div className="flex h-full items-center justify-center py-4">
      <Loader />
    </div>
  );
}
```

`design-context.md` § Loading States documenta `<Loader>` como exclusivo para
gates de sesión/auth de página completa — nunca como reemplazo de `Skeleton` para
carga de datos de una pestaña (ver PL-023, ya con 2 hallazgos previos en el
editor de pedidos). Este es el estado de carga de la pestaña "Historial" del
editor de palet (`usePalletTimeline`, dato de servidor vía TanStack Query) — un
caso exactamente igual al ya documentado, en un módulo distinto.

**2. `.jsx` + `.d.ts` manual en vez de `.tsx` nativo:**

El componente es `.jsx` (no tipado por TypeScript directamente) acompañado de un
`index.d.ts` escrito a mano (`PalletTimeline/index.d.ts`) que declara la firma de
`PalletTimeline(props)`. Este patrón no aparece en ningún otro punto del módulo
Pallets ni, hasta donde se ha podido verificar en esta auditoría, en el resto de
`components/Admin/`. Un `.d.ts` mantenido a mano puede desincronizarse
silenciosamente de la implementación real (p.ej. si se añade o renombra una prop
en `index.jsx` sin actualizar `index.d.ts`, TypeScript no lo detecta porque confía
en la declaración, no en el código real) — es estrictamente más frágil que migrar
el archivo a `.tsx` con las props tipadas inline. Los archivos hermanos
`TimelineEventItem.jsx` y `TimelineEventDetail.jsx` (132 y 680 líneas) también son
`.jsx` sin equivalente `.d.ts` — probablemente reciben tipado implícito `any` en
sus props.

## Objetivo

- La pestaña "Historial" muestra `Skeleton` (no `Loader`) mientras
  `usePalletTimeline` está cargando.
- Los tres archivos del sub-módulo `PalletTimeline` están en `.tsx` con props
  tipadas de forma nativa — sin `.d.ts` manual.

## Contexto

Ver PL-023 en `.claude/project-learnings.md`.

## Solución propuesta

1. Migrar `index.jsx` → `index.tsx`, `TimelineEventItem.jsx` → `.tsx`,
   `TimelineEventDetail.jsx` → `.tsx`, tipando props inline (reusar
   `PalletTimelineEntry` de `@/services/palletService`, ya usado en `index.d.ts`).
2. Eliminar `index.d.ts` (ya no hace falta con `.tsx` nativo).
3. Reemplazar el estado `loading` con un `Skeleton` que respete la estructura del
   timeline real (lista de eventos), no un spinner centrado.
4. Dado que `TimelineEventDetail.jsx` tiene 680 líneas, seguir el protocolo de
   CLAUDE.md para migraciones de archivos grandes: type-check antes y después,
   resolver todos los errores nuevos antes de continuar con el siguiente archivo.

## Criterios de aceptación

- [ ] `PalletTimeline` no importa `Loader` — usa `Skeleton`.
- [ ] Los 3 archivos del sub-módulo son `.tsx`; `index.d.ts` eliminado.
- [ ] `npm run type-check` limpio tras la migración.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run   # palletLabelQrPayload.test.js no debería verse afectado, pero confirmar
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-078 (misma anti-pattern PL-023 en Orders)
