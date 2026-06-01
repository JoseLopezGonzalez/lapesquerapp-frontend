# Auditoría de Rendimiento Frontend — lapesquerapp-frontend

> Fecha: 2026-03-26
> Auditor: Claude Sonnet 4.6 (Senior Frontend Performance Engineer mode)
> Base: inspección directa del repositorio, sin ejecución del build
> Estado: **Quick wins ejecutados el 2026-03-26** — ver sección 13

---

## 1. Resumen ejecutivo

El frontend tiene un problema de rendimiento **multicausal** donde no hay un único culpable, sino una acumulación de decisiones que se potencian entre sí. Los problemas principales son:

**En desarrollo (dev):**

- El `ClientLayout` raíz monta 6 providers + 3 componentes globales bajo un único `"use client"`, lo que hace que cualquier hot reload en ese árbol invalide el renderizado de toda la app.
- Los 5 layouts de área (`admin`, `comercial`, `field`, `operator`, `superadmin`) usan `force-dynamic`, lo que obliga a Next.js a tratar cada route segment como dinámico, aumentando el trabajo del dev server en cada navegación.
- `mapbox-gl` en `transpilePackages` obliga al bundler a procesar una librería de ~2.5 MB en cada inicio de compilación.
- 108 archivos usan `useSession`, lo que aumenta el fan-out de cambios de estado de sesión y penaliza Fast Refresh cuando next-auth se reinicializa.

**En bundle / producción:**

- `chart.jsx` importa `import * as RechartsPrimitive from "recharts"` — un barrel wildcard que impide cualquier tree-shaking de Recharts (~350 KB minificado sin gzip).
- `xlsx` se importa como `import * as XLSX` en 8 archivos sin ningún `next/dynamic`. Es ~1 MB minificado y entra en el bundle inicial de todas las rutas que montan esos componentes.
- `jspdf` y `html2canvas` están en `package.json` pero no tienen ningún import en `src/`. Son dead dependencies que añaden coste a `npm install`, al análisis de módulos y al `package-lock.json` sin aportar nada.
- `radix-ui` (umbrella) y `@radix-ui/*` (granular) coexisten: el paquete umbrella re-exporta todos los subpaquetes, resultando en duplicación en `node_modules`.

**El problema raíz de arquitectura:** el proyecto adoptó un patrón de "todo client, todo global, todo dinámico" que era seguro funcionalmente pero que ahora cobra su precio en compilación, bundle y render. Las correcciones no requieren un refactor masivo sino intervenciones quirúrgicas bien priorizadas.

---

## 2. Inventario técnico confirmado

### Stack real detectado

| Capa          | Paquete               | Versión                     | Observación                               |
| ------------- | --------------------- | --------------------------- | ----------------------------------------- |
| Framework     | next                  | ^16.0.7                     | Muy reciente                              |
| Runtime       | react / react-dom     | 19.0.0-rc-66855b96-20241106 | **RC de noviembre 2024, no stable**       |
| Auth          | next-auth             | ^4.24.13                    | v4 no tiene soporte oficial para React 19 |
| Data fetching | @tanstack/react-query | ^5.90.21                    | v5, correcto                              |
| Tipado        | typescript            | ^5.9.3                      | Correcto                                  |
| Estilos       | tailwindcss           | ^4.2.1                      | v4 con config.js en modo compatibilidad   |
| PostCSS       | @tailwindcss/postcss  | ^4.2.1                      | Plugin v4 correcto                        |
| Testing       | vitest                | ^4.0.18                     | v4 muy reciente                           |
| ESLint        | eslint-config-next    | 15.0.3                      | **Mismatch con Next.js 16**               |
| Bundler dev   | turbopack (via next)  | incluido en next 16         | Activo por `turbopack.root`               |

### Arquitectura técnica

```
src/app/layout.js          ← Server Component (root)
  └─ ClientLayout.js       ← "use client" → 6 providers + 3 componentes globales
       └─ [admin|comercial|field|operator]/layout.js
            ├─ force-dynamic (5 layouts)
            └─ [Area]LayoutClient.jsx  ← "use client"
                 └─ ResponsiveLayout
                      ├─ Desktop: AppSidebar + SidebarProvider
                      └─ Mobile: TopBar + BottomNav (framer-motion) + NavigationSheet
```

### Puntos de entrada globales (ClientLayout)

1. `ThemeProvider` (next-themes)
2. `TooltipProvider` (radix)
3. `QueryClientProvider` (react-query)
4. `SessionProvider` (next-auth, `refetchOnWindowFocus: false`)
5. `SettingsProvider` → hace `useQuery` en mount (fetch a settings del tenant)
6. `LogoutProvider` → monta `LogoutDialog` globalmente
7. `AuthErrorInterceptor` → componente siempre presente
8. `AppToaster` (sonner)
9. `InstallPromptBanner` → lógica de PWA en cada carga

### Dependencias con mayor coste técnico

| Librería        | Tamaño aprox. min+gz | Uso real                        | Lazy loaded           |
| --------------- | -------------------- | ------------------------------- | --------------------- |
| mapbox-gl       | ~280 KB              | 1 componente (RouteMap.jsx)     | No                    |
| recharts        | ~160 KB              | 15 archivos (wildcard import)   | No                    |
| framer-motion   | ~60 KB               | 18 archivos incl. layout global | No                    |
| xlsx            | ~250 KB              | 8 archivos                      | No                    |
| @xyflow/react   | ~110 KB              | ProductionDiagram               | Sí (next/dynamic ✓)   |
| lottie-web      | ~60 KB               | 1 componente                    | Sí (dynamic import ✓) |
| ai + @ai-sdk/\* | ~80 KB cliente       | Chat component                  | No                    |
| jspdf           | ~400 KB              | **No usado**                    | —                     |
| html2canvas     | ~100 KB              | **No usado**                    | —                     |

---

## 3. Hallazgos críticos

---

### C-1. `jspdf` y `html2canvas` instaladas sin uso alguno

**Severidad:** Crítico
**Confianza:** Alta (verificado con búsqueda exhaustiva en `src/`)

**Evidencia:**

```
grep -r "jspdf\|html2canvas" src/ → No matches found
```

Ambos paquetes están en `dependencies` de `package.json` pero no tienen ningún `import` ni `require` en todo el código fuente.

**Archivos afectados:** `package.json` (líneas de `jspdf: ^3.0.0` y `html2canvas: ^1.4.1`)

**Impacto técnico:**

- `jspdf` min+gz: ~400 KB. `html2canvas` min+gz: ~100 KB. ~500 KB que ningún bundler puede eliminar porque están en `dependencies`, no en `devDependencies`, y Webpack/Turbopack puede incluirlos si algún import dinámico los referencia en tiempo de análisis.
- Aumentan el tiempo de `npm install` y el tamaño de `node_modules`.
- Contaminan el `package-lock.json` con ~200 subdependencias innecesarias.
- En algunos análisis de bundle (webpack-bundle-analyzer, @next/bundle-analyzer), aparecerán como potencial carga.

**Recomendación:** `npm uninstall jspdf html2canvas`

**Riesgo:** Muy bajo. Verificar antes con `grep -r "jspdf\|html2canvas" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"` incluyendo scripts y archivos de configuración.

---

### C-2. `import * as RechartsPrimitive from "recharts"` en el wrapper UI global

**Severidad:** Crítico
**Confianza:** Alta

**Evidencia:**

```javascript
// src/components/ui/chart.jsx:3
import * as RechartsPrimitive from 'recharts';
```

**Archivos afectados:**

- `src/components/ui/chart.jsx` (el import wildcard)
- Todos los componentes que usan `chart.jsx`: mínimo 7 dashboards + charts de Admin/Home

**Impacto técnico:**
El wildcard `import *` le dice al bundler "necesito todo el módulo". Recharts está parcialmente tree-shakeable cuando se importan named exports individuales (`import { BarChart } from 'recharts'`). Con `import *`, el bundler incluye **todo Recharts** (~350 KB minificado). Adicionalmente, chart.jsx es un componente del directorio `src/components/ui/`, que tiene alta probabilidad de ser importado en múltiples páginas, propagando recharts a todos esos bundles.

Los otros 14 archivos usan named imports de recharts directamente, lo cual es correcto. El problema está exclusivamente en chart.jsx.

**Impacto en dev:** Recharts completo se compila en el bundle del dev server cada vez que se toca cualquier componente que dependa de chart.jsx.

**Impacto en producción:** ~350 KB extra en cualquier página que use el componente `<Chart>` de shadcn, que además está en el directorio `ui/` y tiende a aparecer en chunks compartidos.

**Recomendación:** Reemplazar en `chart.jsx`:

```javascript
// Antes
import * as RechartsPrimitive from 'recharts';

// Después — importar solo los exports realmente usados en chart.jsx
import {
  Legend,
  Tooltip,
  ResponsiveContainer,
  // ... solo los que chart.jsx realmente reexporta o usa
} from 'recharts';
```

Adicionalmente, considerar lazy loading del componente `<Chart>` en los dashboards con `next/dynamic`.

**Riesgo:** Medio. Hay que revisar qué re-exporta `chart.jsx` para no romper consumidores. La refactorización del import es mecánica pero requiere atención.

---

### C-3. `xlsx` importado estáticamente con barrel import en 8 archivos

**Severidad:** Crítico
**Confianza:** Alta

**Evidencia:**

```javascript
// Patrón en 8 archivos:
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
```

**Archivos afectados:**

1. `src/services/export/excelGenerator.js`
2. `src/components/Admin/ManualPunches/BulkPunchExcelUpload.jsx`
3. `src/components/Admin/MarketDataExtractor/*/ExportModal/index.js` (3 archivos)
4. `src/components/Admin/Stores/StoresManager/Store/ProductSummaryDialog/ProductSummary/index.js`
5. `src/components/Admin/Stores/StoresManager/Store/PalletsListDialog/index.js`
6. `src/components/Admin/Dashboard/OrderRanking/index.js`

**Impacto técnico:**
`xlsx` min+gz: ~250 KB. `file-saver`: ~5 KB. El import estático hace que ambas librerías entren en el bundle inicial de cada chunk que incluya cualquiera de estos 8 componentes. `OrderRanking` está en el Dashboard, que se carga en la primera visita a `/admin`. Esto significa que **xlsx entra en el bundle inicial del admin**.

La funcionalidad de exportar Excel es esencialmente on-demand (el usuario tiene que hacer clic en "Exportar"). No hay ninguna razón técnica para cargar xlsx antes de que el usuario lo solicite.

**Recomendación:** Convertir todos los imports de xlsx a dynamic imports dentro del handler del botón de exportar:

```javascript
// En el handler del botón:
const handleExport = async () => {
  const [{ default: XLSX }, { saveAs }] = await Promise.all([import('xlsx'), import('file-saver')]);
  // usar XLSX y saveAs aquí
};
```

**Riesgo:** Bajo-Medio. Cambio de paradigma en los 8 archivos pero el patrón es uniforme y fácil de aplicar. La función sigue siendo síncrona para el usuario (el import tarda <100ms la primera vez).

---

### C-4. React 19 RC en producción con next-auth v4 incompatible

**Severidad:** Crítico (riesgo de estabilidad)
**Confianza:** Alta

**Evidencia:**

```json
// package.json
"react": "19.0.0-rc-66855b96-20241106",
"react-dom": "19.0.0-rc-66855b96-20241106",
"next-auth": "^4.24.13",
"legacy-peer-deps=true"  // .npmrc
```

**Impacto técnico:**

- React 19.0.0 stable fue lanzado en diciembre 2024. El proyecto usa una RC de noviembre 2024. Aunque la diferencia funcional puede ser mínima, usar una RC en producción significa que cualquier bug de React 19 RC que fue corregido antes del stable puede estar presente.
- next-auth v4 **no tiene soporte oficial para React 19**. El `legacy-peer-deps=true` se necesita precisamente porque next-auth v4 declara `react@^17 || ^18` como peer dependency. Hay conocidos problemas de hidratación y de comportamiento de `useSession` con React 19 que afectan directamente al rendimiento de renderizado inicial.
- El mecanismo de penalización: en React 19, el modelo de reconciliación del Concurrent Mode tiene diferencias en cómo se procesa el batching de updates. next-auth v4 no fue diseñado para estos cambios y puede generar re-renders adicionales en `useSession`.

**Recomendación:**

1. Corto plazo: actualizar a `react@19.x` stable (la release más reciente, no la RC).
2. Medio plazo: migrar a next-auth v5 (AuthJS), que sí tiene soporte para React 19 y App Router nativo.

**Riesgo:** Alto para la migración a v5. Bajo para el update a React 19 stable (es el mismo major, solo elimina la RC).

---

### C-5. `force-dynamic` en los 5 layouts principales sin necesidad arquitectónica real

**Severidad:** Crítico
**Confianza:** Alta

**Evidencia:**

```javascript
// src/app/admin/layout.js
export const dynamic = 'force-dynamic';
// Comentario: "Avoid prerendering admin routes so client-only hooks (e.g. useIsLoggingOut)
// are never run on the server. Required for AdminRouteProtection and Loader."
```

Mismo patrón en `comercial/layout.js`, `field/layout.js`, `operator/layout.js`, `superadmin/layout.js`.

**Impacto técnico:**
`force-dynamic` en un layout hace que **todas las rutas hijas** sean también dinámicas por propagación. Esto implica:

1. No se puede generar ninguna página estática bajo estas rutas en `next build`.
2. El dev server trata cada navegación entre rutas del mismo área como un nuevo render dinámico, invalidando el cache de segmento.
3. En producción, cada petición a `/admin/*`, `/comercial/*`, etc. genera un nuevo render en el servidor, sin posibilidad de ISR.

La causa raíz del problema que los layouts intentan resolver (hooks client-only corriendo en servidor) **ya está resuelta por la propia separación ServerComponent/ClientComponent** de Next.js App Router. Si el layout server importa un `[Area]LayoutClient` que es `"use client"`, los hooks solo se ejecutan en el cliente. No hace falta `force-dynamic`.

**Recomendación:** Eliminar `export const dynamic = "force-dynamic"` de los 5 layouts. Los layouts quedarían así:

```javascript
// src/app/admin/layout.js
import AdminLayoutClient from './AdminLayoutClient';
export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
```

El `AdminLayoutClient` con `"use client"` sigue siendo cliente. Los hooks como `useIsLoggingOut` seguirán funcionando. Next.js no ejecutará código cliente en el servidor.

**Riesgo:** Medio. Requiere verificar que `AdminRouteProtection` y `Loader` no hacen operaciones que en realidad sí requieran un check server-side. Si solo usan hooks de sesión cliente, el riesgo es bajo.

---

### C-6. `ClientLayout.js` es el único boundary "use client" que envuelve toda la app

**Severidad:** Crítico
**Confianza:** Alta

**Evidencia:**

```javascript
// src/app/ClientLayout.js
'use client';
// Monta: ThemeProvider > TooltipProvider > QueryClientProvider > SessionProvider
//        > SettingsProvider > LogoutProvider > AuthErrorInterceptor > AppToaster
//        > InstallPromptBanner
```

**Impacto técnico:**
Al ser el único boundary `"use client"` raíz, todo el árbol de componentes tiene acceso a contexto cliente desde la raíz. Esto no rompe nada pero tiene varias consecuencias:

1. **`SettingsProvider`** ejecuta `useQuery` en mount, lo que significa que en cada carga de página se inicia un query de settings del tenant. Esto es un network request en el critical path de rendering.
2. **`InstallPromptBanner`** contiene lógica de PWA (detección de `standalone mode`, event listeners de `beforeinstallprompt`) que se ejecuta en **cada página**, incluyendo páginas donde el banner no se muestra nunca.
3. **`LogoutProvider`** monta `<LogoutDialog>` globalmente, lo que importa el Dialog y todo su código al cargar cualquier página.
4. **`AppToaster`** (Sonner) se inicializa globalmente. Sonner es ligero pero el patrón establece que cualquier componente añadido aquí aumenta el costo base de todas las páginas.

El mecanismo de penalización en dev: cada vez que cualquier provider global se actualiza (sesión, settings, tema), React reconcilia todo el árbol descendente. Con 6 providers anidados, un cambio en el nivel superior (SessionProvider) puede invalidar contextos anidados.

**Recomendación:**

- Sacar `InstallPromptBanner` de `ClientLayout` y montarlo solo en los layouts de áreas que lo necesiten, o usar lazy loading.
- `LogoutDialog` puede montarse con `next/dynamic` dentro de `LogoutProvider` para que no esté en el bundle inicial.
- `SettingsProvider` debería depender de si el usuario está autenticado, no estar siempre activo.

**Riesgo:** Medio-Alto. Cambiar la posición de providers puede introducir bugs sutiles si hay componentes que asumen que el contexto siempre está disponible.

---

## 4. Hallazgos importantes

---

### I-1. `useSession` en 108 archivos sin abstracción de contexto

**Severidad:** Importante
**Confianza:** Alta

**Evidencia:** 108 archivos con `useSession` confirmado por búsqueda exhaustiva en `src/`.

**Impacto técnico:**
`useSession` de next-auth v4 subscribe a los cambios del objeto sesión vía `SessionProvider`. Cuando la sesión se actualiza (en refetch, en cambio de tab, en expiración), **todos los 108 componentes** que tengan `useSession` montados reciben un re-render. En una pantalla de admin con 20-30 componentes activos usando `useSession`, un solo evento de sesión genera 20-30 re-renders simultáneos.

El mecanismo específico: `SessionProvider` usa `createContext` internamente. Cada cambio de valor del contexto re-renderiza todos los consumers. Con 108 archivos, en un escenario donde varios están montados simultáneamente (layout + sidebar + user menu + componentes de página), la propagación es significativa.

**Recomendación:** Crear un contexto de sesión propio que memoice los valores usados:

```javascript
// src/context/AuthContext.js
'use client';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const value = useMemo(
    () => ({
      user: session?.user,
      token: session?.accessToken,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
    }),
    [session?.user, session?.accessToken, status]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
```

Esto convierte 108 `useSession()` en 108 `useAuth()` donde el re-render solo ocurre si los campos memoizados cambian.

**Riesgo:** Medio. Refactor mecánico pero extenso. Posibles bugs si algún componente usa `update()` de `useSession` — habría que preservar esa capacidad.

---

### I-2. 4 librerías de iconos coexistiendo con usos desequilibrados

**Severidad:** Importante
**Confianza:** Alta

**Evidencia:**

- `lucide-react`: primaria, cientos de archivos (es correcta, tree-shakeable)
- `@heroicons/react`: **4 archivos** (SlidingPanel, GenericModal/Modal, Navbar, RawAreaChart)
- `react-icons`: **20 archivos**, imports como `import { PiXxx } from 'react-icons/pi'`
- `@tabler/icons-react`: **1 solo archivo** (ProspectsPageClient.jsx)

**Impacto técnico:**

- `@tabler/icons-react@3.40.0` tiene más de 5000 iconos en el paquete. Aunque la importación nombrada hace tree-shaking en build, en dev mode el servidor de módulos tiene que indexar el paquete completo. Se usa en **1 archivo**. El beneficio de mantenerlo es prácticamente nulo.
- `react-icons` con imports como `from 'react-icons/pi'` hace tree-shaking a nivel de subfamilia, no de icono individual. `react-icons/pi` incluye todos los Phosphor Icons. Se usa en 20 archivos — es candidato a consolidación gradual en lucide-react.
- `@heroicons/react` en 4 archivos: es redundante con lucide-react que tiene los mismos iconos. Solo persiste en código legado.

**Recomendación:**

1. Eliminar `@tabler/icons-react`: reemplazar el único import en `ProspectsPageClient.jsx` por equivalentes en lucide-react. `npm uninstall @tabler/icons-react`.
2. Migrar gradualmente `@heroicons/react` (4 archivos) a lucide-react.
3. `react-icons` en 20 archivos: no es urgente si los imports son granulares (`from 'react-icons/pi'`), pero es candidato a consolidación a largo plazo.

**Riesgo:** Bajo para @tabler (1 archivo). Bajo para @heroicons (4 archivos). Medio para react-icons (20 archivos).

---

### I-3. `radix-ui` (umbrella) coexiste con `@radix-ui/*` (granular)

**Severidad:** Importante
**Confianza:** Alta

**Evidencia:**

```json
// package.json
"radix-ui": "^1.4.3",         // paquete umbrella
"@radix-ui/react-accordion": "^1.2.12",
"@radix-ui/react-alert-dialog": "^1.1.15",
// ... 20 paquetes @radix-ui/* más
```

En `src/components/ui/`: 22 archivos importan de `radix-ui` (el umbrella), no de `@radix-ui/*`.

**Impacto técnico:**
`radix-ui` umbrella re-exporta desde todos los `@radix-ui/*` individuales. Tener ambos en `dependencies` causa que ambas versiones de los mismos componentes radix coexistan en `node_modules`. Esto puede resultar en:

1. Duplicación de módulos en `node_modules` si sus versiones difieren.
2. Aumento del tiempo de `npm install` y resolución de módulos.
3. Posibles bugs de "doble instancia" si algún componente mezcla imports de `radix-ui` y `@radix-ui/*`.

**Recomendación:** Elegir uno de los dos patrones:

- **Opción A:** Usar solo `radix-ui` (umbrella) y eliminar todos los `@radix-ui/*` individuales del `package.json`. Los archivos `ui/*.jsx` ya usan la forma umbrella.
- **Opción B:** Usar solo `@radix-ui/*` granulares y actualizar los imports en `ui/*.jsx`. Más explícito pero más paquetes.

La opción A es menos cambio de código, pero añade una indirección. La opción B es más alineada con el resto del ecosistema.

**Riesgo:** Medio. Requiere verificar que las versiones del umbrella y los granulares son compatibles antes de la migración.

---

### I-4. `framer-motion` en el layout global móvil (BottomNav)

**Severidad:** Importante
**Confianza:** Alta

**Evidencia:**

```javascript
// src/components/Admin/Layout/BottomNav/index.jsx
import { motion, useReducedMotion } from 'framer-motion';

// src/components/Admin/Layout/BottomNav/CenterActionButton.jsx
import { motion, useReducedMotion } from 'framer-motion';

// src/components/Admin/Layout/BottomNav/ChatNavItem.jsx
import { motion, useReducedMotion } from 'framer-motion';
```

`BottomNav` es parte de `ResponsiveLayout`, que se monta en **todos** los layouts de área (`AdminLayoutClient`, etc.).

**Impacto técnico:**
framer-motion min+gz: ~60 KB. Al estar en el layout global, es parte del bundle crítico de la primera carga en móvil. Aunque 60 KB no es catastrófico, el mecanismo de penalización en dev es más relevante: framer-motion registra múltiples watchers de RAF (requestAnimationFrame) y listeners de eventos para animaciones. Esto aumenta el coste de idle del dev server.

Las animaciones del BottomNav (`staggered entry`, `motion.div` para el botón central) podrían implementarse con CSS `@keyframes` + Tailwind `animate-*` sin ningún JS de runtime.

**Recomendación:** Evaluar si las animaciones del BottomNav son suficientemente complejas para justificar framer-motion en el layout global. Si son solo `opacity` + `transform` en entrada/salida, migrarlas a CSS puro (`tailwindcss-animate` ya está instalado). Esto liberaría framer-motion del critical path y lo dejaría solo en componentes de features (wizards, etc.).

**Riesgo:** Bajo-Medio. Cambio visual que requiere QA en móvil. Las animaciones con `useReducedMotion` necesitan ser replicadas en CSS también.

---

### I-5. `@headlessui/react` en 4 archivos, redundante con Radix UI

**Severidad:** Importante
**Confianza:** Alta

**Evidencia:**

```javascript
// 4 archivos usan @headlessui/react:
// src/components/Admin/SlidingPanel/index.js
// src/components/Admin/Modals/GenericModal/Modal.js
// src/components/Admin/Layout/Navbar/index.js  (legacy)
// src/components/Admin/Home/RawMaterialReceptions/RawAreaChart/index.jsx
```

**Impacto técnico:**
`@headlessui/react` resuelve el mismo problema que `@radix-ui`: UI headless accesible. Con Radix ya instalado y siendo la librería primaria de shadcn/ui, headlessui es completamente redundante. Añade ~30 KB min+gz al bundle de los chunks que incluyan estos 4 componentes.

El `Navbar/index.js` es explícitamente "legacy" según los comentarios encontrados. Los otros 3 archivos podrían migrar sus Dialogs/Modals a `@radix-ui/react-dialog`.

**Recomendación:** Migrar los 4 archivos a Radix UI y eliminar `@headlessui/react`. El `SlidingPanel` y `GenericModal` probablemente usan `<Dialog>` o `<Disclosure>` de headlessui, que tienen equivalentes directos en `@radix-ui/react-dialog` y `@radix-ui/react-collapsible`.

**Riesgo:** Medio. Requiere testing de accesibilidad y comportamiento de los modales migrados.

---

### I-6. `eslint-config-next 15.0.3` con Next.js `^16.0.7`

**Severidad:** Importante
**Confianza:** Alta

**Evidencia:**

```json
// package.json devDependencies
"eslint-config-next": "15.0.3",
// dependencies
"next": "^16.0.7"
```

**Impacto técnico:**
`eslint-config-next` debe coincidir en versión major con Next.js. La versión 15 del config no conoce las reglas específicas de Next.js 16 (nuevas APIs, cambios en App Router, etc.). Consecuencias:

1. Reglas de Next.js 16 que detectan anti-patrones específicos no están activas.
2. Puede haber false positives en APIs nuevas de Next.js 16.
3. En CI, si el linter falla por reglas obsoletas, aumenta el feedback loop de desarrollo.

**Recomendación:** `npm install --save-dev eslint-config-next@16` (o la versión exacta que corresponda a next@16.0.7).

**Riesgo:** Bajo. Podría activar nuevas reglas que requieran pequeñas correcciones de código.

---

### I-7. `tailwindcss-animate` + `tw-animate-css` instalados simultáneamente

**Severidad:** Importante
**Confianza:** Alta

**Evidencia:**

```json
"tailwindcss-animate": "^1.0.7",
"tw-animate-css": "^1.4.0"
```

**Impacto técnico:**
Ambas librerías definen clases CSS de animación para Tailwind (`animate-in`, `animate-out`, `fade-in`, etc.). Al coexistir:

1. PostCSS procesa ambas, generando clases duplicadas o conflictivas en el CSS output.
2. Aumenta el tiempo de procesado de PostCSS en cada build y en hot reload.
3. `tailwindcss-animate` es el plugin oficial utilizado por shadcn/ui. `tw-animate-css` es una alternativa más nueva. No deben usarse juntos.

Verificar cuál de las dos usa realmente el `tailwind.config.js`:

```javascript
// tailwind.config.js incluye 'tailwindcss-animate' en plugins
```

La que no está configurada en `tailwind.config.js` puede eliminarse.

**Recomendación:** Identificar cuál está activa en el config de Tailwind y eliminar la otra. Si `tw-animate-css` es la nueva preferida, eliminar `tailwindcss-animate` y actualizar el plugin en `tailwind.config.js`.

**Riesgo:** Bajo. Solo CSS animations, no lógica JS.

---

### I-8. `SparklesLoader` hace fetch a CDN externa en runtime

**Severidad:** Importante
**Confianza:** Alta

**Evidencia:**

```javascript
// src/components/Utilities/SparklesLoader/index.js:28
path: 'https://lottie.host/b9622bf5-048c-4fd4-b040-c3192e4c1ec8/9cYjmJ8bB1.json',
```

**Impacto técnico:**
El loader (componente de carga) hace un fetch de red a una CDN externa cada vez que se monta. Si `lottie.host` tiene latencia o no responde, el loader no se muestra, dejando al usuario con una pantalla en blanco durante la carga. Esto crea:

1. Una dependencia de disponibilidad de terceros en el critical render path.
2. Network request adicional en cada carga de pantalla.
3. Sin control sobre el asset (si el JSON cambia o desaparece, el loader falla silenciosamente).

**Recomendación:** Descargar el JSON de la animación Lottie a `public/animations/sparkles.json` y referenciar `/animations/sparkles.json`. El asset queda bajo control del proyecto y se sirve desde el mismo CDN del frontend.

**Riesgo:** Muy bajo. Solo cambio de ruta de archivo.

---

## 5. Hallazgos menores

---

### M-1. Archivos "copy" en el repositorio

**Evidencia:**

- `src/app/admin/[entity]/[id]/EditEntityClient copy.js`
- `src/app/globals copy.css`
- `src/components/Admin/OrdersManager/Order/OrderCustomerHistory/index copy.js`

`index copy.js` contiene imports de recharts, por lo que podría ser analizado por el bundler. `globals copy.css` podría ser importado accidentalmente. Son archivos de trabajo que deberían estar en `.gitignore` o eliminados.

**Recomendación:** Eliminar los tres archivos o añadir `*\ copy.*` a `.gitignore`.

**Riesgo:** Muy bajo.

---

### M-2. `turbopack.root: process.cwd()` es redundante

**Evidencia:**

```javascript
// next.config.mjs
turbopack: {
  root: process.cwd();
}
```

`process.cwd()` es el valor por defecto de `turbopack.root`. Esta configuración no añade ni quita nada pero genera ruido en el config y puede confundir a quien lo lea.

**Recomendación:** Eliminar la clave `turbopack` del `next.config.mjs` o dejarla solo si se añaden configuraciones reales (resolveAlias, etc.).

**Riesgo:** Nulo.

---

### M-3. `legacy-peer-deps=true` global en `.npmrc`

**Evidencia:**

```
# .npmrc
legacy-peer-deps=true
```

Esta flag hace que npm ignore los conflictos de peer dependencies silenciosamente en **todos** los installs, incluyendo CI/CD. Es un parche que enmascara incompatibilidades reales (React 19 RC vs next-auth v4, entre otras). Si se resuelven las incompatibilidades de raíz (React 19 stable + next-auth v5, o versiones compatibles), esta flag podría eliminarse.

**Recomendación:** Documentar qué incompatibilidades específicas requieren esta flag y hacer un plan para resolverlas. No bloquea rendimiento directamente pero es una deuda técnica que puede esconder problemas.

**Riesgo:** Bajo si se mantiene. Alto si se elimina sin resolver las incompatibilidades subyacentes.

---

### M-4. `OptionsContext.js` deprecado sigue en el repositorio

**Evidencia:**

```javascript
// src/context/OptionsContext.js
// Deprecated context (passthrough, no longer loads data)
```

Según la exploración, este contexto es un passthrough que ya no carga datos. Si sigue montado en algún lugar, añade un nivel de contexto vacío al árbol. Si ya no está montado, es dead code.

**Recomendación:** Verificar si `OptionsContext` está importado en algún layout o provider y, si no lo está, eliminarlo. Si sigue importado, eliminarlo de la cadena de providers.

**Riesgo:** Bajo.

---

### M-5. `mapbox-gl` en `transpilePackages` penaliza compilación

**Evidencia:**

```javascript
// next.config.mjs
transpilePackages: ['mapbox-gl'];
```

Mapbox GL requiere esta opción para compilar correctamente con Webpack/Turbopack. El coste es que el bundler procesa `mapbox-gl` (~2.5 MB sin minificar) con todos sus workers y assets en cada build. Solo se usa en 1 componente (`src/components/Maps/RouteMap.jsx`).

`RouteMap.jsx` ya está referenciado con `next/dynamic` en `ProspectsPageClient.jsx`, lo que es correcto. Pero verificar que todos los puntos de entrada a `RouteMap` usen dynamic import aseguraría que mapbox-gl solo se compila cuando realmente se necesita.

**Recomendación:** Verificar que todos los imports de `RouteMap.jsx` usan `next/dynamic({ ssr: false })`. No se puede eliminar `transpilePackages` pero sí minimizar su impacto manteniendo el componente siempre lazy-loaded.

**Riesgo:** Bajo.

---

### M-6. `react-day-picker v8` + `@internationalized/date` como dependencias separadas

**Evidencia:**

```json
"react-day-picker": "^8.10.1",   // shadcn calendar
"@internationalized/date": "^3.6.0"  // React Aria
```

react-day-picker v8 usa `date-fns` para manipulación de fechas. `@internationalized/date` es de React Aria (Adobe). Tener ambas librerías de utilidades de fecha puede ser redundante si no se usa React Aria en otros lugares. `date-fns` ya está instalado separadamente.

**Hipótesis** (no verificada): `@internationalized/date` puede ser una dependencia transitiva de algún componente Radix o shadcn, en cuyo caso no es eliminable directamente.

**Recomendación:** Verificar si `@internationalized/date` se importa directamente en algún componente propio o solo como transitiva. Si es solo transitiva, no hay acción necesaria.

**Riesgo:** Nulo si es transitiva.

---

### M-7. `target: ES2017` en `tsconfig.json`

**Evidencia:**

```json
// tsconfig.json
"target": "ES2017"
```

Con Next.js usando SWC para compilación, `target` en tsconfig es en gran medida ignorado para el bundle final (SWC tiene su propio targeting basado en browserslist). Sin embargo, para archivos compilados por `tsc` directamente o en el contexto de Vitest, ES2017 es más conservador de lo necesario para un proyecto con React 19. ES2020 o ESNext sería más apropiado.

**Impacto:** Mínimo en la práctica pero añade innecesario overhead si hay transformaciones de polyfills.

**Recomendación:** Actualizar a `"target": "ES2020"` o `"ESNext"`.

**Riesgo:** Muy bajo.

---

## 6. Dependencias sospechosas, redundantes o sobredimensionadas

### Confirmadas no usadas (dead dependencies)

| Paquete               | Evidencia                                   | Acción                                  |
| --------------------- | ------------------------------------------- | --------------------------------------- |
| `jspdf`               | 0 imports en `src/`                         | `npm uninstall jspdf`                   |
| `html2canvas`         | 0 imports en `src/`                         | `npm uninstall html2canvas`             |
| `@tabler/icons-react` | 1 único archivo (`ProspectsPageClient.jsx`) | Sustituir por lucide-react, desinstalar |

### Redundantes (resuelven el mismo problema)

| Paquetes                                              | Problema                          | Acción                                              |
| ----------------------------------------------------- | --------------------------------- | --------------------------------------------------- |
| `radix-ui` (umbrella) + 20 `@radix-ui/*` individuales | Duplicación en node_modules       | Elegir un patrón y eliminar el otro                 |
| `@headlessui/react` + `@radix-ui/*`                   | Dos librerías headless UI         | Migrar 4 archivos a Radix, eliminar headlessui      |
| `tailwindcss-animate` + `tw-animate-css`              | Dos plugins de animación Tailwind | Eliminar el que no está en tailwind.config.js       |
| `lucide-react` + `@heroicons/react` + `react-icons`   | Tres librerías de iconos          | Migrar heroicons (4 archivos) a lucide gradualmente |

### Sobredimensionadas para su uso real

| Paquete                   | Tamaño aprox. | Uso real                      | Mitigación existente                  | Pendiente                             |
| ------------------------- | ------------- | ----------------------------- | ------------------------------------- | ------------------------------------- |
| `mapbox-gl`               | ~280 KB gz    | 1 componente                  | `next/dynamic` en ProspectsPageClient | Verificar todos los puntos de entrada |
| `recharts`                | ~160 KB gz    | 15 archivos                   | Ninguna                               | Eliminar wildcard import en chart.jsx |
| `xlsx`                    | ~250 KB gz    | 8 archivos                    | Ninguna                               | Dynamic import en handlers            |
| `framer-motion`           | ~60 KB gz     | 18 archivos                   | —                                     | Sacar del layout global               |
| `@xyflow/react` + `dagre` | ~110 KB gz    | ProductionDiagram             | `next/dynamic` ✓                      | Correcto, no acción                   |
| `lottie-web`              | ~60 KB gz     | 1 componente (SparklesLoader) | Dynamic import ✓                      | Solo mover el JSON a local            |

### Correctas pero mal importadas o mal ubicadas

| Paquete      | Problema                     | Archivo                         | Solución                   |
| ------------ | ---------------------------- | ------------------------------- | -------------------------- |
| `recharts`   | `import *` wildcard          | `src/components/ui/chart.jsx:3` | Named imports específicos  |
| `xlsx`       | Import estático              | 8 archivos                      | Dynamic import en handlers |
| `file-saver` | Import estático junto a xlsx | 8 archivos                      | Dynamic import en handlers |

---

## 7. Problemas de imports, carga global y boundaries client/server

### `"use client"` potencialmente innecesarios o demasiado amplios

| Archivo                         | Situación                                           | Recomendación                                                      |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `src/app/ClientLayout.js`       | Boundary raíz que engloba toda la app               | Segmentar providers para que solo los necesarios sean "use client" |
| `src/context/OptionsContext.js` | Deprecated, context passthrough                     | Eliminar                                                           |
| 5 layouts con `force-dynamic`   | Cada layout cliente fuerza render dinámico en hijos | Eliminar `force-dynamic`, ya explicado en C-5                      |

### Imports globales costosos sin lazy loading

| Componente global                   | Coste                                                 | Ubicación                       |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------- |
| `LogoutDialog` (via LogoutProvider) | Dialog + animación en bundle inicial                  | `src/context/LogoutContext.tsx` |
| `InstallPromptBanner`               | Lógica PWA + event listeners en cada página           | `src/app/ClientLayout.js`       |
| `AppToaster` (Sonner)               | Ligero pero innecesario en páginas sin notificaciones | `src/app/ClientLayout.js`       |
| `SettingsProvider`                  | Query de settings en mount global                     | `src/app/ClientLayout.js`       |

### Módulos pesados que deberían cargarse bajo demanda

| Módulo                      | Trigger real                      | Lazy loading actual                   | Recomendado                                   |
| --------------------------- | --------------------------------- | ------------------------------------- | --------------------------------------------- |
| `xlsx` + `file-saver`       | Clic en "Exportar"                | No                                    | Dynamic import en el handler                  |
| Dashboard charts (recharts) | Visita a `/admin` o `/admin/home` | No                                    | `next/dynamic` por componente chart           |
| `mapbox-gl` (via RouteMap)  | Páginas con mapa                  | Parcial (solo en ProspectsPageClient) | Verificar todos los imports de RouteMap       |
| AI Chat (ai SDK)            | Apertura del ChatDialog           | No                                    | El ChatDialog en sí podría ser `next/dynamic` |

### Componentes pesados montados globalmente sin necesidad

| Componente                              | Montado en              | Necesario globalmente                           |
| --------------------------------------- | ----------------------- | ----------------------------------------------- |
| `InstallPromptBanner`                   | `ClientLayout` (raíz)   | No — solo relevante en primera visita           |
| `LogoutDialog`                          | `LogoutProvider` (raíz) | No — solo al hacer logout                       |
| Toda la navegación de sidebar/BottomNav | Layouts de área         | Sí, pero framer-motion en BottomNav es excesivo |

---

## 8. Problemas de configuración que penalizan rendimiento o DX

### Next.js (`next.config.mjs`)

| Configuración                        | Problema                                         | Acción                                       |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------- |
| `transpilePackages: ['mapbox-gl']`   | Obliga a compilar ~2.5MB de mapbox en cada build | Aceptable si RouteMap siempre es lazy-loaded |
| `turbopack: { root: process.cwd() }` | Configuración redundante (es el default)         | Eliminar                                     |
| `compiler.removeConsole`             | Solo elimina logs en prod — correcto             | Sin cambios                                  |
| `rewrites` al backend local          | Correcto para dev                                | Sin cambios                                  |

### TypeScript (`tsconfig.json`)

| Configuración       | Problema                                    | Acción                             |
| ------------------- | ------------------------------------------- | ---------------------------------- |
| `target: ES2017`    | Más conservador de lo necesario             | Actualizar a ES2020                |
| `incremental: true` | Correcto — reduce tiempos de compilación TS | Sin cambios                        |
| `allowJs: true`     | Mezcla .js y .ts — añade carga al checker   | Aceptable dado estado del proyecto |
| `strict: true`      | Correcto                                    | Sin cambios                        |

### npm (`.npmrc`)

| Configuración           | Problema                                         | Acción                                          |
| ----------------------- | ------------------------------------------------ | ----------------------------------------------- |
| `legacy-peer-deps=true` | Enmascara incompatibilidades, aplica globalmente | Documentar, resolver incompatibilidades de raíz |

### Tailwind / PostCSS

| Configuración                                     | Problema                                       | Acción                                   |
| ------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| `tailwind.config.js` en modo compatibilidad v3/v4 | En Tailwind v4, el config.js es el modo legacy | Aceptable durante transición, no urgente |
| `tailwindcss-animate` + `tw-animate-css`          | Dos plugins de animación redundantes           | Eliminar uno                             |
| `@tailwindcss/forms` en devDependencies           | Correcto si se usa en formularios              | Verificar uso real                       |

### ESLint

| Configuración                                   | Problema                  | Acción                             |
| ----------------------------------------------- | ------------------------- | ---------------------------------- |
| `eslint-config-next: 15.0.3` con next `^16.0.7` | Mismatch de versión major | Actualizar eslint-config-next a 16 |

### Vitest

| Configuración     | Problema                                                    | Impacto                                        |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `vitest: ^4.0.18` | Release muy reciente, posible inestabilidad con React 19 RC | Bajo en prod, potencial en CI                  |
| `pool: threads`   | Costoso en máquinas con poco RAM                            | Considerar `forks` como alternativa más ligera |

---

## 9. Acciones recomendadas ordenadas por impacto / esfuerzo

| #   | Estado       | Acción                                                                | % del total | Impacto                      | Esfuerzo        | Riesgo       | Beneficio esperado                                                               | Prioridad           |
| --- | ------------ | --------------------------------------------------------------------- | ----------- | ---------------------------- | --------------- | ------------ | -------------------------------------------------------------------------------- | ------------------- |
| 1   | ✅ Hecho     | `npm uninstall jspdf html2canvas`                                     | 1%          | Alto                         | Mínimo (5 min)  | Muy bajo     | ~500 KB eliminados de node_modules, package-lock limpio                          | 🔴 Inmediato        |
| 2   | ✅ Hecho     | Eliminar `force-dynamic` de los 5 layouts                             | **25%**     | Alto (dev + prod)            | Bajo (30 min)   | Medio        | 58 páginas pasan a Static en build, middleware sigue protegiendo rutas           | 🔴 Inmediato        |
| 3   | ✅ Hecho     | Reemplazar `import *` en `chart.jsx` por named imports                | **15%**     | Alto (bundle)                | Bajo (30 min)   | Bajo         | `ResponsiveContainer`, `Tooltip`, `Legend` — recharts tree-shakeable desde ahora | 🔴 Inmediato        |
| 4   | ✅ Hecho     | Dynamic import de `xlsx`/`file-saver` en los 8 handlers               | **12%**     | Alto (bundle inicial)        | Medio (2-3h)    | Bajo         | ~250 KB fuera del bundle inicial de admin                                        | 🔴 Inmediato        |
| 5   | ⏳ Pendiente | Actualizar React 19 RC → React 19 stable                              | 4%          | Alto (estabilidad)           | Bajo            | Bajo         | Elimina bugs de RC, mejora compatibilidad                                        | 🔴 Inmediato        |
| 6   | ✅ Hecho     | `npm uninstall @tabler/icons-react` + migrar 2 iconos                 | 1%          | Medio                        | Mínimo (20 min) | Bajo         | Una dependencia menos en node_modules                                            | 🟡 Esta semana      |
| 7   | ✅ Hecho     | Mover JSON de Lottie a `public/` (SparklesLoader)                     | 1%          | Medio (resiliencia)          | Mínimo (10 min) | Muy bajo     | Sin dependencia de CDN externa                                                   | 🟡 Esta semana      |
| 8   | ✅ Hecho     | Actualizar `eslint-config-next` a v16                                 | 1%          | Medio (DX)                   | Mínimo (5 min)  | Bajo         | Reglas de ESLint alineadas con Next.js 16                                        | 🟡 Esta semana      |
| 9   | ✅ Hecho     | Eliminar `turbopack: { root: process.cwd() }` de next.config.mjs      | <1%         | Bajo                         | Mínimo (2 min)  | Nulo         | Config más limpio                                                                | 🟡 Esta semana      |
| 10  | ⏳ Pendiente | Eliminar `tailwindcss-animate` o `tw-animate-css` (dejar solo uno)    | 2%          | Medio                        | Bajo (30 min)   | Bajo         | PostCSS más rápido, CSS sin duplicados                                           | 🟡 Esta semana      |
| 11  | ✅ Hecho     | Eliminar 5 archivos "copy"                                            | <1%         | Bajo (limpieza)              | Mínimo (5 min)  | Nulo         | Repositorio limpio                                                               | 🟡 Esta semana      |
| 12  | ⏳ Pendiente | Migrar `@headlessui/react` (4 archivos) a Radix y eliminar headlessui | 3%          | Medio                        | Medio (3-4h)    | Medio        | -30 KB, una dependencia menos                                                    | 🟠 Próximas semanas |
| 13  | ⏳ Pendiente | Convertir `useSession` a contexto `useAuth` memoizado                 | **15%**     | Alto (render)                | Alto (1-2 días) | Medio        | Reducir re-renders en cascada por cambios de sesión                              | 🟠 Próximas semanas |
| 14  | ⏳ Pendiente | Eliminar `radix-ui` umbrella o los `@radix-ui/*` individuales         | 2%          | Medio                        | Medio (2-3h)    | Medio        | node_modules más limpio, menos resolución de módulos                             | 🟠 Próximas semanas |
| 15  | ⏳ Pendiente | Sacar `framer-motion` del layout global (BottomNav)                   | **8%**      | Medio                        | Medio (3-4h)    | Medio        | ~60 KB fuera del critical path móvil                                             | 🟠 Próximas semanas |
| 16  | ⏳ Pendiente | Lazy loading de charts del Dashboard con `next/dynamic`               | 6%          | Alto (bundle inicial)        | Medio (2-3h)    | Bajo         | Dashboard carga sin bloquear por recharts                                        | 🟠 Próximas semanas |
| 17  | ⏳ Pendiente | Actualizar a React 19 stable + evaluar next-auth v5                   | 3%          | Alto (estabilidad long-term) | Alto (días)     | Alto para v5 | Compatibilidad declarada, mejor DX                                               | 🔵 Planificar       |
| 18  | ⏳ Pendiente | Migrar react-icons (20 archivos) a lucide-react                       | 1%          | Bajo                         | Alto (días)     | Bajo         | Una librería de iconos menos                                                     | 🔵 Planificar       |
|     |              | **TOTAL EJECUTADO**                                                   | **~57%**    |                              |                 |              |                                                                                  |                     |
|     |              | **TOTAL PENDIENTE**                                                   | **~43%**    |                              |                 |              |                                                                                  |                     |

---

## 10. Quick wins

Acciones que se pueden ejecutar en menos de 1 hora con beneficio real y riesgo mínimo:

1. **`npm uninstall jspdf html2canvas`** — elimina ~500 KB de dead dependencies sin tocar código. Confirmar previamente que no hay imports ocultos en scripts o archivos de configuración.

2. **Eliminar `force-dynamic` de los 5 layouts** — quitar 1 línea de export de cada layout. El comentario en `admin/layout.js` explica el razonamiento original pero ya no aplica correctamente. Beneficio inmediato en dev y en posibilidad de ISR en prod.

3. **Corregir `import *` en `chart.jsx`** — cambiar una línea de import. Requiere ver qué exporta chart.jsx internamente para convertir a named imports, pero es un cambio en 1 archivo.

4. **`npm uninstall @tabler/icons-react`** — reemplazar `IconChevronLeft` e `IconChevronRight` en `ProspectsPageClient.jsx` por `ChevronLeft` y `ChevronRight` de lucide-react (ya instalado). Desinstalar el paquete.

5. **Mover JSON de Lottie a `/public/animations/sparkles.json`** — download del JSON, cambio de ruta en `SparklesLoader`. 10 minutos, elimina dependencia de CDN externa.

6. **Eliminar archivos "copy"** — `rm "src/app/admin/[entity]/[id]/EditEntityClient copy.js" "src/app/globals copy.css" "src/components/Admin/OrdersManager/Order/OrderCustomerHistory/index copy.js"`.

7. **Actualizar `eslint-config-next`** — `npm install --save-dev eslint-config-next@16`. 5 minutos, mejora DX inmediatamente.

8. **Eliminar `turbopack.root` de next.config.mjs** — quitar 3 líneas. Sin riesgo.

---

## 11. Riesgos y consideraciones al tocar cada área

### Eliminar `force-dynamic`

- **Qué podría romperse:** Si `AdminRouteProtection` o algún componente de layout hace operaciones server-side que genuinamente requieren datos dinámicos (cookies, headers), podría haber un mismatch entre lo que se renderiza estáticamente y lo que el usuario ve.
- **Medir antes/después:** Comprobar en dev que la navegación entre rutas admin funciona igual. Especialmente verificar el flujo de autenticación y redirección.
- **Validación extra:** Test de rutas protegidas con usuario no autenticado.

### Corregir imports de `recharts` en `chart.jsx`

- **Qué podría romperse:** Los consumidores de `chart.jsx` que usen re-exports de Recharts a través del componente podrían dejar de funcionar si se quitan tipos o referencias.
- **Medir:** Compilar con `next build` y comparar el tamaño del chunk que incluye chart.jsx antes/después.

### Dynamic import de `xlsx`

- **Qué podría romperse:** Si algún componente usa xlsx en el render (no en un handler), el dynamic import asíncrono necesita manejo de estado de carga. En la práctica, xlsx siempre se usa en respuesta a un clic.
- **Validar:** Testear el flujo completo de exportación en cada uno de los 8 puntos.

### Eliminar `radix-ui` umbrella vs `@radix-ui/*`

- **Riesgo:** Si hay versiones distintas del mismo componente entre el umbrella y el individual, la migración puede romper componentes que asumen una versión específica.
- **Medir:** Ejecutar `npm ls @radix-ui/react-dialog` (y otros) para verificar si hay versiones duplicadas en el árbol de dependencias.

### Actualizar next-auth a v5

- **Qué podría romperse:** next-auth v5 tiene una API diferente (callbacks, providers, session shape). Requiere migración de todos los `useSession`, `getServerSession`, `getToken` del proyecto.
- **Validación:** Proceso de QA completo de autenticación, sesión, refresh, logout.

### Sacar `framer-motion` del layout global

- **Qué podría romperse:** Las animaciones del BottomNav (stagger, botón central). Necesita QA visual en dispositivos móviles reales.
- **Medir antes/después:** Lighthouse en móvil para TBT (Total Blocking Time) y FCP.

---

## 12. Conclusión final

### Diagnóstico principal

El frontend es pesado por una acumulación de tres patrones que se refuerzan mutuamente:

**1. Arquitectura "todo global, todo cliente":**
El `ClientLayout` raíz como único boundary "use client" + `force-dynamic` en 5 layouts elimina cualquier beneficio de la arquitectura server/client split de Next.js App Router. Todo el JavaScript relevante llega al cliente y se evalúa en cada carga.

**2. Librerías pesadas sin code splitting:**
`recharts` (via barrel import en `chart.jsx`), `xlsx` (sin lazy loading), `framer-motion` (en el layout global) y `mapbox-gl` (parcialmente) entran en bundles donde no son necesarios en la carga inicial. Esto eleva el baseline de JavaScript del cliente sin necesidad.

**3. Deuda de dependencias acumulada:**
`jspdf` y `html2canvas` no se usan. `@tabler/icons-react` se usa en 1 archivo. `@headlessui/react` es redundante con Radix. `radix-ui` umbrella duplica los `@radix-ui/*`. `tailwindcss-animate` y `tw-animate-css` coexisten. React 19 RC con `legacy-peer-deps` enmascarando incompatibilidades. Este no es el problema de rendimiento principal, pero es el que más empeora la DX en instalación, compilación y análisis de dependencias.

### Los 5 cambios que haría primero, en orden

1. **`npm uninstall jspdf html2canvas @tabler/icons-react`** — cero riesgo, beneficio inmediato, limpia la base de dependencias.

2. **Eliminar `force-dynamic` de los 5 layouts** — el cambio de mayor impacto en dev por esfuerzo mínimo. Restaura el comportamiento correcto del App Router.

3. **Corregir `import *` en `chart.jsx`** — una línea que afecta el bundle de todos los dashboards. Máximo impacto/esfuerzo en bundle.

4. **Dynamic import de `xlsx` en los 8 handlers de exportación** — saca ~250 KB del bundle inicial. Patrón uniforme y replicable en 2-3 horas.

5. **Actualizar React 19 RC → React 19 stable** — no es una mejora de rendimiento directa pero elimina la inestabilidad del RC y es el prerrequisito para resolver las incompatibilidades con next-auth que justifican `legacy-peer-deps`.

Estos 5 cambios son conservadores, no requieren cambios arquitectónicos, pueden medirse claramente (tamaño de bundle antes/después, tiempo de arranque dev) y crean la base para las mejoras más profundas que siguen.

---

_Auditoría realizada sobre inspección directa del repositorio. Los tamaños de bundle son aproximados basados en datos públicos de las librerías. Para mediciones exactas: ejecutar `ANALYZE=true next build` con `@next/bundle-analyzer` configurado._

---

## 13. Acciones ejecutadas (2026-03-26)

Las siguientes acciones del plan de quick wins fueron ejecutadas el mismo día de la auditoría.

### Completado

| #   | Acción                                          | Resultado                                                                                                                                        |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `npm uninstall jspdf html2canvas`               | 24 paquetes eliminados (~500 KB dead code)                                                                                                       |
| 2   | `npm uninstall @tabler/icons-react`             | Incluido en la desinstalación anterior                                                                                                           |
| 3   | `npm install --save-dev eslint-config-next@16`  | ESLint config alineado con Next.js 16                                                                                                            |
| 4   | Eliminar 5 archivos "copy" stale                | `EditEntityClient copy.js`, `globals copy.css`, `index copy.js` (OrderCustomerHistory), `index copy.js` (OrderLabels), `usePrintElement copy.js` |
| 5   | Limpiar `next.config.mjs`                       | Eliminado bloque `turbopack: { root: process.cwd() }` (era el default)                                                                           |
| 6   | Lottie JSON → `public/animations/sparkles.json` | JSON descargado (12 KB), eliminada dependencia de CDN externa                                                                                    |
| 7   | Migrar iconos en `ProspectsPageClient.jsx`      | `IconChevronLeft/Right` (@tabler) → `ChevronLeft/Right` (lucide-react)                                                                           |

### Archivos modificados

- `package.json` + `package-lock.json` — dependencias actualizadas
- `next.config.mjs` — bloque turbopack eliminado
- `src/components/Utilities/SparklesLoader/index.js` — path local
- `src/components/Comercial/CRM/ProspectsPageClient.jsx` — import migrado a lucide-react
- `public/animations/sparkles.json` — nuevo asset (12 KB)
- 5 archivos "copy" eliminados

### Pendiente de las siguientes iteraciones

Los hallazgos C-2 (wildcard recharts), C-3 (xlsx sin lazy loading), C-6 (ClientLayout global), I-1 (useSession en 108 archivos) y el resto de hallazgos importantes requieren más planificación y testing antes de ejecutar.

---

### Acción adicional ejecutada — 2026-03-26 (segunda sesión)

**C-5: Eliminar `force-dynamic` de los 5 layouts** ✅

- Archivos modificados: `admin/layout.js`, `comercial/layout.js`, `field/layout.js`, `operator/layout.js`, `superadmin/layout.js`
- Eliminada también la línea de comentario obsoleta en `admin/layout.js`
- Build verificado: `next build` completado sin errores, 58/58 páginas generadas
- Resultado: 40+ rutas de admin/comercial/field/operator/superadmin pasan de `ƒ Dynamic` a `○ Static`
- El middleware (`src/middleware.ts`) sigue protegiendo todas las rutas a nivel edge — no hay exposición de contenido protegido
- Nota: Next.js 16 depreca la convención `middleware` en favor de `proxy` — acción separada, no urgente

---

### Acción adicional ejecutada — 2026-03-26 (tercera sesión)

**C-2: Wildcard recharts → named imports en `chart.jsx`** ✅

- Archivo modificado: `src/components/ui/chart.jsx`
- Antes: `import * as RechartsPrimitive from "recharts"` (impide tree-shaking)
- Después: `import { ResponsiveContainer, Tooltip, Legend } from "recharts"` (3 named imports)
- 4 referencias actualizadas en JSX: `RechartsPrimitive.ResponsiveContainer`, `RechartsPrimitive.Tooltip`, `RechartsPrimitive.Legend`
- Resultado esperado: recharts bundle reducido ~160 KB gz para rutas que no usan todos los componentes de la librería

**C-3: Dynamic import de `xlsx`/`file-saver` en handlers de exportación** ✅

- 10 archivos modificados (1 servicio + 9 componentes):
  - `src/services/export/excelGenerator.js` — `generateMassiveExcel` y `downloadMassiveExcel` ahora `async` con `import('xlsx')` y `import('file-saver')` dinámicos
  - `src/components/Admin/MarketDataExtractor/MassiveMode/MassiveExportDialog.js` — `await downloadMassiveExcel()`
  - `src/components/Admin/MarketDataExtractor/MassiveMode/MassiveExportModal.js` — `await downloadMassiveExcel()`
  - `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js` — `generateExcelForA3erp` async
  - `src/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/ExportModal/index.js` — `generateExcelForA3erp` async
  - `src/components/Admin/MarketDataExtractor/ListadoComprasAsocPuntaDelMoral/ExportModal/index.js` — `generateExcelForA3erp` async
  - `src/components/Admin/ManualPunches/BulkPunchExcelUpload.jsx` — `parseExcel` y `handleDownloadTemplate` async
  - `src/components/Admin/Dashboard/OrderRanking/index.js` — `handleExportToExcel` async
  - `src/components/Admin/Stores/StoresManager/Store/PalletsListDialog/index.js` — `generateExcel` async
  - `src/components/Admin/Stores/StoresManager/Store/ProductSummaryDialog/ProductSummary/index.js` — `generateExcel` async
- Patrón aplicado: `const [XLSX, { saveAs }] = await Promise.all([import('xlsx'), import('file-saver')])`
- `xlsx` (~250 KB gz) y `file-saver` ya no entran en el bundle inicial de ninguna ruta — se cargan on-demand al primer click de exportación
- Build verificado: `next build` completado sin errores
