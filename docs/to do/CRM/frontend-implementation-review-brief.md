# CRM Comercial Frontend — Resumen de Implementación para Revisión

## Objetivo de este documento

Este documento resume **lo que está actualmente implementado en el frontend** del CRM comercial en este repo Next.js, para que otro agente o revisor pueda comparar:

1. lo planeado en el plan original,
2. lo realmente implementado en frontend,
3. los huecos, simplificaciones o decisiones que conviene validar.

No describe backend Laravel salvo cuando el frontend depende directamente de su contrato.

---

## 1. Alcance implementado en frontend

Actualmente el área `/comercial` incluye:

- Dashboard comercial con bloque CRM integrado
- Prospectos:
  - listado
  - detalle
  - alta/edición
  - contactos
  - interacciones
  - conversión a cliente
- Ofertas:
  - listado
  - detalle
  - alta/edición
  - envío por PDF / email / WhatsApp text
  - aceptación / rechazo / expiración
  - creación de pedido desde oferta aceptada
- Clientes:
  - listado
  - detalle simplificado solo lectura
  - interacciones
  - ofertas
  - historial de pedidos
- Pedidos del comercial:
  - ruta propia `/comercial/pedidos`
  - reutilización del `OrdersManager`
  - detalle en modo solo lectura
  - creación de pedido permitida
  - relación visible con oferta cuando existe

El área comercial sigue reutilizando:

- `ResponsiveLayout`
- navegación filtrada por rol
- React Query tenant-aware
- `fetchWithTenant`
- patrones visuales de `OrdersManager`

---

## 2. Rutas y navegación implementadas

### Rutas activas del rol comercial

- `/comercial`
- `/comercial/autoventa`
- `/comercial/prospectos`
- `/comercial/prospectos/create`
- `/comercial/prospectos/[id]`
- `/comercial/clientes`
- `/comercial/clientes/[id]`
- `/comercial/ofertas`
- `/comercial/ofertas/create`
- `/comercial/ofertas/[id]`
- `/comercial/pedidos`

### Navegación

Se añadieron en `navgationConfig.js`:

- `Prospectos`
- `Clientes`
- `Ofertas`
- `Pedidos`

Y en `roleRoutesConfig.js`:

- `prospects`
- `prospectsCreate`
- `customers`
- `offers`
- `offersCreate`
- `orders`

### Comportamiento mobile

El `BottomNav` mantiene la limitación de 4 items + botón central:

- visibles en barra: `Inicio`, `Autoventa`, `Prospectos`, `Clientes`
- `Ofertas` y `Pedidos` quedan accesibles vía `NavigationSheet`

Esto coincide con la priorización pensada para mobile.

---

## 3. Capa de datos y contratos frontend

### Tipos nuevos

Se creó:

- `src/types/crm.ts`

Incluye:

- enums / unions:
  - `ProspectStatus`
  - `ProspectOrigin`
  - `CommercialInteractionType`
  - `CommercialInteractionResult`
  - `OfferStatus`
  - `OfferSendChannel`
- tipos de dominio:
  - `Prospect`
  - `ProspectContact`
  - `CommercialInteraction`
  - `Offer`
  - `OfferLine`
  - `CrmDashboardData`
- respuestas normalizadas:
  - `CrmWriteResponse<T>`
  - `CrmPaginatedResponse<T>`

### Servicio CRM

Se creó:

- `src/services/crmService.ts`

Expone consumo para:

- dashboard CRM
- prospectos
- contactos de prospecto
- interacciones comerciales
- ofertas
- PDF / email / WhatsApp text
- create-order desde oferta

### Hooks React Query nuevos

Se crearon:

- `useCrmDashboard`
- `useProspectsList`
- `useProspect`
- `useProspectContacts`
- `useProspectMutations`
- `useCommercialInteractions`
- `useCommercialInteractionMutations`
- `useOffersList`
- `useOffer`
- `useOfferMutations`
- `useComercialOrders`

### Comportamiento importante

- Los hooks invalidan dashboard, listados y detalles relevantes tras mutaciones
- `useComercialOrders` normaliza `order.offerId` desde el recurso de pedidos
- Se mantiene fallback defensivo por lookup de ofertas por `orderId` en pedidos, pero ya no es la fuente principal

---

## 4. Dashboard comercial implementado

### Estado actual

El dashboard comercial (`ComercialDashboard`) ahora renderiza:

1. saludo inicial
2. bloque CRM nuevo:
   - `Agenda del día`
   - `Clientes inactivos`
   - `Prospectos sin actividad`
3. grid de métricas existentes:
   - `TotalQuantitySoldCard`
   - `TotalAmountSoldCard`
4. masonry:
   - `OrderRankingChart`
   - card resumen personal del comercial
   - `TransportRadarChart`

### Sustitución aplicada

Se sustituyó `SalesBySalespersonPieChart` por:

- `CommercialSalesSummaryCard`

Razón:

- para un único usuario comercial el pie chart de todos los comerciales no era útil

### Agenda CRM

La agenda usa:

- `GET /api/v2/crm/dashboard`

Y mezcla correctamente:

- recordatorios de prospectos
- recordatorios de interacciones

### Resolución de agenda implementada

#### Items de prospecto

Tienen:

- navegar al prospecto
- `Aplazar` usando `schedule-action`
- `Descartar` usando `DELETE next-action`

#### Items de interacción

Tienen:

- navegación al target
- CTA de `Registrar seguimiento`
- apertura de `QuickInteractionModal` precargado con:
  - `prospectId` o `customerId`
  - fecha de próxima acción previa

No se intenta editar la interacción existente, porque el backend V1 no lo soporta.

### Estados vacíos

Se implementaron estados vacíos útiles para:

- agenda sin tareas
- clientes inactivos vacíos
- prospectos sin actividad vacíos

---

## 5. Prospectos implementados

### Rutas y vistas

Implementado:

- `/comercial/prospectos`
- `/comercial/prospectos/create`
- `/comercial/prospectos/[id]`

### Lista de prospectos

Componente:

- `ProspectsPageClient`

Patrón usado:

- cards + master-detail en desktop
- navegación full-screen en mobile

Filtros implementados:

- búsqueda por empresa
- tabs por estado:
  - `all`
  - `new`
  - `following`
  - `offer_sent`
  - `discarded`

Orden aplicado:

- próxima acción ascendente
- sin fecha al final

### Alta / edición

Componente:

- `ProspectFormSheet`

Campos implementados:

- `companyName`
- `countryId`
- `origin`
- `speciesInterest`
- `commercialInterestNotes`
- `notes`
- `nextActionAt`
- contacto principal inline:
  - nombre
  - cargo
  - teléfono
  - email

### Warnings de duplicados

El frontend respeta el contrato del backend:

- no bloquea guardado
- muestra `warnings` si existen

### Ficha de prospecto

Componente:

- `ProspectDetail`

Tabs implementados:

- `Datos`
- `Contactos`
- `Interacciones`
- `Ofertas`

### Acciones de prospecto

Implementadas:

- editar
- nueva interacción
- convertir a cliente
- descartar con motivo

Restricciones aplicadas:

- `Convertir a cliente` solo visible si `status === offer_sent`
- `Descartar` exige `lostReason`

### Contactos del prospecto

Actualmente hay soporte para:

- crear
- editar
- borrar
- marcar principal

El formulario de contacto está integrado en la pestaña `Contactos`.

No se montó un `Sheet` separado; se resuelve inline dentro de la ficha.

### Interacciones del prospecto

Se muestran listadas cronológicamente usando:

- `useCommercialInteractions({ prospectId })`

Y se pueden crear con:

- `QuickInteractionModal`

### Ofertas del prospecto

Se muestran usando:

- `useOffersList({ prospectId })`

Y el CTA:

- navega a `/comercial/ofertas/create?prospectId=X`

---

## 6. QuickInteractionModal implementado

Componente:

- `src/components/Comercial/CRM/QuickInteractionModal.jsx`

### Soporte actual

Permite crear interacción sobre:

- prospecto
- cliente

Campos implementados:

- tipo
- fecha
- resumen
- resultado
- próxima acción nota
- próxima acción fecha

### Regla importante implementada

Se puede limpiar la próxima acción:

- dejando `nextActionAt = null`

Esto está soportado explícitamente en la UI con el botón:

- `Sin próxima acción`

---

## 7. Ofertas implementadas

### Rutas y vistas

Implementado:

- `/comercial/ofertas`
- `/comercial/ofertas/create`
- `/comercial/ofertas/[id]`

### Lista de ofertas

Componente:

- `OffersPageClient`

Patrón:

- cards + master-detail en desktop
- full-screen en mobile

Filtros:

- búsqueda
- tabs por estado:
  - `all`
  - `draft`
  - `sent`
  - `accepted`
  - `rejected`
  - `expired`

### Alta / edición de oferta

Componente:

- `OfferFormSheet`

Permite:

- target exclusivo `prospect` o `customer`
- target fijo desde `?prospectId=...`
- contexto del prospecto precargado cuando aplica
- condiciones:
  - incoterm
  - payment term
  - currency
  - valid until
  - notes
- líneas:
  - productId
  - description
  - quantity
  - unit
  - unitPrice
  - taxId
  - boxes

### Ficha de oferta

Componente:

- `OfferDetail`

Tabs implementados:

- `Oferta`
- `Envío`

### Acciones de oferta implementadas

#### `draft`

- editar
- enviar

#### `sent`

- aceptar
- rechazar
- expirar

#### `accepted`

- crear pedido

#### `draft | sent | rejected`

- expirar

### Envío de oferta

Se ajustó para respetar el brief backend v2:

#### PDF / WhatsApp

Usan:

- `crmService.sendOffer(id, { channel })`

#### Email

Usa:

- `crmService.sendOfferEmail(id, { email, subject })`

Esto ya no comparte incorrectamente el flujo genérico de `/send`.

### PDF y WhatsApp

Implementado:

- descarga de PDF
- obtención/copia del texto WhatsApp

### Restricción create-order

Antes de crear pedido desde una oferta aceptada, el frontend valida que cada línea tenga:

- `productId`
- `taxId`
- `boxes`

Si falta alguno:

- bloquea el submit
- muestra aviso claro
- permite volver a editar la oferta

Además:

- cada línea incompleta se marca visualmente en la ficha

### plannedProducts extra

La UI aclara explícitamente que:

- `plannedProducts` extra solo añade líneas nuevas
- no corrige líneas incompletas de la oferta

---

## 8. Clientes implementados

### Rutas y vistas

Implementado:

- `/comercial/clientes`
- `/comercial/clientes/[id]`

### Lista de clientes

Componente:

- `CustomersPageClient`

Patrón:

- cards + master-detail desktop
- full-screen mobile

Fuente principal:

- `useCustomersList`

### Ficha de cliente

La ficha del comercial es propia y simplificada.

No reutiliza la edición admin.

Tabs implementados:

- `Datos`
- `Pedidos`
- `Interacciones`
- `Ofertas`

### Restricción funcional

El comercial trata clientes en modo solo lectura:

- no hay edición de `Customer`
- sí hay nueva interacción

### Historial de pedidos del cliente

Se obtiene mediante:

- `getCustomerOrderHistory`

### Interacciones del cliente

Se obtienen mediante:

- `useCommercialInteractions({ customerId })`

### Ofertas del cliente

Se obtienen mediante:

- `useOffersList({ customerId })`

---

## 9. Pedidos del comercial implementados

### Ruta

Implementado:

- `/comercial/pedidos`

### Enfoque

Se reutiliza el gestor de pedidos existente con una adaptación específica:

- `ComercialOrdersManager`

### Hook propio

Se creó:

- `useComercialOrders`

Razón:

- no reutilizar `useOrders` basado en `orders/active`
- consumir el recurso de pedidos del comercial de forma separada

### Relación pedido <-> oferta

El frontend ya usa:

- `order.offerId` cuando viene en el recurso de pedido

Y mantiene fallback:

- lookup por ofertas con `orderId`

pero solo como compatibilidad defensiva.

### Detalle del pedido

Se reutiliza `Order`, pero ahora soporta:

- `readOnly`

### Ajustes de solo lectura implementados

En modo comercial:

- se oculta edición
- se ocultan acciones destructivas
- en mobile ya no se puede cambiar:
  - estado
  - temperatura

### Enlace visible a oferta

Si el pedido tiene `offerId`, el detalle muestra:

- enlace a `/comercial/ofertas/[offerId]`

### Badge de origen

Las cards del listado muestran:

- `Desde oferta`

cuando existe `offerId`

---

## 10. Componentes y utilidades CRM creados

### Componentes nuevos principales

En `src/components/Comercial/CRM/`:

- `CommercialSalesSummaryCard`
- `CrmDashboardWidgets`
- `StatusPill`
- `QuickInteractionModal`
- `ProspectFormSheet`
- `ProspectDetail`
- `ProspectsPageClient`
- `OfferFormSheet`
- `OfferDetail`
- `OffersPageClient`
- `CustomersPageClient`
- `ComercialOrdersManager`
- `utils.js`

### Reutilización de componentes existentes

Se sigue usando el design system y primitives actuales:

- `Card`
- `Tabs`
- `Sheet`
- `Dialog`
- `ScrollArea`
- `Input`
- `Textarea`
- `Select`
- `Button`
- `Empty`

---

## 11. Estado actual respecto al plan original

### Lo que sí está cubierto

- navegación CRM completa dentro de `/comercial`
- capa de datos CRM reutilizable
- dashboard CRM con agenda y alertas
- prospectos con ficha rica
- quick interactions
- ofertas con ciclo de vida principal
- create-order desde oferta
- clientes propios del comercial
- ruta propia de pedidos del comercial
- ocultación de acciones no permitidas en detalle de pedido

### Decisiones de implementación relevantes

#### 1. Contactos de prospecto

Se resolvieron inline en la ficha, no con `Sheet` separado.

#### 2. Agenda de interacciones

Los recordatorios de interacción no se editan; se resuelven creando seguimiento nuevo.

Esto está alineado con el backend V1.

#### 3. Pedidos desde oferta

Se fuerza validación preventiva en frontend antes de llamar a backend.

#### 4. Pedidos comerciales

Se sigue reutilizando `OrdersManager` existente en vez de crear una UI nueva.

---

## 12. Huecos o simplificaciones que conviene revisar

### 1. Contactos del prospecto

Hay CRUD completo funcional, pero no un patrón más pulido tipo `Sheet` separado por contacto.

### 2. Create-order desde oferta

El formulario es pragmático:

- entrada manual de campos principales
- `plannedProducts` extra en JSON

Funcionalmente sirve, pero la UX puede refinarse.

### 3. Pedidos comerciales

El detalle es read-only, pero el listado sigue apoyándose visualmente en el gestor general.

Si se quisiera una experiencia más “CRM-first”, habría que rediseñarlo aparte.

### 4. Verificación completa

Se pasó lint focalizado sobre los archivos tocados.

Quedan warnings de `<img>` en componentes de pedidos heredados.

No se dejó documentado aquí un build completo verificado end-to-end.

---

## 13. Juicio rápido sobre la implementación

### Lo que parece bien alineado

- estructura general del área comercial
- contratos de servicios/hooks CRM
- separación por rutas dentro de `/comercial`
- agenda mixta prospectos/interacciones
- uso correcto de `/send` vs `/email` en ofertas
- restricción visual del rol comercial en pedidos
- aprovechamiento de `order.offerId`

### Lo que merece revisión funcional

- si la UX elegida para create-order desde oferta es suficiente
- si contactos inline es el patrón deseado o se prefiere `Sheet`
- si el fallback defensivo por `offers?orderId=` debe mantenerse o retirarse

### Lo que no parece un bloqueo

- detalles visuales finos del CRM
- warnings de optimización de imágenes heredadas
- ausencia de edición de interacciones

Esto último es coherente con la V1 backend-first.

---

## 14. Preguntas concretas para el agente revisor

Puedes pedirle que revise específicamente:

1. Si la separación entre `sendOffer` y `sendOfferEmail` refleja bien el contrato backend esperado.
2. Si la resolución de agenda vía “nuevo seguimiento” para interacciones es la decisión correcta en V1.
3. Si la validación preventiva de `create-order` desde oferta está en el lugar correcto y con el nivel correcto de rigidez.
4. Si el CRUD inline de contactos de prospecto es suficiente o debería migrar a un patrón más estructurado.
5. Si el uso de `order.offerId` con fallback por lookup adicional es una compatibilidad razonable o una deuda innecesaria.
6. Si el nivel actual de integración del `OrdersManager` para `/comercial/pedidos` es suficiente para considerar el flujo bien resuelto.
