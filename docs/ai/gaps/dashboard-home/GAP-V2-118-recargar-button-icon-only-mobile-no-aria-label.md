---
id: GAP-V2-118
title: "Botón \"Recargar\" se vuelve icon-only en mobile sin aria-label (solo title)"
module: dashboard-home
category: a11y-responsive
priority: P2
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Warehouse/OperarioDashboard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-118 — Botón "Recargar" pierde su nombre accesible visible en mobile

## Problema

`src/components/Warehouse/OperarioDashboard/index.tsx:78-88`:

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="shrink-0"
  title="Actualizar recepciones y salidas de cebo"
>
  <RotateCw className={cn('h-4 w-4', isRefreshing && 'animate-spin', 'sm:mr-2')} />
  <span className="hidden sm:inline">{isRefreshing ? 'Recargando…' : 'Recargar'}</span>
</Button>
```

En viewports `< sm` el texto queda oculto (`hidden sm:inline`) y el botón
depende solo del atributo `title` como nombre accesible. `title` no se anuncia
de forma consistente en lectores de pantalla táctiles (VoiceOver/TalkBack en
un tap simple no siempre lo expone), a diferencia de `aria-label`, que sí es
leído de forma fiable.

## Objetivo

El botón debe tener un nombre accesible explícito y fiable en el breakpoint
mobile (icon-only), no solo un `title`.

## Contexto

Hallazgo puntual y de bajo esfuerzo — mismo componente que ya se toca en
GAP-V2-134 (queryKey de `handleRefresh`; GAP-V2-115 quedó fusionado ahí tras la normalización),
podría agruparse en el mismo commit si Jose lo prefiere.

## Solución propuesta

```tsx
<Button
  ...
  aria-label={isRefreshing ? 'Recargando recepciones y salidas de cebo' : 'Actualizar recepciones y salidas de cebo'}
  title="Actualizar recepciones y salidas de cebo"
>
```

## Criterios de aceptación

- [x] El botón tiene `aria-label` correcto para ambos estados (idle/recargando).
- [x] `npm run lint` limpio.

## Plan de validación

```text
npm run lint
# Manual: verificar con axe devtools o VoiceOver en viewport mobile que el
# botón anuncia su nombre accesible correctamente.
```

## Notas de implementación

Implementado tal cual la solución propuesta: se añadió `aria-label` dinámico
(idle/recargando) al `Button` de recarga, manteniendo el `title` existente
como tooltip en desktop.

## Resultado

`src/components/Warehouse/OperarioDashboard/index.tsx:78-91` — el botón ahora
tiene `aria-label={isRefreshing ? 'Recargando recepciones y salidas de cebo' : 'Actualizar recepciones y salidas de cebo'}`
además del `title` ya existente. `npm run lint` limpio (0 errores; los 2
warnings preexistentes en el archivo son de `no-restricted-syntax` en líneas
62-63, no relacionados con este cambio — ver GAP-V2-134).

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-134 (mismo componente)
