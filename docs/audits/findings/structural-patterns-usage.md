# Hallazgos: Uso de patrones estructurales Next.js/React

**Documento de soporte a**: `docs/audits/nextjs-frontend-global-audit.md`  
**Fecha**: 2026-02-14

---

## Objetivo

Evaluar de forma explícita la **presencia**, **corrección** y **consistencia** de los patrones estructurales recomendados en Next.js y React en el proyecto PesquerApp.

---

## 1. Server Components vs Client Components

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | Parcial | Hay páginas async sin "use client" (admin/[entity]/page.js, productions/[id]/page.js, pallets/[id]/page.js, orders/[id]/page.js) que solo pasan config o params a un hijo cliente. |
| Corrección | Aceptable | Esas páginas no hacen fetch ni usan hooks; el patrón “Server Page → Client Child” es correcto. |
| Consistencia | Baja | La mayoría de páginas son "use client" (page.js raíz, admin/home, warehouse, auth/verify, etc.) o delegan de inmediato en un cliente que hace todo el trabajo. No hay uso de RSC para datos (fetch en servidor). |

**Conclusión**: El proyecto no sigue un modelo “server-first”. Las RSC existentes actúan como contenedores; la oportunidad es usar RSC para obtener datos iniciales y pasarlos como props.

---

## 2. Custom Hooks

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | Sí | useOrder, useStore, usePallet, useProductionRecord, useStores, useLabelEditor, useDebounce, use-mobile, useIsLoggingOut, etc. |
| Corrección | Correcta | Convención use*; encapsulan estado y efectos; dependencias en arrays de useEffect/useCallback. |
| Consistencia | Alta | Los dominios principales (pedidos, almacenes, palés, producción) tienen su hook; hay hooks de utilidad (useDebounce, use-mobile) y de PWA. |

**Conclusión**: Punto fuerte. Los hooks evitan duplicar lógica y mantienen componentes más limpios donde se usan.

---

## 3. Data Fetching

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | Manual | fetchWithTenant + servicios; llamadas desde hooks y componentes. |
| Corrección | Funcional | Loading y error manejados en cada sitio; no hay caché ni invalidación unificada. |
| Consistencia | Media | El mismo patrón (useEffect + servicio + useState) se repite; no hay librería estándar (React Query/SWR). |

**Conclusión**: Funciona pero no escala bien. Introducir una capa de “server state” (React Query) mejoraría consistencia y mantenibilidad.

---

## 4. Formularios

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | Sí | react-hook-form en formularios de entidad, pedidos, recepciones, producción, etc. |
| Corrección | Correcta | Validación con zod; errores mostrados en UI; submit manejado de forma coherente. |
| Consistencia | Alta | Mismo stack en los flujos revisados. |

**Conclusión**: Muy alineado con buenas prácticas.

---

## 5. State Management

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | Sí | Context API (Settings, Order, Store, ProductionRecord, Options, Logout, etc.); estado local en hooks y componentes. |
| Corrección | Correcta | Contextos por dominio; no hay mezcla de responsabilidades graves. |
| Consistencia | Alta | Patrón repetido; el único “pero” es que el estado de servidor no está separado (véase data fetching). |

**Conclusión**: Adecuado para estado de cliente y preferencias; recomendable separar “server state” con React Query.

---

## 6. API Layer

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | Sí | fetchWithTenant, apiRequest, servicios en src/services/. |
| Corrección | Correcta | Un punto de entrada para HTTP; tenant inyectado; manejo de errores y logout. |
| Consistencia | Alta | Las llamadas al backend pasan por esta capa. |

**Conclusión**: Bien resuelto.

---

## 7. TypeScript

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | No | Proyecto 100 % JavaScript. |
| Corrección | N/A | — |
| Consistencia | N/A | — |

**Conclusión**: La ausencia de tipos es un riesgo para refactors y evolución; se recomienda adopción progresiva.

---

## 8. UI Component Library

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | Sí | shadcn/ui (Radix), NextUI, Headless UI, Lucide. |
| Corrección | Correcta | Uso estándar de componentes. |
| Consistencia | Alta en shadcn | Base coherente; coexistencia con NextUI/Headless no documentada. |

**Conclusión**: Base sólida; documentar cuándo usar cada librería.

---

## 9. Testing

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Presencia | Mínima | 3 archivos de test; @testing-library/react usado en uno. |
| Corrección | Parcial | Test de home puede estar desactualizado (busca "home page"). |
| Consistencia | Baja | No hay estrategia ni herramienta explícita en package.json. |

**Conclusión**: Área prioritaria de mejora.

---

## 10. Layouts, Middleware, Rutas API, Error Boundaries

| Patrón | Presencia | Notas |
|--------|-----------|-------|
| Layouts | Sí | Root layout (metadata, ClientLayout); admin layout (force-dynamic, AdminLayoutClient); layouts por sección (raw-material-receptions). |
| Middleware | Sí | Auth y validación de token con tenant; redirecciones a login/unauthorized. |
| API Routes | Sí | NextAuth, submit-entity, chat. |
| error.js | Sí | Error boundary a nivel app con reset y mensaje. |
| loading.js | Sí | Varias rutas (admin/entity, products, orders, etc.). |
| not-found.js | Sí | Presente. |
| Suspense | Parcial | En Order (lazy) y auth/verify; no generalizado. |

**Conclusión**: Infraestructura de Next.js bien utilizada; Suspense se podría extender a más rutas pesadas.

---

## Resumen por patrón

- **Muy bien**: Custom hooks, formularios (react-hook-form + zod), API layer, layouts/middleware/error.
- **Aceptable pero mejorable**: Server/Client (poco uso de RSC para datos), data fetching (falta capa de caché), state management (separar server state), UI (documentar librerías).
- **Débil**: TypeScript (ausente), testing (muy poco).

Este documento complementa la sección 8 del informe global y los findings de data fetching, estado y componentes.
