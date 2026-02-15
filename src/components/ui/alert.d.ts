import type { HTMLAttributes } from "react";

declare module "@/components/ui/alert" {
  export const Alert: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" } & React.RefAttributes<HTMLDivElement>
  >;
  export const AlertTitle: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>
  >;
  export const AlertDescription: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;
}
