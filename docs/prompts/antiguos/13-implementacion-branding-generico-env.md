# Prompt: Implementación de branding genérico / La PesquerApp controlado por .env

## Objetivo

Implementar un **sistema único de branding** alimentado por **variables de entorno** que permita, cambiando solo la configuración (`.env`), alternar entre:

1. **Modo genérico**: nombre de app, dominios y emails neutros; sin identidad de marca visible; **landing no accesible** (no debe verse por el usuario).
2. **Modo La PesquerApp**: todos los textos, metadatos, manifest y rutas con la identidad actual (La PesquerApp, PesquerApp, lapesquerapp.es, emails de soporte/demo, etc.).

El “interruptor” es **solo a nivel de programación** (env), no un control visible para el usuario. Toda la lógica y strings que hoy están hardcodeados en los archivos listados en la auditoría deben leer de un **módulo de config único** que a su vez lee las variables de entorno.

**Documento de referencia obligatorio:** `docs/audits/auditoria-nombre-app-la-pesquerapp.md` — todas las ubicaciones y contextos de la auditoría (sección 1: código y configuración) son el alcance de esta implementación.

---

## Fuera de alcance (no implementar)

- **Documentación (`docs/`, `.env.example`, `README.md`, `.ai_standards`)**: el usuario no la ve; no se modifican en este prompt.
- **`package.json` (campo `name`)**: identidad de repo; no user-facing; no tocar.
- Cualquier archivo que la auditoría liste **solo** en la sección 2 (Documentación).

---

## Variables de entorno

Definir y usar al menos las siguientes (nombres sugeridos; pueden ajustarse si el proyecto ya usa convenciones):

| Variable | Uso | Valores ejemplo |
|----------|-----|------------------|
| `NEXT_PUBLIC_APP_BRANDING` | Interruptor principal | `generic` \| `pesquerapp` (o equivalente: `full`). Si no está definida o es distinta de `pesquerapp`, tratar como modo genérico. |
| (Opcional) | Valores genéricos por defecto | Si se desea no hardcodar en código los textos genéricos, se pueden definir `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_SHORT_NAME`, `NEXT_PUBLIC_APP_METADATA_BASE`, etc. para modo genérico, y sus equivalentes para PesquerApp; o derivar todo del único `NEXT_PUBLIC_APP_BRANDING` con valores por defecto en el módulo de config. |

El módulo de config debe exponer una API clara (por ejemplo `isGenericBranding`, `appName`, `appShortName`, `metadataBase`, `supportEmail`, `demoEmail`, `exampleEmail`, `baseDomain`, `logoAlt`) para que el resto del código no lea `process.env` directamente salvo en ese módulo.

---

## Módulo de config (branding)

- **Crear** un único módulo (por ejemplo `src/configs/branding.js` o `src/lib/branding.js`) que:
  - Lea `NEXT_PUBLIC_APP_BRANDING` (y, si se usan, el resto de variables de branding).
  - Exporte constantes/objeto con: nombre completo, nombre corto, metadataBase/url raíz, supportEmail, demoEmail, exampleEmail, baseDomain (para lógica de tenant/redirección), alt del logo, y cualquier otro valor necesario para sustituir los ítems de la auditoría.
  - En modo `generic`: valores neutros (por ejemplo appName "ERP" o "App", emails/dominios genéricos o vacíos según criterio).
  - En modo `pesquerapp`: valores actuales (La PesquerApp, PesquerApp, lapesquerapp.es, api.lapesquerapp.es, soporte@pesquerapp.com, etc.).
- El resto del código **solo** importa este módulo; no leer env directamente para branding.

---

## Landing en modo genérico: no visible

- Cuando `NEXT_PUBLIC_APP_BRANDING === 'generic'`, la **landing no debe ser accesible** para el usuario.
- Opciones (elegir una e implementar):
  - **A)** Redirigir la ruta raíz `/` (o la ruta donde esté la landing) al login (o a la ruta que corresponda cuando no hay sesión).
  - **B)** Mostrar en `/` una página mínima neutra (sin branding, por ejemplo solo “Acceso” o enlace al login) en lugar del contenido actual de la landing.
  - **C)** Devolver 404 en la ruta de la landing cuando el branding es genérico.
- Asegurarse de que en modo genérico ningún enlace público lleve al usuario a ver la landing con marca; si la landing está en la raíz, la raíz debe comportarse según la opción elegida.

---

## Checklist de implementación (según auditoría)

Usar `docs/audits/auditoria-nombre-app-la-pesquerapp.md` como lista maestra. A continuación se resume por archivo/área; cada ítem debe quedar resuelto leyendo del módulo de branding (alimentado por .env).

### 1. Layout y metadatos (`src/app/layout.js`)

- [ ] **Líneas 5–7**: `metadata.default` y `metadata.template` (título pestaña) → desde config (appName, etc.).
- [ ] **Líneas 11–22**: `metadataBase`, `openGraph` (title, siteName, url, description, imágenes alt) → desde config.
- [ ] **Líneas 27–31**: Twitter card (title, description) → desde config.
- [ ] **Línea 46**: `apple-mobile-web-app-title` (meta PWA iOS) → desde config (appShortName o appName).
- [ ] **Líneas 33–36**: Si se desea elegir favicon/apple icon según branding, usar rutas desde config; si no, dejar rutas genéricas.

### 2. Config API (`src/configs/config.js`)

- [ ] **Líneas 1, 5–6**: Comentario y fallback de URL de API → usar variable de entorno o valor del módulo de branding (base API); en genérico evitar fallback que exponga `api.lapesquerapp.es`.

### 3. PWA manifest (`public/site.webmanifest`)

- [ ] El contenido del manifest (`name`, `short_name`, `description`) no puede leerse en runtime desde JS estándar. Opciones:
  - **Opción A**: Script de build (ej. en `package.json` prebuild o en `next.config`) que lee env y escribe `public/site.webmanifest` antes del build.
  - **Opción B**: Servir el manifest desde una **API route** (ej. `app/manifest/route.js` o equivalente) que lee el módulo de branding y devuelve el JSON con los campos correctos; y que el `<link rel="manifest">` en el layout apunte a esa ruta.
- [ ] Asegurar que en modo genérico el manifest use nombre/descripción genéricos.

### 4. Login y bienvenida

- [ ] **LoginFormMobile.tsx** (líneas 54, 80, 118): "La PesquerApp", soporte@pesquerapp.com, placeholder ejemplo@lapesquerapp.es → desde config.
- [ ] **LoginFormDesktop.tsx** (líneas 57, 87, 123): mismo patrón → desde config.
- [ ] **LoginFormContent.tsx** (línea 79): placeholder email → desde config.
- [ ] **LoginWelcomeStep.tsx** (línea 70): texto "La PesquerApp" → desde config.

### 5. PWA (banners y guía)

- [ ] **InstallPromptBanner.jsx** (líneas 67, 140): "Instala PesquerApp" y cualquier otra mención → desde config.
- [ ] **InstallGuideIOS.jsx** (líneas 217, 271, 296): "Instalar PesquerApp" y similares → desde config.

### 6. Landing

- [ ] **LandingPage/index.js** (líneas 29, 40, 422, 434, 445): h1, enlaces a test.lapesquerapp.es, footer (nombre, info@lapesquerapp.es, © 2025 La PesquerApp) → desde config.
- [ ] **Comportamiento en modo genérico**: según el apartado "Landing en modo genérico: no visible", la ruta que muestre la landing no debe mostrar contenido de marca; redirección, 404 o página mínima neutra.

### 7. Lógica y hooks

- [ ] **useLoginTenant.ts** (línea 33): `setDemoEmail("admin@lapesquerapp.es")` → usar email de demo desde config.
- [ ] **src/app/page.js** (línea 29): `baseDomain = "lapesquerapp.es"` → desde config (o env leída por el módulo de branding).

### 8. Comentarios y alt de logo

- [ ] **Chat/index.js** (línea 6): comentario "Integrado en La PesquerApp..." → sustituir por texto genérico o que use el nombre desde config.
- [ ] **Admin Layout Navbar** (`src/components/Admin/Layout/Navbar/index.js`, línea 73): `alt="BlueApp"` → desde config (valor genérico vs valor con marca).

---

## Orden sugerido de trabajo

1. Definir variables de entorno en `.env.example` (solo nombres y comentario; sin implementar cambios en docs más allá de añadir las nuevas vars).
2. Crear el módulo de config de branding y exportar todos los valores necesarios para los puntos anteriores.
3. Sustituir referencias en `layout.js` (metadata y meta PWA).
4. Sustituir referencias en componentes de Login y en Landing (textos y enlaces).
5. Sustituir en PWA (InstallPromptBanner, InstallGuideIOS).
6. Ajustar config.js, useLoginTenant, page.js (baseDomain), Chat (comentario), Navbar (alt).
7. Implementar lógica “landing no visible en modo genérico” (redirección / 404 / página neutra).
8. Resolver manifest (script de build o API route) y, si se desea, rutas de favicon según branding.
9. Generar documentación del sistema en `docs/` (descripción del sistema + instrucciones de uso), según la sección "Documentación del sistema (entregable obligatorio)".

---

## Restricciones

- No modificar archivos listados **solo** en la sección 2 (Documentación) de la auditoría.
- No cambiar `package.json` `name` ni documentación interna como objetivo de este prompt.
- Un único punto de verdad para branding: el módulo de config; el resto del código solo importa ese módulo (y no lee env directamente para nombres/dominios/emails de app).

---

## Documentación del sistema (entregable obligatorio)

Tras la implementación, **generar documentación** que describa el sistema de branding resultante y que sirva de referencia para quien mantenga o amplíe el proyecto. La documentación es **obligatoria** y debe incluir:

### 1. Descripción del sistema

- **Qué hace el sistema**: interruptor por .env entre modo genérico y modo con marca (La PesquerApp); una sola fuente de verdad (módulo de config) y consumo en layout, login, landing, PWA, etc.
- **Componentes principales**: ruta del módulo de config de branding, variables de entorno usadas, y dónde se consumen (layout, componentes de login, landing, manifest, etc.) de forma resumida.
- **Comportamiento por modo**:
  - Con `NEXT_PUBLIC_APP_BRANDING=generic`: qué se muestra (nombres, emails, dominios), que la landing no es accesible y cómo (redirección / 404 / página neutra).
  - Con `NEXT_PUBLIC_APP_BRANDING=pesquerapp`: que la app muestra la identidad completa y la landing es visible.
- **Manifest**: si se generó por script de build o por API route, indicarlo y en qué archivo o ruta.

### 2. Instrucciones de uso

- **Cómo cambiar de modo**: qué variable(s) modificar (ej. `NEXT_PUBLIC_APP_BRANDING`), en qué archivo (`.env`), y si hace falta reiniciar servidor o volver a hacer build.
- **Cómo añadir o cambiar valores de branding**: si hay que tocar solo el módulo de config, solo env, o ambos; lista de las claves exportadas por el módulo (appName, appShortName, supportEmail, etc.) y su propósito.
- **Despliegue**: si en Vercel u otra plataforma hay que configurar las mismas variables; recordatorio de que en genérico la landing no debe ser accesible.

### 3. Ubicación

- La documentación debe quedar en **`docs/`** (por ejemplo `docs/branding-sistema-env.md` o `docs/guia-branding-generico-env.md`). El nombre del archivo debe ser claro y estable.
- Si el proyecto ya tiene un índice de documentación en `docs/`, añadir una entrada que enlace a este documento.

---

## Entregable

- **Código** implementado según el checklist anterior.
- **Comportamiento verificable**: con `NEXT_PUBLIC_APP_BRANDING=generic` la app muestra textos/dominios genéricos y la landing no es visible; con `NEXT_PUBLIC_APP_BRANDING=pesquerapp` (o el valor acordado) la app se ve como hasta ahora (incluida la landing).
- **Documentación del sistema**: archivo en `docs/` con la descripción del sistema (apartado anterior) e instrucciones de uso; obligatorio, no opcional.
