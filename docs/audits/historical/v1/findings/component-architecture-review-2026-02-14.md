# Hallazgos: Arquitectura de componentes

**Documento de soporte a**: `docs/audits/nextjs-frontend-global-audit.md`  
**Fecha**: 2026-02-14

---

## Resumen

El frontend mezcla una **base de componentes reutilizables** (shadcn/ui, filtros genéricos, tablas de entidades, modales) con **componentes de dominio muy grandes** (EntityClient, Order, PalletView, formularios de recepciones/pedidos). La composición funciona bien en la capa de UI y en módulos como Entity; en pedidos, palés y producción la lógica y la UI están concentradas en pocos archivos de gran tamaño.

---

## Estructura de carpetas

- **`src/components/ui/`**: Primitivos (shadcn): button, dialog, sheet, select, table, tabs, etc. Bien agrupados y reutilizables.
- **`src/components/Admin/`**: Por dominio: Dashboard, Entity, OrdersManager, Productions, Pallets, Stores, RawMaterialReceptions, LabelEditor, ManualPunches, TimePunch, MarketDataExtractor, Settings, etc. Incluye Layout (Navbar, SideBar, BottomNav), filtros y modales genéricos.
- **`src/components/Warehouse/`**: Vistas y formularios de operario de almacén.
- **`src/components/Utilities/`**: Loader, ErrorPage, PdfUpload, LogoutDialog, etc.
- **`src/components/Shadcn/`**: Combobox, SelectionDialog (envolturas o variantes).
- **`src/components/AI/`**, **`src/components/PWA/`**: Chat y flujo de instalación PWA.

La separación por dominio es clara; el problema no es la organización en carpetas sino el tamaño de algunos archivos dentro de ellas.

---

## Composición y reutilización

- **Filtros**: `GenericFilters`, tipos (DateFilter, TextFilter, AutocompleteFilter, etc.) y modales permiten reutilizar la misma UX en varias entidades.
- **Tablas de entidad**: EntityClient + EntityTable (header, body, footer) + config por entidad permiten listados CRUD sin repetir código.
- **Modales**: GenericModal (Header, Body, Footer, Modal) y diálogos específicos (ReceptionPrintDialog, PalletDialog, etc.) siguen un patrón consistente.
- **Formularios de entidad**: CreateEntityForm y EditEntityForm reciben `config` y reutilizan la misma estructura; los formularios de pedidos, recepciones o producción son más específicos y menos genéricos.

La composición es buena donde hay abstracción (config-driven); en flujos muy específicos (Order, Pallet, Production) hay menos extracción y más “todo en uno”.

---

## Tamaño y responsabilidades

- **EntityClient** (~600+ líneas): Listado, paginación, filtros, fetch, eliminación, navegación a crear/editar. Podría separarse en: hook de datos (useEntityData), barra de acciones, tabla y modales.
- **Order** (pedido): Más de 900 líneas; pestañas, lazy components, múltiples Suspense. Candidato a dividir por pestaña o por “vista” (resumen, productos, palés, documentos, etc.) en componentes o contenedores dedicados.
- **PalletView** (~1800+ líneas): Vista/edición de palé, posiciones, almacenes. Claramente divisible en: cabecera, posiciones, movimientos, historial, etc.
- **Formularios largos**: CreateReceptionForm, EditReceptionForm, CreateOrderForm y variantes móvil tienen muchas líneas; podrían extraer pasos o secciones a subcomponentes/hooks.

En estos archivos se mezcla:
- Estado y efectos (fetch, validación).
- Lógica de negocio (cálculos, reglas).
- Render (JSX extenso con condicionales y listas).

Separar “qué datos se muestran” (hooks/servicios) de “cómo se muestran” (componentes presentacionales) mejoraría tests y mantenimiento.

---

## Server vs Client

- Casi toda la UI es Client Component (`"use client"`). Las páginas que son Server Components solo hacen de contenedor y pasan `config` o `params` a un cliente (EntityClient, ProductionClient, PalletClient, OrderClient).
- No hay componentes de página que hagan fetch en servidor y pasen datos como props al cliente; el patrón es “cliente monta → cliente hace fetch”. Para alinearse con prácticas actuales de Next.js, convendría que al menos algunas páginas (listados, detalle de solo lectura inicial) obtengan datos en el servidor y los pasen al cliente.

---

## Prop drilling y contexto

- No se observa prop drilling excesivo en los módulos revisados; los hooks (useOrder, useStore, usePallet, etc.) encapsulan estado y se usan donde hace falta.
- Hay muchos contextos (Order, Store, ProductionRecord, Settings, Options, Logout, etc.). Cada uno acota un dominio, pero el árbol de providers es grande; podría valorarse agrupar providers en un solo lugar y documentar dependencias entre contextos para evitar re-renders innecesarios o orden incorrecto.

---

## Recomendaciones

1. **Descomponer los 3–4 componentes más grandes** (EntityClient, Order, PalletView, y el más crítico de producción) en subcomponentes o vistas por pestaña/sección, y extraer lógica a hooks o servicios.
2. **Mantener y documentar** el patrón config-driven (Entity, filtros, modales) como referencia para nuevos flujos.
3. **Introducir más Server Components** en páginas que solo necesiten datos iniciales (listado, detalle de solo lectura), pasando datos como props al cliente donde haga falta interactividad.
4. **Definir convenciones** para tamaño máximo de archivo o de componente (p. ej. por líneas o por responsabilidades) y aplicarlas en code review.
