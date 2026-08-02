# Implementación — Contrato OpenAPI en el frontend

> Fecha: 2026-08-02. Rama: `claude/openapi-frontend-integration-y6ein1`. Sin commits ni push (por instrucción explícita de la tarea).

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

Consecuencia práctica: `openapi/frontend.yaml` no existe en el repo. Todos
los scripts detectan ese estado de "bootstrap" y no fallan (`postinstall`,
`contract:generate`, `contract:verify` avisan y salen con código 0). En
cuanto se ejecute `npm run contract:update` una vez con red real, el resto
del flujo (generación, verificación, CI) empieza a operar sin cambios
adicionales.

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

| Comando                     | Qué hace                                                              | Red |
| --------------------------- | --------------------------------------------------------------------- | --- |
| `npm run contract:fetch`    | Descarga el contrato, escribe `openapi/*`                             | Sí  |
| `npm run contract:generate` | Regenera `src/types/generated/api.d.ts` desde `openapi/frontend.yaml` | No  |
| `npm run contract:update`   | `fetch` + `generate`                                                  | Sí  |
| `npm run contract:verify`   | Detecta ediciones a mano del contrato + valida que sea generable      | No  |
| `npm run contract:drift`    | Compara el contrato real del backend contra el adoptado, sin escribir | Sí  |
| `postinstall` (nuevo hook)  | Corre `contract:generate` automáticamente en cada install             | No  |

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
contract-check]`. No requiere red del backend en cada push/PR; en el
  estado de bootstrap actual (sin `openapi/frontend.yaml`) el job pasa con
  un aviso, no bloquea.
- `contract-drift.yml` (nuevo, workflow separado): programado semanalmente
  (+ `workflow_dispatch` manual), descarga el contrato real y lo compara
  contra el adoptado sin sobrescribir nada — falla si diverge, para que el
  equipo sepa que hay que correr `contract:update` a propósito. Aislado del
  build normal para que un build de producción nunca dependa silenciosamente
  de que la URL del backend esté disponible en ese instante.

## Tests ejecutados y resultado

- `npm run type-check`: **0 errores**, antes y después de todos los cambios.
- `npm run lint`: **0 errores** (267 warnings preexistentes, ninguno nuevo —
  verificado con grep sobre el output).
- `npm run test:run`: **305 passed / 22 failed** (baseline preexistente
  documentado en `FRONTEND_API_CONTRACT_AUDIT.md` era 289 passed / 22
  failed — los 22 fallos son los mismos de siempre, artefactos de entorno
  sandboxed sin red hacia NextAuth y bugs de lógica de negocio no
  relacionados; los 16 tests nuevos de `src/__tests__/contract/` suman
  exactamente los 16 passed de más: 289+16=305).
- Tests nuevos (`src/__tests__/contract/contract-core.test.ts`, 16 tests):
  cubren `resolveContractUrl`, `deriveMetaUrl`, `sha256`, `buildLock`, y
  sobre todo `verifyContract`/`runOpenApiTypeScript` ejecutados de verdad
  contra una **fixture sintética** (`scripts/contract/__fixtures__/sample-openapi.yaml`,
  claramente marcada como fixture de test, nunca el contrato real) — prueban
  que el mecanismo (hash-lock, detección de edición a mano, generación real
  vía CLI de `openapi-typescript`) funciona de extremo a extremo, sin
  fabricar un contrato falso etiquetado como real.
- Smoke test manual adicional (no persistido): se copió la fixture a
  `openapi/frontend.yaml` temporalmente, se corrió `contract:generate` →
  `src/types/generated/api.d.ts` real generado y validado con
  `tsc --noEmit` (0 errores) → `contract:verify` → ✅. Se limpiaron todos los
  artefactos después (`openapi/frontend.yaml` y `src/types/generated/` no
  quedan en el repo) para no dejar una fixture pareciendo el contrato real.

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
