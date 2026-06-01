# GAP-003 — Migrar entityServiceMapper.js a TypeScript

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global
- **Prioridad:** Media
- **Estado:** open
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
