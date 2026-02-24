/**
 * Utilidades de fecha para el panel superadmin.
 * formatDate y formatDateTime usan Intl; formatRelative y formatDurationSeconds para UX.
 */

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return String(dateStr);
  }
}

export function formatDateTimeFull(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return String(dateStr);
  }
}

export function formatRelative(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const diff = Date.now() - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    return formatDate(dateStr);
  } catch {
    return "";
  }
}

/**
 * Formato legible de duración en segundos: "Xs", "Xm Ys", "Xh Ym Zs"
 */
export function formatDurationSeconds(seconds) {
  if (seconds == null || seconds < 0) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (min > 0) return `${h}h ${min}m`;
  return `${h}h`;
}
