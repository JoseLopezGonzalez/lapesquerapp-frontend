# Auditoría global del frontend

**Fecha**: 2026-03-23  
**Prompt rector**: `docs/prompts/12-prompt-auditoria-principal-frontend.md`  
**Fuente de verdad**: `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`

## Alcance auditado

- Tipo: auditoría global
- Bloques revisados: los 11 bloques actuales de la fuente central
- Capas revisadas: `src/app`, `src/components`, `src/hooks`, `src/services`, `src/lib`, `src/configs`
- Validación ejecutada:
  - `npm run test:run` -> **1 fichero fallido, 2 tests fallidos, 173 tests en verde**
  - `npm run build` -> **no concluyente**; una segunda ejecución quedó bloqueada por `.next/lock` porque había otra build en curso

## Hallazgos principales

### Hallazgos transversales

1. **La base técnica ha mejorado de forma real respecto al circuito antiguo, pero el frontend sigue siendo muy client-heavy.**
   - Evidencia: `@tanstack/react-query` ya está integrado y hay hooks query-driven, pero el repo mantiene **447 archivos con `use client`** y muchos layouts por área delegan inmediatamente a wrappers cliente con `force-dynamic`.

2. **La adopción de TypeScript y tests ya no está en un estado “mínimo”, pero sigue siendo minoritaria frente al volumen total del repo.**
   - Evidencia: `129` archivos `.ts/.tsx` frente a `743` `.js/.jsx`; `26` archivos de test.

3. **Siguen existiendo hotspots de mantenibilidad muy claros.**
   - Evidencia: `30` archivos por encima de `30 KB`, incluyendo `entitiesConfig.js`, `PalletView`, formularios de recepciones, producción, rutas comerciales, orquestador y hooks muy grandes.

4. **La integración multi-tenant/cross-origin tiene una base clara, pero aún depende de convenciones implícitas y defaults delicados.**
   - Evidencia: `fetchWithTenant` fija defaults de tenant (`brisamar` en servidor, `dev` en local), hay `46` usos de `getCurrentTenant`, y todavía hay `fetchWithTenant` directo en hooks/componentes.

5. **La plataforma de auth está funcional, pero fragmentada entre varios modelos.**
   - Evidencia: NextAuth + middleware para el área principal, portal externo con actor externo, y superadmin con cliente propio basado en `sessionStorage` y `fetch` manual. Además, Next ya avisa de deprecación de `middleware` en favor de `proxy`.

### Hallazgos por bloque

- **Admin core / almacén / producción** concentran la mayor deuda de tamaño y heterogeneidad.
- **Superadmin** es coherente como superficie separada, pero está menos consolidado que el resto en auth, branding y cache.
- **Módulos especializados** siguen siendo la zona más dispersa y donde la taxonomía actual se queda más corta.

## Evaluación por bloque revisado

### Plataforma base y shell

- `bloque`: Plataforma base y shell
- `puntuacion_anterior`: `7/10`
- `puntuacion_propuesta`: `7/10`
- `estado_propuesto`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reducir client-heavy shell y homogeneizar layouts por área sin depender tanto de wrappers cliente con `force-dynamic`
- `notas_provisionales`:
  - el shell global está bien armado, pero el frontend sigue muy apoyado en Client Components
  - las áreas `admin`, `comercial`, `field`, `external` y `superadmin` resuelven layout con estrategias próximas, pero no plenamente unificadas
  - hay buena base de design system, aunque todavía conviven patrones visuales y de navegación con distinta madurez
- `notas_cerradas`:
  - `ClientLayout` centraliza QueryClient, sesión, tema, toasts y providers globales
  - el sistema de branding ya alimenta metadata y PWA en el layout raíz

### Auth, sesión y autorización

- `bloque`: Auth, sesión y autorización
- `puntuacion_anterior`: `8/10`
- `puntuacion_propuesta`: `8/10`
- `estado_propuesto`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: consolidar el mapa completo de auth entre NextAuth, middleware, portal externo y área superadmin, y preparar la migración de `middleware` a `proxy`
- `notas_provisionales`:
  - la auth principal está bien resuelta, pero el modelo global de acceso está fragmentado por actor y superficie
  - `/superadmin` queda fuera del middleware principal y usa otro circuito de token
- `notas_cerradas`:
  - OTP/magic link, refresh contra `/me` y protección por rol están integrados en la superficie principal

### Integración backend, multi-tenant y cross-origin

- `bloque`: Integración backend, multi-tenant y cross-origin
- `puntuacion_anterior`: `7/10`
- `puntuacion_propuesta`: `7/10`
- `estado_propuesto`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reducir dependencias implícitas de tenant/defaults y ordenar mejor la frontera entre servicios, hooks y lógica browser-side de auth/cross-origin
- `notas_provisionales`:
  - `fetchWithTenant` resuelve bien el caso base, pero mezcla resolución de tenant, normalización de headers y manejo de auth errors
  - el repo sigue teniendo llamadas directas a `fetchWithTenant` fuera de una capa más uniforme
  - cualquier cambio de dominios, cookies o subdominios sigue teniendo impacto transversal
- `notas_cerradas`:
  - la infraestructura multi-tenant del frontend es real y consistente en gran parte de hooks, middleware y servicios

### Admin core y CRUD compartido

- `bloque`: Admin core y CRUD compartido
- `puntuacion_anterior`: `7/10`
- `puntuacion_propuesta`: `6/10`
- `estado_propuesto`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: partir hotspots legacy del admin core y reducir el peso estructural de `entitiesConfig` y gestores compartidos todavía demasiado grandes
- `notas_provisionales`:
  - `src/configs/entitiesConfig.js` sigue siendo un núcleo enorme y muy cargado
  - el patrón compartido existe, pero la experiencia real del bloque aún depende de piezas grandes y heterogéneas
  - el paso a hooks query-driven no ha eliminado del todo la complejidad de los gestores legacy
- `notas_cerradas`:
  - existe una capa reutilizable de configuración, servicios y CRUD suficiente para que el admin no sea un conjunto de páginas aisladas

### Comercial CRM y ventas

- `bloque`: Comercial CRM y ventas
- `puntuacion_anterior`: `8/10`
- `puntuacion_propuesta`: `8/10`
- `estado_propuesto`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: seguir consolidando el bloque como feature coherente y reducir hotspots grandes como planificación de rutas o combinaciones mixtas de hooks/queries inline
- `notas_provisionales`:
  - el bloque está bien encaminado y usa React Query de forma real
  - todavía hay piezas de bastante tamaño, como `RoutesPlannerPage`, que tensionan mantenibilidad
- `notas_cerradas`:
  - CRM, ofertas, pedidos, agenda y rutas comerciales ya forman una superficie clara y separada

### Field y rutas en movilidad

- `bloque`: Field y rutas en movilidad
- `puntuacion_anterior`: `7/10`
- `puntuacion_propuesta`: `7/10`
- `estado_propuesto`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reforzar estabilidad y percepción de ligereza del bloque móvil, especialmente en flujos reales de ruta y autoventa
- `notas_provisionales`:
  - la estructura funcional del bloque es clara, pero sigue muy orientada a cliente y con poca validación automatizada específica del área
  - conviene vigilar rendimiento percibido y continuidad del flujo en entornos de red variable
- `notas_cerradas`:
  - el bloque tiene layouts, páginas, hooks y componentes propios

### Almacén, stock y operaciones físicas

- `bloque`: Almacén, stock y operaciones físicas
- `puntuacion_anterior`: `8/10`
- `puntuacion_propuesta`: `7/10`
- `estado_propuesto`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: reducir complejidad de formularios y vistas críticas de stock/recepción y recuperar una base de tests completamente verde en helpers operativos
- `notas_provisionales`:
  - este bloque concentra algunos de los archivos más grandes del repo, incluyendo `PalletView`, `EditReceptionForm` y formularios operarios
  - la suite actual falla en `src/__tests__/helpers/receptionCalculations.test.js`, lo que debilita la confianza en una parte sensible del bloque
  - el warning de `act(...)` en hooks relacionados indica margen de mejora en estabilidad de tests
- `notas_cerradas`:
  - el bloque cuenta con hooks de datos, stats y separación entre superficies admin/operator/warehouse

### Producción, trazabilidad y etiquetas

- `bloque`: Producción, trazabilidad y etiquetas
- `puntuacion_anterior`: `8/10`
- `puntuacion_propuesta`: `7/10`
- `estado_propuesto`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: bajar el peso de los gestores de producción y cerrar la brecha entre hooks modernos y componentes todavía muy voluminosos
- `notas_provisionales`:
  - `ProductionOutputsManager`, `ProductionView`, `ProductionOutputConsumptionsManager` y otros gestores siguen siendo muy grandes
  - `useProductionDetail` ya usa React Query, pero aún refleja workarounds de backend (`500`) y complejidad residual
  - el ecosistema producción-etiquetas está mejor que antes, pero todavía exige descomposición adicional
- `notas_cerradas`:
  - producción y label editor ya tienen infraestructura específica, hooks modernos y tipos dedicados

### Gestión horaria y operarios

- `bloque`: Gestión horaria y operarios
- `puntuacion_anterior`: `8/10`
- `puntuacion_propuesta`: `8/10`
- `estado_propuesto`: `auditado`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: seguir afinando feedback operativo, tipado y tamaño de gestores puntuales sin perder simplicidad de uso
- `notas_provisionales`:
  - el bloque está razonablemente sólido, pero aún mezcla JS con patrones modernos de React Query
  - conviene reforzar cobertura de tests más cercana al flujo de usuario
- `notas_cerradas`:
  - el bloque usa hooks, mutaciones y pantallas operativas bastante coherentes

### Superadmin y tenant operations

- `bloque`: Superadmin y tenant operations
- `puntuacion_anterior`: `7/10`
- `puntuacion_propuesta`: `6/10`
- `estado_propuesto`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: consolidar superadmin como superficie de plataforma con auth, cache, branding y criterios de estado más homogéneos con el resto del frontend
- `notas_provisionales`:
  - `fetchSuperadmin` usa `sessionStorage` y `fetch` manual en lugar de integrarse con la estrategia general del frontend
  - `src/app/superadmin/layout.js` mantiene metadata hardcodeada a `PesquerApp`
  - es una superficie funcional, pero todavía más artesanal que el resto del producto
- `notas_cerradas`:
  - el área superadmin ya existe como módulo separado y con cliente API dedicado

### Flujos documentales y módulos especializados

- `bloque`: Flujos documentales y módulos especializados
- `puntuacion_anterior`: `6/10`
- `puntuacion_propuesta`: `5/10`
- `estado_propuesto`: `en mejora`
- `fecha_revision`: `2026-03-23`
- `gap_principal`: ordenar la taxonomía y la deuda estructural de módulos especializados, incluyendo orquestador, extractor documental y portal externo
- `notas_provisionales`:
  - `OrquestadorView` sigue siendo una pieza muy grande y todavía apoyada en mock state
  - el portal `external/*` existe y hoy no está bien reflejado en la taxonomía viva de bloques
  - la superficie especializada sigue siendo la más heterogénea en documentación, madurez y patrones
- `notas_cerradas`:
  - hay módulos especializados reales y activos, no simples borradores

## Riesgos de integración

- **Roles y visibilidad**: la matriz real de acceso se reparte entre middleware, layouts por rol, portal externo y superadmin.
- **Tenant resolution**: cualquier cambio en host/subdominio afecta query keys, `X-Tenant` y auth flows.
- **CORS / cookies / dominios / auth flow**: el circuito ya lo contempla, pero sigue siendo una zona transversal sensible.
- **Rendimiento percibido**: mucho árbol cliente y varios archivos gigantes hacen probable trabajo adicional para mejorar percepción de carga.
- **Cache e invalidación**: React Query ya está implantado, pero aún convive con piezas manuales y fetches directos.

## Siguiente acción recomendada

Priorizar el bloque **Almacén, stock y operaciones físicas**.

Razones:

- concentra deuda de tamaño en UI crítica
- ya tiene una señal objetiva de inestabilidad en tests
- afecta flujos de negocio diarios
- su mejora reduce riesgo operativo más rápido que seguir afinando bloques ya bastante sólidos

## Propuesta de writeback a la fuente central

- Mantener `7/10` en Plataforma base y shell, con gap centrado en client-heavy shell y homogeneización de layouts.
- Mantener `8/10` en Auth, sesión y autorización, con foco en consolidar modelos de auth y migración `middleware` -> `proxy`.
- Mantener `7/10` en Integración backend, multi-tenant y cross-origin, con foco en defaults y frontera servicios/hooks.
- Bajar Admin core y CRUD compartido a `6/10`.
- Mantener Comercial CRM y ventas en `8/10`.
- Mantener Field y rutas en movilidad en `7/10`.
- Bajar Almacén, stock y operaciones físicas a `7/10`.
- Bajar Producción, trazabilidad y etiquetas a `7/10`.
- Mantener Gestión horaria y operarios en `8/10`.
- Bajar Superadmin y tenant operations a `6/10`.
- Bajar Flujos documentales y módulos especializados a `5/10` e incluir explícitamente `external/*` dentro del alcance actual mientras no se cree un bloque propio.
