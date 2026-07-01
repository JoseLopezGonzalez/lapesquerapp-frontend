# Codex Command Mapping

Codex does not need native slash commands. When Jose writes one of these commands
or equivalent natural language, activate the matching skill or workflow.

| User input | Codex skill | Workflow |
| --- | --- | --- |
| `/audit-code quality [scope]` | `lapesquerapp-code-audit` | `workflows/code-audit.md` |
| `/audit-code migrate [scope]` | `lapesquerapp-code-audit` | `workflows/code-audit.md` |
| `/audit-code arch [scope]` | `lapesquerapp-code-audit` | `workflows/code-audit.md` |
| `/audit-mobile [scope]` | `lapesquerapp-ui-audit` | `workflows/ui-audit.md` |
| `/audit-desktop [scope]` | `lapesquerapp-ui-audit` | `workflows/ui-audit.md` |
| `/mobile [view]` | `lapesquerapp-mobile-ui` | `workflows/mobile-ui.md` |
| `/idea [text]` | `lapesquerapp-ideas` | `workflows/ideas.md` |
| `/ideas [module]` | `lapesquerapp-ideas` | `workflows/ideas.md` |
| `/ideas promote [NNN]` | `lapesquerapp-gap-discovery` | `workflows/gap-workflow.md` |
| `crea un GAP` | `lapesquerapp-gap-discovery` | `workflows/gap-workflow.md` |
| `implementa GAP-NNN` | `lapesquerapp-gap-implementor` | `workflows/gap-workflow.md` |
| `audita GAP-NNN` | `lapesquerapp-gap-auditor` | `workflows/gap-workflow.md` |
| `recuerda esto` | `lapesquerapp-system-learner` | `workflows/system-learner.md` |

When a command implies broad work, present an inventory or plan before changing
source code.
