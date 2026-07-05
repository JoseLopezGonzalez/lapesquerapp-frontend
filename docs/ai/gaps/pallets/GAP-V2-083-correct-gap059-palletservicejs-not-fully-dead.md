---
id: GAP-V2-083
title: Corregir premisa de GAP-V2-059 — palletService.js no está muerto, alimenta el listado de palets
module: pallets
category: code-quality
priority: P0
risk: high
size: XS
status: candidate
dependencies: []
target_files:
  - src/services/domain/pallets/palletService.js
  - src/services/domain/entityServiceMapper.ts
  - src/components/Admin/Entity/EntityClient/index.js
  - docs/ai/gaps/pallets/GAP-V2-059-dead-duplicate-legacy-pallet-service.md
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-083 — Corregir premisa de GAP-V2-059: `palletService.js` no está muerto

## Problema

`GAP-V2-059` (estado actual: `ready`) afirma que
`src/services/domain/pallets/palletService.js` está "completamente muerto" porque
"cero archivos importan `@/services/domain/pallets/palletService`". Esa verificación
es incorrecta: el archivo sí tiene un importador real, solo que vía import relativo
en vez de alias absoluto, lo que probablemente hizo que el grep original (buscando el
string `domain/pallets/palletService`) no lo detectara:

```ts
// src/services/domain/entityServiceMapper.ts:60
import { palletService } from './pallets/palletService';
// ...
// src/services/domain/entityServiceMapper.ts:104
const entityServiceMap: Record<string, DomainService> = {
  ...
  pallets: palletService,
  ...
};
```

Ese mapa alimenta `getEntityService(config.endpoint)`, usado directamente por el
motor genérico de listados en tres puntos verificados para la entidad `pallets`
(`config.endpoint === 'pallets'`, ver `src/configs/entities/entitiesConfig.stock.ts:433`):

- `src/components/Admin/Entity/EntityClient/index.js:417,437` — `entityService.list(filtersObject, { page, perPage })`, la carga de la tabla de `/admin/pallets`.
- `src/components/Admin/Entity/EntityClient/index.js:285,292` — `entityService.delete(id)`, borrado individual de fila.
- `src/components/Admin/Entity/EntityClient/index.js:589,597` — `entityService.deleteMultiple(selectedRows)`, borrado masivo.

Es decir: **`palletService.js` es el service activo que sirve `list`, `delete` y
`deleteMultiple` para la pantalla de listado de palets (`/admin/pallets`)**. Si se
ejecuta la solución propuesta en GAP-V2-059 tal cual está escrita (borrar el archivo
completo), el listado de palets se rompe en producción: la tabla dejaría de cargar y
los borrados (individual y masivo) lanzarían un error en tiempo de ejecución al
intentar invocar métodos de un service inexistente.

Dicho esto, la observación de fondo de GAP-V2-059 no es enteramente errónea: los
métodos `create` (líneas 63-69), `update` (71-77) y `getById` (57-61) de este mismo
archivo sí están efectivamente muertos, porque la configuración de la entidad evita
por completo los formularios genéricos para `pallets`:

- `hideEditButton: true` (`entitiesConfig.stock.ts:426`) — nunca se abre `EditEntityForm`.
- `createRedirect: '/admin/pallets/create'` (línea 436) — el botón "crear" hace
  `router.push(config.createRedirect)` (`EntityClient/index.js:332-336`), nunca
  llama a `entityService.create(...)`.
- `viewRoute: '/admin/pallets/:id'` (línea 434) — el detalle navega a una ruta propia
  en vez de abrir el formulario de edición genérico.

Así que el archivo tiene una mezcla real: 4 métodos vivos (`list`, `delete`,
`deleteMultiple`, y potencialmente `getOptions` si algún select genérico apunta a
`pallets/options`) y 3 métodos muertos (`create`, `update`, `getById`) que nunca se
invocan desde ningún flujo real.

## Objetivo

`GAP-V2-059` queda corregido o rechazado antes de que `gap-implementor` lo tome —
no debe implementarse tal como está escrito porque causaría una regresión de
producción verificable (listado de palets roto). El proyecto conserva un único
service claro para las operaciones que sí están activas en el listado genérico.

## Contexto

Esta es la verificación explícitamente solicitada en el encargo de esta segunda
pasada: "confirma o corrige esa hipótesis con lo que veas ahora". Confirmado: la
hipótesis de GAP-V2-059 es incorrecta en su premisa central (archivo completamente
muerto) aunque acierta parcialmente en que hay métodos huérfanos dentro de él.

## Solución propuesta

1. Marcar `GAP-V2-059` como `status: rejected` (o reescribir su alcance) con una nota
   que enlace a este GAP, para que `gap-implementor` no lo ejecute tal cual.
2. Nuevo alcance correcto para el archivo: eliminar únicamente los métodos muertos
   (`create`, `update`, `getById`) de `palletService.js`, dejando `list`, `delete`,
   `deleteMultiple` y `getOptions` (si se confirma su uso) — o, alternativamente,
   documentar explícitamente en el archivo por qué esos 3 métodos existen aunque no
   se llamen (p. ej. si se planea habilitar edición genérica en el futuro).
3. Evaluar si merece la pena resolver la ambigüedad de nombre con
   `src/services/palletService.ts` (620 líneas, funciones sueltas, usado por
   `useOrder`/`usePallet` y sus sub-hooks) con un nombre más distintivo para el
   service de objeto-con-métodos (p. ej. renombrar el export interno o mover a
   `src/services/domain/pallets/palletListService.ts`) — esto es opcional y de menor
   prioridad frente al riesgo inmediato de borrar un archivo en uso.

## Criterios de aceptación

- [ ] `GAP-V2-059` ya no tiene `status: ready` con la solución de "eliminar el
      archivo completo" sin resolver esta corrección primero.
- [ ] `src/services/domain/pallets/palletService.js` sigue existiendo y exportando
      `list`, `delete`, `deleteMultiple` (los métodos verificados como activos).
- [ ] El listado `/admin/pallets` (tabla, borrado individual, borrado masivo) sigue
      funcionando tras cualquier cambio derivado de este GAP.
- [ ] Si se eliminan `create`/`update`/`getById`, `npm run type-check` y
      `npm run lint` pasan sin errores nuevos.

## Plan de validación

```text
grep -n "pallets: palletService" src/services/domain/entityServiceMapper.ts
grep -n "getEntityService(config.endpoint)" src/components/Admin/Entity/EntityClient/index.js
npm run type-check
npm run lint
# Manual: abrir /admin/pallets, verificar que la tabla carga, que el borrado
# individual y el borrado masivo funcionan.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-059 (premisa corregida por este GAP)
