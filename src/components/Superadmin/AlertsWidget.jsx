"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Bell, ArrowRight } from "lucide-react";

export default function AlertsWidget() {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setError(false);
    try {
      const res = await fetchSuperadmin("/alerts?resolved=false&per_page=100");
      const json = await res.json();
      const data = json.data || [];
      const critical = data.filter((a) => a.severity === "critical").length;
      const warning = data.filter((a) => a.severity === "warning").length;
      const info = data.filter((a) => a.severity === "info").length;
      setCounts({ critical, warning, info, total: json.meta?.total ?? data.length });
    } catch { setError(true); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  if (loading) return <Skeleton className="h-24 rounded-lg" />;
  if (error) {
    return (
      <Card className="border-muted">
        <CardContent className="flex items-center gap-2 pt-4 pb-4 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          No se pudo cargar el estado de alertas.
        </CardContent>
      </Card>
    );
  }
  if (!counts || counts.total === 0) return null;

  return (
    <Card className={counts.critical > 0 ? "border-destructive/50" : "border-orange-500/40"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alertas activas
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/superadmin/alerts">
            Ver todas <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {counts.critical > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="text-sm font-medium text-destructive">{counts.critical} critica{counts.critical !== 1 ? "s" : ""}</span>
            </div>
          )}
          {counts.warning > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{counts.warning} advertencia{counts.warning !== 1 ? "s" : ""}</span>
            </div>
          )}
          {counts.info > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{counts.info} informativa{counts.info !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
