"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pattern as Pattern1 } from "@/components/patterns/p-sonner-1";
import { Pattern as Pattern2 } from "@/components/patterns/p-sonner-2";
import { Pattern as Pattern3 } from "@/components/patterns/p-sonner-3";
import { Pattern as Pattern4 } from "@/components/patterns/p-sonner-4";
import { Pattern as Pattern5 } from "@/components/patterns/p-sonner-5";
import { Pattern as Pattern6 } from "@/components/patterns/p-sonner-6";
import { Pattern as Pattern7 } from "@/components/patterns/p-sonner-7";
import { Pattern as Pattern8 } from "@/components/patterns/p-sonner-8";
import { Pattern as Pattern9 } from "@/components/patterns/p-sonner-9";
import { Pattern as Pattern10 } from "@/components/patterns/p-sonner-10";
import { Pattern as Pattern11 } from "@/components/patterns/p-sonner-11";
import { Pattern as Pattern12 } from "@/components/patterns/p-sonner-12";
import { Pattern as Pattern13 } from "@/components/patterns/p-sonner-13";
import { Pattern as Pattern14 } from "@/components/patterns/p-sonner-14";
import { Pattern as Pattern15 } from "@/components/patterns/p-sonner-15";
import { Pattern as Pattern16 } from "@/components/patterns/p-sonner-16";
import { Pattern as Pattern17 } from "@/components/patterns/p-sonner-17";
import { Pattern as Pattern18 } from "@/components/patterns/p-sonner-18";
import { Pattern as Pattern19 } from "@/components/patterns/p-sonner-19";
import { Pattern as Pattern20 } from "@/components/patterns/p-sonner-20";
import { Pattern as Pattern21 } from "@/components/patterns/p-sonner-21";

const PATTERNS = [
  { id: 1, title: "Basic toast", Component: Pattern1 },
  { id: 2, title: "Toast with description", Component: Pattern2 },
  { id: 3, title: "Toast positions", Component: Pattern3 },
  { id: 4, title: "Toast variants", Component: Pattern4 },
  { id: 5, title: "Toast duration", Component: Pattern5 },
  { id: 6, title: "Toast with action", Component: Pattern6 },
  { id: 7, title: "Promise toast", Component: Pattern7 },
  { id: 8, title: "Action + cancel", Component: Pattern8 },
  { id: 9, title: "Custom rich toast", Component: Pattern9 },
  { id: 10, title: "Upload progress", Component: Pattern10 },
  { id: 11, title: "Status alert", Component: Pattern11 },
  { id: 12, title: "Accent border", Component: Pattern12 },
  { id: 13, title: "Invert success", Component: Pattern13 },
  { id: 14, title: "Invert error", Component: Pattern14 },
  { id: 15, title: "Invert info", Component: Pattern15 },
  { id: 16, title: "Invert warning", Component: Pattern16 },
  { id: 17, title: "Multi-action invert", Component: Pattern17 },
  { id: 18, title: "Close button top-right", Component: Pattern18 },
  { id: 19, title: "Custom icon", Component: Pattern19 },
  { id: 20, title: "Integration toast", Component: Pattern20 },
  { id: 21, title: "Updatable by id", Component: Pattern21 },
];

export default function ReuiSonnerPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">ReUI Sonner Lab</h1>
        <p className="text-sm text-muted-foreground">
          Sandbox interno para validar la instalación real de los 21 patterns de ReUI Sonner.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {PATTERNS.map(({ id, title, Component }) => (
          <Card key={id}>
            <CardHeader>
              <CardTitle className="text-sm">
                Pattern {id}: {title}
              </CardTitle>
              <CardDescription>Componente instalado desde el registry oficial de ReUI.</CardDescription>
            </CardHeader>
            <CardContent>
              <Component />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
