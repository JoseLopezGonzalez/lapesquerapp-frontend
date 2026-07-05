---
id: GAP-V2-084
title: Bloques de acciones comentadas y muertas en la config de listado de palets
module: pallets
category: code-quality
priority: P4
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/configs/entities/entitiesConfig.stock.ts
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-084 — Bloques de acciones comentadas en la config de palets

## Problema

`src/configs/entities/entitiesConfig.stock.ts:639-654`, dentro del bloque `pallets.actions`,
contiene dos bloques completos de acción comentados (código, no explicación):

```ts
/* {
  title: 'Cambiar estado a Enviado',
  endpoint: '/orders/mark-as-sent',
  ...
}, */
/* {
  title: 'Cambiar estado a Almacenado',
  endpoint: '/orders/mark-as-sent',
  ...
}, */
```

Viola GENERAL del checklist de calidad ("No commented-out code blocks"). Además, el
endpoint referenciado en ambos bloques comentados (`/orders/mark-as-sent`) no
coincide con el dominio de esta config (`pallets`, no `orders`), lo que sugiere que
fueron copiados de otra config como plantilla y nunca limpiados ni adaptados —
señal de duplicación de config entre entidades sin revisión final.

## Objetivo

La config de acciones de `pallets` solo contiene las 4 acciones reales (cambiar
estado a Registrado/Almacenado/Enviado/Procesado), sin bloques comentados.

## Contexto

Encontrado durante la auditoría de la Superficie A (listado de palets) de la
segunda pasada del módulo `pallets`. Bajo riesgo — cosmético, pero acumula ruido en
un archivo ya extenso.

## Solución propuesta

Eliminar las líneas 639-654 (los dos bloques comentados). Si en algún momento se
necesita una acción real de cambio de estado a "Enviado"/"Almacenado" con
confirmación adicional, ya existen las 4 acciones reales inmediatamente después que
cubren ese caso — no hace falta resucitar este código.

## Criterios de aceptación

- [ ] Los dos bloques comentados en `pallets.actions` eliminados.
- [ ] Las 4 acciones reales (Registrado/Almacenado/Enviado/Procesado) sin cambios.
- [ ] `npm run lint` sin nuevos errores.

## Plan de validación

```text
npm run lint
# Manual: abrir /admin/pallets, seleccionar filas, verificar que las 4 acciones de
# cambio de estado siguen apareciendo en el menú de acciones masivas.
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
