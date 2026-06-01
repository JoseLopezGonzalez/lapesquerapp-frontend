# GAP-005 — Refactor usePallet.js — extraer sub-hooks en hooks/pallets/

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/usePallet.js` tiene ~48 KB — el hook más grande del proyecto. Concentra toda la lógica del módulo de stock/almacén: creación de palets, edición, movimiento entre almacenes, gestión de cajas, impresión de etiquetas, recepciones, etc.

Cualquier feature nueva del módulo de almacén (operativa warehouse) pasa por este hook. Con 48 KB, incluso leer el archivo completo para entender qué hace cada función es costoso. El riesgo de introducir regresiones es alto.

El problema es el mismo que en `useOrder.js` pero más grave por tamaño: las reglas del proyecto ya prohíben añadirle más lógica, pero tampoco hay sub-hooks en `hooks/pallets/` donde poner las nuevas features.

## Solución acordada

1. **Analizar** `usePallet.js` e identificar responsabilidades separables (creación de palet, edición, movimiento, gestión de cajas, impresión/etiquetado, filtros, etc.)
2. **Extraer** cada responsabilidad como sub-hook `.ts` en `src/hooks/pallets/`
3. **Reexportar** desde `usePallet.ts` (ya migrado desde `.js`) para mantener compatibilidad
4. Migrar `usePallet.js` → `usePallet.ts` en este mismo GAP

**Prioridad de extracción:** empezar por las responsabilidades que tienen más probabilidad de recibir nuevas features pronto (preguntar a Jose antes de implementar si no está claro).

## Referencias e inspiración

El módulo de producción ya sigue este patrón: `src/hooks/production/` tiene sub-hooks extraídos del hook principal de producción.

## Criterios de aceptación

- [ ] Existe el directorio `src/hooks/pallets/` con al menos 3 sub-hooks extraídos
- [ ] Cada sub-hook extraído está en `.ts` con tipos explícitos
- [ ] `usePallet.ts` (migrado desde `.js`) reexporta todo lo que exportaba antes
- [ ] Ningún componente que importaba de `usePallet` necesita cambios
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] Los sub-hooks siguen la nomenclatura `use[Entity][Action]` o `usePallet[Responsabilidad]`
- [ ] El archivo `usePallet.js` original se elimina (reemplazado por `usePallet.ts`)

## Archivos a crear o modificar

- **Leer primero:** `src/hooks/usePallet.js` — mapear responsabilidades antes de cualquier cambio
- `src/hooks/pallets/` — directorio nuevo con sub-hooks
- `src/hooks/usePallet.js` → `src/hooks/usePallet.ts` — orquestador que importa sub-hooks
- Archivos que importen `usePallet.js` con extensión explícita → actualizar

## Restricciones

- **No cambiar la API pública** de `usePallet` — los componentes de warehouse no deben tocarse
- No tocar `entitiesConfig.js`, `palletService`, ni ningún componente de warehouse en este GAP
- Si se detecta lógica que debería estar en el service y no en el hook, documentarlo como observación pero no moverlo aquí
- Si el hook tiene más de 5 responsabilidades claramente distintas, priorizar las 3-5 más grandes en este GAP y documentar el resto como trabajo pendiente en las observaciones

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
