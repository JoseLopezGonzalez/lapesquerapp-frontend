---
id: GAP-V2-057
title: OrderEditSheet — guardia de cambios sin guardar nunca se ejecuta (código muerto)
module: orders
category: code-quality
priority: P1
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderEditSheet/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-057 — OrderEditSheet: el guard de "cambios sin guardar" nunca se invoca

## Problema

`OrderEditSheet/index.tsx` define un handler `onCloseSheet` (líneas 182-188) cuyo
propósito es mostrar el `AlertDialog` de "Descartar cambios" (`showCancelDialog`)
cuando el formulario está `isDirty` y el usuario intenta cerrar el Sheet:

```tsx
const onCloseSheet = () => {
  if (isDirty) {
    setShowCancelDialog(true);
  } else {
    handleConfirmClose();
  }
};
void onCloseSheet; // ← suprime el warning de "declared but never used"
```

Sin embargo, el `Sheet` raíz (línea 311) no usa este handler:

```tsx
<Sheet open={open} onOpenChange={setOpen}>
```

`onOpenChange` está conectado directamente a `setOpen`, no a `onCloseSheet`. Como
`Sheet`/`SheetContent` están construidos sobre Radix Dialog, `onOpenChange` se
dispara automáticamente al hacer click fuera del panel, al pulsar Escape, o al
arrastrar hacia abajo en mobile — todos estos caminos cierran el formulario
inmediatamente y **pierden los cambios sin guardar sin ninguna confirmación**,
pese a que el código para prevenir justo eso existe en el archivo.

El `void onCloseSheet;` en línea 189 es la señal: es el patrón usado en este mismo
archivo (`void loadingProgress;`, `void initialValues;`) para silenciar el lint de
variable no usada en vez de resolver por qué no se usa. Aquí no es una variable
sobrante — es una función de seguridad completa que quedó desconectada,
probablemente en un refactor donde se cambió de un botón "Cancelar" explícito
(que sí llamaba `onCloseSheet`) a depender solo de `onOpenChange` del `Sheet`.

Esto contradice el checklist de FORMS (`.claude/agents/code-audit-agent.md`):
"Destructive actions have confirmation before executing" — perder cambios de
edición de un pedido sin confirmar es una acción destructiva no confirmada.

## Objetivo

Cerrar el `OrderEditSheet` con cambios sin guardar (click fuera, Escape, swipe)
siempre muestra la confirmación "Descartar cambios" antes de perder los datos,
igual que ya ocurre al pulsar un botón de cancelar explícito.

## Contexto

No hay ningún GAP previo sobre este archivo. `useOrderFormConfig` (usado por este
mismo Sheet) es GAP-V2-030 (separado, sobre estado derivado redundante) — no se
solapan.

## Solución propuesta

1. Conectar `onOpenChange` del `Sheet` a un handler que reproduzca la lógica de
   `onCloseSheet`: si `nextOpen` es `false` y `isDirty`, mostrar
   `setShowCancelDialog(true)` y no cerrar; si no hay cambios, delegar a
   `setOpen`/`handleConfirmClose`.
2. Eliminar el `void onCloseSheet;` una vez el handler esté realmente conectado.
3. Revisar si `initialValues`/`loadingProgress` (también silenciados con `void`)
   son código muerto genuino o si deberían usarse — si son muertos, eliminarlos en
   vez de silenciarlos.

## Criterios de aceptación

- [ ] Abrir `OrderEditSheet`, modificar un campo, y cerrar el Sheet con Escape (o
      click fuera, o swipe en mobile) muestra el diálogo "Descartar cambios" antes
      de cerrar.
- [ ] Sin cambios (`isDirty === false`), cerrar por cualquier vía cierra
      directamente sin diálogo (comportamiento actual preservado).
- [ ] Ya no queda ningún `void onCloseSheet;` sin uso real de la función.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: editar un pedido, modificar un campo, cerrar con Escape/click fuera/swipe
# y confirmar que aparece "Descartar cambios" antes de perder el cambio.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-006 (botón Cancelar explícito en `CreateOrderForm`,
  patrón equivalente ya resuelto ahí pero no en este Sheet)
