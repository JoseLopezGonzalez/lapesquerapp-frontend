---
id: GAP-V2-009
title: Inconsistencias de copy en Orders Manager (tilde en pestaña y capitalización de placeholder)
module: orders
category: ux-ui
priority: P3
risk: low
size: XS
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx
  - src/components/Admin/OrdersManager/OrdersList/index.tsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-009 — Inconsistencias de copy en Orders Manager

## Problema

Dos inconsistencias de texto encontradas en el módulo, ambas de bajo esfuerzo pero visibles al
usuario:

**1. Pestaña "Envio de Documentos" sin tilde y en Title Case, inconsistente con el resto**

`src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx:17`:

```ts
documents: 'Envio de Documentos',
```

- Falta la tilde ("Envío", no "Envio") — el resto del proyecto sí la usa correctamente, incluido
  el título canónico de la sección: `src/components/Admin/OrdersManager/Order/config/sectionsConfig.ts:85`
  tiene `title: 'Envío de Documentos'`.
- Está en Title Case ("de Documentos" con D mayúscula), rompiendo el patrón sentence-case que
  siguen el resto de las etiquetas del mismo diccionario `TAB_LABELS`
  (`'Información'`, `'Detalle productos'`, `'Análisis'`, `'Producción'`, `'Descargas'`, etc.) y
  la regla de `.claude/design-context.md` §2 Typography: "Todo lo demás (pestañas, botones...):
  sentence case".

**2. Placeholder de búsqueda con capitalización distinta entre mobile y desktop**

`src/components/Admin/OrdersManager/OrdersList/index.tsx:251`:

```tsx
placeholder={isMobile ? 'Buscar por ID o cliente' : 'Buscar por id o cliente'}
```

Mismo campo de búsqueda, mismo dato (el ID del pedido), pero mobile capitaliza "ID" y desktop no
— inconsistencia sin justificación funcional.

## Objetivo

El texto de la pestaña "Envío de Documentos" y el placeholder de búsqueda deben ser consistentes
entre sí y con el resto del módulo.

## Solución propuesta

- `OrderTabsDesktop.tsx:17`: cambiar `'Envio de Documentos'` → `'Envío de Documentos'`.
- `OrdersList/index.tsx:251`: unificar capitalización de "ID" en ambos placeholders (elegir un
  criterio y aplicarlo a los dos, p. ej. `'Buscar por ID o cliente'` en ambos casos).

## Criterios de aceptación

- [ ] La pestaña desktop de "Envío de Documentos" muestra la tilde y sigue el patrón sentence
      case del resto de `TAB_LABELS`.
- [ ] El placeholder de búsqueda usa la misma capitalización de "ID" en mobile y desktop.

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: verificar visualmente la pestaña "Envío de Documentos" en el detalle de pedido
# (desktop) y el placeholder del buscador en ambos breakpoints.
```

## Notas de implementación

- Se corrige la etiqueta desktop de la pestaña de documentos para usar `Envío de Documentos`.
- Se unifica el placeholder de búsqueda en mobile y desktop como `Buscar por ID o cliente`.

## Resultado

- Implementado. La pestaña desktop de documentos usa `Envío de Documentos`.
- Implementado. El placeholder de búsqueda usa `Buscar por ID o cliente` en todos los breakpoints.
- Validaciones ejecutadas: `npm run lint`, `npm run type-check` y `npm run build`.

## Resultado de auditoría

Veredicto: `done`.

- La pestaña desktop de documentos muestra `Envío de Documentos`, con tilde.
- El buscador usa un único placeholder `Buscar por ID o cliente`, sin bifurcación mobile/desktop ni diferencia `ID/id`.
- Documentación de seguimiento coherente: registry, audit, next-action y worklog apuntan a GAP-V2-009 como resuelto y a GAP-V2-014 como siguiente UX low-risk.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno detectado
