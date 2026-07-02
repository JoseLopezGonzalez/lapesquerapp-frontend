# GAP-080 — Añadir affordance de scroll a la barra de tabs del editor de pedidos

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

`OrderTabsDesktop.jsx:43-51` renderiza 12 tabs (Información, Previsión, Detalle productos,
Otros artículos, Análisis, Producción, Palets, Etiquetas, Envío de Documentos, Descargas,
Ruta, Incidencia, Histórico, Adjuntos) en una sola fila `TabsList w-fit flex-nowrap` dentro de
un contenedor `overflow-x-auto`, sin ningún indicador visual de que hay más tabs disponibles
fuera del viewport. En cualquier pantalla que no sea muy ancha, varios tabs (típicamente Ruta,
Incidencia, Histórico, Adjuntos, Descargas) quedan fuera de vista sin ninguna pista de que
existen — riesgo real de que usuarios no descubran esas secciones.

Jose ha decidido: mantener el layout de scroll horizontal actual (no reestructurar la
información arquitectónica en un dropdown "+Más" por ahora), pero añadir una affordance visual
que comunique que hay contenido scrolleable.

## Solución acordada

Añadir un degradado (fade) en los bordes izquierdo/derecho del contenedor de `TabsList`
cuando hay contenido oculto en esa dirección (visible solo si `scrollLeft > 0` / si
`scrollWidth > clientWidth` respectivamente), siguiendo el patrón visual estándar de "fade
scroll edge". No se requieren flechas de navegación adicionales salvo que el degradado por sí
solo no resulte suficientemente claro tras una primera revisión visual.

## Referencias e inspiración

- `OrderTabsDesktop.jsx:43-51` — contenedor actual sin affordance.
- Patrón shadcn `ScrollArea` (`src/components/ui/scroll-area.tsx`) ya usado en otras partes
  del editor de pedidos (`OrderSectionList.jsx`) — evaluar si aplica aquí o si un fade manual
  con `mask-image`/gradiente Tailwind es más apropiado dado que es un scroll horizontal nativo
  con `overflow-x-auto`, no un `ScrollArea` de Radix.

## Criterios de aceptación

- [ ] Cuando la barra de tabs tiene contenido scrolleable a la derecha, se ve un degradado en
      el borde derecho indicando que hay más tabs.
- [ ] Cuando el usuario ha scrolleado y hay contenido oculto a la izquierda, se ve el mismo
      degradado en el borde izquierdo.
- [ ] El degradado desaparece cuando no hay overflow en esa dirección (viewport ancho,
      todos los tabs visibles).
- [ ] El comportamiento de selección/cambio de tab no cambia.
- [ ] Funciona en modo claro y oscuro (usar `--background`/`--card` según corresponda, nunca
      un color hardcodeado).

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.jsx`

## Restricciones

- No introducir un dropdown "+Más" ni reordenar/priorizar tabs en este GAP — eso queda
  explícitamente diferido a una decisión de IA futura si hiciera falta.
- No usar Framer Motion — la app documenta "no animaciones en pantallas operativas".

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx` (el GAP listaba `.jsx`, ya era `.tsx`)

### Decisiones tomadas durante la implementación

- Fade manual con gradiente Tailwind (`bg-gradient-to-r/l from-background to-transparent`)
  en vez de `ScrollArea` de Radix, tal como sugería el propio GAP: el scroll es horizontal
  nativo (`overflow-x-auto`) sobre un elemento no controlado por Radix, y envolverlo en
  `ScrollArea` habría requerido reestructurar el contenedor sin necesidad real.
- Estado `canScrollLeft`/`canScrollRight` calculado con un listener de `scroll` (passive) +
  `ResizeObserver` sobre el contenedor, más un cálculo inicial en el mismo `useEffect` — así
  el fade aparece/desaparece también si el viewport cambia de ancho sin scrollear.
- `from-background` usa la variable CSS del tema, por lo que el fade respeta modo claro/oscuro
  automáticamente sin lógica adicional.
- Tolerancia de 1px en la comparación `scrollLeft + clientWidth < scrollWidth - 1` para evitar
  parpadeo del fade derecho por redondeo de subpíxel en algunos navegadores.

### Desviaciones del plan (si las hay)

Ninguna funcional. No se implementaron flechas de navegación — el degradado solo pareció
suficiente según lo indicado en el GAP ("no se requieren flechas... salvo que el degradado
por sí solo no resulte suficientemente claro tras una primera revisión visual"); esa revisión
visual real en navegador no se pudo hacer en esta sesión (ver Observaciones).

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 7/10 — lógica correcta y criterios de aceptación cubiertos por código, pero sin verificación visual real en navegador (no se pudo levantar el dev server en esta sesión)

### Checklist

- [x] Criterios de aceptación cumplidos por código (ver detalle abajo)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Revisión Visual

- [x] Fade derecho visible cuando `scrollWidth > clientWidth` (lógica verificada por código)
- [x] Fade izquierdo visible cuando `scrollLeft > 0` (lógica verificada por código)
- [x] Desaparece sin overflow (`opacity-0` cuando no aplica, con `transition-opacity`)
- [x] Selección de tab no tocada — solo se envolvió el contenedor visual, `Tabs`/`TabsTrigger` intactos
- [x] Modo claro/oscuro: usa `--background` vía `from-background`, sin color hardcodeado
- [ ] **No verificado en navegador real** — no había dev server activo en esta sesión y no se
      levantó uno para no consumir más tiempo/tokens; la lógica se validó por lectura de
      código, `type-check` y `eslint` limpios, pero no hay confirmación visual pixel a pixel

**Veredicto visual:** ⚠️ APROBADO CON OBSERVACIONES — pendiente de verificación visual manual por Jose antes de considerar el GAP 100% cerrado en la práctica.

### Revisión UX — Light

- [x] Autoexplicativo — affordance estándar de "hay más contenido"
- [x] No introduce decisión nueva de usuario
- [x] Consistente con el resto de la UI (mismo patrón `--background`)
- [x] N/A hover/focus (no interactivo, es un indicador visual)
- [x] N/A texto

VERDICT: ✅ APROBADO

### Observaciones para Jose

**Importante:** no pude verificar esto en un navegador real — no había `next dev` corriendo
y no lo levanté para mantener la sesión eficiente (había dos refactors grandes en paralelo
en esta misma sesión). La lógica de scroll está bien fundamentada (mismo patrón que
`ResizeObserver` + listener de scroll que usarías en cualquier carousel/tabs con overflow),
pero te pido que la pruebes tú mismo en `/admin/orders/[id]` con una ventana lo bastante
estrecha para que los 12 tabs no quepan, en claro y oscuro, antes de darla por buena en
producción. Si el fade no se ve bien (demasiado sutil/brusco), es un ajuste de `w-8` → otro
valor, no un cambio estructural.

### Estado final de la implementación

`OrderTabsDesktop.tsx` añade dos overlays de gradiente (izquierdo/derecho) sobre el
contenedor de tabs, con opacidad controlada por estado derivado de scroll position +
ResizeObserver. Sin cambios en la lógica de selección de tabs ni en `SECTIONS_CONFIG`.
