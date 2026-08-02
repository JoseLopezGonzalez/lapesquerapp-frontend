# Auditoría del contrato API del frontend de La Pesquerapp

> Fecha de la auditoría: 2026-08-02. Alcance: `/home/jose/brisapp-nextjs` (frontend Next.js). Backend Laravel auditado por separado; este informe solo describe lo que el **frontend** hace, asume o descubre defensivamente sobre ese backend. No se ha modificado, instalado, refactorizado ni corregido nada — solo lectura, grep y `npm run type-check` / `npm run test:run`.
>
> Convención de evidencia: cada afirmación relevante cita `archivo:línea`. Se distingue explícitamente **hecho comprobado** (leído en el código) de **inferencia** (deducido de patrones/nombres, no verificado en ejecución).

---

## 1. Resumen ejecutivo

- **Estado general**: el frontend es una capa de acceso a API con una arquitectura documentada y mayormente respetada (`Componente → hook → service → helper genérico → fetchWithTenant → Laravel`), pero con **al menos tres sub-rutas paralelas** que la saltan legítima o accidentalmente (superadmin, labels/CRM/autoventa, y un servicio "legacy" de 915 líneas). El tipado es heterogéneo: módulos como CRM están casi perfectamente tipados; las entidades centrales (`Order`, `Pallet`, `Customer`) están tipadas con `[key: string]: unknown`, es decir, prácticamente sin contrato.
- **Nivel de centralización de la API**: alto para el 90% de los módulos CRUD estándar (34 servicios de dominio siguen el mismo patrón `list/getById/create/update/delete/getOptions`), pero **labels, CRM y el canal de campo/autoventa llaman a `fetchWithTenant` directamente**, saltándose la capa genérica y el `entityServiceMapper`. Existe además una segunda capa genérica casi duplicada en `src/services/*.js` (raíz) junto a `src/services/generic/*`.
- **Nivel de madurez del tipado**: desigual. `tsc --noEmit` pasa con **0 errores** (evidencia de disciplina sintáctica), pero esto convive con `[key: string]: unknown` en ~23% de las interfaces de `src/types/`, sin tipo `Product` ni `Pallet` canónico en absoluto, y con 18 `as any` concentrados en un único archivo de formulario de clientes.
- **Riesgo de descoordinación con Laravel**: **alto y ya materializado**, no solo teórico. Se han encontrado evidencias directas y actuales de exactamente los problemas que el audit de backend anticipaba: `orders/active` devuelve array u objeto según el caso y el frontend ya lo normaliza a mano (`orderService.ts:258-269`); el mismo campo (`offer_id`/`offerId`, `order_type`/`orderType`) llega en ambas convenciones según el endpoint y hay ≥6 normalizadores `campo ?? campo_snake` reinventados de forma independiente; `perPage`/`per_page` conviven **dentro de la misma carpeta `orders/`** (`orderService.ts` envía `perPage`, `orderAttachmentService.ts` envía `per_page`); la documentación interna (`docs/API-references/pedidos/README.md`) confirma que el propio backend documenta ambas casing para el mismo campo.
- **Viabilidad de introducir tipos generados**: media-alta para el 60-70% de las entidades bien delimitadas (catálogos, CRM, producción, supplier-liquidation); baja/requiere trabajo previo para `Order`, `Pallet`, `Product`, `Customer`, cuyo "tipo real" no vive en `src/types/` sino repartido en Zod schemas de formulario y componentes locales.
- **Viabilidad de introducir cliente HTTP generado**: viable como capa opcional, pero necesitaría integrarse con la lógica ya existente de tenant/auth/errores (`fetchWithTenant.js`, `apiHelpers.js`) vía un `mutator` — no reemplazarla, porque ya contiene lógica de negocio no trivial (heurística de 401 "con sabor a validación", exclusión de eventos de logout, etc.).
- **Principales bloqueos**: (1) ausencia total de infraestructura OpenAPI/Orval/Swagger-consumption (cero trazas en el repo); (2) entidades centrales sin tipo de contrato real; (3) inconsistencia `perPage`/`per_page` no resuelta ni siquiera documentada como decisión; (4) doble capa genérica (`services/generic/*` vs `services/*` raíz) que complicaría decidir dónde inyectar un cliente generado.
- **Recomendación preliminar**: no conectar aún la URL OpenAPI de producción. Empezar por generar tipos (no cliente, no hooks) para 2-3 módulos bien acotados y ya bien tipados a mano (CRM o catálogos), en paralelo al código manual existente, para validar la fiabilidad real del spec Scribe antes de comprometer módulos críticos como Pedidos o Palets.

---

## 2. Tecnologías y arquitectura detectadas

| Área | Estado detectado | Archivos relevantes | Observaciones |
|---|---|---|---|
| Next.js | `^16.0.7` declarado, `16.1.3` instalado | `package.json:76` | Discrepancia declarado/instalado — riesgo conocido ya documentado en memoria de proyecto (regresión de rutas sin prefijo de idioma) |
| React | `19.0.0-rc` (RC, pin exacto) | `package.json:87-88` | Bloqueado explícitamente en `CLAUDE.md`; RC no estable en producción |
| TypeScript | `5.9.3`, `strict: true` | `tsconfig.json:1-32` | `noUncheckedIndexedAccess` **no** activado |
| Node | No declarado en `package.json` (`engines` ausente); CI usa Node 20 | `.github/workflows/build-check.yml:15-16,42-43` | — |
| Gestor de paquetes | npm (`package-lock.json`), `.npmrc` con `legacy-peer-deps=true` | `.npmrc:1` | — |
| Router | App Router puro, sin `src/pages` | `src/app/` | — |
| Estructura | Layer-based global + feature-based dentro de `components/` | `src/{app,components,services,hooks,lib,types}` | components/ (624 archivos) es el mayor módulo, organizado por área de negocio |
| Auth | NextAuth 4.24, Credentials provider, JWT, re-fetch de `/me` en cada refresh | `src/app/api/auth/[...nextauth]/route.ts:22-141` | Sin refresh-token flow — sesión limitada por `exp` del JWT |
| Tenant | Subdominio parseado **3 veces de forma independiente** con defaults distintos (`'brisamar'` vs `'dev'`) | `getCurrentTenant.ts`, `fetchWithTenant.js:9-52`, `middleware.ts:20-32` | Candidato a unificar en una sola utilidad |
| Env vars API | `NEXT_PUBLIC_API_URL`/`API_URL_V2`/`API_BASE_URL` | `.env.example:9-15`, `src/configs/config.js:1-19` | Proxy dev `/api-backend/*` → `localhost:8000` (`next.config.mjs:19-25`) |
| Entornos | Sin config por entorno en repo; inyección de env vars a nivel de plataforma de hosting (inferencia) | `build-check.yml:32-33` | — |
| PWA | Sí — SW manual (`public/sw.js`), manifest dinámico por tenant | `src/app/api/manifest/route.js:1-88` | No usa `next-pwa` |
| HTTP | `fetch` nativo envuelto en `fetchWithTenant.js` + `apiHelpers.js` (`ApiError`, `apiGet/Post/Put/Delete`) | `src/lib/fetchWithTenant.js`, `src/lib/api/apiHelpers.js` | Sin Axios en todo el repo |
| Caché servidor | TanStack Query `5.90.21` | `src/lib/queryClient.js:1-26` | `staleTime` global 60s, `refetchOnWindowFocus:false` |
| Estado global | React Context (11 providers), sin Redux/Zustand | `src/context/*` | — |
| Formularios | React Hook Form `7.54.2` + `@hookform/resolvers` | — | — |
| Validación | Zod `3.25.76`, pero solo 3 schemas en `src/schemas/`; 14+ más co-localizados en componentes | `src/schemas/*`, componentes | Validadores hand-rolled separados para "lonjas" (`src/validators/lonjas/*`) |
| Generación de tipos | **Ninguna** | — | Ver §7/§21 |
| Fechas | `date-fns 4.1.0` (36 archivos) **conviviendo con** ≥8 implementaciones manuales de `formatDate*` | — | Ver §12 |
| Tablas | `@tanstack/react-table 8.21.3` | — | — |
| Upload | `<input type=file>` + Azure Document AI helpers, `FormData` en attachments | `src/helpers/azure/*` | — |
| Download | `file-saver`, `xlsx`, `xlsx-js-style` | — | — |
| tsc --noEmit | **0 errores** (ejecutado, ver §19) | — | Baseline limpio a fecha de auditoría |

**Sistemas de instrucciones para agentes duplicados** (hallazgo colateral, hecho comprobado): además de `.claude/`, coexisten `.cursor/rules/*.mdc` (17 archivos), `.github/instructions/*.instructions.md` (8), `.agents/skills/**` (~30) y `.ai_standards/*.md` (5, legacy). Riesgo de drift entre ellos si no se sincronizan — no es objeto de esta auditoría de API pero se señala por higiene de repo.

---

## 3. Capa actual de acceso a la API

**Cadena documentada y mayoritariamente real**: `Componente → hook (useX) → service de dominio (src/services/domain/*) → helper genérico (src/services/generic/*) → fetchWithTenant.js → Laravel /api/v2/`.

**`fetchWithTenant.js`** (202 líneas, leído completo — hecho comprobado):
- Resuelve tenant desde `Host` header (servidor, vía `next/headers` o `reqHeaders` pasado explícitamente) o `window.location.host` (cliente); default `'dev'` local / `'brisamar'` fallback genérico (`:9-52`).
- Inyecta `X-Tenant`, `Content-Type: application/json` (salvo override), `User-Agent` (`:55-60`). **No inyecta `Authorization`** — eso lo hace cada capa de servicio.
- Errores: detecta llamadas de logout en curso y las deja pasar sin procesar (`:71-115`); en 401 dispara `AUTH_SESSION_EXPIRED_EVENT` salvo que el mensaje "huela" a error de validación (heurística de palabras clave, `:117-134`); en 403 explícitamente **no** dispara ese evento (`:146`, comentario explícito); en el resto de casos lanza un `Error` plano (no `ApiError`) con `.status`/`.data` adjuntos (`:180-184`).
- No desenvuelve el body de la respuesta — devuelve el `Response` crudo; el unwrap (`response.data.data`, etc.) es responsabilidad de cada capa superior.

**Doble capa genérica (hallazgo relevante para Orval)**: existen **dos** implementaciones de los helpers CRUD genéricos:
1. `src/services/generic/entityService.ts` (145L, TS) + `createEntityService.js`/`editEntityService.js`.
2. `src/services/entityService.js` (158L) + `createEntityService.js`/`editEntityService.js` **en la raíz de `src/services/`** (`src/services/entityService.js:1-4`), casi idéntica, también envolviendo `fetchWithTenant` directamente.

Ninguna de las dos define una clase `ApiError` propia — los helpers genéricos lanzan el `Response` crudo (`throw response`) o un objeto estructurado ad hoc (`downloadFileGeneric`); la clase `ApiError` real vive solo en `src/lib/api/apiHelpers.js:11-18` (usada por el cliente moderno `apiRequest`/`apiGet`/etc.) y en el propio `src/services/orderService.ts` (servicio legacy). Es decir: **hay 3 "formas" de tratar errores conviviendo** (Response crudo, Error plano de `fetchWithTenant`, `ApiError` de `apiHelpers.js`), dependiendo de qué capa se use.

**Excepciones/bypasses de la cadena documentada, clasificadas**:

| Caso | Archivo | Clasificación |
|---|---|---|
| `useLoginTenant.ts:40` — `fetch()` directo a `public/tenant/{subdomain}` | pre-login, pre-tenant resoluble | Bypass real del "golden rule", plausible por dependencia circular tenant↔auth, pero duplica el parseo de subdominio en vez de reutilizarlo |
| `src/lib/maps/{directions,geocoding}.ts` | APIs de Google Maps | Excepción legítima (API de terceros) |
| `src/services/{crmAiService,chatgpt/extractionService,landing/landingLeadService}.*` | rutas propias de Next.js (`/api/crm/*`, `/api/extraction/*`, `/api/landing/*`) | Excepción legítima, documentada en el propio código |
| `src/services/domain/fuel/fuelService.ts:31` | API pública del gobierno (precio gasóleo) | Excepción legítima (tercero) |
| `src/lib/api/apiHelpers.js:323` `uploadMultipart` | necesita evitar el `Content-Type: application/json` forzado | Excepción documentada explícitamente en el código |
| **Labels, CRM (`crmService.ts`), campo/autoventa (`fieldOperatorService.ts`, `autoventaService.js`)** | llaman a `fetchWithTenant` **directamente**, sin pasar por `services/generic/*` ni por `entityServiceMapper` | Sub-patrón arquitectónico real y no documentado como tal: `Componente → hook → service de dominio → fetchWithTenant` (salta el helper genérico) |
| Panel Superadmin (`src/lib/superadminApi.ts`) | Excepción documentada en `CLAUDE.md` | Válida — sin tenant, auth propia (`sessionStorage.__superadmin_token__`) |

**Un import fuera de los límites documentados**: `src/context/SuperadminAuthContext.tsx:5` importa `fetchSuperadmin`/`getSuperadminToken`/`setSuperadminToken`, fuera de los dos directorios (`src/app/superadmin/**`, `src/components/Superadmin/**`) que `CLAUDE.md` marca como los únicos válidos. Arquitectónicamente razonable (es el propio provider de auth del panel) pero técnicamente fuera de la lista blanca documentada — vale la pena formalizar la excepción.

**Conclusión de la Fase 2**: la capa de acceso a la API está **centralizada para servicios CRUD estándar** (34 entidades) pero **no** para labels/CRM/campo, que conforman un tercer patrón real de facto. Esto es relevant para Orval: un cliente generado cubriría bien el 60% CRUD, pero no encajaría automáticamente en labels/CRM/campo sin trabajo de adaptación.

---

## 4. Inventario resumido de endpoints consumidos

| Módulo | Endpoints aprox. | Patrón de consumo | Patrón de tipos | Consistencia |
|---|---|---|---|---|
| Pedidos (orders) | ~25 (CRUD + `/active`, `/active-orders/options`, incidents, stats, profitability, attachments, maritime-*) | Mixto: wrapper de dominio delgado (`domain/orders/orderService.ts`) sobre un servicio legacy de 915 líneas (`src/services/orderService.ts`) que sí llama `fetchWithTenant` directo | `Order` con `[key:string]:unknown`; sub-tipos de rentabilidad bien tipados | **Baja** — `perPage` en el propio `orderService.ts` pero `per_page` en `orderAttachmentService.ts` de la misma carpeta; `/active` normaliza array-u-objeto a mano |
| Palets | ~10 | `domain/pallets/palletService.js` (solo list/delete) + servicio legacy raíz `palletService.ts` (645L) para create/update/detalle; **sin TanStack Query** (hook `usePallet.ts` usa `useState/useEffect` manual) | Sin tipo `Pallet` canónico en `src/types/`; `PalletPayload = {[key:string]:unknown}` | **Baja** — peor módulo tipado del repo |
| Productos | ~8 | `domain/products/productService.js`, JS sin tipos, con shim legacy marcado `TODO: Migrar` | Solo `ProductOption` (autocomplete); sin tipo `Product` completo en ningún sitio; 3 tipos distintos llamados `ProductOption` con campos distintos | **Media-baja** |
| Almacenes/Stock | ~6 | `useStores.js` usa `useInfiniteQuery` (único uso en el repo) | Tipo `StoreData` vive en un hook, no en `src/types/` | Media |
| Clientes | ~7 | `domain/customers/customerService.ts`, típico CRUD + `updateAssignment` | `Customer{id,name,[key:string]:unknown}` — esencialmente sin tipar | Baja |
| Proveedores | ~6 | `domain/suppliers/supplierService.ts`, típico | `CatalogListResponse<Supplier>`, `Supplier` con index signature | Media |
| Producción/Maquiladores | ~15 | Mezcla TS/JS; normalizadores dedicados snake→camel en `helpers/production/normalizers.js` | `production.ts` es de los mejor tipados (14 tipos, pocos escapes) | Media-alta |
| Repartidores/Autoventa | ~10 | `src/services/fieldOperatorService.ts` + `autoventaService.js`, **fuera** del `entityServiceMapper`, llama `fetchWithTenant` directo | `FieldOrder` tipo propio y deliberadamente distinto de `Order` | Media — bien delimitado como excepción intencional |
| Administración (users/roles/employees/taxes/transports) | ~20 | CRUD estándar vía `entityServiceMapper` | `User`, `Transport` tipados en `src/types/`; `PaginationMeta` duplicada byte-a-byte en 2 archivos | Media |
| IA / Extracción | ~3 | Rutas propias Next.js (`/api/extraction/chatgpt`, `/api/crm/improve-text`) | N/A (no golpea Laravel directamente) | N/A |
| CRM | ~15 (`crm/*`, `offers/{id}/pdf`) | `crmService.ts` fuera de la capa genérica, llama `fetchWithTenant` directo | **Mejor módulo tipado del repo** (`crm.ts`, 37 tipos, 0 escapes `unknown`/`any`) | Alta |
| Catálogos de sector | ~10 | CRUD estándar, `getOptions()` | `catalog.ts` — mayoría con `[key:string]:unknown` | Baja-media |
| Etiquetas (labels) | ~6 | `labelService.ts`, fuera de la capa genérica y del mapper | `labelEditor.ts`, tipado parcial | Media |
| Superadmin | N/A (fuera de alcance de tenant) | `superadminApi.ts`, stack HTTP propio | No auditado en profundidad (fuera del alcance principal de tenant) | N/A |

---

## 5. Inventario de tipos e interfaces

| Entidad o tipo | Archivos | Categoría | Duplicaciones | Riesgo |
|---|---|---|---|---|
| `Order` | `types/orders.ts:15-31` (canónico, `[key:string]:unknown`), + ≥6 redeclaraciones locales (`OrderDocuments`, `OrderDetailsData`, `OrderCardOrder`, `OrderData` en `useOrderFormConfig.ts`, `CommercialOrder` x2, `NormalizedOrderPallet`) | Mixto/ambiguo | Alta — `OrderCardOrder` y `OrderData` tienen **ambos** `orderType?` y `order_type?` a la vez (síntoma de que nadie fijó la convención real) | **Alto** |
| `Pallet` | Sin tipo canónico en `src/types/`; `PalletState`/`PalletBox` en `hooks/pallets/palletHelpers.ts`; ≥4 variantes locales solo dentro de `OrderPallets/`; un segundo `PalletBox` con campo `species` en `PalletsListDialog/index.tsx:39-45` | Ninguna es API contract real | Alta — familia peor tipada del repo | **Alto** |
| `Product` | `types/product.ts` (solo Option), + 3 tipos distintos llamados `ProductOption` con campos no solapantes | ViewModel/Option únicamente | Alta (colisión de nombre, no de contexto) | **Alto** |
| `Customer` | `types/catalog.ts:57-61` (`{id,name,[key:string]:unknown}`); shape real solo en `CustomerFormValues` (componente) | Ambiguo — el "tipo real" vive en un Zod schema de formulario, no en `src/types/` | Media | **Alto** |
| CRM (`Prospect`, `Offer`, `AgendaAction`...) | `types/crm.ts` (37 exports) | API contract + payload separados, consistente | Ninguna relevante | **Bajo** |
| `SupplierLiquidation` | `types/supplierLiquidation.ts` (15 exports) | API contract | Ninguna | **Bajo** |
| `Production*` | `types/production.ts` (14 exports) | Domain model, alineado con `helpers/production/normalizers.js` | Ninguna relevante | **Medio** |
| `FieldOrder` | `types/field.ts:33-49` | ViewModel deliberado, distinto de `Order` | Ninguna (contexto legítimo) | **Bajo** |
| `SettingsData` | `types/settings.ts:6` = `Record<string,unknown>` | Degenerado — el contrato real vive solo en `schemas/settingsSchema.js` (JS, sin tipo) | — | **Medio** |
| `PaginationMeta` | `types/catalog.ts:6-13` **y** `types/user.ts:6-13`, idéntica byte a byte | Duplicación literal | — | **Bajo** (cosmético, fácil de unificar) |

**Recuentos de smells de tipado (repo-wide, excl. `node_modules`, `.next`, `components/ui`)**:

| Patrón | Recuento aprox. |
|---|---|
| `as any` | 18 (17 concentrados en `customerFormSchema.ts:74-119`) |
| `as unknown as` | 39, en ~25 archivos |
| `@ts-ignore` / `@ts-expect-error` | **0** en todo `src/` |
| `Partial<...>` | 29 |
| `Pick<...>` / `Omit<...>` | 4 / ~0 (fuera de `components/ui`) |
| `Record<string, any>` | 8 |
| `Record<string, unknown>` | 271 |
| `[key: string]: unknown` en `src/types/` | 34 de ~150 interfaces (~23%) |
| Non-null assertions reales (`x!.`) | ~22, verificadas manualmente |
| `id: number\|string` vs `id: number` | 44 vs 21 ocurrencias en `types/*.ts` — inconsistente incluso dentro del mismo archivo (`orders.ts`) |
| Campos `Date` (vs `string`) | 19, todos en capa de formulario/UI — correctamente separados de los tipos de API (que usan `string`) |
| snake_case vs camelCase en `types/` | ~109 snake_case vs ~374 camelCase — camelCase domina ~3:1, pero concentrado desigualmente (`supplierLiquidation.ts` y `punch.ts` 100% snake_case; `crm.ts` mezcla ambas dentro del mismo tipo en el dashboard) |

---

## 6. Formas de respuesta esperadas

El frontend maneja **al menos 6 formas de respuesta** distintas, sin un wrapper único:

1. `T` directo — usado por varios `getById`.
2. `{data: T}` — envoltorio de creación/edición, manejado defensivamente como `result.data ?? result` en **62 ocurrencias** distintas de `src/services/domain/**` (representativo: `customerService.ts:48,59,90`, `productService.js:90,107`) — confirma que el backend **no siempre** envuelve, y cada servicio de dominio lo compensa a mano, de forma duplicada.
3. `{data: T[], meta: PaginationMeta}` — vía `CatalogListResponse<T>` (`types/catalog.ts:39-42`), usado por 16 servicios TS.
4. `{data: T[], meta, links}` — vía `CrmPaginatedResponse<T>` (`types/crm.ts:33-36`), tipo casi duplicado del anterior, exclusivo de CRM.
5. Array plano — `orders/active` cuando no está paginado.
6. `{success: boolean, ...}` / mensajes de error con combinaciones de `message`/`userMessage`/`error`/`errors` — ver §10.

**Helpers de "unwrap" encontrados**: `result.data ?? result` (62 sitios), `Array.isArray(response.data)` (71 archivos), `Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []` (patrón específico en `orderService.ts:258-269` y `:463-486`). No existe un único normalizador central — cada servicio reimplementa su propia variante del mismo defensive-check.

**Mutaciones vs consultas**: no usan una forma distinta de forma sistemática — ambas pasan por el mismo `result.data ?? result`. La excepción es `downloadFileGeneric`, que no devuelve datos sino un booleano de éxito de descarga.

---

## 7. Problemas de paginación

**`GET /v2/orders` con `active=true` vs sin él — NO es el mismo parámetro, son dos rutas distintas**:
- `orderService.list()` (`domain/orders/orderService.ts:77-99`) → `GET orders?...&page&perPage` → paginado (`CatalogListResponse<Order>`).
- `getActiveOrders()` (`src/services/orderService.ts:258-271`) → `GET orders/active` (ruta distinta, no query flag) → **no paginado**, array u objeto `{data:[...]}` según el caso, normalizado explícitamente a mano (`:265-269`) más un `normalizeActiveOrder()` (`:216-253`) que además parchea `order_type`→`orderType` y sintetiza `externalProcessor` cuando la relación no viene cargada.
- Existe una **tercera** variante de nomenclatura: `getActiveOrdersOptions()` golpea `active-orders/options` (`:463-464`) — tres esquemas de URL distintos para el mismo concepto de "activos".

**`perPage` vs `per_page`** (tabla completa, hecho comprobado vía grep de la cadena literal enviada al backend):

| Convención enviada | Archivos |
|---|---|
| `perPage` (34 archivos) | orders (`domain/orders/orderService.ts`), customers, suppliers, transports, users, productions, products, taxes, stores, species, pallets, boxes, countries, employees, sessions, field-operators, prospect-categories, punches, salespeople, payment-terms, incoterms, capture-zones, fishing-gears, product-categories/families, raw-material-receptions, cebo-dispatches, external-users/processors, activity-logs, auxiliary-products, customs-brokers |
| `per_page` (6 archivos, todos sub-recursos) | `orders/orderAttachmentService.ts:85`, `pallets/palletAttachmentService.ts:69`, `supplier-liquidations/supplierLiquidationService.ts:298`, `supplier-liquidations/supplierLiquidationDomainService.ts:21`, `palletService.ts:560-579` (legacy raíz) |
| Lectura defensiva de ambas | `production/productions.js:40` — lee `pag.perPage ?? pag.per_page` de vuelta, sin enviar ninguna con certeza |

**Hallazgo crítico**: la inconsistencia ocurre **dentro de la misma carpeta de dominio** — `orders/orderService.ts` envía `perPage` mientras `orders/orderAttachmentService.ts` (mismo directorio) envía `per_page`. No hay ninguna constante compartida ni comentario que gobierne la elección; cada archivo decidió por su cuenta.

**Riesgo de romper pantallas ante refactor de backend**: alto para los endpoints con `per_page`, porque son los menos numerosos (6 de 40) y por tanto los más fáciles de pasar por alto si el backend estandariza a una sola convención. Separar los contratos de paginación en tipos/operaciones distintos sería viable pero requeriría primero que el backend confirme cuál es la convención "correcta" por endpoint — el frontend no puede decidirlo unilateralmente.

---

## 8. Problemas de nullabilidad y relaciones

**`customer`/`transport`/`incoterm` en `Order`**: el tipo `Order` (`types/orders.ts:15-31`) **no declara estos campos en absoluto** — caen en `[key: string]: unknown`, así que TypeScript no da ninguna señal. El código de consumo colapsa uniformemente los tres estados posibles (relación ausente, no cargada, `null`) al mismo tratamiento `?? '—'`:
- `order.customer?.name ?? '—'` (`OrderCard/index.tsx:105,124,129,220`)
- `order.transport?.name ?? '—'` (`OrderDetails/index.tsx:372,604`)
- `order.transport != null` (`OrderDocuments/index.tsx:133`)

No se ha encontrado ningún comentario o TODO que reconozca la distinción de 3 estados (ausente vs no cargada vs null real) — **confianza alta** en que el frontend los trata como equivalentes por diseño implícito, no por decisión consciente.

**`Incident`**: no existe tipo de lectura (`interface Incident`/`type Incident` → 0 resultados). Solo hay `OrderIncidentPayload` (`types/orders.ts:286`, solo escritura). El hook `useOrderIncidents.ts` no consume una respuesta tipada de incidente — tras crear/editar simplemente invalida y refetch el `Order` padre, que vuelve a caer en el `[key:string]:unknown`. Es decir: el problema de "forma distinta en GET vs escritura" señalado por el audit de backend **no se ha abordado porque no hay modelo dedicado que normalizar** — el incidente nunca se lee de forma independiente y tipada.

**`FieldOrder` vs `Order`**: correctamente modelados como tipos **independientes** y deliberados (`types/field.ts:33-49` no extiende `Order`), consumidos por servicios de campo separados (`fieldOperatorService.ts:60,69,77`). Este es el único de los "problemas conocidos de backend" que el frontend ya resuelve de forma limpia y arquitectónicamente correcta.

---

## 9. Problemas de tipos y serialización

- **IDs mezclados `number|string`**: 44 ocurrencias de `number|string` vs 21 de `number` puro en `src/types/*.ts`, a veces en el mismo archivo (`orders.ts`: `Order.id: number|string` en el nivel superior, pero `OrderCostAnalysisProductLine.product.id: number` anidado).
- **Fechas**: correctamente tipadas como `string` en todos los tipos de API (`src/types/`); los 19 usos de `Date` están confinados a la capa de formulario/estado UI antes de serializar — patrón correcto, sin confusión Date-vs-string detectada en los tipos de contrato.
- **snake_case vs camelCase**: sin conversor genérico en todo el repo (0 hits de `camelcase-keys`/`humps`/similares). En su lugar: normalizadores manuales específicos de producción (`helpers/production/normalizers.js`, ~10 funciones con patrón `campo || campo_snake`), normalizadores puntuales para pedidos (`normalizeActiveOrder`, `normalizeOrderPallet`, inline en `useComercialOrders.ts:26`), y **consumo directo sin adaptar** en otros sitios (`useCustomerOrderHistoryRanges.js:233-341` lee `l.order_id`, `p.total_amount` tal cual). El patrón `campo ?? campo_snake ?? default` se reinventa de forma independiente en al menos 6 archivos distintos — no hay un helper compartido.
- **`PaginationMeta` tipada en snake_case** (`current_page`, `last_page`, `per_page`) en vez de normalizada — el tipo frontend "copia" la forma cruda de Laravel en vez de adaptarla.

---

## 10. Manejo de errores

- **`ApiError`** (`src/lib/api/apiHelpers.js:11-18`): `{message, status, data}`.
- **`getErrorMessage`** (`apiHelpers.js:80-83`): prioridad `userMessage > message > error > 'Error desconocido'`. **No lee `details`** — si el backend envía `details` distinto de `errors`, se pierde silenciosamente (0 usos de `.details` en todo el repo).
- **Duplicación de la misma lógica de prioridad**: `fetchWithTenant.js:174-178` reimplementa independientemente la misma cadena `userMessage || message || errorText`, en paralelo a `getErrorMessage` — dos implementaciones que pueden divergir con el tiempo.
- **`setErrorsFrom422.js`**: espera exactamente `{errors: {campo: ["msg"]}}`; si el 422 no trae `errors`, no hace nada (silencioso).
- **Códigos de estado, recuento repo-wide**: `instanceof ApiError` (18), `.status===422` (26), `.status===401` (14), `.status===403` (20), `.status===404` (11), **`.status===409` (0)**, **`.status===500` (0)**. Ningún archivo del repo distingue 409 o 500 — ambos caen en el mensaje genérico de fallback.
- **Calidad del manejo (muestra ~20 sitios, confianza media)**: ≈45% usa `ApiError`/`getErrorMessage` correctamente; ≈35% reinventa su propia cadena de prioridad ad hoc (`useLoginActions.ts:82-86`, `useOrderPallets.ts:17` define su **propio** `extractErrorMessage()` local en vez de importar el compartido); ≈20% traga el error y muestra un mensaje genérico fijo sin mostrar contenido real (`useStorePositions.js:206-208`, `useLabelEditor.ts:755-760`).
- **Fuga de mensajes técnicos**: al menos 2 sitios muestran `error.message` crudo al usuario sin pasar por `getErrorMessage` (`useOperarioCeboForm.js:382`, `ProspectFormSheet.tsx:208`).

---

## 11. Autenticación y multi-tenant

- **Token**: `getAuthToken.ts` con prioridad `providedToken > serverTokenContext (solo servidor) > token cliente cacheado (skew 30s) > getSession()`, deduplicado vía promesa pendiente para evitar llamadas concurrentes.
- **Sin refresh token** — confirmado por ausencia total de lógica de "refresh" en el código de auth (confianza alta). La sesión vive y muere con el `exp` del JWT de NextAuth (7 días, `route.ts:55-58`).
- **401**: dispara `AUTH_SESSION_EXPIRED_EVENT` salvo heurística de "401 con sabor a validación"; un componente global (`AuthErrorInterceptor.tsx`) parchea `window.fetch` y escucha ese evento para forzar `signOut()`.
- **Middleware** (`src/middleware.ts`, 318L): cachea la verificación de sesión 5 minutos en cookie para no golpear `/me` en cada request; en fallo de verificación solo fuerza redirect si es 401/403 — otros códigos se tragan y el middleware sigue con el JWT posiblemente obsoleto (`:215-229`).
- **Superadmin**: stack completamente separado, propio (`sessionStorage.__superadmin_token__`, sin `X-Tenant`), con manejo explícito de 429 que el resto de la app no tiene. Un solo import fuera de los directorios documentados como válidos (`SuperadminAuthContext.tsx:5`) — razonable pero no formalizado como excepción.
- **SSR**: confirmado (grep) que **ningún** Server Component llama directamente al backend — toda la obtención de datos es client-side vía hooks, con la única excepción del propio `middleware.ts`, que llama `fetchWithTenant` server-side para `/me` pasando explícitamente `req.headers`.
- **Mismo cliente HTTP para todos los contextos de tenant**: sí, `fetchWithTenant` es compartido por todo el árbol multi-tenant (no hay una instancia por tenant), lo cual es correcto dado que el tenant se resuelve en cada llamada.
- **Reutilización futura vía `mutator`**: viable — `fetchWithTenant`/`apiHelpers.js` ya concentran la lógica de tenant+auth+error en un punto relativamente único (para el 90% de servicios CRUD); un cliente Orval podría envolver `apiRequest`/`fetchWithTenant` como mutator sin reescribirlos, siempre que se preserve la heurística de 401-validación y la exclusión de eventos durante logout.

---

## 12. Transformaciones y adaptadores existentes

Al menos **21 funciones de transformación** identificadas, la mayoría (≥10) implementando el mismo idioma `campo ?? campo_snake_case ?? default` de forma independiente y duplicada — no hay un helper de "leer cualquiera de las dos convenciones" compartido:

- `normalizeActiveOrder` (`orderService.ts:241`) — defensivo, comentario explícito sobre "puede venir en `order_type` en algunas versiones de la API".
- `normalizeOrderPallet` (`useOrder.ts:44`) — mismo patrón, duplicado independiente.
- Inline `.map` en `useComercialOrders.ts:26` — mismo patrón, tercera reimplementación.
- `helpers/production/normalizers.js` — 8 funciones (`normalizeProductionRecord`, `normalizeProcess`, `normalizeProductionInput/Output/OutputConsumption`, `normalizeBox`…), todas con el mismo idioma `||`/`??`, salvo `normalizeProduct` que no lo aplica (inconsistente con sus hermanas).
- Adaptadores de salida (frontend→API) legítimos, no defensivos: `receptionTransformations.js` (`transformPalletsToApiFormat`, `transformDetailsToApiFormat`), `routeStops.ts` (`serializeStopsForWrite`).
- Formateadores de fecha/número: canonizados solo parcialmente — `formatNumbers.js` es el módulo "oficial", pero ≥8 implementaciones independientes de `formatDate*` conviven sin usarlo (`production/formatters.js`, `formats/dates/formatDates.js`, `datePicker.jsx`, `SupplierLiquidationsCrudList.tsx`, `Field/OrderSteps/utils.js`, `exportHelpers/common.js`, `superadminDateUtils.ts`), y una duplicación directa de `formatCurrency` fuera del módulo canónico (`routesPlannerUtils.ts:15-21`).

**Clasificación global**: ~60% de las transformaciones encontradas son **correcciones defensivas de un contrato inconsistente** (no ViewModels legítimos), lo cual es un indicador fuerte de que el problema de casing/shape del backend ya cuesta código real y duplicado hoy, no solo en teoría.

---

## 13. Campos aparentemente no usados

Confianza explícita: **media** (grep estático no ve acceso dinámico a propiedades).

- `Order.maritimeShippingDetail` (`types/orders.ts:28`) — **0 usos** de `.maritimeShippingDetail` fuera del propio archivo de tipos; el dato real se obtiene por un hook/servicio dedicado (`useOrderMaritimeShippingDetail.ts`), nunca leyendo la propiedad del objeto `Order`. Candidato a campo muerto en el tipo (el endpoint real cambió de forma y el campo quedó obsoleto).
- `Order.maritimeContainers`, `.auxiliarySubtotal/.auxiliaryTotal`, `.invoiced`, `.revenuePerKg`, `.marginPerKg` — todos con uso confirmado (7-11 sitios cada uno).
- `PalletState`/`PalletBox` (`palletHelpers.ts`) — todos los campos muestreados (`observations`, `palletTareWeightKg`, `productsNames`, `lots`, `position`, `numberOfBoxes`) tienen uso confirmado fuera del archivo de declaración.
- `Customer` — no aplica el análisis: solo declara `id`/`name`, el resto vive en `unknown`.

---

## 14. Campos usados pero no definidos correctamente

- No se ha encontrado ningún caso claro de `(obj as any).campoInexistente` accediendo a un campo realmente ausente del tipo — principalmente porque los tipos centrales (`Order`, `Customer`, `User`) ya llevan `[key:string]:unknown`, así que **nunca hace falta un cast para acceder a un campo nuevo del backend**: el escape hatch ya está puesto de antemano, lo cual reduce la señal de "cast defensivo" pero también reduce la seguridad de tipos real.
- Hallazgo de duplicación de nombre (no de "campo faltante" pero relacionado): `PalletsListDialog/index.tsx:39-45` declara su **propio** `interface PalletBox` local con un campo `species` que no existe en `hooks/pallets/palletHelpers.ts:3-17` — dos tipos con el mismo nombre, formas distintas, sin relación de herencia. Riesgo real de que alguien importe el equivocado sin que TypeScript avise (tipado estructural).

---

## 15. Tipos duplicados o contradictorios

Resumen (detalle completo en §5 y en el hallazgo de agentes de investigación):

- **`Order`**: 3 duplicaciones accidentales confirmadas — `interface Order` local en `OrderDocuments/index.tsx:59-69` (no importa el tipo canónico), `CommercialOrder` declarado dos veces de forma independiente (`useComercialOrders.ts:8-11` y `comercialOrders.ts:9-12`, con divergencia de campos), y el patrón `orderType?`+`order_type?` presente simultáneamente en dos archivos distintos.
- **`Pallet`**: sin tipo canónico; ≥4 variantes de "fila de palet en un pedido" solo dentro de `OrderPallets/` (`OrderPalletCardData`, `OrderPalletsContentPallet`, `OrderPalletTableRowData`, `SearchPalletCardData`), ninguna comparte una base común vía `Pick<>`.
- **`Product`**: 3 tipos llamados `ProductOption` con campos no solapantes (`types/product.ts`, `palletHelpers.ts:53`, `Autoventa/Step2QRScan/index.tsx:19`) — colisión de nombre, no reutilización.
- **`PaginationMeta`**: duplicado literal byte-a-byte en `catalog.ts` y `user.ts`.
- **`CatalogListResponse<T>` vs `CrmPaginatedResponse<T>`**: dos tipos de paginación casi idénticos (el segundo añade `links?`), CRM podría reutilizar el primero pero no lo hace.

No todas las variantes son accidentales: `FieldOrder` vs `Order`, y las ViewModels de detalle/tarjeta de pedido (`OrderDetailsData`, `OrderCardOrder` sin contar el smell de doble-casing) son diferenciación de contexto legítima.

---

## 16. Estado de React Query, SWR o caché

- **39 factories de queryKey** en `src/lib/routes/queryKeys.ts` (722L), 38/39 con `tenantId` como parámetro. Excepción intencional: `fuelQueryKeys.spainAverageDiesel()` (dato no tenant-specific). Riesgo señalado: `adminCustomerKeys.assignment(customerId)` no lleva `tenantId` — colisión cross-tenant plausible si los IDs no son globalmente únicos (no confirmado, depende del backend).
- **Regla ESLint contra arrays literales en `queryKey`** existe pero es solo `'warn'`, no `'error'` (`eslint.config.mjs:8-15`) — no bloquea el build. **21 violaciones reales** encontradas (`useUsersList.ts:42`, `usePunchesList.ts`, `useTransportsList.ts`, etc.) — todas corresponden a entidades **sin factory** en `queryKeys.ts` (payment-terms, roles, punches, sessions, employees, users-list, transports, countries, salespeople, prospect-categories) — es decir, el problema es cobertura incompleta de factories, no negligencia puntual.
- **Bypass del propio linter**: `useStores.js:47` asigna el array literal a una variable (`const storesQueryKey = [...]`) y pasa esa variable como `queryKey` — evade la regla AST (`ArrayExpression` directo) manteniendo el mismo problema de fondo.
- **`usePallet.ts` no usa TanStack Query en absoluto** — 304 líneas de `useState`/`useEffect` manual duplicando cache/loading/error que React Query da gratis. Es el único hold-out grande de la migración (todos sus sub-hooks `usePalletBoxOperations`, `usePalletBoxCreation`, `usePalletSave`, `usePalletScannerEffects` heredan la misma ausencia).
- **`useInfiniteQuery`**: 1 solo uso (`useStores.js:50`). **`prefetchQuery`/`HydrationBoundary`/`dehydrate`**: 0 usos — no hay SSR-hydration en todo el repo.
- **`select`**: usado en solo 8 hooks/11 call sites — la mayoría de los hooks de listado post-procesan manualmente (`response?.data ?? []`) en el cuerpo del hook en vez de usar `select`.
- **Optimistic updates**: concentrados casi en exclusiva en `useProspects.ts` (CRM) — ningún otro módulo muestreado (pedidos, palets, campo, labels) los usa; todos invalidan-y-refetch.
- **`staleTime`**: por defecto global 60s; overrides explícitos solo en endpoints de mayor coste (adjuntos 2min, diesel 30min, `useMe` 5min) o forzados a 0 (`processTree`).

**Cuánto podría sustituir Orval**: el 34-hook boilerplate de fetch+error+unwrap podría reducirse sustancialmente si se genera un cliente+hooks; pero la lógica de invalidación específica, los optimistic updates de CRM, y el flujo entero de `usePallet.ts` (que ni siquiera usa react-query hoy) necesitarían trabajo manual de todos modos.

---

## 17. Estado de formularios y payloads

- Ningún formulario muestreado (6 formularios, distintas entidades) reutiliza el tipo de respuesta como tipo de payload (`Partial<Customer>` como payload) — todos construyen un payload ad hoc a mano.
- Conversión de fechas consistente: `format(date, 'yyyy-MM-dd')` para fechas simples, un helper dedicado `datetimeLocalToIsoWithZone` para campos datetime-local — aplicado de forma homogénea donde hay fechas.
- IDs enviados como escalares (`Number(id)`), no como objetos anidados — patrón consistente.
- `FormData` usado correctamente solo donde hay archivos (adjuntos de pedidos/palets, extracción de documentos).
- **Riesgo de drift de nombres de campo**: cada payload literal tipa las claves a mano, sin constantes compartidas con el schema Zod o el tipo de respuesta. Caso concreto de mapeo manual frágil: `EditEntityForm/index.js:283-287` tiene un `snakeCaseMap` hardcodeado (`employeeId→employee_id`, etc.) **solo para la entidad "punches"** — traducción mantenida a mano, con alto riesgo de quedar desactualizada si el backend cambia esos nombres.

**Conclusión relevante para Orval**: los tipos generados desde OpenAPI encajarían bien para *responses*; para *requests* habría fricción real, porque ningún formulario asume hoy que el payload es un subconjunto tipado de la respuesta — habría que decidir explícitamente si generar tipos de request también, o mantener los payloads manuales tal como están.

---

## 18. Estado de schemas de validación

- Solo 3 schemas centralizados en `src/schemas/` (`loginSchema.ts`, `landingLeadSchema.ts`, `settingsSchema.js` — este último en JS, sin contraparte tipada real ya que `SettingsData = Record<string,unknown>`).
- 14+ schemas más co-localizados junto a componentes (`orderCreateSchema.ts`, `orderEditSchema.ts`, schemas de CRM, maritime-export, `individualPunchSchema.ts`).
- **Divergencia confirmada** entre `orderCreateSchema.ts` (campos requeridos explícitos) y `orderEditSchema.ts` (todos opcionales + un `superRefine` que reimpone requeridos a mano) — no usa `.partial()` derivado del schema de creación, riesgo de que ambos diverjan con el tiempo.
- `prospectFormSchema.ts` redeclara su propio `z.enum(prospectStatusTuple)` en vez de importar `ProspectStatus` ya exportado en `types/crm.ts:9` — dos fuentes de verdad independientes para el mismo enum de 5 valores.
- `customerFormSchema.ts` contiene la única representación real y completa de "Customer" en todo el repo (`CustomerFormValues`, ~15 campos requeridos) — pero vive en un archivo de formulario, no en `src/types/`, y se reconstruye desde el objeto crudo del backend con **18 casts `as any`** manejando pares snake/camel (`vatNumber`/`vat_number`, etc.).

**Viabilidad de generar Zod desde OpenAPI**: útil sobre todo para *responses* de endpoints críticos con forma inestable conocida (pedidos, palets); redundante/de bajo valor para formularios que ya tienen reglas de UI específicas (mensajes en español, validaciones cruzadas como el `superRefine` de autoventa) que un generador no replicaría automáticamente.

---

## 19. Estado de TypeScript

- `tsconfig.json`: `strict: true`, `skipLibCheck: true`, **`noUncheckedIndexedAccess` no activado**, `target: ES2017`, alias `@/*` y `@lib/*`.
- **`npm run type-check` ejecutado (hecho comprobado)**: `tsc --noEmit` → **exit code 0, 0 errores**. Baseline limpio a fecha de esta auditoría.
- `any`/casts (repo-wide, recuento aproximado, ver también §5): `as any` 18, `as unknown as` 39, `@ts-ignore`/`@ts-expect-error` 0, `Record<string,any>` 8, `Record<string,unknown>` 271, `[key:string]:unknown` en 34 interfaces de `src/types/`.
- La ausencia total de `@ts-ignore`/`@ts-expect-error` en el repo es una señal positiva de disciplina, pero convive con `[key:string]:unknown` como mecanismo preferido para "silenciar" el tipado en las entidades centrales — el resultado práctico (falta de verificación real) es similar, aunque sintácticamente más limpio.
- Ningún error de `tsc` relacionado con API existe hoy porque no hay errores en absoluto — el riesgo de tipado no se manifiesta como errores de compilación sino como **ausencia de contrato** (interfaces demasiado permisivas para poder fallar).

---

## 20. Estado de tests y mocks

- 45 archivos de test (36 en `src/__tests__/` + 9 co-localizados). Cobertura por categoría: hooks (13), services (12), helpers (5), exportHelpers (1), configs (1), validators (1), utils (1), app/shared (2), co-localizados (9).
- **`npm run test:run` ejecutado**: **35 archivos pasan / 11 fallan; 289 tests pasan / 22 fallan**. De los fallos:
  - ~9 son artefactos de entorno (llamadas reales a `getSession()`/NextAuth fallando por falta de red en el sandbox) — no necesariamente fallan en CI real.
  - 1 es una aserción desactualizada de un mensaje de error tras un refactor (`settingsService.test.ts`, texto de error cambiado sin actualizar el test).
  - El resto son bugs de lógica de negocio no relacionados con el contrato de API (`receptionCalculations.test.js`, `useProcessOptions.test.ts`, `DocumentProcessor.test.js`).
  - **Ningún fallo se debe a una discrepancia real de forma de mock vs tipo** — hallazgo relevante: pese al riesgo arquitectónico de casing/shape, los mocks actuales no han detectado ningún drift real hoy.
- **Comparación mock vs tipo (8 muestras)**: los mocks son plausibles como respuestas reales de Laravel (fechas ISO, ids numéricos, snake_case donde corresponde) en todos los casos. El hallazgo principal no es "mocks obsoletos" sino que **la mayoría de los tipos centrales son demasiado permisivos (`[key:string]:unknown`) para que un mock pueda siquiera "fallar" el chequeo de tipos** — el test de `useComercialOrders.test.ts:36-56` documenta explícitamente, con un mock que mezcla `offer_id`/`offerId` en el mismo array, el problema de doble-casing real.
- Un `status: 'in_production'` usado en `useOrder.test.js:217` no pertenece a la unión `OrderStatus` real (`'pending'|'finished'|'incident'`) y no aparece en ningún otro sitio del repo — parece un valor obsoleto/hipotético dejado en el test.
- No hay Playwright/Cypress/MSW instalados; no hay tests de contrato ni snapshot tests.

---

## 21. Intentos existentes de OpenAPI o generación automática

**Ninguno.** Grep exhaustivo (`openapi|swagger|orval|openapi-typescript|scribe|codegen`, case-insensitive, todo el repo excluyendo `node_modules`) no arrojó ningún hit genuino — los únicos matches fueron falsos positivos de la subcadena "scribe" dentro de verbos en español (`describe`, `escribe`) en documentación `.claude/`. Tampoco existe ninguna carpeta `generated/` ni código marcado `// autogenerated` relacionado con tipos de API (los 4 hits de "generated" encontrados son de dominios no relacionados: normalización Azure, lista de especies FAO, copy de marketing).

Sí existe documentación de contrato **mantenida a mano**: `docs/API-references/` (por módulo: pedidos, productos, inventario, producción, catálogos, estadísticas, autenticación...) con ejemplos de request/response. Un ejemplo muestreado (`docs/API-references/pedidos/README.md`) documenta explícitamente **tanto** `load_date` (en ejemplos de respuesta) **como** `loadDate` (en ejemplos de filtro/request) para el mismo pedido — confirmando, desde la propia documentación interna, que la inconsistencia de casing es real y ya conocida, no una suposición de este audit.

`docs/ai/modules/orders/gaps-registry.md` ya registra `GAP-V2-028`: "`orderService.ts` duplica manualmente headers/token/parseo de error en 35 funciones" — el propio sistema de gestión de deuda técnica del proyecto ya había identificado, de forma independiente, el archivo que este audit señala como el más problemático.

---

## 22. Compatibilidad real con Orval

| Capacidad | Viabilidad | Riesgos | Trabajo necesario |
|---|---|---|---|
| **Tipos** | Media-alta para catálogos/CRM/producción/supplier-liquidation; baja para Order/Pallet/Product/Customer sin trabajo previo | Colisión de nombres (`ProductOption`, `Order`, `PalletBox` ya duplicados hoy); uniones difíciles de usar si el spec Scribe no es fiable en las entidades centrales (según el audit de backend, "todavía no puede considerarse completamente fiable") | **Medio** — empezar por 3-4 módulos bien delimitados antes de tocar Order/Pallet |
| **Cliente HTTP** | Media — viable como mutator sobre `apiRequest`/`fetchWithTenant` existentes, no como reemplazo | Reimplementar mal la heurística de 401-validación, la exclusión de logout, o el multipart-upload rompería flujos reales hoy funcionando | **Alto** — requiere preservar lógica de negocio no trivial ya presente en `fetchWithTenant.js`/`apiHelpers.js` |
| **React Query** | Baja-media a corto plazo | Los optimistic updates de CRM y el flujo `usePallet.ts` (sin react-query hoy) no se generarían correctamente; factories de `queryKeys.ts` con reglas de tenant-scoping específicas (comentarios tribales) se perderían si se regeneran desde cero | **Alto** — mantener hooks manuales para CRM/Pallet, generar solo para CRUD estándar sin mutaciones complejas |
| **Zod** | Baja-media | Formularios ya tienen reglas de negocio (mensajes ES, `superRefine` de autoventa) que un generador no replica; útil solo como validación runtime de *responses* en endpoints críticos (pedidos, palets) | **Bajo-medio**, y solo si se decide validar responses, no forms |

---

## 23. Desfases concretos que pueden existir hoy

| Severidad | Desfase | Evidencia frontend | Posible relación con backend | Impacto |
|---|---|---|---|---|
| **Crítico** | `perPage`/`per_page` inconsistente **dentro del mismo módulo** `orders/` | `orderService.ts` (perPage) vs `orderAttachmentService.ts:85` (per_page) | Backend probablemente inconsistente por endpoint, tal como señaló el audit de backend | Una petición de adjuntos con paginación mal formada podría devolver datos incorrectos o ignorar el límite silenciosamente |
| **Crítico** | `Order`/`Pallet`/`Customer` centrales sin contrato tipado real (`[key:string]:unknown`) | `types/orders.ts:30`, ausencia de `types/pallet.ts`, `types/catalog.ts:57-61` | El spec OpenAPI "todavía no puede considerarse completamente fiable" para estas entidades (hallazgo del audit de backend) | Cualquier cambio de campo en las entidades más usadas del ERP pasaría desapercibido por TypeScript |
| **Alto** | `orders/active` con forma variable (array vs `{data:[]}`) ya requiere normalización manual | `orderService.ts:258-269,463-486` | Confirma directamente el hallazgo de backend sobre `GET /v2/orders` | Cualquier extensión futura de ese endpoint que no siga el mismo patrón normalizado rompería sin aviso de tipos |
| **Alto** | Relación `customer`/`transport` en `Order`: ausente/no-cargada/null tratadas como equivalentes | `OrderCard/index.tsx:105,124,129,220`, `OrderDetails/index.tsx:372,604` | Relaciones condicionales del backend (carga eager opcional) | UI podría mostrar "—" para un cliente que sí existe pero no fue cargado en ese endpoint concreto, sin forma de distinguirlo de un cliente realmente ausente |
| **Alto** | `offer_id`/`offerId` en el mismo array de respuesta (documentado en test) | `useComercialOrders.test.ts:36-56`, `useComercialOrders.ts:26` | Backend envía casing mixto en el mismo endpoint | Filtros/joins sobre `offerId` que no cubran ambas variantes fallarían silenciosamente |
| **Medio** | `Incident` sin tipo de lectura — nunca se normaliza forma GET vs escritura porque nunca se lee tipado | `types/orders.ts:286` (solo payload), `useOrderIncidents.ts` | Backend puede devolver forma distinta en GET vs write, según el audit de backend | Bajo impacto actual (la UI nunca lee el incidente de forma aislada), pero bloquea cualquier futura vista de detalle de incidentes |
| **Medio** | Doble capa genérica casi duplicada (`services/generic/*` vs `services/*` raíz) | `entityService.js` en ambos paths | No es un problema de backend, es deuda interna | Confunde a un futuro cliente generado sobre dónde inyectarse |
| **Bajo** | `PaginationMeta` duplicada byte-a-byte en 2 archivos | `catalog.ts:6-13`, `user.ts:6-13` | — | Cosmético, fácil de unificar sin riesgo |
| **Bajo** | 3 tipos distintos llamados `ProductOption` | `types/product.ts:5`, `palletHelpers.ts:53`, `Step2QRScan/index.tsx:19` | — | Riesgo de import equivocado, bajo impacto funcional actual |

---

## 24. Deuda técnica previa

### Imprescindible antes de conectar OpenAPI
- Resolver o al menos **documentar explícitamente** la convención `perPage`/`per_page` por endpoint (no puede resolverse solo desde el frontend).
- Definir un tipo `Order`/`Pallet`/`Product`/`Customer` real (aunque sea manual primero) antes de intentar generar equivalentes desde el spec, para poder comparar campo a campo si el generado es fiable.
- Unificar los ≥6 normalizadores `campo ?? campo_snake` en un único helper, o mejor, confirmar con backend cuál es la convención final para no seguir manteniendo ambas versiones a mano.
- Decidir qué hacer con la doble capa genérica (`services/generic/*` vs `services/*` raíz) — un cliente generado necesita un único punto de inyección.

### Recomendable, pero no bloqueante
- Formalizar la excepción de `SuperadminAuthContext.tsx:5` en la documentación de límites del panel superadmin.
- Migrar `usePallet.ts` y sus sub-hooks a TanStack Query antes o junto con cualquier generación de hooks Orval para ese módulo (si no, quedaría como una isla manual permanente).
- Subir a `'error'` la regla ESLint de `queryKey` literal y añadir las ~10 factories que faltan (payment-terms, roles, punches, sessions, employees, users-list, transports, countries, salespeople, prospect-categories) para cerrar el hueco que hoy fuerza el bypass.
- Centralizar `formatDate*`/`formatCurrency` en el módulo canónico existente (`formatNumbers.js`) para eliminar las ≥8 implementaciones paralelas.

### Puede dejarse para una segunda fase
- Unificar `PaginationMeta` duplicada.
- Resolver la colisión de nombre `ProductOption` x3.
- Consolidar `CatalogListResponse<T>` y `CrmPaginatedResponse<T>` en un solo tipo genérico.
- Formalizar labels/CRM/campo-autoventa como un "segundo patrón arquitectónico" documentado explícitamente en `CLAUDE.md`, en vez de excepciones implícitas.

---

## 25. Módulos candidatos para piloto

| Módulo | Complejidad | Calidad actual del tipado | Dependencias | Riesgo | Recomendación |
|---|---|---|---|---|---|
| Catálogos (countries, transports, taxes, incoterms...) | Baja | Media (index signatures, pero CRUD simple y estable) | Ninguna cruzada relevante | Bajo | **Buen candidato secundario** — bajo riesgo, poco valor de demo |
| CRM/Prospects | Media | **Alta** (mejor módulo tipado del repo, 0 escapes) | Fuera de la capa genérica (llama `fetchWithTenant` directo) — necesitaría puente | Bajo-medio | **Candidato fuerte** — tipos ya casi listos para comparar 1:1 contra el spec generado, aunque necesita adaptar la capa HTTP |
| Palets | Alta | **Muy baja** (sin tipo canónico, sin react-query) | Muchas — pedidos, almacenes, adjuntos | Alto | **Evitar como piloto** — demasiada deuda simultánea (tipos + arquitectura de hooks) |
| Productos | Media | Baja (sin tipo completo, solo options) | Pedidos, palets, producción | Medio-alto | Evitar como primer piloto |
| Almacenes/Stock | Media | Media | `useInfiniteQuery` único caso — patrón especial | Medio | Posible piloto de "segunda ronda", una vez validado el patrón con catálogos |
| Pedidos | Muy alta | Muy baja en el tipo core, alta en sub-tipos de rentabilidad | Casi todos los módulos | Muy alto | **No usar como piloto** — es el módulo con más desfases activos documentados en este informe (perPage/per_page, active-array, relaciones, incidents) |

**Piloto recomendado: Catálogos de sector** (countries, incoterms, payment-terms, fishing-gears) como primer paso de bajísimo riesgo para validar la fiabilidad real del spec Scribe generado, seguido de **CRM** como segundo piloto de mayor valor (ya está bien tipado a mano, permite comparar directamente si el spec generado iguala o mejora el tipado manual existente).

---

## 26. Estrategia preliminar de migración

No se implementa nada; se describen fases posibles basadas en la evidencia de este informe:

1. **Fase 0 — Confiabilidad del spec**: generar tipos (solo tipos, sin cliente ni hooks) para 2-3 módulos de catálogo simples y compararlos campo a campo contra los tipos manuales existentes, para medir cuán fiable es el spec Scribe en la práctica antes de comprometer nada.
2. **Fase 1 — Piloto CRM**: comparar el tipo generado de `Prospect`/`Offer` contra `types/crm.ts` (ya excelente) — si el generado iguala o mejora, evaluar cliente/hooks generados para ese único módulo, manteniendo los optimistic updates de `useProspects.ts` como código manual sobre el cliente generado.
3. **Fase 2 — Resolver desfases bloqueantes**: antes de tocar Pedidos/Palets, resolver con el equipo de backend la convención `perPage`/`per_page`, y decidir la forma final de `customer`/`transport` (siempre objeto completo vs siempre `null` vs opcionalmente ausente) para poder generar un tipo `Order` real.
4. **Fase 3 — Migración incremental de catálogos y entidades CRUD simples** (proveedores, transportes, usuarios) a tipos+cliente generados, dejando los hooks de mutación manuales.
5. **Fase 4 — Pedidos/Palets**, solo tras validar en fases anteriores que el spec es fiable y tras resolver los desfases críticos de §23.
6. En todo momento: mantener manuales los ViewModels de formulario (Zod schemas, payloads) — no generarlos desde el spec, dado que ya contienen reglas de negocio (mensajes en español, validaciones cruzadas) que el generador no replicaría.

---

## 27. Archivos clave

| Archivo o carpeta | Función actual | Relevancia futura |
|---|---|---|
| `src/lib/fetchWithTenant.js` | Único punto HTTP real (tenant+auth parcial+errores) | Candidato a `mutator` de un cliente generado — no reemplazar, envolver |
| `src/lib/api/apiHelpers.js` | Cliente moderno unificado (`ApiError`, `apiGet/Post/Put/Delete`) | Base más limpia que `fetchWithTenant` cruda para servir de mutator |
| `src/services/generic/*` vs `src/services/*` (raíz) | Doble capa genérica casi duplicada | Decidir cuál se conserva antes de generar nada |
| `src/services/domain/entityServiceMapper.ts` | Mapa string→servicio para UI genérica | Tendría que actualizarse si se sustituyen servicios de dominio por generados |
| `src/types/*.ts` (18 archivos) | Tipos manuales, calidad muy desigual | Punto de comparación obligatorio contra cualquier tipo generado |
| `src/lib/routes/queryKeys.ts` | 39 factories de queryKey, tenant-scoped | Debe conservarse manualmente — encapsula reglas de invalidación no triviales |
| `src/schemas/` + schemas co-localizados | Validación de formularios, parcialmente redundante con tipos | Mantener manual, no generar desde OpenAPI |
| `docs/API-references/` | Documentación de contrato mantenida a mano | Fuente de verdad actual, útil para contrastar contra el spec Scribe |
| `docs/ai/modules/orders/gaps-registry.md` | Deuda técnica ya registrada (`GAP-V2-028`) | Confirma independientemente los hallazgos de este audit sobre `orderService.ts` |
| `src/services/orderService.ts` (915L, legacy raíz) | Servicio "de facto" real de pedidos, con más lógica que su wrapper de dominio | Mayor riesgo/esfuerzo de migración de todo el repo |
| `src/hooks/usePallet.ts` + `src/hooks/pallets/*` | Único subsistema grande sin TanStack Query | Debe migrarse a react-query antes de generar hooks para palets |

---

## 28. Preguntas abiertas

(Solo cuestiones que no pueden resolverse inspeccionando este repositorio.)

1. ¿Cuál es la convención "correcta" y final de paginación (`perPage` vs `per_page`) según el backend — es intencional por tipo de endpoint o accidental?
2. ¿El backend garantiza `customer`/`transport`/`incoterit` como objeto completo cuando la relación existe, o puede devolver un objeto parcial? El frontend no puede saberlo solo con `null`/no-null.
3. ¿Es fiable hoy el spec OpenAPI/Scribe específicamente para `Order`, `Pallet`, `Customer` (las entidades peor tipadas en frontend), o solo para los módulos más simples?
4. ¿Existe intención de estandarizar `order_type`/`offer_id` a una sola convención de casing en el backend, o el frontend deberá seguir normalizando ambas indefinidamente?
5. ¿El campo `Order.maritimeShippingDetail` sigue existiendo en el backend, o quedó obsoleto tras moverse a un endpoint dedicado (y por tanto debería eliminarse del tipo)?
6. ¿Hay planes de versión de API (`/v2/` vs futuro `/v3/`) que deban condicionar cuándo conectar el spec generado?

---

## 29. Conclusión

1. **¿Está el frontend preparado para consumir tipos generados?** Parcialmente. Para catálogos, CRM, producción y supplier-liquidation, sí, con fricción baja. Para Order/Pallet/Product/Customer, no todavía — primero hace falta que exista *algún* contrato de referencia (aunque sea manual) contra el cual comparar el tipo generado.
2. **¿Está preparado para consumir un cliente HTTP generado?** Solo si se integra como mutator sobre `apiRequest`/`fetchWithTenant` existentes — reemplazarlos directamente perdería lógica de negocio real (heurística 401-validación, exclusión de logout, multipart).
3. **¿Qué porcentaje aproximado de interfaces API podría reemplazarse?** Estimación: ~40-50% (catálogos, CRM, producción, supplier-liquidation, punch, user) podrían sustituirse con relativamente poco riesgo; el resto (Order, Pallet, Product, Customer, y toda la capa de formularios/ViewModels) debería mantenerse manual, al menos en una primera fase.
4. **¿Qué porcentaje debería mantenerse como ViewModels o tipos de formulario?** Los ~14+ Zod schemas co-localizados y sus tipos derivados (formularios) deberían mantenerse manuales al 100% — encapsulan reglas de negocio en español que un generador no replica.
5. **¿Cuál es el principal riesgo?** Que el spec OpenAPI/Scribe, ya señalado como "no completamente fiable" por el audit de backend, se conecte primero a las entidades que el frontend ya sabe (por evidencia directa: normalizadores duplicados, tests con casing mixto) que son las más inconsistentes — materializando errores silenciosos en Pedidos, el módulo de mayor uso del ERP.
6. **¿Qué módulo debería ser el piloto?** Catálogos de sector primero (riesgo mínimo, valida fiabilidad del spec), CRM como segundo piloto de mayor valor real (ya excelente tipado manual contra el cual comparar).
7. **¿Qué debe corregirse antes de conectar la URL OpenAPI?** Como mínimo: acordar la convención de paginación por endpoint con backend, y decidir la forma garantizada de las relaciones condicionales de `Order` (`customer`/`transport`/`incoterm`).
8. **¿Qué patrón actual del frontend sería más difícil de migrar?** El servicio legacy de pedidos (`src/services/orderService.ts`, 915 líneas, 18+ métodos de negocio no-CRUD) y el subsistema de palets sin TanStack Query (`usePallet.ts` y sus sub-hooks) — ambos mezclan lógica de negocio real con acceso a datos de forma que un cliente generado no puede sustituir directamente.
9. **¿Conviene generar solo tipos al principio o también hooks?** Solo tipos al principio, y solo para los módulos piloto recomendados — generar hooks ya implicaría decidir dónde encaja la invalidación/optimistic-update manual existente, lo cual todavía no está resuelto arquitectónicamente (doble capa genérica, `usePallet.ts` sin react-query).
10. **¿Qué resultado esperarías al ejecutar una primera generación con Orval?** Probablemente tipos limpios y utilizables para catálogos/CRM/producción; para Order/Pallet/Customer, es plausible que el generador produzca uniones o formas que no coincidan con lo que el frontend consume hoy en la práctica (dado que el propio frontend ya normaliza inconsistencias que sugieren que el spec tampoco captura bien esas entidades) — la primera generación debería tratarse como un experimento de comparación, no como una sustitución directa.

---

## Nota metodológica

Este informe se elaboró mediante lectura directa de código (`Read`/`Grep`/`Bash` de solo lectura), ejecución de `npm run type-check` y `npm run test:run` (ambos de solo lectura, sin instalar ni modificar dependencias), y sin ninguna llamada a servicios externos. No se ha modificado, formateado, ni corregido ningún archivo del repositorio salvo la creación de este propio informe.
