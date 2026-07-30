# GAP-127 — Código arancelario (hsCode) en catálogo de productos

## Metadata

- **Tipo:** Feature
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-30
- **Autor:** Jose

---

## Contexto y problema

El backend añade `hsCode: string | null` a `Product` — código arancelario HTSUS (ej.
`"0307520000"`), usado por el Export Packing List (GAP-129) para mostrar el código arancelario
por producto/calibre. Si un producto no tiene `hsCode`, el PDF simplemente omite esa línea (no
bloquea la generación) — no hay validación de negocio que el frontend deba replicar más allá de
la del propio campo de texto.

El catálogo de productos no tiene componente de formulario a medida — es 100% declarativo vía
`EntityClient` (`src/configs/entities/entitiesConfig.catalog.ts`, bloque `products`, líneas
5-268), con un único array `fields` compartido por alta y edición.

## Solución acordada

Añadir una entrada al array `fields` del bloque `products` (tras `boxGtin`, antes de
`a3erp_code`, o donde encaje mejor visualmente junto a los otros códigos del producto):

```javascript
{
  name: 'hsCode',
  label: 'Código arancelario (HS Code)',
  type: 'text',
  placeholder: 'ej. 0307520000',
  validation: {
    pattern: {
      value: '/^[0-9]{6,10}$/',
      message: 'Debe contener entre 6 y 10 dígitos',
    },
  },
  cols: { sm: 6, md: 6, lg: 3, xl: 3 },
},
```

Sin `required` — el campo es opcional (el PDF ya lo trata como opcional).

Añadir también una columna en `table.headers` del mismo bloque (`{ name: 'hsCode', label: 'HS
Code', type: 'text', path: 'hsCode', hideOnMobile: true }`) para que sea visible/filtrable desde
el listado, siguiendo el mismo criterio que otros códigos de producto (`a3erpCode`,
`facilcomCode`) que ya están en la tabla.

No se añade filtro de búsqueda por `hsCode` salvo que Jose lo pida — no está en el checklist del
backend y no hay indicio de que se necesite buscar productos por este código con frecuencia.

---

## UI Brief

- **Vista de referencia:** el propio bloque `products` en `entitiesConfig.catalog.ts` — mismo
  patrón que `articleGtin`/`boxGtin` (campo de texto con `validation.pattern`).
- **Tipo de layout:** campo más dentro del formulario ya existente (`EntityClient` genérico), sin
  layout nuevo.
- **Componentes clave:** ninguno nuevo.
- **Estados requeridos:** los que `EntityClient` ya resuelve.
- **Mobile:** ya cubierto por `EntityClient`.

Sin preguntas de confirmación — cambio de una línea de config, sin ambigüedad.

---

## Referencias e inspiración

- `src/configs/entities/entitiesConfig.catalog.ts`, bloque `products`, campos `articleGtin`/
  `boxGtin` (patrón de `validation.pattern` para códigos) y `a3erp_code`/`facil_com_code` (patrón
  de código corto opcional con `path` distinto del `name` de UI).

## Criterios de aceptación

- [ ] El formulario de alta/edición de producto muestra el campo "Código arancelario (HS Code)",
      opcional.
- [ ] Guardar un producto sin `hsCode` funciona igual que hoy (no se vuelve requerido por error).
- [ ] Guardar un producto con un `hsCode` de formato inválido (letras, menos de 6 dígitos) muestra
      el error de validación del lado del cliente antes de enviar.
- [ ] La columna `HS Code` aparece en el listado de productos (oculta en mobile, igual que otros
      códigos).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Archivos a crear o modificar

**Modificar:**
- `src/configs/entities/entitiesConfig.catalog.ts`

## Restricciones

- No crear componente de formulario a medida para productos — seguir 100% declarativo vía
  `EntityClient`.
- No añadir filtro de búsqueda por `hsCode` en esta entrega.
- No tocar otros campos del bloque `products`.

---

## Implementación

### Archivos modificados

- `src/configs/entities/entitiesConfig.catalog.ts` — bloque `products`:
  - `table.headers`: nueva columna `hsCode` (`label: 'HS Code'`, `hideOnMobile: true`), insertada
    tras `boxGtin`, antes de `palletGtin`.
  - `fields`: nuevo campo `hsCode` (text, opcional, `validation.pattern` de 6-10 dígitos),
    insertado tras `boxGtin`, antes de `a3erp_code` — exactamente como especificaba el GAP.

### Decisiones tomadas durante la implementación

Ninguna — cambio de config sin ambigüedad, tal como preveía el GAP (sin preguntas de
confirmación).

### Desviaciones del plan

Ninguna.

### Verificación

- `npm run type-check` → limpio (0 errores) en todo el proyecto.
- `npm run lint` → 0 errores, sin warnings nuevos en el archivo tocado.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — cambio de config mínimo, exactamente como lo describía el GAP, sin
desviaciones, sin efectos colaterales en campos vecinos y con `type-check`/`lint` limpios
verificados de forma independiente.

### Checklist

- [x] Criterios de aceptación cumplidos (ver detalle uno a uno abajo)
- [x] Sin fetch() directo — no aplica, cambio 100% de config declarativa
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados (`useLabelEditor.ts`, `useOrder.ts`, `usePallet.ts` intactos)
- [x] `entitiesConfig.js` (el protegido, solo reexport) no tocado — confirmado por separado, ver
      detalle abajo
- [x] Patrones de `.claude/rules/` respetados — no aplica capa de servicio/hook/componente en
      este GAP
- [x] Nomenclatura correcta

### Criterios de aceptación (uno a uno)

- [x] El formulario de alta/edición muestra el campo "Código arancelario (HS Code)", opcional —
      confirmado leyendo el array `fields` completo del bloque `products`
      (`src/configs/entities/entitiesConfig.catalog.ts:246-257`): `label: 'Código arancelario (HS
      Code)'`, `type: 'text'`, sin `validation.required`.
- [x] Guardar un producto sin `hsCode` funciona igual que hoy — confirmado: no hay `required` en
      `validation`, y el bloque `validation` solo contiene `pattern`. `EntityClient` no exige el
      campo si no hay `required` declarado (mismo comportamiento que `articleGtin`/`boxGtin`, que
      tampoco lo tienen salvo el propio `pattern`).
- [x] Un `hsCode` con formato inválido (letras, <6 dígitos) muestra error de validación cliente —
      `validation.pattern.value: '/^[0-9]{6,10}$/'` con `message: 'Debe contener entre 6 y 10
      dígitos'`, mismo shape exacto que `articleGtin` (`'/^[0-9]{8,14}$/'`) y `boxGtin`
      (`'/^[0-9]{8,14}$/'`) — mismo string-regex, mismo objeto `{ value, message }`.
- [x] La columna `HS Code` aparece en el listado, oculta en mobile — confirmado en
      `table.headers` (línea 154): `{ name: 'hsCode', label: 'HS Code', type: 'text', path:
      'hsCode', hideOnMobile: true }`, mismo formato one-liner que su vecino inmediato `boxGtin`
      (línea 153) y que `palletGtin`.
- [x] `npm run type-check` y `npm run lint` limpios — verificado de forma independiente, no solo
      confiando en lo declarado por el Implementador (ver detalle abajo).

### Verificación independiente

- `npm run type-check` → `tsc --noEmit`, salida vacía, 0 errores.
- `npm run lint` → `✖ 267 problems (0 errors, 267 warnings)`. Grepeado el log completo por
  `entitiesConfig.catalog` — cero coincidencias, confirmando que el archivo tocado no introduce
  ningún warning nuevo (los 267 warnings existentes son de otros archivos no relacionados:
  `useStorePositions.ts`, `useSupplierOptions.js`, `useTaxOptions.js`, etc.).
- `git diff src/configs/entities/entitiesConfig.catalog.ts` revisado completo (no solo el
  resumen): exactamente 2 inserciones limpias, ninguna línea preexistente tocada, comas y llaves
  bien formadas en ambos puntos de inserción. Confirma el punto 5 de la auditoría solicitada
  (archivo `Record<string, any>`, por lo que TypeScript no habría detectado un objeto mal
  formado dentro del array — se verificó manualmente).
- Patrón comparado campo a campo: la entrada `hsCode` en `fields` (texto, placeholder, `validation.pattern`
  con mismo shape `{ value: string, message: string }`, `cols: { sm, md, lg, xl }`) replica
  exactamente el patrón de `articleGtin`/`boxGtin`. La entrada en `table.headers` replica el
  patrón one-liner de `boxGtin`/`palletGtin` (`name`, `label`, `type: 'text'`, `path`,
  `hideOnMobile: true`).
- Campo opcional confirmado explícitamente: no hay `validation.required` en ningún punto del
  bloque `hsCode` — solo `pattern`, igual que sus vecinos GTIN, por lo que un producto existente
  sin `hsCode` no bloquea alta ni edición.
- `src/configs/entitiesConfig.js` (el archivo protegido real) inspeccionado por separado:
  contiene únicamente `export { configs } from './entities/index';` — no fue tocado. Es un
  archivo distinto de `src/configs/entities/entitiesConfig.catalog.ts` (el que sí se modificó),
  confirmando que no se violó la protección de `.claude/CLAUDE.md`.

### Revisión Visual

No aplica — 100% declarativo vía `EntityClient`, sin componente nuevo, mismo layout/loading/
empty/error ya aprobado en `/admin/products`. Sin valores de color, tipografía o estados nuevos
que auditar.

### Revisión UX

**Modo: Light** — una entrada de campo de texto opcional más en un formulario `EntityClient` ya
existente, sin flujo nuevo, sin entidad primaria nueva, sin multi-paso. No califica para Full UX
Review: no introduce un flujo de 2+ pasos, no afecta permisos por rol, no es un formulario/modal/
wizard nuevo (es un campo más en el formulario de productos ya existente) y no modifica
navegación. El propio GAP lo señala explícitamente ("sin preguntas de confirmación, cambio de una
línea de config, sin ambigüedad") y coincide con el criterio de "Light Review" del proceso de
auditoría — confirmado independientemente, no solo aceptado porque el GAP lo diga. No hace falta
invocar a `ux-reviewer`.

```
[x] El cambio es autoexplicativo — campo de texto con label claro y placeholder de ejemplo
[x] No introduce una decisión nueva del usuario sin affordance — el placeholder ("ej.
    0307520000") indica el formato esperado antes de que el usuario escriba
[x] Consistente con la UI circundante — mismo ancho de columna (cols) y estilo que
    articleGtin/boxGtin/a3erp_code, agrupados visualmente junto a los otros códigos del producto
[x] Hover/focus/active states — heredados de shadcn Input, sin código a medida
[x] Tono del texto — "Código arancelario (HS Code)" y mensaje de error consistentes con el resto
    en español
```

**Veredicto UX:** ✅ APROBADO.

### PL CANDIDATE

Ninguno — cambio cubierto en su totalidad por los checklists existentes (patrón de campo
`EntityClient`, opcionalidad explícita, verificación independiente de type-check/lint).

### Estado final de la implementación

El bloque `products` de `src/configs/entities/entitiesConfig.catalog.ts` gana el campo `hsCode`
en `fields` (texto opcional, `validation.pattern` de 6-10 dígitos, mismo shape que
`articleGtin`/`boxGtin`) y la columna `hsCode` en `table.headers` (oculta en mobile, mismo
formato one-liner que `boxGtin`/`palletGtin`). Los 5 criterios de aceptación están cumplidos, no
hay desviaciones respecto al GAP, no se tocó ningún campo vecino ni el archivo protegido
`entitiesConfig.js`, y `type-check`/`lint` están limpios (verificados de forma independiente).
Sin bloqueantes técnicos, visuales ni de UX. GAP movido a `.claude/gaps/closed/`.
