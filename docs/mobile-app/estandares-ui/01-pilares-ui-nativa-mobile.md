# Pilares de UI nativa para la versión mobile (PWA) – PesquerApp

Este documento define los **estándares de diseño y usabilidad** para que PesquerApp, cuando se use como PWA en smartphone, **se sienta como una app nativa** y no como una web simplemente responsive.

**Contexto del proyecto:** La aplicación está construida **desktop-first con ShadCN UI**. No partimos de un diseño mobile-first; por tanto, estos pilares se aplican como **criterios de adaptación y revisión** para la experiencia mobile: priorizar contenido esencial, patrones nativos y consistencia visual/gestual, manteniendo un único design system (ShadCN/Radix/Tailwind).

---

## 🧠 1. Diseño centrado en la experiencia móvil (mobile-conscious)

**En nuestro contexto:** No podemos aplicar un mobile-first estricto porque la base es desktop con ShadCN. Sí aplicamos un enfoque **“mobile-conscious”**: al adaptar cada pantalla o flujo a mobile, **priorizamos como si la pantalla pequeña fuera la referencia** para esa vista.

- **Contenido y flujos esenciales primero**  
  En mobile mostramos solo lo necesario para la tarea; el resto (filtros avanzados, columnas secundarias) se desplaza a sheets, pantallas de detalle o desktop.
- **Espacio y jerarquía visual intuitiva**  
  La pantalla pequeña exige:
  - **Jerarquía clara** con tipografía legible (ver pilar 7).
  - **Espaciado suficiente** para foco y separación entre bloques.
  - **Componentes touch-friendly** sin saturación visual (botones, listas, cards con aire).

Referencias: [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) (layout y jerarquía), [Material Design](https://m3.material.io/) (estructura y densidad).

---

## 📱 2. Patrones de navegación que se sienten “nativos”

- **Barra inferior de navegación (Bottom Navigation)**  
  Estándar en apps móviles, fácil de alcanzar con el pulgar. En mobile (< 768px) usamos bottom nav; en desktop mantenemos sidebar/topbar.
- **Evitar dependencia de menú hamburguesa**  
  Los accesos clave deben estar visibles (bottom nav o barra superior clara). El drawer solo cuando tenga sentido (menú secundario, filtros).
- **Accesos claves visibles y consistentes**  
  Navegación clara, etiquetas cortas e iconos familiares. Minimizar pasos para acciones comunes.
- **Gestos naturales**  
  Swipe para volver, pull-to-refresh, drag para reordenar: **solo si están bien implementados y son fiables**. Si no, preferir botones explícitos.

---

## 🎯 3. Interactuabilidad y feedback tangible

- **Tamaños y zonas touch**  
  - **Mínimo recomendado:** 44×44 px (iOS HIG, WCAG 2.2 Level AAA).  
  - Material Design recomienda 48×48 dp (~9 mm) con espaciado ≥ 8 dp entre objetivos.  
  - En PesquerApp usamos **≥ 44×44 px** para controles interactivos y espaciado suficiente para evitar toques erróneos.
- **Retroalimentación visual**  
  Cambio de estado en botones (hover/active/disabled), animaciones sutiles y micro-interacciones que refuercen la respuesta del sistema (ver pilar 13).

Referencias: [Apple HIG – Touch targets 44pt](https://developer.apple.com/design/human-interface-guidelines/), [Material – Touch targets](https://m3.material.io/foundations/accessible-design/accessibility-basics), [WCAG 2.2 – 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

---

## 🖼️ 4. Estética nativa y familiaridad visual

- **Inspiración en guías de plataforma**  
  - [iOS Human Interface Guidelines (HIG)](https://developer.apple.com/design/human-interface-guidelines/)  
  - [Android Material Design](https://m3.material.io/)  
  Esto mejora la familiaridad y la confianza sin tener que replicar cada detalle; ShadCN ya nos da una base neutra y adaptable.
- **Evitar elementos que “sienten web”**  
  Cabeceras enormes con navegación web típica o pies de página tradicionales reducen la sensación de app. En mobile: barras compactas, contenido al frente.

---

## ⚡ 5. Rendimiento percibido como instantáneo

- **Carga rápida y transiciones fluidas**  
  Optimizar assets y carga crítica. Preferir **skeleton loading** en lugar de spinners genéricos cuando sea posible.
- **Animaciones suaves**  
  Transiciones de pantalla a 60 fps, sin retrasos perceptibles. Duración típica &lt; 250 ms; solo `transform` y `opacity` cuando sea posible; respetar `prefers-reduced-motion`.

---

## 📐 6. Diseño limpio, minimalista y legible

- **Simplicidad visual**  
  Menos es más: eliminar ruido y destacar lo esencial en cada pantalla.
- **Uso de blancos y espaciado**  
  El espaciado permite que el usuario se oriente rápido (padding horizontal ~16 px en mobile, márgenes entre secciones claros).

---

## 🧭 7. Contenido claro y comprensible

- **Tipografía enfocada en lectura**  
  Tamaños en rango ~16–24 px para texto principal, sans-serif, buen interlineado. En inputs, mínimo 16 px para evitar zoom automático en iOS.
- **Iconografía reconocible**  
  Iconos estándar (Lucide/Radix alineados con convenciones) reducen la curva de aprendizaje.

---

## 📊 8. Estructura de layout adaptativa

- **Adaptación sin romper composición**  
  Los layouts deben **cambiar según tamaño de pantalla** (lista ↔ detalle, tablas → cards), no limitarse a “encoger” la misma UI.
- **Jerarquía de información y modularidad**  
  Componentes reutilizables con **variantes para mobile** (misma lógica, distinta presentación). Regla en el proyecto: **CSS-first**; JS (p. ej. `useIsMobile()`) solo para cambios estructurales (bottom nav, master-detail). Breakpoint de referencia: **768 px (md)**.

---

## 🔗 9. Flujos y tareas cortos

- **Reducir pasos innecesarios**  
  Cada pantalla debe responder a **una sola intención clara**. Formularios cortos y optimizados.
- **Minimizar escritura**  
  Selects con valores por defecto, autocompletado, inputs contextuales (teclado numérico/email según el campo).

---

## 📱 10. Integración profunda con capacidades de PWA (app-like)

- **Apariencia y comportamiento de app**  
  Modo standalone, `theme-color`, `apple-mobile-web-app-*`, iconos y splash screens configurados (manifest, meta tags).
- **Notificaciones push**  
  Si se implementan, bien configuradas para engagement y sin abuso; respetar preferencias del usuario.

---

## 🧠 11. Accesibilidad e inclusión

- **Alineación con WCAG**  
  Contraste suficiente (4,5:1 texto normal, 3:1 texto grande), ARIA cuando corresponda, textos alternativos, navegación por teclado/foco.
- **Gestos y opciones alternativas**  
  Siempre ofrecer alternativa a gestos (p. ej. botón “Atrás” además de swipe) para personas con movilidad reducida o que no usan gestos.

Referencia: [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/), [Understanding Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

---

## 🔄 12. Consistencia global del diseño

- **Patrón unificado**  
  Misma lógica visual y comportamientos en todas las secciones (navegación, formularios, listas, modales/sheets).
- **Lenguaje visual coherente**  
  Color, tipografía e iconos alineados con la marca y con los design tokens del proyecto (incl. `design-tokens-mobile.js`).

---

## 💡 13. Micro-interacciones que añaden contexto

- **Animaciones útiles**  
  No solo estéticas: deben ayudar a entender la interacción (entrada/salida de pantalla, apertura de sheet, feedback de botón).
- **Feedback contextual**  
  Confirmaciones, “undo” cuando sea relevante, y cambios de estado claros (loading, éxito, error). Usar los presets de `motion-presets.js` con criterio.

---

## 🧪 14. Testing y optimización continua

- **Pruebas en dispositivos reales**  
  Los simuladores no bastan; medir rendimiento y sensación táctil en dispositivos reales (iOS y Android).
- **Métricas de UX**  
  Tiempos de interacción, patrones de abandono, errores recurrentes; iterar según datos.

---

## 📏 15. Mental models y expectativas de usuario

Los usuarios de apps esperan:

- **Navegación consistente** (misma barra, mismo “atrás”).
- **Acciones predecibles** (botones donde se esperan, gestos que funcionan igual que en otras apps).
- **Respuestas rápidas** (sin bloqueos ni esperas innecesarias).

Evitar patrones que contradigan lo que ya conocen de apps nativas (p. ej. menú solo hamburguesa para lo principal, modales centrados para flujos largos en mobile).

---

## 🔍 16. Patrones nativos recomendados (lista directa)

| Área | Recomendación |
|------|----------------|
| **Navegación** | Barra inferior (bottom nav); botón “Atrás” explícito; drawer solo cuando aporte valor. |
| **Listas** | Scroll vertical; evitar scroll horizontal en listas de contenido. |
| **Formularios** | Inputs grandes (altura mínima ~48 px); validación en tiempo real cuando sea posible. |
| **Gestos** | Pull-to-refresh solo si es robusto; swipe para acciones contextuales cuando esté bien implementado. |

---

## 🏁 Resumen de los pilares para una PWA con sensación nativa

1. **Mobile-conscious** → Contenido prioritario y jerarquía clara en pantallas pequeñas.  
2. **Gestión de espacio y jerarquía** → Espaciado y tipografía que guíen el foco.  
3. **Touch y feedback inmediato** → ≥ 44×44 px, estados claros y micro-interacciones.  
4. **Patrones de navegación y gestos consistentes** → Bottom nav, atrás explícito, gestos fiables.  
5. **Rendimiento** → Carga y animaciones rápidas, skeletons en lugar de spinners.  
6. **Diseño claro y minimalista** → Menos ruido, más blancos.  
7. **Accesibilidad desde el inicio** → WCAG, contraste, alternativas a gestos.  
8. **Integración con el sistema (PWA)** → Standalone, iconos, splash, theme-color.

---

## 📚 Referencias rápidas

- [Apple – Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design – M3](https://m3.material.io/)
- [WCAG 2.2 – Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [WCAG 2.2 – Understanding Target Size (Minimum) 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- ShadCN UI / Radix UI (componentes base del proyecto)
- Documentos internos: `../plan/01-plan-general-adaptacion-mobile.md`, `../implementacion/01-master-implementacion-mobile-pesquerapp.md`

---

*Documento de estándares para la versión mobile/PWA de PesquerApp. Revisar y actualizar cuando se añadan nuevos patrones o referencias.*
