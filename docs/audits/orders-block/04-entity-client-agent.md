# Auditoría: EntityClient Agent
# Bloque: Pedidos - `/admin/orders` y `/comercial/orders`

**Fecha:** 2026-04-26
**Rol auditor:** EntityClient Agent
**Scope:** configuración EntityClient, filtros, rutas, tabla, acciones y exportaciones

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/app/admin/[entity]/page.js` | Resolver dinámico de entidad |
| `src/app/comercial/orders/page.js` | EntityClient read-only para comercial |
| `src/configs/entitiesConfig.js` | Config de entidad `orders` |
| `src/services/domain/orders/orderService.js` | Service usado por EntityClient |
| `src/configs/navgationConfig.js` | Entrada de navegación admin/comercial |

---

## 2. Resultado general

EntityClient está correctamente usado para el listado administrativo y comercial de pedidos. El gestor dedicado queda fuera de EntityClient, lo cual es adecuado porque tiene flujos complejos. La parte débil es que el config de `orders` mezcla listado, exportación masiva y un `createForm` aparentemente heredado que no es el camino real de creación, ya que `createRedirect` apunta al gestor.

### Nota global: **7.1 / 10**

---

## 3. Hallazgos

| Severidad | Hallazgo | Referencia |
|---|---|---|
| Media | `createRedirect` envía al gestor, pero `orders.createForm` sigue definido en el config. Puede inducir a agentes a editar un formulario que no se usa. | `src/configs/entitiesConfig.js:142`, `src/configs/entitiesConfig.js:381` |
| Media | El grupo de filtros tiene typo `salespeple`; puede afectar trazabilidad o tooling si se usan nombres de grupo. | `src/configs/entitiesConfig.js:297` |
| Media | `pallets` se muestra como texto directo; si backend devuelve array, puede renderizar mal o poco útil. | `src/configs/entitiesConfig.js:371` |
| Media | El listado comercial clona config admin y filtra exports por título, una dependencia frágil de texto visible. | `src/app/comercial/orders/page.js:5` |
| Baja | La ruta `/admin/orders` depende de `/admin/[entity]`; correcto, pero no hay archivo dedicado que oriente al lector. | `src/app/admin/[entity]/page.js:1` |
| Baja | `hideEditButton: true` empuja edición al gestor/detalle, pero no hay comentario explicando la decisión. | `src/configs/entitiesConfig.js:131` |

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

