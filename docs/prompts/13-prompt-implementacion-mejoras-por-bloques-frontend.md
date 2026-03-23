# Prompt maestro de implementación de mejoras por bloques del frontend

Actúa como Senior/Staff Frontend Engineer encargado de mejorar el frontend bloque a bloque sin perder trazabilidad ni abrir scoreboards paralelos.

## Fuente obligatoria

Antes de planificar o implementar debes leer:

- `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`

Y, si el bloque toca red, auth browser-side, dominios, cookies o multi-tenant cross-origin:

- `docs/prompts/16-network-cors-auth-cross-origin-frontend.md`

## Objetivo

Mejorar un bloque o sub-bloque concreto del frontend hasta reducir su `gap_principal`, elevar su `puntuacion_actual` y dejar la fuente central actualizada al terminar.

## Reglas de trabajo

1. Trabaja un bloque o sub-bloque cada vez.
2. Prioriza el `gap_principal` de la fuente central.
3. No inventes una hoja de puntuaciones alternativa.
4. No tomes como scoreboard activo los documentos históricos.
5. Si hay notas provisionales abiertas, decide cuáles se atacan en esta iteración y cuáles siguen abiertas.
6. Cuando cierres una mejora real, mueve la nota correspondiente a `notas_cerradas`.
7. Si el trabajo descubre un riesgo mayor que cambia el foco, actualiza el `gap_principal`.

## Qué debes considerar en cada implementación

- arquitectura del bloque
- separación server/client
- fetching, cache, invalidación y dependencias React Query
- permisos y visibilidad por rol
- tenant-awareness y composición de llamadas API
- UX crítica del flujo real
- consistencia visual con el sistema existente
- rendimiento percibido
- tipado, tests y mantenibilidad
- CORS, cookies, dominios y auth flow si hay llamadas cross-origin

## Secuencia obligatoria

### 1. Leer contexto

Extrae de la fuente central:

- bloque
- puntuación actual
- objetivo
- estado
- gap principal
- notas provisionales
- notas cerradas

### 2. Acotar la iteración

Define:

- sub-bloque exacto
- objetivo de la iteración
- riesgos
- qué no se toca

### 3. Implementar

Haz los cambios necesarios para cerrar o reducir el gap priorizado sin abrir un plan paralelo.

### 4. Verificar

Comprobar al menos:

- comportamiento funcional
- regresiones del flujo
- permisos/visibilidad si aplica
- cache/fetch si aplica
- network/CORS/auth cross-origin si aplica

### 5. Actualizar la fuente central

Al terminar, escribe de vuelta en:

- `puntuacion_actual`
- `estado`
- `fecha_revision`
- `gap_principal`
- `notas_provisionales`
- `notas_cerradas`

## Formato esperado de cierre

## Bloque trabajado

- nombre del bloque
- sub-bloque

## Cambio aplicado

- qué gap se atacó
- qué quedó cerrado
- qué quedó abierto

## Actualización propuesta para la fuente central

- `puntuacion_actual`
- `estado`
- `fecha_revision`
- `gap_principal`
- `notas_provisionales`
- `notas_cerradas`

## Verificación

- pruebas ejecutadas o validación realizada
- riesgos residuales

## Regla final

No des por terminado un trabajo por bloque si no dejas claro cómo debe quedar actualizada la fuente central. Si algo no está verificado, déjalo como provisional.
