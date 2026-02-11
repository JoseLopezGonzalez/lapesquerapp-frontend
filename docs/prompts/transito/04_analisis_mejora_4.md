# Mejora Nº 4 – Análisis

## 1️⃣ Estado actual (según código real)

**Combobox (Shadcn)**

- Ubicación: `src/components/Shadcn/Combobox/index.js`. Usa `Command` (cmdk) con `CommandInput`, `CommandList` y `CommandItem`. El filtrado es interno de cmdk según el texto del input.
- Comportamiento del scroll: al escribir en el campo de búsqueda, la lista de opciones se filtra pero el **scroll de la lista no se actualiza**. El contenedor de la lista (`CommandList`) mantiene la posición de scroll anterior (p. ej. en medio), de modo que el primer resultado coincidente puede quedar **por encima del viewport** y el usuario no lo ve sin hacer scroll manual hacia arriba.
- No existía control explícito del valor de búsqueda ni sincronización scroll ↔ filtro.

**Componentes afectados**

- Cualquier pantalla que use el Combobox de Shadcn: formularios de pedidos (crear/editar), entidades, palets, filtros, etc. El problema es global a todos los usos del componente.

---

## 2️⃣ Zonas afectadas

| Archivo | Qué tocar |
|--------|------------|
| `src/components/Shadcn/Combobox/index.js` | Controlar el valor de búsqueda del Command (controlado o detectar cambio) y, al cambiar, forzar scroll de la lista a 0. Opcional: resetear búsqueda al cerrar el popover. |
| `src/components/ui/command.jsx` | Solo si se decide aplicar el scroll en el propio CommandList (p. ej. reacción a cambios de contenido). Valoración: mejor resolver en Combobox para no afectar otros usos de Command. |

Conclusión: **solo Combobox**; no tocar Command si no es necesario.

---

## 3️⃣ Riesgos detectados

- **Búsqueda controlada**: Si se pasa a controlar el valor del input de búsqueda (`value`/`onValueChange` en CommandInput), hay que asegurar que cmdk siga filtrando correctamente (usa ese valor internamente). Riesgo bajo: la API de cmdk lo soporta.
- **Ref y timing**: Hacer `scrollTop = 0` en un ref del CommandList debe ejecutarse después de que React/cmdk hayan actualizado el DOM (p. ej. en `useEffect` que dependa del valor de búsqueda). Riesgo bajo.
- **Otros usos de Command**: Si la solución se pusiera en `command.jsx`, podría afectar a otros comandos que no sean combobox. Por eso se limita a Combobox.

---

## 4️⃣ Preguntas necesarias antes de planificar

1. ¿Resetear el texto de búsqueda al cerrar el popover? (Recomendable: sí, para que la próxima apertura muestre la lista completa.)
2. ¿Alcance solo Combobox o también otros usos de Command en la app? (Recomendable: solo Combobox, mínimo impacto.)

---

## 5️⃣ Nivel de riesgo real

**Bajo**: Cambio localizado en un único componente, sin cambios de API ni de flujo de datos. Comportamiento puramente UX (scroll + opcional reset de búsqueda).
