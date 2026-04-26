# Auditoría: Design System Agent
# Bloque: Pedidos - UI operativa, shadcn/ui y consistencia visual

**Fecha:** 2026-04-26
**Rol auditor:** Design System Agent
**Scope:** componentes shadcn/ui, Tailwind, densidad, responsive, iconografía y estados

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/components/Admin/OrdersManager/index.js` | Layout maestro del gestor |
| `src/components/Admin/OrdersManager/OrdersList/index.js` | Lista de pedidos |
| `src/components/Admin/OrdersManager/Order/index.js` | Layout del detalle |
| `src/components/Admin/OrdersManager/CreateOrderForm/index.js` | Formulario desktop |
| `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx` | Formulario móvil |
| `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js` | Sheet de edición |
| `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js` | Tabla/cards de líneas |
| `src/components/Admin/OrdersManager/Order/OrderDocuments/index.js` | Envío documental |
| `src/components/Field/FieldOrdersPage.jsx` | UI field list |
| `src/components/Field/FieldOrderExecutionPage.jsx` | Wizard field |

---

## 2. Resultado general

La UI es muy completa y en general usa shadcn/ui correctamente. El bloque está claramente optimizado para trabajo real: listas densas, detalle por secciones, botones táctiles en móvil y estados vacíos. Los problemas principales son inconsistencias visuales entre subflujos, uso de cards anidadas en documentos, labels HTML nativos puntuales y animación/ornamento en un formulario operativo móvil.

### Nota global: **6.7 / 10**

---

## 3. Hallazgos

| ID | Severidad | Hallazgo | Explicación del problema | Referencia | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OB05-01 | Media | `OrderDocuments` usa cards dentro de cards para destinatarios, lo que rompe la regla de no anidar cards salvo necesidad clara. | La jerarquía visual se vuelve pesada y menos escaneable en una pantalla operativa. | `src/components/Admin/OrdersManager/Order/OrderDocuments/index.js:270`, `src/components/Admin/OrdersManager/Order/OrderDocuments/index.js:278` | Convertir destinatarios en paneles/list items dentro de una sola card. | Pendiente |  |
| OB05-02 | Media | El formulario móvil de creación usa Framer Motion y un stepper circular muy elaborado para una pantalla operativa. | Añade coste visual y técnico donde el usuario necesita velocidad y foco. | `src/components/Admin/OrdersManager/CreateOrderFormMobile.jsx:211` | Simplificar stepper y mantener solo transiciones necesarias. | Pendiente |  |
| OB05-03 | Media | Hay colores arbitrarios de estado en field (`orange`, `green`, `red`) en vez de variantes/tokens compartidos. | Distintos colores para el mismo estado rompen consistencia y dificultan dark mode/accesibilidad. | `src/components/Field/FieldOrdersPage.jsx:60`, `src/components/Field/FieldOrdersPage.jsx:146` | Reutilizar `StatusBadge`/tokens compartidos para estados de pedido. | Pendiente |  |
| OB05-04 | Media | `DialogContent size="md"` depende de una extensión local no estándar de shadcn; conviene documentarlo o evitarlo. | Si el componente base cambia, tamaños no estándar pueden dejar de funcionar sin aviso. | `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:371` | Documentar tamaños custom o reemplazar por clases Tailwind explícitas. | Pendiente |  |
| OB05-05 | Baja | `OrderDocuments` usa `<label>` nativo en vez de `Label`. | Rompe la convención visual/accesible del sistema de componentes. | `src/components/Admin/OrdersManager/Order/OrderDocuments/index.js:391` | Sustituir por `Label` de shadcn/ui. | Pendiente |  |
| OB05-06 | Baja | Importaciones pegadas dificultan lectura y consistencia. | Hace más difícil revisar dependencias reales del componente. | `src/components/Admin/OrdersManager/Order/OrderDocuments/index.js:23` | Separar imports al tocar el archivo. | Pendiente |  |
| OB05-07 | Baja | Hay mezcla de error text `text-red-500` y wrappers con border red, mientras la guía del repo menciona `text-red-400 text-xs`. | Los errores se perciben distinto según pantalla aunque signifiquen lo mismo. | `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:301` | Homogeneizar estilo de errores de formulario del bloque. | Pendiente |  |

---

## 4. Puntos fuertes

- Buen uso general de `Button`, `Card`, `Table`, `Sheet`, `Dialog`, `Select`, `Combobox`, `ScrollArea` y `Badge`.
- La versión móvil del detalle tiene navegación por secciones y oculta bottom nav cuando corresponde.
- Las acciones táctiles de field tienen tamaños mínimos razonables.
- Hay estados vacíos útiles en gestor, previsión, field y errores de carga.
- Los iconos de lucide se usan de forma consistente para acciones principales.

---

## 5. Recomendaciones

1. Aplanar `OrderDocuments`: usar secciones o paneles internos sin anidar cards.
2. Revisar si el stepper animado móvil aporta eficiencia real; simplificar si no.
3. Crear utilidades/variantes de estado compartidas para pedidos y field.
4. Sustituir `<label>` nativo por `Label` en documentos.
5. Homogeneizar estilos de errores de formulario.

---

## 6. Checks manuales sugeridos

- [ ] Revisar `OrderDocuments` en desktop: cards anidadas, scroll y densidad.
- [ ] Revisar creación móvil en un dispositivo pequeño: textos, stepper, teclado y botón sticky.
- [ ] Revisar field list: colores de estado en claro/oscuro.
- [ ] Revisar detalle móvil con secciones bloqueadas en comercial read-only.
- [ ] Confirmar que botones con solo icono tienen `aria-label`.
