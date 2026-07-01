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

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
