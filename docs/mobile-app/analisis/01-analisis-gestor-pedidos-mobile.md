# Análisis del Gestor de Pedidos – Versión Mobile / PWA

Este documento recoge un análisis específico del **gestor de pedidos** en su versión mobile / PWA, basado en la situación actual de PesquerApp. Usa como base el análisis previo (texto original) y lo organiza en conclusiones accionables para diseño e implementación.

---

## 1️⃣ Veredicto rápido – estructura general

**Conclusión corta:**  
La **estructura conceptual es correcta y muy cercana a un patrón nativo**, pero aún se percibe como una **web racionalizada** más que como una **app operativa**.

No está mal (de hecho, está bien pensada a nivel web), pero es lógico que todavía se sienta “poco natural” en mobile.

---

## 2️⃣ Aciertos estructurales importantes

### 2.1. Niveles bien separados (patrón nativo)

El flujo actual del gestor de pedidos es:

- **Lista de pedidos**  
  ↓
- **Pedido (overview / pantalla de resumen)**  
  ↓
- **Sección concreta** (Información, Palets, Producción, etc.)  
  ↓
- **Acción** (editar, crear, vincular, …)

Esto es **100% patrón nativo**:

- Antes se intentaba mostrar “todo a la vez”.
- Ahora hay **profundidad y niveles claros**.
- El modelo mental es sólido: lista → detalle → subdetalle → acción.

### 2.2. Overview del pedido como pantalla propia

La pantalla del pedido (ej. `#2424`) tiene:

- Identidad clara del pedido.
- Datos clave: Cliente, Transporte, Estado.
- KPIs rápidos: fecha, temperatura, palets, importe, etc.
- Acceso a secciones internas.

Esto está **alineado con apps nativas complejas** (logística, banca, salud):  
un overview que da contexto + puertas a las áreas de trabajo.

### 2.3. Secciones aisladas por contexto

Secciones como:

- Información
- Palets
- Producción
- Etiquetas
- …

cada una:

- tiene **pantalla propia**,
- su **propio scroll**,
- su **propio foco**.

Esto también es muy nativo y facilita la adaptación a mobile (drill-down).

---

## 3️⃣ Problemas estructurales que generan “web encogida”

### 3.1. Demasiadas secciones al mismo nivel

En el overview aparecen muchas secciones al mismo plano:

- Información
- Previsión
- Detalle productos
- Producción
- Palets
- Etiquetas
- …

En apps nativas maduras suele haber:

- **1–2 secciones primarias muy claras**,
- y el resto como **secundarias o más profundas**.

Ahora mismo el usuario implícitamente se pregunta:

> “¿Por dónde empiezo?”

Eso aumenta la **carga cognitiva** y resta sensación de flujo guiado.

### 3.2. Overview mezclando “estado” y “menú”

El overview del pedido hace dos cosas a la vez:

- Mostrar el **estado actual** del pedido.
- Actuar como **menú de navegación interna**.

En desktop esta dualidad es aceptable.  
En mobile conviene separar mejor:

- **Arriba** → estado / resumen / KPIs.
- **Abajo** → navegación interna / secciones / acciones.

Actualmente todo está bastante homogéneo visualmente, sin esa separación clara.

### 3.3. Falta de jerarquía temporal (antes / durante / después)

Un pedido tiene una **progresión natural**:

1. Datos comerciales / información base.
2. Producción / preparación.
3. Palets / consolidación.
4. Etiquetas.
5. Envío / cierre.

La UI actual:

- no refleja explícitamente ese **“antes / durante / después”**,
- presenta todas las secciones con un peso similar,
- no guía al usuario por el **momento** del ciclo de vida del pedido.

Las apps nativas suelen comunicar mejor esa progresión, incluso de forma sutil (orden, estados, badges, barras de progreso, etc.).

---

## 4️⃣ Análisis de la UI (sensación visual y táctil)

### 4.1. Sensación general

**Veredicto rápido:**  
La UI se siente **limpia, profesional y consistente**, pero:

- un poco **plana**,
- demasiado **neutral**,
- no lo suficientemente **“táctil”**.

Es una UI correcta como web administrativa, pero todavía no “brilla” como UI de app nativa.

### 4.2. Aciertos de UI

- **Uso de cards y superficies**
  - Cards bien definidas.
  - Separación visual adecuada.
  - Nada excesivamente apelotonado.
- **Tipografía y espaciados**
  - Legible.
  - Ritmo vertical razonable.
  - No hay saturación.
- **Sheets / dialogs para editar**
  - Modal de edición scrollable.
  - CTA claro.
  - Patrón muy alineado con mobile nativo.

### 4.3. Puntos donde se pierde “feeling nativo”

#### 4.3.1. Todo pesa lo mismo visualmente

En el overview:

- Cliente
- Transporte
- Estado
- KPIs
- Botones de sección

tienen un **peso visual muy similar**.

En apps nativas:

- el ojo va primero a **1 punto clave** (ej. estado + info crítica),
- luego a **2–3 secundarios**,
- y luego explora.

Aquí el ojo **escanea**, no **fluye**.

#### 4.3.2. Botones de sección demasiado neutros

Los accesos a:

- Información
- Palets
- Producción
- Etiquetas

se perciben como:

- **botones de web**,
- más que como **“lugares” a los que entrar**.

En apps nativas es común ver:

- tarjetas más **expresivas**,
- iconos con intención,
- **pistas de contenido** (“3 palets”, “Producción completa”, “Falta preparar X”, etc.).

#### 4.3.3. Falta feedback de progreso del pedido

El pedido puede estar, por ejemplo, “En producción”, pero la UI:

- no deja ver claramente **qué está hecho**,
- qué **falta**,
- ni **dónde estamos** dentro del flujo.

Esto resta sensación de “app operativa” y de control del proceso.

#### 4.3.4. Acciones importantes con poco peso visual

Acciones como:

- Editar,
- Crear palet,
- Vincular,
- Cerrar / avanzar estado…

aparecen, pero **no destacan** tanto como deberían para una app de trabajo en mobile.

En mobile, las apps nativas:

- **exageran lo frecuente**,
- minimizan lo raro u ocasional.

Aquí todo queda demasiado equilibrado.

---

## 5️⃣ Conclusión honesta

> No es que el gestor de pedidos esté mal diseñado.  
> Es que está **diseñado demasiado bien como web**, y aún no lo suficiente como **app nativa operativa**.

La base es muy buena:

- modelo de pantallas,
- separación por secciones,
- uso de sheets,
- limpieza visual,
- uso de ShadCN como base.

Lo que falta es:

- **jerarquía emocional** (qué importa más visualmente),
- **sensación de progreso** (dónde estoy en el ciclo del pedido),
- **peso en lo importante** (acciones y estados clave),
- **atrevimiento al simplificar** (no tratar todas las secciones igual).

---

## 6️⃣ Qué NO tocar (base sólida)

Según el análisis, **no deberíamos tocar**:

- el **modelo de pantallas** (lista → overview → sección → acción),
- la **separación por secciones** (Información, Palets, Producción, etc.),
- el uso de **sheets/dialogs** para edición,
- la **limpieza visual** general,
- **ShadCN** como design system base.

Todo esto es correcto y sirve como cimiento.

---

## 7️⃣ Análisis de la pantalla principal (lista de pedidos)

### 7.1. Qué es realmente esta pantalla (modelo mental)

A nivel técnico puede verse como una “lista de pedidos”, pero para el usuario es:

- **La pantalla principal de trabajo** del gestor de pedidos.

Equivalencias mentales típicas:

- WhatsApp → lista de chats
- Mail → inbox
- Uber Eats (repartidor) → lista de pedidos activos

Esto implica cosas importantes:

- Se entra aquí **muchas veces al día**.
- Se vuelve aquí **constantemente**.
- Tiene que ser **rápida, clara y tranquilizadora**.
- No es una pantalla meramente informativa: es una pantalla **operativa**.

### 7.2. Estructura actual de la lista

De arriba a abajo, la estructura actual es:

- App bar
- Buscador + botones
- Filtros por estado
- Lista de pedidos (cards)

**Veredicto:** estructuralmente **correcta**; no hay un error grave aquí, pero sí margen de mejora de cara a mobile nativo.

### 7.3. Dónde empieza a chirriar estructuralmente

#### ⚠️ 1. Demasiadas cosas antes de la lista

Antes de ver el primer pedido, el usuario se encuentra con:

- buscador
- botón de cambio de vista
- botón “+” (crear)
- filtros
- exportar

En apps nativas de listas operativas:

- la **lista aparece muy pronto**,
- las herramientas están presentes, pero **no compiten visualmente** con la lista.

Ahora mismo el ojo tarda un poco en llegar a lo importante: **los pedidos**.

#### ⚠️ 2. Acciones de distinto nivel compitiendo

Acciones con distinta frecuencia/importancia:

- Buscar → muy frecuente.
- Cambiar filtro → frecuente.
- Exportar → poco frecuente.
- Crear → frecuente, pero puntual.

Visualmente **todas pesan casi igual**.

En apps nativas:

- se **exagera lo frecuente**,
- se “apagan” las acciones raras u ocasionales.

#### ⚠️ 3. Falta sensación de “estado global”

La pantalla se presenta como “Pedidos activos”, pero no responde a preguntas clave:

- ¿Cuántos pedidos activos hay?
- ¿Qué estado domina?
- ¿Estoy al día o voy retrasado?

No hace falta mostrar métricas complejas, pero un **mínimo contexto global** ayuda mucho a que la pantalla sea tranquilizadora y operativa.

### 7.4. Análisis de UI de la lista

#### 7.4.1. Lo que funciona muy bien

- **Cards de pedidos**
  - Legibles.
  - Jerarquía clara (`#` → cliente → fecha).
  - Estado visible.  
    Son buenas cards; no conviene romperlas.

- **Chips de estado**
  - El chip “En producción” se entiende, es consistente y escaneable.
  - Muy alineado con patrones nativos.

- **Uso del espacio**
  - No está apretado ni vacío.
  - Se puede leer rápido.
  - Correcto para una app operativa.

#### 7.4.2. Dónde se siente poco nativo

- **Demasiado “perfecto”, poco táctil**
  - Todo está bien alineado, bien espaciado, equilibrado.
  - Sensación: “web muy bien hecha”, pero no tanto “app de trabajo en el bolsillo”.
  - Las apps nativas suelen jugar más con énfasis, gestos y velocidad visual por encima de la simetría perfecta.

- **Las cards no invitan a tocar**
  - Son correctas, pero no sugieren claramente “entra aquí”.
  - Faltan pistas de interacción: sombra, chevron, microanimación, cambio de color al tap, etc.

- **El filtro de estado se siente “web”**
  - El bloque “Todos / En producción / Terminados…” funciona, pero recuerda a un filtro de dashboard.
  - En una app nativa, el filtro principal de estado forma casi parte de la **identidad de la lista** (“estoy viendo X ahora mismo”).

### 7.5. Qué cambiar sin romper lo que ya funciona

Sin rediseñar desde cero, se pueden aplicar estos ajustes:

- **Clarificar la jerarquía visual superior**
  - Arriba: solo lo esencial (título + búsqueda).
  - El resto: más discreto (iconos secundarios, menús, etc.).

- **Hacer que la lista sea protagonista antes**
  - Reducir el “aire” y ruido antes de la primera card.
  - Que el usuario vea pedidos casi inmediatamente al abrir la pantalla.

- **Dar intención táctil a las cards**
  - Micro feedback al tap (sombra, escala ligera, highlight).
  - Indicios de navegación (chevron, layout que sugiera “detalle”).
  - Sin añadir ruido, solo pistas sutiles.

- **Reforzar el filtro como elemento clave**
  - Que transmita “ahora mismo estás viendo ESTE subconjunto de pedidos”.
  - Más que un filtro genérico, que actúe como **modo de vista** (ej.: “Activos”, “Hoy”, “Retrasados”… según el caso).

---

### 7.6. Análisis en profundidad: lista como cola de trabajo operativa

#### Tipo de pantalla (modelo mental correcto)

**No es:**

- ❌ “Un listado con filtros”.

**Es:**

- ✅ **Cola de trabajo operativa.**

Modelo mental correcto en mobile:

> “Estos son los pedidos que tengo que gestionar hoy / ahora.”

Eso cambia por completo las decisiones de UI.

#### Jerarquía mental correcta en mobile

En una cola de trabajo, el usuario prioriza:

1. **Estado del pedido**
2. **Cliente**
3. **Fecha / urgencia**
4. **Acción implícita** (entrar a trabajar)

**No prioriza** (en mobile):

- Filtros complejos
- Exportar
- Vista alternativa
- Gestión masiva

Todo eso es **secundario** en mobile.

#### Patrón web que se cuela ahora

En la pantalla actual:

- Barra de búsqueda + iconos compactos
- Filtros tipo tabs persistentes
- Botón exportar visible
- **Demasiadas decisiones antes de empezar**

Esto es **backoffice web comprimido**.

En mobile nativo:

- **Primero ves trabajo, luego gestionas.**

#### Patrón nativo que debería dominar: Task / Job List

Características:

- Lista vertical **protagonista**
- Header **simple**
- Acciones secundarias **ocultas** (overflow, sheet)
- Filtros **ligeros**, no persistentes como tabs

Referencias visuales útiles (apps de reparto, técnicos de campo, picking/almacén, logística):

- Google Images: _delivery app job list mobile_, _field service task list mobile_, _logistics app order queue_
- Dribbble / Pinterest: _task list mobile enterprise_, _job list mobile app_, _operations app mobile list_

---

### 7.7. Análisis de interfaz: header, filtros, cards y acciones secundarias

#### 7.7.1. Header: demasiado cargado para mobile

**Lo que hay ahora:**

- Título
- Search input
- Iconos
- Botón +
- Filtros visibles
- Exportar

En mobile nativo:

- ❌ Demasiadas decisiones arriba
- ❌ Rompe el foco visual
- ❌ Sensación de “panel”, no de app

**Patrón nativo recomendado:**

- Header simple: **Título** + **Back** (si aplica) + **1 acción primaria** (crear).
- Búsqueda y filtros: **acción secundaria** (sheet o pantalla de filtros), no siempre visibles en la barra.

Referencias: _mobile app list header simple_, _ios navigation bar enterprise_, _android top app bar list_.

#### 7.7.2. Filtros: tabs vs estado de trabajo

**Problema actual:**

- “Todos / En producción / Terminados” como **tabs**:
  - Ocupan espacio
  - Compiten con la lista
  - Parecen **navegación principal**, cuando en realidad son **filtros de estado**.

**Patrón nativo:**

- Estado como **chip seleccionable** o filtro accesible desde **icono** (no siempre visible).
- Modelo mental: _“Estoy viendo pedidos en producción”_, no _“Estoy en la pestaña Producción”_.

Referencias: _mobile app filter chips_, _gmail mobile filters_, _task app filter sheet_.

#### 7.7.3. Cards de pedido: base buena, afinable

**Qué funciona muy bien:**

- Card completa clickable
- Estado visible arriba
- Cliente como protagonista
- Fecha clara

**Qué la haría más nativa:**

1. **Estado más integrado**
   - Ahora el estado es “etiqueta arriba”.
   - En apps nativas: el estado **tiñe la card**, vive en el **borde** o se integra en el **título**.
   - Menos “badge suelto”, más “señal de contexto”.
   - Referencias: _mobile app status list card_, _order list status mobile_, _task status list mobile_.

2. **Jerarquía interna más clara**
   - Actualmente todo parece casi igual de importante.
   - En mobile: **Cliente (principal)** → **Fecha / meta (secundario)** → **ID más pequeño**.
   - El ID no debe competir visualmente con el cliente.

#### 7.7.4. Acciones secundarias (exportar, vista, etc.)

- **Exportar en mobile:** es raro, es ocasional, no es tarea principal.
- Debe vivir en **menú de overflow** o en una **pantalla secundaria**.
- Ahora mismo “grita” demasiado en la barra.

Referencias: _mobile app overflow menu_, _enterprise app list actions_, _android overflow actions list_.

---

### 7.8. Propuesta conceptual concreta (sin rediseñar todo)

Cambios de enfoque (conceptuales, no necesariamente píxel a píxel):

1. **Reinterpretar la pantalla como “Mi trabajo”**
   - Menos controles visibles.
   - Más foco en la lista.
   - Menos opciones simultáneas.

2. **Simplificar el header**
   - Título + Crear pedido. Nada más.
   - Search + filtros → **acción secundaria** (icono que abre sheet o pantalla).

3. **Filtros como estado, no como navegación**
   - “En producción” como **filtro activo** (chip o indicador).
   - Visualmente claro, pero **no dominante**.

4. **Cards como unidades operativas**
   - Estado integrado en la card (no solo badge).
   - Cliente protagonista.
   - Menos texto, más intención (entrar a trabajar).

---

### 7.9. Cómo sabrás que lo has hecho bien

Cuando:

- la pantalla se **entienda sin leer**,
- el **pulgar vaya solo** a un pedido,
- no haga falta **“pensar” antes de tocar**,

estás en el camino correcto.

Si el usuario puede:

**Abrir la app → tocar un pedido → trabajar**

sin pararse arriba (búsqueda, filtros, exportar), la pantalla cumple su rol como cola de trabajo operativa.

---

### 7.10. Siguiente micro-paso sugerido

Para avanzar sin rehacer todo, conviene elegir **uno** de estos focos:

- **A)** Redefinir solo el **header + filtros** (simplificar arriba, mover búsqueda/filtros a secundario).
- **B)** Refinar solo las **cards** (estado integrado, jerarquía cliente > fecha > ID, pistas táctiles).
- **C)** Diseñar el **flujo de búsqueda y filtros** en sheet (cómo se abre, qué muestra, cómo se cierra).

---

### 7.11. Header — Análisis estructural completo

#### Qué es el header ahora mismo

En la versión actual, el header intenta hacer **demasiadas cosas a la vez**:

- Identidad de la pantalla (“Pedidos Activos”)
- Búsqueda
- Cambio de vista
- Crear pedido
- Filtros de estado
- Exportar

Esto es **típico header de backoffice web**, comprimido en mobile.

En mobile nativo profesional, el header cumple **una** función principal:

- **Orientar + permitir empezar a trabajar.**

Todo lo demás es secundario.

#### Modelo mental correcto en mobile

Cuando alguien abre esta pantalla en móvil, en &lt; 1 segundo su cerebro hace:

- “¿Dónde estoy?”
- “¿Tengo trabajo pendiente?”
- “¿Puedo entrar rápido a un pedido?”

**No** piensa:

- “voy a exportar”
- “voy a cambiar vista”
- “voy a filtrar finamente”

Eso viene **después**, si hace falta.

#### Patrones web que se cuelan

1. **Header como toolbar multifunción** → muy web / desktop.
2. **Filtros visibles como navegación principal** → tabs = navegación, no filtro.
3. **Acciones poco frecuentes demasiado visibles** → exportar + vista alternativa no son tareas móviles.

Consecuencia: fricción cognitiva, sensación de “panel”, aspecto no nativo.

#### Patrón nativo que debería dominar: Top App Bar simple + acciones secundarias ocultas

Patrón habitual en apps de logística, bancarias, field service y enterprise bien hechas:

- Header **limpio**
- **1 acción primaria** visible
- El resto en **sheets / overflow**

Referencias: _enterprise mobile app list header_, _logistics app top app bar_, _task list mobile app header_, _mobile app top bar enterprise_, _task list header mobile_, _operations app mobile ui_.  
Fíjate en: espacio que ocupa el header, cuántos iconos hay, **qué no está visible**.

#### Propuesta conceptual del header (sin rediseñar)

**Header ideal para esta pantalla:**

- ← (back si aplica)
- “Pedidos” (o “Pedidos activos”, corto)
- ➕ Crear pedido
- **Nada más.**

El botón + está perfecto como acción primaria. El avatar puede quedarse, pero no debe competir.

**Búsqueda y filtros:**  
Patrón nativo recomendado → **Botón “Buscar / Filtrar”** que abre **bottom sheet** o pantalla dedicada.  
En mobile: buscar ≠ ver; filtrar ≠ navegar.  
Mentalmente: pasar de _“Tengo que decidir filtros antes de ver nada”_ a _“Veo mis pedidos → si no encuentro algo, filtro”_.

**Filtros de estado (Todos / En producción / Terminados):**  
Problema: se leen como **pestañas de navegación**; semánticamente son **estado del trabajo**.  
Patrón correcto: el estado activo se muestra como **contexto** (texto, chip discreto, subtítulo), no como navegación persistente. Ej.: “Pedidos · En producción”.  
Referencias: _task filter bottom sheet mobile_, _gmail mobile filter sheet_, _mobile app status filter_.

**Exportar y vista alternativa:**  
Exportar **no** es una acción mobile-first. Debe vivir en **overflow (⋮)** o solo en desktop. Tenerlo visible en header contamina y refuerza sensación web.

#### Cómo sabrás que el header ya es correcto

Test mental: abres la app con una mano, ves el header.

- Si la respuesta es **“Tocar un pedido o crear uno”** → header bien.
- Si es **“Tengo que mirar opciones”** → sigue siendo web.

#### Checklist rápido (validar implementación)

- ⛔ No más de **2 acciones visibles** en header
- ⛔ No filtros persistentes ocupando altura
- ✅ Lista visible **lo antes posible**
- ✅ Acción primaria **clara**
- ✅ Búsqueda/filtros como **acción secundaria**

---

### 7.12. Búsqueda y filtros — Modelo mental y patrón sheet

#### Qué es realmente “buscar y filtrar” en esta app

En PesquerApp, buscar/filtrar pedidos **no** es:

- un modo permanente
- una navegación paralela
- una tarea continua

**Es:** una **acción puntual de recuperación**.

Modelo mental real:

> “No veo lo que quiero → filtro → vuelvo a trabajar.”

Por eso: no debe vivir siempre visible, no debe competir con la lista, no debe parecer pantalla principal.

#### Error web típico (que se está rozando ahora)

- Search input siempre visible
- Filtros siempre ocupando espacio
- Estado de filtro confundido con navegación

Transmite _“Esta pantalla va de filtrar”_ cuando en realidad va de _“Trabajar pedidos”_.

#### Patrón nativo correcto: Bottom sheet / full-screen sheet de búsqueda y filtros

Estándar en apps bancarias, correo, logística y task management:

- No rompe contexto
- Se entiende como acción temporal
- El usuario sabe cómo salir
- Reduce ruido visual permanente

Referencias: _mobile filter bottom sheet_, _enterprise app search filter sheet_, _task list filter mobile_, _filter bottom sheet mobile app_, _search filter mobile ui_, _enterprise mobile filters_.

#### Estructura correcta del sheet (conceptual)

**Entrada:** desde el header, icono 🔍 o “Buscar” / icono de filtro. Ambos pueden llevar al **mismo sheet** (muy nativo: búsqueda y filtros juntos).

**Orden interno** (de más usado a menos):

1. **Búsqueda por texto** (ID, cliente)
2. **Estado del pedido** (Todos, En producción, Terminados)
3. **Fechas** (fecha de carga, rango simple)
4. **(Opcional)** Otros filtros (comercial, transporte, etc.)

**Clave nativa:** no todo expandido. Solo 1–2 filtros visibles; el resto colapsables. Reduce scroll, fatiga y sensación de “formulario web”.

**Estado del filtro ≠ navegación:** el estado (“En producción”) se selecciona en el sheet, se refleja en la lista y no ocupa espacio permanente arriba. Puede mostrarse como texto contextual, chip discreto o subtítulo (ej. “Pedidos · En producción”), no como tabs.

**Acciones del sheet:** CTA primario “Aplicar filtros”, secundaria “Limpiar”, cierre claro (X o swipe). Referencias: _apply filters mobile bottom sheet_, _clear filters mobile app_, _filter action buttons mobile_.

#### Qué quitar sin miedo

- ❌ Exportar fuera del sheet
- ❌ Vista alternativa fuera del sheet
- ❌ Filtros visibles permanentemente
- ❌ Search input siempre ocupando espacio

Nada de eso es mobile-first.

#### Test de sensación nativa

Flujo: Abro “Pedidos” → veo pedidos → no encuentro uno → toco 🔍 → filtro → vuelvo a lista filtrada → entro a un pedido.  
Si se siente **rápido, obvio y sin leer** → patrón nativo real.

#### Checklist de implementación (búsqueda y filtros)

- ⛔ No hay search input visible por defecto
- ⛔ No hay tabs de estado persistentes
- ✅ Sheet se abre desde header
- ✅ Filtros agrupados y colapsables
- ✅ CTA claro de aplicar
- ✅ Estado visible pero discreto al volver

---

### 7.13. Cards — Análisis estructural y patrón Task / Job Card

#### Qué es una card de pedido en mobile

**No es:** un contenedor de información.  
**Es:** una **unidad de trabajo**.

Modelo mental: _“Este pedido es algo que voy a tocar, abrir y trabajar”_.  
Por tanto: debe sentirse táctil, comunicar estado sin leer, invitar a entrar.

#### Patrón web que se cuela ahora

- Mucho texto plano
- Jerarquía bastante homogénea
- Estado como badge separado
- Card muy “informativa”

En desktop está bien; en mobile parece una **ficha**, no una **acción**.

#### Patrón nativo correcto: Task / Job Card

Usado en apps de reparto, técnicos, almacén, field service:

- Se lee en **0,5 segundos**
- Estado se **percibe sin leer** texto
- El dedo “sabe” **dónde tocar**

Referencias: _job card mobile app_, _delivery task list mobile_, _logistics order card mobile_, _task card mobile enterprise_, _field service app list_, _operations app mobile ui_.  
Fíjate en: color lateral, grosor del borde, separación vertical, tamaño del tap target.

#### Jerarquía interna de la card (clave)

Orden mental correcto en mobile:

1. **Cliente**
2. **Estado** (sin leer)
3. **Fecha / urgencia**
4. **ID** (referencia, no protagonista)

Ahora: el ID compite demasiado, el estado es demasiado literal, la fecha no se siente como “deadline”.

**Estado:** color lateral, fondo sutil, icono + texto corto. No badge flotando ni etiqueta tipo chip web. Referencias: _mobile app status indicator card_, _task status color stripe_, _order list status mobile_.

**Cliente:** lo primero que lee el ojo, máximo peso tipográfico. En apps reales: “Trabajo para X”.

**Fecha:** contexto temporal; muchas apps la acompañan de icono o la muestran como “Hoy”, “Mañana”. Referencias: _task due date mobile_, _job deadline mobile ui_.

**ID:** más pequeño, color secundario, referencia rápida; no debe liderar.

#### Densidad y espaciado

En mobile operativo: **menos texto, más aire**, separación clara entre cards.  
Ahora se está cerca del límite superior de densidad. Pequeños cambios: +4 / +8 px padding, más separación vertical, líneas más claras → mejora tocabilidad, escaneo y sensación premium.

#### Gestos y acciones (sin liarlo)

Para esta versión: **tap = abrir**. Nada más. No meter swipe actions, multi-select ni long press de entrada; eso vendrá después si hace falta. Apps profesionales priorizan fiabilidad y no sorpresas.

#### Qué no tocar (base que ya está bien)

- ✅ Card completa clickable
- ✅ Estado visible
- ✅ Cliente claro
- ✅ Fecha presente

No partimos de cero.

#### Test rápido de card nativa

Mostrar la lista 2 segundos, tapar el texto, preguntar: _“¿Cuántos pedidos están en producción?”_

- Si puede responder por **color / forma / patrón** → card nativa.
- Si necesita **leer** → sigue siendo web.

#### Checklist de implementación (cards)

- ⛔ Estado no depende solo de texto
- ⛔ ID no es lo más grande
- ✅ Cliente es protagonista
- ✅ Card se siente “tocable”
- ✅ Lista se escanea rápido

---

### 7.14. Micro-interacciones — Modelo mental

#### Qué espera el usuario en mobile profesional

Cuando toca algo, espera una **respuesta inmediata**, aunque sea mínima:

- Cambio visual
- Transición
- Feedback táctil
- Estado claro

En web el feedback puede ser tardío. En app, si no hay respuesta, parece que no ha funcionado.

#### 7.14.1. Tap en una card (crítico)

**Lo que suele pasar en adaptaciones web:**  
Tap → espera → navegación. Sin feedback inmediato. Sensación de lag. Eso mata la sensación nativa.

**Patrón nativo real:**  
En apps operativas, al tocar una card hay **feedback inmediato (pressed state)** antes incluso de navegar. Ejemplos: leve oscurecimiento, scale muy sutil, ripple (Android), highlight (iOS). No es animación decorativa; es **confirmación cognitiva**.

Referencias: _mobile app list item pressed state_, _ios tableview cell highlight_, _android list item ripple_.

**Regla práctica:** Si el dedo baja y no pasa nada en &lt; 100 ms → se siente web.

#### 7.14.2. Transición lista → detalle

**Error típico:** Corte seco entre pantallas. Se siente brusco, web-like, descontextualizado.

**Patrón nativo dominante:** Transición vertical / jerárquica: “entro dentro del pedido”, no “salto a otra web”. Muy común: slide in, push navigation, continuidad visual.

Referencias: _ios push navigation animation_, _android activity transition_, _mobile app detail transition_.

No hace falta animar mucho; hace falta **continuidad**.

#### 7.14.3. Estados de carga (muy importante)

**Qué suele haber ahora (típico):** Spinner genérico o nada hasta que carga. Ambas opciones se sienten web.

**Patrón nativo real:** En listas: **skeletons**, placeholders de cards, shimmer suave. Comunica: “esto va a ser una lista, estoy cargando”.

Referencias: _mobile app skeleton list_, _skeleton loading mobile_, _enterprise app loading state_.

**Regla de oro:** Nunca mostrar “pantalla en blanco + spinner” si ya se sabe qué forma tendrá el contenido.

#### 7.14.4. Scroll y continuidad

En apps nativas el scroll es parte de la experiencia; se siente con inercia. No controlarlo en exceso. Evitar: paginaciones raras, botones “ver más” prominentes. Si hay carga incremental, debe ser **invisible**.

Referencias: _infinite scroll mobile app_, _mobile list loading more_.

#### 7.14.5. Estado vacío (poco usado, muy importante)

Ej.: “No hay pedidos en este estado”, “No se encontraron resultados”.  
En web suele ser texto frío. En app profesional: **mensaje corto + acción clara**, sin ilustraciones consumer. Ejemplo mental correcto: “No hay pedidos en producción ahora” + “Cambiar filtros”.

Referencias: _enterprise app empty state_, _mobile app no results state_.

#### 7.14.6. Feedback de filtros aplicados

Cuando el usuario aplica filtros y vuelve a la lista, debe percibir **que algo cambió** y **por qué ve menos/más ítems**. Patrones: pequeño texto contextual, chip discreto, micro feedback visual. No hace falta banner grande.

Referencias: _mobile app applied filters feedback_, _filter chip mobile list_.

---

### 7.15. Qué no hacer (micro-interacciones y listado)

Para apps operativas:

- ❌ Animaciones largas
- ❌ Delays artificiales
- ❌ Efectos “bonitos” sin función
- ❌ Gestos ocultos sin pista

Todo debe ser: **predecible**, **rápido**, **confiable**.

---

### 7.16. Checklist final del listado (cierre)

Cuando todo esté aplicado, el listado debería cumplir:

**Modelo mental**

- ✅ “Esto es mi trabajo”
- ✅ Entro y toco sin pensar

**UI**

- ✅ Header limpio
- ✅ Lista protagonista
- ✅ Cards claras

**Interacción**

- ✅ Tap responde instantáneo
- ✅ Navegación fluida
- ✅ Feedback siempre presente

Si todo eso pasa → **el listado ya se siente app nativa profesional**.

---

## 8️⃣ Líneas de mejora propuestas (a partir del análisis)

Sin entrar todavía en wireframes, se pueden extraer estas líneas claras (overview + lista):

- **Reducir el número de secciones “primarias” visibles en el overview**
  - Destacar 1–2 secciones clave.
  - Relegar otras a niveles más profundos o agruparlas.

- **Separar claramente “estado del pedido” de “menú de secciones”**
  - Bloque superior: contexto + KPIs + estado.
  - Bloque inferior: navegación interna a secciones.

- **Introducir jerarquía temporal (antes / durante / después)**
  - Orden y agrupación de secciones.
  - Estados o indicadores que muestren progreso.

- **Dar más peso visual a las acciones frecuentes en mobile**
  - Botones flotantes, barras de acciones, CTAs claros.
  - Menos peso para acciones raras / avanzadas.

- **Enriquecer los accesos a secciones con información contextual**
  - Ej.: “Palets (3 preparados)”, “Producción (en curso)”, “Etiquetas (pendiente)”.

Estas mejoras deberían aplicarse **sin romper desktop**, utilizando:

- las tipologías definidas en `02-TIPOLOGIAS-PANTALLAS-ENTIDADES-VS-GESTORES.md`,
- y los pilares de `01-PILARES-UI-NATIVA-MOBILE.md`.
