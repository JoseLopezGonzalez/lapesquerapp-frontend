"use client"

import { Toaster } from "react-hot-toast";
import "./globals.css";
import { SessionProvider } from 'next-auth/react';


// app/layout.tsx o layout.js
export const metadata = {
  title: {
    default: "La PesquerApp | ERP para pequeñas y medianas empresas pesqueras",
    template: "%s | La PesquerApp",
  },
  description: "ERP diseñado para empresas pesqueras. Controla producción, trazabilidad, compras, ventas y etiquetado.",
  keywords: ["ERP", "pesca", "trazabilidad", "producción", "ventas", "industria alimentaria"],
  metadataBase: new URL("https://lapesquerapp.es"), // cambia si usas otro dominio
  openGraph: {
    title: "La PesquerApp | ERP pesquero",
    description: "Solución ERP moderna para la industria pesquera.",
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
    <html lang="en" className="">
      <body
        className={` bg-background  w-full  `}
      >
        <SessionProvider>{children}</SessionProvider>
        <Toaster />

      </body>

    </html>
  );
}


