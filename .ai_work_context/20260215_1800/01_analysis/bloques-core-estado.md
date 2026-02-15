# Estado de bloques CORE — 2026-02-15

## Bloques completados (9/10 o 8/10)

| Bloque | Rating | Notas |
|--------|--------|-------|
| **Dashboard** | 9/10 | React Query completo. Ver evolution-log. |
| **Ventas** | 9/10 | Order, OrderPallets, Zod, tests. Ver plan-ventas-9-10. |
| **Auth** | 8/10 | authService TS, LoginPage dividida, Zod, middleware TS. |
| **Stock / Movimientos** | 8/10 | useStockStats, useStoreData, useStoreDialogs, useOperarioReceptionForm, useAdminReceptionForm. |

## Bloques pendientes de auditoría y evolución

| Bloque | Rating | Prioridad sugerida |
|--------|--------|-------------------|
| **Productos** | — | Alta (base de catálogo; usado en Ventas, Stock) |
| **Clientes** | — | Alta (usado en Ventas, OrderCustomerHistory) |
| **Informes básicos** | — | Media |
| **Configuración por tenant** | — | Media |

## Recomendación
Abordar **Productos** o **Clientes** a continuación: son dependencias transversales y aún no auditados.
