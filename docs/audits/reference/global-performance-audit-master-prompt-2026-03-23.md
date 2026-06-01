# Auditoría Global de Rendimiento — Prompt Maestro

Documento reutilizable y profesional para ejecutar una auditoría global de rendimiento sobre un proyecto Next.js (App Router) con React Query, módulos de negocio densos y vistas con mapas/rutas.

**Objetivo**: producir un informe técnico exhaustivo, trazable a código, orientado a decisiones concretas — no a recomendaciones genéricas.

---

## 1. Misión

Actúa como auditor senior de rendimiento full-stack para una aplicación Next.js (App Router) con React, React Query v5, módulos de negocio densos y vistas con mapas/rutas.

Identifica los puntos críticos que generan:

- lentitud percibida en navegación, carga y acciones CRUD,
- sobre-consulta al backend y refetches en cascada,
- cargas eager innecesarias en tabs, paneles, modales o vistas no visibles,
- re-renderizados costosos, hydration innecesaria y acoplamientos en frontend,
- problemas de caché, invalidación, sincronización de estado y optimistic updates,
- cuellos de botella en red, API, auth/transporte y base de datos,
- flujos pesados del dominio: CRM, rutas comercial, rutas repartidor, agenda, mapas, detalle de entidades y operaciones relacionadas.

El diagnóstico debe ser **evidence-first**: cada hallazgo apunta a código real, no a hipótesis genéricas.

---

## 2. Alcance Obligatorio

### 2.1 Frontend render

- Renderizado, re-renderizado, hydration, composición de componentes.
- Colocación de estado, memoización, Suspense/loading UX y perceived performance.
- Distribución Server Component vs Client Component: ratio de archivos `'use client'`, layouts con `force-dynamic`, hydration innecesaria.
- Singletons de módulo (caches, Maps, objetos compartidos): ¿tienen TTL? ¿tienen límite de tamaño? ¿están aislados por tenant o contexto?

### 2.2 Capa de datos — React Query v5

- Query keys: estabilidad, normalización, consistencia con sus invalidaciones.
- `enabled`: presente cuando la query depende de visibilidad, panel abierto, tab activa, `id` válido, contexto listo o sesión disponible.
- `staleTime` / `gcTime`: configuración global y overrides por dominio justificados.
- Invalidaciones: evitar `queryClient.invalidateQueries()` sin predicado o con scope demasiado amplio.
- Mutaciones: `onMutate` optimista cuando aporta valor, `onError` con rollback real, `onSuccess` con reconciliación mínima o patch local, `onSettled` global solo si es necesario.
- `setQueryData` vs invalidación: uso correcto para evitar refetch cuando el dato ya está disponible en la respuesta.
- Deduplicación: no crear múltiples instancias del mismo hook con la misma key si React Query ya debería deduplicarlas.
- Paginación: tamaño de página justificado, sin overfetch, sin `select` que descarte datos ya traídos.
- **API v5 específico**: uso correcto de `isPending` (no `isLoading`), `status`, `fetchStatus`, `placeholderData` vs `keepPreviousData` (eliminado en v5).

### 2.3 Red / API

- Frecuencia de requests: bursts, duplicados, waterfalls evitables.
- N+1 o fan-out al backend.
- Payload size: campos no usados, overfetch.
- Serialización evitable (Content-Type incorrecto, JSON.stringify de objetos ya serializados).
- Endpoints redundantes o solapados.
- Errores silenciosos que reintenten sin visibilidad.

### 2.4 Auth / transporte

- Resolución de token: ¿hay caché? ¿hay deduplicación de la promesa en vuelo? ¿se invalida solo en eventos reales (401)?
- Lectura repetida de `sessionStorage`/`localStorage` en rutas de error frecuentes.
- `console.error` / `console.log` en producción: ruido de logs y potencial exposición de datos sensibles.
- Middleware: coste transversal por request, validación de roles innecesariamente costosa.

### 2.5 Dominio y UX

- Pantallas densas y rutas críticas de negocio: login, landing, listados pesados, detalles, formularios, agenda, CRM, rutas comercial, rutas repartidor, mapas, dialogs y filtros.
- Componentes monolíticos: >400 líneas sospechosos, >800 líneas señal de problema real.
- Geocoding, mapas y cálculos de rutas: ¿se ejecutan solo cuando la vista está activa? ¿hay límite de concurrencia? ¿hay deduplicación de peticiones en vuelo? ¿se reutilizan resultados si el set de paradas no cambia?

### 2.6 Backend / DB (cuando hay visibilidad)

- Latencia por endpoint, consultas costosas, índices faltantes.
- Paginación, ordenaciones caras, agregaciones y fan-out interno.
- Si no hay acceso directo, declarar la limitación y razonar desde los patrones del cliente.

---

## 3. Metodología

### Fase 0 — Preparación y contexto

- Identifica rutas críticas del producto.
- Revisa playbooks o auditorías previas del proyecto y alinéate con ellas.
- Define el entorno analizado: local, preview o producción.
- Declara limitaciones de acceso explícitamente (sin runtime = sin datos de red reales, sin Profiler, sin TTFB medido).

### Fase 1 — Diagnóstico macro (sin runtime: lectura de código y estructura)

- Detecta las pantallas, flujos y acciones con mayor coste potencial.
- Identifica top componentes más grandes (>400 líneas).
- Identifica top hooks con mayor acoplamiento o mayor número de queries/mutaciones.
- Identifica top endpoints más llamados o más costosos (inferido de hooks y servicios).

### Fase 2 — Diagnóstico técnico profundo

Baja a nivel de hook, componente, query key, endpoint, payload y dependencia.

Distingue claramente entre:

- **causa raíz**: el defecto estructural,
- **síntoma**: lo que el usuario o el sistema percibe,
- **amplificador**: lo que agrava el impacto,
- **efecto sobre UX o infraestructura**: la consecuencia observable.

### Fase 3 — Priorización

Clasifica cada hallazgo por **severidad**, **impacto**, **esfuerzo** y **riesgo de cambio**.

Separa quick wins de cambios estructurales. Indica dependencias entre remediaciones.

### Fase 4 — Plan de remediación

Propone cambios concretos: dónde intervenir, cómo corregir, cómo validar. Incluye riesgos, trade-offs y plan de rollback por bloque.

---

## 4. Reglas de Calidad del Análisis

- Cada hallazgo debe incluir evidencia concreta (archivo, línea, patrón observado).
- Cada recomendación apunta a archivos, hooks, componentes, endpoints o flujos específicos.
- No usar lenguaje vago como "optimizar", "mejorar", "revisar" sin explicar el mecanismo exacto.
- Si infieres algo, márcalo como inferencia y explica por qué.
- Si no puedes verificar una capa, decláralo en limitaciones.
- Consolida hallazgos por patrón y luego lista las superficies afectadas — no duplicar el mismo hallazgo por cada archivo.
- Si detectas patrones ya cubiertos por un playbook interno, indica explícitamente si el proyecto cumple, incumple o cumple solo parcialmente.

---

## 5. Evidencia Mínima por Hallazgo

Todo hallazgo debe aportar, cuando aplique:

- ruta o flujo afectado,
- archivo(s) implicado(s) con número de línea,
- hook / componente / servicio implicado,
- query key o mutación implicada,
- endpoint(s) relacionado(s),
- patrón observado (en código, Network/Profiler/logs si hay acceso),
- efecto visible en UX o coste técnico,
- motivo por el que ocurre.

---

## 6. Formato Obligatorio de Hallazgo

```
- ID: P##
- Severidad: Crítico | Alto | Medio | Bajo
- Impacto: Alto | Medio | Bajo
- Esfuerzo de corrección: Alto | Medio | Bajo
- Riesgo de cambio: Alto | Medio | Bajo
- Área: React Query | Render | Red/API | Auth | Dominio | Backend/DB
- Flujo afectado:
- Síntoma:
- Evidencia: [archivo:línea] descripción concreta
- Causa raíz:
- Impacto de negocio/UX:
- Cambio propuesto: (específico, no abstracto)
- Validación: (cómo verificar que el cambio funciona)
- Riesgos / trade-offs:
- Archivos o superficies afectadas:
```

---

## 7. Heurísticas Específicas a Revisar

### Frontend

- Componentes >400 líneas que mezclan formulario, lógica de red, mapa, lista y dialogs.
- Estado local que obliga a re-renderizar árboles caros.
- Dependencias inestables (objetos literales en JSX como props o query params) que rompen memoización.
- Carga de tabs, dialogs o paneles cerrados (query sin `enabled: false` cuando la UI no está visible).
- Filtros o inputs que disparan request por pulsación sin debounce.
- Cálculos caros (geocoding, rutas, mapas) ejecutados en vistas no activas.
- Singletons de módulo sin TTL, sin límite de tamaño o sin aislación de contexto.

### React Query v5 / data layer

- Query keys inestables o sin normalización (objetos literales, sin sort de claves, referencia nueva en cada render).
- `enabled` ausente cuando depende de visibilidad, selección o id.
- Invalidaciones globales (`invalidateQueries()` sin filtro) o innecesariamente amplias.
- Mutaciones que hacen refetch de datos ya disponibles en la respuesta (usar `setQueryData`).
- Ausencia de optimistic update y rollback donde aporta valor real.
- Keys hardcodeadas en invalidaciones en lugar de factories.
- `normalizeRouteCollection([item])[0]` donde `normalizeRouteEntity(item)` es correcto y más eficiente.
- `select` en `useQuery` que crea nuevos objetos/arrays en cada llamada sin referencia estable.

### Red / API

- Requests duplicadas para la misma acción.
- Secuencias seriales que pueden ser paralelas (`Promise.all`).
- Waterfalls creados por dependencia artificial.
- N+1 o fan-out evitable.
- Payloads sobredimensionados, campos no usados en el cliente.
- Endpoints duplicados o solapados.

### Auth / transporte

- Resolución de token sin caché de promesa en vuelo → múltiples `getSession()` simultáneos.
- Lectura de `sessionStorage` en rutas de código frecuentes (cada request fallida).
- `console.error` hardcodeado en lógica de error que se ejecuta en producción.
- Invalidación de auth demasiado agresiva o demasiado permisiva.
- Tenant resolution innecesariamente costosa o no cacheada.

### Backend / DB

- Endpoints lentos por agregaciones, joins o filtros sin índice.
- Overfetching de datos no usados por el cliente.
- Fan-out interno o consultas repetitivas por request.
- Paginación ausente o inflada.

---

## 8. Checklist Técnico Mínimo

### Queries y mutaciones

- [ ] Cada `useQuery` dependiente de visibilidad, `id` o contexto tiene `enabled`.
- [ ] Las query keys están normalizadas y son estables entre renders.
- [ ] Las invalidaciones usan factories, no keys hardcodeadas.
- [ ] No hay invalidaciones `all` sin justificación documentada.
- [ ] Las mutaciones frecuentes usan `setQueryData` cuando el dato está en la respuesta.
- [ ] Las mutaciones usan optimismo y rollback cuando el latencia es apreciable.
- [ ] Los hooks de campo (`field*`) incluyen `fieldOperatorId` en la query key si el operador puede cambiar.

### Navegación y estado

- [ ] Al cambiar de entidad, se resetean tabs, drafts y modales relevantes.
- [ ] No se arrastran estados que disparen fetch oculto.
- [ ] No hay side effects activos con paneles no visibles.

### Formularios y dialogs

- [ ] Los dialogs cerrados no cargan catálogos (`enabled: false`).
- [ ] Los formularios envían solo los campos necesarios para el contexto.

### Búsqueda y filtros

- [ ] Existe debounce donde corresponde.
- [ ] Los filtros complejos usan estado borrador más acción explícita.
- [ ] Cambios múltiples no generan bursts de requests.

### Mapas, rutas y geocoding

- [ ] La geometría se calcula solo si la vista está activa (`enabled` en `useRouteGeometry`).
- [ ] El geocoding tiene límite de concurrencia.
- [ ] Existe deduplicación de peticiones en vuelo (pending map).
- [ ] Se reutilizan resultados si el set de paradas no cambia (signature memoization).
- [ ] El caché de geocoding tiene tamaño máximo o TTL para evitar crecimiento indefinido.

### Auth y transporte

- [ ] El token se resuelve con caché de promesa en vuelo (no múltiples `getSession()` simultáneos).
- [ ] `clearAuthTokenCache()` se llama solo en eventos reales (401), no preventivamente.
- [ ] No hay `console.error` / `console.log` en rutas de producción frecuentes.
- [ ] La lectura de `sessionStorage` está acotada a los casos que lo requieren.

### Singletons de módulo

- [ ] Caches a nivel de módulo tienen TTL o límite de tamaño.
- [ ] Caches a nivel de módulo están aisladas por tenant si los datos son tenant-específicos.
- [ ] Promesas en vuelo (pending maps) se limpian correctamente en `finally`.

---

## 9. KPIs a Reportar

### Con acceso a runtime (DevTools, logs, APM)

- TTFB por endpoint crítico.
- Tiempo hasta UI estable por acción clave.
- Número de requests por acción de usuario.
- Requests duplicadas por flujo.
- Tamaño medio de payload por endpoint crítico.
- Re-render count en componentes clave.
- INP, TBT, CLS por pantalla (si están disponibles).
- CPU time en acciones pesadas.
- Consumo de memoria en vistas largas.

### Sin acceso a runtime (auditoría de código)

- Número de queries activas por vista (inferido de hooks usados en componentes).
- Número de invalidaciones por mutación.
- Tamaño de componentes críticos (líneas).
- Ratio `use client` / total de archivos.
- Archivos >30KB (hotspots de mantenibilidad y posible coste de parse).

---

## 10. Entregables Obligatorios

Entrega el resultado en este orden:

1. **Resumen ejecutivo**: estado general, cuellos de botella principales, top quick wins, riesgos principales.
2. **Mapa de síntomas y superficie impactada**: por módulo, flujo y capa técnica.
3. **Tabla de hallazgos priorizados**: con severidad, impacto, esfuerzo, riesgo y evidencia resumida.
4. **Desarrollo detallado de hallazgos**: uno por uno, con el formato obligatorio.
5. **Confirmaciones positivas**: patrones correctos que no deben modificarse.
6. **Plan de remediación por fases**:
   - Fase 1: quick wins (1-2 semanas).
   - Fase 2: estabilización estructural (2-4 semanas).
   - Fase 3: hardening y observabilidad.
7. **Checklist de validación**: Network, Performance, UX, regresiones funcionales.
8. **Riesgos, trade-offs y rollback** por bloque de cambios.

---

## 11. Limitaciones a Declarar Cuando Apliquen

- **Sin acceso a runtime**: no hay datos reales de Network, Performance Profiler, TTFB ni logs de producción. Los hallazgos son inferidos del código y deben validarse con DevTools.
- **Sin acceso a backend**: no se pueden confirmar latencias de endpoints, índices o planes de consulta.
- **Sin sesión activa**: no se puede verificar el comportamiento real de auth/token en flujo completo.
- **Código JS sin tipos**: en archivos `.js` sin JSDoc, algunas inferencias sobre tipos de datos pueden ser incorrectas.

---

## 12. Recomendaciones Operativas para Evitar Recaídas

- **Regla de PR — mutaciones**: toda mutación debe justificar sus invalidaciones (¿por qué no `setQueryData`?).
- **Regla de PR — `enabled`**: obligatorio cuando la query dependa de visibilidad, contexto o `id`.
- **Regla de PR — query keys**: usar factories, nunca arrays literales con objetos sin normalizar.
- **Regla de PR — filtros**: estado borrador y acción explícita de aplicar en filtros complejos.
- **Regla de PR — geocoding/mapas**: sin cálculo de geometría fuera del foco activo del usuario.
- **Regla de PR — auth**: no resolver token más de una vez por ciclo de request; usar caché + dedup de promesa.
- **Regla de PR — console**: no `console.error/log` en rutas de producción sin feature flag.
- **Validación de performance** para flujos críticos en revisiones de cambios.

---

## 13. Notas para Este Proyecto

Para este repositorio, usar como referencia base:

- `docs/audits/cmr-comercial-performance-playbook.md`
- `docs/audits/frontend-global-audit-2026-03-23.md`

Extender la auditoría con resultados específicos por módulo:

- **CRM**: prospectos, clientes, ofertas, agenda y interacciones comerciales.
- **Rutas comercial**: planificador (`RoutesPlannerPage`), plantillas, geocoding y mapa.
- **Rutas repartidor** (field): ejecución de ruta, paradas, autoventa, mapa.
- **Operaciones relacionadas**: pedidos, asignaciones y módulos adyacentes.

Si aparecen patrones ya documentados en el playbook, indicar explícitamente:

- dónde se repiten,
- dónde no se aplicaron aún,
- y dónde existen regresiones o divergencias respecto al patrón esperado.
