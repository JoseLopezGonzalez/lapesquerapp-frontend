# Auditoría global frontend Next.js/React — PesquerApp

**Proyecto**: PesquerApp (brisapp-nextjs)  
**Fecha**: 2026-02-14  
**Alcance**: Arquitectura Next.js/React, patrones estructurales, multi-tenant, mantenibilidad y evolución.

---

## 1. Resumen ejecutivo

El frontend de PesquerApp está construido con **Next.js 16** y **React 19 RC**, usando **App Router** y un modelo **multi-tenant por subdominio**. La aplicación es un ERP para el sector pesquero con flujos de documentos, almacenes, pedidos, producción y etiquetado.

**Conclusiones principales:**

- **Fortalezas**: Capa API centralizada con inyección de tenant (`fetchWithTenant`), uso consistente de react-hook-form + zod, diseño basado en shadcn/ui, múltiples contextos para dominios acotados, y middleware que valida token y tenant.
- **Debilidades estructurales**: Casi todo el árbol de UI es Client-side; no hay uso de React Query/SWR (fetch manual en hooks y componentes); ausencia de TypeScript; tests muy limitados; y componentes muy grandes en dominios complejos (pedidos, palés, producción).
- **Riesgo principal**: Data fetching sin capa de caché ni invalidación unificada, lo que dificulta consistencia y evolución hacia RSC. La exposición de una API key de Google Maps como fallback en código es un riesgo de seguridad.

La auditoría recomienda una evolución por fases: consolidar data fetching (p. ej. React Query), introducir más Server Components donde sea posible, tipar progresivamente con TypeScript y aumentar tests y documentación.

---

## 2. Identidad arquitectónica del proyecto

El proyecto sigue un estilo **SPA-like sobre App Router**: las páginas son en su mayoría Client Components o delegan de inmediato en un cliente (`EntityClient`, `ProductionClient`, `OrderClient`, etc.). La obtención de datos ocurre en el cliente (hooks y servicios que llaman a `fetchWithTenant`), no en Server Components.

- **Router**: App Router con `layout.js`, `page.js`, `loading.js`, `error.js`, `not-found.js`.
- **Rutas API**: Next.js API Routes como proxy/backend-for-frontend (`submit-entity`, `chat`, NextAuth).
- **Estado**: Context API por dominio (Order, Store, ProductionRecord, Settings, Options, Logout, etc.), sin librería global (Zustand/Redux).
- **Formularios**: react-hook-form + zod de forma generalizada.
- **UI**: Sistema basado en shadcn/ui (Radix), con Tailwind y componentes en `src/components/ui/`.

No hay una separación explícita “server-first”; el patrón dominante es “página mínima → cliente que carga todo”.

---

## 3. Fortalezas

- **Multi-tenant**: `fetchWithTenant` unifica la cabecera `X-Tenant` (servidor vía `headers()`, cliente vía `window.location.host`). El middleware valida el token contra el backend usando el mismo tenant. Existe `getCurrentTenant()` para lógica que dependa del tenant en cliente.
- **API centralizada**: Servicios en `src/services/` que usan `fetchWithTenant` y `apiRequest`; manejo de errores 401/403 y coordinación con logout (sessionStorage `__is_logging_out__`).
- **Formularios**: Uso consistente de react-hook-form y zod; validación y mensajes de error alineados en varios módulos.
- **UI**: Base sólida con shadcn/ui (new-york), variables CSS para temas, soporte PWA (manifest, splash, theme-color). Algunos componentes reutilizables (filtros genéricos, modales, tablas de entidades).
- **Layouts**: Layout raíz con metadata y ClientLayout; admin con `force-dynamic` y `AdminLayoutClient`; loading.js en varias rutas.
- **Error handling**: `error.js` global con reset y mensaje; patrones de loading/error en componentes críticos (EntityClient, ProductionView, useStore, etc.).
- **Hooks personalizados**: Varios hooks de dominio (useOrder, useStore, usePallet, useProductionRecord, useStores, etc.) encapsulan lógica y estado.

---

## 4. Riesgos o debilidades estructurales

- **Exceso de Client Components**: La mayoría de páginas y pantallas son "use client" o delegan en cliente; se aprovecha poco el modelo Server Components para datos y shell.
- **Data fetching sin caché**: No hay React Query ni SWR. Cada pantalla/hook hace su propio fetch (useEffect + useState), sin caché compartida ni invalidación centralizada. Duplicación de patrones loading/error.
- **Componentes muy grandes**: Algunos archivos superan las 1000–1800 líneas (p. ej. EntityClient, PalletView, Order), lo que dificulta pruebas y mantenimiento.
- **Sin TypeScript**: Todo en JavaScript; no hay tipado estático en API, props ni estado, lo que aumenta el riesgo de regresiones y refactors costosos.
- **Tests insuficientes**: Solo 3 archivos de test (2 en helpers, 1 en home); no hay Jest/Vitest en dependencias; la estrategia de testing no está definida.
- **Seguridad**: Clave de Google Maps como fallback en código (`OrderDetails/index.js`); variables sensibles (Azure, AI) en `NEXT_PUBLIC_*` donde no deberían exponerse en cliente si son secretos.
- **dangerouslySetInnerHTML**: Uso en editor de etiquetas (RichParagraph) y en chart; depende de que el contenido sea controlado/sanitizado para evitar XSS.

---

## 5. Alineación con prácticas Next.js/React

- **Server vs Client**: Parcial. Algunas páginas son async Server Components que solo pasan config/params (admin/[entity]/page.js, productions/[id]/page.js). El resto del árbol es cliente; no hay fetching en servidor para datos de listados o detalle.
- **Data fetching**: No alineado con recomendaciones actuales (React Query/SWR o fetch en Server Components). Patrón manual repetido en muchos sitios.
- **Custom hooks**: Bien usados para lógica reutilizable (useOrder, useStore, usePallet, etc.); convención `use*` respetada.
- **Formularios**: Muy alineado (react-hook-form + zod).
- **Estado**: Context API usado de forma coherente por dominio; no hay prop drilling excesivo en los módulos revisados, pero la cantidad de contextos puede complicar el árbol de proveedores.
- **API layer**: Bien centralizado (fetchWithTenant, apiRequest, servicios).
- **Composición**: Mezcla de componentes grandes monolíticos y otros más composables (filtros, modales, UI primitivos).

---

## 6. Diseño de componentes

- **Composición**: Los primitivos de UI (shadcn) y filtros genéricos favorecen la composición. En dominios como pedidos o palés, la lógica está concentrada en pocos componentes muy grandes.
- **Tamaño**: EntityClient, PalletView, Order y algunos formularios son demasiado grandes; convendría extraer subvistas, tabs o pasos a componentes/hooks dedicados.
- **Separación de responsabilidades**: Servicios separados de componentes; hooks encapsulan carga y estado. La mezcla de UI + lógica de negocio dentro del mismo archivo en los “mega-componentes” es el punto débil.
- **Reutilización**: Filtros, tablas de entidades, modales y formularios de entidad se reutilizan; las vistas de detalle (pedido, palé, producción) son más específicas y menos reutilizables por diseño.

---

## 7. Data fetching y estado

- **Data fetching**: Manual con `fetchWithTenant` y servicios. Los hooks (useOrder, useStore, usePallet, useProductionRecord, etc.) y componentes (EntityClient, ProductionView, warehouse page) implementan loading/error local. No hay caché ni deduplicación de requests; recargas completas al remontar o navegar.
- **Estado**: Contextos por dominio (Order, Store, ProductionRecord, Settings, Options, Logout, etc.). Estado de servidor (datos de API) y estado de cliente (UI, formularios) conviven en los mismos hooks/contextos sin una frontera clara; introducir React Query ayudaría a separar “server state” y simplificar contextos.

Véase `docs/audits/findings/data-fetching-patterns.md` y `state-management-analysis.md`.

---

## 8. Uso de patrones estructurales Next.js/React

| Patrón | Presencia | Corrección | Consistencia |
|--------|------------|------------|--------------|
| Server / Client Components | Parcial | Aceptable donde hay RSC | Baja: predominio de cliente |
| Custom Hooks | Sí | Correcta convención use* | Alta en dominios cubiertos |
| Data Fetching | Manual | Sin caché/invalidación | Repetido en muchos sitios |
| Formularios | react-hook-form + zod | Correcto | Alta |
| State Management | Context API | Correcto | Múltiples contextos |
| API Layer | fetchWithTenant + servicios | Correcto | Alta |
| TypeScript | No | N/A | N/A |
| UI Library | shadcn/ui + Radix | Consistente | Alta en primitivos |
| Testing | Mínimo | 3 archivos | Muy baja |
| Layouts / loading / error | Sí | error.js, loading.js | Aceptable |
| Suspense | Sí | En Order y auth/verify | Parcial (lazy) |

---

## 9. UI/UX y sistema de diseño

- **Consistencia**: shadcn/ui (new-york) con Tailwind y variables CSS; tema claro/oscuro (next-themes). Componentes en `src/components/ui/` siguen el mismo patrón.
- **Coexistencia**: NextUI y Headless UI aparecen en partes concretas; no hay conflicto grave pero convendría documentar cuándo usar cada uno para evitar fragmentación.
- **PWA**: Manifest, splash screens, theme-color y lógica de instalación (hooks PWA) bien integrados.
- **Responsive**: Uso de layouts y componentes adaptativos (BottomNav, NavigationSheet, formularios móvil/desktop en pedidos).

Véase `docs/audits/findings/ui-design-system-review.md`.

---

## 10. TypeScript y seguridad de tipos

- **Adopción**: El proyecto es 100 % JavaScript (`.js`/`.jsx`). `components.json` tiene `tsx: false`.
- **Consecuencias**: Sin tipos en respuestas de API, props ni estado; refactors y detección de errores dependen de pruebas manuales y de regresión. La evolución hacia más RSC y datos en servidor se beneficiaría de tipos compartidos con el backend.

---

## 11. Rendimiento y optimización

- **Bundle**: No evaluado en esta auditoría; la cantidad de "use client" y de dependencias (Recharts, xyflow, xlsx, etc.) sugiere que convendría revisar code-splitting y lazy loading.
- **Lazy loading**: Uso de `lazy` + `Suspense` en Order (varias pestañas/secciones); loading.js en rutas; no hay uso sistemático de dynamic import en otras rutas.
- **Re-renders**: Sin medición; múltiples contextos pueden provocar re-renders amplios si el valor del contexto cambia con frecuencia. React Query reduciría necesidad de estado global para datos de API.

---

## 12. Testing y mantenibilidad

- **Cobertura**: Muy baja. Solo 3 archivos: `receptionCalculations.test.js`, `receptionTransformations.test.js`, `home/page.test.js`. El test de home depende del contenido “home page” y puede estar desactualizado.
- **Herramientas**: Uso de `@testing-library/react` en el test de home; Jest/Vitest no figuran en `package.json` (posible dependencia transitiva o script externo).
- **Mantenibilidad**: Buena estructura de carpetas (app, components, hooks, services, context, lib); riesgo en componentes muy grandes y falta de tipos y tests para refactors seguros.

---

## 13. Accesibilidad y experiencia de usuario

- **A11y**: Uso de atributos `aria-*` y `role` en varios componentes (paginación, combobox, filtros, tabla, calendar, sidebar, alertas). Radix aporta semántica y teclado en muchos primitivos. No se ha realizado auditoría WCAG completa.
- **UX**: Mensajes de error unificados (userMessage), estados de carga con Loader, ErrorPage con reset; flujos de login y tenant claros.

---

## 14. Seguridad

- **Variables de entorno**: Uso de `NEXT_PUBLIC_*` para API base, Google Maps, Azure Document AI. La API key de Google Maps tiene un fallback hardcodeado en `OrderDetails/index.js`, lo que supone un riesgo si el repo es público o se filtra.
- **Secrets**: NEXTAUTH_SECRET y AI_MODEL usados en servidor (middleware, API route); correcto no exponerlos en cliente.
- **XSS**: Uso de `dangerouslySetInnerHTML` en RichParagraph (etiquetas) y en chart; el contenido debe ser controlado y/o sanitizado.
- **Autenticación**: NextAuth con validación de token en middleware y comprobación de tenant; redirección a login y manejo de 401/403 coherente.

---

## 15. Oportunidades de mejora (priorizadas)

1. **Introducir React Query (o similar)** para estado de servidor: caché, invalidación y menos código repetido de loading/error (alto impacto, esfuerzo medio).
2. **Eliminar o externalizar la API key de Google Maps** del código; usar solo variable de entorno (alto impacto, bajo esfuerzo).
3. **Aumentar el uso de Server Components**: al menos para shell y datos iniciales de listados/detalle donde no haga falta interactividad inmediata (alto impacto, esfuerzo medio-alto).
4. **Tipado progresivo con TypeScript**: empezar por API y modelos compartidos, luego componentes críticos (medio impacto, esfuerzo alto).
5. **Dividir componentes gigantes** (EntityClient, PalletView, Order) en subcomponentes o vistas por pestaña/paso (medio impacto, esfuerzo medio).
6. **Definir estrategia de tests**: añadir Jest o Vitest, tests de integración para flujos críticos y de componentes para UI reutilizable (medio impacto, esfuerzo medio).
7. **Revisar uso de NEXT_PUBLIC_*** para Azure/AI: asegurar que solo se exponen variables necesarias en cliente (medio impacto, bajo esfuerzo).
8. **Sanitización de HTML** donde se use `dangerouslySetInnerHTML` (medio impacto, bajo esfuerzo).
9. **Documentar cuándo usar shadcn vs NextUI vs Headless** para evitar mezclas innecesarias (bajo impacto, bajo esfuerzo).
10. **Suspense/lazy**: extender el uso de lazy + Suspense a otras rutas pesadas para mejorar tiempo de carga percibido (bajo impacto, esfuerzo bajo-medio).

---

## 16. Trayectoria de evolución sugerida

- **Fase 1 (corto plazo)**: Corregir seguridad (Google Maps key, revisión NEXT_PUBLIC_*, sanitización HTML). Añadir React Query y migrar 1–2 flujos piloto (p. ej. listado de entidades o almacenes).
- **Fase 2 (medio plazo)**: Aumentar Server Components para páginas de listado y detalle que no requieran interactividad inmediata; tipar contratos de API y modelos compartidos con TypeScript; descomponer 1–2 componentes grandes (Order o PalletView).
- **Fase 3 (largo plazo)**: Estrategia de testing (unit + integración), documentación de arquitectura y de sistema de diseño; optimización de bundle y lazy loading donde sea necesario.

---

## Entregables finales

- **Top 5 riesgos sistémicos**: Ver sección siguiente.
- **Top 5 mejoras de mayor impacto**: Ver sección 15 (ítems 1–5).
- **Puntuación de madurez**: Ver framework más abajo.
- **Documentos de hallazgos**: `docs/audits/findings/` (multi-tenancy, componentes, data fetching, estado, UI, patrones estructurales).

---

## Top 5 riesgos sistémicos

1. **Data fetching sin caché**: Inconsistencia de datos entre pantallas, recargas innecesarias y dificultad para evolucionar a un modelo server-first.
2. **Exposición de clave de Google Maps** (y posiblemente otros secretos en NEXT_PUBLIC_): Riesgo de abuso y coste si el repositorio es accesible.
3. **Ausencia de TypeScript**: Refactors y cambios en API más costosos y propensos a regresiones.
4. **Componentes monolíticos**: Dificultan pruebas, revisión y onboarding; acoplan UI y lógica.
5. **Cobertura de tests mínima**: Cambios sin red de seguridad automatizada; riesgo en despliegues y evolución.

---

## Framework de madurez arquitectónica (1–10)

| Dimensión | Puntuación | Comentario |
|-----------|------------|------------|
| Multi-tenant | 8 | Tenant en headers, middleware y getCurrentTenant bien integrados; falta posible contexto React de tenant para UI. |
| Arquitectura de componentes | 5 | Buena base en UI y servicios; componentes muy grandes y poca separación en dominios complejos. |
| Data fetching y estado | 4 | API y servicios bien; sin caché, sin invalidación, patrón repetitivo. |
| TypeScript | 1 | No adoptado. |
| UI / design system | 7 | shadcn/ui consistente; coexistencia con NextUI/Headless sin documentar. |
| Rendimiento y optimización | 5 | Algunos lazy/Suspense; mucho cliente y dependencias pesadas sin análisis de bundle. |
| Testing | 2 | 3 archivos; sin estrategia ni herramienta explícita. |
| Accesibilidad | 5 | Uso de aria/role y Radix; sin auditoría WCAG. |
| Documentación | 5 | Docs y prompts presentes; falta documentación de arquitectura y decisiones. |
| Deuda técnica | 5 | Estructura clara; componentes grandes, JS sin tipos y datos en cliente acumulan deuda. |

**Puntuación global ponderada**: **~4,7 / 10** (promedio aproximado; se puede afinar con pesos por prioridad de negocio).

---

*Documento generado en el marco de la auditoría frontend Next.js/React. Detalle por área en `docs/audits/findings/`.*
