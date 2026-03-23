# Guía del circuito de auditoría e implementación del frontend

## Objetivo

Definir un circuito único, legible y repetible para auditar y mejorar el frontend real de este repositorio sin depender de scoreboards paralelos, prompts legacy ni notas sueltas.

La fuente de verdad del circuito es:

- `docs/prompts/frontend-circuit/03-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`

## Qué forma parte del circuito

El circuito activo del frontend se apoya en estos documentos:

1. `00-guia-circuito-frontend.md`
2. `01-prompt-maestro-auditoria-frontend.md`
3. `02-prompt-maestro-implementacion-frontend-por-bloques.md`
4. `03-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`
5. `04-network-cors-auth-cross-origin-frontend.md`

Todo lo anterior es circuito activo. Los prompts y auditorías movidos a `antiguos/` o `audits/antiguos/` pasan a ser referencia histórica.

## Reglas fijas

- La fuente principal de verdad es `03-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`.
- Ningún scoreboard auxiliar sustituye a esa fuente.
- Toda auditoría debe leer esa fuente antes de evaluar el frontend.
- Toda implementación por bloque debe partir de esa fuente y escribir de vuelta en ella.
- Las puntuaciones usan escala `0-10`.
- El objetivo por defecto de cada bloque es `9/10`.
- Los estados válidos son: `sin revisar`, `auditado`, `en mejora`, `cerrado`, `bloqueado`.
- Las `notas_provisionales` recogen hallazgos abiertos, hipótesis o riesgos todavía no cerrados.
- Las `notas_cerradas` recogen decisiones ya asentadas, mejoras verificadas o criterios ya consolidados.

## Cuándo usar cada documento

### 1. Auditoría global o por bloque

Usar:

- `01-prompt-maestro-auditoria-frontend.md`

Objetivo:

- Revisar el frontend por bloques reales del repo.
- Separar hallazgos de plataforma de hallazgos funcionales.
- Actualizar en la fuente central la puntuación, estado, fecha, gap principal y notas.

### 2. Implementación de mejoras por bloque

Usar:

- `02-prompt-maestro-implementacion-frontend-por-bloques.md`

Objetivo:

- Elegir un bloque o sub-bloque.
- Atacar el `gap_principal`.
- Implementar sin abrir scoreboards paralelos.
- Subir puntuación y dejar trazabilidad en la fuente central.

### 3. Problemas de red, auth cross-origin o tenant

Usar además:

- `04-network-cors-auth-cross-origin-frontend.md`

Casos típicos:

- preflight `OPTIONS`
- pérdida de sesión entre dominios
- cookies no enviadas
- `Origin` o `Access-Control-Allow-Origin`
- `Authorization` o `X-Tenant`
- subdominio equivocado
- proxy/backend respondiendo distinto a lo esperado por el frontend

## Flujo paso a paso

### Paso 1. Leer la fuente central

Antes de auditar o implementar, revisar:

- bloques
- puntuación actual
- objetivo
- estado
- fecha de revisión
- gap principal
- notas provisionales
- notas cerradas

### Paso 2. Elegir el bloque activo

Elegir un bloque de la fuente central según uno de estos criterios:

- menor puntuación
- mayor impacto funcional o de negocio
- mayor riesgo técnico
- dependencia para otros bloques
- incidencia actual en curso

### Paso 3. Ejecutar la auditoría o la mejora

Si el objetivo es entender estado y prioridades:

- usar el prompt maestro de auditoría

Si el objetivo es subir calidad o cerrar un gap ya identificado:

- usar el prompt maestro de implementación por bloques

Si aparecen síntomas de integración frontend-backend:

- abrir también el documento de network/CORS

### Paso 4. Actualizar la fuente de verdad

Tras cada auditoría o iteración de mejora, actualizar como mínimo:

- `puntuacion_actual`
- `estado`
- `fecha_revision`
- `gap_principal`
- `notas_provisionales` y/o `notas_cerradas`

### Paso 5. Mantener secundarios como secundarios

Se pueden conservar:

- logs históricos
- auditorías antiguas
- documentos de análisis por módulo
- scoreboards auxiliares de una iniciativa concreta

Pero siempre como material secundario. Si entran en conflicto con la fuente central, manda la fuente central.

## Cómo interpretar bloques y puntuaciones

- `0-3`: bloque roto, muy incompleto o sin patrón estable
- `4-6`: bloque funcional pero con deuda estructural relevante
- `7-8`: bloque usable y razonablemente estable, con gaps claros por cerrar
- `9`: bloque sólido para el estado actual del producto
- `10`: bloque excepcional y muy poco probable en un repo vivo; no usar salvo cierre muy justificado

## Relación con documentación histórica

Quedan como histórico y no como circuito activo:

- prompts antiguos de auditoría/evolución
- auditorías globales previas
- evolution logs
- troubleshooting aislado de CORS ya absorbido en el documento integrado
- scoreboards del plan legacy que mezclan estado real con roadmap histórico

## Criterio de actualización

Mover una nota a `notas_cerradas` solo cuando:

- la mejora exista en código o en decisión ya consolidada
- esté verificada con pruebas, revisión o validación suficiente
- ya no sea un hueco activo del bloque

Mantener una nota en `notas_provisionales` cuando:

- dependa de otra capa
- todavía sea hipótesis
- siga abierta
- requiera validación funcional, visual o de integración
