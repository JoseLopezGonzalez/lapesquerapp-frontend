---
id: GAP-V2-093
title: 4 componentes de movimientos de almacén usan useIsMobile() sin guard para ramificar el árbol de render (PL-022 recurrence)
module: pallets
category: a11y-responsive
priority: P1
risk: medium
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Stores/StoresManager/Store/PositionSlideover/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/UnallocatedPositionSlideover/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-093 — `useIsMobile()` sin guard en 4 componentes de movimientos de almacén

## Problema

La segunda pasada de auditoría (superficie "movimientos de almacén") encuentra 4 archivos
adicionales que reproducen exactamente el anti-patrón ya documentado en `project-learnings.md`
PL-022 y ya señalado una vez dentro del propio módulo Pallets en la primera pasada
(GAP-V2-060, `PalletLabelDialog`): `useIsMobile` (variante **sin** guard de `mounted`) usado
para decidir un render condicional **estructural** — no solo una clase CSS, sino qué árbol de
componentes o qué modelo de interacción se monta:

- `PositionSlideover/index.tsx:15,25,51` — decide `side={isMobile ? 'bottom' : 'right'}` del
  `Sheet` y el padding del contenedor.
- `UnallocatedPositionSlideover/index.tsx:14,19,39` — mismo patrón, mismo componente hermano.
- `PositionSlideover/PalletCard/index.tsx:30,65,191,194,267` — el más severo de los cuatro: en
  mobile, toda la tarjeta es "tap-to-flip" (gira para mostrar acciones) y el menú de escritorio
  (`DropdownMenu` con `MoreVertical`) directamente **no se monta** (`{!isMobile && <DropdownMenu>...}`).
  Es decir, `isMobile` no solo cambia estilos: decide si existe o no un modelo de interacción
  completo (flip card vs. dropdown).
- `MoveMultiplePalletsToStoreDialog/index.tsx:32,53` — decide entre flujo mobile por pasos
  (wizard de 3 pasos) y layout desktop de dos columnas.

El resto del módulo Pallets (`PalletDialog/index.tsx:31,61`) y `OrderPallets/index.tsx:4,22`
sí usan la variante segura (`useIsMobileSafe` con `mounted`). Estos 4 archivos son la
excepción dentro de la misma superficie de movimientos de almacén.

## Objetivo

Los 4 componentes deciden su árbol mobile/desktop usando `useIsMobileSafe` (con `mounted`),
igual que `PalletDialog` y `OrderPallets`, eliminando el riesgo de mismatch de hidratación y
de un flash del modelo de interacción incorrecto (especialmente crítico en `PalletCard`, donde
mobile oculta por completo el menú de acciones de escritorio).

## Contexto

Ver PL-022 en `.claude/project-learnings.md` (ya van 5+ recurrencias documentadas: CRM, Field
app, editor de pedidos, `PalletLabelDialog` en la primera pasada de este mismo módulo, y ahora
estos 4 archivos). `PalletCard` es reutilizado en 3 puntos de entrada distintos
(`PositionSlideover`, `UnallocatedPositionSlideover`, `PalletsListDialog`), por lo que corregirlo
una vez resuelve el problema en los tres.

## Solución propuesta

Sustituir `import { useIsMobile } from '@/hooks/use-mobile'` por
`import { useIsMobileSafe } from '@/hooks/use-mobile'` y
`const { isMobile, mounted } = useIsMobileSafe();` en los 4 archivos. Mientras `!mounted`, no
decidir la rama estructural (retornar `null` o un placeholder neutro), siguiendo el patrón ya
establecido en `PalletDialog/index.tsx` y `OrderPallets/index.tsx`.

## Criterios de aceptación

- [ ] Los 4 archivos usan `useIsMobileSafe` en vez de `useIsMobile` para cualquier decisión que
      cambie el árbol de componentes o el modelo de interacción (no solo clases CSS).
- [ ] Ninguno de los 4 renderiza la rama estructural antes de que `mounted === true`.
- [ ] `grep -rn "useIsMobile()" src/components/Admin/Stores/StoresManager/Store` no devuelve
      resultados tras el fix (verificar también dentro de subcarpetas).
- [ ] Sin regresión visual ni funcional: flip-card en mobile, dropdown en desktop, wizard de 3
      pasos en mobile y layout de 2 columnas en desktop siguen funcionando igual.

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "useIsMobile()" src/components/Admin/Stores/StoresManager/Store
# Manual: abrir PositionSlideover/UnallocatedPositionSlideover/PalletsListDialog en mobile y
# desktop, confirmar que no hay flash del layout incorrecto al montar; abrir
# MoveMultiplePalletsToStoreDialog en ambos breakpoints y confirmar wizard vs. dos columnas.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-060 (misma recurrencia, `PalletLabelDialog`, primera pasada),
  PL-022 en `.claude/project-learnings.md`
