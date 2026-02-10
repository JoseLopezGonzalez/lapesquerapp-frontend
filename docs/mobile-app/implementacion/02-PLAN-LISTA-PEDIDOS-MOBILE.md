# Plan de implementación: Pantalla principal del Gestor de Pedidos (mobile)

> Plan de trabajo para aplicar las mejoras descritas en el análisis del gestor de pedidos, **solo en la pantalla de lista de pedidos** y **solo en versión mobile** (< 768px).

**Documento de referencia:** [01-ANALISIS-GESTOR-PEDIDOS-MOBILE.md](../analisis/01-ANALISIS-GESTOR-PEDIDOS-MOBILE.md)  
**Estándares:** [01-PILARES-UI-NATIVA-MOBILE.md](../estandares-ui/01-PILARES-UI-NATIVA-MOBILE.md), [02-TIPOLOGIAS-PANTALLAS-ENTIDADES-VS-GESTORES.md](../estandares-ui/02-TIPOLOGIAS-PANTALLAS-ENTIDADES-VS-GESTORES.md)

---

## 1. Objetivo y alcance

### Objetivo

Transformar la pantalla de **lista de pedidos** en mobile de “listado web con filtros” a **cola de trabajo operativa**: que el usuario vea pedidos pronto, toque uno y trabaje, sin distraerse con búsqueda, filtros y exportar antes de tiempo.

### Alcance

| Incluido | No incluido |
|----------|-------------|
| Pantalla lista de pedidos en mobile (`OrdersList` cuando `isMobile`) | Pantalla overview/detalle del pedido (`Order`) |
| Header, búsqueda, filtros, acciones secundarias, cards | Otras pantallas del gestor |
| Componentes `OrdersList`, `OrderCard` (variantes mobile) | Cambios en desktop (se mantiene comportamiento actual) |

### Principios

- **No romper desktop:** todos los cambios deben estar condicionados a `isMobile` (o clases `md:`). La versión desktop de la lista no cambia.
- **No tocar la base sólida:** modelo lista → overview → sección → acción, ShadCN, sheets para edición, limpieza visual general.
- **Cola de trabajo:** modelo mental = “Estos son los pedidos que tengo que gestionar ahora”. Jerarquía: estado → cliente → fecha → entrar a trabajar.

---

## 2. Criterios de éxito (cuándo dar por bien hecho)

Según el análisis (secciones 7.9 y 7.16):

- La pantalla se **entiende sin leer**.
- El **pulgar va solo** a un pedido.
- No hace falta **“pensar” antes de tocar**.

Flujo objetivo:

**Abrir la app → tocar un pedido → trabajar**

sin pararse arriba (búsqueda, filtros, exportar).

**Checklist final (análisis 7.16):** Modelo mental = “Esto es mi trabajo”; UI = header limpio, lista protagonista, cards claras; Interacción = tap responde instantáneo, navegación fluida, feedback siempre presente.

---

## 3. Estado actual (resumen)

### Componentes implicados

| Archivo | Rol |
|---------|-----|
| `src/components/Admin/OrdersManager/OrdersList/index.js` | Lista: header, búsqueda, filtros (tabs), acciones, scroll de cards |
| `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.js` | Card de un pedido (estado, ID, cliente, fecha) |
| `src/components/Admin/OrdersManager/index.js` | Contenedor: estado (categories, searchText, orders), pasa props a OrdersList |

### Qué hay hoy en mobile (OrdersList)

- **Header:** Back + título “Pedidos Activos” centrado + espacio balance.
- **Debajo del header:** Input búsqueda ancho + botón Vista producción + botón Crear (los tres en la misma fila).
- **Filtros:** Tabs horizontales (Todos / En producción / Terminados) + botón “Exportar” en la misma barra de tabs.
- **Lista:** Cards (`OrderCard`) en `ScrollArea`.

### Problemas a resolver (del análisis)

1. **Demasiadas cosas antes de la lista:** búsqueda, vista, crear, filtros, exportar compiten; la lista no es protagonista.
2. **Acciones del mismo peso:** buscar, filtrar, exportar, crear se ven igual; en nativo lo frecuente destaca, lo raro va a overflow.
3. **Filtros como tabs:** ocupan espacio y parecen navegación principal; deberían ser “estado activo” (chip/indicador), no pestañas.
4. **Cards sin intención táctil:** bien de contenido, pero sin chevron, sin feedback claro al tap, estado como badge suelto.
5. **Sin contexto global:** no se responde “¿cuántos?”, “¿qué estado domina?” (opcional en una primera iteración).

---

## 4. Fases del plan

Las fases siguen los micro-pasos sugeridos en el análisis (7.10): **A** Header + filtros, **B** Cards, **C** Sheet de búsqueda/filtros. Se recomienda **A → C → B** para que el flujo “lista protagonista” y “acciones secundarias en sheet” quede primero; luego se afina la card.

---

### Fase 1: Header simple (solo mobile)

**Objetivo:** En mobile, el header solo muestra **Título + Back + 1 acción primaria (Crear)**. Nada más en la barra.

**Tareas:**

| # | Tarea | Detalle |
|---|--------|--------|
| 1.1 | Dejar en header mobile solo: Back, “Pedidos Activos”, Crear | Quitar del header la fila de búsqueda + Vista producción + Crear. Crear pasa a ser el único botón de acción en el header (p. ej. icono + en el mismo bloque que el título). |
| 1.2 | Añadir icono “Más” (overflow) en header mobile | Botón que abrirá el sheet de búsqueda y filtros (Fase 3). Por ahora puede ser un placeholder o abrir un menú mínimo (solo “Exportar”, “Vista producción”). |
| 1.3 | Reducir espacio entre header y lista | Menos padding/márgenes entre el bloque del header y el primer elemento de la lista para que los pedidos aparezcan antes. |

**Archivos:** `OrdersList/index.js` (bloque `isMobile` del header y zona siguiente).

**Criterio de aceptación:** En mobile, arriba solo se ve: [Back] [Pedidos Activos] [Crear] [Overflow]. No hay input de búsqueda ni tabs en esa zona.

---

### Fase 2: Filtros como “estado activo” (no tabs)

**Objetivo:** En mobile, los filtros de estado no son una barra de tabs que compite con la lista. Son un **indicador de estado activo** (ej. un solo chip o línea breve: “Viendo: En producción”) con posibilidad de cambiar desde el sheet (Fase 3).

**Tareas:**

| # | Tarea | Detalle |
|---|--------|--------|
| 2.1 | Sustituir tabs por indicador de filtro activo (mobile) | Una línea o chip que diga “Todos” / “En producción” / “Terminados” según `activeTab`, con touch target ≥ 44px que abra el sheet de filtros (o, en una versión mínima, un pequeño dropdown/sheet solo de estado). |
| 2.2 | Mantener filtros por estado en desktop | En desktop no cambiar: seguir con `TabsList` + `TabsTrigger` como ahora. |
| 2.3 | Opcional: contador junto al indicador | Ej. “En producción (3)” para dar contexto global sin ocupar mucho. |

**Archivos:** `OrdersList/index.js` (render condicional `isMobile` para la zona de filtros).

**Criterio de aceptación:** En mobile no hay barra de tabs horizontal. Hay un único indicador claro de “qué estoy viendo” y al tocarlo se puede cambiar (sheet o control ligero).

---

### Fase 3: Sheet de búsqueda y filtros (mobile)

**Objetivo:** Búsqueda y filtros viven en un **bottom sheet** que se abre desde el header (icono de búsqueda o del overflow). Así la lista es protagonista y las herramientas no compiten.

**Tareas:**

| # | Tarea | Detalle |
|---|--------|--------|
| 3.1 | Crear componente `OrdersListFiltersSheet` (o nombre similar) | Sheet (`side="bottom"`) que contenga: (1) Input de búsqueda, (2) Filtros por estado (Todos / En producción / Terminados), (3) Opcional: “Vista producción”, “Exportar”. Usar ShadCN `Sheet`. |
| 3.2 | Abrir sheet desde header mobile | Desde el icono “Más” (o icono de búsqueda) en el header, abrir el sheet. Estado `open` en `OrdersList` o en padre que pase callback. |
| 3.3 | Conectar búsqueda y categoría con el estado existente | El sheet debe usar los mismos `searchText`, `categories`, `onChangeSearch`, `onClickCategory` que ya usa la lista. Al cambiar algo en el sheet, se actualiza la lista y se puede cerrar el sheet (o dejar abierto según preferencia). |
| 3.4 | Cerrar sheet al aplicar (opcional) | Al elegir un filtro o al “buscar”, cerrar el sheet para volver a la lista. |
| 3.5 | Acciones secundarias en el sheet | Mover “Exportar” y “Vista de Producción” dentro del sheet en mobile; en desktop se mantienen en la barra superior. |

**Archivos:** Nuevo componente (p. ej. `OrdersList/OrdersListFiltersSheet.jsx` o en la misma carpeta), `OrdersList/index.js` (estado open/close, botón que abre).

**Criterio de aceptación:** En mobile, búsqueda y cambio de estado se hacen dentro de un sheet. La lista no muestra input ni tabs; el header tiene solo Back, Título, Crear, Overflow (que abre el sheet).

**Alineado con análisis 7.12:** Mismo sheet para búsqueda y filtros; orden interno: búsqueda → estado; CTA primario “Listo”/“Aplicar” para cerrar; secundario “Limpiar filtros”; cierre claro (X). Checklist 7.12: ⛔ no search visible por defecto, ⛔ no tabs persistentes, ✅ sheet desde header, ✅ CTA aplicar, ✅ estado discreto al volver.

---

### Fase 4: Cards como unidades operativas (mobile)

**Objetivo:** Las cards se sienten **táctiles** y **operativas**: estado integrado en la card, jerarquía cliente > fecha > ID, y feedback al tocar.

**Tareas:**

| # | Tarea | Detalle |
|---|--------|--------|
| 4.1 | Estado más integrado en la card (mobile) | En mobile, no solo un badge suelto: usar el **borde izquierdo** (ya existe) como señal de estado y/o un pequeño indicador de estado integrado en el título (ej. “En producción · Cliente”). Evitar que el estado parezca un “chip flotante” desconectado. |
| 4.2 | Jerarquía visual explícita: Cliente > Fecha > ID | En mobile: **Cliente** como título principal (más tamaño/peso). Fecha de carga como secundaria. **ID** más pequeño y menos prominente (ej. “#02424” en texto menor, arriba o abajo). Revisar orden y tamaños en `OrderCard` para variante mobile. |
| 4.3 | Pistas de navegación | Añadir chevron (>) a la derecha de la card en mobile, o layout que sugiera “entrar”. Mantener card completa clickable. |
| 4.4 | Feedback táctil | Refinar `active:scale-[0.98]` y/o sombra al tap; asegurar que el área de toque sea cómoda (ya hay `min-h-[130px]`). Respetar pilares: touch target, feedback inmediato. |
| 4.5 | No romper desktop | Cambios solo cuando `isMobile` en `OrderCard` (o clases responsive). Desktop mantiene la card actual. |

**Archivos:** `OrdersList/OrderCard/index.js` (variantes mobile con `useIsMobile()` o clases `md:`).

**Criterio de aceptación:** En mobile, la card muestra cliente como protagonista, ID discreto, estado integrado (borde + contexto), chevron o equivalente, y feedback visual al tocar.

**Alineado con análisis 7.13:** Jerarquía 1) Cliente, 2) Estado (sin leer – borde/color), 3) Fecha, 4) ID; estado no solo texto; más aire entre cards. Checklist 7.13: ⛔ estado no solo texto, ⛔ ID no lo más grande, ✅ cliente protagonista, ✅ card tocable, ✅ lista escaneable.

**Micro-interacciones (análisis 7.14):** Tap en card debe dar feedback &lt;100 ms (pressed state: scale, sombra, opcional bg); no animaciones largas ni decorativas (7.15).

---

### Fase 5 (opcional): Contexto global mínimo

**Objetivo:** Dar sensación de “estado global” sin métricas complejas: p. ej. “3 pedidos” o “En producción · 3” cerca del indicador de filtro.

**Tareas:**

| # | Tarea | Detalle |
|---|--------|--------|
| 5.1 | Mostrar contador de resultados en mobile | Cerca del indicador de filtro (Fase 2) o en la primera línea bajo el header: “3 pedidos” / “N pedidos encontrados”. Reutilizar `orders.length` y el texto que ya existe en desktop. |
| 5.2 | Opcional: mensaje “al día” / “retrasado” | Solo si hay datos en el backend (ej. pedidos con fecha de carga hoy vs atrasados). Si no hay API, posponer. |

**Archivos:** `OrdersList/index.js` (una línea de texto condicional en mobile).

**Criterio de aceptación:** El usuario ve de un vistazo cuántos pedidos está viendo en la vista actual.

---

### Fase 6: Sheet — CTAs explícitos (análisis 7.12)

**Objetivo:** El sheet debe tener CTA primario (“Listo” / “Aplicar”) para cerrar y acción secundaria “Limpiar filtros” (borra búsqueda + pone “Todos”). Cierre claro (X). Así se cumple el patrón nativo de “aplicar y volver”.

**Tareas:** Añadir en el footer del sheet: botón primario “Listo” (cierra), botón secundario “Limpiar filtros” (onChangeSearch(''), onClickCategory('all'), cierra). No cerrar obligatoriamente al elegir un filtro (opcional: el usuario puede combinar búsqueda + filtro y luego “Listo”).

---

### Fase 7: Estado vacío y micro-interacciones (análisis 7.14)

**Objetivo:** Cuando no hay resultados por búsqueda/filtro, ofrecer acción clara “Cambiar filtros” que abre el sheet. Refinar feedback al tap en card (pressed state visible, &lt;100 ms).

**Tareas:** En empty state mobile, si hay búsqueda o filtro activo (no “Todos”), mostrar botón “Cambiar filtros” que abre el sheet. En OrderCard (mobile), asegurar pressed state muy visible (p. ej. active:bg-muted/50 o similar). Opcional: más separación entre cards (gap-4).

---

## 5. Orden de implementación recomendado

1. **Fase 1** (Header simple) – Reduce ruido y establece el patrón “solo título + crear + overflow”.
2. **Fase 3** (Sheet búsqueda/filtros) – Para que el botón overflow tenga contenido real y búsqueda/filtros salgan de la pantalla principal.
3. **Fase 2** (Filtros como estado) – Sustituir tabs por indicador que puede abrir el sheet o un selector ligero.
4. **Fase 4** (Cards operativas) – Afinar cards sin depender del header/sheet.
5. **Fase 5** (Contexto global) – Opcional cuando el resto esté estable.

Las fases 1, 2 y 3 se pueden considerar un mismo “bloque” (header + filtros + sheet); 4 es independiente; 5 es opcional.

---

## 6. Resumen de archivos afectados

| Archivo | Fases |
|---------|--------|
| `src/components/Admin/OrdersManager/OrdersList/index.js` | 1, 2, 3, 5, 7 (empty state) |
| `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.js` | 4, 7 (feedback tap, aire) |
| `OrdersListFiltersSheet.jsx` | 3, 6 (CTAs Listo / Limpiar) |

No se modifican: `OrdersManager/index.js` (salvo si se pasa alguna prop nueva al sheet), pantalla de detalle `Order`, ni lógica de datos (getActiveOrders, categories, search).

---

## 7. Checklist de validación final (mobile)

**Header (análisis 7.11):**
- [x] No más de 2 acciones visibles en header (Crear + Overflow).
- [x] No filtros persistentes ocupando altura.
- [x] Lista visible lo antes posible.
- [x] Acción primaria clara (Crear).
- [x] Búsqueda/filtros como acción secundaria (sheet).

**Sheet (análisis 7.12):**
- [x] No search input visible por defecto.
- [x] No tabs de estado persistentes.
- [x] Sheet se abre desde header.
- [x] CTA “Listo” y “Limpiar filtros” en el sheet.
- [x] Estado visible pero discreto al volver (indicador “Viendo: …”).

**Cards (análisis 7.13):**
- [x] Estado no depende solo de texto (borde + contexto).
- [x] ID no es lo más grande (cliente protagonista).
- [x] Card se siente tocable (chevron, feedback).
- [x] Lista se escanea rápido.

**Micro-interacciones (7.14–7.16):**
- [x] Tap en card responde al instante (pressed state).
- [x] Estado vacío: acción “Cambiar filtros” cuando hay filtro/búsqueda activa.
- [x] Desktop: sin cambios.

**Implementado:** Fases 1–7. Archivos: `OrdersList/index.js`, `OrdersList/OrdersListFiltersSheet.jsx`, `OrdersList/OrderCard/index.js`.

---

## 8. Referencias rápidas

- **Análisis completo:** [01-ANALISIS-GESTOR-PEDIDOS-MOBILE.md](../analisis/01-ANALISIS-GESTOR-PEDIDOS-MOBILE.md)  
  Secciones clave: 7 (lista), 7.1–7.10 (modelo mental, propuestas), **7.11** (header), **7.12** (búsqueda y filtros / sheet), **7.13** (cards), **7.14** (micro-interacciones), **7.15** (qué no hacer), **7.16** (checklist final).
- Pilares UI nativa: [01-PILARES-UI-NATIVA-MOBILE.md](../estandares-ui/01-PILARES-UI-NATIVA-MOBILE.md).
- Tipologías (gestor = drill-down, cola de trabajo): [02-TIPOLOGIAS-PANTALLAS-ENTIDADES-VS-GESTORES.md](../estandares-ui/02-TIPOLOGIAS-PANTALLAS-ENTIDADES-VS-GESTORES.md).
- Plan general y patrones (bottom sheet, breakpoint): [01-PLAN-GENERAL-ADAPTACION-MOBILE.md](../plan/01-PLAN-GENERAL-ADAPTACION-MOBILE.md).

---

*Documento vivo: actualizar al completar fases o al ajustar alcance.*
