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
- `gap_principal`: consolidar mejor la frontera entre shell server/client y seguir reduciendo dispersión entre layout global, layouts por rol y primitivas compartidas
- `notas_provisionales`:
  - todavía conviven patrones distintos de shell entre áreas (`admin`, `comercial`, `field`, `external`, `superadmin`)
  - el repo usa App Router, pero gran parte del árbol sigue resolviendo mucho trabajo en cliente
  - la consistencia visual base es razonable, pero necesita seguir ordenándose como plataforma y no solo como colección de componentes
- `notas_cerradas`:
  - existe un shell global claro con `ThemeProvider`, `SessionProvider`, `QueryClientProvider` y capa común de toasts
  - hay layouts diferenciados por áreas funcionales ya integrados en `src/app`
  - el design system base y la infraestructura PWA ya forman parte del núcleo del frontend
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
- `gap_principal`: cerrar la documentación y el criterio operativo alrededor de sesión, visibilidad por rol y dependencias entre middleware, layouts protegidos y redirecciones client-side
- `notas_provisionales`:
  - la base es sólida, pero sigue siendo sensible a regresiones de flujo entre middleware, `page.js` y layouts por rol
  - cualquier cambio en cookies, dominio o llamada a `/me` debe revisarse junto al bloque de network/cross-origin
- `notas_cerradas`:
  - el frontend ya trabaja con login por magic link/OTP y sesión basada en NextAuth
  - el middleware y la visibilidad por rol existen y están repartidos en puntos claros del repo
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
- `gap_principal`: unificar el criterio operativo de network/auth cross-origin y hacerlo parte explícita del circuito, no troubleshooting aislado
- `notas_provisionales`:
  - hay buena base técnica en `fetchWithTenant` y `getCurrentTenant`, pero faltaba un documento maestro integrado en el circuito
  - sigue habiendo riesgo de diagnósticos incompletos cuando el fallo real está entre frontend, proxy y backend
  - cualquier flujo con cookies, subdominios o sesión browser-side debe revisarse aquí
- `notas_cerradas`:
  - el frontend ya inyecta tenant en llamadas y usa utilidades compartidas para resolver dominio/tenant
  - hay señales claras de integración multi-tenant tanto en middleware como en hooks y servicios
- `dependencias_o_riesgos`:
  - un error en este bloque puede aparentar ser bug de auth, de permisos o de UX cuando en realidad es un problema cross-origin
- `referencias_clave`:
  - `src/lib/fetchWithTenant.js`
  - `src/lib/utils/getCurrentTenant.ts`
  - `docs/prompts/frontend-circuit/04-network-cors-auth-cross-origin-frontend.md`

### 4. Admin core y CRUD compartido

- `bloque`: Admin core y CRUD compartido
- `alcance`: `admin/*`, `EntityClient`, `entitiesConfig`, formularios y servicios compartidos, patrones CRUD y listados base
- `puntuacion_actual`: `7/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: seguir desacoplando el core compartido de admin de componentes/herramientas legacy demasiado grandes y reducir variación de patrones entre entidades
- `notas_provisionales`:
  - el admin comparte bastante infraestructura, pero todavía hay peso grande en componentes heredados y mezcla de patrones JS/TS
  - la convivencia entre hooks query-driven y zonas más manuales aún no es totalmente homogénea
- `notas_cerradas`:
  - existe un núcleo reutilizable de CRUD y configuración de entidades
  - hay una capa de servicios y hooks suficientemente madura para no tratar cada gestor como una isla
- `dependencias_o_riesgos`:
  - este bloque condiciona consistencia, velocidad de mantenimiento y facilidad de incorporar nuevas entidades
- `referencias_clave`:
  - `src/configs/entitiesConfig.js`
  - `src/components/Admin`
  - `src/services/domain`

### 5. Comercial CRM y ventas

- `bloque`: Comercial CRM y ventas
- `alcance`: `src/app/comercial`, CRM, prospectos, clientes, ofertas, pedidos comerciales, agenda y rutas comerciales asociadas
- `puntuacion_actual`: `8/10`
- `objetivo`: `9/10`
- `estado`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: consolidar el bloque como feature coherente y seguir cerrando inconsistencias entre UI comercial, fetch/cache y reglas de flujo entre CRM, pedidos y rutas
- `notas_provisionales`:
  - el bloque ya tiene cobertura funcional amplia, pero necesita vigilar consistencia entre submódulos recién crecidos
  - conviene seguir revisando permisos, copy operativo y flujos críticos de uso diario
- `notas_cerradas`:
  - el área comercial ya existe como superficie propia con layouts, páginas, hooks y componentes dedicados
  - hay uso real de React Query y tipos en varios subflujos de CRM y ventas
- `dependencias_o_riesgos`:
  - se cruza con auth por rol, catálogos, clientes, ofertas, pedidos y ejecución en movilidad
- `referencias_clave`:
  - `src/app/comercial`
  - `src/components/Comercial`
  - `src/hooks/useProspects.ts`

### 6. Field y rutas en movilidad

- `bloque`: Field y rutas en movilidad
- `alcance`: `src/app/field`, ejecución de rutas, pedidos en campo, autoventa y superficies móviles del rol de campo
- `puntuacion_actual`: `7/10`
- `objetivo`: `9/10`
- `estado`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reforzar cohesión del bloque como feature de movilidad, con foco en UX operativa, permisos y estabilidad del flujo en ruta
- `notas_provisionales`:
  - el bloque tiene piezas claras, pero todavía necesita consolidación documental y de circuito al mismo nivel que áreas más antiguas
  - cualquier mejora aquí debe mirar de cerca rendimiento percibido, fetch en red variable y continuidad del flujo
- `notas_cerradas`:
  - existe un área field separada del admin y del comercial
  - ya hay hooks y componentes específicos para rutas, pedidos y autoventa
- `dependencias_o_riesgos`:
  - impacta directamente flujos críticos en movilidad, visibilidad por rol y llamadas API desde contexto cliente
- `referencias_clave`:
  - `src/app/field`
  - `src/components/Field`
  - `src/hooks/useFieldOrders.ts`

### 7. Almacén, stock y operaciones físicas

- `bloque`: Almacén, stock y operaciones físicas
- `alcance`: stores, pallets, recepciones, dispatches, warehouse, operator, flujos físicos y operaciones de stock
- `puntuacion_actual`: `8/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: seguir bajando complejidad en flujos físicos de alto impacto y asegurar consistencia entre admin, warehouse y operator
- `notas_provisionales`:
  - es uno de los bloques con más criticidad operativa y con más riesgo de deuda por tamaño de UI
  - necesita vigilancia continua en permisos, feedback de usuario y rendimiento de listados/acciones
- `notas_cerradas`:
  - el bloque tiene ya hooks de datos, stats y formularios específicos
  - existe separación entre superficies de almacén admin y operario
- `dependencias_o_riesgos`:
  - cualquier regresión aquí afecta operaciones físicas y flujos de negocio diarios
- `referencias_clave`:
  - `src/app/warehouse`
  - `src/app/operator`
  - `src/components/Warehouse`

### 8. Producción, trazabilidad y etiquetas

- `bloque`: Producción, trazabilidad y etiquetas
- `alcance`: producciones, diagramas, consumos, registros, raw material flows vinculados, label editor y trazabilidad visual/documental
- `puntuacion_actual`: `8/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reducir complejidad residual en gestores pesados y terminar de consolidar la relación entre producción, trazabilidad y herramientas de etiquetado
- `notas_provisionales`:
  - producción avanzó mucho, pero sigue siendo sensible a componentes grandes y flujos densos
  - el editor de etiquetas y las vistas de producción no deben evaluarse como piezas aisladas, sino como parte del mismo ecosistema de trazabilidad
- `notas_cerradas`:
  - ya existe infraestructura específica para producción y diagramas
  - hay histórico reciente de mejora en React Query, tipado y descomposición de piezas complejas
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
- `gap_principal`: mantener homogeneidad entre flujos de fichaje, validaciones, feedback operativo y consistencia entre herramientas del bloque
- `notas_provisionales`:
  - el bloque parece maduro, pero conviene revisar periódicamente UX crítica y acoplamiento con contexto de sesión y permisos
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
- `puntuacion_actual`: `7/10`
- `objetivo`: `9/10`
- `estado`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: consolidar este bloque como superficie de plataforma diferenciada, con criterios claros de permisos, estados operativos y mantenimiento
- `notas_provisionales`:
  - el bloque ya es visible y funcional, pero todavía debe madurar como área de plataforma con su propio estándar documental y de control de riesgos
  - cualquier cambio aquí debe revisar seguridad, impersonation y aislamiento entre tenants
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
- `alcance`: orquestador, CMR/manual, market-data-extractor, chat AI, integraciones documentales y módulos que no encajan limpiamente en los bloques anteriores
- `puntuacion_actual`: `6/10`
- `objetivo`: `9/10`
- `estado`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: ordenar el conjunto de módulos especializados con una taxonomía de producto más clara y menos dependencia de documentación dispersa o transitoria
- `notas_provisionales`:
  - aquí vive la mayor heterogeneidad documental y funcional del repo
  - varios submódulos tienen planes, prompts o documentos de transición más que circuito consolidado
  - este bloque debe usarse para priorizar qué módulos especializados merecen subir al mismo nivel de madurez que las áreas core
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
