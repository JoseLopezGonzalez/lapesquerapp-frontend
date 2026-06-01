# GAP-007 — Partir entitiesConfig.js en módulos por dominio de negocio

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

`src/configs/entitiesConfig.js` tiene 121 KB y contiene la configuración CRUD declarativa de todas las entidades del admin en un único archivo monolítico. Incluye configuración de filtros, columnas, rutas, botones, endpoints y opciones de paginación para más de 30 entidades.

El problema:

1. Es imposible de revisar en una PR — cualquier cambio en una entidad implica abrir un archivo de 121 KB
2. Los conflictos de merge son frecuentes cuando dos devs tocan entidades distintas del mismo archivo
3. TypeScript no puede inferir bien los tipos en un JS de este tamaño
4. Es el archivo con mayor riesgo del proyecto: un error aquí rompe todos los CRUDs del admin

Este es un GAP de **baja prioridad** porque el archivo funciona bien y la refactorización tiene riesgo. Solo abordar cuando haya capacidad y no haya otras urgencias. **Requiere confirmación explícita de Jose antes de empezar la implementación**, independientemente de que el GAP esté en `open/`.

## Solución acordada

Partir `entitiesConfig.js` en archivos por módulo de dominio, que se ensamblan en un `index.js` (o `index.ts` si se migra todo) que expone el mismo objeto `configs` que existe hoy.

Estructura propuesta:

```
src/configs/entities/
├── index.ts                    ← exporta { configs } ensamblando todos los módulos
├── entitiesConfig.orders.ts    ← orders, payment-terms, incoterms
├── entitiesConfig.stock.ts     ← pallets, boxes, lots, stores
├── entitiesConfig.labels.ts    ← labelEditor
├── entitiesConfig.crm.ts       ← customers, prospects
├── entitiesConfig.suppliers.ts ← suppliers, supplier-liquidations
├── entitiesConfig.production.ts← productions, raw-material-receptions
├── entitiesConfig.catalog.ts   ← species, fishing-gears, capture-zones, countries
├── entitiesConfig.admin.ts     ← users, roles, employees, taxes, transports
└── entitiesConfig.field.ts     ← field-operators, cebo-dispatches
```

`entitiesConfig.js` original mantiene su ruta pero reexporta desde `entities/index.ts` para compatibilidad con todos los consumidores existentes.

## Referencias e inspiración

El mismo patrón se usa en `roleConfig.ts` (pequeño, bien tipado) como ejemplo de cómo debería verse una configuración de dominio. El objetivo es que cada archivo de módulo tenga la calidad y legibilidad de `roleConfig.ts`.

## Criterios de aceptación

- [ ] El objeto `configs` exportado desde `entitiesConfig.js` es idéntico al original (mismas keys, mismos valores)
- [ ] Todos los CRUDs del admin funcionan igual que antes (ninguna entidad se rompe)
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] Cada archivo de módulo tiene menos de 300 líneas
- [ ] Los archivos de módulo están en `.ts` (no `.js`)
- [ ] `entitiesConfig.js` original reexporta desde el nuevo `index.ts` para compatibilidad

## Archivos a crear o modificar

- `src/configs/entities/` — directorio nuevo con archivos por dominio
- `src/configs/entities/index.ts` — ensamblador de todos los módulos
- `src/configs/entitiesConfig.js` — reemplazar contenido por reexportación del nuevo index

## Restricciones

- ⚠️ **ZONA PROTEGIDA — confirmar con Jose antes de empezar la implementación**, aunque el GAP esté en `open/`
- La API pública no cambia: `import { configs } from '@/configs/entitiesConfig'` sigue funcionando igual
- No cambiar ningún valor de configuración durante la refactorización — solo reorganizar
- No migrar la lógica de negocio — solo mover la declaración de configuración
- Hacer la migración por módulos, no todo a la vez: orders primero, verificar que funciona, luego stock, etc.
- Si alguna entidad tiene configuración inusual o compleja, documentarla con un comentario en el archivo de módulo

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
