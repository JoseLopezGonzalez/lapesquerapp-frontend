# Auditoría de Rendimiento — Frontend

**Fecha**: 2026-03-23
**Auditor**: Claude Sonnet 4.6 (análisis estático de código)
**Prompt rector**: `docs/audits/global-performance-audit-master-prompt.md`
**Entorno analizado**: código fuente local (sin acceso a runtime, sin DevTools, sin logs de producción)
**Rama**: `main`

---

## Limitaciones Declaradas

- **Sin runtime**: todos los hallazgos son inferidos del código. Deben validarse con DevTools (Network, Performance Profiler) antes de priorizar trabajo.
- **Sin backend**: no se pueden confirmar latencias de endpoints, planes de consulta ni índices de base de datos.
- **Sin sesión activa**: el comportamiento real del flujo auth/token no ha sido verificado en producción.
- **Código mixto JS/TS**: 743 archivos `.js/.jsx` sin tipos estrictos; algunas inferencias sobre formas de datos pueden ser imprecisas.

---

## 1. Resumen Ejecutivo

### Estado actual

La base técnica del frontend ha mejorado de forma real en la última iteración. Los módulos de datos más recientes (rutas, field ops) siguen patrones correctos de React Query: query keys normalizadas mediante factories, `enabled` guards adecuados, `setQueryData` para patch local en updates, deduplicación de promesas en el cliente de auth, y control de concurrencia en geocoding.

Los problemas encontrados son más de **consistencia** y **escala de componentes** que de defectos estructurales en la capa de datos.

### Cuellos de botella principales

1. **Query key inconsistente** en `useComercialOrders`: el único hook que no usa factory, expone la cache a fragmentación por referencia de objeto.
2. **`fieldOperatorId` ausente de las query keys** en hooks de field: si el operador cambia de contexto en la misma sesión, se servirán datos de caché incorrectos.
3. **Componentes monolíticos**: `RoutesPlannerPage` (1404 líneas), `AgendaPageClient` (700 líneas), `FieldRouteExecutionPage` (450 líneas). Son hotspots de rendimiento de render, mantenibilidad y coste de parsing JS.
4. **Key hardcodeada** en `autoventaMutation.onSuccess`: inconsistencia con el patrón factory del resto del módulo.
5. **`geocodeCache` sin TTL ni límite de tamaño**: puede crecer indefinidamente en sesiones largas.
6. **`console.error` en producción** dentro de `fetchWithTenant.js`: ruido de logs y posible exposición de datos de error.

### Top quick wins

- Añadir `fieldOperatorId` a `fieldOrderKeys` y `fieldRouteKeys` (o documentar que no puede cambiar en sesión).
- Migrar `useComercialOrders` a su propia key factory normalizada.
- Sustituir la key hardcodeada de `autoventaMutation.onSuccess` por la factory `fieldOrderKeys`.
- Eliminar/condicionizar el `console.error` de `fetchWithTenant.js`.
- Añadir un límite de tamaño (`MAX_GEOCODE_CACHE_SIZE`) al `geocodeCache` de módulo.

### Riesgos principales

- Modificar las query keys del módulo field afecta a todas las vistas que consumen esos hooks; requiere pruebas de regresión funcional.
- Partir `RoutesPlannerPage` es un cambio estructural de alto esfuerzo con riesgo de introducir bugs en el flujo de drag-drop y geocoding.

---

## 2. Mapa de Síntomas y Superficie Impactada

| Módulo                    | Flujo                                | Capa afectada               | Severidad |
| ------------------------- | ------------------------------------ | --------------------------- | --------- |
| CRM / Pedidos comerciales | Listado de órdenes                   | React Query — key           | Alto      |
| Field — Rutas y Pedidos   | Cualquier vista con operador         | React Query — key           | Alto      |
| Field — Autoventa         | Creación de autoventa                | React Query — invalidación  | Medio     |
| Comercial — Planificador  | RoutesPlannerPage completo           | Render / Componente         | Alto      |
| CRM — Agenda              | AgendaPageClient                     | Render / Componente         | Medio     |
| Field — Ejecución de ruta | FieldRouteExecutionPage              | Render / Componente         | Medio     |
| Transport                 | Todas las requests fallidas          | Auth / logs                 | Bajo      |
| Geocoding                 | Planificador de rutas (larga sesión) | Singleton de módulo         | Bajo      |
| Route Templates           | Actualización de plantilla           | React Query — normalización | Bajo      |

---

## 3. Tabla de Hallazgos Priorizados

| ID  | Severidad | Impacto | Esfuerzo | Riesgo | Área        | Hallazgo                                                                                     |
| --- | --------- | ------- | -------- | ------ | ----------- | -------------------------------------------------------------------------------------------- |
| P01 | Alto      | Alto    | Bajo     | Bajo   | React Query | `useComercialOrders`: query key con `params` sin normalizar                                  |
| P02 | Alto      | Alto    | Bajo     | Medio  | React Query | `fieldOperatorId` ausente de query keys en hooks de field                                    |
| P03 | Alto      | Medio   | Bajo     | Bajo   | React Query | `autoventaMutation`: invalidación con key hardcodeada                                        |
| P04 | Alto      | Medio   | Alto     | Alto   | Render      | `RoutesPlannerPage` monolítico (1404 líneas)                                                 |
| P05 | Medio     | Medio   | Medio    | Medio  | Render      | `AgendaPageClient` (700 líneas) y `FieldRouteExecutionPage` (450 líneas)                     |
| P06 | Medio     | Bajo    | Bajo     | Bajo   | Auth        | `console.error` hardcodeado en `fetchWithTenant.js` (producción)                             |
| P07 | Bajo      | Bajo    | Bajo     | Bajo   | Singleton   | `geocodeCache` de módulo sin TTL ni límite de tamaño                                         |
| P08 | Bajo      | Bajo    | Bajo     | Bajo   | React Query | `useRouteTemplateMutations`: `normalizeRouteCollection([x])[0]` vs `normalizeRouteEntity(x)` |

---

## 4. Desarrollo Detallado de Hallazgos

---

### P01 — `useComercialOrders`: query key con `params` sin normalizar

- **ID**: P01
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Listado de pedidos comerciales (`/comercial/pedidos` o equivalente)

**Síntoma**

Si el componente consumidor pasa `params` como un objeto literal (`{}`) o lo recrea en cada render, React Query genera una nueva entrada de caché por cada render aunque los valores sean idénticos. Esto produce refetches innecesarios y fragmenta la caché del listado.

**Evidencia**

`src/hooks/useComercialOrders.ts:16`

```ts
queryKey: ['crm', 'orders', 'list', tenantId ?? 'unknown', params],
```

El objeto `params` se incluye directamente en la key sin normalización. React Query serializa arrays y objetos para comparar keys, pero si la referencia del objeto es nueva en cada render (por ejemplo, `useComercialOrders({})` con un literal), se crea una nueva entrada de caché distinta aunque el contenido sea `{}`.

Contraste con el patrón correcto del proyecto:

`src/lib/routes/queryKeys.ts:16-17`

```ts
list: (tenantId, params = {}) =>
  ['routes', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
```

`normalizeQueryParams` filtra nulos, ordena claves y normaliza arrays, garantizando que `{ page: 1, status: 'active' }` y `{ status: 'active', page: 1 }` generen la misma key.

**Causa raíz**

`useComercialOrders` no usa una key factory como sí hacen todos los demás hooks de rutas y field. Quedó fuera del refactor de normalización.

**Impacto de negocio/UX**

- Refetches innecesarios al re-renderizar el componente padre.
- Entradas de caché duplicadas que aumentan el consumo de memoria del QueryClient.
- Invalidaciones posteriores pueden no alcanzar todas las variantes de la key si no se usa el mismo patrón.

**Cambio propuesto**

1. Crear una key factory `comercialOrderKeys` en `src/lib/routes/queryKeys.ts` (o en un archivo equivalente de CRM):

```ts
export const comercialOrderKeys = {
  all: (tenantId: string | null | undefined) => ['crm', 'orders', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: QueryParams = {}) =>
    ['crm', 'orders', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
};
```

2. Usar la factory en `useComercialOrders`:

```ts
queryKey: comercialOrderKeys.list(tenantId, params),
```

**Validación**

- Verificar en React Query DevTools que dos renders con `params = {}` producen la misma entrada de caché.
- Verificar que una invalidación con `comercialOrderKeys.all(tenantId)` alcanza todas las variantes de lista.

**Riesgos / trade-offs**

- Si algún componente invalida la key anterior manualmente con `['crm', 'orders', 'list', ...]`, la invalidación dejará de funcionar. Buscar todos los usos de la key con `grep -r "crm.*orders"`.

**Archivos o superficies afectadas**

- `src/hooks/useComercialOrders.ts`
- `src/lib/routes/queryKeys.ts` (nuevo factory)
- Cualquier componente que invalide la key manualmente.

---

### P02 — `fieldOperatorId` ausente de query keys en hooks de field

- **ID**: P02
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Medio
- **Área**: React Query
- **Flujo afectado**: Rutas de field (`/field/routes/*`), pedidos de field (`/field/orders/*`)

**Síntoma**

Si en algún escenario el `fieldOperatorId` cambia dentro de la misma sesión (cambio de operador sin cerrar sesión, superadmin que impersona a otro operador, pruebas con múltiples operadores), los hooks de field servirán datos de caché del operador anterior aunque `enabled` esté correctamente protegido.

**Evidencia**

`src/hooks/useFieldOrders.ts:25-33`

```ts
const query = useQuery({
  queryKey: fieldOrderKeys.list(tenantId, params),   // ← fieldOperatorId ausente
  queryFn: () => getFieldOrders(token as string, params),
  enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && enabled, // ← fieldOperatorId sí está en enabled
```

`src/hooks/useFieldRoutes.ts:24-28`

```ts
const query = useQuery({
  queryKey: fieldRouteKeys.list(tenantId, params),   // ← mismo problema
  queryFn: () => getFieldRoutes(token as string, params),
  enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId),
```

`src/lib/routes/queryKeys.ts:28-34` — las factories de `fieldRouteKeys` y `fieldOrderKeys` no incluyen `fieldOperatorId`:

```ts
export const fieldRouteKeys = {
  all: (tenantId) => ['field', 'routes', tenantId ?? 'unknown'] as const,
  list: (tenantId, params = {}) =>
    ['field', 'routes', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  detail: (tenantId, routeId) =>
    ['field', 'routes', 'detail', tenantId ?? 'unknown', routeId] as const,
};
```

**Causa raíz**

`fieldOperatorId` protege la ejecución de la query pero no forma parte del identificador de caché, violando el principio de que la key debe reflejar todas las variables que determinan el resultado de la query.

**Impacto de negocio/UX**

- En el escenario de cambio de operador sin logout, las rutas y pedidos mostrados podrían pertenecer al operador anterior.
- El problema es silencioso: no hay error, solo datos incorrectos.
- En el caso más común (un operador por sesión), el impacto es mínimo, pero el riesgo latente es alto para escenarios de soporte o superadmin.

**Cambio propuesto**

Opción A (recomendada si `fieldOperatorId` puede cambiar):

Añadir `fieldOperatorId` a las factories:

```ts
export const fieldRouteKeys = {
  all: (tenantId, fieldOperatorId?) =>
    ['field', 'routes', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown'] as const,
  list: (tenantId, fieldOperatorId?, params = {}) =>
    [
      'field',
      'routes',
      tenantId ?? 'unknown',
      fieldOperatorId ?? 'unknown',
      normalizeQueryParams(params),
    ] as const,
  detail: (tenantId, fieldOperatorId?, routeId?) =>
    [
      'field',
      'routes',
      'detail',
      tenantId ?? 'unknown',
      fieldOperatorId ?? 'unknown',
      routeId,
    ] as const,
};
```

Y actualizar todos los usos en `useFieldRoutes.ts`, `useFieldOrders.ts` y `useFieldRouteStopMutation`.

Opción B (si `fieldOperatorId` nunca cambia en sesión, documentarlo):

Añadir un comentario explícito en las factories y hooks:

```ts
// fieldOperatorId no incluido en la key porque no puede cambiar dentro de una sesión activa.
// Si esto cambia, actualizar las factories en queryKeys.ts.
```

**Validación**

- Simular cambio de `fieldOperatorId` en `FieldOperatorContext` y verificar que las queries se refetchen con la nueva key.
- Verificar que las invalidaciones en `useFieldOrderMutations.onSuccess` siguen alcanzando la caché correcta.

**Riesgos / trade-offs**

- Cambiar las factories afecta a TODOS los usos de `fieldRouteKeys` y `fieldOrderKeys` en el proyecto. Buscar con `grep -r "fieldRouteKeys\|fieldOrderKeys"`.
- Las invalidaciones existentes también deben actualizarse para pasar `fieldOperatorId`.
- Si se opta por la opción A, el coste es mayor pero la corrección es completa.

**Archivos o superficies afectadas**

- `src/lib/routes/queryKeys.ts`
- `src/hooks/useFieldRoutes.ts`
- `src/hooks/useFieldOrders.ts`
- Cualquier otro hook o componente que use estas factories directamente.

---

### P03 — `autoventaMutation.onSuccess`: invalidación con key hardcodeada

- **ID**: P03
- **Severidad**: Alto
- **Impacto**: Medio
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Creación de autoventa en field (`/field`)

**Síntoma**

La mutación de autoventa invalida la caché de opciones de clientes con una key hardcodeada. Si la key cambia en el futuro (por ejemplo, al añadir `fieldOperatorId` — ver P02), esta invalidación no se actualizará automáticamente y dejará de funcionar, causando que los clientes disponibles no se actualicen tras una autoventa.

**Evidencia**

`src/hooks/useFieldOrders.ts:73-77`

```ts
const autoventaMutation = useMutation({
  mutationFn: (payload) => createFieldAutoventa(token as string, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: fieldOrderKeys.list(tenantId) });
    queryClient.invalidateQueries({ queryKey: fieldRouteKeys.list(tenantId) });
    queryClient.invalidateQueries({
      queryKey: ['field', 'customers', 'options', tenantId ?? 'unknown'],
    });
    //                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                                          Key hardcodeada, no usa factory
  },
});
```

Contraste: las dos líneas anteriores sí usan factories (`fieldOrderKeys.list`, `fieldRouteKeys.list`).

**Causa raíz**

La key de opciones de clientes no tiene una factory exportada en `queryKeys.ts`, por lo que se hardcodeó directamente. Es un caso de deuda técnica menor pero que viola la consistencia del patrón.

**Cambio propuesto**

1. Añadir una factory en `src/lib/routes/queryKeys.ts` (o crear `src/lib/field/queryKeys.ts`):

```ts
export const fieldCustomerOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['field', 'customers', 'options', tenantId ?? 'unknown'] as const,
};
```

2. Usar la factory en `autoventaMutation.onSuccess`:

```ts
queryClient.invalidateQueries({ queryKey: fieldCustomerOptionKeys.list(tenantId) });
```

3. Verificar que el hook que carga estas opciones usa la misma factory.

**Validación**

- Buscar con `grep -r "field.*customers.*options"` todos los usos de esta key.
- Verificar que todos los consumidores y productores de esta key usan la factory.

**Riesgos / trade-offs**

- Ninguno significativo. Es un refactor de naming puro.

**Archivos o superficies afectadas**

- `src/hooks/useFieldOrders.ts:76`
- `src/lib/routes/queryKeys.ts` (nuevo factory)
- El hook que consume `['field', 'customers', 'options', ...]` (verificar cuál es).

---

### P04 — `RoutesPlannerPage` monolítico (1404 líneas)

- **ID**: P04
- **Severidad**: Alto
- **Impacto**: Medio
- **Esfuerzo de corrección**: Alto
- **Riesgo de cambio**: Alto
- **Área**: Render / Componente
- **Flujo afectado**: Planificador de rutas comerciales

**Síntoma**

El componente mezcla en un único árbol: formulario de metadatos de ruta, editor de paradas con drag-drop, geocoding async, cálculo de geometría de ruta, mapa Mapbox, gestión de plantillas, y al menos dos dialogs modales. Cualquier cambio de estado en cualquiera de estas responsabilidades re-renderiza el árbol completo.

**Evidencia**

`src/components/Comercial/Routes/RoutesPlannerPage.jsx` — 1404 líneas (confirmado por análisis del agente explorador).

Responsabilidades identificadas en el componente:

1. Estado de edición de ruta (nombre, fecha, operador, template).
2. Lista de paradas con drag-drop (`@dnd-kit`).
3. Geocoding con enriquecimiento de coordenadas (llama a `enrichStopsWithCoordinates`).
4. Cálculo de distancia/duración/coste.
5. Mapa Mapbox con marcadores de paradas.
6. Dialog de metadata editor.
7. Dialog de editor de parada individual.
8. Carga y aplicación de plantillas.
9. Serialización y llamada al servicio de guardado.

Un componente con 9 responsabilidades distintas garantiza:

- Re-renders costosos por estado no relacionado.
- Dificultad para aplicar `React.memo` o `useMemo` eficazmente.
- Tests prácticamente imposibles de escribir a nivel de unidad.
- Alta superficie de riesgo en cualquier cambio.

**Causa raíz**

Acumulación orgánica de features sin refactorización paralela. Es el hotspot más grande del módulo Comercial/CRM.

**Impacto de negocio/UX**

- Coste de parse/compile elevado al cargar la ruta (archivo JS grande).
- Re-renders innecesarios al interactuar con cualquier parte del formulario.
- Mantenibilidad muy baja: introducir cualquier nuevo feature requiere entender el estado completo del componente.

**Cambio propuesto**

Partición progresiva en componentes especializados con estado colocado cerca de quien lo consume:

1. `RoutePlannerMetadataForm` — nombre, fecha, operador, template.
2. `RoutePlannerStopList` — lista drag-drop con dnd-kit.
3. `RoutePlannerStopEditor` — dialog de edición de parada individual.
4. `RoutePlannerMap` — mapa Mapbox (ya puede existir parcialmente).
5. `RoutePlannerSummary` — distancia, duración, coste.
6. `useRoutePlannerState` — hook dedicado para el estado de edición de la ruta.

Cada componente recibe solo las props que necesita; el estado sube al nivel mínimo necesario.

**Validación**

- Verificar que el flujo completo funciona: crear ruta desde cero, añadir paradas, geocoding, guardar, cargar plantilla, guardar como plantilla.
- Verificar que el drag-drop funciona correctamente tras la partición.
- Verificar que el mapa actualiza los marcadores al editar paradas.

**Riesgos / trade-offs**

- Alto riesgo de introducir bugs en el flujo de drag-drop y geocoding si la partición no respeta correctamente el flujo de datos.
- Requiere refactorización cuidadosa con tests de integración previos.
- No hacer en un solo PR; hacerlo progresivamente por responsabilidad.

**Archivos o superficies afectadas**

- `src/components/Comercial/Routes/RoutesPlannerPage.jsx`
- Nuevos archivos: `RoutePlannerMetadataForm`, `RoutePlannerStopList`, etc.

---

### P05 — Componentes de tamaño elevado: `AgendaPageClient` y `FieldRouteExecutionPage`

- **ID**: P05
- **Severidad**: Medio
- **Impacto**: Medio
- **Esfuerzo de corrección**: Medio
- **Riesgo de cambio**: Medio
- **Área**: Render / Componente
- **Flujo afectado**: Agenda CRM (`/comercial/agenda`), ejecución de ruta field (`/field/routes/:id`)

**Síntoma**

Dos componentes con alta densidad de responsabilidades que concentran re-renders y dificultan la mantenibilidad.

**Evidencia**

- `src/components/Comercial/CRM/AgendaPageClient.jsx` — 700 líneas.
  - Responsabilidades identificadas: calendario mensual con grid, dialog de detalle del día, filtros de estado/tipo, acciones de reagendar/cancelar/completar, summary stats en el header.

- `src/components/Field/FieldRouteExecutionPage.jsx` — 450 líneas.
  - Responsabilidades: mapa con paradas, drawer de lista de paradas, drawer de detalle de parada, dialog de resultado (entrega/autoventa/incidente/sin contacto), navegación a Google Maps/Waze, creación de autoventa, lógica de completar/saltar parada.

**Causa raíz**

Mismo patrón que P04: acumulación de features sin partición paralela. Más tolerable en tamaño pero igualmente susceptible a re-renders innecesarios.

**Impacto de negocio/UX**

- En `AgendaPageClient`: abrir el filtro o cambiar el mes re-renderiza el grid de calendario completo aunque solo haya cambiado el estado del dialog de filtros.
- En `FieldRouteExecutionPage`: abrir/cerrar el drawer de paradas re-renderiza el mapa aunque el mapa no haya cambiado.

**Cambio propuesto**

Para `AgendaPageClient`:

1. Extraer `AgendaFilterDialog` con su propio estado local.
2. Extraer `AgendaDayDialog` con sus acciones.
3. Extraer `AgendaCalendarGrid` que solo recibe los eventos del mes.

Para `FieldRouteExecutionPage`:

1. Extraer `RouteStopDrawer` (lista de paradas).
2. Extraer `RouteStopDetail` (detalle de parada activa).
3. Extraer `RouteStopResultDialog` (dialog de resultado).
4. El mapa puede quedar en el componente principal o en su propio wrapper.

**Validación**

- Verificar que las acciones de agenda (reagendar, cancelar) siguen funcionando tras la partición.
- Verificar que el cambio de parada activa en field actualiza el mapa y el drawer correctamente.

**Riesgos / trade-offs**

- Medio. Menos complejo que P04 por tamaño, pero los flujos de reagendado y resultado de parada tienen estado compartido que debe colocarse correctamente.

**Archivos o superficies afectadas**

- `src/components/Comercial/CRM/AgendaPageClient.jsx`
- `src/components/Field/FieldRouteExecutionPage.jsx`

---

### P06 — `console.error` hardcodeado en `fetchWithTenant.js` en ruta de producción

- **ID**: P06
- **Severidad**: Medio
- **Impacto**: Bajo
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: Auth / transporte
- **Flujo afectado**: Cualquier request al backend que devuelva un error HTTP

**Síntoma**

Cada request fallida imprime en la consola del browser los detalles del error JSON recibido del backend. En producción esto: (a) añade ruido de logs que dificulta el debugging, (b) puede exponer información sensible del backend a cualquier persona con DevTools abierta.

**Evidencia**

`src/lib/fetchWithTenant.js:139`

```js
console.error('❌ Error JSON recibido:', errorJson);
```

Esta línea se ejecuta en el bloque de procesamiento de errores, que se alcanza en cada request no-ok que no sea un 401 de auth. Es decir, cualquier 400, 403, 404, 422, 500, etc.

**Causa raíz**

Log de debugging que no se eliminó al hacer merge.

**Impacto de negocio/UX**

- Potencial exposición de mensajes de error del backend en consola pública.
- Ruido que dificulta el debugging real en producción.
- No hay impacto en rendimiento medible.

**Cambio propuesto**

Eliminar o condicionar:

```js
// Opción A: eliminar
// console.error('❌ Error JSON recibido:', errorJson);

// Opción B: condicionar a desarrollo
if (process.env.NODE_ENV === 'development') {
  console.error('❌ Error JSON recibido:', errorJson);
}
```

**Validación**

- Verificar que los errores de backend siguen apareciendo correctamente en la UI (toast, mensaje de error).
- Verificar que en modo desarrollo los errores son visibles para debugging.

**Riesgos / trade-offs**

- Ninguno significativo. Los errores se procesan correctamente con independencia del log.

**Archivos o superficies afectadas**

- `src/lib/fetchWithTenant.js:139`

---

### P07 — `geocodeCache` de módulo sin TTL ni límite de tamaño

- **ID**: P07
- **Severidad**: Bajo
- **Impacto**: Bajo
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: Singleton de módulo
- **Flujo afectado**: Planificador de rutas (cualquier flujo que llame a `enrichStopsWithCoordinates`)

**Síntoma**

En sesiones largas con muchas rutas distintas, la cache de geocoding crece indefinidamente en memoria. No hay TTL ni límite de entradas.

**Evidencia**

`src/lib/routes/routeStops.ts:16-17`

```ts
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();
const pendingGeocodeRequests = new Map<string, Promise<{ lat: number; lng: number } | null>>();
```

Estas estructuras son constantes de módulo (singleton de proceso en el browser). La función `geocodeStop` (líneas 160-196) añade entradas pero nunca las elimina.

**Nota positiva**: `pendingGeocodeRequests` sí se limpia en el `.finally()` de cada promesa (línea 188-190). El problema es solo con `geocodeCache`.

**Causa raíz**

El patrón de caché perpetua es correcto para la mayor parte de los casos de uso (las coordenadas de una dirección no cambian), pero sin límite puede crecer en sesiones de larga duración con muchas rutas distintas.

**Impacto de negocio/UX**

- En sesiones normales: impacto mínimo o nulo.
- En sesiones de larga duración con muchas rutas distintas (>500 direcciones únicas): incremento de consumo de memoria.
- No hay impacto en rendimiento de requests.

**Cambio propuesto**

Añadir un LRU simple o simplemente un límite de tamaño:

```ts
const MAX_GEOCODE_CACHE_SIZE = 500;

// En geocodeStop, antes de insertar:
if (geocodeCache.size >= MAX_GEOCODE_CACHE_SIZE) {
  const firstKey = geocodeCache.keys().next().value;
  geocodeCache.delete(firstKey);
}
geocodeCache.set(query, coordinates);
```

Esto implementa un LRU manual muy simple (elimina la entrada más antigua). Para un caso más robusto, usar una clase LRU.

**Validación**

- Verificar que las primeras entradas se eliminan cuando se supera el límite.
- Verificar que el geocoding sigue funcionando correctamente (sin regresiones en rutas con muchas paradas).

**Riesgos / trade-offs**

- Si se elimina una entrada de caché que todavía se necesita, se hará una request de geocoding adicional. Impacto mínimo dado el límite alto sugerido.

**Archivos o superficies afectadas**

- `src/lib/routes/routeStops.ts:16-17` y la función `geocodeStop`.

---

### P08 — `useRouteTemplateMutations`: `normalizeRouteCollection([x])[0]` vs `normalizeRouteEntity(x)`

- **ID**: P08
- **Severidad**: Bajo
- **Impacto**: Bajo
- **Esfuerzo de corrección**: Bajo
- **Riesgo de cambio**: Bajo
- **Área**: React Query
- **Flujo afectado**: Actualización de plantilla de ruta

**Síntoma**

La mutación de actualización de plantilla normaliza el resultado envolviendo el item en un array, normalizando la colección y extrayendo el primer elemento, en lugar de normalizar directamente el item. Es semánticamente correcto pero innecesariamente indirecto.

**Evidencia**

`src/hooks/useRouteTemplates.ts:50-52`

```ts
const updatedTemplate = normalizeRouteCollection([
  ((response as { data?: unknown } | undefined)?.data ?? response) as Partial<
    import('@/types/field').DeliveryRoute
  >,
])[0];
```

La función `normalizeRouteCollection` itera un array y llama `normalizeRouteEntity` en cada item. Para un solo item, llamar directamente a `normalizeRouteEntity` es más claro y eficiente:

```ts
const updatedTemplate = normalizeRouteEntity(
  ((response as { data?: unknown } | undefined)?.data ?? response) as Partial<
    import('@/types/field').DeliveryRoute
  >
);
```

**Contraste**: `useRoutes.ts:60-62` y `useFieldRoutes.ts:62-64` usan `normalizeRouteEntity` directamente para el mismo patrón.

**Causa raíz**

Inconsistencia en el uso de las funciones de normalización. Probablemente se copió el patrón de colección sin adaptarlo.

**Impacto de negocio/UX**

- Ninguno funcional. Es un problema de calidad de código y consistencia.

**Cambio propuesto**

```ts
const updatedTemplate = normalizeRouteEntity(
  ((response as { data?: unknown } | undefined)?.data ?? response) as Partial<
    import('@/types/field').DeliveryRoute
  >
);
```

**Archivos o superficies afectadas**

- `src/hooks/useRouteTemplates.ts:50-52`

---

## 5. Confirmaciones Positivas

Patrones correctos que **no deben modificarse** y que pueden servir de referencia para el resto del código:

### ✓ Caché de token con deduplicación de promesa en vuelo

`src/lib/auth/getAuthToken.ts` implementa correctamente:

- Caché de token con expiración (`cachedClientToken` + `cachedClientTokenExpiresAt`).
- Deduplicación de la promesa en vuelo (`pendingClientTokenPromise`): múltiples calls simultáneas comparten la misma promesa de `getSession()`.
- Limpieza de caché en 401 (`clearAuthTokenCache()` llamado desde `crmService.ts:38`).
- Buffer de 30 segundos antes de expiración real para evitar tokens al límite.

### ✓ Normalización de query params en factories

`src/lib/routes/queryKeys.ts:4-11`: `normalizeQueryParams` filtra nulos, ordena claves y normaliza arrays de forma consistente. Garantiza que el mismo set de filtros produce siempre la misma key independientemente del orden de las claves.

### ✓ `enabled` guards en todos los hooks de field y rutas

`useFieldOrders`, `useFieldRoutes`, `useRoutes`, `useRouteTemplates`, `useFieldRoute` — todos comprueban `Boolean(token) && Boolean(tenantId)` antes de activar la query. `useFieldOrders` y `useFieldRoutes` añaden también `Boolean(fieldOperatorId)`.

### ✓ `setQueryData` para patch local en updates

`useRoutes.ts` (update mutation), `useFieldRoutes.ts` (stop mutation), `useRouteTemplates.ts` (update mutation) — todos usan `setQueryData` para actualizar la caché sin refetch tras una mutación exitosa. Esto evita una round-trip al servidor innecesaria.

### ✓ Memoización de firma de coordenadas en `useRouteGeometry`

`src/hooks/useRouteGeometry.ts:26-27`: `coordinateSignature` es un string memoizado que solo cambia si cambian las coordenadas reales. `geometryStops` depende de `coordinateSignature`, no del array `stops` directamente, evitando recálculos por referencias inestables.

### ✓ Control de concurrencia en geocoding

`src/lib/routes/routeStops.ts:198-223`: `runWithConcurrency` limita las peticiones de geocoding a 3 simultáneas. `geocodeStop` deduplica peticiones en vuelo para la misma dirección. El caché previene peticiones repetidas para direcciones ya resueltas.

### ✓ Cancelación en `useRouteGeometry`

`src/hooks/useRouteGeometry.ts:29-72`: el `useEffect` usa un flag `cancelled` para ignorar resultados de peticiones de geometría que llegan después de que el componente se haya desmontado o las dependencias hayan cambiado.

### ✓ QueryClient con configuración base sensata

`src/lib/queryClient.js`: `staleTime: 60_000` (1 minuto) y `refetchOnWindowFocus: false` son valores razonables para una app de negocio B2B donde los datos no cambian a alta frecuencia y la app puede quedar en segundo plano frecuentemente.

---

## 6. Plan de Remediación por Fases

### Fase 1 — Quick wins (1 semana)

| Tarea                                                                                             | Hallazgo | Estimado |
| ------------------------------------------------------------------------------------------------- | -------- | -------- |
| Crear factory `comercialOrderKeys` y actualizar `useComercialOrders`                              | P01      | 1h       |
| Eliminar `console.error` en `fetchWithTenant.js`                                                  | P06      | 15min    |
| Sustituir key hardcodeada en `autoventaMutation`                                                  | P03      | 30min    |
| Añadir `MAX_GEOCODE_CACHE_SIZE` en `routeStops.ts`                                                | P07      | 30min    |
| Sustituir `normalizeRouteCollection([x])[0]` por `normalizeRouteEntity(x)` en `useRouteTemplates` | P08      | 15min    |

**Total estimado Fase 1: ~3 horas de desarrollo + testing.**

### Fase 2 — Estabilización estructural (2-3 semanas)

| Tarea                                                             | Hallazgo | Estimado | Riesgo |
| ----------------------------------------------------------------- | -------- | -------- | ------ |
| Decidir y aplicar opción A/B para `fieldOperatorId` en query keys | P02      | 2-4h     | Medio  |
| Partir `AgendaPageClient` en componentes especializados           | P05      | 1-2 días | Medio  |
| Partir `FieldRouteExecutionPage` en componentes especializados    | P05      | 1 día    | Medio  |

### Fase 3 — Hardening (4-6 semanas, planificación en sprint)

| Tarea                                                                  | Hallazgo | Estimado | Riesgo |
| ---------------------------------------------------------------------- | -------- | -------- | ------ |
| Partir `RoutesPlannerPage` (1404 líneas) en componentes especializados | P04      | 3-5 días | Alto   |
| Añadir validación de performance en PR para flujos críticos            | —        | —        | —      |
| Establecer reglas de linting para query keys hardcodeadas              | P01, P03 | 1 día    | Bajo   |

---

## 7. Checklist de Validación Post-Remediación

### Network (verificar con DevTools tras cada cambio)

- [ ] Crear/guardar una ruta comercial: ¿cuántos requests se disparan? ¿alguno duplicado?
- [ ] Navegar entre paradas en field: ¿se refetcha la lista de rutas innecesariamente?
- [ ] Crear una autoventa: ¿se invalida la lista de clientes disponibles correctamente?
- [ ] Abrir la agenda: ¿cuántos requests se disparan en la carga inicial?

### React Query DevTools

- [ ] `useComercialOrders({})` llamado dos veces: ¿produce la misma entrada de caché?
- [ ] Actualizar una parada de ruta: ¿se hace refetch o se usa `setQueryData`?
- [ ] Actualizar una plantilla: ¿la lista de plantillas refleja el cambio sin refetch?

### Regresiones funcionales

- [ ] Flujo completo de planificador de rutas (crear, editar paradas, geocoding, guardar).
- [ ] Flujo de autoventa en field (crear pedido, validar invalidación de clientes).
- [ ] Agenda: filtrar, reagendar y cancelar eventos.
- [ ] Ejecución de ruta en field: completar parada, registrar resultado.

---

## 8. Riesgos, Trade-offs y Rollback

### P01 — Cambio de query key en `useComercialOrders`

- **Riesgo**: Si hay código que invalida la key con el formato anterior, la invalidación dejará de funcionar.
- **Mitigación**: `grep -r "'crm'.*'orders'"` para encontrar todos los usos antes de cambiar.
- **Rollback**: Revertir el commit del cambio de key. No hay persistencia de caché entre sesiones.

### P02 — Añadir `fieldOperatorId` a query keys de field

- **Riesgo**: Todas las invalidaciones existentes que usen las factories sin `fieldOperatorId` dejarán de funcionar.
- **Mitigación**: Actualizar todas las referencias en el mismo PR. Tests de regresión en flujo completo de field antes de merge.
- **Rollback**: Revertir el commit. Las keys anteriores siguen siendo válidas.

### P04 — Partir `RoutesPlannerPage`

- **Riesgo**: El flujo de drag-drop y geocoding tiene estado compartido complejo. Una partición incorrecta puede romper la sincronización entre la lista de paradas y el mapa.
- **Mitigación**: Partir de forma progresiva (un componente por PR), con pruebas manuales del flujo completo en cada iteración.
- **Rollback**: Cada PR de partición es reversible individualmente.

---

## 9. Propuesta de Writeback a la Fuente Central (`frontend-global-audit-2026-03-23.md`)

Los hallazgos de esta auditoría de rendimiento no cambian los scores por bloque (son problemas de consistencia y escala, no de arquitectura rota). Sin embargo, añaden contexto a los gaps pendientes:

- **Comercial CRM y ventas** (8/10): confirmar gap en `RoutesPlannerPage` (P04). Añadir en notas provisionales que la query key de `useComercialOrders` necesita normalización (P01).
- **Field y rutas en movilidad** (7/10): añadir en notas provisionales el riesgo de caché compartida por ausencia de `fieldOperatorId` en las keys (P02) y la invalidación con key hardcodeada en autoventa (P03).
- **Integración backend, multi-tenant y cross-origin** (7/10): añadir `console.error` en fetchWithTenant como gap menor de observabilidad (P06).
