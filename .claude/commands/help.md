---

# Command: /help

## Purpose
Display a quick reference of all available commands and agents in the PesquerApp
Claude Code system.

## Output

When invoked, output the following block **directly in your text response** to the user — not as a side panel or summary. Copy it verbatim, formatted as a markdown code block or plain text, so it is always visible inline in the chat:

---

PESQUERAPP — CLAUDE CODE SYSTEM
version 2.6
════════════════════════════════════════════════

AUDIT COMMANDS
──────────────
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

MOBILE WORKFLOW
───────────────
/mobile [vista]                  Workflow completo mobile UI para una vista
/mobile merge [vista]            Merge de rama mobile/ a main
/mobile status                   Estado actual de vistas mobile
/mobile qa [vista]               QA checklist de una vista mobile
/mobile list                     Lista todas las vistas mobile y su estado

GAP WORKFLOW
────────────
No command needed — describe what you want in natural language.
The Discovery agent activates automatically and runs the full
clarification protocol before writing any GAP.

SYSTEM
──────
/help                            This reference

════════════════════════════════════════════════

ACTIVE AGENTS (11)
──────────────────
gap-discovery       Converts requests into verified GAPs with full Q&A
gap-implementor     Executes GAPs exactly — no creative interpretation
gap-auditor         Technical + visual review — blocks closure on failures
ux-reviewer         Simulates user flows — Full (complex) / Light (minor)
ui-audit-agent      Autonomous UI/UX auditor — powers /audit-mobile and /audit-desktop
code-audit-agent    Autonomous code auditor — powers /audit-code
system-learner      Writes to project-learnings.md — never without Jose confirmation
frontend-developer  General implementation tasks with full project context
mobile-ui-agent     Mobile UI specialist — activated by /mobile command
db-architect        TanStack Query cache design and invalidation strategy
code-reviewer       Specific code review — cites lines, proposes exact fixes

════════════════════════════════════════════════

KEY FILES
─────────
.claude/design-context.md        Visual & UX criteria — mandatory before any UI work
.claude/project-learnings.md     Accumulated learnings — mandatory before any audit
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
