---
id: GAP-V2-004
title: CompanySetupAlert se solapa con el BottomNav en mobile y desborda el viewport
module: dashboard-home
category: a11y-responsive
priority: P0
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/CompanySetupAlert.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-004 — CompanySetupAlert se solapa con el BottomNav en mobile

## Problema

`CompanySetupAlert` (`src/components/Admin/Dashboard/CompanySetupAlert.tsx:14-20`)
se posiciona como:

```jsx
className={cn(
  'fixed right-4 bottom-4 z-50 w-96 rounded-xl border ...',
  'animate-in slide-in-from-bottom duration-300'
)}
```

Dos problemas de responsive concretos:

1. **Mismo `z-50` que el `BottomNav` de mobile.** `BottomNav`
   (`src/components/Admin/Layout/BottomNav/index.tsx:140-141`) es
   `fixed right-0 bottom-0 left-0 z-50` — ocupa todo el ancho inferior de la
   pantalla en mobile (el layout de admin sí usa `BottomNav`, confirmado en
   `src/app/admin/AdminLayoutClient.jsx:56-96` y
   `src/components/Admin/Layout/ResponsiveLayout/index.jsx:142-144`). Al compartir
   z-index, `CompanySetupAlert` queda flotando literalmente encima de la barra de
   navegación inferior (`bottom-4` la separa solo 16px del borde, insuficiente para
   despejar la altura del `BottomNav`), tapando parcialmente sus botones.
2. **`w-96` (384px) desborda cualquier viewport mobile real** (iPhone SE: 375px,
   la mayoría de Android de gama media: 360-412px). Anclado con `right-4`, la
   tarjeta se extiende 384px hacia la izquierda desde 16px del borde derecho,
   saliéndose por el borde izquierdo de la pantalla en cualquier dispositivo con
   ancho de viewport menor a ~400px.

Este widget se renderiza siempre que `isIncomplete` sea `true` (roles
administrador/dirección/técnico con datos de empresa incompletos) — no es un caso
raro, es el primer estado que ve un tenant recién creado.

## Objetivo

`CompanySetupAlert` es completamente visible y utilizable en cualquier viewport
mobile soportado por el proyecto, sin solaparse con el `BottomNav` ni desbordar
el ancho de pantalla.

## Contexto

Ninguna dependencia. El componente ya usa `useIsMobileSafe` en ningún punto — no
tiene lógica condicional de mobile vs desktop, es el mismo markup fijo para ambos.

## Solución propuesta

1. Sustituir el ancho fijo `w-96` por una versión responsive, p.ej.
   `w-[calc(100vw-2rem)] sm:w-96` (o `max-w-sm` con `w-[calc(100vw-2rem)]` como
   base), para que en mobile ocupe el ancho disponible con margen, y en desktop
   mantenga los 384px actuales.
2. Ajustar la posición vertical en mobile para despejar la altura del
   `BottomNav`. Usar `useIsMobileSafe` (patrón ya documentado en
   `.claude/skills/mobile-ui/SKILL.md`) para aplicar un `bottom` mayor en mobile
   (p.ej. `bottom-20` o el valor que use el propio `BottomNav` como altura de
   referencia), manteniendo `bottom-4` en desktop.
3. Mantener `z-50` (no hace falta subirlo por encima del `BottomNav` — con el
   ajuste de posición vertical ya no se solapan).

## Criterios de aceptación

- [ ] En un viewport de 375px de ancho, `CompanySetupAlert` es completamente
      visible dentro de los márgenes de pantalla (sin overflow horizontal).
- [ ] En mobile, `CompanySetupAlert` no se solapa visualmente con `BottomNav`.
- [ ] El comportamiento en desktop (≥768px, sin `BottomNav`) no cambia.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: con un tenant de prueba con datos de empresa incompletos, abrir
# /admin/home en un viewport de 375px (DevTools → iPhone SE) y confirmar que
# el aviso es completamente visible y no tapa el BottomNav.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-005 (mismo componente, falta de affordance para descartar)
