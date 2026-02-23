"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "./StatusBadge";
import { Building2, CheckCircle2, PauseCircle, Clock, XCircle, Plus, ArrowRight } from "lucide-react";

const STAT_CARDS = [
  { key: "total", label: "Total", icon: Building2, color: "text-foreground" },
  { key: "active", label: "Activos", icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
  { key: "suspended", label: "Suspendidos", icon: PauseCircle, color: "text-orange-600 dark:text-orange-400" },
  { key: "pending", label: "Pendientes", icon: Clock, color: "text-blue-600 dark:text-blue-400" },
  { key: "cancelled", label: "Cancelados", icon: XCircle, color: "text-red-600 dark:text-red-400" },
];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function DashboardCards() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchSuperadmin("/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data) return null;

  const visibleCards = STAT_CARDS.filter(
    (c) => c.key !== "cancelled" || (data.cancelled && data.cancelled > 0)
  );

  const lastOnboarding = data.last_onboarding;

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-${visibleCards.length}`}>
        {visibleCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                </div>
                <span className="text-2xl font-bold mt-2 block">{data[card.key] ?? 0}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lastOnboarding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ultimo tenant en onboarding</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Subdominio</TableHead>
                  <TableHead>Paso</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{lastOnboarding.name}</TableCell>
                  <TableCell className="text-muted-foreground">{lastOnboarding.subdomain}</TableCell>
                  <TableCell>
                    {lastOnboarding.onboarding
                      ? `${lastOnboarding.onboarding.step}/${lastOnboarding.onboarding.total_steps}`
                      : `${lastOnboarding.onboarding_step ?? 0}/8`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lastOnboarding.created_at)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/superadmin/tenants/new">
            <Plus className="h-4 w-4" />
            Crear tenant
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/superadmin/tenants">
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
