"use client";

import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Utilities/Loader";

export default function HomePage() {
  const [isSubdomain, setIsSubdomain] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const hostname = window.location.hostname;

    // Quita 'localhost' o cualquier dominio principal (incluyendo desarrollo local con subdominios)
    const parts = hostname.split(".");
    const isLocal = hostname.includes("localhost");

    if (isLocal) {
      // Ej: brisamar.localhost → ['brisamar', 'localhost']
      setIsSubdomain(parts.length > 1 && parts[0] !== "localhost");
    } else {
      const baseDomain = "lapesquerapp.es";
      if (hostname === baseDomain || hostname === "www." + baseDomain) {
        setIsSubdomain(false);
      } else if (hostname.endsWith("." + baseDomain)) {
        setIsSubdomain(true);
      } else {
        setIsSubdomain(false); // fallback
      }
    }
  }, []);

  useEffect(() => {
    if (isSubdomain && status === "authenticated") {
      router.replace("/admin/home");
    }
  }, [isSubdomain, status, router]);

  if (isSubdomain === null) return (
    <div className="flex justify-center items-center h-screen w-full">
      <Loader />
    </div>
  )

  if (isSubdomain) {
    if (status === "loading") return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader />
      </div>
    )
    if (status === "authenticated") return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader />
      </div>
    ); 
    return <LoginPage />;
  }
  return <LandingPage />;
}
