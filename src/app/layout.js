"use client"

import { Toaster } from "react-hot-toast";
import "./globals.css";
import { SessionProvider } from 'next-auth/react';


export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={` bg-neutral-950  w-full`}
      >
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}


