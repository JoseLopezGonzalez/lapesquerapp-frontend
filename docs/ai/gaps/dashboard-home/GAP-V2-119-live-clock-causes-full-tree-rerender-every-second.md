---
id: GAP-V2-119
title: Reloj en vivo (setInterval 1s) re-renderiza todo OperarioDashboard, incluyendo las listas, cada segundo
module: dashboard-home
category: code-quality
priority: P2
risk: medium
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Warehouse/OperarioDashboard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-119 — El estado del reloj vive en el componente raíz, no aislado

## Problema

`useCurrentDateTime` (`src/components/Warehouse/OperarioDashboard/index.tsx:28-35`)
mantiene el estado `now` con `setInterval(..., 1000)` **dentro del propio
`OperarioDashboard`**:

```tsx
export default function OperarioDashboard({ storeId = null }: OperarioDashboardProps) {
  ...
  const now = useCurrentDateTime(); // ← estado que cambia cada segundo, en el componente raíz
  ...
  return (
    <div ...>
      {/* header, KPI cards */}
      <ReceptionsListCard storeId={storeId} />
      <DispatchesListCard storeId={storeId} />
      <NetWeightCalculatorDialog ... />
    </div>
  );
}
```

Cada tick de 1 segundo actualiza `now` y provoca un re-render completo de
`OperarioDashboard`, lo que re-ejecuta el render de `ReceptionsListCard` y
`DispatchesListCard` (ninguno de los dos está envuelto en `React.memo`) aunque
sus props (`storeId`) no cambien. En una tablet de gama media usada en almacén,
esto añade trabajo de reconciliación innecesario cada segundo sobre dos listas
con múltiples filas y botones interactivos, de forma continua mientras el
dashboard esté abierto.

## Objetivo

El tick del reloj no debe provocar re-render de las listas ni del resto del
dashboard — solo del propio widget de hora/fecha.

## Contexto

No es un bug visible (el reloj funciona correctamente), es un hallazgo de
rendimiento/arquitectura: el estado más volátil de la vista (1 tick/segundo)
está colocado en el componente que orquesta todo el árbol.

## Solución propuesta

Extraer el reloj a un componente aislado (`LiveClockCard`) que mantenga su
propio `useState`/`setInterval` internamente, de forma que el re-render de
cada tick quede contenido a ese componente y no burbujee hacia
`OperarioDashboard`:

```tsx
function LiveClockCard() {
  const now = useCurrentDateTime();
  const timeStr = now.toLocaleTimeString(...);
  return <Card>...</Card>;
}
```

`OperarioDashboard` deja de necesitar `now` para el reloj; solo lo mantendría
si `dateStr`/`dayStr` se usan en otro lugar del árbol (verificar — actualmente
solo se usan en las Cards de Fecha/Día, que pueden moverse al mismo componente
aislado o a uno hermano `LiveDateCard` si se prefiere mantenerlos
sincronizados en un solo tick).

## Criterios de aceptación

- [ ] El tick de reloj de 1 segundo no provoca re-render de
      `ReceptionsListCard`/`DispatchesListCard` (verificable con React DevTools
      Profiler "Highlight updates when components render").
- [ ] El reloj/fecha/día siguen mostrando la hora correcta sin regresión visual.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: con React DevTools Profiler, grabar 5 segundos con el dashboard
# abierto y confirmar que ReceptionsListCard/DispatchesListCard no aparecen en
# los renders periódicos del reloj.
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
