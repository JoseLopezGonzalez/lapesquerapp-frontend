# GAP-102 — Estandarizar mayúsculas en botones y badges de OrderIncident

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-design copy order editor`. `OrderIncident/index.tsx` mezcla Title Case y sentence case para la misma acción y para conceptos equivalentes:

- Botón móvil `"Crear Incidencia"` (línea 266, Title Case) vs. botón desktop `"Crear incidencia"` (línea 320, sentence case) — mismo `handleCreate`.
- Botón destructivo `"Cancelar Incidencia"` (línea ~281, Title Case).
- Badges `"Incidencia Abierta"` / `"Incidencia Resuelta"` (líneas ~289, ~296, Title Case).

`design-context.md` § Typography no registra Title Case en ningún nivel de la escala, y el resto del editor de pedidos usa sentence case en botones ("Eliminar línea auxiliar", "Añadir línea", "Marcar como resuelta" — este último ya en el mismo archivo, línea ~309).

Jose confirmó fijar sentence case como estándar.

## Solución acordada

Convertir a sentence case las cadenas de `OrderIncident/index.tsx` identificadas, manteniendo el resto del comportamiento y estructura sin cambios.

## Referencias e inspiración

- `OrderIncident/index.js:309` — `"Marcar como resuelta"` ya en sentence case, referencia interna del propio archivo.
- `design-context.md` § Typography — sin nivel Title Case documentado en la escala tipográfica del proyecto.

## Criterios de aceptación

- [ ] `OrderIncident/index.js:266` — `"Crear Incidencia"` → `"Crear incidencia"`.
- [ ] `OrderIncident/index.js:281` (aprox.) — `"Cancelar Incidencia"` → `"Cancelar incidencia"`.
- [ ] `OrderIncident/index.js:289` (aprox.) — `"Incidencia Abierta"` → `"Incidencia abierta"`.
- [ ] `OrderIncident/index.js:296` (aprox.) — `"Incidencia Resuelta"` → `"Incidencia resuelta"`.
- [ ] El botón móvil y el botón desktop para crear incidencia muestran ahora exactamente el mismo texto (`"Crear incidencia"`).
- [ ] No se cambia ningún `variant`, icono, ni lógica de `handleCreate`/`handleDelete`/`handleResolve`.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx` (las líneas indicadas y duplicados móvil/desktop equivalentes)

## Restricciones

- No modificar ningún otro archivo del módulo en este GAP.
- No cambiar el comportamiento de `handleDelete` (el botón sigue llamándose "Cancelar incidencia" pese a ejecutar una eliminación — ese posible desajuste semántico queda fuera de alcance de este GAP, que es solo de capitalización).

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx`
- `.claude/gaps/in-progress/GAP-102-standardize-capitalization-order-incident.md`

### Decisiones tomadas durante la implementación

- Se sustituyeron solo literales visibles para pasar a sentence case.
- Se actualizaron las apariciones duplicadas móvil/desktop equivalentes (`Cancelar incidencia`) para evitar divergencia interna.

### Desviaciones del plan (si las hay)

- La ruta real actual es `index.tsx`, no `index.js`.
- El archivo ya tenía cambios previos en el worktree; se conservaron y solo se tocaron cadenas de texto.

### Checks ejecutados

- `rg -n 'Crear Incidencia|Cancelar Incidencia|Incidencia Abierta|Incidencia Resuelta|Crear incidencia|Cancelar incidencia|Incidencia abierta|Incidencia resuelta' src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx` — sin cadenas antiguas en Title Case; cadenas sentence case presentes.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx` — correcto.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx .claude/gaps/in-progress/GAP-102-standardize-capitalization-order-incident.md` — correcto.

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
