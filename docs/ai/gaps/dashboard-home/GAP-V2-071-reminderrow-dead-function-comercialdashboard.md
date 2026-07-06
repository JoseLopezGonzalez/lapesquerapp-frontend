---
id: GAP-V2-071
title: Función ReminderRow definida pero nunca renderizada en ComercialDashboard/index.js
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: XS
status: rejected
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-071 — `ReminderRow` (líneas 113-195) no se usa en ningún render

## Problema

`src/components/Admin/Dashboard/ComercialDashboard/index.js:113-195` define la
función `ReminderRow({ item, onReschedule, onCancel, onComplete })`, una card
completa con `DropdownMenu` de acciones para un ítem de agenda. El bloque
`crm-agenda` del `useMemo` de `masonryItems` (líneas 369-464) no la usa: en su
lugar construye las filas de la tabla directamente inline con `<TableRow>` /
`<TableCell>` duplicando buena parte del mismo markup y las mismas props
(`onReschedule`/`onComplete`/`onCancel` ya existen como handlers en el
componente padre — `handleReschedule` no existe con ese nombre pero
`setRescheduleDialog`, `handleComplete`, `setCancelDialog` sí se usan
directamente en el `DropdownMenuItem` inline).

`grep -n "ReminderRow" ComercialDashboard/index.js` solo devuelve la
declaración — cero usos.

## Objetivo

El archivo no contiene código muerto: o `ReminderRow` se elimina, o se usa
realmente en el render de `crm-agenda` (reemplazando el bloque de
`<TableRow>` inline duplicado por `<ReminderRow item={item} .../>`), reduciendo
la duplicación de markup dentro del propio archivo.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`, carril
Comercial. Bajo riesgo — es puramente código muerto local al archivo, sin
impacto funcional al eliminarlo (no exportado, no importado por nadie más).

## Solución propuesta

Opción recomendada: eliminar `ReminderRow` (líneas 113-195) ya que el bloque
inline de `crm-agenda` ya funciona y tiene ligeras diferencias de layout
(`Card` standalone vs `TableRow` dentro de `Table`) — reescribirlo para
reutilizar `ReminderRow` cambiaría el layout visual actual sin necesidad.

## Criterios de aceptación

- [ ] `grep -n "ReminderRow" ComercialDashboard/index.js` devuelve 0
      resultados (si se elimina) o al menos un uso real en JSX (si se
      reutiliza).
- [ ] El render de la card "Agenda del día" no cambia visualmente respecto al
      estado actual (si se opta por eliminar).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
grep -n "ReminderRow" src/components/Admin/Dashboard/ComercialDashboard/index.js
npm run type-check
npm run lint
# Manual: /comercial — confirmar que la card "Agenda del día" sigue mostrando
# recordatorios y sus acciones (reprogramar/cerrar/cancelar) sin cambios.
```

## Notas de implementación

**Fusionado (gap-normalizer, 2026-07-06):** mismo hallazgo que GAP-V2-054 ("`ReminderRow` es
código muerto y su acción 'Abrir cliente/prospecto' no existe en el widget de agenda realmente
renderizado", carril ui-audit-agent), que además cubre la regresión de navegación asociada.
Fusionado en GAP-V2-054. Este archivo queda `rejected` — no se implementa por separado.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-070, GAP-V2-073
