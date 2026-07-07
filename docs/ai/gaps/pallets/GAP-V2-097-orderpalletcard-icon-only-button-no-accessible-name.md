---
id: GAP-V2-097
title: OrderPalletCard usa un SVG manual sin nombre accesible en vez del icono Lucide ya usado en el resto del módulo
module: pallets
category: a11y-responsive
priority: P1
risk: low
size: XS
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-07
normalized_at: 2026-07-05
---

# GAP-V2-097 — Botón de acciones sin nombre accesible en `OrderPalletCard`

## Problema

`OrderPalletCard/index.tsx:168-187` (la vista mobile de la lista de palets vinculados a un
pedido — ver `OrderPalletsContent.tsx:82-106`, que renderiza `OrderPalletCard` en mobile y
`OrderPalletTableRow` en desktop) implementa el trigger del menú de acciones con un `<svg>`
escrito a mano en vez de un icono de `lucide-react`, y **sin ningún nombre accesible**
(ni `aria-label`, ni `<span className="sr-only">`):

```tsx
<Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ...>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
</Button>
```

Esto es doblemente inconsistente:

1. **Icono duplicado manualmente:** el icono dibujado a mano es visualmente idéntico a
   `MoreVertical`/`EllipsisVertical` de `lucide-react`, ya importado y usado para exactamente
   el mismo propósito en el componente hermano de escritorio de este mismo módulo,
   `OrderPalletTableRow.tsx:13,121` (`<EllipsisVertical className="h-4 w-4" />`), y también en
   `PositionSlideover/PalletCard/index.tsx:14,280` (`<MoreVertical className="h-4 w-4" />`),
   componente análogo de la superficie de movimientos de almacén auditada en esta misma
   pasada.
2. **Sin nombre accesible:** a diferencia de `OrderPalletTableRow.tsx:119`
   (`aria-label={\`Acciones del palet ${pallet.id}\`}`) y de
`PositionSlideover/PalletCard/index.tsx:281` (`<span className="sr-only">Acciones</span>`),
este botón no tiene ni `aria-label`ni`sr-only` — un lector de pantalla lo anuncia como
   "botón" sin ninguna indicación de su propósito.

Es la misma clase de hallazgo que `GAP-V2-072` (primera pasada, botones de icono sin nombre
accesible en el visor de imágenes del palet), ahora en la vista mobile de vinculación de
palets a pedido.

## Objetivo

`OrderPalletCard` usa `EllipsisVertical` de `lucide-react` (mismo icono que su componente
hermano `OrderPalletTableRow`) y expone un nombre accesible (`aria-label` o `sr-only`)
consistente con el resto del módulo.

## Contexto

Ver `design-context.md` § "Icons are Lucide-only" y GAP-V2-072 (primera pasada, mismo patrón
de hallazgo). `OrderPalletTableRow.tsx:119-121` es la referencia directa a seguir, al ser el
componente hermano exacto (misma lista, misma acción, solo cambia el breakpoint).

## Solución propuesta

Reemplazar el bloque `<svg>...</svg>` por `import { EllipsisVertical } from 'lucide-react'` y
`<EllipsisVertical className="h-4 w-4" />`, y añadir
`aria-label={\`Acciones del palet ${pallet.id}\`}`al`Button`trigger, replicando
exactamente el patrón de`OrderPalletTableRow.tsx:116-122`.

## Criterios de aceptación

- [ ] `OrderPalletCard` importa y usa `EllipsisVertical` de `lucide-react` en vez del `<svg>`
      manual.
- [ ] El botón trigger tiene `aria-label` con el mismo patrón que `OrderPalletTableRow`
      (`Acciones del palet {id}`).
- [ ] `grep -rn "<svg" src/components/Admin/OrdersManager/Order/OrderPallets` no devuelve
      resultados de iconos duplicados manualmente.
- [ ] Sin regresión visual: el icono se ve igual (mismo glifo visual) en la tarjeta mobile.

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "<svg" src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard
# Manual: con lector de pantalla o el árbol de accesibilidad de DevTools, confirmar que el
# botón de acciones de la tarjeta mobile anuncia "Acciones del palet {id}" en vez de "botón".
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** patrón ya corregido en el
componente hermano de escritorio (`OrderPalletTableRow`), fix mecánico de bajo
riesgo — marcado `ready` sin cambios de fondo.

## Resultado

Reemplazado el `<svg>` manual por `EllipsisVertical` de `lucide-react` (mismo
icono que `OrderPalletTableRow`) y añadido `aria-label={\`Acciones del palet
${pallet.id}\`}`al`Button`trigger, replicando el patrón del componente
hermano de escritorio.`grep -rn "<svg"`sobre el directorio`OrderPallets`ya
no devuelve resultados de iconos manuales.`npm run type-check`y`npm run lint` limpios.

## Resultado de auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10

### Checklist

- [x] `EllipsisVertical` de `lucide-react` importado y usado en vez del `<svg>` manual.
- [x] `aria-label={\`Acciones del palet ${pallet.id}\`}`añadido, idéntico al patrón de
   `OrderPalletTableRow.tsx:119`.
- [x] `grep -rn "<svg"` sobre `OrderPallets` ya no devuelve iconos manuales.
- [x] Sin regresión visual — mismo glifo (tres puntos verticales), mismo tamaño (`h-4 w-4`).

### Observaciones para Jose

Fix mecánico ejecutado exactamente como el componente hermano de escritorio. Nada que objetar.

### Estado final de la implementación

`OrderPalletCard` usa el mismo icono y el mismo patrón de `aria-label` que
`OrderPalletTableRow`, eliminando la duplicación manual de icono y el hueco de accesibilidad.

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-072 (mismo patrón de hallazgo, primera pasada, visor de imágenes)
