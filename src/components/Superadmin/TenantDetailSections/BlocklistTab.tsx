'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { fetchSuperadmin, SuperadminApiError } from '@/lib/superadminApi';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/utils/superadminDateUtils';
import EmptyState from '../EmptyState';

interface BlockEntry {
  id: number | string;
  type: 'ip' | 'email' | string;
  value: string;
  reason?: string | null;
  expires_at?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

function isBlockExpired(block: BlockEntry): boolean {
  if (!block.expires_at) return false;
  return new Date(block.expires_at) < new Date();
}

const TYPE_COLORS = {
  ip: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400',
  email: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
};

export default function BlocklistTab({ tenantId }: { tenantId: number | string }) {
  const [blocks, setBlocks] = useState<BlockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: { type: 'ip', value: '', reason: '', expires_at: '' },
  });

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/blocks`);
      const json = await res.json();
      setBlocks(json.data || []);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handleAdd = async (values: { type: string; value: string; reason: string; expires_at: string }) => {
    setSaving(true);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/block`, {
        method: 'POST',
        body: JSON.stringify({
          type: values.type,
          value: values.value,
          reason: values.reason || null,
          expires_at: values.expires_at || null,
        }),
      });
      notify.success({ title: 'Bloqueo creado' });
      setAddOpen(false);
      reset();
      fetchBlocks();
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422 && (err.data as { errors?: Record<string, string[]> })?.errors) {
        notify.error({ title: Object.values((err.data as { errors: Record<string, string[]> }).errors).flat().join(', ') });
      } else {
        notify.error({ title: (err as Error).message || 'Error al crear el bloqueo' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (blockId: number | string) => {
    setRemovingId(blockId);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/blocks/${blockId}`, { method: 'DELETE' });
      notify.success({ title: 'Bloqueo eliminado' });
      fetchBlocks();
    } catch (err) {
      notify.error({ title: (err as Error).message || 'Error al eliminar el bloqueo' });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">
            Blocklist IP / Email ({blocks.filter((b) => !isBlockExpired(b)).length} activos)
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              reset();
              setAddOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar bloqueo
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Motivo</TableHead>
                <TableHead className="hidden md:table-cell">Bloqueado por</TableHead>
                <TableHead className="hidden lg:table-cell">Expira</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={ShieldCheck}
                      title="Sin bloqueos activos"
                      description="No hay entradas en la lista de bloqueo para este tenant."
                      compact
                    />
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((b) => {
                  const expired = isBlockExpired(b);
                  return (
                  <TableRow key={b.id} className={expired ? 'opacity-50' : ''}>
                    <TableCell>
                      <Badge variant="outline" className={TYPE_COLORS[b.type] || ''}>
                        {b.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{b.value}</TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[150px] truncate text-sm sm:table-cell">
                      {b.reason || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                      {b.blocked_by?.name || '-'}
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {expired ? (
                        <span className="text-muted-foreground">
                          Expirado · {formatDateTime(b.expires_at)}
                        </span>
                      ) : b.expires_at ? (
                        <span className="text-muted-foreground">{formatDateTime(b.expires_at)}</span>
                      ) : (
                        <span className="text-muted-foreground">Indefinido</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(b.id)}
                        disabled={removingId === b.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {removingId === b.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false);
            reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar bloqueo</DialogTitle>
            <DialogDescription>
              Bloquea una dirección IP o un email para este tenant. El bloqueo puede ser temporal o
              indefinido.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="bl-type">Tipo</Label>
              <Controller
                name="type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="bl-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ip">IP</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bl-value">
                Valor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bl-value"
                {...register('value', { required: 'El valor es obligatorio' })}
                placeholder="192.168.1.100 o usuario@dominio.com"
              />
              {errors.value && <p className="text-destructive text-xs">{errors.value.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bl-reason">Motivo</Label>
              <Input
                id="bl-reason"
                {...register('reason')}
                placeholder="Brute force detectado..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bl-expires">Expira (opcional)</Label>
              <Input id="bl-expires" type="datetime-local" {...register('expires_at')} />
              <p className="text-muted-foreground text-xs">Dejar vacío para bloqueo indefinido.</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setAddOpen(false);
                  reset();
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear bloqueo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
