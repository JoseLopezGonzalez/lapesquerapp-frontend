"use client"

import { Toaster } from "react-hot-toast";
import "./globals.css";
import { SessionProvider } from 'next-auth/react';


export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={` bg-neutral-900 h-full w-full`}
      >
        <div class="absolute top-0 z-[-2] h-screen w-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">

          <SessionProvider>{children}</SessionProvider>
          <Toaster />
        </div>
      </body>

    </html>
  );
}


