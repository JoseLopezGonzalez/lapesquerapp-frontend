---
id: GAP-V2-067
title: PalletTimeline ships a hand-written .d.ts instead of native .tsx typing — migrate the sub-module to TypeScript
module: pallets
category: code-quality
priority: P3
risk: low
size: M
status: ready
dependencies: []
target_files:
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.jsx
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.d.ts
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/TimelineEventItem.jsx
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/TimelineEventDetail.jsx
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-067 — `PalletTimeline` usa `.jsx` + un `.d.ts` manual en vez de `.tsx` nativo

## Problema

El componente `PalletTimeline` es `.jsx` (no tipado por TypeScript directamente)
acompañado de un `index.d.ts` escrito a mano
(`PalletTimeline/index.d.ts`) que declara la firma de `PalletTimeline(props)`.
Este patrón no aparece en ningún otro punto del módulo Pallets ni, hasta donde se
ha podido verificar en esta auditoría, en el resto de `components/Admin/`.

Un `.d.ts` mantenido a mano puede desincronizarse silenciosamente de la
implementación real: si se añade o renombra una prop en `index.jsx` sin
actualizar `index.d.ts`, TypeScript no lo detecta porque confía en la
declaración, no en el código real. Es estrictamente más frágil que migrar el
archivo a `.tsx` con las props tipadas inline.

Los archivos hermanos `TimelineEventItem.jsx` y `TimelineEventDetail.jsx` (132 y
680 líneas) también son `.jsx` sin equivalente `.d.ts` — probablemente reciben
tipado implícito `any` en sus props.

## Objetivo

Los tres archivos del sub-módulo `PalletTimeline` están en `.tsx` con props
tipadas de forma nativa — sin `.d.ts` manual.

## Contexto

Ver PL-023 en `.claude/project-learnings.md` (aplica al hallazgo relacionado de
`Loader` vs `Skeleton` en este mismo sub-módulo, ver GAP-V2-063). Este GAP
proviene de dividir el candidato original GAP-V2-063 (`code-audit-agent`), que
mezclaba dos problemas no relacionados: el uso de `<Loader>` para carga de datos
(hallazgo de UX, ahora en GAP-V2-063) y esta migración de tipado (hallazgo de
calidad de código, ahora aquí). Ambos son implementables y verificables de forma
independiente — no hay dependencia real entre ellos, aunque tocan los mismos
archivos.

## Solución propuesta

1. Migrar `index.jsx` → `index.tsx`, `TimelineEventItem.jsx` → `.tsx`,
   `TimelineEventDetail.jsx` → `.tsx`, tipando props inline (reusar
   `PalletTimelineEntry` de `@/services/palletService`, ya usado en
   `index.d.ts`).
2. Eliminar `index.d.ts` (ya no hace falta con `.tsx` nativo).
3. Dado que `TimelineEventDetail.jsx` tiene 680 líneas, seguir el protocolo de
   CLAUDE.md para migraciones de archivos: ejecutar `npm run type-check` antes y
   después de cada archivo, resolver todos los errores nuevos antes de continuar
   con el siguiente.

## Criterios de aceptación

- [ ] Los 3 archivos del sub-módulo (`index`, `TimelineEventItem`,
      `TimelineEventDetail`) son `.tsx`; `index.d.ts` eliminado.
- [ ] Las props de los 3 componentes están tipadas de forma nativa (sin `any`
      implícito).
- [ ] `npm run type-check` limpio tras la migración.
- [ ] Sin cambios de comportamiento — es una migración de tipado, no un cambio
      funcional.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run   # palletLabelQrPayload.test.js no debería verse afectado, pero confirmar
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** GAP nuevo, creado al dividir el
candidato original GAP-V2-063 en dos problemas no relacionados (ver regla "no
mezclar dos problemas no relacionados en un mismo GAP" de
`gap-normalizer.md`). ID `GAP-V2-067` asignado dentro del bloque de numeración ya
reservado para el carril `code-audit-agent` en esta pasada (`GAP-V2-058` ..
`GAP-V2-067`, ver `docs/ai/modules/pallets/audit.md`), que había quedado libre —
no colisiona con ningún otro módulo ni con los rangos reservados a
`ui-audit-agent` (068-077) o `domain-business-auditor` (078-087).

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-063 (mismo sub-módulo, problema de `Loader` vs
  `Skeleton`, separado de este GAP tras dividir el candidato original)
