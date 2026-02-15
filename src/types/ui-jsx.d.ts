import type { ComponentType, PropsWithChildren } from "react";

declare module "@/components/ui/card" {
  export const Card: ComponentType<PropsWithChildren<{ className?: string }>>;
}

declare module "@/components/Utilities/RotatingText" {
  const RotatingText: ComponentType<Record<string, unknown>>;
  export default RotatingText;
}
