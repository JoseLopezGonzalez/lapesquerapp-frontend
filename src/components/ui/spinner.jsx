"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className, size = "default", ...props }) {
  return (
    <Loader2
      role="status"
      aria-label="Cargando"
      className={cn(
        "animate-spin text-primary",
        size === "sm" && "size-4",
        size === "default" && "size-6",
        size === "lg" && "size-10",
        className
      )}
      {...props}
    />
  );
}

export { Spinner };
