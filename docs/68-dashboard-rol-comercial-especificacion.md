# Dashboard rol Comercial — Especificación e implementación

**Estado**: Especificación  
**Última actualización**: 2026-02-18

---

## 1. Objetivo

Crear una **interfaz nueva para el rol comercial**, que hasta ahora no tiene ninguna. Empezar por un **dashboard** equivalente al dashboard genérico de admin pero reducido a **5 cards**:

1. **Cantidad total de ventas**
2. **Importe total de ventas**
3. **Ranking de pedidos**
4. **Ranking de ventas**
5. **Ventas y empresas de transporte**

El backend aplicará la lógica de negocio y devolverá datos **ya filtrados** para el comercial (solo clientes/pedidos asociados a él). En el frontend **no hace falta añadir filtros**: se reutilizan los mismos endpoints y hooks; la restricción por comercial se resuelve en backend según el usuario autenticado.

---

## 2. Análisis de la implementación actual

### 2.1 Roles y rutas

| Origen | Detalle |
|--------|--------|
| `src/configs/roleConfig.ts` | El rol **`comercial`** está definido en `RoleKey` pero **no tiene ninguna ruta** en el mapa `roleConfig`. Las rutas `/admin` y `/admin/home` solo permiten `administrador`, `direccion`, `tecnico`. |
| `src/middleware.ts` | El matcher protege `/admin/:path*`, `/operator/:path*`, `/production/:path*`, `/warehouse/:path*`. No existe segmento `/comercial`. Si un usuario con rol `comercial` intenta acceder a `/admin`, no está en `rolesAllowed` y se redirige a **/unauthorized**. |
| `src/utils/loginUtils.ts` | Tras login, solo hay redirección específica para `operario` → `/operator`. El resto va a `safeFrom` o `/admin/home`. Un comercial iría a `/admin/home` y el middleware lo enviaría a **/unauthorized** porque `comercial` no está permitido en `/admin`. |

**Conclusión**: Hoy el rol comercial no puede usar la app: no tiene segmento de URL ni entrada en navegación. Hay que darle un segmento propio (por ejemplo `/comercial`), igual que el operario tiene `/operator`.

### 2.2 Dashboard genérico (admin)

- **Página**: `src/app/admin/home/page.js`
  - Si rol es `operario` → renderiza `OperarioDashboard` (y en la práctica el operario es redirigido a `/operator`, no a `/admin/home`).
  - Resto de roles → renderiza `Dashboard` (componente genérico).
- **Componente**: `src/components/Admin/Dashboard/index.js`
  - Saludo + nombre de usuario.
  - Primera fila: `CurrentStockCard`, `TotalQuantitySoldCard`, `TotalAmountSoldCard`, `NewLabelingFeatureCard`.
  - Masonry con: `OrderRankingChart`, `SalesBySalespersonPieChart`, `StockBySpeciesCard`, `StockByProductsCard`, `SalesChart`, `ReceptionChart`, `DispatchChart`, `TransportRadarChart`, `WorkingEmployeesCard`, `WorkerStatisticsCard`.

Para el **dashboard comercial** solo se usan estos 5 componentes (y mismo layout/estilo que el genérico):

| # | Card | Componente | Hook | Endpoint (API v2) |
|---|------|------------|------|-------------------|
| 1 | Cantidad total de ventas | `TotalQuantitySoldCard` | `useOrdersTotalNetWeightStats` | `GET statistics/orders/total-net-weight?dateFrom=&dateTo=` |
| 2 | Importe total de ventas | `TotalAmountSoldCard` | `useOrdersTotalAmountStats` | `GET statistics/orders/total-amount?dateFrom=&dateTo=` |
| 3 | Ranking de pedidos | `OrderRankingChart` | `useOrderRankingStats` | `GET statistics/orders/ranking?groupBy=&valueType=&dateFrom=&dateTo=` (+ speciesId opcional) |
| 4 | Ranking de ventas | `SalesBySalespersonPieChart` | `useSalesBySalesperson` | `GET orders/sales-by-salesperson?dateFrom=&dateTo=` |
| 5 | Ventas y empresas de transporte | `TransportRadarChart` | `useTransportChartData` | `GET orders/transport-chart-data?from=&to=` |

Todos los hooks están en:

- `src/hooks/useOrdersStats.ts` (cantidad, importe, ranking pedidos, ventas por comercial).
- `src/hooks/useDashboardCharts.ts` (transport chart).

Los servicios que llaman a la API están en `src/services/orderService.ts`. Las peticiones se hacen con el token de sesión; **el backend debe filtrar por el comercial asociado al usuario** cuando el rol sea `comercial`. En el frontend no se añaden parámetros extra de filtro para este rol.

### 2.3 Navegación y layout

- **Admin**: `src/app/admin/layout.js` → `AdminLayoutClient` → `ResponsiveLayout` con sidebar y navegación filtrada por rol (`navigationConfig`, `navigationManagerConfig`).
- **Operario**: `src/app/operator/layout.js` → `OperatorLayoutClient` → mismo `ResponsiveLayout` pero con `roles = ['operario']` y protección `OperatorRouteProtection` (solo operario; el resto redirige a `/admin/home`).
- **navgationConfig**: `src/configs/navgationConfig.js` tiene entradas por rol; el operario tiene "Inicio" → `/operator`. No hay entrada para `comercial`.

Para el comercial, el patrón a seguir es el del operario: **segmento propio** (`/comercial`), **layout propio** que reutilice el mismo shell (sidebar + TopBar) y **navegación** con solo los ítems que correspondan al comercial (empezando por "Inicio" → dashboard).

### 2.4 Patrón de rutas por rol

Según `docs/arquitectura/patron-rutas-por-rol.md`:

- Cada rol con flujos propios tiene su segmento (operario → `/operator`).
- Config en `src/configs/roleRoutesConfig.js`.
- Middleware: redirigir al rol “propietario” del segmento si intenta entrar en otro (ej. operario en `/admin` → `/operator`).
- Tras login, redirigir al segmento base del rol.

Para comercial se aplica lo mismo: segmento `/comercial`, rutas en `roleRoutesConfig`, middleware y login actualizados.

---

## 3. Requisitos backend (recordatorio)

No es objeto de este doc implementar el backend; solo se deja constancia de lo que se asume:

- Los mismos endpoints que usa hoy el dashboard (tabla de la sección 2.2) deben poder ser llamados por un usuario con rol **comercial**.
- La respuesta debe estar **filtrada** por el comercial asociado al usuario (solo clientes/pedidos asignados a ese comercial).
- No se requieren nuevos endpoints ni parámetros desde el frontend; el filtrado se hace en backend según el token/sesión.

---

## 4. Plan de implementación frontend

### 4.1 Rutas y configuración de roles

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | `src/configs/roleRoutesConfig.js` | Añadir `COMERCIAL_BASE = '/comercial'` y `comercialRoutes = { dashboard: COMERCIAL_BASE }`. |
| 2 | `src/configs/roleConfig.ts` | Añadir entrada `"/comercial": ["comercial"]`. |
| 3 | `src/middleware.ts` | Incluir `/comercial/:path*` en el `config.matcher`. Añadir lógica: si `userRole === "comercial"` y `pathname.startsWith("/admin")`, redirigir a `/comercial` (igual que operario → /operator). |
| 4 | `src/utils/loginUtils.ts` | En `getRedirectUrl`, si `role === "comercial"` devolver `"/comercial"`. |

### 4.2 Navegación

| Paso | Archivo | Cambio |
|------|---------|--------|
| 5 | `src/configs/navgationConfig.js` | Añadir ítem "Inicio" con `href: '/comercial'` y `allowedRoles: ["comercial"]` (misma idea que el ítem de operario con `/operator`). |
| 6 | Gestores (`navigationManagerConfig`) | De momento el comercial solo tiene dashboard; no añadir gestores para comercial salvo que se definan más pantallas. |

### 4.3 Segmento `/comercial` y layout

| Paso | Archivo | Cambio |
|------|---------|--------|
| 7 | `src/app/comercial/layout.js` | Crear layout que renderice un cliente (p. ej. `ComercialLayoutClient`) con `dynamic = 'force-dynamic'`. |
| 8 | `src/app/comercial/ComercialLayoutClient.jsx` (o .tsx) | Nuevo componente que: use el mismo `ResponsiveLayout` que admin/operator; pase `roles = ['comercial']` para filtrar nav; implemente una protección de ruta que solo permita rol `comercial` (y redirija al resto a `/admin/home` o login). No incluir `AdminRouteProtection` (es para admin). |
| 9 | `src/app/comercial/page.js` | Página principal del comercial: renderizar el **dashboard comercial** (solo 5 cards). |

### 4.4 Dashboard comercial (solo 5 cards)

| Paso | Archivo | Cambio |
|------|---------|--------|
| 10 | `src/components/Admin/Dashboard/ComercialDashboard/index.js` (o ruta análoga) | Nuevo componente que replique la estructura visual del dashboard genérico (saludo, nombre de usuario, ScrollArea, mismo estilo de grid/Masonry) pero solo incluya: `TotalQuantitySoldCard`, `TotalAmountSoldCard`, `OrderRankingChart`, `SalesBySalespersonPieChart`, `TransportRadarChart`. Reutilizar los componentes existentes; no duplicar lógica. Opción alternativa: componente wrapper que reciba una lista de “slots” o un flag `variant="comercial"` y el `Dashboard` actual renderice solo esos 5 en ese caso; la opción más simple y clara es un **ComercialDashboard** que importe y coloque solo esos 5. |

Detalle sugerido del layout del ComercialDashboard:

- Misma cabecera que el dashboard genérico: saludo + nombre de usuario (usando `useSession()`).
- Primera fila: los dos cards de totales (Cantidad total de ventas, Importe total de ventas). Se puede usar una fila de 2 columnas en desktop y 1 en móvil, igual que en el genérico.
- Segunda zona (Masonry o grid): OrderRankingChart, SalesBySalespersonPieChart, TransportRadarChart.

No hace falta cambiar hooks ni servicios: los mismos componentes ya usan los endpoints indicados; el backend se encargará de devolver datos filtrados para el comercial.

### 4.5 Protección de ruta comercial

- Crear un componente `ComercialRouteProtection` análogo a `OperatorRouteProtection`: si el usuario no es `comercial`, redirigir a `/admin/home` (o `/` si no autenticado). Usarlo dentro de `ComercialLayoutClient`.

### 4.6 Documentación de arquitectura

| Paso | Archivo | Cambio |
|------|---------|--------|
| 11 | `docs/arquitectura/patron-rutas-por-rol.md` | Añadir una subsección o tabla para el rol comercial: segmento `/comercial`, ruta principal `GET /comercial`, dashboard con 5 cards; listar archivos nuevos (layout, page, ComercialDashboard, ComercialRouteProtection). |

---

## 5. Resumen de archivos

### Archivos a crear

- `src/app/comercial/layout.js`
- `src/app/comercial/ComercialLayoutClient.jsx` (o .tsx)
- `src/app/comercial/page.js`
- `src/components/Admin/Dashboard/ComercialDashboard/index.js` (o `ComercialDashboard.js` en la carpeta Dashboard)
- Opcional: `src/components/ComercialRouteProtection/index.jsx` (o integrar la lógica dentro del layout cliente)

### Archivos a modificar

- `src/configs/roleRoutesConfig.js` — añadir constantes comercial.
- `src/configs/roleConfig.ts` — añadir ruta `/comercial`.
- `src/configs/navgationConfig.js` — ítem "Inicio" para comercial.
- `src/middleware.ts` — matcher y redirección comercial.
- `src/utils/loginUtils.ts` — redirección post-login comercial.
- `docs/arquitectura/patron-rutas-por-rol.md` — documentar rol comercial.

---

## 6. Checklist de implementación

- [ ] roleRoutesConfig: `COMERCIAL_BASE`, `comercialRoutes`
- [ ] roleConfig: `"/comercial": ["comercial"]`
- [ ] middleware: matcher `/comercial`, redirección comercial desde `/admin`
- [ ] loginUtils: redirección comercial → `/comercial`
- [ ] navgationConfig: Inicio → `/comercial` para rol comercial
- [ ] Layout y página: `app/comercial/layout.js`, ComercialLayoutClient, `app/comercial/page.js`
- [ ] ComercialDashboard con solo 5 cards (reutilizando componentes existentes)
- [ ] Protección de ruta para rol comercial
- [ ] Actualizar documentación del patrón de rutas por rol

---

## 7. Referencias rápidas

- Dashboard genérico: `src/components/Admin/Dashboard/index.js`
- Cards a reutilizar: `TotalQuantitySoldCard`, `TotalAmountSoldCard`, `OrderRanking`, `SalesBySalespersonPieChart`, `TransportRadarChart` (todos bajo `src/components/Admin/Dashboard/`).
- Hooks: `src/hooks/useOrdersStats.ts`, `src/hooks/useDashboardCharts.ts`.
- Servicios: `src/services/orderService.ts` (total-net-weight, total-amount, ranking, sales-by-salesperson, transport-chart-data).
- Patrón operario: `src/app/operator/`, `OperatorLayoutClient.jsx`, `docs/arquitectura/patron-rutas-por-rol.md`.
