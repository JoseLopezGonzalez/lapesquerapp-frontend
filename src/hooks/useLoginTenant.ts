"use client";

import { useState, useEffect } from "react";
import { API_URL_V2 } from "@/configs/config";

/** Respuesta 200: convención Laravel API Resource (payload en `data`) */
interface TenantSuccessPayload {
  active: boolean;
  name: string;
}

interface TenantApiResponse {
  data?: TenantSuccessPayload;
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
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
      .then((body: TenantApiResponse) => {
        if (isDevLocalhost) {
          setTenantActive(true);
          return;
        }
        // 200: payload en body.data; 404: body.error; 422: body.message/errors; 429: sin data
        if (body?.data) {
          setTenantActive(body.data.active !== false);
        } else if (body?.error || body?.message || body?.errors) {
          setTenantActive(false);
        } else {
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
