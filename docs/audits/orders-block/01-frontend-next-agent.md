# Auditoría: Frontend Next.js Agent
# Bloque: Pedidos - listado, gestor, editor y ejecución

**Fecha:** 2026-04-26
**Rol auditor:** Frontend Next.js Agent
**Scope:** rutas App Router, estructura de componentes, separación de responsabilidades y reutilización entre admin, comercial y field

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/app/admin/[entity]/page.js` | Ruta dinámica EntityClient usada por `/admin/orders` |
| `src/app/admin/orders-manager/page.js` | Entry point del gestor admin con `OrdersManagerOptionsProvider` |
| `src/app/admin/orders/[id]/page.js` | Detalle directo de pedido admin |
| `src/app/comercial/orders/page.js` | Listado EntityClient read-only para comercial |
| `src/app/comercial/orders-manager/page.js` | Gestor comercial reutilizando piezas admin |
| `src/app/comercial/orders/[id]/page.js` | Detalle read-only para comercial |
| `src/components/Admin/OrdersManager/index.js` | Gestor principal admin |
| `src/components/Admin/OrdersManager/Order/index.js` | Editor/detalle de pedido |
| `src/components/Comercial/CRM/ComercialOrdersManager.jsx` | Variante comercial del gestor |
| `src/components/Field/FieldOrdersPage.jsx` | Lista operativa para repartidor/autoventa |
| `src/components/Field/FieldOrderExecutionPage.jsx` | Wizard operativo de ejecución de pedido |

---

## 2. Resultado general

El bloque de pedidos está bien integrado en App Router y cubre flujos muy amplios: listado administrativo, gestor operacional, edición, documentos, palets, producción, rentabilidad, comercial y field. La arquitectura entrega mucho valor funcional, pero el coste es una superficie enorme con lógica duplicada entre admin y comercial, componentes con demasiadas responsabilidades y reglas de negocio repartidas entre hooks, componentes y librerías auxiliares.

### Nota global: **6.2 / 10**

---

## 3. Hallazgos

| Severidad | Hallazgo | Referencia |
|---|---|---|
| Alta | `OrdersManager` admin y `ComercialOrdersManager` duplican casi todo el layout, categorías, búsqueda, selección y vista producción. | `src/components/Admin/OrdersManager/index.js:21`, `src/components/Comercial/CRM/ComercialOrdersManager.jsx:25` |
| Alta | `Order` se reutiliza en modo mutable y read-only, pero la protección se aplica en UI por props. Hay que verificar que el backend impide mutaciones desde roles comerciales. | `src/components/Admin/OrdersManager/Order/index.js:27`, `src/components/Admin/OrdersManager/Order/index.js:43` |
| Media | El gestor admin filtra y ordena pedidos activos en cliente; si el endpoint crece, el componente asume demasiada lógica de listado. | `src/components/Admin/OrdersManager/index.js:178` |
| Media | La vista de producción usa mock data cuando `sortedOrders.length === 0`, lo cual puede confundir en producción si no se distingue claramente de un estado vacío real. | `src/components/Admin/OrdersManager/index.js:390` |
| Media | `/admin/orders` existe vía ruta dinámica, no como `src/app/admin/orders/page.js`; correcto, pero menos obvio para nuevos agentes. | `src/app/admin/[entity]/page.js:1`, `src/configs/entitiesConfig.js:129` |
| Baja | Imports pegados en varias piezas reducen mantenibilidad y revisión visual. | `src/components/Admin/OrdersManager/index.js:14`, `src/hooks/useOrder.js:7` |
| Baja | Hay comentarios históricos o de transición que no explican decisiones actuales. | `src/components/Admin/OrdersManager/CreateOrderForm/index.js:4`, `src/components/Admin/OrdersManager/CreateOrderForm/index.js:67` |

---

## 4. Puntos fuertes

- Las rutas principales están separadas por rol y reutilizan piezas existentes sin crear sistemas paralelos innecesarios.
- El gestor admin tiene layout adaptativo real: lista/detalle en desktop, lista o detalle en móvil.
- La variante comercial reutiliza `Order` en `readOnly`, reduciendo duplicación del detalle.
- El flujo field está claramente aislado en rutas y hooks propios (`useFieldOrders`), con query keys tenant-aware y operador-aware.
- El detalle de pedido divide secciones en componentes: detalles, previsión, palets, documentos, producción, etiquetas, análisis e incidencias.

---

## 5. Recomendaciones

1. Extraer un componente/hook común para el patrón de gestor de pedidos: categorías, búsqueda, selección, vista producción y layout responsive.
2. Documentar explícitamente que `/admin/orders` es EntityClient vía ruta dinámica y que `/admin/orders-manager` es el gestor operacional.
3. Sustituir el mock automático de `ProductionView` por un empty state explícito o un flag de entorno/desarrollo.
4. Añadir una prueba de integración ligera para asegurar que `readOnly` bloquea edición, documentos, incidencias y palets sensibles.
5. Mantener `Order` como componente compartido, pero separar mejor permisos de renderizado y permisos de mutación.

---

## 6. Checks manuales sugeridos

- [ ] Abrir `/admin/orders` y confirmar listado, filtros, exportaciones y navegación a detalle.
- [ ] Abrir `/admin/orders-manager` en desktop y móvil: crear, seleccionar, cerrar detalle, cambiar a vista producción.
- [ ] Abrir `/comercial/orders-manager` y confirmar que el detalle no permite acciones sensibles sobre pedidos en curso.
- [ ] Abrir `/field/pedidos` y ejecutar el flujo de un pedido con cajas escaneadas.
- [ ] Confirmar que una lista vacía de producción no muestra datos mock en entorno real.

