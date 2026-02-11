"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Calculator } from "lucide-react";
import { formatDate } from "@/helpers/formats/dates/formatDates";
import ReceptionsListCard from "../ReceptionsListCard";
import DispatchesListCard from "../DispatchesListCard";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DASHBOARD_CARD_CLASS =
  "rounded-2xl shadow-sm border bg-gradient-to-t from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "Buenos días,";
  if (hour >= 12 && hour < 20) return "Buenas tardes,";
  return "Buenas noches,";
}

function useCurrentDateTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function OperarioDashboard({ storeId = null }) {
  const { data: session } = useSession();
  const [greeting] = useState(() => getGreeting());
  const userName = session?.user?.name || "Usuario";
  const now = useCurrentDateTime();
  const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = formatDate(now);
  const dayStr = DAY_NAMES[now.getDay()];

  return (
    <div className="w-full max-w-full h-full flex flex-col min-h-0 gap-4">
      <div className="flex flex-col items-start justify-center shrink-0 mb-2 md:mb-4">
        <p className="text-lg md:text-md text-neutral-500 dark:text-neutral-400">{greeting}</p>
        <h1 className="text-3xl md:text-4xl font-light">{userName}</h1>
      </div>

      {/* Grid de 4 cards: Hora, Fecha, Día, Acciones — mismo estilo que dashboard normal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <Card className={DASHBOARD_CARD_CLASS}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hora</p>
              <p className="text-3xl font-medium tracking-tight tabular-nums">{timeStr}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={DASHBOARD_CARD_CLASS}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p className="text-3xl font-medium tracking-tight">{dateStr}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={DASHBOARD_CARD_CLASS}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Día</p>
              <p className="text-3xl font-medium tracking-tight">{dayStr}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={DASHBOARD_CARD_CLASS}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calculator className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Herramientas</p>
              <p className="text-3xl font-medium tracking-tight truncate">Calculadora</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dos columnas: Recepciones | Salidas — ocupan el resto del alto con scroll en tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <ReceptionsListCard storeId={storeId} />
        <DispatchesListCard storeId={storeId} />
      </div>
    </div>
  );
}
