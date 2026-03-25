# Hallazgos: UI y sistema de diseño

**Documento de soporte a**: `docs/audits/nextjs-frontend-global-audit.md`  
**Fecha**: 2026-02-14

---

## Resumen

El proyecto usa **shadcn/ui** (estilo new-york) sobre **Radix UI** y **Tailwind CSS**, con variables CSS para temas. Hay uso adicional de **NextUI**, **Headless UI** y **Lucide** para iconos. La base es consistente; la coexistencia de varias librerías de componentes no está documentada y puede generar pequeñas incoherencias de estilo o de comportamiento.

---

## Base: shadcn/ui y Tailwind

- **`components.json`**: style "new-york", baseColor "neutral", cssVariables true. Componentes en `src/components/ui/`: button, card, dialog, sheet, select, input, label, tabs, table, accordion, calendar, dropdown-menu, etc.
- **Tailwind**: Config en `tailwind.config.js`; estilos globales en `src/app/globals.css`. Uso de clases utilitarias y de variables de tema (background, foreground, primary, destructive, etc.).
- **Tema claro/oscuro**: next-themes; ThemeProvider en ClientLayout; theme-toggle en UI. Meta theme-color para PWA (light/dark) en layout.

La base es sólida y adecuada para un ERP: accesible (Radix), customizable y con diseño coherente.

---

## Otras librerías UI

- **NextUI** (`@nextui-org/react`): Presente en dependencias; uso concreto no revisado en detalle. Conviene documentar en qué pantallas o componentes se usa para no duplicar patrones con shadcn.
- **Headless UI** (`@headlessui/react`): Usado en algunos componentes. Muy compatible con Tailwind; riesgo bajo de conflicto visual si se mantienen estilos propios.
- **Lucide** (`lucide-react`): Iconos; uso extendido. Coherente.
- **Recharts**: Gráficos (dashboard, recepciones, ventas). Estilo configurable vía props y clases.
- **Framer Motion**: Animaciones; uso puntual.

No hay conflicto grave; la recomendación es **documentar** “cuándo usar shadcn vs NextUI vs Headless” para nuevos desarrollos y para evitar mezclas innecesarias en el mismo flujo.

---

## PWA y responsive

- **PWA**: Manifest, íconos, splash screens por dispositivo (iPhone, iPad), theme-color, meta apple-mobile-web-app-*. Hooks para instalación (use-pwa-install, InstallPrompt). Bien integrado para uso en móvil.
- **Responsive**: Layouts adaptativos (BottomNav en móvil, SideBar en desktop), NavigationSheet, formularios con variantes móvil (CreateOrderFormMobile). Uso de breakpoints y clases responsive de Tailwind.

---

## Consistencia visual

- Botones, cards, inputs y modales siguen el mismo lenguaje visual en la mayoría de la app. Los formularios de entidad (Create/Edit con config) y los filtros genéricos refuerzan la consistencia.
- Algunas pantallas (Market Data Extractor, Label Editor, Producción) tienen más componentes específicos; no se detectaron desviaciones fuertes del sistema, pero conviene revisar que cualquier nuevo componente reutilice los primitivos de `components/ui/`.

---

## Accesibilidad (desde el diseño)

- Radix aporta roles ARIA, teclado y focus en muchos componentes. En la auditoría se detectó uso de `aria-*` y `role` en paginación, combobox, filtros, tablas, calendar, sidebar, alertas.
- No se ha hecho auditoría WCAG completa; recomendación: revisar contraste, focus visible y navegación por teclado en flujos críticos (login, pedidos, almacén).

---

## Recomendaciones

1. **Documentar** en el repo (p. ej. en docs o en Storybook) qué componentes usar por defecto (shadcn/ui) y en qué casos usar NextUI o Headless UI.
2. **Mantener** un único origen de verdad para tokens de diseño (colores, espaciado, tipografía) en Tailwind y variables CSS; evitar estilos inline o clases “sueltas” que dupliquen tokens.
3. **Revisar** que cualquier nuevo componente de negocio componga desde `src/components/ui/` y no introduzca librerías adicionales sin justificación.
4. **Valorar** Storybook (o similar) para documentar y probar visualmente los componentes del sistema de diseño.
