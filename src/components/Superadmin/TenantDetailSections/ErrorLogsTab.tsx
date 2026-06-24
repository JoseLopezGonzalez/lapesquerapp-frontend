'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/utils/superadminDateUtils';
import FilterTabs from '../FilterTabs';
import EmptyState from '../EmptyState';

const METHOD_COLORS: Record<string, string> = {
  GET: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  POST: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400',
  PUT: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400',
  PATCH: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  DELETE: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const DAYS_TABS = [
  { key: '7', label: '7d' },
  { key: '30', label: '30d' },
  { key: '90', label: '90d' },
];

interface ErrorLog {
  id: number | string;
  method?: string;
  url?: string;
  status_code?: number;
  occurred_at?: string;
  message?: string;
  trace?: string;
  error_class?: string;
  error_message?: string;
  [key: string]: unknown;
}

interface LogMeta {
  current_page: number;
  last_page: number;
  total: number;
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return url;
  }
}

export default function ErrorLogsTab({ tenantId }: { tenantId: number | string }) {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [meta, setMeta] = useState<LogMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [days, setDays] = useState(30);
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  const fetchLogs = useCallback(
    async (params: { page?: number; days?: number } = {}) => {
      setLoading(true);
      try {
        const qp = new URLSearchParams();
        qp.set('page', String(params.page || 1));
        qp.set('per_page', '20');
        qp.set('days', String(params.days ?? 30));
        const res = await fetchSuperadmin(`/tenants/${tenantId}/error-logs?${qp}`);
        const json = await res.json();
        setLogs(json.data || []);
        setMeta(json.meta || null);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [tenantId]
  );

  useEffect(() => {
    fetchLogs({ page, days });
  }, [page, days, fetchLogs]);

  const handleDaysChange = (newDays: string) => {
    setDays(Number(newDays));
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">
          Error logs {meta ? `(${meta.total} errores)` : ''}
        </CardTitle>
        <FilterTabs tabs={DAYS_TABS} activeKey={String(days)} onChange={handleDaysChange} />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="hidden sm:table-cell">Método</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="hidden md:table-cell">Clase</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={ShieldCheck}
                    title={`Sin errores en los últimos ${days} días`}
                    description="No se han registrado errores en este período."
                    compact
                  />
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDateTime(log.occurred_at)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={METHOD_COLORS[log.method ?? ''] ?? ''}>
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-[180px] truncate font-mono text-sm"
                      title={log.url}
                    >
                      {shortUrl(log.url ?? '')}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground hidden max-w-[180px] truncate text-xs md:table-cell"
                      title={log.error_class}
                    >
                      {log.error_class?.split('\\').pop() || log.error_class}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={expandedId === log.id ? 'Ocultar detalle' : 'Ver detalle'}
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        {expandedId === log.id ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/50 p-0">
                        <div className="space-y-2 p-4">
                          <p className="font-mono text-xs break-all">
                            <span className="text-destructive font-semibold">
                              {log.error_class}
                            </span>
                          </p>
                          <p className="text-muted-foreground text-xs break-all">
                            {log.error_message}
                          </p>
                          <p className="text-muted-foreground font-mono text-xs break-all">
                            {log.url}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <span className="text-muted-foreground text-sm">
              Página {meta.current_page} de {meta.last_page}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={meta.current_page <= 1}
                onClick={() => setPage(meta.current_page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage(meta.current_page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
