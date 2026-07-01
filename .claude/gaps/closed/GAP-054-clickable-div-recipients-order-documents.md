# GAP-054 — Reemplazar div clickable por Button en selección de destinatarios de OrderDocuments

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`OrderDocuments/index.tsx` (líneas 569–582) implementa la selección de destinatarios en el flujo "Envío Múltiple" usando elementos `<div onClick={...}>` en lugar de elementos interactivos semánticos (`<Button>` o `<label>`).

Los `<div onClick>` sin `role` ni `tabIndex` explícitos no son accesibles por teclado (no reciben foco con Tab) ni son interpretables por screen readers como elementos interactivos. El proyecto usa `<Button>` para todos los elementos clickables que no son enlaces.

Detectado en auditoría desktop `/audit-desktop orders manager` 2026-07-01.

## Solución acordada

Reemplazar cada `<div onClick={...}>` de la selección de destinatarios por `<Button variant="outline">` con las clases visuales necesarias para mantener la apariencia actual. La lógica de selección (toggle de destinatario activo) permanece igual.

Si el estilo visual actual requiere un contenedor externo que no sea un botón, añadir al menos `role="checkbox"`, `tabIndex={0}` y `onKeyDown` handler al `<div>`.

## Referencias e inspiración

- `design-context.md §4 Action Buttons` — `<Button>` para elementos interactivos
- `components.md §Reglas de UI específicas del proyecto` — nunca `<select>` nativo, por extensión nunca `<div>` clickable sin semántica

## Criterios de aceptación

- [ ] Los elementos de selección de destinatarios en "Envío Múltiple" son `<Button>` o tienen `role`/`tabIndex`/`onKeyDown` correctos
- [ ] La funcionalidad de selección/deselección de destinatarios funciona igual que antes
- [ ] Los elementos son accesibles por teclado (Tab + Enter/Space)
- [ ] No hay regresión visual en el flujo de envío múltiple

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx`

## Restricciones

- No modificar la lógica de negocio de envío de documentos
- No tocar otros flujos de `OrderDocuments` (envío estándar, envío maquilador, etc.)
- Mantener el aspecto visual de los items de selección de destinatarios

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx` — los `<div onClick>` de selección de destinatarios reemplazados por `<Button variant="outline">` con `type="button"`, `h-auto w-full justify-start` para mantener layout, y clases condicionales `border-primary bg-primary/20` para el estado seleccionado.

### Decisiones tomadas durante la implementación

Se usó `variant="outline"` por ser el más cercano al aspecto actual (borde + fondo blanco). El contenido interno (icono + label) permanece idéntico. `h-auto` sobreescribe la altura fija del Button; `w-full` y `justify-start` mantienen el layout de grid.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

> Rellena el Agente Auditor

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
