"use client";

import { useCallback } from "react";
import { toast, useSonner, type ToasterProps } from "sonner";
import { Toaster } from "@/components/ui/sonner";

function ToasterWithDismiss(props: ToasterProps) {
  const { toasts } = useSonner();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const toastEl = (e.target as HTMLElement).closest("[data-sonner-toast]");
      if (!toastEl) return;
      const index = parseInt((toastEl as HTMLElement).dataset.index ?? "", 10);
      if (!isNaN(index) && toasts[index]) {
        toast.dismiss(toasts[index].id);
      }
    },
    [toasts]
  );

  return (
    <div onClick={handleClick}>
      <Toaster {...props} />
    </div>
  );
}

export function AppToaster(props: ToasterProps) {
  return (
    <ToasterWithDismiss
      position="top-center"
      swipeDirections={["top", "left", "right"]}
      {...props}
    />
  );
}
