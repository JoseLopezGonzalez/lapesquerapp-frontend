---
id: GAP-V2-139
title: warehouse/[storeId]/page.js silencia errores reales de red/servidor como si fueran "acceso no autorizado"
module: dashboard-home
category: code-quality
priority: P2
risk: medium
size: XS
status: candidate
dependencies: []
target_files:
  - src/app/warehouse/[storeId]/page.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-139 — Catch de `loadStoreData` conflacta error real con "no autorizado", sin `notify.error`

## Problema

`src/app/warehouse/[storeId]/page.js:42-58`:

```js
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

Cualquier error al cargar el almacén — un 403 real por no tener acceso, pero también un 500 de
servidor, un timeout de red, o cualquier excepción inesperada — termina en el mismo
`router.push('/unauthorized')`, sin ningún `notify.error` que informe al usuario. Solo hay un
`console.error` (visible en devtools, invisible para el usuario real).

Esto viola el patrón documentado en `.claude/rules/api-client.md` § Manejo de errores por
código HTTP (distinguir 401/403 de 500) y el patrón general de la app de mostrar
`notify.error` en fallos de carga. Para un operario o técnico que intenta acceder a su almacén
y recibe un error de servidor transitorio, el mensaje "Acceso restringido... tu cuenta no tiene
permisos" es incorrecto y confuso — no es un problema de permisos, es un fallo de red/backend.

## Objetivo

Un error real de red/servidor al cargar el almacén se distingue de un caso legítimo de
"almacén no encontrado o sin acceso", y en el primer caso el usuario recibe un
`notify.error` claro (no la pantalla de "acceso no autorizado").

## Contexto

Relacionado con GAP-V2-135 (mover este fetching a `useStoreData`, que ya expone `error` de
TanStack Query) — si ese GAP se implementa primero, este problema se resuelve como
consecuencia natural (el componente puede leer `error` del hook y decidir qué UI mostrar). Si
se prioriza este GAP de forma independiente, aplicar el fix directamente sobre el
`try/catch` actual.

## Solución propuesta

Opción A (si GAP-V2-135 se implementa primero): al migrar a `useStoreData`, distinguir en el
render entre `error` (mostrar `notify.error` + mensaje de error genérico) y "almacén no
encontrado tras carga exitosa" (mantener la pantalla de acceso no autorizado actual).

Opción B (fix independiente, sin esperar a GAP-V2-135):
```js
} catch (error) {
  console.error('Error loading store data:', error);
  notify.error('No se pudo cargar el almacén. Inténtalo de nuevo.');
  router.push('/unauthorized');
}
```
(fix mínimo — sigue redirigiendo, pero al menos informa al usuario de que fue un error, no una
denegación de permisos silenciosa).

## Criterios de aceptación

- [ ] Un fallo de red/servidor al cargar el almacén muestra `notify.error` al usuario.
- [ ] El caso legítimo de "sin acceso a este almacén" sigue mostrando la pantalla de acceso
      restringido actual.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: simular un error 500 (mock temporal de storeService.getStore) y confirmar que se
# muestra notify.error, no solo la redirección silenciosa.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-135 (migración de este fetching a `useStoreData`)
