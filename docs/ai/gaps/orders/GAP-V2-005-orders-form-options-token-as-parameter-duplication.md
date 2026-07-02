---
id: GAP-V2-005
title: Recurrencia de PL-010 (token-as-parameter) duplicada en useOrderFormOptions y useOrderCreateFormConfig
module: orders
category: code-quality
priority: P1
risk: medium
size: M
status: ready
dependencies: []
target_files:
  - src/hooks/useOrderFormOptions.ts
  - src/hooks/useOrderCreateFormConfig.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-005 — Recurrencia de PL-010 duplicada en dos hooks de formulario de orders

## Problema

`.claude/project-learnings.md` PL-010 (2026-06-28, confidence HIGH) documenta el
anti-patrón **token-as-parameter**: hooks que extraen
`session?.user?.accessToken` vía `useSession()` y lo pasan manualmente a funciones
de servicio, cuando el token debe obtenerse internamente en el service con
`getAuthToken()`. Su follow-up para orders fue GAP-028 (histórico,
`.claude/gaps/closed/GAP-028-orderservice-token-interno.md`), pero ese GAP cubría
únicamente las 9 funciones de estadísticas/gráficos de `orderService.ts` — no los
hooks de opciones de formulario, que no estaban en su alcance.

El mismo anti-patrón aparece duplicado, de forma independiente, en dos hooks
distintos del módulo `orders`:

**`src/hooks/useOrderFormOptions.ts`** (157 líneas completas):
- Línea 50: `const token = session?.user?.accessToken as string | undefined;`
- Líneas 72-95: el token se reenvía manualmente a 5 servicios de otros dominios:
  `getSalespeopleOptions(token)`, `getFieldOperatorsOptions(token)`,
  `getIncotermsOptions(token)`, `getPaymentTermsOptions(token)`,
  `getTransportsOptions(token)`.
- Además implementa el fetch completo con `useState`+`useEffect`+`Promise.all`
  (líneas 33-146) en vez de `useQuery`/`useQueries` — mismo síntoma que
  GAP-V2-003, pero en un hook distinto.
- Errores capturados solo con `console.error` (líneas 73, 77, 81, 85, 89, 93, 113)
  — no llegan al usuario ni pasan por `notify.error`, violan el checklist GENERAL
  ("No console.log, console.error left in production code") de
  `.claude/agents/code-audit-agent.md`.

**`src/hooks/useOrderCreateFormConfig.ts`** (452 líneas, hook de 130 líneas dentro
de él):
- Línea 338: `const token = (session?.user as { accessToken?: string })?.accessToken;`
- Líneas 349-355: el mismo patrón, reenviando el token a **6** servicios:
  `getSalespeopleOptions`, `getPaymentTermsOptions`, `getIncotermsOptions`,
  `getTransportsOptions`, `getCustomersOptions`, `getFieldOperatorsOptions` (más
  `externalProcessorService.getOptions()`, que sí es correcto — no toma token).
- Es una reimplementación casi idéntica del mismo `Promise.all` de
  `useOrderFormOptions.ts`, pero con `customers` añadido y sin `fieldOperators`
  reutilizado desde el hook hermano — dos hooks del mismo módulo resolviendo el
  mismo problema (opciones de formulario de pedido) por caminos independientes y
  duplicados.
- Línea 444: `console.error('Error cargando opciones de formulario:', err)` sin
  notificación al usuario — si el fetch falla, `loading` queda en `false` (línea no
  alcanzada, permanece `true` implícitamente porque el catch no llama
  `setLoading(false)`) y el formulario se queda sin opciones sin ningún aviso
  visible.

Este último punto es además un bug funcional: si `Promise.all` rechaza, el
`catch` de `useOrderCreateFormConfig.ts:443-445` **no llama a `setLoading(false)`**
— a diferencia de `useOrderFormOptions.ts:114-117`, que sí lo hace en su `.catch()`
equivalente. El formulario de creación de pedido quedaría en estado de carga
indefinido si cualquiera de las 7 llamadas falla.

## Objetivo

Ambos hooks obtienen las opciones de formulario vía `useQuery`/`useQueries` sin
extraer ni reenviar el token manualmente (los services lo obtienen internamente con
`getAuthToken()`), y los errores se notifican al usuario con `notify.error` en vez
de quedar solo en consola. Se evalúa consolidar la lógica duplicada entre ambos
hooks en un único punto compartido.

## Contexto

Recurrencia directa de PL-010. Dado que ya hay un patrón de recurrencia
identificado en el proyecto (`PL-BUILD-05` describe el riesgo de que un
anti-patrón señalado y no resuelto reaparezca), vale la pena resolver ambos hooks
en el mismo GAP para no dejar un tercer punto de reaparición.

No confundir con GAP-V2-003 (que cubre `useOrderCostAnalysis` y `useOrderOptions`,
dos hooks distintos, ya usados dentro de `useOrder.ts`). Este GAP cubre los hooks
de **formulario** (`useOrderFormOptions`, usado por `useOrderFormConfig` para
edición, y `useOrderCreateFormConfig`, usado en creación).

## Solución propuesta

1. Auditar si los servicios subyacentes (`salespersonService`, `fieldOperatorService`,
   `incotermService`, `paymentTernService`, `transportService`, `customerService`)
   ya soportan llamarse sin token (usando `getAuthToken()` internamente) — si no,
   ese es un cambio previo de servicio, no de estos hooks.
2. Convertir `useOrderFormOptions` a `useQueries` (una query por catálogo) o a un
   único `useQuery` que agregue las 5 llamadas en su `queryFn`, con `staleTime: 10
   * 60 * 1000` (catálogos de referencia, según `.claude/rules/hooks.md`).
3. Evaluar si `useOrderCreateFormConfig` puede reutilizar directamente
   `useOrderFormOptions` (añadiendo `customers` como sexta opción) en vez de
   duplicar el `Promise.all` — eliminando la duplicación entre ambos hooks.
4. Sustituir los `console.error` por `onError` de `useQuery`/`useQueries` +
   `notify.error(getErrorMessage(err))`.
5. Confirmar que el bug de `loading` colgado en `useOrderCreateFormConfig.ts` deja
   de ser posible una vez que el estado de carga lo gestiona `useQuery`
   (`isLoading`/`isError` en vez de un `useState` manual).

## Criterios de aceptación

- [ ] Ni `useOrderFormOptions.ts` ni `useOrderCreateFormConfig.ts` extraen
      `accessToken` de `useSession()` para reenviarlo a un service.
- [ ] Ambos hooks usan `useQuery`/`useQueries` en vez de `useState`+`useEffect` para
      las opciones de formulario.
- [ ] No quedan `console.error` sin `notify.error` equivalente para el usuario.
- [ ] El formulario de creación de pedido no puede quedarse en loading indefinido
      si una de las llamadas de opciones falla.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Verificación manual: abrir el formulario de creación de pedido y el de
      edición, confirmar que las opciones de cliente/comercial/transporte/etc.
      cargan igual que antes; simular un fallo de red en una de las llamadas y
      confirmar que se muestra un error visible en vez de quedarse colgado.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: abrir /admin/orders (crear pedido) y editar un pedido existente,
# confirmar carga de opciones. Simular fallo de red (DevTools > Network > offline
# en una request) y confirmar que aparece notify.error en vez de un loading colgado.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: PL-010 (`.claude/project-learnings.md`), GAP-028 (histórico,
  cobertura parcial del mismo anti-patrón en `orderService.ts`), GAP-V2-003
  (mismo síntoma de fetching manual, hooks distintos)
