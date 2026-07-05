---
id: GAP-V2-066
title: Pallet editor validates numeric/business-rule inputs ad-hoc (parseFloat/isNaN scattered) instead of shared Zod schemas
module: pallets
category: code-quality
priority: P3
risk: low
size: M
status: ready
dependencies: []
target_files:
  - src/hooks/pallets/usePalletSave.ts
  - src/hooks/pallets/usePalletBoxCreation.ts
  - src/hooks/pallets/usePalletBoxOperations.ts
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-066 — Validación numérica del editor de palet sin esquema estructurado (Zod)

## Problema

El editor de creación/edición de palet no usa React Hook Form + Zod en ningún
punto (confirmado: `grep -rl "react-hook-form\|zod\|useForm(" ` sobre
`components/Admin/Pallets/` y `hooks/pallets/` no devuelve resultados), pese a
que CLAUDE.md § FORMS exige "todos los formularios usan React Hook Form + Zod".

Esto es en parte justificable: el editor no es un formulario clásico de
entidad única con un botón "Guardar" que valida y envía — es una UI de
"staging" incremental (altas de caja por 5 métodos distintos, edición
individual/masiva de cajas, tara del palet) donde RHF no encaja de forma
natural. Pero la ausencia de un esquema de validación estructurado sí tiene un
coste real, visible en la duplicación de reglas de validación numérica
ad-hoc y ligeramente inconsistentes entre sí, repetidas en al menos 3 hooks:

- `usePalletSave.ts:23-27,56-67` — `normalizePalletTareWeight` +
  comprobación manual `Number.isNaN(...) || palletTareWeightKg < 0` con
  `notify.error` inline.
- `usePalletBoxCreation.ts:74-81` (alta manual: requiere producto+lote+peso, sin
  validar que el peso sea positivo antes de `roundToTwoDecimals`),
  `102-108` (alta por promedio), `138-144` (alta masiva por líneas de texto con
  regex `/^\d*\.?\d+$/` propia).
- `usePalletBoxOperations.ts:271-278` (`changeNetWeight`: `parseFloat` +
  `isNaN(...) || parsedWeight <= 0`), `320-334` (`addOrSubtractWeight`: validación
  de signo distinta a la anterior).

Cada punto reimplementa su propio `parseFloat`/`isNaN`/rango válido en vez de
compartir un validador único (p.ej. "peso neto de caja: número positivo, hasta 2
decimales"). Esto es exactamente el tipo de deriva que un esquema Zod
reutilizable (sin necesidad de adoptar RHF completo) evitaría.

## Objetivo

Existen validadores Zod compartidos para los valores numéricos de dominio
repetidos en el editor (peso neto de caja, tara de palet, coste manual por kg),
usados de forma consistente desde los tres hooks en vez de checks manuales
duplicados.

## Contexto

No se propone migrar el editor completo a React Hook Form — el propio dominio
(alta incremental de cajas por 5 métodos, edición masiva) no mapea bien al
modelo de formulario controlado único de RHF. Se propone específicamente
introducir esquemas Zod como capa de validación reutilizable, que es
independiente de si el formulario usa RHF o no.

## Solución propuesta

- Crear `src/schemas/palletBoxSchema.ts` (o similar) con esquemas Zod:
  `netWeightSchema` (número positivo, redondeo a 2 decimales),
  `palletTareWeightSchema` (número ≥ 0 o null), `manualCostPerKgSchema` (número
  positivo o null).
- Sustituir las validaciones manuales en `usePalletSave.ts`,
  `usePalletBoxCreation.ts` y `usePalletBoxOperations.ts` por `schema.safeParse(...)`,
  manteniendo el mismo mensaje de `notify.error` para no cambiar la UX.

## Criterios de aceptación

- [ ] Existe un módulo de esquemas Zod para los valores numéricos repetidos del
      editor de palet.
- [ ] Los 3 hooks afectados usan el esquema compartido en vez de validación
      manual duplicada.
- [ ] Mensajes de error al usuario sin cambios perceptibles (misma UX).

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: probar los 5 métodos de alta de caja con valores inválidos (negativo,
# cero, texto no numérico) y confirmar que el mensaje de error sigue apareciendo.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** marcado `ready`. Relacionado con
GAP-V2-080 (bug concreto: alta manual/promedio permite peso ≤0) — comparten
`usePalletBoxCreation.ts`, pero son problemas de tipo distinto (este es una
refactorización DRY de validación; GAP-V2-080 es un bug de validación ausente con
prioridad más alta). No se establece dependencia formal entre ambos: GAP-V2-080
puede y debe corregirse primero sin esperar a este refactor, dado que tiene P1
frente al P3 de este GAP. Implementar este GAP después beneficiará
automáticamente a GAP-V2-080 si aún no se ha corregido, pero no es obligatorio en
ese orden.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: ninguno
