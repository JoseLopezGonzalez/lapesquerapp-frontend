# Guía: sistema de branding genérico controlado por .env

**Última actualización**: 2025-02-17

---

## 1. Descripción del sistema

### Qué hace el sistema

- **Interruptor por .env** entre modo genérico y modo con marca (La PesquerApp). Una sola fuente de verdad (módulo de config) y consumo en layout, login, landing, PWA, etc.
- Con **`NEXT_PUBLIC_APP_BRANDING=pesquerapp`**: la app muestra la identidad completa y la landing es visible en la ruta raíz.
- Con **`NEXT_PUBLIC_APP_BRANDING=generic`** (o no definida, o cualquier otro valor): textos y dominios neutros; **la landing no es accesible** (en la ruta raíz no se muestra nada; página en blanco).

### Componentes principales

| Elemento | Detalle |
|----------|---------|
| **Módulo de config** | `src/configs/branding.js` — lee `NEXT_PUBLIC_APP_BRANDING` y exporta todas las constantes de branding. |
| **Variables de entorno** | `NEXT_PUBLIC_APP_BRANDING` = `generic` \| `pesquerapp`. |
| **Dónde se consumen** | Layout (`src/app/layout.js`), config API (`src/configs/config.js`), componentes de login (LoginFormMobile, LoginFormDesktop, LoginFormContent, LoginWelcomeStep), landing (`src/components/LandingPage/index.js`), PWA (InstallPromptBanner, InstallGuideIOS), hooks (useLoginTenant), página raíz (`src/app/page.js`), Navbar, manifest (API route). |

### Comportamiento por modo

- **`NEXT_PUBLIC_APP_BRANDING=generic`** (o no definida):
  - Nombres: "App", "App". Emails/dominios genéricos (ejemplo@example.com, soporte@example.com, etc.).
  - **Landing no accesible**: en la ruta `/` no se muestra nada (página en blanco).
  - Manifest: nombre y descripción genéricos.
  - **Iconos y PWA**: se usan rutas con sufijo `-generic` (ver apartado "Iconos y favicon en modo genérico").

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
  - `baseDomain` — Dominio base para lógica tenant/redirección (ej. lapesquerapp.es). En generic puede venir de `NEXT_PUBLIC_APP_GENERIC_BASE_DOMAIN` para deploy en un solo host.
  - `supportEmail`, `demoEmail`, `exampleEmail`, `infoEmail` — Emails de soporte, demo, placeholder e info.
  - `demoUrl` — URL del botón "Ver demo" en landing.
  - `logoAlt` — Texto alternativo del logo (navbar).
  - `apiBaseUrlFallback` — Fallback de URL de API solo en modo pesquerapp; en genérico no se expone dominio real.
  - `manifestName`, `manifestShortName`, `manifestDescription` — Usados por la API del manifest.
  - `faviconPath`, `appleTouchIconPath`, `ogImagePath`, `icon192Path`, `icon512Path` — Rutas de iconos y Open Graph según modo (genérico usa sufijo `-generic`).
  - `splashBasePath` — Ruta base para splash screens iOS (ej. `/pesquerapp/splash`); vacía en genérico.
  - `isGenericBranding` — `true` cuando el branding no es pesquerapp (para no mostrar landing en raíz).

### Iconos y favicon por modo

- **Modo La PesquerApp**: favicon, apple touch, og-image, iconos PWA y **splash screens iOS** están en **`public/pesquerapp/`** (`public/pesquerapp/icons/` para 192 y 512, `public/pesquerapp/splash/` para los PNG de splash). Las rutas usadas son `/pesquerapp/...`; el layout solo enlaza los splash cuando hay `splashBasePath` (modo pesquerapp). En modo genérico no se enlazan splash específicos; el fallback usa `appleTouchIconPath`.
- **Modo genérico**: el layout y el manifest usan rutas en la raíz de `public/` con sufijo `-generic`. Hay que **crear y colocar** estos archivos en `public/` (y en `public/icons/` cuando aplique):

| Archivo | Uso | Recomendación |
|---------|-----|----------------|
| `favicon-generic.ico` | Pestaña del navegador | 16×16 o 32×32, neutro |
| `apple-touch-icon-generic.png` | iOS / PWA apple touch | 180×180 px |
| `og-image-generic.png` | Open Graph / redes | 1200×630 px |
| `icons/icon-192x192-generic.png` | PWA Android/Chrome | 192×192 px |
| `icons/icon-512x512-generic.png` | PWA Android/Chrome | 512×512 px |

El proyecto incluye **placeholders** en `public/` con las dimensiones correctas (32×32 favicon, 180×180 apple-touch, 192×192 y 512×512 para PWA) para evitar 404 y el error del manifest "Resource size is not correct". Para regenerarlos: `npm run generate-generic-icons` (usa `scripts/generate-generic-icons.js` y devDependency `pngjs`). Puedes sustituir los PNG por iconos definitivos. En genérico el favicon usa `.png` (no `.ico`). Los splash screens de iOS en el layout siguen en `/splash/` (compartidos); el fallback de splash usa `appleTouchIconPath`.

### Despliegue

- En **Vercel** u otra plataforma, configurar la misma variable `NEXT_PUBLIC_APP_BRANDING` con valor `generic` o `pesquerapp` según el entorno.
- Recordatorio: en **modo genérico** la landing no es accesible (raíz en blanco); configurar iconos genéricos si se usa ese modo.

**Generic en un solo host (sin subdominios):** Si el front generic está alojado en una URL que ya es “de tenant” (ej. `brisamar.congeladosbrisamar.es` en vez de `lapesquerapp.com` + `brisamar.lapesquerapp.com`), hay que definir **`NEXT_PUBLIC_APP_GENERIC_BASE_DOMAIN`** con el dominio base. Así la app interpreta el host como subdominio y muestra login en lugar de la página en blanco. Ejemplo: deploy en `brisamar.congeladosbrisamar.es` → `NEXT_PUBLIC_APP_GENERIC_BASE_DOMAIN=congeladosbrisamar.es` (el “tenant” será `brisamar`, como en useLoginTenant y llamadas al API). Sin esta variable, generic en ese host se considera “raíz” y se muestra la pantalla en blanco.

**Deploy generic: qué hacer exactamente (ej. Vercel en brisamar.congeladosbrisamar.es)**  
En el proyecto de Vercel que sirve la URL generic, en **Settings → Environment Variables** definir:

| Variable | Valor | Notas |
|----------|--------|--------|
| `NEXT_PUBLIC_APP_BRANDING` | `generic` | Obligatorio para modo generic. |
| `NEXT_PUBLIC_APP_GENERIC_BASE_DOMAIN` | `congeladosbrisamar.es` | Para que ese host se trate como tenant "brisamar" y se muestre login (sin esto se ve página en blanco). |
| `NEXTAUTH_URL` | `https://brisamar.congeladosbrisamar.es` | URL pública del front, sin barra final. Evita 500 en `/api/auth/session`. |
| `NEXTAUTH_SECRET` | *(valor secreto)* | Ej. `openssl rand -base64 32`. Obligatorio en producción. |
| `NEXT_PUBLIC_API_URL` (o `NEXT_PUBLIC_API_BASE_URL`) | URL del backend para ese tenant | Sin esto la app no puede llamar al API. |

Después de guardar las variables, hacer **Redeploy** del último deployment para que el build use los nuevos valores. Tras el deploy, al entrar en `https://brisamar.congeladosbrisamar.es` debe mostrarse la pantalla de login y el tenant enviado al API será `brisamar`.

### Si `/api/auth/session` devuelve 500 en producción

No es por el branding. NextAuth requiere en el servidor de producción:

- **`NEXTAUTH_URL`**: URL pública de la app (ej. `https://brisamar.congeladosbrisamar.es`), sin barra final.
- **`NEXTAUTH_SECRET`**: una cadena secreta para firmar cookies/JWT (generar con `openssl rand -base64 32`).

Sin estas variables, NextAuth puede devolver 500. Revisar los logs del servidor y las variables de entorno del despliegue.

---

## 3. Ubicación

- Este documento: **`docs/guia-branding-generico-env.md`**.
- Índice: en `docs/00-docs-map.md` se puede añadir una entrada que enlace a esta guía (por ejemplo en documentos principales o en una sección de guías/config).
