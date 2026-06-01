# Auditoría: Frontend Next.js Agent

# Bloque: Pedidos - listado, gestor, editor y ejecución

**Fecha:** 2026-04-26
**Rol auditor:** Frontend Next.js Agent
**Scope:** rutas App Router, estructura de componentes, separación de responsabilidades y reutilización entre admin, comercial y field

---

## 1. Archivos inspeccionados

| Archivo                                                   | Propósito                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `src/app/admin/[entity]/page.js`                          | Ruta dinámica EntityClient usada por `/admin/orders`            |
| `src/app/admin/orders-manager/page.js`                    | Entry point del gestor admin con `OrdersManagerOptionsProvider` |
| `src/app/admin/orders/[id]/page.js`                       | Detalle directo de pedido admin                                 |
| `src/app/comercial/orders/page.js`                        | Listado EntityClient read-only para comercial                   |
| `src/app/comercial/orders-manager/page.js`                | Gestor comercial reutilizando piezas admin                      |
| `src/app/comercial/orders/[id]/page.js`                   | Detalle read-only para comercial                                |
| `src/components/Admin/OrdersManager/index.js`             | Gestor principal admin                                          |
| `src/components/Admin/OrdersManager/Order/index.js`       | Editor/detalle de pedido                                        |
| `src/components/Comercial/CRM/ComercialOrdersManager.jsx` | Variante comercial del gestor                                   |
| `src/components/Field/FieldOrdersPage.jsx`                | Lista operativa para repartidor/autoventa                       |
| `src/components/Field/FieldOrderExecutionPage.jsx`        | Wizard operativo de ejecución de pedido                         |

---

## 2. Resultado general

El bloque de pedidos está bien integrado en App Router y cubre flujos muy amplios: listado administrativo, gestor operacional, edición, documentos, palets, producción, rentabilidad, comercial y field. Tras las mejoras aplicadas, la duplicidad principal entre admin y comercial se redujo con layout y helpers compartidos, el modo `readOnly` tiene política frontend testeada, la vista de producción ya no conserva datos mock y la documentación de rutas quedó más clara. El principal riesgo restante de esta auditoría es que parte del filtrado de pedidos sigue siendo cliente-side y requerirá backend si aumenta el volumen operativo.

### Nota global: **8.1 / 10**

---

## 3. Hallazgos

| ID      | Severidad | Hallazgo                                                                                                                                                                    | Explicación del problema                                                                                     | Referencia                                                                                                                        | Solución / mejora recomendada                                                       | Estado    | Observaciones                                                                                                                                                             |
| ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OB01-01 | Alta      | `OrdersManager` admin y `ComercialOrdersManager` duplican casi todo el layout, categorías, búsqueda, selección y vista producción.                                          | Cualquier mejora o bugfix debe repetirse en dos sitios, con alto riesgo de divergencia entre roles.          | `src/components/Admin/OrdersManager/index.js:21`, `src/components/Comercial/CRM/ComercialOrdersManager.jsx:25`                    | Extraer un hook/componente base parametrizable para gestor admin/comercial.         | Hecho     | Extraídos `OrdersManagerLayout`, `INITIAL_ORDER_CATEGORIES` y helpers compartidos de categorías/filtrado; admin/comercial conservan solo diferencias de datos y permisos. |
| OB01-02 | Alta      | `Order` se reutiliza en modo mutable y read-only, pero la protección se aplica en UI por props. Hay que verificar que el backend impide mutaciones desde roles comerciales. | El bloqueo visual mejora UX, pero no es una frontera de seguridad si los endpoints aceptan mutaciones.       | `src/components/Admin/OrdersManager/Order/index.js:27`, `src/components/Admin/OrdersManager/Order/index.js:43`                    | Añadir tests read-only y confirmar permisos backend para cada mutación sensible.    | Hecho     | Extraída y testeada la política frontend read-only en `orderReadOnlyPermissions`; sigue pendiente coordinar/verificar policies backend.                                   |
| OB01-03 | Media     | El gestor admin filtra y ordena pedidos activos en cliente; si el endpoint crece, el componente asume demasiada lógica de listado.                                          | El componente se convierte en dueño de reglas de consulta y puede degradarse con volumen.                    | `src/components/Admin/OrdersManager/index.js:178`                                                                                 | Preparar filtros/paginación backend o limitar explícitamente el volumen de activos. | Pendiente |                                                                                                                                                                           |
| OB01-04 | Media     | La vista de producción usa mock data cuando `sortedOrders.length === 0`, lo cual puede confundir en producción si no se distingue claramente de un estado vacío real.       | Un estado sin pedidos puede parecer una pantalla con datos reales, afectando decisiones operativas.          | `src/components/Admin/OrdersManager/index.js:390`                                                                                 | Cambiar a empty state real o condicionar mock data a entorno/desarrollo.            | Hecho     | Eliminada la activación `useMockData` en admin/comercial y retirado `MOCK_ORDERS`; `ProductionView` usa datos backend y su empty state real.                              |
| OB01-05 | Media     | `/admin/orders` existe vía ruta dinámica, no como `src/app/admin/orders/page.js`; correcto, pero menos obvio para nuevos agentes.                                           | La ausencia de archivo explícito dificulta descubrir la ruta y puede generar cambios en el sitio incorrecto. | `src/app/admin/[entity]/page.js:1`, `src/configs/entitiesConfig.js:129`                                                           | Documentar en contexto que el listado vive en EntityClient dinámico.                | Hecho     | Documentado en `docs/ai-context/05-entity-client.md`.                                                                                                                     |
| OB01-06 | Baja      | Imports pegados en varias piezas reducen mantenibilidad y revisión visual.                                                                                                  | Pequeñas inconsistencias de formato hacen más difícil revisar dependencias en archivos grandes.              | `src/components/Admin/OrdersManager/index.js:14`, `src/hooks/useOrder.js:7`                                                       | Separar imports en líneas distintas al tocar esos archivos.                         | Hecho     | Separados imports pegados en `OrdersManager/index.js` y `useOrder.js`.                                                                                                    |
| OB01-07 | Baja      | Hay comentarios históricos o de transición que no explican decisiones actuales.                                                                                             | Los comentarios obsoletos hacen dudar si el código refleja una decisión vigente o un refactor a medias.      | `src/components/Admin/OrdersManager/CreateOrderForm/index.js:4`, `src/components/Admin/OrdersManager/CreateOrderForm/index.js:67` | Sustituir comentarios históricos por notas de decisión actuales o eliminarlos.      | Hecho     | Eliminados comentarios de transición y separado import pegado en `CreateOrderForm/index.js`.                                                                              |

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
