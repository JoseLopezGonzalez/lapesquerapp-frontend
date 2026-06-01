# Auditoría: EntityClient Agent

# Bloque: Pedidos - `/admin/orders` y `/comercial/orders`

**Fecha:** 2026-04-26
**Rol auditor:** EntityClient Agent
**Scope:** configuración EntityClient, filtros, rutas, tabla, acciones y exportaciones

---

## 1. Archivos inspeccionados

| Archivo                                      | Propósito                             |
| -------------------------------------------- | ------------------------------------- |
| `src/app/admin/[entity]/page.js`             | Resolver dinámico de entidad          |
| `src/app/comercial/orders/page.js`           | EntityClient read-only para comercial |
| `src/configs/entitiesConfig.js`              | Config de entidad `orders`            |
| `src/services/domain/orders/orderService.js` | Service usado por EntityClient        |
| `src/configs/navgationConfig.js`             | Entrada de navegación admin/comercial |

---

## 2. Resultado general

EntityClient está correctamente usado para el listado administrativo y comercial de pedidos. El gestor dedicado queda fuera de EntityClient, lo cual es adecuado porque tiene flujos complejos. La parte débil es que el config de `orders` mezcla listado, exportación masiva y un `createForm` aparentemente heredado que no es el camino real de creación, ya que `createRedirect` apunta al gestor.

### Nota global: **7.1 / 10**

---

## 3. Hallazgos

| ID      | Severidad | Hallazgo                                                                                                                                              | Explicación del problema                                                                                              | Referencia                                                               | Solución / mejora recomendada                                                  | Estado    | Observaciones |
| ------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------- | ------------- |
| OB04-01 | Media     | `createRedirect` envía al gestor, pero `orders.createForm` sigue definido en el config. Puede inducir a agentes a editar un formulario que no se usa. | Mantener dos definiciones de alta hace que el implementador pueda modificar el sitio equivocado.                      | `src/configs/entitiesConfig.js:142`, `src/configs/entitiesConfig.js:381` | Marcar `createForm` como deprecated o retirarlo si no lo consume ninguna ruta. | Pendiente |               |
| OB04-02 | Media     | El grupo de filtros tiene typo `salespeple`; puede afectar trazabilidad o tooling si se usan nombres de grupo.                                        | Los nombres de grupo suelen usarse para persistencia, analytics o automatización; un typo se propaga silenciosamente. | `src/configs/entitiesConfig.js:297`                                      | Corregir a `salespeople` verificando compatibilidad con filtros persistidos.   | Pendiente |               |
| OB04-03 | Media     | `pallets` se muestra como texto directo; si backend devuelve array, puede renderizar mal o poco útil.                                                 | Una columna operacional debe ser legible; un array crudo o `[object Object]` degrada la tabla.                        | `src/configs/entitiesConfig.js:371`                                      | Mostrar recuento/summary calculado o path específico estable.                  | Pendiente |               |
| OB04-04 | Media     | El listado comercial clona config admin y filtra exports por título, una dependencia frágil de texto visible.                                         | Cambiar un texto visible puede alterar permisos/acciones sin tocar lógica.                                            | `src/app/comercial/orders/page.js:5`                                     | Filtrar exports por `endpoint`/`id` estable en vez de `title`.                 | Pendiente |               |
| OB04-05 | Baja      | La ruta `/admin/orders` depende de `/admin/[entity]`; correcto, pero no hay archivo dedicado que oriente al lector.                                   | Los agentes pueden buscar un page específico y concluir erróneamente que la ruta no existe.                           | `src/app/admin/[entity]/page.js:1`                                       | Documentar esta resolución en contexto de pedidos.                             | Pendiente |               |
| OB04-06 | Baja      | `hideEditButton: true` empuja edición al gestor/detalle, pero no hay comentario explicando la decisión.                                               | Sin explicación, parece una omisión de CRUD en lugar de una decisión de producto.                                     | `src/configs/entitiesConfig.js:131`                                      | Añadir comentario breve: edición compleja vive en gestor/detalle.              | Pendiente |               |

---

## 4. Puntos fuertes

- `orders` tiene empty state, paginación, filtros por fecha, cliente, especie, producto, comercial, transporte e incoterm.
- Las exportaciones masivas están centralizadas en el config.
- Comercial reutiliza EntityClient en modo read-only y elimina selección masiva.
- La tabla cubre estado, tipo, peso, cajas, palets, importes, vendedor y logística.

---

## 5. Recomendaciones

1. Marcar `orders.createForm` como deprecated o eliminarlo si no se usa realmente.
2. Cambiar el filtro comercial de exports por una whitelist estable de `endpoint` o `id`, no por `title`.
3. Revisar el campo `pallets` de tabla para mostrar recuento o formato explícito.
4. Documentar que el CRUD estándar se limita al listado y exportaciones; la edición vive en el gestor.
5. Corregir `salespeple` a `salespeople` si no afecta compatibilidad.

---

## 6. Checks manuales sugeridos

- [ ] `/admin/orders`: filtrar por fecha, estado, cliente, producto y comercial.
- [ ] `/admin/orders`: seleccionar pedidos y lanzar cada exportación configurada.
- [ ] `/comercial/orders`: comprobar que no aparece crear, editar, seleccionar ni borrar.
- [ ] Click en una fila de comercial: debe navegar a `/comercial/orders/:id`.
- [ ] Verificar formato de columna `pallets` con pedidos que tengan varios palets.
