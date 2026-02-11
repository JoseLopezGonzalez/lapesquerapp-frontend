# Plan: Dashboard Operario (Panel de Control)

Objetivo: crear un apartado **dashboard** para el rol **operario**, con la misma estructura y funcionalidad que la versión antigua de la web app (referencia en imagen “Panel de Control”), usando la **UI shadcn** actual del proyecto.

---

## 1. Análisis de la referencia (versión antigua)

De la captura “Panel de Control” se extrae:

| Bloque | Contenido |
|--------|-----------|
| **Título** | “Panel de Control” |
| **Barra superior** | Tres datos: **Hora** (22:51:57), **Fecha** (11/2/2026), **Día** (Miércoles). Dos botones: **Impresión Etiquetas** (verde), **Herramientas Calculadora** (morado). |
| **Columna izquierda** | **Recepciones de Materia Prima** – subtítulo “Lista de recepciones”, botón **Nueva Recepción +** (azul), tabla (N°, PROVEEDOR, ESPECIE, CANTIDAD, FECHA, acción imprimir), paginación (“X resultados” + anterior/siguiente). |
| **Columna derecha** | **Salidas de cebo** – subtítulo “Lista de salidas”, botón **Nueva Salida +** (naranja), tabla (N°, PROVEEDOR, CANTIDAD, FECHA, acción imprimir), paginación. |

Colores de botones a respetar en shadcn: azul (Nueva Recepción), naranja (Nueva Salida), verde (Impresión Etiquetas), morado (Herramientas Calculadora).

---

## 2. Contexto actual del proyecto

### 2.1 Rol operario

- **Login**: operario con `assignedStoreId` → redirección a `/warehouse/{assignedStoreId}`.
- **Rutas**: solo puede usar `/warehouse/:path*` (y según `roleConfig`, también `/production`). No puede “quedarse” en `/admin` (middleware redirige a su warehouse).
- **Página actual warehouse**: `src/app/warehouse/[storeId]/page.js` renderiza `WarehouseOperatorLayout` + componente `Store` (mapa/posiciones del almacén). No hay hoy un “panel de control” tipo dashboard.

### 2.2 Servicios y API

- **Recepciones**: `rawMaterialReceptionService.list(filters, { page, perPage })` → `GET /api/v2/raw-material-receptions` (paginado; filtros: dates, suppliers, species, products, notes, etc.).
- **Salidas de cebo**: `ceboDispatchService.list(filters, { page, perPage })` → `GET /api/v2/cebo-dispatches` (paginado; filtros análogos).
- Crear: `rawMaterialReceptionService.create(data)`, `ceboDispatchService.create(data)`.
- No hay en el código referencia a “Herramientas Calculadora”; “Impresión Etiquetas” en admin apunta a `/admin/label-editor`, ruta a la que el operario no tiene acceso.

### 2.3 UI y componentes

- **Layout operario**: `WarehouseOperatorLayout` (header con logo, nombre almacén, usuario + dropdown).
- **Shadcn**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Table`, `Button`, `Pagination`, etc. en `src/components/ui/`.
- **Admin**: listados de recepciones vía `EntityClient` + `entitiesConfig['raw-material-receptions']`; creación en `/admin/raw-material-receptions/create` con `CreateReceptionForm`. Cebo-dispatches tiene config en `entitiesConfig['cebo-dispatches']` pero con `hideCreateButton: true` y sin ruta dedicada en el menú comentada.

### 2.4 Almacén (storeId)

- El operario está atado a un único `assignedStoreId`. El dashboard debe filtrar (o al menos mostrarse en contexto) por ese almacén si el backend lo soporta (ver endpoints abajo).

---

## 3. Decisiones de producto (cerradas)

1. **Ubicación del dashboard**: El dashboard es la **primera página (home)** para el rol operario en `/warehouse/[storeId]`. Para el resto de roles (administrador, tecnico) se mantiene la vista existente (Store/mapa).

2. **Impresión Etiquetas y Herramientas Calculadora**: Ambos botones se dejan **sin función** por ahora (deshabilitados en la UI).

3. **Impresión por fila (icono impresora)**: No hay endpoint; el botón de imprimir en cada fila queda **inactivo** por ahora.

4. **Filtros**: No se agregan filtros en los listados del dashboard.

5. **Columna ESPECIE en recepciones**: Sí; se muestra la columna ESPECIE (se usa `species?.name` si la API lo devuelve).

---

## 3.1 Implementación realizada

- **`OperarioDashboard`** (`src/components/Warehouse/OperarioDashboard/index.js`): Panel con título "Panel de Control", barra de hora/fecha/día en tiempo real, botones "Impresión Etiquetas" y "Herramientas Calculadora" deshabilitados, y dos columnas con las cards de listados.
- **`ReceptionsListCard`** (`src/components/Warehouse/ReceptionsListCard/index.js`): Card "Recepciones de Materia Prima" con tabla (N°, PROVEEDOR, ESPECIE, CANTIDAD, FECHA, imprimir inactivo), paginación y botón "Nueva Recepción +" que enlaza a `/warehouse/[storeId]/receptions/create`.
- **`DispatchesListCard`** (`src/components/Warehouse/DispatchesListCard/index.js`): Card "Salidas de cebo" con tabla (N°, PROVEEDOR, CANTIDAD, FECHA, imprimir inactivo), paginación y botón "Nueva Salida +" que enlaza a `/warehouse/[storeId]/dispatches/create`.
- **Página warehouse** (`src/app/warehouse/[storeId]/page.js`): Si el usuario es **operario** se renderiza `OperarioDashboard`; en caso contrario se mantiene el componente `Store` (mapa).
- **Ruta crear recepción** (`src/app/warehouse/[storeId]/receptions/create/page.js`): Reutiliza `CreateReceptionForm`; al guardar redirige a `/warehouse/[storeId]`.
- **Ruta crear salida** (`src/app/warehouse/[storeId]/dispatches/create/page.js`): Placeholder "Próximamente" con enlace para volver al panel.

---

## 4. Endpoints / backend

- **Listar recepciones**: ya cubierto por `GET /api/v2/raw-material-receptions` (paginación, filtros). Falta confirmar: si se debe filtrar por almacén y si la respuesta incluye `species` (o equivalente) por recepción para la columna ESPECIE.
- **Listar salidas de cebo**: ya cubierto por `GET /api/v2/cebo-dispatches`. Igual: confirmar filtro por almacén si aplica.
- **Crear recepción / crear salida**: ya existen `POST /api/v2/raw-material-receptions` y `POST /api/v2/cebo-dispatches`. No se requiere endpoint nuevo para el dashboard; sí definir si el formulario de creación en warehouse es el mismo que en admin o una versión simplificada.
- **Impresión por recepción/salida**: si existe un endpoint (p. ej. `GET .../raw-material-receptions/:id/print` o `.../cebo-dispatches/:id/pdf`), indícalo y se añadirá al plan de integración.

---

## 5. Plan de implementación (técnico)

### 5.1 Rutas y estructura

- **Opción A – Dashboard como vista principal del warehouse**  
  - En `src/app/warehouse/[storeId]/page.js`: mostrar primero el **Dashboard** (panel de control). Opción secundaria (pestaña o enlace) para ir al **Mapa** (componente `Store` actual).
- **Opción B – Dashboard en ruta propia**  
  - Crear `src/app/warehouse/[storeId]/dashboard/page.js` y, opcionalmente, hacer que la raíz `page.js` redirija a `dashboard` para el operario. En el layout o header del warehouse, enlace “Panel de Control” / “Mapa”.

Recomendación: **Opción A** con dos vistas (Dashboard + Mapa) y Dashboard por defecto, para no cambiar la URL actual del warehouse y mantener una sola “casa” del operario.

### 5.2 Componentes a crear/reutilizar

| Componente | Responsabilidad | Ubicación propuesta |
|------------|-----------------|----------------------|
| **OperarioDashboard** | Contenedor: barra superior (hora/fecha/día + botones) + dos columnas (recepciones | salidas). | `src/components/Warehouse/OperarioDashboard/index.js` (o `Dashboard/`) |
| **DashboardInfoBar** | Hora en tiempo real, fecha, día de la semana. | Dentro de OperarioDashboard o `Warehouse/DashboardInfoBar` |
| **DashboardToolButtons** | Botones “Impresión Etiquetas” y “Herramientas Calculadora” (verde / morado con variantes de Button). | Dentro de OperarioDashboard o componente pequeño |
| **ReceptionsListCard** | Card con título “Recepciones de Materia Prima”, subtítulo, botón “Nueva Recepción +” (azul), tabla (N°, PROVEEDOR, ESPECIE, CANTIDAD, FECHA, imprimir), paginación. | `Warehouse/ReceptionsListCard` o similar |
| **DispatchesListCard** | Igual para “Salidas de cebo”: “Nueva Salida +” (naranja), columnas N°, PROVEEDOR, CANTIDAD, FECHA, imprimir, paginación. | `Warehouse/DispatchesListCard` |

Tablas con shadcn: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`. Paginación: componente `Pagination` existente + estado local `page`/`perPage` y llamadas a `rawMaterialReceptionService.list` / `ceboDispatchService.list`.

### 5.3 Flujos de datos

- **Recepciones**: `useState` + `useEffect` (o `useSWR`/similar si ya se usa en el proyecto) para cargar lista con `rawMaterialReceptionService.list({}, { page, perPage })`. Filtro por `storeId` si la API lo soporta (añadir a `filters`).
- **Salidas**: igual con `ceboDispatchService.list`.
- **Hora/fecha/día**: estado local actualizado por `setInterval` cada segundo (solo hora) o derivar de `new Date()` en cada render; formato de fecha/día según locale (es-ES: “Miércoles”, “11/2/2026”).

### 5.4 Navegación y permisos

- Si el dashboard es la vista principal en `/warehouse/[storeId]`: en el `WarehouseOperatorLayout` (o dentro del contenido) añadir un switcher o tabs: “Panel de Control” | “Mapa del almacén”. Solo operario (y admin/tecnico si aplica) ve el dashboard; la comprobación de `storeId === assignedStoreId` para operario ya está en la página warehouse.
- No tocar redirección de operario desde `/admin`; el dashboard vive solo bajo `/warehouse`.

### 5.5 Creación de recepción y salida desde el dashboard

- **Nueva Recepción**: enlace o botón que lleve a una página de creación en contexto warehouse, por ejemplo `/warehouse/[storeId]/receptions/create`. Reutilizar `CreateReceptionForm` (o una variante simplificada) dentro de un layout warehouse; al guardar, redirigir al dashboard o mostrar éxito y refrescar lista.
- **Nueva Salida**: igual con `/warehouse/[storeId]/dispatches/create` y el formulario de creación de cebo (si existe componente en admin, extraer o reutilizar; en `entitiesConfig` está deshabilitado el botón crear, pero el servicio `ceboDispatchService.create` existe).

Si se prefiere no crear rutas nuevas, se puede abrir un **Dialog/Sheet** con el formulario de creación encima del dashboard y al cerrar refrescar listas.

### 5.6 Estilos y accesibilidad

- Usar **Card** para cada bloque (barra de info, cada tabla).
- Botones con variantes de shadcn (p. ej. `variant="default"` para azul, clases Tailwind para naranja/verde/morado si hace falta).
- Mantener contraste y focus visible (Radix/shadcn ya lo cubren).
- Responsive: en móvil las dos columnas pueden apilarse (grid o flex wrap).

### 5.7 Orden sugerido de tareas

1. Decidir ubicación (dashboard como principal vs ruta `/dashboard`) y respuestas a las preguntas de la sección 3.
2. Crear `OperarioDashboard` con barra superior (hora, fecha, día) y dos cards de listas “mock” (datos estáticos) para fijar estructura y UI shadcn.
3. Integrar `rawMaterialReceptionService.list` y `ceboDispatchService.list` con paginación en cada card.
4. Añadir botones “Nueva Recepción +” y “Nueva Salida +” (navegación a ruta o diálogo con formulario).
5. Implementar acción “imprimir” por fila cuando se defina el endpoint o flujo (o dejar icono deshabilitado con tooltip).
6. Conectar “Impresión Etiquetas” y “Herramientas Calculadora” según decisiones de producto.
7. Ajustar `WarehouseOperatorLayout` y página `warehouse/[storeId]` para mostrar dashboard por defecto y opción de ir al mapa.
8. (Opcional) Filtro por `storeId` en listados cuando el backend lo exponga.

---

## 6. Resumen de lo que necesito de ti

- Respuestas a las **preguntas de la sección 3** (ubicación, impresión etiquetas, calculadora, impresión por fila, filtro almacén, columna especie).
- Confirmación o detalle de **endpoints** de impresión por recepción/salida (si existen).
- Confirmación de si el **listado de recepciones** devuelve ya `species` (o cómo mostrar ESPECIE) y si los listados deben filtrar por **almacén**.

Con eso se puede bajar este plan a tareas concretas (commits/PRs) y ajustar servicios o backend si hace falta.
