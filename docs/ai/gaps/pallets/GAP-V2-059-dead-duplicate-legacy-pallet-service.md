---
id: GAP-V2-059
title: Remove dead duplicate legacy service src/services/domain/pallets/palletService.js
module: pallets
category: code-quality
priority: P3
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/services/domain/pallets/palletService.js
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-059 — Dead duplicate legacy service `palletService.js`

## Problema

`src/services/domain/pallets/palletService.js` (96 líneas) es un service completo
con el mismo nombre de export (`palletService`) y métodos con nombres solapados
(`list`, `getById`, `create`, `update`, `delete`, `deleteMultiple`, `getOptions`)
respecto al service realmente usado por todo el módulo,
`src/services/palletService.ts` (620 líneas, funciones sueltas: `getPallet`,
`createPallet`, `updatePallet`, etc.).

Verificado con grep exhaustivo sobre `src/`: **cero archivos importan
`@/services/domain/pallets/palletService`** — ningún hook, componente ni test lo
referencia. Es código completamente muerto.

Además, al ser `.js` (no `.ts`), coexiste con el TypeScript-first rule de
CLAUDE.md ("nunca crear archivos `.js` nuevos" — este ya existe, pero migrar o
eliminar aplica igual) y crea riesgo real de confusión de import: un futuro
desarrollador escribiendo `import { palletService } from '@/services/domain/pallets/palletService'`
en un editor con autocompletado podría enlazar accidentalmente contra el archivo
equivocado, con métodos de firma distinta (`list(filters, pagination)` como objeto
vs funciones sueltas por nombre).

## Objetivo

El proyecto tiene un único service de palets, sin ambigüedad de import.

## Contexto

Consistente con la nota de la tarea de auditoría: "posible duplicado/legacy —
investiga si está muerto o si genera confusión de import junto al de arriba".
Confirmado: está muerto.

## Solución propuesta

Eliminar `src/services/domain/pallets/palletService.js` en su totalidad. Si en el
futuro se necesita un service de palets con el patrón "objeto con métodos CRUD"
(como el resto de `services/domain/*`) en vez de funciones sueltas, evaluarlo como
tarea aparte de estandarización de `src/services/palletService.ts` — no como
resurrección de este archivo muerto.

## Criterios de aceptación

- [ ] `src/services/domain/pallets/palletService.js` eliminado.
- [ ] `npm run type-check` y `npm run lint` sin nuevos errores tras el borrado.
- [ ] Ningún import roto (ya verificado que no hay importadores).

## Plan de validación

```text
grep -rn "domain/pallets/palletService" src/   # debe devolver 0 resultados tras el borrado
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
- GAPs relacionados: ninguno
