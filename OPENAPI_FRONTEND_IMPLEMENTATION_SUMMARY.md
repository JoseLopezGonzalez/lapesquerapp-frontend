# Implementación — Contrato OpenAPI en el frontend

> Fecha: 2026-08-02. Rama: `claude/openapi-frontend-integration-y6ein1`.

## Addendum — endurecimiento del mecanismo (mismo día, pase de seguimiento)

Tras la implementación inicial (más abajo), se hizo un pase explícito de
**endurecimiento**: se eliminó todo el modo bootstrap/no-bloqueante que dejaba
pasar `contract:generate`/`contract:verify`/`contract:drift`/`postinstall`
con código 0 cuando faltaba el contrato. Ahora:

- `resolveContractUrl()` **nunca devuelve `null`**: si no hay
  `OPENAPI_CONTRACT_URL` ni `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_API_BASE_URL`,
  cae a una URL fija de producción
  (`https://api.lapesquerapp.es/openapi/frontend.yaml`, constante
  `DEFAULT_CONTRACT_URL`).
- `contract:generate` **falla (exit 1)** si `openapi/frontend.yaml` no
  existe — ya no hay "no-op silencioso".
- `contract:verify` **falla (exit 1)** si el contrato falta, fue editado a
  mano, no es generable, **o si `src/types/generated/api.d.ts` no existe o
  está desactualizado respecto al contrato** (nueva comprobación: regenera
  en memoria y compara bit a bit).
- `contract:drift` **falla (exit 1)** si no hay contrato local adoptado
  (antes: exit 0 con aviso).
- Como `contract:generate` corre en `postinstall`, **`npm ci`/`npm install`
  ahora fallan** mientras `openapi/frontend.yaml` no exista en el repo — y
  por tanto también fallan todos los jobs de CI que instalan dependencias
  (`type-check`, `contract-check`, `build`), no solo `contract-check`. Esto
  es la consecuencia esperada y deseada de "sin modo bootstrap": el
  contrato es un requisito del repo, no un paso opcional que se pueda
  posponer en silencio.
- El fixture de test (`scripts/contract/__fixtures__/sample-openapi.yaml`)
  se mantiene — es exclusivamente para `src/__tests__/contract/*.test.ts`
  (probar que el mecanismo funciona), nunca se usa como sustituto del
  contrato real en ningún camino de ejecución de producción/CI.

Ver la sección "Respuestas al endurecimiento solicitado" al final de este
documento para el detalle punto por punto pedido por Jose.

## Resumen en una frase

Se construyó la infraestructura completa (fetch/generate/verify/drift,
CI, docs, reglas de agentes) para que `openapi/frontend.yaml` sea la fuente
de verdad de los tipos de API del frontend — pero **el primer contrato real
no se pudo descargar en esta sesión** (bloqueo de red, ver abajo), así que
no hay tipos generados reales todavía ni ningún módulo migrado. Todo lo
demás (herramienta, scripts, tests del pipeline con fixture, CI, reglas)
está terminado y funcionando.

## Por qué no hay contrato real ni módulo piloto migrado

Esta sesión corre en un entorno sandboxed sin acceso de red arbitrario: el
proxy de salida devuelve `403` para `api.lapesquerapp.es` (verificado con
`curl`), y el repo del backend (`lapesquerapp-backend`) no está adjunto a
esta sesión de GitHub (solo `lapesquerapp-frontend` lo está; intentar leerlo
devuelve "Access denied: repository ... is not configured for this
session"). Se preguntó explícitamente a Jose cómo proceder; eligió
**"solo infraestructura, sin generación real"** — construir todo el pipeline
listo para funcionar, y que él ejecute `npm run contract:update` en un
entorno con red real hacia el backend.

Consecuencia práctica: `openapi/frontend.yaml` no existe en el repo. Tras el
pase de endurecimiento (ver Addendum arriba), esto ya **no** se tolera en
silencio: `postinstall`, `contract:generate` y `contract:verify` fallan con
código 1 mientras el contrato no esté adoptado. En cuanto se ejecute
`npm run contract:fetch`/`contract:update` una vez con red real, el resto
del flujo (generación, verificación, CI) empieza a operar sin cambios
adicionales de código.

## Herramienta elegida y por qué

**`openapi-typescript` v7** (devDependency, CLI), no Orval.

- La tarea pide fase 1 = **solo tipos**, sin cliente HTTP ni hooks generados
  todavía (`fetchWithTenant`/`apiHelpers.js` tienen lógica de negocio real —
  heurística de 401, exclusión de logout, multipart — que no debe
  reemplazarse sin más).
- `openapi-typescript` genera únicamente tipos (`paths`, `components`,
  `operations`), sin runtime, sin opinión sobre el cliente HTTP — encaja
  exactamente con el alcance de fase 1 y no compromete a nada para fase 2.
- Orval está orientado a generar cliente + hooks de TanStack Query + Zod de
  una vez — resolvería un problema que esta fase explícitamente no debe
  resolver todavía (los hooks de CRM/Pedidos/Palets tienen invalidaciones y
  optimistic updates manuales que no se deben perder, y el propio audit
  recomienda no generar hooks hasta validar el spec).
- Camino de extensión futuro sin cambiar de herramienta: `openapi-fetch`
  (del mismo autor que `openapi-typescript`) permite envolver
  `fetchWithTenant`/`apiHelpers.js` como _mutator_ cuando se decida dar el
  paso al cliente generado — no haría falta migrar de toolchain.

## URL del contrato y mecanismo para obtenerlo

- URL real (de `.env.example`, no verificada en esta sesión por el bloqueo
  de red): `https://api.lapesquerapp.es/openapi/frontend.yaml` (prod) /
  `http://localhost:8000/openapi/frontend.yaml` (dev).
- Resolución configurable: `OPENAPI_CONTRACT_URL` explícita, o derivada de
  `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_API_BASE_URL` (las mismas env vars que
  ya usa `src/configs/config.js`) + `/openapi/frontend.yaml`.
- Mecanismo: `npm run contract:fetch` (Node nativo, `fetch()`, sin
  dependencias HTTP nuevas) descarga `frontend.yaml` + `meta.json` (si el
  backend lo publica) y escribe `openapi/contract-lock.json` con
  `sha256`/`sourceUrl`/`fetchedAt`/eco de `meta.json`.

## Ubicación de la copia local y de los tipos generados

- `openapi/frontend.yaml`, `meta.json`, `contract-lock.json` —
  **versionados en git** (decisión explícita: evita que un build de
  producción dependa silenciosamente de que la URL del backend esté
  disponible en ese instante; el cambio de contrato se revisa como
  cualquier diff de PR).
- `src/types/generated/api.d.ts` — **NO versionado** (añadido a
  `.gitignore`). Se deriva de forma determinista y sin red del
  `frontend.yaml` ya versionado, regenerándose en `postinstall` (todo
  `npm ci`/`npm install`) y en CI. Comprometerlo sería redundante y solo
  añadiría ruido de diff en cada cambio de contrato.
- Traceability de versión: `openapi/contract-lock.json` responde a "¿de qué
  versión del contrato backend salieron estos tipos?" sin burocracia extra
  (un solo JSON con hash + timestamp + metadatos del backend si existen).

## Comandos añadidos (`package.json`)

| Comando                     | Qué hace                                                                                | Red |
| --------------------------- | --------------------------------------------------------------------------------------- | --- |
| `npm run contract:fetch`    | Descarga el contrato, escribe `openapi/*`                                               | Sí  |
| `npm run contract:generate` | Regenera `src/types/generated/api.d.ts` desde `openapi/frontend.yaml`                   | No  |
| `npm run contract:update`   | `fetch` + `generate`                                                                    | Sí  |
| `npm run contract:verify`   | Detecta contrato ausente/editado a mano/no generable, y tipos generados desactualizados | No  |
| `npm run contract:drift`    | Compara el contrato real del backend contra el adoptado, sin escribir                   | Sí  |
| `postinstall` (nuevo hook)  | Corre `contract:generate` automáticamente en cada install                               | No  |

Todos los comandos anteriores (salvo `contract:fetch`/`contract:update`, que
necesitan red por definición) **fallan con exit 1** si el contrato no está
en el estado correcto — no hay un modo permisivo. Ver Addendum al principio
de este documento.

## Módulos piloto

Ninguno migrado todavía (bloqueado por la ausencia de contrato real — ver
arriba). **Piloto recomendado y preparado**: catálogos de sector
(`countries` primero, después `incoterms`/`payment-terms`/`fishing-gears`),
según `FRONTEND_API_CONTRACT_AUDIT.md` §25. `.claude/api-contract-guide.md`
§ "Cómo migrar un módulo nuevo" tiene la receta paso a paso ya escrita
contra el código real de `countryService.ts`/`useCountriesList.ts`/
`types/catalog.ts`, lista para ejecutar en cuanto exista el contrato.

**No se ha tocado ningún archivo de servicio/hook/tipo real** de countries
ni de ningún otro módulo — solo se preparó la receta en la guía, para no
dejar código a medias que dependa de un `src/types/generated/api.d.ts`
inexistente (habría roto `type-check`/build).

## Tipos manuales sustituidos

Ninguno todavía (consecuencia directa de no haber contrato real).

## Tipos manuales mantenidos

Todos los de `src/types/*.ts` sin cambios. En particular, explícitamente
**no tocar todavía** (documentado en `.claude/rules/api-contract.md` según
`FRONTEND_API_CONTRACT_AUDIT.md`): `Order`, `Pallet`, `Product`, `Customer`
— deuda de tipado/arquitectura previa a cualquier migración.

## Adaptadores creados

Ninguno de código (no había contrato real contra el que adaptar nada). Sí se
documentó el patrón (`Tipo generado → adaptador → ViewModel`) y la frontera
con Zod/formularios en `.claude/rules/api-contract.md`.

## Cliente HTTP generado

No. Fase 1 = solo tipos, por decisión explícita de la tarea y porque
`fetchWithTenant.js`/`apiHelpers.js` contienen lógica de negocio (401 con
heurística de validación, exclusión de eventos durante logout, multipart)
que un cliente generado no debe reemplazar sin más. Camino documentado para
fase 2: `openapi-fetch` como mutator sobre esa capa existente.

## Hooks generados

No, por la misma razón — los hooks de TanStack Query (invalidaciones,
optimistic updates de CRM, `usePallet.ts` sin migrar a react-query) siguen
100% manuales.

## Integración con tenant/auth

No se tocó `fetchWithTenant.js`, `apiHelpers.js`, ni ningún flujo de
autenticación/tenant — el contrato solo añade tipos, no una capa HTTP nueva.
`npm run type-check` limpio (0 errores) antes y después de todos los
cambios confirma que nada de la capa existente se rompió.

## Cambios en CI (`.github/workflows/`)

- `build-check.yml`: nuevo job `contract-check` (offline, `npm run
contract:verify`) — el job `build` ahora depende de `[type-check,
contract-check]`. No requiere red del backend en cada push/PR. Tras el
  endurecimiento, mientras `openapi/frontend.yaml` no exista en el repo,
  este job (y de hecho `npm ci` en todos los jobs) **falla** — ver Addendum.
- `contract-drift.yml` (nuevo, workflow separado): programado semanalmente
  (+ `workflow_dispatch` manual), descarga el contrato real y lo compara
  contra el adoptado sin sobrescribir nada — falla si diverge, para que el
  equipo sepa que hay que correr `contract:update` a propósito. Aislado del
  build normal para que un build de producción nunca dependa silenciosamente
  de que la URL del backend esté disponible en ese instante.

## Tests ejecutados y resultado

Cifras tras el pase de endurecimiento (ver Addendum):

- `npm run type-check`: **0 errores**.
- `npm run lint`: **0 errores** (267 warnings preexistentes, ninguno nuevo).
- `npm run test:run`: **308 passed / 22 failed** (baseline preexistente de
  `FRONTEND_API_CONTRACT_AUDIT.md` era 289 passed / 22 failed — los 22
  fallos son los mismos de siempre, artefactos de entorno sandboxed sin red
  hacia NextAuth y bugs de lógica de negocio no relacionados; los 19 tests
  de `src/__tests__/contract/` explican exactamente los 19 passed de más:
  289+19=308).
- Tests de `src/__tests__/contract/contract-core.test.ts` (19 tests, todos
  contra la **fixture sintética**, nunca el contrato real): cubren
  `resolveContractUrl` (incluyendo el fallback fijo `DEFAULT_CONTRACT_URL`
  cuando no hay env vars), `deriveMetaUrl`, `sha256`, `buildLock`, y
  `verifyContract` con los 5 modos de fallo endurecidos (contrato ausente,
  lock ausente, hash no coincide, contrato no generable, tipos generados
  ausentes) + los 2 casos de comparación de tipos generados (desactualizados
  → error; regenerados bit a bit → ok).
- Smoke test manual end-to-end (no persistido, limpiado después): copiar la
  fixture a `openapi/frontend.yaml` → `contract:generate` (✅, tipos
  validados con `tsc --noEmit`) → `contract:verify` (✅) → tocar el archivo
  generado a mano → `contract:verify` (❌ "desactualizado", confirmando la
  detección de staleness) → regenerar → `contract:verify` (✅ de nuevo) →
  editar `frontend.yaml` a mano → `contract:verify` (❌ "no coincide con el
  hash", confirmando la detección de edición manual del contrato). Se
  limpiaron todos los artefactos después — `openapi/frontend.yaml` y
  `src/types/generated/` no quedan en el repo.
- Smoke test de los 3 scripts en estado "sin contrato" (estado actual real
  del repo): `contract:generate`, `contract:verify` y `contract:drift`
  ejecutados directamente — los tres terminan con **exit 1** y un mensaje
  explícito, confirmando que ya no existe ningún modo bootstrap.

## Instrucciones de agentes modificadas

Fuente de verdad establecida: **`.claude/rules/api-contract.md`** (detallado)

- **`.claude/api-contract-guide.md`** (guía operativa día a día, añadida a
  la tabla "Mandatory Context Files" de `CLAUDE.md`). El resto de sistemas de
  instrucciones remiten a ella en vez de duplicarla:

* `CLAUDE.md` — fila en "Mandatory Context Files", fila en la tabla de
  reglas, comandos nuevos en "Comandos esenciales", entrada nueva en "Deuda
  técnica documentada" (#9, contrato en fase 1).
* `AGENTS.md` (Codex) — nuevo bullet en "Rule precedence" apuntando a
  `.claude/rules/api-contract.md` / `docs/agent-system/rules/api-contract.md`.
* `docs/agent-system/rules/api-contract.md` (nuevo) — versión condensada
  para Codex, mismo patrón que `api-client.md`/`hooks.md` en esa carpeta.
* `.cursor/rules/31-api-contract-agent.mdc` (nuevo) — versión condensada
  para Cursor, mismo patrón que `30-api-client-agent.mdc`.
* `.github/instructions/api-contract.instructions.md` (nuevo) — versión
  condensada para Copilot, mismo patrón que `api-client.instructions.md`.
* `docs/ai-context/04-api-services.md` — nueva sección al inicio apuntando
  a la guía, sin duplicar contenido.

No se tocó `.ai_standards/` (marcado como legacy por el propio audit de
frontend) ni los ~30 `SKILL.md` de `.agents/skills/` — están fuera del
alcance de "contrato OpenAPI" y tocarlos todos habría sido un refactor no
solicitado por esta tarea.

## Limitaciones conocidas

1. **No hay contrato real adoptado** — es el bloqueo principal de esta
   sesión (ver arriba). Nada de lo que sigue puede completarse sin esto:
   módulo piloto real, comparación campo a campo del tipo generado contra
   `types/catalog.ts`, primer `contract-lock.json` real.
2. **No se pudo verificar la URL real del contrato** ni su forma (`curl`
   bloqueado por el proxy de red del entorno) — todo lo dicho sobre la URL
   viene de `.env.example`, no de una descarga real.
3. **Duplicación de sistemas de instrucciones más allá del contrato OpenAPI**
   (`.cursor/rules` 17 archivos, `.github/instructions` 8,
   `.agents/skills` ~30, `.ai_standards` 5 legacy) sigue existiendo tal cual
   la documentó `FRONTEND_API_CONTRACT_AUDIT.md` §2 — esta implementación
   solo añadió una fuente de verdad _nueva_ para el contrato OpenAPI
   siguiendo el patrón ya existente en el repo (canónico en `.claude/`,
   condensado en el resto); no consolidó el resto del sistema, que es un
   problema preexistente más amplio y no forma parte del alcance de esta
   tarea.
4. `openapi-fetch` (cliente generado) no se instaló — se documentó como
   camino de fase 2, no se añadió como dependencia sin uso.

## Módulos que no deben migrarse todavía

Pedidos (`Order`), Palets (`Pallet`), Productos (`Product`), Clientes
(`Customer`) — ver razones detalladas en `FRONTEND_API_CONTRACT_AUDIT.md`
§23-25 y la tabla correspondiente en `.claude/rules/api-contract.md`.

## Próximo módulo recomendado

**`countries`** primero (catálogo más simple, 0 dependencias cruzadas),
seguido de `incoterms`/`payment-terms`/`fishing-gears`. Con el contrato real
ya adoptado, el siguiente paso concreto es:

1. `npm run contract:update` (requiere red real hacia
   `api.lapesquerapp.es` o el backend de dev).
2. Seguir la receta de `.claude/api-contract-guide.md` §
   "Cómo migrar un módulo nuevo" contra `countryService.ts`.
3. Comparar el `Country` generado contra `types/catalog.ts:82-86` — si
   coincide o mejora, completar la migración; si no, documentar el hallazgo
   en la sección siguiente y reportarlo a backend antes de forzarla.

## Problemas detectados en el OpenAPI que deban devolverse al equipo backend

Ninguno todavía — no se pudo inspeccionar el contrato real en esta sesión
(ver "Limitaciones conocidas" #1-2). En cuanto se ejecute el primer
`npm run contract:update`, comparar contra los desfases ya documentados en
`FRONTEND_API_CONTRACT_AUDIT.md` §23 (`perPage`/`per_page`, `orders/active`,
nullabilidad de `customer`/`transport`) y anotar aquí lo que se confirme o
se descarte.

## Lista completa de archivos modificados/creados

**Modificados:**

- `package.json` (scripts `contract:*`, `postinstall`, devDependency `openapi-typescript`)
- `package-lock.json` (idem)
- `.gitignore` (`/src/types/generated/`)
- `CLAUDE.md` (tabla de contexto obligatorio, tabla de reglas, comandos, deuda técnica)
- `AGENTS.md` (rule precedence)
- `docs/ai-context/04-api-services.md` (pointer al contrato)
- `.github/workflows/build-check.yml` (job `contract-check`)

**Nuevos:**

- `openapi/README.md` (directorio vacío hasta el primer `contract:fetch`, explica por qué)
- `scripts/contract/lib/contract-core.mjs`
- `scripts/contract/fetch-contract.mjs`
- `scripts/contract/generate-types.mjs`
- `scripts/contract/verify-contract.mjs`
- `scripts/contract/check-drift.mjs`
- `scripts/contract/__fixtures__/sample-openapi.yaml` (fixture de test, no el contrato real)
- `src/__tests__/contract/contract-core.test.ts` (16 tests)
- `.claude/rules/api-contract.md` (canónico)
- `.claude/api-contract-guide.md` (guía operativa)
- `docs/agent-system/rules/api-contract.md` (condensado, Codex)
- `.cursor/rules/31-api-contract-agent.mdc` (condensado, Cursor)
- `.github/instructions/api-contract.instructions.md` (condensado, Copilot)
- `.github/workflows/contract-drift.yml`
- `OPENAPI_FRONTEND_IMPLEMENTATION_SUMMARY.md` (este archivo)

## Cambios preexistentes que no se tocaron

`FRONTEND_API_CONTRACT_AUDIT.md` (leído, no modificado), `AGENTS.md` (solo
la sección de rule precedence, resto intacto), toda la capa de servicios
(`src/services/**`), hooks (`src/hooks/**`), tipos manuales
(`src/types/**`), `fetchWithTenant.js`, `apiHelpers.js`,
`entitiesConfig.js`, `queryKeys.ts`, y los ~60 archivos de los sistemas de
instrucciones duplicados no relacionados con el contrato OpenAPI (ver
"Limitaciones conocidas" #3).

## Respuestas al endurecimiento solicitado (pase de seguimiento)

1. **URL exacta que consulta el frontend**: la que resuelva
   `resolveContractUrl()` — `OPENAPI_CONTRACT_URL` si está definida; si no,
   `{NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL}/openapi/frontend.yaml`;
   si tampoco hay ninguna, el fijo de producción
   `https://api.lapesquerapp.es/openapi/frontend.yaml`
   (`DEFAULT_CONTRACT_URL` en `scripts/contract/lib/contract-core.mjs`). En
   este repo, sin overrides, la URL efectiva es esa constante fija.
2. **Comando que descarga y actualiza el contrato**: `npm run contract:update`
   (fetch + generate). Solo fetch: `npm run contract:fetch`.
3. **Dónde se guarda la copia**: `openapi/frontend.yaml` (+ `openapi/meta.json`
   si el backend lo publica, + `openapi/contract-lock.json` con el hash de
   versión), los tres versionados en git.
4. **Comando que genera los tipos**: `npm run contract:generate` (offline,
   deriva `src/types/generated/api.d.ts` de `openapi/frontend.yaml`) — corre
   también automáticamente en `postinstall`, es decir en cada
   `npm ci`/`npm install`. No hay ningún paso manual de copiar/pegar.
5. **Qué ocurre si la URL no responde**: `contract:fetch` (y por tanto
   `contract:update`) falla con exit 1 y el mensaje de error de red/HTTP —
   no escribe nada en `openapi/`. `contract:drift` (el chequeo periódico)
   también falla con exit 1 si no puede contactar con el backend. El build
   normal nunca depende de esto: usa la copia local ya versionada.
6. **Qué ocurre si los tipos están desactualizados**: `contract:verify`
   regenera el contrato local en memoria/tmp y compara bit a bit contra
   `src/types/generated/api.d.ts` — si difieren, falla con exit 1
   ("está desactualizado... ejecuta npm run contract:generate"). Como
   `contract:generate` corre en `postinstall`, en la práctica un `npm ci`
   limpio siempre deja los tipos al día; esta comprobación protege contra
   un `src/types/generated/` local viejo que sobrevivió a un `npm ci` sin
   `postinstall` (p. ej. `--ignore-scripts`) o manipulado a mano.
7. **¿Sigue existiendo algún modo bootstrap o fixture temporal?** No en el
   mecanismo real: `contract:generate`/`contract:verify`/`contract:drift`/
   `postinstall` fallan con exit 1 ante cualquier ausencia o desactualización,
   sin excepciones. Sí sigue existiendo `scripts/contract/__fixtures__/sample-openapi.yaml`,
   pero es exclusivamente un fixture de **test** consumido solo por
   `src/__tests__/contract/contract-core.test.ts` — nunca se lee desde
   `fetch-contract.mjs`/`generate-types.mjs`/`verify-contract.mjs`/
   `check-drift.mjs`, ni aparece en ningún flujo de build/CI real.
8. **Archivos modificados en este pase de endurecimiento**:
   `scripts/contract/lib/contract-core.mjs` (resolveContractUrl con fallback
   fijo, verifyContract sin estado 'missing' + comprobación de staleness de
   tipos generados, banner compartido `withBanner`),
   `scripts/contract/generate-types.mjs` (falla si falta el contrato, usa
   `withBanner` compartido), `scripts/contract/verify-contract.mjs` (falla
   si falta el contrato, pasa `generatedPath` para detectar staleness),
   `scripts/contract/check-drift.mjs` (falla si falta el contrato local),
   `scripts/contract/fetch-contract.mjs` (quita la rama muerta de "URL
   indeterminada"), `src/__tests__/contract/contract-core.test.ts`
   (19 tests, actualizado para el mecanismo endurecido + nuevos casos de
   staleness), `openapi/README.md`, `.claude/rules/api-contract.md`,
   `.claude/api-contract-guide.md` (los tres actualizados para documentar el
   comportamiento endurecido), y este mismo archivo.
9. **Resultado de las comprobaciones ejecutadas**: `type-check` 0 errores,
   `lint` 0 errores (267 warnings preexistentes), `test:run` 308 passed / 22
   failed (mismo baseline de siempre + 19 tests nuevos, todos en verde).
   Smoke tests manuales de los 5 escenarios de fallo (contrato ausente, lock
   ausente, edición a mano, contrato inválido, tipos desactualizados) y del
   escenario de éxito, todos con el resultado esperado (ver sección
   "Tests ejecutados y resultado").

No se tocó ningún tipo manual, servicio, hook, ni módulo de negocio en este
pase — solo el mecanismo de sincronización, tal como se pidió. No se ha
hecho commit ni push.
