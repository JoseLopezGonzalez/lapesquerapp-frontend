---
id: GAP-V2-049
title: Restaurar jerarquía de identificador primario en OrderCard desktop (cliente vs. ID)
module: orders
category: ux-ui
priority: P3
risk: low
size: XS
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-049 — Restaurar jerarquía de identificador primario en OrderCard desktop (cliente vs. ID)

## Problema

`OrderCard/index.tsx` establece explícitamente, en su propio comentario de código
(línea 101), que la variante mobile debe mostrar "Cliente protagonista → ID · Fecha
(secundario)": el nombre del cliente se renderiza en `text-base font-medium` (línea 105) y
el ID/fecha en `text-sm text-muted-foreground` (línea 110) — jerarquía correcta y clara.

La variante **desktop** de la misma card (líneas 154-217) no sigue esa misma jerarquía: el
ID (`<h3 className="text-base font-medium">#{orderId}</h3>`, línea 180) y el nombre del
cliente (`<p className="... text-base font-medium">`, línea 199) usan **el mismo tamaño y
peso**. El checklist de composición visual señala explícitamente este caso: "Primary
identifier per row/card (name, order number) is the visually dominant element — not
competing with secondary metadata" — en desktop, ID y cliente compiten al mismo nivel en
lugar de que uno domine claramente sobre el otro, mientras que mobile sí resuelve
correctamente cuál es el protagonista.

## Objetivo

La card de pedido en desktop replica la misma jerarquía ya correcta en mobile: el nombre del
cliente es el elemento visualmente dominante; el ID de pedido es un identificador secundario
claramente subordinado.

## Contexto

No hay GAP previo sobre este archivo en el eje de jerarquía visual — GAP-V2-007 (touch
targets) y GAP-V2-009/014 (copy) tocaron partes distintas del mismo componente.

## Solución propuesta

- Mantener el ID como ancla superior (badges, fecha) pero reducir su peso visual relativo:
  por ejemplo `text-sm font-medium text-muted-foreground` para `#{orderId}` (línea 180),
  dejando `text-base font-medium` exclusivamente para el nombre del cliente (línea 199), que
  pasa a ser el único elemento en esa escala — replicando la relación tonal ya usada en
  mobile entre nombre de cliente (protagonista) e ID (secundario).
- No modificar el orden visual (el ID sigue apareciendo antes que el nombre en el layout de
  la card), solo el peso/tamaño relativo.

## Criterios de aceptación

- [ ] En la variante desktop, el nombre del cliente y el ID de pedido no comparten la misma
      combinación de tamaño+peso.
- [ ] El nombre del cliente queda como elemento visualmente dominante de la card, igual que
      en mobile.
- [ ] No cambia el contenido, orden de badges (Autoventa/Desde oferta/Maquilador) ni la
      lógica de truncado (`line-clamp-2`).

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: comparar la card de pedido en desktop vs. mobile — el cliente debe leerse como
# protagonista en ambas variantes, no solo en mobile.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

### Veredicto: ✅ APROBADO

`<h3>#{orderId}</h3>` en la variante desktop pasa de `text-base font-medium` a
`text-muted-foreground text-sm font-medium`; el nombre del cliente (línea 199,
`line-clamp-2 [overflow-wrap:anywhere] text-base font-medium`) queda intacto y es
ahora el único elemento en la escala `text-base font-medium` de la card, igual
que en mobile. Orden visual sin cambios (ID sigue antes que el nombre), badges
Autoventa/Desde oferta/Maquilador y `line-clamp-2` verificados sin alteración en
el diff.

### Checklist

- [x] Cliente e ID ya no comparten tamaño+peso en desktop
- [x] Cliente queda como elemento dominante, igual que en mobile
- [x] Contenido, orden de badges y `line-clamp-2` sin cambios

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-048 (mismo archivo padre `OrdersList`, distinto elemento)
