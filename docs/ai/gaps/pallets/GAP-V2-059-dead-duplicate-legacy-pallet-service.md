---
id: GAP-V2-059
title: Eliminar únicamente los métodos muertos (create/update/getById/getOptions) de palletService.js — list/delete/deleteMultiple siguen activos en el listado de palets
module: pallets
category: code-quality
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/services/domain/pallets/palletService.js
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-059 — `palletService.js`: eliminar solo los métodos muertos, no el archivo

## Problema

**Alcance corregido tras GAP-V2-083 (segunda pasada).** La versión original de este
GAP afirmaba que `src/services/domain/pallets/palletService.js` (96 líneas) estaba
"completamente muerto" y proponía eliminarlo por completo. Esa premisa era
**incorrecta**: el archivo tiene un importador real, vía import relativo (por eso el
grep original con el string `domain/pallets/palletService` no lo detectó):

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

Ese mapa alimenta `getEntityService(config.endpoint)`, usado por el motor genérico
de listados para la entidad `pallets` en tres puntos verificados de
`src/components/Admin/Entity/EntityClient/index.js`:

- línea 417 — `entityService.list(...)`, carga de la tabla de `/admin/pallets`.
- línea 285 — `entityService.delete(id)`, borrado individual de fila.
- línea 589 — `entityService.deleteMultiple(selectedRows)`, borrado masivo.

**Eliminar el archivo completo (la solución original de este GAP) habría roto en
producción la tabla de `/admin/pallets` y ambos flujos de borrado.**

Verificación adicional (gap-normalizer, grep directo sobre `entitiesConfig.stock.ts`
y `EntityClient/index.js`) confirma la segunda mitad del hallazgo de GAP-V2-083: los
métodos `getById`, `create`, `update` y `getOptions` de este mismo archivo sí están
efectivamente muertos, porque la configuración de la entidad `pallets` evita por
completo el motor genérico de formulario/detalle/opciones:

- `hideEditButton: true` (`entitiesConfig.stock.ts:426`) — nunca se abre
  `EditEntityForm`, `entityService.update` nunca se invoca.
- `createRedirect: '/admin/pallets/create'` (línea 436) — el botón "crear" hace
  `router.push(...)`, nunca llama a `entityService.create(...)`.
- `viewRoute: '/admin/pallets/:id'` (línea 434) — el detalle navega a una ruta
  propia (`PalletClient.js` vía `usePallet.ts`/`palletService.ts`), no a
  `entityService.getById(...)`.
- Grep exhaustivo de `pallets/options` y `palletService.getOptions` en `src/`: cero
  resultados — ningún select genérico apunta al endpoint de opciones de `pallets`.

## Objetivo

El proyecto conserva un único service claro para las operaciones de `pallets` que
realmente están activas en el listado genérico (`list`, `delete`, `deleteMultiple`),
sin los cuatro métodos huérfanos que nunca se invocan y que generaban la falsa
impresión de que el archivo entero podía eliminarse.

## Contexto

Origen: GAP-V2-083 (segunda pasada de auditoría del módulo `pallets`,
2026-07-05), que corrigió la premisa de este GAP con evidencia file:line. Ver
`docs/ai/modules/pallets/audit.md` § 10 para el registro completo de la corrección.
GAP-V2-083 queda cerrado como `rejected` (absorbido) — su contenido y evidencia
quedan documentados en ese archivo para trazabilidad, y la solución correcta vive
aquí, en el GAP original.

## Solución propuesta

Eliminar de `src/services/domain/pallets/palletService.js` únicamente los métodos
`getById` (líneas 57-61), `create` (63-69), `update` (71-77) y `getOptions`
(91-95), dejando intactos `list`, `delete` y `deleteMultiple` — los tres métodos
verificados como activos vía `entityServiceMapper.ts` → `EntityClient`.

Si en el futuro se decide habilitar edición genérica para `pallets` (quitar
`hideEditButton`/`createRedirect`/`viewRoute` propio), evaluarlo como tarea aparte
de producto — no como motivo para mantener estos métodos muertos hoy.

## Criterios de aceptación

- [ ] `src/services/domain/pallets/palletService.js` sigue existiendo y exportando
      `list`, `delete`, `deleteMultiple`.
- [ ] `getById`, `create`, `update` y `getOptions` eliminados de ese archivo.
- [ ] El listado `/admin/pallets` (tabla, borrado individual, borrado masivo) sigue
      funcionando exactamente igual tras el cambio.
- [ ] `npm run type-check` y `npm run lint` sin nuevos errores.
- [ ] Ningún import roto (`grep -rn "domain/pallets/palletService" src/` sigue
      apuntando únicamente a `entityServiceMapper.ts`).

## Plan de validación

```text
grep -n "pallets: palletService" src/services/domain/entityServiceMapper.ts
grep -rn "domain/pallets/palletService" src/
npm run type-check
npm run lint
npm run build
# Manual: abrir /admin/pallets, verificar que la tabla carga, y que el borrado
# individual y el borrado masivo funcionan sin errores en consola.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** GAP corregido tras evidencia de
GAP-V2-083 (ver arriba). La versión original de este GAP ("eliminar el archivo
completo") **nunca debe ejecutarse** — habría roto `/admin/pallets` en producción.
Verificado directamente por gap-normalizer con grep sobre `entitiesConfig.stock.ts`
(`hideEditButton`, `createRedirect`, `viewRoute`) y `EntityClient/index.js`
(`getEntityService(config.endpoint)` en líneas 285/417/589, sin llamadas a
`getById`/`create`/`update` para la entidad `pallets`), y confirmación de que
`pallets/options` no se usa en ningún punto de `src/`.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-083 (corrección de premisa, absorbido — ver ese archivo
  para la evidencia file:line completa)
