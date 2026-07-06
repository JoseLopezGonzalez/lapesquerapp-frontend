---
id: GAP-V2-091
title: "Ranking Pedidos" y "Empresas de transporte" son widgets de Dirección reutilizados sin adaptación en el dashboard de Comercial
module: dashboard-home
category: domain-business
priority: P2
risk: medium
size: M
status: blocked
dependencies:
  - GAP-V2-090
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/components/Admin/Dashboard/OrderRanking/index.js
  - src/components/Admin/Dashboard/TransportRadarChart/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-091 — "Ranking Pedidos" y "Empresas de transporte" son widgets de Dirección reutilizados sin adaptación en el dashboard de Comercial

## Problema

`ComercialDashboard/index.js:314-326` monta, sin ninguna variación, dos widgets que
también existen en el dashboard de Admin/Dirección:

```jsx
{ key: 'order-ranking', node: <div><OrderRankingChart /></div> },
{ key: 'transport-radar', node: <div><TransportRadarChart /></div> },
```

- **`OrderRankingChart`** (`src/components/Admin/Dashboard/OrderRanking/index.js`)
  agrupa pedidos por cliente/país/producto (`groupBy: 'client' | 'country' |
  'product'`) usando `useOrderRankingStats`, que llama a
  `statistics/orders/ranking` sin ningún filtro de comercial (ver GAP-V2-090). Un
  comercial que abre este widget ve un ranking de "top clientes" que mezcla las
  cuentas de todos sus compañeros con las suyas, bajo un título genérico ("Ranking
  Pedidos") que no aclara ese alcance — fácilmente interpretable como "mis mejores
  clientes".
- **`TransportRadarChart`** ("Empresas de transporte" — cantidades transportadas
  por transportista, vía `useTransportChartData`) es una métrica logística de nivel
  empresa (qué transportista mueve más kg en todo el tenant). No hay ninguna
  decisión ni acción que un comercial individual pueda tomar a partir de este dato:
  no gestiona transportistas ni su asignación agregada. Es una métrica operativa/de
  dirección, no comercial.

**Por qué es un problema de negocio:** en una pesquera/congelados real, un
comercial revisa su dashboard para saber qué cuentas propias necesitan atención,
no para ver el ranking de transportistas de toda la empresa ni un ranking de
clientes que incluye carteras ajenas. Colocar widgets de alcance "toda la empresa"
en un dashboard que por lo demás (agenda, clientes inactivos, prospectos sin
actividad) SÍ está pensado a nivel individual, genera dos problemas: (1) ruido que
no ayuda a la operativa diaria de un comercial, y (2) el mismo riesgo de
mala atribución que GAP-V2-090 pero aplicado a un ranking en vez de a un importe.

## Objetivo

El dashboard de Comercial solo incluye widgets cuyo alcance de datos es coherente
con lo que un comercial individual gestiona: su propia cartera de clientes/
prospectos. `OrderRankingChart` se filtra por comercial cuando se usa aquí (o se
sustituye por una vista "mis clientes" con el mismo componente parametrizado), y
`TransportRadarChart` se retira del dashboard de Comercial salvo que Jose confirme
un caso de uso real para el rol.

## Contexto

Descubierto en la auditoría domain-business de `dashboard-home`, carril Comercial.
Depende de GAP-V2-090 para el filtro de comercial en `useOrderRankingStats`.

## Solución propuesta

1. Confirmar con Jose si `TransportRadarChart` tiene algún propósito real para el
   rol comercial (p.ej. saber qué transportista entrega a sus clientes) — si no,
   retirarlo del `ComercialDashboard`.
2. Para `OrderRankingChart`: una vez resuelto GAP-V2-090, pasar el
   `salespersonId` del usuario logueado cuando el componente se monta dentro de
   `ComercialDashboard` (puede requerir una prop opcional en `OrderRankingChart`
   que Admin no pasa y Comercial sí).

## Criterios de aceptación

- [ ] Confirmación de Jose sobre `TransportRadarChart` en el dashboard de
      Comercial (retirar o justificar).
- [ ] `OrderRankingChart` dentro de `ComercialDashboard` muestra solo datos de la
      cartera del comercial logueado (tras resolver GAP-V2-090), o el widget se
      sustituye por uno explícitamente scoped.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: confirmar con Jose el caso de uso de "Empresas de transporte" para
# comercial antes de decidir retirarlo.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-090
- **Pendiente de confirmación de Jose**: utilidad real de "Empresas de
  transporte" para el rol comercial.
