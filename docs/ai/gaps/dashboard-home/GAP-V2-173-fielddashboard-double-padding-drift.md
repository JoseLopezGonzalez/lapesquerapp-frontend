---
id: GAP-V2-173
title: FieldDashboard duplica el padding del page.js, desperdiciando ancho útil en mobile
module: dashboard-home
category: ux-ui
priority: P2
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
  - src/app/field/page.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-173 — FieldDashboard duplica el padding del page.js

## Problema

`src/app/field/page.js:7` ya envuelve el dashboard con padding responsive:

```jsx
<div className="flex h-full min-h-0 w-full flex-col p-4 sm:p-6">
  <FieldDashboard />
</div>
```

Y `FieldDashboard` (`src/components/Field/FieldDashboard.jsx:89`) añade su propio
padding encima:

```jsx
<div className="flex h-full min-h-0 flex-col gap-4 px-4 py-3">
```

El resultado es un doble padding horizontal acumulado (16px del `page.js` + 16px
del propio componente = 32px por lado en mobile, 48px en `sm:`), que en un viewport
de 375px reduce el ancho útil del contenido en 64px totales — un 17% del ancho de
pantalla — sin ningún beneficio visual adicional.

Esto es un caso verificable de drift dentro del propio módulo: las dos vistas
hermanas de `/field`, que comparten el mismo `page.js` wrapper (`p-4 sm:p-6`), no
añaden padding propio en su componente raíz:

- `FieldOrdersPage.jsx:78` → `<div className="flex h-full min-h-0 flex-col gap-4">`
- `FieldRoutesListPage.jsx:57` → `<div className="flex h-full min-h-0 flex-col gap-4">`

`FieldDashboard` es el único de los tres que duplica el padding.

## Objetivo

`FieldDashboard` usa el mismo patrón de padding que sus vistas hermanas dentro de
`/field` — el `page.js` es la única fuente de padding horizontal/vertical de
pantalla completa.

## Contexto

Ninguna dependencia. Cambio puramente de clases Tailwind, sin lógica.

## Solución propuesta

Quitar `px-4 py-3` de la raíz de `FieldDashboard` (línea 89) y alinear su
contenedor raíz con el patrón usado en `FieldOrdersPage`/`FieldRoutesListPage`:

```jsx
<div className="flex h-full min-h-0 flex-col gap-4">
```

Verificar que el `gap-4` interno del `ScrollArea` (línea 91,
`pb-[calc(5rem+env(safe-area-inset-bottom))]`) sigue funcionando igual sin el
padding eliminado — no debería depender de él.

## Criterios de aceptación

- [ ] `FieldDashboard` no añade padding propio adicional al ya provisto por
      `src/app/field/page.js`.
- [ ] En un viewport de 375px, el contenido usa el ancho completo disponible menos
      el único padding del `page.js` (16px por lado), igual que en `/field/pedidos`
      y `/field/rutas`.
- [ ] El comportamiento en desktop (≥768px) no cambia visualmente de forma
      perceptible.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: comparar en DevTools (375px) el ancho de contenido de /field vs
# /field/pedidos y /field/rutas — deben coincidir tras el cambio.
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
