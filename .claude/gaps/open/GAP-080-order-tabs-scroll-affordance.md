# GAP-080 — Añadir affordance de scroll a la barra de tabs del editor de pedidos

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

`OrderTabsDesktop.jsx:43-51` renderiza 12 tabs (Información, Previsión, Detalle productos,
Otros artículos, Análisis, Producción, Palets, Etiquetas, Envío de Documentos, Descargas,
Ruta, Incidencia, Histórico, Adjuntos) en una sola fila `TabsList w-fit flex-nowrap` dentro de
un contenedor `overflow-x-auto`, sin ningún indicador visual de que hay más tabs disponibles
fuera del viewport. En cualquier pantalla que no sea muy ancha, varios tabs (típicamente Ruta,
Incidencia, Histórico, Adjuntos, Descargas) quedan fuera de vista sin ninguna pista de que
existen — riesgo real de que usuarios no descubran esas secciones.

Jose ha decidido: mantener el layout de scroll horizontal actual (no reestructurar la
información arquitectónica en un dropdown "+Más" por ahora), pero añadir una affordance visual
que comunique que hay contenido scrolleable.

## Solución acordada

Añadir un degradado (fade) en los bordes izquierdo/derecho del contenedor de `TabsList`
cuando hay contenido oculto en esa dirección (visible solo si `scrollLeft > 0` / si
`scrollWidth > clientWidth` respectivamente), siguiendo el patrón visual estándar de "fade
scroll edge". No se requieren flechas de navegación adicionales salvo que el degradado por sí
solo no resulte suficientemente claro tras una primera revisión visual.

## Referencias e inspiración

- `OrderTabsDesktop.jsx:43-51` — contenedor actual sin affordance.
- Patrón shadcn `ScrollArea` (`src/components/ui/scroll-area.tsx`) ya usado en otras partes
  del editor de pedidos (`OrderSectionList.jsx`) — evaluar si aplica aquí o si un fade manual
  con `mask-image`/gradiente Tailwind es más apropiado dado que es un scroll horizontal nativo
  con `overflow-x-auto`, no un `ScrollArea` de Radix.

## Criterios de aceptación

- [ ] Cuando la barra de tabs tiene contenido scrolleable a la derecha, se ve un degradado en
      el borde derecho indicando que hay más tabs.
- [ ] Cuando el usuario ha scrolleado y hay contenido oculto a la izquierda, se ve el mismo
      degradado en el borde izquierdo.
- [ ] El degradado desaparece cuando no hay overflow en esa dirección (viewport ancho,
      todos los tabs visibles).
- [ ] El comportamiento de selección/cambio de tab no cambia.
- [ ] Funciona en modo claro y oscuro (usar `--background`/`--card` según corresponda, nunca
      un color hardcodeado).

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.jsx`

## Restricciones

- No introducir un dropdown "+Más" ni reordenar/priorizar tabs en este GAP — eso queda
  explícitamente diferido a una decisión de IA futura si hiciera falta.
- No usar Framer Motion — la app documenta "no animaciones en pantallas operativas".

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
