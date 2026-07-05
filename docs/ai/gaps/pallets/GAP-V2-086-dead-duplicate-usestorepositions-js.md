---
id: GAP-V2-086
title: Eliminar duplicado muerto pre-migración src/hooks/useStorePositions.js
module: pallets
category: code-quality
priority: P3
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/hooks/useStorePositions.js
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-086 — Duplicado muerto `useStorePositions.js` (pre-migración de `useStorePositions.ts`)

## Problema

Existen dos archivos con el mismo nombre de hook en `src/hooks/`:

- `src/hooks/useStorePositions.ts` (253 líneas) — versión tipada, activa.
- `src/hooks/useStorePositions.js` (228 líneas) — versión sin tipos.

Verificado con grep exhaustivo: el único punto de import en todo `src/` es
`src/hooks/useStore.ts:7` (`import { useStorePositions } from '@/hooks/useStorePositions'`),
sin extensión explícita. La resolución de módulos de Next.js/TypeScript para un
import sin extensión con ambos `.ts` y `.js` presentes en el mismo directorio
resuelve al `.ts` (orden de resolución `tsx > ts > js > jsx`), por lo que el `.js`
nunca se ejecuta.

Comparación de contenido: el `.js` es la versión JSDoc/pre-migración exacta del
`.ts` — mismos nombres de función, misma lógica, sin las interfaces (`Filters`,
`UseStorePositionsParams`) ni las anotaciones de tipo que sí tiene el `.ts`. Es un
remanente dejado tras la migración a TypeScript, nunca eliminado.

Riesgo de confusión de import: como con `GAP-V2-059` (aunque en ese caso la
hipótesis de "muerto" resultó incorrecta — ver `GAP-V2-083` — aquí sí se confirma
que es un duplicado real y sin importadores), un editor con autocompletado podría
enlazar accidentalmente al `.js` en un import futuro con extensión explícita
(`'@/hooks/useStorePositions.js'`), ejecutando la versión sin tipos y sin las
correcciones que solo existen en el `.ts`.

## Objetivo

Un único archivo `useStorePositions` en `src/hooks/`, sin ambigüedad de import ni
riesgo de ejecutar la versión sin tipos.

## Contexto

Parte de la Superficie B (movimientos de almacén) de esta segunda pasada. Solicitado
explícitamente confirmar con grep exhaustivo antes de proponer el borrado — hecho:
cero importadores del `.js`, single importer real del `.ts` en `useStore.ts:7`.

## Solución propuesta

Eliminar `src/hooks/useStorePositions.js` en su totalidad. No requiere cambios en
`useStore.ts` ni en ningún otro consumidor, ya que la resolución de módulos ya
apunta al `.ts`.

## Criterios de aceptación

- [ ] `src/hooks/useStorePositions.js` eliminado.
- [ ] `src/hooks/useStore.ts` sigue funcionando sin cambios (usa `useStorePositions.ts`).
- [ ] `npm run type-check` y `npm run lint` sin nuevos errores.

## Plan de validación

```text
grep -rn "useStorePositions" src/  # confirmar un solo archivo .ts tras el borrado
npm run type-check
npm run lint
npm run build
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-083 (caso análogo pero con conclusión opuesta — allí el
  duplicado SÍ estaba en uso)
