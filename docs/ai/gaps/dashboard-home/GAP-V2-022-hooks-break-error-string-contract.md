---
id: GAP-V2-022
title: useDailyCalibersBySpecies y usePunchesStatistics rompen el contrato estándar de error (string) de los hooks
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/hooks/useDailyCalibersBySpecies.js
  - src/hooks/usePunches.js
  - src/components/Admin/Dashboard/DailyCalibersBySpeciesCard/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-022 — Dos hooks devuelven el objeto `Error` crudo en vez de `error: string | null`

## Problema

`.claude/rules/hooks.md` documenta el contrato de retorno obligatorio para hooks de datos:
`{ data, isLoading, error: string | null, ... }`. Todos los hooks de este módulo lo cumplen
(`error: error?.message ?? null`) **excepto**:

```js
// src/hooks/useDailyCalibersBySpecies.js:30-34
return {
  data: data ?? { total_weight_kg: 0, calibers: [] },
  isLoading,
  error: error ?? null,   // ← objeto Error completo, no string
};
```

```js
// src/hooks/usePunches.js:51-56 (usePunchesStatistics)
return {
  data: data ?? null,
  isLoading,
  error: error ?? null,   // ← objeto Error completo, no string
  isError,
};
```

Esto obliga al componente consumidor a acceder de forma no tipada y no verificada a
propiedades que no existen en un `Error` estándar de JS:

```js
// src/components/Admin/Dashboard/DailyCalibersBySpeciesCard/index.js:145-149
{error.status === 403
  ? 'No tienes permiso para ver recepciones.'
  : error.status === 422 && error.data?.errors
    ? Object.values(error.data.errors).flat().join(' ')
    : error.message || 'Error al cargar los datos.'}
```

`error.status` y `error.data` solo existen si el error subyacente es una instancia de
`ApiError` (`src/lib/api/apiHelpers.js`) — un `Error` genérico (p. ej. de red, o lanzado por
un `.catch` intermedio) no tiene esas propiedades, y el componente asumiría `undefined` sin
avisar. Al ser un archivo `.js`, TypeScript no puede detectar este acceso potencialmente
inseguro.

`WorkerStatisticsCard` (que consume `usePunchesStatistics`) sí maneja el error de forma más
segura, con `error.userMessage || error.message`, pero igual depende del mismo contrato roto.

## Objetivo

Ambos hooks devuelven `error: string | null` como el resto del módulo, con el componente
decidiendo el mensaje a partir del string (o, si de verdad se necesita distinguir 403/422
para mostrar mensajes distintos, el hook expone explícitamente un campo tipado como
`errorStatus: number | null` además del string, en vez de pasar el objeto `Error` completo).

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`. Bajo riesgo pero
inconsistente con el resto de hooks del mismo módulo — vale la pena resolverlo junto con la
migración de `DailyCalibersBySpeciesCard` a `.tsx` (`GAP-V2-020`), ya que ahí se pondría de
manifiesto el tipo real de `error` al añadir tipos explícitos.

## Solución propuesta

1. En `useDailyCalibersBySpecies.js`: si el componente necesita distinguir 403/422,
   extraer explícitamente `status` y `data` del error de `ApiError` dentro del propio hook
   y devolver un shape tipado, p. ej. `{ error: string | null, errorStatus: number | null }`.
2. En `usePunchesStatistics`: igual — normalizar a `error: string | null` (usando
   `error?.userMessage ?? error?.message ?? null`, patrón ya usado en otros hooks de errores
   422 del proyecto).
3. Actualizar `DailyCalibersBySpeciesCard` para consumir el nuevo shape.

## Criterios de aceptación

- [ ] `useDailyCalibersBySpecies` y `usePunchesStatistics` devuelven `error` como string
      (más un campo adicional tipado si se necesita el status HTTP)
- [ ] `DailyCalibersBySpeciesCard` ya no accede a `error.status`/`error.data` sin tipos
- [ ] Los mensajes de error mostrados al usuario no cambian (403/422 siguen distinguiéndose)

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: forzar un 403 y un 422 en el endpoint de calibres diarios y confirmar
# que el mensaje mostrado no cambia respecto al comportamiento actual
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-020
