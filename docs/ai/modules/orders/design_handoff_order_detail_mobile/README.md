# Handoff: Detalle de pedido — vista mobile (gestor de pedidos, La Pesquerapp)

## Overview

Rediseño de la vista "Detalle de productos" de un pedido para la versión mobile de la web app. En desktop esta vista es una tabla; en mobile el listado de líneas de producto (variantes de peso de un mismo producto) se muestra como una lista de tarjetas con acordeón: cada línea aparece colapsada mostrando solo nombre + importe, y al tocarla se expande para revelar cajas, cantidad, precio, IVA y subtotal.

## About the Design Files

El archivo `detalle-pedido-1b.html` incluido en este paquete es una **referencia de diseño en HTML** — un prototipo estático (con el acordeón funcionando en JS vanilla mínimo) que muestra el aspecto y comportamiento pretendido, **no es código de producción para copiar tal cual**. La tarea es **recrear este diseño en el entorno ya existente de la app** (el framework/librería de componentes que ya usen — Next/React, Vue, etc. — y su base actual, próxima a shadcn/ui), reutilizando los tokens, componentes y convenciones ya establecidos en el proyecto en vez de pegar el HTML/CSS directamente.

## Fidelity

**Alta fidelidad (hifi).** Colores, tipografía, espaciados y comportamiento de interacción (expandir/colapsar) están definidos y deben respetarse con precisión. Los valores de ejemplo (importes, kg, etc.) son los del pedido de la captura original y deben sustituirse por los datos reales de cada pedido.

## Pantalla: Detalle de productos (mobile)

**Propósito:** el usuario revisa el desglose de un pedido ya realizado: total, y cada línea de producto (variante de peso) con su importe, y puede expandir una línea para ver el detalle (cajas, cantidad, precio unitario, IVA, subtotal).

### Layout general

- Contenedor de pantalla, ancho fluido (diseñado sobre 375px de referencia).
- Barra superior fija dentro del flujo (no sticky): botón "atrás" + título centrado a la izquierda del texto, `padding: 18px 16px 14px`, fondo blanco, borde inferior `1px solid #ececec`.
- Área de scroll con `padding: 14px`.
- Dentro: 1) tarjeta resumen del pedido, 2) lista de tarjetas de línea de producto con `gap: 10px` entre ellas.

### Componente: Tarjeta resumen ("Total pedido")

- Fondo `#fff`, borde `1px solid #e4e4e7`, `border-radius: 12px`, `padding: 16px`.
- **Sticky recomendado**: `position: sticky; top: 0` mientras el usuario hace scroll por la lista de líneas — decisión de diseño, opcional según lo que sea técnicamente más simple en el layout final (si la barra superior también es sticky, verificar que no se solapen).
- Contenido:
  - Label "Total pedido" — `font-size: 11px`, color `#71717a`.
  - Importe total — `font-size: 24px`, `font-weight: 800`, color `#18181b`, `letter-spacing: -0.02em`. Ej: "8.362,48 €".
  - Debajo, separador `1px solid #f0f0f0` y grid de 3 columnas iguales (`gap: 8px`) con: Cajas (93), Cantidad (1.311,48 kg), Precio medio (5,80 €). Cada celda: label `10.5px` color `#a1a1aa`, valor `13.5px` `font-weight:600` color `#27272a`.

### Componente: Tarjeta de línea de producto (acordeón)

Cada línea de producto (ej. "Pulpo azul en bandeja (0,500 - 0,800kg)") es una tarjeta:

- Fondo `#fff`, borde `1px solid #e4e4e7`, `border-radius: 12px`, `overflow: hidden`.

**Cabecera (siempre visible, tappable en toda su superficie):**

- `display: flex; justify-content: space-between; align-items: center; padding: 13px 14px`.
- Izquierda: punto indicador (`6px` círculo, color `#d4d4d8` colapsado / `#a1a1aa` cuando la tarjeta está abierta) + nombre del producto, `font-size: 13.5px`, `font-weight: 600`, color `#18181b`. Truncar/ajustar en 2 líneas si el nombre es largo.
- Derecha: importe total de la línea — `font-size: 14.5px`, `font-weight: 700`, color `#18181b` — seguido de un chevron (▾) que rota 180° cuando la tarjeta está expandida. Chevron color `#d4d4d8` colapsado / `#a1a1aa` expandido.

**Cuerpo expandido (oculto por defecto, se muestra al tocar la cabecera):**

- `padding: 0 14px 14px`, separador superior `1px solid #f4f4f5` con `padding-top: 12px`.
- Grid de 3 columnas (`gap: 10px`) con 5 datos: Cajas, Cantidad, Precio, IVA, Subtotal (el 5º dato ocupa la primera celda de una segunda fila implícita del grid).
- Cada dato: label `10px` color `#a1a1aa`, valor `12.5px` `font-weight:600` color `#3f3f46`.

Por defecto en el prototipo la primera línea aparece expandida como ejemplo visual; en producción todas deberían arrancar **colapsadas**, y solo una o varias pueden estar abiertas a la vez (comportamiento tipo acordeón independiente por fila, no exclusivo — cada tarjeta se abre/cierra sin afectar a las demás).

## Interactions & Behavior

- **Tap en la cabecera de una tarjeta de línea** → alterna (toggle) el estado expandido/colapsado de esa tarjeta únicamente. No es necesario cerrar las demás.
- **Transición**: usar una transición suave de altura/opacity al expandir (ej. `max-height`/`grid-template-rows` + `transition: 150–200ms ease`) — el prototipo usa `display:none/grid` sin animación; se recomienda añadir una transición sutil en producción.
- El chevron rota 180° con `transition: transform 150ms ease` al expandir.
- Sin estados de error/carga específicos de esta vista — es una vista de solo lectura de un pedido ya calculado. Si la carga de datos es asíncrona, mostrar skeletons con la misma estructura de tarjetas.
- No hay accento de color: toda la jerarquía se logra con peso tipográfico y escala de grises, siguiendo la dirección elegida por el usuario (paleta neutra, sin color de marca en esta vista).

## State Management

- Por línea de producto: un booleano `isOpen` (o un array/set de ids abiertos) que controla si el cuerpo expandido se muestra.
- Los datos de cada línea (nombre, cajas, cantidad, precio, IVA, subtotal, total) vienen del pedido — no hay edición en esta vista, es de solo lectura.

## Design Tokens

**Color (neutros únicamente, sin acento de marca en esta vista):**

- Fondo pantalla: `#fafafa`
- Fondo tarjetas/topbar: `#ffffff`
- Borde tarjetas: `#e4e4e7`
- Borde separador interno: `#f4f4f5` / `#f0f0f0`
- Texto principal: `#18181b`
- Texto secundario/labels fuertes: `#27272a` / `#3f3f46`
- Texto terciario/labels tenues: `#71717a` / `#a1a1aa`
- Punto/chevron colapsado: `#d4d4d8`

**Tipografía:** Inter (o la fuente del sistema ya usada en la app), pesos 600/700/800 para valores e importes, 400/500 para labels.

- Total pedido: 24px / 800 / -0.02em letter-spacing
- Importe de línea: 14.5px / 700
- Nombre de producto: 13.5px / 600
- Valores de detalle expandido: 12.5px / 600
- Labels (Cajas, Cantidad, IVA...): 10–11px / 400, color tenue

**Espaciado:** padding de tarjetas 13–16px; gap entre tarjetas de línea 10px; gap entre columnas de grid 8–10px.

**Border radius:** 12px en todas las tarjetas (resumen y líneas).

**Sombras:** ninguna — el diseño se apoya en bordes de 1px, no en sombras, para mantenerse plano y minimalista.

## Assets

No hay iconografía personalizada más allá de la flecha "atrás" (←) y el chevron (▾), ambos como caracteres/símbolos simples — no se requieren SVGs ni imágenes.

## Files

- `detalle-pedido-1b.html` — referencia HTML/CSS/JS autocontenida de la pantalla "Detalle productos", con el acordeón funcionando (JS vanilla inline). Ábrelo en el navegador para ver el comportamiento real.
- `produccion-2a.html` — referencia HTML/CSS/JS autocontenida de la pantalla "Producción" (ver sección siguiente).

---

# Pantalla adicional: Producción vs. Pedido (mobile)

## Overview

Vista que compara, línea a línea, lo pedido frente a lo producido para cada variante de peso de un producto, con un indicador de estado ("Correcto" / "Descuadre") por línea. Misma familia visual que "Detalle productos" (acordeón de tarjetas), extendida con una segunda columna de datos (Producción) y un badge de estado.

## Fidelity

Alta fidelidad (hifi), misma base de tokens que la pantalla "Detalle productos". Los valores de ejemplo (kg, cajas) deben sustituirse por los datos reales; el caso "Descuadre" en el prototipo es solo ilustrativo de cómo debe verse cuando `producción ≠ pedido`.

## Layout y componentes

### Tarjeta resumen ("Totales")

Igual estructura que la de "Detalle productos" pero con 3 columnas: **Pedido**, **Producción**, **Diferencia** (en vez de Cajas/Cantidad/Precio medio). Valores en `15px / font-weight:700` (algo más grandes que en la pantalla de detalle, al ser solo 3 datos sin importe destacado).

### Tarjeta de línea de producto (acordeón)

Misma estructura de acordeón que en "Detalle productos" (ver sección anterior), con dos diferencias:

1. **Badge de estado** en la cabecera, a la derecha del nombre y antes del chevron:
   - Estado "Correcto": texto `#15803d` sobre fondo `#dcfce7` (verde).
   - Estado "Descuadre" (cuando `producción ≠ pedido`): texto `#b91c1c` sobre fondo `#fee2e2` (rojo), y el borde de la tarjeta completa pasa de `#e4e4e7` a `#fecaca` para que el desajuste se note incluso colapsada.
   - Badge: `font-size: 11px`, `font-weight: 600`, `padding: 3px 9px`, `border-radius: 999px` (pill).
   - **Nota de diseño:** esta es la única pantalla del conjunto que usa color semántico (verde/rojo) — el resto del sistema (Detalle productos) es neutro/escala de grises. Confirmar con el equipo de producto si este uso puntual de color de estado es aceptable o si prefieren resolverlo solo con tipografía/iconografía en escala de grises.

2. **Cuerpo expandido** con grid de 3 columnas: **Pedido** (valor + cajas debajo, en gris tenue), **Producción** (ídem), **Diferencia** (valor destacado; en rojo `#b91c1c` y `font-weight:700` cuando es distinto de cero, en gris `#3f3f46` normal cuando es 0,00).

## Interactions & Behavior

- Igual que "Detalle productos": tap en la cabecera alterna expandido/colapsado por tarjeta, de forma independiente.
- El estado del badge y el color de borde de la tarjeta se derivan de si `producción === pedido` (en cantidad y/o cajas) — a definir con backend qué margen de tolerancia (si alguno) se considera "Correcto".
- Mismas recomendaciones de transición (150–200ms ease) que en la pantalla anterior.

## Design Tokens adicionales (respecto a "Detalle productos")

- Verde estado OK: texto `#15803d`, fondo `#dcfce7`.
- Rojo estado descuadre: texto `#b91c1c`, fondo `#fee2e2`; borde de tarjeta en descuadre `#fecaca`.

## Files (de esta pantalla)

- `produccion-2a.html` — referencia HTML/CSS/JS autocontenida, con acordeón funcionando y un ejemplo de línea en estado "Descuadre" para ver el tratamiento visual completo.
