'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Server } from 'lucide-react';

interface QueueHealth {
  failed_jobs?: number;
  pending_jobs?: number;
  driver?: string;
  [key: string]: unknown;
}

export default function QueueHealthWidget({ showRefresh = false }: { showRefresh?: boolean }) {
  const [health, setHealth] = useState<QueueHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError(false);
    try {
      const res = await fetchSuperadmin('/system/queue-health');
      const json = await res.json();
      setHealth(json.data || json);
    } catch {
      setError(true);
      setHealth(null);
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    intervalRef.current = setInterval(() => fetchHealth(), 60000);
    return () => clearInterval(intervalRef.current);
  }, [fetchHealth]);

  if (loading) return <Skeleton className="h-20 rounded-lg" />;

  if (error || !health) {
    return (
      <Card className="border-muted">
        <CardContent className="text-muted-foreground flex items-center gap-2 pt-4 pb-4 text-sm">
          <Server className="h-4 w-4 shrink-0" />
          No se pudo cargar el estado de la cola.
        </CardContent>
      </Card>
    );
  }

  // Derive health from documented fields: pending_jobs, failed_jobs, driver
  const failedJobs = health.failed_jobs ?? 0;
  const pendingJobs = health.pending_jobs ?? 0;
  const hasFailedJobs = failedJobs > 0;

  const dotColor = hasFailedJobs ? 'bg-destructive' : 'bg-green-500';
  const statusText = hasFailedJobs
    ? `${failedJobs} trabajo${failedJobs !== 1 ? 's' : ''} fallido${failedJobs !== 1 ? 's' : ''}`
    : 'Cola operativa';

  return (
    <Card className={hasFailedJobs ? 'border-destructive/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Server className="h-4 w-4" />
          Estado de la cola
          {health.driver && (
            <span className="text-muted-foreground font-normal">({health.driver})</span>
          )}
        </CardTitle>
        {showRefresh && (
          <Button variant="ghost" size="sm" onClick={() => fetchHealth(true)} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-3 w-3 rounded-full ${dotColor} animate-pulse`} />
          <span className="text-sm font-medium">{statusText}</span>
          {pendingJobs > 0 && (
            <span className="text-muted-foreground text-xs">
              {pendingJobs} pendiente{pendingJobs !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
