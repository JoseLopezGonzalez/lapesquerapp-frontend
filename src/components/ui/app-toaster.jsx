"use client";

import { useTheme } from "next-themes";
import { CircleAlert, CircleCheck, Info, LoaderCircle, X } from "lucide-react";
import { Toaster as Sonner } from "sonner";

export function AppToaster(props) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      offset={16}
      visibleToasts={6}
      expand
      closeButton
      richColors
      className="toaster pointer-events-auto"
      icons={{
        success: <CircleCheck className="size-4" />,
        info: <Info className="size-4" />,
        warning: <CircleAlert className="size-4" />,
        error: <CircleAlert className="size-4" />,
        loading: <LoaderCircle className="size-4 animate-spin" />,
        close: <X className="size-4" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-xl border border-border/60 bg-background/98 text-foreground shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/92",
          title: "text-sm font-semibold tracking-tight",
          description: "text-sm text-muted-foreground",
          content: "gap-1.5",
          icon: "mt-0.5",
          actionButton:
            "bg-foreground text-background hover:bg-foreground/90 rounded-md border-0",
          cancelButton:
            "bg-muted text-muted-foreground hover:bg-muted/90 rounded-md border border-border/60",
          closeButton:
            "border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          success: "border-emerald-500/25",
          error: "border-red-500/25",
          warning: "border-amber-500/25",
          info: "border-sky-500/25",
        },
      }}
      {...props}
    />
  );
}
