---
id: GAP-V2-060
title: PalletLabelDialog usa useIsMobile() sin guard para ramificar el árbol completo de render (PL-022 recurrence)
module: pallets
category: a11y-responsive
priority: P1
risk: medium
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Pallets/PalletLabelDialog/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
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
(`useIsMobileSafe` con `mounted`) — ver `PalletDialog/index.tsx:31,61`, donde
`MobilePalletView` es seleccionado con ese guard. `PalletLabelDialog` es la única
excepción dentro del módulo.

**Riesgo funcional concreto, no solo estético:** en la rama mobile, este componente
**dispara la impresión automáticamente en un `useEffect` con `setTimeout(150)`** en
cuanto detecta `isMobile`. Si el primer render (antes de hidratar) decide
`isMobile === false` (valor por defecto sin guard) y luego se corrige a `true` tras
hidratar, existe una ventana en la que el diálogo desktop podría montarse
brevemente antes de que la app recalcule y dispare el trigger de impresión mobile —
comportamiento no determinista que `useIsMobileSafe` + `mounted` está diseñado para
prevenir en toda la aplicación.

## Objetivo

`PalletLabelDialog` decide su árbol mobile/desktop usando la variante segura
(`useIsMobileSafe`, con `mounted`), igual que el resto del módulo Pallets, sin
ramificar el árbol de render hasta que `mounted === true` — eliminando tanto el
riesgo de mismatch de hidratación como la ventana de comportamiento no
determinista en el disparo automático de impresión mobile.

## Contexto

Ver PL-022 en `.claude/project-learnings.md` — regla ya establecida, sin GAP previo
para el módulo Pallets. El propio módulo Pallets ya tiene la implementación
correcta como referencia en `PalletDialog/index.tsx:61`
(`const { isMobile, mounted } = useIsMobileSafe();`).

Este GAP fusiona dos candidatos de la misma pasada de auditoría que reportaban el
mismo bug desde ángulos distintos: el carril `code-audit-agent` (arquitectura del
hook) y el carril `ui-audit-agent` (riesgo de hidratación/responsive), fusionados
por `gap-normalizer` el 2026-07-05. Se conserva el ID más bajo (GAP-V2-060); el
candidato GAP-V2-071 queda absorbido — ver su archivo para la nota de fusión.

## Solución propuesta

Sustituir `import { useIsMobile } from '@/hooks/use-mobile'` por
`import { useIsMobileSafe } from '@/hooks/use-mobile'` y
`const { isMobile, mounted } = useIsMobileSafe();`. Mientras `!mounted`, no
renderizar ninguna rama (o renderizar `null`) hasta que el valor de `isMobile` esté
confirmado en cliente, siguiendo el mismo patrón que `PalletDialog/index.tsx`.

## Criterios de aceptación

- [ ] `PalletLabelDialog/index.tsx` usa `useIsMobileSafe` en vez de `useIsMobile`.
- [ ] El render condicional estructural (`Mobile...` vs `Dialog` de escritorio)
      espera a `mounted` antes de decidir la rama.
- [ ] El disparo automático de impresión en mobile
      (`MobilePalletLabelPrintTrigger`) no puede ejecutarse antes de que `mounted`
      confirme la rama correcta.
- [ ] Sin regresión visual ni funcional: impresión de etiqueta en mobile (auto,
      sin diálogo) y desktop (diálogo con vista previa) siguen funcionando igual.
- [ ] No quedan otros usos de `useIsMobile()` sin guard en el módulo Pallets
      (verificar con `grep -rn "useIsMobile()" src/components/Admin/Pallets`).

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "useIsMobile()" src/components/Admin/Pallets
# Manual: imprimir etiqueta de palet desde mobile (debe imprimir automáticamente
# sin mostrar diálogo) y desde desktop (debe mostrar el diálogo con vista previa),
# confirmando que no hay flash del layout incorrecto al montar.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** fusionado con GAP-V2-071 (mismo
archivo, mismo bug, dos carriles de auditoría distintos). Prioridad armonizada a
P1 (recurrencia ya documentada de PL-022 con impacto funcional real en el disparo
de impresión automática mobile, no solo un hallazgo cosmético). Categoría fijada
en `a11y-responsive` por ser el ángulo más específico del bug (ramificación
estructural por viewport con riesgo de hidratación), aunque el carril
`code-audit-agent` lo había clasificado como `architecture-refactor` — ambas
clasificaciones son defendibles; se documenta aquí para que quede claro que no es
un descarte, solo una elección de categoría física única.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-016, GAP-042, GAP-067 (mismas recurrencias de PL-022 en
  otros módulos, numeración legacy `.claude/gaps/`)
- Fusionado con: GAP-V2-071 (absorbido, ver nota en su archivo)
