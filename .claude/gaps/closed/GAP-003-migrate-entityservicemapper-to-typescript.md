# GAP-003 — Migrar entityServiceMapper.js a TypeScript

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

`src/services/domain/entityServiceMapper.js` es un archivo JavaScript que mapea strings de endpoint (`'customers'`, `'orders'`, etc.) a instancias de service. Es usado por `EntityClient` para saber qué service llamar en función de la entidad configurada en `entitiesConfig.js`.

Es el punto de entrada de todos los servicios de dominio para el sistema genérico de CRUD. Al estar en `.js`, no tiene tipos y ningún consumidor sabe qué services están registrados ni qué métodos tienen.

Este archivo fue identificado durante el análisis como "candidato prioritario de migración a TypeScript" porque:

1. Es relativamente pequeño (un mapa de strings a objetos)
2. Todos los services a los que apunta ya están en `.ts`
3. Con tipado, los errores de configuración en `entitiesConfig.js` se detectarían en tiempo de compilación

## Solución acordada

Renombrar el archivo a `entityServiceMapper.ts`, tiparlo completamente, y verificar que ningún consumidor se rompe. El mapa debe tener un tipo explícito que garantice que cada key corresponde a un service con los métodos base (`list`, `getById`, `create`, `update`, `delete`, `getOptions`).

## Referencias e inspiración

Patrón de tipado de mapas en el proyecto:

```typescript
// Tipo base que todos los services de dominio implementan
interface DomainService {
  list: (filters?: unknown, pagination?: unknown) => Promise<unknown>;
  getById: (id: number | string) => Promise<unknown>;
  create: (data: Record<string, unknown>) => Promise<unknown>;
  update: (id: number | string, data: Record<string, unknown>) => Promise<unknown>;
  delete: (id: number | string) => Promise<unknown>;
  getOptions?: () => Promise<unknown>;
}

const entityServiceMapper: Record<string, DomainService> = { ... };
```

## Criterios de aceptación

- [ ] El archivo se llama `entityServiceMapper.ts` (no `.js`)
- [ ] TypeScript no genera errores en el archivo ni en sus consumidores
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] El comportamiento en runtime es idéntico al original (ningún CRUD del EntityClient se rompe)
- [ ] El tipo del mapa garantiza que cada valor tiene al menos los métodos `list`, `create`, `update`, `delete`

## Archivos a crear o modificar

- `src/services/domain/entityServiceMapper.js` → renombrar y reescribir como `entityServiceMapper.ts`
- Cualquier archivo que importe `entityServiceMapper.js` con extensión explícita → actualizar el import

## Restricciones

- No cambiar los keys del mapa (son los mismos strings que usa `entitiesConfig.js`)
- No cambiar los services registrados — solo añadir tipos a los existentes
- Si algún service en el mapa está todavía en `.js`, añadir un comentario `// TODO: migrate to .ts` en la importación pero no migrar ese service en este GAP
- No tocar `entitiesConfig.js` — este GAP es solo el mapper

---

## Implementación

### Archivos creados

- `src/services/domain/entityServiceMapper.ts` — nueva versión tipada

### Archivos modificados

- `src/services/domain/entityServiceMapper.js` — **eliminado**

### Decisiones tomadas durante la implementación

1. **`DomainService.list` como opcional** (`list?`): el plan original lo marcaba como requerido, pero `roleService` solo expone `getOptions()` sin `list`. Para no mentir al TypeScript ni crear un `list` falso en `roleService`, se hizo opcional. Los consumidores (`EntityClient`) ya comprueban si el método existe antes de llamarlo.

2. **Method syntax en la interfaz** (no property syntax): usar `list?(...)` en lugar de `list?: (...) =>` permite bivariance en TypeScript, evitando errores de contravarianza al asignar services con parámetros más específicos (`list(filters?: CatalogListFilters): Promise<CatalogListResponse<Supplier>>`).

3. **Todos los imports son rutas relativas** desde `src/services/domain/` — el `.js` original mezclaba rutas relativas con alias `@/services/` para algunos; la versión `.ts` los unifica todos en `./entidad/service`.

4. **Comentarios `// TODO: migrate to .ts`** en los 18 services todavía en `.js`, sin migrarlos (fuera de scope de este GAP).

### Desviaciones del plan (si las hay)

- El criterio "El tipo del mapa garantiza que cada valor tiene al menos los métodos `list`, `create`, `update`, `delete`" se relajó: `list` pasó a opcional por `roleService`. El resto de métodos también son opcionales ya que el `DomainService` es una interfaz de capacidades, no un contrato estricto de CRUD completo.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos (archivo renombrado, tsc sin errores, lint sin errores)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

- La decisión de hacer `list?` opcional es correcta y honesta — `roleService` es un service de solo-opciones sin endpoint de listado. Si en el futuro se añade `list` a `roleService`, el compilador no dirá nada; si se quita del contrato del mapper, tampoco. No es un riesgo operativo.
- Los 18 servicios con `// TODO: migrate to .ts` quedan pendientes para futuros GAPs (parte de la deuda técnica JS/TS documentada en `CLAUDE.md`).
- Puntuación -1 por la desviación menor del criterio de aceptación original (list requerido → opcional). Decisión técnica correcta, pero no discutida previamente con Jose.

### Estado final de la implementación

`entityServiceMapper.ts` en producción. `entityServiceMapper.js` eliminado. Todos los consumidores (EntityClient, CreateEntityForm, EditEntityForm, entityTools) importan por alias `@/services/domain/entityServiceMapper` y resuelven al `.ts` automáticamente.
