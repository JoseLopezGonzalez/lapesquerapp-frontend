# GAP-087 — OrderProduction: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas / Maquiladores
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderProduction/index.js` (350
líneas), detectados en modo heurístico:

1. **Color de badge de estado** — ver GAP-088 (normalización cruzada de 3 archivos), no
   duplicar aquí.
2. **`CardTitle` en `text-lg font-medium`** (línea 232) — mismo criterio acordado en
   GAP-084/086.
3. **Lógica de badge duplicada** — el bloque condicional de 4 ramas para determinar el color/
   label del badge de estado está repetido verbatim entre la tarjeta móvil (líneas 96-108) y
   la celda de tabla desktop (líneas 313-325) — extraer a una función/constante compartida
   dentro del propio archivo (relevante especialmente porque GAP-088 ya requiere tocar ambas
   copias).
4. **Archivo legacy `.js` con lógica de componente** — no se migra a `.tsx` en este GAP (fuera
   de alcance), solo se deja constancia de que cualquier futura migración deberá arrastrar
   también el fix de badges (GAP-088) y la consolidación de este punto 3.

## Solución acordada

- Extraer la lógica de color/label del badge de estado (las 4 ramas condicionales) a una única
  función u objeto de mapeo dentro del archivo, usado tanto por la tarjeta móvil como por la
  celda desktop. Aplicar esto en el mismo cambio que GAP-088 para evitar tocar el archivo dos
  veces por el mismo motivo.
- Aplicar el criterio de `CardTitle` acordado en GAP-084/086.

## Referencias e inspiración

- GAP-088 — normalización de color de badges (dependencia).

## Criterios de aceptación

- [ ] La lógica de color/label de estado existe en un único lugar del archivo, consumida por
      ambas variantes (móvil y desktop).
- [ ] `CardTitle` usa el mismo tamaño acordado para `OrderAuxiliaryLines`/`OrderCostAnalysis`.
- [ ] Ningún dato de producción ni cálculo de discrepancia cambia.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderProduction/index.js`

## Restricciones

- No migrar el archivo de `.js` a `.tsx` en este GAP — fuera de alcance.
- Coordinar con GAP-088 si se implementan en el mismo PR (mismo archivo).

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
