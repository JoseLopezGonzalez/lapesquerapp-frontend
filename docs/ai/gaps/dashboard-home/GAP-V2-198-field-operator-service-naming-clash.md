---
id: GAP-V2-198
title: Naming ambiguo entre src/services/fieldOperatorService.ts y src/services/domain/field-operators/fieldOperatorService.ts
module: dashboard-home
category: code-quality
priority: P4
risk: medium
size: M
status: blocked
dependencies: []
target_files:
  - src/services/fieldOperatorService.ts
  - src/services/domain/field-operators/fieldOperatorService.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-198 — Dos servicios distintos con el mismo nombre de archivo

## Problema

El proyecto tiene dos archivos llamados `fieldOperatorService.ts` con responsabilidades
completamente distintas:

- `src/services/fieldOperatorService.ts` — API de "auto-servicio" para el rol
  `repartidor_autoventa`: rutas propias, pedidos propios, autoventa, opciones de
  clientes/productos/impuestos operativos (`getFieldOrders`, `getFieldRoutes`,
  `createFieldAutoventa`, etc.). Consumido por `useFieldOrders.ts`,
  `useFieldRoutes.ts`, `useFieldOptions.ts`, `FieldAutoventaWizard.jsx`.
- `src/services/domain/field-operators/fieldOperatorService.ts` — CRUD administrativo
  de la entidad `field-operators` (dar de alta/baja repartidores desde `/admin`),
  exportado como `fieldOperatorAdminService`. Consumido por `useFieldOperators.ts`,
  `useOrderFormOptions.ts`, `CustomerEditDialog.jsx`, y registrado en
  `entityServiceMapper.ts`.

Aunque los exports tienen nombres distintos (`fieldOperatorAdminService` vs. funciones
sueltas), el nombre de archivo idéntico en dos ubicaciones (`src/services/` vs.
`src/services/domain/field-operators/`) es una fuente real de confusión al buscar por
nombre de archivo o al añadir un import con autocompletado — un desarrollador puede
importar del archivo equivocado sin darse cuenta, especialmente porque ambos son
plausibles para "algo relacionado con field operators".

## Objetivo

Cada archivo tiene un nombre que refleja su responsabilidad real sin ambigüedad, por
ejemplo:
- `src/services/fieldOperatorService.ts` → `src/services/fieldSelfServiceApi.ts` (o
  `src/services/domain/field/fieldSelfServiceApi.ts` si se prefiere alinear con el
  patrón `services/domain/<entidad>/`).
- `src/services/domain/field-operators/fieldOperatorService.ts` se mantiene (ya sigue
  el patrón `services/domain/<entidad>/<entidad>Service.ts` correctamente).

## Contexto

Riesgo medio por el número de importadores del primer archivo (8 hooks/componentes,
ver GAP-V2-196). No es urgente — es una mejora de claridad, no un bug. Se recomienda
resolver junto con GAP-V2-196 (que ya toca `fieldOperatorService.ts` en profundidad) para
minimizar el número de PRs que tocan ese archivo.

## Solución propuesta

1. Confirmar con Jose el nombre final antes de renombrar (afecta a 8 archivos
   importadores).
2. Renombrar `src/services/fieldOperatorService.ts` al nombre acordado.
3. Actualizar los 8 imports (`grep -rn "from '@/services/fieldOperatorService'"`).
4. `npm run type-check` para confirmar que no queda ningún import roto.

## Criterios de aceptación

- [ ] Los dos archivos tienen nombres distintos y auto-explicativos.
- [ ] Ningún import roto (`npm run type-check` limpio).
- [ ] `npm run lint` limpio.

## Plan de validación

```text
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

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-196
