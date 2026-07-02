# Parking de Ideas — La PesquerApp

Backlog ligero de ideas, bugs y features sueltas. Sin protocolo de clarificación —
solo captura rápida. Cuando una idea esté lista para convertirse en trabajo real,
se promociona a GAP vía `/ideas promote [NNN]`, que dispara el flujo completo de
`gap-discovery`.

**No confundir con `.claude/gaps/`** — un GAP es una unidad de trabajo verificable
y lista para implementar; una idea aquí es solo una nota para no perderla.

---

## 🅿️ Parked

### IDEA-001 — Creador de pedidos: no se puede elegir tipo de pedido
- **Fecha:** 2026-07-02
- **Tipo:** Bug
- **Módulo:** Ventas
- **Descripción:** En el creador de pedidos no hay forma de seleccionar el tipo de pedido.

### IDEA-002 — Creador de pedidos: no permite adjuntos desde el inicio
- **Fecha:** 2026-07-02
- **Tipo:** Bug
- **Módulo:** Ventas
- **Descripción:** Al crear un pedido no se pueden añadir adjuntos ya de primeras, hay que hacerlo después.

### IDEA-003 — Creador de pedidos: obliga a líneas de previsión sin necesidad
- **Fecha:** 2026-07-02
- **Tipo:** Bug
- **Módulo:** Ventas
- **Descripción:** El creador obliga siempre a elegir líneas de previsión de productos, incluso cuando no debería ser obligatorio.

### IDEA-004 — Editor de pedido no refresca otras secciones al cambiar un campo
- **Fecha:** 2026-07-02
- **Tipo:** Bug
- **Módulo:** Ventas
- **Descripción:** Al actualizar líneas de previsión, palets vinculados u otros campos del pedido, el resto de secciones (p.ej. detalle de productos) no se refrescan. El editor de pedido debería actualizarse por completo tras cualquier cambio.

### IDEA-005 — Chip de editar pedido abre sin estado de carga
- **Fecha:** 2026-07-02
- **Tipo:** Bug
- **Módulo:** Ventas
- **Descripción:** Al abrir el chip de editar pedido no hay un estado de carga que espere a que los datos lleguen del backend; se abre de golpe con los inputs sin rellenar correctamente y con errores.

---

## ✅ Promoted

<!-- Las ideas promocionadas se mueven aquí con el enlace al GAP resultante -->

---

## Formato de entrada

```
### IDEA-NNN — [Título breve, máx 8 palabras]
- **Fecha:** YYYY-MM-DD
- **Tipo:** Bug | Feature | Mejora | Refactor
- **Módulo:** Ventas | Stock | Etiquetas | CRM | Proveedores | Maquiladores | Mobile | Global
- **Descripción:** [1-2 líneas — el problema u oportunidad, sin desarrollar la solución]
```
