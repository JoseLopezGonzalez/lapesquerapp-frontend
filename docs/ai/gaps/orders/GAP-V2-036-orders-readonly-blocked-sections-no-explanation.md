---
id: GAP-V2-036
title: Secciones/acciones bloqueadas para comercial readOnly desaparecen sin explicación
module: orders
category: ux-ui
priority: P2
risk: low
size: S
status: rejected
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx
  - src/components/Admin/OrdersManager/Order/components/OrderSectionList.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx
  - src/lib/orders/orderReadOnlyPermissions.ts
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-036 — Secciones/acciones bloqueadas para comercial readOnly desaparecen sin explicación

## Problema

Cuando un usuario comercial (`readOnly=true`) abre un pedido en curso (`status !== 'finished'`),
varias secciones/acciones desaparecen por completo de la UI sin ningún indicio de que existen
pero están restringidas:

- `getBlockedOrderSectionsForReadOnly` (`src/lib/orders/orderReadOnlyPermissions.ts:1-19`) devuelve
  `['labels', 'documents', 'incident', 'export']` para readOnly + pedido en curso, más `'analysis'`
  cuando `!canViewCostData` (`Order/index.tsx:99-102`).
- `OrderTabsDesktop.tsx:43` filtra esas pestañas del `TabsList` (`allowedSections`) — el usuario ve
  menos pestañas, sin ningún mensaje.
- `OrderSectionList.tsx:24` hace lo mismo en mobile (`visiblePrimarySections`).
- `OrderPalletsToolbar.tsx:54-72` oculta enteramente los botones "Vincular", "Crear desde
  previsión" y "Crear" cuando `readOnly=true` (`isOrderPalletsReadOnly`), sin ningún banner o
  tooltip.

El propio proyecto ya tiene el patrón correcto implementado en otro lugar del mismo módulo:
`useOrderDocuments.ts:197-205` muestra un toast explícito
`notify.error({ title: 'Documento no disponible', description: 'Este documento no está disponible
para el rol Comercial.' })` cuando un comercial intenta descargar un documento restringido. Ese
precedente no se replicó al ocultar pestañas/tabs/botones: ahí la acción simplemente deja de
existir, sin feedback.

Para un usuario comercial que conoce el flujo completo (o que compara con un compañero
administrador), esto se percibe como una pestaña "que desapareció" o un botón "que ya no está",
sin manera de saber si es un permiso, un bug, o un estado de carga.

## Objetivo

Cuando una sección o acción no está disponible por permisos (no por no aplicabilidad de negocio),
el usuario comercial debe poder entender _por qué_ sin necesidad de preguntar a otra persona —
siguiendo el mismo patrón ya usado en `useOrderDocuments.ts` para documentos restringidos.

## Contexto

- Reglas de permisos ya confirmadas y correctas en GAP-V2-020/021 (ocultar coste/margen, ocultar
  creación) — este GAP no cuestiona _qué_ se bloquea, solo que el bloqueo sea comunicado.
- `COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS` en `orderReadOnlyPermissions.ts` es la fuente
  única de verdad de qué se bloquea — cualquier cambio de UI debe consumir esa lista, no
  duplicarla.

## Solución propuesta

Opciones (a decidir con Jose antes de implementar, ninguna implica revertir qué se oculta):

1. Tooltip informativo en las pestañas ocultas — pero esto requiere mostrarlas deshabilitadas en
   vez de ocultarlas (cambio de patrón, discutir si es deseable en tabs con scroll horizontal ya
   ajustado).
2. Alternativa más barata: un mensaje contextual visible una sola vez en el header/resumen del
   pedido para readOnly + en curso, del tipo "Algunas secciones no están disponibles mientras el
   pedido está en curso" — sin enumerar cada una, evitando saturar el header.
3. Para `OrderPalletsToolbar`: aplicar el mismo patrón de toast que `useOrderDocuments.ts` la
   primera vez que el comercial intente una acción de palets no disponible (si hay algún punto de
   entrada indirecto), o al menos un `Tooltip`/texto discreto en el toolbar explicando la
   restricción en vez de solo omitir los botones.

Confirmar con Jose la opción preferida antes de implementar — este GAP no debe implementarse a
ciegas dado que toca UX de permisos ya sensible (ver riesgos de GAP-V2-020 en `audit.md` §9).

## Criterios de aceptación

- [ ] Un usuario comercial readOnly con un pedido en curso puede identificar, sin ayuda externa,
      que existen secciones/acciones no disponibles por su rol (no solo que "no están").
- [ ] La solución no revela datos de coste/margen ni reintroduce acciones ya bloqueadas por
      GAP-V2-020/021.
- [ ] No se duplica `COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS` — la UI sigue consumiendo
      `getBlockedOrderSectionsForReadOnly`/`isOrderPalletsReadOnly` como única fuente.

## Plan de validación

```text
npm run lint
npm run type-check
Verificación manual: simular sesión comercial (readOnly=true) sobre un pedido con status
'pending'/'incident' y confirmar que el mensaje de restricción es visible en desktop y mobile.
```

## Notas de implementación

**Bloqueado por `gap-normalizer` (2026-07-03):** la propia solución propuesta
lista 3 opciones de UX (tooltip en pestañas deshabilitadas / mensaje
contextual único / toast puntual en `OrderPalletsToolbar`) y pide
explícitamente "confirmar con Jose la opción preferida antes de implementar —
este GAP no debe implementarse a ciegas dado que toca UX de permisos ya
sensible". No hay una opción por defecto segura que no implique una decisión
de diseño de Jose (a diferencia de GAP-V2-056, donde sí existe un default
seguro). Pasa a `ready` en cuanto Jose elija una de las 3 opciones (o proponga
una distinta).

## Decisión de Jose (2026-07-03) — rechazado

El rol comercial no tiene expectativa de que estas secciones/acciones existan — no es una
función que "antes tenía y ahora no ve" ni algo que descubra comparando con un compañero
administrador en el flujo normal de trabajo. Avisar de que "hay más opciones que no puedes
ver" no aporta valor y puede generar más preguntas/ruido que dejarlo como está. El
comportamiento actual (ocultar sin mensaje) queda confirmado como correcto para este rol,
sin necesidad de ningún tooltip, mensaje contextual ni toast.

Documentado directamente en el código para que no se reabra como hallazgo en futuras
auditorías: comentarios junto a `COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS` e
`isOrderPalletsReadOnly` en `src/lib/orders/orderReadOnlyPermissions.ts` (fuente única de
verdad de qué se bloquea), referenciando este GAP como `rejected`.

## Resultado

No se implementa ninguna de las 3 opciones de UX propuestas. Único cambio: 2 comentarios
añadidos en `src/lib/orders/orderReadOnlyPermissions.ts` documentando la decisión. Sin
cambios funcionales — `npm run type-check` limpio.

## Resultado de auditoría

No aplica — GAP rechazado por decisión explícita de producto (Jose), no requiere
verificación técnica de `gap-auditor`.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-020 (ocultar coste/margen comercial), GAP-V2-021 (ocultar creación en manager comercial)
