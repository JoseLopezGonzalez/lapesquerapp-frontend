'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelative } from '@/utils/superadminDateUtils';
import { Button } from '@/components/ui/button';
import { UserCheck, Database, AlertTriangle, Building2, Activity, RefreshCw } from 'lucide-react';
import EmptyState from './EmptyState';

const TYPE_ICONS = {
  impersonation: UserCheck,
  migration: Database,
  alert: AlertTriangle,
  tenant_status: Building2,
};

const SEVERITY_COLORS = {
  critical: 'text-destructive',
  warning: 'text-orange-500',
  info: 'text-blue-500',
};

interface ActivityItem {
  type?: string;
  severity?: string;
  description?: string;
  message?: string;
  tenant_id?: number | string;
  tenant?: string;
  timestamp?: string;
  at?: string;
  [key: string]: unknown;
}

export default function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetchSuperadmin('/dashboard/activity?limit=10');
      const json = await res.json();
      setItems(json.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Actividad reciente
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchFeed}
          disabled={loading}
          aria-label="Actualizar"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Sin actividad reciente"
            description="Los eventos del sistema aparecerán aquí."
          />
        ) : (
          <div className="divide-y">
            {items.map((item, i) => {
              const Icon = TYPE_ICONS[item.type] || Activity;
              const colorClass = SEVERITY_COLORS[item.severity] || 'text-muted-foreground';
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${colorClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm leading-snug">
                      {item.description ?? item.message}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {item.tenant_id && (
                        <Link
                          href={`/superadmin/tenants/${item.tenant_id}`}
                          className="text-primary text-xs hover:underline"
                        >
                          {item.tenant}
                        </Link>
                      )}
                      <span className="text-muted-foreground text-[10px]">
                        {formatRelative(item.timestamp ?? item.at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
