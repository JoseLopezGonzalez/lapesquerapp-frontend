# Catálogo funcional — La PesquerApp

> **Qué es este documento:** inventario funcional completo del ERP (no de la
> landing pública), construido analizando el código real a fecha
> **2026-07-28**. Es la fuente de verdad para: (1) redactar textos de la
> landing/blog sobre lo que hace el producto, (2) decidir la estructura de
> precios/planes, (3) decidir qué funcionalidades van en cada plan o como
> bloque add-on.
>
> **Metodología:** exploración de código (rutas, componentes, hooks,
> services, entidades) por 6 agentes en paralelo, uno por bloque de módulos.
> No incorpora todavía correcciones de negocio de Jose — es un borrador para
> revisar y completar donde el código no explique el "por qué".
>
> **Cómo se mantiene:** este documento es una fotografía puntual, no vive
> sincronizado automáticamente con el código. Antes de usarlo para una
> decisión importante de pricing, verificar que el módulo en cuestión no haya
> cambiado desde esta fecha (`git log` sobre las carpetas relevantes).

---

## Leyenda de estados de madurez

| Estado | Significado |
| --- | --- |
| ✅ **Activo** | Funcional de extremo a extremo: UI + hook + service + persistencia real. Verificado en código, no solo en la navegación/menú. |
| 🟡 **En progreso** | Parcialmente implementado — falta una pieza (backend, UI, o conexión entre ambos) para considerarse cerrado. |
| ⚪ **Placeholder** | Existe la UI o el modelo de datos pero opera con datos mock/local o está deshabilitado explícitamente en el código. **No vender como feature disponible.** |

---

## Roles del sistema

Tabla confirmada en `src/configs/roleConfig.ts` + `src/middleware.ts` (gate duro de ruta) + `src/configs/navigationConfig.js` (qué ve cada rol en el menú, capa adicional de UX no de seguridad):

| Rol | Área propia | Acceso |
| --- | --- | --- |
| `administrador` | — | Todo `/admin/*` |
| `direccion` | — | Todo `/admin/*` |
| `tecnico` | — | Todo `/admin/*` |
| `administracion` | — | Solo `/admin/external-processors` |
| `supervisor` | — | Solo `/admin/home` (cualquier otra ruta admin redirige aquí) |
| `operario` | `/operator` | Sin acceso a `/admin/*` |
| `comercial` | `/comercial` | Sin acceso a `/admin/*` (vista de pedidos propia, restringida) |
| `repartidor_autoventa` | `/field` | Sin acceso a `/admin/*` — mobile-first |

Hay además un **panel Superadmin** (`/superadmin`) completamente aparte, con su propia autenticación — no es un rol de tenant, es el equipo de La PesquerApp gestionando el SaaS (ver [Panel Superadmin](#panel-superadmin-uso-interno-no-vendible)).

**Hallazgo clave para pricing:** ya existe en el código un sistema real de **feature flags por tenant** (`session.user.features`, consumido por `requiredFeature` en `navigationConfig.js`), con estas claves confirmadas en uso:

```
module.inventory · module.raw_material · module.production ·
module.sales · module.supplier_liquidations · module.punch_events ·
module.labels
```

Y en el panel Superadmin existen ya **3 planes** en el modelo de datos: `basic` / `professional` / `enterprise`, con una pantalla (`GlobalFeatureFlagsTable`) que define qué flags trae cada plan por defecto, y overrides por tenant individual. **No hay facturación ni límites cuantitativos (nº usuarios, nº pedidos/mes) implementados** — el modelo actual es binario por feature, no por consumo.

> ⚠️ **Matización de Jose (2026-07-28):** este sistema de flags/planes ya era
> conocido, pero se construyó rápido y **no es determinante** — no debe leerse
> como la estructura de pricing definitiva. Es muy probable que, a raíz de la
> lógica de negocio que se defina a partir de este catálogo, tanto las claves
> `module.*` como los propios planes de Superadmin se rediseñen o se
> sustituyan. Tratarlo como plumbing técnico reutilizable (evita construir el
> mecanismo desde cero), no como una decisión de producto ya tomada.

Esto significa que la pregunta de pricing no es "¿inventamos un sistema de planes?" — el mecanismo técnico ya existe y probablemente se pueda reutilizar — sino **"¿qué estructura de planes/add-ons se desprende de la lógica de negocio real, y cómo se remapea (o se sustituye) el sistema de flags/planes actual para reflejarla?"**

---

## Índice de módulos

1. [Ventas / Pedidos](#1-ventas--pedidos)
2. [CRM Comercial](#2-crm-comercial)
3. [Stock / Almacén](#3-stock--almacén)
4. [Proveedores](#4-proveedores)
5. [Editor de Etiquetas](#5-editor-de-etiquetas)
6. [Catálogos de Sector](#6-catálogos-de-sector)
7. [Maquiladores / Producción](#7-maquiladores--producción)
8. [Repartidores / Autoventa](#8-repartidores--autoventa)
9. [Administración](#9-administración)
10. [IA / Extracción de documentos de lonja](#10-ia--extracción-de-documentos-de-lonja)
11. [Panel Superadmin (uso interno, no vendible)](#panel-superadmin-uso-interno-no-vendible)

---

## 1. Ventas / Pedidos

**Rol objetivo:** administrador, dirección, técnico, comercial (vista restringida).
**Problema que resuelve:** gestionar el ciclo de vida completo de un pedido de pescado/congelado — desde la previsión de productos hasta la expedición, documentación legal/logística y análisis de rentabilidad — sin depender de hojas de cálculo ni de que la información viva repartida entre distintas personas.
**Estado global:** ✅ Activo — es el módulo con más profundidad funcional de todo el ERP.

### Features

- **Listado y filtros de pedidos** ✅ — tabs por categoría (Todos/Hoy/Mañana/En producción/Terminados), búsqueda con debounce, filtros avanzados (cliente, especie, producto, comercial, transporte, incoterm, referencia, facturado, fecha de carga).
- **Creación de pedido** ✅ — formulario con autocompletado de datos del cliente (comercial, forma de pago, incoterm, transporte, direcciones, notas), líneas de producto planificadas + líneas auxiliares (no-pescado: envases, hielo, servicios), versión mobile dedicada.
- **Ficha de pedido** ✅ — vista central con secciones: información, previsión, detalle de productos, otros artículos, análisis, producción, palets, etiquetas, envío de documentos, descargas, ruta, incidencias, histórico de cliente, adjuntos. Layout distinto para mobile (cards) y desktop (tabs).
- **Workflow de estados con validación de cuadre** ✅ — al cerrar un pedido con producción pendiente o no planificada exige confirmación explícita; tolerancia de cuadre calculada con fórmula de negocio (`min(max(10kg, planificado×3%), 75kg)`).
- **Previsión vs. producción real** ✅ — cruce automático de líneas planificadas contra lo realmente producido, con estado por línea (cuadra / diferencia / pendiente / no previsto).
- **Gestión de palets del pedido** ✅ — crear palets desde previsión, vincular/desvincular palets existentes, selección de almacén, impresión masiva de etiquetas, coste por palet.
- **Vista de producción del pedido** ✅ — seguimiento dentro de la ficha + vista global "modo cocina" desde el listado.
- **Análisis de rentabilidad** ✅ — margen por producto y por palet (importe, coste, margen €, margen %), con permiso de visibilidad diferenciado (oculto a comercial sin autorización); además hay rentabilidad agregada a nivel dashboard (resumen, timeline, por producto) con exportación asíncrona.
- **Incidencias del pedido** ✅ — crear/resolver/eliminar, con generación de PDF "Reporte de Incidencias".
- **Adjuntos** ✅ — subida, notas, gestión de archivos ligados al pedido.
- **Exportación / documentos** ✅ — catálogo de **17 documentos** configurables: nota de carga (normal y sin nombre de cliente), CMR, letreros de transporte, etiquetas de expedición, packing list, hoja de pedido, reporte de lotes/cajas (Excel), albarán A3ERP, nota de carga valorada, confirmación de pedido, solicitud de recogida, reporte de incidencias, y variantes anonimizadas para maquilador. Envío directo al cliente/maquilador por email. Restricción real de qué documentos ve el rol comercial (documentos sensibles ocultos).
- **Etiquetas del pedido** ✅ — selección de líneas o cajas individuales para imprimir.
- **Mapa de ruta de entrega** ✅ — geocodificación origen/destino con Mapbox, degrada con aviso explícito si falta el token de Mapbox.
- **Histórico de cliente en contexto** ✅ — gráficos de compras históricas del cliente dentro de la ficha del pedido.
- **Dashboard de ventas** ✅ — peso neto total, importe, ranking de pedidos, ventas por comercial, gráfico de ventas y de transporte.
- **Permisos de solo lectura por estado/rol** ✅ — bloqueo real de secciones/edición para comercial en pedidos "en curso".
- **Catálogos de soporte** ✅ — clientes, comerciales, formas de pago, incoterms, transportes, todos con CRUD propio y reutilizados en CRM/ofertas.
- **Temperatura del pedido** ✅ — campo editable (fresco/congelado), funcionalidad menor pero cerrada.

**Integraciones:** Mapbox (rutas), exportación a A3ERP/A3ERP2/Facilcom, envío de email, exposición genérica del catálogo de pedidos a un chat de IA transversal (no es IA de negocio específica de pedidos).

**Nota de pricing:** el volumen y profundidad de este módulo (documentos legales/logísticos, rentabilidad, palets, mapas) lo hace candidato natural a "núcleo" del producto en cualquier plan — es difícil vender el ERP sin él.

---

## 2. CRM Comercial

**Rol objetivo:** comercial, dirección (vista de gestión).
**Problema que resuelve:** gestionar la relación con clientes y prospectos (captación, seguimiento, próximas acciones, ofertas) sin depender de un CRM externo desconectado del pedido real.
**Estado global:** ✅ Activo.

> ✅ **Discrepancia con `CLAUDE.md` corregida (2026-07-28):** el archivo raíz documentaba el CRM como *"En progreso — agenda pendiente"*. El código muestra la agenda **completamente implementada** (ruta montada, hook con 4 funciones completas, mutaciones de reprogramar/cancelar/resolver, componente de 1484 líneas, cero TODOs detectados). Confirmado por Jose y corregido en la tabla de módulos de `CLAUDE.md` en este mismo turno.

### Features

- **Agenda comercial** ✅ — listado de eventos con filtros de fecha/tipo/estado, resumen (vencidos/hoy/próximos), reprogramar, cancelar con motivo, resolver próxima acción pendiente por prospecto/cliente.
- **Prospectos** ✅ — CRUD completo, ficha de detalle rica (datos, contactos múltiples con contacto primario, panel de interacciones, ofertas asociadas, geolocalización), categorización de prospectos.
- **Conversión de prospecto a cliente** ✅ — flujo de negocio real con invalidación de caché en cascada (dashboard, agenda, listado).
- **Interacciones comerciales** ✅ — registro rápido (llamada/visita/email) asociado a prospecto o cliente, timeline en la ficha.
- **Resolver próxima acción** ✅ — pieza que cierra el ciclo interacción → próxima acción → agenda.
- **Clientes desde vista comercial** ✅ — ficha con panel de pedidos y panel de histórico de ofertas.
- **Ofertas / presupuestos** ✅ — ciclo de vida completo: crear, enviar (email/WhatsApp), aceptar, rechazar con motivo, marcar expirada, **crear pedido directamente desde una oferta aceptada**, descarga de PDF.
- **Dashboard CRM** ✅ — acciones pendientes, datos agregados de clientes/prospectos.
- **Mejora de texto con IA** ✅ — botón "mejorar con IA" en 4 campos de texto (resumen de interacción, próxima acción, interés comercial, notas), único uso de IA de negocio real en este módulo.
- **Rutas comerciales (planificador de visitas)** ✅ — submódulo hermano no solicitado en el alcance original pero de facto parte del CRM: listado de rutas, panel de paradas con drag&drop, plantillas de ruta, mismo componente de mapa que Ventas.
- **Autoventa desde CRM/admin** ✅ — wizard de 8 pasos con escaneo QR, alta rápida de cliente, impresión de ticket (ver también el flujo mobile en [Repartidores](#8-repartidores--autoventa)).

**Integraciones:** WhatsApp/email (envío de ofertas), Mapbox (rutas), IA (mejora de texto), reutiliza catálogos de Ventas (comerciales, incoterms, formas de pago).

**Nota de pricing:** módulo con alcance mayor de lo que sugiere `CLAUDE.md` — incluye ofertas, rutas y autoventa, no solo prospectos/interacciones/agenda. Candidato razonable a plan intermedio/superior si se quiere segmentar por "solo operativa" vs. "operativa + captación comercial".

---

## 3. Stock / Almacén

**Rol objetivo:** administrador, dirección, técnico, operario (mobile-first).
**Problema que resuelve:** trazabilidad física completa de palets/cajas/lotes desde su creación hasta la expedición, con ubicación real dentro del almacén y sin depender de anotaciones en papel.
**Estado global:** ✅ Activo — módulo con más inversión de producto junto con Ventas y Producción.

### Features

- **Gestión de palets (crear/editar/cerrar)** ✅ — composición de cajas, peso neto/bruto, producto, lote, tara, vinculación a pedido. UI desktop y una vista **mobile completamente rediseñada** (11 pantallas propias, no responsive del desktop).
- **Gestión de cajas dentro del palet** ✅ — alta manual, por distribución de peso promedio, duplicado, edición individual/masiva, borrado total.
- **Escaneo de códigos GS1-128** ✅ — alta/baja automática de caja por lector, auto-envío al completar el código. ⚠️ **Bug de dominio conocido y documentado internamente**: el Application Identifier de precisión usado es el incorrecto (3100/3200 en vez de 3102/3202), por lo que un lector GS1 estándar externo decodifica el peso ×100. Afecta también a la creación de cajas vinculada a pedidos. Relevante mencionarlo como riesgo operativo real, no solo interno.
- **Impresión de etiquetas de palet/caja** ✅ — individual y masiva (desde recepciones o desde gestión de pedidos).
- **Trazabilidad / histórico del palet (timeline)** ✅ — eventos de creación, edición de cajas, cambios de posición, vinculación a pedido.
- **Adjuntos/imágenes del palet** ✅ — subida, visor tipo lightbox, borrado.
- **Listado de palets** ✅ — vía motor genérico de entidades, con filtros y exportación.
- **Almacenes y ubicaciones (mapa visual)** ✅ — mapa de posiciones físicas del almacén, vista Kanban de palets, slideover de detalle de posición, asignación de palet a hueco, resumen de stock por producto. Incluye una **vista externa para clientes** (`/external/stores-manager`).
- **Movimientos de almacén** ✅ — mover palet individual o en bloque entre almacenes, asignar/liberar posición.
- **Vinculación masiva de palets a pedido desde previsión** ✅ — crear palets directamente desde la previsión de un pedido, repartir peso entre cajas.
- **Cajas como catálogo independiente** ✅ — CRUD completo vía service dedicado, aunque sin listado de admin propio (se consume sobre todo desde el editor de palet).
- **Lotes** 🟡 — no existe una entidad "Lote" independiente con CRUD propio: el lote es un campo de la caja/palet, y la trazabilidad se resuelve agregando cajas por lote en la UI (resumen del palet). Funcional para consulta agregada, pero sin gestión de lote como entidad de negocio ni búsqueda directa por lote en el listado.
- **App de almacén para operarios (mobile-first)** ✅ — dashboard táctil con recepciones/salidas del día, calculadora de peso neto, formularios extensos de alta de recepción y de salida de cebo diseñados específicamente para móvil, layout de rol propio. Patrón arquitectónico consistente (vista mobile separada, no CSS responsive).

**Integraciones:** ninguna externa además de GS1-128 (estándar de código de barras del sector).

**Nota de pricing:** el escaneo GS1-128 + mapa de almacén + app mobile para operarios es un paquete de valor claro y diferencial frente a un ERP genérico — buen argumento para un plan que incluya "operativa de almacén". El bug de precisión del código de barras debería resolverse antes de usarlo como claim de marketing ("trazabilidad por código de barras compatible con lectores estándar").

---

## 4. Proveedores

**Rol objetivo:** administrador, dirección.
**Problema que resuelve:** gestionar proveedores de materia prima y liquidar periódicamente cuentas con ellos (comparando lo declarado por el proveedor contra lo efectivamente recibido/entregado), típico de cooperativas y lonjas del sector pesquero.
**Estado global:** ✅ Activo.

### Features

- **Ficha de proveedor (CRUD)** ✅ — datos de contacto, dirección, código de exportación contable (Facilcom).
- **Liquidaciones a proveedor** ✅ — selección de recepciones de materia prima + salidas de cebo dentro de un rango de fechas, cálculo automático de totales de peso/importe, comparación contra lo declarado por el proveedor (con diferencia en peso/importe/porcentaje), cierre inmutable con usuario y fecha.
- **Flujo "Nueva liquidación"** ✅ — vista de calendario visual (iconos por día según tipo de actividad), detalle día a día, generación de PDF de vista previa y definitivo, gestión de IVA/método de pago/comisión.
- **Historial de liquidaciones cerradas** ✅ — listado filtrable, vista de solo lectura (las liquidaciones cerradas no son editables, solo consultables/eliminables).

**Integraciones:** ninguna externa; relación financiera con Recepciones de Materia Prima y Salidas de Cebo (ver [Producción](#7-maquiladores--producción)).

**Nota de pricing:** feature de nicho sectorial real (no es un CRUD genérico de "proveedores" como en cualquier ERP) — el calendario de liquidaciones con comparación declarado-vs-calculado es un diferenciador defendible frente a competidores genéricos. Candidato a destacarse en copy de landing dirigido específicamente a cooperativas/lonjas.

---

## 5. Editor de Etiquetas

**Rol objetivo:** administrador, dirección, técnico.
**Problema que resuelve:** diseñar e imprimir etiquetas físicas de producto/palet con cumplimiento normativo (Reglamento UE 1379/2013: nombre comercial + científico, método de producción, zona de captura) sin depender de un diseñador gráfico externo cada vez que cambia un dato.
**Estado global:** ✅ Activo. **Ya es un feature gateado por plan en el código actual** (`requiredFeature: 'module.labels'` en `navigationConfig.js`) — es el primer precedente real de "módulo add-on" en el producto.

### Features

- **Canvas de diseño WYSIWYG en milímetros reales** ✅ — arrastrar, redimensionar, rotar, alinear; imprime a tamaño exacto de página (`@page` en mm), no PDF genérico.
- **Tipos de elemento** ✅ (salvo uno) — texto libre, campo de producto, campo manual/select/checkbox, fecha (con 3 modos, incluyendo "fecha de caducidad = envasado + N días"), párrafo enriquecido, línea, registro sanitario formateado, QR y código de barras (EAN13/CODE128) con validación de longitud.
- **Elemento imagen** ⚪ — existe en el modelo de datos y el render, pero el botón para añadirlo está deshabilitado explícitamente en el código. No funcional.
- **Campos dinámicos de trazabilidad** ✅ — catálogo de campos ligados a datos reales de negocio (especie, código FAO, nombre científico, arte de pesca, zona de captura, GTIN, peso neto formateado). Conecta directamente con los [Catálogos de Sector](#6-catálogos-de-sector).
- **Gestión de etiquetas como plantillas (CRUD + duplicar)** ✅.
- **Validaciones de guardado** ✅ — nombre obligatorio, claves de campo sin duplicar, opciones de select obligatorias.
- **Importar/exportar JSON** ✅ — portar diseños entre tenants o hacer backup manual.
- **Impresión** ✅ (indirecta) — vía diálogo de impresión del navegador (iframe + `@page`), no hay integración SDK con impresora física ni generación de PDF en servidor. Puede imprimir a una etiquetadora física si el driver está instalado en el equipo, o guardar como PDF.
- **Impresión por pares** ✅ — para rollos de etiquetas dobles.
- **Impresión en lote con datos reales** ✅ — autorrelleno de campos dinámicos por caja/palet real al imprimir en lote.
- **Campos manuales al momento de imprimir** ✅ — diálogo previo si la etiqueta tiene campos manuales, con persistencia local para no repetir la captura.
- **Etiquetas de palet con QR de trazabilidad** ✅ — QR codifica identificador de palet+pedido, pensado para escanear y localizar.
- **Etiquetas numéricas de producción** ✅ — feature hermana pero independiente (no requiere `module.labels`), impresión secuencial simple para planta.

**Integraciones:** ninguna externa — todo el motor de impresión es del navegador.

**Nota de pricing:** ya validado como módulo separable en el propio código — es el ejemplo más claro y menos ambiguo de "add-on" para el modelo de planes. El elemento imagen deshabilitado no debería aparecer en copy de marketing como disponible.

---

## 6. Catálogos de Sector

**Rol objetivo:** administrador, dirección, técnico (configuración de base).
**Problema que resuelve:** mantener el catálogo maestro de especies, artes de pesca, zonas de captura y países que alimenta trazabilidad, etiquetado normativo y formularios en el resto de la app.
**Estado global:** ✅ Activo — motor genérico ("EntityClient") sobre 4 catálogos: especies, artes de pesca, zonas de captura, países.

### Features

- **CRUD genérico completo** ✅ para los 4 catálogos — listar, crear, editar, eliminar (individual y en lote), con validación declarativa por catálogo.
- **Endpoint de opciones para autocompletar** ✅ en los 4 — alimenta selects en productos, proveedores, transformadores externos, etc.
- **Relación Especie ↔ Arte de Pesca** ✅ — campo obligatorio a nivel de especie, único cruce de negocio explícito entre catálogos de sector (la relación especie↔zona de captura vive un nivel más arriba, en Producto).
- **Relación Producto → Especie + Zona de Captura + Familia** ✅ — es donde realmente se cumple la trazabilidad normativa completa (nombre científico + zona FAO + arte de pesca por producto); alimenta directamente los campos dinámicos del editor de etiquetas.
- **Validaciones específicas del sector** ✅ — código FAO de especie con patrón normativo, GTIN-13/14 de artículo/caja/palet, campos de integración con ERPs externos (A3ERP, Facilcom).
- **Autocompletado de nombre científico desde base FAO/ASFIS** ✅ — catálogo mundial embebido de **+13.700 especies** (ASFIS 2025, FAO), usado para autosugerir el nombre científico al dar de alta una especie nueva. Dato de contenido aprovechable en landing ("catálogo FAO integrado").
- **Alta de especie/arte de pesca al vuelo durante extracción de datos de mercado** ✅ — única lógica de negocio "activa" sobre estos catálogos (más allá de CRUD), integrada con el módulo de [IA/Extracción](#10-ia--extracción-de-documentos-de-lonja).
- **Catálogos "puros" (zona de captura, arte de pesca)** ✅ — solo campo nombre, sin coordenadas ni jerarquía de subzonas FAO estructuradas. Funcionalmente el nivel más básico de los cuatro.
- **Sin estado activo/inactivo** — a diferencia de otras entidades del sistema (proveedores, transformadores externos), estos catálogos no tienen soft-delete ni campo de estado; es una decisión de diseño, no una carencia.

**Integraciones:** ninguna externa (el catálogo FAO/ASFIS es un dataset estático embebido, no una API).

**Nota de pricing:** normalmente parte del núcleo (sin catálogo de especies no hay trazabilidad ni etiquetado), no tiene sentido como add-on independiente.

---

## 7. Maquiladores / Producción

**Rol objetivo:** administrador, dirección, técnico, operario.
**Problema que resuelve:** transformar materia prima pesquera en producto terminado con trazabilidad completa de lote, control de rendimiento/merma, y conciliación económica con proveedores — sustituyendo hojas de producción en papel y cálculos manuales de rendimiento.
**Estado global:** ✅ Activo — junto con Ventas y Stock, el módulo con mayor inversión de desarrollo.

> **Aclaración de dominio importante:** "maquila" aparece en el código en **dos sentidos distintos**: (1) producción interna propia (este módulo), y (2) "maquilador" como tercero subcontratado a nivel de pedido (`external-processors`, con documentación específica de envío tipo CMR/letreros anonimizados — ver [Ventas](#1-ventas--pedidos)). Para landing/pricing conviene presentarlos como dos conceptos distintos: *"producción propia con trazabilidad"* vs. *"gestión documental de subcontratación a terceros"*.

### Features

- **Recepción de materia prima** ✅ — entrada de pescado/materia prima con proveedor, especie, fecha, líneas por producto/lote (peso bruto, nº cajas, tara, peso neto calculado), precio por kg. Compara dato **declarado por el proveedor** contra lo medido (control anti-diferencia). Incluye desglose diario por calibre/especie.
- **Producciones (lote de fabricación)** ✅ — lote identificado por lote+especie+zona de captura, con apertura/cierre explícitos. Dentro de cada producción, **procesos encadenados en árbol padre-hijo**: inputs (cajas/palets consumidos), outputs (productos generados con coste), y trazabilidad de qué input/output contribuyó a cada salida (con porcentaje de contribución).
- **Cálculo de rendimiento y merma** ✅ — `yield`/`yieldPercentage` y `waste`/`wastePercentage` calculados por proceso y por lote completo a partir de peso de entrada vs. salida. Cálculo real, no solo conceptual.
- **Editor de procesos de producción** ✅ — asignación de inputs (incluye escaneo GS1-128 de palet), outputs con costes, consumos entre procesos padre-hijo. Los archivos más grandes del módulo (2700+ líneas en el gestor de outputs), señal de inversión real.
- **Diagrama visual de producción** ✅ — árbol de proceso como diagrama de flujo (proceso, reproceso, ventas, stock, restantes), con filtro por cliente/pedido.
- **Cierre y reapertura de producción con control de calidad** ✅ — bloquea el cierre si hay: proceso sin iniciar/finalizar, proceso final sin outputs, pedido pendiente, palet sin expedir, stock restante sin asignar, caja huérfana, conciliación no OK (11 condiciones de bloqueo distintas). Solo `administrador`/`direccion` pueden gestionarlo. Uno de los flujos de negocio más sofisticados de todo el catálogo.
- **Cajas y stock huérfano** ✅ — detección de cajas/stock sin asignar dentro de una producción.
- **Costeo de producción** ✅ — catálogo de tipos de coste, selección de fuente, desglose por producto/salida.
- **Panel de control de producciones** ✅ — dashboard con resumen y filtros (lote, especie, estado) para dirección/técnicos.
- **Imágenes de proceso de producción** ⚪ — UI de subida completa (drag&drop, validación de tipo/tamaño) pero **explícitamente no conectada a backend** ("mock data para apariencia" declarado en el propio código). No presentar como disponible.
- **Etiquetas numéricas de producción** ✅ — impresión física de planta, independiente del editor de etiquetas.
- **Liquidaciones a proveedores** ✅ — ver [Proveedores](#4-proveedores); conecta recepciones + salidas de cebo no liquidadas.
- **Exportación contable** ✅ — recepciones y salidas de cebo a Facilcom/A3ERP/A3ERP2.

**Integraciones:** GS1-128 (escaneo), exportación contable a terceros.

**Nota de pricing:** el cierre de producción con 11 validaciones de bloqueo y el árbol de procesos con cálculo de rendimiento real son features de profundidad "vertical de sector" difíciles de replicar en un ERP genérico — fuerte candidato a plan superior/enterprise, o a ser el ancla de un plan "planta de producción" diferenciado del plan "solo comercial/almacén".

---

## 8. Repartidores / Autoventa

**Rol objetivo:** `repartidor_autoventa` — mobile-first, único acceso es `/field`.
**Problema que resuelve:** que un repartidor pueda ejecutar su ruta de reparto, servir pedidos y hacer ventas directas en el momento desde el móvil, con navegación real y trazabilidad de caja por código de barras.
**Estado global:** ✅ Activo.

### Features

- **Dashboard del repartidor** ✅ — ruta de hoy, contador de pedidos pendientes/finalizados, resumen de paradas, acceso rápido a autoventa.
- **Rutas de reparto con mapa interactivo** ✅ — paradas obligatorias/sugeridas/oportunidad (cliente, prospecto o ubicación libre), cálculo de trayecto real por carretera (Mapbox Directions), navegación parada a parada con deep-links a **Google Maps y Waze**, marcar parada completada/omitida/con incidencia.
- **Ejecución de pedido en ruta** ✅ — wizard de 6 pasos: contexto → previsión planificada → escaneo de cajas GS1-128 → revisión de precios → resumen → confirmación. Compara previsto vs. servido y detecta productos extra no previstos.
- **Autoventa (venta directa sin pedido previo)** ✅ — a cliente existente o nuevo, escaneo de cajas físicas, agregación por producto con peso/precio, marca de "requiere factura", vínculo opcional a ruta/parada.
- **Gestión administrativa de repartidores (back-office)** ✅ — CRUD de operadores de campo, vincula usuario del sistema con perfil de repartidor.
- **Planificador de rutas / plantillas (back-office, en `/admin`)** ✅ — contraparte necesaria para que el módulo mobile funcione; se gestiona desde admin, no desde el móvil.

### Gaps detectados (relevantes si se quiere prometer en pricing/landing)

- **Cierre de parada sin firma digital, foto de entrega ni registro de cobro** 🟡 — el resultado de una parada solo captura tipo (entrega/autoventa/sin contacto/incidencia/visita) + nota de texto libre. Si se quiere vender "prueba de entrega" o "cobro en ruta", **no existe hoy en el código**.
- **Sin "stock de furgoneta" como entidad propia** — las cajas escaneadas en autoventa son cajas ya existentes en el sistema (por GS1-128), no un inventario de furgoneta gestionado aparte.

> **Nota de alcance:** "Salidas de cebo" (`cebo-dispatches`) aparece en `CLAUDE.md` bajo el mismo epígrafe que Repartidores, pero **no es una feature del repartidor** — su ruta está restringida a `administrador`/`direccion`/`tecnico` y ningún archivo de `/field` la referencia. Es una operación de almacén/back-office (despacho de cebo/carnada a compradores), documentada aquí bajo [Producción](#7-maquiladores--producción). Recomendación: no listarlo junto a Repartidores en el copy de landing.

**Integraciones:** Mapbox (mapa + cálculo de ruta), Google Maps / Waze (navegación externa), GS1-128 (escaneo).

**Nota de pricing:** módulo de nicho claro ("reparto de pescado fresco/congelado con ruta optimizada") — la integración de mapas y navegación real (no solo un listado de direcciones) es un diferenciador defendible. El hueco de firma/foto/cobro es relevante si la competencia sí lo ofrece — vale la pena confirmarlo antes de posicionar el producto contra ella en ese punto concreto.

---

## 9. Administración

**Rol objetivo:** administrador, dirección, técnico (gestión de la operativa interna del tenant).
**Problema que resuelve:** gestionar usuarios, permisos, empleados, fichaje, transportes y configuración de empresa sin depender de soporte técnico externo.
**Estado global:** ✅ Activo, con dos huecos puntuales documentados abajo.

### Features

- **Gestión de usuarios internos** ✅ — CRUD con asignación de rol y reenvío de invitación (magic link) por email.
- **Usuarios externos (colaboradores tipo maquilador)** ✅ — CRUD + activar/desactivar + reenvío de acceso.
- **Roles** ⚪ **(limitado por diseño, no por deuda)** — no hay CRUD de roles desde el frontend; el backend no expone gestión de roles, solo un endpoint de opciones. Los roles del sistema son fijos, no configurables por el tenant.
- **Empleados** ✅ — CRUD con UID de tarjeta NFC para fichaje automático.
- **Gestión horaria / fichajes** ✅ — registro manual de entrada/salida, calendario de fichajes, fichaje automático por NFC. Ya gateado por feature flag (`module.punch_events`) — segundo precedente real de módulo add-on en el código, junto con Etiquetas.
- **Impuestos (tipos de IVA)** 🟡 — el service backend está completo (CRUD real), pero **no existe pantalla de administración en el frontend** ni entrada de menú; solo se consume como select de opciones en formularios de pedido/oferta. Si se quiere vender "gestión de impuestos" como feature de UI, hoy hay que completarla.
- **Transportes** ✅ — catálogo de transportistas con datos fiscales, direcciones, contactos.
- **Sesiones y logs de actividad** ✅ — solo lectura: sesiones activas por usuario, auditoría de requests (IP, dispositivo, navegador, ruta, método).
- **Configuración de empresa (Settings)** ✅ — datos generales, registro sanitario, contactos por departamento, textos legales usados en documentos generados.

**Integraciones:** ninguna externa además del email de invitación.

**Nota de pricing:** núcleo operativo, no tiene sentido como add-on salvo el submódulo de fichaje/NFC (`module.punch_events`), que ya está técnicamente preparado para venderse aparte.

---

## 10. IA / Extracción de documentos de lonja

**Rol objetivo:** administrador, dirección, técnico.
**Problema que resuelve:** evitar la transcripción manual de albaranes de lonja/cofradía (documentos de compra de pescado en subasta) al sistema, y conciliar automáticamente esos documentos oficiales contra las recepciones de materia prima ya registradas.
**Estado global:** ✅ Activo en producción, con una limitación técnica documentada y un patrón "a medida por cliente" a tener en cuenta para pricing como SaaS estándar.

### Features

- **Extracción con IA de 3 tipos de documento** ✅ — albarán de Cofradía de Pescadores Santo Cristo del Mar, listado de compras de Lonja de Isla, listado de compras de la Asociación de Armadores de Punta del Moral. 5 modelos OpenAI seleccionables (`gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `o4-mini`) más un motor Azure Document Intelligence "legacy" aún presente en el selector.
- **Extracción tabular completa** ✅ — no son campos sueltos: extrae cabecera (lonja, fecha, comprador, nº albarán, importe), líneas de venta (barco, armador, matrícula, especie, cajas, **kilos, precio €/kg**, importe, código NRSI), tablas resumen por especie/vendiduría/tipo de caja/tipo de subasta, y subtotales con IVA.
- **Chequeo de catálogo con alta al vuelo** ✅ — contrasta especies/vendidurías/barcos/productos del documento contra los catálogos del tenant y permite darlos de alta sin salir del flujo (conecta con [Catálogos de Sector](#6-catálogos-de-sector)).
- **Conciliación con recepciones de materia prima** ✅ — agrupa las compras extraídas por proveedor+fecha y actualiza en bloque el "dato declarado" (peso e importe) de recepciones ya existentes — es decir, **no crea recepciones desde cero**, concilia el documento oficial contra lo ya registrado.
- **Exportación contable** ✅ — genera Excel formateado para A3ERP/Facilcom.
- **Modo individual y modo masivo** ✅ — procesar un documento o varios PDFs en lote, con exportación y conciliación en bloque.

### Limitaciones documentadas

- **Timeout de 60s (plan Hobby de Vercel)** ⚠️ — deuda técnica explícita en `CLAUDE.md`, riesgo real de fallo con documentos grandes y modelos de razonamiento (o-series). Opciones ya identificadas: mover a backend Laravel, subir a Vercel Pro, o extracción asíncrona con polling.
- **Mapeo contable hardcodeado por tenant en el código fuente** ⚠️ — las tablas de mapeo barco↔vendiduría↔código A3ERP (uno de los archivos, ~5400 líneas) están embebidas literalmente en el código del frontend, no en base de datos ni configuración. **Esto significa que hoy este submódulo concreto no es self-service para un tenant nuevo sin intervención de desarrollo** — importante no venderlo como "configurable por el cliente" sin aclarar que requiere onboarding técnico a medida.

**Integraciones:** OpenAI (vía `@ai-sdk/openai`), Azure Document Intelligence (legacy, posible código muerto — no confirmado).

**Nota de pricing:** feature de altísimo valor percibido ("IA que lee tus albaranes de lonja") pero con dos condicionantes reales para cómo se vende: (1) el límite de 60s es un riesgo de producto que conviene resolver antes de escalarlo a más tenants con documentos grandes, (2) tal como está hoy, cada documento/tenant nuevo requiere trabajo de desarrollo (prompt + mapeo contable), no es plug-and-play — encaja mejor como servicio de onboarding premium / plan enterprise que como checkbox de autoservicio en un plan estándar, salvo que se invierta en generalizarlo primero.

---

## Panel Superadmin (uso interno, no vendible)

**Quién lo usa:** el equipo de La PesquerApp (Jose), no los tenants/clientes. Autenticación y capa HTTP propias, completamente aparte del resto de la app.
**Estado global:** ✅ Activo — panel maduro y con inversión de desarrollo real (login passwordless, 8 pasos de onboarding automatizado de tenant, impersonación con doble modalidad silenciosa/consentida, feature flags globales, blocklist, error logs, salud de colas).

**Por qué se documenta aquí aunque no se venda:** dos piezas de datos que gestiona son insumo directo para el catálogo de planes:

1. **Los 3 planes ya existentes en el modelo de datos**: `basic` / `professional` / `enterprise` — hoy son solo una etiqueta (sin lógica de facturación ni límites numéricos asociados).
2. **El mecanismo real de Feature Flags por plan + override por tenant** (`GlobalFeatureFlagsTable` define el default por plan, `FeatureFlagsTab` permite excepciones puntuales por tenant) — es la pieza técnica que ya existe para construir cualquier segmentación de planes que se decida a partir de este catálogo. No hace falta construirla desde cero, **pero según Jose ni las claves `module.*` actuales ni los 3 planes son la clasificación definitiva** — se construyeron rápido y es probable que se rediseñen una vez salga la lógica de negocio real de este catálogo. Reutilizar el mecanismo, no dar por buena la clasificación actual.

**Lo que NO existe hoy en Superadmin** (relevante para no prometerlo en la landing todavía): facturación/cobro (sin Stripe, sin importes — solo una fecha de renovación sin lógica de cobro), métricas de consumo por tenant (usuarios, almacenamiento, pedidos), soporte/tickets, límites cuantitativos por plan (solo flags booleanas, no "máx. N usuarios").

---

## Propuesta inicial de clasificación Core / Add-on

Esta es una **propuesta de partida basada en evidencia técnica** (qué ya está gateado por feature flag, qué es dependencia de qué, qué es "nicho sectorial" vs. "operativa base") — no una decisión de pricing cerrada, y **tampoco debe confundirse con los 3 planes/flags que ya existen en Superadmin**, que según Jose son provisionales y probablemente cambien a raíz de este mismo catálogo (ver matización arriba). A ajustar por Jose.

### Núcleo (difícil de vender el producto sin esto)

- Ventas / Pedidos
- Catálogos de Sector (especies, artes de pesca, zonas de captura, países — dependencia técnica de casi todo lo demás)
- Administración (usuarios, transportes, configuración de empresa)

### Candidatos a add-on con evidencia técnica ya en el código (`requiredFeature`)

> El mecanismo (`requiredFeature`/flags) es reutilizable; la lista de claves y a qué plan pertenecen hoy no es definitiva — ver matización de Jose arriba.

- **Editor de Etiquetas** (`module.labels`) — ya gateado hoy.
- **Fichaje / gestión horaria NFC** (`module.punch_events`) — ya gateado hoy.
- Flags adicionales confirmadas en uso pero no auditadas a fondo en esta pasada: `module.inventory`, `module.raw_material`, `module.production`, `module.sales`, `module.supplier_liquidations` — sugieren que Stock, Producción, Proveedores/Liquidaciones y el propio módulo de Ventas **ya tienen la percha técnica lista** para activarse/desactivarse por plan, aunque no se ha confirmado en esta pasada si están efectivamente aplicadas de forma granular o si hoy actúan como on/off de todo el módulo — y su asignación actual a un plan concreto es la parte que más probablemente cambie.

### Candidatos a add-on por criterio de nicho/complejidad (sin flag técnica confirmada todavía)

- **Liquidaciones a proveedores** — feature sectorial específica (cooperativas/lonjas), no todos los tenants la necesitarán.
- **Producción con árbol de procesos y control de cierre** — profundidad "planta de producción"; un tenant que solo compra/vende sin transformar no la necesita.
- **IA / Extracción de documentos de lonja** — alto valor pero con coste de onboarding técnico real hoy (mapeo hardcodeado); encaja mejor como addon premium o servicio gestionado que como checkbox de autoservicio mientras no se generalice.
- **Repartidores / Autoventa** — solo relevante para tenants con reparto propio en furgoneta.
- **CRM (ofertas + rutas + agenda + autoventa)** — relevante para tenants con equipo comercial activo de captación, no para quien solo gestiona pedidos entrantes.

### Fuera del modelo de pricing (uso interno)

- Panel Superadmin.

---

## Dirección de pricing decidida por Jose (2026-07-28)

Respuesta a la pregunta 1 de abajo — no es un modelo binario puro ni un modelo puramente cuantitativo, sino **híbrido**:

- **Planes base** que combinan (a) **límites cuantitativos** (nº de usuarios, cuota de uso de IA, y posiblemente otros ejes aún por determinar — nº de pedidos/mes, almacenamiento, etc.) con (b) un **conjunto de bloques/features incluidos por defecto** según el nivel de plan (los módulos de este catálogo, agrupados).
- **Bloques adicionales tarifables por separado** — un tenant en un plan que no incluye un bloque por defecto puede añadirlo a la carta, pagando un extra.
- **El plan más alto incluye todos los bloques** sin necesidad de add-ons — es el plan "todo incluido".
- **Pendiente de definir** (no inventar cifras todavía): qué ejes cuantitativos concretos entran en el modelo, qué bloques van por defecto en cada nivel de plan, y los números/precios de cada uno. Este catálogo (sección [Propuesta inicial de clasificación Core / Add-on](#propuesta-inicial-de-clasificación-core--add-on)) es el punto de partida para decidir qué bloques existen — falta mapearlos a niveles de plan concretos.

**Importante:** esta dirección de modelo es independiente de los flags/planes que ya existen en Superadmin (ver matización de Jose más arriba) — probablemente el sistema técnico actual se remapee para soportar límites cuantitativos, que hoy no existen en absoluto (los flags actuales son binarios, sin contador de uso).

---

## Propuesta concreta de niveles de plan (borrador — 2026-07-28, a validar por Jose)

Primera propuesta concreta para arrancar la conversación, **no es una decisión cerrada** — la idea es que Jose la revise, tache/ajuste bloques y confirme o cambie los ejes cuantitativos y sus cifras. Reutiliza los nombres ya existentes en Superadmin (`Básico` / `Profesional` / `Enterprise`) por continuidad técnica con el modelo de datos actual — el nombre comercial final se puede cambiar sin afectar a la estructura de bloques.

### Ejes cuantitativos (borrador, cifras ilustrativas — NO usar en landing/pricing público hasta validar coste real)

| Eje | Básico | Profesional | Enterprise |
| --- | --- | --- | --- |
| Usuarios internos incluidos | p.ej. 3 | p.ej. 10 | Alto/ilimitado |
| Cuota de extracción IA de documentos de lonja (docs/mes) | No incluida | No incluida (requiere onboarding, ver nota) | Incluida, con onboarding técnico |
| Cuota de asistencia de texto IA (CRM: mejora de textos) | No incluida | Incluida | Incluida |
| Usuarios repartidor/campo | 0 | p.ej. 2 incluidos | Según necesidad |

> Las cifras concretas (nº de usuarios, cuotas) requieren datos que este catálogo no tiene: coste real por llamada a OpenAI, coste de infraestructura por tenant, y benchmark de lo que cobra la competencia. Son placeholders para que Jose las sustituya, no una propuesta de precio.

### Bloques por nivel de plan

| Bloque | Básico | Profesional | Enterprise |
| --- | --- | --- | --- |
| Ventas / Pedidos | Incluido (core) | Incluido (core) | Incluido (core) |
| Catálogos de Sector | Incluido (core) | Incluido (core) | Incluido (core) |
| Administración (usuarios, transportes, config. empresa) | Incluido (core) | Incluido (core) | Incluido (core) |
| Stock / Almacén | Add-on | Incluido | Incluido |
| Proveedores (ficha + liquidaciones) | Add-on | Incluido | Incluido |
| CRM (prospectos, ofertas, agenda, rutas) | Add-on | Incluido | Incluido |
| Editor de Etiquetas | Add-on | Add-on | Incluido |
| Fichaje / gestión horaria NFC | Add-on | Add-on | Incluido |
| Repartidores / Autoventa | Add-on | Add-on | Incluido |
| Maquiladores / Producción | Add-on (bajo consulta) | Add-on (bajo consulta) | Incluido |
| IA / Extracción de documentos de lonja | No disponible | No disponible (self-service) | Incluido, con onboarding técnico |

### Notas de diseño detrás de esta propuesta

- **Core siempre activo en los 3 planes**: Ventas/Pedidos, Catálogos de Sector y Administración básica son la base mínima sin la que el ERP no tiene sentido — no se plantean como add-on.
- **El salto Básico → Profesional está pensado como "salgo de solo vender" a "opero almacén + capto clientes activamente"**: Stock/Almacén, Proveedores y CRM completo se agrupan porque son el conjunto típico de un tenant que ya gestiona trazabilidad física y equipo comercial, no solo facturación.
- **Etiquetas, Fichaje/NFC y Repartidores se mantienen como add-on incluso en Profesional** porque responden a necesidades operativas específicas que no todo tenant mediano tiene (cumplimiento normativo de etiquetado, control horario de plantilla, flota de reparto propia) — tiene sentido cobrarlos aparte en vez de forzar su inclusión.
- **Producción/Maquila marcado "bajo consulta" en Básico/Profesional**: es la feature más compleja de todo el catálogo (árbol de procesos, cierre con 11 validaciones); técnicamente nada impide venderla como add-on de cualquier plan, pero probablemente tenga más sentido comercial reservarla para tenants con planta propia y tratarla como conversación de ventas, no checkbox de autoservicio.
- **IA/Extracción no se ofrece como add-on de autoservicio en ningún plan por debajo de Enterprise**, y en Enterprise se vende "con onboarding técnico" explícito — reflejo directo de la limitación real detectada en el catálogo (mapeos contables hardcodeados por tenant en el código fuente, no configurables por el cliente). No convertirlo en checkbox de autoservicio hasta generalizar esa parte del código.

### Qué falta decidir (para la revisión de Jose)

1. Confirmar o ajustar qué bloques van en qué nivel de la tabla de arriba (es una hipótesis de partida, no un análisis de mercado).
2. Definir los ejes cuantitativos reales que se van a cobrar y sus cifras (la tabla de ejes es solo un esqueleto).
3. Decidir si Producción/Maquila e IA/Extracción se venden "bajo consulta comercial" (como se propone aquí) o se convierten también en checkbox de autoservicio a futuro.
4. Decidir el naming comercial final de los 3 niveles (o si el número de niveles cambia — nada obliga a mantener exactamente 3).

---

## Preguntas abiertas para cerrar el modelo de pricing — estado 2026-07-28

1. ✅ **Resuelta** — ver "Dirección de pricing decidida" arriba: modelo híbrido de planes (límites cuantitativos + bloques por defecto) con add-ons tarifables, plan superior = todos los bloques incluidos.
2. 🟡 **Sigue abierta.** Jose tampoco tiene certeza de si `module.inventory`, `module.raw_material`, `module.production`, `module.sales`, `module.supplier_liquidations` están aplicándose hoy de forma granular en producción o si actúan como on/off grosero de todo el módulo. Requiere verificación directa en backend/BD — fuera del alcance de un análisis de frontend.
3. ✅ **Resuelta.** Se deja el límite de 60s tal cual por ahora; se marca como deuda técnica (ya documentada como punto 9 de "Deuda técnica documentada" en `CLAUDE.md`). No bloquea el uso de este catálogo.
4. ✅ **Resuelta.** El bug de precisión GS1-128 se marca como deuda técnica; no bloquea el estudio del producto ahora mismo. Sigue siendo relevante resolverlo antes de usar "trazabilidad por código de barras estándar" como claim explícito de marketing.
5. ✅ **Resuelta.** Corregido en `CLAUDE.md` en este mismo turno — la tabla de módulos ya no dice "agenda pendiente".
