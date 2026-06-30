# GAP-046 — Pages con 'use client' y migración .js → .ts en rutas comercial

## Metadata

- **Tipo:** Refactor
- **Módulo:** CRM / Global
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

Se detectaron dos problemas en los archivos de página del módulo comercial:

### Problema 1: 'use client' en page.js (anti-patrón)

`src/app/comercial/ofertas/page.js` y `src/app/comercial/orders-manager/page.js` tienen `'use client'` en la primera línea. En Next.js App Router, los archivos `page.js/tsx` deben ser **Server Components** que simplemente importan e instancian el PageClient. Añadir `'use client'` en el page convierte toda la ruta en Client Component, impidiendo cualquier optimización de Server Component y pudiendo causar comportamientos inesperados en el bundle.

El patrón canónico del proyecto (y el usado en las otras rutas) es:
```tsx
// page.tsx (Server Component — sin 'use client')
import XxxPageClient from '@/components/Xxx/XxxPageClient';
export default function XxxPage() { return <XxxPageClient />; }
```

### Problema 2: archivos .js sin migrar a .ts

Tres archivos de página son `.js` en lugar de `.ts` o `.tsx`:
- `src/app/comercial/agenda/page.js`
- `src/app/comercial/ofertas/page.js`
- `src/app/comercial/orders-manager/page.js`

Según la regla CLAUDE.md §3: "Todo código nuevo es `.ts` o `.tsx`. Si tocas un `.js` legacy por cualquier motivo, migrarlo a `.ts` en ese mismo commit."

---

## Solución acordada

1. Renombrar los tres archivos de `.js` a `.tsx` (son archivos JSX aunque con extensión .js).
2. Eliminar `'use client'` de `ofertas/page.tsx` y `orders-manager/page.tsx`.
3. Añadir tipos a los componentes si los necesitan (pages simples sin props no necesitan tipado adicional).

---

## Criterios de aceptación

- [ ] `src/app/comercial/agenda/page.tsx` existe (renombrado de .js a .tsx)
- [ ] `src/app/comercial/ofertas/page.tsx` existe (renombrado de .js a .tsx) y no tiene `'use client'`
- [ ] `src/app/comercial/orders-manager/page.tsx` existe (renombrado de .js a .tsx) y no tiene `'use client'`
- [ ] Los archivos `.js` originales no existen
- [ ] `npm run type-check` limpio tras el renombrado
- [ ] Las rutas funcionan correctamente (el Page Router de Next.js reconoce los nuevos nombres)

## Archivos a crear o modificar

- `src/app/comercial/agenda/page.js` → renombrar a `page.tsx`
- `src/app/comercial/ofertas/page.js` → renombrar a `page.tsx` + eliminar `'use client'`
- `src/app/comercial/orders-manager/page.js` → renombrar a `page.tsx` + eliminar `'use client'`

## Restricciones

- No modificar los PageClient que los pages importan
- No añadir lógica de negocio a los page files
- No tocar otros archivos de la carpeta `src/app/comercial/`

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
