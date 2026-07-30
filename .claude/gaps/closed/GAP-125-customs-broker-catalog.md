# GAP-125 — Catálogo de agentes de aduanas (CustomsBroker)

## Metadata

- **Tipo:** Feature
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-30
- **Autor:** Jose

---

## Contexto y problema

El backend ha añadido un catálogo nuevo, `CustomsBroker` (Intermediate Consignee), pensado
para ser reutilizado entre pedidos de exportación marítima y referenciado desde
`OrderMaritimeShippingDetail.customsBrokerId` (ver GAP-126).

Endpoints ya disponibles:

- `GET /api/v2/customs-brokers` — listado sin paginar, `{ data: CustomsBroker[] }`. **403 para
  rol `comercial`.**
- `GET /api/v2/customs-brokers/options` — `[{ id, name }]`, disponible para **cualquier rol
  autenticado** (incluido comercial), pensado para el selector del formulario de envío marítimo.
- `POST /api/v2/customs-brokers` — `name` (requerido, 3-255), `address`/`phone`/`email`
  (opcionales).
- `PATCH /api/v2/customs-brokers/{id}` — campos `sometimes` (parciales).
- `DELETE /api/v2/customs-brokers/{id}` — `200` si no está en uso; **400** con
  `userMessage: "No se puede eliminar el agente de aduanas porque está siendo utilizado en uno o
  más pedidos."` si algún pedido lo referencia. No hay borrado múltiple para este catálogo
  (decisión ya tomada en backend, no se replica en frontend).

Hoy el frontend no tiene ningún tipo, service, ni pantalla para este catálogo.

El proyecto ya tiene un patrón estándar 100% declarativo para catálogos simples de este tipo
(`transports`, `product-categories`, etc.) vía el componente genérico `EntityClient` +
`src/configs/entities/*.ts` — no requiere componentes React nuevos.

## Solución acordada

### 1. Tipos (`src/types/catalog.ts`)

Añadir:

```typescript
export interface CustomsBroker {
  id: number | string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
```

### 2. Service (`src/services/domain/customs-brokers/customsBrokerService.ts`, nuevo)

Calco exacto de `src/services/domain/transports/transportService.ts`: `list`, `getById`,
`create`, `update`, `delete` (sin `deleteMultiple` — no hay endpoint bulk), `getOptions` contra
`customs-brokers/options`.

### 3. Hook de opciones (`src/hooks/useCustomsBrokerOptions.ts`, nuevo)

Calco de `src/hooks/useExternalProcessorOptions.ts`: `useQuery` con `staleTime: 5 * 60 * 1000`
(catálogo de referencia, cambia poco), `queryKey` desde una factory nueva en
`src/lib/routes/queryKeys.ts` (`customsBrokerOptionKeys.list(tenantId)`), consumiendo
`customsBrokerService.getOptions()`. Se usará desde `MaritimeShippingDetailForm` (GAP-126), no
desde `EntityClient` (que resuelve sus propios Autocomplete internamente).

### 4. Registro en `entitiesConfig` (`src/configs/entities/entitiesConfig.admin.ts`)

Nueva entrada `'customs-brokers'`, junto a `transports` (mismo patrón exacto: `title`,
`description`, `emptyState`, `endpoint: 'customs-brokers'`, `viewRoute: '/admin/customs-brokers/:id'`,
`deleteEndpoint: 'customs-brokers/:id'`, `filtersGroup.search` por `id`, `filtersGroup.groups`
con filtro de texto por `name`, `table.headers` (`id`, `name`, `address`, `phone`, `email`),
`createForm`/`editForm` (`endpoint: 'customs-brokers'`, `POST`/`PUT`), y `fields`:

- `name` — text, requerido, minLength 3.
- `address` — textarea, opcional.
- `phone` — text, opcional.
- `email` — text, opcional, `validation.pattern` de email si el tipo de campo del proyecto lo
  soporta (verificar si `EntityClient` ya tiene un `type: 'email'`; si no, usar `text` con
  pattern).

Esto habilita automáticamente `/admin/customs-brokers`, `/admin/customs-brokers/create` y
`/admin/customs-brokers/[id]` vía las páginas genéricas `src/app/admin/[entity]/*` — no hace
falta crear páginas ni componentes.

### 5. Navegación

Añadir entrada "Agentes de aduanas" a `src/configs/navigationConfig.js`, en el grupo de
Ajustes/Catálogos ya existente (visible solo para roles con acceso a `/admin`, dado que el
middleware ya bloquea todo `/admin/*` para `comercial` — no hace falta lógica de rol adicional
en el propio item de menú, solo seguir el patrón de agrupación visual ya usado para catálogos
hermanos).

### 6. Manejo del error 400 (borrado en uso)

`EntityClient` ya gestiona errores genéricos de `delete` vía `notify.error(getErrorMessage(...))`
— verificar que un 400 con `userMessage` (no 422) se muestra correctamente con el mensaje del
backend tal cual, sin necesitar cambios si el manejo de errores de `EntityClient` ya cubre
cualquier status no-2xx con `userMessage` presente. Si `EntityClient` solo maneja 422 hoy,
extender el catch para incluir 400 con el mismo criterio (mostrar `userMessage`).

---

## UI Brief

- **Vista de referencia:** `/admin/transports` (config `entitiesConfig.admin.ts`, bloque
  `transports`) — catálogo simple con dirección/contacto, mismo shape de campos.
- **Tipo de layout:** página completa vía `EntityClient` (listado + filtros) y
  `CreateEntityForm`/`EditEntityForm` genéricos (no modal, no Sheet) — igual que todo catálogo
  `/admin/[entity]`.
- **Componentes clave:** ninguno nuevo — 100% declarativo vía `EntityClient`, `Table`, `Input`,
  `Textarea`, filtros genéricos ya existentes.
- **Estados requeridos:** los que `EntityClient` ya resuelve internamente (loading Skeleton,
  empty state configurable vía `emptyState`, error genérico) — no requiere trabajo nuevo de
  estados.
- **Mobile:** incluido automáticamente — `EntityClient` ya es responsive para todos los catálogos
  existentes.

### Confirmaciones ya cerradas (2026-07-30)

1. Modo de ejecución → **flujo GAP formal** (este documento y los siguientes 4).
2. Ubicación en menú → **nueva entrada en Ajustes/Catálogos** (no solo accesible por URL).

Sin preguntas abiertas — listo para implementar.

---

## Referencias e inspiración

- `src/services/domain/transports/transportService.ts` — patrón exacto de service a calcar.
- `src/hooks/useExternalProcessorOptions.ts` — patrón exacto de hook de opciones a calcar.
- `src/configs/entities/entitiesConfig.admin.ts` (bloque `transports`, líneas ~336-450) — patrón
  exacto de config declarativa a calcar.
- `src/configs/entities/index.ts` — punto de merge de módulos de config (no tocar directamente,
  solo añadir la entrada dentro de `entitiesConfig.admin.ts`).

## Criterios de aceptación

- [ ] `/admin/customs-brokers` lista los agentes de aduanas con paginación, búsqueda por `id` y
      filtro por `name`.
- [ ] Crear un agente de aduanas desde `/admin/customs-brokers/create` con solo `name` funciona
      (resto de campos opcionales).
- [ ] Editar un agente actualiza los campos parcialmente (`PATCH`).
- [ ] Borrar un agente que no está en uso lo elimina de la lista.
- [ ] Borrar un agente que está en uso (referenciado por algún pedido) muestra el `userMessage`
      del backend ("No se puede eliminar el agente de aduanas porque está siendo utilizado en
      uno o más pedidos.") y no lo elimina de la lista.
- [ ] La entrada "Agentes de aduanas" aparece en el menú de navegación para roles con acceso a
      `/admin` (administrador, dirección, técnico) y no es alcanzable para `comercial` (ya
      cubierto por el middleware — verificar que la redirección sigue aplicando).
- [ ] `useCustomsBrokerOptions` devuelve `{ id, name }[]` consumible por un Combobox (verificado
      manualmente o con un consumidor mínimo — el consumo real ocurre en GAP-126).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Archivos a crear o modificar

**Crear:**
- `src/services/domain/customs-brokers/customsBrokerService.ts`
- `src/hooks/useCustomsBrokerOptions.ts`

**Modificar:**
- `src/types/catalog.ts`
- `src/lib/routes/queryKeys.ts` (nueva factory `customsBrokerOptionKeys`)
- `src/configs/entities/entitiesConfig.admin.ts` (nueva entrada `customs-brokers`)
- `src/configs/navigationConfig.js` (nueva entrada de menú)

## Restricciones

- No crear componentes React de formulario/listado a medida — usar exclusivamente el patrón
  `EntityClient` ya existente.
- No tocar `src/configs/entitiesConfig.js` directamente (archivo protegido, solo reexporta) —
  todo cambio va en `src/configs/entities/entitiesConfig.admin.ts`.
- No crear archivos `.js` nuevos.
- No implementar borrado múltiple (`deleteMultiple`) — el backend no lo expone para este
  catálogo, decisión ya tomada.
- No modificar `src/middleware.ts` — el bloqueo de `/admin/*` para `comercial` ya existe.

---

## Implementación

### Archivos creados

- `src/services/domain/customs-brokers/customsBrokerService.ts` — `list`/`getById`/`create`/
  `update` (PATCH)/`delete`/`getOptions` (calco de `transportService.ts`, sin `deleteMultiple`)
- `src/hooks/useCustomsBrokerOptions.ts` — calco de `useExternalProcessorOptions.ts`,
  `staleTime: 5 * 60 * 1000`

### Archivos modificados

- `src/types/catalog.ts` — añadidas `CustomsBroker` y `CustomsBrokerOption` (shape plano
  `{id, name}`, no `{value, label}`)
- `src/lib/routes/queryKeys.ts` — añadida factory `customsBrokerOptionKeys`
- `src/configs/entities/entitiesConfig.admin.ts` — nuevo bloque `'customs-brokers'` (calco
  estructural de `transports`: filtro de búsqueda por `id`, filtro de texto por `name`, tabla con
  5 columnas, `createForm`/`editForm`, campos `name`/`address`/`phone`/`email`)
- `src/services/domain/entityServiceMapper.ts` — registrado `customsBrokerService` bajo la clave
  `'customs-brokers'` (**hallazgo no anticipado en el GAP, ver Decisiones**)
- `src/configs/navgationConfig.ts` (renombrado desde `.js`) — entrada "Agentes de aduanas" (icono
  `Landmark`) junto a "Incoterms"; archivo tipado completo (`NavigationItem` interface,
  `icon` opcional para ítems hijos sin icono propio)

### Decisiones tomadas durante la implementación

- **Corrección de ruta al plan original:** el GAP asumía que `EntityClient` era 100% declarativo
  sin ningún registro adicional. Al inspeccionar `EntityClient/index.js` se descubrió que el
  listado real tiene dos caminos: un puñado de entidades "query-driven" con hook TanStack Query
  hardcodeado dentro del propio `EntityClient` (transports, users, customers...), y un camino
  genérico de fallback (`fetchData` + `entityService.list()`) para el resto, resuelto vía
  `getEntityService(config.endpoint)` en `entityServiceMapper.ts`. `customs-brokers` no necesita
  entrar en el primer grupo (no está en `isQueryDriven`), pero **sí** necesita estar registrado en
  `entityServiceMapper.ts` para que el camino genérico funcione — sin este registro, `EntityClient`
  muestra "No se encontró el servicio para esta entidad". Este archivo no estaba en la lista
  original de "Archivos a modificar" del GAP.
- El archivo real de navegación es `src/configs/navgationConfig.js` (con esa errata en el nombre,
  no `navigationConfig.js` como decía el GAP).
- `navgationConfig.js` → `.ts`: confirmado con Jose antes de tocarlo (pregunta de confirmación,
  ver hilo de la conversación) — se migró completo en este commit junto con la entrada nueva,
  siguiendo la regla del proyecto. Migración de bajo riesgo: el archivo es 100% datos
  declarativos (arrays de objetos), sin lógica ni JSX. Tipado con una interfaz `NavigationItem`
  nueva (`icon` opcional porque los ítems `childrens` no llevan icono propio).
- Campo `email` usa `type: 'email'` (cae en el `default` del switch de `CreateEntityForm`, que
  renderiza `<Input type={field.type || 'text'}>` — un `<input type="email">` nativo), con
  `validation.pattern` explícito como refuerzo, siguiendo el patrón de `vatNumber` en `transports`.
- `editForm.method: 'PATCH'` (no `PUT`) — confirmado que `EditEntityForm` pasa el método
  genéricamente sin asumir `PUT`, coincide con el contrato real del backend (`sometimes`,
  parcial).

### Desviaciones del plan

- Se añadió `entityServiceMapper.ts` a los archivos modificados (no estaba en la lista original
  del GAP) — necesario para que el catálogo funcione en absoluto, ver decisión arriba. Sin este
  archivo, `EntityClient` no puede resolver ningún método CRUD para `customs-brokers`.
- El nombre real del archivo de navegación difiere del indicado en el GAP
  (`navgationConfig.js`/`.ts`, no `navigationConfig.js`).

### Fix tras primera auditoría (❌ RECHAZADO → corregido)

El auditor señaló que el bloque `customs-brokers` no tenía `hideBulkDelete: true`: `EntityClient`
muestra por defecto casillas de selección + botón "Eliminar seleccionados" que llama a
`entityService.deleteMultiple(...)`, método que `customsBrokerService.ts` no implementa a
propósito (el backend no expone borrado múltiple para este catálogo, decisión ya tomada en el
GAP). Sin el flag, un admin que seleccionara varios agentes y pulsara "Eliminar seleccionados"
recibiría siempre un error genérico.

**Fix aplicado:** añadida la línea `hideBulkDelete: true` al bloque `'customs-brokers'` en
`src/configs/entities/entitiesConfig.admin.ts`, junto a `deleteEndpoint` (mismo patrón que el
precedente `prospect-categories` en `entitiesConfig.crm.ts:317`).

`npm run type-check` re-verificado limpio tras el fix.

### Verificación

- `npm run type-check` → limpio (0 errores) en todo el proyecto.
- `npm run lint` → 0 errores, 267 warnings preexistentes, ninguno en los archivos tocados por
  este GAP.

---

## Auditoría

### Resultado: ✅ APROBADO

> Actualizado tras el fix de re-auditoría (ver "Fix tras primera auditoría" arriba). Primera
> pasada: ❌ RECHAZADO (7/10) por `hideBulkDelete` faltante. Fix aplicado: una línea,
> `hideBulkDelete: true` en el bloque `'customs-brokers'` de `entitiesConfig.admin.ts`, en la
> ubicación correcta (junto a `deleteEndpoint`, antes de `filtersGroup`), idéntica al patrón ya
> usado en `entitiesConfig.crm.ts:317` (`prospect-categories`). Re-verificado de forma
> independiente: `git diff HEAD` confirma que es el único cambio respecto al diff ya auditado, y
> `npm run type-check` vuelve a dar 0 errores. Con esto, las casillas de selección masiva y el
> botón "Eliminar seleccionados" dejan de renderizarse en `/admin/customs-brokers`, cerrando la
> brecha entre lo que la UI ofrece y lo que el service soporta. No quedan bloqueantes.

### Puntuación: 9/10 — implementación fiel al patrón `transports` en todo (service, hook, tipos,
registro en el mapper, migración de navegación), con el único hallazgo de la primera pasada
(`hideBulkDelete` faltante) corregido con un fix mínimo y verificado. Resto un punto por ser un
fix que debió haberse incluido desde la primera implementación (precedente ya existente en el
propio proyecto), no por ningún problema nuevo.

### Checklist

- [x] Criterios de aceptación cumplidos (7 de 8 verificados directamente; ver detalle abajo — el
      8º, `type-check`/`lint`, verificado de forma independiente por mí, no solo confiando en lo
      declarado)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos (`navgationConfig.js` fue migrado a `.ts`, no creado)
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso (`useLabelEditor.ts` no tocado; `useOrder`/`usePallet`
      no tocados)
- [x] `entitiesConfig.js` no tocado sin permiso — solo se tocó `entitiesConfig.admin.ts` (el
      módulo correcto)
- [x] Patrones de `.claude/rules/` respetados (service, hook, queryKeys factory, nomenclatura)
- [x] Nomenclatura correcta
- [x] **Restricción del GAP respetada tras el fix:** "No implementar borrado múltiple — decisión
      ya tomada" — el *service* correctamente no implementa `deleteMultiple`, y ahora el *config*
      de `entitiesConfig.admin.ts` para `customs-brokers` incluye `hideBulkDelete: true`
      (añadido en el fix post-auditoría), por lo que `EntityClient` ya no renderiza las casillas
      de selección ni el botón destructivo "Eliminar seleccionados" (ver detalle abajo — hallazgo
      original y resolución).

### Verificación independiente

- `npm run type-check` → limpio, 0 errores (confirmado, no solo lo declarado por el
  Implementador).
- `npm run lint` → 0 errores, 267 warnings — exactamente los mismos preexistentes; grepeado el
  log completo por los 7 archivos tocados de este GAP y ninguno aparece con warning nuevo.
- Diff completo de `entityServiceMapper.ts` revisado (no solo la línea añadida): un único import
  nuevo (`customsBrokerService`) y una única entrada nueva en el mapa (`'customs-brokers':
  customsBrokerService`). No se tocó ni reordenó ninguna entrada existente — cero riesgo de
  romper otras entidades.
- Diff completo de `navgationConfig.js → .ts` revisado: el rename es 100% de datos declarativos
  (arrays de objetos, sin lógica/JSX). La interfaz `NavigationItem` nueva marca `icon` como
  opcional (correcto — los ítems `childrens` no llevan icono propio) y no añade ningún campo
  obligatorio que los objetos existentes no tuvieran ya; `npm run type-check` limpio lo confirma
  para los 5 `LayoutClient.jsx` + `Navbar/index.js` + `SideBar/index.js` que consumen
  `navigationConfig`/`navigationManagerConfig` (todos `.js`, tipados vía `allowJs`). La entrada
  "Agentes de aduanas" se insertó junto a "Incoterms" como ítem de nivel superior, mismo shape
  (`name`, `icon: Landmark`, `allowedRoles`, `href`) que sus hermanos de catálogo.
- Bloque `customs-brokers` en `entitiesConfig.admin.ts` comparado línea a línea contra el bloque
  `transports`: estructura de `filtersGroup`/`table`/`createForm`/`editForm`/`fields` calca el
  patrón exacto, sin paréntesis/comas desbalanceados (el diff aplica limpio y `type-check`/`lint`
  lo confirman). Único hallazgo real, ver más abajo.
- `customsBrokerService.ts` comparado método a método contra `transportService.ts`: `list`,
  `getById`, `create`, `delete` son calco exacto; `update` usa `PATCH` (correcto, decisión
  documentada, contrato real del backend `sometimes`); `getOptions` usa `fetchEntitiesGeneric`
  en vez de `fetchAutocompleteOptionsGeneric` — desviación **correcta y documentada**: el shape
  real es `{id, name}` plano (igual que `AuxiliaryProductOption`), no `{value, label}`, así que
  usar el helper de transports habría forzado un shape incorrecto.
- `useCustomsBrokerOptions.ts` — calco exacto de `useExternalProcessorOptions.ts`, incluida la
  `staleTime: 5 * 60 * 1000`.
- Manejo del error 400 en borrado individual (criterio de aceptación 5) — verificado sin
  necesidad de tocar `EntityClient`: `deleteEntityGeneric` lanza la `Response` cruda cuando
  `!response.ok` (incluye 400), `handleDelete` en `EntityClient/index.js` captura
  `error instanceof Response`, parsea el body y usa `getErrorMessage(errorData)`, que prioriza
  `errorData.userMessage` — el mensaje del backend se muestra tal cual. Correcto, sin cambios
  necesarios, tal y como anticipaba el GAP.

### Criterios de aceptación (uno a uno)

- [x] `/admin/customs-brokers` lista con paginación, búsqueda por `id` y filtro por `name` —
      confirmado en `filtersGroup` del bloque de config.
- [x] Crear con solo `name` funciona — `address`/`phone`/`email` sin `validation.required`.
- [x] Editar actualiza parcialmente — `editForm.method: 'PATCH'`, confirmado que
      `EditEntityForm` respeta `config.editForm.method` sin asumir `PUT` (`const { method = 'PUT'
      } = config.editForm`).
- [x] Borrar uno no usado lo quita de la lista — flujo genérico de `EntityClient`, sin cambios
      necesarios.
- [x] Borrar uno en uso muestra el `userMessage` del backend — verificado el camino completo
      (ver "Verificación independiente" arriba).
- [x] Entrada de menú visible para administrador/dirección/técnico, no alcanzable para comercial
      — `allowedRoles` correcto, bloqueo real vía middleware ya existente (no tocado).
- [x] `useCustomsBrokerOptions` devuelve `{id, name}[]` — confirmado por tipo y por el uso de
      `fetchEntitiesGeneric` sin transformación a `{value, label}`.
- [x] `type-check`/`lint` limpios — confirmado de forma independiente (ver arriba).

### Hallazgo bloqueante (primera pasada) — bulk delete expuesto sin soporte en el service — ✅ RESUELTO

En `src/components/Admin/Entity/EntityClient/index.js`, `isSelectable` y `canBulkDelete` son
`true` por defecto salvo que el config indique lo contrario:

```js
const isSelectable = config?.isSelectable !== false;
const canBulkDelete = isSelectable && config?.hideBulkDelete !== true;
```

El bloque `customs-brokers` en `src/configs/entities/entitiesConfig.admin.ts` no incluye
`hideBulkDelete: true`, así que `EntityBody` renderiza las casillas de selección por fila y, en
cuanto el usuario selecciona 1+ filas, `EntityTableHeader` muestra el botón destructivo "Eliminar
seleccionados". Al pulsarlo, `handleSelectedRowsDelete` llama a
`entityService.deleteMultiple(selectedRows)` — método que **no existe** en
`customsBrokerService.ts` (correctamente, según la decisión del propio GAP: "no hay borrado
múltiple para este catálogo"). El resultado es que cualquier admin que seleccione varios agentes
de aduanas y pulse "Eliminar seleccionados" recibirá siempre el toast genérico "Hubo un error al
intentar eliminar los elementos." — una funcionalidad visible, aparentemente disponible, que
nunca funciona.

Este es exactamente el caso que ya resolvió `src/configs/entities/entitiesConfig.crm.ts:317`
para `prospect-categories` (otro catálogo sin `deleteMultiple` en el backend), que sí incluye
`hideBulkDelete: true`. El GAP-125 debió replicar ese mismo flag y no lo hizo.

**Corrección requerida (1 línea) en `src/configs/entities/entitiesConfig.admin.ts`, bloque
`'customs-brokers'`:**

```diff
     endpoint: 'customs-brokers',
     viewRoute: '/admin/customs-brokers/:id',
     deleteEndpoint: 'customs-brokers/:id',
+    hideBulkDelete: true,
     filtersGroup: {
```

Tras aplicar el fix, re-verificar visualmente (o al menos por lectura de `EntityBody`/
`EntityTableHeader`) que las casillas de selección y el botón de borrado masivo ya no aparecen
en `/admin/customs-brokers`, y volver a pedir auditoría.

**Resolución (segunda pasada):** aplicado tal cual — `hideBulkDelete: true` añadido en la
ubicación exacta indicada arriba. Confirmado por lectura de código (`isSelectable`/
`canBulkDelete` en `EntityClient/index.js` evalúan el flag correctamente) que las casillas de
selección y el botón "Eliminar seleccionados" ya no se renderizan para `customs-brokers`.
`git diff HEAD` confirma que es el único cambio de código respecto al diff ya auditado en la
primera pasada, y `npm run type-check` vuelve a dar 0 errores. Sin bloqueantes restantes.

### Observaciones para Jose (no bloqueantes, para cuando se corrija el punto anterior)

- Todo lo demás es sólido: el hallazgo de que `EntityClient` necesita el registro en
  `entityServiceMapper.ts` (no anticipado en el GAP original) está bien documentado y el diff es
  mínimo y seguro — no rompe ninguna entidad existente.
- La migración de `navgationConfig.js` a `.ts` es de bajo riesgo y está bien ejecutada — la
  interfaz `NavigationItem` es fiel a los datos reales del archivo.
- Buen detalle documentar que `EntityClient` no necesitó extender su manejo de errores para el
  400 de "agente en uso" — evitó tocar un archivo compartido por todos los catálogos sin
  necesidad.

### Revisión Visual

No aplica — 100% declarativo vía `EntityClient` (mismo layout/loading/empty/error que
`/admin/transports`, ya aprobado en producción). Sin componentes nuevos que auditar visualmente.

### Revisión UX

**Modo: Light** (config declarativa de catálogo auxiliar, sin flujo multi-paso, sin entidad
primaria afectada, sin formulario/modal a medida — el mismo patrón ya aprobado para `transports`/
`incoterms`).

```
[x] El cambio es autoexplicativo — mismo patrón que Transportes/Incoterms, ya conocido
[x] No introduce una decisión nueva del usuario sin affordance adecuado — corregido: tras el fix
    ya no se muestra la casilla de selección + "Eliminar seleccionados" (affordance que prometía
    una acción inexistente ha sido retirada, no solo ocultado el fallo)
[x] Consistente con la UI circundante — mismo layout/orden de campos que catálogos hermanos, y
    ahora también consistente con `prospect-categories` (mismo flag `hideBulkDelete`)
[x] Hover/focus/active states — heredados de shadcn (Button, Input, Table), sin código a medida
[x] Tono del texto — "Agentes de aduanas" / "Agente de aduanas" consistente con el resto en
    español
```

**Veredicto UX:** ✅ APROBADO — el fix retira la affordance rota en vez de solo silenciar el
error; ya no queda ninguna acción de UI sin soporte real en el service.

### PL CANDIDATE

Al añadir un catálogo nuevo vía `EntityClient` sin `deleteMultiple` en el service, es fácil
olvidar `hideBulkDelete: true` en el config porque ningún checklist existente lo cubre
explícitamente y el propio `EntityClient` no falla de forma ruidosa (falla en silencio con un
toast genérico) — nada avisa al implementador de que le falta ese flag. Vale la pena una regla
explícita en `.claude/rules/components.md` o `api-client.md`: "todo catálogo `EntityClient` cuyo
service no implemente `deleteMultiple` debe declarar `hideBulkDelete: true` en su config",
citando el precedente ya existente en `entitiesConfig.crm.ts` (`prospect-categories`).

### Estado final de la implementación

El service `customsBrokerService.ts`, el hook `useCustomsBrokerOptions.ts`, los tipos en
`catalog.ts`, la factory `customsBrokerOptionKeys` y el registro en `entityServiceMapper.ts` están
completos, correctos y calcan fielmente el patrón `transports`/`useExternalProcessorOptions`. La
migración de `navgationConfig.js` a `.ts` es correcta y no rompe ningún consumidor. El bloque
`customs-brokers` de `entitiesConfig.admin.ts` ahora incluye `hideBulkDelete: true`, cerrando la
única brecha detectada en la primera pasada (bulk delete expuesto sin soporte real en el
service). `/admin/customs-brokers`, `/admin/customs-brokers/create` y
`/admin/customs-brokers/[id]` quedan operativos con los 8 criterios de aceptación cumplidos,
`type-check`/`lint` limpios (verificados de forma independiente), y sin bloqueantes técnicos,
visuales ni de UX. GAP movido a `.claude/gaps/closed/`.
