# GAP-070 — Documentar la convención de capitalización (Title Case en tablas, sentence case en el resto)

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-design copy` (prueba real sobre el módulo SupplierLiquidations,
2026-07-01). El módulo mezcla dos convenciones de capitalización para textos de
naturaleza similar (etiquetas de sección/navegación) sin que `design-context.md`
documente cuál es la correcta:

- `SupplierLiquidationsPage.tsx:28` → pestaña "Nueva liquidación" (sentence case)
- `SupplierLiquidationList.tsx:194-203` → cabeceras de tabla "Peso Recepciones",
  "Salidas de Cebo", "Importe Salidas" (Title Case)

Jose confirmó el estándar real ya dominante en el resto del código: **Title Case
para cabeceras de tabla** (dato tabular) y **sentence case para todo lo demás**
(pestañas, botones, labels de formulario, títulos de sección). No hace falta tocar
ningún archivo — el código de este módulo ya cumple ese estándar en ambos sitios
citados; lo que falta es dejarlo escrito para que futuras auditorías de copy no
lo vuelvan a marcar como inconsistencia y para que nuevo código lo siga desde el
principio.

## Solución acordada

Añadir una entrada breve en `.claude/design-context.md` (sección de Tipografía o
una nueva subsección "Capitalización") con la regla:

```markdown
**Capitalización:**
- Cabeceras de tabla (`TableHead`): Title Case — "Peso Recepciones", "Importe Salidas"
- Todo lo demás (pestañas, botones, labels de formulario, títulos de sección,
  menús): sentence case — "Nueva liquidación", "Rango de fechas", "Descargar PDF"
```

## Referencias e inspiración

- `src/components/Admin/SupplierLiquidations/SupplierLiquidationList.tsx` (ambos
  patrones conviven correctamente en el mismo archivo)
- `.claude/design-context.md` § 2 Typography (ubicación sugerida para la nueva regla)

## Criterios de aceptación

- [ ] `design-context.md` documenta la regla de capitalización con al menos un
      ejemplo real de cada caso (tabla vs. resto)
- [ ] No se modifica ningún archivo de `src/` — este GAP es solo documentación

## Archivos a crear o modificar

- `.claude/design-context.md` (modificar — añadir subsección de Capitalización)

## Restricciones

- No tocar código de producción
- No ampliar el alcance a otros módulos — esto es solo fijar la regla, no auditar
  el resto de la app contra ella (eso es trabajo de una futura pasada de
  `/audit-design copy`)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `.claude/design-context.md` — añadida subsección "Capitalización" al final de § 2 Typography

### Decisiones tomadas durante la implementación

- Se colocó justo antes del `---` de cierre de la sección, junto a las otras reglas
  puntuales (Leading, Tabular nums, Truncation) en vez de crear una subsección `###`
  separada — mismo nivel de brevedad que las reglas vecinas.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — cambio de documentación puro, exactamente el texto acordado

### Checklist

- [x] Criterios de aceptación cumplidos (regla documentada con ambos ejemplos; ningún archivo de `src/` tocado)
- [x] Patrones de .claude/rules/ respetados (N/A — solo doc)

### Observaciones para Jose

Ninguna. Cambio de documentación exacto a lo acordado, sin tocar código.

### Estado final de la implementación

`design-context.md` § 2 Typography documenta ahora la regla de capitalización con los
mismos dos ejemplos reales citados en el GAP.
