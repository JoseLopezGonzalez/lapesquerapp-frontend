# GAP-110 — Normalizar color warning de yellow a amber en StoreCard

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock (Almacén)
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía /audit-design consistency — familia `tablas`)

---

## Contexto y problema

`src/components/Admin/Stores/StoresManager/StoreCard/index.js:32-35` define el color
del estado de ocupación de un almacén:

```js
? 'bg-green-500/10 border-green-500/60'
: occupancy === 'medium'
  ? 'bg-yellow-500/10 border-yellow-500/60'
  : 'bg-red-500/10 border-red-500/60'
```

`design-context.md` § Color Palette documenta `amber` como el color semántico de
warning en toda la app (`--warning`, Badge `variant="warning"`, badges de estado
"pending/in-progress"). `yellow` y `amber` son tonos Tailwind distintos — usar
`yellow` aquí introduce un segundo tono de "advertencia" que no existe en ningún otro
sitio de la app, visible en cuanto ambos se ven uno junto al otro en el módulo Stores.

## Solución acordada

Sustituir `yellow-500` por `amber-500` en el estado `medium` de ocupación (línea 34).
La opacidad `/10` se mantiene igual — no forma parte de este GAP (decisión explícita:
cambio mínimo, sin tocar los estados `green`/`red` del mismo bloque ni la convención
de opacidad).

## Criterios de aceptación

- [ ] `bg-yellow-500/10` → `bg-amber-500/10`
- [ ] `border-yellow-500/60` → `border-amber-500/60`
- [ ] Los estados `green` y `red` del mismo bloque no se modifican
- [ ] La opacidad `/10` se mantiene igual en los 3 estados (no se cambia a `/15`)
- [ ] `npm run type-check` limpio

## Archivos a crear o modificar

- `src/components/Admin/Stores/StoresManager/StoreCard/index.js`

## Restricciones

- No tocar los umbrales de ocupación (`low`/`medium`/`high` o equivalente) ni la
  lógica que decide qué estado aplica
- No modificar los estados `green`/`red` ni la opacidad `/10`
- No convertir el archivo a `.tsx` en este GAP (fuera de alcance)

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
