---
id: GAP-V2-030
title: useOrderFormConfig duplica formGroups/defaultValues en useState sincronizados por useEffect
module: orders
category: code-quality
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/hooks/useOrderFormConfig.ts
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-030 — `useOrderFormConfig` sincroniza estado derivado con `useEffect` en vez de derivarlo directamente

## Problema

`src/hooks/useOrderFormConfig.ts` (541 líneas) tiene dos casos del anti-patrón
"estado espejo de un valor ya derivado", contra la regla de
`.claude/rules/hooks.md` ("Nunca estado local para datos del servidor") y el
checklist REACT PATTERNS ("useEffect no usado como mecanismo de
fetching/derivación de estado"):

**1. `formGroups` — estado que copia un `useMemo` ya calculado (líneas 379-380,
413-515, 534-536):**

```ts
const [formGroups, setFormGroups] = useState<FormGroup[]>(initialFormGroups);
// ...
const formGroupsWithOptions = useMemo(() => { /* ... deriva de options ... */ }, [
  options.salespeople, options.fieldOperators, /* ... */
]);
// ...
useEffect(() => {
  setFormGroups(formGroupsWithOptions);
}, [formGroupsWithOptions]);
```

`formGroupsWithOptions` ya es el valor final correcto, calculado con `useMemo`.
El `useEffect` que lo copia a `setFormGroups` no aporta nada — solo introduce un
render adicional cada vez que cambian las opciones (primero se renderiza con el
`formGroups` viejo, luego el efecto dispara un segundo render con el valor
correcto). El hook podría simplemente devolver `formGroupsWithOptions`
directamente, sin `useState` ni `useEffect` para esto.

**2. `defaultValues` — estado servidor sincronizado desde props vía `useEffect`
(líneas 379, 383-411):**

```ts
const [defaultValues, setDefaultValues] = useState<DefaultValues>(initialDefaultValues);
// ...
useEffect(() => {
  if (orderData) {
    setDefaultValues({ /* ... mapea orderData a DefaultValues ... */ });
  }
}, [orderData]);
```

Esto es exactamente el patrón "datos del servidor guardados en estado local"
prohibido por `hooks.md`: `orderData` ya llega como prop (viene de
`useOrderContext()` en el caller), y en vez de derivarse con `useMemo` se copia a
un `useState` a través de un efecto, añadiendo un render extra y una fuente
adicional de desincronización si `orderData` cambia más rápido que el ciclo de
efectos.

**Contraste con el hook hermano:** `src/hooks/useOrderCreateFormConfig.ts` (mismo
propósito, para creación en vez de edición) calcula `formGroups` con `useMemo`
puro, sin `useState`+`useEffect` intermedio — es el patrón correcto ya presente en
el propio módulo. `useOrderFormConfig` es la única de las dos implementaciones con
el anti-patrón.

**Efecto downstream:** `OrderEditSheet/index.tsx` (que consume este hook) ya tiene
su propio `useEffect` (líneas 104-109) que hace `reset(defaultValues)` cuando
`open && defaultValues && !loading` — es decir, hay dos niveles de efectos
encadenados (uno dentro del hook, otro en el componente) para lo que podría ser
una sola derivación directa.

## Objetivo

`useOrderFormConfig` deriva `formGroups` y `defaultValues` con `useMemo` (u otro
mecanismo síncrono), sin `useState`+`useEffect` intermedio, eliminando los renders
adicionales y acercando el hook al patrón ya correcto de
`useOrderCreateFormConfig`.

## Contexto

Encontrado durante la auditoría de `code-audit-agent` sobre
`OrderEditSheet/OrderEditSheet` y sus hooks de soporte (fuera del alcance de la
pasada anterior, que cubrió `useOrderCostAnalysis`/`useOrderOptions` en
GAP-V2-003 y `useOrderFormOptions`/`useOrderCreateFormConfig` en GAP-V2-005, pero
no `useOrderFormConfig`).

## Solución propuesta

1. Sustituir `const [formGroups, setFormGroups] = useState(...)` +
   `useEffect(() => setFormGroups(formGroupsWithOptions), [...])` por devolver
   `formGroupsWithOptions` directamente (ya es un `useMemo`).
2. Sustituir `const [defaultValues, setDefaultValues] = useState(...)` +
   `useEffect` de sincronización por un `useMemo` que derive `defaultValues` a
   partir de `orderData` directamente (con `initialDefaultValues` como fallback
   cuando `orderData` es `null`/`undefined`).
3. Verificar que `OrderEditSheet` sigue reseteando el formulario correctamente al
   abrir el Sheet (su propio `useEffect` de `reset()` puede simplificarse o
   mantenerse, según si sigue siendo necesario tras el cambio).

## Criterios de aceptación

- [ ] `useOrderFormConfig` no usa `useState` para valores que ya se calculan de
      forma síncrona a partir de sus dependencias (`orderData`, `options`).
- [ ] Editar un pedido sigue precargando correctamente todos los campos del
      formulario (verificación manual en `/admin/orders-manager`, abrir "Editar"
      sobre un pedido con datos completos).
- [ ] Cambiar de pedido seleccionado (sin recargar la página) sigue actualizando
      el formulario con los datos del nuevo pedido.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: abrir OrderEditSheet sobre 2 pedidos distintos consecutivamente (sin
# recargar), confirmar que los campos reflejan cada pedido correctamente.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-003 (mismo síntoma de fetching/estado manual en otros
  hooks), GAP-V2-005 (mismo módulo, hooks de opciones de formulario),
  GAP-V2-026 (mismo componente `OrderEditSheet`, hallazgo distinto)
