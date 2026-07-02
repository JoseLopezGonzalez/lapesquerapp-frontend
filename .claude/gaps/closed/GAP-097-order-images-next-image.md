# GAP-097 — Sustituir `<img>` por `next/image` en el editor de pedidos

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

`.claude/design-context.md` § 8 documenta "Icons are Lucide-only, images are next/image".
Cinco usos de `<img>` nativo en el editor de pedidos no siguen esta regla — sin `width`/
`height` explícitos, lo que arriesga layout shift, y sin las optimizaciones de `next/image`
(lazy loading, formatos modernos):

- `OrderHeaderDesktop.jsx:170-174` — imagen de transporte (`max-w-[240px]`).
- `OrderSummaryMobile.jsx:59-63` — misma imagen de transporte, versión móvil (`max-w-[170px]`).
- `OrderAttachments/index.tsx:163,197,421` — miniaturas y visor de adjuntos de imagen.

## Solución acordada

Sustituir los 5 usos por `next/image` (`import Image from 'next/image'`), especificando
`width`/`height` (o `fill` con contenedor de tamaño fijo/relative, según el caso — las
miniaturas de `OrderAttachments` son buen candidato para `fill` dado que ya usan
`aspect-square`/contenedores de tamaño fijo; las imágenes de transporte tienen un `max-w`
fijo y pueden usar `width`/`height` explícitos).

## Referencias e inspiración

- `.claude/design-context.md` § 8 — regla "images are next/image".
- Buscar en el resto del proyecto un uso ya existente de `next/image` con `fill` sobre
  contenedor `aspect-square` como referencia de patrón (si existe) antes de improvisar.

## Criterios de aceptación

- [ ] Los 5 usos de `<img>` listados pasan a usar el componente `Image` de `next/image`.
- [ ] No se introduce layout shift visible (dimensiones explícitas o `fill` + contenedor de
      tamaño fijo en todos los casos).
- [ ] Las imágenes de adjuntos remotas/dinámicas (`OrderAttachments`) siguen funcionando con
      URLs firmadas/dinámicas del backend — verificar si `next.config.mjs` necesita añadir el
      dominio/patrón a `images.remotePatterns` si aún no está configurado.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.jsx`
- `src/components/Admin/OrdersManager/Order/components/OrderSummaryMobile.jsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `next.config.mjs` (solo si hace falta añadir `remotePatterns` para las imágenes de adjuntos)

## Restricciones

- No cambiar el origen/URL de las imágenes — solo el componente de renderizado.
- Verificar `next.config.mjs` antes de asumir que el dominio de adjuntos ya está permitido.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/components/OrderSummaryMobile.tsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`

### Decisiones tomadas durante la implementación

- `OrderHeaderDesktop.tsx` ya usaba `Image` de `next/image` en el árbol actual, así que no
  necesitó cambios.
- La imagen de transporte móvil en `OrderSummaryMobile.tsx` pasa a `Image` con
  `width={170}` y `height={96}`, manteniendo `max-w-[170px]`.
- Las miniaturas de adjuntos en `OrderAttachments/index.tsx` pasan a `Image fill` sobre los
  contenedores `relative aspect-square` ya existentes.
- Las imágenes de adjuntos usan `unoptimized` porque los services entregan blob URLs cacheadas;
  no dependen de dominios remotos ni requieren tocar `next.config.mjs`.
- El visor de imágenes usa `Image fill` con `object-contain` y `unoptimized` para preservar el
  comportamiento anterior de vista previa.

### Desviaciones del plan (si las hay)

No se modificó `next.config.mjs`: los adjuntos se renderizan desde blob URLs locales generadas
por el service, no desde dominios remotos que necesiten `images.remotePatterns`.

### Checks ejecutados

- `rg "<img|from 'next/image'|<Image" ...` sobre los tres archivos del GAP — sin `<img>` en el
  alcance; todos los renders son `Image`.
- `npm run type-check` — OK.
- `npx eslint` sobre los tres archivos del GAP — OK con 0 errores y 4 warnings preexistentes en
  `OrderAttachments` (`setState` en effects e icono dinámico).
- `git diff --check -- ...` sobre los archivos tocados y el GAP — OK.

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
