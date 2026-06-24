'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Play, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import QueueHealthWidget from '@/components/Superadmin/QueueHealthWidget';

const LEVEL_COLORS: Record<string, string> = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

interface SystemLog {
  id?: number | string;
  occurred_at?: string;
  created_at?: string;
  level?: string;
  message?: string;
  trace?: string;
  [key: string]: unknown;
}

function GlobalErrorLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const qp = new URLSearchParams({ per_page: '50' });
      if (date) qp.set('date', date);
      const res = await fetchSuperadmin(`/error-logs?${qp.toString()}`);
      const json = await res.json();
      setLogs(json.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div>
          <CardTitle className="text-sm">Logs de errores globales</CardTitle>
          <CardDescription className="mt-0.5">
            Errores del sistema no asociados a un tenant específico.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 w-40 text-sm"
          />
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-6" />
              <TableHead>Nivel</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell />
                  <TableCell>
                    <Skeleton className="h-5 w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full max-w-xs" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-6 text-center text-sm">
                  No hay logs para el filtro seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, i) => {
                const key = String(log.id ?? log.occurred_at ?? log.created_at ?? i);
                return (
                  <React.Fragment key={key}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpanded(expanded === key ? null : key)}
                      aria-label={`Log: ${log.message}`}
                    >
                      <TableCell className="w-6 pr-0">
                        {expanded === key ? (
                          <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={LEVEL_COLORS[log.level ?? ''] ?? ''}>
                          {log.level || 'error'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm">{log.message}</TableCell>
                      <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                        {log.occurred_at ?? log.created_at ?? '-'}
                      </TableCell>
                    </TableRow>
                    {expanded === key && (
                      <TableRow>
                        <TableCell />
                        <TableCell colSpan={3} className="pb-3 pt-0">
                          <pre className="bg-muted max-h-40 overflow-auto rounded p-2 text-[11px] whitespace-pre-wrap">
                            {log.context ? JSON.stringify(log.context, null, 2) : log.message}
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
      </CardContent>
    </Card>
  );
}

export default function SystemPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleRunAll = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetchSuperadmin('/migrations/run-all', { method: 'POST' });
      const json = await res.json();
      setResult(json);
      notify.success({
        title: 'Migraciones encoladas',
        description: json.message || `${json.tenants_queued} tenant(s) en cola.`,
      });
      setConfirmOpen(false);
    } catch (err) {
      notify.error({ title: (err as Error).message || 'Error al encolar migraciones' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sistema</h1>

      <QueueHealthWidget showRefresh />

      <Card className="border-orange-500/30">
        <CardHeader>
          <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
            Acciones avanzadas
          </CardTitle>
          <CardDescription>
            Operaciones que afectan a todos los tenants. Úsalas con precaución.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Migraciones globales</CardTitle>
              <CardDescription>
                Ejecuta las migraciones pendientes en todos los tenants activos. Las migraciones se
                encolan y se ejecutan de forma asíncrona.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result && (
                <div className="bg-muted rounded-md px-4 py-3 text-sm">
                  <span className="font-medium">{result.message}</span>
                  {result.tenants_queued != null && (
                    <span className="text-muted-foreground ml-2">
                      ({result.tenants_queued} tenant{result.tenants_queued !== 1 ? 's' : ''} en
                      cola)
                    </span>
                  )}
                </div>
              )}
              <Button onClick={() => setConfirmOpen(true)}>
                <Play className="h-4 w-4" />
                Ejecutar migraciones en todos los tenants
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <GlobalErrorLogs />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar migraciones globales</DialogTitle>
            <DialogDescription>
              Se encolarán las migraciones pendientes en TODOS los tenants activos. Esta operación
              puede tardar varios minutos dependiendo del número de tenants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={running}>
              Cancelar
            </Button>
            <Button onClick={handleRunAll} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar y encolar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
