# Skill: Deep Audit Module — La PesquerApp

## Cuándo se activa

Cuando Jose escribe `/deep-audit-module module={module}` o pide en lenguaje natural "haz una auditoría profunda de {módulo}" / "audita a fondo {módulo}".

Este skill lo ejecuta **el hilo principal**, no un subagente — necesita poder parar y pedir aprobación a Jose (workflow de `CLAUDE.md`: "pedir aprobación si el cambio es amplio, arriesgado o arquitectónico") y mantener visión de conjunto entre carriles. Los carriles de auditoría sí se lanzan como subagentes reales.

Diseño completo: `.claude/propuesta-nueva-estructura-ia.md` §15. Contrato de archivos: `docs/ai/README.md`.

---

## Fase 0 — Guard de git

Antes de nada:

```bash
git status --porcelain docs/ai/modules/{module}/ docs/ai/gaps/{module}/
```

Si hay cambios sin commitear de una auditoría anterior sobre este módulo: **parar** y decir a Jose que commitee antes de continuar. No sobrescribir un `audit.md` sin commit previo — se pierde el baseline para siempre.

Si está limpio o no existe todavía (primera auditoría del módulo): continuar.

---

## Fase 1 — Leer baseline

Leer, si existen:

- `docs/ai/modules/{module}/audit.md` (baseline anterior)
- `docs/ai/modules/{module}/gaps-registry.md`
- GAPs legacy relevantes en `.claude/gaps/closed/` que mencionen el módulo (búsqueda rápida por nombre, no lectura exhaustiva)

Si es la primera auditoría del módulo, crear `docs/ai/modules/{module}/audit.md` a partir de `docs/ai/templates/module-audit-template.md`.

---

## Fase 2 — Mapear el módulo

Identificar rutas, componentes, hooks, services y tipos del módulo (usar `Explore` si el mapeo no es trivial, o hacerlo directamente con `Glob`/`Grep` si el módulo ya es conocido). Rellenar/actualizar § Alcance del módulo en `audit.md`.

---

## Fase 3 — Planificar cobertura y pedir aprobación

Proponer a Jose, **antes de lanzar nada**, qué superficies × carriles se van a auditar en esta pasada (usar la matriz de `audit.md` como referencia — qué está `pending`/`needs_reaudit`). Para el piloto de `orders`, el alcance por defecto es 3 carriles: `code-audit-agent`, `ui-audit-agent`, `domain-business-auditor`. No ampliar a más carriles sin que Jose lo pida.

Si el alcance propuesto es amplio (todo el módulo, todos los carriles), esperar confirmación explícita antes de continuar. Si Jose ya dio scope claro en su mensaje (p. ej. "audita solo UX de orders"), no es necesario volver a preguntar.

---

## Fase 4 — Lanzar los carriles como subagentes reales

Para cada carril aprobado, lanzar el agente correspondiente vía la tool `Agent` (en background cuando haya más de uno, para paralelizar):

```text
code-audit-agent           → categorías code-quality, architecture-refactor
ui-audit-agent               → categorías ux-ui, a11y-responsive
design-quality-auditor         → categoría ux-ui (composición/copy/consistencia)
domain-business-auditor          → categoría domain-business
permissions-multitenant-auditor    → hallazgos de seguridad/tenant (data-api o architecture-refactor)
```

El prompt de cada subagente debe incluir explícitamente (no asumir que lo infiere):

```text
- Módulo: {module}
- Superficie(s) a cubrir en esta pasada: {lista}
- Rutas de lectura: SOLO el código del módulo relevante para su carril
  (no pasar docs/agent-system/** completo — cada carril ya conoce sus propios
  criterios desde su propio archivo .claude/agents/{agente}.md)
- Ruta de escritura de candidatos a GAP: docs/ai/gaps/{module}/ con
  status: candidate y category correspondiente a su carril
  (usar docs/ai/templates/gap-v2-template.md). Asignar a cada carril un rango
  de numeración reservado de antemano (p. ej. carril A: GAP-V2-001..005,
  carril B: 006..010) para que dos carriles en paralelo nunca escriban el
  mismo id.
- NUNCA editar docs/ai/modules/{module}/audit.md directamente — dos carriles
  en paralelo escribiendo en el mismo archivo se pisan entre sí. Los hallazgos
  van en el resumen corto que el carril devuelve al terminar; el merge en
  audit.md lo hace el hilo principal en la Fase 5, secuencialmente.
- Instrucción de devolver un resumen corto con hallazgos (superficie, file:line,
  severidad, uno o dos GAP candidatos escritos) — no el hallazgo completo
```

Nota sobre el harness: si el entorno concreto no expone los agentes de
`.claude/agents/*.md` como `subagent_type` nativos de la tool `Agent` (ocurre en
algunos runtimes de Claude Code/Agent SDK), lanzar el carril como
`general-purpose` indicándole en el propio prompt que lea primero el archivo
`.claude/agents/{agente}.md` completo y seguirlo como su rol y proceso — el
aislamiento de contexto se mantiene igual, solo cambia el nombre del tipo de
agente invocado.

---

## Fase 5 — Merge

Con los resúmenes de cada carril, consolidar en `docs/ai/modules/{module}/audit.md`:

- Actualizar § Cobertura (marcar `audited` las celdas cubiertas en esta pasada)
- Actualizar § Resumen ejecutivo
- Actualizar § Cambios desde la última auditoría (si había baseline)

---

## Fase 6 — Normalizar

Contar los GAPs candidatos (`status: candidate`) escritos en `docs/ai/gaps/{module}/` en esta pasada.

- **Si son más de ~15:** lanzar el subagente `gap-normalizer` con la ruta de `docs/ai/gaps/{module}/` y la lista de candidatos de esta pasada.
- **Si son ~15 o menos:** normalizar directamente en el hilo principal (deduplicar, clasificar, asignar prioridad/riesgo/tamaño, marcar `ready`/`blocked`/`later`/`rejected`) — no hace falta un subagente para un volumen pequeño.

---

## Fase 7 — Regenerar el registry

```bash
node scripts/build-gaps-registry.mjs {module}
```

Nunca editar `gaps-registry.md` a mano.

---

## Fase 8 — Actualizar estado global

- `docs/ai/modules/{module}/audit.md` § NEXT ACTION, § Estado del módulo
- `docs/ai/next-action.md` (global)
- `docs/ai/worklog.md` (una fila nueva, compacta)

---

## Fase 9 — Resumen al chat

Devolver solo:

```text
- módulo auditado y carriles usados
- cobertura alcanzada (superficies × carriles, antes/después)
- GAPs creados/actualizados: total, ready, blocked, later
- riesgos principales detectados
- archivos actualizados
- siguiente acción sugerida (normalmente /implement-next)
- recordatorio: commitear docs/ai/modules/{module}/ y docs/ai/gaps/{module}/
  antes de la próxima auditoría de este módulo
```

**Nunca** devolver la auditoría completa, el contenido íntegro de los GAPs, ni diffs — todo eso vive en archivos.

---

## Reglas

```text
El chat no es memoria. Los archivos son memoria.
No crear audit-v2.md / audit-final.md / audit-YYYY-MM-DD.md — un único audit.md.
No lanzar más carriles de los aprobados por Jose.
No pasar docs/agent-system/** completo al prompt de un subagente de carril.
No editar gaps-registry.md a mano — regenerar con el script.
No tocar .claude/gaps/** legacy en este flujo.
No implementar código — este skill solo audita y documenta.
```
