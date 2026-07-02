---
id: GAP-V2-008
title: Estado de error y "no encontrado" del detalle de pedido no sigue el patrón documentado
module: orders
category: ux-ui
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/index.tsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-008 — Estado de error y "no encontrado" del detalle de pedido no sigue el patrón documentado

## Problema

En `src/components/Admin/OrdersManager/Order/index.tsx:142-153`, cuando `order` es `null`
(tanto por error de red como por pedido no encontrado), se renderiza siempre el mismo bloque:

```tsx
<div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
  <p className="text-muted-foreground text-center text-sm">
    {error ? 'Error al cargar el pedido.' : 'Pedido no encontrado.'}
  </p>
  <Button variant="outline" onClick={() => reload()}>
    Reintentar
  </Button>
</div>
```

Dos problemas concretos:

1. **Error real no se distingue visualmente de "no encontrado".** `.claude/design-context.md`
   §Error States documenta el color de error (`text-red-500 text-sm p-4` para errores de API)
   como distinto del estado vacío/neutro. Aquí ambos casos usan idéntico
   `text-muted-foreground` gris, sin color de error para el caso `error`.
2. **El botón "Reintentar" es engañoso cuando el pedido no existe.** Si `order` es `null` sin
   `error` (pedido no encontrado, p. ej. id inválido o borrado), reintentar la carga no puede
   resolver el problema — es una acción sin efecto útil ofrecida como si lo tuviera.

Además, el patrón no usa el componente `EmptyState` (`@/components/Utilities/EmptyState`) que
sí se usa consistentemente en el resto del módulo (`OrdersList`, `OrdersManager`) para estados
sin contenido — aquí es solo texto + botón, sin icono, rompiendo la consistencia visual del
propio módulo Orders.

## Objetivo

El detalle de pedido debe distinguir visualmente un error de carga (recuperable, con acción de
reintentar) de un pedido no encontrado (no recuperable, sin botón de reintentar engañoso), y
debe seguir el mismo patrón visual (`EmptyState` o equivalente) que el resto del módulo.

## Contexto

`OrdersList` ya resuelve un caso similar razonablemente bien (bloque de error rojo con
`onRetry` condicional en `src/components/Admin/OrdersManager/OrdersList/index.tsx:286-302`) y
usa `EmptyState` para los casos sin resultados. `Order/index.tsx` es el único punto del módulo
que mezcla ambos casos (error / no encontrado) sin distinguirlos.

## Solución propuesta

- Diferenciar el `case error` del `case !order && !error` (no encontrado) en
  `Order/index.tsx:142-153`.
- Para `error`: aplicar color de error (siguiendo el patrón de `text-red-500`/semantic token de
  error) y mantener el botón "Reintentar".
- Para "no encontrado": no mostrar "Reintentar" (o sustituir por una acción útil, p. ej. volver
  al listado vía `onClose`/`reload` según corresponda), con mensaje neutro.
- Evaluar usar el componente `EmptyState` con icono apropiado (p. ej. `PackageX` o similar) para
  alinear con el resto del módulo.

## Criterios de aceptación

- [ ] El estado de error de carga se distingue visualmente (color) del estado "pedido no
      encontrado".
- [ ] El botón "Reintentar" solo aparece cuando la acción puede tener efecto (error de carga),
      no en el caso "no encontrado".
- [ ] El bloque sigue un patrón visual consistente con el resto de estados vacíos/error del
      módulo Orders (idealmente `EmptyState`).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: forzar un error de red (offline) al abrir un pedido y verificar el estado de error;
# navegar a un orderId inexistente y verificar el estado "no encontrado" sin botón de reintentar
# engañoso.
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
