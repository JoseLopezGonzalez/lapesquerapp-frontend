"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchSuperadmin, SuperadminApiError } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, ChevronDown, ChevronUp, BellOff } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/Superadmin/EmptyState";
import { formatDateTime } from "@/utils/superadminDateUtils";
import FilterTabs from "@/components/Superadmin/FilterTabs";

const SEVERITY_TABS = [
  { key: "", label: "Todas" },
  { key: "critical", label: "Crítica" },
  { key: "warning", label: "Advertencia" },
  { key: "info", label: "Info" },
  { key: "resolved", label: "Resueltas" },
];

const SEVERITY_COLORS = {
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

function SeverityBadge({ severity }) {
  return (
    <Badge variant="outline" className={SEVERITY_COLORS[severity] || ""}>
      {severity}
    </Badge>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [resolvingId, setResolvingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchAlerts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      qp.set("page", String(params.page || 1));
      qp.set("per_page", "20");
      if (params.tab === "resolved") {
        qp.set("resolved", "true");
      } else {
        qp.set("resolved", "false");
        if (params.tab) qp.set("severity", params.tab);
      }
      const res = await fetchSuperadmin(`/alerts?${qp}`);
      const json = await res.json();
      setAlerts(json.data || []);
      setMeta(json.meta || null);
    } catch { setAlerts([]); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts({ tab: activeTab, page });
  }, [activeTab, page, fetchAlerts]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleResolve = async (alertId) => {
    setResolvingId(alertId);
    try {
      await fetchSuperadmin(`/alerts/${alertId}/resolve`, { method: "POST" });
      notify.success({ title: "Alerta resuelta" });
      fetchAlerts({ tab: activeTab, page });
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422) {
        notify.info({ title: "Ya estaba resuelta" });
        fetchAlerts({ tab: activeTab, page });
      } else {
        notify.error({ title: err.message || "Error al resolver la alerta" });
      }
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">
        Alertas del sistema
        {meta != null && activeTab !== "resolved" && (
          <span className="ml-2 text-muted-foreground font-normal">({meta.total} activas)</span>
        )}
      </h1>

      <FilterTabs tabs={SEVERITY_TABS} activeKey={activeTab} onChange={handleTabChange} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead className="hidden md:table-cell">Mensaje</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={BellOff}
                      title="No hay alertas"
                      description="No hay alertas pendientes en el sistema."
                      compact
                    />
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <React.Fragment key={alert.id}>
                    <TableRow className={alert.resolved_at ? "opacity-60" : ""}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDateTime(alert.created_at)}</TableCell>
                      <TableCell>
                        {alert.tenant ? (
                          <Link href={`/superadmin/tenants/${alert.tenant.id}`} className="text-primary hover:underline text-sm">
                            {alert.tenant.subdomain}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {alert.type}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={alert.severity} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm max-w-[300px] truncate" title={alert.message}>
                        {alert.message}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {alert.message && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                              aria-label={expandedId === alert.id ? "Ocultar mensaje" : "Ver mensaje completo"}
                            >
                              {expandedId === alert.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          {alert.resolved_at ? (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              Resuelta
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolve(alert.id)}
                              disabled={resolvingId === alert.id}
                            >
                              {resolvingId === alert.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : "Resolver"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === alert.id && alert.message && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/50 p-4">
                          <p className="text-sm whitespace-pre-wrap break-words">{alert.message}</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {meta.current_page} de {meta.last_page} ({meta.total} alertas)
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
