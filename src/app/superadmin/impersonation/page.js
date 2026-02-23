"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { fetchSuperadmin, SuperadminApiError } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Loader2, Zap, RefreshCw } from "lucide-react";
import Link from "next/link";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(dateStr));
  } catch { return dateStr; }
}

function ModeBadge({ mode }) {
  if (mode === "silent") return (
    <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400">
      Silencioso
    </Badge>
  );
  return (
    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
      Consentido
    </Badge>
  );
}

function ActiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [endingId, setEndingId] = useState(null);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetchSuperadmin("/impersonation/active");
      const json = await res.json();
      setSessions(json.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const handleEnd = async (logId) => {
    setEndingId(logId);
    try {
      await fetchSuperadmin(`/impersonation/logs/${logId}/end`, { method: "POST" });
      notify.success({ title: "Sesion terminada" });
      fetchActive();
    } catch (err) {
      notify.error({ title: err.message || "Error al terminar la sesion" });
    } finally {
      setEndingId(null);
    }
  };

  if (loading) return <Skeleton className="h-24 rounded-lg" />;
  if (sessions.length === 0) return null;

  return (
    <Alert className="border-orange-500/40 bg-orange-50 dark:bg-orange-950/20">
      <Zap className="h-4 w-4 text-orange-500" />
      <AlertTitle className="text-orange-700 dark:text-orange-400">
        {sessions.length} sesion{sessions.length !== 1 ? "es" : ""} activa{sessions.length !== 1 ? "s" : ""}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
              <div className="text-sm">
                <span className="font-medium">{s.superadmin}</span>
                {" en "}
                <Link href={`/superadmin/tenants/${s.tenant_id}`} className="text-primary hover:underline">
                  {s.tenant}
                </Link>
                {" — usuario ID "}{s.target_user_id}
                {s.reason && <span className="ml-2 text-muted-foreground text-xs">({s.reason})</span>}
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleEnd(s.id)}
                disabled={endingId === s.id}
              >
                {endingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Terminar"}
              </Button>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

function HistoryTable() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tenantFilter, setTenantFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const debounceRef = useRef(null);

  const fetchLogs = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      qp.set("page", String(params.page || 1));
      qp.set("per_page", "20");
      if (params.tenant_id) qp.set("tenant_id", params.tenant_id);
      if (params.from) qp.set("from", params.from);
      const res = await fetchSuperadmin(`/impersonation/logs?${qp}`);
      const json = await res.json();
      setLogs(json.data || []);
      setMeta(json.meta || null);
    } catch { setLogs([]); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs({ page, tenant_id: tenantFilter, from: fromFilter });
  }, [page, fetchLogs]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchLogs({ page: 1, tenant_id: tenantFilter, from: fromFilter });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [tenantFilter, fromFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Historial de impersonaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="ID del tenant..."
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value.replace(/\D/g, ""))}
            className="max-w-[140px]"
            type="number"
            min="1"
          />
          <Input
            type="datetime-local"
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            className="max-w-[220px]"
          />
          <Button variant="ghost" size="sm" onClick={() => { setTenantFilter(""); setFromFilter(""); }}>
            Limpiar
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Superadmin</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="hidden md:table-cell">Modo</TableHead>
                <TableHead className="hidden lg:table-cell">Motivo</TableHead>
                <TableHead className="hidden lg:table-cell">Fin</TableHead>
                <TableHead className="hidden xl:table-cell">Duracion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Sin registros.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(log.started_at)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{log.superadmin}</TableCell>
                    <TableCell>
                      <Link href={`/superadmin/tenants/${log.tenant_id}`} className="text-primary hover:underline text-sm">
                        {log.tenant}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ModeBadge mode={log.mode} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm max-w-[200px] truncate" title={log.reason || ""}>
                      {log.reason || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {log.ended_at ? formatDate(log.ended_at) : <span className="text-orange-500">Activa</span>}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {log.duration_minutes != null ? `${log.duration_minutes}m` : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Pagina {meta.current_page} de {meta.last_page} ({meta.total} registros)
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
      </CardContent>
    </Card>
  );
}

export default function ImpersonationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Impersonaciones</h1>
      <ActiveSessions />
      <HistoryTable />
    </div>
  );
}
