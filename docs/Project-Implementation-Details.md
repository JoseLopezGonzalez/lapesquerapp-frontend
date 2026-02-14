# Project Implementation Details

## 1. Form Handling
**Library**: React Hook Form  
**Validation**: Backend-driven (Laravel-style 422 errors). No client-side schema library in forms; `setErrorsFrom422` maps backend `errors` object to `setError` from react-hook-form. Zod is present in the project but only used for AI tools (`src/lib/ai/tools/entityTools.js`), not for form validation.  
**Example**: `src/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm/index.js`  
**Notes**: Forms use `register`, `Controller`, `handleSubmit`, `setError`; some use `useFieldArray`. Validation rules sometimes come from config (e.g. `prepareValidations(fields)` with `validation.pattern`).

## 2. UI Component Library
**Library**: shadcn/ui-style (Radix UI primitives + class-variance-authority + Tailwind). NextUI is also in the stack (`tailwind.config.js` uses `nextui`).  
**Custom primitives**: Yes — custom components in `src/components/ui/`: Button, Input, Card, Select, Dialog, Sheet, DatePicker, DateRangePicker, Combobox, EmailListInput, etc. (38 UI files).  
**Example import**: `import { Button } from '@/components/ui/button';`  
**Notes**: Components are in `.jsx`; use `@radix-ui/*`, `cva`, `cn` from `@/lib/utils`. Also `@headlessui/react`, `@heroicons/react`, `lucide-react`, `react-icons`.

## 3. State Management
**Solution**: React Context API.  
**Global state location**: `src/context/` — e.g. `SettingsContext.js`, `OptionsContext.js`, `BottomNavContext.jsx`, `LogoutContext.jsx`, `OrdersManagerOptionsContext.js`, `RawMaterialReceptionsOptionsContext.js`. No Zustand, Redux, or Jotai.  
**Example**: `src/context/SettingsContext.js` (settings + tenant-aware loading)  
**Notes**: Client components use `"use client"`; state is scoped per context. No single global store file.

## 4. Data Fetching
**Pattern**: App Router (Next.js 16). Mix of Server and Client Components; many pages are client components that fetch in `useEffect` or via hooks.  
**Client library**: Native `fetch` via a wrapper — `fetchWithTenant` (`src/lib/fetchWithTenant.js`). No React Query or SWR.  
**Example**: `src/services/authService.js` (uses `fetchWithTenant` + `API_URL_V2`); `src/context/SettingsContext.js` (fetches settings).  
**Notes**: API base URL from `src/configs/config.js` (`API_URL`, `API_URL_V1`, `API_URL_V2`). All HTTP calls should go through `fetchWithTenant` for tenant header and auth error handling.

## 5. API Client
**Centralized**: Yes.  
**Location**: `src/services/` — domain and generic services (e.g. `authService.js`, `settingsService.js`, `palletService.js`, `orderService.js`, `entityService.js`, plus `src/services/domain/*`). API calls use `fetchWithTenant` and URLs from `@/configs/config`.  
**Base URL env var**: `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL` (fallback: `https://api.lapesquerapp.es`). In dev with backend on localhost, client uses proxy `/api-backend`.  
**Example**: `src/services/authService.js`, `src/configs/config.js`  
**Notes**: No dedicated API client class; each service exports functions that call `fetchWithTenant(API_URL_V1/API_URL_V2 + path, options)`.

## 6. TypeScript
**Strict mode**: N/A — project is JavaScript. No `tsconfig.json` in repo.  
**`any` usage**: N/A (no TypeScript).  
**API types location**: Not typed; no shared API response interfaces.  
**Notes**: Some JSDoc in places (e.g. `setErrorsFrom422.js`). Occasional `as any` in a few `.js` files (e.g. SelectionDialog, some domain services) — likely for dynamic or loosely typed data.

## 7. Styling
**Approach**: Tailwind CSS.  
**Theme/design system**: `tailwind.config.js` (theme.extend with HSL CSS variables: `--background`, `--primary`, `--card`, etc.) and `src/app/globals.css` (`:root` and `.dark` with variable definitions). shadcn-style design tokens.  
**Notes**: `@tailwindcss/forms`, `tailwindcss-animate` in devDependencies. NextUI theme included in Tailwind config. Utility: `cn()` from `@/lib/utils` for class merging.

## 8. Testing
**Library**: React Testing Library (`@testing-library/react`). Playwright appears in lockfile (optional/transitive). No Jest or Vitest config in `package.json`.  
**Coverage estimate**: Low — only 3 test files found: `src/app/home/page.test.js`, `src/__tests__/helpers/receptionTransformations.test.js`, `src/__tests__/helpers/receptionCalculations.test.js`.  
**Example test**: `src/app/home/page.test.js`  
**Notes**: No `test` or `jest`/`vitest` script in package.json; testing setup may be incomplete or run via another mechanism.

## 9. Multi-tenancy
**Tenant context**: Derived from `window.location.host` (subdomain or localhost prefix). No React Context for tenant; utility `getCurrentTenant()` in `src/lib/utils/getCurrentTenant.js` (client-only; returns `null` on server). Server gets tenant from `headers().get('host')` inside `fetchWithTenant`.  
**API integration**: Tenant is sent as header `X-Tenant` on every request in `fetchWithTenant`. Settings and other tenant-scoped data use `getCurrentTenant()` when building URLs or invalidating cache (e.g. `SettingsContext`, `getSettingValue.js`).  
**Example**: `src/lib/fetchWithTenant.js`, `src/lib/utils/getCurrentTenant.js`, `src/context/SettingsContext.js`  
**Notes**: Production: tenant = first segment of host (e.g. `brisamar.lapesquerapp.es` → `brisamar`). Development: `localhost` or `tenant.localhost` → `dev` or subdomain name.

## 10. Project Structure
**Pattern**: Hybrid — layer-based (services, components, app, context, hooks) with some feature grouping under `src/components/Admin/`, `src/components/Warehouse/`, `src/services/domain/`.  
**Components**: `src/components/` — including `src/components/ui/` (primitives), `src/components/Admin/`, `src/components/Warehouse/`, `src/components/Shadcn/`, `src/components/Utilities/`, `src/components/PWA/`.  
**Pages**: `src/app/` (App Router) — e.g. `src/app/page.js`, `src/app/admin/**/page.js`, `src/app/warehouse/[storeId]/**/page.js`, `src/app/auth/verify/page.js`.  
**Notes**: Path alias `@/` points to `src/`. No `pages/` directory. Layouts: `src/app/ClientLayout.js`, `src/app/admin/AdminLayoutClient.jsx`, etc.
