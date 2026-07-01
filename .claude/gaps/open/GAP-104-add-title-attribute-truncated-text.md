# GAP-104 — Añadir atributo `title` a texto truncado sin él en el editor de pedidos

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
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
