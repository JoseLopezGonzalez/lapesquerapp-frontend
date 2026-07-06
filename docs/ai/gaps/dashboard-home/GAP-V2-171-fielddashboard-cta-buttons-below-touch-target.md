---
id: GAP-V2-171
title: Botones CTA de FieldDashboard por debajo del touch target mínimo de 44px
module: dashboard-home
category: a11y-responsive
priority: P0
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-171 — Botones CTA de FieldDashboard por debajo del touch target mínimo de 44px

## Problema

Los tres botones principales del dashboard — el único punto de entrada a cada flujo
operativo del repartidor — usan el `<Button>` de shadcn sin especificar `size`:

```jsx
<Button asChild className="w-full justify-between">
  <Link href={`/field/rutas/${todayRoute.id}`}>Abrir ruta ...</Link>
</Button>                                                          // línea 122-127

<Button asChild variant="outline" className="w-full justify-between">
  <Link href="/field/pedidos">Ver pedidos ...</Link>
</Button>                                                          // línea 167-172

<Button asChild variant="outline" className="w-full justify-between">
  <Link href="/field/autoventa">Nueva autoventa ...</Link>
</Button>                                                          // línea 201-206
```

El variant `size` por defecto de `Button` (`src/components/ui/button.jsx:24-25`) es
`"default": "h-8 ..."` — **32px de alto**, muy por debajo del mínimo táctil de 44px
que exige el checklist MOBILE del proyecto. El propio proyecto ya tiene el token
correcto para este caso: `MOBILE_HEIGHTS.BUTTON = 'h-11'` (44px) en
`src/lib/design-tokens-mobile.ts:23`, documentado en
`.claude/skills/mobile-ui/SKILL.md` como el patrón a usar — pero no se aplica aquí.

Estos tres botones no son acciones secundarias: son literalmente los tres únicos
CTA del dashboard de un rol 100% mobile-first (repartidor de autoventa), usados en
campo, probablemente con el dispositivo en movimiento o con guantes/manos húmedas.
Un target de 32px de alto en ese contexto es un riesgo de mistap real, no teórico.

## Objetivo

Los tres botones CTA de `FieldDashboard` cumplen el mínimo de 44px de alto en
cualquier viewport mobile soportado por el proyecto.

## Contexto

Ninguna dependencia. El fix es local y no afecta a otras vistas — cada `<Button>`
recibe su `size`/altura de forma explícita por instancia, no por defecto global.

## Solución propuesta

Aplicar `size="lg"` (`h-9`, sigue sin llegar a 44px) no es suficiente; usar
directamente el token mobile documentado añadiendo la clase de altura vía
`className`, siguiendo el patrón ya usado en el resto del proyecto para CTAs
mobile:

```jsx
import { MOBILE_HEIGHTS } from '@/lib/design-tokens-mobile';

<Button asChild className={cn('w-full justify-between', MOBILE_HEIGHTS.BUTTON)}>
```

Aplicar el mismo cambio a los tres botones (líneas 122, 167, 201). Confirmar que
`shadow-sm`/`variant="outline"` no chocan con la nueva altura (no deberían, es solo
`height`).

## Criterios de aceptación

- [ ] Los tres botones ("Abrir ruta", "Ver pedidos", "Nueva autoventa") miden al
      menos 44px de alto en cualquier viewport mobile soportado (375px, 390px,
      412px).
- [ ] El cambio no rompe el layout en desktop (≥768px).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: DevTools → inspeccionar altura renderizada de los 3 botones en 375px,
# confirmar >= 44px.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
