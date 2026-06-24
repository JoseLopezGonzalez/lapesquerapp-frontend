'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchSuperadmin, SuperadminApiError } from '@/lib/superadminApi';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Pencil, RotateCcw, CheckCircle2, XCircle, Flag } from 'lucide-react';
import EmptyState from '../EmptyState';

const FLAG_DESCRIPTIONS: Record<string, string> = {
  // Mapeo opcional key → descripción corta si la API no devuelve description
};

interface FeatureFlag {
  flag_key: string;
  enabled: boolean;
  description?: string | null;
  override?: boolean | null;
  override_reason?: string | null;
  [key: string]: unknown;
}

function flagDescription(flag: FeatureFlag): string | null {
  return flag.description ?? FLAG_DESCRIPTIONS[flag.flag_key] ?? null;
}

export default function FeatureFlagsTab({ tenantId }: { tenantId: number | string }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [overrideDialog, setOverrideDialog] = useState<FeatureFlag | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/feature-flags`);
      const json = await res.json();
      setFlags(json.data || []);
      setPlan(json.plan || '');
    } catch {
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = (flag: FeatureFlag) => {
    setOverrideReason('');
    setOverrideDialog({ ...flag, newEnabled: !flag.enabled });
  };

  const handleSaveOverride = async () => {
    if (!overrideDialog) return;
    setSaving(true);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/feature-flags/${overrideDialog.flag_key}`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: overrideDialog.newEnabled,
          reason: overrideReason || undefined,
        }),
      });
      notify.success({ title: 'Override guardado' });
      setOverrideDialog(null);
      fetchFlags();
    } catch (err) {
      notify.error({ title: (err as Error).message || 'Error al guardar override' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (flagKey: string) => {
    setDeletingKey(flagKey);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/feature-flags/${flagKey}`, { method: 'DELETE' });
      notify.success({ title: 'Override eliminado. Vuelve al valor del plan.' });
      fetchFlags();
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 404) {
        notify.info({ title: 'No habia override para este flag.' });
      } else {
        notify.error({ title: (err as Error).message || 'Error al eliminar override' });
      }
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Feature Flags</CardTitle>
          {plan && (
            <CardDescription>
              Plan: <span className="font-medium capitalize">{plan}</span>. Los flags con override
              difieren del default del plan.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Override</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : flags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={Flag}
                      title="Sin flags"
                      description="Este plan no tiene feature flags definidos."
                      compact
                    />
                  </TableCell>
                </TableRow>
              ) : (
                flags.map((flag) => (
                  <TableRow key={flag.flag_key}>
                    <TableCell>
                      <div>
                        <span className="font-mono text-sm">{flag.flag_key}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] text-sm sm:table-cell">
                      {flagDescription(flag) || '-'}
                    </TableCell>
                    <TableCell>
                      {flag.enabled ? (
                        <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Habilitado
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                          <XCircle className="h-4 w-4" />
                          Deshabilitado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {flag.has_override ? (
                        <Badge
                          variant="outline"
                          className="border-blue-500/30 bg-blue-500/10 text-xs text-blue-700 dark:text-blue-400"
                        >
                          Override activo
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Default del plan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(flag)}
                          title={flag.enabled ? 'Deshabilitar' : 'Habilitar'}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {flag.has_override && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOverride(flag.flag_key)}
                            disabled={deletingKey === flag.flag_key}
                            title="Eliminar override (volver al plan)"
                          >
                            {deletingKey === flag.flag_key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!overrideDialog}
        onOpenChange={(open) => {
          if (!open) setOverrideDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {overrideDialog?.newEnabled ? 'Habilitar' : 'Deshabilitar'} {overrideDialog?.flag_key}
            </DialogTitle>
            <DialogDescription>
              Se guardará un override para este tenant. El cambio se aplicará de inmediato y
              sobreescribirá el valor por defecto del plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ff-reason">Motivo (opcional)</Label>
              <Input
                id="ff-reason"
                placeholder="Ej: Acceso especial contratado por 3 meses"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialog(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOverride} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
