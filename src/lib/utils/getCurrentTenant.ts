/**
 * Obtiene el tenant actual desde window.location.host (solo cliente).
 * En servidor retorna null; el tenant debe obtenerse desde headers.
 */
export function getCurrentTenant(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const clientHost = window.location.host;
    const parts = clientHost.split(".");
    const isLocal = clientHost.includes("localhost");

    let tenant: string;
    if (isLocal) {
      tenant =
        parts.length > 1 && parts[0] !== "localhost" ? parts[0] : "brisamar";
    } else {
      tenant = parts[0] ?? "";
    }

    if (!tenant || tenant.trim() === "") {
      console.warn("[getCurrentTenant] Tenant vacío detectado, usando default: brisamar");
      return "brisamar";
    }

    return tenant;
  } catch (error) {
    console.error("[getCurrentTenant] Error al obtener tenant:", error);
    return null;
  }
}
