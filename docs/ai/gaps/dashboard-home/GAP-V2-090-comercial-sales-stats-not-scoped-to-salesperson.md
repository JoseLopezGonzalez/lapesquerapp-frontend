---
id: GAP-V2-090
title: Los widgets de ventas del dashboard Comercial muestran el total de la empresa, no la cartera del comercial logueado
module: dashboard-home
category: domain-business
priority: P1
risk: high
size: L
status: blocked
dependencies: []
target_files:
  - src/components/Comercial/CRM/CommercialSalesSummaryCard.jsx
  - src/hooks/useOrdersStats.ts
  - src/services/orderService.ts
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/types/auth.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-090 — Los widgets de ventas del dashboard Comercial muestran el total de la empresa, no la cartera del comercial logueado

## Problema

`CommercialSalesSummaryCard` (`src/components/Comercial/CRM/CommercialSalesSummaryCard.jsx:9,25`)
está literalmente etiquetada **"Tus ventas este año"** (línea 25) y llama a
`useOrdersTotalAmountStats()` sin ningún parámetro de comercial:

```jsx
const { data, isLoading } = useOrdersTotalAmountStats();
...
<CardDescription>Tus ventas este año</CardDescription>
```

Ese hook (`src/hooks/useOrdersStats.ts:58-74`) construye su queryFn únicamente con
`dateFrom`/`dateTo`/`includeAuxiliary` y llama a
`getOrdersTotalAmountStats` (`src/services/orderService.ts:554-573`), que a su vez
construye la query solo con `dateFrom`/`dateTo`/`includeAuxiliary` — **nunca** un
`salespersonId`. Es exactamente el mismo hook, con los mismos parámetros, que usan
`TotalAmountSoldCard` y `TotalQuantitySoldCard`
(`src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx:33`,
`src/components/Admin/Dashboard/TotalQuantitySoldCard/index.js:11`) en el dashboard de
Admin/Dirección (`src/components/Admin/Dashboard/index.tsx:76-79`) — y esos mismos dos
componentes se vuelven a montar, sin cambio alguno, en el dashboard de Comercial
(`ComercialDashboard/index.js:637-643`) junto a `CommercialSalesSummaryCard`.

El campo necesario para escopar por comercial ya existe en el propio frontend:
`AuthUser.salespersonId` (`src/types/auth.ts:19`) — pero ningún hook de
`useOrdersStats.ts` lo lee ni lo envía como filtro. Lo mismo ocurre con
`useOrderRankingStats`/`getOrderRankingStats` (`src/services/orderService.ts:493-511`,
usado por `OrderRankingChart`) y con `useTransportChartData` (usado por
`TransportRadarChart`): ninguno acepta ni envía un identificador de comercial.

**Por qué es un problema de negocio, no solo de código:** un comercial de una
pesquera/congelados gestiona una cartera de clientes propia (nacional o de
exportación). "Mis ventas este año" es el dato que usa para autoevaluar su
desempeño frente a objetivo, para preparar una llamada de seguimiento, o para
justificar comisión. Mostrarle el importe total de TODA la empresa (incluidas las
cuentas de sus compañeros) bajo la etiqueta "Tus ventas" no es un matiz de copy:
es un dato falso que un comercial puede tomar como su cifra personal real. Ningún
comercial revisará el importe con desconfianza porque el propio texto de la card
afirma que es su cifra individual.

## Objetivo

`CommercialSalesSummaryCard`, y cualquier otro widget de ventas/ranking mostrado en
el dashboard de Comercial, refleja exclusivamente los pedidos atribuidos al
comercial autenticado (o dirección explícita de que ese widget SÍ es
intencionalmente agregado a nivel empresa, con el copy corregido para no decir
"Tus ventas").

## Contexto

Descubierto en la auditoría domain-business de `dashboard-home`, carril Comercial.
Depende de que el backend soporte filtrar `statistics/orders/total-amount`,
`statistics/orders/total-net-weight` y `statistics/orders/ranking` por
`salesperson_id` (o equivalente) — **requiere confirmación/soporte de backend**, no
es solo un cambio de frontend. Relacionado con GAP-V2-091 (mismos widgets
compartidos con Admin, sin dimensión de comercial).

## Solución propuesta

1. Confirmar con Jose/backend si los endpoints de `statistics/orders/*` ya aceptan
   un parámetro de comercial (p.ej. `salespersonId`) aunque el frontend no lo use
   hoy, o si requiere un cambio de API.
2. Si el endpoint lo soporta: en `useOrdersStats.ts`, añadir un parámetro opcional
   `salespersonId` a `useOrdersTotalAmountStats`/`useOrdersTotalNetWeightStats`/
   `useOrderRankingStats`, y que `CommercialSalesSummaryCard` (y los usos de
   `TotalAmountSoldCard`/`TotalQuantitySoldCard`/`OrderRankingChart` dentro de
   `ComercialDashboard`) lo pasen desde `session.user.salespersonId`.
3. Si el endpoint NO lo soporta todavía, documentar el gap de API como bloqueante y
   plantear el cambio de backend como prerequisito.
4. Mientras no esté resuelto, como mitigación mínima de honestidad de producto:
   cambiar el copy de `CommercialSalesSummaryCard` de "Tus ventas este año" a algo
   que no atribuya el dato a la cartera personal (p.ej. "Ventas totales de la
   empresa este año"), para no inducir a error mientras se implementa el filtro
   real.

## Criterios de aceptación

- [ ] Confirmación de Jose sobre si el backend soporta filtrar estadísticas de
      pedidos por comercial.
- [ ] `CommercialSalesSummaryCard` muestra el dato correcto para la cartera del
      comercial logueado (o su copy dejó de afirmar que es personal si el fix de
      backend no está disponible aún).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: loguear como dos comerciales distintos con carteras de clientes
# distintas y confirmar que "Tus ventas este año" difiere entre ambos y coincide
# con la suma real de sus pedidos (no con el total de la empresa).
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-091
- **Pendiente de confirmación de Jose**: soporte de backend para filtrar
  estadísticas de pedidos por comercial (ver sección Contexto).
