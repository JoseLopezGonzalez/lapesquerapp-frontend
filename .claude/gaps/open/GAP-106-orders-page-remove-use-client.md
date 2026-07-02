# GAP-106 — Eliminar 'use client' de comercial/orders/page.js

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / CRM comercial
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía /audit-design consistency — familia `listados`)

---

## Contexto y problema

`src/app/comercial/orders/page.js` tiene `'use client'` en la primera línea. En
Next.js App Router, los archivos `page.js/tsx` deben ser **Server Components** (sin
directiva) que importan e instancian el Client Component real — patrón documentado
en `.claude/project-learnings.md` PL-014 y ya corregido una vez en
`ofertas/page.js` y `orders-manager/page.js` vía **GAP-046**. Esta tercera ruta del
mismo módulo comercial se quedó fuera de aquel GAP y sigue teniendo la misma
violación hoy.

Añadir `'use client'` al page convierte toda la ruta en Client Component, impide
optimizaciones de Server Component, y no es el patrón canónico del proyecto.

## Solución acordada

Aplicar exactamente el mismo fix que GAP-046:

1. Renombrar `src/app/comercial/orders/page.js` → `page.tsx`
2. Eliminar la directiva `'use client'`
3. No tocar el `EntityClient` ni la construcción de `comercialOrdersConfig` — el
   fichero ya no necesita hooks/estado propio, solo renderiza `<EntityClient
   config={comercialOrdersConfig} />`

## Referencias e inspiración

- `GAP-046-pages-client-directive-cleanup.md` (closed) — mismo problema, mismo fix,
  mismo módulo, dos rutas hermanas ya corregidas
- `.claude/project-learnings.md` PL-014

## Criterios de aceptación

- [ ] `src/app/comercial/orders/page.tsx` existe (renombrado de `.js`)
- [ ] No tiene `'use client'`
- [ ] El archivo `.js` original no existe
- [ ] La ruta `/comercial/orders` sigue funcionando igual (mismo config, mismo
      comportamiento de solo lectura)
- [ ] `npm run type-check` limpio

## Archivos a crear o modificar

- `src/app/comercial/orders/page.js` → renombrado a `page.tsx`, `'use client'`
  eliminado

## Restricciones

- No modificar `comercialOrdersConfig` ni la lógica de filtrado de `exports`
- No tocar `EntityClient` ni otros archivos de `src/app/comercial/`

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
