# Prompt especializado de auditoría de producciones: rendimiento, fluidez y percepción de carga

Actúa como Staff/Principal Frontend Engineer especializado en Next.js App Router, React, React Query v5, UX operativa de alta densidad y módulos de producción con flujos largos, formularios complejos, árboles de proceso, inputs/outputs y trazabilidad.

**Objetivo**: producir un informe técnico exhaustivo, trazable a código real, orientado a decisiones concretas — no a recomendaciones genéricas. Cada hallazgo apunta a archivos, hooks y líneas reales.

---

## Fuentes obligatorias

Antes de empezar debes leer y usar como documentos rectores:

- `docs/prompts/12-prompt-auditoria-principal-frontend.md`
- `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`
- `docs/audits/global-performance-audit-master-prompt.md`

Como contexto específico de dominio y superficie, cruza además con:

- `docs/14-produccion-en-construccion.md`

Si hay una auditoría anterior del bloque en `docs/audits/productions-performance-audit-*.md`, léela antes de empezar para no duplicar hallazgos ya confirmados y para identificar si algo ha regresado.

Si detectas contradicciones entre fuentes, la jerarquía es:

1. `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`
2. código real del repositorio
3. resto de documentos

---

## Bloque exacto a auditar

Debes auditar el bloque:

- `Producción, trazabilidad y etiquetas`

Con este alcance mínimo:

- `src/app/admin/productions/` — todas las rutas, incluidas:
  - `page.js` (listado)
  - `loading.js`
  - `[id]/page.js` y `[id]/ProductionClient.js` (detalle)
  - `[id]/records/create/` (creación de registros)
  - `[id]/records/[recordId]/` (edición de registros)
- `src/components/Admin/Productions/` — todos los managers, editors, dialogs y vistas auxiliares
- `src/hooks/production/` — todos los hooks del bloque
- `src/services/productionService.js`
- `src/services/production/`
- helpers, tipos y utilidades directamente conectados al flujo de producciones, diagramas, consumos, costes, imágenes, etiquetas y trazabilidad

---

## Objetivo real de la auditoría

Determinar por qué el módulo de producciones puede sentirse pesado, lento o poco fluido y dejar un diagnóstico que permita priorizar mejoras concretas para que:

- el usuario perciba respuesta inmediata o progresiva
- cada espera tenga contexto claro
- cada navegación o cambio de pantalla anticipe qué viene después
- ningún estado de carga parezca un bloqueo silencioso
- los listados, vistas detalle, formularios y managers no penalicen innecesariamente render, red, hidratación o interacción

---

## Metodología de trabajo

### Fase 0 — Contexto y preparación

- Identifica rutas críticas del módulo de producciones.
- Lee auditorías previas y alinéate con hallazgos ya confirmados o cerrados.
- Declara limitaciones de acceso explícitamente (sin runtime = sin datos de red reales, sin Profiler, sin TTFB medido).
- Define si el análisis es solo estático o si dispones de runtime.

### Fase 1 — Diagnóstico macro

- Detecta pantallas, flujos y acciones con mayor coste potencial.
- Identifica top componentes más grandes (>400 líneas sospechoso, >800 problema real).
- Identifica top hooks con mayor acoplamiento, mayor número de queries/mutaciones o mayor uso de `useState/useEffect` manual donde debería haber React Query.
- Identifica top endpoints más llamados o más costosos (inferido de hooks y servicios).

### Fase 2 — Diagnóstico técnico profundo

Baja a nivel de hook, componente, query key, endpoint, payload y dependencia.

Distingue claramente entre:

- **causa raíz**: el defecto estructural
- **síntoma**: lo que el usuario o el sistema percibe
- **amplificador**: lo que agrava el impacto sin ser la causa principal
- **efecto sobre UX o negocio**: la consecuencia observable

### Fase 3 — Priorización

Clasifica cada hallazgo por severidad, impacto, esfuerzo y riesgo de cambio.

Separa quick wins de cambios estructurales. Indica dependencias entre remediaciones.

### Fase 4 — Plan de remediación

Propone cambios concretos: dónde intervenir, cómo corregir, cómo validar. Incluye riesgos, trade-offs y plan de rollback por bloque.

---

## Qué debes evaluar

Evalúa siempre desde el código real y con foco en esta superficie concreta:

- arquitectura de rutas de producciones, detalle, creación y edición de registros
- distribución server/client y coste de hidratación
- tamaño y complejidad de componentes críticos
- composición de managers pesados y propagación de estado
- queries, mutaciones, invalidaciones y refetches
- cargas paralelas frente a waterfalls
- tabs, paneles, dialogs y secciones no visibles que aun así cargan datos
- UX de loading, empty, refreshing, saving, deleting, syncing, uploading y navegación
- continuidad visual entre una pantalla y la siguiente
- feedback de operaciones largas: imports, sincronizaciones, búsquedas, cálculo de totales, árbol de proceso, diagramas, costes, imágenes y consumos
- uso de skeletons, spinners, overlays, banners, toasts, loaders inline y estados de transición
- percepción de bloqueo tras `router.push`, submit, cambio de tab, cambio de registro o apertura de modal
- claridad del siguiente paso en cada flujo crítico
- manejo de errores silenciosos o errores que solo aparecen en consola
- deuda técnica que agrava lentitud: componentes monolíticos, hooks legacy, fetch manual, estados duplicados, falta de `enabled`, keys inestables, invalidaciones amplias, cálculo repetido, render redundante

---

## Heurísticas específicas para este módulo

Pon especial atención a estos olores:

- componentes grandes del bloque, especialmente si superan ~400 líneas; considera problema serio si superan ~800
- mezcla de fetch, render, formularios, tablas, diálogos y lógica de negocio dentro del mismo componente
- hooks de producción con `useState`/`useEffect` manuales donde ya debería existir una estrategia más uniforme con React Query
- `loading` global que apaga toda la pantalla cuando sería mejor un loading parcial o por sección
- pérdida de contexto al refrescar todo el detalle por una acción localizada
- refetch completo tras mutaciones que podrían reconciliarse localmente con `setQueryData`
- acciones largas sin feedback progresivo ni ETA aproximada
- navegación con `router.push` sin transición visible, sin pantalla puente o sin estado de "abriendo"
- selectores, tablas o dialogs que cargan datos al abrirse pero no muestran claramente qué están esperando
- errores capturados con `catch(() => null)` o logs en consola que ocultan fallos al usuario
- workarounds de backend que introducen complejidad o reintentos silenciosos

---

## Checklist técnico mínimo

### React Query v5 — producciones

- [ ] Cada `useQuery` dependiente de visibilidad, tab activa, `id` o contexto tiene `enabled: false` cuando no corresponde cargar
- [ ] Las query keys del módulo son estables y normalizadas — no objetos literales sin serializar
- [ ] Las invalidaciones usan factories, no keys hardcodeadas ni `invalidateQueries()` sin predicado
- [ ] No hay invalidaciones all-scope (`invalidateQueries()` sin filtro) sin justificación documentada
- [ ] Las mutaciones frecuentes usan `setQueryData` cuando el dato ya está disponible en la respuesta en lugar de refetch
- [ ] Las mutaciones tienen `onError` con rollback real, no solo log en consola
- [ ] Se usa `isPending` (no `isLoading`) — API correcta de React Query v5
- [ ] No se usa `keepPreviousData` (eliminado en v5) — se usa `placeholderData`
- [ ] El `select` de `useQuery` no crea objetos/arrays nuevos en cada render sin referencia estable
- [ ] Los hooks de campo o de detalle no se instancian duplicados con la misma key en distintos puntos del árbol

### Navegación y estado en producciones

- [ ] Al cambiar de producción, se resetean tabs, drafts y modales relevantes
- [ ] No se arrastran estados de una producción a otra (IDs en state o en URL desincronizados)
- [ ] No hay side effects activos en panels o tabs no visibles
- [ ] `router.push` hacia el detalle o de vuelta al listado tiene feedback visible antes de que la nueva vista esté lista

### Formularios, dialogs y managers

- [ ] Los dialogs cerrados no cargan catálogos (`enabled: false` mientras el dialog está cerrado)
- [ ] Los formularios de registro no recalculan consumos completos en cada keystroke
- [ ] Los managers de outputs, inputs y consumos no hacen refetch de listas completas tras cada operación si el dato ya está disponible
- [ ] Los modales de selección (palet, artículo, proveedor) usan debounce en búsqueda

### Loaders y feedback

- [ ] Ningún estado de carga es opaco y genérico cuando puede ser descriptivo ("cargando registros", "guardando output", "calculando totales")
- [ ] Las secciones de diagrama y árbol de proceso no bloquean la vista completa mientras calculan
- [ ] Las imágenes usan loading progresivo o skeleton mientras cargan
- [ ] Los uploads de imagen tienen progreso visible
- [ ] Los errores de operación aparecen en UI con contexto, no solo en consola

### Auth y transporte

- [ ] El token se resuelve con caché de promesa en vuelo — no hay múltiples `getSession()` simultáneos en el flujo de producciones
- [ ] No hay `console.error` / `console.log` en rutas frecuentes de producción

---

## Flujos críticos a inspeccionar sí o sí

Debes revisar, como mínimo:

1. entrada a `/admin/productions` — listado, skeleton, primera carga
2. navegación desde listado a detalle de producción — transición, estado puente, primer render
3. carga inicial de `ProductionView` — qué queries se lanzan, en qué orden, cuándo se puede interactuar
4. uso de tabs: diagrama, totales, conciliación y árbol de procesos — carga lazy vs eager
5. apertura y uso de `ProductionRecordsManager` — estado, waterfalls, invalidaciones
6. creación de registros en `records/create` — formulario, validaciones, submit, vuelta atrás
7. edición de registros en `records/[recordId]` — carga del registro, formulario, submit
8. gestión de inputs — carga, añadir, editar, eliminar, feedback
9. gestión de outputs — carga, añadir, editar, eliminar, feedback
10. gestión de consumos — carga, relación con outputs, feedback
11. subida y visualización de imágenes — progreso, error, previsualización
12. costes y vistas auxiliares conectadas a producción — carga, cálculo, actualización
13. vuelta atrás al detalle o al listado tras guardar, eliminar o finalizar — contexto preservado vs perdido

---

## Preguntas guía obligatorias

Debes responder con evidencia a:

- ¿Qué pantallas de producciones cargan demasiadas cosas a la vez?
- ¿Qué componentes superan un tamaño o complejidad que ya hace probable el lag de render o mantenimiento?
- ¿Qué datos se piden demasiado pronto, demasiado tarde o más veces de las necesarias?
- ¿Qué acciones dejan al usuario sin saber si el sistema está procesando, navegando o bloqueado?
- ¿Dónde hay loaders genéricos que no explican qué se está cargando?
- ¿Dónde faltan skeletons o estados parciales que permitan continuar entendiendo la pantalla?
- ¿Qué transiciones deberían mantener contexto visual en vez de reemplazar toda la UI por un loader opaco?
- ¿Qué operaciones merecen feedback progresivo tipo `saving`, `calculando`, `sincronizando`, `subiendo imágenes`, `generando diagrama`, `actualizando consumos`?
- ¿Qué partes del módulo ya están razonablemente bien y no conviene tocar sin una métrica clara?
- ¿Qué invalidaciones hacen refetch de más de lo necesario?
- ¿Qué hooks mezclan lógica de negocio, estado local y llamadas a red de forma que dificulta la optimización?
- ¿Hay errores silenciosos que el usuario nunca verá pero que pueden dejar el estado del módulo inconsistente?

---

## Reglas de calidad del análisis

- Cada hallazgo debe incluir evidencia concreta: archivo, línea o rango, patrón observado.
- Cada recomendación apunta a archivos, hooks, componentes, endpoints o flujos específicos — nunca a conceptos abstractos.
- No usar lenguaje vago como "optimizar", "mejorar", "revisar" sin explicar el mecanismo exacto.
- Si infieres algo que no puedes comprobar sin runtime, márcalo como inferencia y explica por qué.
- Si no puedes verificar una capa, decláralo en limitaciones.
- Consolida hallazgos por patrón y luego lista las superficies afectadas — no duplicar el mismo hallazgo por cada archivo.
- No propongas refactors masivos sin priorización. Separa quick wins de cambios estructurales.
- Cuando un problema sea principalmente perceptivo, no lo minimices: si el usuario cree que la app se congeló, es un problema serio aunque el backend responda razonablemente rápido.

---

## KPIs a reportar

### Con acceso a runtime (DevTools, logs, APM)

- TTFB por endpoint crítico del módulo (producciones, registros, consumos, imágenes)
- Tiempo hasta UI estable por acción clave (abrir detalle, guardar registro, añadir output)
- Número de requests por acción de usuario
- Requests duplicadas por flujo
- Tamaño medio de payload por endpoint crítico
- Re-render count en componentes clave (ProductionView, managers)
- INP, TBT por pantalla crítica (si disponibles)

### Sin acceso a runtime (auditoría de código)

- Número de queries activas por vista (inferido de hooks usados en componentes)
- Número de invalidaciones por mutación
- Tamaño de componentes críticos (líneas)
- Ratio de `use client` vs total de archivos del módulo
- Número de hooks que combinan `useState/useEffect` manual con queries de React Query

---

## Restricciones

- No generes recomendaciones genéricas tipo "optimizar rendimiento" sin mecanismo exacto.
- No hagas una review archivo por archivo salvo que sea necesario para justificar un patrón.
- No cierres mejoras como resueltas si no están asentadas en código.
- No mezcles bloque producción con otros módulos salvo para explicar dependencias claras con stock, documentos, etiquetas o navegación transversal.
- No crees scoreboards paralelos fuera de la fuente central.
- No declares como cerrado algo que hallaste en una auditoría anterior sin verificar que el código ya lo resuelve.

---

## Salida esperada

La salida debe servir para decidir trabajo real y, si procede, actualizar la fuente central del bloque de producción. Entrega el resultado en este orden:

---

### 1. Alcance auditado

- rutas, componentes, hooks y servicios revisados
- limitaciones declaradas explícitamente
- si hubo o no acceso a runtime real
- referencia a auditorías previas usadas como base

---

### 2. Resumen ejecutivo

- 5 a 10 hallazgos más importantes
- separar claramente:
  - **lentitud real** (coste técnico medible o estimable)
  - **lentitud percibida** (problema de feedback y continuidad visual)
  - **problemas mixtos** (latencia existente amplificada por mala UX)
- top quick wins identificados
- riesgos principales

---

### 3. Mapa de fricción del usuario

Para cada flujo crítico revisado:

| Campo                             | Contenido                                             |
| --------------------------------- | ----------------------------------------------------- |
| `flujo`                           | nombre del flujo                                      |
| `qué ve el usuario`               | descripción de la experiencia actual                  |
| `qué está esperando el sistema`   | causa técnica real                                    |
| `por qué puede parecer bloqueado` | amplificador de percepción                            |
| `qué feedback falta`              | qué comunicación visual o textual falta               |
| `mejora UX mínima recomendada`    | cambio de menor esfuerzo con mayor impacto perceptivo |

---

### 4. Hallazgos priorizados

Usa este formato por hallazgo:

```
- ID: PROD-##
- Severidad: Crítico | Alto | Medio | Bajo
- Impacto: Alto | Medio | Bajo
- Esfuerzo: Alto | Medio | Bajo
- Riesgo de cambio: Alto | Medio | Bajo
- Tipo: render | data | network | loading UX | navigation UX | mixed
- Flujo afectado:
- Síntoma:
- Evidencia: [archivo:línea] descripción concreta
- Causa raíz:
- Amplificador:
- Impacto UX / negocio:
- Cambio propuesto: (específico, no abstracto)
- Validación: (cómo verificar que el cambio funciona)
- Riesgos / trade-offs:
- Superficies afectadas:
```

---

### 5. Auditoría de loading y transición

Sección específica con:

- loaders correctos y loaders problemáticos
- pantallas que se quedan "vacías" demasiado tiempo
- lugares donde conviene skeleton en vez de spinner
- lugares donde conviene loading inline en vez de bloquear toda la vista
- lugares donde conviene preservar datos previos mientras refresca (`placeholderData` o stale-while-revalidate)
- lugares donde conviene un mensaje explícito del tipo "cargando diagrama", "guardando registro", "sincronizando outputs", "buscando palet", "actualizando consumos"
- lugares donde conviene feedback por promesa o toast actualizable

---

### 6. Confirmaciones positivas

Lista explícita de patrones, componentes o flujos que ya están bien resueltos y que **no deben modificarse** sin una métrica clara que lo justifique. Esto evita regresiones innecesarias.

---

### 7. Evaluación por sub-bloque

Como mínimo evalúa:

- listado de producciones
- detalle de producción
- registros de producción
- inputs
- outputs
- consumos
- imágenes
- diagrama / trazabilidad
- costes / auxiliares conectados

Para cada sub-bloque:

```
- sub_bloque:
- estado_actual:
- puntuacion_estimada: (escala 0-10, coherente con fuente de verdad)
- principal_cuello_de_botella:
- principal_problema_de_percepcion:
- quick_wins:
- cambio_estructural_recomendado:
```

---

### 8. Plan de remediación

#### Quick wins

Cambios de bajo riesgo y alto impacto perceptivo. Indica archivo y mecanismo exacto.

#### Cambios estructurales

- descomposición de managers monolíticos
- estrategia de caché/invalidación y uso de `setQueryData`
- carga diferida por secciones y tabs (lazy + `enabled`)
- navegación y transiciones con contexto preservado
- consolidación de hooks o servicios

Para cada cambio estructural indica:

- dependencias con otros cambios
- riesgo de regresión
- cómo validar sin runtime

#### Fase de hardening y observabilidad

- qué medir con runtime real
- qué instrumentar con Profiler, Network, React Query Devtools o métricas de UX
- qué reglas de PR añadir para evitar recaídas

---

### 9. Actualización propuesta de la fuente de verdad

Propón exactamente qué escribir de vuelta en:

- `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`

Incluye:

- `puntuacion_propuesta` para el bloque `Producción, trazabilidad y etiquetas`
- `estado_propuesto`
- `gap_principal` actualizado
- `notas_provisionales` nuevas o modificadas
- `notas_cerradas` nuevas si algún hallazgo anterior ya está resuelto

Si no se puede actualizar algo con confianza, indícalo como provisional.

---

## Recomendaciones operativas para evitar recaídas

Una vez completada la auditoría, añade reglas de PR específicas para el bloque:

- **Regla — mutaciones de producción**: toda mutación debe justificar sus invalidaciones (¿por qué no `setQueryData`?).
- **Regla — `enabled` en managers**: obligatorio cuando la query dependa de visibilidad de panel, tab activa o `id` válido.
- **Regla — query keys de producción**: usar factories, nunca arrays literales con objetos sin normalizar.
- **Regla — loaders de managers**: todo estado de espera visible para el usuario debe tener texto de contexto, no solo spinner.
- **Regla — `console`**: no `console.error/log` en rutas de código frecuentes de producción.

---

## Regla final

La auditoría debe dejar completamente claro:

- qué frena de verdad el módulo (coste técnico real)
- qué solo "se siente lento" por mala comunicación visual (problema de percepción)
- qué mejoras deben ir primero para que el usuario note fluidez sin esperar un gran refactor
- qué escribir de vuelta en `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md` si la evidencia lo justifica
