/**
 * Sirve el PWA manifest de forma dinámica según el branding (NEXT_PUBLIC_APP_BRANDING).
 * El layout enlaza con <link rel="manifest" href="/api/manifest" />.
 */

import {
  manifestName,
  manifestShortName,
  manifestDescription,
  icon192Path,
  icon512Path,
  appleTouchIconPath,
} from "@/configs/branding";

export function GET() {
  const manifest = {
    name: manifestName,
    short_name: manifestShortName,
    description: manifestDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    icons: [
      {
        src: icon192Path,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: icon512Path,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: appleTouchIconPath,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
