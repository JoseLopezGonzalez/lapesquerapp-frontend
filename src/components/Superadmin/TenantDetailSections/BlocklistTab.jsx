"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { fetchSuperadmin, SuperadminApiError } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash2, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/utils/superadminDateUtils";
import EmptyState from "../EmptyState";

const TYPE_COLORS = {
  ip: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  email: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

export default function BlocklistTab({ tenantId }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { type: "ip", value: "", reason: "", expires_at: "" },
  });

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSuperadmin(`/tenants/${tenantId}/blocks`);
      const json = await res.json();
      setBlocks(json.data || []);
    } catch { setBlocks([]); } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const handleAdd = async (values) => {
    setSaving(true);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/block`, {
        method: "POST",
        body: JSON.stringify({
          type: values.type,
          value: values.value,
          reason: values.reason || null,
          expires_at: values.expires_at || null,
        }),
      });
      notify.success({ title: "Bloqueo creado" });
      setAddOpen(false);
      reset();
      fetchBlocks();
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422 && err.data?.errors) {
        notify.error({ title: Object.values(err.data.errors).flat().join(", ") });
      } else {
        notify.error({ title: err.message || "Error al crear el bloqueo" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (blockId) => {
    setRemovingId(blockId);
    try {
      await fetchSuperadmin(`/tenants/${tenantId}/blocks/${blockId}`, { method: "DELETE" });
      notify.success({ title: "Bloqueo eliminado" });
      fetchBlocks();
    } catch (err) {
      notify.error({ title: err.message || "Error al eliminar el bloqueo" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Blocklist IP / Email ({blocks.length})</CardTitle>
          <Button size="sm" onClick={() => { reset(); setAddOpen(true); }}>
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
                <TableHead className="text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
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
                blocks.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Badge variant="outline" className={TYPE_COLORS[b.type] || ""}>
                        {b.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{b.value}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[150px] truncate">
                      {b.reason || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {b.blocked_by?.name || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {b.expires_at ? formatDateTime(b.expires_at) : "Indefinido"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(b.id)}
                        disabled={removingId === b.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {removingId === b.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar bloqueo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="bl-type">Tipo</Label>
              <select
                id="bl-type"
                {...register("type", { required: true })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ip">IP</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bl-value">Valor <span className="text-destructive">*</span></Label>
              <Input
                id="bl-value"
                {...register("value", { required: "El valor es obligatorio" })}
                placeholder="192.168.1.100 o usuario@dominio.com"
              />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bl-reason">Motivo</Label>
              <Input
                id="bl-reason"
                {...register("reason")}
                placeholder="Brute force detectado..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bl-expires">Expira (opcional)</Label>
              <Input
                id="bl-expires"
                type="datetime-local"
                {...register("expires_at")}
              />
              <p className="text-xs text-muted-foreground">Dejar vacio para bloqueo indefinido.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setAddOpen(false); reset(); }} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear bloqueo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
