---
id: GAP-V2-060
title: PalletLabelDialog uses unsafe useIsMobile() for structural render branching (PL-022 recurrence)
module: pallets
category: architecture-refactor
priority: P2
risk: medium
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Pallets/PalletLabelDialog/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-060 — `useIsMobile()` sin guard usado para decidir el árbol de componentes

## Problema

`src/components/Admin/Pallets/PalletLabelDialog/index.tsx:12,83` importa y usa
`useIsMobile` (la variante **sin** guard de `mounted`, desaconsejada por el propio
docstring de `src/hooks/use-mobile.jsx`) para decidir qué árbol de componentes
renderizar:

```tsx
const isMobile = useIsMobile();

if (isMobile) {
  return <MobilePalletLabelPrintTrigger ... />;
}
// ... resto: Dialog completo de escritorio
```

Esto es exactamente el anti-patrón documentado en `project-learnings.md` PL-022:
`useIsMobile` sin guard usado para **render condicional estructural** (cambia todo
el árbol montado, no solo una clase CSS), lo que puede causar un flash de contenido
incorrecto en el primer render (SSR/hidratación) antes de que `isMobile` se
estabilice. PL-022 ya documentó recurrencias en CRM, Field app y 15 archivos del
editor de pedidos; el editor de palets — módulo señalado en esta misma auditoría —
añade una cuarta recurrencia no cubierta hasta ahora.

El resto del módulo Pallets sí usa correctamente la variante segura
(`useIsMobileSafe` con `mounted`) — ver `PalletDialog/index.tsx:31,61` y
`MobilePalletView` es seleccionado en `PalletDialog` con ese guard. `PalletLabelDialog`
es la única excepción dentro del módulo.

## Objetivo

`PalletLabelDialog` decide su árbol mobile/desktop usando la variante segura
(`useIsMobileSafe`, con `mounted`), igual que el resto del módulo Pallets, evitando
el riesgo de mismatch de hidratación.

## Contexto

Ver PL-022 en `.claude/project-learnings.md` — regla ya establecida, sin GAP previo
para el módulo Pallets.

## Solución propuesta

Reemplazar `useIsMobile()` por `useIsMobileSafe()` (mismo import que ya usa
`PalletDialog/index.tsx`), y condicionar el render estructural también a `mounted`
(mostrar un fallback neutro o `null` hasta que `mounted` sea `true`, siguiendo el
patrón ya usado en `PalletDialog`).

## Criterios de aceptación

- [ ] `PalletLabelDialog/index.tsx` usa `useIsMobileSafe` en vez de `useIsMobile`.
- [ ] El render condicional estructural (`Mobile...` vs `Dialog` de escritorio)
      espera a `mounted` antes de decidir la rama.
- [ ] Sin regresión visual: impresión de etiqueta en mobile y desktop sigue
      funcionando igual.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir la impresión de etiqueta de palet en viewport mobile y desktop,
# confirmar que no hay flash del layout incorrecto al montar.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-016, GAP-042, GAP-067 (mismas recurrencias de PL-022 en otros módulos)
