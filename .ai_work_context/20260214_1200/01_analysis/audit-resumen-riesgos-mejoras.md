# Análisis inicial — Resumen de auditoría

**Fuente**: `docs/audits/nextjs-frontend-global-audit.md`  
**Fecha**: 2026-02-14

---

## Top 5 riesgos sistémicos (Auditoría)

| # | Riesgo | Impacto |
|---|--------|---------|
| 1 | **Data fetching sin caché** — Inconsistencia de datos, recargas innecesarias, dificultad para evolucionar a server-first | Alto |
| 2 | **Exposición de clave de Google Maps** (fallback hardcodeado en OrderDetails) | Seguridad |
| 3 | **Ausencia de TypeScript** — Refactors costosos y propensos a regresiones | Medio-Alto |
| 4 | **Componentes monolíticos** (EntityClient, PalletView, Order >1000 líneas) | Mantenibilidad |
| 5 | **Cobertura de tests mínima** — Solo 3 archivos, sin estrategia definida | Riesgo regresión |

---

## Top 5 mejoras de mayor impacto (Auditoría)

| # | Mejora | Esfuerzo |
|---|--------|----------|
| 1 | **Introducir React Query** para estado de servidor: caché, invalidación, menos código loading/error | Medio |
| 2 | **Eliminar/externalizar API key de Google Maps** — Solo variable de entorno | Bajo |
| 3 | **Aumentar Server Components** — Shell y datos iniciales donde no haga falta interactividad | Medio-Alto |
| 4 | **Tipado progresivo con TypeScript** — Empezar por API y modelos compartidos | Alto |
| 5 | **Dividir componentes gigantes** — EntityClient, PalletView, Order en subcomponentes/vistas | Medio |

---

## Módulos CORE (mapeo)

| Módulo | Componentes principales | Ámbito típico |
|--------|-------------------------|---------------|
| Auth | Login, verify, logout | Autenticación y sesión |
| Productos | EntityClient (productos), formularios | Catálogo de productos |
| Clientes | EntityClient (clientes) | Catálogo de clientes |
| Ventas | Order, OrderDetails | Pedidos y ventas |
| Stock | Almacenes, palés, EntityClient (almacén) | Gestión de inventario |
| Informes | Charts, exportaciones | Reporting |
| Config | Settings, options | Configuración y preferencias |

---

## Puntuación global actual

**~4,7 / 10** (promedio ponderado, según auditoría)

---

*Documento preparado para iniciar el flujo de evolución. El siguiente paso es que el usuario indique qué módulo/bloque abordar primero.*
