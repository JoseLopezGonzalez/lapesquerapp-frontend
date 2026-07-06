---
id: GAP-V2-140
title: Dos implementaciones paralelas de storeService (services/storeService.ts vs services/domain/stores/storeService.js) — clarificar cuál es la fuente de verdad
module: dashboard-home
category: architecture-refactor
priority: P4
risk: low
size: XS
status: blocked
dependencies: []
target_files:
  - src/services/storeService.ts
  - src/services/domain/stores/storeService.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-140 — Dos `storeService` coexistiendo sin que quede claro cuál es el canónico

## Problema

El proyecto tiene dos implementaciones independientes para el mismo dominio (almacenes):

- `src/services/storeService.ts` — estilo funciones sueltas (`getStore`, `getStores`,
  `getStoreOptions`, `getTotalStockStats`, etc.), ya migrado a `.ts`. Es el que **realmente
  usa esta superficie** (`warehouse/[storeId]/page.js:10`, y también
  `useStoreData.ts`, `useStores.js`, `useStockStats.ts`, rutas de creación de
  recepciones/salidas).
- `src/services/domain/stores/storeService.js` — estilo objeto de servicio de dominio
  (`storeService.list/getById/create/...`), siguiendo el patrón más nuevo del proyecto
  (`api-client.md` § Estructura de un service de dominio), pero **no está importado por
  ningún archivo de esta superficie** ni parece tener consumidores directos verificados en
  esta pasada.

Ambos apuntan al mismo endpoint (`stores`) y se solapan en responsabilidad (list, getById,
create, update, delete, getOptions). Ya existe un GAP abierto (`GAP-027`) sobre el patrón
token-as-parameter de `storeService.ts`, que confirma que `storeService.ts` es el que está
activo en producción — pero ningún GAP existente decide qué hacer con el segundo archivo
(consolidar, documentar por qué coexisten, o eliminar si es código muerto).

Nota adicional encontrada al trazar los consumidores de `storeService.ts`: también coexisten
`src/hooks/useStoreData.js` (29 jun) y `src/hooks/useStoreData.ts` (5 jul) con el mismo nombre
base — probablemente un resto de una migración no limpiada del todo. Se documenta aquí como
observación relacionada, aunque no es un archivo de esta superficie ni se ha confirmado cuál
de los dos se resuelve en runtime.

## Objetivo

Existe una única fuente de verdad para el service de almacenes, documentada como tal, sin dos
implementaciones paralelas con responsabilidades solapadas.

## Contexto

Depende de una decisión de Jose: ¿se consolida todo en `storeService.ts` (patrón funciones
sueltas, el que está realmente en uso) y se elimina `domain/stores/storeService.js`, o se migra
todo a `domain/stores/storeService.js` (patrón de servicio de dominio, más alineado con
`api-client.md`) y se actualizan todos los consumidores de `storeService.ts`? Esto no debe
decidirse unilateralmente en una auditoría de code-quality — requiere confirmar impacto en
todos los consumidores de ambos archivos antes de tocar nada.

## Solución propuesta

1. Listar todos los consumidores reales de cada uno de los dos archivos (grep completo del
   repo, no solo de `dashboard-home`).
2. Presentar a Jose las dos opciones de consolidación (mantener `storeService.ts` vs. migrar a
   `domain/stores/storeService.js`) con el impacto de cada una.
3. Ejecutar la consolidación elegida en un GAP propio, aislado (no mezclar con otros cambios de
   `dashboard-home`), dado que puede tocar múltiples módulos fuera de esta auditoría.
4. Como parte del mismo trabajo, confirmar y resolver la duplicidad `useStoreData.js` /
   `useStoreData.ts` (cuál se resuelve en runtime, eliminar el que quede huérfano).

## Criterios de aceptación

- [ ] Existe una única implementación de `storeService` en el proyecto.
- [ ] Todos los consumidores apuntan a esa única implementación.
- [ ] `useStoreData.js` o `useStoreData.ts` (el que no sea el canónico) queda eliminado.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
grep -rn "from '@/services/storeService'" src/
grep -rn "from '@/services/domain/stores/storeService'" src/
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-027 (token-as-parameter en `storeService.ts`, aún abierto)

## Pregunta abierta para Jose

¿Cuál de los dos `storeService` debe ser el canónico — el funcional (`storeService.ts`, ya en
uso real) o el de patrón de dominio (`domain/stores/storeService.js`, alineado con la
convención documentada en `api-client.md` pero sin consumidores activos detectados)?
