---
id: GAP-V2-113
title: ReceptionsListCard y DispatchesListCard implementan mobile vía CSS hidden/block en vez de useIsMobileSafe
module: dashboard-home
category: a11y-responsive
priority: P3
risk: low
size: L
status: candidate
dependencies: []
target_files:
  - src/components/Warehouse/ReceptionsListCard/index.tsx
  - src/components/Warehouse/DispatchesListCard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-113 — Capa mobile implementada con `sm:hidden` / `hidden sm:block`, no con `useIsMobileSafe`

## Problema

`ReceptionsListCard` y `DispatchesListCard` renderizan dos marcados completos
(lista mobile y tabla desktop) dentro del mismo árbol de JSX, alternados
puramente por clases Tailwind:

- `src/components/Warehouse/ReceptionsListCard/index.tsx:256` (`sm:hidden`,
  empty state mobile), `:275` (`sm:hidden`, lista mobile), `:355` (`hidden
  sm:block`, tabla desktop).
- `src/components/Warehouse/DispatchesListCard/index.tsx:183/201/268` — mismo
  patrón.

Esto contradice el principio documentado en `.claude/design-context.md` § 8.2:
> Mobile is a separate render path, not a CSS hide/show. `useIsMobileSafe`
> returns two render branches (...) CSS `hidden md:block` is not the primary
> strategy.

y el checklist de `ui-audit-agent` en modo mobile: "Mobile layer is a separate
component — never conditionals inside desktop component".

En la práctica ambos marcados (mobile y desktop) se montan simultáneamente en
el DOM (uno oculto vía CSS), lo que duplica el trabajo de render y mantiene en
memoria dos copias de la lista con su propio estado de botones/loading por
fila.

## Objetivo

Evaluar si este componente debe migrarse al patrón `useIsMobileSafe` (rama
mobile real, sin duplicar DOM) o si se documenta como excepción aceptada dado
que ambos layouts son sencillos (una tabla vs. una lista de cards) y el costo
de mantener dos componentes separados podría no justificarse.

## Contexto

Este es un patrón consistente en los dos componentes de listado de esta
superficie (no aparece en otras partes auditadas de dashboard-home). Es una
decisión de arquitectura, no un bug funcional — el comportamiento visual actual
es correcto en ambos breakpoints.

## Solución propuesta

Si Jose decide alinear con el patrón documentado:
1. Extraer una vista mobile (`ReceptionsListCardMobile`) y una desktop
   (`ReceptionsListCardDesktop`), cada una recibiendo `rows`/handlers ya
   calculados desde el componente contenedor.
2. Usar `useIsMobileSafe` en `ReceptionsListCard`/`DispatchesListCard` para
   elegir la rama, con `if (!mounted) return null`.
3. Repetir el mismo split en `DispatchesListCard`.

Alternativa (si se acepta el patrón CSS actual): documentar explícitamente en
`design-context.md` que listas simples de 2 layouts (tabla vs. cards) son una
excepción aceptada al principio de "separate render path", para no repetir
este hallazgo en futuras auditorías.

## Criterios de aceptación

- [ ] Decisión explícita de Jose: migrar a `useIsMobileSafe` o documentar
      excepción.
- [ ] Si se migra: un solo layout se monta en el DOM según breakpoint,
      verificado en devtools.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: verificar en devtools que solo un marcado (mobile o desktop) está
# presente en el DOM tras el cambio, no ambos con display:none.
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
