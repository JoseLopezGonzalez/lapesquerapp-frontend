# docs/ai — Capa v2 de auditoría profunda y GAPs por módulo

Diseño completo en [`.claude/propuesta-nueva-estructura-ia.md`](../../.claude/propuesta-nueva-estructura-ia.md). Este README es el contrato operativo corto que cualquier agente debe leer antes de tocar algo bajo `docs/ai/**`.

## Principio

```text
El chat no es memoria. Los archivos son memoria.
```

Esto es estado de trabajo versionado en git — distinto de la memoria persistente de Claude Code entre conversaciones (esa es solo para contexto de usuario/preferencias) y distinto de `.claude/project-learnings.md` (memoria institucional de reglas, mantenida por `system-learner`). `docs/ai/worklog.md` es un log de eventos, nunca un lugar para anotar aprendizajes de patrón.

## Estructura

```text
docs/ai/
  README.md              este archivo
  next-action.md          qué debe hacer el siguiente agente/chat/modelo — global
  worklog.md               log compacto de eventos — global

  templates/
    module-audit-template.md
    gap-v2-template.md

  modules/{module}/
    audit.md                única fuente de estado del módulo (NEXT ACTION,
                             cobertura, hallazgos, GAPs, riesgos, decisiones)
    gaps-registry.md         GENERADO por scripts/build-gaps-registry.mjs — nunca editar a mano

  gaps/{module}/
    GAP-V2-XXX-{module}-{slug}.md   carpeta plana, sin subcarpetas por categoría
```

## Reglas obligatorias

```text
Cada módulo tiene una única auditoría canónica: docs/ai/modules/{module}/audit.md
No crear duplicados (audit-v2.md, audit-final.md, audit-YYYY-MM-DD.md, deep-audit.md...).

Los GAPs v2 viven en docs/ai/gaps/{module}/ con frontmatter YAML obligatorio
(ver templates/gap-v2-template.md). La categoría es un campo, no una carpeta.

Numeración: prefijo GAP-V2-NNN, correlativo dentro de docs/ai/gaps/ (todos los
módulos comparten el contador). Nunca cruza numeración con .claude/gaps/ legacy.

gaps-registry.md se regenera con:
  node scripts/build-gaps-registry.mjs {module}
Nunca se edita a mano. Si diverge de los GAPs individuales, se regenera — no se debate.

El sistema legacy .claude/gaps/** no se toca ni se mueve hasta que se declare
explícitamente una fecha de caducidad en este README (ver "Estado de la coexistencia"
más abajo). Las referencias a GAPs legacy relevantes van en audit.md § Legacy references.

Antes de auditar de nuevo un módulo: comprobar `git status` sobre
docs/ai/modules/{module}/ y docs/ai/gaps/{module}/. Si hay cambios sin
commitear de una pasada anterior, parar y pedir a Jose que commitee primero
(coherente con la Git Policy de CLAUDE.md: en LOCAL, Claude no commitea por su
cuenta).

El orquestador de una auditoría profunda es el hilo principal ejecutando el
skill /deep-audit-module — no es un agente. Los carriles de auditoría sí son
subagentes reales (Agent tool), lanzados con rutas de lectura/escritura
explícitas y acotadas al carril concreto — nunca con docs/agent-system/**
completo en su prompt.

El hilo principal (u orquestador) devuelve al chat solo resúmenes cortos.
La auditoría completa, el contenido de los GAPs y los diffs viven en archivos.

No crear una categoría, carril o archivo de estado nuevo sin que la evidencia
de un piloto ya ejecutado lo justifique (ver §20.9 de la propuesta).
```

## Categorías físicas (campo de frontmatter, no directorio)

```text
ux-ui · code-quality · architecture-refactor · data-api · domain-business · a11y-responsive
```

Ampliar solo cuando un cajón reviene con evidencia real de varios módulos — no a priori. `release` no es categoría de GAP: es un estado del módulo, ya cubierto en `audit.md` § Estado del módulo.

## Comandos disponibles

```text
/deep-audit-module module={module}
  → .claude/skills/deep-audit-module/SKILL.md

/implement-next module={module} category={category} limit={n} risk={risk}
  → .claude/skills/implement-next/SKILL.md
```

No existen comandos separados `/normalize-gaps`, `/verify-last` ni `/resume-module`: la normalización es una fase de `/deep-audit-module`, la verificación es una fase de `/implement-next` (vía `gap-auditor` en modo lote), y retomar un módulo es simplemente leer `docs/ai/next-action.md`.

## Agentes involucrados

```text
Carriles de auditoría (subagentes, invocados por /deep-audit-module):
  code-audit-agent          → code-quality, architecture-refactor
  ui-audit-agent             → ux-ui, a11y-responsive
  design-quality-auditor      → ux-ui (composición, copy, consistencia)
  domain-business-auditor      → domain-business (nuevo)
  permissions-multitenant-auditor → hallazgos de seguridad/tenant dentro de data-api
                                     o architecture-refactor (nuevo)

Normalización (subagente, solo si >15 candidatos):
  gap-normalizer

Verificación (subagente, modo lote, invocado por /implement-next):
  gap-auditor
```

Ver Fase 0 de la propuesta para el detalle de qué agentes se convirtieron en subagentes reales (frontmatter YAML) y cuáles siguen siendo modos de hilo principal (`gap-discovery`, `gap-implementor` — necesitan dialogar con Jose en vivo).

## Estado de la coexistencia con `.claude/gaps/**`

`.claude/gaps/**` sigue siendo el histórico legacy (115 GAPs cerrados a fecha de creación de esta capa v2, 0 abiertos). No se migra ni se mueve. Cuando el piloto de `orders` se valide y se extienda a 2-3 módulos más, este README se actualizará con una fecha de caducidad explícita a partir de la cual los GAPs nuevos solo se crean en `docs/ai/gaps/`. Hasta entonces, ambos sistemas conviven: los GAPs legacy relacionados con un módulo se referencian (no se mueven) desde `docs/ai/modules/{module}/audit.md` § Legacy references.

## Piloto activo

```text
Módulo: orders (Pedidos)
Fase: piloto auditado_acotado + segundo lote implementado + reglas de negocio confirmadas —
5 carriles ejecutados, registry generado, cruce legacy acotado completado y 3 GAPs cerrados.
Criterio de éxito: continuar con /implement-next sin que Jose tenga que explicar
contexto adicional.

Siguiente acción recomendada:
/implement-next module=orders category=domain-business limit=1 risk=medium
```
