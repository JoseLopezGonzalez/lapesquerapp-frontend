# Fuente de verdad de bloques y puntuaciones del frontend

## Propósito

Este documento es la fuente principal de verdad del circuito de auditoría e implementación del frontend.

Se usa para:

- definir bloques funcionales reales del frontend
- registrar puntuación actual y objetivo
- fijar estado y fecha de revisión
- capturar el gap principal de cada bloque
- separar notas provisionales de notas cerradas

## Reglas de uso

- Escala única: `0-10`
- Objetivo por defecto: `9/10`
- Estados válidos: `sin revisar`, `auditado`, `en mejora`, `cerrado`, `bloqueado`
- Toda auditoría o mejora por bloque debe actualizar este documento
- Ningún scoreboard auxiliar sustituye esta fuente

## Bloques

### 1. Plataforma base y shell

- `bloque`: Plataforma base y shell
- `alcance`: `src/app/layout.js`, `src/app/ClientLayout.js`, layouts por rol, providers globales, boundaries globales, navegación compartida, tema, PWA base, `src/components/ui`, `src/components/Providers`, shell visual y de interacción común
- `puntuacion_actual`: `7/10`
- `objetivo`: `9/10`
- `estado`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reducir client-heavy shell y homogeneizar layouts por área sin depender tanto de wrappers cliente con `force-dynamic`
- `notas_provisionales`:
  - el shell global está bien armado, pero el frontend sigue muy apoyado en Client Components
  - las áreas `admin`, `comercial`, `field`, `external` y `superadmin` resuelven layout con estrategias próximas, pero no plenamente unificadas
  - hay buena base de design system, aunque todavía conviven patrones visuales y de navegación con distinta madurez
- `notas_cerradas`:
  - `ClientLayout` centraliza QueryClient, sesión, tema, toasts y providers globales
  - hay layouts diferenciados por áreas funcionales ya integrados en `src/app`
  - el sistema de branding ya alimenta metadata y PWA en el layout raíz
- `dependencias_o_riesgos`:
  - cambios aquí impactan navegación, carga global, accesibilidad, percepción de rendimiento y consistencia visual
- `referencias_clave`:
  - `src/app/layout.js`
  - `src/app/ClientLayout.js`
  - `src/components/ui`

### 2. Auth, sesión y autorización

- `bloque`: Auth, sesión y autorización
- `alcance`: login OTP/magic link, verify flow, NextAuth, middleware, guards, protección de rutas, redirecciones por rol, visibilidad y sesión
- `puntuacion_actual`: `8/10`
- `objetivo`: `9/10`
- `estado`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: consolidar el mapa completo de auth entre NextAuth, middleware, portal externo y área superadmin, y preparar la migración de `middleware` a `proxy`
- `notas_provisionales`:
  - la auth principal está bien resuelta, pero el modelo global de acceso está fragmentado por actor y superficie
  - `/superadmin` queda fuera del middleware principal y usa otro circuito de token
- `notas_cerradas`:
  - el frontend ya trabaja con login por magic link/OTP y sesión basada en NextAuth
  - el refresh contra `/me` y la protección por rol están integrados en la superficie principal
  - hay rutas y layouts específicos para áreas con perfiles distintos
- `dependencias_o_riesgos`:
  - se cruza con network/CORS, multi-tenant, cookies, redirecciones y permisos
- `referencias_clave`:
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/middleware.ts`
  - `docs/11-autenticacion-autorizacion.md`

### 3. Integración backend, multi-tenant y cross-origin

- `bloque`: Integración backend, multi-tenant y cross-origin
- `alcance`: `fetchWithTenant`, tenant resolution, headers, `X-Tenant`, `Authorization`, configuración API, cookies, dominios, subdominios, CORS y auth flow entre frontend y backend
- `puntuacion_actual`: `7/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reducir dependencias implícitas de tenant/defaults y ordenar mejor la frontera entre servicios, hooks y lógica browser-side de auth/cross-origin
- `notas_provisionales`:
  - `fetchWithTenant` resuelve bien el caso base, pero mezcla resolución de tenant, normalización de headers y manejo de auth errors
  - el repo sigue teniendo llamadas directas a `fetchWithTenant` fuera de una capa más uniforme
  - cualquier cambio de dominios, cookies o subdominios sigue teniendo impacto transversal
- `notas_cerradas`:
  - el frontend ya inyecta tenant en llamadas y usa utilidades compartidas para resolver dominio/tenant
  - hay señales claras de integración multi-tenant tanto en middleware como en hooks y servicios
- `dependencias_o_riesgos`:
  - un error en este bloque puede aparentar ser bug de auth, de permisos o de UX cuando en realidad es un problema cross-origin
- `referencias_clave`:
  - `src/lib/fetchWithTenant.js`
  - `src/lib/utils/getCurrentTenant.ts`
  - `docs/prompts/16-network-cors-auth-cross-origin-frontend.md`

### 4. Admin core y CRUD compartido

- `bloque`: Admin core y CRUD compartido
- `alcance`: `admin/*`, `EntityClient`, `entitiesConfig`, formularios y servicios compartidos, patrones CRUD y listados base
- `puntuacion_actual`: `6/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: partir hotspots legacy del admin core y reducir el peso estructural de `entitiesConfig` y gestores compartidos todavía demasiado grandes
- `notas_provisionales`:
  - `src/configs/entitiesConfig.js` sigue siendo un núcleo enorme y muy cargado
  - el patrón compartido existe, pero la experiencia real del bloque aún depende de piezas grandes y heterogéneas
  - el paso a hooks query-driven no ha eliminado del todo la complejidad de los gestores legacy
- `notas_cerradas`:
  - existe un núcleo reutilizable de configuración, servicios y CRUD suficiente para que el admin no sea un conjunto de páginas aisladas
- `dependencias_o_riesgos`:
  - este bloque condiciona consistencia, velocidad de mantenimiento y facilidad de incorporar nuevas entidades
- `referencias_clave`:
  - `src/configs/entitiesConfig.js`
  - `src/components/Admin`
  - `src/services/domain`

### 5. Comercial CRM y ventas

- `bloque`: Comercial CRM y ventas
- `alcance`: `src/app/comercial`, CRM, prospectos, clientes, ofertas, pedidos comerciales, agenda y rutas comerciales asociadas
- `puntuacion_actual`: `9/10`
- `objetivo`: `9/10`
- `estado`: `cerrado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: mantener la disciplina de extracción en los subflujos CRM restantes sin reintroducir transforms inline ni depender de pantallas contenedor demasiado grandes
- `notas_provisionales`:
  - `RoutesPlannerPage` sigue siendo una pantalla importante del bloque y conviene seguir partiéndola por secciones funcionales si el alcance crece
  - quedan otras superficies CRM grandes, como detalle de prospectos y algunos gestores heredados, que deberían seguir la misma filosofía
- `notas_cerradas`:
  - el área comercial ya existe como superficie propia con layouts, páginas, hooks y componentes dedicados
  - hay uso real de React Query y tipos en varios subflujos de CRM y ventas
  - la planificación de rutas comercial ahora consume una capa compartida de normalización y serialización en `src/lib/routes/routeStops.ts`
  - el cálculo de geometría de ruta se ha extraído a `src/hooks/useRouteGeometry.ts`, reduciendo trabajo síncrono y efectos duplicados en el planner
  - `useRoutes`, `useRouteTemplates` y `useComercialOrders` quedaron más alineados con servicios compartidos y con transforms fuera de la UI principal
  - `AgendaPageClient` y `CustomersPageClient` reducen recomputaciones evitables al mover conteos y ordenaciones a `useMemo`
  - la identidad temporal de paradas ya no depende de ids efímeros generados en cada normalización, lo que estabiliza reorder, firmas y trabajo derivado
  - la carga de drafts seleccionados del planner se ha sacado a un hook específico, reduciendo responsabilidad del contenedor principal
  - `ComercialOrdersManager` ya delega enriquecimiento, visibilidad de categorías y ordenación a helpers puros reutilizables
- `dependencias_o_riesgos`:
  - se cruza con auth por rol, catálogos, clientes, ofertas, pedidos y ejecución en movilidad
- `referencias_clave`:
  - `src/app/comercial`
  - `src/components/Comercial`
  - `src/components/Comercial/Routes/RoutesPlannerPage.jsx`
  - `src/hooks/useRoutes.ts`
  - `src/hooks/useComercialOrders.ts`

### 6. Field y rutas en movilidad

- `bloque`: Field y rutas en movilidad
- `alcance`: `src/app/field`, ejecución de rutas, pedidos en campo, autoventa y superficies móviles del rol de campo
- `puntuacion_actual`: `9/10`
- `objetivo`: `9/10`
- `estado`: `cerrado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: mantener la misma disciplina de extracción y contratos consistentes en nuevas superficies móviles que entren en el bloque
- `notas_provisionales`:
  - conviene seguir ampliando la cobertura automatizada de field si se tocan más mutaciones operativas o flujos de autoventa
  - `FieldOrderExecutionPage` aún es una pantalla grande, aunque ya descarga parte de la lógica crítica en helpers reutilizables
- `notas_cerradas`:
  - existe un área field separada del admin y del comercial
  - ya hay hooks y componentes específicos para rutas, pedidos y autoventa
  - `FieldRouteExecutionPage` ya no recalcula inline geocoding y directions con una cadena propia de efectos, sino que reutiliza la misma capa compartida del planner comercial
  - `useFieldRoutes` y `useFieldOrders` comparten convenciones más limpias de query keys e invalidación, reduciendo recargas amplias entre rutas y pedidos
  - la mutación de parada en field actualiza detalle cacheado y refresca el listado bajo claves unificadas
  - los hooks de field ahora exponen un contrato consistente con `error` raw y `errorMessage`, eliminando consumos ambiguos de `error.message`
  - `FieldOrdersPage` y `FieldRoutesListPage` ya consumen el nuevo contrato de error sin depender de shapes implícitos
  - `FieldOrderExecutionPage` delega agregación, validación y construcción de payload a helpers puros, reduciendo lógica inline en el wizard
  - el flujo de ejecución de ruta ya extrae el estado de stops/foco/refresh tras mutación a un hook local reutilizable
- `dependencias_o_riesgos`:
  - impacta directamente flujos críticos en movilidad, visibilidad por rol y llamadas API desde contexto cliente
- `referencias_clave`:
  - `src/app/field`
  - `src/components/Field`
  - `src/components/Field/FieldRouteExecutionPage.jsx`
  - `src/hooks/useFieldRoutes.ts`
  - `src/hooks/useFieldOrders.ts`

### 7. Almacén, stock y operaciones físicas

- `bloque`: Almacén, stock y operaciones físicas
- `alcance`: stores, pallets, recepciones, dispatches, warehouse, operator, flujos físicos y operaciones de stock
- `puntuacion_actual`: `7/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reducir complejidad de formularios y vistas críticas de stock/recepción y recuperar una base de tests completamente verde en helpers operativos
- `notas_provisionales`:
  - este bloque concentra algunos de los archivos más grandes del repo, incluyendo `PalletView`, `EditReceptionForm` y formularios operarios
  - la suite actual falla en `src/__tests__/helpers/receptionCalculations.test.js`, lo que debilita la confianza en una parte sensible del bloque
  - el warning de `act(...)` en hooks relacionados indica margen de mejora en estabilidad de tests
- `notas_cerradas`:
  - el bloque tiene ya hooks de datos, stats y separación entre superficies admin/operator/warehouse
- `dependencias_o_riesgos`:
  - cualquier regresión aquí afecta operaciones físicas y flujos de negocio diarios
- `referencias_clave`:
  - `src/app/warehouse`
  - `src/app/operator`
  - `src/components/Warehouse`

### 8. Producción, trazabilidad y etiquetas

- `bloque`: Producción, trazabilidad y etiquetas
- `alcance`: producciones, diagramas, consumos, registros, raw material flows vinculados, label editor y trazabilidad visual/documental
- `puntuacion_actual`: `7/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: bajar el peso de los gestores de producción y cerrar la brecha entre hooks modernos y componentes todavía muy voluminosos
- `notas_provisionales`:
  - `ProductionOutputsManager`, `ProductionView`, `ProductionOutputConsumptionsManager` y otros gestores siguen siendo muy grandes
  - `useProductionDetail` ya usa React Query, pero aún refleja workarounds de backend (`500`) y complejidad residual
  - el ecosistema producción-etiquetas está mejor que antes, pero todavía exige descomposición adicional
- `notas_cerradas`:
  - ya existe infraestructura específica para producción, diagramas, hooks modernos y tipos dedicados
- `dependencias_o_riesgos`:
  - alto cruce con stock, documentos, impresiones y UX crítica de operación
- `referencias_clave`:
  - `src/app/admin/productions`
  - `src/components/Admin/Productions`
  - `src/types/labelEditor.ts`

### 9. Gestión horaria y operarios

- `bloque`: Gestión horaria y operarios
- `alcance`: punches, manual punches, NFC, calendarios, time-punch-manager, nfc-punch-manager y experiencia operativa asociada
- `puntuacion_actual`: `8/10`
- `objetivo`: `9/10`
- `estado`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: seguir afinando feedback operativo, tipado y tamaño de gestores puntuales sin perder simplicidad de uso
- `notas_provisionales`:
  - el bloque está razonablemente sólido, pero aún mezcla JS con patrones modernos de React Query
  - conviene reforzar cobertura de tests más cercana al flujo de usuario
- `notas_cerradas`:
  - existe un conjunto claro de hooks, formularios y gestores para gestión horaria
  - hay evolución real hacia patrones más consistentes de fetch y validación
- `dependencias_o_riesgos`:
  - impacta operativa diaria y percepción inmediata de fiabilidad
- `referencias_clave`:
  - `src/app/admin/manual-punches`
  - `src/app/admin/time-punch-manager`
  - `src/app/admin/nfc-punch-manager`

### 10. Superadmin y tenant operations

- `bloque`: Superadmin y tenant operations
- `alcance`: `superadmin/*`, tenants, alerts, impersonation, status, operaciones de plataforma y health de tenants
- `puntuacion_actual`: `6/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: consolidar superadmin como superficie de plataforma con auth, cache, branding y criterios de estado más homogéneos con el resto del frontend
- `notas_provisionales`:
  - `fetchSuperadmin` usa `sessionStorage` y `fetch` manual en lugar de integrarse con la estrategia general del frontend
  - `src/app/superadmin/layout.js` mantiene metadata hardcodeada a `PesquerApp`
  - es una superficie funcional, pero todavía más artesanal que el resto del producto
- `notas_cerradas`:
  - ya existe un área superadmin con layout, páginas y componentes específicos
  - hay una API separada para superadmin sin `X-Tenant`
- `dependencias_o_riesgos`:
  - toca operaciones de tenant, impersonation, seguridad y visibilidad avanzada
- `referencias_clave`:
  - `src/app/superadmin`
  - `src/components/Superadmin`
  - `src/lib/superadminApi.js`

### 11. Flujos documentales y módulos especializados

- `bloque`: Flujos documentales y módulos especializados
- `alcance`: orquestador, CMR/manual, market-data-extractor, chat AI, portal `external/*`, integraciones documentales y módulos que no encajan limpiamente en los bloques anteriores
- `puntuacion_actual`: `5/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: ordenar la taxonomía y la deuda estructural de módulos especializados, incluyendo orquestador, extractor documental y portal externo
- `notas_provisionales`:
  - `OrquestadorView` sigue siendo una pieza muy grande y todavía apoyada en mock state
  - el portal `external/*` existe y hoy no está bien reflejado en la taxonomía viva de bloques
  - esta sigue siendo la zona más heterogénea del repo en documentación, madurez y patrones
- `notas_cerradas`:
  - el repo ya contiene módulos especializados reales, no solo ideas o prototipos
  - el circuito nuevo reconoce este espacio sin forzarlo artificialmente dentro del admin core
- `dependencias_o_riesgos`:
  - alto riesgo de dispersión documental y de soluciones muy específicas si no se gobierna por bloque
- `referencias_clave`:
  - `src/app/admin/orquestador`
  - `src/app/admin/cmr-manual`
  - `src/app/admin/market-data-extractor`

## Política sobre secundarios

Pueden existir logs, análisis o scoreboards secundarios para una iniciativa concreta, pero siempre quedan por debajo de esta fuente de verdad.

Si un documento secundario contradice este archivo, debe actualizarse o archivarse.
