# Guía operativa — Contrato OpenAPI

> Uso diario. Para las reglas detalladas (qué es legítimo/prohibido, frontera
> con formularios, nullabilidad, paginación), ver `.claude/rules/api-contract.md`.
> Añadido a la tabla de "Mandatory Context Files" de `CLAUDE.md` — léelo antes
> de tocar tipos/servicios de un módulo cubierto por el contrato.

## Fuente de verdad

Backend Laravel (repo `lapesquerapp-backend`, separado de este repo), publica:

```
{APP_URL}/openapi/frontend.yaml   # contrato filtrado para frontend, sin auth
{APP_URL}/openapi/meta.json       # metadatos de esa versión (si el backend lo publica)
```

En este repo, `{APP_URL}` es `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE_URL`
(las mismas env vars que ya usa `src/configs/config.js`). Para apuntar a otra
URL sin tocar esas envs: `OPENAPI_CONTRACT_URL`.

**Estado actual: el primer contrato real todavía no se ha adoptado en este
repo** (ver `OPENAPI_FRONTEND_IMPLEMENTATION_SUMMARY.md` para el motivo — la
sesión que construyó esta infraestructura no tenía red hacia el backend).
`openapi/frontend.yaml` no existe todavía. Todo lo de abajo funciona en
cuanto alguien con red hacia el backend ejecute `npm run contract:update`
una vez.

## Cómo actualizar el contrato

```bash
npm run contract:update    # descarga + regenera tipos, un solo comando
```

Internamente es `contract:fetch` (descarga `openapi/frontend.yaml` +
`meta.json`, escribe `openapi/contract-lock.json` con el hash/versión) +
`contract:generate` (regenera `src/types/generated/api.d.ts`).

Después: `git diff openapi/` para ver qué cambió en el contrato, y
`git status` para confirmar que `src/types/generated/` NO aparece (está en
`.gitignore` — se regenera solo, ver más abajo).

## Cómo generar tipos (sin tocar la red)

```bash
npm run contract:generate
```

Ya corre automáticamente en `postinstall` (todo `npm ci`/`npm install`
regenera `src/types/generated/api.d.ts` desde el `openapi/frontend.yaml`
comprometido en git). No hace falta acordarse de ejecutarlo a mano en el día
a día — solo tras un `npm run contract:fetch` si quieres ver el resultado
sin reinstalar.

## Cómo verificar sincronización

```bash
npm run contract:verify   # offline — corre en CI en cada push/PR
npm run contract:drift    # con red — compara contra el backend real, no sobrescribe nada
```

`contract:verify` falla si `openapi/frontend.yaml` fue editado a mano (no
coincide con `contract-lock.json`) o dejó de ser un OpenAPI generable.
`contract:drift` es para detectar que el backend publicó una versión nueva
que todavía no se ha adoptado — se ejecuta en un workflow programado, no en
cada build.

## Estructura de carpetas

```
openapi/frontend.yaml, meta.json, contract-lock.json   # versionados en git
src/types/generated/api.d.ts                            # generado, NO versionado, NO editar a mano
scripts/contract/                                        # fetch/generate/verify/drift + lib testeada
src/__tests__/contract/                                   # tests del pipeline (usan una fixture sintética)
```

## Qué es generado vs qué se mantiene manual

| Se genera del contrato                                               | Se mantiene manual                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/types/generated/api.d.ts` (`paths`, `components`, `operations`) | Todo `src/types/*.ts` existente para módulos no migrados                        |
| —                                                                    | Schemas Zod (`src/schemas/`, co-localizados) y sus tipos derivados              |
| —                                                                    | ViewModels de pantalla (`OrderCardOrder`, etc.)                                 |
| —                                                                    | `src/lib/routes/queryKeys.ts` (invalidación/tenant-scoping tribal)              |
| —                                                                    | Hooks de TanStack Query, servicios de dominio, adaptadores                      |
| —                                                                    | `fetchWithTenant.js`, `apiHelpers.js` (capa HTTP — el contrato no la reemplaza) |

Fase 1 (esta implementación) genera **solo tipos**. No hay cliente HTTP
generado ni hooks generados — ver `OPENAPI_FRONTEND_IMPLEMENTATION_SUMMARY.md`
§ "Cliente HTTP generado o no" para el razonamiento.

## Módulos migrados / no migrados

Ver la tabla en `.claude/rules/api-contract.md` § "Módulos migrados" — hoy
está vacía (contrato aún no adoptado). Pedidos, Palets, Productos y Clientes
están explícitamente marcados como **no migrar todavía** por la deuda de
tipado que documenta `FRONTEND_API_CONTRACT_AUDIT.md`.

## Cómo migrar un módulo nuevo (receta)

Ejemplo con **countries** (piloto recomendado, ver
`FRONTEND_API_CONTRACT_AUDIT.md` §25):

1. Confirma que `npm run contract:update` ya se ejecutó y que
   `src/types/generated/api.d.ts` existe.
2. Abre `src/types/generated/api.d.ts` y localiza
   `components['schemas']['Country']` (o el nombre real que use el backend
   — puede no llamarse igual) y las `operations` de `/countries`.
3. Compara campo a campo contra el tipo manual actual
   (`src/types/catalog.ts` → `interface Country`). Si coincide o mejora
   (menos `[key: string]: unknown`, casing correcto), continúa. Si el
   generado tiene huecos o formas raras, para y repórtalo (ver "Cambios
   incompatibles" abajo) — no fuerces la migración.
4. En `src/services/domain/countries/countryService.ts`, cambia el tipo de
   retorno de `list`/`getById`/etc. para usar el tipo generado en vez de
   `Country` de `src/types/catalog.ts`. Si la forma paginada del contrato
   coincide con `CatalogListResponse<T>`, puedes seguir reutilizando ese
   wrapper; si no coincide (revisa `perPage` vs `per_page`, `data`/`meta`
   reales del contrato), usa el tipo de respuesta específico del contrato en
   su lugar — no fuerces el wrapper genérico si el endpoint no lo respeta.
5. Actualiza `src/hooks/useCountriesList.ts` para propagar el tipo nuevo.
6. Deja `interface Country` en `src/types/catalog.ts` solo si otras partes
   del código todavía la importan; si `countries` queda 100% migrado,
   márcala como candidata a eliminar (no la borres a ciegas — `grep` antes).
7. Añade la fila correspondiente a la tabla "Módulos migrados" en
   `.claude/rules/api-contract.md`.
8. `npm run type-check` + tests relevantes de `countries` (crear si no
   existen, ver `.claude/rules/testing.md`).

## Cómo tratar adaptadores

Ver `.claude/rules/api-contract.md` § "Adaptadores — cuándo son legítimos".
Regla rápida: si el adaptador existe para dar forma de UI a un dato real
(fecha formateada, texto de estado), es legítimo. Si existe para "arreglar"
una inconsistencia del contrato (casing, envoltorio distinto), es un parche
temporal — documenta por qué con un comentario y bórralo en cuanto el
backend lo resuelva.

## Cómo tratar formularios

No tocar. Los schemas Zod y sus reglas (mensajes en español, `superRefine`,
defaults de UI) siguen siendo 100% manuales. Si un formulario necesita
validar que su payload cuadra con lo que el contrato espera para ese
endpoint, usa el tipo `request` generado como referencia en un adaptador
`toApiPayload()`, no como el tipo del formulario en sí.

## Cambios compatibles vs incompatibles

- **Compatible** (proceder sin preguntar): campo nuevo opcional añadido a un
  tipo ya migrado, endpoint nuevo, enum con un valor nuevo que el frontend
  no usaba.
- **Incompatible** (parar, no adaptar en silencio): campo eliminado o
  renombrado en un tipo ya migrado, cambio de `required` a opcional (o
  viceversa) en un campo que el frontend asume, cambio de forma de
  paginación/envoltorio en un endpoint ya migrado, cambio de tipo de un
  campo (`string` → `number`, etc.).

Ante un cambio incompatible: no lo silencies con un cast. Corrige el
consumidor real, y si el cambio no estaba anunciado, repórtalo (ver abajo).

## Problemas del contrato a devolver a backend

Si al migrar un módulo el contrato generado no coincide con lo que el
backend realmente devuelve (contrato desactualizado, campo mal tipado,
`required` que en la práctica viene `null`), no lo compenses con un
adaptador defensivo permanente — anota el hallazgo en
`OPENAPI_FRONTEND_IMPLEMENTATION_SUMMARY.md` § "Problemas detectados en el
OpenAPI" (o ábrelo de nuevo si ya se cerró) para que quede trazado y se
pueda llevar al equipo de backend.

## Qué debe hacer un agente antes de terminar una tarea de este tipo

Ver la lista completa en `.claude/rules/api-contract.md` § "Qué debe hacer
un agente...". Resumen: usar el tipo generado del módulo migrado
correspondiente (no duplicar), `npm run contract:update` si el contrato
cambió + revisar el diff, `npm run type-check` + tests, nunca editar
`src/types/generated/api.d.ts` a mano, documentar normalizaciones
temporales.
