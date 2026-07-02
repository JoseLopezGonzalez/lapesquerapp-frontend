# GAP-113 — Skeleton del formulario de edición de pedido no colapsa a 1 columna en mobile

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía `/audit-skeletons orders manager`, hallazgo skeleton-fidelity-auditor)

---

## Contexto y problema

`OrderEditFormSkeleton` (dentro de `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:446-471`)
renderiza 7 grupos de campos con un array hardcodeado (`{ cols: 1 | 2, rows: N }`), donde cada
grupo decide su número de columnas únicamente por su propio `cols`:

```js
className={`grid gap-4 pt-2 ${group.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
```

El formulario real (mismo archivo, línea 326) fuerza **siempre** 1 columna en mobile,
independientemente del grid que tenga configurado cada grupo:

```js
className={`grid w-full py-4 ${isMobile ? 'grid-cols-1 gap-4' : group.grid || 'grid-cols-1 gap-4'}`}
```

Resultado: en mobile, 4 de los 7 grupos del skeleton (`cols: 2` — filas 2, 3, 4 y 5 del array)
se muestran como grid de 2 columnas, mientras que el formulario real que aparece justo después
siempre es de 1 columna. El skeleton insinúa un layout más denso y con campos más estrechos
del que realmente existe en mobile.

Detectado en `/audit-skeletons orders manager` (HEURISTIC sub-mode — sin captura visual,
comparación de código fuente).

## Solución acordada

Pasar `isMobile` a `OrderEditFormSkeleton` (o leerlo con el mismo hook `useIsMobile` que ya usa
el resto del archivo) y aplicar la misma regla que el formulario real: en mobile, forzar
siempre `grid-cols-1` para todos los grupos, sin importar su `cols` configurado; en desktop,
mantener el comportamiento actual (`group.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'`).

## Referencias e inspiración

- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:326` — regla real de colapso mobile
- PL-022 (`.claude/project-learnings.md`) — patrón recurrente de `isMobile` no propagado a ramas condicionales del mismo archivo

## Skeleton Reference

- **Real component:** `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:274-330` (formulario real, línea 326 con la regla `isMobile ? 'grid-cols-1 gap-4' : group.grid`)
- **Skeleton component:** `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:446-471` (`OrderEditFormSkeleton`)
- **Viewport afectado:** mobile únicamente (desktop ya es fiel)
- **Detalle:** array de 7 grupos `[{cols:1,rows:1},{cols:2,rows:2},{cols:2,rows:6},{cols:2,rows:4},{cols:2,rows:4},{cols:1,rows:2},{cols:1,rows:2}]` — los grupos con `cols:2` (índices 1-4) son los que hoy no colapsan en mobile

## Criterios de aceptación

- [ ] En mobile, todos los grupos del `OrderEditFormSkeleton` se renderizan en `grid-cols-1`, sin importar su `cols` configurado
- [ ] En desktop, el comportamiento actual (`cols === 2 ? grid-cols-2 : grid-cols-1`) no cambia
- [ ] `OrderEditFormSkeleton` usa la misma fuente de verdad de `isMobile` que el resto del archivo (no un hook o prop nuevo duplicado)

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js`

## Restricciones

- No modificar el array de grupos (`cols`/`rows` por grupo) — solo cómo se traduce `cols` a clases según viewport
- No tocar el formulario real (línea 326) — ya es correcto
- No introducir un nuevo hook de detección mobile — reutilizar `useIsMobile` ya importado en el archivo (línea 42)

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

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
