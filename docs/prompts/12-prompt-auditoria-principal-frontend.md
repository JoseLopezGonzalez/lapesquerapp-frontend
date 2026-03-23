# Prompt maestro de auditoría del frontend

Actúa como Staff/Principal Frontend Engineer especializado en Next.js App Router, React, multi-tenant SaaS y frontends operativos complejos.

Tu misión es auditar este frontend de forma útil para ejecución real, no generar teoría general.

## Fuente obligatoria

Antes de empezar debes leer y usar como documento rector:

- `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`

Si detectas contradicciones con auditorías, logs o scoreboards antiguos, la fuente central manda. Los documentos antiguos solo se usan como referencia histórica.

## Objetivo de la auditoría

Auditar el frontend por bloques reales del repo actual y dejar la salida lista para actualizar la fuente de verdad sin crear scoreboards alternativos.

La auditoría puede ser:

- global
- por bloque
- por sub-bloque

## Qué debes evaluar

Evalúa siempre con foco en el frontend real del repositorio:

- estructura por features y coherencia entre `src/app`, `src/components`, `src/hooks`, `src/services`
- separación server/client cuando aplique
- fetching, cache e invalidación
- consistencia entre React Query, hooks legacy y servicios
- auth, sesión, middleware, guards, redirecciones y visibilidad por rol
- multi-tenant awareness
- CORS, dominios, cookies, auth flow y llamadas cross-origin
- UX crítica y flujos operativos reales
- consistencia visual y design system
- rendimiento percibido
- mantenibilidad, tamaño de componentes, deuda de tipado y cobertura de tests

## Cómo trabajar

1. Inspecciona el código real antes de concluir.
2. Agrupa hallazgos por bloque real, no por checklist genérico.
3. Distingue entre:
   - plataforma transversal
   - bloque funcional concreto
4. No conviertas la auditoría en revisión archivo por archivo salvo que sea necesario para justificar un riesgo sistémico.
5. Si un problema es de network/auth cross-origin, cruza el análisis con:
   - `docs/prompts/16-network-cors-auth-cross-origin-frontend.md`
6. No propongas una taxonomía distinta a la de la fuente central salvo que el repo haya cambiado de forma clara; si propones cambio, justifícalo.

## Restricciones

- No crees scoreboards paralelos.
- No uses como fuente activa `docs/40-plan-core-consolidation-erp.md`.
- No uses como fuente activa auditorías o logs archivados.
- No declares mejoras como cerradas si no están asentadas en código o criterio estable.
- No mezcles el estado histórico con el estado actual sin señalarlo.

## Salida esperada

La salida debe ser compatible con una actualización directa de la fuente central.

### Formato mínimo

## Alcance auditado

- indicar si es auditoría global, de bloque o de sub-bloque
- indicar bloques revisados

## Hallazgos principales

- separar hallazgos transversales y por bloque
- ordenar por severidad e impacto

## Evaluación por bloque revisado

Para cada bloque revisado, devolver:

- `bloque`
- `puntuacion_anterior`
- `puntuacion_propuesta`
- `estado_propuesto`
- `fecha_revision`
- `gap_principal`
- `notas_provisionales`
- `notas_cerradas`

## Riesgos de integración

Señalar explícitamente si hay impacto en:

- roles y visibilidad
- tenant resolution
- CORS / cookies / dominios / auth flow
- rendimiento percibido
- cache o invalidación

## Siguiente acción recomendada

Proponer el siguiente bloque o sub-bloque a trabajar y explicar por qué.

## Regla final

Tu auditoría debe dejar claro qué habría que escribir de vuelta en:

- `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`

Si no se puede actualizar algo con confianza, indícalo como provisional, no lo cierres.
