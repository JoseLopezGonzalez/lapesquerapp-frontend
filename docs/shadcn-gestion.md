# Gestión de shadcn/ui en el proyecto

Documento de referencia para saber cómo está implementado shadcn en este proyecto y cómo gestionarlo (añadir componentes, tema, qué no tocar).

---

## 1. Resumen de la implementación actual

- **Estilo:** `radix-nova` (look Nova con primitivos Radix). El valor en `components.json` debe ser `radix-nova` (no `nova`), porque el registry de `shadcn add` solo expone rutas como `radix-nova` o `base-nova`.
- **Base de color:** Neutral (OKLCH en `globals.css`).
- **Iconos:** Lucide (`lucide-react`).
- **Tipografía:** Geist Sans y Geist Mono (`next/font/google`), aplicadas vía variables CSS en el layout.
- **Tailwind:** v4, con `@theme inline` y tokens en `src/app/globals.css`.

---

## 2. Configuración: `components.json`

Ubicación: raíz del proyecto.

| Clave | Valor actual | Notas |
|-------|--------------|--------|
| `style` | `"radix-nova"` | No usar `"nova"` a secas (da 404 en el registry). Para Nova con Radix: `radix-nova`. Para Base UI: `base-nova`. |
| `tailwind.baseColor` | `"neutral"` | Coherente con los tokens en `globals.css`. |
| `iconLibrary` | `"lucide"` | Imports desde `lucide-react`. |
| `tsx` | `false` | Componentes en `.jsx`. |

Los componentes que instala el CLI con `radix-nova` importan desde el paquete unificado **`radix-ui`** (no desde `@radix-ui/react-*`). Por eso el proyecto tiene la dependencia `radix-ui` en `package.json`; no eliminarla o los componentes de `src/components/ui` que vienen del registry fallarán al compilar.

---

## 3. Tema y tokens: `src/app/globals.css`

- **Imports:** `tailwindcss`, `tw-animate-css` (sin `shadcn/tailwind.css`).
- **`@theme inline`:** Mapea variables CSS del tema (`--color-*`, `--radius-*`, `--font-sans`, `--font-mono`) para que Tailwind las use. Las fuentes apuntan a `var(--font-geist-sans)` y `var(--font-geist-mono)`.
- **`:root` y `.dark`:** Definición de tokens en OKLCH (background, foreground, card, primary, secondary, muted, accent, destructive, border, input, ring, chart 1–5, sidebar, etc.). Incluye escalas propias `--foreground-50/100/300/400` para el mapa Stores Manager y otros usos. Acentos en turquesa (`--ring`, `--sidebar-ring`, `--sidebar-primary` en dark).
- **Tipografía base:** En `@layer base`, el `body` usa `font-sans` (Geist). Opcional: `html { font-size: 15px; }` si se quiere una base algo más pequeña.

No eliminar ni renombrar las variables que usan los componentes (p. ej. `--ring`, `--sidebar-*`, `--foreground-50`, etc.) sin revisar usos en el código.

---

## 4. Fuente Geist: `src/app/layout.js`

- Import de `Geist` y `Geist_Mono` desde `next/font/google`.
- Variables: `--font-geist-sans` y `--font-geist-mono`.
- El `<body>` tiene las clases de esas variables más `antialiased` y las de layout (`bg-background`, etc.).

Si se quita Geist, hay que actualizar `globals.css` (`@theme`: `--font-sans` y `--font-mono`) para que apunten a otra pila de fuentes (p. ej. system-ui).

---

## 5. Cómo añadir o actualizar componentes

### Añadir un componente nuevo

```bash
npx shadcn@latest add <nombre> --yes
```

Ejemplos: `npx shadcn@latest add switch --yes`, `npx shadcn@latest add form --yes`.

El CLI usa el `style` y la configuración de `components.json` (radix-nova, neutral, lucide) y escribe en `src/components/ui/`. Los nuevos componentes importarán de `radix-ui`.

### Sobrescribir componentes ya existentes

```bash
npx shadcn@latest add <nombre> --overwrite --yes
```

Para actualizar varios básicos a la vez (misma lista que en la última reinstalación):

```bash
npx shadcn@latest add alert alert-dialog avatar badge breadcrumb button card checkbox collapsible dialog dropdown-menu input label pagination popover scroll-area separator sheet skeleton slider table tabs textarea toggle tooltip accordion select --overwrite --yes
```

**Precaución:** No sobrescribir sin revisar los componentes listados en la sección 6 (avanzados/personalizados); podrías perder lógica o integraciones propias.

---

## 6. Componentes que no sobrescribir sin revisar

Estos componentes tienen lógica de negocio, locale, integraciones o estilos propios. **No se han reinstalado** con el CLI en la pasada de alineación (radix-nova); si los añades con `shadcn add ... --overwrite`, se perderían las personalizaciones.

| Componente | Ubicación | Personalizaciones / peculiaridades |
|------------|-----------|-------------------------------------|
| **sidebar** | `src/components/ui/sidebar.jsx` | Cookie de estado, atajo teclado (Ctrl/Cmd+B), ancho icon/expandido, Sheet móvil, `useIsMobile`, ~630 líneas. Muy acoplado al layout. |
| **theme-toggle** | `src/components/ui/theme-toggle.jsx` | next-themes, labels en español, estilos sidebar (border, bg), placeholder antes de mount para hidratación. |
| **datePicker** | `src/components/ui/datePicker.jsx` | Locale `es`, formato short/long, `parseShortDate` (dd/mm/yyyy), input manual + calendar, validación de fechas. |
| **dateRangePicker** | `src/components/ui/dateRangePicker.jsx` | Locale `es`, botones "año anterior", "último año", "año actual", `useIsMobileSafe`, ancho popover móvil, `differenceInCalendarDays` para longitud del rango. |
| **calendar** | `src/components/ui/calendar.jsx` | Usado por DatePicker y DateRangePicker, `classNames` extensos, soporte `mode="range"`, botones nav con `buttonVariants`. |
| **command** | `src/components/ui/command.jsx` | Base del Combobox; `CommandDialog` con clases propias; usado en búsquedas/selects. |
| **Combobox** | `src/components/Shadcn/Combobox/index.js` | No es de `ui/`; usa Command + Popover + Button; loading, onBlur, búsqueda, scroll al cambiar búsqueda. No sobrescribir; al actualizar Command, comprobar compatibilidad. |
| **input-otp** | `src/components/ui/input-otp.jsx` | Estilo de slots (bordes, ring), caret blink; depende de la librería `input-otp`. |
| **emailListInput** | `src/components/ui/emailListInput.jsx` | Componente propio (no shadcn): validación email, badges con eliminación, Heroicons X. |
| **CustomSkeleton** | `src/components/ui/CustomSkeleton.jsx` | Componente propio: shimmer, `neutral-800/700`, no es skeleton de shadcn. |
| **chart** | `src/components/ui/chart.jsx` | Wrapper de recharts; revisar si hay colores/ejes custom antes de sobrescribir. |
| **carousel** | `src/components/ui/carousel.jsx` | Embla; revisar breakpoints o estilos propios antes de sobrescribir. |

Más contexto y próximos pasos: [docs/shadcn-advanced-components.md](shadcn-advanced-components.md).

Si en el futuro quieres alinear alguno con radix-nova, conviene comparar con el código generado por el CLI o con el dummy del preset antes de sobrescribir.

---

## 7. Cambiar estilo o base de color en el futuro

- **Solo cambiar look (colores/radios):** Ajustar tokens en `globals.css` (`:root` y `.dark`). No es necesario tocar `components.json` ni reinstalar componentes.
- **Cambiar el estilo de los componentes (p. ej. a default o new-york):**  
  1. Cambiar `style` en `components.json` (p. ej. a `"default"` o `"new-york"`).  
  2. Reinstalar los componentes que quieras con `shadcn add ... --overwrite --yes`.  
  Nota: con `default` o `new-york` los componentes suelen importar de `@radix-ui/react-*`; el paquete `radix-ui` podría dejar de ser necesario para esos archivos, pero si mantienes algún componente radix-nova, sigue siendo necesaria la dependencia `radix-ui`.
- **Volver a Nova (Radix):** Dejar `style` en `"radix-nova"` y tener `radix-ui` instalado; los añadidos nuevos ya vendrán con el look Nova.

---

## 8. Referencia rápida de archivos clave

| Qué | Dónde |
|-----|--------|
| Config del CLI | `components.json` |
| Tema (tokens, @theme) | `src/app/globals.css` |
| Fuente Geist | `src/app/layout.js` |
| Componentes UI | `src/components/ui/*.jsx` |
| Componentes avanzados / no sobrescribir | [docs/shadcn-advanced-components.md](shadcn-advanced-components.md) |
| Tailwind (content, darkMode, extend) | `tailwind.config.js` |

---

*Última actualización: configuración radix-nova + dependencia radix-ui; componentes básicos reinstalados con ese estilo.*
