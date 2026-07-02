# PesquerApp — Design Context
> This file is mandatory reading for any agent implementing UI. Read before touching any view.
> Last updated: 2026-06-27
> Source: Extracted from codebase audit — not manually authored.

---

## 1. Color Palette

All colors are defined as OKLCH tokens in `src/app/globals.css`. Never hardcode hex, rgb, or literal OKLCH values — always reference the CSS variable.

### Background & Surface
| Token | Light | Dark | Role |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` (white) | `oklch(0.145 0 0)` (near-black) | Page background |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Card surface |
| `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Dropdown / popover surface |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Muted surface, skeleton bg |
| `--accent` | `oklch(0.97 0 0)` | `oklch(0.371 0 0)` | Hover accent surface |
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | Sidebar background |

### Custom Foreground Scale (project-specific)
Used for table headers, card backgrounds, subtle containers. Do not confuse with `--foreground`.
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--foreground-50` | `oklch(0.98 0 0)` | `oklch(0.25 0 0)` | Table header `bg-foreground-50` |
| `--foreground-100` | `oklch(0.95 0 0)` | `oklch(0.3 0 0)` | Slightly darker surface |
| `--foreground-300` | `oklch(0.75 0 0)` | `oklch(0.5 0 0)` | Mid-tone dividers |
| `--foreground-400` | `oklch(0.55 0 0)` | `oklch(0.65 0 0)` | Secondary text alternative |

### Text
| Token | Light | Dark | Role |
|---|---|---|---|
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Secondary / helper text |
| `--card-foreground` | same as `--foreground` | | Text on cards |

### Interactive
| Token | Light | Dark | Role |
|---|---|---|---|
| `--primary` | `oklch(0.205 0 0)` (near-black) | `oklch(0.87 0 0)` | Primary action |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | Text on primary |
| `--secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Secondary surface |
| `--ring` | `oklch(0.62 0.19 250)` (blue) | `oklch(0.68 0.17 250)` | Focus ring |

### Semantic
| Token | Light | Dark | Role |
|---|---|---|---|
| `--destructive` | `oklch(0.58 0.22 27)` (red) | `oklch(0.704 0.191 22)` | Error / delete |
| `--success` | `oklch(0.74 0.17 155)` (green) | same | Success state |
| `--warning` | `oklch(0.83 0.17 92)` (amber) | same | Warning state |
| `--info` | `oklch(0.72 0.16 300)` (violet) | same | Info state |
| `--invert` | `oklch(0.17 0 0)` | `oklch(0.33 0 0)` | High-contrast surface |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Borders and dividers |
| `--input` | same as `--border` | same | Input borders |

### Status Colors (inline Tailwind — not CSS vars)
Status badges in list items use inline Tailwind classes, not the Badge component. Observed pattern:
```
pending/in-progress: bg-orange-500/15 text-orange-700 dark:text-orange-300
finished/success:    bg-green-500/15  text-green-700  dark:text-green-300
incident/error:      bg-red-500/15    text-red-700    dark:text-red-300
neutral/type:        bg-neutral-500/15 text-neutral-700 dark:text-neutral-300
maquilador/external: bg-amber-500/15  text-amber-700  dark:text-amber-300
offer/info:          bg-blue-500/15   text-blue-700   dark:text-blue-300
```
Dot indicator inside status badge: `h-1.5 w-1.5 rounded-full` with matching bg-color.

### Status Tokens (inline badge pattern — candidate for tokenization)

> **NOT yet in globals.css** — these are the Tailwind equivalents used today, documented here
> so the Auditor knows they are intentional, not violations of the "no hardcoded colors" rule.

| Semantic name | CSS token (future) | Current Tailwind bg | Current Tailwind text |
|---|---|---|---|
| Pending | `--status-pending-bg / --status-pending-text` | `bg-orange-500/15` | `text-orange-700 dark:text-orange-300` |
| In progress | `--status-in-progress-bg / --status-in-progress-text` | `bg-orange-500/15` | `text-orange-700 dark:text-orange-300` |
| Finished | `--status-finished-bg / --status-finished-text` | `bg-green-500/15` | `text-green-700 dark:text-green-300` |
| Incident / Error | `--status-incident-bg / --status-incident-text` | `bg-red-500/15` | `text-red-700 dark:text-red-300` |
| Cancelled | `--status-cancelled-bg / --status-cancelled-text` | `bg-red-500/15` | `text-red-700 dark:text-red-300` |
| Neutral / Type tag | n/a | `bg-neutral-500/15` | `text-neutral-700 dark:text-neutral-300` |
| External / Maquilador | n/a | `bg-amber-500/15` | `text-amber-700 dark:text-amber-300` |
| Offer / Info | n/a | `bg-blue-500/15` | `text-blue-700 dark:text-blue-300` |

When these tokens are eventually defined in `globals.css`, migrate all inline badges to use them. Until then, use the Tailwind classes above — they are the **documented pattern**, not violations.

---

## 2. Typography

**Font families:**
- Sans: `var(--font-geist-sans)` → Geist Sans
- Mono: `var(--font-geist-mono)` → Geist Mono

**Scale in use (Tailwind classes observed across codebase):**
| Class | Size | Weight | Usage |
|---|---|---|---|
| `text-xl font-medium` | 1.25rem | 500 | Page / section title (EntityHeader `<h2>`) |
| `text-lg font-medium` | 1.125rem | 500 | `CardTitle` **inside a tab card** — one step below page/section title (see sub-scale rule below) |
| `text-base font-medium` | 1rem | 500 | Primary identifier in cards and rows |
| `text-base` | 1rem | 400 | Input text, body content |
| `text-sm font-medium` | 0.875rem | 500 | Secondary label, emphasized small text |
| `text-sm text-muted-foreground` | 0.875rem | 400 | Secondary / helper text, metadata |
| `text-xs text-muted-foreground` | 0.75rem | 400 | Column headers, field labels above inputs |
| `text-xs font-medium` | 0.75rem | 500 | Badge text, table column headers |
| `text-[11px] font-medium` | 0.6875rem | 500 | Inline status badges in mobile cards |
| `text-[0.8rem]` | — | — | Button `sm` size |

**Leading:** `leading-tight` for multi-line card titles that may truncate.
**Tabular nums:** `tabular-nums` on IDs, dates, quantities for alignment.
**Truncation:** `truncate` on names/titles that could overflow, paired with `title` attribute.

**Capitalización:**
- Cabeceras de tabla (`TableHead`): Title Case — "Peso Recepciones", "Importe Salidas"
- Todo lo demás (pestañas, botones, labels de formulario, títulos de sección,
  menús): sentence case — "Nueva liquidación", "Rango de fechas", "Descargar PDF"

**Sub-escala de `CardTitle` dentro de tarjetas de tab (regla, GAP-084):**

Cuando un `CardTitle` vive dentro de una tarjeta que a su vez está dentro de un **tab** de un
detail view (p. ej. las tarjetas de `OrderAuxiliaryLines`, `OrderCostAnalysis`,
`OrderProduction` dentro de los tabs de `OrderClient`), usa `text-lg font-medium`, no
`text-xl font-medium`. Es una sub-escala deliberada, un escalón por debajo del título de
página/sección (`text-xl font-medium`, ver EntityHeader `<h2>`), porque el título de la
tarjeta es jerárquicamente secundario respecto al título del tab/página que ya lo contextualiza.

```tsx
// ✅ CardTitle dentro de una tarjeta de tab — un escalón por debajo del título de página
<CardTitle className="text-lg font-medium">Otros artículos</CardTitle>

// ✅ Título de página o de sección de nivel superior (EntityHeader, cabecera de detail view)
<h2 className="text-xl font-medium">Pedido #1234</h2>
```

No confundir con un bug: si un `CardTitle` de tab aparece en `text-lg`, es el patrón correcto,
no hay que subirlo a `text-xl`. Este criterio se decidió explícitamente para `OrderAuxiliaryLines`
(GAP-084) y se reutiliza en `OrderCostAnalysis` (GAP-086) y `OrderProduction` (GAP-087).

---

## 3. Spacing & Layout

**Page-level padding:**
- Detail pages: `p-4 sm:p-6`
- Table section header: `px-4 py-4 pt-6 sm:px-6` (top-padded 6 instead of 4)

**Card content:**
- Cards using `CardContent`: override to `py-0` and handle padding manually inside
- Default card padding (when not overriding): shadcn default `p-6`

**Grid gaps:**
- Between form fields: `gap-3` or `gap-4`
- Between stack items: `space-y-1` (tight, inside cards) / `space-y-2` (between sections)
- Between action buttons: `gap-2`
- Between card metadata items: `gap-3` or `gap-4`

**Max-width:**
- Content containers: no explicit max-width at page level (full width)
- Dialog: see Section 4 Modals

**Mobile safe areas:**
- Bottom nav padding: `pb-20` (80px) for scroll areas when BottomNav visible
- Safe area token: `MOBILE_SAFE_AREAS.BOTTOM_WITH_NAV` from `@/lib/design-tokens-mobile`

---

## 4. Component Patterns

### Tables

**Technology:** TanStack Table (`@tanstack/react-table`) v8 — `getCoreRowModel` pattern.

**Structure:**
```
EntityTableHeader (title + action buttons)
└── EntityBody (switches mobile/desktop)
    ├── Desktop: Table > TableHeader (sticky bg-foreground-50) > TableBody
    └── Mobile: AccordionBody (from EntityClient)
EntityFooter (PaginationFooter + ResultsSummary)
```

**Column definition pattern (from `generateColumns.js`):**
- Column meta `cellClass` for custom cell padding (e.g., `'!px-2 w-8'` for checkbox column)
- `flexRender` for both header and cell

**Header style:** `bg-foreground-50 sticky top-0 z-10`

**Row style:** Default shadcn TableRow (no explicit custom)

**Loading state (17 skeleton rows):**
```tsx
{[...Array(17)].map((_, idx) => (
  <TableRow key={idx}>
    {columns.map((col, i) => (
      <TableCell key={i}>
        <Skeleton className="h-6 w-full rounded-lg" />
      </TableCell>
    ))}
  </TableRow>
))}
```

**Empty state:**
```tsx
<div className="mb-4 flex h-full flex-col items-center justify-center py-24">
  <EmptyState title={emptyState.title} description={emptyState.description} />
</div>
```

**Blocked/processing overlay:**
```tsx
<div className="bg-background/50 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm">
  <Loader2 className="text-primary h-6 w-6 animate-spin" />
  <p className="text-muted-foreground text-sm">Procesando...</p>
</div>
```
Note: Loader2 spinner is acceptable only as a processing overlay on top of already-loaded data. Never as a primary loading replacement for Skeleton.

**Pagination placement:** Bottom of table, in EntityFooter.

**Action column pattern:** Last column, DropdownMenu with EllipsisVertical trigger.

**Selection column:** First column, Checkbox, width `w-8`.

---

### Forms

**Stack:** React Hook Form + Zod + shadcn Form components.

**Field layout:**
- 1-column: `<div className="grid gap-3">` or `space-y-4`
- 2-column grid: `<div className="grid grid-cols-2 gap-3">` (or `sm:grid-cols-2`)
- Field spanning full width: `col-span-2` or `col-span-full`

**Label position:** Above the input (`<Label>` then `<Input>`).

**Error message style:**
```tsx
{errors.field_name && (
  <p className="text-red-400 text-xs pt-1">* {errors.field_name.message}</p>
)}
```

**Submit button placement:**
- In dialogs: DialogFooter, right-aligned (`sm:justify-end`), primary button last
- In pages: bottom of form, `flex justify-end gap-2`

**Disabled state:** `disabled:opacity-50 disabled:pointer-events-none` via button CVA.

**Select vs Combobox:**
- `<Select>`: for small, static lists (< 10 options, no search)
- `<Combobox>` (from `@/components/Shadcn/Combobox`): for API-loaded options, searchable

**DatePicker:** `@/components/ui/datePicker` — wrapper around shadcn Calendar + Popover.

---

### Modals & Dialogs

**Dialog (centered modal):**
- Import from `@/components/ui/dialog`
- Custom `size` prop: `sm` (default, max-w-sm), `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `7xl`, `full`
- `showCloseButton={true}` by default — `XIcon` button top-right, `h-7 w-7`
- DialogTitle: `text-base font-medium` — always required (a11y)
- DialogFooter: `bg-muted/50 border-t rounded-b-xl -mx-4 -mb-4` (bleeds to edges)
- Destructive confirmation: **always AlertDialog**, not Dialog

**Sheet (side panel):**
- Desktop filters: `side="right"`
- Mobile forms: `side="bottom"` + `className="max-h-[90vh]"`
- ScrollArea inside SheetContent for overflow
- SheetFooter sticky at bottom: `sticky bottom-0 bg-background pt-4`

**When to use which:**
- Dialog: data-entry modals, info display, sizes up to xl for most cases
- AlertDialog: destructive confirmation ONLY (delete, irreversible action)
- Sheet right: filter panels on desktop
- Sheet bottom: any form on mobile
- Full page: master-detail views (OrdersManager, PalletDialog on desktop at large sizes)

**Destructive confirmation pattern:**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Eliminar</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar [entidad]?</AlertDialogTitle>
      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Cards

**When used:** List items (OrderCard, MobileStoreCard), summary panels, info blocks.

**Style:**
- Component: `<Card>` + `<CardContent className="py-0">`
- No explicit shadow in operational cards — relies on `ring-1 ring-foreground/10` via default card
- Border-only approach for list cards (no elevated shadow)
- Hover/active on clickable cards: `active:bg-accent/60` or `active:bg-muted/50`

**Clickable card pattern:**
```tsx
<Card
  role="button"
  tabIndex={0}
  onClick={onClick}
  className="cursor-pointer transition-colors active:bg-accent/60"
>
```

---

### Status & Badges

**Badge component** (`@/components/ui/badge`) variants:
| Variant | Background / Text | Usage |
|---|---|---|
| `default` | primary bg, primary-foreground text | General tag |
| `secondary` | secondary bg | Neutral tag |
| `success` | green-50 / green-700 | Completed, active |
| `warning` | amber-50 / amber-700 | Pending, caution |
| `info` | sky-50 / sky-700 | Informational |
| `destructive` | destructive/10 / destructive | Error, cancelled |
| `outline` | border-border / foreground | Secondary tag |

**Inline status badges** (not Badge component — used in list cards for primary status):
```tsx
<span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-orange-500/15 text-orange-700 dark:text-orange-300">
  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
  En producción
</span>
```
Use Badge component for secondary tags and metadata; use inline pattern for the main entity status.

---

### Loading States

**Primary pattern — Skeleton rows in tables:**
```tsx
{[...Array(17)].map((_, idx) => (
  <TableRow key={idx}>
    {columns.map((_, i) => (
      <TableCell key={i}><Skeleton className="h-6 w-full rounded-lg" /></TableCell>
    ))}
  </TableRow>
))}
```

**Card lists:**
```tsx
{Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} className="h-10 w-full rounded-md" />
))}
```

**Mobile list:**
```tsx
// MobileStoreListSkeleton pattern:
<Skeleton className="h-[72px] w-full rounded-xl" />
```

**Processing overlay (on top of loaded data):** Loader2 spinner with `backdrop-blur-sm` overlay — NOT for initial load.

**Exception — `<Loader>` component:**
`src/components/Utilities/Loader/index.js` (Loader2 icon + "Cargando" text, centered) is acceptable **only** for full-page session/auth loading states where no data skeleton makes sense — e.g. waiting for NextAuth session to resolve before any data is available. It is **NOT** acceptable as a data-loading replacement for Skeleton. Example of correct usage: `MobileStoresManager` shows `<Loader />` while `sessionStatus === 'loading'`.

**Rules:**
- Always use Skeleton for initial data load (lists, tables, forms, cards)
- Use `<Loader>` only for auth/session loading gates where no content shape is known yet
- Never use a `<Spinner>` or `<Loader>` component as a data-fetching loading state
- Never render "Cargando..." text as a loading state (except inside `<Loader>` for session gates)
- The `spinner.jsx` component exists but is for specific non-list contexts only

---

### Empty States

**Primary component:** `EmptyState` from `@/components/Utilities/EmptyState` (used in EntityBody)

**Shadcn Empty compound** (`@/components/ui/empty`) — for custom empty states:
```tsx
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon"><PackageOpen /></EmptyMedia>
    <EmptyTitle>Sin resultados</EmptyTitle>
    <EmptyDescription>Ajusta los filtros para ver resultados.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button variant="outline">Limpiar filtros</Button>
  </EmptyContent>
</Empty>
```

**Pattern:** Icon → title → description → optional action button. Never just text alone.

**Container:** `flex flex-col items-center justify-center py-24` (in table context) or `p-6 text-center` (in card/panel).

---

### Error States

**Inline (field errors):** `text-red-400 text-xs pt-1` with `*` prefix
**Inline (API errors):** `text-red-500 text-sm p-4`
**Toasts:** `notify.error(getErrorMessage(error))` — via Sonner through `@/lib/notifications`
**422 errors:** Mapped to form fields with `setErrorsFrom422(setError, errors)`

Never use `alert()`, `console.error` display, or bare `<p className="text-red-500">` without `p-4` context padding.

---

### Action Buttons

**Hierarchy:**
1. Primary action (create, save): `<Button>` (default variant, near-black bg)
2. Secondary / neutral: `<Button variant="outline">` or `variant="secondary"`
3. Low-emphasis: `<Button variant="ghost">`
4. Destructive: `<Button variant="destructive">` (soft red bg, red text)
5. Links: `<Button variant="link">`

**Placement:**
- Table/list primary action (create): top-right of EntityTableHeader, after filter/refresh
- Form submit: last button in DialogFooter / SheetFooter
- Cancel: second-to-last in DialogFooter (`variant="outline"`)
- Refresh: icon button (`variant="outline" size="icon"`) with `RefreshCw` icon

**Confirmation before delete:** AlertDialog — never trigger delete on single Button click.

**Dropdown for multiple actions:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><EllipsisVertical /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 5. Mobile Patterns

**Breakpoint:** `< 768px` (Tailwind `max-md:` / `md:` prefix). Mobile-first affects only < 768px — desktop must not break.

**Detection hook (always use this, not custom implementations):**
```tsx
import { useIsMobileSafe } from '@/hooks/use-mobile';
const { isMobile, mounted } = useIsMobileSafe();
if (!mounted) return null; // prevents hydration mismatch
```

**Design tokens (import, don't hardcode):**
```tsx
import { MOBILE_HEIGHTS, MOBILE_SPACING, MOBILE_RADIUS, MOBILE_SAFE_AREAS, MOBILE_TYPOGRAPHY }
  from '@/lib/design-tokens-mobile';
// MOBILE_HEIGHTS.INPUT → h-12
// MOBILE_TYPOGRAPHY.INPUT → text-base (prevents iOS zoom on focus)
// MOBILE_SAFE_AREAS.BOTTOM_WITH_NAV → pb-20
```

**Motion presets:**
```tsx
import { feedbackPop } from '@/lib/motion-presets';
// Use for tap feedback on clickable cards — whileTap={{ scale: 0.98 }}
// Max animation: 300ms, only on tapped element, never whole lists
```

**Layout shell (do not modify structure):**
- `BottomNav`: fixed bottom, 5 slots (2 left + CenterActionButton + 2 right)
- `NavigationSheet`: vaul drawer from bottom (NOT shadcn Sheet)
- `ResponsiveLayout`: switches between AppSidebar (desktop) and BottomNav (mobile)
- `BottomNavContext`: `useHideBottomNav(true)` in detail/edit views

**Mobile card pattern:**
```tsx
<div
  className="flex items-start justify-between rounded-xl border bg-card p-4 gap-3 active:bg-muted/50 transition-colors"
  onClick={handleClick}
>
  <div className="flex-1 min-w-0">
    <p className="font-medium truncate">{nombre}</p>
    <p className="text-sm text-muted-foreground truncate">{metadata}</p>
  </div>
  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-700 shrink-0">
    {estado}
  </span>
</div>
```

**Mobile form pattern (Sheet from bottom):**
```tsx
<SheetContent side="bottom" className="max-h-[90vh]">
  <ScrollArea className="h-full">
    {/* Stacked fields, text-base inputs, inputMode="numeric" for quantities */}
  </ScrollArea>
  <SheetFooter className="sticky bottom-0 bg-background pt-4 pb-safe">
    {/* Save / Cancel buttons */}
  </SheetFooter>
</SheetContent>
```

**Touch targets:** Minimum `min-h-[44px]` on all interactive elements.

**Bottom nav clearance:** Any scroll area on mobile needs `pb-20` when BottomNav is visible. Use `useHideBottomNav(true)` in detail and edit views.

**EntityClient mobile behavior:** Automatically renders `AccordionBody` instead of table when `isMobile`. Improve via `getMobilePrimaryFields.js`, not by duplicating the table.

---

## 6. Reference Views

Gold standard implementations for future work:

| Type | File | Why it's the reference |
|---|---|---|
| Table (desktop CRUD) | [EntityBody/index.js](src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/index.js) | Canonical table with loading/empty/blocked/mobile branching |
| Table header + actions | [EntityHeader/index.js](src/components/Admin/Entity/EntityClient/EntityTable/EntityHeader/index.js) | Title + refresh + export + create button pattern |
| Complex form | [CreateOrderForm/index.tsx](src/components/Admin/OrdersManager/CreateOrderForm/index.tsx) | RHF + Zod + Combobox + DatePicker + field-array pattern |
| Dialog (complex) | [PalletDialog/index.tsx](src/components/Admin/Pallets/PalletDialog/index.tsx) | Large Dialog with mobile/desktop branching + AlertDialog for unsaved changes |
| Mobile list card | [OrderCard/index.tsx](src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx) | Mobile vs desktop branching card with inline status badges |
| Mobile list view | [MobileStoreListView.tsx](src/components/Admin/Stores/Mobile/MobileStoreListView.tsx) | StoreCard with progress, load-more, QR integration |

---

## 7. What NOT To Do

Extracted from `.claude/rules/`, GAP audits, and patterns found in the codebase:

**HTTP / Data:**
- Never use `fetch()` directly — always go through `fetchWithTenant` via service layer
- Never hardcode `X-Tenant` header or tenant id in HTTP calls
- Never call `getAuthToken()` from a component — only from services

**TypeScript:**
- Never create new `.js` files — all new code is `.ts` or `.tsx`
- Never use `any` without a `// justified: [reason]` comment
- Never use `@ts-ignore` without an explanatory comment

**Styling:**
- Never hardcode hex, rgb, or literal OKLCH color values in components
- Never use `style={{ }}` inline styles in new or modified components
- Never use `text-[#xxx]` or `bg-[#xxx]` arbitrary color values (only semantic tokens)
- Never use `space-y-*` in flex or grid layouts — use `gap-*`

**Loading / UX:**
- Never use `<Loader>` (`src/components/Utilities/Loader/index.js`) for data fetching states — only for session/auth loading gates (see Loading States § Exception)
- Never use a `<Spinner>` or Loader2 as the primary loading state for lists or forms — use Skeleton
- Never display "Cargando..." as a text loading state outside the `<Loader>` session gate context
- Never trigger a destructive action (delete, close, irreversible) on a single button click without AlertDialog confirmation

**Components:**
- Never rewrite or duplicate a shadcn component — extend via `className` + `cn()`
- Never import `fetchWithTenant` in a component or hook
- Never add animations (Framer Motion) to operational screens (table views, order lists, forms)
- Never use a native `<select>` — always shadcn `<Select>` or `<Combobox>`
- Never use `alert()` or `console.error` to surface errors to the user

**Mobile:**
- Never use `useMediaQuery` — always `useIsMobileSafe` from `@/hooks/use-mobile`
- Never skip `if (!mounted) return null` when conditionally rendering based on `isMobile`
- Never animate entire lists — only the single tapped element
- Never let content be hidden behind the BottomNav (missing `pb-20`)
- Never skip `useHideBottomNav(true)` in detail or edit views

**GAP process:**
- Never start implementing a UI GAP without a completed UI Brief section (added in Phase 3)
- Never use inline arrays in TanStack Query `queryKey` — always use factory functions from `queryKeys.ts`

**Exception — status badge colors:**
Status badge colors (`bg-orange-500/15`, `bg-green-500/15`, `bg-red-500/15`, etc.) are the **documented pattern** from design-context.md § Status Tokens. The Auditor must NOT reject these as "hardcoded colors". They are intentional until CSS tokens are defined in globals.css.

---

## 8. UX Principles Inferred

Based on patterns found across the codebase:

1. **Destructive actions always require confirmation.** Every delete, close, or irreversible operation triggers an AlertDialog — never a direct `onClick` action. Found in PalletDialog (unsaved changes), EntityTable (bulk delete), OrdersManager.

2. **Mobile is a separate render path, not a CSS hide/show.** `useIsMobileSafe` returns two render branches — the mobile view can be a completely different layout (OrderCard mobile vs desktop, PalletDialog switching to MobilePalletView). CSS `hidden md:block` is not the primary strategy.

3. **Data always comes from TanStack Query hooks — never useState + useEffect.** No component manages server state locally. Every API call lives in a hook using `useQuery` or `useMutation`, and the component just renders what the hook returns.

4. **Loading states match the shape of the content they replace.** Table → skeleton rows at table cell size. Card list → skeleton cards at card height. Detail panel → skeleton fields. Never a generic centered spinner for first load.

5. **Entity configuration is declarative, not imperative.** The EntityClient + `entitiesConfig.js` system means most CRUD views are configured, not coded. Before building a custom table/form, check if EntityClient covers the case.

6. **Errors surface at the right level.** Field-level errors (422 → react-hook-form via `setErrorsFrom422`), action-level errors (API failures → `notify.error`), connection-level (401 → automatic logout via `fetchWithTenant`). Never mix levels.

7. **Density is high, chrome is minimal.** Page titles are `text-xl font-medium`, not large headings. Cards in lists have no shadow — only a border. Spacing is tight (`gap-2`, `gap-3`). The UI prioritizes showing data, not framing it.

8. **Icons are Lucide-only, images are next/image.** No other icon library except `react-icons/pi` (Excel icon) and `react-icons/fa` (PDF icon) in the EntityHeader — both are pre-existing exceptions. All new icons: `lucide-react`.
