"use client";

import { useEffect, useRef } from "react";
import { toast, useSonner, type ToasterProps } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export function AppToaster(props: ToasterProps) {
  const { toasts } = useSonner();
  const toastsRef = useRef(toasts);

  // Keep ref always current so the document listener never captures stale state
  useEffect(() => {
    toastsRef.current = toasts;
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;

      const toastEl = target.closest<HTMLElement>("[data-sonner-toast]");
      if (!toastEl || toastEl.dataset.removed === "true") return;

      // Match only active (non-removed) toast elements — same order as useSonner().toasts
      const activeEls = [
        ...document.querySelectorAll<HTMLElement>(
          "[data-sonner-toast]:not([data-removed='true'])"
        ),
      ];
      const domIndex = activeEls.indexOf(toastEl);
      const current = toastsRef.current;
      if (domIndex !== -1 && current[domIndex]) {
        toast.dismiss(current[domIndex].id);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <Toaster
      position="top-center"
      swipeDirections={["top", "left", "right"]}
      {...props}
    />
  );
}
