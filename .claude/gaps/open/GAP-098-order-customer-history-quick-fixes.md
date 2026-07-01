# GAP-098 — OrderCustomerHistory: quick fixes de diseño (además de Loader→Skeleton)

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas / CRM
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos menores en
`src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/CustomerOrderHistoryView/index.jsx`
(282 líneas), adicionales al fix de `Loader`→`Skeleton` ya cubierto por GAP-078:

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

- `src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/CustomerOrderHistoryView/index.jsx`

## Restricciones

- Coordinar con GAP-078 si se implementan en el mismo PR (mismo archivo).

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
