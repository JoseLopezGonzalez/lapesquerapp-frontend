# GAP-010 — Field App: reemplazar `<Loader>` de datos por Skeleton

## Metadata

- **Tipo:** Bug
- **Módulo:** Field (repartidores)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — findings A1-B1, A2-B1, A3-B1, A4-B1, A4-B2, A5-B1

---

## Contexto y problema

El componente `<Loader>` (Loader2 + texto "Cargando" a pantalla completa) está reservado exclusivamente para gates de sesión/autenticación. Sin embargo, se usa erróneamente como estado de carga de datos en 5 vistas del Field App, lo que produce una experiencia de pantalla en blanco que no comunica la estructura de la UI al usuario.

El patrón correcto es: **mientras la sesión carga → `<Loader>` está bien. Una vez la sesión está lista y los datos cargan → `Skeleton` con la forma del contenido real.**

Archivos afectados y problema específico:

1. **`FieldDashboard.jsx`** — `if (loadingRoutes || loadingOrders) return <Loader />;` — datos de rutas y pedidos
2. **`FieldRoutesListPage.jsx`** — `if (isLoading) return <Loader />;` — lista de rutas
3. **`FieldRouteExecutionPage.jsx`** — `if (isLoading) return <Loader />;` — carga del detalle de ruta
4. **`FieldOrdersPage.jsx`** — `if (isLoading) return <Loader />;` — lista de pedidos
5. **`FieldOrdersPage.jsx`** (Dialog de impresión) — `<Loader />` dentro del Dialog mientras genera el PDF
6. **`FieldOrderExecutionPage.jsx`** — `if (isLoading) return <Loader />;` — carga del detalle de pedido

---

## Solución acordada

Reemplazar cada `<Loader>` de datos por un `Skeleton` que reproduzca la forma del contenido real:

### FieldDashboard.jsx
Skeleton con 2–3 tarjetas de estadísticas (rectangulares, misma altura que las reales) + 3 `FieldRouteCard` skeleton debajo. Usar `Skeleton` de shadcn.

### FieldRoutesListPage.jsx
4 `FieldRouteCard` skeleton (misma altura que las tarjetas reales).

### FieldRouteExecutionPage.jsx
- Header skeleton: dos líneas (`Skeleton` para nombre de ruta + `Skeleton` más pequeño para fecha/stops)
- Área del mapa: `div bg-muted` con `Loader2 className="animate-spin text-muted-foreground"` centrado internamente — sin texto "Cargando". No es un `<Loader>` full-screen, es un placeholder contenido.

### FieldOrdersPage.jsx (lista)
4 `FieldOrderCard` skeleton (misma altura que las tarjetas reales).

### FieldOrdersPage.jsx (Dialog de impresión)
Reemplazar `<Loader />` dentro del Dialog por `Loader2` centrado con `className="animate-spin"` — el Dialog ya es un contenedor, no necesita full-screen.

### FieldOrderExecutionPage.jsx
Skeleton con header (nombre cliente, número pedido) + área de contenido del paso activo.

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — `MobileStoreListSkeleton` muestra el patrón correcto de Skeleton para listas mobile
- **Tipo de layout:** Skeleton inline — reemplaza el return del componente durante carga, mismo layout que el contenido
- **Componentes clave:** `Skeleton` de `@/components/ui/skeleton`, `Loader2` de `lucide-react` (solo para el mapa)
- **Estados requeridos:** loading (Skeleton) / data loaded (vista normal) — los estados error y empty ya existen en cada vista
- **Mobile:** aplica ahora — todos los archivos son vistas mobile-only

---

## Referencias

- `MobileStoreListSkeleton` en `MobileStoreListView.tsx` — patrón de referencia
- `design-context.md` — sección "Loading States": Skeleton obligatorio para datos, Loader solo para auth
- `FieldLayoutClient.jsx` — uso correcto de `<Loader>` para `status === 'loading'` (sesión)

---

## Criterios de aceptación

- [ ] `FieldDashboard.jsx` no usa `<Loader>` para `loadingRoutes || loadingOrders`; muestra Skeleton con forma de tarjetas durante la carga
- [ ] `FieldRoutesListPage.jsx` no usa `<Loader>` para datos; muestra 4 route card skeletons
- [ ] `FieldRouteExecutionPage.jsx` no usa `<Loader>` para datos; muestra header skeleton + área de mapa con placeholder bg-muted y Loader2 interno (no full-screen)
- [ ] `FieldOrdersPage.jsx` no usa `<Loader>` para la lista; muestra 4 order card skeletons
- [ ] Dialog de impresión en `FieldOrdersPage.jsx` usa `Loader2` contenido, no `<Loader>` full-screen
- [ ] `FieldOrderExecutionPage.jsx` no usa `<Loader>` para datos; muestra Skeleton de header + contenido
- [ ] Ningún Skeleton importa ni renderiza el componente `Loader` de `@/components/Utilities/Loader`
- [ ] Los skeletons tienen la misma altura y estructura aproximada que el contenido real (evitar flash de layout)
- [ ] `<Loader>` sigue usándose correctamente en `FieldLayoutClient.jsx` (gate de sesión) — no tocarlo

---

## Archivos a crear o modificar

- `src/components/Field/FieldDashboard.jsx` — reemplazar Loader + añadir DashboardSkeleton local
- `src/components/Field/FieldRoutesListPage.jsx` — reemplazar Loader + añadir RouteListSkeleton local
- `src/components/Field/FieldRouteExecutionPage.jsx` — reemplazar Loader + añadir RouteExecutionSkeleton local
- `src/components/Field/FieldOrdersPage.jsx` — reemplazar Loader (lista + dialog) + añadir OrderListSkeleton local
- `src/components/Field/FieldOrderExecutionPage.jsx` — reemplazar Loader + añadir OrderExecutionSkeleton local

---

## Restricciones

- NO tocar `FieldLayoutClient.jsx` — su uso de `<Loader>` es correcto (gate de sesión)
- NO tocar la lógica de datos, hooks ni servicios — solo el estado de loading de UI
- NO modificar el componente `Loader` en `src/components/Utilities/Loader/`
- Cada Skeleton se define como sub-componente local en el mismo archivo (no crear archivo separado)
- Los archivos son `.jsx` legacy — si se migran a `.tsx` hacerlo en el mismo commit

---

## Implementación

### Archivos creados

Ninguno — los skeletons son sub-componentes locales en cada archivo.

### Archivos modificados

- `src/components/Field/FieldDashboard.jsx` — `Loader` → `FieldDashboardSkeleton` (3 card skeletons con header + content)
- `src/components/Field/FieldRoutesListPage.jsx` — `Loader` → `FieldRoutesListSkeleton` (3 route card skeletons)
- `src/components/Field/FieldRouteExecutionPage.jsx` — `Loader` → `FieldRouteExecutionSkeleton` (header skeleton + mapa con Loader2 interno)
- `src/components/Field/FieldOrdersPage.jsx` — `Loader` → `FieldOrdersListSkeleton` (4 order card skeletons); Dialog print: `Loader` → `Loader2` contenido
- `src/components/Field/FieldOrderExecutionPage.jsx` — `Loader` → `FieldOrderExecutionSkeleton` (stepper + content + footer buttons skeleton)

### Decisiones tomadas durante la implementación

- `FieldRouteExecutionPage`: el área del mapa usa `bg-muted + Loader2` en lugar de un Skeleton plano, ya que el mapa tiene su propio ciclo de carga interno (confirmado en Q1 respuesta b)
- Los 5 archivos son `.jsx` legacy — no se han migrado a `.tsx` porque el GAP no lo requiere explícitamente; cada skeleton importa solo lo necesario

### Desviaciones del plan

Ninguna.

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
