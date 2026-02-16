import type { HTMLAttributes } from "react";

type CardComponent = React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

declare const Card: CardComponent;
declare const CardHeader: CardComponent;
declare const CardTitle: CardComponent;
declare const CardDescription: CardComponent;
declare const CardContent: CardComponent;
declare const CardFooter: CardComponent;

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
