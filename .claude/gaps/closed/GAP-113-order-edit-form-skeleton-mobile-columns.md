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

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.tsx` — `OrderEditFormSkeleton` ahora recibe `isMobile` como prop (pasada desde el punto de uso `<OrderEditFormSkeleton isMobile={isMobile} />`, reutilizando la misma variable `isMobile` de `useIsMobile()` ya presente en `OrderEditSheet`). La clase de grid de cada grupo pasa de `group.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'` a `isMobile ? 'grid-cols-1' : group.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'`.

### Decisiones tomadas durante la implementación

- Nota de contexto: el formulario real ya no usa una única rama con `isMobile ? 'grid-cols-1 gap-4' : group.grid || ...` en un único bloque (como decía el GAP, línea 326 de una versión anterior); hoy `OrderEditSheet` tiene 3 ramas explícitas (`loading` → skeleton, `isMobile` → formulario mobile, resto → formulario desktop), y la rama mobile (línea 357 actual) sigue forzando `grid-cols-1` siempre por estar dentro de un bloque donde `isMobile` es constante `true`. El comportamiento que debía igualar el skeleton (mobile = siempre 1 columna) no cambió, solo su implementación en el archivo real.
- No se tocó el array de grupos (`cols`/`rows`) ni el formulario real, solo la traducción de `cols` a clases dentro del skeleton.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10

### Checklist

Criterios de aceptación del GAP:

- [x] En mobile, todos los grupos del `OrderEditFormSkeleton` se renderizan en `grid-cols-1`, sin importar su `cols` configurado — CUMPLIDO. `index.tsx:490`: `isMobile ? 'grid-cols-1' : group.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'`. El `isMobile` se evalúa primero en la ternaria, forzando 1 columna para los 7 grupos (incluidos los `cols:2` en índices 1-4) sin excepción.
- [x] En desktop, el comportamiento actual (`cols === 2 ? grid-cols-2 : grid-cols-1`) no cambia — CUMPLIDO. Cuando `isMobile` es `false`, la expresión colapsa exactamente a la lógica original `group.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'`, byte a byte.
- [x] `OrderEditFormSkeleton` usa la misma fuente de verdad de `isMobile` que el resto del archivo (no un hook o prop nuevo duplicado) — CUMPLIDO. `isMobile` se recibe como prop (`{ isMobile = false }: { isMobile?: boolean }`) y se pasa desde el punto de uso (`index.tsx:347`, `<OrderEditFormSkeleton isMobile={isMobile} />`), reutilizando la variable `isMobile` de la única llamada a `useIsMobile()` del archivo (línea 80). Verificado con `grep -n "useIsMobile(" index.tsx` → una sola ocurrencia.

Checklist técnico del proyecto:

- [x] Sin fetch() directo — no aplica, no hay HTTP en el diff
- [x] Sin hardcode de tenant — no aplica
- [x] Sin archivos .js nuevos — el archivo ya era `.tsx`, no se crea nada nuevo
- [x] Sin any sin justificación — prop tipada explícitamente `{ isMobile?: boolean }`
- [x] Hooks gigantes no tocados sin permiso — no aplica, no se tocó ningún hook
- [x] entitiesConfig.js no tocado sin permiso — no aplica
- [x] Patrones de .claude/rules/ respetados — prop opcional con default (`isMobile = false`), consistente con `components.md` § Props required vs optional
- [x] Nomenclatura correcta — sin cambios de nomenclatura, `OrderEditFormSkeleton` se mantiene PascalCase

### Verificación de la afirmación sobre el formulario real (nota de contexto del implementador)

Confirmado leyendo `index.tsx` completo: el formulario real ya **no** tiene la única rama con
ternario `isMobile ? 'grid-cols-1 gap-4' : group.grid || ...` como describía el GAP original
(línea 326 de una versión anterior). Hoy el `<form>` (líneas 340-419) tiene 3 ramas explícitas
mutuamente excluyentes:

1. `loading` (345-348) → `OrderEditFormSkeleton`
2. `isMobile` (349-385) → bloque mobile propio, con `FieldGroup` en línea 357 que sigue forzando `grid-cols-1` (la condición `isMobile ?` es redundante ahí porque el bloque entero ya está gateado por `isMobile`, pero no es incorrecta)
3. desktop (386-418) → bloque separado con `group.grid || 'grid-cols-1 gap-4'`, sin gating de `isMobile`

El comportamiento final (mobile = siempre 1 columna) es idéntico al que describía el GAP; solo
cambió la implementación interna del archivo real (de ternario único a 3 ramas). La nota del
implementador en la sección "Decisiones tomadas" es precisa.

### Restricciones respetadas

- [x] No se modificó el array de grupos (`cols`/`rows`) — confirmado, el array de 7 objetos en líneas 479-485 es idéntico al original
- [x] No se tocó el formulario real (líneas 340-419) — confirmado por el diff (`git diff`), las únicas líneas modificadas son 347 (paso de prop) y la firma + JSX interno de `OrderEditFormSkeleton` (475, 490)
- [x] No se introdujo un hook nuevo de detección mobile — confirmado, `grep -n "useIsMobile("` devuelve una sola ocurrencia (línea 80); `OrderEditFormSkeleton` recibe `isMobile` por prop

### Verificación técnica ejecutada

- `npm run type-check` → limpio, 0 errores
- `npm run lint` → 0 errores, 271 warnings preexistentes en el repo (ninguno en `OrderEditSheet/index.tsx`; confirmado con grep sobre el output)
- `git diff` del archivo → 8 líneas (5 inserciones, 3 borrados), diff mínimo y quirúrgico: exactamente el cambio descrito en el GAP, sin efectos colaterales

### Revisión Visual (Light — cambio de layout de Skeleton)

- [x] Sin colores hardcodeados ni inline styles — el diff no toca clases de color
- [x] Loading state: sigue siendo `Skeleton`, patrón sin cambios
- [x] Layout: el skeleton mobile ahora es fiel al formulario real (1 columna en todos los grupos), corrigiendo exactamente la discrepancia visual que motivó el GAP

Veredicto visual: ✅ APROBADO

### Revisión UX — Light

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-113 — Skeleton edición de pedido no colapsa a 1 columna en mobile
Mode: Light (fix de fidelidad visual de un Skeleton, sin cambio de flujo)

[x] El cambio es autoexplicativo para el usuario — no requiere instrucción (loading state pasivo)
[x] No introduce una decisión nueva del usuario sin affordance adecuado — no aplica, no hay interacción nueva
[x] Consistente con la UI circundante — el skeleton ahora predice correctamente el layout de 1 columna que el usuario verá a continuación en mobile
[x] Si es interactivo: no aplica, el Skeleton no es interactivo
[x] Si cambió texto: no aplica, no hay cambios de texto

VERDICT: ✅ APROBADO
```

### System Learner check

No se invoca al `system-learner`. El hallazgo (skeleton no fiel a la regla de colapso mobile
del formulario real) ya está cubierto por el patrón documentado en PL-022 (`isMobile` no
propagado a ramas condicionales del mismo archivo) y por el propio proceso de
`/audit-skeletons`, que ya lo detectó como HEURISTIC finding. No hay patrón nuevo no cubierto
por reglas existentes.

### Observaciones para Jose

Implementación quirúrgica y correcta: 8 líneas de diff, exactamente el cambio necesario. El
implementador verificó y documentó honestamente que la premisa del GAP sobre "una sola rama
con ternario" en el formulario real ya no era exacta (el archivo evolucionó a 3 ramas
explícitas desde que se escribió el GAP), sin que eso afectara el fix — el comportamiento
final sigue siendo el correcto. Ningún hallazgo nuevo que amerite entrada en
`project-learnings.md`. Sin observaciones bloqueantes ni menores.

### Estado final de la implementación

`OrderEditFormSkeleton` recibe `isMobile` como prop opcional (`= false` por defecto, seguro
para cualquier otro punto de uso futuro que no la pase). El único call site (`index.tsx:347`)
la pasa desde la variable `isMobile` ya calculada por `useIsMobile()` en el componente padre.
La clase de grid de cada grupo del skeleton ahora evalúa `isMobile` primero, colapsando a
`grid-cols-1` siempre en mobile y preservando exactamente la lógica `cols === 2 ? 'grid-cols-2'
: 'grid-cols-1'` en desktop. `type-check` y `lint` limpios para el archivo.
