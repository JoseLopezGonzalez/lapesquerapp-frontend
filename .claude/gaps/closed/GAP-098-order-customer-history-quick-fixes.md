# GAP-098 — OrderCustomerHistory: quick fixes de diseño (además de Loader→Skeleton)

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas / CRM
- **Prioridad:** Baja
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos menores en
`src/components/Shared/CustomerOrderHistoryView/index.jsx`
(componente compartido usado por `OrderCustomerHistory`), adicionales al fix de `Loader`→`Skeleton` ya cubierto por GAP-078:

1. **Bloques Card/CardHeader/CardTitle/CardDescription triplicados** para los estados de
   loading, error y "sin datos" (líneas 54-64, 84-90, 117-123) — JSX estructuralmente idéntico
   repetido 3 veces, riesgo de que un cambio de copy solo se aplique en una de las copias.

Los estados de error y "sin pedidos nunca" ya usan correctamente texto inline con icono y
`EmptyState` respectivamente (líneas 71-101, 103-135) — no requieren cambio.

## Solución acordada

Extraer un pequeño componente local (o función que devuelva el JSX) para el shell
`Card/CardHeader/CardTitle/CardDescription` compartido por los 3 estados, parametrizado por
título/descripción/contenido variable.

## Referencias e inspiración

- GAP-078 — fix de `Loader`→`Skeleton` en el mismo archivo (implementar ambos en el mismo PR
  si es conveniente, ya que tocan el mismo componente).

## Criterios de aceptación

- [ ] El shell `Card/CardHeader/CardTitle/CardDescription` para loading/error/sin-datos existe
      en un único lugar del archivo, no triplicado.
- [ ] El copy y comportamiento de cada uno de los 3 estados no cambia.

## Archivos a crear o modificar

- `src/components/Shared/CustomerOrderHistoryView/index.jsx`

## Restricciones

- Coordinar con GAP-078 si se implementan en el mismo PR (mismo archivo).

---

## Implementación

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Shared/CustomerOrderHistoryView/index.jsx`
- `.claude/gaps/in-progress/GAP-098-order-customer-history-quick-fixes.md`

### Decisiones tomadas durante la implementación

- Se extrajo un componente local `HistoryStateCard` para reutilizar el shell desktop `Card/CardHeader/CardTitle/CardDescription` en los estados de carga inicial, error y sin datos.
- Se añadieron constantes locales `HISTORY_TITLE` y `HISTORY_DESCRIPTION` para conservar el copy en un único punto sin cambiar el texto visible.
- Se mantuvo la clase `flex-shrink-0` del header de carga inicial para no alterar la distribución visual previa.

### Desviaciones del plan (si las hay)

- El GAP apuntaba a `src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/CustomerOrderHistoryView/index.jsx`, pero ese archivo no existe en el árbol actual.
- Jose aprobó tocar la ruta real `src/components/Shared/CustomerOrderHistoryView/index.jsx` antes de implementar.

### Checks ejecutados

- `npx eslint src/components/Shared/CustomerOrderHistoryView/index.jsx` — sin errores; mantiene 2 warnings preexistentes `react-hooks/static-components` por `ShowMoreButton` definido dentro del render, fuera del alcance de este GAP.
- `npx prettier --check src/components/Shared/CustomerOrderHistoryView/index.jsx .claude/gaps/in-progress/GAP-098-order-customer-history-quick-fixes.md` — no ejecuta porque `node_modules/prettier-plugin-tailwindcss` no está instalado en el entorno local aunque figura en `package.json`.
- `git diff --check -- src/components/Shared/CustomerOrderHistoryView/index.jsx .claude/gaps/in-progress/GAP-098-order-customer-history-quick-fixes.md` — correcto.

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
