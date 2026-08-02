# Reglas de Contrato OpenAPI — La PesquerApp

> Fuente principal de verdad para todo lo relacionado con el contrato OpenAPI
> del backend. `docs/agent-system/rules/api-contract.md` (Codex),
> `.cursor/rules/35-api-contract-agent.mdc` (Cursor) y
> `.github/instructions/api-contract.instructions.md` (Copilot) son versiones
> condensadas que remiten aquí — si algo diverge, este archivo manda.
>
> Guía operativa paso a paso (comandos, cómo migrar un módulo):
> `.claude/api-contract-guide.md`.

## Fuente de verdad

El backend Laravel (repo separado) mantiene el contrato con Scribe y publica
una especificación filtrada para frontend, sin autenticación:

```
{APP_URL}/openapi/frontend.yaml
{APP_URL}/openapi/meta.json   (metadatos de esa versión, si el backend lo publica)
```

**Laravel/OpenAPI es la fuente de verdad para los tipos de API.** A partir de
ahora:

- Ningún agente debe crear manualmente una interfaz que duplique la forma de
  una respuesta o payload de Laravel para una entidad ya cubierta por el
  contrato generado (ver "Módulos migrados" abajo).
- El contrato excluye rutas sensibles (superadmin, impersonación, debug,
  internal, system) — eso ya lo filtra el backend, el frontend no necesita
  compensarlo.
- El contrato "todavía no puede considerarse completamente fiable" para
  entidades centrales (`Order`, `Pallet`, `Product`, `Customer`) según el
  propio audit de backend — no fuerces la migración de esas entidades solo
  porque el contrato ya las describe. Ver "Módulos no migrados".

## Ubicación de archivos

```
openapi/
├── frontend.yaml          # Copia local versionada del contrato (git)
├── meta.json               # Metadatos del backend para esa versión (git, si existe)
├── contract-lock.json      # sha256 + sourceUrl + fetchedAt + eco de meta.json (git)
└── README.md

src/types/generated/
└── api.d.ts                 # ARCHIVO GENERADO — NO EDITAR. No versionado (.gitignore).
                              # Se regenera en postinstall / CI desde openapi/frontend.yaml.

scripts/contract/
├── fetch-contract.mjs       # npm run contract:fetch
├── generate-types.mjs       # npm run contract:generate (también corre en postinstall)
├── verify-contract.mjs      # npm run contract:verify
├── check-drift.mjs          # npm run contract:drift (solo CI programado, no en dev)
└── lib/contract-core.mjs    # lógica pura, testeada en src/__tests__/contract/
```

## Comandos

| Comando                     | Qué hace                                                                                                              | Red necesaria |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------- |
| `npm run contract:fetch`    | Descarga `frontend.yaml` (+`meta.json`) del backend, escribe `contract-lock.json`                                     | Sí            |
| `npm run contract:generate` | Regenera `src/types/generated/api.d.ts` desde el `frontend.yaml` local                                                | No            |
| `npm run contract:update`   | `fetch` + `generate` — el flujo normal para adoptar una versión nueva del contrato                                    | Sí            |
| `npm run contract:verify`   | Comprueba que `frontend.yaml` no fue editado a mano, es generable, y que los tipos generados no están desactualizados | No            |
| `npm run contract:drift`    | Descarga el contrato real y compara contra el adoptado, sin sobrescribir                                              | Sí            |

`contract:generate` corre automáticamente en `postinstall` (todo `npm ci`/`npm install`
lo regenera) — nadie debería tener que acordarse de ejecutarlo a mano en el día a día.

**Mecanismo endurecido — sin modo bootstrap.** `contract:generate`,
`contract:verify` y `contract:drift` no tienen un estado "sin contrato
todavía, se omite sin bloquear": si `openapi/frontend.yaml` falta, fue
editado a mano, no es un OpenAPI generable, o `src/types/generated/api.d.ts`
está desactualizado respecto al contrato, el comando correspondiente termina
con código de salida 1 y un mensaje explícito — nunca en silencio con
código 0. Como `contract:generate` corre en `postinstall`, esto significa
que **`npm ci`/`npm install` fallan** mientras el repo no tenga un contrato
adoptado — es el comportamiento esperado, no un bug: el contrato es un
requisito del repo, no un paso opcional.

## Qué debe hacer un agente antes de terminar una tarea que toca tipos de API

1. Si la entidad ya está en un **módulo migrado** (ver abajo): importar el
   tipo desde `@/types/generated/api` (vía `components['schemas'][...]`), no
   declarar una interfaz manual nueva para esa misma forma.
2. Si el contrato cambió (`openapi/frontend.yaml` tiene diff): ejecutar
   `npm run contract:update`, revisar el diff de `git diff openapi/`, y
   comprobar manualmente los servicios/hooks que consumen esa entidad antes
   de dar la tarea por terminada — un contrato distinto puede introducir un
   breaking change que TypeScript solo detecta si el código realmente
   importa el tipo generado.
3. Ejecutar `npm run type-check` y los tests relevantes (ver
   `.claude/rules/testing.md`) — igual que con cualquier otro cambio.
4. No editar `src/types/generated/api.d.ts` a mano. Si el tipo generado no
   tiene la forma ideal para una pantalla, escribir un adaptador explícito
   (ver abajo), nunca parchear el archivo generado.
5. Documentar cualquier normalización temporal (compatibilidad snake/camel,
   nullabilidad ambigua) en el propio adaptador con un comentario que
   explique _por qué_ sigue haciendo falta, no solo _qué_ hace.

## Qué NO debe hacer un agente

- No usar `[key: string]: unknown` como solución permanente para una entidad
  API nueva — es el escape hatch del código legacy, no el patrón a seguir
  ahora que hay contrato.
- No asumir que dos endpoints que devuelven la "misma" entidad tienen la
  misma representación (ver `FieldOrder` vs `Order` en el audit — son tipos
  deliberadamente distintos). Usa siempre el tipo del endpoint específico
  (`operations['nombreOperacion']['responses'][...]`), no un tipo genérico
  reutilizado entre endpoints.
- No reemplazar manualmente un tipo generado con un cast (`as X`) para
  silenciar un error de tipos — si el generado no encaja, es una señal de
  que hace falta un adaptador o de que el contrato tiene un problema real
  que reportar a backend (ver `.claude/api-contract-guide.md`).
- No generar ni sustituir automáticamente schemas Zod de formulario,
  mensajes de validación en español, `superRefine`, o ViewModels — eso sigue
  siendo manual (ver "Frontera con formularios y ViewModels" abajo).
- No tocar Pedidos, Palets, Productos o Clientes como si ya estuvieran
  migrados (ver "Módulos no migrados").

## Módulos migrados

_(Vacío por ahora — el primer contrato real todavía no se ha adoptado. Ver
`.claude/api-contract-guide.md` § "Próximo módulo recomendado" para el plan.
Actualizar esta lista según se vayan migrando módulos.)_

| Módulo | Tipos generados reemplazan a | Fecha | GAP/PR |
| ------ | ---------------------------- | ----- | ------ |

## Módulos que NO deben migrarse todavía

Por deuda de tipado/arquitectura documentada en `FRONTEND_API_CONTRACT_AUDIT.md`:

- **Pedidos** (`Order`) — `perPage`/`per_page` inconsistente dentro del mismo
  módulo, `orders/active` con forma variable, relaciones
  `customer`/`transport`/`incoterm` sin garantía de completitud.
- **Palets** (`Pallet`) — sin tipo canónico, `usePallet.ts` no usa TanStack
  Query todavía.
- **Productos** (`Product`) — 3 tipos `ProductOption` con campos distintos y
  colisión de nombre.
- **Clientes** (`Customer`) — el "tipo real" vive en `customerFormSchema.ts`
  (formulario), no en `src/types/`.

Antes de migrar cualquiera de estos, resolver primero los desfases listados
en `FRONTEND_API_CONTRACT_AUDIT.md` §23-24, confirmados con backend.

## Frontera con formularios y ViewModels

Los tipos generados representan **requests y responses de Laravel**, no
sustituyen:

- Schemas Zod (`src/schemas/`, y los co-localizados junto a componentes) y
  sus tipos derivados — mensajes en español, `superRefine`, reglas
  condicionales de UI.
- ViewModels de pantalla/componente (`OrderCardOrder`, `OrderDetailsData`,
  etc.) — siguen siendo tipos manuales que adaptan la respuesta a lo que
  necesita esa vista concreta.
- Estado local de UI.

Patrón cuando un formulario necesita mandar un payload tipado por el
contrato:

```
FormValues (Zod, manual)
    ↓ toApiPayload()
Tipo request generado (components['schemas']['XxxRequest'] o
  operations['xxx']['requestBody']['content']['application/json'])
```

`toApiPayload()` es el adaptador — vive junto al schema del formulario, no en
`src/types/generated/`.

## Adaptadores — cuándo son legítimos

Un adaptador (`Tipo generado → ViewModel`) es apropiado para:

- Fechas/importes/pesos formateados para mostrar.
- Textos de estado traducidos/legibles.
- Valores calculados que no vienen del backend.
- Compatibilidad temporal con casing heredado (`campo ?? campo_snake_case`)
  **mientras el módulo en cuestión siga sin migrar** — no crear
  normalizadores nuevos para un módulo ya migrado, ahí el tipo generado ya
  dice qué casing es real.

No es un adaptador legítimo, es un parche defensivo a eliminar:

- Un cast `as any`/`as unknown as X` para saltarse un tipo generado que "no
  cuadra" sin entender por qué.
- Reimplementar `result.data ?? result` para un endpoint cuyo contrato ya
  dice explícitamente si envuelve en `data` o no.

## Nullabilidad y relaciones opcionales

El contrato puede marcar una relación como opcional, nullable, o ambas. Esto
puede significar: relación no cargada, relación inexistente, permiso
insuficiente, o endpoint resumido (ver audit §8). **No trates "ausente" como
equivalente a "null"** sin verificar cuál de los casos aplica para ese
endpoint concreto. Si la UI necesita distinguirlos, créalo explícito en el
adaptador/ViewModel (p. ej. `'not_loaded' | 'absent' | Customer`), no lo
colapses en `?? '—'` como hace el código legacy no migrado.

## Paginación

No existe una única convención global todavía (`perPage` en 34 servicios,
`per_page` en 6, incluso dentro de la misma carpeta `orders/`). Para cada
endpoint de un módulo migrado:

- Usa exactamente los parámetros que describe el contrato para ese
  endpoint — no asumas que es igual al resto.
- Usa el tipo de respuesta paginada específico del endpoint
  (`operations['xxx']['responses']['200']['content']['application/json']`),
  no un helper genérico que presuponga `{data, meta}` para todos.
- Si el contrato documenta `perPage` para un endpoint donde el código actual
  envía `per_page` (o viceversa), es un desfase real — corrígelo en ese
  servicio y documenta el cambio, no lo generalices al resto del módulo sin
  verificar.

## Errores

El contrato puede describir la forma de los errores (400/422/403/etc.) por
operación. Sigue usando `getErrorMessage`/`ApiError`/`setErrorsFrom422`
existentes (ver `.claude/rules/api-client.md`) — el contrato informa qué
campos esperar (`message`, `userMessage`, `errors`, `details`), no reemplaza
esa capa.

## CI

`npm run contract:verify` corre en CI (offline, sin red) en cada push/PR —
falla si `openapi/frontend.yaml` falta, fue editado a mano, dejó de ser un
OpenAPI válido, o si los tipos generados están desactualizados. El job
`build` depende de `contract-check` — un contrato en mal estado bloquea el
build igual que un error de `type-check`. Un workflow programado aparte
(`contract-drift`) descarga el contrato real del backend semanalmente y
falla si diverge del adoptado, sin tocar el build normal en cada push. Ver
`.claude/api-contract-guide.md` § CI.

**Consecuencia de este endurecimiento**: mientras `openapi/frontend.yaml` no
exista en el repo (contrato aún no adoptado), `npm ci` falla en todos los
jobs de CI (por el hook `postinstall`), no solo en `contract-check`. Esto es
intencional — el primer `npm run contract:fetch` real (con red hacia el
backend) es un prerrequisito para que CI vuelva a estar verde, no un paso
opcional que se pueda posponer indefinidamente.
