---
id: GAP-V2-100
title: font-semibold fuera de la escala tipográfica documentada en tarjetas de movimientos de almacén
module: pallets
category: ux-ui
priority: P3
risk: low
size: S
status: done
dependencies: []
target_files:
  - src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-07
normalized_at: 2026-07-05
---

# GAP-V2-100 — `font-semibold` fuera de escala en tarjetas de la superficie de movimientos

## Problema

Recurrencia de PL-024 (ya documentada en `project-learnings.md` para el editor de pedidos, y ya
flaggeada una vez en la primera pasada de esta misma auditoría de Pallets — `GAP-V2-073`,
`PalletView`/`MobilePalletView`). `design-context.md` § Typography documenta una escala cerrada
donde el peso más fuerte usado es `font-medium` (en sus distintos tamaños) — `font-semibold`
no aparece en ningún punto de la escala documentada.

Esta segunda pasada encuentra el mismo patrón en 2 archivos nuevos de la superficie de
movimientos de almacén, no cubiertos por `GAP-V2-073`:

- `PositionSlideover/PalletCard/index.tsx:215` (identificador "Palet #{id}"),
  `:336,360,380` (labels de sección "Productos"/"Lotes"/"Obs."), `:395,401` (footer de
  stats), `:434-436,460` (cabecera y acciones de la cara trasera).
- `MoveMultiplePalletsToStoreDialog/index.tsx:408-414` (footer de stats de la tarjeta de
  palet en el paso de selección), `:532` (nombre del almacén destino en el paso de
  confirmación).

Igual que en el hallazgo original (PL-024), el uso indiscriminado de `font-semibold` tanto
para identificadores primarios como para metadatos secundarios debilita la jerarquía visual
del componente.

## Objetivo

Normalizar los usos de `font-semibold` señalados a `font-medium` (o al tamaño/peso
correspondiente de la escala documentada en `design-context.md` § Typography), consistente
con el resto del módulo Pallets tras `GAP-V2-073`.

## Contexto

Ver PL-024 en `.claude/project-learnings.md` y `GAP-V2-073` (misma recurrencia, mismo módulo,
archivos distintos, primera pasada). Al implementarse, aplicar el mismo criterio ya usado en
`GAP-V2-073` para no introducir un tercer criterio distinto.

## Solución propuesta

Reemplazar `font-semibold` por `font-medium` en los puntos señalados, verificando visualmente
que la jerarquía (identificador primario vs. metadato secundario) se mantiene legible solo con
el tamaño de fuente (`text-base` vs `text-xs`/`text-[10px]`), no con el peso.

## Criterios de aceptación

- [ ] `grep -rn "font-semibold" src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog`
      no devuelve resultados tras el fix.
- [ ] Sin regresión visual de jerarquía: el identificador primario ("Palet #{id}") sigue
      siendo el elemento más prominente de la tarjeta.

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "font-semibold" src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** decisión — se mantiene como GAP
independiente en vez de ampliar `target_files` de GAP-V2-073 (ya `ready` desde la
primera pasada), por 3 motivos: (1) GAP-V2-073 ya está aprobado y podría
implementarse en cualquier momento — ampliar su alcance retroactivamente cambia
silenciosamente qué cubre un GAP ya cerrado para implementación; (2) cubre una
superficie distinta (movimientos de almacén, Superficie B de esta pasada) de la
que auditó GAP-V2-073 (creación/edición, primera pasada) — mantener la
trazabilidad por superficie/pasada; (3) permite verificación independiente sin
reabrir el GAP original. Mismo criterio de reemplazo (`font-semibold` →
`font-medium`) que GAP-V2-073 — el implementor debe usarlo como referencia directa
para no introducir un tercer criterio.

## Resultado

Reemplazados todos los `font-semibold` por `font-medium` en
`PositionSlideover/PalletCard/index.tsx` (identificador, labels de sección,
footer de stats, cabecera de la cara trasera) y en
`MoveMultiplePalletsToStoreDialog/index.tsx` (footer de stats de la tarjeta,
nombre del almacén destino en confirmación). `grep -rn "font-semibold"` sobre
ambos directorios no devuelve resultados. Mismo criterio que GAP-V2-073. `npm
run type-check` y `npm run lint` limpios.

## Resultado de auditoría

### Veredicto: ✅ done

`grep -n "font-semibold"` sobre ambos target files no devuelve resultados — confirmado
leyendo ambos archivos completos. Todos los pesos son `font-medium`.

Jerarquía visual verificada por lectura del código:

- `PalletCard/index.tsx:213-220`: identificador "Palet #{id}" en `text-base leading-tight
font-medium` (el tamaño de fuente más grande del componente); labels de sección
  ("Productos"/"Lotes"/"Obs.") en `text-[10px] font-medium uppercase` (línea 336, 360, 380);
  footer de stats en `text-sm font-medium` (línea 395, 401); cabecera cara trasera en
  `text-sm font-medium` (línea 435). La jerarquía se mantiene correctamente solo por tamaño
  (`text-base` > `text-sm` > `text-[10px]`), tal como exige el criterio de aceptación.
- `MoveMultiplePalletsToStoreDialog/index.tsx:336-338`: identificador "Palet #{id}" en
  `text-base font-medium`; footer de stats en `text-sm font-medium` (línea 413, 419); nombre
  de almacén destino en confirmación en `text-sm font-medium` (línea 554). Mismo patrón,
  mismo criterio que `GAP-V2-073`.

`npm run type-check` limpio. `npx eslint` sobre ambos archivos sin errores nuevos (mismo
warning preexistente ya reportado en GAP-V2-075, no relacionado con este cambio). Sin
observaciones.

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-073 (misma recurrencia, `PalletView`/`MobilePalletView`, primera
  pasada), PL-024 en `.claude/project-learnings.md`
