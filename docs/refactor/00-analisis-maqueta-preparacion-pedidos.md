# Análisis: maqueta Preparación de pedidos (OrquestadorView)

Este documento tiene **dos partes**:

- **Parte A — Refactor simple inicial (UI):** mejorar estructura y mantenibilidad de la maqueta sin cambiar comportamiento ni conectar backend.
- **Parte B — Plan de conversión maqueta → componente integrado:** qué hace falta para sustituir el mock por API real y **si los endpoints/servicios actuales son suficientes o hay que crear nuevos en backend**.

---

# Parte A — Refactor simple inicial (UI)

## A.1 Estructura actual

- **`src/components/Admin/Orquestador/OrquestadorView.jsx`** (~1136 líneas): un solo componente con tres pantallas (Impresión de etiquetas, Escanear etiquetas, Preparación de pedidos), dos AlertDialogs y un Dialog por pasos.
- **`src/data/mock/orquestador/`**: estado inicial mock (orders, pallets, products, availableBoxes, nextBoxId).

## A.2 Refactor UI recomendado (sin tocar backend)

Objetivo: **dividir por responsabilidades y reutilizar piezas**, manteniendo el estado mock y el flujo actual.

1. **Constantes y utilidades**
   - Mover a `constants.js`: `SCREENS`, `DATE_FILTER_OPTIONS`, `LABEL_FORMAT_OPTIONS`, `ORDER_EXPORT_DOCUMENTS`.
   - Mover a `utils.js`: `getLoadDateKey`, `filterOrdersByDate`, `statusBadgeVariant`, `lineStatusColor`.

2. **Subcomponentes por pantalla**
   - **EmisionScreen:** formulario izquierdo + card “Cajas” (tabla/empty) + footer (Limpiar, Imprimir, Agregar cajas). Recibe props (form, boxes, handlers).
   - **EscanearScreen:** input escaneo + tabla cajas escaneadas + footer (Volver, Crear palet). Recibe props (scannedBoxes, input, handlers).
   - **PreparacionScreen:** aside (lista pedidos activos + empty state) + main (placeholder o card detalle pedido con progreso, observaciones, descargas, palets, finalizar). Recibe props (orders, selectedOrder, pallets, handlers).

3. **Componentes reutilizables**
   - **CajasTable:** tabla de cajas (columnas Artículo, Lote, Peso neto; opcional columna “Quitar”) para emisión y escanear.
   - **AddCajasDialog:** el Dialog por pasos (pedido → modo → palet) ya existente, extraído a componente con props.
   - **ConfirmAlertDialog (opcional):** mismo patrón que “Finalizar” y “Vaciar lista”, con variante neutra/destructiva.

4. **OrquestadorView tras el refactor**
   - Mantiene un único estado mock y los handlers actuales (o los mueve a 1–2 hooks ligeros si se desea).
   - Renderiza: header con tabs +, según `activeScreen`, `<EmisionScreen />`, `<EscanearScreen />` o `<PreparacionScreen />`, más los diálogos.
   - El archivo principal se reduce a composición (~200–350 líneas), sin necesidad aún de hooks complejos ni de tocar backend.

No es obligatorio en esta fase extraer hooks (useEmisionForm, useAddCajasDialog, etc.); se puede dejar para cuando se integre con API.

---

# Parte B — Conversión maqueta → componente integrado

## B.1 Qué hace la maqueta (a sustituir por API)

| Funcionalidad | Maqueta (hoy) | Objetivo integrado |
|---------------|----------------|---------------------|
| Listado “Pedidos activos” | Filtra mock por `loadDate` (hoy/mañana) y `status === 'pending'` | Lista desde API con mismo criterio |
| Detalle de un pedido | Objeto `order` con `productProgress`, observaciones, etc. | Pedido desde API con progreso (plannedProductDetails + productionProductDetails) |
| Palets del pedido | Filtro en mock `pallets.filter(p => p.orderId === selectedOrderId)` | Palets del pedido desde API |
| Finalizar pedido | Actualiza `order.status` a `'finished'` en mock | Llamar a API para marcar pedido como terminado |
| Descargas (CMR, Nota de carga, etc.) | Toast simulado | Descarga real (PDF) desde API |
| Generar cajas (emisión) | Añade objetos a `availableBoxes` en mock | Crear cajas en backend y/o imprimir etiquetas |
| Escanear y crear palet | Añade cajas a lista, luego “Crear palet” crea palet en mock y actualiza progreso del pedido | Escanear → crear palet en API vinculado al pedido y actualizar progreso |
| Añadir cajas a pedido (nuevo palet / palet existente) | Toast simulado | Crear palet con cajas o añadir cajas a palet existente vía API |

## B.2 Endpoints y servicios existentes vs necesarios

Revisión según el código actual de la app (orderService, palletService, boxService, labelService, useOrder, etc.):

| Necesidad | Servicio / endpoint actual | ¿Suficiente? | Notas |
|-----------|----------------------------|--------------|--------|
| Listar pedidos “activos” para hoy/mañana | `getActiveOrders(token)` → `GET /api/v2/orders/active` | **Revisar** | El endpoint no recibe parámetros; devuelve “activos”. Si el backend ya filtra por fecha de carga (p. ej. solo hoy), el selector “Hoy / Mañana” podría requerir **parámetro de fecha** (ej. `?load_date=YYYY-MM-DD`) o filtrar en front con la lista completa. |
| Detalle de un pedido (con progreso y palets) | `getOrder(id, token)` → `GET /api/v2/orders/:id` | **Sí** | El pedido devuelve `plannedProductDetails` y `productionProductDetails` (progreso). Los palets del pedido se obtienen del contexto del gestor o listando palets con filtro por `orderId`. |
| Palets de un pedido | `palletService.list({ orderId })` (domain) o equivalente con filtros | **Sí** | El servicio de dominio permite listar con filtros; si el backend acepta `order_id` o similar, basta. |
| Finalizar pedido | `setOrderStatus(orderId, status, token)` → `PUT /api/v2/orders/:id/status` con `{ status: 'finished' }` | **Sí** | Ya existe. |
| Descargar documentos (CMR, Nota de carga, Letrero, etc.) | En useOrder: `GET /api/v2/orders/:id/:type/:documentName` (ej. `pdf/loading-note`) | **Sí** | Misma URL que en el gestor de pedidos; solo hace falta usar el mismo patrón en la vista de preparación. |
| Crear palet y vincularlo al pedido | `createPallet(palletData, token)` → `POST /api/v2/pallets`; `linkPalletToOrder(palletId, orderId, token)` → `POST /api/v2/pallets/:id/link-order` | **Revisar** | Crear palet existe. Falta ver si el cuerpo de creación admite `order_id` y **cajas** (boxes). Si el flujo real es “crear palet vacío + añadir cajas”, puede hacer falta un endpoint para **añadir cajas a un palet** o un flujo batch. |
| Vincular palet existente al pedido | `linkPalletToOrder` / `linkPalletsToOrders` | **Sí** | Ya usado en el gestor. |
| Listar “cajas disponibles” (sin palet) | `boxService.list(filters)` (domain) | **Revisar** | Si el modelo de negocio tiene “cajas disponibles” (sin asignar a palet), el backend debe permitir listar por estado o `pallet_id` null. Si no existe ese concepto en API, habría que definirlo. |
| Crear cajas (emisión de etiquetas) | `boxService.create(data)` (domain) | **Revisar** | Crear cajas una a una existe. Para “generar N cajas” (masivo o por promedio) podría bastar un loop de creates o hace falta un **endpoint batch** (ej. `POST /api/v2/boxes/batch`). |
| Impresión de etiquetas | `labelService` (getLabels, createLabel, etc.) | **Revisar** | El labelService actual parece más bien para “tipos de etiqueta”. La **impresión física** o la generación de PDF/impresión por lote puede ser otro endpoint (p. ej. imprimir etiquetas de unas cajas concretas). Conviene aclarar con backend. |
| “Añadir cajas a pedido” (nuevo palet) | Crear palet con `orderId` + cajas; o crear palet y luego asociar cajas | **Revisar** | Depende de si existe “crear palet con cajas” o “asignar cajas a palet”. Si no, podría hacer falta **endpoint para añadir cajas a un palet** (o batch de cajas a un palet). |
| “Añadir cajas a palet existente” | Actualizar palet con más cajas o endpoint “añadir cajas a palet” | **Revisar** | Igual que arriba: si el modelo es “palet tiene muchas cajas”, hace falta una forma en API de añadir cajas a un palet existente. |

## B.3 Resumen: ¿hay que crear endpoints en backend?

- **No hace falta nuevo endpoint para:**
  - Listar pedidos activos (si se acepta filtrar en front por `load_date` cuando la respuesta lo traiga, o si el backend ya devuelve solo “hoy”).
  - Detalle de pedido, progreso, descargas (CMR, Nota de carga, etc.), finalizar pedido, vincular palet a pedido.

- **Hay que aclarar o posiblemente crear en backend:**
  1. **Pedidos activos por fecha:** Si la vista debe mostrar “Hoy” y “Mañana” de forma nativa, el backend debería aceptar algo como `GET /api/v2/orders/active?load_date=YYYY-MM-DD` (o equivalente). Si no, el front puede filtrar por `load_date` sobre la respuesta de `orders/active` siempre que esa respuesta incluya `load_date`.
  2. **Flujo “generar cajas” (emisión):** Crear muchas cajas (producto, lote, pesos). ¿Solo `POST /boxes` en bucle o existe (o se creará) un **batch** de cajas?
  3. **Flujo “crear palet” desde preparación:** Tras escanear/añadir cajas, crear palet con `orderId` y esas cajas. ¿El `POST /pallets` acepta ya un array de cajas o solo datos del palet? Si no, ¿existe “añadir cajas a palet” (o “crear palet con cajas”)?
  4. **Flujo “añadir cajas a pedido” (nuevo palet / palet existente):** Mismo punto: si no hay forma de “crear palet con cajas” o “añadir cajas a palet”, haría falta **un endpoint** (o ampliar el existente) para ello.
  5. **Impresión de etiquetas:** Confirmar si la impresión de etiquetas de caja usa un endpoint concreto (p. ej. generación de PDF por lote o envío a impresora) o si se considera fuera de alcance en esta integración.

## B.4 Plan de conversión sugerido

1. **Refactor UI (Parte A)**  
   Aplicar el refactor simple: constantes, utils, EmisionScreen, EscanearScreen, PreparacionScreen, CajasTable, AddCajasDialog (y opcionalmente ConfirmAlertDialog). La maqueta sigue funcionando igual con mock.

2. **Definir contrato con backend**  
   Reunir con backend (o documentar) los puntos de “Revisar” de la tabla: filtro de fecha en activos, creación batch de cajas, creación de palet con cajas / añadir cajas a palet, impresión de etiquetas. Decidir qué endpoints existen ya y cuáles hay que crear o extender.

3. **Sustituir datos en Preparación de pedidos**  
   - Pedidos activos: llamar a `getActiveOrders` (y si existe, al nuevo parámetro de fecha) y, si hace falta, filtrar en front por `load_date`.  
   - Al seleccionar pedido: cargar detalle con `getOrder(id)` (ya trae progreso).  
   - Palets del pedido: `palletService.list({ order_id: selectedOrderId })` (o el filtro que exponga el backend).  
   - Finalizar: `setOrderStatus(orderId, 'finished', token)`.  
   - Descargas: mismo patrón que en useOrder (`GET orders/:id/:type/:documentName`).

4. **Sustituir flujos de cajas y palets**  
   Cuando backend tenga definido:  
   - Emisión: crear cajas (batch o en bucle) y, si aplica, llamar al endpoint de impresión.  
   - Escanear + Crear palet: crear palet (con o sin cajas) y vincular a pedido con `linkPalletToOrder`; si hace falta, llamar a “añadir cajas a palet”.  
   - “Añadir cajas a pedido”: según decisión de backend (nuevo palet con cajas o añadir a palet existente), usar los endpoints correspondientes.

5. **Eliminar mock**  
   Quitar `getInitialMockState` y estado local de la maqueta para esta vista; toda la data viene de los servicios anteriores.

---

## Resumen ejecutivo

- **Refactor simple (solo UI):** Extraer constantes, utils y tres pantallas (Emision, Escanear, Preparacion) más componentes reutilizables (CajasTable, AddCajasDialog). Sin cambios de backend ni de flujo de datos.
- **Conversión a integrado:** Con los servicios actuales **sí se puede** cubrir: listado activos (con posible filtro en front por fecha), detalle de pedido, progreso, palets del pedido, finalizar pedido y descargas. Para **generar cajas, crear palet con cajas y añadir cajas a pedido/palet** hace falta **aclarar o crear en backend** los endpoints (o extensiones) indicados en B.3.

Si quieres, el siguiente paso puede ser bajar al código y aplicar solo la **Parte A** (refactor UI) en el repo.
