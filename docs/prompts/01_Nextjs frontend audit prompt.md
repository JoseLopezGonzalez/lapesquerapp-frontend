# Next.js Frontend Deep Audit -- Adaptive & Autonomous Workflow

You are a Senior/Principal Next.js/React Architect.

Your mission is to analyze this frontend deeply and generate a high‑level architectural audit focused on Next.js/React best practices, component design quality, maintainability, scalability, and long‑term evolution.

## Project Context

* **Project name**: PesquerApp
* **Industry**: Fishing/seafood processing ERP
* **Architecture**: Multi-tenant Next.js 16 + Laravel 10 backend
* **Tenant isolation**: Subdomain-based (tenant header in API calls)
* **Infrastructure**: Docker/Coolify on IONOS VPS
* **Key domains**: Document processing workflows, inventory management, sales/purchases for fishing cooperatives

IMPORTANT: Do NOT follow a rigid predefined checklist. Instead:

1. Analyze the project structure.
2. Infer architectural patterns already in use.
3. Compare them with professional Next.js/React practices (official docs + community standards).
4. Build your own intelligent audit workflow based on what you discover.

You are allowed to:

* Use your internal knowledge.
* Cross‑check Next.js/React documentation and reputable sources if necessary.
* Adapt your evaluation model dynamically.

You are NOT allowed to:

* Perform refactors.
* Modify code.
* Point to specific line-level issues.
* Turn this into a per-file review.

This is an architectural and systemic audit.

---

## Multi-Tenant Specific Concerns

Priority areas given the multi-tenant nature:

* Tenant context management (client-side)
* Tenant data isolation in UI state and cache
* Shared vs tenant-specific components/resources
* Tenant switching flows
* API calls with correct tenant headers

---

## Next.js/React Structural Patterns (Evaluation Required)

You must explicitly evaluate whether the project uses Next.js/React structural building blocks correctly and consistently. Assess presence, coherence, and alignment with Next.js/React docs and community best practices. Include this evaluation in the main audit document and, if useful, in a supporting finding.

**Patterns to evaluate:**

* **Server vs Client Components**: Proper use of RSC; Client Components only when necessary (interactivity, hooks, browser APIs); data passing from Server to Client.
* **Custom Hooks**: Reusable stateful logic; proper dependency arrays; separation from components; naming conventions (use\*).
* **Data Fetching Strategy**: Server Components, React Query, SWR, or manual; consistency; cache strategy; error/loading states.
* **Form Handling**: Library usage (React Hook Form, Formik, native); validation strategy (Zod, Yup, backend-only); error handling.
* **State Management**: Context API, Zustand, Redux, React Query; appropriate use for server vs client state; prop drilling avoidance.
* **API Layer / Services**: Centralized API client; error handling; request/response typing; tenant context injection.
* **Component Architecture**: Composition vs inheritance; prop drilling; component size; separation of concerns.
* **TypeScript Usage**: Type safety; interface definitions; `any` usage; API response typing.
* **UI Component Library**: Consistency (shadcn/ui, custom, etc.); design system adherence.
* **Testing Strategy**: Component tests, integration tests, E2E tests; coverage; testing library usage.
* **Other** (as discovered): Layouts, Middleware, API Routes, Error Boundaries, Suspense Boundaries — note usage and structural gaps.

Focus on systemic patterns (e.g. "data fetching is inconsistent across modules" or "state management well organized with React Query"), not line-level nitpicking. If a pattern is intentionally unused, state it and briefly justify.

---

## Pre-Audit Validation

Before starting the full audit:

1. Confirm project structure is accessible
2. List discovered key architectural patterns
3. Identify tech stack in use (App Router vs Pages Router, data fetching library, form library, state management, UI library, TypeScript config)
4. Ask for clarification on ambiguous patterns BEFORE deep analysis
5. Wait for confirmation to proceed with full audit

---

## Expected Output Structure

**Primary document**: `docs/audits/nextjs-frontend-global-audit.md`

**Supporting documents**: `docs/audits/findings/`

* `multi-tenancy-analysis.md`
* `component-architecture-review.md`
* `data-fetching-patterns.md`
* `state-management-analysis.md`
* `ui-design-system-review.md`
* `structural-patterns-usage.md` (optional; use if findings warrant a dedicated document)

### Main Audit Document Must Include:

1. Executive Summary
2. Architectural Identity of the Project (what style is it implicitly following?)
3. Strengths (what is already well done)
4. Structural Risks or Weaknesses (systemic, not file-specific)
5. Alignment with Professional Next.js/React Practices
6. Component Design Evaluation (composition, size, separation of concerns, reusability)
7. Data Fetching & State Management Review
8. **Next.js/React Structural Patterns Usage** (Server/Client Components, Custom Hooks, Data Fetching, Forms, State Management, API Layer — presence, correctness, consistency)
9. UI/UX Consistency & Design System Analysis
10. TypeScript Usage & Type Safety
11. Performance & Optimization Signals (bundle size, re-renders, lazy loading)
12. Testing & Maintainability Overview
13. Accessibility & User Experience Observations
14. Security Observations (env vars, XSS, data exposure)
15. Improvement Opportunities (Prioritized but flexible)
16. Suggested Evolution Path (phased, adaptive)

You must think independently. Do not rigidly apply predefined patterns if the project intentionally follows another coherent approach.

---

## Architectural Maturity Framework

Evaluate across these dimensions (each 1-10):

* **Multi-tenancy implementation maturity** (tenant context, isolation, switching)
* **Component architecture quality** (composition, reusability, separation of concerns)
* **Data fetching & state management consistency**
* **TypeScript adoption & type safety**
* **UI/UX design system consistency**
* **Performance & optimization practices**
* **Testing coverage and strategy**
* **Accessibility compliance**
* **Documentation quality**
* **Technical debt level**

Provide overall score + per-dimension breakdown with reasoning.

---

## Final Deliverables

At the end, provide:

* **Top 5 systemic risks**
* **Top 5 highest‑impact improvements**
* **Overall architectural maturity score** (per-dimension breakdown as specified above)

If critical missing context prevents proper evaluation, ask up to 5 concise questions at the end.

---

## Output Language

Generate all audit documents in **Spanish** (matching project documentation language).

---

Confirm once all documents are generated.
