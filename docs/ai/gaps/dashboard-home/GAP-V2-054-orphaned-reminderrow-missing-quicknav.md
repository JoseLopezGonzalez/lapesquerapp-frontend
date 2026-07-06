---
id: GAP-V2-054
title: "`ReminderRow` es código muerto y su acción \"Abrir cliente/prospecto\" no existe en el widget de agenda realmente renderizado"
module: dashboard-home
category: ux-ui
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-054 — `ReminderRow` sin uso + regresión de navegación rápida en el widget real

## Problema

`ComercialDashboard/index.js:113-195` define un componente `ReminderRow` completo
(card con badges "Vencida"/"Pendiente", menú de acciones con "Reprogramar", "Marcar
hecha", "Cancelar" y un enlace "Abrir cliente/prospecto") pero **nunca se usa** — un
grep en el propio archivo confirma que `<ReminderRow` no aparece en ningún JSX
renderizado; solo existe la declaración de la función.

El widget "Agenda del día" que sí se renderiza (líneas 369-464) reimplementa la misma
información con una `Table` en vez de reusar `ReminderRow`, pero su menú de acciones
(líneas 436-450) solo tiene "Reprogramar", "Cerrar" y "Cancelar" — **sin el enlace
"Abrir cliente/prospecto"** que sí tenía `ReminderRow`. El nombre del ítem
(`item.label`) sí es un `Link` clicable, pero solo el texto del nombre — no hay una
acción explícita en el menú "..." para abrir el registro, y el usuario debe saber que
el texto del título es clicable (sin ningún affordance visual: no hay subrayado ni
color de enlace hasta hover).

Esto sugiere que `ReminderRow` fue una versión mejorada del widget que quedó a medias
de integrarse, o que fue reemplazada por la versión tabular y nunca se limpió.

## Objetivo

Eliminar la duplicación: o se usa `ReminderRow` como el renderer real de cada fila de
"Agenda del día" (recuperando el enlace explícito "Abrir cliente/prospecto" en el menú
de acciones), o se elimina `ReminderRow` por completo si se decide mantener la vista de
tabla, añadiendo el enlace de navegación que falta directamente en el `DropdownMenu`
de la tabla.

## Contexto

Bajo impacto funcional inmediato (el nombre del ítem ya navega al hacer click), pero es
deuda de código real: 82 líneas de componente completo, con su propia lógica de
`overdue`/`targetHref`/`targetLabel`, sin ningún consumidor.

## Solución propuesta

Opción recomendada (menor cambio, restaura la paridad de acciones): mantener la vista
de tabla y añadir un `DropdownMenuItem asChild` con `Link` a `targetHref` y label
"Abrir {cliente/prospecto}" en el menú de acciones de la fila de la tabla (líneas
436-450), igual que ya hace `ReminderRow` en sus líneas 168-173. Después, eliminar
`ReminderRow` (código muerto) del archivo.

Opción alternativa: sustituir el `Table` completo por `ReminderRow` (cambia el layout
visual del widget de tabla a lista de cards) — solo si Jose prefiere ese layout.

## Criterios de aceptación

- [ ] El menú de acciones de cada fila de "Agenda del día" incluye una opción
      explícita para abrir el cliente/prospecto asociado.
- [ ] `ReminderRow` deja de existir en el archivo si no se usa, o pasa a ser el
      renderer real usado por el widget.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en /comercial, abrir el menú "..." de una fila de "Agenda del día" y
# confirmar que existe una opción para navegar al cliente/prospecto.
```

## Notas de implementación

**Fusión (gap-normalizer, 2026-07-06):** este GAP absorbe GAP-V2-071 ("Función ReminderRow
definida pero nunca renderizada en ComercialDashboard/index.js", carril code-audit-agent) — es
exactamente el mismo hallazgo de código muerto sobre el mismo bloque
(`ReminderRow`/`crm-agenda`), con el añadido de que este GAP también corrige la regresión de
navegación (falta el enlace "Abrir cliente/prospecto" en el menú de acciones real). GAP-V2-071
queda `rejected` y redirige aquí.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-071 (fusionado aquí)
