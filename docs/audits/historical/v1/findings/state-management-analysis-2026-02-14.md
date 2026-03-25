# Hallazgos: Gestión de estado

**Documento de soporte a**: `docs/audits/nextjs-frontend-global-audit.md`  
**Fecha**: 2026-02-14

---

## Resumen

El estado se gestiona con **Context API** para estado global por dominio y con **estado local** (useState, useReducer) en componentes y hooks. No se usa Redux, Zustand ni Jotai. El “estado de servidor” (datos de API) no está separado de forma explícita: vive en hooks (useOrder, useStore, usePallet, etc.) y a veces se combina con contextos (OrderContext, StoreContext, ProductionRecordContext). No hay una capa de caché compartida (p. ej. React Query).

---

## Contextos identificados

- **SettingsContext**: Preferencias de usuario (tema, etc.).
- **BottomNavContext**: Estado de la navegación inferior (mobile).
- **OptionsContext** / **OrdersManagerOptionsContext** / **RawMaterialReceptionsOptionsContext**: Opciones para listas desplegables o filtros (entidades, almacenes, etc.).
- **OrderContext**: Datos y estado del pedido actual (usado en flujo de pedidos).
- **StoreContext**: Almacén actual y datos relacionados (almacenes, operario).
- **ProductionRecordContext**: Producción y registro de producción en edición.
- **LogoutContext**: Coordinación del cierre de sesión (evitar disparar errores 401 durante logout).

Cada contexto acota un dominio; no hay un “store” único con todo el estado.

---

## Uso de contextos

- Los providers se anidan en el layout (ClientLayout, AdminLayoutClient). El orden y las dependencias entre contextos no están documentados; en principio cada contexto es independiente.
- Los consumidores usan `useContext` o hooks propios que encapsulan el contexto (p. ej. `useOrder` puede depender de OrderContext). No se ha detectado prop drilling excesivo en los módulos revisados.
- Riesgo: muchos contextos que cambien con frecuencia pueden provocar re-renders amplios. Si un contexto guarda tanto “datos de API” como “estado de UI”, cualquier actualización fuerza re-renders en todos los consumidores. Separar “server state” (React Query) de “client state” (contexto o estado local) ayudaría.

---

## Estado local en hooks

- **useOrder**, **useStore**, **usePallet**, **useProductionRecord**, etc.: Mantienen loading, error, datos y a veces “modo edición” o flags. Ese estado es efectivamente “estado de servidor” pero gestionado a mano. No se comparte entre componentes que no usen el mismo hook con las mismas dependencias (p. ej. mismo orderId).
- **useState** en componentes: Formularios, filtros, pestañas, modales. Adecuado para estado de UI local.

No hay uso de useReducer en los archivos revisados; la complejidad se maneja con varios useState y callbacks.

---

## Estado de formularios

- **react-hook-form**: Controla el estado de formularios; los valores y errores viven en el formulario. Bien alineado con buenas prácticas; no compite con los contextos de dominio.
- **zod**: Validación; no mantiene estado, solo valida. Coherente en el proyecto.

---

## Persistencia y sincronización

- **sessionStorage**: Usado para el flag `__is_logging_out__` y posiblemente en NextAuth. No se usa para persistir estado de negocio (listados, filtros) de forma generalizada.
- **localStorage**: No revisado en detalle; el tema puede persistirse vía next-themes.
- No hay sincronización entre pestañas ni estrategia documentada de “offline” para datos de negocio.

---

## Resumen y recomendaciones

- La combinación Context + estado local en hooks es coherente y evita un store monolítico. El coste es duplicación del patrón “cargar datos → guardar en estado” y ausencia de caché.
- **Recomendación principal**: Introducir React Query (o similar) para datos de API; los contextos quedarían para estado de UI y preferencias (tenant actual, navegación, opciones de filtros que no vengan solo de la API). Así se reduce estado en contextos y se evita mezclar “datos del servidor” con “estado de cliente”.
- **Documentar**: Árbol de providers y qué contexto depende de qué; y qué estado es “global” vs “local a una ruta o pantalla”.
- **Re-renders**: Si se perciben problemas de rendimiento, revisar qué contextos exponen valores que cambian a menudo y si conviene dividir en contextos más pequeños (p. ej. “solo opciones” vs “solo datos del pedido actual”).
