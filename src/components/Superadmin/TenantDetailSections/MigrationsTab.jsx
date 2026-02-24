"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Loader2, Play, ChevronDown, ChevronUp, AlertTriangle, History } from "lucide-react";
import EmptyState from "../EmptyState";
import { formatDateTimeFull, formatDurationSeconds } from "@/utils/superadminDateUtils";

function MigrationSummary({ summary, onRun, running }) {
  if (!summary) return <Skeleton className="h-20 rounded" />;

  const runDisabled = running || summary.pending === 0;
  const runButton = (
    <Button size="sm" onClick={onRun} disabled={runDisabled}>
      {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
      Ejecutar migraciones
    </Button>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Estado de migraciones</CardTitle>
        {summary.pending === 0 && !running ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{runButton}</TooltipTrigger>
              <TooltipContent>No hay migraciones pendientes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          runButton
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold">{summary.ran}</span>
          <span className="text-muted-foreground text-sm">de {summary.total} ejecutadas</span>
          {summary.pending > 0 && (
            <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400">
              {summary.pending} pendiente{summary.pending !== 1 ? "s" : ""}
            </Badge>
          )}
          {summary.pending === 0 && (
            <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
              Al día
            </Badge>
          )}
        </div>
        {summary.pending > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Hay {summary.pending} migración{summary.pending !== 1 ? "es" : ""} pendiente{summary.pending !== 1 ? "s" : ""}.
              Ejecuta las migraciones para aplicarlas.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function MigrationsTab({ tenantId }) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [histMeta, setHistMeta] = useState(null);
  const [histPage, setHistPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const pollRef = useRef(null);
  const pendingRunId = useRef(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/migrations`);
      const json = await res.json();
      setSummary(json.data || json);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/migrations/history?page=${page}&per_page=10`);
      const json = await res.json();
      setHistory(json.data || []);
      setHistMeta(json.meta || null);
    } catch { setHistory([]); }
  }, [tenantId]);

  useEffect(() => {
    fetchSummary();
    fetchHistory(histPage);
  }, [fetchSummary, fetchHistory, histPage]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/migrations/run`, { method: "POST" });
      const json = await res.json();
      notify.success({ title: "Migraciones encoladas", description: `Run ID: ${json.run_id}` });
      pendingRunId.current = json.run_id;

      pollRef.current = setInterval(async () => {
        try {
          const hRes = await fetchSuperadmin(`/tenants/${tenantId}/migrations/history?per_page=10`);
          const hJson = await hRes.json();
          const found = (hJson.data || []).find((r) => r.id === pendingRunId.current && r.finished_at);
          if (found) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            pendingRunId.current = null;
            setRunning(false);
            setHistory(hJson.data || []);
            setHistMeta(hJson.meta || null);
            fetchSummary();
            if (found.success) {
              notify.success({ title: "Migraciones completadas", description: `${found.migrations_applied} aplicadas.` });
            } else {
              notify.error({ title: "Fallo en migraciones" });
            }
          }
        } catch { /* silent */ }
      }, 3000);
    } catch (err) {
      notify.error({ title: err.message || "Error al ejecutar migraciones" });
      setRunning(false);
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div className="space-y-4">
      <MigrationSummary summary={summary} onRun={handleRun} running={running} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historial de ejecuciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Aplicadas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Duración</TableHead>
                <TableHead className="text-right">Output</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={History}
                      title="Sin historial"
                      description="Aún no se ha ejecutado ninguna migración en este tenant."
                      compact
                    />
                  </TableCell>
                </TableRow>
              ) : (
                history.map((run) => {
                  const durationSeconds = run.started_at && run.finished_at
                    ? (new Date(run.finished_at) - new Date(run.started_at)) / 1000
                    : null;
                  const durationDisplay = durationSeconds != null
                    ? formatDurationSeconds(durationSeconds)
                    : run.finished_at ? "-" : <span className="text-orange-500 text-xs">En curso...</span>;

                  return (
                    <React.Fragment key={run.id}>
                      <TableRow>
                        <TableCell className="text-sm whitespace-nowrap">{formatDateTimeFull(run.started_at)}</TableCell>
                        <TableCell className="text-sm">{run.migrations_applied}</TableCell>
                        <TableCell>
                          {run.finished_at ? (
                            <Badge variant="outline" className={run.success
                              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                            }>
                              {run.success ? "Éxito" : "Fallo"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400">
                              En curso
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {durationDisplay}
                        </TableCell>
                        <TableCell className="text-right">
                          {run.output && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                            >
                              {expandedId === run.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedId === run.id && run.output && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/50 p-0">
                            <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                              {run.output}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>

          {histMeta && histMeta.last_page > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Página {histMeta.current_page} de {histMeta.last_page}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon-sm" disabled={histMeta.current_page <= 1} onClick={() => setHistPage(histMeta.current_page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon-sm" disabled={histMeta.current_page >= histMeta.last_page} onClick={() => setHistPage(histMeta.current_page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
