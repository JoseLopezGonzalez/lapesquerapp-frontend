---
id: GAP-V2-135
title: warehouse/[storeId]/page.js hace fetch manual de la tienda con useEffect+useState en vez de reusar useStoreData (TanStack Query)
module: dashboard-home
category: architecture-refactor
priority: P2
risk: medium
size: M
status: candidate
dependencies: []
target_files:
  - src/app/warehouse/[storeId]/page.js
  - src/hooks/useStoreData.ts
  - src/services/storeService.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-135 — Fetch manual de almacén con `useEffect`/`useState` duplica `useStoreData`

## Problema

`src/app/warehouse/[storeId]/page.js:17-58` carga los datos del almacén con el patrón
explícitamente prohibido por `.claude/rules/hooks.md` ("Nunca estado local para datos del
servidor") y por el checklist REACT PATTERNS de este mismo agente ("useEffect no debe usarse
como mecanismo de fetching — usar TanStack Query"):

```js
const [storeData, setStoreData] = useState(null);
const [loading, setLoading] = useState(true);
...
useEffect(() => {
  ...
  loadStoreData();
}, [status, session, storeId, router]);

const loadStoreData = async () => {
  try {
    const storeData = await getStore(storeId, session.user.accessToken);
    setStoreData({ id: storeData.id, name: storeData.name, companyName: session.user.companyName });
  } catch (error) {
    console.error('Error loading store data:', error);
    router.push('/unauthorized');
  } finally {
    setLoading(false);
  }
};
```

Esto reimplementa manualmente exactamente lo que ya existe como hook con TanStack Query:
`src/hooks/useStoreData.ts`, que ya usa `useQuery` para obtener un almacén por id y ya es
usado en otros puntos del módulo de stock. No hay ninguna razón visible en el archivo para no
usarlo aquí — ambos llaman en última instancia a `getStore()` de `storeService.ts`.

Además, la llamada pasa un segundo argumento a `getStore`:

```js
const storeData = await getStore(storeId, session.user.accessToken);
```

pero la firma actual de `getStore` en `src/services/storeService.ts:38` es
`getStore(id: number | string): Promise<unknown>` — **solo acepta un parámetro**. El segundo
argumento (`session.user.accessToken`) se ignora silenciosamente en tiempo de ejecución (JS no
falla por argumentos extra). Es resto de una versión anterior de `getStore` que sí aceptaba
token (ver PL-010/GAP-027, patrón token-as-parameter), y no se limpió al actualizarse la
llamada — no rompe nada hoy, pero es código muerto/engañoso que sugiere que el token se está
usando cuando no es así.

## Objetivo

`warehouse/[storeId]/page.js` obtiene los datos del almacén vía `useStoreData` (u otro hook
basado en TanStack Query), sin `useEffect`/`useState` manual ni llamada directa a
`getStore()`. La llamada a `getStore` (donde exista) no recibe argumentos que la función ya no
acepta.

## Contexto

Relacionado con GAP-V2-132 (extracción de este `page.js` a Server Component + PageClient) —
si ambos GAPs se abordan, este cambio de fetching encaja naturalmente dentro del nuevo
`WarehouseStorePageClient`. Pueden implementarse en el mismo commit o por separado (este GAP no
depende estrictamente de que se haga la extracción de `'use client'` primero).

## Solución propuesta

1. Sustituir `useState`/`useEffect`/`loadStoreData` por `useStoreData({ storeId })` (el hook ya
   expone `store`, `loading`, `error`, `refetch` — contrato compatible con el uso actual).
2. Adaptar el render para usar `store.name`/`store.id` desde el resultado de `useStoreData` en
   vez de `storeData` local.
3. Quitar el segundo argumento (`session.user.accessToken`) de cualquier llamada residual a
   `getStore()` que quede en el archivo tras el refactor.
4. Mantener el redirect a `/unauthorized` cuando el hook devuelve `error`, pero considerar (no
   obligatorio en este GAP) diferenciar error real de "no encontrado" — ver también
   GAP-V2-139 para el manejo de errores específico de este bloque.

## Criterios de aceptación

- [ ] `warehouse/[storeId]/page.js` no tiene `useState`/`useEffect` para cargar datos del
      almacén — usa `useStoreData` (o hook equivalente basado en `useQuery`).
- [ ] Ninguna llamada a `getStore()` en el archivo recibe un segundo argumento.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] La ruta `/warehouse/[storeId]` sigue funcionando igual para operario, administrador y
      técnico (carga de nombre de almacén, redirect a `/unauthorized` si no existe/no hay
      acceso).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: verificar /warehouse/[storeId] con un storeId válido y uno inválido/no autorizado,
# para ambos roles operario y administrador.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-132 (extracción a PageClient), GAP-V2-139 (manejo de errores del
  mismo bloque), GAP-027 (patrón token-as-parameter histórico en `storeService.ts`)
