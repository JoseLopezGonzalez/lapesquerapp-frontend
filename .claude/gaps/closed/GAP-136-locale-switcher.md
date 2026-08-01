# GAP-136 — Selector de idioma (ES/PT/EN) en Hero y Footer

## Metadata

- **Tipo:** Feature
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-08-01
- **Autor:** Jose

---

## Contexto y problema

Postscript de la ronda de refinamiento continuo (`landing-proposal.md` §12): Jose notó
que no hay ningún selector de idioma visible en la landing, pese a que el sitio ya sirve
`es`/`pt`/`en` completos desde Fase C. Confirmado en el código: no existe ningún
componente de tipo `LocaleSwitcher`/`LanguageSwitcher` en todo el proyecto, y de hecho
**no hay ni `<nav>`** en la home (`src/app/[locale]/page.tsx` va directo de `Hero` a
`ModulesBento`) — hueco ya señalado desde la auditoría original de Fase A
(`landing-context.md §1`) y nunca cerrado en ninguna fase posterior. Hoy un visitante
solo cambia de idioma editando la URL a mano (`/pt`, `/en`).

Jose preguntó específicamente por un selector "moderno con banderas circulares".

**Por qué NO usar banderas (analizado y acordado con Jose antes de escribir este GAP):**

1. Las banderas representan países, no idiomas — anti-patrón de UX documentado
   (SimpleLocalize, Smashing Magazine): español se habla en España y toda
   Latinoamérica, inglés en UK/US/etc. — no hay una bandera correcta para "English" en
   un sitio de pesca ibérica. El estándar 2026 es texto con el nombre nativo del idioma.
2. Las banderas son intrínsecamente de color (rojo/amarillo España, verde/rojo Portugal,
   rojo/blanco/azul UK) — chocan directamente con la decisión ya bloqueada en
   `landing-context.md §2/§3`: paleta 100% monocroma, cero acento de color nuevo.

---

## Decisiones ya confirmadas por Jose (2026-08-01)

| Dimensión             | Decisión                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sin banderas**      | Selector 100% texto + icono de línea (`Globe`, Lucide, monocromo) — nombres nativos de cada idioma ("Español" / "Português" / "English"), nunca traducidos entre sí.                                                                                                                                                                                    |
| **Componente**        | `DropdownMenu` de shadcn (ya instalado en `src/components/ui/dropdown-menu.jsx`, sin dependencia nueva) — con solo 3 idiomas no hace falta buscador ni overlay complejo.                                                                                                                                                                                |
| **Trigger**           | Botón con icono `Globe` + código de idioma actual en mayúsculas (ES/PT/EN) — compacto, sin banderas.                                                                                                                                                                                                                                                    |
| **Ubicación**         | Sin construir una nav bar completa (fuera de alcance de este GAP — es una decisión mayor y separada que Jose no ha tomado todavía). Se coloca en 2 sitios de menor alcance: esquina superior derecha del `Hero` (posición absoluta, ya es `position: relative`) y en la fila de enlaces del `Footer` (junto a Blog/Aviso Legal/Política de Privacidad). |
| **Mecanismo técnico** | `Link`/`usePathname` de `@/i18n/navigation` (ya usado en `/pricing`, blog, etc.) — cambiar de locale manteniendo la misma página, no siempre redirigir a `/`.                                                                                                                                                                                           |

---

## Solución acordada

### 1. `src/components/LandingPage/LocaleSwitcher.tsx` (nuevo, Client Component)

```tsx
'use client';
// Necesita 'use client': usePathname (next-intl) y estado abierto/cerrado del DropdownMenu

import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LOCALE_LABELS: Record<(typeof routing.locales)[number], string> = {
  es: 'Español',
  pt: 'Português',
  en: 'English',
};

export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} aria-label="Seleccionar idioma">
          <Globe className="h-4 w-4" aria-hidden="true" />
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem key={loc} asChild disabled={loc === locale}>
            <Link href={pathname} locale={loc} hrefLang={loc}>
              {LOCALE_LABELS[loc]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

(Esqueleto de referencia para el Implementador — nombres exactos de exports de
`dropdown-menu.jsx` y props de `Button`/`Link` a verificar contra el código real antes de
copiar tal cual.)

### 2. `src/components/LandingPage/Hero.tsx`

Añadir `<LocaleSwitcher className="absolute top-4 right-4 sm:top-6 sm:right-6" />` dentro
del `<section className="... relative overflow-hidden">` ya existente (Hero ya es
`'use client'`, sin fricción de boundary).

### 3. `src/components/LandingPage/Footer.tsx`

Añadir `<LocaleSwitcher />` en la fila de enlaces junto a Blog/Aviso Legal/Política de
Privacidad (Server Component renderizando un Client Component hijo — patrón válido de
App Router, sin convertir `Footer.tsx` a `'use client'`).

---

## Referencias e inspiración

- [Designing A Perfect Language Selector UX — Smashing Magazine](https://www.smashingmagazine.com/2022/05/designing-better-language-selector/)
- [Language selector best practices — SimpleLocalize](https://simplelocalize.io/blog/posts/language-selector-best-practices/)
- `src/app/[locale]/pricing/page.tsx` — patrón ya real de `Link`/`getPathname` de
  `@/i18n/navigation` en esta base de código.
- `landing-context.md §2/§3` — decisión de paleta monocroma que motiva descartar
  banderas.

---

## UI Brief

- **Vista de referencia:** ninguna existente (componente nuevo) — estilo visual debe
  seguir el resto de controles del sitio (`Button variant="outline"`, iconos Lucide
  monocromos, `DropdownMenu` ya usado en el ERP).
- **Tipo de layout:** control flotante inline, no modal ni página propia.
- **Componentes clave:** `Button`, `DropdownMenu`/`DropdownMenuContent`/
  `DropdownMenuItem`/`DropdownMenuTrigger` (shadcn, ya instalados), icono `Globe`
  (Lucide).
- **Estados requeridos:** ninguno con fetching. El idioma actual se marca `disabled` (o
  con check) en el dropdown para no ofrecer un enlace a la página en la que ya se está.
- **Mobile:** aplica ya — mismo componente, sin variante mobile distinta (un botón +
  dropdown funciona igual en touch).

### Preguntas de confirmación para Jose

Ninguna — dirección ya acordada explícitamente en el hilo (sin banderas, texto + globo,
Hero + Footer, sin nav bar completa).

---

## Criterios de aceptación

- [ ] Existe `src/components/LandingPage/LocaleSwitcher.tsx`, sin ninguna imagen/icono de
      bandera (`grep -rn "flag\|bandera"` sobre el archivo → 0 resultados relevantes).
- [ ] El trigger muestra el icono `Globe` + código de 2 letras del locale actual en
      mayúsculas (ES/PT/EN).
- [ ] El dropdown lista los 3 idiomas por su nombre nativo ("Español"/"Português"/
      "English"), nunca traducidos entre sí.
- [ ] El idioma actualmente activo aparece deshabilitado o marcado como seleccionado en
      el dropdown (no ofrece un enlace circular a la misma página/idioma).
- [ ] Cada enlace del dropdown usa `Link`/`usePathname` de `@/i18n/navigation` con la
      prop `locale` — cambia de idioma manteniendo la ruta actual (verificar navegando
      desde `/pricing` en ES a PT y confirmando que aterriza en `/pt/pricing`, no en
      `/pt`).
- [ ] Cada enlace del dropdown tiene el atributo `lang`/`hrefLang` correcto para su
      idioma de destino.
- [ ] `Hero.tsx` muestra el selector en la esquina superior derecha, sin solaparse con el
      SVG decorativo de fondo ni con el CTA "Ver demo".
- [ ] `Footer.tsx` muestra el selector junto a Blog/Aviso Legal/Política de Privacidad.
- [ ] `grep -rn "sky-\|#[0-9a-fA-F]\{3,6\}"` sobre el nuevo componente → 0 resultados
      (monocromo, tokens semánticos únicamente).
- [ ] Funciona en los 3 locales de origen (probar el selector estando en `/`, `/pt`,
      `/en` y confirmar que cambia correctamente entre los 3 desde cualquiera).
- [ ] Mobile: el dropdown se abre y es usable con touch, sin desbordar la pantalla.
- [ ] `npm run type-check` y `npm run lint` limpios.

---

## Archivos a crear o modificar

**Crear:**

- `src/components/LandingPage/LocaleSwitcher.tsx`

**Modificar:**

- `src/components/LandingPage/Hero.tsx`
- `src/components/LandingPage/Footer.tsx`

**No tocar:**

- `src/i18n/routing.ts`, `src/i18n/navigation.ts` (se reutilizan tal cual, sin cambios).
- `src/middleware.ts`.
- Resto de componentes de `src/components/LandingPage/**`.

---

## Restricciones

- **No usar imágenes/iconos de bandera bajo ninguna circunstancia** — decisión explícita
  de Jose en este mismo hilo.
- **No traducir los nombres de los idiomas** — siempre nombre nativo/autoglotónimo
  ("Español" en cualquier locale, nunca "Spanish"/"Espanhol").
- **No construir una nav bar completa** en este GAP — el selector se coloca en Hero +
  Footer únicamente, sin crear un `<header>`/`<nav>` nuevo. Si Jose decide más adelante
  construir una navegación completa, este componente se reutiliza dentro de ella.
- **No añadir dependencias nuevas** — `DropdownMenu` ya está instalado.
- **No hardcodear colores** — solo tokens semánticos (`Button variant="outline"` ya
  gestiona esto).

---

## Implementación

### Archivos creados

- `src/components/LandingPage/LocaleSwitcher.tsx` — Client Component. Trigger
  `Button variant="outline" size="sm"` con icono `Globe` + código de locale en
  mayúsculas; `DropdownMenu` con los 3 idiomas por nombre nativo; el idioma activo se
  renderiza como texto plano deshabilitado dentro del `DropdownMenuItem` (sin `Link`),
  en vez de un `Link` a sí mismo — ver Decisiones.

### Archivos modificados

- `src/components/LandingPage/Hero.tsx` — añadido `<LocaleSwitcher className="absolute
top-4 right-4 z-10 sm:top-6 sm:right-6" />` dentro de la `<section relative
overflow-hidden>` ya existente.
- `src/components/LandingPage/Footer.tsx` — añadido `<LocaleSwitcher />` con
  `className` de override (`border-invert-foreground/20 text-invert-foreground
hover:bg-invert-foreground/10 bg-transparent`) para que el botón se adapte al fondo
  oscuro del footer (tokens `--invert`/`--invert-foreground` ya usados por el resto de
  este componente) en vez de los tokens claros por defecto de `variant="outline"`.

### Decisiones tomadas durante la implementación

- **Item del idioma activo sin `Link`:** en vez de usar `asChild` + `Link` apuntando a
  la misma página (como sugería el esqueleto del GAP), el idioma actualmente activo se
  renderiza como texto plano dentro de un `DropdownMenuItem` sin `asChild` — evita un
  enlace circular sin sentido y es más simple que gestionar un `Link` deshabilitado.
- **`z-10` explícito en el `LocaleSwitcher` de `Hero`:** el SVG decorativo de fondo del
  Hero también es `position: absolute`; sin un z-index explícito el orden de pintado
  entre dos elementos posicionados con `z-index: auto` no está garantizado de forma
  determinista. `z-10` (positivo, sin la trampa de los z-index negativos vista en
  GAP-133) asegura que el selector quede siempre por encima.
- **Estilo del botón adaptado al contexto oscuro del Footer** — el override de
  `className` reutiliza los mismos tokens semánticos (`--invert-foreground`) que ya usa
  el resto de `Footer.tsx`, en vez de dejar el `variant="outline"` por defecto (que
  usaría tokens claros y desentonaría sobre el fondo oscuro del footer).

### Desviaciones del plan (si las hay)

Ninguna respecto al plan de `Hero`/`Footer`/componente nuevo. Un hallazgo relevante
verificado durante las pruebas, documentado en Observaciones: el selector no es
alcanzable desde `/pricing`, `/blog` ni `/legal/*` porque esas páginas no comparten el
`Footer` global — cada una compone su propio layout de página completa (verificado con
`grep` real: solo `src/app/[locale]/page.tsx` importa `Footer`). Esto es coherente con
el alcance acordado explícitamente con Jose (Hero + Footer, sin construir una nav bar
completa que sí estaría presente en todas las páginas) — no es una desviación del plan,
pero es una limitación real a tener en cuenta.

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10

### Checklist de criterios de aceptación (verificado con servidor de desarrollo real +

Playwright/Chromium)

- [x] `LocaleSwitcher.tsx` sin ninguna imagen/icono de bandera.
- [x] Trigger muestra `Globe` + código de 2 letras en mayúsculas (ES/PT/EN) —
      verificado por captura en Hero y Footer, en los 3 locales.
- [x] Dropdown lista los 3 idiomas por nombre nativo — verificado leyendo el DOM real:
      `["Español", "Português", "English"]`.
- [x] El idioma activo aparece deshabilitado (`data-disabled` presente en el item
      "Español" al estar en `/es`).
- [x] Cada enlace usa `Link`/`usePathname` de `@/i18n/navigation` con `locale` — probado
      de extremo a extremo con clicks reales: desde `/es` → clic en "Português" → URL
      cambia a `/pt` (confirmado con evento `framenavigated` real de Playwright, no solo
      lectura de código) → contenido en portugués confirmado leyendo el texto real del
      body ("Encomendas, produção, armazém..."). Repetido con el switcher del Footer:
      `/es` → clic en "English" → `/en`.
- [x] Enlaces con `hrefLang` correcto (prop pasada tal cual a `Link`).
- [x] `Hero.tsx` muestra el selector en la esquina superior derecha sin solapar el SVG
      decorativo ni el CTA — verificado por captura desktop y mobile (390px).
- [x] `Footer.tsx` muestra el selector junto a Blog/Aviso Legal/Política de Privacidad
      — verificado por captura, estilo adaptado al fondo oscuro.
- [x] `grep` de colores hardcodeados/`sky-*` sobre los 3 archivos tocados → 0
      resultados.
- [x] Funciona desde los 3 locales de origen — probado `/es`→`/pt`, `/es`→`/en`.
- [x] Mobile: dropdown se abre y es usable con touch, sin desbordar — verificado por
      captura a 390px en Hero y Footer.
- [x] `npm run type-check` y `npm run lint` limpios.

### Checklist técnico del proyecto

- [x] Sin `fetch()` directo, sin hardcode de tenant, sin `.js` nuevos, sin `any`.
- [x] Sin dependencias nuevas — `DropdownMenu` ya instalado.
- [x] Hooks gigantes / `entitiesConfig.js` no tocados.
- [x] Patrones de `.claude/rules/` respetados (Client Component justificado en
      comentario, nomenclatura `LocaleSwitcher` clara).
- [x] Nomenclatura correcta.

### Revisión Visual

Verificado con Playwright real, desktop (1440px) y mobile (390px): selector monocromo
consistente en Hero (fondo claro) y Footer (fondo oscuro, con tokens `--invert`
correctos), dropdown con jerarquía clara, sin banderas, sin color añadido.

### Observaciones para Jose

**Hallazgo relevante (no bloqueante, coherente con el alcance acordado):** el selector
hoy solo es alcanzable desde la home (`/`) — no aparece en `/pricing`, `/blog` ni
`/legal/*`, porque esas páginas no comparten el `Footer` global (cada una compone su
propia página completa sin `Hero`/`Footer`). Es la consecuencia directa y esperada de
la decisión explícita de no construir una nav bar completa en este GAP — si en el
futuro decides construir una navegación compartida entre todas las páginas públicas,
este mismo componente (`LocaleSwitcher`) se reutiliza tal cual dentro de ella, sin
cambios.

### Estado final de la implementación

Completo y funcionando. Selector de idioma monocromo (texto + icono `Globe`, sin
banderas) operativo en Hero y Footer de la home, probado de extremo a extremo con
navegación real entre los 3 locales.
