---
id: GAP-V2-094
title: "Clientes inactivos" y "Prospectos sin actividad" mezclan cuentas sin ningún pedido/contacto previo con cuentas que dejaron de comprar
module: dashboard-home
category: domain-business
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/types/crm.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-094 — "Clientes inactivos" y "Prospectos sin actividad" mezclan cuentas sin ningún pedido/contacto previo con cuentas que dejaron de comprar

## Problema

El widget "Clientes inactivos" (`ComercialDashboard/index.js:466-539`) usa el
campo `InactiveCustomerItem.lastOrderAt` (`src/types/crm.ts:231-237`), que puede
ser `null`. El propio código ya distingue este caso al ordenar y pintar el badge:

```js
// index.js:362-367 — never-ordered van primero
const sortedInactiveCustomers = [...(crmData?.inactive_customers ?? [])].sort((a, b) => {
  const aNeverOrdered = a.lastOrderAt == null;
  ...
});
```

```jsx
// index.js:517-523 — badge distinto para "Nunca pidió" vs "Con historial"
{customer.lastOrderAt == null ? 'Nunca pidió' : 'Con historial'}
```

Pero el título y la descripción del widget no reflejan esta distinción: **"Clientes
inactivos"** / **"Clientes sin pedido en más de 30 días"** (línea 471-472) da a
entender que todos los listados son clientes que compraron antes y dejaron de
hacerlo (churn). Un cliente con `lastOrderAt == null` no encaja en esa descripción
en absoluto: es una ficha de cliente (posiblemente convertida desde un prospecto)
que **nunca llegó a generar un primer pedido**. Lo mismo ocurre en "Prospectos sin
actividad" (`prospects_without_activity`, `lastContactAt == null` vs. con
historial, líneas 570-606) con la etiqueta fija "Prospectos sin interacción en más
de 7 días".

**Por qué es un problema de negocio, no solo de copy:** la acción comercial
correcta es distinta en cada caso. Un cliente que nunca pidió necesita una llamada
de onboarding/activación (entender por qué no arrancó la relación, ofrecer
condiciones de primer pedido). Un cliente que compraba y dejó de hacerlo necesita
una llamada de recuperación (entender qué pasó, si cambió de proveedor, si hay una
incidencia sin resolver). Tratar ambos bajo el mismo título "Clientes inactivos"
con el mismo criterio temporal ("30 días") oculta la urgencia real: un cliente que
nunca pidió podría llevar registrado 200 días sin que nadie lo note como caso
distinto de un cliente que compraba cada semana y dejó de hacerlo hace 31 días.

## Objetivo

Los widgets distinguen explícitamente, en su título/sección (no solo en el badge
de fila), entre cuentas que nunca generaron primer pedido/contacto y cuentas que
tuvieron actividad y la perdieron — de forma que el comercial entienda de un
vistazo qué tipo de seguimiento corresponde a cada grupo.

## Contexto

Descubierto en la auditoría domain-business de `dashboard-home`, carril Comercial.
Relacionado con GAP-V2-093 (mismo bloque de widgets, aspecto de umbral en vez de
categorización).

## Solución propuesta

1. Dividir cada widget en dos secciones (o dos widgets) claramente tituladas:
   "Sin primer pedido" / "Dejaron de pedir (30+ días)" para clientes, y "Sin
   primer contacto" / "Sin seguimiento (7+ días)" para prospectos — reutilizando
   los mismos datos ya disponibles (`lastOrderAt`/`lastContactAt` null vs. no
   null), sin requerir cambios de API.
2. Alternativa más ligera si no se quiere duplicar la estructura de card: mantener
   una sola tabla pero agrupar visualmente ambos bloques con un subtítulo de
   sección en vez de solo un badge por fila.

## Criterios de aceptación

- [ ] El comercial puede distinguir, sin abrir cada fila, cuántas cuentas nunca
      generaron actividad vs. cuántas dejaron de tener actividad reciente.
- [ ] El título/descripción del widget ya no describe como "inactivo desde hace
      X días" a una cuenta que nunca tuvo actividad.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: revisar /comercial con datos de prueba que incluyan al menos un
# cliente con lastOrderAt null y uno con lastOrderAt antiguo, y confirmar que
# la UI comunica la diferencia de forma clara.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-093
