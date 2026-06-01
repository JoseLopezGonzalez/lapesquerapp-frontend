# Resumen Ejecutivo — Auditoría del bloque de extracción de datos de lonjas

**Fecha:** 2026-04-26
**Sistema auditado:** MarketDataExtractor (`src/components/Admin/MarketDataExtractor/`)
**Agentes participantes:** 10 roles completos
**Documentos generados:** `01` a `10` en este mismo directorio

---

> **Escala de notas:** 0 = fallo crítico / inexistente · 5 = funciona con problemas significativos · 10 = correcto, sin observaciones

---

## Auditoría 01 — Frontend Next.js Agent

| #   | Punto auditado                                              | Observación                                                                              | Nota |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---- |
| 1.1 | Entry point `MarketDataExtractor/index.js`                  | Limpio, sin lógica de negocio, Tabs correcto                                             | 9/10 |
| 1.2 | Directiva `'use client'`                                    | Declarada correctamente en componentes que la necesitan                                  | 8/10 |
| 1.3 | `DocumentProcessor.js` — contexto de ejecución              | Sin directiva ni comentario; ambiguo en App Router                                       | 6/10 |
| 1.4 | Separación lógica de negocio / UI (Cofra)                   | `generateExcelForA3erp` (150 líneas) vive en el componente UI, no en `cofraExportHelper` | 3/10 |
| 1.5 | Ubicación de `exportData.js`                                | Catálogos de datos de negocio dentro de subdirectorios de componentes (anti-patrón)      | 3/10 |
| 1.6 | Estructura de carpetas general                              | Coherente con el resto del proyecto; subdirectorios por tipo de documento                | 7/10 |
| 1.7 | Separación por capas (parsers / validators / exportHelpers) | Correcta y consistente                                                                   | 8/10 |
| 1.8 | Ruta de Next.js y protección de rol                         | No verificada en esta auditoría                                                          | 6/10 |

### Nota global: **6.3 / 10**

---

## Auditoría 02 — UI/Form System Agent

| #   | Punto auditado                               | Observación                                                                                    | Nota |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---- |
| 2.1 | Uso de React Hook Form / Zod                 | Ausencia justificada — el bloque no es un formulario CRUD                                      | 9/10 |
| 2.2 | Select de software de destino                | Sin validación; "Facilcom" y "Otros" seleccionables pero sin implementar                       | 2/10 |
| 2.3 | Feedback para opciones no implementadas      | Ninguno — el usuario no sabe por qué no ocurre nada                                            | 1/10 |
| 2.4 | Gestión de checkboxes de selección           | Correcto — disabled states, toggle all, inicialización                                         | 7/10 |
| 2.5 | Estado `isLoading` en generación de Excel    | Ausente — el botón "Exportar" no se deshabilita durante la generación                          | 5/10 |
| 2.6 | Dependencia del `useEffect` de validación    | `[groupedLinkedSummary.length]` — frágil si el array cambia de contenido sin cambiar de tamaño | 5/10 |
| 2.7 | Construcción de key de validación por fecha  | `date.split('/').reverse().join('-')` — frágil si el OCR entrega otro formato de fecha         | 3/10 |
| 2.8 | Mensaje de error "Sin compras seleccionadas" | Correcto — usa `notify.error` con título y descripción                                         | 8/10 |
| 2.9 | Botón "Enlazar" disabled durante validación  | Correcto                                                                                       | 9/10 |

### Nota global: **5.4 / 10**

---

## Auditoría 03 — API Client Agent

| #    | Punto auditado                                   | Observación                                                                                                 | Nota     |
| ---- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------- |
| 3.1  | **API key Azure expuesta en cliente**            | `NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY` visible en el bundle del navegador — riesgo activo de uso no autorizado | **0/10** |
| 3.2  | **Endpoint Azure expuesto en cliente**           | `NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT` también público                                                    | **1/10** |
| 3.3  | Uso de `fetchWithTenant` para API externa        | Añade `X-Tenant` a Azure; puede disparar logout si Azure devuelve 401                                       | 2/10     |
| 3.4  | Clasificación de errores Azure por string        | `error.message.includes('Azure')` — frágil; debería usarse clase `AzureError` custom                        | 3/10     |
| 3.5  | Mensaje de error HTTP (`statusText` vacío)       | `response.statusText` puede estar vacío en HTTP/2 — mensaje de error inútil                                 | 4/10     |
| 3.6  | Detección de rate limit 429                      | Regex sobre `error.message` — no detecta si Azure responde 429 como HTTP (no como excepción)                | 3/10     |
| 3.7  | Timeout / AbortController                        | Ausente — el polling corre hasta 45 intentos sin posibilidad de cancelación                                 | 1/10     |
| 3.8  | API version hardcodeada `2023-07-31`             | Debería estar en config, no en el código                                                                    | 4/10     |
| 3.9  | Manejo de errores en `linkService` / API interna | Correcto — usa `notify.error` con detalle por fila                                                          | 7/10     |
| 3.10 | Polling con retry y delays                       | Funcional para el caso normal; frágil en edge cases                                                         | 5/10     |

### Nota global: **3.0 / 10**

> ⚠️ Esta auditoría tiene dos items en 0-1/10 que representan riesgos activos en producción.

---

## Auditoría 04 — EntityClient Agent

| #   | Punto auditado                                   | Observación                                                                   | Nota |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------- | ---- |
| 4.1 | Decisión de no usar EntityClient                 | Correcta y justificada — el flujo no es un CRUD estándar                      | 9/10 |
| 4.2 | Ausencia de config en `entitiesConfig.js`        | Correcto — no debe añadirse config que no corresponde                         | 9/10 |
| 4.3 | Tablas propias (`<Table>` de shadcn)             | Correctas para el caso de uso                                                 | 8/10 |
| 4.4 | Acciones destructivas en tablas                  | Ninguna acción destructiva sin confirmación en las tablas del bloque          | 8/10 |
| 4.5 | Estado vacío inicial                             | Ausente — cuando no hay documentos no hay instrucciones para el usuario       | 3/10 |
| 4.6 | Protección de ruta y control de rol              | No verificada — requiere revisión de `src/app/admin/` y `navigationConfig.js` | 5/10 |
| 4.7 | Potencial uso futuro de EntityClient (historial) | Identificado como caso posible si el backend implementa el endpoint           | 7/10 |

### Nota global: **7.0 / 10**

---

## Auditoría 05 — Design System Agent

| #    | Punto auditado                                          | Observación                                                                               | Nota |
| ---- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---- |
| 5.1  | Uso de `Card`, `CardContent`, `CardHeader`, `CardTitle` | Correcto y consistente con el resto del proyecto                                          | 8/10 |
| 5.2  | Uso de `Table`, `TableHeader`, `TableBody`, etc.        | Correcto                                                                                  | 8/10 |
| 5.3  | Uso de `Dialog`, `DialogContent`, `DialogFooter`        | Correcto                                                                                  | 8/10 |
| 5.4  | Uso de `Tabs`, `TabsList`, `TabsTrigger`                | Correcto                                                                                  | 9/10 |
| 5.5  | Badges con colores hardcodeados                         | `bg-green-900 text-green-200` — colores Tailwind arbitrarios, no tokens del design system | 3/10 |
| 5.6  | Paleta blanco/negro forzada en vista de documento       | Intencional (aspecto de papel) pero sin comentario que lo explique                        | 5/10 |
| 5.7  | `<label>` HTML nativo en vez de `<Label>` shadcn        | Inconsistente con el resto del proyecto                                                   | 5/10 |
| 5.8  | Prop `size="4xl"` en `DialogContent`                    | No estándar en shadcn — puede perderse en actualizaciones del componente                  | 4/10 |
| 5.9  | Espaciado de tablas inconsistente (vista vs modal)      | `[&_th]:p-2` en vista; sin clases en ExportModal                                          | 5/10 |
| 5.10 | `alt` de imagen logo                                    | `alt="Logo"` — no descriptivo, accesibilidad deficiente                                   | 4/10 |

### Nota global: **5.9 / 10**

---

## Auditoría 06 — Frontend Performance Agent

| #   | Punto auditado                                       | Observación                                                                              | Nota     |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| 6.1 | `ListadoComprasLonjaDeIsla/exportData.js` en bundle  | 200+ barcos con todos sus datos cargados siempre — decenas de KB innecesarios            | **1/10** |
| 6.2 | Polling sin `AbortController`                        | El polling continúa en background si el usuario navega — peticiones y coste innecesarios | **1/10** |
| 6.3 | Concurrencia sin límite en modo masivo               | Múltiples PDFs → múltiples polling loops sin cola ni límite                              | 2/10     |
| 6.4 | `groupedLinkedSummary` recalculado sin `useMemo`     | `reduce` ejecutado en cada render para documentos con 50+ subastas                       | 5/10     |
| 6.5 | Import dinámico de `xlsx` y `file-saver`             | Correcto — no entran en el bundle principal                                              | 9/10     |
| 6.6 | Tiempo máximo de espera (45 × 5s = 3.75 min)         | Sin indicador de progreso parcial — el usuario no sabe si el proceso avanza              | 3/10     |
| 6.7 | `calculateImporteFromLinea` — doble cálculo por fila | Redundante pero impacto de CPU negligible para el volumen real de datos                  | 7/10     |
| 6.8 | Catálogos Cofra y ASOC en bundle                     | Menores en tamaño pero mismo anti-patrón que LonjaDeIsla                                 | 4/10     |

### Nota global: **4.0 / 10**

---

## Auditoría 07 — QA/UX Agent

| #    | Punto auditado                                                             | Observación                                                                              | Nota     |
| ---- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| 7.1  | Tests para `cofraExportHelper.js`                                          | **Ninguno** — módulo financiero crítico sin tests                                        | **0/10** |
| 7.2  | Tests para `lonjaDeIslaExportHelper.js`                                    | **Ninguno** — módulo financiero crítico sin tests                                        | **0/10** |
| 7.3  | Tests para `asocExportHelper.js`                                           | **Ninguno** — módulo financiero crítico sin tests                                        | **0/10** |
| 7.4  | Tests para `cofraParser.js`                                                | Ninguno                                                                                  | 1/10     |
| 7.5  | Tests para `asocParser.js`                                                 | Ninguno                                                                                  | 1/10     |
| 7.6  | Tests para `lonjaDeIslaParser.js`                                          | Ninguno                                                                                  | 1/10     |
| 7.7  | Tests para `cofraValidator.js`                                             | Ninguno                                                                                  | 1/10     |
| 7.8  | Tests para `asocValidator.js`                                              | Ninguno                                                                                  | 1/10     |
| 7.9  | Tests para `baseParser.js` y `baseValidator.js`                            | Ninguno                                                                                  | 1/10     |
| 7.10 | Tests existentes (validator, barcoMatcher, normalizers, DocumentProcessor) | Existen y cubren el flujo básico                                                         | 6/10     |
| 7.11 | `parseString` retorna `''` silenciosamente para null                       | Puede enmascarar datos no extraídos por Azure sin notificación                           | 3/10     |
| 7.12 | Opciones "Facilcom" / "Otros" sin implementar — sin feedback               | El usuario no recibe ninguna respuesta al seleccionarlas y pulsar exportar               | 1/10     |
| 7.13 | `linkAllPurchases` sin confirmación previa                                 | Acción que modifica el backend sin confirm dialog — contra las convenciones del proyecto | 2/10     |
| 7.14 | Estado vacío cuando no hay documentos procesados                           | Ausente — sin instrucciones para el usuario nuevo                                        | 2/10     |
| 7.15 | Flujo principal feliz (PDF válido → exportación)                           | Funcional según el código revisado                                                       | 7/10     |
| 7.16 | Cobertura de edge cases (PDF corrupto, especie desconocida, rate limit)    | Sin tests automatizados; sin manejo visible en UI                                        | 2/10     |

### Nota global: **2.1 / 10**

> ⚠️ La cobertura de tests de los módulos financieros es el punto más grave de toda la auditoría.

---

## Auditoría 08 — Documentation Agent

| #    | Punto auditado                                               | Observación                                                                                         | Nota     |
| ---- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------- |
| 8.1  | Documento `docs/ai-context/` para el bloque                  | **No existe ninguno** — el sistema más complejo del proyecto no tiene documentación de arquitectura | **0/10** |
| 8.2  | ADR para Azure Document AI                                   | **No existe**                                                                                       | **0/10** |
| 8.3  | ADR para `exportData.js` estático                            | **No existe**                                                                                       | **0/10** |
| 8.4  | ADR para pipeline client-side                                | **No existe**                                                                                       | **0/10** |
| 8.5  | ADR para convención de keys (español vs inglés en parsers)   | **No existe**                                                                                       | **0/10** |
| 8.6  | `10-current-priorities.md` — mención del bloque              | Menciona "exportaciones de datos" pero sin contexto ni referencia a los 3 archivos `exportData.js`  | 3/10     |
| 8.7  | `01-frontend-architecture.md` — mención de servicios propios | No menciona `src/services/azure/`, `src/parsers/`, `src/validators/lonjas/`, `src/exportHelpers/`   | 2/10     |
| 8.8  | `AGENTS.md` — cobertura funcional                            | No lista la extracción de documentos de lonjas como área funcional del frontend                     | 3/10     |
| 8.9  | Guía de mantenimiento de catálogos (`exportData.js`)         | No existe — añadir un barco requiere leer el código para saber qué campos son obligatorios          | 0/10     |
| 8.10 | Agentes IA definidos para el bloque                          | Ningún agente específico para MarketDataExtractor                                                   | 4/10     |

### Nota global: **1.2 / 10**

> ⚠️ La ausencia total de documentación para este bloque es un riesgo operativo: ningún agente IA ni desarrollador nuevo puede entender el sistema sin leer todo el código.

---

## Auditoría 09 — Brutal Reviewer Agent

| #    | Punto auditado                                      | Observación                                                                                               | Nota     |
| ---- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| 9.1  | Seguridad de credenciales                           | API key de Azure pública en el bundle — fallo de seguridad activo en producción                           | **0/10** |
| 9.2  | Integridad financiera (tests en exportHelpers)      | Cero tests en los módulos que generan datos contables para A3ERP                                          | **0/10** |
| 9.3  | Duplicación de lógica (`BaseParser` vs `common.js`) | Dos `parseDecimalValue` con comportamientos distintos — trampa para futuros desarrolladores               | 2/10     |
| 9.4  | Datos de negocio en el frontend (`exportData.js`)   | CIFs, códigos A3ERP y matrículas de barcos hardcodeados en el cliente en lugar del backend                | 2/10     |
| 9.5  | Consistencia de parsers (español vs inglés)         | Cofra usa keys en español; LonjaDeIsla y ASOC en inglés; sin razón documentada                            | 3/10     |
| 9.6  | Lógica de exportación en componente UI (Cofra)      | `generateExcelForA3erp` en `ExportModal` en lugar de en `cofraExportHelper`                               | 3/10     |
| 9.7  | Polling manual de Azure                             | Reinventa el polling que el SDK oficial (`@azure/ai-form-recognizer`) ya proporciona de forma más robusta | 3/10     |
| 9.8  | Detección del tipo de venta por palabra "cinta"     | Regla de negocio opaca y frágil — si la lonja cambia la nomenclatura, todo falla en silencio              | 2/10     |
| 9.9  | Opciones no implementadas en UI (Facilcom, Otros)   | Confunden al usuario hoy — deben eliminarse o marcarse como "próximamente"                                | 2/10     |
| 9.10 | `fetchWithTenant` para servicio externo             | Acoplamiento incorrecto — Azure no necesita X-Tenant ni el ciclo de auth del tenant                       | 3/10     |
| 9.11 | Flujo principal — valor de negocio entregado        | El sistema sí funciona para el caso de uso principal y aporta valor real                                  | 6/10     |
| 9.12 | Estructura de separación de capas                   | Correcta en intención aunque con fallos en implementación                                                 | 5/10     |

### Nota global: **2.6 / 10**

---

## Auditoría 10 — Product & Domain Agent

| #     | Punto auditado                                                       | Observación                                                                                                             | Nota     |
| ----- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| 10.1  | Catálogo de barcos Cofra en frontend                                 | 31 barcos con CIF, codA3erp y codBrisapp hardcodeados — son datos del tenant, no de la app                              | **0/10** |
| 10.2  | Catálogo de barcos LonjaDeIsla en frontend                           | 200+ barcos hardcodeados — inviable de mantener, imposible para un segundo tenant                                       | **0/10** |
| 10.3  | Catálogo de barcos ASOC en frontend                                  | 11+ barcos hardcodeados                                                                                                 | **0/10** |
| 10.4  | Catálogo de armadores en frontend                                    | 23 armadores con CIF y codA3erp hardcodeados — un CIF incorrecto produce un error contable en A3ERP                     | **0/10** |
| 10.5  | Porcentajes de servicios de lonja hardcodeados                       | 2%, 1%, 0.5%, 3% como constantes en código — si la cooperativa cambia sus tarifas, hay que hacer un deploy              | **0/10** |
| 10.6  | Catálogo de especies por lonja                                       | Hardcodeado — si aparece una especie nueva el sistema falla o la ignora                                                 | 1/10     |
| 10.7  | Regla de clasificación subasta/contrato (`includes('cinta')`)        | Regla de negocio de la lonja expresada como string match en código — opaca y frágil                                     | 1/10     |
| 10.8  | Códigos A3ERP de artículos (95, 9998) hardcodeados                   | Códigos del ERP del tenant embebidos en el componente UI                                                                | 1/10     |
| 10.9  | Tipos de IVA (RED10, ORD21) hardcodeados                             | Menor riesgo — son tipos fiscales legales, no cambian por tenant — pero siguen sin ser configurables                    | 4/10     |
| 10.10 | Entidad `Barco` en el backend                                        | No existe — debería tener CRUD propio con campos de integración A3ERP                                                   | **0/10** |
| 10.11 | Entidad `ConfiguracionLonja` en el backend                           | No existe — porcentajes, servicios y reglas de clasificación deberían ser configurables por tenant                      | **0/10** |
| 10.12 | Entidad `CatalogoEspecies` en el backend                             | No existe — las especies por lonja no son gestionables desde la web                                                     | **0/10** |
| 10.13 | Pantalla de admin para gestionar barcos                              | No existe — añadir un barco nuevo requiere modificar código y hacer deploy                                              | **0/10** |
| 10.14 | Pantalla de admin para configuración de lonja                        | No existe — cambiar un porcentaje de servicio requiere deploy                                                           | **0/10** |
| 10.15 | Viabilidad multi-tenant del bloque                                   | `codBrisapp` y `codA3erp` son de Brisamar — el sistema es inoperable para un segundo tenant sin duplicar todo el código | **0/10** |
| 10.16 | `codBrisapp` como ID del backend hardcodeado                         | IDs de proveedores de la BD de Brisamar en un archivo estático — se desactualiza en cada alta de proveedor              | 1/10     |
| 10.17 | Autogestión del negocio — ¿puede el negocio operar sin un developer? | No. Añadir un barco, cambiar un porcentaje o actualizar un CIF requiere código + deploy                                 | **0/10** |
| 10.18 | Valor de negocio entregado (flujo actual para Brisamar)              | El sistema funciona y aporta valor real para el uso actual de un único tenant                                           | 6/10     |

### Nota global: **1.5 / 10**

---

## Tabla resumen global — todas las auditorías

| Auditoría | Rol                        | Área                                                      | Nota global  |
| --------- | -------------------------- | --------------------------------------------------------- | ------------ |
| 01        | Frontend Next.js Agent     | Estructura de componentes y App Router                    | 6.3 / 10     |
| 02        | UI/Form System Agent       | Formularios, estado, validación de inputs                 | 5.4 / 10     |
| 03        | API Client Agent           | Servicios, seguridad, gestión de errores HTTP             | 3.0 / 10     |
| 04        | EntityClient Agent         | Uso de EntityClient, tablas, rutas                        | 7.0 / 10     |
| 05        | Design System Agent        | Consistencia shadcn/ui, Tailwind, tipografía              | 5.9 / 10     |
| 06        | Frontend Performance Agent | Bundle, polling, concurrencia, re-renders                 | 4.0 / 10     |
| 07        | QA/UX Agent                | Tests, UX, edge cases, acciones destructivas              | 2.1 / 10     |
| 08        | Documentation Agent        | Docs de arquitectura, ADRs, contexto IA                   | 1.2 / 10     |
| 09        | Brutal Reviewer Agent      | Seguridad, integridad, deuda técnica global               | 2.6 / 10     |
| 10        | **Product & Domain Agent** | Propiedad de datos, multi-tenant, autogestión del negocio | **1.5 / 10** |

### **Nota global del bloque: 3.9 / 10**

---

## Ranking de prioridades de acción

| Prioridad | Problema                                                                                 | Auditoría  | Urgencia                                                |
| --------- | ---------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------- |
| P0        | Mover API key de Azure a server-side (API Route)                                         | 03, 09     | **Inmediata — riesgo activo en producción**             |
| P0        | `codA3erp` de armador incorrecto → asiento contable en proveedor equivocado en A3ERP     | 10         | **Inmediata — riesgo financiero activo**                |
| P0        | Añadir tests para `cofraExportHelper`, `lonjaDeIslaExportHelper`, `asocExportHelper`     | 07, 09     | **Inmediata — riesgo de datos financieros incorrectos** |
| P1        | Crear entidades backend: `Barco`, `ConfiguracionLonja`, `CatalogoEspecies`               | 10         | Alta — bloquea la autogestión del negocio               |
| P1        | Crear pantallas de admin para gestionar barcos, armadores y servicios de lonja           | 10         | Alta — hoy requiere developer para cambios de negocio   |
| P1        | Añadir `AbortController` al polling de Azure                                             | 03, 06     | Alta — UX y coste                                       |
| P1        | Crear `docs/ai-context/12-market-data-extractor.md`                                      | 08         | Alta — sin doc el bloque es opaco                       |
| P1        | Crear ADRs para las 4 decisiones clave del bloque                                        | 08         | Alta                                                    |
| P2        | Reemplazar `exportData.js` × 3 por fetch al backend (tras Fase 1)                        | 10         | Media — depende de entidades backend                    |
| P2        | Mover `generateExcelForA3erp` a `cofraExportHelper.js`                                   | 01, 09     | Media                                                   |
| P2        | Hacer configurable la regla de clasificación subasta/contrato (hoy: `includes('cinta')`) | 10         | Media                                                   |
| P2        | Eliminar opciones Facilcom/Otros del Select o añadir feedback "no disponible"            | 02, 07, 09 | Media                                                   |
| P2        | Implementar límite de concurrencia en modo masivo                                        | 06         | Media                                                   |
| P3        | Lazy import de `exportData.js` de LonjaDeIsla                                            | 06         | Media-baja                                              |
| P3        | Añadir `useMemo` a `groupedLinkedSummary` en ExportModal                                 | 06         | Baja                                                    |
| P3        | Unificar convención de keys en parsers (español o inglés)                                | 09         | Baja                                                    |
| P4        | Añadir confirm dialog antes de `linkAllPurchases`                                        | 07         | Baja                                                    |
| P4        | Actualizar badges a variantes shadcn (no colores hardcodeados)                           | 05         | Baja                                                    |
| P4        | Guía de mantenimiento de `exportData.js` (mientras no haya backend)                      | 08, 10     | Baja                                                    |
