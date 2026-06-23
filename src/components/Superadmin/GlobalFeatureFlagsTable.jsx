'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchSuperadmin, SuperadminApiError } from '@/lib/superadminApi';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Loader2, RefreshCw, Flag } from 'lucide-react';
import EmptyState from './EmptyState';

const PLAN_COLORS = {
  basic: 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400',
  professional: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  enterprise: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400',
};

export default function GlobalFeatureFlagsTable() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSuperadmin('/feature-flags');
      const json = await res.json();
      setFlags(json.data || json || []);
    } catch {
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = async (flag) => {
    setTogglingKey(flag.key);
    const newValue = !flag.enabled;
    try {
      await fetchSuperadmin(`/feature-flags/${flag.key}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: newValue }),
      });
      setFlags((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, enabled: newValue } : f))
      );
      notify.success({
        title: `Flag ${newValue ? 'activada' : 'desactivada'}`,
        description: flag.key,
      });
    } catch (err) {
      notify.error({ title: err.message || 'Error al cambiar la flag' });
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Feature Flags globales</h1>
          <p className="text-muted-foreground text-sm">
            Controla qué funcionalidades están disponibles por defecto para cada plan.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFlags} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Flags del sistema</CardTitle>
          <CardDescription>
            Los cambios aquí afectan a los valores por defecto de nuevos tenants. Los overrides
            por tenant se gestionan desde la pestaña "Feature Flags" del detalle del tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                <TableHead className="hidden md:table-cell">Plan mínimo</TableHead>
                <TableHead>Habilitada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-10" />
                    </TableCell>
                  </TableRow>
                ))
              ) : flags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={Flag}
                      title="Sin feature flags"
                      description="No hay flags globales configuradas en el sistema."
                      compact
                    />
                  </TableCell>
                </TableRow>
              ) : (
                flags.map((flag) => (
                  <TableRow key={flag.key}>
                    <TableCell className="font-mono text-sm">{flag.key}</TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] text-sm sm:table-cell">
                      {flag.description || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {flag.plan ? (
                        <Badge
                          variant="outline"
                          className={PLAN_COLORS[flag.plan] || ''}
                        >
                          {flag.plan}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {togglingKey === flag.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={!!flag.enabled}
                          onCheckedChange={() => handleToggle(flag)}
                          aria-label={`Toggle ${flag.key}`}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
