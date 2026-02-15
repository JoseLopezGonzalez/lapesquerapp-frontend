"use client";

import { useState, useEffect } from "react";
import { API_URL_V2 } from "@/configs/config";

interface TenantApiResponse {
  error?: unknown;
  active?: boolean;
}

export function useLoginTenant() {
  const [tenantChecked, setTenantChecked] = useState(false);
  const [tenantActive, setTenantActive] = useState(true);
  const [brandingImageUrl, setBrandingImageUrl] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [demoEmail, setDemoEmail] = useState<string | null>(null);

  useEffect(() => {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";
    const subdomain = hostname.split(".")[0];

    if (subdomain === "test") {
      setIsDemo(true);
      setDemoEmail("admin@lapesquerapp.es");
    }

    const isDevLocalhost =
      hostname.includes("localhost") && subdomain === "dev";
    const path = isDevLocalhost
      ? "/images/landing.png"
      : `/images/tenants/${subdomain}/image.png`;
    setBrandingImageUrl(path);

    fetch(`${API_URL_V2}public/tenant/${subdomain}`)
      .then((res) => res.json())
      .then((data: TenantApiResponse) => {
        if (isDevLocalhost) {
          setTenantActive(true);
          return;
        }
        if (!data || data.error || data.active === false) {
          setTenantActive(false);
        }
      })
      .catch(() => setTenantActive(isDevLocalhost))
      .finally(() => setTenantChecked(true));
  }, []);

  return {
    tenantChecked,
    tenantActive,
    brandingImageUrl,
    isDemo,
    demoEmail,
  };
}
