---

# Command: /help

## Purpose
Display a quick reference of all available commands and agents in the PesquerApp
Claude Code system.

## Output

When invoked, output the following block **directly in your text response** to the user — not as a side panel or summary. Copy it verbatim, formatted as a markdown code block or plain text, so it is always visible inline in the chat:

---

PESQUERAPP — CLAUDE CODE SYSTEM
version 2.8
════════════════════════════════════════════════

AUDIT COMMANDS (legacy — single agent, .claude/gaps/)
────────────────────────────────────────────────────
/audit-mobile                    Auditoría UI/UX capa mobile — todas las vistas
/audit-mobile [módulo]           Scope a un módulo (ej. /audit-mobile sales)
/audit-mobile [ruta]             Scope a una vista específica

/audit-desktop                   Auditoría UI/UX capa desktop — todas las vistas
/audit-desktop [módulo]          Scope a un módulo
/audit-desktop [ruta]            Scope a una vista específica

/audit-code quality              Calidad de código — reglas, patrones incorrectos
/audit-code migrate              Deuda técnica — JS→TS, patrones obsoletos
/audit-code arch                 Arquitectura React/Next.js — Server/Client, hooks
/audit-code [mode] [módulo]      Scope a un módulo (ej. /audit-code quality hooks)

/audit-design visual [módulo|ruta]      Armonía, proporción, jerarquía visual (captura real si hay Playwright+sesión)
/audit-design copy [módulo]             Terminología, tono, capitalización, claridad
/audit-design consistency [familia]     Drift entre vistas de la misma familia (listados, sheets, forms...)

/audit-skeletons                        Fidelidad Skeleton vs componente real — mobile + desktop
/audit-skeletons desktop|mobile         Scope a una capa
/audit-skeletons both [módulo|ruta]     Scope a un módulo o vista concreta

DEEP AUDIT WORKFLOW (v2 — multi-carril, docs/ai/)
──────────────────────────────────────────────────
/deep-audit-module module={módulo}      Auditoría profunda multi-carril de un módulo
                                         (lanza code-audit-agent, ui-audit-agent,
                                         design-quality-auditor, domain-business-auditor,
                                         permissions-multitenant-auditor como subagentes
                                         reales; escribe GAP candidates a docs/ai/gaps/)
/implement-next module={módulo} category={cat} [limit=] [risk=]
                                         Implementa el siguiente lote de GAPs v2
                                         "ready" de ese módulo/categoría; verifica
                                         con gap-auditor en modo lote

MOBILE WORKFLOW
───────────────
/mobile [vista]                  Workflow completo mobile UI para una vista
/mobile merge [vista]            Merge de rama mobile/ a main
/mobile status                   Estado actual de vistas mobile
/mobile qa [vista]               QA checklist de una vista mobile
/mobile list                     Lista todas las vistas mobile y su estado

GAP WORKFLOW (legacy)
──────────────────────
No command needed — describe what you want in natural language.
The Discovery agent activates automatically and runs the full
clarification protocol before writing any GAP.

IDEA PARKING
────────────
/idea [texto libre]              Captura rápida — sin preguntas, sin fricción
/ideas                           Lista el backlog de ideas
/ideas [módulo]                  Scope a un módulo (ej. /ideas Stock)
/ideas promote [NNN]             Promociona IDEA-NNN a GAP vía gap-discovery

SYSTEM
──────
/help                            This reference

════════════════════════════════════════════════

ACTIVE AGENTS (17)
──────────────────
gap-discovery                    Converts requests into verified GAPs with full Q&A (main-thread mode, not a subagent)
gap-implementor                  Executes GAPs exactly — no creative interpretation (main-thread mode, not a subagent)
gap-auditor                      Technical + visual + UX review — blocks closure on failures. Also runs in batch mode for /implement-next
ux-reviewer                      Simulates user flows — Full (complex) / Light (minor). Writes its own verdict into the GAP
ui-audit-agent                   Autonomous UI/UX auditor — powers /audit-mobile, /audit-desktop, and the ux-ui/a11y-responsive lanes of /deep-audit-module
code-audit-agent                 Autonomous code auditor — powers /audit-code, and the code-quality/architecture-refactor lanes of /deep-audit-module
design-quality-auditor           Visual craft, copy quality, cross-view consistency — powers /audit-design
skeleton-fidelity-auditor        Skeleton vs real-component fidelity — powers /audit-skeletons
skeleton-implementor             Builds/fixes skeletons flagged by skeleton-fidelity-auditor
domain-business-auditor          Sector domain correctness (pesca/congelados) — deep-audit-module lane
permissions-multitenant-auditor  Role visibility + tenant isolation — deep-audit-module lane
gap-normalizer                   Dedup/merge/split/classify GAP v2 candidates from /deep-audit-module
system-learner                   Writes to project-learnings.md — never without Jose confirmation
frontend-developer               General implementation tasks with full project context
mobile-ui-agent                  Mobile UI specialist — activated by /mobile command
db-architect                     TanStack Query cache design and invalidation strategy
code-reviewer                    Specific code review — cites lines, proposes exact fixes

Note: agents marked "not a subagent" run inline in the main thread (they need to
pause and talk to Jose). All others are launched via the Agent tool as real
subagents — none of them can invoke another agent themselves (no Agent tool in
their own tool list); hand-offs to gap-discovery/ux-reviewer/system-learner always
return control to whoever launched them.

════════════════════════════════════════════════

KEY FILES
─────────
.claude/design-context.md        Visual & UX criteria — mandatory before any UI work
.claude/project-learnings.md     Accumulated learnings — mandatory before any audit
.claude/ideas/parking-lot.md     Idea backlog — powers /idea and /ideas
docs/ai/README.md                Contrato de archivos del flujo v2 (deep-audit-module / implement-next)
docs/ai/next-action.md           Estado operativo actual — próxima acción sugerida
CLAUDE.md                        Full project context, rules, git policy

════════════════════════════════════════════════

CONTEXT
───────
Git policy: AUTO-DETECTED
  LOCAL  (Cursor + src/ + .git/ present) → edit files only, no git commands
  CLOUD  (Claude.ai mobile, no local fs) → full git workflow active

---

## Notes
- This command outputs the reference inline in the chat — never delegate to a side panel
- Do not say "the reference is displayed above" — output it yourself in your response text
- For detailed documentation of any command, read .claude/commands/[command].md
- For detailed documentation of any agent, read .claude/agents/[agent].md
- **Mantenimiento obligatorio:** cualquier commit que añada o elimine un agente
  (.claude/agents/*.md) o un comando/skill de circuito debe actualizar este
  archivo en el mismo commit. Este archivo se quedó desincronizado una vez
  (v2.7 con 11 agentes cuando ya había 17) — no repetir.
