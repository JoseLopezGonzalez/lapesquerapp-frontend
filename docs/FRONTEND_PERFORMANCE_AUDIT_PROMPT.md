# Auditoría profunda de rendimiento, bundle, dependencias y DX del frontend

## Rol que debes asumir

Actúa como un **Senior Frontend Performance Engineer** especializado en:

- **React**
- **Next.js**
- **App Router**
- **bundling y code splitting**
- **tooling**
- **npm dependency auditing**
- **análisis de bundle**
- **optimización de build**
- **tree-shaking**
- **client/server boundaries**
- **developer experience**
- **rendimiento en desarrollo**

Tu trabajo es realizar una **auditoría técnica profunda** de este frontend, centrada exclusivamente en rendimiento, peso técnico del proyecto, dependencia de librerías, carga innecesaria, tooling, configuración, tiempos de compilación, tiempos de arranque en dev, Fast Refresh, tamaño potencial del bundle y coste técnico de la arquitectura actual.

No debes evaluar lógica de negocio, flujos funcionales ni si las pantallas cumplen correctamente su propósito funcional.

---

## Objetivo de la auditoría

El objetivo real es detectar por qué este frontend se percibe **pesado en desarrollo** y potencialmente también **costoso en build / bundle / carga**, especialmente al trabajar en entorno local y al desplegar.

Hay sospecha de sobrecarga por una combinación de:

- dependencias npm pesadas o redundantes
- imports ineficientes
- exceso de componentes client-side
- carga global innecesaria
- boundaries client/server mal resueltos
- layouts y providers demasiado costosos
- configuración de Next.js / TypeScript / Tailwind / tooling que penaliza el trabajo diario
- chunking o code splitting mejorables
- módulos que se compilan o se observan en dev aunque su uso real sea acotado

Tu auditoría debe ir al fondo del problema y producir hallazgos accionables, no recomendaciones genéricas.

---

## Contexto real de este proyecto

Debes basarte en el proyecto real que estás auditando, no en un caso genérico. Toma como punto de partida este contexto detectado en el repositorio y verifícalo al auditar:

### Stack y estructura observada

- Proyecto **Next.js 16** con **App Router** bajo `src/app`
- **React 19 RC** y `react-dom` RC
- Uso de **npm** con `package-lock.json`
- Existe `.next`, `node_modules` y `.npmrc`
- Mezcla de **JavaScript y TypeScript**, con `allowJs: true`
- `moduleResolution: "bundler"` e `incremental: true` en TypeScript
- Alias `@/*` y `@lib/*`
- Tailwind presente con `tailwind.config.js` y `@tailwindcss/postcss`
- Testing con **Vitest** y `@vitejs/plugin-react`
- ESLint con `next/core-web-vitals`

### Huella de superficie del frontend

- Aproximadamente **78 rutas** tipo `page.js` / `page.tsx` bajo `src/app`
- Aproximadamente **484 archivos** en `src/components`
- Aproximadamente **185 archivos con `"use client"`**
- Aproximadamente **11 archivos de contexto** en `src/context`
- Estructura amplia por áreas: `admin`, `comercial`, `field`, `operator`, `external`, `superadmin`, `warehouse`

### Puntos globales y patrones relevantes ya detectados

- `src/app/layout.js` carga:
  - `next/font/google`
  - `@vercel/speed-insights/next`
  - `ClientLayout`
  - `globals.css`
- `src/app/ClientLayout.js` monta globalmente:
  - `ThemeProvider`
  - `TooltipProvider`
  - `QueryClientProvider`
  - `SessionProvider`
  - `SettingsProvider`
  - `LogoutProvider`
  - `AuthErrorInterceptor`
  - `AppToaster`
  - `InstallPromptBanner`
- Varias áreas usan layouts cliente completos y además fuerzan render dinámico:
  - `src/app/admin/layout.js`
  - `src/app/comercial/layout.js`
  - `src/app/field/layout.js`
  - `src/app/operator/layout.js`
  - `src/app/superadmin/layout.js`
- `next.config.mjs` usa:
  - `transpilePackages: ['mapbox-gl']`
  - `turbopack.root = process.cwd()`
  - `compiler.removeConsole` condicionado por entorno
  - `rewrites` de desarrollo hacia backend local
- `.npmrc` contiene `legacy-peer-deps=true`
- Se observan muy pocos usos de `next/dynamic` para el tamaño global del proyecto

### Librerías relevantes que debes revisar con lupa

Analiza especialmente el coste técnico, frecuencia de uso, estrategia de importación y necesidad real de estas familias:

- autenticación y sesión:
  - `next-auth`
- data fetching y caché:
  - `@tanstack/react-query`
- tablas:
  - `@tanstack/react-table`
- drag and drop:
  - `@dnd-kit/*`
- mapas:
  - `mapbox-gl`
  - `react-map-gl`
- gráficos y visualización:
  - `recharts`
  - `@xyflow/react`
  - `dagre`
- animación:
  - `framer-motion`
  - `lottie-web`
- exportación / documentos:
  - `xlsx`
  - `jspdf`
  - `html2canvas`
  - `file-saver`
- IA / chat:
  - `ai`
  - `@ai-sdk/react`
  - `@ai-sdk/openai`
  - `react-markdown`
  - `remark-gfm`
- escáner / cámara:
  - `@yudiel/react-qr-scanner`
- UI e iconografía:
  - `@radix-ui/*`
  - `radix-ui`
  - `lucide-react`
  - `@heroicons/react`
  - `@tabler/icons-react`
  - `react-icons`
  - `vaul`
  - `sonner`

### Zonas funcionales que probablemente arrastran peso técnico

Sin entrar en negocio, inspecciona especialmente zonas donde suele haber alto coste de bundle, compilación o render:

- mapas y rutas:
  - `src/components/Maps`
  - `src/components/Comercial/Routes`
  - `src/components/Comercial/CRM/ProspectLocationMap.jsx`
- dashboards y charts:
  - `src/components/Admin/Dashboard`
  - `src/components/Admin/Home/*Chart*`
- diagramas / flows:
  - `src/components/Admin/Productions/ProductionDiagram`
- editores e impresión:
  - `src/components/Admin/LabelEditor`
  - `src/components/CmrManual`
  - diálogos de impresión y exportación
- Excel / PDF:
  - exportadores y modales con `xlsx`, `jspdf`, `html2canvas`
- chat e IA:
  - `src/components/AI`
  - `src/app/api/chat/route.js`
- layouts responsivos y navegación global:
  - `src/components/Admin/Layout`
  - `src/components/External`
- módulos con alta presencia de cliente:
  - `src/components/Admin`
  - `src/components/Comercial`
  - `src/components/Field`
  - `src/components/Warehouse`

No te limites a esta lista. Úsala como punto de partida y valida el estado real del repositorio.

---

## Alcance obligatorio de la auditoría

Debes revisar, como mínimo, todo lo siguiente:

### 1. Dependencias y paquetes npm

- dependencias no usadas
- dependencias instaladas pero no referenciadas realmente
- librerías duplicadas o solapadas
- coexistencia de varias librerías que resuelven el mismo problema
- paquetes sobredimensionados para el uso real que se les da
- dependencias que añaden peso al bundle o al entorno dev
- coste técnico real de cada librería relevante
- paquetes que dificultan Fast Refresh, transpilation o startup
- alternativas más ligeras cuando tengan sentido
- dependencia directa vs transitive impact cuando sea relevante

### 2. Imports, módulos y carga innecesaria

- imports no usados
- imports demasiado amplios
- barrel files problemáticos
- reexportaciones que obligan a cargar demasiado código
- módulos cliente que podrían ser servidor
- imports que rompen o degradan el tree-shaking
- icon packs usados de forma ineficiente
- librerías UI importadas de forma poco granular
- recursos que se importan globalmente aunque su uso sea puntual
- módulos grandes presentes en layouts, wrappers, navegación o providers globales
- archivos con `"use client"` que podrían evitarlo

### 3. Rendimiento del entorno de desarrollo

- lentitud en `next dev`
- lentitud en arranque inicial
- lentitud en recompilación
- lentitud en hot reload / Fast Refresh
- coste de watchers
- coste de resolución de módulos
- penalizaciones derivadas de `transpilePackages`
- impacto del número de entradas cliente
- impacto de layouts cliente y providers globales
- scripts o configuración que empeoran la DX sin aportar valor suficiente
- cualquier factor que haga más costoso trabajar localmente

### 4. Bundle, build y optimización

- chunking por rutas o zonas del proyecto
- code splitting deficiente
- ausencia de `next/dynamic` donde tendría sentido
- componentes pesados montados por defecto
- fugas de código al cliente que deberían quedar en servidor
- librerías grandes presentes en rutas que no las necesitan
- carga global de fuentes, iconos, estilos o assets
- mapas, charts, editores, PDF, Excel, drag and drop, flows o IA cargados antes de tiempo
- análisis del bundle cliente y, si aplica, bundle compartido
- librerías que aumentan el baseline de JavaScript enviado

### 5. Configuración técnica

Revisa en detalle:

- `package.json`
- `package-lock.json` si aporta pistas útiles
- `.npmrc`
- `next.config.mjs`
- `tsconfig.json`
- ESLint
- PostCSS
- Tailwind
- aliases
- fuentes
- imágenes
- estilos globales
- compatibilidades o polyfills innecesarios
- mezcla de versiones o combinaciones de tooling que puedan penalizar build o dev

### 6. Render y estructura técnica del frontend

Solo desde rendimiento técnico:

- providers globales innecesarios
- contextos demasiado amplios
- layouts cliente muy pesados
- wrappers globales que fuerzan render frecuente
- exceso de hooks de sesión o de query en zonas extensas
- componentes pesados montados globalmente
- toasts, banners, chat, sidebars, nav, sheets o dialogs cargados demasiado arriba
- pantallas enteras marcadas como client que podrían fragmentarse mejor
- patrones arquitectónicos que aumenten compilación, invalidación o render

---

## Exclusiones obligatorias

La auditoría **no debe**:

- centrarse en lógica de negocio
- juzgar si una pantalla cumple funcionalmente su objetivo
- proponer rediseños de producto o UX salvo que afecten directamente al rendimiento técnico
- entrar en reglas de validación o flujos funcionales si no impactan rendimiento
- hacer refactors por estilo, limpieza o preferencia personal si no aportan mejora técnica medible
- quedarse en consejos vagos del tipo “podrías revisar”
- asumir cosas sin revisar el código real

---

## Metodología obligatoria

Debes seguir esta metodología por fases y reflejar claramente cada una en la respuesta.

### Fase 1. Inventario técnico real del proyecto

1. Identifica el stack exacto, versiones, sistema de build y tooling real.
2. Resume la arquitectura del frontend desde el punto de vista técnico.
3. Enumera los puntos de entrada globales y las capas montadas en raíz.
4. Identifica las familias de dependencias más costosas.
5. Distingue claramente entre hechos verificados y primeras hipótesis.

### Fase 2. Auditoría de dependencias y coste técnico

1. Detecta dependencias probablemente no usadas.
2. Detecta dependencias redundantes, duplicadas o solapadas.
3. Señala librerías cuyo peso no parece justificado por el uso encontrado.
4. Evalúa si ciertas librerías están importadas de forma poco eficiente.
5. Explica el coste técnico probable de cada librería relevante:
   - bundle
   - startup en dev
   - transpilation
   - tiempo de compilación
   - impacto en render cliente

### Fase 3. Auditoría de imports, módulos y boundaries

1. Revisa `use client` a nivel de layouts, páginas y componentes grandes.
2. Detecta imports globales innecesarios.
3. Detecta barrel files y reexportaciones que aumenten fan-out.
4. Revisa si hay módulos server-safe empujados al cliente.
5. Señala módulos pesados cargados en layout, shell o navegación.
6. Revisa icon packs y librerías UI para detectar importación ineficiente.

### Fase 4. Auditoría de configuración y DX

1. Evalúa `next.config.mjs`.
2. Evalúa `tsconfig.json`.
3. Evalúa `.npmrc`.
4. Evalúa Tailwind / PostCSS.
5. Evalúa scripts y herramientas de test si afectan la DX general.
6. Busca configuraciones que aumenten trabajo innecesario del bundler o del compilador.

### Fase 5. Auditoría de bundle y carga

1. Revisa el reparto por rutas o áreas.
2. Detecta chunks grandes o mal separados.
3. Señala oportunidades reales de lazy loading.
4. Revisa qué librerías deberían cargarse solo bajo demanda.
5. Identifica componentes globales que elevan el coste base del cliente.
6. Distingue entre impacto en dev y en producción.

### Fase 6. Priorización de hallazgos

Clasifica cada hallazgo por:

- severidad
- impacto esperado
- esfuerzo de implementación
- riesgo de tocarlo
- confianza del diagnóstico

Usa prioridades tipo:

- **Crítico**
- **Importante**
- **Menor**

### Fase 7. Plan de acciones

Propón acciones concretas, justificadas y seguras:

- quick wins
- mejoras de alto impacto y bajo riesgo
- mejoras de impacto medio
- cambios más profundos con riesgo controlado

Cada acción debe indicar:

- qué tocar
- por qué
- beneficio esperado
- riesgo
- orden recomendado de ejecución

---

## Forma de analizar este repositorio

No respondas con teoría general sobre Next.js. Audita este repositorio real.

Debes inspeccionar explícitamente, como mínimo:

- `package.json`
- `.npmrc`
- `next.config.mjs`
- `tsconfig.json`
- `.eslintrc.json`
- `tailwind.config.js`
- `postcss.config.mjs`
- `vitest.config.js`
- `src/app/layout.js`
- `src/app/ClientLayout.js`
- layouts de `admin`, `comercial`, `field`, `operator`, `external`, `superadmin`
- `src/context`
- `src/components/Admin/Layout`
- zonas con mapas, charts, PDF, Excel, IA, scanner, diagramas y editores

También debes revisar patrones transversales como:

- frecuencia de `useSession`
- frecuencia de `useQuery` / `useQueryClient`
- uso de `next/dynamic`
- rutas enteras cliente
- componentes cliente masivos
- wrappers globales
- `force-dynamic`
- iconografía distribuida entre varias librerías
- librerías pesadas importadas desde componentes de uso frecuente

Si necesitas inferir algo, indícalo como hipótesis y no como hecho.

---

## Nivel de exigencia de la auditoría

Debes cumplir estrictamente estas reglas:

- **Nada de consejos vagos**
- **Nada de “podrías revisar”**
- **Nada de recomendaciones genéricas sin aterrizar en este código**
- **Todo hallazgo debe incluir justificación técnica**
- **Señala archivos, dependencias, patrones o zonas concretas siempre que sea posible**
- **Diferencia entre hallazgos comprobados e hipótesis**
- **Prioriza cambios seguros con beneficio real**
- **Indica cuando un problema afecta principalmente a dev, a producción o a ambos**
- **Explica el mecanismo técnico por el que algo penaliza rendimiento**
- **No te limites a listar librerías pesadas; explica por qué aquí sí importan**

Cuando detectes algo dudoso, responde con este nivel de precisión:

- qué viste
- dónde está
- por qué puede penalizar
- qué evidencia tienes
- qué cambio propones
- qué riesgo tendría aplicarlo

---

## Formato de salida exigido

Tu respuesta final debe venir exactamente estructurada con estas secciones:

## 1. Resumen ejecutivo

- Explica en pocas líneas qué está haciendo pesado el frontend.
- Distingue entre problemas de mayor impacto en dev y problemas de bundle / producción.
- Indica si el problema principal parece venir más de arquitectura, dependencias, configuración o carga global.

## 2. Inventario técnico confirmado

- Stack real detectado
- Tooling real
- Configuración relevante
- Resumen de arquitectura técnica
- Observaciones de contexto que condicionan el rendimiento

## 3. Hallazgos críticos

Para cada hallazgo incluye:

- título
- severidad
- evidencia concreta
- archivos o zonas afectadas
- impacto técnico
- impacto esperado en dev / build / bundle / render
- recomendación concreta
- riesgo
- nivel de confianza

## 4. Hallazgos importantes

Mismo formato que en la sección anterior.

## 5. Hallazgos menores

Mismo formato, pero compactado si hace falta.

## 6. Dependencias sospechosas, redundantes o sobredimensionadas

Debes listar:

- dependencias posiblemente no usadas
- dependencias redundantes
- dependencias sobredimensionadas
- dependencias correctas pero mal importadas o mal ubicadas
- alternativas más ligeras cuando tenga sentido

## 7. Problemas de imports, carga global y boundaries client/server

Incluye:

- `use client` potencialmente innecesarios
- layouts cliente demasiado amplios
- imports globales costosos
- módulos que deberían cargarse bajo demanda
- componentes o providers cargados demasiado arriba en el árbol

## 8. Problemas de configuración que penalizan rendimiento o DX

Evalúa:

- Next.js
- TypeScript
- Tailwind / PostCSS
- npm
- scripts
- tooling auxiliar

## 9. Acciones recomendadas ordenadas por impacto / esfuerzo

Organiza las acciones en una tabla o lista clara con:

- acción
- impacto
- esfuerzo
- riesgo
- beneficio esperado
- prioridad

## 10. Quick wins

Lista corta de acciones seguras y de alto retorno que se podrían atacar primero.

## 11. Riesgos y consideraciones al tocar cada área

- qué podría romperse
- qué conviene medir antes y después
- qué cambios requieren validación extra

## 12. Conclusión final

- diagnóstico principal
- orden recomendado de intervención
- qué 3 a 5 cambios harías primero y por qué

---

## Requisitos de calidad de la respuesta

La respuesta debe ser:

- rigurosa
- específica
- técnica
- accionable
- priorizada
- basada en evidencia del código real

No quiero una review superficial. Quiero una auditoría que sirva para tomar decisiones y reducir peso real del frontend y del entorno de desarrollo.

Si algo no puedes confirmar, dilo explícitamente.

Si propones una mejora, explica siempre el motivo técnico.

Si detectas una oportunidad de optimización, indica si es:

- mejora clara y segura
- hipótesis razonable que requiere medición
- cambio profundo con trade-offs

---

## Criterio final

Tu objetivo no es “mejorar el código” en abstracto.

Tu objetivo es encontrar todo lo que esté haciendo que este frontend sea innecesariamente pesado en:

- desarrollo
- compilación
- bundling
- carga cliente
- mantenimiento técnico

Haz una auditoría dura, precisa y útil.
