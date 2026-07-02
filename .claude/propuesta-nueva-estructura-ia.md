# Propuesta de evolución del sistema de IA — Auditoría profunda orquestada, GAPs v2 y mejora continua por módulos

> **v2 de este documento.** Revisado tras análisis crítico contra el estado real del repo. Los cambios principales respecto a la primera versión: se añade un prerequisito de infraestructura (Fase 0) que la v1 no tenía, se reduce de 8 a 1 los agentes nuevos, de 16 a 6 las categorías físicas, de 6 a 1 los archivos de estado por módulo, y de 5 a 2 los comandos nuevos. El principio arquitectónico y el diagnóstico se mantienen: eran correctos. Lo que cambia es que la implementación estaba sobredimensionada para un equipo de una persona.

> **Estado de implementación (2026-07-02): Fase 0 y Fase 1 completadas.**
> Todo lo descrito en este documento ya existe en el repo, no es solo diseño:
>
> - Fase 0 — 13 agentes existentes en `.claude/agents/` con frontmatter YAML real
>   (`gap-discovery` y `gap-implementor` documentados explícitamente como modos de
>   hilo principal, sin frontmatter de subagente); 3 agentes nuevos creados
>   (`gap-normalizer.md`, `domain-business-auditor.md`,
>   `permissions-multitenant-auditor.md`); allowlist de `Write`/`Edit` sobre
>   `docs/ai/**` en `.claude/settings.json`.
> - Fase 1 — estructura completa en `docs/ai/` (`README.md`, `next-action.md`,
>   `worklog.md`, `templates/`), script `scripts/build-gaps-registry.mjs`
>   (probado), skills `.claude/skills/deep-audit-module/SKILL.md` y
>   `.claude/skills/implement-next/SKILL.md`, y `docs/ai/modules/orders/audit.md`
>   creado y listo para la primera auditoría del piloto.
> - Fase 2 en adelante (ejecutar `/deep-audit-module module=orders` y las
>   siguientes) — pendiente, es uso del sistema, no construcción.
>
> El resto de este documento describe el diseño tal como se construyó — sirve
> como referencia de por qué cada pieza es como es, no solo como plan a futuro.

---

## 1. Contexto

La Pesquerapp ya cuenta con un sistema avanzado de trabajo asistido por IA. Actualmente existen agentes, skills, comandos, workflows y reglas repartidas principalmente entre:

* Claude Code — herramienta principal de trabajo
* Cursor
* Codex
* Copilot
* Documentación neutral en `docs/agent-system/**`
* Sistema de GAPs legacy en `.claude/gaps/**`

El sistema actual ya permite auditar, detectar problemas, generar GAPs, implementar GAPs, revisar implementaciones y mantener ciertas memorias de trabajo. Sin embargo, todavía existe un problema de fondo: el sistema no funciona como una cadena de trabajo totalmente orquestada, retomable y profunda por módulo.

Actualmente, una auditoría puede generar GAPs, pero el proceso sigue dependiendo demasiado de sesiones concretas de chat, contexto acumulado y gestión manual. También ocurre que los GAPs están clasificados principalmente por estado físico (`open`, `in-progress`, `closed`), no por módulo, categoría, riesgo o tamaño. Esto dificulta elegir después qué tipo de trabajo implementar: diseño, UX, arquitectura, refactor, performance, responsive, etc.

**Criterio de diseño no negociable de esta propuesta:** la herramienta principal de trabajo es Claude Code. La implementación real (agentes, skills, comandos) debe estar optimizada para cómo funciona Claude Code de verdad — subagentes con contexto aislado invocados vía la tool `Agent`, skills invocados vía la tool `Skill`, sin memoria compartida implícita entre padre e hijo salvo lo que se pase explícitamente. Para Cursor, Codex y otras herramientas se duplica lógica en capas finas adaptadas, en vez de forzar una capa neutral única que ningún modelo aproveche del todo. Generalidad barata que degrada la experiencia en Claude Code no es aceptable.

El objetivo de esta propuesta es definir una evolución profesional del sistema actual para convertirlo en una plataforma de auditoría profunda y mejora continua por módulos, manteniendo compatibilidad con lo que ya funciona — y sin construir más estructura de la que un equipo de una persona puede mantener coherente.

---

## 2. Diagnóstico resumido del sistema actual

### 2.1 Lo que ya está bien

* Sistema de agentes-persona en `.claude/agents/` (14 archivos) con roles bien definidos y probados en el flujo GAP actual.
* Adaptadores para Codex en `.agents/skills/**` — **estos sí tienen frontmatter YAML correcto**, a diferencia de los de Claude.
* Reglas de Cursor en `.cursor/rules/**`, finas (~25 líneas) y enlazando a documentación neutral — patrón correcto, mantener.
* Documentación neutral en `docs/agent-system/**`.
* Sistema de GAPs legacy en `.claude/gaps/**`: **115 GAPs cerrados, 0 abiertos, 0 en progreso** en el momento de escribir esto. El sistema ha funcionado y ha agotado su backlog — lo que hace que cualquier migración sea barata: no hay nada in-flight que proteger.
* Agentes de auditoría técnica, UI, diseño, skeletons, UX, mobile, frontend, documentación, API y dominio.
* Workflow de discovery, implementación y auditoría de GAPs.
* Herramientas Playwright y contexto visual para auditorías UI/skeleton.
* Embrión de worklog ya existente en `docs/_worklog/` (`CHANGES.md`, `VERIFY.md`).

Esto significa que no hay que empezar de cero. La estrategia correcta no debe ser sustituir todo el sistema existente, sino crear una capa superior de orquestación y trazabilidad, apoyada en una corrección de infraestructura que hoy falta (ver §2.3).

### 2.2 Lo que falta

* Auditoría canónica por módulo, con matriz de cobertura verificable (evita auditorías superficiales que se declaran completas).
* Registry de GAPs consultable por módulo, categoría, riesgo y tamaño — no solo por estado físico.
* Orquestador de auditoría profunda que no sature el chat principal.
* Sistema robusto para retomar auditorías entre chats/modelos: `next-action.md` global.
* `worklog.md` global compacto.
* Workflow de implementación por lotes filtrando por categoría, riesgo y tamaño.
* Taxonomía común obligatoria para Claude, Cursor y Codex.
* Reglas fuertes para evitar documentos duplicados como `audit-final.md`, `audit-v2.md` o `audit-2026-xx-xx.md` (este antipatrón ya existe de forma dispersa en `docs/`: hay `FRONTEND_PERFORMANCE_AUDIT_PROMPT.md`, carpetas `audits/`, `analisis/` sueltas sin convención única).

### 2.3 Lo que falta y la v1 de esta propuesta no había detectado — hallazgo crítico

**Los 14 archivos de `.claude/agents/` no tienen frontmatter YAML** (`name`, `description`, `tools`). Empiezan directamente con `# Agente: ...`. Esto significa que **hoy no son subagentes registrados de Claude Code**: no aparecen como agent types invocables vía la tool `Agent`. Son documentos de persona que se cargan como instrucciones en el contexto principal cuando el flujo GAP los referencia por convención de prompt.

Esto es la razón de fondo por la que el sistema actual "no funciona como una cadena orquestada": no hay mecanismo real de aislamiento de contexto entre fases. Todo corre en el mismo hilo, acumulando tokens.

Consecuencia directa para esta propuesta: **cualquier diseño de orquestación que asuma "lanzar auditores por carril sin saturar el chat" depende de convertir primero estos documentos en subagentes reales.** Sin ese paso previo, `/deep-audit-module` sería simplemente un mega-prompt en el hilo principal — el mismo problema que hoy, con más burocracia encima. Esta corrección se formaliza como Fase 0 en §27.

Nota aparte: `docs/agents/` contiene un inventario *distinto* de personas neutrales (`product-domain-agent`, `api-client-agent`, `qa-ux-agent`...) que no coincide con `.claude/agents/`. Antes de construir encima hay que tener claro qué inventario es ejecutable (`.claude/agents/`, tras Fase 0) y cuál es documentación de referencia (`docs/agents/`).

---

## 3. Problema principal

El problema no es que falten agentes o prompts aislados.

El problema principal es que el sistema todavía no tiene una fuente de verdad operativa para coordinar auditorías profundas por módulo, y no tiene el mecanismo técnico (subagentes reales) para ejecutar esa coordinación sin saturar el chat.

Ahora mismo el flujo tiende a ser:

```text
Auditoría en chat
  → generación de GAPs
  → implementación en otro chat
  → revisión
  → documentación dispersa
```

El riesgo de este flujo:

* Mucha información queda en el chat.
* Si el chat se satura, se pierde continuidad.
* Si se abre otro modelo, no siempre sabe exactamente qué se hizo.
* Las auditorías pueden repetirse sin baseline claro.
* Los GAPs pueden duplicarse.
* No hay una visión de cobertura real.
* Se mezclan GAPs de diseño, código, arquitectura, UX, API, responsive, etc.
* El usuario tiene que actuar como project manager manual.

La solución es cambiar el centro de gravedad:

```text
El chat no es memoria.
Los archivos son memoria.
```

Este principio es correcto y es la base de todo lo que sigue. Pero conviene una precisión importante que la v1 de este documento no hacía: esto **no** es lo mismo que el sistema de memoria persistente de Claude Code entre conversaciones del usuario (`~/.claude/projects/.../memory/`). Ese sistema guarda contexto sobre el usuario y preferencias, fuera del repo. Lo que aquí se propone es estado de trabajo *versionado en git*, compartible entre herramientas y máquinas, y complementario a `project-learnings.md` (que sigue siendo la única memoria institucional de reglas y patrones). El `worklog.md` de esta propuesta es un log de eventos, no un lugar para que un agente anote "aprendizajes" — eso sigue yendo a `project-learnings.md` vía `system-learner`.

---

## 4. Objetivo de la nueva capa v2

Crear una capa documental y operativa en `docs/ai/**` que permita:

1. Auditar módulos completos de forma profunda y profesional, con subagentes reales que trabajen en paralelo sin saturar el hilo principal.
2. Registrar el estado de cada módulo en un archivo persistente por módulo (no seis).
3. Permitir que otro chat/modelo continúe desde donde se quedó.
4. Clasificar GAPs por módulo y categoría, vía frontmatter — no vía estructura de carpetas rígida.
5. Implementar GAPs después por lotes controlados, con selección determinista (no un agente para filtrar).
6. Evitar duplicación documental.
7. Mantener compatibilidad con el sistema legacy actual durante el piloto, con fecha de caducidad explícita para la coexistencia.
8. Dar a Claude Code la implementación completa y nativa; a Cursor y Codex, adaptadores finos sobre el mismo *contrato de archivos*, no sobre el mismo mecanismo de ejecución.
9. Convertir la IA en una cadena de mejora continua, con la menor cantidad de piezas mantenibles por una sola persona.

---

## 5. Principio arquitectónico

```text
El conocimiento vive en archivos.
Los chats son trabajadores temporales.
Cada agente recibe una tarea concreta con rutas explícitas de lectura y escritura.
Cada agente escribe resultados estructurados y devuelve un resumen corto.
El siguiente agente (o el hilo principal) continúa desde archivos, no desde memoria conversacional.
```

Precisión sobre "orquestador": en Claude Code no existe un proceso persistente que "coordine" entre subagentes de forma autónoma. Lo persistente son los archivos. El orquestador de esta propuesta **no es un agente**: es el hilo principal ejecutando un skill, que lanza subagentes reales para las partes que necesitan contexto aislado, y hace el resto (planificación, aprobación con el usuario, merge final) él mismo. Ver §16.

---

## 6. Decisión estratégica

```text
No tocar todavía el sistema legacy de .claude/gaps/**.
No mover GAPs antiguos.
No romper Claude Code.
Corregir primero la infraestructura de agentes (Fase 0).
Crear después una capa v2 en docs/ai/**.
Usar un módulo piloto.
Validar el flujo con un criterio de éxito medible.
Después extenderlo — con la taxonomía que salga del piloto, no con una taxonomía a priori.
```

Módulo piloto:

```text
Slug técnico: orders
Nombre humano: Pedidos
```

Motivo: es un módulo importante, con suficiente complejidad real (UI, UX, formularios, tablas, estados, dominio, API, arquitectura), y ya concentra buena parte del histórico de GAPs (~53 de los 115 GAPs cerrados mencionan "order"). Si funciona en Pedidos, funcionará en otros módulos.

---

## 7. Nueva estructura propuesta

```text
docs/ai/
  README.md
  next-action.md
  worklog.md

  templates/
    module-audit-template.md
    gap-v2-template.md

  modules/
    orders/
      audit.md              # única fuente de estado del módulo: contiene
                             # NEXT ACTION, resumen, cobertura, hallazgos,
                             # GAPs vigentes/resueltos, riesgos, decisiones
      gaps-registry.md       # GENERADO por script desde el frontmatter
                             # de los GAPs — no se edita a mano

  gaps/
    orders/
      GAP-116-orders-order-form-hierarchy.md
      GAP-117-orders-extract-form-logic.md
      GAP-118-orders-lines-table-mobile.md
      GAP-119-orders-error-handling.md
```

Diferencias deliberadas respecto a la v1 de esta propuesta:

* **Un solo archivo de estado por módulo** (`audit.md`), no seis. `status.md`, `coverage-matrix.md` y el `NEXT ACTION` duplicado desaparecen como archivos independientes y pasan a ser secciones de `audit.md`. Menos archivos que sincronizar, menos superficies de divergencia.
* **`gaps-registry.md` es generado, no mantenido a mano.** Un script (`scripts/build-gaps-registry.mjs`, ver §12) lee el frontmatter de todos los GAPs del módulo y regenera el archivo. Elimina la necesidad de un agente dedicado a mantenerlo coherente — la coherencia viene de que no hay edición manual posible.
* **Los GAPs viven en una carpeta plana por módulo, no en subcarpetas por categoría.** La categoría es un campo de frontmatter (`category: ux-ui`), no una ruta. Esto evita 6-16 subdirectorios por módulo, la mayoría vacíos, y hace trivial re-clasificar un GAP (cambiar un campo, no mover un archivo).

Más adelante, para otros módulos, se replica el mismo patrón: `docs/ai/modules/{module}/audit.md`, `docs/ai/gaps/{module}/GAP-*.md`.

---

## 8. Regla de auditoría canónica

Cada módulo debe tener una única auditoría canónica:

```text
docs/ai/modules/{module}/audit.md
```

Queda prohibido crear documentos como `audit-v2.md`, `audit-final.md`, `audit-2026-07-02.md`, `deep-audit.md`, `new-audit.md`, `auditoria-final.md`.

La historia de auditorías se conserva con Git — **con una condición que la v1 de esta propuesta no cubría**: esto solo funciona si hay un commit entre auditorías. En contexto LOCAL, Claude Code tiene prohibido commitear por sí mismo (ver Git Policy de `CLAUDE.md`); commitea el usuario manualmente. Si se ejecutan dos auditorías profundas sobre el mismo módulo sin que medie un commit, la segunda sobreescribe destructivamente el baseline de la primera, y la sección "Baseline anterior" pierde su propósito.

**Regla añadida:** el skill `/deep-audit-module` debe empezar con un guard:

```text
1. git status sobre docs/ai/modules/{module}/ y docs/ai/gaps/{module}/
2. Si hay cambios sin commitear de una auditoría anterior:
   detener y pedir al usuario que commitee antes de continuar.
3. Si está limpio: proceder.
```

Y debe terminar recordando al usuario el punto de commit recomendado (no ejecutarlo — eso sigue siendo decisión manual del usuario en LOCAL, según la Git Policy vigente).

Cuando se repite una auditoría completa sobre el mismo módulo:

1. Se lee el `audit.md` existente como baseline.
2. Se revisa el código actual.
3. Se decide qué hallazgos siguen vigentes.
4. Se eliminan hallazgos obsoletos (después de que el commit anterior los haya preservado en el historial).
5. Se actualiza el mismo `audit.md`.
6. Se regenera `gaps-registry.md` con el script.

---

## 9. Qué debe contener `audit.md`

Un único archivo que actúa como panel de control completo del módulo:

```text
1. NEXT ACTION                          ← arriba del todo, siempre
2. Estado del módulo (antes "status.md")
   - estado funcional / UI / UX / código / arquitectura / responsive /
     accesibilidad / performance / testing / documentación
   - P0/P1/P2/P3 abiertos
   - estado de auditoría/implementación/verificación
3. Cobertura (antes "coverage-matrix.md")
   - tabla superficie × carril → pending/partial/audited/needs_reaudit/not_applicable
4. Resumen ejecutivo
5. Baseline anterior y cambios desde la última auditoría
6. Alcance del módulo (rutas, componentes, hooks, services involucrados)
7. Hallazgos vigentes
8. GAPs generados/actualizados/resueltos/descartados (referencia a docs/ai/gaps/{module}/)
9. Bloqueos y riesgos
10. Decisiones tomadas
11. Instrucciones para retomar en otro chat/modelo
12. Reglas específicas para futuras auditorías de este módulo
```

La sección `NEXT ACTION` va arriba porque si el chat se corta o se abre otra sesión, el nuevo agente debe poder leer solo esa sección y saber exactamente qué hacer, sin tener que procesar el resto del archivo.

Ejemplo:

```md
## NEXT ACTION

Ejecutar:

/implement-next module=orders category=ux-ui limit=3 risk=low

Contexto:
La auditoría UX/UI está normalizada.
Hay 5 GAPs ready de bajo riesgo.
No auditar de nuevo.
No tocar backend.
```

Estados posibles del módulo (sección 2):

```text
not_started · auditing · ready_for_implementation · implementing ·
needs_verification · blocked · closed · stale
```

### 9.1 Cobertura — superficies y carriles

Superficies recomendadas (sin cambios respecto a la v1, siguen siendo razonables):

```text
listado · detalle · creación · edición · formularios · tablas/listados ·
estados loading · estados empty · estados error · estados success ·
responsive desktop · responsive tablet · responsive mobile ·
permisos/roles · integración API · validaciones · tipos/interfaces ·
componentización · accesibilidad · performance · copy/semántica ·
dominio de negocio · testing
```

Carriles recomendados — **recortados de 19 a los que corresponden a agentes reales existentes o nuevos** (ver §13):

```text
ux-ui · code-quality · architecture-refactor · data-api ·
domain-business · a11y-responsive
```

Estados de cobertura: `pending · partial · audited · needs_reaudit · not_applicable`.

---

## 10. `gaps-registry.md` — generado, no mantenido

`docs/ai/modules/{module}/gaps-registry.md` es la vista consultable de los GAPs del módulo, pero **no se edita directamente**. Se regenera con un script que lee el frontmatter YAML de cada archivo en `docs/ai/gaps/{module}/*.md` y produce las tablas de `Ready / In progress / Blocked / Done / Later`.

```bash
node scripts/build-gaps-registry.mjs orders
```

Esto elimina la necesidad de un "Module Registry Maintainer" como agente: la coherencia del registry es una propiedad del script, no del cuidado de un LLM. Si el registry y los GAPs individuales alguna vez difieren, el registry está mal generado — se regenera, no se debate cuál tiene razón.

La sección `Legacy references` (para enlazar GAPs de `.claude/gaps/**` relevantes sin moverlos) se mantiene como tabla manual dentro de `audit.md`, no del registry generado — es la única pieza de este archivo que requiere juicio humano/IA.

---

## 11. GAPs v2 — carpeta plana, categoría como frontmatter

Estructura:

```text
docs/ai/gaps/{module}/GAP-XXX-{module}-{slug}.md
```

Ejemplo:

```text
docs/ai/gaps/orders/GAP-116-orders-order-form-hierarchy.md
docs/ai/gaps/orders/GAP-117-orders-extract-form-logic.md
docs/ai/gaps/orders/GAP-118-orders-lines-table-mobile.md
docs/ai/gaps/orders/GAP-119-orders-error-handling.md
```

Cada archivo lleva frontmatter YAML parseable (necesario para que el script de registry y el filtro de `/implement-next` funcionen sin un LLM de por medio):

```yaml
---
id: GAP-116
title: Jerarquía visual del formulario de pedido
module: orders
category: ux-ui
priority: P1
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Orders/OrderForm.tsx
created_at: 2026-07-02
updated_at: 2026-07-02
---
```

Esto permite lanzar implementaciones filtrando sin ambigüedad:

```text
/implement-next module=orders category=ux-ui limit=3 risk=low
```

**Regla de numeración añadida (ausente en la v1):** existe un único contador de GAPs para todo el repo, independientemente de si el GAP vive en `.claude/gaps/` (legacy) o `docs/ai/gaps/` (v2). Antes de asignar un número nuevo, buscar el máximo en ambos árboles. Alternativa más simple si esto genera fricción: prefijar los GAPs v2 como `GAP-V2-001` para que nunca puedan colisionar con la numeración legacy. Se recomienda la segunda opción por ser mecánica y no requerir búsqueda.

---

## 12. Categorías físicas — de 16 a 6

La v1 de esta propuesta proponía 16 categorías físicas con directorio propio. Cruzando esa lista contra el histórico real de 115 GAPs cerrados y contra los agentes que ya existen, la mayoría de esas categorías estarían permanentemente vacías o solapan con agentes existentes. Se reduce a 6, como campo de frontmatter (no directorio):

```text
ux-ui              — experiencia, jerarquía visual, flujo, feedback, consistencia shadcn/Tailwind
code-quality       — naming, duplicación, tipado, código muerto
architecture-refactor — capas, boundaries, extracción de hooks/componentes, patrones repetidos
data-api           — TanStack Query, contratos de servicio, manejo de errores de API, caché
domain-business    — reglas del sector pesquero: pesos, tallas, lotes, trazabilidad, congelado/fresco
a11y-responsive    — accesibilidad + adaptación desktop/tablet/mobile (fusionadas: ambas se auditan
                      juntas en la práctica y comparten agente de origen)
```

Si un módulo concreto genera muchos GAPs de un subtipo específico (p. ej. `security` o `copy-semantics`), se añade esa categoría cuando la evidencia lo pida — no antes. `release` no es categoría de GAP: es un estado del módulo (`ready_for_implementation` → `closed`), ya cubierto en la sección "Estado del módulo" de `audit.md`.

---

## 13. Agentes — de 8 nuevos a 1, y reutilización del resto

### 13.1 Prerequisito: Fase 0 (ver también §27)

Antes de construir cualquier orquestación, dar frontmatter YAML real a los agentes de `.claude/agents/` que deban convertirse en subagentes invocables:

```yaml
---
name: code-audit-agent
description: Auditor técnico autónomo de calidad de código, deuda de migración y arquitectura.
tools: Read, Grep, Glob, Bash
model: sonnet
---
```

Al hacerlo, decidir explícitamente qué agentes son **subagentes reales** (los que ejecutan una tarea acotada, sin necesidad de dialogar con el usuario a mitad de tarea — los auditores de carril, el verificador) y cuáles siguen siendo **modos del hilo principal** (`gap-discovery`, `gap-implementor` — necesitan poder parar y preguntar al usuario, algo que un subagente no puede hacer a mitad de ejecución).

### 13.2 Reparto final de responsabilidades

La v1 de este documento proponía 8 agentes nuevos (Deep Audit Orchestrator, Module Mapper, Coverage Planner, Baseline Auditor, Gap Normalizer, Module Registry Maintainer, Implementation Batch Planner, Verification Auditor). Al mapear cada uno contra mecanismos reales de Claude Code, solo uno merece ser un agente nuevo:

| Rol propuesto en v1 | Qué es en realidad |
|---|---|
| Deep Audit Orchestrator | No es agente — es el skill `/deep-audit-module` corriendo en el hilo principal (necesita poder pedir aprobación del plan de cobertura al usuario, como exige el workflow de `CLAUDE.md`) |
| Module Mapper | Fase 1 del skill, o una llamada al agente genérico `Explore` con un prompt específico — no agente propio |
| Coverage Planner | Fase 2 del skill, con aprobación del usuario antes de lanzar los carriles |
| Baseline Auditor | Fase 0 del skill: leer `audit.md` existente y hacer diff con el estado actual del código |
| **Gap Normalizer** | **Sí, agente nuevo.** Deduplicar/fusionar/dividir/clasificar candidatos requiere juicio sobre un conjunto grande (todos los hallazgos + registry + legacy references) — justifica contexto aislado. Se invoca solo si hay más de ~15 GAPs candidatos; con menos, lo hace el hilo principal |
| Module Registry Maintainer | Eliminado — el registry se genera por script (§10), no se mantiene |
| Implementation Batch Planner | Filtro determinista sobre frontmatter, dentro de `/implement-next` — no requiere LLM |
| Verification Auditor | **Extensión del `gap-auditor` existente**, con un modo "lote" que verifica varios GAPs implementados en la misma sesión. No se crea un agente nuevo; se le añade una instrucción de modo al que ya existe (que además ya sabe invocar a `ux-reviewer` y `system-learner`) |

Los auditores de carril de la matriz de cobertura (§9.1) **no son agentes nuevos** salvo dos: la mayoría ya existen y se reutilizan añadiéndoles un "modo lane" (reciben módulo + superficie + rutas exactas de salida en el prompt):

```text
ux-ui              → ui-audit-agent + design-quality-auditor
code-quality        → code-audit-agent (modo quality)
architecture-refactor → code-audit-agent (modo arch)
data-api            → code-audit-agent + product-domain-agent (si existe como subagente real)
a11y-responsive     → ui-audit-agent (checklist a11y ampliado) + responsive ya cubierto en mobile-ui-agent
domain-business      → NUEVO — no cubierto hoy por ningún agente
```

### 13.3 Los dos carriles genuinamente nuevos

De los 25 auditores propuestos en la v1 (§23 original), solo dos representan huecos reales de cobertura que ningún agente actual atiende:

* **`domain-business` / Product Workflow + Business Rules Auditor** — valida que los flujos y reglas reproducen cómo trabaja realmente una empresa pesquera (pesos, tallas, formatos, lotes, trazabilidad, congelado/fresco, maquila). Nadie lo cubre hoy.
* **Permission/Roles + Multi-tenant Auditor** — crítico en un SaaS multi-tenant y sin cobertura actual: aislamiento de datos entre tenants, rutas protegidas, botones que fallan por permiso, riesgo de mezclar datos entre tenants.

El resto de auditores propuestos en la v1 (skeletons, design system, copy, tablas, formularios, error handling, i18n, testability, performance budget, observability...) **ya están cubiertos** total o parcialmente por agentes existentes (`skeleton-fidelity-auditor`, `design-quality-auditor` modo consistency, `/audit-design copy`, `code-audit-agent`) y deben incorporarse como checklists ampliados dentro de esos agentes, no como agentes independientes.

---

## 14. Campos obligatorios de un GAP v2

Igual que en la v1, con el frontmatter YAML ya mostrado en §11:

```yaml
id: title: module: category: priority: risk: size: status:
dependencies: target_files: created_at: updated_at:
```

Secciones del cuerpo (sin cambios respecto a la v1 — el template v1 legacy ya es rico y se reutiliza, solo se le añade frontmatter):

```md
## Problema
## Objetivo
## Contexto
## Solución propuesta
## Criterios de aceptación
## Plan de validación
## Notas de implementación
## Resultado
## Resultado de auditoría
## Links
```

Priority: `P0 crítico · P1 importante · P2 recomendable · P3 pulido · P4 later`.
Risk: `low · medium · high`.
Size: `XS 1 archivo · S 1-3 · M 3-6 · L planificación · XL no implementar en sesión normal`.
Status: `candidate · ready · in_progress · done · blocked · rejected · later`.

Regla: los implementadores solo cogen por defecto GAPs `ready` con `risk=low|medium` y `size=XS|S|M`, salvo autorización explícita.

---

## 15. Workflow: auditoría profunda por módulo

```text
/deep-audit-module module={module}
```

(Se elimina el parámetro `depth=deep` de la v1: no hay mecanismo que haga a un LLM "más profundo" con un flag. La profundidad real la da qué superficies × carriles se cubren, visible en la matriz.)

### 15.1 Quién ejecuta qué

**El hilo principal** (no un agente) ejecuta las fases que necesitan diálogo con el usuario o visión de conjunto:

```text
0. Guard de git status (§8) — parar si hay cambios sin commitear
1. Leer baseline (audit.md existente, si lo hay)
2. Mapear el módulo (rutas, componentes, hooks, services, tipos)
3. Planificar cobertura — PROPONER al usuario qué superficies × carriles
   se van a auditar en esta pasada y esperar confirmación si el alcance
   es amplio (coherente con el workflow de CLAUDE.md: "pedir aprobación
   si el cambio es amplio, arriesgado o arquitectónico")
```

**Subagentes reales** (lanzados vía tool `Agent`, en background cuando sea posible) ejecutan cada carril de forma aislada:

```text
4. Lanzar N carriles como subagentes, cada uno con en su prompt inicial:
   - módulo y superficie(s) a cubrir
   - rutas exactas de lectura (código relevante, NO toda docs/agent-system/**)
   - rutas exactas de escritura (dónde debe dejar sus hallazgos)
   - instrucción de devolver solo un resumen corto al terminar
```

**El hilo principal** retoma para el cierre:

```text
5. Merge de hallazgos en audit.md
6. Si hay más de ~15 GAPs candidatos: lanzar gap-normalizer como subagente.
   Si hay menos: normalizar directamente (deduplicar, asignar
   categoría/riesgo/tamaño, marcar ready/blocked/later)
7. Escribir/actualizar GAPs v2 con frontmatter completo
8. Regenerar gaps-registry.md (script)
9. Actualizar next-action.md y worklog.md
10. Devolver resumen corto al usuario
11. Recordar al usuario el punto de commit recomendado
```

Nota importante sobre el paso 4: cada carril NO debe leer `docs/agent-system/**` completo — eso quema presupuesto de contexto del subagente antes de mirar código. Las rutas de lectura las decide el hilo principal en el paso 3-4, acotadas a lo que ese carril concreto necesita.

### 15.2 Qué debe devolver al chat

```text
- módulo auditado
- cobertura alcanzada (superficies × carriles)
- GAPs creados/actualizados, cuántos ready/blocked/later
- riesgos principales
- archivos actualizados
- siguiente acción sugerida
- recordatorio de commit
```

Nunca debe devolver la auditoría completa, el contenido íntegro de todos los GAPs, ni diffs enormes. Todo eso vive en archivos.

---

## 16. Workflow: implementación por lotes

```text
/implement-next module={module} category={category} limit={n} risk={risk}
```

### 16.1 Selección — determinista, sin agente

El skill lee `docs/ai/modules/{module}/gaps-registry.md` (generado) y filtra:

```text
status=ready AND category={category} AND risk<=permitido
AND size in (XS,S,M) AND sin dependencias abiertas
```

Esto es un filtro sobre datos estructurados. No requiere un "Implementation Batch Planner": el propio skill hace el filtro con las 10 líneas de lógica que describe arriba.

### 16.2 Reglas de implementación (sin cambios respecto a v1)

```text
No auditar de nuevo. No abrir temas nuevos.
No mezclar categorías salvo permiso explícito.
No coger GAPs L/XL salvo permiso explícito.
No tocar backend si el GAP no lo permite.
No añadir dependencias sin aprobación.
No cambiar contratos de datos sin aprobación.
Implementar uno por uno. Actualizar estado tras cada GAP.
```

### 16.3 Verificación — extensión del gap-auditor existente

Al terminar el lote, lanzar `gap-auditor` (extendido con modo "lote") **como subagente real con contexto limpio** — importante para que la verificación no herede el sesgo de quien implementó. Revisa: criterios de aceptación, regresiones, coherencia visual/funcional, archivos prohibidos no tocados, registry actualizado.

```text
/implement-next module=orders category=ux-ui limit=3 risk=low
```

es autosuficiente: incluye la implementación y termina lanzando la verificación. No hace falta un comando `/verify-last` separado salvo para reparación ad-hoc de GAPs ya implementados fuera de este flujo.

### 16.4 Qué debe devolver al chat

```text
- GAPs implementados / bloqueados
- resultado de verificación (done / needs_fix / blocked / rejected)
- validaciones ejecutadas (lint, type-check, build)
- archivos modificados
- siguiente acción
```

---

## 17. Sistema de `next-action.md` y `worklog.md`

Sin cambios respecto a la v1 — estos dos archivos globales son sólidos tal como estaban diseñados.

`docs/ai/next-action.md` responde siempre "¿qué debe hacer el siguiente agente/chat/modelo?": fecha, módulo activo, fase activa, comando sugerido, archivos clave, restricciones, motivo.

`docs/ai/worklog.md` es un log compacto en tabla, no una narrativa:

```md
| Fecha | Módulo | Acción | Resultado | Siguiente |
|---|---|---|---|---|
| 2026-07-02 | orders | Fase 0: frontmatter en agentes | 5 agentes convertidos a subagentes | deep-audit orders |
| 2026-07-02 | orders | Deep audit (3 carriles) | 9 GAPs generados | implement-next ux-ui |
```

Regla: el worklog explica qué pasó, no repite la auditoría. Y no es el lugar para "aprendizajes" de patrón — eso va a `project-learnings.md` vía `system-learner` (ver §3).

---

## 18. Integración con Claude, Cursor y Codex

### 18.1 Principio de reparto (corregido respecto a la v1)

La v1 de esta propuesta decía que Claude, Cursor y Codex debían "leer la misma lógica conceptual" desde `docs/agent-system/**`, incluyendo el propio orquestador Claude. Eso invierte el criterio de diseño de esta propuesta: hace que el runtime de Claude dependa de traducir instrucciones neutras en caliente, e infla el contexto de arranque de cada subagente con documentación pensada para otra herramienta.

Reparto correcto:

1. **Estado y datos → neutrales, en `docs/ai/**`.** `audit.md`, GAPs con frontmatter, worklog, next-action. Esto no son instrucciones, es contenido: cualquier herramienta lo lee sin traducción. La neutralidad aquí es gratis y correcta — es el verdadero punto de interoperabilidad entre herramientas.
2. **Instrucciones ejecutables → completas y nativas en `.claude/`.** Los skills `/deep-audit-module` e `/implement-next` viven enteros en `.claude/skills/`, escritos con las convenciones reales de Claude Code (tool `Agent`, ejecución en background, prompts de subagente con rutas explícitas). Los agentes de carril, con frontmatter real, en `.claude/agents/`. Claude nunca necesita "traducir" nada en runtime.
3. **`docs/agent-system/workflows/*.md` → documentación derivada, escrita después de validar el piloto.** Describe conceptualmente el flujo para que Codex/Cursor lo repliquen con sus propios mecanismos. Es documentación de exportación, no la fuente que Claude consulta para actuar. Regla: cuando cambia un skill de `.claude/skills/`, se actualiza su workflow neutral en el mismo commit — igual que ya exige `CLAUDE.md` para código y documentación de GAPs.
4. **Cursor/Codex no replican la orquestación con subagentes** (Cursor no los tiene de forma equivalente). Su versión del deep-audit es más simple: un carril por sesión, escribiendo en los mismos archivos de estado. La capa fina no replica el mecanismo, replica el contrato de archivos — mientras todas las herramientas escriban el mismo `audit.md` con el mismo template y el mismo frontmatter de GAP, da igual cómo llegue cada una.

### 18.2 Claude Code

```text
.claude/skills/deep-audit-module/SKILL.md
.claude/skills/implement-next/SKILL.md
.claude/agents/*.md   (con frontmatter, tras Fase 0)
```

### 18.3 Codex

```text
.agents/skills/lapesquerapp-deep-audit/SKILL.md
.agents/skills/lapesquerapp-implement-next/SKILL.md
```

Apuntando al contrato de archivos de `docs/ai/**` y al resumen conceptual de `docs/agent-system/workflows/`. Mapping en `AGENTS.md`.

### 18.4 Cursor

```text
.cursor/rules/XX-deep-audit-module.mdc
.cursor/rules/XX-gap-v2-workflow.mdc
```

Finas, enlazando a `docs/agent-system/workflows/*.md` y `docs/ai/README.md` — mismo patrón que ya usan las reglas Cursor actuales.

Esta fase (adaptadores) se pospone hasta después de validar el piloto en Claude Code (§19, Fase 6). No se construye en paralelo.

---

## 19. Orden de implementación recomendado

### Fase 0 — Corrección de infraestructura (nueva, prerequisito no negociable)

```text
Añadir frontmatter YAML (name, description, tools, model) a los agentes
de .claude/agents/ que actúen como carriles del deep-audit y como
verificador de lotes.
Decidir explícitamente cuáles son subagentes reales y cuáles siguen
siendo modos del hilo principal (gap-discovery, gap-implementor).
Añadir allowlist de Write sobre docs/ai/** en .claude/settings.json
(sin esto, un deep-audit que escribe 10-20 archivos genera 10-20
prompts de permiso y mata la autonomía prometida).
```

Sin esta fase, nada del diseño de orquestación de las fases siguientes existe de verdad.

### Fase 1 — Contrato documental v2 (mínimo)

```text
docs/ai/README.md          (contrato + reglas operativas, recortadas — §21)
docs/ai/next-action.md
docs/ai/worklog.md
docs/ai/templates/module-audit-template.md
docs/ai/templates/gap-v2-template.md
scripts/build-gaps-registry.mjs
```

No tocar código funcional. No migrar GAPs legacy.

### Fase 2 — Piloto con módulo orders (auditoría acotada, no exhaustiva)

```text
/deep-audit-module module=orders
```

Con **3 carriles**, no 19: `code-audit-agent`, `ui-audit-agent`, y el nuevo `domain-business`. Objetivo: probar el mecanismo completo (guard de git, subagentes reales escribiendo en archivos, merge, normalización, registry generado) con una superficie manejable antes de ampliar cobertura.

### Fase 3 — Implementación por lote

```text
/implement-next module=orders category=ux-ui limit=3 risk=low
```

Termina con verificación automática vía `gap-auditor` en modo lote.

### Fase 4 — Criterio de éxito medible antes de extender

```text
Cerrar la sesión tras la auditoría.
Abrir una sesión completamente nueva.
Ejecutar /implement-next sin explicar nada de contexto adicional.
```

Si `/implement-next` funciona sin que el usuario tenga que explicar nada, el concepto está validado. Solo entonces se decide, con datos reales del piloto, si hacen falta más categorías, más carriles o más secciones de estado — nunca a priori.

### Fase 5 — Ajuste del sistema

Revisar con el usuario: ¿el `audit.md` único es cómodo o echa en falta la separación en varios archivos? ¿el registry generado es fiable? ¿el chat recibió poco ruido? ¿se pudo retomar desde otro chat sin fricción? ¿la cobertura fue honesta?

### Fase 6 — Adaptadores Claude/Cursor/Codex

Solo cuando el flujo esté validado en Claude Code: crear skill Codex, regla Cursor, actualizar `docs/agent-system/workflows/`.

### Fase 7 — Extensión a otros módulos

Repetir con `pallets, products, stock, customers, suppliers, production, dashboard, settings` — con la taxonomía de categorías y carriles que haya demostrado ser necesaria en el piloto, ampliando solo cuando la evidencia (no la anticipación) lo pida.

### Fase 8 — Fecha de caducidad para la coexistencia con legacy

Una vez el piloto se valide y se extienda a 2-3 módulos más, declarar explícitamente en `docs/ai/README.md` y en `.claude/gaps/README` (o equivalente): **"los GAPs nuevos a partir de {fecha} van solo a `docs/ai/gaps/`; `.claude/gaps/` queda congelado como archivo histórico."** La v1 de esta propuesta dejaba la coexistencia indefinida — eso es exactamente donde los sistemas paralelos dejan de mantenerse. Con 0 GAPs abiertos hoy en legacy, esta transición es barata si se hace pronto.

---

## 20. Riesgos

### 20.1 Riesgo de duplicar fuentes de verdad

Mitigación: `.claude/gaps/**` declarado legacy v1 con fecha de caducidad explícita (Fase 8), `docs/ai/**` canónico v2, numeración prefijada `GAP-V2-` para evitar colisiones (§11), `Legacy references` en `audit.md` para enlazar sin mover.

### 20.2 Riesgo de burocracia excesiva

Mitigado estructuralmente respecto a la v1: 1 archivo de estado por módulo en vez de 6, registry generado en vez de mantenido, 6 categorías en vez de 16, 1 agente nuevo en vez de 8. Menos piezas, menos mantenimiento.

### 20.3 Riesgo de auditorías enormes que saturan el contexto

Mitigación: dividir por carril con subagentes reales (requiere Fase 0), rutas de lectura acotadas por carril (no toda la documentación neutral), resúmenes cortos obligatorios, piloto con 3 carriles antes de ampliar a más.

### 20.4 Riesgo de romper Claude Code

Mitigación: Fase 0 es aditiva (solo añade frontmatter a documentos existentes, no cambia su contenido), no se mueve nada de `.claude/gaps/**`, migración gradual con módulo piloto.

### 20.5 Riesgo de GAPs duplicados

Mitigación: gap-normalizer como subagente cuando hay volumen, registry generado (no hay desincronización posible entre GAP y registry), Legacy references, baseline en `audit.md`.

### 20.6 Riesgo de contextos saturados en implementación

Mitigación: implementación por lotes, límite por categoría/riesgo/tamaño, verificación con contexto limpio (subagente real).

### 20.7 Riesgo de choque con la Git Policy (nuevo, no cubierto en la v1)

Ver §8: guard de `git status` obligatorio al inicio de `/deep-audit-module`, recordatorio de commit al final. El workflow no asume que puede escribir y sobreescribir libremente sin que medie el ciclo de commits manual del usuario en contexto LOCAL.

### 20.8 Riesgo de fricción de permisos (nuevo)

Ver Fase 0: sin allowlist de `Write` sobre `docs/ai/**`, un deep-audit que toca 10-20 archivos genera igual número de prompts de aprobación, anulando la promesa de autonomía. Resolver antes del piloto, no durante.

### 20.9 Riesgo de sobre-construir para el tamaño real del equipo (nuevo)

El equipo es una persona (el usuario). Una taxonomía de 16 categorías × 9 módulos son 144 combinaciones posibles, la mayoría vacías para siempre. Este documento ya recorta a 6 categorías como campo, no como directorio — pero la disciplina de "no crear una categoría/carril/archivo nuevo hasta que la evidencia del piloto lo pida" debe mantenerse en las fases de extensión (§19, Fase 7).

---

## 21. Reglas operativas obligatorias

Deben aparecer en `docs/ai/README.md`, en los skills y en los agentes:

```text
El chat no es memoria. Los archivos son memoria — y son distintos de la
memoria persistente de Claude Code entre conversaciones (esa sigue
siendo solo para contexto de usuario/preferencias).

Cada módulo tiene una única auditoría canónica:
docs/ai/modules/{module}/audit.md
No crear duplicados (audit-v2.md, audit-final.md, audit-YYYY-MM-DD.md...).

Los GAPs v2 viven en docs/ai/gaps/{module}/ con frontmatter YAML
obligatorio. La categoría es un campo, no una carpeta.

gaps-registry.md se regenera con script. Nunca se edita a mano.

El sistema legacy .claude/gaps/** no se mueve hasta la Fase 8
(fecha de caducidad explícita tras validar el piloto).

El orquestador de una auditoría profunda es el hilo principal
ejecutando un skill — no un agente. Los carriles sí son subagentes
reales, lanzados con rutas de lectura/escritura explícitas y acotadas.

Antes de auditar de nuevo un módulo: comprobar git status sobre
docs/ai/modules/{module}/ y docs/ai/gaps/{module}/. Si hay cambios
sin commitear, parar y pedir al usuario que commitee primero.

El orquestador devuelve al chat solo resúmenes cortos. La auditoría
completa, el contenido de los GAPs y los diffs viven en archivos.

Toda auditoría debe actualizar: audit.md, gaps-registry.md (regenerado),
next-action.md, worklog.md.

Todo GAP ready debe tener: categoría, prioridad, riesgo, tamaño,
criterios de aceptación, plan de validación, archivos objetivo.

No crear una categoría, carril o archivo de estado nuevo sin que la
evidencia de un piloto ya ejecutado lo justifique.
```

---

## 22. Ejemplo de comando ideal

```text
/deep-audit-module module=orders
```

Resultado esperado en chat:

```text
Auditoría de Orders/Pedidos completada (carriles: code-quality, ux-ui, domain-business).

Cobertura:
- UX/UI: 6/12 superficies
- Code Quality: 5/12 superficies
- Domain Business: 4/12 superficies

GAPs: 9 creados, 6 ready, 2 blocked, 1 later

Archivos actualizados:
- docs/ai/modules/orders/audit.md
- docs/ai/modules/orders/gaps-registry.md (regenerado)
- docs/ai/next-action.md
- docs/ai/worklog.md

Siguiente acción sugerida:
/implement-next module=orders category=ux-ui limit=3 risk=low

Recuerda commitear docs/ai/modules/orders/ y docs/ai/gaps/orders/
antes de la próxima auditoría de este módulo.
```

---

## 23. Ejemplo de implementación ideal

```text
/implement-next module=orders category=ux-ui limit=3 risk=low
```

Resultado esperado:

```text
Implementación por lote completada.

GAPs implementados: GAP-V2-001, GAP-V2-002, GAP-V2-003

Verificación (gap-auditor, contexto limpio): done — sin regresiones detectadas
Validaciones: lint OK · type-check OK · build OK

Archivos actualizados:
- GAP files (status: done)
- docs/ai/modules/orders/gaps-registry.md (regenerado)
- docs/ai/modules/orders/audit.md
- docs/ai/worklog.md
- docs/ai/next-action.md

Siguiente acción: /implement-next module=orders category=code-quality limit=2 risk=low
```

---

## 24. Conclusión

La Pesquerapp no necesita más prompts ni más agentes. Necesita una capa operativa que convierta los agentes existentes en un sistema retomable — y, antes que nada, necesita que esos agentes existan de verdad como subagentes de Claude Code, cosa que hoy no ocurre.

La solución, recortada respecto a la primera versión de esta propuesta:

```text
Fase 0: dar frontmatter real a los agentes existentes (prerequisito técnico).
Crear docs/ai/** como capa v2, con 1 archivo de estado por módulo, no 6.
Mantener .claude/gaps/** como legacy v1, con fecha de caducidad tras el piloto.
Auditoría canónica por módulo con matriz de cobertura embebida.
Registry de GAPs generado por script, no mantenido a mano.
Categorías como campo de frontmatter (6, no 16), no como directorios.
1 agente nuevo (gap-normalizer), no 8 — el resto son fases de skill,
scripts deterministas, o extensiones de agentes ya existentes.
next-action.md y worklog.md globales.
El orquestador es el hilo principal ejecutando un skill, no un agente
más; los carriles sí son subagentes reales.
Implementar GAPs por lotes con selección determinista.
Verificar con el gap-auditor existente en modo lote, contexto limpio.
Guard de git status para respetar la Git Policy ya vigente en local.
Extender a Claude/Cursor/Codex solo después de validar el piloto,
duplicando el mecanismo de ejecución pero compartiendo el contrato
de archivos.
```

El objetivo final es que el usuario no tenga que microgestionar la IA, decidiendo solo módulo, categoría a implementar y riesgo permitido. El sistema se encarga de auditar, registrar, generar GAPs, normalizar, priorizar, implementar, verificar y dejar la siguiente acción escrita — con la menor cantidad de piezas que una sola persona pueda mantener coherentes sin que otro agente tenga que vigilarlas por ella.
