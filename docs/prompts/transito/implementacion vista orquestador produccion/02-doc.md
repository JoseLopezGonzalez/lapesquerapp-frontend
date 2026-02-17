# PesquerApp

## Rediseño Estructural — Gestor de Pedidos (Vista Operario)

**Objetivo del documento:** Pasar de un conjunto de ideas estructurales a un **modelo sólido y coherente** listo para wireframes y decisiones de arquitectura, alineado con el modelo real de la aplicación.

---

## Entidades y relaciones (referencia rápida)

| Entidad | Relaciones relevantes | Notas |
|---------|------------------------|-------|
| **Pedido** | plannedProductDetails (producto, cantidad, cajas), palets (los vinculados), status: pending/finished/incident | Progreso = agregación de palets vinculados. |
| **Palet** | orderId (nullable), receptionId (nullable), boxes, state: 1–4 (Registrado, Almacenado, Enviado, Procesado) | Si tiene receptionId, no se puede desvincular de pedido en la UI. |
| **Caja** | product, lot, netWeight; puede existir **sin palet** (estado "Disponible"). En modelo actual: pertenece a un palet. | **Paradigma objetivo:** La caja nace por **emisión de etiqueta** (fase producción); luego se agrega a palet por escaneo (fase preparación). Ver §4.4. |
| **Producción / Recepción** | Palets pueden venir de una recepción (receptionId) o de producción interna (sin receptionId). | Solo palets sin receptionId son “libres” para asignar a cualquier pedido. |

**Definición de "pedidos activos" (para la vista operario):** Sin una definición explícita en backend, conviene fijarla por producto. Propuesta: pedidos con `status = pending` y `loadDate` igual a la fecha seleccionada (p. ej. hoy o mañana). El Gestor actual ya filtra por "Hoy" / "Mañana" y por estado; la vista orquestador debería reutilizar o exponer un criterio equivalente (y si el endpoint `production-view` hoy solo devuelve "hoy", extenderlo con parámetro de fecha para el selector).

---

# 1️⃣ ANÁLISIS DE LA VISTA ACTUAL (ROL ADMINISTRADOR)

## Modelo estructural actual

La vista actual está construida bajo un paradigma **maestro–detalle con submódulos por pestañas**, donde el pedido es la entidad principal.

### Jerarquía implícita en la UI

Pedido
└── Palets (pestaña)
    └── Cajas (dentro de cada palet)

**En el modelo de datos real:** el pedido tiene `plannedProductDetails` (producto, cantidad kg, cajas). El progreso de producción se obtiene por agregación de los palets vinculados al pedido (`productionProductDetails`). Los palets tienen `orderId` (nullable) y `receptionId` (nullable). Las cajas pertenecen a un palet (producto, lote, peso neto). La jerarquía que ve el administrador es “pedido → palets → cajas”, pero en base de datos el palet es una entidad que **puede existir sin pedido** (`orderId = null`); la vinculación es posterior mediante `link-order` / `unlink-order`.

---

## Flujo operativo representado actualmente

### Flujo macro

Listado de pedidos activos
→ Selección de pedido
→ Visualización de detalle
→ Gestión por pestañas (Producción, Palets, Etiquetas, Envío…)
→ Evolución de estado (En producción → Terminado)

---

### Flujo específico de Palets

Pedido en producción
→ Ir a pestaña “Palets”
→ Ver palets vinculados
→ Acciones disponibles:

* **Crear palet nuevo:** PalletDialog con `initialOrderId`; añadir cajas (entrada masiva de pesos por línea, o escáner/GS1); guardar → palet creado y vinculado.
* **Vincular palets existentes:** `GET /api/v2/pallets/available-for-order` (opcionalmente `orderId`, `storeId`); seleccionar palets → `linkPalletToOrder` / `linkPalletsToOrders`. Solo vinculables palets **sin** `receptionId`.
* Editar / Desvincular / Eliminar (palets con `receptionId` no se desvinculan).

**Resultado:** Pedido acumula palets; peso total y progreso por producto vía `productionProductDetails`.

---

## Modelo mental que impone

Es un modelo administrativo.

Pedido primero
→ Producción
→ Agrupación en palets
→ Envío

La pantalla modela relaciones estructurales, no flujo físico.

---

## Qué prioriza visualmente

* Información comercial
* Información logística
* Estado del pedido
* Gestión estructural de entidades

No prioriza:

* Flujo físico en tiempo real
* Progreso operativo por producto
* Rapidez de interacción
* Trabajo táctil

---

## Tipo de empresa que encaja bien

✔ Producción bajo pedido
✔ Cada palet pertenece a un único pedido
✔ Control administrativo fuerte
✔ Flujo lineal pedido → producción → envío

---

## Tipo de empresa que encaja mal

✖ Producción para stock
✖ Cross-docking frecuente
✖ Consolidación dinámica de cargas
✖ Palets que existen antes que el pedido (como flujo principal visible)
✖ Operativa centrada en muelle

**Nota:** En el modelo actual los palets **sí pueden** existir antes que el pedido (`orderId` null, listados en `available-for-order`). Lo que encaja mal es que la **vista** esté centrada en “elegir pedido primero”; no que el dato no exista.

---

# 2️⃣ NUEVO CONTEXTO — ROL OPERARIO

## Permisos y roles (decisión pendiente)

En la aplicación existen roles como `store_operator` (operador de almacén, acceso restringido a su almacén) y en la navegación del Gestor de Pedidos se usan otros (`administrador`, `direccion`, `tecnico`). Para la vista orquestador debe **definirse explícitamente**:

* Qué rol(es) pueden acceder a esta vista (¿solo operario/store_operator?, ¿también admin para supervisión?).
* Si el operario está limitado por almacén, el filtro de almacén/contexto debe ser coherente con su asignación (y no permitir ver otros almacenes).
* Si "Finalizar pedido" (cambiar estado a Terminado) está permitido para el operario o solo para administración; si es opcional por tenant, dejarlo como parámetro de configuración.

No asumir que la vista es "para todos los que ven el Gestor"; puede ser una ruta específica (ej. `/admin/orquestador` o dentro de warehouse) con permisos propios. **Ruta y navegación:** Decidir si la vista orquestador es una pantalla más dentro del Gestor de Pedidos (p. ej. pestaña o modo) o una ruta independiente a la que el operario accede sin ver el resto del admin; esto afecta a menús, breadcrumbs y redirección por rol.

## Características del entorno

* Trabajo en frío
* Manos mojadas
* Prisas
* Bajo margen cognitivo
* Interacción rápida
* Flujo físico dominante

El operario no piensa en estructura ERP.
Piensa en:

Producto → Cajas → Palets → Camión

---

# 3️⃣ FLUJOS REALES IDENTIFICADOS

---

## Variante 1 — Stock intermedio

Producción genera cajas
→ Operario crea palets homogéneos por producto (y lote)
→ Se imprimen etiquetas
→ Pedido aparece
→ Se **asignan palets** al pedido (vincular) y, si hace falta, se crean palets adicionales con más cajas para ese pedido
→ Vinculación final

Modelo dominante: Stock primero → Pedido después. **Nota:** En el sistema actual la “redistribución” es por **asignación de palets** a pedidos, no por mover cajas entre palets en la UI.

---

## Variante 2 — Directo por pedido

Pedido visible
→ Operario crea palets específicos para ese pedido (producto + lote; cajas por entrada masiva o escáner)
→ Añade cajas
→ Imprime etiquetas
→ Palet queda vinculado al guardar

Modelo dominante: Pedido primero → Producción orientada.

---

# 4️⃣ PROBLEMA ESTRUCTURAL ACTUAL

La vista actual está optimizada solo para la **Variante 2** (pedido primero → palets para ese pedido).

La realidad operativa incluye **ambas variantes** (stock intermedio y directo por pedido).

**Aclaración importante:** En el modelo de datos actual el palet **ya es** una unidad que puede existir sin pedido (`orderId` null) y cambiar de destino (link/unlink). Existe `pallets/available-for-order` y endpoints de vinculación/desvinculación. La **dependencia** no es del modelo, sino del **flujo de la UI**: la pantalla obliga a “entrar por pedido” y a crear/vincular palets desde ahí. No hay una pantalla donde el operario empiece por “crear palet libre” o por “ver todo lo pendiente por producto” con acciones inmediatas.

**Lo que la operación necesita:** Una vista donde el centro sea el **flujo físico** (producto → cajas → palet → asignación) con el mínimo de navegación. El modelo de datos lo permite; falta orquestar la misma información y acciones en una pantalla orientada al muelle.

**Limitación real del sistema:** No existe hoy “mover cajas entre palets” ni “dividir/fusionar palets” en la UI; la unidad reasignable es el **palet completo**. La “redistribución de cajas” en Variante 1 se traduce en: crear palets homogéneos (sin pedido o para pedido), imprimir etiquetas, y luego **asignar palets** a pedidos, no caja a caja.

---

## 4.1 Estados en el sistema actual (alineación)

| Ámbito | Estados actuales | Uso |
|--------|------------------|-----|
| **Pedido** | `pending`, `finished`, `incident` | En producción / Terminado / Incidencia. Son los únicos en backend para orden. |
| **Palet** | 1=Registrado, 2=Almacenado, 3=Enviado, 4=Procesado | Ciclo físico del palet; independiente de si tiene o no `orderId`. |
| **Línea pedido-producto** | `pending`, `success`, `difference`, `noPlanned` (en mergedProductDetails) | Calculado en frontend a partir de planificado vs. completado (desde palets). En ProductionView el backend puede devolver `completed` / `exceeded` / `pending` por línea. |

**Decisión de producto:** En la vista operario tiene sentido **no** introducir nuevos estados de pedido genéricos (“En carga”, “Parcial”) a nivel de modelo si con los actuales basta: “En producción” (pending) vs “Terminado” (finished) ya cubren. Lo que sí debe estar muy visible es el **estado por línea** (por producto dentro del pedido): pendiente / completado / excedido. Si en el futuro se exige “En carga” o “Parcial” como estado explícito de pedido, sería un cambio de backend (nuevo valor de `status`).

---

## 4.2 Recepción vs producción: dos orígenes del palet

* **Palet con `receptionId`:** Proviene de una recepción de materia prima. En la aplicación actual **no se puede desvincular** del pedido (si está vinculado) o se considera fijo a esa recepción; la UI no permite unlink en esos casos.
* **Palet sin `receptionId`:** Palet de producción o de stock. Es el que se puede **crear libre** y **vincular/desvincular** a pedidos.

Para la vista operario debe quedar claro en qué flujo estamos: **solo los palets sin recepción** son “asignables” libremente. Si la empresa trabaja sobre todo con palets de recepción, el flujo “palet libre → asignar a pedido” tendría poco uso; si trabaja con producción propia, es el flujo principal. Esto puede ser un **parámetro de configuración** por tenant: “Mostrar flujo de palets libres / stock intermedio” (sí/no).

---

## 4.3 Qué pasa si el pedido cambia durante la preparación

**Riesgo:** Un administrador modifica el pedido (añade/quita líneas, cambia cantidades o cajas) mientras el operario está preparando palets para ese pedido.

**Opciones de producto:**

1. **Recálculo en tiempo (recomendado como base):** La vista operario muestra siempre datos actuales (planificado vs. completado). Si el pedido cambia, el progreso se recalcula; puede aparecer “excedido” o “pendiente” distinto. No bloquear edición del pedido; el operario ve el nuevo estado en la siguiente carga o con refresco.
2. **Aviso en tiempo real (mejora):** Si hay un canal (WebSocket o polling) que notifique “pedido X modificado”, la vista operario puede mostrar un aviso breve (“Pedido actualizado”) y refrescar. Evita que el operario siga mirando cantidades antiguas.
3. **Bloqueo de edición (solo si es requisito fuerte):** Bloquear cambios en el pedido mientras “está en preparación” exige definir qué es “en preparación” (ej. al menos un palet vinculado y estado pending) y un flujo para desbloquear. Aumenta complejidad y puede ser rígido en plantas con muchos cambios de último momento.

**Recomendación:** Diseñar la vista asumiendo **recálculo + aviso**; no asumir bloqueo salvo que el negocio lo exija explícitamente.

---

## 4.4 El problema real: etiqueta antes que caja — Dos fases, dos pantallas

### El bucle que hay que romper

El modelo actual asume: **caja existe digitalmente → entonces imprimo etiqueta.**

En producción real ocurre al revés: **la etiqueta física habilita la existencia operativa de la caja.** Sin etiqueta no hay caja operativa. Por eso se genera un bucle mental y operativo si se intenta crear caja y etiqueta en el mismo acto que “construir palet”.

### Cambio de paradigma necesario

Separar claramente **dos momentos**:

1. **Generación de etiquetas** (fase previa)
2. **Construcción de palets** (fase de agrupación)

No son el mismo flujo. Una sola pantalla que intente resolver ambos (crear cajas + imprimir etiquetas + construir palet) es el error inicial; hay que dividir **Producción** vs **Preparación logística**.

---

### Nuevo modelo conceptual

**Fase A — Emisión de etiquetas (Producción)**

* El operario indica: producto, lote, cantidad, pesos (manual o masivo).
* El sistema genera: identificadores únicos de cajas, códigos de barras.
* Estado de la caja: **“Etiqueta emitida”** / **“Pendiente de escaneo”**.
* **Aquí aún no hay palet.** Solo existen cajas etiquetadas y disponibles.

**Fase B — Construcción de palets (Preparación)**

* El operario **escanea cajas ya etiquetadas**.
* Escanear caja → la caja pasa a estado **“En palet”** → se agrega al palet activo → el palet se construye dinámicamente.
* Cuando se completa el palet: se puede asignar a pedido o quedar libre.

---

### Orden conceptual correcto

**Modelo objetivo:** Etiqueta → Caja → Palet → Pedido → Envío  

**Modelo erróneo (el que generaba el conflicto):** Palet → Caja → Etiqueta → Escaneo  

El **palet deja de ser el generador de cajas**; se convierte en **agregador** de cajas que ya existen (ya etiquetadas). Eso es mucho más natural operativamente.

---

### Impacto en el modelo de datos (conceptual)

Cada **caja** debería poder tener estados explícitos, por ejemplo:

* Etiqueta emitida
* Disponible (pendiente de escaneo / en stock de cajas sueltas)
* En palet
* Asignada a pedido (por pertenecer a un palet vinculado)
* Cargada

El palet no “crea” cajas; **agrega** cajas que ya están en estado Disponible (o equivalente). Esto puede requerir en backend/modelo: cajas con `palletId` nullable y un estado de caja (o equivalente por existencia en tabla de “cajas disponibles” vs “cajas en palet”).

---

### Estructura de producto: dos pantallas

| Pantalla | Objetivo | Dónde se habla de pedidos |
|----------|----------|----------------------------|
| **Pantalla 1 — Emisión de etiquetas** | Crear cajas digitales **antes** de que existan palets. No se habla de pedidos aquí. | No. Solo producto, lote, pesos, imprimir. |
| **Pantalla 2 — Preparación de pedidos** | Trabajar con **cajas existentes y escaneables**; construir palets y asignarlos. | Sí. Pedidos, progreso, vincular palet. |

**Pantalla 1 — Emisión de etiquetas (Producción)**

* Flujo: Seleccionar producto → Introducir lote y pesos (manual o masivo) → Generar X cajas → Imprimir etiquetas → Las cajas quedan en estado **“Disponible”** (aún sin palet).

**Pantalla 2 — Preparación de pedidos (Agrupación en palets)**

* **Variante 1:** Escanear cajas disponibles → Construir palet libre → Asignar (vincular) a pedido.
* **Variante 2:** Seleccionar pedido → Escanear cajas → El palet se construye ya vinculado a ese pedido.

---

### Consecuencia clave

**Producción** (emisión de etiquetas) y **Preparación logística** (agrupación en palets y asignación a pedidos) son **dos momentos físicos distintos**. El diseño debe reflejarlos con **dos vistas/pantallas** claramente separadas, no una sola que intente resolver ambos.

---

# 5️⃣ DISEÑO PROPUESTO — DOS VISTAS OPERATIVAS (NO UNA)

## Paradigma estructural

En lugar de **una** pantalla orquestador que mezcle emisión de etiquetas y construcción de palets, el producto debe ofrecer **dos pantallas**:

1. **Vista 1 — Emisión de etiquetas (Producción):** Crear cajas digitales e imprimir etiquetas. Sin pedidos ni palets. Flujo: producto + lote + pesos → generar cajas → imprimir → cajas en estado “Disponible”.
2. **Vista 2 — Preparación de pedidos (Agrupación):** Trabajar con cajas ya etiquetadas. Escanear cajas → construir palet → asignar a pedido (o dejar libre). Listado de pedidos, progreso, vinculación.

**Relación con la vista existente:** La Vista de Producción (ProductionView) que agrupa por producto y muestra pedidos con progreso sigue siendo útil para planificación/supervisión. La **Vista 2 (Preparación)** reutiliza ese tipo de dato (pedidos activos, progreso por producto) pero con foco en **escaneo de cajas** y **construcción de palets**, no en “crear cajas desde cero”. La **Vista 1 (Emisión)** es nueva: solo producción de etiquetas y cajas disponibles.

Objetivos por vista:

* **Vista 1:** Generar etiquetas y cajas disponibles; cero fricción con pedidos o palets.
* **Vista 2:** Ver pedidos activos, progreso, escanear cajas disponibles, construir palets y vincular (o dejar libres).

---

# 6️⃣ ESTRUCTURA DE PANTALLAS (VISTA 1 Y VISTA 2)

---

## 6.1 Pantalla 1 — Emisión de etiquetas (Producción)

**Objetivo:** Crear cajas digitales e imprimir etiquetas. No se habla de pedidos ni de palets.

* **Header:** Título claro (“Emisión de etiquetas” / “Producción de cajas”). Opcional: selector de fecha o turno.
* **Formulario principal:** Selector de producto, lote (obligatorio), cantidad o entrada masiva de pesos (uno por línea = una caja). Botón “Generar cajas” → identificadores únicos y códigos de barras; cajas en estado “Etiqueta emitida” / “Disponible”. Botón “Imprimir etiquetas” → etiquetas de esta emisión. Sin listado de pedidos.

---

## 6.2 Pantalla 2 — Preparación de pedidos (Agrupación en palets)

**Objetivo:** Trabajar con **cajas ya etiquetadas**. Escanear cajas → construir palet → asignar a pedido (o libre).

### Header fijo

* Selector de fecha / turno, indicador de pedidos activos, modo: Palet libre vs Palet para pedido.

---

### Columna izquierda (30%)

Listado de pedidos activos en cards: nº pedido, cliente, productos previstos, progreso por producto, estado, fecha de carga y temperatura. Estado vacío: “No hay pedidos para hoy” si aplica.

---

### Zona central (45%)
* Acción rápida “Añadir cajas”

Resumen: progreso por producto (barras) y palets del pedido (cards). “Añadir cajas” = **escanear más cajas** y agregarlas al palet (cajas ya existen; no se introducen pesos aquí). Estado vacío: “Selecciona un pedido”.

---

### Panel derecho fijo (25%) — Constructor por escaneo

* **Palet activo:** Lista dinámica de cajas escaneadas (no input de pesos; las cajas se crearon en Pantalla 1).
* **Escaneo:** Flujo para escanear código de barras de una caja → caja pasa a “En palet” y se agrega al palet activo.
* Modo libre: palet sin pedido; al confirmar se puede asignar. Modo pedido: palet vinculado al pedido seleccionado al confirmar.
* **Diferencia clave:** Aquí no se crean cajas con pesos; solo se **agregan** cajas ya existentes (por escaneo) al palet. La impresión masiva de etiquetas de cajas es en Pantalla 1; en esta pantalla puede existir impresión de **etiqueta de palet** al cerrar el palet.

---

### Barra inferior (Pantalla 2)

* **Confirmar / Cerrar palet:** Fija el palet (con o sin pedido según modo).
* **Finalizar pedido:** Marcar pedido como “Terminado” (por permisos/config). La impresión masiva de etiquetas de **cajas** es en Pantalla 1; aquí solo aplica, si se desea, la etiqueta de **palet** al cerrar.

---

# 7️⃣ COMPONENTES UI RECOMENDADOS

* Cards verticales para pedidos
* Progress bars por producto
* Panel persistente para creación
* Cards grandes para palets
* Toggle simple para modo de trabajo
* Acciones inline visibles

Justificación:
Reducir carga cognitiva y navegación.

---

# 8️⃣ FLUJOS CON EL NUEVO PARADIGMA (ETIQUETA → CAJA → PALET)

Orden conceptual: **Etiqueta → Caja → Palet → Pedido → Envío.** La emisión de etiquetas (Pantalla 1) va siempre antes; la preparación (Pantalla 2) trabaja con cajas ya existentes.

---

## Pantalla 1 — Emisión de etiquetas

Producto + lote + pesos → Generar cajas → Imprimir etiquetas → Cajas en estado “Disponible”. Sin pedidos ni palets.

---

## Pantalla 2 — Variante 1 (stock intermedio)

Cajas ya disponibles (emitidas en Pantalla 1). En Preparación: escanear cajas, construir palet libre
; seleccionar pedido; asignar palet (vincular).
Lote: obligatorio en Pantalla 1 (trazabilidad).
**Nota:** Cada caja tiene lote; en sector pesquero es crítico para trazabilidad. El flujo “crear palet libre” debe exigir/recordar lote en la creación de cajas.

---

## Pantalla 2 — Variante 2 (directo por pedido)

Seleccionar pedido, ver pendientes, modo Palet para pedido, escanear cajas ya etiquetadas, cajas se agregan al palet activo; al cerrar, palet vinculado al pedido.

---

# 9️⃣ CONFIGURACIÓN MULTIEMPRESA (SaaS)

## Qué debe ser configurable por tenant

* **Permitir flujo “palet libre” / stock intermedio:** Si la empresa solo trabaja “pedido primero”, se puede ocultar o despriorizar el modo “Crear palet libre” y el listado de palets disponibles para asignar. Si trabaja con stock, debe estar muy visible.
* **Filtro por almacén en palets disponibles:** Ya existe en backend (`storeId` en `available-for-order`). En vista operario, si hay varios almacenes, el selector de almacén (o turno/zona) debe filtrar pedidos y palets por contexto.
* **Permitir mezcla de productos en un palet:** Hoy un palet puede tener cajas de varios productos (y varios lotes). Si alguna empresa exige “un producto por palet”, sería regla de negocio configurable (validación al añadir caja).
* **Redistribución de cajas:** En el modelo actual no hay “mover caja de un palet a otro” en UI; la redistribución es por **asignación de palets** a pedidos. No ofrecer como config “redistribución de cajas” si no se implementa esa funcionalidad.

## Qué no debería ser opcional (modelo universal)

* **Separación Producción vs Preparación:** Pantalla 1 (emisión de etiquetas / creación de cajas) y Pantalla 2 (preparación por escaneo y agrupación en palets) son distintas por diseño; no unificar en una sola pantalla que mezcle ambos flujos.
* Progreso por producto (planificado vs. completado) y estados de línea en Pantalla 2.
* Creación de cajas con pesos y lote en Pantalla 1 (trazabilidad); escaneo de cajas ya etiquetadas en Pantalla 2.
* Vinculación/desvinculación de palets a pedidos (para palets sin recepción).
* Impresión de etiquetas de **cajas** en Pantalla 1 (emisión); etiqueta de **palet** opcional en Pantalla 2 al cerrar palet.

## Estados: mantener alineación con backend

No definir “estados configurables” genéricos (Pendiente, En carga, Listo, Parcial) sin alinearlos con el modelo actual. Los estados de **pedido** son `pending` / `finished` / `incident`. Los de **palet** son 1–4 (Registrado, Almacenado, Enviado, Procesado). Los de **línea** (por producto en el pedido) son los que dan la sensación de “En producción” / “Listo” / “Parcial” y pueden ser calculados (pending/completed/exceeded). Si se quieren nuevos estados de pedido (ej. “En carga”), es decisión de modelo/backend, no solo de configuración de pantalla.

## Elementos opcionales de vista

* Vista de stock (palets sin pedido por almacén): útil si está activo el flujo stock intermedio.
* Panel de progreso agregado (total del día por producto): útil en plantas con muchos pedidos.
* Modo “solo pedidos del día” o “solo mi turno”: ya el backend de ProductionView puede filtrar por fecha; la vista operario puede exponer filtro de fecha/turno.

---

# 🔟 PUNTOS DÉBILES, RIESGOS E INCOHERENCIAS

## Supuestos a validar

* **“Operario con baja tolerancia a fricción”:** El diseño asume pocos clics y panel persistente. Debe validarse con usuarios reales que el flujo “selector de producto → pesos por línea → guardar → imprimir” sea aceptable en frío (guantes, pantalla táctil).
* **Un producto por palet vs. mezcla:** Algunas plantas pueden exigir palets homogéneos (un producto/lote). El documento asume que la mezcla está permitida; si no, la restricción debe aplicarse en creación de cajas y en vinculación.

## Riesgos operativos

* **Doble edición:** Administrador y operario tocando el mismo pedido a la vez. Mitigación: recálculo + aviso de “pedido actualizado” (ver 4.3).
* **Palets “huérfanos”:** Muchos palets libres sin asignar si el flujo stock está muy usado y luego no se asignan. Puede ser útil un listado/recordatorio “Palets sin pedido” con opción de asignar desde la misma vista.
* **Impresión masiva:** Definir siempre el ámbito (este palet / estas cajas) para no imprimir etiquetas equivocadas.

## Escalabilidad

* Si hay muchos pedidos activos el mismo día, el listado de cards (30%) puede ser largo; considerar agrupación por fecha de carga, cliente o producto, o paginación/scroll con búsqueda.
* El endpoint de vista producción (por producto) debe seguir siendo eficiente; si la vista operario añade más llamadas (palets disponibles, detalle de pedido), evitar N+1 y duplicar lógica; un único “orquestador” backend que devuelva pedidos + progreso + palets del contexto podría ser mejor que varias peticiones independientes.

## Incoherencias con el flujo real

* **Recepción:** Si la mayoría de los palets son de recepción (receptionId no null), el flujo “crear palet libre y asignar” tendrá poco peso; la vista debe no ocultar pero tampoco priorizar ese flujo por encima de “vincular palets existentes” cuando sea el uso principal.
* **Lote obligatorio:** En creación masiva de cajas, el lote debe ser obligatorio para trazabilidad; el documento lo menciona pero la regla debe quedar explícita en criterios de aceptación.
* **Clonar palet:** En la pestaña Palets del pedido actual existe la acción "clonar palet". En la vista orquestador podría ser útil (ej. "crear otro palet igual para el mismo pedido") como acción rápida desde la card del palet; no está en el diseño inicial pero es candidato a añadir si se valida con operarios.

---

# 1️⃣1️⃣ CAMBIOS NECESARIOS EN BACKEND / MODELO (resumen)

| Necesidad | ¿Modelo actual lo soporta? | Acción |
|-----------|----------------------------|--------|
| Palets sin pedido | Sí (`orderId` null, `available-for-order`) | Ninguno. |
| Vincular/desvincular palet a pedido | Sí (link-order, unlink-order) | Ninguno. |
| Progreso por producto en pedido | Sí (productionProductDetails, vista producción) | Asegurar que el endpoint de la vista operario reutilice o unifique esta lógica. |
| Estados de línea (pendiente/completado/excedido) | Sí (backend ProductionView ya los devuelve) | Ninguno. |
| Filtro por almacén en palets disponibles | Sí (`storeId` en available-for-order) | Ninguno. |
| “Pedido modificado” en tiempo real | No | Opcional: WebSocket o polling para notificar cambios en pedidos visibles. |
| Nuevos estados de pedido (En carga, Parcial) | No | Solo si el producto lo exige: ampliar enum/status en backend. |
| Un producto por palet (regla configurable) | No | Validación en backend o frontend al añadir caja; posible flag por tenant. |
| Mover cajas entre palets / dividir palets | No | Cambio de modelo y flujos; no asumir para la primera versión de la vista operario. |
| Parámetro de fecha en production-view | No (hoy el spec indica "fecha de hoy" fija) | Si la vista operario incluye "selector de fecha/turno", el endpoint debería aceptar opcionalmente `date` o `loadDate` para filtrar pedidos; si no, el frontend filtra por fecha sobre la respuesta. |
| Permisos por rol para orquestador y "Finalizar pedido" | Depende de roleConfig actual | Definir en producto; puede requerir cambios en roleConfig o en backend (permisos por acción). |
| Cajas con estado / cajas sin palet ("Disponible") | No (hoy caja pertenece a palet) | Paradigma §4.4: la caja nace por emisión de etiqueta y puede existir sin palet. Requiere modelo: cajas con estado (ej. Etiqueta emitida, Disponible, En palet) y/o tabla de "cajas disponibles" escaneables antes de asignar a palet. |
| Dos pantallas (Emisión de etiquetas vs Preparación por escaneo) | No (una sola vista orquestador maqueta) | Producto: Pantalla 1 = solo producción de etiquetas/cajas; Pantalla 2 = solo escaneo y agrupación. No mezclar creación de cajas con pesos y construcción de palets en la misma pantalla. |

La implementación actual (maqueta) puede seguir con una sola vista para validar flujo; el modelo objetivo es **dos pantallas** y, si se adopta el paradigma §4.4, **cajas con estados** (o cajas disponibles sin palet) en backend. Otras mejoras (aviso de pedido modificado, reglas por producto por palet) son evoluciones.

---

# 1️⃣2️⃣ CONCLUSIÓN ESTRATÉGICA

No se trata de simplificar la pantalla actual del Gestor de Pedidos, sino de **separar claramente**:

**ERP Administrativo** (pedido como centro, pestañas, gestión estructural)  
**vs**  
**Orquestador Operativo de Muelle** (flujo físico, progreso visible, acciones persistentes)

El operario no debe sentir que está “gestionando entidades”; debe sentir que está **preparando una carga física**.

El núcleo del diseño queda en:

1. **Dos pantallas:** Emisión de etiquetas (Producción) y Preparación de pedidos (Agrupación en palets por escaneo). Producción vs preparación son dos momentos físicos distintos; una sola pantalla no debe resolver ambos.
2. **Caja con estados** (conceptual): Etiqueta emitida, Disponible, En palet, Asignada a pedido, Cargada. El palet es **agregador** de cajas, no generador.
3. **Orden conceptual:** Etiqueta → Caja → Palet → Pedido → Envío. Progreso visible en Pantalla 2 y asignación flexible de palets a pedidos.

Con §4.4 (problema real, dos fases), §6 (estructura de ambas pantallas), §8 (flujos) y el resto del documento, se puede derivar wireframes y decisiones de arquitectura (incluyendo modelo de cajas disponibles / estados de caja si el backend lo exige).
