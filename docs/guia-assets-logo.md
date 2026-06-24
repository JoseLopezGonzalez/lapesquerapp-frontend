# Guía de Assets de Logo — La PesquerApp

Checklist completo de archivos a crear desde Illustrator para tener la identidad visual al 100% en la app.

---

## Flujo recomendado

1. Exporta el **ícono cuadrado 512×512px** primero — es el master del que derivan casi todos los demás.
2. Exporta el **logo horizontal** — visible en toda la UI.
3. Genera `favicon.ico` con una herramienta online.
4. Genera los **splash screens** con PWA Builder (2 minutos, automático).
5. Diseña el **OG image** por separado (es un banner, no un ícono).

---

## 1. Logo horizontal (navbar)

Visible en el sidebar y la barra superior móvil de toda la app.

| Campo | Valor |
|---|---|
| **Archivo** | `blueapp-logo-horizontal.png` |
| **Ubicación** | `public/logos/` |
| **Dimensiones** | Libre en ancho · altura mínima **112px** (se muestra a 56px en pantallas Retina) |
| **Fondo** | Transparente |
| **Contenido** | Logo completo con texto (horizontal) |
| **Formato** | PNG |

> El Navbar lo renderiza con `h-14` (56px) y `h-10` (40px) en mobile — el ancho es libre (`w-auto`).

- [ ] Exportado y guardado en `public/logos/blueapp-logo-horizontal.png`

---

## 2. Ícono cuadrado — master 512×512

Base para todos los assets de PWA, favicon y PWA splash screens.

| Campo | Valor |
|---|---|
| **Archivo** | `icon-512x512.png` |
| **Ubicación** | `public/pesquerapp/icons/` |
| **Dimensiones** | **512×512px** |
| **Fondo** | Color sólido de marca (no transparente — Android lo usa como splash background) |
| **Contenido** | Solo el símbolo/mark, **sin texto** |
| **Safe area** | Deja al menos 40px de margen en cada lado |
| **Formato** | PNG |

- [ ] Exportado y guardado en `public/pesquerapp/icons/icon-512x512.png`

---

## 3. Ícono PWA 192×192

| Campo | Valor |
|---|---|
| **Archivo** | `icon-192x192.png` |
| **Ubicación** | `public/pesquerapp/icons/` |
| **Dimensiones** | **192×192px** |
| **Fondo** | Igual que el 512 (color sólido) |
| **Contenido** | Mismo diseño que el 512, escalado |
| **Formato** | PNG |

> Puedes redimensionar el 512 directamente — no hace falta redibujar.

- [ ] Exportado y guardado en `public/pesquerapp/icons/icon-192x192.png`

---

## 4. Apple Touch Icon (iOS home screen)

Ícono que aparece en la pantalla de inicio de iPhone/iPad al instalar la PWA.

| Campo | Valor |
|---|---|
| **Archivo** | `apple-touch-icon.png` |
| **Ubicación** | `public/pesquerapp/` |
| **Dimensiones** | **180×180px** |
| **Fondo** | Color sólido de marca — **obligatorio** (iOS recorta con bordes redondeados, el fondo transparente queda negro) |
| **Contenido** | Solo el símbolo/mark, sin texto |
| **Safe area** | Logo centrado, máximo **130px** de ancho/alto dentro de los 180px |
| **Formato** | PNG |

- [ ] Exportado y guardado en `public/pesquerapp/apple-touch-icon.png`

---

## 5. Favicon PNG 96×96

| Campo | Valor |
|---|---|
| **Archivo** | `favicon-96x96.png` |
| **Ubicación** | `public/pesquerapp/` |
| **Dimensiones** | **96×96px** |
| **Fondo** | Transparente o sólido |
| **Contenido** | Símbolo/mark |
| **Formato** | PNG |

- [ ] Exportado y guardado en `public/pesquerapp/favicon-96x96.png`

---

## 6. Favicon SVG

Favicon vectorial para navegadores modernos (Chrome, Firefox, Edge). El que está ahora en el repo es el SVG del logo actual — reemplazarlo con el nuevo.

| Campo | Valor |
|---|---|
| **Archivo** | `favicon.svg` |
| **Ubicación** | `public/pesquerapp/` |
| **Dimensiones** | `viewBox="0 0 64 64"` recomendado (o cuadrado) |
| **Fondo** | Transparente (puedes añadir un `<rect>` con el color de marca si lo prefieres) |
| **Contenido** | SVG simplificado del símbolo — exportar desde Illustrator como SVG optimizado |
| **Formato** | SVG |

> En Illustrator: Archivo → Exportar → Exportar como → SVG · marcar "Usar tableros" · estilo "Presentación".

- [ ] Exportado y guardado en `public/pesquerapp/favicon.svg`

---

## 7. Favicon .ico

Archivo multi-resolución para la pestaña del navegador (compatibilidad universal).

| Campo | Valor |
|---|---|
| **Archivo** | `favicon.ico` |
| **Ubicación** | `public/pesquerapp/` |
| **Dimensiones** | Multi-resolución: 16×16, 32×32, 48×48 (el generador lo hace automático) |
| **Cómo generarlo** | Sube el `favicon-96x96.png` a **https://favicon.io/favicon-converter/** → descarga el `.ico` |

- [ ] Generado y guardado en `public/pesquerapp/favicon.ico`

---

## 8. OG Image (redes sociales / Open Graph)

Banner que aparece al compartir un enlace de la app en WhatsApp, Twitter, LinkedIn, etc.

| Campo | Valor |
|---|---|
| **Archivo** | `og-image.png` |
| **Ubicación** | `public/pesquerapp/` |
| **Dimensiones** | **1200×630px** |
| **Fondo** | Color de marca o imagen de fondo |
| **Contenido** | Logo horizontal + tagline ("ERP para el sector pesquero" o similar) |
| **Formato** | PNG |

> No es un ícono — es un banner de diseño libre. Puedes incluir texto, gradientes, mockup de la app, etc.

- [ ] Diseñado y guardado en `public/pesquerapp/og-image.png`

---

## 9. Logo de tenant Brisamar

Logo que identifica al cliente Brisamar dentro de la plataforma.

| Campo | Valor |
|---|---|
| **Archivo** | `brisamar.png` |
| **Ubicación** | `public/images/tenants/logos/` |
| **Dimensiones** | Libre · mismas proporciones que el logo horizontal |
| **Fondo** | Transparente |
| **Contenido** | Logo de Brisamar (o el logo horizontal de PesquerApp si se usa como marca blanca) |
| **Formato** | PNG |

- [ ] Exportado y guardado en `public/images/tenants/logos/brisamar.png`

---

## 10. Splash screens iOS (11 archivos)

Pantalla que aparece mientras carga la PWA en iPhone/iPad al abrirla desde el home screen.

### Opción A — Automático (recomendado, 2 minutos)

1. Ve a **https://www.pwabuilder.com/imageGenerator**
2. Sube el `icon-512x512.png`
3. Configura el color de fondo de marca
4. Descarga el ZIP → copia los PNG a `public/pesquerapp/splash/`

### Opción B — Manual desde Illustrator

Todos son portrait · PNG · logo centrado sobre fondo sólido.

| Archivo | Dimensiones | Dispositivo |
|---|---|---|
| `iphone-14-pro-max.png` | **1290×2796px** | iPhone 14 Pro Max |
| `iphone-14-pro.png` | **1179×2556px** | iPhone 14 Pro |
| `iphone-14-plus.png` | **1284×2778px** | iPhone 14 Plus |
| `iphone-14.png` | **1170×2532px** | iPhone 14 |
| `iphone-13-pro-max.png` | **1284×2778px** | iPhone 13/12 Pro Max |
| `iphone-13-pro.png` | **1170×2532px** | iPhone 13/12 Pro |
| `iphone-se-3.png` | **750×1334px** | iPhone SE (3ª gen) |
| `ipad-pro-12.9.png` | **2048×2732px** | iPad Pro 12.9" |
| `ipad-pro-11.png` | **1668×2388px** | iPad Pro 11" |
| `ipad-air.png` | **1640×2360px** | iPad Air |
| `ipad-mini.png` | **1488×2266px** | iPad Mini |

Todos van en `public/pesquerapp/splash/`.

- [ ] Splash screens generados y colocados en `public/pesquerapp/splash/`

---

## Checklist final

| # | Asset | Archivo | ¿Listo? |
|---|---|---|---|
| 1 | Logo horizontal navbar | `public/logos/blueapp-logo-horizontal.png` | [ ] |
| 2 | Ícono master 512px | `public/pesquerapp/icons/icon-512x512.png` | [ ] |
| 3 | Ícono PWA 192px | `public/pesquerapp/icons/icon-192x192.png` | [ ] |
| 4 | Apple Touch Icon 180px | `public/pesquerapp/apple-touch-icon.png` | [ ] |
| 5 | Favicon PNG 96px | `public/pesquerapp/favicon-96x96.png` | [ ] |
| 6 | Favicon SVG | `public/pesquerapp/favicon.svg` | [ ] |
| 7 | Favicon ICO | `public/pesquerapp/favicon.ico` | [ ] |
| 8 | OG Image 1200×630 | `public/pesquerapp/og-image.png` | [ ] |
| 9 | Logo tenant Brisamar | `public/images/tenants/logos/brisamar.png` | [ ] |
| 10 | Splash screens iOS (×11) | `public/pesquerapp/splash/*.png` | [ ] |
