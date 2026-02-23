"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  active: { label: "Activo", className: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400" },
  suspended: { label: "Suspendido", className: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  pending: { label: "Pendiente", className: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  cancelled: { label: "Cancelado", className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
