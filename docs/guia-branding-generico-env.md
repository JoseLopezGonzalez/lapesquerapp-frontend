# Guía: sistema de branding genérico controlado por .env

**Última actualización**: 2025-02-17

---

## 1. Descripción del sistema

### Qué hace el sistema

- **Interruptor por .env** entre modo genérico y modo con marca (La PesquerApp). Una sola fuente de verdad (módulo de config) y consumo en layout, login, landing, PWA, etc.
- Con **`NEXT_PUBLIC_APP_BRANDING=pesquerapp`**: la app muestra la identidad completa y la landing es visible en la ruta raíz.
- Con **`NEXT_PUBLIC_APP_BRANDING=generic`** (o no definida, o cualquier otro valor): textos y dominios neutros; **la landing no es accesible** (en la ruta raíz se muestra la pantalla de login).

### Componentes principales

| Elemento | Detalle |
|----------|---------|
| **Módulo de config** | `src/configs/branding.js` — lee `NEXT_PUBLIC_APP_BRANDING` y exporta todas las constantes de branding. |
| **Variables de entorno** | `NEXT_PUBLIC_APP_BRANDING` = `generic` \| `pesquerapp`. |
| **Dónde se consumen** | Layout (`src/app/layout.js`), config API (`src/configs/config.js`), componentes de login (LoginFormMobile, LoginFormDesktop, LoginFormContent, LoginWelcomeStep), landing (`src/components/LandingPage/index.js`), PWA (InstallPromptBanner, InstallGuideIOS), hooks (useLoginTenant), página raíz (`src/app/page.js`), Navbar, manifest (API route). |

### Comportamiento por modo

- **`NEXT_PUBLIC_APP_BRANDING=generic`** (o no definida):
  - Nombres: "App", "App". Emails/dominios genéricos (ejemplo@example.com, soporte@example.com, etc.).
  - **Landing no accesible**: en la ruta `/` se muestra la pantalla de login en lugar del contenido de la landing (redirección de comportamiento: no se renderiza la landing).
  - Manifest: nombre y descripción genéricos.

- **`NEXT_PUBLIC_APP_BRANDING=pesquerapp`**:
  - Identidad completa: La PesquerApp, PesquerApp, lapesquerapp.es, emails de soporte/demo/info.
  - **Landing visible** en la ruta raíz cuando el host es el dominio principal (sin subdominio de tenant).

### Manifest

- El manifest PWA se sirve por **API route** (no por script de build).
- **Archivo**: `src/app/api/manifest/route.js`.
- **Ruta**: el layout enlaza con `manifest: "/api/manifest"`. La ruta GET `/api/manifest` devuelve el JSON leyendo `manifestName`, `manifestShortName` y `manifestDescription` del módulo de branding.

---

## 2. Instrucciones de uso

### Cómo cambiar de modo

1. **Variable a modificar**: `NEXT_PUBLIC_APP_BRANDING`.
2. **Archivo**: `.env` (o variables de entorno en el host de despliegue).
3. **Valores**: `pesquerapp` para identidad La PesquerApp; `generic` (o no definir la variable) para modo genérico.
4. **Reiniciar** el servidor de desarrollo o **volver a hacer build** para que los valores se apliquen (son `NEXT_PUBLIC_*`, inyectados en build).

### Cómo añadir o cambiar valores de branding

- **Solo el módulo de config**: editar `src/configs/branding.js`. Los valores por modo (genérico vs pesquerapp) se definen ahí; no hace falta tocar .env para cambiar textos, solo para cambiar de modo.
- **Claves exportadas** y propósito:
  - `appName` — Nombre completo (pestaña, Open Graph, footer, login).
  - `appShortName` — Nombre corto (PWA, meta apple-mobile-web-app-title, banners "Instala X").
  - `metadataBaseUrl` — URL base para metadata y Open Graph.
  - `baseDomain` — Dominio base para lógica tenant/redirección (ej. lapesquerapp.es).
  - `supportEmail`, `demoEmail`, `exampleEmail`, `infoEmail` — Emails de soporte, demo, placeholder e info.
  - `demoUrl` — URL del botón "Ver demo" en landing.
  - `logoAlt` — Texto alternativo del logo (navbar).
  - `apiBaseUrlFallback` — Fallback de URL de API solo en modo pesquerapp; en genérico no se expone dominio real.
  - `manifestName`, `manifestShortName`, `manifestDescription` — Usados por la API del manifest.
  - `isGenericBranding` — `true` cuando el branding no es pesquerapp (para no mostrar landing en raíz).

### Despliegue

- En **Vercel** u otra plataforma, configurar la misma variable `NEXT_PUBLIC_APP_BRANDING` con valor `generic` o `pesquerapp` según el entorno.
- Recordatorio: en **modo genérico** la landing no debe ser accesible; la raíz muestra login.

---

## 3. Ubicación

- Este documento: **`docs/guia-branding-generico-env.md`**.
- Índice: en `docs/00-docs-map.md` se puede añadir una entrada que enlace a esta guía (por ejemplo en documentos principales o en una sección de guías/config).
