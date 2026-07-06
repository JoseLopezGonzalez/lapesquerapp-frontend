---
id: GAP-V2-196
title: fieldOperatorService.ts recibe el token como parámetro en vez de resolverlo internamente con getAuthToken()
module: dashboard-home
category: architecture-refactor
priority: P3
risk: medium
size: L
status: candidate
dependencies: []
target_files:
  - src/services/fieldOperatorService.ts
  - src/hooks/useFieldRoutes.ts
  - src/hooks/useFieldOrders.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-196 — Patrón token-as-parameter en la capa Field (mismo anti-patrón que PL-010)

## Problema

`src/services/fieldOperatorService.ts` define cada función (`getFieldOrders`,
`getFieldOrder`, `updateFieldOrder`, `createFieldAutoventa`, `getFieldRoutes`,
`getFieldRoute`, `updateFieldRouteStop`, etc.) recibiendo `token: string` como primer
parámetro, en vez de resolverlo internamente con `getAuthToken()` como documenta
`.claude/rules/api-client.md` ("Siempre usar `getAuthToken()` desde el service — nunca
en el componente") y como ya hacen los servicios de dominio migrados (`customerService`,
`storeService.ts`, etc.).

Esto obliga a que cada hook consumidor duplique la misma plomería de sesión:

```ts
// useFieldRoutes.ts:18-24 (useFieldRouteBase) y useFieldOrders.ts:19-25 (useFieldBase)
function useFieldXxxBase() {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId, fieldOperatorId };
}
```

Este es el mismo anti-patrón ya documentado en `project-learnings.md` **PL-010**
("Token-as-parameter anti-pattern"), encontrado previamente en `storeService.ts` y
`orderService.ts` (con GAP-V2-016 abierto para hooks/services del dashboard Admin). No
estaba registrado todavía para el módulo Field — este GAP es la instancia equivalente
para `fieldOperatorService.ts` y sus dos hooks consumidores en el alcance de esta
auditoría (`useFieldRoutes.ts`, `useFieldOrders.ts`). Otros hooks Field que importan del
mismo service (`useFieldOptions.ts`, `useFieldProductsOptions.ts`,
`useFieldTaxesOptions.ts`, `useRoutes.ts`, `useRouteTemplates.ts`) probablemente
reproducen el mismo patrón pero quedan fuera del alcance de esta pasada (solo cubre
FieldDashboard) — se recomienda una auditoría de seguimiento sobre el resto del módulo
Field.

## Objetivo

`fieldOperatorService.ts` resuelve el token internamente con `getAuthToken()` en cada
función exportada, sin recibirlo como parámetro. `useFieldRoutes.ts` y
`useFieldOrders.ts` dejan de extraer `session?.user?.accessToken` solo para
reenviarlo — pueden seguir usando `useSession()` si necesitan otro dato de sesión, pero
no para esto.

## Contexto

Depende en la práctica de que `fieldOperatorService.ts` ya está en `.ts` (no requiere
migración previa, a diferencia de GAP-V2-016/017 que sí dependían de migrar `.js`→`.ts`
primero). El cambio toca una superficie amplia de callers (grep muestra 12 archivos
importando de `fieldOperatorService.ts`: `FieldAutoventaWizard.jsx`, `useFieldOrders.ts`,
`useFieldRoutes.ts`, `useRouteTemplates.ts`, `useFieldOptions.ts`,
`useFieldProductsOptions.ts`, `useFieldTaxesOptions.ts`, `useRoutes.ts`), por lo que
`risk: medium` y `size: L` — aunque el cambio en el service es mecánico, la superficie de
regresión (rutas, pedidos, autoventa, plantillas de ruta) es amplia y cubre
funcionalidad operativa crítica para repartidores en campo.

## Solución propuesta

1. En cada función de `fieldOperatorService.ts`, añadir `const token = await
   getAuthToken();` al inicio y quitar el parámetro `token` de la firma.
2. Actualizar `useFieldRouteBase`/`useFieldBase` (y cualquier otro hook Field que llame a
   este service) para no extraer ni pasar `token`.
3. Dado el volumen de callers, considerar dividir en 2 PRs: (a) los 2 hooks en el
   alcance de este GAP (`useFieldRoutes.ts`, `useFieldOrders.ts`), (b) el resto de hooks
   Field como GAP de seguimiento fuera de este módulo/alcance.
4. Verificar manualmente cada flujo tocado: listado de rutas, detalle de ruta, completar
   parada, listado de pedidos, detalle de pedido, actualizar pedido, crear autoventa.

## Criterios de aceptación

- [ ] Ninguna función de `fieldOperatorService.ts` recibe `token` como parámetro.
- [ ] `useFieldRoutes.ts` y `useFieldOrders.ts` no extraen `session?.user?.accessToken`
      para pasarlo al service.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] `npm run test:run` en verde si existen tests que mockean estas funciones con
      `token` como argumento (actualizar mocks si aplica).

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: /field — verificar dashboard, /field/rutas, /field/rutas/[id] (completar y
# omitir parada), /field/pedidos, /field/pedidos/[id], /field/autoventa (crear
# autoventa) tras el cambio.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-016 (misma familia de anti-patrón, dashboard Admin),
  PL-010 en `project-learnings.md`
