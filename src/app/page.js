"use client";

import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import { useEffect, useState } from "react";


export default function HomePage() {
  const [isSubdomain, setIsSubdomain] = useState(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const baseDomain = "lapesquerapp.es";

    // Si es exactamente el dominio raíz o www, no hay subdominio
    if (hostname === baseDomain || hostname === "www." + baseDomain) {
      setIsSubdomain(false);
    } else if (hostname.endsWith("." + baseDomain)) {
      setIsSubdomain(true); // Es un subdominio como cliente1.lapesquerapp.es
    } else {
      setIsSubdomain(false); // Por si acaso, default a Landing
    }
  }, []);

  if (isSubdomain === null) return null; // o un spinner

  return isSubdomain ? <LoginPage /> : <LandingPage />;
}

