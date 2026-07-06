---
id: GAP-V2-191
title: Migrar src/components/Field/labels.js a TypeScript (.ts)
module: dashboard-home
category: code-quality
priority: P4
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Field/labels.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-191 — `labels.js` (mapa de estados Field) sigue en JavaScript

## Problema

`src/components/Field/labels.js` (18 líneas) exporta `fieldStatusLabels` (un
`Record<string, string>` implícito) y `getFieldStatusLabel(status)` sin tipos. Es
importado por `FieldDashboard.jsx` (GAP-V2-190) y previsiblemente por otros componentes
Field (`FieldRoutesListPage`, `StopDetailDrawer`, etc.). Viola la Regla de oro 3 de
`CLAUDE.md`.

**Evaluación de complejidad:** LOW — dos exports, sin dependencias externas, tipado
trivial (`Record<string, string>` + `status: string | null | undefined`).

## Objetivo

`labels.ts` con `fieldStatusLabels: Record<string, string>` y
`getFieldStatusLabel(status: string | null | undefined): string` tipados explícitamente.

## Contexto

Archivo pequeño y de bajo riesgo — candidato para agrupar con GAP-V2-190 en el mismo PR
si Jose lo prefiere, ya que ambos son LOW y forman parte del mismo flujo de importación
directa (`FieldDashboard` → `labels`).

## Solución propuesta

1. Ejecutar `npm run type-check 2>&1` como baseline.
2. Renombrar `labels.js` → `labels.ts`, añadiendo los tipos indicados arriba.
3. Buscar todos los importadores (`grep -rn "Field/labels"`) y confirmar que ningún
   import relativo se rompe (el path `@/components/Field/labels` no cambia).
4. `npm run type-check 2>&1` inmediato.

## Criterios de aceptación

- [ ] El archivo es `.ts` sin `any` implícito.
- [ ] Todos los importadores existentes siguen resolviendo sin cambios de import.
- [ ] `npm run type-check` y `npm run lint` limpios.

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
- GAPs relacionados: GAP-V2-190
