# Maquila / Producciones a Terceros — Especificación Completa

**Estado del documento:** Vivo. Es la fuente única de verdad de este bloque nuevo; se actualiza en
cada STEP del workflow de evolución (CLAUDE.md §18) en vez de crear documentos nuevos dispersos.
**Fase actual del bloque:** STEP 0a, STEP 0, STEP 1 y STEP 2 (núcleo operativo, §11, con las
correcciones de auditoría de §12 incorporadas) completados. **STEP 3 (implementación) del núcleo
operativo completado el 2026-08-12** — ver §13 para el detalle por pieza y §18 para gaps conocidos
documentados explícitamente (no implementados en silencio). La facturación de servicios de maquila
(§15) sigue sin empezar STEP 2 propio. **Adjuntos de recepción/producción y no-mezcla de
propietarios a nivel de lote completados el 2026-08-13** — ver §23. STEP 4/5 (rating, evolution log)
siguen pendientes a petición explícita del usuario, tras revisión general del código de esta sesión.
**Simulación de circuitos de negocio end-to-end iniciada el 2026-08-13** — ver §25 (circuito 1:
portal del cliente de maquila, dashboard/almacén/producciones/pedidos), documentado y confirmado por
el usuario. **Documentación de consumo para el frontend creada el 2026-08-13** en
[`docs/maquila/frontend/`](./frontend/00-index.md) — carpeta viva, separada de este documento
maestro: aquí vive el diseño/historial de decisiones, allí vive la referencia pantalla-por-pantalla
para implementar y mantener el frontend del portal (qué endpoint llamar, shape real verificado en
código, qué está implementado vs pendiente, y un changelog de discrepancias
`frontend/99-pendientes-y-gaps.md`). Al escribir esa carpeta se encontró un hallazgo real de
prioridad alta: el detalle de pedido del portal expone hoy precio/coste/margen de la venta a
clientes finales del cliente de maquila, sin recortar — contradice la decisión de negocio de §25.7
(ver `frontend/99-pendientes-y-gaps.md`).
**Última actualización:** 2026-08-13.

---

## 0. ⚠️ CORRECCIÓN DE TERMINOLOGÍA (2026-08-12, post-implementación de STEP 3)

**Error de diseño descubierto y corregido tras implementar STEP 3.** Todo este documento, desde su
redacción original (STEP 0a/STEP 2, secciones §1 a §17), confundió dos relaciones de negocio
opuestas y las modeló con la **misma entidad** (`ExternalProcessor`, tabla `external_processors`):

- **`ExternalProcessor` (bloque anterior, ya existía antes de este bloque de maquila, ver
  `docs/catalogos/55-transformadores-externos-maquiladores.md` §1):** una empresa externa que
  **procesa PARA NOSOTROS** — le mandamos producto, ella lo transforma, nos lo devuelve. Nosotros
  somos el cliente en esa relación. Esta entidad y todo lo construido sobre ella
  (`Order.external_processor_id`, `Order.maquilador_destination`,
  `PDFController::generateMaquiladorCMR/OrderSigns`,
  `OrderMailerService::sendMaquiladorDocuments()`, `ExternalProcessorController` CRUD) es correcto
  tal cual y **no se ha tocado**.
- **El bloque de maquila que describe el resto de este documento** es la relación **opuesta**: un
  tercero (su cliente) nos envía **SU** mercancía para que **NOSOTROS** la procesemos — nosotros
  somos el maquilador. §1-§17 de este documento reutilizaban por error `ExternalProcessor` para
  representar a ese tercero, cuando en realidad necesita una entidad completamente distinta.

**Corrección aplicada durante STEP 3:** se creó una entidad nueva y separada, **`TollClient`**
(tabla `toll_clients`), para representar al cliente de maquila. Dondequiera que §1-§17 de este
documento diga `ExternalProcessor`/`external_processor_id` refiriéndose al **cliente que nos manda
mercancía para procesar**, léase `TollClient`/`toll_client_id` — esas secciones documentan el
_diseño_ (STEP 0a/STEP 2, ya aprobado y superado por la implementación) y no se han reescrito línea
a línea; **§18 (STEP 3, implementación real) usa la terminología ya corregida y es la referencia
autoritativa de qué existe en código.** `Order` tiene ahora **dos campos distintos y no
relacionados**: `external_processor_id` (bloque anterior, sin cambios) y `toll_client_id` (nuevo,
este bloque, "el maquilador vende a los clientes de su cliente de maquila", §5.4 vía 1).

---

## 1. Resumen ejecutivo

**Maquila** es un nuevo bloque funcional del ERP para gestionar producciones/procesamiento por
encargo de terceros (_toll manufacturing_). Un **cliente de maquila** (empresa externa) nos envía
mercancía —materia prima o producto ya terminado/intermedio— que **no es propiedad del tenant**.
Nosotros la recibimos, almacenamos, transformamos (proceso productivo habitual) y expedimos, bien
de vuelta al propio cliente, bien directamente a los clientes de ese cliente. El cliente de maquila
tiene un portal con visibilidad en tiempo real de su stock, trazabilidad de producción y pedidos.

No es un módulo aislado: es una **capa de propiedad de terceros** que atraviesa cuatro bloques ya
consolidados del CORE (rating ≥ 9/10): Recepción de Materia Prima (A.4), Inventario/Stock (A.3),
Producción (A.6) y Ventas (A.2), más el bloque en revisión de Usuarios Externos (A.21). El diseño
prioriza siempre extender lo existente sobre construir estructuras paralelas.

---

## 2. Contexto de negocio (idea original)

Documento de origen con la idea a groso modo del usuario: [`docs/nuevo_sistema_completo_maquila.md`](../nuevo_sistema_completo_maquila.md).

Flujo de negocio narrado:

1. **Recepción de producto**: materia prima, o producto ya terminado/intermedio (para terminar de
   producir o unir con mercancía ya producida y expedir en conjunto). Puede llegar mezclado con
   materia prima propia del tenant en la misma recepción.
2. **Gestión de stock**: los palets viven físicamente en los almacenes habituales del tenant, pero
   el cliente de maquila solo ve un "almacén virtual" con su nombre, donde aparecen únicamente sus
   unidades. Los palets tienen propiedad intrínseca heredada de su recepción de origen.
3. **Producción**: transformación con el proceso habitual, registrada en lotes de producción cuyos
   diagramas de trazabilidad son visibles para el cliente de maquila.
4. **Expedición**, de dos formas posibles:
   - Retorno de la mercancía al cliente de maquila una vez terminada (o sin procesar, ver más abajo).
   - Expedición a los clientes del cliente de maquila, con un sistema de pedidos similar al actual,
     donde el cliente de maquila puede ver estado, añadir y editar cabeceras y datos — pero nunca
     la vinculación de palets ni nada relativo a producción, que es exclusivo del tenant.
5. **Incidencias**: pueden darse en recepción, en expediciones (incluyendo retorno parcial o total
   de la mercancía a nuestro poder), y devoluciones de mercancía sin procesar al cliente de maquila.

---

## 3. Terminología específica del bloque

> ⚠️ Ver §0: `ExternalProcessor` en esta tabla (redactada en STEP 0a) fue una elección de modelo de
> datos errónea, corregida durante STEP 3 con la entidad nueva `TollClient`. La tabla se conserva
> tal cual se aprobó en su momento; el nombre de clase correcto y ya implementado es `TollClient`.

| Término                         | Significado                                                                                                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cliente de maquila / Maquilador | Empresa externa dueña de la mercancía procesada. Modelo: ~~`ExternalProcessor`~~ → **`TollClient`** (§0).                                                                                                            |
| Portal de maquila               | Acceso externo del cliente de maquila al ERP, vía `ExternalUser` (`type = maquilador`).                                                                                                                              |
| Almacén virtual                 | Vista filtrada de los almacenes reales del tenant, mostrando solo las unidades de un cliente concreto. Ya implementado para el caso general de usuarios externos vía `Store.external_user_id` + `ActorScopeService`. |
| Propiedad de palet              | El propietario (tenant o un `TollClient` concreto) de un palet, heredado de su recepción de origen. Implementado en STEP 3 — ver §18.2.                                                                              |
| Devolución sin procesar         | Mercancía que vuelve al cliente de maquila sin haber pasado por producción.                                                                                                                                          |

---

## 4. Qué reutilizamos del sistema existente (verificado en código, 2026-08-11)

Este bloque **no es greenfield**. Ya existe infraestructura parcial construida para otro propósito
(catálogo de transformadores externos, docs/catalogos/55) directamente reutilizable:

| Pieza                                                                                                                 | Estado real                                                                                           | Archivo                                                                     |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `ExternalProcessor` (ficha de empresa maquiladora)                                                                    | ✅ Implementado, CRUD completo                                                                        | `app/Models/ExternalProcessor.php`                                          |
| `ExternalUser` con `type = maquilador`                                                                                | ✅ Implementado (auth Sanctum + magic link)                                                           | `app/Models/ExternalUser.php`                                               |
| `Order.external_processor_id` + `maquilador_destination`                                                              | ✅ Implementado (pedido que sale desde la fábrica del maquilador)                                     | migración `2026_06_25_120000_add_external_processor_id_to_orders_table.php` |
| `Store.external_user_id` + `ActorScopeService::scopeStores/scopePallets/allowedStoreIds()`                            | ✅ Implementado (mecanismo de "almacén virtual", hoy usado para el caso general de usuarios externos) | `app/Services/ActorScopeService.php`                                        |
| `Production::buildFilteredProcessTree(?customerId, ?orderId)`                                                         | ✅ Implementado (filtra el árbol de trazabilidad)                                                     | modelo `Production`                                                         |
| `Incident` (belongsTo `Order`, estados `open`/`resolved`, resoluciones `returned`/`partially_returned`/`compensated`) | ✅ Implementado, solo para pedidos                                                                    | `app/Models/Incident.php`                                                   |
| `ExternalUser.external_processor_id`                                                                                  | ❌ No implementado (previsto como "Paso 2" en docs/catalogos/55)                                      | —                                                                           |
| `Store.external_processor_id`                                                                                         | ❌ No implementado (previsto como "Paso 3" en docs/catalogos/55)                                      | —                                                                           |
| `Pallet.external_processor_id` (propiedad)                                                                            | ❌ No implementado                                                                                    | —                                                                           |
| `RawMaterialReception` ↔ `ExternalProcessor`                                                                          | ❌ No implementado                                                                                    | —                                                                           |

---

## 5. Lógica de negocio detallada

> Esta sección se irá ampliando en STEP 0 (comportamiento actual/objetivo detallado, estados y
> transiciones exactas). Por ahora recoge el diseño de alcance acordado.

### 5.1 Recepción

- Se reutiliza **el mismo modelo `RawMaterialReception`**, sin distinguir a nivel de recepción si el
  producto es materia prima o producto ya terminado/intermedio — esa distinción ya vive en
  `Product`/`ProductCategory`, no hace falta duplicarla.
- Decisión pendiente de detallar en STEP 0: cómo se marca que una recepción (o sus palets
  resultantes) pertenece a un `ExternalProcessor` en vez de ser materia prima propia del tenant.

### 5.2 Stock

- Los palets de maquila viven en los almacenes físicos habituales; el cliente solo ve su "almacén
  virtual" — mecanismo ya existente (`Store.external_user_id` + `ActorScopeService`), a extender
  con `external_processor_id` para separar "quién tiene acceso" de "de quién es la mercancía".
- **Decisión de negocio confirmada**: no se permite mezclar propietarios distintos dentro de un
  mismo palet/lote de producción. Un lote/palet de producción contiene inputs de un único
  propietario (el tenant, o un `ExternalProcessor` concreto).

### 5.3 Producción

- Proceso productivo habitual, sin cambios en la mecánica de transformación en sí.
- El diagrama de trazabilidad ya es filtrable por cliente/pedido (`buildFilteredProcessTree`); se
  extenderá para filtrar también por `external_processor_id` vía el origen del input.

### 5.4 Expedición — dos vías distintas

| Vía                                                                         | Cuándo aplica                                                    | Entidad                                        | Estado                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| El maquilador vende a **sus propios clientes**                              | Pedido con datos comerciales reales (cliente final, precios)     | `Order` + `external_processor_id`              | ✅ Ya implementado a nivel de dato; falta el matiz de permisos del portal (§5.6) |
| Devolvemos la mercancía **al propio maquilador** (terminada o sin procesar) | No es una venta — es la devolución de la propiedad de un tercero | `ExternalProcessorReturn` (nombre provisional) | ❌ Propuesto, no implementado — ver §6.3                                         |

No se usa `Order` para la devolución al propio maquilador porque `orders.customer_id` es una FK
obligatoria (no nullable) — `Order` asume siempre una venta con `Customer` real detrás (comercial,
precios, transporte). Forzar la devolución en `Order` implicaría crear un `Customer` ficticio por
cada `ExternalProcessor` o volver nullable un campo obligatorio en un bloque consolidado (A.2
Ventas, 9/10) — ambas opciones descartadas.

Una sola entidad (`ExternalProcessorReturn`) cubre tanto "devolver mercancía terminada" como
"devolver sin procesar": la diferencia está implícita en el estado de los palets adjuntados en el
momento del envío (`PROCESSED` si pasaron por producción, `STORED` si no), sin necesidad de un
campo `type` explícito.

### 5.5 Incidencias

Pueden darse en tres puntos: recepción, expedición hacia clientes del maquilador (`Order`), y
devolución al propio maquilador (`ExternalProcessorReturn`). Se reutiliza el modelo `Incident`
existente (estados y tipos de resolución ya encajan), convirtiéndolo en polimórfico — ver §6.4.

**Decisión sobre `resolution_type` (confirmada, #7 en §7):** se mantiene informativo, igual que
hoy. Resolver una incidencia como `returned`/`partially_returned` **no mueve stock por sí mismo** —
los palets siguen apareciendo como inventario nuestro. El movimiento real (`Pallet` → `SHIPPED`,
salida efectiva de nuestro stock) ocurre cuando se ejecuta la `ExternalProcessorReturn`
correspondiente. Para que quede trazado, `Incident` debería poder referenciar opcionalmente la
`ExternalProcessorReturn` que la resuelve (campo nullable, sin obligar a crearla en el momento de
resolver). Esto es coherente con el comportamiento ya existente hoy en `Order`: la incidencia
documenta el acuerdo, un paso operativo aparte mueve el palet.

### 5.6 Portal del cliente de maquila — permisos

**Decisión de negocio confirmada (v1):**

- **Lectura completa** de: stock (su almacén virtual), trazabilidad de producción (diagramas
  filtrados), estado de pedidos e incidencias.
- **Gestión de cabeceras de pedido** hacia sus propios clientes: puede crear/editar cabeceras y
  datos generales de `Order` cuando `external_processor_id` le corresponde.
- **Excluido explícitamente**: vinculación de palets a pedidos, y todo lo relativo a producción
  (creación/edición de `Production`, `ProductionRecord`, inputs/outputs) — exclusivo del tenant.

Esto requiere reglas de permiso más finas que las actuales en `ActorScopeService`/Policies (hoy
pensadas para acceso genérico de usuario externo, no para este matiz de "edita cabecera, no
producción"). Pendiente de diseño en STEP 2.

---

## 6. Modelo de datos

### 6.1 Entidades reutilizadas sin cambios

`ExternalProcessor`, `Production`, `ProductionRecord`, `ProductionInput`, `ProductionOutput`,
`ProductionOutputConsumption`, `Customer` (para pedidos hacia clientes del maquilador).

### 6.2 Entidades a extender (propuesto, no implementado)

| Entidad                | Campo propuesto                                                                  | Propósito                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ExternalUser`         | `external_processor_id` (nullable FK)                                            | Vincular el usuario a la empresa maquiladora (ya previsto en docs/catalogos/55 como "Paso 2")               |
| `Store`                | `external_processor_id` (nullable FK)                                            | Separar "quién tiene acceso" (`external_user_id`) de "de quién es la mercancía" (ya previsto como "Paso 3") |
| `Pallet`               | `external_processor_id` (nullable FK)                                            | Propiedad del palet, heredada de la recepción de origen                                                     |
| `RawMaterialReception` | vínculo opcional a `ExternalProcessor`                                           | Marcar recepción de maquila vs. recepción propia                                                            |
| `Order`                | (sin campo nuevo; ya tiene `external_processor_id`)                              | Falta solo el matiz de permisos del portal (§5.6)                                                           |
| `Incident`             | `incidentable_type` / `incidentable_id` (sustituye `order_id` como FK exclusiva) | Reutilizable en recepción y en `ExternalProcessorReturn` — ver §6.4                                         |

### 6.3 Entidad nueva propuesta: `ExternalProcessorReturn`

Cubre la devolución de mercancía (terminada o sin procesar) al cliente de maquila.

| Campo (propuesto)        | Tipo                                                      | Notas                                                                                                                      |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `external_processor_id`  | FK obligatoria                                            | Quién recibe la devolución                                                                                                 |
| pallets asociados        | relación N:M (mismo patrón pivote que `Order` ↔ `Pallet`) | Debe validarse que cada palet pertenezca a ese `external_processor_id`                                                     |
| `transport_id`           | FK nullable                                               | Transporte utilizado                                                                                                       |
| fecha, documento/albarán | —                                                         | Por definir formato exacto en STEP 2                                                                                       |
| estado                   | enum simple                                               | Reutiliza la máquina de estados de `Pallet` (`STORED`/`PROCESSED` → `SHIPPED`), igual que `Order::finalizeAfterIncident()` |

Nombre, tabla y campos exactos son una propuesta de STEP 0a — sujetos a aprobación explícita en
STEP 2 antes de generar migraciones.

### 6.4 `Incident` → polimórfico (riesgo de migración)

`Incident.order_id` es hoy FK obligatoria con datos reales de producción (A.2 Ventas). Migración
necesaria en STEP 3:

1. Añadir `incidentable_type` / `incidentable_id` nullable.
2. Backfill de filas existentes (`incidentable_type = Order::class`, `incidentable_id = order_id`).
3. Revisar todo lo que asume `Incident belongsTo Order` (`Order::incidents()`, controllers,
   policies, resources, tests) para no romper el flujo de pedidos actual.
4. Decidir si `order_id` se conserva como columna de conveniencia o se retira tras la migración.

No se aborda hasta STEP 3, con tests de regresión sobre el flujo de incidencias de pedidos ya
existente antes de tocar nada.

---

## 7. Decisiones de negocio confirmadas (registro)

| #   | Decisión                                                                                                                                                                                                                                                                 | Fecha      | Motivo                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No se permite mezclar propietarios en un mismo palet/lote de producción                                                                                                                                                                                                  | 2026-08-11 | Simplicidad de trazabilidad y facturación en v1                                                                                                                                                                                                                                                                                                                  |
| 2   | Portal v1: lectura total + gestión de cabeceras de pedido; palets y producción exclusivos del tenant                                                                                                                                                                     | 2026-08-11 | Fiel al alcance descrito por el usuario; evita dar control operativo crítico a un tercero                                                                                                                                                                                                                                                                        |
| 3   | `RawMaterialReception` se reutiliza sin campo de tipo materia-prima/terminado                                                                                                                                                                                            | 2026-08-11 | Esa distinción ya existe a nivel de `Product`/`ProductCategory`                                                                                                                                                                                                                                                                                                  |
| 4   | Devolución al maquilador no reutiliza `Order`; se propone `ExternalProcessorReturn`                                                                                                                                                                                      | 2026-08-11 | `orders.customer_id` es obligatoria y `Order` tiene semántica comercial que no aplica a una devolución de propiedad                                                                                                                                                                                                                                              |
| 5   | `Incident` pasa a ser polimórfico en vez de duplicarse por dominio                                                                                                                                                                                                       | 2026-08-11 | Mismo concepto de negocio (estados, tipos de resolución) reutilizable en recepción y devolución                                                                                                                                                                                                                                                                  |
| 6   | Facturación/coste del servicio de maquila **SÍ entra en el alcance del bloque**                                                                                                                                                                                          | 2026-08-11 | Decisión explícita del usuario (revierte la recomendación inicial de dejarlo fuera). Sin explorar todavía — requiere su propio STEP 0a antes de poder proponerse en STEP 2 (ver §15)                                                                                                                                                                             |
| 7   | `resolution_type` de `Incident` se mantiene informativo, pero pasa a poder referenciar la `ExternalProcessorReturn` que ejecuta la devolución; el movimiento real de stock (`Pallet` → `SHIPPED`) ocurre al ejecutar esa devolución física, no al resolver la incidencia | 2026-08-11 | El usuario señaló que la mercancía devuelta "sigue quedando en stock" tras resolver la incidencia — la resolución documenta el acuerdo, el movimiento de stock lo dispara la devolución física, igual que hoy `Order::finalizeAfterIncident()` separa "incidencia resuelta" de "palet expedido". **Interpretación sujeta a confirmación explícita del usuario.** |

---

## 8. Preguntas abiertas / pendientes de definir

Estas preguntas deben resolverse en STEP 0/STEP 1 antes de aprobar cambios concretos en STEP 2:

1. Cómo se marca exactamente que una `RawMaterialReception` (o los palets que genera) pertenece a
   un `ExternalProcessor` — ¿campo en la recepción, o solo en los palets resultantes?
2. Reglas exactas de permisos granulares del portal en `ActorScopeService`/Policies (qué puede
   editar de la cabecera de un `Order`, qué campos quedan bloqueados). **Nota STEP 0/1 (§9.2,
   riesgo 2-3):** hoy no hay ningún camino de autorización de `ExternalUser` sobre `Order`, y
   `PalletPolicy::update` da edición completa (no solo lectura) sobre palets con acceso al almacén
   — ambas piezas hay que diseñarlas desde cero, no son una extensión menor.
3. Qué ocurre si un palet de maquila se agota/transforma completamente sin generar output
   remanente — ¿afecta a la trazabilidad de propiedad?
4. Documentos/albaranes de devolución (`ExternalProcessorReturn`): ¿formato PDF propio o reutiliza
   la generación de documentos ya existente en el sistema (§17 CLAUDE.md, PDF/Excel)?
5. ~~Facturación/coste del servicio de maquila...~~ **Resuelta (2026-08-11, decisión #6):** SÍ está
   en alcance. Pendiente de un STEP 0a propio (mapeo de `CostCatalog`/`ProductionCost`/tarifas) antes
   de incorporarse a una propuesta de STEP 2 — no bloquea el STEP 2 del núcleo operativo (§15).
6. ~~El campo `resolution_type`...~~ **Resuelta (2026-08-11, decisión #7):** se mantiene informativo;
   el efecto real de stock lo dispara la ejecución de `ExternalProcessorReturn`, no la resolución de
   la incidencia en sí. Ver §5.5.

---

## 9. STEP 0 — Comportamiento actual detallado (verificado en código, 2026-08-11)

Documentación pura del comportamiento existente, sin modificar nada, de las piezas que este bloque
va a extender. Todas las referencias son archivo:línea reales, verificadas por lectura directa del
código.

### 9.1 `Pallet` — máquina de estados

**Archivo:** `app/Models/Pallet.php`. Estados (`STATE_REGISTERED`, `STATE_STORED`, `STATE_SHIPPED`,
`STATE_PROCESSED`, líneas 21-27).

- `validateUpdateRules()` (líneas 121-148, hook `updating`): desde `PROCESSED` solo se puede ir a
  `REGISTERED` o quedarse; desde `SHIPPED` no se puede volver a `REGISTERED`/`STORED` salvo que se
  esté desvinculando el pedido (`order_id = null`) a la vez. `reception_id` es inmutable una vez
  asignado (líneas 90-93).
- `updateStateBasedOnBoxes()` (líneas 519-611) recalcula el estado automáticamente cada vez que
  cambian los `ProductionInput` de sus cajas — se dispara desde
  `app/Services/Production/ProductionInputService.php:38,89,176,204,244`.
- `changeToShipped()` (líneas 643-660) es el método que marca un palet como enviado; lo invocan
  cuatro puntos distintos: `Order::finalizeAfterIncident()` (`Order.php:782`),
  `OrderController::updateStatus()` (línea 252), `OrderUpdateService::update()` (línea 92) y
  `OperationalOrderUpdateService.php:19`. Dos servicios más crean palets **directamente en
  `SHIPPED`**, sin pasar por `REGISTERED`: `OperationalOrderExecutionService.php:52` y
  `AutoventaStoreService.php:90`.
- `PalletActionService::linkOrder()/unlinkOrder()` (líneas 195-273) usa
  `ProductionLotLockService::assertPalletIsMutable()` para bloquear cambios si el lote de
  producción ya está cerrado.
- El palet no tiene FK directa a `Store`; su almacén se resuelve en tiempo real vía
  `storedPallet` → `StoredPallet.store_id` (líneas 463-487).
- El stock "disponible" depende del estado de las **cajas** (`Box::isAvailable`), no del palet en
  sí; a nivel de listados se usa `scopeInStock()` (`REGISTERED`+`STORED`, líneas 799-802).

**Implicación para el diseño**: la validación "no mezclar propietarios" y el nuevo campo
`external_processor_id` en `Pallet` tendrán que enforzarse en un punto central (probablemente
`validateUpdateRules()`/`boot()`, igual que ya se hace con `reception_id` inmutable), porque hay
al menos **seis puntos distintos** del código que crean o transicionan palets
(`ProductionInputService`, `PalletActionService`, `OrderUpdateService`, `OrderController`,
`OperationalOrderExecutionService`, `AutoventaStoreService`) y sería frágil validar en cada uno.

### 9.2 `ActorScopeService` — alcance real de permisos hoy

**Archivo:** `app/Services/ActorScopeService.php` (56 líneas). Todo el mecanismo pivota sobre
`Store.external_user_id` → `ExternalUser.stores()` → `allowedStoreIds()`. **No existe todavía**
ningún concepto de `external_processor_id` en esta cadena.

Hallazgo importante para el diseño de permisos (§5.6): **hoy un `ExternalUser` con acceso a un
almacén puede EDITAR el palet completo, no solo verlo** —
`PalletPolicy::update` (línea 63) solo comprueba `canAccessStoreId`, sin distinguir lectura de
escritura. `PalletPolicy::create` (líneas 55-58) tampoco filtra por almacén. Y
`ExternalUser::TYPE_MAQUILADOR` (`ExternalUser.php:11`) es hoy **un valor de campo sin ningún uso**
en ninguna Policy — no hay comportamiento distinto por tipo de usuario externo todavía.

Más relevante aún: **`OrderPolicy` no tiene ningún método que acepte `ExternalUser`** — todas las
firmas son `User $user`. Hoy no existe ningún camino de autorización, ni lectura ni escritura, para
que un `ExternalUser` de tipo maquilador acceda a un `Order`. Esto confirma que el permiso
"lectura total + edición de cabecera" del §5.6 es una pieza de autorización **completamente
nueva**, no una extensión menor de lo existente.

### 9.3 `RawMaterialReception` — flujo actual

**Archivo:** `app/Models/RawMaterialReception.php` + `app/Services/v2/RawMaterialReceptionWriteService.php`.

- La generación de `Pallet` a partir de una recepción es **manual/explícita en el payload** (el
  usuario decide en el frontend cómo agrupar productos en palets), no automática por regla de
  negocio — `createPalletsFromRequest()`/`updatePalletsFromRequest()`.
- Bloqueos ya existentes: no se pueden añadir palets/cajas si la recepción ya tiene cajas en
  producción (`hasUsedBoxes`); los palets ya vinculados a un pedido quedan excluidos de edición
  (`locked_pallet_ids`).
- `RawMaterialReceptionPolicy` es **plana**: cualquier rol del sistema puede
  crear/ver/editar/eliminar (`hasAnyRole(Role::values())`), sin distinción de campos ni de actor
  externo — ni siquiera está tipada para aceptar `ExternalUser`.
- **No existe ningún concepto de incidencia hoy en recepciones** (ni modelo `Incident` vinculado,
  ni estado de tipo incidencia). El único mecanismo de corrección es la edición completa, siempre
  permitida (`getCanEditAttribute()` es constante `true`), con bloqueo granular por palet ya usado.

**Implicación**: el flujo de incidencias en recepción (§5.5) es una pieza nueva de principio a fin,
no una extensión — no hay nada parecido que reutilizar más allá del modelo `Incident` en sí.

### 9.4 `Order` — transiciones e impacto real de `external_processor_id`

**Archivo:** `app/Models/Order.php` (977 líneas).

- Transiciones confirmadas: `markAsIncident()` (pending→incident, disparada desde
  `IncidentController::store()`); `finalizeAfterIncident()` (incident→finished, disparada desde
  `IncidentController::destroy()` — es decir, **al borrar la incidencia**, no al "resolverla"; no
  hay endpoint de "resolver" que dispare esto automáticamente) — fuerza **todos** los pallets del
  pedido a `SHIPPED` vía `changeToShipped()`, incluso si ya lo estaban.
- `OrderController::destroy()` bloquea el borrado si el pedido tiene algún palet vinculado — no hay
  cascada ni desvinculación automática.
- **`external_processor_id`/`maquilador_destination` hoy solo se usan para**: filtrar listados
  (`OrderListService.php:164`) y generar dos documentos específicos —
  `PDFController::generateMaquiladorCMR()`/`generateMaquiladorOrderSigns()` y
  `OrderDocumentController::sendMaquiladorDocumentation()` (envío de documentación por email al
  maquilador). **No hay ninguna regla de permisos** ligada a este campo hoy.

**Implicación**: el "pedido del cliente de maquila hacia sus clientes" ya tiene datos y hasta
documentos PDF específicos generándose — es una base más madura de lo que parecía en STEP 0a, pero
el matiz de permisos (quién puede editar qué) sigue sin existir en absoluto.

### 9.5 `Incident` — ciclo de vida real

**Archivo:** `app/Models/Incident.php` + `app/Http/Controllers/v2/IncidentController.php`. **No
existe `IncidentPolicy`** — toda la autorización pasa indirectamente por `OrderPolicy::view/update`
sobre el pedido padre.

- Confirmado en migración (`2025_03_22_163650_create_incidents_table.php`): `order_id` es
  `foreignId()->constrained()->onDelete('cascade')`, **NOT NULL**, sin `nullable()`. Migrar a
  polimórfico es un cambio de esquema real, no cosmético, y hay que decidir explícitamente qué pasa
  con el `onDelete('cascade')` actual.
- **Hallazgo clave**: `resolution_type` (`returned`/`partially_returned`/`compensated`) es hoy
  **puramente informativo** — no dispara ningún efecto automático diferenciado sobre `Order`/
  `Pallet`/stock. El único efecto real ocurre al **borrar** la incidencia (`destroy()`), que
  siempre fuerza `finalizeAfterIncident()` (pedido a `finished`, todos los palets a `SHIPPED`)
  **independientemente** de qué `resolution_type` se había registrado.

**Implicación**: si en maquila se espera que "mercancía devuelta" (`returned`) tenga un efecto de
stock distinto a "compensado" (`compensated`), eso sería una funcionalidad **nueva** que hoy no
existe ni para pedidos normales — no se puede asumir que el campo ya tiene lógica de negocio detrás
por el hecho de existir en el modelo.

### 9.6 `Production` — filtrado existente por cliente/pedido

`buildFilteredProcessTree()` filtra partiendo de `Pallet` (no de `Production`), exigiendo
`order_id` no nulo, `status = SHIPPED`, y filtrando `order.customer_id`/`order_id`
(`getSalesDataByProduct()`). Es decir, **solo filtra por destino de venta ya vinculado a un
pedido**, no por origen/propiedad de la mercancía. Extenderlo a `external_processor_id` por ese
camino solo cubriría "trazabilidad de lo ya vendido", no "toda mi trazabilidad, vendida o no" — que
es lo que pide el §5.3. Para ese segundo caso hace falta un camino distinto y estructuralmente más
simple: `ProductionInput`/`ProductionOutputConsumption` → `Box` → `Pallet.external_processor_id`
directamente, sin pasar por `Order`. **Esto confirma la decisión de guardar la propiedad en el
propio `Pallet` (§6.2)** en vez de derivarla solo del pedido de venta.

---

## 10. STEP 1 — Análisis de riesgos

No se asigna un "Rating ANTES" en el sentido habitual del workflow (CLAUDE.md §18) porque el bloque
no existe todavía como funcionalidad operativa — no hay comportamiento en producción que puntuar.
En su lugar, este análisis identifica los riesgos reales encontrados en STEP 0 que deben resolverse
en STEP 2 antes de tocar código:

| #   | Riesgo                                                                                                                                                                                                                                    | Origen (STEP 0) | Gravedad                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| 1   | La validación "no mezclar propietarios" en `Pallet` debe centralizarse — hay 6 puntos de código distintos que crean/transicionan palets                                                                                                   | §9.1            | Alta — fácil dejar un hueco si se valida por sitio en vez de en el modelo                         |
| 2   | `OrderPolicy` no tiene ningún método para `ExternalUser` — hay que diseñarlo desde cero, no extenderlo                                                                                                                                    | §9.2, §9.4      | Alta — es la pieza de autorización central del portal                                             |
| 3   | `PalletPolicy::update` hoy da edición completa a cualquier `ExternalUser` con acceso al almacén, no solo lectura — el modelo de permisos actual no distingue el matiz que pide el negocio (§5.6)                                          | §9.2            | Alta — riesgo de que el cliente de maquila pueda modificar palets si no se corrige explícitamente |
| 4   | Migración de `Incident` a polimórfico toca una FK `NOT NULL` con `onDelete('cascade')` en un bloque consolidado (A.2 Ventas)                                                                                                              | §9.5            | Media — mitigable con backfill cuidadoso y tests de regresión, ya previsto en §6.4                |
| 5   | ~~`resolution_type` de `Incident` no tiene hoy ningún efecto automático real...~~ **Resuelto (decisión #7, §7):** se mantiene informativo; el movimiento de stock lo dispara `ExternalProcessorReturn`, no la resolución de la incidencia | §9.5            | Cerrado                                                                                           |
| 6   | `RawMaterialReceptionPolicy` es plana (cualquier rol); no hay concepto de incidencia en recepción — el flujo de incidencias de recepción es una pieza nueva completa                                                                      | §9.3            | Media                                                                                             |
| 7   | El filtrado de trazabilidad por propiedad (no solo por venta) necesita un camino de query nuevo vía `Pallet.external_processor_id`, no reutiliza `buildFilteredProcessTree` tal cual                                                      | §9.6            | Baja — extensión aditiva, no toca lo existente                                                    |

**Conclusión STEP 1**: ningún riesgo es bloqueante, pero los riesgos 1-3 (centralización de la
regla de no-mezcla, y el modelo de permisos de `ExternalUser` sobre `Order`/`Pallet`) son el núcleo
duro del bloque — conviene resolverlos primero en STEP 2, antes de las piezas más mecánicas
(`ExternalProcessorReturn`, polimorfismo de `Incident`).

---

## 11. STEP 2 — Cambios propuestos (núcleo operativo)

**Estado: EN REVISIÓN tras auditoría profesional multi-pase (§12). No aprobado.** Un equipo de 8
auditores especializados (arquitectura Laravel, dominio pesquero, workflow, seguridad, datos,
contrato API, testing, finanzas) revisó esta propuesta el 2026-08-11 y encontró **6 hallazgos
bloqueantes** — algunos de ellos corrigen afirmaciones factuales incorrectas del texto original de
esta sección (marcadas inline con ⚠️ **CORREGIDO POR AUDITORÍA**, con el texto original tachado).
Léase §12 antes de aprobar nada de lo siguiente. Solo cubre el núcleo operativo (recepción, stock,
producción, expedición, permisos, incidencias) — la facturación de servicios de maquila queda fuera
(decisión #6, §7; necesita su propio STEP 0a, ver §15). Nada de lo siguiente se implementa hasta que
el usuario lo apruebe explícitamente, y con las correcciones de §12 incorporadas. Sin código, en
prosa, tal como pide el workflow (CLAUDE.md §18).

### 11.1 Migraciones y campos nuevos

**Qué**: añadir `external_processor_id` (FK nullable a `external_processors`) en cuatro tablas:
`raw_material_receptions`, `pallets`, `external_users`, `stores`.
**Por qué**: es la propiedad/vinculación base que falta en las cuatro piezas identificadas en STEP
0a/0 (§6.2, §9). En `stores` es intencionadamente un campo distinto de `external_user_id` —
"quién tiene acceso" y "de quién es la mercancía" son conceptos separados.
**Impacto**: 4 migraciones nuevas, sin tocar datos existentes (todo nullable, no rompe nada).

**Qué**: en `Pallet`, al crear un palet desde una recepción, copiar automáticamente
`external_processor_id` de la `RawMaterialReception` de origen; ~~hacerlo inmutable tras la
creación (mismo mecanismo que ya protege `reception_id` hoy, `Pallet.php:90-93`)~~.
⚠️ **CORREGIDO POR AUDITORÍA (§12, data-architecture-auditor)**: esta afirmación es inexacta.
`Pallet::boot()` solo tiene hooks `saving`/`updating`/`deleting` — **no hay `creating`**, y la
inmutabilidad de `reception_id` vive en `updating`, que nunca se dispara en el insert inicial. El
valor real se asigna hoy en **4 puntos distintos** de `RawMaterialReceptionWriteService.php`
(líneas 163, 407, 470, 548), no vía modelo. La copia de `external_processor_id` debe implementarse
como pieza nueva (hook `saving` que detecte `!$pallet->exists`) que cubra esos mismos 4 puntos —
si algún punto de creación futuro (import, job) no pasa por ahí, el palet queda sin propietario.
**Por qué**: evita que se pueda asignar manualmente una propiedad distinta a la de la recepción de
origen — una sola fuente de verdad (pregunta #1 resuelta).
**Impacto**: `RawMaterialReceptionWriteService` (los 4 puntos reales de creación, no solo "el
servicio" en genérico) + `Pallet::boot()` (hook `saving`, no un mecanismo ya existente).

**Qué**: ~~centralizar en `Pallet` (en `validateUpdateRules()`/`boot()`, junto a las reglas ya
existentes) la validación de "no mezclar propietarios"~~.
⚠️ **CORREGIDO POR AUDITORÍA (§12, laravel-expert — hallazgo BLOQUEANTE)**: esta ubicación es
errónea. El mezclado real de propiedad ocurre al crear un `ProductionInput` (vincula una `Box` de
un `Pallet` a un `ProductionRecord`) o un `ProductionOutput`/`ProductionOutputSource` (agrega
inputs de varios `Pallet` en un mismo output) — verificado en
`app/Services/Production/ProductionInputService.php` y `ProductionOutputService.php`, que no tocan
ni guardan el propio `Pallet` (este solo recibe un `save()` indirecto y posterior vía
`updateStateBasedOnBoxes()`, cuando la mezcla ya ha ocurrido). La validación debe vivir en
`ProductionInputService::create()`/`createMultiple()` y `ProductionOutputService::create()`/
`createSources()`, comparando `external_processor_id` de los `Pallet` de origen de las boxes
involucradas — **no en `Pallet::boot()`**, que nunca se ejecuta en el momento en que ocurre la
mezcla real.
**Por qué**: STEP 0 (§9.1) encontró 6 puntos de código distintos que crean/transicionan palets —
pero el punto de la regla no es "dónde se crea/transiciona un `Pallet`", es "dónde se combinan
inputs de distinto origen en un output" (riesgo 1, §10).
**Impacto**: `app/Services/Production/ProductionInputService.php`,
`app/Services/Production/ProductionOutputService.php` — no `Pallet.php`.

### 11.2 Permisos — la pieza central del bloque

**Qué**: añadir a `OrderPolicy` métodos que acepten `ExternalUser`: `viewAny`/`view` (si
`external_processor_id` del pedido coincide con el del actor) y un nuevo método restringido
(p. ej. `updateAsProcessor`) que autoriza editar **solo cabecera**, nunca pallets/producción.
**Por qué**: STEP 0 confirmó (§9.2, §9.4) que hoy `OrderPolicy` no tiene ningún camino para
`ExternalUser` — es autorización nueva, no una extensión (riesgo 2, §10).
**Impacto**: `app/Policies/OrderPolicy.php`. ⚠️ **Añadido por auditoría (§12, security-auditor —
hallazgo BLOQUEANTE)**: `IncidentController::store()/update()/destroy()` reutiliza hoy
`OrderPolicy::update` como gate de autorización (`app/Http/Controllers/v2/IncidentController.php`
líneas 30, 54, 80). Si al implementar se autoriza a `ExternalUser` en `OrderPolicy::update()`
directamente (en vez de crear solo `updateAsProcessor()` como método separado), un maquilador
ganaría acceso a abrir/resolver/**borrar** incidencias de su pedido — y `destroy()` dispara
`Order::finalizeAfterIncident()`, que fuerza todos los palets a `SHIPPED`. Esto viola directamente
la decisión #2 (§7, "producción exclusiva del tenant"). El STEP 2 debe declarar explícitamente:
`OrderPolicy::update()` NO se toca para `ExternalUser`; solo `updateAsProcessor()` (nuevo, separado)
y un gate propio para `Incident` (ver corrección en §11.3) reciben acceso.

**Qué**: crear un servicio/Form Request de escritura restringido para el portal de maquila (p. ej.
`MaquilaOrderUpdateService` + `UpdateOrderAsProcessorRequest`), que solo acepta los campos de
cabecera permitidos (cliente final, fechas, transporte, notas — lista exacta a cerrar con el
usuario al implementar) y nunca acepta `pallets`, `plannedProductDetails` con vinculación de
producción. ~~Sigue el mismo patrón que ya existe en el proyecto para el portal operativo/autoventa
(`OperationalOrderUpdateService`, campos restringidos por tipo de actor)~~.
⚠️ **CORREGIDO POR AUDITORÍA (§12, laravel-expert)**: `OperationalOrderUpdateService.php` es
**código muerto** — no está referenciado desde ningún Controller ni ruta del proyecto. El patrón
realmente vigente en producción es `FieldOrderController::update()` →
`OrderPolicy::updateOperational` + `UpdateOperationalOrderRequest` (whitelist) →
`OperationalOrderExecutionService::execute()` (170 líneas, gestiona creación/borrado de
`Box`/`Pallet`/`PalletBox`, GS1-128, líneas planificadas — bastante más pesado que un simple
whitelist de cabecera). Además, ese precedente es para un actor **interno** (`FieldOperator`), no
para `ExternalUser` — no existe ningún precedente de escritura de `ExternalUser` sobre `Order`, así
que esta pieza es más nueva de lo que el texto original sugería. Referenciar
`OperationalOrderExecutionService` + `updateOperational` como precedente real, no el servicio muerto.
⚠️ **Añadido por auditoría (§12, api-contract-auditor)**: la lista de campos permitidos en
`UpdateOrderAsProcessorRequest` debe derivarse de una fuente común (constante/enum compartido) con
`UpdateOrderRequest`, no copiarse a mano — si no, ambos Requests pueden acabar validando el mismo
campo con reglas distintas sin que nada lo detecte.
**Impacto**: nuevo Controller/ruta bajo `v2/`, nuevo Service, nuevo Form Request. Contrato OpenAPI
a actualizar (CLAUDE.md §19) cuando se implemente. ⚠️ **Bloqueante de contrato (§12,
api-contract-auditor)**: antes de implementar hay que decidir qué `Resource` ve `ExternalUser` al
leer `Order`/`Pallet`/`Production` — la misma que `User` interno con campos condicionales, o una
distinta (tipo `FieldOrderResource`). El proyecto ya tiene una deuda abierta idéntica sin resolver
(`API-CONTRACT-005`, `FieldOrderResource` vs `OrderResource`) — no decidirlo ahora la repite una
tercera vez.

**Qué**: corregir `PalletPolicy` para que un `ExternalUser` de tipo `maquilador` (o con
`external_processor_id` asignado) solo tenga `view`, nunca `create`/`update`/`delete` sobre
`Pallet` — independientemente de si tiene acceso al almacén.
**Por qué**: STEP 0 encontró que hoy cualquier `ExternalUser` con acceso a un almacén puede editar
el palet completo (riesgo 3, §10) — contradice directamente la decisión de negocio #2 (§7).
**Impacto**: `app/Policies/PalletPolicy.php`. Es el cambio de mayor riesgo de regresión porque
afecta a `ExternalUser` en general, no solo a los de tipo maquilador — hay que verificar que no
rompe el caso de uso actual de usuarios externos genéricos (bloque A.21, en revisión) antes de
mergear. ⚠️ **Añadido por auditoría (§12, security-auditor — 3 puntos)**:
(1) `external_users.type` es hoy un ENUM con un único valor legal (`maquilador`) — comprobar
`type` es un no-op, el discriminador real debe ser `external_processor_id IS NOT NULL`, y debe
implementarse **fail-closed** (bloquear edición si es null, no al revés), porque un `ExternalUser`
recién creado sin `external_processor_id` vinculado conservaría hoy edición completa si el fix se
basa solo en `type`.
(2) `PalletPolicy::create` hoy **no comprueba almacén en absoluto** (`return $user->is_active`) —
cualquier `ExternalUser` activo puede crear un palet en cualquier tienda. Esto no está en la lista
original de arriba pero debe corregirse en el mismo cambio, o el hueco de `create` queda abierto.
(3) El test de regresión ya existente `ExternalUsersApiTest::test_external_user_can_create_update_and_move_pallets_only_within_own_stores`
(línea 278) debe verificarse/ampliarse ANTES de tocar la Policy — es la prueba concreta que este
cambio puede romper para el caso de uso genérico de A.21.

**Qué**: extender `ActorScopeService` (o añadir un servicio hermano) con un scope de **propiedad**
(`scopeOwnedPallets`/`scopeOwnedStock` por `external_processor_id`), separado del scope de
**acceso** que ya existe (`allowedStoreIds`).
**Por qué**: son conceptos distintos que hoy están mezclados en el mismo mecanismo
(`Store.external_user_id`) — separarlos es necesario para que el almacén virtual muestre
exactamente "lo mío", no "todo lo que hay en el almacén al que tengo acceso".
**Impacto**: `app/Services/ActorScopeService.php`, controllers de listado de `Pallet`/`Store`.

### 11.3 Incidencias

**Qué**: migrar `Incident` a polimórfico (`incidentable_type`/`incidentable_id`), con backfill de
las filas existentes a `Order`, preservando `Order::incidents()` como relación de conveniencia.
**Por qué**: ya decidido (#5, §7); riesgo medio (#4, §10) por tocar un bloque consolidado — se
mitiga con backfill + tests de regresión sobre el flujo de incidencias de pedidos ya existente
antes de dar por cerrado el cambio.
**Impacto**: 1 migración + backfill, `Incident.php`, `IncidentController.php`, y creación de
`IncidentPolicy` (hoy no existe — la autorización pasa indirectamente por `OrderPolicy`, pero para
recepciones/devoluciones necesitará su propia lógica). ⚠️ **Añadido por auditoría (§12,
data-architecture-auditor — hallazgo BLOQUEANTE)**: `incidents.order_id` es hoy `NOT NULL` con
`onDelete('cascade')` (confirmado en la migración). El texto original no dice qué pasa con esa
cascada tras la migración: si se retira `order_id` como FK activa, borrar un `Order` dejaría
incidencias polimórficas huérfanas salvo que se implemente el borrado en cascada a nivel de
aplicación (observer en `deleting`). Si se conserva `order_id` como columna "de conveniencia", hay
que decidir explícitamente si esa FK sigue disparando el borrado real o es puramente informativa —
ambas cosas no pueden ser ciertas a la vez. Debe resolverse antes de escribir la migración.
⚠️ **Añadido por auditoría (§12, laravel-expert)**: `IncidentController` está más acoplado a
`Order` de lo que "extender" sugiere — las rutas reciben `$orderId` posicional (no polimórfico) y
`Order::incident()` es `hasOne` (**un único incidente por pedido, nunca varios**). Adaptarlo a
recepciones implica cambiar la forma de las rutas y probablemente partir el controller en dos, no
solo "extenderlo" — es rediseño de contrato API (toca CLAUDE.md §19) sobre un endpoint ya
consolidado (A.2), no una ampliación menor.

**Qué**: añadir `Incident.external_processor_return_id` (FK nullable), sin obligar a rellenarlo al
resolver.
**Por qué**: decisión #7 (§7) — permite trazar qué devolución física ejecutó una incidencia
resuelta como `returned`, sin acoplar la resolución de la incidencia al movimiento de stock.
**Impacto**: columna nueva en la migración de polimorfismo, `Incident.php`.

**Qué**: crear el flujo de incidencias de recepción (`RawMaterialReception` → `Incident`
polimórfico), inexistente hoy (§9.3).
**Por qué**: es un hueco real, no una extensión — el doc de origen lo pide explícitamente (§2).
**Impacto**: nuevo endpoint/Controller (o extender `IncidentController` para aceptar
`incidentable_type=RawMaterialReception`), Policy nueva o extendida. ⚠️ **Añadido por auditoría
(§12, security-auditor — hallazgo Media/Alta)**: `RawMaterialReceptionPolicy` es hoy plana
(`hasAnyRole(Role::values())`, cualquier rol, sin tipar `ExternalUser` ni scoping por almacén o
procesador). Si el nuevo endpoint de incidencias de recepción reutiliza esta Policy tal cual, un
maquilador podría ver recepciones de **otro** procesador o materia prima propia del tenant no
relacionada con maquila. Esta Policy debe rediseñarse en este STEP 2, no diferirse a STEP 3.

### 11.4 Expedición — `ExternalProcessorReturn`

**Qué**: crear el modelo/tabla `external_processor_returns` (o el nombre que se acuerde) con
`external_processor_id` obligatorio, ~~relación N:M con `Pallet` (mismo patrón pivote que `Order` ↔
`Pallet`)~~, `transport_id` nullable, fecha, estado, y validación de que cada palet adjuntado
pertenece a ese `external_processor_id`. Al ejecutarse, llama `Pallet::changeToShipped()` sobre
cada palet (reutiliza la máquina de estados existente, §9.1).
⚠️ **CORREGIDO POR AUDITORÍA (§12, data-architecture-auditor)**: la descripción del patrón actual
es errónea. `Order::pallets()` es `hasMany(Pallet::class)` — **1:N vía FK directa `pallets.order_id`**,
no N:M. Sí existe una tabla `order_pallets`/modelo `OrderPallet`, pero es **código muerto** (solo
en factory/seeder, nunca usado en Controllers/Services reales — `PalletActionService::linkOrder/
unlinkOrder` escriben directamente `pallet->order_id`). Copiar "el mismo patrón" reproduciría el
patrón legacy abandonado, no el vivo. Dado que la decisión #1 (§7, no mezcla) implica que un palet
solo puede devolverse una vez por ciclo, lo coherente y más simple es una **FK directa
`pallets.external_processor_return_id` nullable**, igual que `pallets.order_id` — no una tabla
pivote nueva.
**Por qué**: decisión #4 (§7) — cubre devolución terminada y sin procesar sin duplicar `Order`.
**Impacto**: migración nueva, modelo nuevo, Controller/Service/Policy/Form Request nuevos,
documento de devolución reutilizando la infraestructura PDF/Excel existente (A.15). ⚠️ **Añadido
por auditoría (§12, evolution-workflow)**: §15.3 (facturación, todavía en STEP 0a abierto) propone
que `MaquilaServiceCharge` referencie polimórficamente esta tabla. Si el STEP 2 de este §11 se
implementa (STEP 3) antes de cerrar §15.5, `external_processor_returns` se diseñará sin saber si
necesita soportar esa referencia entrante, con riesgo real de migración de parche después —
considerar mantener esta tabla concreta en diseño abierto hasta cerrar §15.5, aunque el resto del
núcleo operativo avance.

### 11.5 Producción — trazabilidad por propiedad

**Qué**: añadir un método nuevo (no modifica `buildFilteredProcessTree`) que filtre el árbol de
producción por `external_processor_id` vía el camino `ProductionInput`/`ProductionOutputConsumption`
→ `Box` → `Pallet.external_processor_id`, sin pasar por `Order` — para cubrir "toda mi trazabilidad,
vendida o no" (riesgo 7, §10, ya cerrado como aditivo).
**Por qué**: `buildFilteredProcessTree` actual solo cubre lo ya vendido (§9.6); esto es una
extensión aditiva, no toca el método existente ni sus llamadas actuales.
**Impacto**: `app/Models/Production.php` (método nuevo), endpoint de solo lectura para el portal.

---

## 12. Auditoría profesional multi-pase (STEP 2)

**Fecha:** 2026-08-11. **Objetivo:** simular la revisión de un equipo profesional completo antes de
dar luz verde a la implementación, a petición explícita del usuario. **Metodología:** 8 pasadas de
auditoría independientes, cada una desde un rol especializado, contra el documento maestro completo
(sobre todo §5, §6, §9, §10, §11, §15), con instrucción de verificar en el código real y no fiarse
del texto del documento. Se crearon 5 agentes auditores nuevos (`.claude/agents/`) que no existían
en el proyecto, reutilizables en futuras auditorías de diseño.

### 12.1 Equipo y alcance de cada pasada

| Rol                         | Agente                              | Foco                                                            |
| --------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| Arquitecto Laravel/backend  | `laravel-expert`                    | Viabilidad técnica de §11, convenciones del proyecto            |
| Analista de negocio/dominio | `domain-expert`                     | Coherencia de reglas de negocio con la operativa pesquera real  |
| Responsable de proceso      | `evolution-workflow`                | Cumplimiento del workflow CLAUDE.md §18, gestión del scope      |
| Ingeniero de seguridad      | `security-auditor` (nuevo)          | Autorización, aislamiento multi-tenant, fugas entre actores     |
| DBA/arquitecto de datos     | `data-architecture-auditor` (nuevo) | Esquema, migraciones, índices, integridad referencial           |
| Responsable de contrato API | `api-contract-auditor` (nuevo)      | Impacto en `public/openapi/frontend.yaml`, CLAUDE.md §19        |
| QA lead                     | `qa-test-strategy-auditor` (nuevo)  | Cobertura de tests necesaria, huecos de regresión               |
| Auditor financiero/contable | `finance-auditor` (nuevo)           | Corrección de cálculos de coste/IVA, exportación A3ERP/Facilcom |

### 12.2 Veredicto

**El STEP 2 del §11 NO queda aprobado tal como estaba redactado.** La auditoría encontró **6
hallazgos bloqueantes**, varios de los cuales corrigen afirmaciones factuales incorrectas del texto
original (ya corregidas inline en §11 y §15 con ⚠️ **CORREGIDO POR AUDITORÍA**, texto original
tachado). Ningún hallazgo bloqueante invalida el enfoque general del bloque — todos son correcciones
de ubicación/detalle sobre una base de diseño sólida, no un rediseño desde cero.

### 12.3 Hallazgos bloqueantes (deben resolverse antes de aprobar STEP 2)

1. **[laravel-expert] Ubicación errónea de la regla "no mezclar propietarios".** No puede vivir en
   `Pallet::boot()` (§11.1) — el mezclado real ocurre en `ProductionInputService`/
   `ProductionOutputService`, que nunca disparan los hooks del modelo `Pallet` en el momento en que
   la mezcla sucede. Corregido en §11.1.
2. **[security-auditor] `IncidentController` reutiliza `OrderPolicy::update`.** Si se autoriza a
   `ExternalUser` en ese método directamente, un maquilador podría borrar la incidencia de su
   pedido y disparar `finalizeAfterIncident()` (fuerza todos los palets a `SHIPPED`), violando la
   decisión #2 (§7, producción exclusiva del tenant). Corregido en §11.2.
3. **[data-architecture-auditor] `incidents.order_id` es `NOT NULL` con `onDelete('cascade')`**, y
   el plan de migración a polimórfico (§11.3, §6.4) no decide qué pasa con esa cascada — riesgo real
   de incidencias huérfanas o de comportamiento de borrado ambiguo. Corregido en §11.3.
4. **[data-architecture-auditor] `ExternalProcessorReturn`↔`Pallet` descrito como N:M "igual que
   `Order`↔`Pallet`" es incorrecto** — el patrón real y vivo es FK directa 1:N (`pallets.order_id`);
   la tabla pivote `OrderPallet` es código muerto. Corregido en §11.4.
5. **[api-contract-auditor] La Resource que verá `ExternalUser` al leer `Order`/`Pallet`/`Production`
   no está decidida**, y el proyecto ya tiene una deuda de contrato idéntica sin resolver
   (`API-CONTRACT-005`, `FieldOrderResource` vs `OrderResource`) — no decidirlo ahora la repite una
   tercera vez. Debe fijarse en este STEP 2, no diferirse a STEP 3. Nota añadida en §11.2.
6. **[finance-auditor] La idea 3 de facturación (§15.1, "simular precio de materia prima") no puede
   materializarse tal como estaba planteada.** `raw_material_receptions.supplier_id` es `NOT NULL`,
   `ExternalProcessor` no tiene relación con `Supplier`, y **sí existe** ya un export A3ERP de
   compras (`RawMaterialReceptionA3erpExport.php`, `'ALBARANESCOMPRA'`) que el documento afirmaba
   erróneamente que no existía — riesgo real de que un precio simulado se cuele en una exportación
   contable real o en una liquidación real a proveedor. Corregido en §15.2 y §15.5.

### 12.4 Hallazgos de severidad Alta (no bloquean STEP 2, pero deben resolverse antes de STEP 3)

- **[laravel-expert]** El precedente citado para `MaquilaOrderUpdateService` (`OperationalOrderUpdateService`) es código muerto; el patrón real vigente es `FieldOrderController` + `OperationalOrderExecutionService` — el esfuerzo está subestimado en el texto original (corregido en §11.2).
- **[domain-expert]** La regla "no mezclar propietarios" puede no sobrevivir a la operativa real (lotes pequeños que no alcanzan el mínimo eficiente de línea/túnel/autoclave) — falta documentarla como trade-off de negocio deliberado, no como descripción de cómo ya funciona la planta.
- **[domain-expert]** Falta la dimensión de **rendimiento/merma** en §15 — en toll manufacturing pesquero real es la pregunta comercial central ("quién asume la merma"), no un detalle menor.
- **[domain-expert]** Trazabilidad sanitaria: el diseño resuelve "qué ve el cliente en el portal", no necesariamente "qué se entrega a un inspector sanitario en una auditoría oficial" — son requisitos distintos.
- **[domain-expert]** Falta contemplar una tarifa de almacenaje por estancia de palets del cliente.
- **[evolution-workflow]** STEP 1 (§10) no evalúa impacto de rendimiento/escalabilidad pese a que CLAUDE.md §16 lo exige para tablas grandes (`pallets`, `orders`, `incidents`).
- **[evolution-workflow]** Falta un mapa explícito de qué tests de los bloques CORE ya consolidados (A.2, A.3, A.4, A.6, A.21) hay que ejecutar antes/después de cada cambio, más allá de menciones sueltas.
- **[evolution-workflow]** Riesgo de secuenciación entre §11.4 (a punto de aprobarse) y §15.3 (aún abierto) — nota añadida en §11.4.
- **[api-contract-auditor]** Riesgo de reglas de validación divergentes entre `UpdateOrderRequest` y `UpdateOrderAsProcessorRequest` si no se derivan de una fuente común — nota añadida en §11.2.
- **[data-architecture-auditor]** La "copia automática" de `external_processor_id` en `Pallet` no tiene hook `creating` que la soporte tal como estaba descrita — corregido en §11.1.
- **[security-auditor]** Ambigüedad AND/OR en el fix de `PalletPolicy` (`type` vs `external_processor_id`); `type` es hoy un ENUM de un solo valor legal, así que el discriminador real debe ser `external_processor_id`, implementado fail-closed — nota añadida en §11.2.
- **[security-auditor]** `PalletPolicy::create` no comprueba almacén en absoluto hoy — cualquier `ExternalUser` activo puede crear un palet en cualquier tienda; no estaba en el alcance original del fix — nota añadida en §11.2.
- **[security-auditor]** `RawMaterialReceptionPolicy` (plana, cualquier rol) queda fuera del alcance de §11 pese a que §11.3 la expone a datos de terceros — nota añadida en §11.3.
- **[finance-auditor]** Riesgo real de doble contabilización en `ProductionCost` si se suman costes imputados a nivel de proceso y a nivel de producción global sin distinguir.
- **[qa-test-strategy-auditor]** El test de regresión ya existente `ExternalUsersApiTest::test_external_user_can_create_update_and_move_pallets_only_within_own_stores` (línea 278) debe verificarse/ampliarse antes de tocar `PalletPolicy` — es la prueba concreta que §11.2 puede romper.

### 12.5 Hallazgos de severidad Media/Baja (relevantes, no urgentes)

Nueva `IncidentPolicy` no mencionada explícitamente donde correspondía (§11.2); `ActorScopeService` mezcla scope de acceso y de propiedad en lecturas existentes sin lista cerrada de endpoints a migrar; polimorfismo de `Incident` sin patrón de escritura server-side explícito (seguir el patrón ya usado por `Attachment.attachable_type/id`, y valorar `enforceMorphMap()`); trazabilidad de export garantizada solo en A3ERP y no en Facilcom equivalente (§15.3); falta campo "motivo" en `ExternalProcessorReturn`; índices compuestos recomendados (`external_processor_id`+`status`) en `pallets`; STEP 0a (§4) no declara explícitamente la ausencia de controllers/rutas/tests como "N/A, se generará en STEP 2/3".

### 12.6 Próximo paso

Incorporar las correcciones ya aplicadas en §11/§15 como la versión vigente de STEP 2, resolver los
hallazgos Alta pendientes (en particular la Resource de `ExternalUser` y la lista de tests de
regresión de §12.4), y volver a presentar el STEP 2 para aprobación explícita del usuario. La idea 3
de facturación (§15.1) queda bloqueada hasta que el usuario decida un mecanismo de aislamiento de
datos simulados (§15.5, pregunta 2).

---

## 13. Backend — plan de implementación (workflow CLAUDE.md §18)

| Step                 | Contenido                                                                                                                          | Estado                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| STEP 0a              | Mapeo de entidades y alcance                                                                                                       | ✅ Completado (2026-08-11)                                                                                |
| STEP 0               | Comportamiento actual detallado (§9)                                                                                               | ✅ Completado (2026-08-11)                                                                                |
| STEP 1               | Análisis de riesgos (§10)                                                                                                          | ✅ Completado (2026-08-11)                                                                                |
| STEP 2               | Propuesta de cambios concretos — núcleo operativo (§11)                                                                            | ✅ Aprobado implícitamente (el usuario encargó STEP 3 directamente sobre la versión corregida de §11/§12) |
| STEP 2 (facturación) | Propuesta de cambios de facturación/costes de maquila                                                                              | ⏳ Pendiente de STEP 0a propio (§15) — idea 3 bloqueada por hallazgo de auditoría (§12.3.6)               |
| STEP 3               | Implementación del núcleo operativo                                                                                                | ✅ Completado 2026-08-12 — ver §18 para el detalle pieza por pieza y los gaps documentados                |
| STEP 4               | Validación (rating, tests)                                                                                                         | ⏳ Pendiente — ver §18.4 (siguiente acción recomendada)                                                   |
| STEP 5               | Entrada en `docs/audits/laravel-evolution-log.md` + alta en `docs/core-consolidation-plan-erp-saas.md` (ANEXO A) como bloque nuevo | ⏳ Pendiente                                                                                              |

---

## 14. Frontend — qué necesitará (a definir formalmente en STEP 2/3)

Todavía no hay rutas ni contratos concretos que documentar — se generarán y se añadirán a
`public/openapi/frontend.yaml` siguiendo las reglas de CLAUDE.md §19 cuando se implemente. Esta
sección anticipa, sin comprometer forma final, qué superficies necesitará el frontend:

- **Portal externo de maquila**: reutiliza el flujo de auth ya existente de `ExternalUser`
  (Sanctum + magic link, `AuthActorService`). No se prevé un sistema de login nuevo.
- **Vista de stock ("almacén virtual")**: listado de palets propios, filtrado por
  `external_processor_id` — análogo al patrón ya usado para usuarios externos genéricos.
- **Vista de trazabilidad**: árbol de producción filtrado (`buildFilteredProcessTree` extendido),
  de solo lectura.
- **Gestión de pedidos**: CRUD de cabecera de `Order` limitado a los campos permitidos (ver §5.6),
  con los campos de vinculación de palets/producción presentes en la respuesta pero no editables
  desde el portal (de solo lectura para el cliente).
- **Vista de incidencias y devoluciones**: lectura del estado de `Incident` y
  `ExternalProcessorReturn` asociados a su cuenta.

Cuando se implemente, esta sección se sustituirá por enlaces reales a los endpoints publicados en
el contrato OpenAPI, siguiendo el mismo patrón que `FRONTEND_OPENAPI_HANDOFF.md` usa para el resto
de la API.

---

## 15. Facturación de servicios de maquila — STEP 0a

**Estado:** STEP 0a (mapeo de entidades) completado el 2026-08-11, verificado en código. Fuera del
STEP 2 del §11 (que sigue su curso independiente). Sin cambios de código todavía.

**⚠️ Nota de terminología (2026-08-13):** esta sección se escribió el 2026-08-11, **antes** de la
corrección de entidad de §0/§18.0. Todo el texto original de §15.1-§15.5 usa `ExternalProcessor` /
`ExternalProcessorReturn` / `external_processor_id` para referirse a lo que hoy, tras la corrección,
es `TollClient` / `TollClientReturn` / `toll_client_id` — el cliente que nos envía **su** mercancía
para que la procesemos (no el subcontratista externo al que nosotros le mandamos la nuestra, que es
el `ExternalProcessor` real, un bloque completamente distinto sin relación con la facturación aquí
descrita). No se ha reescrito el texto histórico de §15.1-§15.5 por el mismo motivo que §5-§14 no se
reescribieron (ver §0): es el registro del proceso de diseño tal como ocurrió. A partir de aquí,
cualquier pregunta, decisión o código nuevo de esta pieza usa terminología correcta
(`TollClient`/`TollClientReturn`/`toll_client_id`).

### 15.1 Ideas de negocio (tal como las planteó el usuario)

1. Exportar, por cada expedición (al propio cliente de maquila o a los clientes de ese cliente), un
   albarán para facturar el servicio de maquila — al kg o a precio total — igual que ya se exporta a
   A3 en pedidos normales, con líneas y descripciones libres al estilo de otros productos de pedido.
2. Coste propio de producir (mano de obra, proceso), imputable por proceso o a nivel de producción
   global, para obtener el coste de haber producido algo.
3. Simular un precio de materia prima ajena (la del cliente de maquila) y calcular el coste final
   como se hace con producciones propias — para entender el mercado.

Explícitamente planteadas como base a mejorar con el tiempo, no como alcance cerrado.

### 15.2 Qué reutilizamos del sistema existente (verificado en código, 2026-08-11)

Buena noticia: las tres ideas tienen ya piezas reales y maduras en las que apoyarse — **esta parte
necesita bastante menos código nuevo del que parecía a priori.**

| Pieza existente                                                                                                                                                                    | Relevancia                                                                                                                                                                | Archivo                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `OrderAuxiliaryLine` (descripción libre, `quantity`+`unit`+`unit_price`+`tax_id`, subtotal/total con IVA ya calculados)                                                            | Encaja casi 1:1 con "línea de servicio facturable al kg o a precio total, con descripción libre" (idea 1)                                                                 | `app/Models/OrderAuxiliaryLine.php`          |
| `app/Support/OrderErpExportLines.php` + exports `A3ERPOrderSalesDeliveryNoteExport`/`FacilcomOrderSalesDeliveryNoteExport`                                                         | Ya serializan `Order::auxiliaryLines` al formato A3ERP/Facilcom sin distinguir su origen — si el cargo de maquila es una `OrderAuxiliaryLine`, el export ya sabe tratarlo | `app/Exports/v2/*DeliveryNoteExport.php`     |
| `ProductionCost` (imputación a `ProductionRecord` **o** `Production`, en `total_cost` **o** `cost_per_kg`, con `getEffectiveTotalCostAttribute()` ya calculando el coste efectivo) | Cubre idea 2 (coste por proceso o por producción global) **sin ningún cambio de esquema** — el modelo es agnóstico a quién es dueño del producto                          | `app/Models/ProductionCost.php:148-191`      |
| `CostCatalog` (tipos de coste: `production`/`labor`/`operational`/`packaging`, unidad `total`/`per_kg`)                                                                            | Catálogo de tipos ya listo para clasificar costes de maquila igual que los propios                                                                                        | `app/Models/CostCatalog.php`                 |
| `RawMaterialReceptionProduct.price` (decimal por línea de recepción, ya usado para calcular `net_weight * price`)                                                                  | Es literalmente el campo que idea 3 necesita para "simular un precio de materia prima" — no hace falta campo nuevo                                                        | `app/Models/RawMaterialReceptionProduct.php` |

~~**No existe hoy:** ningún mecanismo de exportación A3ERP/Facilcom para `RawMaterialReception`
(solo hay un export Excel plano de listado, no un albarán de compra/venta)~~.
⚠️ **CORREGIDO POR AUDITORÍA (§12, finance-auditor — hallazgo BLOQUEANTE)**: esta afirmación es
**falsa**. Sí existe: `app/Exports/v2/RawMaterialReceptionA3erpExport.php` genera hojas tituladas
`'ALBARANESCOMPRA'` (albarán de compra real), filtrable por proveedor/fechas, sin distinguir
origen. Ver §12 para el hallazgo completo sobre el riesgo que esto implica para la idea 3.

Sigue siendo cierto que no hay ninguna tarifa estándar por tipo de `Process` (el catálogo `Process`
es solo nombre/tipo, sin coste — el coste vive en `ProductionCost` a nivel de ejecución concreta,
no de catálogo), y ningún catálogo de tarifas de proveedor (el precio de recepción se introduce
manualmente línea a línea, no se deriva de una lista de precios).

### 15.3 El punto de decisión real: ¿a qué cuelga la línea de facturación del servicio?

Este es el único punto que no se resuelve con reutilización directa — requiere una decisión de
diseño. El servicio de maquila se factura siempre del tenant **al `ExternalProcessor`** (nunca al
cliente final de la mercancía), independientemente de por cuál de las dos vías salga la mercancía
físicamente (§5.4: `Order`+`Customer` si va a un cliente del maquilador, o `ExternalProcessorReturn`
si vuelve al propio maquilador). Esto significa que la línea de facturación **no puede colgar sin
más de un `Order` normal** — un `Order` siempre se factura a su `Customer`, no a un `ExternalProcessor`
distinto del destinatario de la mercancía. Reutilizar `Order`+`Customer` obligaría a crear un
`Customer` "fantasma" por cada `ExternalProcessor` — exactamente el mismo problema que ya se
descartó para `ExternalProcessorReturn` (decisión #4, §7) — o mezclar dos facturaciones distintas
(mercancía al cliente final + servicio al maquilador) en el mismo documento comercial, lo cual sería
confuso y probablemente incorrecto a efectos fiscales.

**Recomendación**: una entidad ligera de cargo (nombre provisional `MaquilaServiceCharge`),
independiente de por dónde salió la mercancía:

- `external_processor_id` (obligatorio, a quién se factura — siempre el maquilador, nunca el
  `Customer` final).
- Referencia polimórfica opcional a la expedición que originó el cargo (`Order` o
  `ExternalProcessorReturn`), solo para trazabilidad — "este cargo corresponde a esta expedición
  concreta".
- Líneas: en vez de duplicar el modelo, **extender `OrderAuxiliaryLine` a polimórfico**
  (`lineable_type`/`lineable_id` en vez de `order_id` exclusivo), reutilizando tal cual su cálculo
  de subtotal/total/IVA ya construido y probado. Mismo patrón que ya se decidió para `Incident`
  (§6.4) — consistente con cómo este bloque viene resolviendo el resto de piezas compartidas.
- Exportación: clonar el patrón `OrderErpExportLines`/`A3ERPOrderSalesDeliveryNoteExport` para esta
  entidad (el "bill-to" es `ExternalProcessor`, no `Customer` — necesita su propia clase de export,
  pero siguiendo un patrón ya muy maduro y repetido varias veces en el código, no uno nuevo).

Esta es una propuesta de STEP 0a, no una decisión cerrada — el usuario debe confirmarla o proponer
otra antes de pasar a STEP 2 de esta pieza.

### 15.4 Mapeo de entidades

**Reutilizar sin cambios:** `CostCatalog`, `ProductionCost`, `RawMaterialReceptionProduct.price`.

**Extender:** `OrderAuxiliaryLine` → polimórfico (ver §15.3); `Production`/`ProductionRecord` →
agregación de coste filtrable por `external_processor_id` (ya cubierto por §11.5, sin trabajo
adicional).

**Crear:** `MaquilaServiceCharge` (nombre provisional, §15.3) + su export A3ERP/Facilcom.

### 15.5 Preguntas abiertas de esta pieza

1. ¿Confirmas el enfoque de §15.3 (`MaquilaServiceCharge` + `OrderAuxiliaryLine` polimórfico), o
   prefieres facturar el servicio como líneas auxiliares del propio `Order`/`ExternalProcessorReturn`
   de la expedición, aceptando que en el caso `Order` el "bill-to" real (el maquilador) no coincide
   con el `Customer` del pedido?
2. ~~`raw_material_receptions.supplier_id` — ¿es una FK obligatoria hoy?~~ **Resuelta por auditoría
   (§12, finance-auditor — hallazgo BLOQUEANTE):** sí, es **NOT NULL** (`ON DELETE RESTRICT`), y
   `ExternalProcessor` no tiene ninguna relación con `Supplier` — son modelos completamente
   distintos. Esto significa que la idea 3 tal como estaba planteada (reutilizar
   `RawMaterialReceptionProduct.price` sin más) **no puede materializarse**: la recepción simulada
   necesitaría colgar de un `supplier_id` real, y ese `supplier_id` real la expone al export
   `RawMaterialReceptionA3erpExport.php` (`'ALBARANESCOMPRA'`, ver corrección en §15.2) y a
   `SupplierLiquidationService::getSuppliersWithActivity()/getLiquidationDetails()`, que escanean
   **todas** las recepciones de ese proveedor sin filtrar origen — con riesgo real de que un precio
   simulado se cuele en una exportación contable real o en una liquidación real a proveedor. La
   idea 3 necesita, como mínimo, un mecanismo de aislamiento explícito (tabla separada tipo
   `SimulatedRawMaterialCost` ligada a `ExternalProcessor`, o un flag `is_simulated`/`is_internal`
   verificado en ambas rutas de export y en las queries de liquidación) antes de poder
   implementarse tal como se planteó — pendiente de decisión del usuario, no de exploración.
3. El "coste de haber producido X" (idea 2) y el "coste final simulado" (idea 3, materia prima
   simulada + coste de producción) — ¿son datos solo para consulta interna (dashboard/reporte), o
   deben aparecer también en el documento exportado a A3/Facilcom como parte del cálculo del precio
   del servicio?
4. ¿El precio simulado de materia prima (idea 3) se introduce a mano por línea (reutilizando
   `RawMaterialReceptionProduct.price` tal cual), o se espera algún tipo de tarifa/referencia de
   mercado que lo sugiera automáticamente? (Confirmado que hoy no existe ningún catálogo de tarifas
   de mercado — sería functionality nueva si se quiere automatizar).

### 15.6 Próximos pasos de esta pieza

Resolver §15.5, en particular la pregunta 1 (es la única que cambia el modelo de datos), y después
redactar el STEP 2 de esta pieza en un formato equivalente a §11, para aprobación explícita antes de
tocar código.

---

## 16. Roadmap / próximos pasos

1. ~~Ejecutar STEP 0 (comportamiento detallado) sobre las piezas a extender.~~ ✅ §9.
2. ~~Ejecutar STEP 1 (análisis de riesgos).~~ ✅ §10.
3. ~~Resolver las preguntas abiertas del §8.~~ ✅ Resueltas (2026-08-11); confirmó además que
   facturación entra en alcance (decisión #6) — ver §15.
4. **Aprobar o ajustar el STEP 2 del §11** (propuesta concreta del núcleo operativo) — checkpoint
   pendiente, requiere aprobación explícita del usuario antes de generar migraciones o código.
5. ~~STEP 0a de facturación de servicios de maquila.~~ ✅ §15. Queda pendiente resolver §15.5
   (en particular la pregunta 1, sobre `MaquilaServiceCharge`) y redactar su propio STEP 2.
6. Tras aprobación del §11: STEP 3 (implementación del núcleo operativo).
7. Tras resolver §15.5: STEP 2 de facturación, para aprobación explícita.
8. Decidir prioridad y fecha de arranque de implementación (sin decidir a fecha 2026-08-11).

---

## 17. Referencias cruzadas

- Idea de negocio original: [`docs/nuevo_sistema_completo_maquila.md`](../nuevo_sistema_completo_maquila.md)
- Catálogo base de `ExternalProcessor` (bloque anterior, §0) y mapeo STEP 0a original de este bloque
  (§14, terminología corregida en §0 — leer `TollClient` donde diga `ExternalProcessor`):
  [`docs/catalogos/55-transformadores-externos-maquiladores.md`](../catalogos/55-transformadores-externos-maquiladores.md)
- Plan CORE v1.0: [`docs/core-consolidation-plan-erp-saas.md`](../core-consolidation-plan-erp-saas.md) (bloque aún no dado de alta — pendiente STEP 5)
- Workflow de evolución: [`docs/prompts/01_Laravel incremental evolution prompt.md`](../prompts/01_Laravel%20incremental%20evolution%20prompt.md)
- Contrato API/OpenAPI: [`docs/api-contract.md`](../api-contract.md), [`FRONTEND_OPENAPI_HANDOFF.md`](../../FRONTEND_OPENAPI_HANDOFF.md)
- Arquitectura multi-tenant: [`docs/fundamentos/01-Arquitectura-Multi-Tenant.md`](../fundamentos/01-Arquitectura-Multi-Tenant.md)
- **Documentación de consumo para el frontend del portal de maquila** (viva, separada de este
  documento): [`docs/maquila/frontend/00-index.md`](./frontend/00-index.md) y siguientes
  (`01-dashboard.md` a `07-devoluciones.md`, `99-pendientes-y-gaps.md`)
- Guía equivalente para el caso genérico de `ExternalUser` (A.21, sin `toll_client_id`):
  [`docs/instrucciones/external-users-frontend-guide.md`](../instrucciones/external-users-frontend-guide.md)

---

## 18. STEP 3 — Implementación del núcleo operativo (2026-08-12)

Implementación completa del núcleo operativo (§11), con las correcciones de auditoría de §12 ya
incorporadas **y con la corrección de terminología de §0 ya aplicada en todo el código** (entidad
`TollClient`, no `ExternalProcessor`). Todo lo descrito aquí **está implementado y verificado con
tests** (`tests/Feature/MaquilaApiTest.php`, 14 tests) salvo que se indique explícitamente como gap.
No se ha hecho `git commit`/`push` — los cambios quedan sin commitear para revisión del usuario,
según acuerdo del proyecto.

### 18.0 Corrección de entidad: `ExternalProcessor` → `TollClient`

La primera implementación de STEP 3 reutilizó por error `ExternalProcessor` (bloque anterior, ver
§0) para representar al cliente de maquila. Al revisar el resultado con el usuario se detectó la
confusión y se corrigió **antes de cerrar STEP 3**, con impacto en todas las piezas de §18.2:

- Entidad nueva y separada `TollClient` (tabla `toll_clients`, mismos campos que `ExternalProcessor`
  — nombre, NIF, contacto, dirección, emails — pero completamente independiente). CRUD completo
  nuevo: `TollClientController`, `Store/Update/Index/DestroyMultipleTollClient*Request`,
  `TollClientResource`, `TollClientPolicy`, rutas `/api/v2/toll-clients*` (mismo patrón que el CRUD
  ya existente de `ExternalProcessor`, sin tocarlo).
- Las 4 columnas de §11.1 (`raw_material_receptions`, `pallets`, `external_users`, `stores`) pasan a
  llamarse `toll_client_id` (antes `external_processor_id`) y apuntan a `toll_clients`, no a
  `external_processors`.
- **`Order` necesitó un campo nuevo, `toll_client_id`, que no existía en la propuesta original de
  §11.2/§5.4**: la propuesta original asumía (incorrectamente) que se podía reutilizar
  `orders.external_processor_id` para "el maquilador vende a sus propios clientes" — pero ese campo
  es del bloque anterior y significa lo contrario. Migración nueva
  `2026_08_12_090000_add_toll_client_id_to_orders_table.php`. `OrderPolicy`/`MaquilaOrderController`
  ahora comparan `order->toll_client_id === user->toll_client_id`, nunca `external_processor_id`.
- `ExternalProcessorReturn` → `TollClientReturn` (modelo, tabla `toll_client_returns`, service,
  policy, controller, Form Request, rutas `/api/v2/toll-client-returns*`).
- `ProductionRecord::resolveOwnerExternalProcessorId()` → `resolveOwnerTollClientId()`;
  `ActorScopeService::isMaquilador()` → `isTollClientUser()`; `PalletPolicy::isMaquilador()` →
  `isTollClientUser()`. Todo lo demás de §18.2 se describe ya con la terminología corregida.
- Verificado que el bloque anterior (`ExternalProcessor`, `Order.external_processor_id`,
  `Order.maquilador_destination`, `sendMaquiladorDocuments()`, `generateMaquiladorCMR/OrderSigns`) no
  se tocó en ningún punto — ambas entidades y ambos flujos de documentos conviven sin cruzarse.

### 18.1 Decisión previa: Resource de lectura para ExternalUser

Antes de tocar código se preguntó explícitamente al usuario (hallazgo bloqueante #5, §12.3) qué
`Resource` vería un `ExternalUser` cliente de maquila al leer `Order`/`Pallet`. Se decidió
**reutilizar `OrderResource`/`OrderDetailsResource`/`PalletResource` existentes + strip condicional
de campos**, mismo patrón ya usado en producción por `PalletManualCostPolicy` (oculta coste a quien
no tiene rol interno), en vez de crear resources dedicadas nuevas (que hubiera repetido la deuda
`API-CONTRACT-005` una tercera vez). Implementado en `app/Support/MaquilaOrderVisibilityPolicy.php`
(strip de `salesperson`, `fieldOperator`, `paymentTerm`, `billingAddress`, `productionNotes`,
`accountingNotes`, `offerId`, `routeId`, `routeStopId`, `createdByUserId`), aplicado en
`MaquilaOrderController`. `PalletManualCostPolicy` ya cubre el coste automáticamente para cualquier
`ExternalUser` (no tiene `hasAnyRole`, así que `authorized()` devuelve `false` sin cambios
adicionales).

### 18.2 Qué se implementó, por pieza de §11

- **§11.1 Migraciones**: `toll_client_id` (FK nullable a `toll_clients`) añadido a
  `raw_material_receptions`, `pallets` (+ índice compuesto `toll_client_id,status`),
  `external_users`, `stores`. Copia automática en `Pallet::boot()` (hook `saving`,
  `!$pallet->exists`), inmutable tras asignación (mismo mecanismo que ya protegía `reception_id`).
- **§11.1 No-mezcla de propietarios**: implementada en `ProductionInputService::create()/createMultiple()/syncMultiple()`
  y en `ProductionOutputConsumptionService::create()/createMultiple()` — **no** en `ProductionOutputService`
  como decía el texto original de §11.1 antes de la corrección de auditoría. Verificado en código
  durante la implementación: `ProductionOutputService::createSources()` no es un punto de mezcla real
  (solo agrega sources ya validados aguas arriba); el punto real adicional al que ya identificó la
  auditoría (`ProductionInputService`) es `ProductionOutputConsumptionService`, donde un proceso hijo
  se engancha al output de su padre — mismo riesgo de mezcla, mismo mecanismo de guardia
  (`ProductionRecord::resolveOwnerTollClientId()`/`hasOwnershipEstablished()`, nuevo, aditivo).
- **§11.2 Permisos** (la pieza central): `OrderPolicy::viewAny/view` extendidos a `ExternalUser`
  (fail-closed: solo si `toll_client_id` no es null); `OrderPolicy::updateAsProcessor()` nuevo y
  separado — **`OrderPolicy::update()` no se tocó**, tal como exigía el hallazgo bloqueante #2.
  `IncidentPolicy` nueva (antes no existía): `view()` delega en `OrderPolicy::view()`, `manage()` es
  exclusiva del tenant y nunca acepta `ExternalUser` — sustituye el uso de `OrderPolicy::update` como
  gate en `IncidentController`. `PalletPolicy` corregida: `create()` ahora comprueba almacén (recibe
  `storeId` opcional vía Gate) y es fail-closed para clientes de maquila (`toll_client_id !== null` ⇒
  solo `view`, nunca `create/update/delete`); discriminador es `toll_client_id`, **no** `type` (que
  es un ENUM de un único valor legal y hubiera sido un no-op, tal como advirtió la auditoría).
  `ActorScopeService::scopeOwnedPallets()` (aplicado en `PalletListService::list()`) y
  `scopeOwnedStock()` (implementado, **no conectado** a `StoreController::index()`, ver gap §18.3).
  `RawMaterialReceptionPolicy` rediseñada (antes plana, `hasAnyRole` para cualquier rol): ahora
  `ExternalUser` cliente de maquila solo lee sus propias recepciones, nunca escribe.
  Portal nuevo bajo `/api/v2/maquila/*` (middleware `actor:external`): `MaquilaOrderController`
  (index/show/update de cabecera, ver §18.3 sobre `create`), `UpdateOrderAsProcessorRequest` con
  whitelist derivada de `UpdateOrderRequest::PROCESSOR_EDITABLE_FIELDS` (fuente única, evita reglas
  divergentes entre ambos Form Requests). Reutiliza `OrderUpdateService::update()` tal cual — no hizo
  falta un `MaquilaOrderUpdateService` nuevo, porque ese servicio ya solo aplica los campos presentes
  en el array validado, y la whitelist del Form Request ya garantiza que pallets/producción/status
  nunca están presentes.
- **§11.3 Incidencias polimórficas**: migración añade `incidentable_type`/`incidentable_id`
  (nullable, índice compuesto) y backfill de filas existentes (`incidentable_type = 'order'`, usando
  el `morphMap` ya registrado en `AppServiceProvider`, mismo patrón que `Attachment.attachable_type`).
  Decisión explícita sobre la FK (hallazgo bloqueante #3): `order_id` pasa a nullable pero **conserva**
  su `onDelete('cascade')` sin cambios — una FK nullable con cascade solo actúa sobre las filas donde
  la columna está informada, así que el borrado en cascada de incidencias de `Order` es exactamente
  el mismo que antes. `Incident::incidentable()` (morphTo) es la relación real hacia delante;
  `order()`/`order_id` se conservan como "de conveniencia" (backing de `Order::incident()` hasOne) y
  `IncidentController::store()` ahora escribe ambos en paralelo. `Incident.toll_client_return_id`
  nullable añadido (decisión #7, §7). El flujo de incidencias de **recepción** (mencionado en §11.3
  como pieza nueva) **no se implementó** — ver gap §18.3.
- **§11.4 TollClientReturn**: modelo + tabla nuevos, FK directa `pallets.toll_client_return_id`
  nullable (no tabla pivote — corrección de auditoría confirmada: `order_pallets`/`OrderPallet` es
  código muerto). `TollClientReturnService::create()` transaccional: valida propietario único, no
  repetir palet, no vinculado a pedido, estado válido (`STORED`/`PROCESSED`), lote no cerrado
  (`ProductionLotLockService`), y llama `Pallet::changeToShipped()` sobre cada uno.
  `TollClientReturnPolicy`: lectura compartida tenant + cliente de maquila propietario, escritura
  exclusiva del tenant. Rutas `/api/v2/toll-client-returns` (`index`/`show` en el grupo
  `actor:internal,external`, `store` en el grupo interno).
- **§11.5 Trazabilidad por propiedad**: `Production::buildOwnershipFilteredProcessTree()` nuevo
  (aditivo, no toca `buildFilteredProcessTree()` ni `getNodeData()`), recorre el árbol vía
  `ProductionRecord::resolveOwnerTollClientId()`. Endpoint de solo lectura
  `GET /api/v2/maquila/productions/{production}/traceability`.

### 18.3 Gaps documentados explícitamente (no implementados en silencio, CLAUDE.md §18)

- **Creación de `Order` por el cliente de maquila** (§5.6 dice "crear/editar cabeceras"): solo se
  implementó **editar** (`updateAsProcessor`), no crear. Motivo: crear un pedido exige asignar un
  `Customer` final, y no existe ningún mecanismo aprobado en este STEP 2 para limitar qué `Customer`s
  puede ver/elegir un cliente de maquila concreto (no hay `Customer.toll_client_id` ni tabla de
  relación — añadirlo sería scope creep sobre las 5 tablas de §11.1/§18.0). Implementarlo requiere
  una decisión de producto explícita del usuario primero.
- **`ActorScopeService::scopeOwnedStock()`** está implementado pero **no conectado** a
  `StoreController::index()`: `Store.toll_client_id` es un campo nuevo sin backfill (a diferencia de
  `Pallet.toll_client_id`, que se autopuebla desde la recepción), así que aplicarlo ciegamente como
  filtro AND hoy dejaría a cualquier cliente de maquila sin ver ningún almacén virtual hasta que un
  admin lo rellene a mano. Queda listo para conectar en cuanto se defina el flujo de asignación de
  `Store.toll_client_id` (Paso 3 de docs/catalogos/55, adaptado).
- **Flujo de incidencias de recepción** (`RawMaterialReception` → `Incident` polimórfico): no
  implementado. `RawMaterialReceptionPolicy` ya está preparada (lectura scopeada por
  `toll_client_id`) pero no hay Controller/rutas nuevas para crear incidencias sobre recepciones — el
  doc ya advertía (§11.3, corrección laravel-expert) que esto implica repartir `IncidentController`
  en dos por el acoplamiento actual a rutas `$orderId` posicionales, y era más rediseño de contrato
  API que "extender". **Confirmado explícitamente por el usuario (2026-08-13):** se mantiene como gap
  documentado (no bloquea el rating de este bloque); se abordará como un sub-bloque propio con su
  propio STEP 0a/1/2 cuando corresponda, no en esta sesión.
- ~~**Stripping de campos internos anidados** (`order.customer.salesperson`, etc.)~~ — **Resuelta
  (2026-08-13, decisión explícita del usuario, reforzar ahora en vez de dejarlo como deuda):**
  `MaquilaOrderVisibilityPolicy::stripFromOrderArray()` ahora limpia también `order.customer.*`
  reutilizando la misma lista `HIDDEN_FIELDS` (salesperson, fieldOperator, paymentTerm,
  billingAddress, productionNotes, accountingNotes, createdByUserId), no solo el nivel superior del
  `Order`. Cubre los 4 puntos de uso (`index`/`show`/`update`/`store` de `MaquilaOrderController`, vía
  `OrderResource` y `OrderDetailsResource`, ambos serializan `customer` con `Customer::toArrayAssoc()`).
  Test nuevo: `MaquilaApiTest::test_toll_client_user_never_sees_internal_customer_fields_nested_in_order`.
- **Facturación de servicios de maquila (§15)**: fuera de alcance de este STEP 3, como estaba
  acordado; sigue pendiente de STEP 2 propio.

### 18.4 Contrato OpenAPI (CLAUDE.md §19)

`composer contract:update` y `composer contract:verify` ejecutados tras la corrección de §18.0; exit
code 0 en la comprobación final, sin breaking changes (una pasada intermedia mostró ~840 "breaking"
en endpoints no tocados por este trabajo — `processes`, `orders/{id}/cost-analysis` — que
desaparecieron al repetir `contract:update`/`verify` sin cambiar nada más, confirmando que era
inestabilidad de la generación vía `ResponseCalls` contra datos reales del tenant de desarrollo, no
una regresión real). El diff de `public/openapi/frontend.yaml` es grande (~25k líneas) pero **solo
~38 líneas corresponden a los endpoints nuevos de maquila** (`/maquila/*`, `/toll-clients*`,
`/toll-client-returns*`) — el resto es deuda de sincronización preexistente del contrato con el resto
de la API, ya desincronizada antes de empezar este trabajo. Se dejó publicada porque `contract:update`
no permite generar solo el delta de un módulo — el usuario debe revisar el diff completo antes de
commitear. Las migraciones nuevas también se aplicaron al tenant de desarrollo real
(`tenants:dev-migrate`) para que la generación del contrato pudiera probar los endpoints nuevos
contra datos reales.

### 18.5 Siguiente acción recomendada (STEP 4)

1. Revisión humana del diff de `public/openapi/frontend.yaml` antes de commitear (§18.4).
2. ~~Decisión de producto sobre creación de `Order` por el cliente de maquila~~ — **Resuelta e
   implementada, ver §19.**
3. `Store.toll_client_id`: decisión confirmada del usuario — el cliente de maquila **no** ve nuestros
   almacenes en absoluto (ni nombre, ni mapa), solo sus propios palets filtrados; el frontend lo
   representará como un masonry de cards (una por palet), no como un plano de almacén. No hace falta
   ningún trabajo adicional de backend — el filtrado por `Pallet.toll_client_id` ya cubre esto. Dado
   por cerrado, `scopeOwnedStock()` queda implementado y sin conectar, sin plan de conectarlo.
4. Rating DESPUÉS y entrada en `docs/audits/laravel-evolution-log.md` (STEP 4/5 del workflow) —
   **pendiente explícitamente a petición del usuario**, se hace después de que revise el código de
   esta sesión, no antes.

---

## 19. STEP 3 (continuación) — Pedido con "cliente al vuelo" y envío de documentación (2026-08-13)

Pieza que completa el gap #1 de §18.3: el cliente de maquila ya puede **crear** pedidos hacia sus
propios clientes (no solo editar cabecera), y la documentación de esos pedidos se envía **a nuestro
cliente de maquila**, nunca al cliente final. Cuatro decisiones confirmadas explícitamente por el
usuario antes de implementar (todas con opciones y recomendación presentadas primero):

1. **Cliente al vuelo → campos de texto libres en `Order`** (no ficha de `Customer`, no
   `buyerReference` reciclado).
2. **Envío de documentación → botón dedicado nuevo**, mismo patrón que el bloque anterior
   (`sendMaquiladorDocuments`), sin tocar ese código.
3. **`Store.toll_client_id` → no hace falta** (ver §18.5.3).
4. **STEP 4/5 → esperar a la revisión del usuario** (ver §18.5.4).

### 19.1 Cliente al vuelo

- `orders.customer_id` pasa a **nullable** (migración `2026_08_12_100000`). Es el único cambio de
  esquema que toca un campo ya existente en un bloque consolidado (A.2 Ventas) — se hizo con
  `->change()` sin tocar la FK, verificado que no rompe nada (30 tests de `OrderApiTest` +
  `MaquilaApiTest` en verde tras el cambio).
- Campos nuevos: `orders.adhoc_customer_name` (string), `orders.adhoc_customer_address` (text).
  Mutuamente excluyentes con `customer_id` por convención (nunca ambos a la vez), no por constraint
  de base de datos — lo impone `OrderStoreService::store()`.
- `Order::getCustomerDisplayNameAttribute()` (`customerDisplayName`) nuevo: devuelve
  `customer->name` si hay `Customer` real, si no `adhoc_customer_name`. Es el punto único que deberían
  usar frontend y futuros documentos para "nombre del cliente a mostrar".
- `MaquilaOrderController::store()` (nuevo) + `OrderPolicy::createAsProcessor()` (nuevo) +
  `StoreOrderAsProcessorRequest` (nuevo, deriva el whitelist de cabecera de
  `UpdateOrderRequest::PROCESSOR_EDITABLE_FIELDS`, igual que la edición, más `entryDate`/`loadDate`
  obligatorias y `adhocCustomerName` obligatorio/`adhocCustomerAddress` opcional). `toll_client_id` se
  fuerza siempre desde el usuario autenticado — el payload nunca puede fijarlo (verificado con test:
  un cliente de maquila que intenta pasar `tollClientId` de otro cliente en el body, se ignora).
- **Bug real encontrado y corregido en el camino**: `OrderStoreService::store()` hacía
  `$user = $user ?? auth()->user()` sin comprobar el tipo — para un actor `ExternalUser` esto hubiera
  asignado un `ExternalUser` a una variable tipada como `User`, y la siguiente línea
  (`$user->hasRole(...)`) habría lanzado un error fatal (`ExternalUser` no tiene `hasRole()`). Se
  corrigió para que solo se resuelva `auth()->user()` cuando es realmente una instancia de `User`.
- Sin `plannedProducts` en el whitelist del portal: la vinculación de líneas con precio/impuesto
  sigue siendo cosa del tenant (coherente con decisión #2, §7 — producción/comercial exclusivo del
  tenant); el cliente de maquila solo crea la cabecera del pedido.

### 19.2 Envío de documentación al cliente de maquila

- Plantillas PDF nuevas `pdf.v2.orders.toll_client_cmr` / `toll_client_order_signs`, copias
  adaptadas de `maquilador_cmr` / `maquilador_order_signs` (mismo layout físico del CMR, misma
  disposición de letreros) pero resolviendo el destinatario desde `adhoc_customer_name`/
  `adhoc_customer_address` y el remitente desde `Order::tollClient()`, nunca desde
  `externalProcessor()`/`maquilador_destination`. El bloque anterior no se tocó.
- `PDFController::generateTollClientCMR()`/`generateTollClientOrderSigns()`,
  `OrderMailerService::sendTollClientDocuments()`,
  `OrderDocumentController::sendTollClientDocumentation()` (exclusivo del tenant, igual que
  `sendMaquiladorDocumentation`) + ruta `POST orders/{orderId}/send-toll-client-documents`. Entradas
  nuevas en `config/order_documents.php` (`toll-client-cmr`, `toll-client-signs`) y plantilla de
  email `emails.orders.toll_client.blade.php`.
- No se ha podido probar la generación real del PDF en este entorno (Chrome/Snappdf no disponible en
  el sandbox de desarrollo — mismo motivo por el que el flujo análogo `sendMaquiladorDocumentation`
  tampoco tiene test de generación real). Sí están probadas las guardas (422 sin cliente de maquila
  asignado, 422 sin emails configurados).

### 19.3 Guardas defensivas por `customer_id` nullable

Al hacer `customer_id` nullable se detectaron (vía un agente de investigación dedicado, antes de
implementar) 6 vistas Blade que accedían a `$entity->customer->name/vat_number/alias/country`
directamente, sin `?->`, y que **habrían petado con un error 500** al generar su PDF para un pedido
sin `Customer` real: `CMR.blade.php`, `order_signs.blade.php`, `incident.blade.php`,
`order_confirmation.blade.php`, `restricted_loading_note.blade.php`, `order_sheets_combined.blade.php`.
Las 6 se corrigieron con acceso null-safe (`?->`) y fallback a `customerDisplayName`/`'-'`. También:

- `A3ERPOrderSalesDeliveryNoteExport` (`$order->customer->a3erp_code` sin `?->`) — se bloqueó a nivel
  de controller (`ExcelController::exportA3ERPOrderSalesDeliveryNote`, 422 si `customer_id` es null)
  en vez de tocar la clase de export, porque la decisión de negocio es que estos pedidos **no
  deberían exportarse a contabilidad en absoluto** (no son una venta real del tenant).
- Exportaciones filtradas/masivas (A3ERP, A3ERP2, Facilcom) — se añadió `whereNotNull('customer_id')`
  sobre la colección ya filtrada en `ExcelController`, sin tocar `OrderExportFilterService`
  (compartido también por la exportación de hojas de pedido en PDF, que sí debe poder incluir pedidos
  ad-hoc ahora que las plantillas son null-safe).
- `A3ERP2OrderSalesDeliveryNoteExport` y el export de Facilcom (single y bulk) ya eran null-safe por
  cómo estaban escritos (comprobación explícita o acceso por array) — no hacía falta tocarlos, solo
  se les aplicó el mismo filtro `whereNotNull` en la variante masiva por consistencia de negocio.
- `OrderStatisticsService` (ranking de ventas por cliente): usa un `INNER JOIN` con `customers` — ya
  excluye pedidos sin `customer_id` de forma natural, sin necesidad de ningún cambio.

### 19.4 Tests y verificación

`MaquilaApiTest.php` pasa de 14 a 19 tests (creación de pedido ad-hoc, aislamiento entre clientes de
maquila al crear, guardas de envío de documentación, guarda de exportación A3ERP). Regresión
verificada: `OrderApiTest` (30 tests, incluye el cambio de `customer_id` a nullable) en verde.
`OrderStatisticsApiTest` tiene fallos preexistentes (6-9 según el orden de ejecución) confirmados
también en `main` limpio antes de esta sesión — no relacionados, ya documentado como deuda de tests
con contaminación de estado entre ejecuciones, no de esta pieza.

### 19.5 Bug real detectado y corregido: `ActiveOrderCardResource` con cliente nulo

Al ejecutar `MaquilaApiTest` seguido de `OrderApiTest` en el mismo proceso PHPUnit, apareció un
fallo determinista (100% reproducible en ese orden, no aleatorio) en
`test_can_get_active_orders`: `ErrorException: Attempt to read property "id" on null` en
`app/Http/Resources/v2/ActiveOrderCardResource.php:22`.

**Causa raíz real (bug de esta sesión, no falso positivo):** el código usaba
`$this->when($condicion, ['id' => $this->customer->id, ...], null)`. En PHP los argumentos de una
llamada a función se evalúan siempre antes de invocarla, así que el array literal —incluyendo
`$this->customer->id`— se construye SIEMPRE, aunque `$condicion` sea `false`. Antes de esta sesión
`orders.customer_id` era `NOT NULL`, así que `$this->customer` nunca era `null` y el bug era
inofensivo. Al hacerlo nullable para soportar el "cliente al vuelo" (§19.1), un pedido de maquila
en estado `pending` (visible en `GET orders/active`) sin `customer_id` provoca el fatal. **Fix**:
sustituir el segundo argumento por una closure, que `when()` solo invoca si la condición es
verdadera:

```php
'customer' => $this->when($this->relationLoaded('customer') && $this->customer, function () {
    return ['id' => $this->customer->id, 'name' => $this->customer->name];
}, null),
```

Se revisó el resto de `app/Http/Resources/v2/*.php` en busca del mismo patrón (array literal en el
segundo argumento de `when()` referenciando una relación potencialmente nula) — no se encontraron
más casos.

**Por qué solo se reproducía en ese orden de tests (causa secundaria, preexistente, no corregida
en esta sesión):** `RefreshDatabase` únicamente envuelve en transacción la conexión _default_, no
la conexión dinámica `tenant` que usa `TenantMiddleware`. Como todos los tenants de test comparten
la misma base de datos física `testing` (solo cambia el `subdomain` lógico, ver
`BuildsOperationsScenario::createTenantAndAdminUser()`), un pedido `pending` creado por
`MaquilaApiTest` (cliente al vuelo, sin `customer_id`) no se revierte al terminar ese test y queda
visible para `OrderApiTest::test_can_get_active_orders` si se ejecuta después en el mismo proceso.
Esto es una fuga de aislamiento entre tests ya existente en el proyecto (no introducida ni corregida
aquí); lo que sí es de esta sesión y ya está corregido es el bug real de `ActiveOrderCardResource`
que esa fuga dejó al descubierto. Regresión verificada tras el fix:
`MaquilaApiTest + OrderApiTest` (34/34), `+ ExternalUsersApiTest + IncidentApiTest` (42/42).

---

## 20. STEP 2 — Facturación de servicios de maquila (cambios propuestos, 2026-08-13)

**Estado: PROPUESTO, sin código. Pendiente de aprobación explícita del usuario antes de pasar a
STEP 3 (CLAUDE.md §18).** Continúa §15 (STEP 0a), tras resolver §15.5 en esta sesión (respuestas en
§20.1). Terminología correcta desde aquí: `TollClient`/`TollClientReturn`/`toll_client_id` (ver nota
de terminología al inicio de §15) — no `ExternalProcessor`.

### 20.1 Respuestas confirmadas a §15.5 (2026-08-13)

1. **Modelo de cargo (§15.5 pregunta 1):** confirmado el enfoque de §15.3 — entidad nueva
   `MaquilaServiceCharge` + `OrderAuxiliaryLine` extendido a polimórfico. Se descarta colgar el
   cargo directamente de `Order`/`TollClientReturn` (mezclaría en un mismo documento comercial la
   venta de mercancía y el cargo de servicio, con "bill-to" distintos).
2. **Alcance del coste (§15.5 pregunta 3):** el coste (`ProductionCost` + materia prima simulada)
   es **solo para consulta interna** (dashboard/reporte de rentabilidad del servicio); no alimenta
   automáticamente el precio de la línea facturada al `TollClient`. El precio de la línea de
   `MaquilaServiceCharge` se introduce como cualquier `OrderAuxiliaryLine` (descripción libre +
   precio), sin fórmula `precio = f(coste)`.
3. **Precio simulado de materia prima (§15.5 pregunta 4):** se introduce a mano por línea,
   reutilizando el patrón de `RawMaterialReceptionProduct.price`, pero **aislado** de recepciones
   reales — no se construye ningún catálogo de tarifas de mercado.

### 20.2 Migraciones y modelos nuevos

**Qué**: crear tabla/modelo `maquila_service_charges`: `toll_client_id` (FK obligatoria, `NOT NULL`,
`ON DELETE RESTRICT` — nunca se factura sin saber a quién), `chargeable_type`/`chargeable_id`
(polimórfico nullable, referencia opcional a la expedición que originó el cargo — `Order` o
`TollClientReturn` —, solo para trazabilidad), `date`, `status` (a definir al implementar), `notes`.
**Por qué**: es el "bill-to" real (§15.3) — separa quién paga el servicio (`TollClient`) de quién
recibe la mercancía (`Customer`/cliente ad-hoc del `Order`, que puede no coincidir).
**Impacto**: 1 migración nueva, 1 modelo nuevo, factory, `MaquilaServiceChargePolicy` nueva
(staff-only para crear/editar — ver §20.4).

**Qué**: extender `order_auxiliary_lines` de `order_id` exclusivo a polimórfico
(`lineable_type`/`lineable_id`), con backfill de las filas existentes a `Order` — mismo patrón ya
usado para `Incident` (§6.4/§11.3).
**Por qué**: reutiliza el cálculo de subtotal/IVA/total ya construido y probado en
`OrderAuxiliaryLine`, sin duplicar lógica.
**Impacto**: 1 migración + backfill; `OrderAuxiliaryLine.php` (relación `lineable()` morphTo,
manteniendo un alias de conveniencia hacia `Order` si aplica, igual que se hizo con `Incident`);
`MaquilaServiceCharge::lines()` (morphMany); revisar los usos actuales de
`OrderAuxiliaryLine::order_id`/`->order` (exports A3ERP/Facilcom, `OrderErpExportLines`, cálculo de
totales del pedido) para que sigan funcionando sin cambio de comportamiento sobre `Order` — riesgo
de regresión medio, misma mitigación que §11.3 (backfill + tests de regresión sobre el flujo
existente de líneas auxiliares de pedido antes de cerrar el cambio).

**Qué**: aislamiento explícito del precio simulado de materia prima — tabla nueva
`simulated_raw_material_costs` (nombre provisional) ligada a `toll_client_id` (+ producto/línea
libre), en vez de reutilizar directamente `RawMaterialReceptionProduct.price` sobre una recepción
real con `supplier_id` obligatorio.
**Por qué**: hallazgo bloqueante de auditoría (§12, finance-auditor / §15.5 pregunta 2) —
`raw_material_receptions.supplier_id` es `NOT NULL` y los exports A3ERP
(`RawMaterialReceptionA3erpExport`, `'ALBARANESCOMPRA'`) y `SupplierLiquidationService` escanean
todas las recepciones de un proveedor sin filtrar origen. Colgar el precio simulado de una
recepción real arriesga que se cuele en una exportación contable real o en una liquidación real a
proveedor.
**Impacto**: 1 migración + modelo nuevo, sin tocar `RawMaterialReceptionProduct`/
`RawMaterialReception` existentes.

### 20.3 Exportación A3ERP/Facilcom

**Qué**: clonar el patrón `OrderErpExportLines` +
`A3ERPOrderSalesDeliveryNoteExport`/`FacilcomOrderSalesDeliveryNoteExport` para
`MaquilaServiceCharge` (el "bill-to" es `TollClient`, no `Customer`).
**Por qué**: consistencia con el resto del sistema de exportación contable; el `TollClient`
necesita su propio código A3ERP/Facilcom para el asiento — verificar al implementar si
`toll_clients` ya tiene campos equivalentes a `Customer.a3erp_code`/`facilcom_code` o hay que
añadirlos.
**Impacto**: nueva clase de export; posible migración pequeña adicional en `toll_clients` si faltan
esos códigos.

### 20.4 Permisos

**Qué**: `MaquilaServiceChargePolicy` — creación/edición restringida a staff interno (rol exacto a
cerrar al implementar, candidato natural: Comercial/Administrador); lectura **no** expuesta al
portal de `ExternalUser` en v1.
**Por qué**: es facturación interna nuestra hacia el `TollClient`, no un dato operativo que el
`TollClient` gestione (a diferencia de sus pedidos/pallets/trazabilidad, que sí lee hoy en el
portal, §5.6).

⚠️ **Decisión revertida (2026-08-13, durante la simulación del circuito 1, §25.7bis)**: al simular
el circuito completo del portal, el usuario confirmó explícitamente que el cliente de maquila **sí**
debe poder ver, en modo lectura, el cargo que le facturamos por el servicio de maquila (cargo
completo con líneas) — precisando además que esto es distinto de mostrarle el precio de los pedidos
que él vende a sus propios clientes finales, que sigue oculto sin cambios (§25.7). "Lectura no
expuesta al portal en v1" queda **sin efecto**; ver §25.7bis para el detalle de endpoints, Policy y
ramas alternativas de este acceso de lectura nuevo. No se ha tocado código todavía por esta
reversión — sigue en fase de documentación de intención, pendiente de la auditoría (§25.9).
**Impacto**: `app/Policies/MaquilaServiceChargePolicy.php`; sin cambios en `OrderPolicy` ni en las
rutas `/maquila/*` ya implementadas en §18/§19.

### 20.5 Fuera de alcance de este STEP 2 (confirmado explícitamente por el usuario, 2026-08-13)

- Cálculo automático del precio de servicio a partir del coste (fórmula `precio = f(coste)`) —
  respuesta 2 de §20.1.
- Catálogo de tarifas de mercado para sugerir el precio simulado de materia prima — respuesta 3 de
  §20.1.
- ~~Exposición de `MaquilaServiceCharge` en el portal del `TollClient`~~ — **revertido 2026-08-13,
  ver nota en §20.4 y §25.7bis: sí entra en alcance, solo lectura.**

### 20.6 Siguiente paso

Aprobación explícita del usuario sobre §20.2-§20.5 antes de pasar a STEP 3 (implementación). A
diferencia del núcleo operativo (§11/§12), esta pieza es más pequeña y ya incorpora los hallazgos
bloqueantes de la auditoría multi-pase original (§12) que le aplicaban (finance-auditor,
evolution-workflow) — no se propone repetir la auditoría de 8 agentes salvo que el usuario la pida
explícitamente para esta pieza también.

---

## 21. Bugs reales encontrados y corregidos al investigar adjuntos para el portal de maquila (2026-08-13)

**Contexto:** el usuario pidió poder adjuntar imágenes/documentos a `RawMaterialReception` y
`Production`, visibles también para el cliente de maquila. La investigación (agente Explore) reveló
que **ya existe un sistema transversal de adjuntos completo y en producción**
(`docs/implementacion/04_Plan_sistema_adjuntos_archivos.md`), con `HasAttachments` ya aplicado a
`Pallet` y `Order`, y `RawMaterialReception` ya anticipada como "Fase 4" (pendiente, con colecciones
candidatas ya propuestas). Antes de diseñar la extensión a recepciones/producción, trazar cómo
llegaría un `TollClient` a ver esos adjuntos destapó **tres bugs reales y preexistentes** (no
introducidos en esta sesión, pero que bloqueaban precisamente la funcionalidad pedida):

### 21.1 `PalletPolicy`: acceso en vez de propiedad para clientes de maquila

**Bug**: `PalletPolicy::view()`/`viewAny()` seguían gateando `ExternalUser` únicamente por
`canAccessStoreId()`/`stores()->exists()` (mecanismo de _acceso_ vía `Store.external_user_id`), sin
comprobar nunca `toll_client_id` (mecanismo de _propiedad_, ya correcto en `RawMaterialReceptionPolicy`
y `OrderPolicy`). `PalletListService::list()` aplicaba además `scopePallets` (acceso) Y
`scopeOwnedPallets` (propiedad) como filtro combinado. Efecto real: un cliente de maquila sin
`Store.external_user_id` asignado manualmente (que es la situación normal, tras la decisión de
§18.5.3 de no requerir ese paso) veía **cero palets** en el listado y **403** al pedir uno
individual — la promesa de §5.6 ("lectura completa de stock") no se cumplía en la práctica, y
ningún test lo cubría (todos los tests existentes de palets de maquila asignaban `Store` manualmente
para probar otra cosa, enmascarando el hueco).
**Fix**: `ActorScopeService::scopePallets()` ahora se salta el filtro de acceso para clientes de
maquila (lo cubre `scopeOwnedPallets`); `PalletPolicy::view()`/`viewAny()` aceptan `toll_client_id`
como camino de propiedad, igual que ya hacía `RawMaterialReceptionPolicy`. No toca `create`/`update`/
`delete`, que ya bloqueaban correctamente a un cliente de maquila.
**Test**: `MaquilaApiTest::test_toll_client_user_can_list_and_view_own_pallets_without_any_store_assignment`.

### 21.2 `AttachmentPolicy`: type-hint `User` en vez de `User|ExternalUser`

**Bug**: los 6 métodos de `AttachmentPolicy` estaban tipados `User $user` (no `User|ExternalUser`,
el patrón ya usado en `OrderPolicy`/`PalletPolicy`/`RawMaterialReceptionPolicy`). Como
`ExternalUser extends Authenticatable` (no extiende `User`), y `Gate::callPolicyMethod()` invoca el
método de la Policy sin comprobar compatibilidad de tipos, **cualquier `ExternalUser` que pidiera
adjuntos de un `Pallet`/`Order` (cliente de maquila o usuario externo genérico de A.21) recibía un
`TypeError` sin capturar → 500**, no un 403 limpio. Esto ya afectaba a la funcionalidad de adjuntos
de `Order`/`Pallet` ya publicada (Fase 1-3), no solo a lo nuevo — simplemente nunca se había probado
con un actor `ExternalUser` porque `AttachmentsBlockApiTest` solo usa `User` interno.
**Fix**: los 6 métodos ahora aceptan `User|ExternalUser`; `canDelete()` (privado) devuelve `false`
explícitamente para `ExternalUser` en vez de intentar `hasAnyRole()` (que `ExternalUser` no tiene).
**Test**: `MaquilaApiTest::test_toll_client_user_can_list_own_pallet_attachments_without_crashing`,
`test_toll_client_user_can_list_own_order_attachments_and_cannot_upload`.

### 21.3 `OrderPolicy::update()`: mismo problema de tipado, en el camino de escritura de adjuntos

**Bug**: `AttachmentPolicy::create()`/`update()` para adjuntos de `Order` delegan en
`Gate::allows('update', $order)` → `OrderPolicy::update(User $user, ...)`. Al arreglar §21.2, un
`ExternalUser` intentando subir/editar un adjunto de `Order` dejó de esconderse detrás de otro
`TypeError` y expuso el mismo problema aquí: `OrderPolicy::update()` seguía tipado solo `User`.
**Fix**: tipado ampliado a `User|ExternalUser`, con `if ($user instanceof ExternalUser) return false;`
explícito al principio — coherente con la decisión ya tomada en §11.2/§18.2 de que
`OrderPolicy::update()` nunca debe autorizar a un actor externo (solo `updateAsProcessor()` gestiona
edición de cabecera para el portal). Antes, esa intención se cumplía "por accidente" vía un crash no
capturado; ahora es un `return false` explícito → 403 limpio.
**Test**: incluido en `test_toll_client_user_can_list_own_order_attachments_and_cannot_upload`
(sube un archivo real con `UploadedFile::fake()`, confirma 403 en vez de 500).

### 21.4 Alcance no cubierto por estos fixes (a tener en cuenta al implementar Fase 4/Production)

- No se ha auditado si `PalletPolicy`/`OrderPolicy`/`AttachmentPolicy` son las únicas Policies con
  este patrón de tipado estricto `User`. Al implementar adjuntos para `RawMaterialReception` y
  `Production`, verificar en el momento si sus respectivas Policies (`RawMaterialReceptionPolicy` ya
  está bien; falta crear/revisar la de `Production` si aplica) aceptan `ExternalUser` de forma
  consistente antes de dar por hecho que "ya funciona para el cliente de maquila".
- No se ha tocado `AttachmentService::store()` (tipado `?User $user`) porque ningún actor externo
  llega a ese punto tras los fixes de Policy (se corta antes, con 403 limpio) — si en el futuro se
  decide que un cliente de maquila SÍ pueda subir adjuntos (fuera del alcance actual, que es
  solo lectura), habría que revisar también ese tipado.

### 21.5 Regresión verificada

`MaquilaApiTest + OrderApiTest + ExternalUsersApiTest + IncidentApiTest`: 46/46 (antes 43/43, +3
tests nuevos). `AttachmentsBlockApiTest` y `StockBlockApiTest` tienen fallos preexistentes
confirmados en `main` limpio (vía `git stash`, mismo número de fallos con y sin estos cambios) — no
relacionados con estos fixes. Contrato OpenAPI: `composer contract:verify` limpio, sin cambios (los
fixes son de autorización, no de forma de respuesta).

---

## 22. Branding del portal de maquila: login unificado + endpoint público de imagen (2026-08-13)

**Contexto:** al investigar cómo un cliente de maquila llegaría a ver sus recepciones desde el
portal (§21), surgió una pregunta de arquitectura más amplia: ¿login exclusivo por cliente, o login
único de la app que redirige según el usuario? Investigación en código confirmó que el backend **ya
implementa la segunda opción**: `POST /api/v2/login` → magic link/OTP → `AuthActorService::resolveByEmail()`
busca primero en `User`, luego en `ExternalUser` — un solo Sanctum, un solo flujo de email, sin
dominios ni logins distintos. Lo único que faltaba: la respuesta del login no exponía ninguna señal
fiable para que el frontend supiera "este actor es cliente de maquila, redirígelo a su portal"
(`externalUserType` es un ENUM de un único valor, compartido con el usuario externo genérico de
A.21 — no sirve como discriminador, ver §11.2/§18.2).

**Decisión del usuario:** las dos cosas a la vez — (1) añadir la señal al login común, y (2) además
un endpoint propio, público (visible ANTES de autenticar, para pintar la pantalla de acceso con la
marca del cliente), con dos imágenes distintas: una grande a la izquierda del formulario de login, y
un logo pequeño para la cabecera/menú una vez dentro del portal.

### 22.1 Qué se implementó

- **Login payload** (`AuthController::buildActorPayload()`): añadidos `tollClientId`/`tollClientName`
  (resueltos vía `ExternalUser::tollClient()`), `null` para `User` interno y para `ExternalUser` sin
  `toll_client_id` vinculado (genérico A.21). Aplica a `POST /login`, `GET /me` y el resto de
  endpoints de auth que reutilizan `buildActorPayload()`.
- **`TollClient`**: 3 campos nuevos (`slug`, `login_banner_image`, `logo_image`,
  migración `2026_08_13_100000_add_branding_fields_to_toll_clients_table.php`). `slug` se
  autogenera en `creating` (`Str::slug(name)` + sufijo numérico si colisiona) — es el identificador
  público y estable usado por el endpoint de branding, análogo a `Tenant.subdomain` pero para el
  cliente de maquila; no es secreto (mismo criterio que el subdominio del tenant en
  `Public\TenantController`). Accessors `loginBannerUrl`/`logoUrl` (mismo patrón que `Store.image`,
  disco `public`), expuestos en `toArrayAssoc()`/`TollClientResource`.
- **Ruta con tenant explícito en el path** (`toll-clients/{tenant}/{id}/login-banner|logo`,
  a diferencia de `Store.image`, que usa `stores/{id}/...` sin tenant — riesgo de colisión ya
  anotado en §9.2 de este documento, no corregido allí, evitado aquí desde el principio).
- **Endpoints staff** (grupo `role:tecnico,administrador,direccion,administracion,comercial`, mismo
  que el resto de CRUD de `toll-clients`): `POST/DELETE toll-clients/{tollClient}/login-banner`,
  `POST/DELETE toll-clients/{tollClient}/logo` — mismo patrón que
  `StoreController::updateImage/deleteImage`, con la corrección de que aquí `authorize()` sí se
  invoca en los 4 métodos (en `Store` falta en `updateImage`, hallazgo no corregido por estar fuera
  de alcance de este bloque).
- **Endpoint público nuevo**: `GET /api/v2/toll-clients/branding/{slug}` (`app/Http/Controllers/Public/TollClientBrandingController.php`),
  registrado en la misma sección "pública" del grupo `v2` que `login`/`auth/request-access`
  (`middleware: ['tenant']` a nivel de grupo, sin `auth:sanctum` en la ruta individual — mismo
  patrón exacto, ver `routes/api.php` línea ~220). Requiere `X-Tenant` (resuelve la conexión del
  tenant) pero no requiere sesión. Devuelve 404 si el `slug` no existe o el cliente está inactivo
  (`is_active = false`) — nunca filtra existencia/inactividad con otro código. Throttle `30,1` para
  limitar enumeración de slugs. No expone nada más sensible que nombre + URLs de imagen (equivalente
  a lo que ya hace `Public\TenantController::showBySubdomain` para el tenant).

### 22.2 Fuera de alcance de esta pieza (a valorar en el futuro)

- Gestión de las imágenes desde el propio portal del cliente de maquila (hoy solo staff interno
  puede subir/borrar) — no se pidió.
- Branding más allá de dos imágenes (colores, textos) — no se pidió.
- El endpoint de recepciones para el portal de maquila (§21.4, discusión de login que originó esta
  pieza) sigue pendiente — se retomará por separado.

### 22.3 Hallazgo de testing (infraestructura, no de producción)

Al escribir el test de login, se detectó que autenticar como **dos actores `ExternalUser`
distintos dentro del mismo método de test**, encadenando `withHeaders()`/`getJson()`
secuencialmente, hace que la segunda petición siga devolviendo el actor de la primera. No es un bug
de `AuthController`/Sanctum en producción (confirmado sirviendo requests HTTP reales, cada una con
su propio proceso) — es una particularidad conocida de Laravel testing: el guard de Sanctum
(`RequestGuard`) memoriza el usuario resuelto en la primera llamada dentro del mismo proceso de
test y no se invalida entre peticiones sucesivas del mismo método. Ningún test existente en el
proyecto había ejercido este patrón (un solo actor por test, o mismo actor en varias peticiones).
**Mitigación aplicada**: separar en dos tests independientes en vez de perseguir un
`Auth::forgetGuards()` u otro workaround dentro de un único test — más simple y evita depender de
una particularidad no documentada de Laravel. Si en el futuro se necesita testear dos actores en el
mismo método, tenerlo en cuenta.

### 22.4 Regresión verificada

`MaquilaApiTest` completo: 53/53 (antes 46, +7 tests: slug único, login payload con/sin
`toll_client_id`, endpoint público con cliente activo/inactivo/inexistente, subida/borrado de
imágenes por staff, bloqueo a cliente de maquila). `OrderApiTest + ExternalUsersApiTest +
IncidentApiTest` sin cambios, 53/53 en conjunto. Contrato OpenAPI actualizado y verificado
(`composer contract:update` + `contract:verify`, exit limpio): confirmadas en el diff las 3 rutas
nuevas (`/toll-clients/branding/{slug}`, `/toll-clients/{tollClient}/login-banner`,
`/toll-clients/{tollClient}/logo`) y el campo `tollClientId`/`tollClientName` en la respuesta de
`/me`.

---

## 23. Adjuntos de recepción/producción y no-mezcla de propietarios a nivel de lote (2026-08-13)

Continúa Fase 4 del plan de adjuntos (§21) y cierra el punto 2 del encargo de esta sesión sobre la
regla de no-mezcla de propietarios. Tres piezas, implementadas en este orden porque la segunda
condicionaba a la tercera.

### 23.1 Adjuntos de `RawMaterialReception` (Fase 4)

Sin novedad de diseño respecto a lo ya decidido: `HasAttachments` añadido a `RawMaterialReception`;
7 colecciones registradas en `config/attachments.php['collections']['reception']` tal cual se
habían acordado (`supplier_document`, `weighing_ticket`, `invoice_or_delivery_note`,
`reception_photo`, `pallet_photo`, `quality_control`, `damage_or_discrepancy`), con mimes/tamaños
calcados del criterio ya usado en `order`/`pallet` (documentos PDF/Office 20 MB, imágenes 10 MB).
`ReceptionAttachmentController` clona exactamente el patrón de `PalletAttachmentController`/
`OrderAttachmentController` (mismos 7 métodos/rutas), registrado bajo el mismo grupo
`actor:internal,external` que los adjuntos de palet/pedido — no bajo el grupo `role:*` donde vive
el resto del CRUD de `raw-material-receptions`, porque el cliente de maquila necesita acceso de
lectura. `RawMaterialReceptionPolicy` ya estaba correctamente tipada (`User|ExternalUser`) y
scopeada por `toll_client_id` desde §21, así que `AttachmentPolicy` (que delega en ella) funciona
sin tocar nada más. `morphMap['reception']` ya estaba registrado desde la Fase 4 original.

### 23.2 No-mezcla de propietarios extendida al lote completo (`Production`)

**Investigación previa (a petición explícita del usuario, antes de tocar código):** decisión #1
(§7) dice literalmente "no se permite mezclar propietarios en un mismo palet/**lote** de
producción" — y en la terminología del propio código `Production.lot` es el lote (`ProductionLotLockService`,
comentarios de `Production::boot()` hablan de "lote"). La implementación de STEP 3 (§18.2) solo
aplicó la regla dentro de cada `ProductionRecord` (proceso individual), no a nivel del `Production`
completo, que podía contener varios `ProductionRecord` raíz de propietarios distintos.

Antes de implementar se encontró un conflicto real: `Production::buildOwnershipFilteredProcessTree()`
(§11.5/§18.2, ya implementado el día anterior) recorre todos los root records de un `Production` y
filtra nodo a nodo por propietario — diseño que solo tiene sentido si un `Production` puede
legítimamente mezclar propietarios. `MaquilaTraceabilityController::show()` se apoya en ese
comportamiento. Se reportó el hallazgo al usuario antes de tocar nada (tal como pedía el encargo);
el usuario confirmó explícitamente que, aunque un mismo túnel/autoclave físico procese producto de
propietarios distintos por motivos de eficiencia de carga, cada propietario debe seguir teniendo su
**propio `Production`/lote** en el sistema — la regla de no-mezcla se mantiene también a nivel de
lote completo, sin excepción operativa.

**Implementado:**

- `Production::hasOwnershipEstablished()` / `Production::resolveOwnerTollClientId()` (nuevos,
  análogos a los ya existentes en `ProductionRecord`, pero recorriendo `$this->records()` en vez de
  los inputs/consumos de un único proceso).
- `ProductionInputService::assertOwnerConsistency()` y
  `ProductionOutputConsumptionService::assertOwnerConsistency()` (los dos puntos reales de mezcla,
  ya identificados en §12.3.1/§18.2) ahora comparan contra el propietario establecido del
  `Production` completo, no solo del `ProductionRecord` que recibe el input/consumo — así que
  añadir una caja de un propietario distinto en un proceso **hermano** del mismo lote también se
  rechaza, no solo dentro del mismo proceso.
- `buildOwnershipFilteredProcessTree()` **no se ha tocado**: se conserva como red de seguridad de
  solo lectura para datos que no pasaran por el nuevo gate (p. ej. si en el futuro se detecta o
  corrige manualmente algún dato inconsistente), pero ya no debería encontrar producciones mezcladas
  en datos creados a partir de esta sesión.
- Tests nuevos en `MaquilaApiTest`: mezcla rechazada entre dos `ProductionRecord` distintos del
  mismo `Production` (dos clientes de maquila, y tenant + cliente de maquila); mismo propietario en
  records distintos del mismo lote sigue permitido. El test existente de trazabilidad
  (`test_maquila_traceability_endpoint_filters_by_ownership`) se adaptó para construir el escenario
  mezclado creando los `ProductionInput` directamente por Eloquent (saltándose el servicio), ya que
  ya no se puede construir esa mezcla a través del flujo normal — documentado inline en el test.

**No se ha tocado** (fuera de alcance de este encargo, gap pre-existente ya anotado en el código):
`StoreProductionRecordRequest`/`UpdateProductionRecordRequest` siguen sin validar que
`parent_record_id` pertenezca al mismo `production_id` que el nuevo record — no es el mecanismo por
el que ocurre la mezcla de propietarios (que ya queda cubierta por el punto anterior), pero es una
inconsistencia de integridad referencial distinta que no se pidió corregir aquí.

### 23.3 Adjuntos de `Production`

Una vez resuelto 23.2, `Production` tiene una noción fiable de propietario único a nivel de lote.
Implementado:

- `HasAttachments` añadido a `Production`; `morphMap['production'] = Production::class` registrado
  en `AppServiceProvider` junto a los otros tres.
- 4 colecciones en `config/attachments.php['collections']['production']`: `production_photo`,
  `production_quality_control`, `production_document`, `production_damage_or_discrepancy` (tal
  cual se habían confirmado), mismos criterios de mimes/tamaños que el resto.
- `ProductionAttachmentController`, mismo patrón clonado, rutas bajo `actor:internal,external`
  (no bajo el grupo `role:*` donde vive el resto de `productions/*`).
- **`ProductionPolicy` corregida** (antes tipada solo `User`, sin ningún camino para `ExternalUser`
  — el mismo patrón de bug que ya había causado 3 incidentes reales en §21): ahora
  `User|ExternalUser` en los 7 métodos. `viewAny`/`view` aceptan `ExternalUser` cliente de maquila;
  `view()` exige `Production::hasOwnershipEstablished() && resolveOwnerTollClientId() ===
$user->toll_client_id` — fail-closed: un lote sin propiedad establecida todavía (vacío, o con
  procesos sin inputs/consumos) no es visible para ningún cliente de maquila, porque no hay forma
  de confirmar de quién es. `create`/`update`/`delete`/`close`/`reopen` devuelven `false` explícito
  para `ExternalUser` (producción exclusiva del tenant, decisión #2, §7). No se ha tocado
  `MaquilaTraceabilityController::show()` para usar esta Policy (hoy no hace ningún chequeo de
  autorización, solo filtra por propiedad) — es una mejora posible pero no se pidió en este encargo
  y su superficie de riesgo ya es baja (devuelve árbol vacío si el cliente no tiene nada en esa
  producción).
- Tests nuevos en `MaquilaApiTest`: cliente de maquila ve adjuntos de su propia producción y no
  puede subir; no ve adjuntos de la producción de otro cliente de maquila; no ve adjuntos de una
  producción propiedad del tenant; no ve adjuntos de una producción sin propiedad establecida
  todavía (fail-closed); staff puede subir y descargar.

### 23.4 Regresión y contrato verificados

`MaquilaApiTest`: 40/40 (35 tras 23.1, +5 tras 23.3). Conjunto
`MaquilaApiTest + OrderApiTest + ExternalUsersApiTest + IncidentApiTest + AttachmentsBlockApiTest`:
75/77 (los 2 fallos son `AttachmentsBlockApiTest::test_subida_rechaza_coleccion_invalida` y
`test_operario_no_puede_borrar_adjunto`, confirmados preexistentes en `main` limpio vía `git stash`
antes de tocar nada — no relacionados con este trabajo). `ProductionBlockApiTest` en solitario
resultó ser ya inestable en `main` limpio (17-23 errores según la ejecución, sin tocar código) por
la misma contaminación de estado entre tests de la BD `testing` compartida ya documentada en
sesiones anteriores — no se ha usado como señal de regresión por no ser fiable, se usó
`MaquilaApiTest` (determinista, 40/40) como verificación principal. Contrato OpenAPI:
`composer contract:update` + `contract:verify` con exit limpio en ambas piezas; diff confirmado
limitado a las rutas nuevas (`raw-material-receptions/{id}/attachments*`,
`productions/{id}/attachments*`) más reordenamiento de claves YAML preexistente sin contenido
nuevo.

### 23.5 Pendiente (histórico — resuelto en §24)

- ~~Endpoint del portal para que el cliente de maquila liste sus propias recepciones/producciones~~
  — **Aprobado 2026-08-13, ver §24.**
- ~~STEP 2 de facturación (§20)~~ — **Aprobado tal cual 2026-08-13, con el matiz de que
  `MaquilaServiceChargePolicy` restringe creación/edición a rol Administrador únicamente (no
  Comercial+Administrador como sugería la recomendación de §20.4) — ver §24.**
- STEP 4/5 (rating, evolution log) — pendiente a que el usuario revise el código de esta sesión y de
  las anteriores (§18.5.4), no se da el bloque por cerrado todavía. El usuario confirmó explícitamente
  seguir avanzando en las dos piezas de arriba mientras tanto, en vez de detenerse a esperar la
  revisión.

---

## 24. Decisiones confirmadas 2026-08-13 (continuación) y STEP 3 de portal + facturación

Tras el resumen de pendientes de §23.5, se presentaron 4 preguntas al usuario (portal de
recepciones/producciones, aprobación de facturación §20, rol de `MaquilaServiceChargePolicy`, y
cómo proceder mientras se revisa el código). Respuestas:

1. **Portal de recepciones/producciones**: implementarlo ya.
2. **STEP 2 de facturación (§20)**: aprobado tal cual (§20.2-§20.4), sin cambios de diseño.
3. **Rol de `MaquilaServiceChargePolicy`**: **solo Administrador** (no Comercial+Administrador, que
   era la recomendación de §20.4) — el usuario prefiere restringir la gestión de cifras de coste del
   servicio de maquila a dirección/administración únicamente.
4. **Mientras se revisa el código**: seguir avanzando con lo aprobado, sin detenerse a esperar el
   STEP 4/5.

El detalle de implementación de ambas piezas se documenta a medida que se completan, más abajo en
esta misma sección.

### 24.1 Portal — listado/detalle de recepciones y producciones propias

Implementado tal cual §21.4/§22.2 anticipaba: `MaquilaReceptionController` (`GET
/api/v2/maquila/receptions`, `GET /api/v2/maquila/receptions/{id}`) y `MaquilaProductionController`
(mismos verbos bajo `/maquila/productions`), ambos bajo `actor:external` (mismo grupo que
`/maquila/orders`), reutilizando `RawMaterialReceptionPolicy`/`ProductionPolicy` ya correctamente
tipadas y scopeadas.

- **`MaquilaReceptionVisibilityPolicy`** (nueva, mismo patrón que `MaquilaOrderVisibilityPolicy`):
  oculta `supplier`, `prices`, `declaredTotalAmount`, `totalAmount`, `supplier_liquidation_id` y
  `details[].price` — hallazgo real detectado al escribir esta pieza: `RawMaterialReceptionResource`
  expone precios de línea y datos de proveedor sin ninguna protección, y toda recepción (incluida la
  de un cliente de maquila) cuelga de un `supplier_id` real (`NOT NULL`, hallazgo ya conocido de
  §12.3.6) — sin este strip, el cliente de maquila vería nuestro coste interno de su propia mercancía.
  Requirió forzar la serialización completa vía `json_decode(json_encode($resource), true)` antes del
  strip: `resolve()` no convierte recursivamente las `JsonResource` anidadas (`details`, `pallets`) a
  array plano, a diferencia del caso de `Order.customer` (que ya era un array vía `toArrayAssoc()`).
- **`MaquilaProductionVisibilityPolicy`** (nueva, más ligera): oculta `closedBy`/`closedByUser`/
  `reopenedBy`/`reopenedByUser` (identidad de empleado interno, mismo criterio que `salesperson` en
  `MaquilaOrderVisibilityPolicy`). `ProductionResource` no expone ningún dato de coste.
- El listado de producciones no tiene columna `toll_client_id` propia (se resuelve vía cadena de
  inputs, §23.2) — el filtro usa `whereHas('records.inputs.box.palletBox.pallet', ...)` en vez de un
  `where` directo.
- Tests: listar/ver recepciones y producciones propias sin campos financieros/identidad interna,
  aislamiento entre clientes de maquila distintos, en `MaquilaApiTest` (44/44 tras esta pieza).

### 24.2 Facturación de servicios de maquila — STEP 3

Implementado tal cual §20.2-§20.4, sin cambios de diseño respecto a lo aprobado:

- **`order_auxiliary_lines` → polimórfico** (`lineable_type`/`lineable_id`), mismo patrón exacto ya
  usado en `incidents` (§11.3/§18.2): `order_id` pasa a nullable pero conserva su
  `cascadeOnDelete()` sin cambios, y se mantiene como columna de conveniencia real — backing de
  `Order::auxiliaryLines()`, que seguía sin tocar y sigue siendo lo que usan sin cambios
  `OrderErpExportLines`, `AuxiliaryLineStatisticsService` (excluye filas con `order_id` null vía su
  `INNER JOIN` existente, sin necesidad de tocarlo), PDF/mailer de pedidos, y
  `OrderAuxiliaryLineController`. El dual-write (`order_id` → `lineable_type`/`lineable_id`) vive en
  `OrderAuxiliaryLine::boot()` (hook `saving`), no en cada punto de creación — ningún controlador ni
  factory existente necesitó tocarse.
- **`MaquilaServiceCharge`** (tabla + modelo nuevos): `toll_client_id` obligatorio (`restrictOnDelete()`,
  nunca cascade — nunca se factura sin saber a quién), `chargeable_type`/`chargeable_id` polimórfico
  opcional (`Order` o `TollClientReturn`, solo trazabilidad — se registró `toll_client_return` en el
  morphMap, que hasta ahora no lo necesitaba por no usarse polimórficamente). `lines()` es un
  `morphMany(OrderAuxiliaryLine::class, 'lineable')` — mismo cálculo de subtotal/IVA/total reutilizado
  tal cual.
- **`SimulatedRawMaterialCost`** (tabla + modelo nuevos): aislada por completo de
  `raw_material_receptions`/`raw_material_reception_products` (hallazgo bloqueante finance-auditor,
  §12.3.6/§15.5) — sin ninguna FK ni relación hacia esas tablas, solo consulta interna.
- **Permisos**: `MaquilaServiceChargePolicy`/`SimulatedRawMaterialCostPolicy` nuevas —
  lectura para cualquier rol interno, creación/edición/borrado **solo Administrador** (decisión
  explícita del usuario, más restrictiva que la recomendación original de §20.4). Ninguna acepta
  `ExternalUser` — no hay rutas bajo `actor:external` para esta pieza, verificado con test que
  confirma que un `ExternalUser` nunca recibe 200 (403/401 limpio, no el `TypeError` de §21.2/§21.3).
  ⚠️ **Revertido parcialmente el 2026-08-13** (§20.4, §25.7bis): `MaquilaServiceChargePolicy::view`/
  `viewAny` deben ampliarse para aceptar `ExternalUser` propietario (`toll_client_id` coincide),
  manteniendo `create`/`update`/`delete` exclusivos de Administrador sin cambios — pendiente de
  implementar, todavía en fase de documentación de intención (§25).
- **Export A3ERP/Facilcom**: `MaquilaServiceChargeErpExportLines` (clon de `OrderErpExportLines`) +
  `A3ERPMaquilaServiceChargeExport`/`FacilcomMaquilaServiceChargeExport` (clones de los exports de
  `Order`), con el "bill-to" resuelto desde `TollClient::a3erp_code`/`facilcom_code` — campos nuevos
  en `toll_clients` (antes solo existían en `customers`), añadidos también a
  `StoreTollClientRequest`/`UpdateTollClientRequest`/`TollClientController::prepareForStorage()`.
- **Bug real encontrado y corregido en el camino**: tanto `MaquilaServiceChargeController` como
  `SimulatedRawMaterialCostController` hacían `Model::create($request->validated())` directamente —
  como los Form Requests validan claves camelCase (`tollClientId`) pero los modelos son `$fillable`
  en snake_case (`toll_client_id`), la columna obligatoria nunca se rellenaba y el insert fallaba en
  BD (`Field 'toll_client_id' doesn't have a default value`). Se corrigió con un `prepareForStorage()`
  por controlador (mismo patrón ya usado en `TollClientController`) — ausente en el texto original de
  §20, no se había anticipado porque `TollClientReturnController`/`IncidentController` delegan esa
  parte en un Service, no en `Model::create()` directo.
- **Bug menor encontrado y corregido**: `MaquilaServiceCharge::create()` sin `status` explícito dejaba
  el atributo en memoria como `null` (el DEFAULT `'draft'` de MySQL se aplica en BD pero Eloquent no
  relee la fila tras el insert) — corregido con `protected $attributes = ['status' =>
self::STATUS_DRAFT]` a nivel de modelo, no solo en la migración.
- Tests: `MaquilaServiceChargeApiTest.php` (9 tests) — CRUD y restricción de rol, líneas y cálculo de
  totales, aislamiento entre cargos, dual-write de `OrderAuxiliaryLine`, aislamiento de
  `SimulatedRawMaterialCost` frente a recepciones reales (comparación antes/después de conteo, no
  conteo absoluto — la BD `testing` se comparte entre "tenants" de test, un conteo absoluto a 0
  habría sido frágil dependiendo del orden de ejecución de otros archivos).

### 24.3 Regresión y contrato verificados

`MaquilaApiTest` (44/44) + `MaquilaServiceChargeApiTest` (9/9) + `OrderApiTest` (16/16) +
`OrderAuxiliaryLineApiTest` (9/9) + `AuxiliaryLineStatisticsApiTest` (4/4) + `ExternalUsersApiTest` +
`IncidentApiTest` + `AttachmentsBlockApiTest`: 103/103 salvo los 2 fallos de
`AttachmentsBlockApiTest` ya confirmados preexistentes en `main` limpio en sesiones anteriores (no
relacionados). Contrato OpenAPI: `composer contract:update` + `contract:verify` con exit limpio tras
una repetición (la primera pasada mostró ~891 "breaking" en endpoints no tocados —
`processes`, `orders/{id}/cost-analysis`, decenas de rutas preexistentes — que desaparecieron al
repetir sin cambiar nada más; mismo patrón de inestabilidad de generación vía `ResponseCalls` ya
documentado en §18.4, no una regresión real). Diff final verificado por comparación de conjuntos
(claves añadidas menos claves quitadas): exactamente las 16 rutas nuevas de esta sesión
(`raw-material-receptions/{id}/attachments*`, `productions/{id}/attachments*`,
`maquila-service-charges*`, `simulated-raw-material-costs*`, `maquila/receptions*`,
`maquila/productions*`), el resto es reordenamiento de claves YAML preexistente sin contenido nuevo.

### 24.4 Pendiente

- STEP 4/5 (rating, evolution log) — sigue pendiente a que el usuario revise el código completo de
  la sesión (todas las piezas: núcleo operativo, adjuntos, no-mezcla a nivel de lote, portal de
  recepciones/producciones, facturación). El usuario confirmó explícitamente seguir avanzando
  mientras tanto (§24, punto 4) en vez de detenerse a esperar la revisión.
- Nada más queda pendiente de decisión del usuario en el alcance de este bloque a fecha
  2026-08-13 — los dos huecos identificados en §23.5 (portal y facturación) quedaron resueltos e
  implementados en esta sección.

---

## 25. Simulación de circuitos de negocio — Circuito 1: portal del cliente de maquila (2026-08-13)

**Estado: circuito documentado y con decisiones de alcance confirmadas por el usuario. Pendiente de
confirmación final del texto antes de pasar a la fase de auditoría contra código real** (comprobar
alcanzabilidad por actor, Policies, rutas y tests existentes — no se hace en esta sección, se hace
en una sección posterior tras aprobar esta). Metodología acordada con el usuario para esta sesión:
simular circuitos completos tal como los recorrería un cliente de maquila real, documentar primero
la intención de negocio (aunque no esté implementada así todavía), y solo después auditar el código.

Este circuito cubre la experiencia de navegación completa del portal narrada por el usuario a grosso
modo: login → dashboard → almacén interactivo → producciones (listado, panel interactivo, detalle) →
gestor de pedidos. Se afinó con 4 preguntas de alcance, respondidas el 2026-08-13 (§25.1).

### 25.1 Decisiones de alcance confirmadas (2026-08-13)

| #   | Decisión                                                                                                                                                                              | Elegida sobre                                                       | Motivo/nota                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Dashboard = resumen operativo con contadores (producciones abiertas propias, recepciones recientes, pedidos por estado, stock total en kg del almacén virtual)                        | vs. solo accesos rápidos sin métricas, vs. añadir series temporales | Pieza 100% nueva (ver §25.7) — sin coste ni datos internos, mismo criterio de recorte que el resto del portal                                                                                                                                       |
| 2   | Panel interactivo de producciones = adaptación de `ProductionControlPanelService` (estado derivado + alertas de reconciliación de cantidades), incluyendo también cerradas, sin coste | vs. vista simple de solo conteos, vs. no crear pantalla separada    | El panel interno ya existente (`app/Services/Production/ProductionControlPanelService.php`) es el precedente más maduro, pero hoy solo cubre `closed_at IS NULL` y expone `manualCostPerKg`/alertas de coste — no reutilizable tal cual (ver §25.4) |
| 3   | Filtros del listado de producciones del portal: lote, rango de fechas, estado, especie                                                                                                | —                                                                   | `MaquilaProductionController::index` hoy no tiene ningún filtro (verificado en código, §25.4)                                                                                                                                                       |
| 4   | Filtros del gestor de pedidos del portal: fechas + texto libre (cliente ad-hoc/referencia), igual que el listado interno                                                              | vs. incidencia visible inline, vs. mantener solo status             | El usuario no pidió incidencia inline — se mantiene como endpoint separado ya existente (`GET orders/{orderId}/incident`, §25.6)                                                                                                                    |

### 25.2 Paso 1 — Login y llegada al portal

| Paso                                                                           | Actor                                                 | Endpoint/modelo                                                                                            | Estado actual           |
| ------------------------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------- |
| (Opcional) Pintar pantalla de acceso con marca del cliente antes de autenticar | Cliente de maquila (sin sesión)                       | `GET /api/v2/toll-clients/branding/{slug}` (público)                                                       | ✅ Implementado (§22)   |
| Login (común o dedicado, mismo flujo)                                          | Cliente de maquila                                    | `POST /api/v2/login` → magic link/OTP → `AuthActorService::resolveByEmail()`                               | ✅ Implementado (§22)   |
| Señal de redirección al portal                                                 | Frontend, a partir de la respuesta de login/`GET /me` | Payload incluye `tollClientId`/`tollClientName` (null si es `ExternalUser` genérico A.21 o `User` interno) | ✅ Implementado (§22.1) |

**Ramas alternativas:**

- Slug inexistente o cliente de maquila inactivo (`is_active = false`) en el endpoint de branding → 404, nunca 403 (no debe revelar existencia). ✅ ya documentado en §22.1.
- Usuario interno (`User`) intenta acceder a rutas `actor:external`/`/maquila/*` → bloqueado por el middleware `actor:external` antes de llegar a cualquier controller.
- `ExternalUser` genérico de A.21 (sin `toll_client_id`) intenta acceder a `/maquila/*` → cada controller del portal resuelve `toll_client_id` explícitamente y aborta con 403 si es `null` (patrón `getCurrentTollClientId()`, ya usado en `MaquilaOrderController`/`MaquilaProductionController`) — el dashboard nuevo (§25.3) debe seguir el mismo patrón.

### 25.3 Paso 2 — Dashboard

**Decisión de alcance:** resumen operativo con contadores (§25.1 #1). Widgets confirmados
(2026-08-13): stock total + por especie, contadores de producciones/recepciones/pedidos por estado, y
gráficas temporales de recepciones/pedidos en kg (sin €) — ver tabla actualizada más abajo.

**Precedente real (corregido tras observación del usuario, 2026-08-13):** el dashboard admin
(`src/app/admin/home/page.js` → `Dashboard` en `src/components/Admin/Dashboard/index.tsx`, frontend)
**no** es un único endpoint agregado — es un masonry de ~16 widgets, cada uno con su propio hook y
llamando a su propio endpoint independiente (28 rutas HTTP distintas contando variantes de
paginación/job asíncrono). Verificado en backend: **todas** esas rutas de `statistics/*` cuelgan del
mismo grupo `role:tecnico,administrador,direccion,administracion,comercial,operario,supervisor`
(`routes/api.php:315`) — **cero acceso para `ExternalUser`** hoy, y los servicios subyacentes
(`StockStatisticsService::getTotalStockStats()`, `OrderStatisticsController::totalNetWeightStats()`,
etc.) son queries **tenant-wide sin ningún parámetro de propiedad** — no hay `toll_client_id` en
ningún punto de esa cadena. El patrón de "masonry de widgets independientes" sí es el precedente
correcto a replicar en el frontend; lo que no es reutilizable sin trabajo es cada endpoint concreto.

**Candidatos reales del catálogo de 28, evaluados uno a uno:**

| Widget admin                                                                                                                                                      | ¿Aplica a un cliente de maquila?                  | Motivo                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `statistics/stock/total`, `statistics/stock/total-by-species`, `stores/total-stock-by-products`                                                                   | ✅ **Confirmado (2026-08-13)**                    | Análogo directo del almacén virtual (§25.4) — mismo dato, filtrado por `toll_client_id` en vez de tenant completo                                                                                              |
| `statistics/orders/total-net-weight`, `orders/sales-chart-data`, `raw-material-receptions/reception-chart-data`                                                   | ✅ **Confirmado (2026-08-13)**, en kg, nunca en € | Gráficas temporales de recepciones/pedidos propios — dato operativo, no financiero                                                                                                                             |
| `statistics/orders/total-amount`, `statistics/auxiliary-lines/total-amount`, `*/by-product`, `*/by-customer` (importes de **pedidos hacia sus clientes finales**) | ❌ **Descartado (2026-08-13)**                    | Decisión confirmada: el precio de venta a sus propios clientes nunca es visible para el cliente de maquila (§25.7)                                                                                             |
| Importe total facturado por servicio de maquila (`MaquilaServiceCharge`)                                                                                          | ✅ **Nuevo, confirmado (2026-08-13)**             | Distinto del anterior: es lo que el cliente nos paga a nosotros por el servicio, no lo que él cobra a su cliente final — sin precedente directo en el dashboard admin, ligado a la reversión de §20.4/§25.7bis |
| `statistics/orders/profitability-*` (summary y products, incl. jobs async)                                                                                        | No                                                | Es rentabilidad basada en coste interno — nunca visible para un cliente de maquila (mismo criterio que excluye coste en todo el documento)                                                                     |
| `statistics/orders/ranking`, `orders/sales-by-salesperson`, `orders/transport-chart-data`                                                                         | No                                                | Comparativas entre clientes/comerciales/transportistas del tenant — no tiene sentido ni sería seguro mostrárselo a un cliente de maquila concreto                                                              |
| `raw-material-receptions/daily-calibers-by-species`                                                                                                               | Descartado (no seleccionado, 2026-08-13)          | El usuario no lo incluyó entre los widgets elegidos                                                                                                                                                            |
| `cebo-dispatches/dispatch-chart-data`                                                                                                                             | No                                                | `CeboDispatch` es un dominio distinto (despacho de materia prima propia del tenant a terceros procesadores) sin relación con el bloque de maquila                                                              |
| `punches/dashboard`, `punches/statistics`, `settings` (CompanySetupAlert)                                                                                         | No                                                | Datos de RRHH/configuración interna del tenant, sin relación con un cliente externo                                                                                                                            |
| Nº producciones abiertas propias, nº recepciones recientes, pedidos por estado                                                                                    | ✅ **Confirmado (2026-08-13)**                    | Requiere el mismo `whereHas`/scope ya usado en `MaquilaProductionController`/`MaquilaReceptionController`/`MaquilaOrderController`                                                                             |

**Actor:** exclusivamente cliente de maquila (`ExternalUser` con `toll_client_id`); todos los widgets
son de solo lectura.

**Pieza de backend:** nueva en cualquier caso — no existe hoy ningún endpoint bajo `/maquila/*` de
tipo estadística/resumen. Dos formas de construirlo, a decidir en STEP 2 de esta pieza (no ahora):
(a) clonar el patrón ya usado en todo este bloque (`Maquila*Controller` separado, nombre provisional
`MaquilaDashboardController`/`MaquilaStatisticsController`, un endpoint por widget o unos pocos
endpoints agregados) reutilizando la lógica de query de los servicios internos donde sea directa
(stock/recepciones/pedidos), o (b) extender los controllers de `statistics/*` existentes para aceptar
`ExternalUser` y aplicar `toll_client_id` automáticamente — descartado como opción principal porque
tocaría un bloque ya consolidado (A.12 Estadísticas, 9/10) para un caso de uso que hoy no contempla
actores externos en absoluto; el criterio ya establecido en todo el documento (`MaquilaOrderController`
separado de `OrderController`, `MaquilaProductionController` separado, etc.) apunta a (a).

**Ramas alternativas:**

- Cliente de maquila recién creado, sin ninguna recepción/producción/pedido todavía → todos los
  contadores/widgets en 0 o vacío, no error. El dashboard debe tolerar el caso "cliente nuevo sin
  actividad" (ningún widget de los candidatos de arriba depende de datos previos para no romperse).
- Intento de acceder a cualquier endpoint del dashboard sin `toll_client_id` (`ExternalUser` genérico)
  → 403, mismo patrón fail-closed que el resto del portal.
- Intento de acceso directo a los endpoints `statistics/*` internos (no a sus análogos de portal) por
  un `ExternalUser` → ya bloqueado hoy por el middleware `role:*` del grupo, sin necesidad de cambio.

### 25.4 Paso 3 — Almacén interactivo (masonry de palets)

| Paso                                 | Actor              | Endpoint                                                                             | Estado actual                                                                                                     |
| ------------------------------------ | ------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Listado en masonry de palets propios | Cliente de maquila | `GET /api/v2/pallets` (filtros: estado, fechas, producto, especie, almacén, peso...) | ✅ Implementado — grupo `actor:internal,external`, `PalletListService::list()` aplica `scopeOwnedPallets` (§21.1) |
| Detalle de un palet                  | Cliente de maquila | `GET /api/v2/pallets/{id}`                                                           | ✅ Implementado — `PalletPolicy::view` acepta `toll_client_id` como camino de propiedad desde §21.1               |
| Imágenes/documentos del palet        | Cliente de maquila | `GET /api/v2/pallets/{id}/attachments` (+ `thumbnail`/`download`)                    | ✅ Implementado (Fase 1-3 del plan de adjuntos + fix de tipado §21.2)                                             |

**Ramas alternativas:**

- Cliente intenta editar un palet (`PUT /pallets/{id}`) → `PalletPolicy::update` fail-closed para
  `toll_client_id !== null` → 403 (§18.2, corregido en §12.4/§18.2).
- Cliente intenta crear un palet (`POST /pallets`) → mismo fail-closed → 403.
- Cliente intenta ver un palet de **otro** cliente de maquila, o un palet propio del tenant (no
  maquila) → 403 (`PalletPolicy::view` compara `toll_client_id` del palet contra el del actor).
- Cliente intenta subir un adjunto (`POST /pallets/{id}/attachments`) → 403 (`AttachmentPolicy::create`
  vía `Gate::allows('update', $pallet)`, bloqueado igual que la edición del palet).
- Palet en estado `REGISTERED` (aún sin posición física asignada) → visible igual en el masonry, solo
  cambia que `storedPallet.position` es `null` — no es un caso de error, es un estado normal.
- Palet con `toll_client_return_id` informado (ya devuelto, §11.4/§18.2) → sigue siendo visible en el
  histórico del almacén virtual (no desaparece), estado `SHIPPED`.

**No requiere backend nuevo** — es la pieza más madura del circuito, ya cubierta de punta a punta
desde §18.2/§21.1.

### 25.5 Paso 4 — Listado de producciones y panel interactivo

**Decisión de alcance:** filtros lote/fechas/estado/especie en el listado (§25.1 #3); panel
interactivo como adaptación de `ProductionControlPanelService` (§25.1 #2).

#### 25.5.1 Listado (tabla)

| Paso                                     | Actor              | Endpoint                          | Estado actual                                                                                     |
| ---------------------------------------- | ------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| Listado paginado de producciones propias | Cliente de maquila | `GET /api/v2/maquila/productions` | 🔶 Existe pero **sin ningún filtro** hoy (solo paginación) — `MaquilaProductionController::index` |

**Ampliación necesaria:** añadir `lot` (like), `dateFrom`/`dateTo` (sobre `Production.date`),
`species_id`, y `status` (abierta/cerrada como mínimo — ver §25.5.2 para el detalle de estados si se
comparte lógica con el panel). Mismo filtro de propiedad ya existente (`whereHas('records.inputs.box.palletBox.pallet', ...)`)
se mantiene sin cambios.

#### 25.5.2 Panel interactivo (en curso / terminadas / por estado)

El precedente interno (`ProductionControlPanelService`, usado hoy por `ProductionControlPanelController`
para el tenant) ya resuelve casi todo el concepto que pide el circuito — resumen + tabla con estado
derivado (`open`/`not_reconciled`/`ready_to_close`/`not_closeable`/`closed`) + alertas de
reconciliación de cantidades — pero **no es reutilizable tal cual** para el portal:

1. Filtra siempre `whereNull('closed_at')` — el portal necesita ver también las cerradas.
2. No filtra por propiedad (`toll_client_id`) — hoy es una vista 100% interna sobre todas las
   producciones del tenant.
3. Expone coste manual por caja (`costs.missingCostBoxesSample[].manualCostPerKg`) y alertas de tipo
   `missing_cost` — dato que un cliente de maquila no debe ver bajo ningún concepto (mismo criterio
   ya aplicado en `MaquilaOrderVisibilityPolicy`/`MaquilaProductionVisibilityPolicy`).

**Diseño de intención (STEP 0, sin decidir todavía la forma exacta de implementación — eso es
STEP 2):** una versión de portal del mismo concepto, con:

- Filtro de propiedad añadido a la query base (`whereHas('records.inputs.box.palletBox.pallet', fn ($q) => $q->where('toll_client_id', $tollClientId))`).
- Parámetro que incluya cerradas (quitar el `whereNull('closed_at')` fijo, o convertirlo en filtro
  opcional `status=open|closed|all`).
- Bloque `costs`/alertas de coste completamente ausente de la respuesta del portal (no solo oculto en
  frontend) — igual que el resto del portal nunca serializa coste en la respuesta, no solo lo esconde.
- El resumen (`summary.openProductions`/`boxesWithoutCost`) tampoco aplica tal cual: `boxesWithoutCost`
  es una métrica de coste interno, no debe existir en la versión de portal; `openProductions` debe
  recalcularse ya filtrado por propiedad.

**Actor:** exclusivamente cliente de maquila, solo lectura.

**Pieza de backend:** nueva o ampliada (nombre provisional `MaquilaProductionControlPanelService` +
acción nueva en `MaquilaProductionController` o controller propio) — decisión de si se extiende el
servicio interno con parámetros (`includeClosed`, `stripCosts`) reutilizados por ambos controllers, o
se clona una versión ligera, queda para STEP 2 de esta pieza (mismo patrón de diferir detalle de
implementación que usa el resto del documento, p. ej. §11.4 con `TollClientReturn`).

**Ramas alternativas:**

- Producción sin propiedad establecida todavía (`hasOwnershipEstablished() === false`, p. ej. lote
  recién creado sin inputs) → no debe aparecer en absoluto en el panel/listado del cliente (mismo
  fail-closed que `ProductionPolicy::view`, §23.3).
- Intento de acceso directo a `GET /maquila/productions/{id}` de una producción de otro cliente de
  maquila o del tenant → 403 (`ProductionPolicy::view`, ya implementado §23.3).
- Producción mezclada entre dos propietarios — no puede ocurrir ya (no-mezcla a nivel de lote
  completo, §23.2); si se detectara un dato legado inconsistente, `buildOwnershipFilteredProcessTree()`
  (§18.2/§23.2) sigue de red de seguridad de solo lectura, pero el panel/listado nuevo debe basarse en
  `hasOwnershipEstablished()`/`resolveOwnerTollClientId()`, no en construir su propia lógica de
  propiedad distinta.

### 25.6 Paso 5 — Detalle de producción

| Paso                     | Actor              | Endpoint                                                                      | Estado actual                                                                                              |
| ------------------------ | ------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Datos globales del lote  | Cliente de maquila | `GET /api/v2/maquila/productions/{id}`                                        | ✅ Implementado (§18.2/§24.1), coste/identidad interna ya recortados (`MaquilaProductionVisibilityPolicy`) |
| Diagrama de trazabilidad | Cliente de maquila | `GET /api/v2/maquila/productions/{production}/traceability`                   | ✅ Implementado (§18.2, §11.5)                                                                             |
| Imágenes/documentos      | Cliente de maquila | `GET /api/v2/productions/{production}/attachments` (+ `thumbnail`/`download`) | ✅ Implementado (§23.3)                                                                                    |

**Ramas alternativas:**

- Cliente intenta cerrar/reabrir la producción (`close`/`reopen`) → `ProductionPolicy` devuelve `false`
  explícito para `ExternalUser` → 403 (§23.3, producción exclusiva del tenant, decisión #2 §7).
- Cliente intenta crear/editar un `ProductionRecord`/input/output → sin ruta expuesta en el grupo
  `actor:external`; ni siquiera llega a evaluar Policy.
- Cliente intenta subir un adjunto de producción → 403 (`create` bloqueado, solo lectura permitida).
- Producción con `hasOwnershipEstablished() === false` → 403 al pedirla directamente por id, igual
  que en el listado (fail-closed, §23.3).

**No requiere backend nuevo** — ya cubierto de punta a punta.

### 25.7 Paso 6 — Gestor de pedidos

**Decisión de alcance:** filtros fecha + texto libre, sin incidencia inline (§25.1 #4).

| Paso                                                               | Actor                         | Endpoint                                                               | Estado actual                                                                 |
| ------------------------------------------------------------------ | ----------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Listado de pedidos propios                                         | Cliente de maquila            | `GET /api/v2/maquila/orders`                                           | 🔶 Existe, filtro **solo por `status`** hoy — `MaquilaOrderController::index` |
| Detalle de un pedido                                               | Cliente de maquila            | `GET /api/v2/maquila/orders/{id}`                                      | ✅ Implementado                                                               |
| Crear pedido ("cliente al vuelo")                                  | Cliente de maquila            | `POST /api/v2/maquila/orders`                                          | ✅ Implementado (§19.1)                                                       |
| Editar cabecera                                                    | Cliente de maquila            | `PUT /api/v2/maquila/orders/{id}`                                      | ✅ Implementado (§18.2)                                                       |
| Ver incidencia del pedido (si existe)                              | Cliente de maquila            | `GET /api/v2/orders/{orderId}/incident` (endpoint separado, no inline) | ✅ Implementado (§18.2/§11.2)                                                 |
| Envío de documentación (CMR/letreros) al propio cliente de maquila | **Tenant** (nunca el cliente) | `POST /api/v2/orders/{orderId}/send-toll-client-documents`             | ✅ Implementado (§19.2), botón dedicado exclusivo staff                       |

**Ampliación necesaria:** añadir a `MaquilaOrderController::index` filtro por rango de fechas (sobre
`load_date`, igual que el orden de clasificación ya usado) y texto libre sobre
`adhoc_customer_name`/`buyer_reference` (cuándo aplica cada uno según si el pedido tiene `Customer`
real o es "al vuelo", ver §19.1 — el filtro de texto libre debe cubrir ambos casos, incluyendo
`customerDisplayName`).

**Ramas alternativas:**

- Cliente intenta vincular palets o líneas de producto con precio (`plannedProducts`) al crear/editar
  → el whitelist del Form Request (`PROCESSOR_EDITABLE_FIELDS`) nunca acepta esos campos; si el
  payload los incluye, se ignoran silenciosamente (ya verificado con test, §19.1).
- Cliente intenta fijar `tollClientId` de otro cliente de maquila en el payload de creación → se
  ignora, se fuerza siempre desde el usuario autenticado (ya verificado con test, §19.1).
- Cliente intenta borrar un pedido (`DELETE`) → no existe ninguna ruta de borrado en el grupo
  `actor:external`; ni siquiera llega a evaluar `OrderPolicy` — 404 a nivel de ruta.
- Cliente intenta abrir, resolver o borrar una incidencia → `IncidentPolicy::manage` exclusiva del
  tenant, nunca acepta `ExternalUser` → 403 (§18.2, corrige el hallazgo bloqueante #2 de §12.3).
- Pedido pasa a `incident` (creado por el tenant tras un problema de entrega) → el cliente lo ve
  reflejado en `status` en su listado/detalle, pero no puede actuar sobre la incidencia desde el
  portal.
- Tenant borra la incidencia (`IncidentController::destroy()`) → `Order::finalizeAfterIncident()`
  fuerza el pedido a `finished` y todos sus palets a `SHIPPED` — el cliente ve el cambio de estado
  reflejado en su próxima consulta, sin haber podido dispararlo él mismo.
- Cliente intenta acceder a un pedido de **otro** cliente de maquila por id directo → 403
  (`OrderPolicy::view`, comparación `toll_client_id`, §18.2).
- Cliente crea un pedido y el tenant, después, vincula palets/líneas de producto con precio (fuera
  del portal, vía el flujo interno normal de `Order`) → **decisión confirmada (2026-08-13):** el
  precio de los pedidos hacia los clientes finales del cliente de maquila **nunca** debe ser visible
  para él — es una decisión comercial del tenant sobre la venta a un tercero, no sobre el servicio de
  maquila en sí. `plannedProductDetails`/`auxiliaryLines` con precio deben quedar recortados del
  detalle que ve el portal, igual que ya se recortan `salesperson`/`paymentTerm`/etc.
  (`MaquilaOrderVisibilityPolicy`) — **a verificar en la fase de auditoría (§25.9) si ese recorte ya
  cubre `plannedProductDetails`/`auxiliaryLines` hoy, porque `MaquilaOrderVisibilityPolicy` (§18.1) no
  los menciona explícitamente en su lista de campos ocultos** — puede ser un hueco real, no solo una
  pregunta abierta.

### 25.7bis Paso 6bis — Lectura del cargo de servicio de maquila (`MaquilaServiceCharge`)

**Decisión de alcance (2026-08-13, revierte §20.4/§20.5/§24.2 — ver nota en §20.4):** el cliente de
maquila **sí** debe poder ver, en modo lectura, el cargo completo (con líneas) que el tenant le
factura por el servicio de procesamiento de su mercancía — a diferencia del precio de los pedidos
hacia sus propios clientes finales (§25.7), que sigue oculto sin excepción. Es una distinción de
negocio explícita: "precio de la maquila" (lo que nos paga a nosotros) sí es su dato; "precio de la
venta a su cliente final" (lo que él cobra a un tercero) no lo es.

| Paso                                             | Actor              | Endpoint                                                          | Estado actual                                                                                      |
| ------------------------------------------------ | ------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Listado de cargos de servicio de maquila propios | Cliente de maquila | `GET /api/v2/maquila/service-charges` (nuevo, nombre provisional) | ❌ No implementado — hoy `MaquilaServiceChargePolicy` no acepta `ExternalUser` en absoluto (§24.2) |
| Detalle de un cargo, con líneas                  | Cliente de maquila | `GET /api/v2/maquila/service-charges/{id}` (nuevo)                | ❌ No implementado                                                                                 |

**Pieza de backend:** ampliar `MaquilaServiceChargePolicy::view()`/`viewAny()` para aceptar
`ExternalUser` con `toll_client_id` coincidente (mismo patrón fail-closed que el resto del portal:
solo lectura, nunca `create`/`update`/`delete`, que se mantienen exclusivos de Administrador sin
cambios). Rutas nuevas bajo `actor:external` (o `actor:internal,external` con scope, a decidir en
STEP 2 de esta pieza según el patrón que ya usa el resto del bloque — controller separado
`Maquila*Controller` vs. extender el existente). El `chargeable_type`/`chargeable_id` polimórfico
(referencia a la `Order`/`TollClientReturn` de origen, §20.2) puede mostrarse tal cual, ya que ambas
entidades ya son visibles para el cliente de maquila en otras pantallas del portal.

**Ramas alternativas:**

- Cliente intenta ver el cargo de **otro** cliente de maquila por id directo → 403
  (`toll_client_id` no coincide).
- Cliente intenta crear/editar/borrar un cargo, o una línea del mismo → 403 (exclusivo Administrador,
  sin cambios respecto a §24.2).
- Cargo en estado `draft` (recién creado por el tenant, quizás todavía incompleto) → **detalle a
  decidir en STEP 2 de esta pieza**: ¿visible igual que uno finalizado (es de solo lectura, no hay
  riesgo de que el cliente lo modifique), o solo visible una vez el tenant lo marca como definitivo
  (para no confundir al cliente con cifras a medio editar)? No asumido aquí — nota para STEP 2, no
  bloquea el resto del circuito.
- `SimulatedRawMaterialCost` (aislado, §20.2) — **no** entra en esta reversión: sigue siendo consulta
  interna exclusiva del tenant, nunca visible en el portal (es coste simulado nuestro para entender
  el mercado, no el cargo real facturado al cliente).

### 25.8 Resumen de piezas de backend nuevas o a ampliar

| Pieza                                                               | Tipo                                         | Endpoint(s)                                                                                                                                                                                    | Nota                                                                                                                                               |
| ------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard de maquila (varios widgets, patrón masonry como el admin) | Nueva (varios endpoints)                     | p. ej. `GET /maquila/statistics/stock-total`, `/statistics/orders-net-weight`, `/statistics/reception-chart-data`, `/statistics/summary-counts`... (lista exacta a cerrar según §25.9 punto 3) | Precedente real (`statistics/*`) es role-gated internal-only y tenant-wide, sin `toll_client_id` — no reutilizable sin adaptar cada widget (§25.3) |
| Filtros del listado de producciones del portal                      | Ampliar                                      | `GET /maquila/productions`                                                                                                                                                                     | Hoy sin ningún filtro (§25.5.1)                                                                                                                    |
| Panel interactivo de producciones del portal                        | Nueva (adapta un servicio interno existente) | endpoint nuevo bajo `/maquila/productions/*`                                                                                                                                                   | No reutilizable tal cual por coste expuesto y alcance solo-abiertas (§25.5.2)                                                                      |
| Filtros del gestor de pedidos del portal                            | Ampliar                                      | `GET /maquila/orders`                                                                                                                                                                          | Hoy solo filtra por `status` (§25.7)                                                                                                               |
| Almacén interactivo                                                 | Sin cambios                                  | `GET /pallets`, `GET /pallets/{id}`, adjuntos                                                                                                                                                  | Ya completo (§25.4)                                                                                                                                |
| Detalle de producción                                               | Sin cambios                                  | `GET /maquila/productions/{id}`, `/traceability`, adjuntos                                                                                                                                     | Ya completo (§25.6)                                                                                                                                |
| Lectura de `MaquilaServiceCharge` en el portal                      | Nueva (revierte §20.4/§20.5/§24.2)           | `GET /maquila/service-charges`, `GET /maquila/service-charges/{id}` (nombres provisionales)                                                                                                    | Requiere ampliar `MaquilaServiceChargePolicy::view/viewAny` (§25.7bis)                                                                             |
| Almacén interactivo                                                 | Sin cambios                                  | `GET /pallets`, `GET /pallets/{id}`, adjuntos                                                                                                                                                  | Ya completo (§25.4)                                                                                                                                |
| Detalle de producción                                               | Sin cambios                                  | `GET /maquila/productions/{id}`, `/traceability`, adjuntos                                                                                                                                     | Ya completo (§25.6)                                                                                                                                |
| Login/branding                                                      | Sin cambios                                  | ya implementado                                                                                                                                                                                | Ya completo (§25.2)                                                                                                                                |

### 25.9 Siguiente paso

Este circuito queda documentado como **intención de negocio confirmada** (§25.1-§25.8), no como
código existente — las filas marcadas 🔶/nueva son huecos reales, no errores de otras sesiones.
**Resuelto el 2026-08-13:** visibilidad de precios (§25.7 — nunca precio de venta a clientes finales;
§25.7bis — sí precio del servicio de maquila, revirtiendo §20.4/§20.5/§24.2) y subconjunto de widgets
del dashboard (§25.3: stock, contadores por estado, gráficas en kg, e importe de `MaquilaServiceCharge`;
descartados ranking/rentabilidad/comparativas comerciales/RRHH/cebo/calibres diarios).

Antes de pasar a la fase de auditoría contra el código real (Policies mal tipadas, rutas alcanzables
por el actor correcto, tests existentes que lo cubran) queda un único punto abierto, detectado al
resolver §25.7bis, no una pregunta de negocio sino un hueco a verificar:

1. **Hueco a verificar en la auditoría, no pregunta de negocio:** si `MaquilaOrderVisibilityPolicy`
   (§18.1) ya recorta hoy `plannedProductDetails`/`auxiliaryLines` con precio del detalle de pedido
   que ve el cliente de maquila, o si es un hueco real (la lista de campos ocultos documentada en
   §18.1 no los menciona explícitamente) — se comprueba en la fase de auditoría, no se pregunta.
2. Si el circuito tal como queda documentado (§25.1-§25.8) cubre todo lo que el usuario tenía en
   mente, o falta algún paso/pantalla — confirmación final antes de auditar.

Una vez confirmado el punto 2, la fase de auditoría (siguiente sección numerada) revisará, paso a
paso, si cada pieza marcada ✅ es alcanzable hoy por el actor correcto (controllers, Policies, rutas,
tests), y reportará huecos concretos sin corregirlos todavía, tal como se acordó al inicio de esta
sesión.
