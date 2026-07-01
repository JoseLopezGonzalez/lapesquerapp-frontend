# GAP-097 — Sustituir `<img>` por `next/image` en el editor de pedidos

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
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
