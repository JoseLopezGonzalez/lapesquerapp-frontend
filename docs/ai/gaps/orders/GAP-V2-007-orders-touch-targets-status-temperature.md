---
id: GAP-V2-007
title: Touch targets bajo 44px en selectores de estado y temperatura (mobile)
module: orders
category: a11y-responsive
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/components/OrderStatusDropdown.tsx
  - src/components/Admin/OrdersManager/Order/components/OrderSummaryMobile.tsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-007 — Touch targets bajo 44px en selectores de estado y temperatura (mobile)

## Problema

`.claude/design-context.md` §5 Mobile Patterns exige: "Touch targets: Minimum `min-h-[44px]`
on all interactive elements."

En la vista de detalle de pedido en mobile (`OrderSummaryMobile`), dos controles interactivos
clave no cumplen ese mínimo:

1. **Selector de estado** (`OrderSummaryMobile.tsx:89-93`): el `DropdownMenuTrigger` envuelve
   directamente un `StatusBadge` (que renderiza un `Badge` de shadcn con padding por defecto,
   sensiblemente por debajo de 44px de alto), sin ningún `min-h-[44px]` explícito. Mismo patrón
   en `OrderStatusDropdown.tsx:34-36`, reutilizado también en `OrderHeaderDesktop.tsx:60` (ahí
   el touch target no aplica por ser desktop, pero confirma que el componente base no reserva
   espacio de toque).
2. **Selector de temperatura** (`OrderSummaryMobile.tsx:130-136`): el `DropdownMenuTrigger`
   envuelve un `<span>` con solo texto e icono (`text-lg font-medium`), sin padding ni
   `min-h-[44px]`.

Ambos son las únicas formas táctiles de cambiar el estado del pedido (En producción / Terminado
/ Incidencia) y la temperatura de carga directamente desde el resumen móvil — una acción
operativa frecuente en almacén, donde el objetivo táctil pequeño aumenta el riesgo de error de
toque.

## Objetivo

Los triggers de estado y temperatura en `OrderSummaryMobile` deben tener un área táctil mínima
de 44x44px, sin cambiar su apariencia visual actual (badge / texto).

## Contexto

El resto del módulo Orders sí respeta el mínimo de 44px en botones icon-only (ver
`OrderHeaderMobile.tsx:59,89` con `h-12 min-h-[44px] w-12 min-w-[44px]`). Este GAP alinea
`OrderSummaryMobile`/`OrderStatusDropdown` con ese mismo estándar ya aplicado en el propio
módulo.

## Solución propuesta

- Envolver el contenido de cada `DropdownMenuTrigger` en un contenedor con
  `min-h-[44px] min-w-[44px] flex items-center justify-center` (o aplicar la clase directamente
  al `DropdownMenuTrigger` si acepta className), preservando el tamaño visual del badge/texto
  interior.
- Aplicar el mismo tratamiento en `OrderStatusDropdown.tsx` ya que es reutilizado en más de un
  contexto mobile.

## Criterios de aceptación

- [ ] El trigger de estado en `OrderSummaryMobile` mide al menos 44x44px de área táctil.
- [ ] El trigger de temperatura en `OrderSummaryMobile` mide al menos 44x44px de área táctil.
- [ ] `OrderStatusDropdown.tsx` aplica el mismo mínimo cuando se usa en contexto mobile.
- [ ] Sin cambios visuales perceptibles en el badge/texto salvo el área de toque ampliada.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en viewport mobile (<768px), inspeccionar con devtools el bounding box de ambos
# triggers y confirmar >=44x44px.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno detectado
