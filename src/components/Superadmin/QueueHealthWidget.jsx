"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Server } from "lucide-react";

export default function QueueHealthWidget({ showRefresh = false }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  const fetchHealth = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetchSuperadmin("/system/queue-health");
      const json = await res.json();
      setHealth(json.data || json);
    } catch { /* silent */ } finally {
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
  if (!health) return null;

  const isHealthy = health.healthy && health.failed_jobs === 0;
  const hasFailedJobs = health.failed_jobs > 0;
  const isUnhealthy = !health.healthy;

  const dotColor = isUnhealthy
    ? "bg-destructive"
    : hasFailedJobs
      ? "bg-orange-500"
      : "bg-green-500";

  const statusText = isUnhealthy
    ? "Cola no disponible"
    : hasFailedJobs
      ? `${health.failed_jobs} trabajo${health.failed_jobs !== 1 ? "s" : ""} fallido${health.failed_jobs !== 1 ? "s" : ""}`
      : "Cola operativa";

  return (
    <Card className={isUnhealthy ? "border-destructive/50" : hasFailedJobs ? "border-orange-500/40" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Server className="h-4 w-4" />
          Estado de la cola
        </CardTitle>
        {showRefresh && (
          <Button variant="ghost" size="sm" onClick={() => fetchHealth(true)} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-3 w-3 rounded-full ${dotColor} ${isUnhealthy ? "" : "animate-pulse"}`} />
          <span className="text-sm font-medium">{statusText}</span>
          {health.pending_jobs > 0 && (
            <span className="text-xs text-muted-foreground">
              {health.pending_jobs} pendiente{health.pending_jobs !== 1 ? "s" : ""}
            </span>
          )}
          {isUnhealthy && health.redis_status && (
            <span className="text-xs text-destructive truncate max-w-xs">{health.redis_status}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
