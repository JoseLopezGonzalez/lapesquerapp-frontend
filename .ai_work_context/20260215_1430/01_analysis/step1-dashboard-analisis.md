# STEP 1 — Bloque Dashboard: Análisis

**Fecha**: 2026-02-15  
**Bloque**: Dashboard  
**Rating antes: 5/10**

**Justificación del rating**: Funciona correctamente y la UI es consistente con shadcn/ui, pero hay deuda técnica significativa: 11 componentes con useEffect + useState en lugar de React Query, uso de getCurrentTenant() en lugar de useTenant(), sin TypeScript, WorkingEmployeesCard > 395 líneas (P1), y ausencia de tests. Tres componentes ya usan React Query (useStockStats).

---

## 1. Qué hace el bloque (global y por entidad)

### 1.1 Admin Dashboard
Panel de inicio para admin/tecnico con:
- Saludo dinámico + nombre de usuario
- 4 cards principales: Stock Total, Cantidad Ventas, Importe Ventas, Nueva Funcionalidad Etiquetas
- Masonry de gráficos/cards: OrderRanking, SalesBySalesperson, Stock por especie/productos, SalesChart, ReceptionChart, DispatchChart, TransportRadarChart, WorkingEmployeesCard, WorkerStatisticsCard

### 1.2 OperarioDashboard
Panel para operario con:
- Hora, fecha, día (actualizados cada segundo)
- 4 cards de info + ReceptionsListCard y DispatchesListCard (tablas paginadas del día)

### 1.3 HomePage
Página que decide según rol si renderiza Admin Dashboard o OperarioDashboard.

---

## 2. Estado estructural por entidad/artefacto

### 2.1 HomePage (`page.js`)
- **Estado**: JS, ~30 líneas
- **Calidad**: Aceptable
- **Mejoras**: Migrar a TS, extraer lógica de selección de rol a hook si crece

### 2.2 Dashboard/index.js
- **Estado**: JS, ~178 líneas
- **Calidad**: Aceptable, componente contenedor
- **Mejoras**: Comentarios de estrategia (true &&) innecesarios; migrar a TS

### 2.3 Cards con React Query (CurrentStockCard, StockBySpeciesCard, StockByProductsCard)
- **Estado**: Patrón correcto vía useStockStats
- **Deuda**: useStockStats usa getCurrentTenant() — migrar a useTenant() cuando exista TenantContext

### 2.4 Cards con useEffect + useState
- **TotalQuantitySoldCard, TotalAmountSoldCard**: ~100 líneas c/u, patrón manual
- **OrderRankingChart**: ~314 líneas, múltiples useEffect, carga species y ranking
- **SalesBySalespersonPieChart**: ~186 líneas
- **SalesChart, ReceptionChart, DispatchChart**: ~335, ~342 líneas c/u — estructura similar, mucho estado duplicado (species, category, family options, range, unit, groupBy)
- **TransportRadarChart**: ~177 líneas
- **WorkingEmployeesCard**: ~395 líneas — **P1** (>150)
- **WorkerStatisticsCard**: ~582 líneas — **P1** (>150)

### 2.5 NewLabelingFeatureCard
- **Estado**: Estático, sin datos, ~35 líneas
- **Calidad**: OK

### 2.6 OperarioDashboard
- **Estado**: JS, ~105 líneas
- **Calidad**: Aceptable, usa ReceptionsListCard y DispatchesListCard con useEffect

### 2.7 ReceptionsListCard, DispatchesListCard
- **Estado**: useEffect + useState, servicios de dominio
- **Mejoras**: Migrar a React Query para consistencia y caché

### 2.8 useStockStats
- **Estado**: React Query, getCurrentTenant()
- **Mejoras**: Migrar a useTenant()

---

## 3. Patrones Next.js/React

| Patrón | Presencia | Comentario |
|--------|-----------|------------|
| Server/Client Components | Client | Todo el Dashboard es Client; correcto para interactividad |
| Custom Hooks | Parcial | useStockStats presente; faltan useSalesChart, useReceptionChart, usePunchesDashboard, etc. |
| Data Fetching | Inconsistente | 3 componentes React Query, 11+ con useEffect + useState |
| API Layer | Centralizado | Servicios usados correctamente |
| State | Local por componente | Mucho estado duplicado (options, range, unit, groupBy en cada chart) |

---

## 4. TypeScript

- **Estado**: 100% JavaScript
- **Archivos**: Todos `.js` / `.jsx`
- **Prioridad**: P1 para componentes refactorizados; P2 para el resto

---

## 5. UI/UX Design System

- [x] shadcn/ui usado consistentemente (Card, Badge, Select, Tabs, Skeleton, etc.)
- [x] Recharts con ChartContainer de shadcn
- [x] Sin MUI, Chakra, Ant Design
- [ ] Comentarios de estrategia `{true && ...}` en Dashboard/index.js — código muerto/innecesario

---

## 6. Tech Stack del proyecto

| Requisito | Cumplimiento |
|-----------|--------------|
| React Query para server state | Parcial — 3 de 14+ componentes |
| Zod en formularios | N/A (Dashboard sin formularios de entrada) |
| TypeScript | No — todo JS |
| useTenant() | No — getCurrentTenant() en useStockStats |
| Tests | No — ninguno para Dashboard |

---

## 7. Accesibilidad

- shadcn/ui aporta semántica y teclado
- No revisión WCAG explícita
- Imágenes con alt en CurrentStockCard, NewLabelingFeatureCard
- Posibles mejoras: aria-labels en iconos, estados de carga anunciables

---

## 8. Rendimiento

- Cada card/chart hace su propio fetch — sin caché compartida en mayoría
- WorkingEmployeesCard: refresh cada 5 min (interval)
- OperarioDashboard: interval 1s para hora
- Duplicación de carga de options (species, category, family) en SalesChart, ReceptionChart, DispatchChart, OrderRankingChart — candidato a cache/React Query

---

## 9. Oportunidades de mejora (priorizadas)

### P0 — Críticos
- Ninguno específico del Dashboard (no hay componentes > 200 líneas que no puedan abordarse en P1)

### P1 — Altos (bloquean 9/10)
- **WorkingEmployeesCard** (>395 líneas): Extraer subcomponentes, migrar a React Query
- **WorkerStatisticsCard** (>582 líneas): Extraer subcomponentes, migrar a React Query
- **Migrar 11 componentes** de useEffect + useState a React Query: TotalQuantitySoldCard, TotalAmountSoldCard, OrderRankingChart, SalesBySalespersonPieChart, SalesChart, ReceptionChart, DispatchChart, TransportRadarChart, ReceptionsListCard, DispatchesListCard
- **useStockStats**: Migrar getCurrentTenant() a useTenant() cuando TenantContext exista
- **Extraer hooks** para charts: useSalesChartData, useReceptionChartData, useDispatchChartData, useOrderRankingData, usePunchesDashboard, usePunchesStatistics, etc.
- **Extraer carga de options** (species, category, family) a hooks compartidos con React Query para evitar duplicación

### P2 — Medios
- Migrar a TypeScript (.tsx) al refactorizar
- Eliminar comentarios `{true && ...}` en Dashboard/index.js
- Tests unitarios para hooks nuevos
- Tests de integración para flujos principales
- Error handling consistente (toast vs silencioso)

### P3 — Bajos
- Documentación de componentes
- Evaluar lazy loading de charts pesados

---

## 10. Riesgos identificados

- **Consistencia de caché**: Mezcla React Query + manual puede causar datos desactualizados al navegar
- **Duplicación de requests**: species/category/family options se cargan múltiples veces en distintos charts
- **Componentes grandes**: WorkingEmployeesCard y WorkerStatisticsCard difíciles de mantener y testear

---

## 11. Alineación con auditoría

- Coincide con hallazgos: data fetching manual, falta React Query, componentes grandes
- useStockStats ya aplica React Query en 3 cards — patrón a extender

---

## 12. Alcance de mejora (sub-bloques propuestos)

| Sub-bloque | Entidades | Trabajo principal |
|------------|-----------|-------------------|
| **1** | TotalQuantitySoldCard, TotalAmountSoldCard | Crear useOrdersStats (React Query), migrar ambas cards |
| **2** | OrderRankingChart, SalesBySalespersonPieChart | Crear useOrderRanking, useSalesBySalesperson, migrar |
| **3** | SalesChart, ReceptionChart, DispatchChart | Extraer useChartOptions (species, category, family), useSalesChartData, useReceptionChartData, useDispatchChartData |
| **4** | TransportRadarChart | Crear useTransportChartData, migrar |
| **5** | WorkingEmployeesCard, WorkerStatisticsCard | Dividir en subcomponentes, crear usePunchesDashboard, usePunchesStatistics |
| **6** | ReceptionsListCard, DispatchesListCard | Crear hooks con React Query, migrar |
| **7** | useStockStats, Dashboard/index.js | Migrar getCurrentTenant → useTenant; limpieza Dashboard |

---

**Próximo paso**: STEP 2 — Presentar cambios propuestos para el primer sub-bloque y solicitar aprobación.
