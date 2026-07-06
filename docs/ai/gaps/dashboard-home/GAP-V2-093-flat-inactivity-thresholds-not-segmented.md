---
id: GAP-V2-093
title: "Clientes inactivos" (30 días) y "Prospectos sin actividad" (7 días) usan un umbral fijo, sin distinguir ciclo de venta nacional vs. exportación
module: dashboard-home
category: domain-business
priority: P3
risk: low
size: M
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/types/crm.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-093 — "Clientes inactivos" (30 días) y "Prospectos sin actividad" (7 días) usan un umbral fijo, sin distinguir ciclo de venta nacional vs. exportación

## Problema

`ComercialDashboard/index.js:472` etiqueta el widget de clientes con el criterio
fijo "Clientes sin pedido en más de 30 días", y `index.js:548` etiqueta el de
prospectos con "Prospectos sin interacción en más de 7 días". Ambos umbrales
llegan ya calculados desde el backend (`InactiveCustomerItem.daysSinceLastOrder`,
`ProspectWithoutActivityItem.daysWithoutActivity` en `src/types/crm.ts:231-245`) y
el frontend se limita a mostrarlos — no hay ningún campo en `Customer`, `Prospect`
ni en los tipos de CRM que indique un segmento de cliente, canal (nacional vs.
exportación) o cadencia histórica de pedido esperada
(`grep -n "orderFrequency\|segment\|customerType" src/types/catalog.ts
src/types/crm.ts` no devuelve resultados).

**Por qué es relevante para el sector:** los tipos de CRM (`Country`, `Incoterm`,
`paymentTerm`, `speciesInterest`) confirman que esta empresa opera tanto con
clientes nacionales (pedidos frecuentes, a menudo semanales dado que es producto
perecedero/congelado con rotación rápida) como con clientes de exportación
(contenedores completos, ciclos de 60-90 días o más entre pedidos habituales). Un
umbral único de 30 días para "inactivo":

- Puede marcar sistemáticamente como "inactivo" a un cliente de exportación
  perfectamente sano cuyo ciclo normal es trimestral — generando fatiga de alerta
  y que el comercial termine ignorando el widget.
- Puede llegar tarde para un cliente nacional de alta frecuencia (pedidos
  semanales) que lleva 3 semanas sin pedir: ya es una señal de alarma antes de
  llegar a los 30 días, pero el sistema no lo marcará hasta entonces.

## Objetivo

Determinar si el umbral de inactividad debe ajustarse por segmento/cadencia
histórica del cliente, o si 30/7 días es una regla de negocio deliberada y
uniforme ya validada por Jose para todos los segmentos.

## Contexto

Descubierto en la auditoría domain-business de `dashboard-home`, carril Comercial.
**Este GAP depende enteramente de una decisión de negocio que ningún documento del
repositorio captura** (ni `project-learnings.md`, ni comentarios de tipo, ni
`CLAUDE.md` § Módulos del dominio) — no se debe implementar ningún cambio sin que
Jose confirme si existe ya una distinción de segmento a nivel de negocio (aunque
no esté modelada en el frontend) o si el umbral fijo es intencional.

## Solución propuesta

Sujeta a confirmación de Jose. Posibles direcciones si se confirma que el umbral
debe variar:

1. Añadir un campo de segmento/canal a `Customer` (p.ej. `channel:
   'nacional' | 'exportacion'`) y que el backend calcule el umbral de inactividad
   por segmento en vez de un valor fijo.
2. Alternativa más simple: calcular el umbral como un múltiplo de la cadencia
   histórica media de pedidos de ESE cliente concreto en vez de un número fijo
   igual para todos.

## Criterios de aceptación

- [ ] Confirmación de Jose: ¿el umbral de 30/7 días es una regla deliberada y
      válida para todos los segmentos, o necesita segmentación?
- [ ] Si se confirma que necesita cambio: el criterio de "inactivo"/"sin
      actividad" refleja la cadencia esperada real del cliente/prospecto.

## Plan de validación

```text
# No aplica hasta confirmación de Jose sobre la regla de negocio real.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-094 (mismo bloque de widgets, distinto aspecto)
- **Pendiente de confirmación de Jose**: ver sección Contexto — GAP bloqueado
  hasta respuesta.
