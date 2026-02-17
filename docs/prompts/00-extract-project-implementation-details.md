# Project Implementation Details Extraction

You are analyzing a Next.js project to extract concrete implementation details that will be used to make evolution/refactoring prompts more specific and less ambiguous.

## Your Task

Analyze the codebase and provide a concise report answering these questions:

### 1. Form Handling

* Which library is used? (React Hook Form, Formik, native, other?)
* Which validation library? (Zod, Yup, Joi, native, other?)
* Example file path of a typical form implementation

### 2. UI Component Library

* Which library is used? (shadcn/ui, MUI, Chakra, custom, other?)
* Are there custom UI primitives? (custom buttons, inputs, modals?)
* Example import statement from a component file

### 3. State Management

* Which solution is used? (Context API, Zustand, Redux, Jotai, React Query only, other?)
* Is there a global state structure? Where is it defined?
* Example file path of state management usage

### 4. Data Fetching

* Server Components, Client Components, or Pages Router?
* Which library for client-side fetching? (React Query, SWR, native fetch, Axios?)
* Example file path of a data fetching implementation

### 5. API Client

* Is there a centralized API client/service layer?
* Where are API calls defined? (services folder, hooks, inline?)
* Base URL configuration: environment variable name?
* Example file path

### 6. TypeScript Configuration

* Is `strict: true` enabled in tsconfig.json?
* Are there widespread uses of `any` type? (estimate: common, occasional, rare)
* Are API responses typed? Example interface location?

### 7. Styling

* Which approach? (Tailwind, CSS Modules, styled-components, Sass, other?)
* Is there a design system/theme file? Where?

### 8. Testing

* Which testing library? (Jest, Vitest, Testing Library, Cypress, Playwright?)
* Current test coverage estimate? (none, low <30%, medium 30-70%, high >70%)
* Example test file path

### 9. Multi-tenancy

* How is tenant context managed? (Context, custom hook, localStorage, cookies?)
* Is tenant ID included in API calls? How?
* Example implementation file path

### 10. Project Structure

* Folder organization pattern? (feature-based, layer-based, hybrid?)
* Where are components? (`components/`, `app/`, `src/components/`?)
* Where are pages? (`app/`, `pages/`, `src/app/`?)

## Output Format

```markdown
# Project Implementation Details

## 1. Form Handling
**Library**: [name]
**Validation**: [name]
**Example**: `path/to/example/form.tsx`
**Notes**: [any relevant details]

## 2. UI Component Library
**Library**: [name]
**Custom primitives**: [yes/no - if yes, list examples]
**Example import**: `import { Button } from "..."`
**Notes**: [any relevant details]

## 3. State Management
**Solution**: [name]
**Global state location**: [path or N/A]
**Example**: `path/to/state/usage.tsx`
**Notes**: [any relevant details]

## 4. Data Fetching
**Pattern**: [Server Components / Client Components / Pages Router]
**Client library**: [name or N/A]
**Example**: `path/to/data/fetching.tsx`
**Notes**: [any relevant details]

## 5. API Client
**Centralized**: [yes/no]
**Location**: [path or "inline in components"]
**Base URL env var**: [NEXT_PUBLIC_API_URL or other]
**Example**: `path/to/api/service.ts`
**Notes**: [any relevant details]

## 6. TypeScript
**Strict mode**: [yes/no]
**`any` usage**: [common/occasional/rare]
**API types location**: [path or "not typed"]
**Notes**: [any relevant details]

## 7. Styling
**Approach**: [name]
**Theme/design system**: [path or N/A]
**Notes**: [any relevant details]

## 8. Testing
**Library**: [name or "not configured"]
**Coverage estimate**: [none/low/medium/high]
**Example test**: [path or N/A]
**Notes**: [any relevant details]

## 9. Multi-tenancy
**Tenant context**: [how it's managed]
**API integration**: [how tenant ID is passed]
**Example**: `path/to/tenant/implementation.tsx`
**Notes**: [any relevant details]

## 10. Project Structure
**Pattern**: [feature-based/layer-based/hybrid]
**Components**: [path]
**Pages**: [path]
**Notes**: [any relevant details]
```

## Instructions

1. Scan the project structure quickly
2. Look for key files: package.json, tsconfig.json, example components, API calls
3. Fill in the template above with actual findings
4. If something doesn't exist or is unclear, state it explicitly (don't guess)
5. Keep it concise - we need facts, not explanations

**Priority**: Focus on accuracy over completeness. If you can't determine something confidently from the codebase, say "Unknown - needs manual verification" rather than guessing.
