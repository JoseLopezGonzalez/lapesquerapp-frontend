# Command: /audit-landing

## Purpose

Launch a full audit of the public marketing site (landing, pricing, about, blog,
legal pages) — design/brand fidelity, conversion (CRO), technical SEO, GEO/AEO,
i18n parity across ES/PT/EN, accessibility, performance, and content honesty.
Runs Phase 1 → 2 → 3 → 4 → 5 of the `landing-auditor` protocol.

Scoped exclusively to the public site. For the authenticated ERP, use
`/audit-mobile` or `/audit-desktop` instead.

Intended cadence: **quarterly** (Jose's explicit choice, see
`.claude/landing-context.md §3`), but can be run on demand at any time.

## Usage

```
/audit-landing              — audits all public pages, all locales
/audit-landing [page]       — audits a single page (e.g. /audit-landing pricing)
/audit-landing [locale]     — audits all pages for one locale only (e.g. /audit-landing pt)
```

## Startup sequence

1. Detect context (LOCAL/CLOUD) per Git Policy in `CLAUDE.md`
2. Read `.claude/landing-context.md` in full
3. Read `.claude/design-context.md` §1–2 (color tokens, typography)
4. Read `.claude/project-learnings.md` for any public-site-relevant entries
5. Invoke `landing-auditor`

## What to expect

- **Phase 1** — Inventory of public pages/locales, queue approval
- **Phase 2** — Page-by-page audit (brand, CRO, technical SEO, GEO/AEO, i18n,
  a11y, performance, content honesty) with 30-second auto-continue
- **Phase 3** — Consolidated findings report
- **Phase 4** — GAP generation for approved findings, via `gap-discovery`,
  saved to `.claude/gaps/open/GAP-NNN-landing-*.md`. Purely editorial findings
  may be routed to `landing-content-writer` instead of a code GAP.
- **Phase 5** — System Learner / `landing-context.md` update handoff for
  discovered patterns

## Output

Each page produces a findings report with:
- 🔴 BLOCKING issues (includes ALL unverified claims — certifications, SLAs,
  ratings, testimonials — per the content honesty rule in `landing-context.md §5`)
- 🟡 IMPORTANT issues (should fix)
- 🟢 IMPROVEMENTS (nice to have)

Final consolidated report shows total findings and recommended GAP order.

**No code is ever changed by this command** — findings only become real
changes after Jose approves each GAP and it goes through `gap-implementor`,
consistent with the approval-gated autonomy Jose chose for the landing team.
