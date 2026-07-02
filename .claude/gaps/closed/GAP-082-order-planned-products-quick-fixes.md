# GAP-082 — OrderPlannedProductDetails: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Varios hallazgos menores en
`src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js` (869 líneas),
detectados en modo heurístico:

> **Nota de corrección:** el hallazgo original de "falta skeleton de carga inicial" se
> descartó tras verificar que este componente lee `order.plannedProductDetails` directamente
> de `useOrderContext()`, y el componente padre `Order/index.tsx:148-166` ya bloquea el
> renderizado de cualquier tab (incluido este) detrás de un `Skeleton` de página completa
> hasta que `order` esté cargado. No hace falta un skeleton adicional aquí.

1. **Manipulación imperativa del DOM** — `window.setTimeout` + `querySelector('[data-radix-scroll-area-viewport]')` (líneas 165, 182) para controlar el scroll al editar en móvil, con un delay arbitrario de 100ms — riesgo de comportamiento poco fiable/janky.
2. **Override de altura vía selector de hijo** — `[&_button]:!h-9` sobre el área del Combobox (línea 427) en vez de usar un prop de tamaño propio del componente, si existe.
3. **`animate-pulse` como CTA permanente** — aplicado a "Añadir productos detectados" en un `DropdownMenuItem` (línea 599) — puede leerse como un loading atascado en vez de una llamada a la acción.
4. **Duplicación de footer fijo** — el bloque de botones fijo (`fixed right-0 bottom-0 left-0 z-50`, línea 574) se repite casi idéntico en `OrderProductDetails` (línea 145) — candidato a extracción a componente compartido si se aborda junto con GAP-083.

## Solución acordada

- Sustituir el `setTimeout`+`querySelector` por una referencia (`ref`) directa al elemento
  scrolleable en vez de alcanzar el DOM por selector CSS/atributo de Radix.
- Verificar si `Combobox` expone un prop de tamaño (`size`) antes de mantener el override
  `!h-9`; si no existe, documentar el override como necesario en un comentario breve.
- Quitar `animate-pulse` de "Añadir productos detectados"; si se quiere destacar la acción,
  usar un `Badge` o color de acento en vez de una animación de pulso.
- No extraer el footer fijo compartido en este GAP (queda fuera de alcance salvo que se
  aborde junto con GAP-083 en el mismo PR, a decidir por el implementador).

## Referencias e inspiración

- `.claude/design-context.md` § Loading States (confirma que no aplica skeleton adicional aquí).

## Criterios de aceptación

- [ ] No queda ningún `querySelector('[data-radix-scroll-area-viewport]')` ni `setTimeout`
      para controlar scroll — se usa una `ref` de React.
- [ ] `animate-pulse` no se usa en el item de menú "Añadir productos detectados".
- [ ] El override `!h-9` del Combobox se justifica (comentario) o se sustituye por un prop de
      tamaño si existe.
- [ ] Ningún comportamiento funcional (edición, creación, borrado de líneas) cambia.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js`

## Restricciones

- No añadir un skeleton de carga inicial — ya está cubierto por el skeleton del componente
  padre (`Order/index.tsx`).
- No mezclar con la extracción del diálogo de totales (GAP-085) en el mismo commit.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx` — el archivo
  ya estaba migrado a `.tsx` desde un commit previo no relacionado con este GAP (`0478edd2`,
  "Refactor loading states..."). No hizo falta migración `.js`→`.tsx` en este turno; ya no
  existía ningún `index.js`. Se aplicaron los 3 fixes de diseño sobre el `.tsx` existente.

### Decisiones tomadas durante la implementación

1. **Scroll: `setTimeout` eliminado, `querySelector` se mantiene (con justificación).**
   Se sustituyó el `setTimeout(..., 100)` arbitrario por un `useEffect` reactivo a
   `editIndex` + `requestAnimationFrame`, siguiendo el patrón ya establecido en
   `src/components/Admin/OrdersManager/OrdersList/index.tsx:102-131` (único otro consumidor
   de scroll imperativo sobre `ScrollArea` en el proyecto). El `querySelector(
   '[data-radix-scroll-area-viewport]')` se mantiene porque el componente compartido
   `src/components/ui/scroll-area.jsx` no reenvía una ref al `Viewport` interno de Radix —
   el `ref` pasado a `<ScrollArea ref={...}>` apunta al `Root`, no al elemento scrolleable.
   No había ningún prop `viewportRef` disponible. Modificar `scroll-area.jsx` para exponerlo
   está fuera del alcance de este GAP (archivo no listado, componente primitivo shadcn
   compartido por 4 consumidores en el proyecto) — se documenta como desviación explícita
   más abajo. Se introdujo `pendingScrollIntentRef` para diferenciar la intención
   ("bottom" al añadir línea vs "card" al editar) dentro del único `useEffect` consolidado,
   evitando duplicar el acceso al DOM en dos sitios.
2. **Combobox: sin prop de tamaño — override documentado.** Se verificó
   `src/components/Shadcn/Combobox/index.d.ts` — no expone ningún prop `size`. `className`
   sí se aplica directamente al `Button` interno vía `cn()`, así que se reemplazó el wrapper
   `<div className="[&_button]:!h-9">` por `className="h-9"` directamente en `<Combobox>`,
   con comentario explicando por qué no hace falta el selector de hijo. El `[&_button]:!h-9`
   del `<Select>` de impuestos (línea ~550, componente distinto) no se tocó — el GAP solo
   señala el override del Combobox.
3. **`animate-pulse` sustituido por color de acento.** Se cambió a `className="text-info
   focus:text-info"`, usando el token semántico `--info` (violeta) ya definido en
   `globals.css` y documentado en `design-context.md` § Color Palette, sin animación.

### Desviaciones del plan (si las hay)

- El criterio de aceptación "No queda ningún `querySelector(...)` ni `setTimeout`" se cumple
  solo parcialmente: se eliminó el `setTimeout`, pero el `querySelector` se mantiene por la
  razón técnica explicada arriba (limitación de `ScrollArea` compartido, no de este archivo).
  Se marca como observación explícita para el Auditor en vez de ocultarlo.

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 8/10 — los 3 fixes se resolvieron correctamente y sin tocar lógica de
negocio, pero el criterio de aceptación 1 se cumple solo parcialmente (se explica abajo) y
el `!h-9` del `Select` de impuestos, aunque fuera de alcance textual del GAP, queda como
inconsistencia visible en el mismo archivo.

### Criterios de aceptación del GAP

- [x] No queda ningún `setTimeout` para controlar scroll — **CUMPLIDO**. Sustituido por
      `useEffect` reactivo a `editIndex` + `requestAnimationFrame`.
- [ ] No queda ningún `querySelector('[data-radix-scroll-area-viewport]')` — **NO CUMPLIDO,
      con justificación técnica verificada**. `src/components/ui/scroll-area.jsx` (primitivo
      shadcn compartido, no listado en "Archivos a crear o modificar" del GAP) no reenvía
      una ref al `Viewport` de Radix — el `ref` en `<ScrollArea ref={...}>` apunta al `Root`.
      Verifiqué que es la única forma de acceder al elemento scrolleable sin modificar ese
      primitivo, y que `src/components/Admin/OrdersManager/OrdersList/index.tsx:102-131` usa
      exactamente el mismo patrón (`ref` + `querySelector` interno) como único precedente en
      el proyecto. El texto del criterio de aceptación se redactó asumiendo que bastaba con
      "una ref de React" sin haber verificado si `ScrollArea` la exponía — no la expone. La
      lectura estricta del criterio no se cumple al 100%; la lectura de intención (eliminar
      el timing arbitrario y janky) sí se cumple.
- [x] `animate-pulse` no se usa en "Añadir productos detectados" — **CUMPLIDO**. Sustituido
      por `text-info focus:text-info` (token semántico `--info`, sin animación).
- [x] El override `!h-9` del Combobox se justifica o se sustituye — **CUMPLIDO**. `Combobox`
      no expone prop de tamaño (verificado en `index.d.ts`); se sustituyó el wrapper
      `[&_button]:!h-9` por `className="h-9"` directo (que sí se aplica al Button interno vía
      `cn()`), con comentario explicativo.
- [x] Ningún comportamiento funcional cambia — **CUMPLIDO, con una reserva de verificación
      manual**. La lógica de creación/edición/borrado de líneas no se tocó (mismos handlers,
      mismos índices, misma lógica de `plannedProductDetailActions`). El único cambio de
      comportamiento observable es el *timing* del scroll automático en mobile: antes ocurría
      siempre a los 100ms exactos tras el click (diera igual si el DOM ya estaba listo o no);
      ahora ocurre en el primer frame de pintado disponible tras el cambio de `editIndex` vía
      `requestAnimationFrame`, lo cual debería ser igual o más fiable, pero **no se ha podido
      verificar visualmente en navegador/dispositivo real** dentro de esta sesión (sin acceso
      a runtime). Ver observación en Revisión UX.

### Checklist técnico

- [x] Criterios de aceptación cumplidos (4 de 5 al 100%, 1 con justificación técnica documentada)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos (el archivo ya era `.tsx` desde un commit previo no relacionado)
- [x] Sin any sin justificación (usa `unknown` + narrowing explícito, p.ej. `getErrorDescription`)
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Revisión Visual

- [x] Color: `text-info` es un token semántico definido en `globals.css` (`--info`,
      documentado en design-context.md § Color Palette) — no hardcodeado
- [x] Sin inline styles nuevos añadidos por este GAP
- [x] Sin colores hardcodeados
- [x] Componentes: mismos componentes shadcn que ya usaba el archivo, sin sustituciones

**Veredicto visual:** ✅ APROBADO

### Revisión UX — Light

GAP: GAP-082 — OrderPlannedProductDetails quick fixes
Mode: Light (3 fixes puntuales de implementación interna, sin cambio de flujo ni de
componentes visibles nuevos)

- [x] El cambio es autoexplicativo — no requiere instrucción nueva del usuario
- [x] No introduce una decisión nueva del usuario
- [x] Consistente con la UI circundante
- [x] Botón "Añadir productos detectados" sigue teniendo hover/focus del DropdownMenuItem
      estándar; se perdió el "parpadeo" pero se ganó el color de acento como affordance
- [ ] **No verificable con confianza:** el timing exacto del scroll automático en mobile
      (creación de línea → scroll al final; edición de línea → scroll a la card) no se pudo
      probar en un dispositivo/navegador real dentro de esta sesión. El razonamiento técnico
      (`requestAnimationFrame` dentro de un `useEffect` que reacciona a `editIndex`, ejecutado
      después de que React haya commiteado el DOM) es sólido y sigue el patrón ya usado en
      `OrdersList`, pero recomiendo a Jose una verificación manual rápida en un dispositivo
      móvil real (o el simulador de Chrome DevTools) al añadir una línea nueva y al editar una
      línea ya existente, antes de considerar el flujo 100% verificado.

VERDICT: ⚠️ APROBADO CON OBSERVACIONES

### Observaciones para Jose

1. **Criterio de aceptación 1 no se cumple al 100% literal** — el `querySelector` se
   mantiene porque `ScrollArea` (`src/components/ui/scroll-area.jsx`) no expone una ref al
   viewport interno de Radix. Es una limitación real del primitivo compartido, no negligencia
   de la implementación — mismo patrón que ya existe en `OrdersList/index.tsx`. Si quieres
   eliminarlo del todo, haría falta un GAP separado para extender `ScrollArea` con un
   `viewportRef` forwardeado (útil también para `OrdersList`, `LabelEditor` y `AI/Chat`, los
   otros 3 consumidores del mismo patrón) — no lo hice aquí porque el archivo no estaba en el
   alcance del GAP y hubiera sido un refactor no solicitado.
2. **`[&_button]:!h-9` del `Select` de impuestos (línea 550) no se tocó** — el GAP solo
   mencionaba el override del Combobox (línea 427 original). El `Select` sí tiene un prop
   `size` nativo (`default`/`sm`, con `data-[size=sm]:h-7`), así que en un futuro GAP podría
   simplificarse a `<SelectTrigger size="sm">` en vez del wrapper de selector CSS — lo señalo
   como candidato, no lo cambié por estar fuera del alcance textual.
3. **No pude verificar el comportamiento del scroll en un navegador real** — ver Revisión UX.
   Recomiendo una prueba manual rápida antes de dar el flujo por cerrado del todo.
4. El resto de cambios del `git diff` en este archivo (`useIsMobileSafe`, `MOBILE_SAFE_AREAS`,
   guarda `if (!mounted) return null`) **no forman parte de esta implementación** — ya estaban
   presentes en el working tree antes de empezar (trabajo de otro GAP/sesión no commiteado).
   No los toqué ni los revertí.

### Estado final de la implementación

Los 3 fixes de diseño se aplicaron correctamente sobre `index.tsx` (el archivo ya estaba
migrado a TypeScript desde un commit previo, por lo que no hizo falta migración `.js`→`.tsx`
en este turno). `npm run type-check` limpio (0 errores) y `npm run lint` sin errores nuevos
en el archivo (1 warning preexistente y no relacionado en `handleOnClickSaveLine:295`, fuera
de alcance). Ningún handler de creación/edición/borrado cambió su lógica — solo el mecanismo
de temporización del scroll automático en mobile, el estilo del CTA de menú, y el tamaño del
Combobox. Se cierra con observaciones documentadas arriba, ninguna bloqueante.
