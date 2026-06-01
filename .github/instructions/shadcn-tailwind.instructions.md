---
applyTo: 'src/components/ui/**/*.{js,jsx,ts,tsx},src/components/Shadcn/**/*.{js,jsx,ts,tsx},src/app/globals.css,tailwind.config.js'
---

# shadcn/ui and Tailwind CSS instructions

This project uses:

- **Tailwind CSS v4.2.1** with CSS-first config (`@theme inline` in `globals.css`)
- **shadcn/ui** with `radix-nova` style (not `default` or `new-york`)
- **class-variance-authority** for component variants
- **tailwind-merge v3 + clsx** via `cn()` from `@/lib/utils`
- **lucide-react** as the only approved icon library

When working on UI components:

- Import from `@/components/ui/` using the project alias — never from node_modules directly.
- Always combine classes with `cn()` from `@/lib/utils`.
- Use design tokens instead of arbitrary colors: `bg-primary`, `text-muted-foreground`, `bg-success`, `bg-warning`, `bg-info`, `bg-destructive`, `text-foreground-400`.
- Do not use `bg-[#hex]` or `text-[#hex]` if a semantic token exists.
- Do not modify files in `src/components/ui/` unless strictly necessary — compose instead.
- Do not introduce another UI component library.
- Do not use arbitrary oklch values if a token covers the use case.
- The color system uses oklch — do not convert to hex.
- Respect the `radix-nova` style conventions in component variants.
- Use `cva()` for new component variants, not inline conditional class strings.
- Check `components.json` before adding a new shadcn component (it may already exist).
