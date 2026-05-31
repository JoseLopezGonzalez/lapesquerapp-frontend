# GAP-004 — Refactor useOrder.js — extraer sub-hooks en hooks/orders/

## Metadata
- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/useOrder.js` tiene ~40 KB y concentra toda la lógica del módulo de pedidos en un único archivo. Cada nueva feature de ventas requiere tocar este hook, lo que aumenta el riesgo de romper funcionalidad existente y hace las revisiones de código difíciles de seguir.

Además, al estar en `.js`, no tiene tipos. Cualquier modificación puede introducir errores silenciosos que TypeScript habría detectado.

El problema concreto: el hook es demasiado grande para añadirle lógica de forma segura. Las reglas del proyecto (`CLAUDE.md`, `.claude/rules/hooks.md`) prohíben explícitamente añadir lógica nueva al hook directamente — pero eso significa que las nuevas features de ventas no tienen dónde ir.

## Solución acordada

1. **Analizar** `useOrder.js` y identificar las responsabilidades claramente separables (formulario de creación, edición, cierre, lógica de líneas de pedido, totales, etc.)
2. **Extraer** cada responsabilidad como un sub-hook `.ts` en `src/hooks/orders/`
3. **Reexportar** desde `useOrder.js` para mantener compatibilidad con los componentes existentes
4. El propio `useOrder.js` debe migrar a `useOrder.ts` en este GAP (ya que se toca obligatoriamente)

**Importante:** Este GAP no requiere cambiar ningún componente que consuma `useOrder`. Los sub-hooks se extraen y se reexportan — API pública inalterada.

## Referencias e inspiración

Patrón de sub-hooks ya presente en el proyecto: `src/hooks/production/` contiene sub-hooks del módulo de producción siguiendo este mismo patrón.

## Criterios de aceptación
- [ ] Existe el directorio `src/hooks/orders/` con al menos 3 sub-hooks extraídos
- [ ] Cada sub-hook extraído está en `.ts` y tiene tipos explícitos
- [ ] `useOrder.ts` (ya migrado desde `.js`) reexporta todo lo que exportaba antes
- [ ] Ningún componente que importaba de `useOrder` necesita cambios
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] Los sub-hooks nuevos siguen el patrón `use[Entity][Action]` de `.claude/rules/hooks.md`
- [ ] El hook gigante `useOrder.js` original se elimina (reemplazado por `useOrder.ts`)

## Archivos a crear o modificar
- **Leer primero:** `src/hooks/useOrder.js` — identificar las responsabilidades a extraer
- `src/hooks/orders/` — directorio nuevo con sub-hooks (mínimo 3, el Implementador decide cuáles tras leer el archivo)
- `src/hooks/useOrder.js` → `src/hooks/useOrder.ts` — migrar y convertir en orquestador que importa sub-hooks
- Cualquier archivo que importe `useOrder.js` con extensión explícita → actualizar

## Restricciones
- **No cambiar la API pública** de `useOrder` — los componentes no deben tocarse
- Si un sub-hook requiere nueva lógica no existente, añadirla en el sub-hook, no en el hook principal
- No tocar `entitiesConfig.js` ni `orderService.js` en este GAP — solo el hook
- Si durante la extracción se detecta lógica que debería estar en el service y no en el hook, documentarlo como observación pero no moverlo en este GAP

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
