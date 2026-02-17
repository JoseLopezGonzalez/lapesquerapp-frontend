/**
 * Configuración de branding de la aplicación.
 * Única fuente de verdad: lee NEXT_PUBLIC_APP_BRANDING y exporta valores para layout, login, landing, PWA y manifest.
 * El resto del código no debe leer process.env para branding; solo importar este módulo.
 */

const branding = process.env.NEXT_PUBLIC_APP_BRANDING || "generic";
const isPesquerApp = branding === "pesquerapp";

export const isGenericBranding = !isPesquerApp;

export const appName = isPesquerApp ? "La PesquerApp" : "App";
export const appShortName = isPesquerApp ? "PesquerApp" : "App";

/** URL base para metadata (Open Graph, etc.) */
export const metadataBaseUrl = isPesquerApp ? "https://lapesquerapp.es" : "https://example.com";

/** Dominio base para lógica tenant/redirección (ej. lapesquerapp.es). En generic, opcional vía NEXT_PUBLIC_APP_GENERIC_BASE_DOMAIN para deploy en un solo host (ej. brisamar.congeladosbrisamar.es → base = congeladosbrisamar.es, se trata como tenant "brisamar"). */
export const baseDomain = isPesquerApp ? "lapesquerapp.es" : (process.env.NEXT_PUBLIC_APP_GENERIC_BASE_DOMAIN || "").trim() || "";

export const supportEmail = isPesquerApp ? "soporte@pesquerapp.com" : "soporte@example.com";
export const demoEmail = isPesquerApp ? "admin@lapesquerapp.es" : "admin@example.com";
export const exampleEmail = isPesquerApp ? "ejemplo@lapesquerapp.es" : "ejemplo@example.com";
export const infoEmail = isPesquerApp ? "info@lapesquerapp.es" : "info@example.com";

/** URL del botón "Ver demo" en landing (solo en modo pesquerapp tiene sentido; en genérico no se muestra landing) */
export const demoUrl = isPesquerApp ? "https://test.lapesquerapp.es" : "#";

/** Alt del logo en navbar (y otros logos de marca) */
export const logoAlt = isPesquerApp ? "PesquerApp" : "App";

/** Rutas de iconos y assets según branding (en public/). PesquerApp en /pesquerapp/; genérico con sufijo -generic en raíz. */
export const faviconPath = isPesquerApp ? "/pesquerapp/favicon.ico" : "/favicon-generic.png";
export const appleTouchIconPath = isPesquerApp ? "/pesquerapp/apple-touch-icon.png" : "/apple-touch-icon-generic.png";
export const ogImagePath = isPesquerApp ? "/pesquerapp/og-image.png" : "/og-image-generic.png";
export const icon192Path = isPesquerApp ? "/pesquerapp/icons/icon-192x192.png" : "/icons/icon-192x192-generic.png";
export const icon512Path = isPesquerApp ? "/pesquerapp/icons/icon-512x512.png" : "/icons/icon-512x512-generic.png";

/** Base path para splash screens iOS (PWA). Vacío en genérico = no se enlazan splash específicos. */
export const splashBasePath = isPesquerApp ? "/pesquerapp/splash" : "";

/** Fallback de API base solo en modo pesquerapp; en genérico no exponer dominio real */
export const apiBaseUrlFallback = isPesquerApp ? "https://api.lapesquerapp.es" : "";

// Manifest (name, short_name, description) — usados por la API route del manifest
export const manifestName = isPesquerApp ? "La PesquerApp ERP" : "App";
export const manifestShortName = isPesquerApp ? "PesquerApp" : "App";
export const manifestDescription = isPesquerApp
  ? "ERP diseñado para empresas pesqueras. Controla producción, trazabilidad, compras, ventas y etiquetado."
  : "Aplicación web.";
