---
id: GAP-V2-195
title: admin/home/page.js contiene ramas de rol inalcanzables (operario, repartidor_autoventa) por precedencia del middleware
module: dashboard-home
category: architecture-refactor
priority: P3
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/app/admin/home/page.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-195 — Ramas muertas de `operario` y `repartidor_autoventa` en `admin/home/page.js`

## Problema

`src/app/admin/home/page.js` contiene lógica de bifurcación por rol:

```js
if (role === 'operario') {
  const assignedStoreId = session?.user?.assignedStoreId ?? null;
  return <OperarioDashboard storeId={...} />;         // líneas 34-38
}

if (role === 'repartidor_autoventa') {
  return <Loader />;                                    // líneas 40-46
}
```

Precedidas por un `useEffect` (líneas 20-24) que hace `router.replace('/field')` si
`role === 'repartidor_autoventa'`.

Sin embargo, `src/middleware.ts` ya intercepta y redirige **antes** de que esta página se
sirva:

- `src/middleware.ts:207-210` — cualquier `userRole === 'operario'` en ruta `/admin/*`
  se redirige a `/operator` (edge middleware, corre antes del render de React).
- `src/middleware.ts:224-227` — cualquier `userRole === 'repartidor_autoventa'` en ruta
  `/admin/*` se redirige a `/field`.

Estas dos comprobaciones de middleware son incondicionales (no dependen de
`roleConfig['/admin/home']`, que de hecho **no** incluye ni `operario` ni
`repartidor_autoventa` — ver `src/configs/roleConfig.ts:14-20`). Esto significa que
`HomePage` (`/admin/home`) nunca se renderiza con `role === 'operario'` ni
`role === 'repartidor_autoventa'` en producción: el middleware ya redirigió la request
antes de que Next.js sirviera el componente. Las dos ramas —y el `useEffect` de
redirección duplicado, y el import de `OperarioDashboard`— son código muerto que:

1. Duplica innecesariamente la lógica de RBAC que ya vive en el middleware (dos fuentes
   de verdad para la misma regla, con riesgo de que diverjan si se toca solo una).
2. Añade una dependencia de bundle (`OperarioDashboard`) que nunca se ejecuta desde esta
   página.
3. Confunde a quien mantenga el archivo: sugiere que `admin/home` maneja esos roles,
   cuando en realidad el middleware ya los descarta antes.

## Objetivo

`admin/home/page.js` solo contiene la lógica de rol que realmente puede alcanzar esa
ruta según `roleConfig['/admin/home']`: `administrador`, `direccion`, `tecnico`,
`supervisor`. Sin ramas para `operario` ni `repartidor_autoventa`, sin el `useEffect` de
redirect duplicado, sin el import de `OperarioDashboard`.

## Contexto

Este hallazgo surge de la auditoría del carril `code-audit-agent` sobre la superficie
FieldDashboard, evaluando específicamente el patrón de redirección mencionado en el
encargo. No se detectó lo mismo para `comercial` (routeConfig tampoco lo incluye en
`/admin/home`, y el middleware también lo redirige incondicionalmente en `/admin/*` —
línea 219-222 — por lo que si existiera una rama `comercial` en este archivo sería el
mismo problema; no se encontró ninguna, por lo que no aplica).

## Solución propuesta

1. Eliminar el bloque `if (role === 'operario') { ... }` (líneas 34-38) y su import de
   `OperarioDashboard`.
2. Eliminar el bloque `if (role === 'repartidor_autoventa') { ... return <Loader /> }`
   (líneas 40-46).
3. Eliminar el `useEffect` de las líneas 20-24 (`router.replace('/field')`) — es
   redundante con el middleware.
4. Confirmar que `useRouter`/`useEffect` ya no son necesarios en el archivo tras el
   cambio; si no, quitar los imports correspondientes.
5. Añadir un comentario breve indicando que el guard de rol para estos dos casos vive en
   `src/middleware.ts` (para que un futuro cambio de `roleConfig.ts` no reintroduzca la
   confusión).

## Criterios de aceptación

- [ ] `admin/home/page.js` no contiene ramas para `operario` ni
      `repartidor_autoventa`.
- [ ] No quedan imports sin usar (`OperarioDashboard`, `useRouter`, `useEffect` si ya no
      aplican).
- [ ] `npm run lint` y `npm run type-check` limpios.
- [ ] Verificación manual: un usuario `operario` que navegue directamente a
      `/admin/home` sigue siendo redirigido a `/operator` (por middleware, sin cambio de
      comportamiento observable).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: iniciar sesión como operario y como repartidor_autoventa, navegar a
# /admin/home directamente (URL bar) y confirmar que ambos terminan en su dashboard de
# rol sin parpadeo distinto al actual.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
