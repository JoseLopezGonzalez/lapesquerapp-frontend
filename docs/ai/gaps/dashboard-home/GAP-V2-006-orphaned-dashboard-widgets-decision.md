---
id: GAP-V2-006
title: Eliminar NewLabelingFeatureCard — tarjeta promocional de una funcionalidad que ya está en producción
module: dashboard-home
category: ux-ui
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/NewLabelingFeatureCard/index.js
  - src/components/Admin/Dashboard/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-006 — Eliminar NewLabelingFeatureCard (código muerto, funcionalidad ya no es nueva)

## Problema

`src/components/Admin/Dashboard/NewLabelingFeatureCard/index.js` es una tarjeta
promocional ("Nueva Funcionalidad") del editor de etiquetas, con imagen mockup y
un `onClick` que hace `window.location.href = '/admin/label-editor'` (navegación
de página completa en vez de router de Next.js). No está importada en
`Dashboard/index.tsx` ni en ningún otro archivo del proyecto (confirmado por
grep en todo `src/`). El editor de etiquetas ya está en producción y activo
(módulo "Etiquetas" en la tabla de módulos del dominio, `CLAUDE.md`), por lo que
la tarjeta ya no tiene sentido ni siquiera si se reactivara.

## Objetivo

El componente y su carpeta dejan de existir en el repositorio. `Dashboard/index.tsx`
no cambia su comportamiento visible (ya no lo renderizaba).

## Contexto

Decisión confirmada por Jose (2026-07-05): eliminar. Sin dependencias con otros GAPs.

## Solución propuesta

Borrar la carpeta completa `src/components/Admin/Dashboard/NewLabelingFeatureCard/`.
No requiere cambios en `index.tsx` porque no está importada.

## Criterios de aceptación

- [ ] La carpeta `src/components/Admin/Dashboard/NewLabelingFeatureCard/` no existe.
- [ ] `grep -rn "NewLabelingFeatureCard" src/` devuelve 0 resultados.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
grep -rn "NewLabelingFeatureCard" src/
npm run type-check
npm run lint
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-009 (mismo hallazgo original de widgets huérfanos, split tras decisión de Jose)
