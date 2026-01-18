import ClientLayout from "./ClientLayout";
import "./globals.css";

export const metadata = {
  title: {
    default: "La PesquerApp | ERP para pequeñas y medianas empresas pesqueras",
    template: "%s | La PesquerApp",
  },
  description: "ERP diseñado para empresas pesqueras. Controla producción, trazabilidad, compras, ventas y etiquetado.",
  keywords: ["ERP", "pesca", "trazabilidad", "producción", "ventas", "industria alimentaria"],
  metadataBase: new URL("https://lapesquerapp.es"),
  openGraph: {
    title: "La PesquerApp | El ERP de la industria pesquera",
    description: "Solución ERP moderna para pequeñas y medianas empresas del sector pesquero.",
    url: "https://lapesquerapp.es",
    siteName: "La PesquerApp",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "La PesquerApp - ERP para el sector pesquero",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "La PesquerApp | ERP para el sector pesquero",
    description: "Solución completa ERP para empresas del sector pesquero.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* iOS PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="PesquerApp" />
        
        {/* Android/Chrome PWA Meta Tags */}
        {/* theme-color controla: barra de estado (notificaciones), barra de navegación y navegador */}
        {/* Light mode: barras claras (blanco) para armonizar con fondo blanco */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        {/* Dark mode: barras oscuras (casi negro) para armonizar con fondo oscuro */}
        <meta name="theme-color" content="#0f0f0f" media="(prefers-color-scheme: dark)" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS Splash Screens - iPhone 14 Series */}
        {/* iPhone 14 Pro Max */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/iphone-14-pro-max.png" 
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        
        {/* iPhone 14 Pro */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/iphone-14-pro.png" 
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        
        {/* iPhone 14 Plus */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/iphone-14-plus.png" 
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        
        {/* iPhone 14 */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/iphone-14.png" 
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iOS Splash Screens - iPhone 13/12 Series (compatibilidad) */}
        {/* iPhone 13/12 Pro Max */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/iphone-13-pro-max.png" 
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        
        {/* iPhone 13/12 Pro */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/iphone-13-pro.png" 
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        
        {/* iPhone SE (3ra gen) */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/iphone-se-3.png" 
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iOS Splash Screens - iPad */}
        {/* iPad Pro 12.9" */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/ipad-pro-12.9.png" 
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        
        {/* iPad Pro 11" */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/ipad-pro-11.png" 
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        
        {/* iPad Air */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/ipad-air.png" 
          media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        
        {/* iPad Mini */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/ipad-mini.png" 
          media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* Fallback - Usar apple-touch-icon si no hay splash screen específico */}
        <link 
          rel="apple-touch-startup-image" 
          href="/apple-touch-icon.png"
        />
      </head>
      <body className="bg-background w-full">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
