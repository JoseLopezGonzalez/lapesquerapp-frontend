# GAP-099 — Sustituir `alert()` por `notify.error` en OrderLabels

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-design copy order editor`. `OrderLabels/index.tsx` usa `alert()` nativo del navegador para dos validaciones de selección, violando la regla documentada en `design-context.md` § "What NOT To Do — Componentes": *"Never use `alert()` or `console.error` to surface errors to the user"*. Es el único punto de todo el editor de pedidos que rompe el patrón de notificación via `notify.error` (Sonner), que se usa correctamente en más de 30 sitios del mismo módulo (`useOrderPallets.js`, `OrderDocuments`, `OrderIncident`, etc.).

`alert()` bloquea el hilo de renderizado, no respeta el tema visual de la app y es inconsistente con el resto de mensajes de validación del editor.

## Solución acordada

Sustituir las dos llamadas a `alert()` en `OrderLabels/index.tsx` por `notify.error({ title: ... })`, siguiendo el mismo patrón usado en el resto del archivo/módulo (ver `useOrderPallets.js:223` como referencia: `notify.error({ title: 'Selecciona al menos un palet' })`).

## Referencias e inspiración

- `design-context.md` § "What NOT To Do" — regla explícita contra `alert()`.
- `useOrderPallets.js:223,528` — patrón correcto de `notify.error({ title: '...' })` para validaciones de selección.
- `.claude/lib/notifications.ts` — wrapper `notify` sobre Sonner.

## Criterios de aceptación

- [ ] `OrderLabels/index.tsx:184` — `alert('Por favor, selecciona al menos una línea agrupada para imprimir.')` reemplazado por `notify.error({ title: 'Selecciona al menos una línea agrupada para imprimir' })`.
- [ ] `OrderLabels/index.tsx:215` — `alert('Por favor, selecciona al menos una línea individual para imprimir.')` reemplazado por `notify.error({ title: 'Selecciona al menos una línea individual para imprimir' })`.
- [ ] No queda ningún `alert(` en `OrderLabels/index.tsx` (verificar con grep).
- [ ] El `import` de `notify` desde `@/lib/notifications` está presente en el archivo (añadirlo si falta).
- [ ] El mensaje usa tuteo ("Selecciona") consistente con el resto del módulo, sin el prefijo "Por favor" (ver GAP-101 sobre registro — este archivo ya usa tuteo en otros mensajes de OrderPallets, mantener coherencia).

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx` (modificar únicamente las líneas 184 y 215, y el import si falta)

## Restricciones

- No tocar ninguna otra lógica de `handlePrintGroupedLabels` / `handlePrintIndividualLabels` más allá de la sustitución del mensaje.
- No añadir `notify.success` ni cambiar el flujo de impresión existente.
- No modificar otros archivos del módulo en este GAP.

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`
- `.claude/gaps/in-progress/GAP-099-fix-alert-in-order-labels.md`

### Decisiones tomadas durante la implementación

- El archivo real del árbol actual es `index.tsx`, no `index.js`.
- `notify` y `notify.error` ya estaban presentes por cambios previos en el árbol; solo se ajustaron los dos mensajes para cumplir el copy acordado.

### Desviaciones del plan (si las hay)

- El GAP apuntaba a `index.js`; se aplicó en `index.tsx`, que es la ruta real actual.
- El archivo ya tenía cambios no relacionados en el worktree. Se conservaron intactos y solo se modificaron los dos literales de validación de este GAP.

### Checks ejecutados

- `rg -n "alert\\(|Por favor, selecciona al menos una línea|Selecciona al menos una línea|import \\{ notify \\}" src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx` — sin `alert(` ni copy antiguo; import y mensajes acordados presentes.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx` — correcto.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx .claude/gaps/in-progress/GAP-099-fix-alert-in-order-labels.md` — correcto.

---

## Auditoría

> Auditoría ligera ejecutada por Codex el 2026-07-02.

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos según revisión documental y comprobaciones puntuales
- [x] Sin fetch() directo nuevo detectado en el alcance del GAP
- [x] Sin hardcode de tenant detectado
- [x] Sin archivos .js nuevos creados por el GAP
- [x] Sin any sin justificación detectado en la revisión ligera
- [x] Hooks gigantes no tocados fuera del alcance aprobado
- [x] entitiesConfig.js no tocado fuera del alcance aprobado
- [x] Patrones del workflow de GAP respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

- `npm run type-check` pasa limpio en el estado actual del repositorio.
- Auditoría intencionadamente ligera: se revisaron criterios, implementación documentada y búsquedas puntuales de regresión; no se ejecutó smoke test visual/manual completo con backend real.
- Las observaciones o warnings preexistentes documentados en la implementación quedan fuera de alcance y no bloquean el cierre.

### Estado final de la implementación

GAP aprobado con observaciones y listo para cierre.
