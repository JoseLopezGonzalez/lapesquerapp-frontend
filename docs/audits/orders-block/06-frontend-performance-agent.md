# Auditoría: Frontend Performance Agent
# Bloque: Pedidos - listas, renders, queries y payloads

**Fecha:** 2026-04-26
**Rol auditor:** Frontend Performance Agent
**Scope:** tamaño de componentes, re-renders, carga de opciones, consultas, listas, palets y rentabilidad

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/components/Admin/OrdersManager/index.js` | Filtro/ordenado cliente y layout |
| `src/components/Comercial/CRM/ComercialOrdersManager.jsx` | Filtro/ordenado comercial |
| `src/hooks/useOrder.js` | Estado de detalle, opciones y mutaciones |
| `src/context/gestor-options/OrdersManagerOptionsContext.jsx` | Carga global de opciones |
| `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` | Búsqueda, vinculación y creación de palets |
| `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js` | Mapas y render de líneas |
| `src/hooks/useFieldOrders.ts` | Query keys field |
| `src/components/Field/FieldOrderExecutionPage.jsx` | Wizard operativo |

---

## 2. Resultado general

El bloque tiene varias optimizaciones correctas (`useMemo`, debounce, TanStack Query, query keys tenant-aware, Maps para opciones). Aun así, el coste de render y datos puede crecer rápido: el gestor carga todos los pedidos activos y filtra en cliente, comercial pide `perPage: 100`, el provider carga productos e impuestos completos al entrar al gestor, y varios componentes superan varios cientos de líneas.

### Nota global: **5.6 / 10**

---

## 3. Hallazgos

| Severidad | Hallazgo | Referencia |
|---|---|---|
| Alta | El gestor admin filtra y ordena todo `orders/active` en cliente. Si los activos crecen, cada búsqueda/categoría recorre el array completo. | `src/components/Admin/OrdersManager/index.js:178` |
| Alta | `OrdersManagerOptionsProvider` carga todas las opciones de productos e impuestos al entrar al gestor, incluso si el usuario solo consulta lista. | `src/context/gestor-options/OrdersManagerOptionsContext.jsx:31` |
| Media | Comercial carga pedidos con `perPage: 100` y ofertas con `perPage: 100`, luego enriquece y filtra en cliente. | `src/components/Comercial/CRM/ComercialOrdersManager.jsx:46`, `src/components/Comercial/CRM/ComercialOrdersManager.jsx:52` |
| Media | `useOrder` tiene múltiples estados y efectos; cualquier cambio de pedido arrastra análisis, opciones, palets, documentos e incidencias. | `src/hooks/useOrder.js:135` |
| Media | `OrderPallets` carga hasta 50 palets disponibles al abrir diálogo, con búsqueda y selección en estado local. Puede ser pesado en almacenes grandes. | `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js:224` |
| Media | Crear palet desde previsión vuelve a llamar `getProductOptions` aunque el gestor ya puede tener opciones cargadas. | `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js:480` |
| Baja | El formulario móvil usa animaciones por paso y por línea; puede afectar dispositivos de campo modestos aunque respeta reduced motion. | `src/components/Admin/OrdersManager/CreateOrderFormMobile.jsx:328` |

---

## 4. Puntos fuertes

- Búsqueda del gestor usa debounce de 300 ms.
- Muchas vistas usan `useMemo` para categorías, listas y contenido.
- Field usa query keys por tenant y operador.
- `OrderPlannedProductDetails` usa `Map` para buscar productos e impuestos.
- Análisis económico se carga lazy al entrar en tab `analysis`.

---

## 5. Recomendaciones

1. Mover filtros de gestor a backend o paginar `orders/active` si el volumen supera el uso actual.
2. Cargar opciones de productos/impuestos bajo demanda real o con cache compartida más granular.
3. Evitar `perPage: 100` fijo en comercial o documentar límite operativo.
4. Dividir `useOrder` en hooks internos por responsabilidad si se tocan nuevas features: detalle, líneas, documentos, palets, análisis.
5. Reutilizar opciones ya cargadas al crear palets desde previsión.

---

## 6. Checks manuales sugeridos

- [ ] Medir tiempos de interacción con 200, 500 y 1000 pedidos activos.
- [ ] Abrir gestor y comprobar número de peticiones iniciales.
- [ ] Abrir detalle y cambiar tabs: confirmar que análisis solo se pide al entrar en `analysis`.
- [ ] Abrir diálogo de vincular palets con almacén grande y comprobar latencia.
- [ ] Probar creación móvil en dispositivo de gama baja o throttling CPU.

