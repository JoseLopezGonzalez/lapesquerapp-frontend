# GAP-104 — Añadir atributo `title` a texto truncado sin él en el editor de pedidos

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-design copy order editor`. `design-context.md` § Mecánicas de copy exige que todo texto con clase `truncate` tenga un atributo `title` que exponga el valor completo — cortar texto sin forma de ver el resto es un bug de contenido. Varios sitios del editor de pedidos truncan nombres de producto o de archivo sin `title`, mientras que archivos hermanos de la misma familia (`OrderAttachments/index.tsx:285`, `OrderAttachmentEditNotesDialog.tsx:49`) sí lo hacen correctamente.

Casos sin `title` detectados:
- `OrderCostAnalysis/index.jsx:71` — `line.product.name`
- `OrderLabels/index.js:297` y `:424` — `group.product?.name`
- `OrderAttachments/OrderAttachmentUploadDialog.tsx:139` y `:199` — nombre de archivo
- `OrderAttachments/index.tsx:372` — `attachment.originalName` (inconsistente incluso con la línea 285 del mismo archivo, que sí tiene `title`)
- `OrderPallets/OrderPalletCard/index.js:215` — `product.name`
- `OrderPallets/SearchPalletCard/index.js:100` — `product.name`

## Solución acordada

Añadir `title={<valor correspondiente>}` a cada elemento truncado listado, usando el mismo dato que ya se renderiza como texto (sin transformación adicional).

## Referencias e inspiración

- `OrderAttachments/index.tsx:285` — `<p className="truncate ..." title={attachment.originalName}>` como patrón ya correcto en el propio módulo.
- `design-context.md` § Mecánicas — regla de `truncate` + `title`.

## Criterios de aceptación

- [ ] `OrderCostAnalysis/index.jsx:71` — el `<p>` con `truncate` tiene `title={line.product.name}`.
- [ ] `OrderLabels/index.js:297` — el `<p>` con `truncate` tiene `title={group.product?.name}`.
- [ ] `OrderLabels/index.js:424` — el `<p>` con `truncate` tiene el `title` correspondiente al mismo dato que renderiza.
- [ ] `OrderAttachments/OrderAttachmentUploadDialog.tsx:139` — tiene `title={selectedFile.name}`.
- [ ] `OrderAttachments/OrderAttachmentUploadDialog.tsx:199` — tiene `title={label}` (o el valor equivalente que renderiza).
- [ ] `OrderAttachments/index.tsx:372` — tiene `title={attachment.originalName}`.
- [ ] `OrderPallets/OrderPalletCard/index.js:215` — tiene `title={product.name}`.
- [ ] `OrderPallets/SearchPalletCard/index.js:100` — tiene `title={product.name}`.
- [ ] No se cambia ninguna clase Tailwind, estructura JSX ni lógica — solo se añade el atributo `title`.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.js`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/OrderAttachmentUploadDialog.tsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.js`
- `src/components/Admin/OrdersManager/Order/OrderPallets/SearchPalletCard/index.js`

## Restricciones

- No añadir `title` a elementos truncados que muestren valores no significativos para el usuario (ej. un `#id` corto que nunca se corta visualmente) — solo a los 8 casos listados, que son nombres de producto/archivo potencialmente largos.
- No modificar estilos ni layout.

---

## Implementación

Implementado por Codex el 2026-07-02.

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/OrderAttachmentUploadDialog.tsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/SearchPalletCard/index.tsx`
- `.claude/gaps/in-progress/GAP-104-add-title-attribute-truncated-text.md`

### Decisiones tomadas durante la implementación

- Se añadieron atributos `title` usando el mismo valor renderizado en los textos truncados listados.
- En la línea individual de etiquetas se usó `title={box.product?.name || 'Sin producto'}` para coincidir con el fallback visible.
- Se verificó la presencia de los atributos con `rg` sobre los archivos afectados.

### Desviaciones del plan (si las hay)

- `OrderLabels`, `OrderPalletCard` y `SearchPalletCard` existen actualmente como `index.tsx`, no como `index.js`; se aplicó el cambio en los archivos reales equivalentes.
- El árbol ya contenía cambios previos en varios archivos del editor de pedidos; no se revirtieron ni se modificaron fuera del alcance de este GAP.

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
